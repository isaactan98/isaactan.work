<script setup lang="ts">
// Hand-written landing page. Deliberately independent of Nuxt Content —
// it must win the route match against `[...slug].vue`.
definePageMeta({ layout: 'site' })

usePageSeo({
  title: 'Isaac Tan — Full-stack engineer',
  description:
    'Full-stack engineer in Singapore, commuting from Johor Bahru. Enterprise systems by day; a self-hosted home server by night.',
  path: '/'
})

type Row = {
  year: string
  role: string
  org: string
  place: 'SG' | 'MY'
  current?: boolean
}

// The CV is the spine of this page. Years are the real ordinals — no invented
// 01/02/03 numbering.
const experience: Row[] = [
  {
    year: '2023 —',
    role: 'Software Engineer',
    org: 'Enterprise Tech Company',
    place: 'SG',
    current: true
  },
  { year: '2022', role: 'BSc Computer Science, Software Engineering', org: 'UTM', place: 'MY' },
  { year: '2022', role: 'Intern, Web Development', org: 'Webby Group', place: 'MY' },
  { year: '2019', role: 'Intern, Software Development', org: 'ABS Software', place: 'MY' },
  { year: '2018', role: 'Diploma in Computer Science', org: 'UTM', place: 'MY' }
]

// Star counts are from the GitHub API on 2026-09-10.
const repoCount = 14

/**
 * Selected work sits above the CV on purpose: a reader asking "can this person
 * build" gets the artifacts before the employment history, which — with the
 * employer unnamed — is the half of the page that can actually be checked.
 *
 * Every row must resolve somewhere. `dest` names what the reader lands on so
 * the click is never a surprise; a row with no destination does not belong on
 * this page.
 *
 * There is deliberately no separate "Stack" section any more. A technology
 * only appears here, attached to the row that actually proves it — `tech` is
 * a list precisely so each entry can be its own link via TechList, not one
 * more unverifiable line in a skills list. This does mean PostgreSQL and
 * FastAPI are gone from the page entirely: neither has a project here that
 * proves it, and a bare word with nothing behind it is exactly what this
 * redesign exists to remove.
 */
type Work = { name: string; note: string; tech: string[]; meta?: string; dest: string; href: string }

const work: Work[] = [
  {
    name: 'Expense Tracker',
    note: 'Dual-currency SGD/MYR PWA, offline-first, self-hosted',
    tech: ['Nuxt', 'Express', 'SQLite'],
    // Self-hosted, so there is no public URL to give yet. The case study is a
    // real destination in the meantime — problem, build, stack and outcome.
    // TODO(deploy): swap for the tunnel URL once the box is exposed.
    dest: 'Case study',
    href: '/work#expense'
  },
  {
    name: 'Nuxt Video Chat',
    note: 'Peer-to-peer video from ICE and SDP up — no video SDK',
    tech: ['Socket.io', 'WebRTC'],
    meta: '7★',
    dest: 'GitHub',
    href: 'https://github.com/isaactan98/nuxt_video_chat_app'
  },
  {
    name: 'Shadow Anime',
    note: 'Streaming front end over a public anime API',
    tech: ['Nuxt', 'TypeScript'],
    meta: '6★',
    // Deliberately points at the repository, not a demo: the deployed instance
    // depends on a third-party API that no longer serves it. A dead demo is
    // worse than no demo, and the code is still the thing worth reading.
    dest: 'GitHub',
    href: 'https://github.com/isaactan98/shadow-anime'
  }
]

const isExternal = (href: string) => href.startsWith('http')

/**
 * The pattern behind the side projects, named rather than left for a reader
 * to notice on their own: most of them exist because something about the
 * daily JB↔SG grind didn't work. This is the site's "personality" content —
 * not invented biography, just the existing pattern in what he chose to
 * build, made explicit. Rendered inline in the hero lede, not a new section.
 *
 * `after` (below) is the separator text following each link in the sentence —
 * computed here rather than in the template so the markup doesn't have to
 * juggle whitespace-sensitive conditionals between adjacent inline elements.
 */
const throughlineRaw: { name: string; href: string }[] = [
  { name: 'car-import-calculator', href: 'https://github.com/isaactan98/car-import-calculator' },
  { name: 'LunchSpin', href: 'https://github.com/isaactan98/LunchSpin' },
  { name: 'ws-opener', href: 'https://github.com/isaactan98/ws-opener' },
  { name: 'the expense tracker', href: '/work#expense' }
]

const throughline = throughlineRaw.map((t, i) => ({
  ...t,
  after:
    i === throughlineRaw.length - 1 ? '.' : i === throughlineRaw.length - 2 ? ' and ' : ', '
}))

/**
 * Counts for the two writing sections, read at request time so the landing page
 * cannot claim a number the indexes disagree with. Drafts are excluded here for
 * the same reason they are excluded there.
 */
const { data: writingCounts } = await useAsyncData('writing:counts', async () => {
  const count = (section: string) =>
    queryCollection('content')
      .where('path', 'LIKE', `/${section}/%`)
      .where('draft', '=', false)
      .count()
  const [jb, sg] = await Promise.all([count('jb'), count('sg')])
  return { jb, sg }
})

const writing = computed(() => [
  {
    name: 'Johor Bahru',
    note: 'Travel, the homelab, and the side of the border I sleep on',
    href: '/jb',
    n: writingCounts.value?.jb ?? 0
  },
  {
    name: 'Singapore',
    note: 'Engineering, career, and what the commute teaches you',
    href: '/sg',
    n: writingCounts.value?.sg ?? 0
  }
])

</script>

<template>
  <main class="page-column pb-24">
      <!-- Hero -->
      <!-- The one section PRODUCT.md's 2026-09-11 entry exempts from the
           restraint principle everything else on this page follows. Text
           first in DOM order on purpose: a mobile reader gets the real
           content immediately, the showcase is the second thing they scroll
           to, not a gate in front of the first. -->
      <section class="hero-grid">
        <div class="reveal" style="--d: 0ms">
          <h1 class="hero">Three years of internal tools. Every layer, down to the server.</h1>
          <p class="lede">
            Full-stack engineer in Singapore, commuting from Johor Bahru. Enterprise
            systems by day; by night, a home server running the tools I actually use
            &mdash; architecture, build, deploy and maintenance, all mine. Most of what
            follows exists because commuting, spending or deciding where to eat across
            a border got annoying enough to fix &mdash;
            <span v-for="t in throughline" :key="t.href">
              <NuxtLink
                :to="t.href"
                :target="isExternal(t.href) ? '_blank' : undefined"
                :rel="isExternal(t.href) ? 'noopener' : undefined"
                class="lede-link"
              >{{ t.name }}</NuxtLink>{{ t.after }}</span>
          </p>
        </div>
        <div class="hero-showcase-slot reveal" style="--d: 60ms">
          <HeroShowcase />
        </div>
      </section>

      <section class="reveal mt-9" style="--d: 90ms">
        <!-- `planned` dropped on the day this page started being served from the
             box it draws. The site node is solid now because it is true. -->
        <HomelabDiagram />
      </section>

      <!-- Selected work -->
      <!-- Above the CV: the artifacts are the checkable half of this page. -->
      <section id="work" class="section section--first section--reveal" style="--s: 2">
        <div class="section-head">
          <h2 class="section-label">Selected work</h2>
          <NuxtLink to="/work" class="section-more">
            All {{ repoCount }} repositories <span aria-hidden="true">&rarr;</span>
          </NuxtLink>
        </div>
        <p class="section-note">
          Listed first because, with no employer named above, these are the half of
          this page you can actually check.
        </p>
        <ul class="rows">
          <li v-for="(row, i) in work" :key="row.name" :style="{ '--i': i }">
            <!-- Not one row-covering link any more: an <a> can't contain another
                 <a>, and the tech cell now needs its own per-token links. Title
                 and dest each link independently; TechList owns the tech cell. -->
            <div class="row row--work">
              <NuxtLink
                :to="row.href"
                :target="isExternal(row.href) ? '_blank' : undefined"
                :rel="isExternal(row.href) ? 'noopener' : undefined"
                class="cell-title"
              >{{ row.name }}</NuxtLink>
              <span class="cell-note">{{ row.note }}</span>
              <span class="cell-tech">
                <TechList :items="row.tech" :href="row.href" />
                <span v-if="row.meta" class="cell-meta">{{ row.meta }}</span>
              </span>
              <NuxtLink
                :to="row.href"
                :target="isExternal(row.href) ? '_blank' : undefined"
                :rel="isExternal(row.href) ? 'noopener' : undefined"
                class="cell-dest"
              >
                {{ row.dest }}
                <span class="cell-arrow" aria-hidden="true">{{ isExternal(row.href) ? '↗' : '→' }}</span>
              </NuxtLink>
            </div>
          </li>
        </ul>
      </section>

      <!-- Experience -->
      <section id="experience" class="section section--reveal" style="--s: 3">
        <h2 class="section-label">Experience</h2>
        <ul class="rows">
          <li
            v-for="(row, i) in experience"
            :key="row.year + row.org"
            class="row row--cv"
            :style="{ '--i': i }"
          >
            <span class="cell-year" :class="{ 'cell-year--current': row.current }">{{ row.year }}</span>
            <span class="cell-title">{{ row.role }}</span>
            <span class="cell-note">{{ row.org }}</span>
            <span class="cell-place">
              {{ row.place }}
              <span v-if="row.current" class="status-dot status-dot--inline" aria-hidden="true" />
              <span v-if="row.current" class="sr-only">Current role</span>
            </span>
          </li>
        </ul>
      </section>

      <!-- Writing -->
      <!-- Only rendered once something is published: an empty section reads as
           abandoned, which is worse than not mentioning it at all. -->
      <section
        v-if="writing.some((w) => w.n > 0)"
        id="writing"
        class="section section--reveal"
        style="--s: 4"
      >
        <h2 class="section-label">Writing</h2>
        <ul class="rows">
          <li v-for="(row, i) in writing.filter((w) => w.n > 0)" :key="row.href" :style="{ '--i': i }">
            <NuxtLink :to="row.href" class="row row--link">
              <span class="cell-title">{{ row.name }}</span>
              <span class="cell-note">{{ row.note }}</span>
              <span class="cell-tech">{{ row.n }} {{ row.n === 1 ? 'entry' : 'entries' }}</span>
              <span class="cell-dest">
                Read
                <span class="cell-arrow" aria-hidden="true">→</span>
              </span>
            </NuxtLink>
          </li>
        </ul>
      </section>

      <!-- Contact -->
      <section id="contact" class="section section--reveal" style="--s: 5">
        <h2 class="section-label">Contact</h2>
        <div class="contact-line flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-t border-line pt-4">
          <a
            href="mailto:hello@isaactan.work"
            class="text-[1.0625rem] underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink"
          >
            hello@isaactan.work
          </a>
          <span class="flex gap-5 font-mono text-[0.75rem] uppercase tracking-[0.08em] text-ink-muted">
            <a href="https://github.com/isaactan98" target="_blank" rel="noopener" class="nav-link">GitHub</a>
            <a href="https://linkedin.com/in/isaactan98" target="_blank" rel="noopener" class="nav-link">LinkedIn</a>
          </span>
        </div>
      </section>
  </main>
</template>

<style scoped>
/* ---- Hero ----------------------------------------------------------- */
/* Plex Mono on paper reads "technical document", not "terminal". The
   headline is the only place it runs this large. */

/* Text first in source order (see the template comment); on wide screens the
   showcase sits beside it instead of below, so the two read as one hero
   rather than a headline with an illustration bolted underneath. */
.hero-grid {
  padding-top: 3rem;
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  gap: 2.5rem;
}

@media (min-width: 640px) {
  .hero-grid {
    padding-top: 4rem;
  }
}

@media (min-width: 900px) {
  .hero-grid {
    /* ~40/60 — the text stays the wider-feeling element even though the
       showcase occupies more area, because it comes first and reads first. */
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    gap: 2rem;
  }
}

.hero-showcase-slot {
  max-width: 26rem;
  margin-inline: auto;
}

@media (min-width: 900px) {
  .hero-showcase-slot {
    max-width: none;
    margin-inline: 0;
  }
}

.hero {
  font-family: theme('fontFamily.mono');
  font-size: clamp(1.375rem, 3.2vw, 2.25rem);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.02em;
  text-wrap: balance;
  max-width: 28ch;
}

.lede {
  margin-top: 1.125rem;
  /* Widened from 52ch: the throughline sentence added real length, and a
     narrower measure was wrapping it into an unreadably tall paragraph. */
  max-width: 58ch;
  font-size: 1.0625rem;
  line-height: 1.65;
  color: theme('colors.ink-muted');
}

/* The throughline links in the lede: same subtle-underline language as
   TechList, since these are the same kind of thing — a claim with a project
   behind it, not decoration. */
.lede-link {
  color: theme('colors.ink');
  text-decoration: underline;
  text-decoration-color: theme('colors.line-strong');
  text-underline-offset: 2px;
  transition: text-decoration-color 150ms ease;
}

.lede-link:hover {
  text-decoration-color: theme('colors.ink-muted');
}

/* ---- Sections ------------------------------------------------------- */

.section {
  margin-top: 4.5rem;
  scroll-margin-top: 2rem;
}

/* The diagram's log panel is a fixed height and usually empty, so it already
   ends in whitespace. A full section gap on top of that reads as a hole. */
.section--first {
  margin-top: 2.75rem;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.section-more {
  font-family: theme('fontFamily.mono');
  font-size: 0.6875rem;
  letter-spacing: 0.06em;
  color: theme('colors.ink-muted');
  margin-bottom: 0.75rem;
  transition: color 150ms ease;
}

.section-more:hover {
  color: theme('colors.ink');
}

.section-label {
  font-family: theme('fontFamily.mono');
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: theme('colors.ink-faint');
  margin-bottom: 0.75rem;
}

/* The page's first piece of "how I think" content that isn't buried in a
   source comment — sits between the label and the rows it explains. */
.section-note {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: theme('colors.ink-muted');
  max-width: 48ch;
  margin: -0.25rem 0 1rem;
}

/* ---- The listing --------------------------------------------------- */
/* Experience, work and writing all share one grid, so the page reads as a
   single continuous listing rather than stacked, unrelated sections. */

.rows {
  border-top: 1px solid theme('colors.line');
}

.row {
  display: grid;
  grid-template-columns: 5.5rem minmax(0, 1fr) minmax(0, 0.85fr) 3rem;
  align-items: baseline;
  gap: 0 1.25rem;
  padding: 0.8125rem 0;
  border-bottom: 1px solid theme('colors.line');
}

.row--link {
  /* The tech cell carries the actual evidence, so it gets enough room to read
     in full — an ellipsed stack line proves nothing. */
  grid-template-columns: minmax(0, 0.72fr) minmax(0, 1.05fr) minmax(0, 0.78fr) auto;
  transition: background-color 150ms ease;
  margin-inline: -0.75rem;
  padding-inline: 0.75rem;
}

.row--link:hover {
  background-color: #f4f4f2;
}

/* Selected work: same shape as .row--link, but the row itself is a <div>, not
   an anchor — title, tech tokens and dest are each their own link now, so a
   full-row background tint would claim the whole row is one click target
   when it isn't. Hover lives on the individual links instead. */
.row--work {
  grid-template-columns: minmax(0, 0.72fr) minmax(0, 1.05fr) minmax(0, 0.78fr) auto;
}

.row--work .cell-title {
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 2px;
  transition: text-decoration-color 150ms ease;
}

.row--work .cell-title:hover {
  text-decoration-color: theme('colors.line-strong');
}

.cell-meta {
  margin-left: 0.5em;
  color: theme('colors.ink-faint');
}

.cell-meta::before {
  content: '·';
  margin-right: 0.5em;
}

.cell-year {
  font-family: theme('fontFamily.mono');
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  color: theme('colors.ink-muted');
  white-space: nowrap;
}

.cell-year--current {
  color: theme('colors.ink');
}

.cell-title {
  font-size: 0.9375rem;
  font-weight: 500;
}

.cell-note {
  font-size: 0.875rem;
  color: theme('colors.ink-muted');
}

.cell-tech {
  font-family: theme('fontFamily.mono');
  font-size: 0.75rem;
  color: theme('colors.ink-faint');
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-place {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.4rem;
  font-family: theme('fontFamily.mono');
  font-size: 0.75rem;
  color: theme('colors.ink-faint');
}

/* Every work row names where it lands, so the click is never a surprise. */
.cell-dest {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 0.4rem;
  font-family: theme('fontFamily.mono');
  font-size: 0.6875rem;
  letter-spacing: 0.04em;
  color: theme('colors.ink-faint');
  white-space: nowrap;
  transition: color 150ms ease;
}

.row--link:hover .cell-dest {
  color: theme('colors.ink');
}

/* .cell-dest is its own NuxtLink inside .row--work, so it hovers on itself
   rather than waiting for a row-level hover that no longer exists there. */
.cell-dest:hover {
  color: theme('colors.ink');
}

.cell-arrow {
  justify-self: end;
  color: theme('colors.ink-faint');
  transition: transform 150ms ease, color 150ms ease;
}

.row--link:hover .cell-arrow,
.cell-dest:hover .cell-arrow {
  transform: translate(2px, 0);
  color: theme('colors.ink');
}

/* ---- Status dot ----------------------------------------------------- */
/* The only chromatic accent on the page, and it means something: this row
   is still running. */

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background-color: theme('colors.signal');
}

.status-dot--inline {
  transform: translateY(-1px);
}

/* ---- Links ---------------------------------------------------------- */

.nav-link {
  transition: color 150ms ease;
}

.nav-link:hover {
  color: theme('colors.ink');
}

/* ---- Load-in -------------------------------------------------------- */

.reveal {
  animation: reveal 620ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: var(--d, 0ms);
}

@keyframes reveal {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* ---- Narrow screens -------------------------------------------------- */

@media (max-width: 640px) {
  .row,
  .row--link,
  .row--work {
    grid-template-columns: 1fr auto;
    gap: 0.15rem 1rem;
  }
  .cell-year {
    grid-column: 1;
    order: -1;
  }
  .cell-place {
    grid-column: 2;
    grid-row: 1;
    order: -1;
  }
  .cell-title {
    grid-column: 1 / -1;
  }
  .cell-note {
    grid-column: 1 / -1;
  }
  .cell-tech {
    grid-column: 1 / -1;
    margin-top: 0.25rem;
  }
  /* On a work row the destination takes the top-right slot the CV gives to
     place, so the row still declares where it goes without the arrow drift. */
  .row--link .cell-title,
  .row--work .cell-title {
    grid-column: 1;
  }
  .cell-dest {
    grid-column: 2;
    grid-row: 1;
  }
  .cell-arrow {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .reveal {
    animation: none;
  }
  .cell-arrow,
  .cell-dest,
  .row--link,
  .row--work .cell-title,
  .lede-link,
  .nav-link {
    transition: none;
  }
}
</style>
