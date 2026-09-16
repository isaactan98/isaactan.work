<script setup lang="ts">
definePageMeta({ layout: 'site' })

usePageSeo({
  title: 'Work — Isaac Tan',
  description:
    'Three case studies and fourteen repositories — self-hosted tools, real-time systems and web apps.',
  path: '/work'
})

/**
 * Case-study copy is Isaac's own, carried over from isaactan.vercel.app.
 * Repository descriptions, languages and star counts are the real values from
 * the GitHub API, read on 2026-09-10.
 *
 * TODO(isaac): the `result` bullets are the weakest lines on the site. With the
 * employer unnamed on `/`, these are the only load-bearing evidence a reader
 * can weigh, and "a daily driver, used every day" is an assertion, not a
 * result. Replace each with something falsifiable — months in continuous use,
 * transactions recorded, uptime, one production bug and the commit that fixed
 * it, and why SQLite rather than Postgres for this workload. That last one is
 * the "can you explain your own architecture" test in a single line, and it is
 * the question an interviewer will actually ask.
 */
type Case = {
  id: string
  name: string
  kind: string
  year: string
  summary: string
  problem: string
  built: string
  stack: string
  result: string[]
  links: { label: string; href: string }[]
}

const cases: Case[] = [
  {
    id: 'expense',
    name: 'Expense Tracker',
    kind: 'Self-hosted',
    year: '2025',
    summary: 'Dual-currency PWA for the Singapore–Johor Bahru commute, running on my own hardware.',
    problem:
      'Living and commuting between Singapore and Johor Bahru means dealing with SGD and MYR daily. Existing expense apps either lack real dual-currency support, lock data in the cloud, or are overly complex for everyday personal use.',
    built:
      'A self-hosted Progressive Web App for personal expense tracking. Supports SGD/MYR with live conversion, works offline as a PWA, and runs entirely on a home server via Docker Compose and Cloudflare Tunnel — no third-party cloud dependency.',
    stack:
      'Nuxt 3 configured as a PWA with offline caching · Express REST API for transactions and categories · SQLite for file-based persistence · Docker Compose · Cloudflare Tunnel for remote access without opening ports',
    result: [
      'A daily driver, used every day',
      'Complete data ownership — nothing in a third-party cloud',
      'Full lifecycle: architecture, build, deploy and maintain'
    ],
    links: []
  },
  {
    id: 'webrtc',
    name: 'Nuxt Video Chat',
    kind: 'Real-time',
    year: '2023',
    summary: 'Peer-to-peer video built to understand WebRTC at the protocol level, not to ship fast.',
    problem:
      'Most video chat tutorials rely on third-party SDKs — Daily.co, Twilio, Agora — which abstract away the hard parts. I wanted to understand WebRTC at a protocol level by building a working implementation from scratch.',
    built:
      'A peer-to-peer video chat application using WebRTC for media streaming and Socket.io for signalling. Nuxt handles the frontend; an Express backend runs the signalling server. ICE, SDP and peer connections are handled directly.',
    stack:
      'Nuxt frontend for UI and room management · Express and Socket.io for signalling (offer/answer exchange, ICE candidate relay) · browser WebRTC API for peer connections and media streams · Node.js',
    result: [
      'Working multi-user video sessions',
      'Signalling flows, ICE candidates and SDP negotiation understood end to end',
      'Low-level networking beyond typical web work'
    ],
    links: [
      { label: 'Frontend · 7★', href: 'https://github.com/isaactan98/nuxt_video_chat_app' },
      { label: 'Signalling server · 1★', href: 'https://github.com/isaactan98/nuxt_video_chat_api' }
    ]
  },
  {
    id: 'anime',
    name: 'Shadow Anime',
    kind: 'Web app',
    year: '2025',
    summary: 'A second pass at a streaming front end, rebuilt from the lessons of the first.',
    problem:
      'Most anime sites are either ad-heavy, unstable, or require accounts. I wanted a clean, fast interface I could use daily — without ads, sign-ups, or unreliable third-party players.',
    built:
      'A streaming platform with search, genre filtering, episode tracking and a clean dark UI, pulling live data from a third-party anime API. Built as an iterative improvement on the original anime-nuxt-app, with a more polished UI and better data handling.',
    stack:
      'Nuxt 3 and Vue 3 with TypeScript throughout · Tailwind CSS · third-party REST API (Jikan/AniList) for metadata, episodes and search · deployed on Vercel',
    result: [
      'The original version drew 14★ and 7 forks',
      'Other developers actively building on top of it',
      'A personal daily driver'
    ],
    links: [
      { label: 'Shadow Anime · 6★', href: 'https://github.com/isaactan98/shadow-anime' },
      { label: 'Original · 14★', href: 'https://github.com/isaactan98/anime-nuxt-app' }
    ]
  }
]

type Repo = {
  name: string
  desc: string
  lang: string | null
  stars: number
  date: string
  tags: string[]
}

/**
 * A selection, not a dump. Three repositories are deliberately not listed:
 * two carried no description worth reading, and `sg-nric-generator` — however
 * legitimate as test data — is the wrong thing to put in a shop window aimed
 * at Singapore employers while the PDPC's NRIC rules are live.
 * Nothing here is padding; every row earns its line.
 */
const repos: Repo[] = [
  { name: 'ws-opener', desc: 'Opens the WhatsApp app from a browser with a phone number.', lang: 'Vue', stars: 0, date: '2026-09', tags: ['Tooling'] },
  { name: 'LunchSpin', desc: 'Food-decision PWA for Singapore — picks a restaurant by mall, company, budget and meal type.', lang: 'Vue', stars: 0, date: '2026-07', tags: ['Web app'] },
  { name: 'car-import-calculator', desc: 'Estimates total vehicle import costs — taxes, duties, GST, freight and registration.', lang: 'Vue', stars: 0, date: '2026-04', tags: ['Web app', 'Tooling'] },
  { name: 'crewai-osint', desc: 'Practice running red-team tests against an LLM.', lang: null, stars: 0, date: '2025-09', tags: ['Tooling'] },
  { name: 'anime-nuxt-app', desc: 'The original anime streaming platform, later rebuilt as Shadow Anime.', lang: 'Vue', stars: 14, date: '2025-05', tags: ['Web app'] },
  { name: 'shadow-anime', desc: 'The rebuilt streaming platform. See the case study above.', lang: 'Vue', stars: 6, date: '2025-01', tags: ['Web app'] },
  { name: 'express-consument', desc: 'Search API for anime, film and television, books, light novels and manga.', lang: 'TypeScript', stars: 2, date: '2024-12', tags: ['Tooling'] },
  { name: 'admin-panel-template', desc: 'Laravel 10 admin panel starter with user management.', lang: 'Blade', stars: 1, date: '2024-07', tags: ['Tooling'] },
  { name: 'malaysia_covid_site', desc: 'COVID-19 statistics for Malaysia. Unsponsored, free to use.', lang: 'PHP', stars: 4, date: '2023-12', tags: ['Web app', 'Early work'] },
  { name: 'nuxt_video_chat_api', desc: 'Express signalling backend for the video chat app.', lang: 'JavaScript', stars: 1, date: '2023-07', tags: ['Real-time'] },
  { name: 'nuxt_video_chat_app', desc: 'The video chat frontend. See the case study above.', lang: 'Vue', stars: 7, date: '2023-07', tags: ['Real-time'] },
  { name: 'currency_exchange', desc: 'PWA for checking exchange rates between currencies.', lang: 'Vue', stars: 0, date: '2023-01', tags: ['Web app', 'Early work'] },
  { name: 'Airbnb-Clone', desc: 'Booking flow rebuilt in Laravel and Nuxt to learn the system end to end.', lang: 'PHP', stars: 3, date: '2022-08', tags: ['Early work'] },
  { name: 'laravel_invoice', desc: 'Invoice management system in Laravel and Tailwind.', lang: 'Blade', stars: 1, date: '2022-06', tags: ['Early work'] }
]

const filters = ['All', 'Web app', 'Real-time', 'Tooling', 'Early work'] as const
type Filter = (typeof filters)[number]

const activeFilter = ref<Filter>('All')
const sortBy = ref<'recent' | 'stars'>('recent')
const openCase = ref<string | null>(cases[0]!.id)

// The landing page links straight at a case study (`/work#expense`), so a hash
// that names one opens it and scrolls to it rather than landing at the top.
const route = useRoute()
onMounted(async () => {
  const id = route.hash.slice(1)
  if (!id || !cases.some((c) => c.id === id)) return
  openCase.value = id
  // Wait for the accordion to expand before scrolling, or the target is still
  // a zero-height row and the page lands in the wrong place.
  await nextTick()
  document.getElementById(id)?.scrollIntoView({ block: 'center' })
})

const countFor = (f: Filter) => (f === 'All' ? repos.length : repos.filter((r) => r.tags.includes(f)).length)

const visibleRepos = computed(() => {
  const list =
    activeFilter.value === 'All' ? [...repos] : repos.filter((r) => r.tags.includes(activeFilter.value))
  return sortBy.value === 'stars'
    ? list.sort((a, b) => b.stars - a.stars || b.date.localeCompare(a.date))
    : list.sort((a, b) => b.date.localeCompare(a.date))
})

const totalStars = repos.reduce((n, r) => n + r.stars, 0)

function toggleCase(id: string) {
  openCase.value = openCase.value === id ? null : id
}

const year = (d: string) => d.slice(0, 4)
</script>

<template>
  <main class="page-column work">
    <!-- Intro -->
    <section class="intro">
      <h2 class="section-label">Work</h2>
      <h1 class="title">Three worth writing up, and everything else.</h1>
      <p class="lede">
        Side projects, mostly. A few solve a problem I actually had; the rest were
        built to understand something. {{ repos.length }} repositories worth showing,
        {{ totalStars }} stars between them &mdash; counts read from the GitHub API on
        10 September 2026.
      </p>
    </section>

    <!-- Case studies -->
    <section class="section">
      <h2 class="section-label">Case studies</h2>
      <ul class="cases">
        <li v-for="c in cases" :key="c.id" :id="c.id" class="case" :class="{ 'case--open': openCase === c.id }">
          <h3 class="case-headrow">
            <button
              type="button"
              class="case-head"
              :aria-expanded="openCase === c.id"
              :aria-controls="`case-${c.id}`"
              @click="toggleCase(c.id)"
            >
              <span class="case-chevron" aria-hidden="true">
                <svg viewBox="0 0 12 12" fill="currentColor"><path d="M4 2.5 8.5 6 4 9.5z" /></svg>
              </span>
              <span class="case-name">{{ c.name }}</span>
              <span class="case-summary">{{ c.summary }}</span>
              <span class="case-meta">{{ c.kind }} · {{ c.year }}</span>
            </button>
          </h3>

          <div :id="`case-${c.id}`" class="case-detail" :hidden="openCase !== c.id ? false : undefined">
            <div class="case-detail-inner">
              <dl class="case-body">
                <dt>The problem</dt>
                <dd>{{ c.problem }}</dd>
                <dt>What I built</dt>
                <dd>{{ c.built }}</dd>
                <dt>Stack</dt>
                <dd class="case-stack">{{ c.stack }}</dd>
                <dt>Result</dt>
                <dd>
                  <ul class="case-result">
                    <li v-for="r in c.result" :key="r">{{ r }}</li>
                  </ul>
                </dd>
              </dl>
              <p v-if="c.links.length" class="case-links">
                <a v-for="l in c.links" :key="l.href" :href="l.href" target="_blank" rel="noopener">
                  {{ l.label }} <span aria-hidden="true">&nearr;</span>
                </a>
              </p>
              <p v-else class="case-links case-links--none">Self-hosted &mdash; live demo on request.</p>
            </div>
          </div>
        </li>
      </ul>
    </section>

    <!-- Repositories -->
    <section class="section">
      <div class="repo-head">
        <h2 class="section-label">Repositories</h2>
        <div class="sort">
          <button
            type="button"
            :class="{ 'is-on': sortBy === 'recent' }"
            @click="sortBy = 'recent'"
          >recent</button>
          <span aria-hidden="true">/</span>
          <button
            type="button"
            :class="{ 'is-on': sortBy === 'stars' }"
            @click="sortBy = 'stars'"
          >stars</button>
        </div>
      </div>

      <div class="filters" role="group" aria-label="Filter repositories">
        <button
          v-for="f in filters"
          :key="f"
          type="button"
          class="chip"
          :class="{ 'chip--on': activeFilter === f }"
          :aria-pressed="activeFilter === f"
          @click="activeFilter = f"
        >
          {{ f }}<span class="chip-count">{{ countFor(f) }}</span>
        </button>
      </div>

      <TransitionGroup tag="ul" name="repo" class="rows" aria-live="polite">
        <li v-for="r in visibleRepos" :key="r.name">
          <a
            class="row row--link"
            :href="`https://github.com/isaactan98/${r.name}`"
            target="_blank"
            rel="noopener"
          >
            <span class="cell-title">{{ r.name }}</span>
            <span class="cell-note">{{ r.desc || '—' }}</span>
            <span class="cell-tech">
              <span v-if="r.lang">{{ r.lang }}</span>
              <span v-if="r.stars" class="cell-stars">{{ r.stars }}★</span>
              <span class="cell-year">{{ year(r.date) }}</span>
            </span>
            <span class="cell-arrow" aria-hidden="true">&nearr;</span>
          </a>
        </li>
      </TransitionGroup>
    </section>

    <p class="back">
      <NuxtLink to="/">&larr; Back to the rest of the CV</NuxtLink>
    </p>
  </main>
</template>

<style scoped>
.work {
  padding-bottom: 8rem;
}

/* ---- Intro ---------------------------------------------------------- */

.intro {
  padding-top: 3rem;
}

.title {
  font-family: theme('fontFamily.mono');
  font-size: clamp(1.375rem, 3vw, 2rem);
  font-weight: 600;
  line-height: 1.22;
  letter-spacing: -0.02em;
  text-wrap: balance;
  max-width: 26ch;
  margin-top: 0.25rem;
}

.lede {
  margin-top: 1rem;
  max-width: 56ch;
  font-size: 1rem;
  line-height: 1.65;
  color: theme('colors.ink-muted');
}

.section {
  margin-top: 3.5rem;
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

/* ---- Case studies ---------------------------------------------------- */

.cases {
  list-style: none;
  padding: 0;
  margin: 0;
  border-top: 1px solid theme('colors.line');
}

.case {
  border-bottom: 1px solid theme('colors.line');
}

.case-headrow {
  margin: 0;
  font-size: inherit;
  font-weight: inherit;
}

.case-head {
  display: grid;
  grid-template-columns: 1.25rem minmax(0, 0.8fr) minmax(0, 1.5fr) auto;
  align-items: baseline;
  gap: 0 1rem;
  width: 100%;
  text-align: left;
  padding: 0.9rem 0.75rem;
  margin-inline: -0.75rem;
  cursor: pointer;
  transition: background-color 150ms ease;
}

.case-head:hover {
  background-color: theme('colors.hover');
}

.case-chevron svg {
  width: 0.7rem;
  height: 0.7rem;
  color: theme('colors.ink-faint');
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), color 150ms ease;
}

.case--open .case-chevron svg {
  transform: rotate(90deg);
  color: theme('colors.ink');
}

.case-name {
  font-size: 1rem;
  font-weight: 500;
}

.case-summary {
  font-size: 0.875rem;
  color: theme('colors.ink-muted');
}

.case-meta {
  font-family: theme('fontFamily.mono');
  font-size: 0.75rem;
  color: theme('colors.ink-faint');
  white-space: nowrap;
}

/* Height animation without measuring anything in JavaScript. */
.case-detail {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.case--open .case-detail {
  grid-template-rows: 1fr;
}

.case-detail-inner {
  overflow: hidden;
}

.case-body {
  display: grid;
  grid-template-columns: 7.5rem minmax(0, 1fr);
  gap: 0.5rem 1.25rem;
  margin: 0 0 1rem;
  padding-top: 0.25rem;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 260ms ease 60ms, transform 260ms ease 60ms;
}

.case--open .case-body {
  opacity: 1;
  transform: none;
}

.case-body dt {
  font-family: theme('fontFamily.mono');
  font-size: 0.6875rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: theme('colors.ink-faint');
  padding-top: 0.2rem;
}

.case-body dd {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: theme('colors.ink');
}

.case-stack {
  font-family: theme('fontFamily.mono');
  font-size: 0.8125rem !important;
  line-height: 1.65 !important;
  color: theme('colors.ink-muted') !important;
}

.case-result {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.2rem;
}

.case-result li {
  position: relative;
  padding-left: 1rem;
}

.case-result li::before {
  content: '';
  position: absolute;
  left: 0.15rem;
  top: 0.62em;
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: theme('colors.signal');
}

.case-links {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin: 0 0 1rem;
  font-family: theme('fontFamily.mono');
  font-size: 0.75rem;
  color: theme('colors.ink-muted');
}

.case-links a {
  transition: color 150ms ease;
}

.case-links a:hover {
  color: theme('colors.ink');
}

.case-links--none {
  color: theme('colors.ink-faint');
}

/* ---- Repository controls -------------------------------------------- */

.repo-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.sort {
  display: flex;
  gap: 0.4rem;
  font-family: theme('fontFamily.mono');
  font-size: 0.6875rem;
  letter-spacing: 0.06em;
  color: theme('colors.ink-faint');
  /* Reclaims the vertical padding the buttons below take for a 44px hit area
     so the row sits exactly where it did; the second value preserves the
     0.75rem gap to the content beneath, measured from the text rather than
     from the enlarged target. */
  margin-block: -0.8125rem calc(0.75rem - 0.8125rem);
}

.sort button {
  cursor: pointer;
  transition: color 150ms ease;
  /* 11px mono gives an 18px line box — below Apple's 28x28pt floor and below
     WCAG 2.5.8's 24px. These pads take it to 44px without moving anything. */
  padding-block: 0.8125rem;
}

.sort button:hover {
  color: theme('colors.ink-muted');
}

.sort button.is-on {
  color: theme('colors.ink');
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.chip {
  display: inline-flex;
  align-items: baseline;
  gap: 0.45rem;
  font-family: theme('fontFamily.mono');
  font-size: 0.6875rem;
  letter-spacing: 0.04em;
  color: theme('colors.ink-muted');
  border: 1px solid theme('colors.line-strong');
  border-radius: 999px;
  padding: 0.28rem 0.7rem;
  cursor: pointer;
  transition: color 150ms ease, border-color 150ms ease, background-color 150ms ease;
}

.chip:hover {
  color: theme('colors.ink');
  border-color: theme('colors.ink-muted');
}

.chip--on {
  color: theme('colors.canvas');
  background: theme('colors.ink');
  border-color: theme('colors.ink');
}

.chip-count {
  /* 11px floor, not 10 — Apple's iOS minimum type size
     (`accessibility.md › Vision`). */
  font-size: 0.6875rem;
  color: theme('colors.ink-faint');
}

.chip--on .chip-count {
  color: theme('colors.line-strong');
}

/* ---- Repository rows ------------------------------------------------- */

.rows {
  list-style: none;
  padding: 0;
  margin: 0;
  border-top: 1px solid theme('colors.line');
}

.row {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.6fr) minmax(0, 0.7fr) 1.5rem;
  align-items: baseline;
  gap: 0 1.25rem;
  padding: 0.8125rem 0.75rem;
  margin-inline: -0.75rem;
  border-bottom: 1px solid theme('colors.line');
  transition: background-color 150ms ease;
}

.row--link:hover {
  background-color: theme('colors.hover');
}

.cell-title {
  font-family: theme('fontFamily.mono');
  font-size: 0.875rem;
  font-weight: 500;
}

.cell-note {
  font-size: 0.875rem;
  color: theme('colors.ink-muted');
}

.cell-tech {
  display: flex;
  gap: 0.7rem;
  font-family: theme('fontFamily.mono');
  font-size: 0.75rem;
  color: theme('colors.ink-faint');
  white-space: nowrap;
}

.cell-stars {
  color: theme('colors.ink-muted');
}

.cell-year {
  font-variant-numeric: tabular-nums;
}

.cell-arrow {
  justify-self: end;
  color: theme('colors.ink-faint');
  transition: transform 150ms ease, color 150ms ease;
}

.row--link:hover .cell-arrow {
  transform: translate(2px, -2px);
  color: theme('colors.ink');
}

/* Filtering and sorting reflow rather than snap. */
.repo-move {
  transition: transform 340ms cubic-bezier(0.16, 1, 0.3, 1);
}

.repo-enter-active {
  transition: opacity 260ms ease, transform 260ms ease;
}

.repo-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
  position: absolute;
  width: 100%;
}

.repo-enter-from,
.repo-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.back {
  margin-top: 3rem;
  font-family: theme('fontFamily.mono');
  font-size: 0.75rem;
  color: theme('colors.ink-muted');
}

.back a {
  transition: color 150ms ease;
}

.back a:hover {
  color: theme('colors.ink');
}

/* ---- Narrow screens --------------------------------------------------- */

@media (max-width: 700px) {
  .case-head {
    grid-template-columns: 1.25rem minmax(0, 1fr) auto;
    row-gap: 0.2rem;
  }
  .case-summary {
    grid-column: 2 / -1;
  }
  .case-body {
    grid-template-columns: 1fr;
    gap: 0.2rem;
  }
  .case-body dt {
    padding-top: 0.6rem;
  }
  .row {
    grid-template-columns: 1fr auto;
    row-gap: 0.2rem;
  }
  .cell-note {
    grid-column: 1 / -1;
  }
  .cell-tech {
    grid-column: 1 / -1;
    margin-top: 0.2rem;
  }
  .cell-arrow {
    grid-column: 2;
    grid-row: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .case-detail,
  .case-body,
  .case-chevron svg,
  .row,
  .cell-arrow,
  .chip,
  .sort button,
  .repo-move,
  .repo-enter-active,
  .repo-leave-active {
    transition: none;
  }
}
</style>
