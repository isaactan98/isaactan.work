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
 * `prefers-reduced-motion` is something CSS can evaluate at first paint. So
 * the stylesheet below hides the static art in exactly the case where the
 * scene is going to replace it, and that happens before anything is painted.
 * JS is left holding the conditions CSS genuinely cannot test — WebGL support
 * and the visitor's data preference — and its job is to *restore* the art in
 * those exceptional cases, not to introduce it in the normal one.
 *
 * ## Why width picks a strategy rather than gating the scene
 *
 * Width used to be a third gate: below 720px nobody got the scene at all. It
 * is not one any more, and the argument that retired it is a measurement.
 * The showcase slot is ~385px wide on a >=900px viewport (an 820px page
 * column, less padding, times the 1.12/2.12 grid share) and 416px on a
 * tablet. A phone gives it 327-392px. The scene was never getting the room
 * the gate implied it was protecting, so "too small to read" was not the real
 * cost — bytes and battery were, and those are addressed directly now:
 * `prefersLessData` below, and the off-screen render pause in HeroScene3D.
 *
 * What width still decides is the *first-paint* strategy, because the
 * trade-off above genuinely inverts with it:
 *
 * - **Wide.** The art is the wrong picture here, so it is hidden before
 *   anything paints and the slot stays empty until the canvas arrives.
 * - **Narrow.** The art is *not* the wrong picture — it is the same
 *   composition — so it stays up and the canvas dissolves over it. The scene
 *   is mounted at its rest pose (`:entrance="false"`) so both sides of that
 *   dissolve show the same pose. Blanking the slot here would pay the
 *   empty-slot cost for nothing, on the connections that can least afford it.
 *
 * The media query in the stylesheet and the `matchMedia` call here are the
 * same threshold expressed twice and must be kept in sync by hand; there is
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

/**
 * The width at which the first-paint strategy flips — see above. Kept in sync
 * by hand with the media query in this file's stylesheet. Not a gate on the
 * scene: every width that can run WebGL gets it.
 */
const WIDE_VIEWPORT = '(min-width: 720px)'

/**
 * Explicit signals that this visitor does not want ~171KB gzipped of
 * three.js spent on decoration.
 *
 * Deliberately only explicit ones. This switches the hero off outright, so a
 * device-class guess has no business in it — unlike the fidelity step-down
 * inside HeroScene3D, which only costs some sharpness and can afford to be
 * wrong. `effectiveType` is a measurement of the link rather than a guess
 * about the hardware, and on a 2G connection this chunk has stopped being a
 * flourish; the static art is a complete substitute either way.
 *
 * Absent in Safari, which reports no `connection` at all — so this reads as
 * "no objection" there, and the `SLOW_CONNECTION_MS` fallback below is what
 * covers a slow link that never announced itself.
 */
function prefersLessData() {
  const conn = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string }
  }).connection
  if (!conn) return false
  return (
    conn.saveData === true || conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g'
  )
}

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
/**
 * Puts the static art back on a viewport whose CSS has hidden it. A no-op
 * class on a narrow viewport, where the art is visible anyway — which is what
 * lets every failure path below stay one branch instead of two.
 */
const forceArt = ref(false)
/**
 * Whether the scene should perform its entrance. Only where the art was
 * hidden at first paint: on a narrow viewport the canvas is dissolving out of
 * the static drawing, and an entrance would dissolve it into a laptop
 * mid-flight instead of into the same pose.
 */
const playEntrance = ref(true)

let slowTimer: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const artHiddenByCss = window.matchMedia(WIDE_VIEWPORT).matches

  playEntrance.value = artHiddenByCss

  // The one gate left at every width. CSS is already showing the art for it,
  // so there is nothing to restore.
  if (reducedMotion) return

  const hasWebGL = (() => {
    try {
      const canvas = document.createElement('canvas')
      return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
    } catch {
      return false
    }
  })()

  // The conditions CSS can't test. On a wide viewport the slot is currently
  // empty, so failing to handle them would leave a permanent hole; on a
  // narrow one `forceArt` does nothing and the art is simply never replaced.
  if (!hasWebGL || prefersLessData()) {
    forceArt.value = true
    return
  }

  // Only meaningful where the slot is actually empty. On a narrow viewport
  // the art is already up, so there is no gap for this to close.
  if (artHiddenByCss) {
    slowTimer = setTimeout(() => {
      forceArt.value = true
    }, SLOW_CONNECTION_MS)
  }

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

/**
 * The scene lost its GPU context — routine on iOS, where Safari discards
 * contexts on backgrounding and under memory pressure. On a viewport whose
 * CSS has hidden the art, `forceArt` is the only thing that can bring it
 * back, so this is the same recovery as a failed chunk or a missing WebGL
 * implementation, just arriving later.
 */
function onSceneContextLost() {
  sceneVisible.value = false
  forceArt.value = true
}

/** The scene rebuilt itself on a fresh context; hand the slot back to it. */
function onSceneContextRestored() {
  sceneVisible.value = true
  forceArt.value = false
}

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
      <component
        :is="sceneComponent"
        v-if="sceneComponent"
        class="hero-showcase-scene"
        :entrance="playEntrance"
        @contextlost="onSceneContextLost"
        @contextrestored="onSceneContextRestored"
      />
    </ClientOnly>
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

/* The narrow-viewport strategy, and the default: the art is painted, and
   taken away only once the canvas is genuinely up. */
.hero-showcase.scene-in .hero-showcase-art {
  opacity: 0;
}

/* That swap is sequenced rather than cross-dissolved, and a screenshot is why.
   HeroLineArt and HeroScene3D are deliberately the same composition, but they
   were never *registered* to each other: the drawing frames itself inside a
   480x348 viewBox, while the scene's framing is derived at runtime by `fitRig`
   from the geometry's own bounding box plus a 4% pad. Close enough to read as
   one design when you see them one at a time; not close enough to overlap. Held
   at 50/50 you get a second laptop and a second camera visibly offset behind
   the first, which reads as a rendering fault rather than as a transition.

   So the art is given a shorter fade and the canvas waits for it to finish.
   The cost is a brief dip in the middle, which reads as a deliberate swap.
   Scoped to narrow viewports: on a wide one the art is already hidden, there
   is nothing to sequence against, and the delay would only prolong an empty
   slot.

   `not all and (min-width: ...)` rather than a `max-width` with a fudged
   fraction, so it is exactly the complement of the query below at any
   subpixel viewport width. */
@media not all and (min-width: 720px) {
  .hero-showcase-art {
    transition-duration: 150ms;
  }

  .hero-showcase-scene {
    transition: opacity 260ms ease 140ms;
  }
}

/* The wide-viewport strategy: hide the art before anything is painted,
   because here it *is* the wrong picture and a 16.8s flash of it was the
   original defect. The same threshold as the `matchMedia` call in this file's
   script — keep the two in sync by hand. */
@media (min-width: 720px) and (prefers-reduced-motion: no-preference) {
  .hero-showcase-art {
    opacity: 0;
  }

  /* No WebGL, a saved-data or 2G connection, a failed chunk, a lost GPU
     context, or a link slow enough that an empty slot has stopped being
     acceptable. Equal specificity to the `.scene-in` rule above and
     deliberately later, so a recovered failure wins over a stale `scene-in` —
     though in practice the script never sets both at once. */
  .hero-showcase.force-art .hero-showcase-art {
    opacity: 1;
  }
}

/* Without JS the WebGL probe never runs, so `force-art` is never applied and
   the rule above would leave a wide viewport with an empty slot forever.
   This puts the art back for that reader.
 *
 * A `<noscript><style>` inside the template was tried first and is not an
 * option: Vue's client compiler rejects side-effecting tags in a component
 * template outright ("Tags with side effect (<script> and <style>) are
 * ignored in client component templates"). It slipped through review because
 * the production build and the SSR markup both accepted it — only the dev
 * server surfaces the error, so verifying the built output was verifying the
 * wrong half.
 *
 * `scripting` has been Baseline since December 2023. A browser old enough not
 * to know it drops this rule, which leaves it on the JS path — the right
 * outcome, since a browser that predates this feature is overwhelmingly
 * likely to be running JS anyway. */
@media (scripting: none) {
  .hero-showcase-art {
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
