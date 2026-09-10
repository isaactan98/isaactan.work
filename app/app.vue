<template>
  <div class="min-h-screen bg-canvas text-ink">
    <!-- `layouts/site.vue` wraps the hand-written pages so its header stays put
         while the page body transitions. Content pages under `[...slug].vue`
         set no layout, so they render bare and their cover runs flush to the
         top of the viewport. -->
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
