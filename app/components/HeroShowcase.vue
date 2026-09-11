<script setup lang="ts">
import type { Component } from 'vue'

/**
 * Decides, once, what the hero visual actually is — the 3D scene or its
 * static equivalent — and never re-decides mid-session. See PRODUCT.md's
 * 2026-09-11 entry: the 3D treatment is an explicit, scoped exception to
 * this site's restraint principle, and it is required to degrade cleanly
 * rather than to cost anything for a reader who won't see it move.
 *
 * The dynamic import below is deliberately an imperative `import()` inside
 * the runtime check, not a declarative `<LazyHeroScene3D>` reference in the
 * template. The declarative form was tried first and rejected: Nuxt's
 * component-prefetch pass sees a `Lazy`-prefixed component anywhere in a
 * page's template and requests its chunk regardless of the `v-if` guarding
 * it, since that analysis happens at build time and can't evaluate a
 * runtime condition — confirmed by network trace, not assumed: a 375px
 * viewport fetched the ~160KB gzipped three.js+gsap chunk despite correctly
 * never rendering it. An `import()` call that only executes after the
 * checks pass has no static template reference for that pass to find, so
 * nothing is fetched until the checks actually say yes.
 */
const showScene = ref(false)
const sceneComponent = shallowRef<Component | null>(null)

onMounted(async () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const wideEnough = window.innerWidth >= 720
  const hasWebGL = (() => {
    try {
      const canvas = document.createElement('canvas')
      return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
    } catch {
      return false
    }
  })()

  if (!reducedMotion && wideEnough && hasWebGL) {
    const mod = await import('./HeroScene3D.vue')
    sceneComponent.value = mod.default
    showScene.value = true
  }
})
</script>

<template>
  <div class="hero-showcase" aria-hidden="true">
    <ClientOnly>
      <component :is="sceneComponent" v-if="showScene && sceneComponent" />
      <HeroLineArt v-else />
      <template #fallback>
        <HeroLineArt />
      </template>
    </ClientOnly>
  </div>
</template>

<style scoped>
.hero-showcase {
  width: 100%;
}
</style>
