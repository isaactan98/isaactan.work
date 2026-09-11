<script setup lang="ts">
/**
 * The always-available version of the hero: a static line-art laptop and
 * mirrorless camera, in the site's own palette. This is what renders under
 * reduced motion, no WebGL, or a narrow viewport — see PRODUCT.md's
 * 2026-09-11 entry for why the hero gets a 3D/GSAP treatment at all, and why
 * that treatment is required to degrade to exactly this rather than to
 * nothing.
 *
 * Deliberately not photorealistic — thin ink strokes on canvas fill, one
 * signal-green accent per object, same visual language as HomelabDiagram's
 * schematic style. HeroScene3D's geometry follows this same silhouette, so
 * swapping between the two (motion on or off) reads as one design, not two.
 */
</script>

<template>
  <svg
    viewBox="0 0 600 420"
    class="hero-line-art"
    role="img"
    aria-label="Line illustration of a laptop and a mirrorless camera"
  >
    <!-- ---- Laptop ---- -->
    <g class="hla-laptop">
      <!-- base / keyboard deck -->
      <rect x="70" y="280" width="300" height="16" rx="3" class="hla-fill" />
      <path d="M92,280 L110,246 H340 L358,280 Z" class="hla-fill" />
      <rect x="150" y="256" width="80" height="6" rx="3" class="hla-fill-faint" />
      <!-- screen, tilted open -->
      <path d="M112,246 L128,84 H316 L332,246 Z" class="hla-fill" />
      <rect x="140" y="102" width="176" height="118" rx="4" class="hla-screen" />
      <!-- a status bar inside the screen: the site's one accent, doing the
           same job it does everywhere else — marking something as running -->
      <rect x="152" y="196" width="60" height="6" rx="3" class="hla-signal" />
      <rect x="152" y="180" width="110" height="5" rx="2.5" class="hla-fill-faint" />
      <rect x="152" y="166" width="90" height="5" rx="2.5" class="hla-fill-faint" />
    </g>

    <!-- ---- Mirrorless camera ---- -->
    <g class="hla-camera">
      <rect x="358" y="188" width="168" height="102" rx="10" class="hla-fill" />
      <!-- viewfinder hump -->
      <rect x="390" y="168" width="46" height="24" rx="4" class="hla-fill" />
      <!-- grip -->
      <path d="M500,196 q26,4 26,34 v30 q0,14 -18,14 h-8 z" class="hla-fill" />
      <!-- lens -->
      <circle cx="404" cy="240" r="40" class="hla-fill" />
      <circle cx="404" cy="240" r="28" class="hla-lens-inner" />
      <circle cx="404" cy="240" r="16" class="hla-lens-glass" />
      <!-- shutter button -->
      <circle cx="492" cy="204" r="6" class="hla-fill-faint" />
      <!-- power / record indicator — the same accent as the laptop's status
           bar, the diagram's live dots, and nothing else on the page -->
      <circle cx="470" cy="212" r="4" class="hla-signal-dot" />
    </g>
  </svg>
</template>

<style scoped>
.hero-line-art {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.hla-fill {
  fill: theme('colors.canvas');
  stroke: theme('colors.ink');
  stroke-width: 1.5;
  stroke-linejoin: round;
}

.hla-fill-faint {
  fill: theme('colors.line-strong');
  stroke: none;
}

.hla-screen {
  fill: theme('colors.surface');
  stroke: theme('colors.ink');
  stroke-width: 1.5;
}

.hla-signal {
  fill: theme('colors.signal');
  stroke: none;
}

.hla-signal-dot {
  fill: theme('colors.signal');
  stroke: none;
}

.hla-lens-inner {
  fill: theme('colors.canvas');
  stroke: theme('colors.ink');
  stroke-width: 1.25;
}

.hla-lens-glass {
  fill: theme('colors.ink');
  opacity: 0.85;
  stroke: none;
}
</style>
