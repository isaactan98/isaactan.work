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

const stack: { label: string; items: string }[] = [
  { label: 'Frontend', items: 'Nuxt · Vue · TypeScript · Tailwind CSS' },
  { label: 'Backend', items: 'FastAPI · Express · Node.js' },
  { label: 'Data', items: 'PostgreSQL · SQLite' },
  { label: 'Infra', items: 'Docker Compose · Cloudflare Tunnel · Tailscale · CasaOS' }
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
 */
type Work = { name: string; note: string; tech: string; dest: string; href: string }

const work: Work[] = [
  {
    name: 'Expense Tracker',
    note: 'Dual-currency SGD/MYR PWA, offline-first, self-hosted',
    tech: 'Nuxt · Express · SQLite',
    // Self-hosted, so there is no public URL to give yet. The case study is a
    // real destination in the meantime — problem, build, stack and outcome.
    // TODO(deploy): swap for the tunnel URL once the box is exposed.
    dest: 'Case study',
    href: '/work#expense'
  },
  {
    name: 'Nuxt Video Chat',
    note: 'Peer-to-peer video from ICE and SDP up — no video SDK',
    tech: 'Socket.io · WebRTC · 7★',
    dest: 'GitHub',
    href: 'https://github.com/isaactan98/nuxt_video_chat_app'
  },
  {
    name: 'Shadow Anime',
    note: 'Streaming front end over a public anime API',
    tech: 'Nuxt 3 · TypeScript · 6★',
    // Deliberately points at the repository, not a demo: the deployed instance
    // depends on a third-party API that no longer serves it. A dead demo is
    // worse than no demo, and the code is still the thing worth reading.
    dest: 'GitHub',
    href: 'https://github.com/isaactan98/shadow-anime'
  }
]

const isExternal = (href: string) => href.startsWith('http')

</script>

<template>
  <main class="page-column pb-24">
      <!-- Hero -->
      <section class="reveal pt-12 sm:pt-16" style="--d: 0ms">
        <h1 class="hero">Three years of internal tools. Every layer, down to the server.</h1>
        <p class="lede">
          Full-stack engineer in Singapore, commuting from Johor Bahru. Enterprise
          systems by day; by night, a home server running the tools I actually use
          &mdash; architecture, build, deploy and maintenance, all mine.
        </p>
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
        <ul class="rows">
          <li v-for="(row, i) in work" :key="row.name" :style="{ '--i': i }">
            <!-- NuxtLink resolves external hrefs to a plain anchor itself, so one
                 element covers both the case study and the GitHub rows. -->
            <NuxtLink
              :to="row.href"
              :target="isExternal(row.href) ? '_blank' : undefined"
              :rel="isExternal(row.href) ? 'noopener' : undefined"
              class="row row--link"
            >
              <span class="cell-title">{{ row.name }}</span>
              <span class="cell-note">{{ row.note }}</span>
              <span class="cell-tech">{{ row.tech }}</span>
              <span class="cell-dest">
                {{ row.dest }}
                <span class="cell-arrow" aria-hidden="true">{{ isExternal(row.href) ? '↗' : '→' }}</span>
              </span>
            </NuxtLink>
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

      <!-- Stack -->
      <section id="stack" class="section section--reveal" style="--s: 4">
        <h2 class="section-label">Stack</h2>
        <ul class="rows">
          <li v-for="(row, i) in stack" :key="row.label" class="row row--stack" :style="{ '--i': i }">
            <span class="cell-year">{{ row.label }}</span>
            <span class="cell-title font-normal">{{ row.items }}</span>
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
  max-width: 52ch;
  font-size: 1.0625rem;
  line-height: 1.65;
  color: theme('colors.ink-muted');
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

/* ---- The listing --------------------------------------------------- */
/* Experience, stack, work and writing all share one grid, so the page
   reads as a single continuous listing rather than four stacked sections. */

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

.row--stack {
  grid-template-columns: 5.5rem minmax(0, 1fr);
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

.cell-arrow {
  justify-self: end;
  color: theme('colors.ink-faint');
  transition: transform 150ms ease, color 150ms ease;
}

.row--link:hover .cell-arrow {
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
  .row--link {
    grid-template-columns: 1fr auto;
    gap: 0.15rem 1rem;
  }
  .row--stack {
    grid-template-columns: 1fr;
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
  .row--link .cell-title {
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
  .nav-link {
    transition: none;
  }
}
</style>
