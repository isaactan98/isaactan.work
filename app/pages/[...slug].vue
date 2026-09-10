<script setup lang="ts">
const route = useRoute()

const { data: page } = await useAsyncData(`content:${route.path}`, () =>
  queryCollection('content').path(route.path).first()
)

if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: `Page not found: ${route.path}`,
    fatal: true
  })
}

// Lets `<PageHeader>` fall back to the frontmatter title when no `title` prop
// is passed in markdown.
provide('contentPage', page)

usePageSeo({
  title: page.value?.title ?? 'Isaac Tan',
  description: page.value?.description ?? '',
  path: route.path
})
</script>

<template>
  <main class="content-page">
    <article class="content-column">
      <ContentRenderer v-if="page" :value="page" class="prose prose-notion max-w-none" />
    </article>
  </main>
</template>
