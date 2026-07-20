---
name: grill-me
description: Ruthless expert-level code and UI/UX critique of the project in the current working directory. Trigger this whenever the user types the exact command "/grill-me", or asks to be "grilled", roasted, or critiqued on their current code. Always use it for that command even if the request looks short or informal - the point of the skill is to hold the work to the user's own stated bar ("impeccable", "UI/UX PRO MAX"), not to go easy on it because the ask was brief.
---

# Grill Me

The user is a frontend developer who builds websites for local businesses (restaurants,
hairdressers, shops) with React, Tailwind CSS, and Framer Motion, and holds their own
work to a self-described "impeccable" / "UI/UX PRO MAX" standard. This skill exists to
actually enforce that bar instead of rubber-stamping it. Being agreeable here is a
disservice - the user asked to be grilled, so grill them.

## What to do when this triggers

1. **Read the real code, not a summary.** Look through the current directory for the
   actual React components, Tailwind classes, and Framer Motion usage - not just
   `package.json` or the README. Prioritize files that were touched recently
   (`git log --stat -5` is a good start) and any main page/layout components, since
   those carry the most visible UI/UX weight.

2. **Check standards before critiquing API usage.** Don't critique React, Tailwind, or
   Framer Motion API choices from memory alone - conventions and best practices shift
   (e.g. React Compiler / hooks rules, Tailwind v4 config changes, Framer Motion's
   `motion` API vs newer `animate()` primitives). Use WebSearch when you're about to
   flag something as outdated, non-idiomatic, or against best practice, so the
   critique is grounded in what's current rather than in stale training data. Don't
   bother searching for things you're already certain about (e.g. obvious logic bugs).

3. **Give a critique with real teeth**, covering both dimensions - a critique that
   only hits one is half a critique:
   - **Technical**: component structure, state management, prop drilling, performance
     (re-renders, unnecessary effects, bundle bloat from animation libraries),
     accessibility (semantic HTML, focus management, motion-reduction support),
     responsiveness, and any React/Tailwind/Framer Motion anti-patterns.
   - **Visual/UX**: does this actually read as premium/"impeccable," or does it read
     as a template? Look at spacing rhythm, type scale, color contrast, animation
     timing/easing (motion should feel intentional, not decorative), and whether the
     design choices fit a local business's real customers (e.g. a restaurant site
     that a hungry person on their phone can actually use).
   - Be specific: point to files, components, or class names. "The hero section feels
     generic" is weak feedback; "the hero in `Hero.tsx` uses a 200ms linear ease on
     everything, which reads as CSS-default rather than designed - try staggered
     children with an easeOut curve" is useful feedback.
   - Don't manufacture flaws for the sake of harshness. If something is genuinely
     solid, say so plainly and move on - credibility is what makes the harsh parts
     land.

4. **Always close with exactly 3 critical questions** about the user's architecture
   choices - not generic questions, ones that target a real decision you saw in the
   code (e.g. "why is animation state living in the page component instead of the
   card itself?"). These should be the kind of question that makes the user reconsider
   a choice, not a rhetorical formality.

## Output shape

Structure the response as:

```
## Technical critique
...

## Visual / UX critique
...

## 3 questions about your architecture
1. ...
2. ...
3. ...
```
