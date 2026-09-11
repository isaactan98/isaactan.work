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
walls, no typewriter-effect taglines, no parallax hero. Restraint cuts both
ways.

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
4. **Restraint is not anonymity.** Personality is added through voice,
   framing, and interaction (what a reader can click or poke at), never
   through decoration, motion for its own sake, or breaking the one-accent
   rule. If adding personality requires a second brand color, it's the wrong
   kind of personality for this page.
5. **Depth is layered, not forked.** The main page has to satisfy a
   30-second skim and reward a 5-minute read from the same content — deeper
   material expands in place or links onward (case studies, `/work`,
   `/freelance`), it doesn't require guessing which of three separate pages
   to land on.

## Accessibility & Inclusion

WCAG AA as the working baseline (no explicit higher requirement stated).
Reduced motion is already handled comprehensively across the codebase — every
animation has a `prefers-reduced-motion: reduce` fallback via CSS, deliberately
not IntersectionObserver-gated (documented rationale: a backgrounded tab
throttles observer callbacks and timers, which can leave content permanently
invisible). Any new interactive or skills-showcase element must carry the same
guarantee: fully readable and navigable with motion off, keyboard-operable,
and never gated behind a JS callback that can silently fail to fire.
