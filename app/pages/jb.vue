<script setup lang="ts">
// Static route, so it wins the match against `[...slug].vue`. Posts one level
// deeper (/jb/japan-trip) still fall through to the catch-all as before.
definePageMeta({ layout: 'site' })

usePageSeo({
  title: 'Johor Bahru — Isaac Tan',
  description:
    'Writing from the home side of the causeway — travel, the homelab, and life in Johor Bahru.',
  path: '/jb'
})
</script>

<template>
  <WritingIndex
    section="jb"
    label="Johor Bahru"
    title="Notes from the home side of the causeway."
    lede="Travel, the homelab, and whatever else happens on the side of the border I actually sleep on."
    sibling-path="/sg"
    sibling-label="Singapore"
  />
</template>
