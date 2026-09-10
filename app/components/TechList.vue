<script setup lang="ts">
/**
 * A `·`-separated list of technology names, each one linked to the evidence
 * that proves it — or left as plain text when there's nowhere honest to send
 * a reader.
 *
 * Deliberately not backed by a global `name -> link` table. Several
 * technologies are proven by more than one project (Nuxt shows up in both
 * Expense Tracker and Shadow Anime); a flat lookup keyed by name would send a
 * reader to the wrong project's evidence half the time. The caller always
 * knows which project or node it's rendering this inside, so it passes that
 * context down as a single `href` rather than this component guessing.
 *
 * No `href` is not an error state — it's the honest answer for a stack with
 * no case study behind it yet (the site's own `nuxt · content` line, for
 * instance). Rendering plain text there is the point: a dead link is worse
 * than no link.
 */
withDefaults(
  defineProps<{
    items: string[]
    href?: string
  }>(),
  { href: undefined }
)

const isExternal = (href: string) => href.startsWith('http')
</script>

<template>
  <span class="tech-list">
    <template v-for="(item, i) in items" :key="item">
      <span v-if="i > 0" class="tech-sep" aria-hidden="true">·</span>
      <NuxtLink
        v-if="href"
        :to="href"
        :target="isExternal(href) ? '_blank' : undefined"
        :rel="isExternal(href) ? 'noopener' : undefined"
        class="tech-link"
      >{{ item }}</NuxtLink>
      <span v-else>{{ item }}</span>
    </template>
  </span>
</template>

<style scoped>
/* Unstyled for size/color on purpose — this renders inside two visually
   distinct contexts (a table cell, the diagram's readout panel) and should
   inherit from whichever one it's in rather than impose a third voice. */

.tech-sep {
  margin: 0 0.35em;
  color: theme('colors.ink-faint');
}

/* The one thing this component does impose: a link has to look clickable
   before you hover it, or "which words are evidence" is undiscoverable. */
.tech-link {
  text-decoration: underline;
  text-decoration-color: theme('colors.line-strong');
  text-underline-offset: 2px;
  transition: text-decoration-color 150ms ease, color 150ms ease;
}

.tech-link:hover {
  text-decoration-color: theme('colors.ink-muted');
  color: theme('colors.ink');
}

@media (prefers-reduced-motion: reduce) {
  .tech-link {
    transition: none;
  }
}
</style>
