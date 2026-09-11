<script setup lang="ts">
/**
 * The 3D half of the hero — see PRODUCT.md's 2026-09-11 entry for why this
 * exists and what it's scoped to. Only ever mounted by HeroShowcase once
 * motion is allowed, WebGL works, and the viewport has room; this component
 * doesn't re-check any of that, and has no non-animated fallback of its own
 * on purpose — HeroLineArt is that fallback, one level up.
 *
 * Built as an orthographic, unlit "technical drawing brought into 3D" rather
 * than a lit, perspective attempt at photorealism: flat canvas-coloured
 * faces with ink-coloured edge lines, the same silhouette and palette as
 * HeroLineArt so swapping between the two (motion on vs off) reads as one
 * design. No external model files — the geometry is boxes and cylinders,
 * assembled to read as a laptop and a mirrorless camera at this scale and
 * line treatment, not to survive a close zoom.
 *
 * Colors are hardcoded rather than read from Tailwind: `theme()` only
 * resolves inside compiled CSS, not in a JS canvas context. Keep these in
 * sync with tailwind.config.ts by hand if that file's palette ever changes.
 */
import * as THREE from 'three'
import { gsap } from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(CustomEase)
// The exact curve every reveal on this page already uses
// (`.reveal`, `.section-in`, the diagram's `pop` keyframe) — registered once
// so the hero's entrance moves with the same feel as everything else, not a
// generic GSAP default.
CustomEase.create('siteReveal', '0.16, 1, 0.3, 1')

const CANVAS = 0xfbfbfa
const INK = 0x37352f
const LINE_STRONG = 0xdfdfdd
const SIGNAL = 0x4a8f5b

const root = ref<HTMLDivElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
let resizeObserver: ResizeObserver | null = null
let tickerFn: (() => void) | null = null
let idleTween: gsap.core.Tween | null = null
let entranceTl: gsap.core.Timeline | null = null

/**
 * A solid face plus its own edge outline, matching HeroLineArt's fill+stroke
 * look. `polygonOffset` pushes the solid faces back a hair in depth so they
 * don't z-fight with the edge lines sharing near-identical geometry — without
 * it, coplanar faces and edges flicker/dash where the depth buffer can't
 * tell which was meant to win.
 */
function edged(geometry: THREE.BufferGeometry, color = CANVAS): THREE.Group {
  const group = new THREE.Group()
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })
  )
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: INK })
  )
  group.add(mesh, edges)
  return group
}

function buildLaptop(): THREE.Group {
  const laptop = new THREE.Group()

  const base = edged(new THREE.BoxGeometry(2.6, 0.14, 1.6))
  base.position.y = 0.07
  laptop.add(base)

  // Hinge sits at the back edge of the base so rotating it opens the screen
  // from a real pivot rather than swinging around its own center.
  const hinge = new THREE.Group()
  hinge.position.set(0, 0.14, -0.78)
  laptop.add(hinge)

  const screen = edged(new THREE.BoxGeometry(2.6, 1.7, 0.06))
  screen.position.y = 0.85
  hinge.add(screen)

  // A thin display bezel and the one signal accent this scene allows itself —
  // same job it does everywhere else on the site: marking something as on.
  const display = edged(new THREE.BoxGeometry(2.3, 1.4, 0.02), 0xffffff)
  display.position.set(0, 0.87, 0.035)
  hinge.add(display)

  const statusBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.09, 0.01),
    new THREE.MeshBasicMaterial({ color: SIGNAL })
  )
  statusBar.position.set(-0.55, 0.35, 0.045)
  hinge.add(statusBar)

  const line1 = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.06, 0.01),
    new THREE.MeshBasicMaterial({ color: LINE_STRONG })
  )
  line1.position.set(-0.35, 0.55, 0.045)
  hinge.add(line1)

  hinge.userData.isHinge = true
  laptop.userData.hinge = hinge
  return laptop
}

function buildCamera(): THREE.Group {
  const cam = new THREE.Group()

  const body = edged(new THREE.BoxGeometry(1.7, 1.0, 0.9))
  cam.add(body)

  const viewfinder = edged(new THREE.BoxGeometry(0.5, 0.26, 0.5))
  viewfinder.position.set(-0.35, 0.63, -0.05)
  cam.add(viewfinder)

  const grip = edged(new THREE.BoxGeometry(0.3, 1.0, 0.85))
  grip.position.set(0.98, -0.02, 0)
  cam.add(grip)

  const lensOuter = edged(
    new THREE.CylinderGeometry(0.42, 0.42, 0.55, 20).rotateX(Math.PI / 2)
  )
  lensOuter.position.set(-0.25, -0.02, 0.6)
  cam.add(lensOuter)

  const lensGlass = new THREE.Mesh(
    new THREE.CircleGeometry(0.24, 20),
    new THREE.MeshBasicMaterial({ color: INK })
  )
  lensGlass.position.set(-0.25, -0.02, 0.88)
  cam.add(lensGlass)

  const shutter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.05, 12),
    new THREE.MeshBasicMaterial({ color: LINE_STRONG })
  )
  shutter.position.set(0.55, 0.52, 0.3)
  cam.add(shutter)

  const indicator = new THREE.Mesh(
    new THREE.CircleGeometry(0.045, 12),
    new THREE.MeshBasicMaterial({ color: SIGNAL })
  )
  indicator.position.set(0.15, 0.32, 0.451)
  cam.add(indicator)

  return cam
}

function resize() {
  if (!renderer || !camera || !root.value) return
  const w = root.value.clientWidth
  const h = root.value.clientHeight
  if (w === 0 || h === 0) return
  const aspect = w / h
  const viewSize = 3.4
  camera.left = (-viewSize * aspect) / 2
  camera.right = (viewSize * aspect) / 2
  camera.top = viewSize / 2
  camera.bottom = -viewSize / 2
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

onMounted(() => {
  if (!root.value) return

  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20)
  camera.position.set(3.6, 2.3, 4.2)
  camera.lookAt(0, 0.3, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  root.value.appendChild(renderer.domElement)

  const rig = new THREE.Group()
  scene.add(rig)

  // Positions and scale are hand-tuned, not translated from HeroLineArt's 2D
  // layout — offsets that read as "side by side, not touching" in a flat SVG
  // overlap once real depth and a 3/4 view are involved. The camera sits
  // smaller, lower, and pulled forward (+Z) of the laptop so the two read as
  // foreground/background rather than two same-size shapes competing.
  const laptop = buildLaptop()
  laptop.position.set(-1.55, 0, -0.2)
  rig.add(laptop)

  const cam3d = buildCamera()
  cam3d.scale.setScalar(0.78)
  cam3d.position.set(1.7, -0.32, 0.75)
  cam3d.rotation.y = -0.3
  rig.add(cam3d)

  resize()
  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(root.value)

  // ---- Entrance: parts settle into place, screen opens ----
  // Hinge angle reference: the screen mesh extends along the hinge's local
  // +Y when rotation.x is 0 (screen upright, ~vertical). Rotating +X tips it
  // forward toward +Z, onto the base — that's "closed" at rotation.x ≈ π/2.
  // A natural open laptop rests a little *past* vertical, reclined toward
  // the viewer, which is a small *negative* angle here — not the large
  // negative sweep an earlier version of this used, which read as the
  // screen swinging almost flat.
  const HINGE_CLOSED = Math.PI / 2 - 0.18
  const HINGE_OPEN = -0.16
  const hinge = laptop.userData.hinge as THREE.Group

  // Capture the *actual* resting values set above rather than duplicating
  // them as separate literals here — two copies of the same number drift the
  // moment one of them is retuned (as happened once already while getting
  // the composition right) and the entrance quietly stops matching the rest
  // pose it's supposed to arrive at.
  const laptopRestY = laptop.position.y
  const camRestY = cam3d.position.y
  const camRestRotY = cam3d.rotation.y

  hinge.rotation.x = HINGE_CLOSED
  laptop.position.y = laptopRestY - 0.3
  laptop.scale.setScalar(0.85)
  cam3d.position.y = camRestY - 0.5
  cam3d.rotation.y = -1.1
  rig.scale.setScalar(0.001) // avoid a one-frame flash of the resting pose

  entranceTl = gsap.timeline({ delay: 0.15 })
  entranceTl
    .to(rig.scale, { x: 1, y: 1, z: 1, duration: 0.01 })
    .to(laptop.position, { y: laptopRestY, duration: 1.1, ease: 'siteReveal' }, 0)
    .to(laptop.scale, { x: 1, y: 1, z: 1, duration: 1.1, ease: 'siteReveal' }, 0)
    .to(hinge.rotation, { x: HINGE_OPEN, duration: 1.0, ease: 'siteReveal' }, 0.15)
    .to(cam3d.position, { y: camRestY, duration: 1.05, ease: 'siteReveal' }, 0.25)
    .to(cam3d.rotation, { y: camRestRotY, duration: 1.05, ease: 'siteReveal' }, 0.25)
    .add(() => {
      // Idle: a slow sway, not a full turntable. A complete rotation was
      // tried and rejected — the laptop screen is a thin plane, and a full
      // spin necessarily crosses a near-edge-on angle where it visually
      // disappears, plus an angle where the camera's lens faces away and it
      // reads as a featureless block. ±22° stays inside the range this
      // scene's actual resting angle was tuned for, verified by screenshot
      // rather than assumed.
      idleTween = gsap.to(rig.rotation, {
        y: `+=${THREE.MathUtils.degToRad(22)}`,
        duration: 9,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      })
    })

  tickerFn = () => {
    if (renderer && scene && camera) renderer.render(scene, camera)
  }
  gsap.ticker.add(tickerFn)
})

onUnmounted(() => {
  if (tickerFn) gsap.ticker.remove(tickerFn)
  entranceTl?.kill()
  idleTween?.kill()
  resizeObserver?.disconnect()

  scene?.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
      obj.geometry?.dispose()
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      mats.forEach((m) => m?.dispose())
    }
  })
  renderer?.dispose()
  renderer?.domElement.remove()
  renderer = null
  scene = null
  camera = null
})
</script>

<template>
  <div ref="root" class="hero-scene" />
</template>

<style scoped>
.hero-scene {
  width: 100%;
  aspect-ratio: 600 / 420;
}

.hero-scene :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
