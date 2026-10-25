"""Bygger src/gtfs.json fra Kolumbus' GTFS-data hos Entur.

Bruk:
    curl -o kol.zip https://storage.googleapis.com/marduk-production/outbound/gtfs/rb_kol-aggregated-gtfs.zip
    python3 scripts/build-gtfs.py kol.zip

Resultatet er kompakt: holdeplasser, plattformer (med egne koordinater for veibeskrivelse), linjer og kjøremønstre med avgangstider
for én hverdag, én lørdag og én søndag. Appen bruker dette til avgangstavle, linjeliste og chat.
"""
import csv
import collections
import datetime
import io
import json
import sys
import zipfile

ZIP = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else 'src/gtfs.json'
z = zipfile.ZipFile(ZIP)


def rows(name):
    return csv.DictReader(io.TextIOWrapper(z.open(name), encoding='utf-8-sig'))


def active_services(date):
    ds = date.strftime('%Y%m%d')
    wd = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][date.weekday()]
    s = {c['service_id'] for c in rows('calendar.txt') if c[wd] == '1' and c['start_date'] <= ds <= c['end_date']}
    for c in rows('calendar_dates.txt'):
        if c['date'] == ds:
            (s.add if c['exception_type'] == '1' else s.discard)(c['service_id'])
    return s


# Representative dager: neste vanlige onsdag, lørdag og søndag
today = datetime.date.today()
def next_weekday(wd):
    return today + datetime.timedelta(days=(wd - today.weekday()) % 7)
DAYS = [active_services(next_weekday(2)), active_services(next_weekday(5)), active_services(next_weekday(6))]


def category(short, rtype):
    if rtype == '705':
        return 'natt'
    if rtype == '712':
        return 'skole'
    if rtype.startswith('10'):
        return 'bat'
    if short in ('1', '2'):
        return 'bussveien'
    if short.startswith('X'):
        return 'ekspress'
    num = int(''.join(c for c in short if c.isdigit()) or 0)
    if short in ('E90', 'H2') or 50 <= num < 100:
        return 'jaeren'
    if 100 <= num < 200:
        return 'ryfylke'
    if 200 <= num < 300:
        return 'haugaland'
    return 'by'


stops = {s['stop_id']: s for s in rows('stops.txt')}
routes = {r['route_id']: r for r in rows('routes.txt')}
trips = {t['trip_id']: t for t in rows('trips.txt')}

times = collections.defaultdict(list)
for st in rows('stop_times.txt'):
    times[st['trip_id']].append(st)


def minutes(hms):
    h, m, _ = hms.split(':')
    return int(h) * 60 + int(m)


stations, station_idx = [], {}
quays, quay_idx = [], {}


def quay(stop_id):
    if stop_id in quay_idx:
        return quay_idx[stop_id]
    q = stops[stop_id]
    parent = q['parent_station'] or stop_id
    if parent not in station_idx:
        p = stops.get(parent, q)
        station_idx[parent] = len(stations)
        stations.append([p['stop_name'], round(float(p['stop_lat']), 4), round(float(p['stop_lon']), 4)])
    quay_idx[stop_id] = len(quays)
    quays.append([station_idx[parent], q['platform_code'] or '', round(float(q['stop_lat']), 5), round(float(q['stop_lon']), 5)])
    return quay_idx[stop_id]


patterns = {}
for trip_id, st in times.items():
    t = trips[trip_id]
    days = [i for i, d in enumerate(DAYS) if t['service_id'] in d]
    if not days:
        continue
    st.sort(key=lambda s: int(s['stop_sequence']))
    qs = tuple(quay(s['stop_id']) for s in st)
    key = (t['route_id'], t['direction_id'], qs)
    start = minutes(st[0]['departure_time'])
    if key not in patterns:
        patterns[key] = {
            'o': [minutes(s['departure_time']) - start for s in st],
            'h': collections.Counter(),
            't': [[], [], []],
        }
    p = patterns[key]
    p['h'][t['trip_headsign']] += 1
    for d in days:
        p['t'][d].append(start)

route_list, route_idx = [], {}
for rid, r in sorted(routes.items(), key=lambda kv: kv[1]['route_short_name']):
    if not any(k[0] == rid for k in patterns):
        continue
    route_idx[rid] = len(route_list)
    route_list.append([r['route_short_name'], category(r['route_short_name'], r['route_type']), r['route_long_name']])

out_patterns = []
for (rid, direction, qs), p in patterns.items():
    out_patterns.append([route_idx[rid], int(direction or 0), p['h'].most_common(1)[0][0], list(qs), p['o'], [sorted(x) for x in p['t']]])

json.dump({'stations': stations, 'quays': quays, 'routes': route_list, 'patterns': out_patterns}, open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
print(f'{len(route_list)} linjer, {len(stations)} holdeplasser, {len(out_patterns)} kjøremønstre -> {OUT}')
