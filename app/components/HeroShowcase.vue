<script setup lang="ts">
import type { Component } from 'vue'

/**
 * Decides, once, what the hero visual actually is — the 3D scene or its
 * static equivalent — and never re-decides mid-session. See PRODUCT.md's
 * 2026-09-11 entry: the 3D treatment is an explicit, scoped exception to
 * this site's restraint principle, and it is required to degrade cleanly
 * rather than to cost anything for a reader who won't see it move.
 *
 * ## Why the decision is made in CSS, not here
 *
 * The obvious shape — render the static art, then swap it for the scene once
 * JS has checked the viewport and fetched the chunk — is what this component
 * used to do, and it was wrong. Everything JS decides happens after first
 * paint, so a desktop visitor was shown the phone artwork for the whole of
 * hydration plus the chunk fetch. Measured against the production build on a
 * 1.6 Mbps connection: the static art was on screen for **16.8 seconds**
 * before the canvas took over. Even on a fast link it is a visible flash of
 * the wrong picture.
 *
 * Two of the three conditions that gate the 3D scene — viewport width and
 * `prefers-reduced-motion` — are things CSS can evaluate at first paint. So
 * the stylesheet below hides the static art in exactly the case where the
 * scene is going to replace it, and that happens before anything is painted.
 * JS is left holding only the condition CSS genuinely cannot test (WebGL
 * support), and its job is now to *restore* the art in the exceptional cases,
 * not to introduce it in the normal one.
 *
 * The media query in the stylesheet and the `matchMedia` calls here are the
 * same condition expressed twice and must be kept in sync by hand; there is
 * no way to share one source between a stylesheet and a script. They are
 * written adjacently and both flagged for that reason.
 *
 * ## Why the import is imperative
 *
 * The dynamic import below is deliberately an imperative `import()` inside
 * the runtime check, not a declarative `<LazyHeroScene3D>` reference in the
 * template. The declarative form was tried first and rejected: Nuxt's
 * component-prefetch pass sees a `Lazy`-prefixed component anywhere in a
 * page's template and requests its chunk regardless of the `v-if` guarding
 * it, since that analysis happens at build time and can't evaluate a runtime
 * condition — confirmed by network trace, not assumed: a 375px viewport
 * fetched the ~174KB gzipped three.js+gsap chunk despite correctly never
 * rendering it. An `import()` call that only executes after the checks pass
 * has no static template reference for that pass to find.
 */

/** Kept in sync by hand with the media query in this file's stylesheet. */
const SCENE_MIN_WIDTH = '(min-width: 720px)'

/**
 * How long an empty hero slot is acceptable before the static art is shown
 * after all. Leaving decorative space blank is the right call for the few
 * hundred milliseconds a normal connection needs; leaving it blank for the
 * sixteen seconds measured above is not. On a link that slow the line art is
 * the better answer, and the scene crossfades over it whenever it lands.
 */
const SLOW_CONNECTION_MS = 2000

const sceneComponent = shallowRef<Component | null>(null)
const sceneVisible = ref(false)
/** Puts the static art back on a viewport whose CSS has hidden it. */
const forceArt = ref(false)

let slowTimer: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const wideEnough = window.matchMedia(SCENE_MIN_WIDTH).matches

  // CSS is already showing the art for these two, so there is nothing to do.
  if (reducedMotion || !wideEnough) return

  const hasWebGL = (() => {
    try {
      const canvas = document.createElement('canvas')
      return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
    } catch {
      return false
    }
  })()

  // The one condition CSS can't test. The slot is currently empty on this
  // viewport, so failing to handle it would leave a permanent hole.
  if (!hasWebGL) {
    forceArt.value = true
    return
  }

  slowTimer = setTimeout(() => {
    forceArt.value = true
  }, SLOW_CONNECTION_MS)

  try {
    const mod = await import('./HeroScene3D.vue')
    sceneComponent.value = mod.default
    // A frame for the canvas to exist before it is faded up, so the
    // crossfade actually animates instead of snapping.
    await nextTick()
    requestAnimationFrame(() => {
      sceneVisible.value = true
      forceArt.value = false
    })
  } catch {
    // Chunk failed outright — an empty slot forever is the one outcome that
    // is worse than showing the phone artwork on a desktop.
    forceArt.value = true
  } finally {
    if (slowTimer) clearTimeout(slowTimer)
    slowTimer = null
  }
})

onUnmounted(() => {
  if (slowTimer) clearTimeout(slowTimer)
})
</script>

<template>
  <div
    class="hero-showcase"
    :class="{ 'force-art': forceArt, 'scene-in': sceneVisible }"
    aria-hidden="true"
  >
    <!-- Always in the document, never conditionally rendered. It is what
         reserves the slot's height, so the canvas arriving later cannot shift
         the page, and it is what a reader with no JS keeps. -->
    <HeroLineArt class="hero-showcase-art" />
    <ClientOnly>
      <component :is="sceneComponent" v-if="sceneComponent" class="hero-showcase-scene" />
    </ClientOnly>
    <!-- Without JS the WebGL probe never runs, so the class that restores the
         art on a wide viewport is never applied. This is the only way to put
         it back for that reader; it is a plain global rule because scoped-
         style rewriting does not reach inside noscript. -->
    <noscript>
      <style>
        .hero-showcase-art { opacity: 1 !important; }
      </style>
    </noscript>
  </div>
</template>

<style scoped>
.hero-showcase {
  position: relative;
  width: 100%;
}

/* Hidden with opacity rather than `display` or `visibility`: the element has
   to keep occupying its box so it goes on reserving the slot's height for the
   canvas that is about to be laid over it. */
.hero-showcase-art {
  transition: opacity 300ms ease;
}

/* The same condition as the `matchMedia` calls in this file's script — the
   case where the 3D scene is going to replace this art. Evaluated at first
   paint, which is the entire point: JS cannot hide something before it has
   already been shown. Keep the two in sync by hand. */
@media (min-width: 720px) and (prefers-reduced-motion: no-preference) {
  .hero-showcase-art {
    opacity: 0;
  }

  /* No WebGL, a failed chunk, or a connection slow enough that an empty slot
     has stopped being acceptable. */
  .hero-showcase.force-art .hero-showcase-art {
    opacity: 1;
  }
}

.hero-showcase-scene {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 300ms ease;
}

.hero-showcase.scene-in .hero-showcase-scene {
  opacity: 1;
}
</style>
