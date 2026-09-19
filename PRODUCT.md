# Product

## Register

brand

## Users

Three readers, one page, no forking into separate homepages:

- **Recruiters / hiring managers** (Singapore, some Malaysia) — skim in ~30
  seconds, mobile-heavy via WhatsApp/LinkedIn shares, deciding whether to reply.
- **Freelance / contract clients** — evaluating whether to hand over real work;
  `/freelance` carries the pitch, but the main page is often the first stop.
- **Technical peers** — other engineers, people who'd actually read the code or
  poke at the homelab diagram. The most skeptical reader, and the one who
  notices when a claim has no evidence behind it.

Shared context across all three: the current employer is deliberately
anonymous, so nothing about "years of experience" can be taken on faith.
Every claim on the page needs to be checkable — a link, a demo, a diagram that
answers back — or it doesn't survive.

## Product Purpose

Personal portfolio for Isaac Tan, full-stack engineer commuting JB → SG.
The page's job is to turn a skim into "worth a reply," for a hiring manager,
a client, or a peer, without knowing in advance which one showed up.

Success looks like: a reader forms an accurate, specific impression of what
Isaac can build and how he thinks, in less time than it takes to read a CV,
and leaves with something they can click, run, or verify rather than take on
faith.

## Brand Personality

**Precise. Restrained. Evidence-first.**

Voice is dry and technical, not salesy — closer to a well-commented README
than a landing page ("Plex Mono on paper reads 'technical document,' not
'terminal'" is the site's own stated design rationale, and it should keep
being true). Confidence comes from showing work, not from adjectives.
Personality shows up in specificity and small honest admissions (the homelab
diagram already does this — "not here yet" instead of faking a live demo),
not in jokes or flourish.

## Anti-references

Explicitly not a templated agency/SaaS portfolio: no bento grids, no
hero-metric stat blocks ("50+ projects delivered"), no glassmorphism, no
testimonial carousels, no gradient-text headlines, no big rounded cards with
icon-heading-paragraph repeated four times. If a layout choice could be
swapped onto any other developer's name with zero changes, it's wrong for
this page.

Also not the opposite failure mode: no GitHub-heatmap flexing, no badge
walls, no typewriter-effect taglines. Restraint cuts both ways — with one
named exception below.

**2026-09-11 — the hero, and only the hero, is exempted from restraint.**
Isaac explicitly asked for a 3D/GSAP hero after being told plainly that it
contradicts this document's own anti-references (a "3D parallax hero" was
named outright) and Design Principle 4 below, and after a cheaper,
in-register alternative was offered and turned down. He chose visual impact
on load over consistency with the rest of this file, in full knowledge of
the tradeoff. That decision stands as of this date; overturning it back to
"no exception" would be a second explicit decision, not a default this
document reverts to on its own. This entry exists so nobody — including a
future editor of this file — mistakes the exception for an oversight.

The hero is still built to fit everything else here as much as a decorative
3D scene can: same palette (ink/canvas/signal, no second brand color), a
line-art/technical-blueprint treatment rather than an attempt at
photorealism (which unlicensed procedural geometry can't deliver well
anyway), and it degrades to a static equivalent under reduced motion, no
WebGL, or a narrow viewport rather than demanding the exception be paid for
everywhere. Everything below the hero — Selected Work, Experience, Writing,
Contact — stays exactly as restrained as principles 1-5 describe. The
exception is scoped to one section, not a license to decorate the page.

**2026-09-19 — the hero exception now includes phones.** The entry above
lists "a narrow viewport" as one of the conditions the 3D treatment degrades
under. That clause is superseded: every viewport that can run WebGL gets the
scene, and the fallbacks are now reduced motion, no WebGL, an explicit
saved-data or 2G connection, and a lost GPU context. This is the second
explicit decision the entry above says would be required, taken with the
tradeoff stated below rather than as a drift.

What changed was a measurement, not a preference. The width gate was
justified partly on the scene needing room a phone couldn't give it, and that
turned out to be false: the showcase slot is ~385px wide on a >=900px
viewport and 416px on a tablet, against 327-392px on a phone. Desktop was
never getting the space the gate implied it was protecting, so the
composition argument for excluding phones did not survive being checked. The
gate's real cost was ~171KB gzipped and a render loop that never stopped, and
both are now addressed on their own terms — the scene pauses when it is
scrolled off screen, drops resolution and multisampling on genuinely weak
hardware, and is skipped outright for anyone whose browser says they are
saving data.

What has *not* changed: the exception is still scoped to the hero, still
required to degrade to HeroLineArt rather than to nothing, and still costs
nothing for a reader who won't see it move. Phones pay 171KB for decoration
now where they previously paid zero. That is a real cost and it was accepted
knowingly, on the same basis as the original decision — visual impact over
restraint, for one section. Reverting it means restoring the width condition
in HeroShowcase.vue's `matchMedia` call and its paired media query, and would
be a third explicit decision, not a default this document returns to.

## Design Principles

1. **Evidence over assertion.** Every claim about a skill or a project is a
   link, a demo, a diagram, or a number that can be checked — never a bare
   adjective. This is already load-bearing on the site (the homelab diagram's
   `planned` prop honesty constraint); the redesign extends it to the skills
   section specifically, which currently is not clickable.
2. **Show the thinking, not just the output.** Surface the reasoning behind a
   choice, not just the artifact ("why SQLite, not Postgres, for this
   workload" is the kind of line that answers a peer's actual question).
   This is the biggest gap in the current page.
3. **One structural vocabulary, many entries.** The site's existing grid/row
   listing pattern (used identically across Experience, Stack, Selected Work)
   is a real asset, not a limitation to escape. Restructure what content goes
   where and how it's framed; don't introduce a second, incompatible visual
   language (e.g. a card grid) to solve this.
4. **Restraint is not anonymity — outside the hero.** Personality is added
   through voice, framing, and interaction, never through decoration or a
   second brand color, for every section this document governs except the
   one named exception above. The exception doesn't loosen this principle
   for anything else; if a future change wants to decorate a second section,
   that's a new explicit decision to make and log here, not an inference
   from this one.
5. **Depth is layered, not forked.** The main page has to satisfy a
   30-second skim and reward a 5-minute read from the same content — deeper
   material expands in place or links onward (case studies, `/work`,
   `/freelance`), it doesn't require guessing which of three separate pages
   to land on. The hero's entrance plays once and gets out of the way; it
   does not cost a mobile skimmer any real time before the actual content —
   see Accessibility & Inclusion below for how that's enforced, not just
   asserted.

## Accessibility & Inclusion

WCAG AA as the working baseline (no explicit higher requirement stated).
Reduced motion is already handled comprehensively across the codebase — every
animation has a `prefers-reduced-motion: reduce` fallback via CSS, deliberately
not IntersectionObserver-gated (documented rationale: a backgrounded tab
throttles observer callbacks and timers, which can leave content permanently
invisible). Any new interactive or skills-showcase element must carry the same
guarantee: fully readable and navigable with motion off, keyboard-operable,
and never gated behind a JS callback that can silently fail to fire.

The 3D hero is exempt from Design Principle 4, not from this section. It
must still: render a static line-art equivalent (no WebGL context created at
all) under `prefers-reduced-motion: reduce`, under WebGL feature-detection
failure, and below a narrow-viewport threshold, so the users this document
says matter most (mobile recruiters skimming in 30 seconds) never pay a
network or parse cost for an effect they won't see animate; be `aria-hidden`
so it adds nothing to a screen reader's pass over the page; and never delay
or gate the real h1/lede text, which must be present and readable
regardless of whether the 3D scene loads, fails, or is skipped.
