<script setup lang="ts">
/**
 * The client-facing half of the site.
 *
 * `/` answers "can this person hold a role"; this page answers "can this person
 * take my problem away". Those are different questions and they were fighting
 * each other when a single "Open to freelance work" line sat above a CV table.
 * Everything here is grounded in something already shipped and listed on
 * `/work` — no service is advertised that has no artifact behind it.
 */
definePageMeta({ layout: 'site' })

usePageSeo({
  title: 'Freelance — Isaac Tan',
  description:
    'Full-stack freelance work from Johor Bahru, for Singapore and Malaysia. Web apps, internal tools, and the deployment underneath them.',
  path: '/freelance'
})

// Each service maps to work that exists. `proof` links the receipt.
type Service = {
  label: string
  what: string
  proof: string
  href: string
}

const services: Service[] = [
  {
    label: 'Web apps',
    what: 'Nuxt or Vue front end, TypeScript throughout, designed to survive a real user',
    proof: 'Shadow Anime',
    href: 'https://github.com/isaactan98/shadow-anime'
  },
  {
    label: 'Internal tools',
    what: 'The unglamorous CRUD that runs a business — forms, roles, reports, exports',
    proof: 'Admin panel',
    href: 'https://github.com/isaactan98/admin-panel-template'
  },
  {
    label: 'Offline-first PWAs',
    what: 'Installs to the home screen, works with no signal, syncs when it comes back',
    proof: 'Expense Tracker',
    href: '/work#expense'
  },
  {
    label: 'Real-time features',
    what: 'WebRTC and WebSockets at the protocol level, not bolted on from an SDK',
    proof: 'Nuxt Video Chat',
    href: '/work#webrtc'
  },
  {
    label: 'Deployment',
    what: 'Docker Compose, Cloudflare Tunnel, a domain that resolves and stays up',
    proof: 'Homelab',
    href: '/#work'
  }
]

// How the engagement actually runs. No promises about speed that cannot be kept.
const process: { step: string; detail: string }[] = [
  { step: 'Scope', detail: 'A call, then a written breakdown of what gets built and what does not.' },
  { step: 'Build', detail: 'Small commits against a staging URL you can open any day of the week.' },
  { step: 'Hand over', detail: 'The repository, the deployment, and the runbook. No lock-in to me.' }
]

const isExternal = (href: string) => href.startsWith('http')
</script>

<template>
  <main class="page-column pb-24">
    <!-- Intro -->
    <section class="reveal pt-12 sm:pt-16" style="--d: 0ms">
      <h2 class="section-label">Freelance</h2>
      <h1 class="hero">Something to build, and nobody to build it.</h1>
      <p class="lede">
        I take on a small number of projects outside my full-time role &mdash; web apps,
        internal tools, and the deployment underneath them. Based in Johor Bahru,
        working with Singapore and Malaysia, in your timezone either way.
      </p>
    </section>

    <!-- Services -->
    <section id="services" class="section section--reveal" style="--s: 2">
      <h2 class="section-label">What I build</h2>
      <ul class="rows">
        <li v-for="(row, i) in services" :key="row.label" :style="{ '--i': i }">
          <NuxtLink
            :to="row.href"
            :target="isExternal(row.href) ? '_blank' : undefined"
            :rel="isExternal(row.href) ? 'noopener' : undefined"
            class="row row--link"
          >
            <span class="cell-title">{{ row.label }}</span>
            <span class="cell-note">{{ row.what }}</span>
            <span class="cell-dest">
              {{ row.proof }}
              <span class="cell-arrow" aria-hidden="true">{{ isExternal(row.href) ? '↗' : '→' }}</span>
            </span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- Process -->
    <section id="process" class="section section--reveal" style="--s: 3">
      <h2 class="section-label">How it runs</h2>
      <ul class="rows">
        <li v-for="(row, i) in process" :key="row.step" class="row row--step" :style="{ '--i': i }">
          <span class="cell-year">{{ row.step }}</span>
          <span class="cell-title font-normal">{{ row.detail }}</span>
        </li>
      </ul>
    </section>

    <!-- Availability -->
    <section id="availability" class="section section--reveal" style="--s: 4">
      <h2 class="section-label">Availability</h2>
      <div class="rows">
        <p class="row row--prose">
          <span class="status-dot" aria-hidden="true" />
          <span>
            Open to new projects. Evenings and weekends, which suits a defined scope
            better than an open-ended retainer &mdash; so I would rather quote you a
            piece of work than a number of hours. Tell me what needs to exist and
            I will tell you honestly whether I am the right person for it.
          </span>
        </p>
      </div>
    </section>

    <!-- Contact -->
    <section id="contact" class="section section--reveal" style="--s: 5">
      <h2 class="section-label">Start a conversation</h2>
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

    <p class="back">
      <NuxtLink to="/">&larr; Hiring instead? The CV is on the front page.</NuxtLink>
    </p>
  </main>
</template>

<style scoped>
/* Deliberately the same type and grid as the landing page — a client landing
   here should recognise it as one site, not a sales page bolted on the side. */

.hero {
  font-family: theme('fontFamily.mono');
  font-size: clamp(1.375rem, 3.2vw, 2.25rem);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.02em;
  text-wrap: balance;
  max-width: 28ch;
  margin-top: 0.25rem;
}

.lede {
  margin-top: 1.125rem;
  max-width: 52ch;
  font-size: 1.0625rem;
  line-height: 1.65;
  color: theme('colors.ink-muted');
}

.section {
  margin-top: 4.5rem;
  scroll-margin-top: 2rem;
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

.rows {
  border-top: 1px solid theme('colors.line');
}

.row {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.9fr) auto;
  align-items: baseline;
  gap: 0 1.25rem;
  padding: 0.8125rem 0;
  border-bottom: 1px solid theme('colors.line');
}

.row--step {
  grid-template-columns: 5.5rem minmax(0, 1fr);
}

/* The measure is constrained on the text, not on the row — otherwise the rule
   underneath stops short and breaks the listing's alignment. */
.row--prose {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  font-size: 0.9375rem;
  line-height: 1.65;
  color: theme('colors.ink-muted');
}

.row--prose > span:last-child {
  max-width: 62ch;
}

.row--link {
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
  color: theme('colors.ink-muted');
  white-space: nowrap;
}

.cell-title {
  font-size: 0.9375rem;
  font-weight: 500;
}

.cell-note {
  font-size: 0.875rem;
  color: theme('colors.ink-muted');
}

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
  color: theme('colors.ink-faint');
  transition: transform 150ms ease, color 150ms ease;
}

.row--link:hover .cell-arrow {
  transform: translate(2px, 0);
  color: theme('colors.ink');
}

.status-dot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background-color: theme('colors.signal');
  transform: translateY(-1px);
}

.nav-link {
  transition: color 150ms ease;
}

.nav-link:hover {
  color: theme('colors.ink');
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
  .row {
    grid-template-columns: 1fr auto;
    gap: 0.15rem 1rem;
  }
  .row--step {
    grid-template-columns: 1fr;
  }
  .cell-title {
    grid-column: 1;
  }
  .cell-note {
    grid-column: 1 / -1;
  }
  .cell-dest {
    grid-column: 2;
    grid-row: 1;
  }
  .cell-arrow {
    display: none;
  }
  .row--prose {
    grid-column: 1 / -1;
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
