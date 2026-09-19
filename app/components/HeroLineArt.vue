<script setup lang="ts">
/**
 * The always-available version of the hero: a static line-art laptop and
 * mirrorless camera, in the site's own palette. This is what renders under
 * reduced motion, with no WebGL, on a saved-data or 2G connection, and after
 * a lost GPU context — see PRODUCT.md's 2026-09-11 and 2026-09-19 entries for
 * why the hero gets a 3D/GSAP treatment at all, and why that treatment is
 * required to degrade to exactly this rather than to nothing.
 *
 * It is also the first thing every narrow viewport paints, and what the 3D
 * canvas dissolves out of there — so on a phone this drawing is always seen,
 * whether or not the scene follows it. It no longer has the *exclusive* claim
 * on phones it was first written for (they get the scene now too), but it is
 * still sized for them rather than shrunk down from a desktop illustration,
 * and that matters more than before: the crossfade puts it side by side with
 * the 3D version at the same size, where any softness would be obvious. Two
 * things follow, and both were real defects in the first version:
 *
 * 1. The viewBox is close to the delivered pixel size. The old one was
 *    600×420 rendering into ~343px, a 0.57 scale factor that quietly took
 *    every 1.5-unit stroke down to 0.86 device pixels — sub-pixel, grey, and
 *    mushy. Here one unit is roughly one delivered pixel on a phone.
 * 2. The two objects overlap deliberately and are drawn at clearly different
 *    sizes, with the camera in front occluding the laptop behind it. The old
 *    version butted them edge to edge at near-identical scale, which reads as
 *    one ambiguous blob rather than two objects on a desk.
 *
 * Deliberately not photorealistic — thin ink strokes on canvas fill, one
 * signal-green accent per object, same visual language as HomelabDiagram's
 * schematic style. HeroScene3D builds the same composition in 3D (laptop
 * three-quarter from the left, camera in front and to the right, both on one
 * ground plane), so swapping between the two reads as one design, not two.
 */
</script>

<template>
  <svg
    viewBox="0 0 480 348"
    class="hero-line-art"
    role="img"
    aria-label="Line illustration of an open laptop with a mirrorless camera resting in front of it"
  >
    <!-- Ground shade: the same job the contact shadows do in the 3D scene —
         without it both objects float, and "floating" is most of why the
         first version read as clip-art rather than things on a desk. -->
    <ellipse cx="215" cy="292" rx="180" ry="26" class="hla-shade" />
    <ellipse cx="372" cy="330" rx="88" ry="16" class="hla-shade" />

    <!-- ---- Laptop: three-quarter from the left ---- -->
    <g class="hla-laptop">
      <!-- Lid, tilted back from the hinge along the base's back edge -->
      <path d="M96 206 L114 54 H362 L346 214 Z" class="hla-fill" />
      <!-- Display inset -->
      <path d="M112 194 L127 70 H347 L333 202 Z" class="hla-screen" />
      <!-- Screen furniture: a sidebar, code-ish lines, and the one accent,
           matching what the 3D scene draws onto its display texture. -->
      <path d="M129 88 H160 M127 106 H155 M125 124 H158 M123 142 H152" class="hla-ui-faint" />
      <path
        d="M176 88 H268 M174 106 H246 M172 124 H262 M168 160 H240 M166 178 H258"
        class="hla-ui-faint"
      />
      <path d="M170 142 H252" class="hla-ui-signal" />

      <!-- Base: top deck, then its front edge to give the slab thickness -->
      <path d="M96 206 L38 258 L288 272 L346 214 Z" class="hla-fill" />
      <path d="M38 258 V270 L288 284 V272 Z" class="hla-fill-side" />

      <!-- Keyboard: rows of keys as short strokes running with the deck's
           perspective. Individual keys would be sub-pixel here; the row
           rhythm is what actually says "keyboard". -->
      <g class="hla-keys">
        <path d="M104 222 L282 232" />
        <path d="M98 232 L276 242" />
        <path d="M92 242 L270 252" />
        <path d="M86 252 L264 262" />
      </g>
      <!-- Trackpad -->
      <path d="M132 258 L104 262 L156 266 L184 262 Z" class="hla-trackpad" />
    </g>

    <!-- ---- Mirrorless camera, in front and to the right ---- -->
    <!-- Drawn after the laptop so its canvas-filled body occludes the base
         corner behind it. That occlusion is the depth cue; without it the two
         objects sit side by side on the same plane and the composition
         flattens. -->
    <g class="hla-camera">
      <!-- Viewfinder hump and hot shoe -->
      <path d="M332 250 L338 236 H368 L374 250 Z" class="hla-fill" />
      <rect x="341" y="230" width="24" height="7" rx="2" class="hla-fill" />
      <!-- Body, with the grip bulging off its right side -->
      <path
        d="M306 250 H430 q16 0 20 14 q6 20 0 40 q-4 14 -20 14 H306 q-8 0 -8 -8 v-52 q0 -8 8 -8 Z"
        class="hla-fill"
      />
      <!-- Mode dial -->
      <ellipse cx="420" cy="246" rx="15" ry="6" class="hla-fill" />
      <path d="M405 246 v4 a15 6 0 0 0 30 0 v-4" class="hla-fill" />
      <!-- Lens: a barrel, not three flat discs. The stepped rings and the
           knurling on the focus ring are what make this read as a lens at
           phone size — the previous version's plain concentric circles read
           as a target. -->
      <circle cx="348" cy="284" r="38" class="hla-fill" />
      <circle cx="348" cy="284" r="31" class="hla-fill" />
      <!-- Focus-ring knurling as a dashed stroke band rather than radial
           tick marks. The ticks were tried first and read as gear teeth:
           drawn at the barrel's outer edge with gaps between them, the eye
           resolves the silhouette as a cog, not a grip texture. A dashed
           band sits inside the barrel where knurling actually is. -->
      <circle cx="348" cy="284" r="27" class="hla-knurl-ring" />
      <circle cx="348" cy="284" r="23" class="hla-fill" />
      <circle cx="348" cy="284" r="14" class="hla-lens-glass" />
      <circle cx="342" cy="278" r="5" class="hla-lens-spec" />
      <!-- Shutter release on the grip shoulder -->
      <ellipse cx="424" cy="262" rx="7" ry="4" class="hla-fill-faint" />
      <!-- Record indicator — the same accent as the laptop's status line, the
           diagram's live dots, and nothing else on the page -->
      <circle cx="404" cy="300" r="5" class="hla-signal-dot" />
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
  stroke-width: 2;
  stroke-linejoin: round;
}

/* The slab's front edge: filled a step darker so the base reads as having
   thickness, the same top-vs-side separation the 3D scene gets from its
   lighting rather than from an outline. */
.hla-fill-side {
  fill: theme('colors.line');
  stroke: theme('colors.ink');
  stroke-width: 2;
  stroke-linejoin: round;
}

.hla-fill-faint {
  fill: theme('colors.line-strong');
  stroke: theme('colors.ink');
  stroke-width: 1.5;
}

.hla-screen {
  fill: theme('colors.surface');
  stroke: theme('colors.ink');
  stroke-width: 2;
  stroke-linejoin: round;
}

.hla-shade {
  fill: theme('colors.ink');
  opacity: 0.05;
}

.hla-ui-faint {
  stroke: theme('colors.line-strong');
  stroke-width: 5;
  stroke-linecap: round;
  fill: none;
}

.hla-ui-signal {
  stroke: theme('colors.signal');
  stroke-width: 5;
  stroke-linecap: round;
  fill: none;
}

/* Dashed, so each row resolves into individual keycaps. Drawn as solid bars
   the rows read as ruled lines — the same "generic slab" problem the keyboard
   is there to solve. */
.hla-keys path {
  stroke: theme('colors.line-strong');
  stroke-width: 6;
  stroke-dasharray: 10 4;
  fill: none;
}

.hla-trackpad {
  fill: none;
  stroke: theme('colors.line-strong');
  stroke-width: 2;
  stroke-linejoin: round;
}

.hla-knurl-ring {
  fill: none;
  stroke: theme('colors.line-strong');
  stroke-width: 7;
  stroke-dasharray: 2 4.5;
}

.hla-lens-glass {
  fill: theme('colors.ink');
  stroke: none;
}

.hla-lens-spec {
  fill: theme('colors.surface');
  opacity: 0.22;
  stroke: none;
}

.hla-signal-dot {
  fill: theme('colors.signal');
  stroke: none;
}
</style>
