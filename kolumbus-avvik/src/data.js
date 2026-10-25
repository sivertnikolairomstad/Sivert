// Mock-data for prototypen. Holdes adskilt fra UI slik at scenarioet er lett å justere.

export const disruption = {
  line: '2',
  destination: 'Tananger',
  reason: 'teknisk feil',
  updatedAt: '07:42',
  affectedDeparture: '07:55',
  from: 'Stavanger byterminal',
}

export const originalTrip = {
  line: '2',
  from: 'Stavanger byterminal',
  platform: 'Plattform B',
  to: 'Tananger sentrum',
  depart: '07:55',
  arrive: '08:25',
  duration: '30 min',
}

export const alternativeTrip = {
  line: '3',
  from: 'Stavanger byterminal',
  platform: 'Plattform D',
  to: 'Tananger sentrum',
  depart: '08:02',
  arrive: '08:31',
  duration: '29 min',
  delayVsOriginal: '+6 min',
  walk: '2 min gange til plattform D',
  occupancy: 'God plass',
  stops: [
    { name: 'Stavanger byterminal', time: '08:02', note: 'Plattform D' },
    { name: 'Madlakrossen', time: '08:11' },
    { name: 'Sola sentrum', time: '08:19' },
    { name: 'Risavika', time: '08:26' },
    { name: 'Tananger sentrum', time: '08:31' },
  ],
}
