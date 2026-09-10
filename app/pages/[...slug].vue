<script setup lang="ts">
/**
 * Content pages take the site layout like everything else.
 *
 * They used to set none, so a cover could run flush to the top of the viewport.
 * That cost more than it bought: a reader arriving from a shared link or a
 * search result had no route into the rest of the site, and because `/jb` and
 * `/sg` do use the layout, navigating into a post swapped layouts mid-flight —
 * the header vanished instantly while the body crossfaded. One layout on both
 * sides makes it a plain page transition. The cover now sits under the header
 * rather than the viewport edge, which is where Notion puts it too.
 */
definePageMeta({ layout: 'site' })

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
      <PostNav :path="route.path" />
    </article>
  </main>
</template>
