<script setup lang="ts">
/**
 * Shared chrome for the hand-written pages (`/` and `/work`).
 *
 * The header lives here rather than in each page so it stays put while the
 * page body transitions underneath it — the navigation reads as moving within
 * one site rather than loading a new document. Content pages under
 * `[...slug].vue` deliberately opt out; their Notion-style cover runs flush to
 * the top of the viewport.
 */
// `page: true` marks a real route, which is the only kind that gets the
// current-page underline. The hash links all resolve to `/`, so letting them
// take `router-link-active` would underline two items at once on the homepage.
const nav = [
  { label: 'Experience', to: '/#experience', page: false },
  { label: 'Work', to: '/work', page: true },
  { label: 'Freelance', to: '/freelance', page: true },
  { label: 'Contact', to: '/#contact', page: false }
]
</script>

<template>
  <div class="site">
    <header class="page-column flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5">
      <NuxtLink to="/" class="brand">
        <img src="/me-badge.png" alt="" width="36" height="36" class="badge">
        <span class="brand-name">Isaac Tan</span>
        <span class="brand-handle">isaactan98</span>
      </NuxtLink>

      <nav class="site-nav">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :class="{ 'nav-link--page': item.page }"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>
    </header>

    <slot />
  </div>
</template>

<style scoped>
.site {
  min-height: 100vh;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  white-space: nowrap;
}

.badge {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  object-fit: cover;
  /* Tall portrait; keep the face, not the shoulders. */
  object-position: top;
  background: theme('colors.callout.default');
  transition: filter 150ms ease;
}

.brand:hover .badge {
  filter: brightness(1.06);
}

.brand-name {
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: -0.01em;
}

.brand-handle {
  font-family: theme('fontFamily.mono');
  font-size: 0.75rem;
  color: theme('colors.ink-faint');
}

.site-nav {
  display: flex;
  width: 100%;
  gap: 1.25rem;
  font-family: theme('fontFamily.mono');
  font-size: 0.6875rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: theme('colors.ink-muted');
}

@media (min-width: 640px) {
  .site-nav {
    width: auto;
  }
}

.nav-link {
  position: relative;
  transition: color 150ms ease;
}

.nav-link:hover {
  color: theme('colors.ink');
}

/* The rule under the current section grows from the left. */
.nav-link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -4px;
  height: 1px;
  background: theme('colors.ink');
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-link:hover::after,
.nav-link--page.router-link-active::after {
  transform: scaleX(1);
}

.nav-link--page.router-link-active {
  color: theme('colors.ink');
}

@media (prefers-reduced-motion: reduce) {
  .nav-link::after,
  .badge {
    transition: none;
  }
}
</style>
