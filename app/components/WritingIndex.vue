<script setup lang="ts">
/**
 * Listing for one content directory — /jb and /sg both render this.
 *
 * The interaction vocabulary is lifted wholesale from /work (filter chips with
 * live counts, a recent/oldest toggle, a TransitionGroup that reflows rather
 * than snaps) so a reader moving between the two pages recognises the controls
 * instead of learning them twice.
 */
const props = defineProps<{
  /** Directory under content/, without slashes — 'jb' or 'sg'. */
  section: string
  label: string
  title: string
  lede: string
  /** The other side of the causeway, so neither index is a dead end. */
  siblingPath: string
  siblingLabel: string
}>()

type Post = {
  path: string
  title: string
  description: string
  date?: string
  tags?: string[]
}

// Drafts are excluded in the query rather than in a computed, so an unfinished
// post's title never reaches the client. It stays reachable by direct URL.
const { data } = await useAsyncData(`writing:${props.section}`, () =>
  queryCollection('content')
    .where('path', 'LIKE', `/${props.section}/%`)
    .where('draft', '=', false)
    .order('date', 'DESC')
    .all()
)

const posts = computed<Post[]>(() => (data.value ?? []) as Post[])

const query = ref('')
const activeTag = ref<string>('All')
const sortBy = ref<'recent' | 'oldest'>('recent')

const tags = computed(() => {
  const seen = new Map<string, number>()
  for (const p of posts.value) {
    for (const t of p.tags ?? []) seen.set(t, (seen.get(t) ?? 0) + 1)
  }
  return [...seen.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
})

const countFor = (tag: string) =>
  tag === 'All' ? posts.value.length : (tags.value.find(([t]) => t === tag)?.[1] ?? 0)

const visible = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = posts.value.filter((p) => {
    if (activeTag.value !== 'All' && !(p.tags ?? []).includes(activeTag.value)) return false
    if (!q) return true
    // Searching the tags too means typing "career" finds a post whose title
    // never says it.
    return `${p.title} ${p.description} ${(p.tags ?? []).join(' ')}`.toLowerCase().includes(q)
  })
  return [...list].sort((a, b) => {
    const cmp = (a.date ?? '').localeCompare(b.date ?? '')
    return sortBy.value === 'recent' ? -cmp : cmp
  })
})

const filtering = computed(() => query.value.trim() !== '' || activeTag.value !== 'All')

function reset() {
  query.value = ''
  activeTag.value = 'All'
}
</script>

<template>
  <main class="page-column pb-24">
    <!-- Intro -->
    <section class="reveal pt-12 sm:pt-16" style="--d: 0ms">
      <h2 class="section-label">{{ label }}</h2>
      <h1 class="hero">{{ title }}</h1>
      <p class="lede">{{ lede }}</p>
    </section>

    <section class="section section--reveal" style="--s: 2">
      <div class="controls-head">
        <h2 class="section-label">
          {{ posts.length }} {{ posts.length === 1 ? 'entry' : 'entries' }}
        </h2>
        <div class="sort">
          <button type="button" :class="{ 'is-on': sortBy === 'recent' }" @click="sortBy = 'recent'">
            recent
          </button>
          <span aria-hidden="true">/</span>
          <button type="button" :class="{ 'is-on': sortBy === 'oldest' }" @click="sortBy = 'oldest'">
            oldest
          </button>
        </div>
      </div>

      <!-- Filter -->
      <div class="filter-bar">
        <label class="search">
          <span class="sr-only">Search {{ label }}</span>
          <svg class="search-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.2" />
            <path d="M10.5 10.5 14 14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
          </svg>
          <input
            v-model="query"
            type="search"
            placeholder="Filter by title, tag or description"
            autocomplete="off"
            @keydown.esc="query = ''"
          >
        </label>

        <div v-if="tags.length" class="chips" role="group" aria-label="Filter by tag">
          <button
            type="button"
            class="chip"
            :class="{ 'chip--on': activeTag === 'All' }"
            :aria-pressed="activeTag === 'All'"
            @click="activeTag = 'All'"
          >
            All<span class="chip-count">{{ countFor('All') }}</span>
          </button>
          <button
            v-for="[tag, n] in tags"
            :key="tag"
            type="button"
            class="chip"
            :class="{ 'chip--on': activeTag === tag }"
            :aria-pressed="activeTag === tag"
            @click="activeTag = activeTag === tag ? 'All' : tag"
          >
            {{ tag }}<span class="chip-count">{{ n }}</span>
          </button>
        </div>
      </div>

      <!-- Listing -->
      <TransitionGroup v-if="visible.length" tag="ul" name="entry" class="rows" aria-live="polite">
        <li v-for="(post, i) in visible" :key="post.path" :style="{ '--i': i }">
          <NuxtLink :to="post.path" class="row row--link">
            <span class="cell-date">{{ post.date ?? '—' }}</span>
            <span class="cell-main">
              <span class="cell-title">{{ post.title }}</span>
              <span class="cell-note">{{ post.description }}</span>
            </span>
            <span class="cell-tags">
              <span v-for="t in post.tags ?? []" :key="t" class="tag">{{ t }}</span>
            </span>
            <span class="cell-arrow" aria-hidden="true">→</span>
          </NuxtLink>
        </li>
      </TransitionGroup>

      <!-- Nothing matched -->
      <p v-else class="empty">
        <template v-if="posts.length">
          Nothing matches that.
          <button type="button" class="empty-reset" @click="reset">Clear the filter</button>
        </template>
        <template v-else>
          Nothing published here yet.
        </template>
      </p>

      <p v-if="filtering && visible.length" class="showing">
        Showing {{ visible.length }} of {{ posts.length }}.
        <button type="button" class="empty-reset" @click="reset">Clear</button>
      </p>
    </section>

    <p class="back">
      <NuxtLink to="/">&larr; Back to the rest of the CV</NuxtLink>
      <NuxtLink :to="siblingPath">{{ siblingLabel }} &rarr;</NuxtLink>
    </p>
  </main>
</template>

<style scoped>
.hero {
  font-family: theme('fontFamily.mono');
  font-size: clamp(1.375rem, 3.2vw, 2.25rem);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.02em;
  text-wrap: balance;
  max-width: 26ch;
  margin-top: 0.25rem;
}

.lede {
  margin-top: 1.125rem;
  max-width: 54ch;
  font-size: 1.0625rem;
  line-height: 1.65;
  color: theme('colors.ink-muted');
}

.section {
  margin-top: 3.25rem;
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

.controls-head {
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
  margin-bottom: 0.75rem;
}

.sort button {
  cursor: pointer;
  transition: color 150ms ease;
}

.sort button:hover {
  color: theme('colors.ink-muted');
}

.sort button.is-on {
  color: theme('colors.ink');
}

/* ---- Filter bar ------------------------------------------------------ */

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1rem;
  margin-bottom: 1.25rem;
}

.search {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1 1 16rem;
}

.search-icon {
  position: absolute;
  left: 0.6rem;
  width: 0.85rem;
  height: 0.85rem;
  color: theme('colors.ink-faint');
  pointer-events: none;
  transition: color 150ms ease;
}

.search:focus-within .search-icon {
  color: theme('colors.ink-muted');
}

.search input {
  width: 100%;
  padding: 0.45rem 0.7rem 0.45rem 1.9rem;
  font-size: 0.875rem;
  color: theme('colors.ink');
  background: theme('colors.surface');
  border: 1px solid theme('colors.line-strong');
  border-radius: 4px;
  outline: none;
  transition: border-color 150ms ease;
}

.search input::placeholder {
  color: theme('colors.ink-faint');
}

.search input:focus {
  border-color: theme('colors.ink-muted');
}

/* Safari draws its own clear affordance; ours is the Escape key. */
.search input::-webkit-search-cancel-button {
  appearance: none;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
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
  font-size: 0.625rem;
  color: theme('colors.ink-faint');
}

.chip--on .chip-count {
  color: theme('colors.line-strong');
}

/* ---- Rows ------------------------------------------------------------ */

.rows {
  list-style: none;
  padding: 0;
  margin: 0;
  border-top: 1px solid theme('colors.line');
}

.row {
  display: grid;
  grid-template-columns: 6.5rem minmax(0, 1fr) minmax(0, 0.5fr) 1.5rem;
  align-items: baseline;
  gap: 0 1.25rem;
  padding: 0.9rem 0.75rem;
  margin-inline: -0.75rem;
  border-bottom: 1px solid theme('colors.line');
  transition: background-color 150ms ease;
}

.row--link:hover {
  background-color: #f4f4f2;
}

.cell-date {
  font-family: theme('fontFamily.mono');
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: theme('colors.ink-faint');
  white-space: nowrap;
}

.cell-main {
  display: grid;
  gap: 0.2rem;
}

.cell-title {
  font-size: 0.9375rem;
  font-weight: 500;
}

.cell-note {
  font-size: 0.875rem;
  line-height: 1.55;
  color: theme('colors.ink-muted');
}

.cell-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.35rem;
}

.tag {
  font-family: theme('fontFamily.mono');
  font-size: 0.6875rem;
  color: theme('colors.ink-faint');
  white-space: nowrap;
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

/* ---- Empty and status ------------------------------------------------ */

.empty,
.showing {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: theme('colors.ink-muted');
}

.empty {
  padding: 2rem 0;
  border-top: 1px solid theme('colors.line');
  border-bottom: 1px solid theme('colors.line');
}

.showing {
  font-family: theme('fontFamily.mono');
  font-size: 0.6875rem;
  color: theme('colors.ink-faint');
}

.empty-reset {
  color: theme('colors.ink');
  text-decoration: underline;
  text-decoration-color: theme('colors.line-strong');
  text-underline-offset: 3px;
  cursor: pointer;
  transition: text-decoration-color 150ms ease;
}

.empty-reset:hover {
  text-decoration-color: theme('colors.ink');
}

.back {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
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

/* ---- Reflow ---------------------------------------------------------- */
/* Filtering and sorting move rows rather than snapping them, so the eye can
   follow a row it was already reading to its new position. */

.entry-move {
  transition: transform 340ms cubic-bezier(0.16, 1, 0.3, 1);
}

.entry-enter-active {
  transition: opacity 260ms ease, transform 260ms ease;
}

.entry-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
  position: absolute;
  width: 100%;
}

.entry-enter-from,
.entry-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* ---- Load-in --------------------------------------------------------- */

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

/* ---- Narrow screens --------------------------------------------------- */

@media (max-width: 640px) {
  .row {
    grid-template-columns: 1fr auto;
    row-gap: 0.3rem;
  }
  .cell-date {
    grid-column: 1;
    grid-row: 1;
  }
  .cell-tags {
    grid-column: 2;
    grid-row: 1;
  }
  .cell-main {
    grid-column: 1 / -1;
    grid-row: 2;
  }
  .cell-arrow {
    display: none;
  }
  .filter-bar {
    gap: 0.75rem;
  }
  .search {
    flex-basis: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .reveal {
    animation: none;
  }
  .entry-move,
  .entry-enter-active,
  .entry-leave-active,
  .row,
  .cell-arrow,
  .chip,
  .sort button,
  .search input,
  .search-icon {
    transition: none;
  }
}
</style>
