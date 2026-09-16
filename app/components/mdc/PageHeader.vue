<script setup lang="ts">
import type { Ref } from 'vue'

const props = defineProps<{
  cover?: string
  icon?: string
  title?: string
}>()

/**
 * `title` is optional in markdown usage — when it is omitted we fall back to the
 * frontmatter title provided by the page that renders this content.
 */
const page = inject<Ref<{ title?: string } | null> | null>('contentPage', null)
const heading = computed(() => props.title || page?.value?.title || '')

const coverFailed = ref(false)
</script>

<template>
  <header data-notion-block class="not-prose page-header" :class="{ 'has-cover': cover }">
    <div
      v-if="cover"
      class="full-bleed relative h-[30vh] min-h-[180px] overflow-hidden bg-gradient-to-br from-[#e3e8ef] via-[#eceef2] to-[#dfe4ec] dark:from-[#1f2630] dark:via-[#232a33] dark:to-[#1b212a]"
    >
      <img
        v-show="!coverFailed"
        :src="cover"
        alt=""
        class="h-full w-full object-cover"
        @error="coverFailed = true"
      >
    </div>

    <div v-if="icon" class="relative" :class="cover ? '-mt-[2.125rem] mb-1' : 'mb-1 pt-2'">
      <span
        class="inline-flex h-[68px] w-[68px] select-none items-center justify-center text-[56px] leading-none"
        role="img"
        :aria-label="heading"
      >{{ icon }}</span>
    </div>

    <h1
      class="text-[2.5rem] font-bold leading-[1.2] tracking-[-0.02em] text-ink"
      :class="cover || icon ? 'mt-1' : 'mt-0'"
    >
      {{ heading }}
    </h1>
  </header>
</template>

<style scoped>
.page-header {
  margin-bottom: 1.5rem;
}
/* Pull a cover flush to the top of the page, cancelling the article's top padding. */
.page-header.has-cover {
  margin-top: calc(-1 * var(--page-top-padding, 0px));
}
</style>
