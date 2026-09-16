<script setup lang="ts">
/**
 * Foot-of-article navigation: the neighbouring posts in the same section, plus
 * a way back to that section's index.
 *
 * Deliberately at the foot rather than in a sidebar. A rail listing a handful
 * of posts competes with the reading column the whole way down the page and is
 * ignored while someone is actually reading; the moment a reader wants
 * somewhere else to go is the moment they run out of article.
 *
 * Neighbours are computed here rather than via queryCollectionItemSurroundings
 * because that walks the whole collection — it would happily send a reader from
 * the last /jb post into /sg. Sections are separate on this site and should
 * stay that way.
 */
const props = defineProps<{ path: string }>()

type Sibling = { path: string; title: string; date?: string }

// '/jb/japan-trip' -> 'jb'
const section = computed(() => props.path.split('/').filter(Boolean)[0] ?? '')

const sectionLabel = computed(
  () => ({ jb: 'Johor Bahru', sg: 'Singapore' })[section.value] ?? section.value.toUpperCase()
)

const { data } = await useAsyncData(`siblings:${props.path}`, () =>
  queryCollection('content')
    .where('path', 'LIKE', `/${section.value}/%`)
    .where('draft', '=', false)
    .order('date', 'DESC')
    .all()
)

const posts = computed<Sibling[]>(() => (data.value ?? []) as Sibling[])

// The list runs newest first, so the entry before this one is the newer read.
// A draft is not in the list at all; index -1 simply yields no neighbours,
// which is the right answer for a post that is not published.
const here = computed(() => posts.value.findIndex((p) => p.path === props.path))
const newer = computed(() => (here.value > 0 ? posts.value[here.value - 1] : null))
const older = computed(() =>
  here.value !== -1 && here.value < posts.value.length - 1 ? posts.value[here.value + 1] : null
)
</script>

<template>
  <nav class="post-nav" :aria-label="`More from ${sectionLabel}`">
    <div class="post-nav-head">
      <NuxtLink :to="`/${section}`" class="post-nav-index">
        <span aria-hidden="true">&larr;</span> All of {{ sectionLabel }}
      </NuxtLink>
    </div>

    <!-- Only drawn when there is somewhere to go. A pair of dead slots reading
         "no newer post" is worse than no navigation. -->
    <ul v-if="newer || older" class="post-nav-pair">
      <li v-if="newer">
        <NuxtLink :to="newer.path" class="post-nav-link">
          <span class="post-nav-dir">Newer</span>
          <span class="post-nav-title">{{ newer.title }}</span>
          <span v-if="newer.date" class="post-nav-date">{{ newer.date }}</span>
        </NuxtLink>
      </li>
      <li v-if="older" :class="{ 'is-alone': !newer }">
        <NuxtLink :to="older.path" class="post-nav-link post-nav-link--older">
          <span class="post-nav-dir">Older</span>
          <span class="post-nav-title">{{ older.title }}</span>
          <span v-if="older.date" class="post-nav-date">{{ older.date }}</span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.post-nav {
  margin-top: 4rem;
  padding-top: 1.25rem;
  border-top: 1px solid theme('colors.line');
}

.post-nav-head {
  margin-bottom: 1rem;
  font-family: theme('fontFamily.mono');
  font-size: 0.75rem;
  color: theme('colors.ink-muted');
}

.post-nav-index {
  transition: color 150ms ease;
}

.post-nav-index:hover {
  color: theme('colors.ink');
}

.post-nav-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

/* A lone older post keeps the right-hand slot rather than stretching across,
   so the pair reads the same whichever neighbour exists. */
.is-alone {
  grid-column: 2;
}

.post-nav-link {
  display: grid;
  gap: 0.25rem;
  height: 100%;
  padding: 0.85rem 0.9rem;
  border: 1px solid theme('colors.line');
  border-radius: 4px;
  background: theme('colors.surface');
  transition: border-color 150ms ease, background-color 150ms ease, transform 150ms ease;
}

.post-nav-link:hover {
  border-color: theme('colors.line-strong');
  background: theme('colors.hover');
  transform: translateY(-1px);
}

.post-nav-link--older {
  text-align: right;
}

.post-nav-dir {
  font-family: theme('fontFamily.mono');
  font-size: 0.6875rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: theme('colors.ink-faint');
}

.post-nav-title {
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.35;
  color: theme('colors.ink');
}

.post-nav-date {
  font-family: theme('fontFamily.mono');
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
  color: theme('colors.ink-faint');
}

@media (max-width: 600px) {
  .post-nav-pair {
    grid-template-columns: 1fr;
  }
  .is-alone {
    grid-column: 1;
  }
  .post-nav-link--older {
    text-align: left;
  }
}

@media (prefers-reduced-motion: reduce) {
  .post-nav-link,
  .post-nav-index {
    transition: none;
  }
  .post-nav-link:hover {
    transform: none;
  }
}
</style>
