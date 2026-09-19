<script setup lang="ts">
/**
 * The 3D half of the hero — see PRODUCT.md's 2026-09-11 entry for why this
 * exists and what it's scoped to. Only ever mounted by HeroShowcase once
 * motion is allowed, WebGL works, and the viewport has room; this component
 * doesn't re-check any of that, and has no non-animated fallback of its own
 * on purpose — HeroLineArt is that fallback, one level up.
 *
 * Built as an orthographic "technical drawing brought into 3D": pale
 * canvas-coloured surfaces with ink edge lines, the same silhouette and
 * palette as HeroLineArt so swapping between the two (motion on vs off)
 * reads as one design. Deliberately NOT an imported photoreal model —
 * a textured PBR laptop is measured in megabytes (the Khronos sample
 * camera asset is 17.5MB), needs CC-BY attribution printed under a
 * decorative graphic, and a stock chrome MacBook looks like every template
 * on the internet. All geometry here is generated at runtime and costs
 * nothing beyond the three.js bundle itself.
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

/**
 * The scene's palette, rebuilt from the page's own custom properties whenever
 * the appearance changes.
 *
 * A WebGL context can't use `theme()` or a CSS variable directly, so these are
 * read out of the document with `getComputedStyle` and handed to three.js as
 * colours. That keeps the one palette in app/assets/css/tailwind.css
 * authoritative for the canvas too, instead of a second copy drifting in here
 * — which is exactly what the previous version of this file warned about and
 * could not avoid.
 *
 * `signal` is taken straight from the page. The face and edge tones are not:
 * they are scene-specific, because they exist to be multiplied by the lights
 * below rather than displayed as written, so they are derived here where the
 * lighting math also lives.
 */
type ScenePalette = ReturnType<typeof readPalette>

function readPalette(dark: boolean) {
  const cs = getComputedStyle(document.documentElement)
  const token = (name: string) => new THREE.Color(cs.getPropertyValue(name).trim() || '#000000')

  return {
    dark,
    signal: token('--c-signal'),

    /**
     * Face tone sits where the lights can bring it to the intended value, not
     * at the intended value itself.
     *
     * Light: #f7f7f5 lands an up-facing surface at #e2e2e0, a shade under the
     * page so the object reads as sitting *on* paper. Any lighter and the top
     * faces clip to flat white and the geometry loses its form.
     *
     * Dark: #5a5a56 lands the same surface at #52524e — 2.24:1 against the
     * #191918 canvas, where light mode only needs 1.25:1. A dark ground gives
     * an object nothing to catch, so it has to lift further off the page to
     * read at all; matching light mode's separation here would leave the
     * laptop as a barely-visible smudge.
     */
    face: new THREE.Color(dark ? '#5a5a56' : '#f7f7f5'),
    faceDark: new THREE.Color(dark ? '#484844' : '#e6e6e3'),

    /**
     * Edge lines invert with the appearance: ink on pale faces in light, a
     * light line on dark faces in dark. Dark uses the page's own ink-muted
     * rather than ink — full ink against these faces reads as a neon
     * wireframe, where ink-muted lands at 3.2:1 on the top faces and 4.0:1 on
     * the sides: clearly drawn, still a drawing.
     */
    edge: dark ? token('--c-ink-muted') : token('--c-ink'),

    /** The lens's front element. Near-black in both, since glass is glass. */
    glass: new THREE.Color(dark ? '#141413' : '#2c2b27'),

    screen: {
      bg: dark ? '#1c1c1b' : '#ffffff',
      chrome: dark ? '#242423' : '#f4f4f2',
      dot: dark ? '#3a3a37' : '#dfdfdd',
      sidebar: dark ? '#191918' : '#fbfbfa',
      sidebarLine: dark ? '#2e2e2b' : '#e9e9e7',
      codeLine: dark ? '#35352f' : '#e3e3e0',
      accent: cs.getPropertyValue('--c-signal').trim() || '#4a8f5b'
    },

    keyboard: {
      deck: dark ? '#3d3d3a' : '#f2f2f0',
      key: dark ? '#2a2a28' : '#dcdcd9'
    },

    /**
     * Contact shadow. #191918 is not pure black, so a black pool still reads
     * against it — but only just, which is why dark runs at roughly twice the
     * alpha of light.
     */
    shadow: dark ? '0,0,0' : '55,53,47',
    shadowAlpha: dark ? 1.9 : 1
  }
}

let palette: ScenePalette

/**
 * EdgesGeometry only emits an edge where the angle between the two faces
 * sharing it exceeds this threshold. The default (1°) is right for boxes,
 * whose corners are 90°, but catastrophic for anything radial: a 24-segment
 * cylinder has 24 seams at 15° apart, every one of which clears 1° and draws
 * a line. That is precisely why the previous version of this scene's lens
 * read as a ribbed washing-machine drum rather than a lens barrel. 25° keeps
 * the real profile steps and drops the tessellation seams.
 */
const ROUND_EDGE_THRESHOLD = 25

/**
 * How far the idle sway turns the rig. Shared with `fitRig` rather than
 * living only in the tween, because the framing has to account for the
 * widest angle the composition is ever shown at — see the note there.
 */
const SWAY_RAD = THREE.MathUtils.degToRad(18)

/**
 * The two states this component cannot recover from on its own, reported so
 * the showcase one level up can put the static art back. The showcase owns
 * that fallback; this component only knows whether it still has a GPU to
 * draw on.
 */
const emit = defineEmits<{ contextlost: []; contextrestored: [] }>()

const root = ref<HTMLDivElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
let resizeObserver: ResizeObserver | null = null
let intersectionObserver: IntersectionObserver | null = null
let tickerFn: (() => void) | null = null
let idleTween: gsap.core.Tween | null = null
let entranceTl: gsap.core.Timeline | null = null
let shadowTexture: THREE.CanvasTexture | null = null
const disposableTextures: THREE.Texture[] = []

/**
 * Whether the hero is currently near the viewport.
 *
 * Starts `true` so the opening frames always draw: IntersectionObserver's
 * first callback is asynchronous, and defaulting to "not visible" would leave
 * the slot blank for however long it takes to arrive. Every gate around
 * rendering fails toward drawing for that reason — the same argument
 * app/assets/css/tailwind.css makes for why the section reveals are CSS
 * animations rather than observer callbacks.
 */
let inView = true

/**
 * Set between `webglcontextlost` and `webglcontextrestored`. Guards the
 * rebuild, so a restore delivered twice cannot build a second scene on top of
 * the first.
 */
let contextLost = false

/**
 * How far outside the viewport the scene keeps drawing. Enough that scrolling
 * back up finds it already running, rather than watching it resume on the
 * frame it reappears.
 */
const RENDER_MARGIN = '200px'

/** Half-extents of the rest pose in camera-screen space, filled once by `fitRig`. */
let fitHalfWidth = 1
let fitHalfHeight = 1

/**
 * A lit surface plus its own ink outline — the fill+stroke look HeroLineArt
 * uses, in 3D. `polygonOffset` pushes solid faces back a hair in depth so
 * they don't z-fight with edge lines sharing near-identical geometry; without
 * it, coplanar faces and edges flicker where the depth buffer can't tell
 * which was meant to win.
 *
 * Lambert rather than Basic: flat unlit fills gave every face of a box the
 * same value, so the box had no form at all and depended entirely on its
 * outline to be legible. Lambert with the rig lighting below separates top
 * from side from front while keeping the palette pale — no speculars, no
 * environment map, nothing that would drag this toward a product render.
 */
function edged(
  geometry: THREE.BufferGeometry,
  color?: THREE.Color,
  threshold = 1
): THREE.Group {
  const group = new THREE.Group()
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshLambertMaterial({
      color: color ?? palette.face,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    })
  )
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, threshold),
    new THREE.LineBasicMaterial({ color: palette.edge })
  )
  group.add(mesh, edges)
  return group
}

/** An unlit detail chip — status bars, indicator dots, screen furniture. */
function flat(geometry: THREE.BufferGeometry, color: THREE.Color): THREE.Mesh {
  return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color }))
}

/**
 * Soft contact shadow: one radial-gradient sprite laid flat on the ground,
 * reused for both objects. This is the single cheapest thing that makes
 * runtime geometry stop looking like floating clip-art — without a shadow
 * there is nothing telling the eye the objects share a surface, which is
 * most of why the previous version read as two unrelated shapes in a void.
 * A real shadow map would need a light, a receiving plane and per-frame
 * depth passes for a blur this scene could just draw once into a canvas.
 */
type ShadowMesh = THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>

function shadowSprite(width: number, depth: number, opacity: number): ShadowMesh {
  if (!shadowTexture) {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    const { shadow: rgb, shadowAlpha: a } = palette
    gradient.addColorStop(0, `rgba(${rgb},${Math.min(1, 0.55 * a)})`)
    gradient.addColorStop(0.45, `rgba(${rgb},${Math.min(1, 0.22 * a)})`)
    gradient.addColorStop(1, `rgba(${rgb},0)`)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
    shadowTexture = new THREE.CanvasTexture(canvas)
    shadowTexture.colorSpace = THREE.SRGBColorSpace
    disposableTextures.push(shadowTexture)
  }

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity,
      depthWrite: false
    })
  )
  mesh.rotation.x = -Math.PI / 2
  mesh.renderOrder = -1
  return mesh
}

/** Faint code-editor furniture on the laptop screen, in the site's palette. */
function screenTexture(): THREE.CanvasTexture {
  const w = 512
  const h = 340
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const sc = palette.screen
  ctx.fillStyle = sc.bg
  ctx.fillRect(0, 0, w, h)

  // Title bar with the three window dots — one glyph everyone reads as
  // "a real window" without needing to resolve any text.
  ctx.fillStyle = sc.chrome
  ctx.fillRect(0, 0, w, 28)
  ctx.fillStyle = sc.dot
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.arc(20 + i * 18, 14, 5, 0, Math.PI * 2)
    ctx.fill()
  }

  // Sidebar
  ctx.fillStyle = sc.sidebar
  ctx.fillRect(0, 28, 104, h - 28)
  ctx.fillStyle = sc.sidebarLine
  for (let i = 0; i < 7; i++) ctx.fillRect(16, 50 + i * 26, 60 - (i % 3) * 12, 6)

  // Code lines: indentation varied so it scans as code, not as a paragraph.
  const indents = [0, 0, 1, 2, 2, 1, 0, 1, 2, 3, 2, 1]
  const widths = [180, 240, 150, 210, 120, 260, 90, 200, 160, 130, 220, 100]
  ctx.fillStyle = sc.codeLine
  indents.forEach((indent, i) => {
    ctx.fillRect(128 + indent * 18, 52 + i * 22, widths[i]!, 7)
  })

  // The site's one accent, doing the same job it does everywhere else on the
  // page: marking something as running.
  ctx.fillStyle = sc.accent
  ctx.fillRect(128, 52 + 5 * 22, 150, 7)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  disposableTextures.push(texture)
  return texture
}

/**
 * Keyboard deck drawn as a texture rather than ~70 key meshes. At this scale
 * individual key geometry would be sub-pixel mush *and* ~70 extra draw calls
 * plus 70 EdgesGeometry line sets; a single 512×256 canvas costs one.
 */
function keyboardTexture(): THREE.CanvasTexture {
  const w = 512
  const h = 232
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = palette.keyboard.deck
  ctx.fillRect(0, 0, w, h)

  // `roundRect` is recent enough (Safari 16, Firefox 112) that a visitor on an
  // older browser could otherwise throw here — and a throw inside onMounted
  // takes the whole scene down, not just the keycaps. Square keys are a fine
  // degradation; a blank hero is not.
  const key = (x: number, y: number, kw: number, kh: number) => {
    ctx.beginPath()
    if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, kw, kh, 3)
    else ctx.rect(x, y, kw, kh)
    ctx.fill()
  }

  ctx.fillStyle = palette.keyboard.key
  const rows = [
    { y: 16, h: 16, count: 14 },
    { y: 40, h: 24, count: 14 },
    { y: 70, h: 24, count: 13 },
    { y: 100, h: 24, count: 12 },
    { y: 130, h: 24, count: 11 }
  ]
  for (const row of rows) {
    const pad = 10
    const gap = 4
    const usable = w - pad * 2
    const keyW = (usable - gap * (row.count - 1)) / row.count
    for (let i = 0; i < row.count; i++) {
      key(pad + i * (keyW + gap), row.y, keyW, row.h)
    }
  }
  key(150, 160, 212, 24) // spacebar

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  disposableTextures.push(texture)
  return texture
}

function buildLaptop(): THREE.Group {
  const laptop = new THREE.Group()

  // Proportions taken from a real 14" notebook (≈31 × 22 × 1.6 cm) rather
  // than eyeballed: the previous base was a third too thick and too shallow,
  // which is most of why it read as a toy.
  const BASE_W = 3.1
  const BASE_D = 2.2
  const BASE_H = 0.1

  const base = edged(new THREE.BoxGeometry(BASE_W, BASE_H, BASE_D))
  base.position.y = BASE_H / 2
  laptop.add(base)

  const deck = new THREE.Mesh(
    new THREE.PlaneGeometry(2.42, 1.1),
    new THREE.MeshLambertMaterial({ map: keyboardTexture() })
  )
  deck.rotation.x = -Math.PI / 2
  deck.position.set(0, BASE_H + 0.002, -0.3)
  laptop.add(deck)

  const trackpad = new THREE.Mesh(
    new THREE.PlaneGeometry(1.0, 0.66),
    new THREE.MeshLambertMaterial({ color: palette.faceDark })
  )
  trackpad.rotation.x = -Math.PI / 2
  trackpad.position.set(0, BASE_H + 0.002, 0.58)
  laptop.add(trackpad)

  const trackpadEdge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.0, 0.66)),
    new THREE.LineBasicMaterial({ color: palette.edge })
  )
  trackpadEdge.rotation.x = -Math.PI / 2
  trackpadEdge.position.set(0, BASE_H + 0.004, 0.58)
  laptop.add(trackpadEdge)

  // Hinge sits at the back edge of the base so rotating it opens the screen
  // from a real pivot rather than swinging around its own centre.
  const hinge = new THREE.Group()
  hinge.position.set(0, BASE_H, -BASE_D / 2 + 0.04)
  laptop.add(hinge)

  const LID_H = 2.0
  const lid = edged(new THREE.BoxGeometry(BASE_W, LID_H, 0.06))
  lid.position.y = LID_H / 2
  hinge.add(lid)

  // Starts fully transparent and is faded up once the lid is open — a closed
  // laptop showing a lit screen is the kind of detail that reads as wrong
  // without the viewer being able to say why.
  const displayMaterial = new THREE.MeshBasicMaterial({
    map: screenTexture(),
    transparent: true,
    opacity: 0
  })
  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(BASE_W - 0.26, LID_H - 0.3),
    displayMaterial
  )
  display.position.set(0, LID_H / 2 + 0.02, 0.035)
  hinge.add(display)

  const displayEdgeMaterial = new THREE.LineBasicMaterial({
    color: palette.edge,
    transparent: true,
    opacity: 0
  })
  const displayEdge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(BASE_W - 0.26, LID_H - 0.3)),
    displayEdgeMaterial
  )
  displayEdge.position.copy(display.position)
  displayEdge.position.z += 0.002
  hinge.add(displayEdge)

  laptop.userData.hinge = hinge
  laptop.userData.screenMaterials = [displayMaterial, displayEdgeMaterial]
  return laptop
}

/**
 * Camera body as one extruded front-view profile — body rectangle with the
 * grip bulging off its right side — rather than a stack of separate boxes.
 * A real mirrorless body is a single moulded shell, and the previous
 * box-plus-box-plus-box assembly is why it read as an appliance: every seam
 * between the stacked parts drew an edge line that doesn't exist on the
 * object being depicted.
 *
 * Built at roughly 2.7 units wide and scaled down by the caller so its size
 * against the laptop matches life (≈12.5cm body vs ≈31cm laptop).
 */
function buildCamera(): THREE.Group {
  const cam = new THREE.Group()

  const DEPTH = 0.62
  const shape = new THREE.Shape()
  shape.moveTo(-1.18, 0.5)
  shape.lineTo(1.0, 0.5)
  shape.quadraticCurveTo(1.22, 0.5, 1.3, 0.3) // grip shoulder
  shape.quadraticCurveTo(1.46, -0.1, 1.24, -0.42) // grip belly
  shape.quadraticCurveTo(1.18, -0.5, 1.02, -0.5)
  shape.lineTo(-1.12, -0.5)
  shape.quadraticCurveTo(-1.25, -0.5, -1.25, -0.38)
  shape.lineTo(-1.25, 0.38)
  shape.quadraticCurveTo(-1.25, 0.5, -1.18, 0.5)

  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: DEPTH,
    bevelEnabled: false,
    curveSegments: 8
  })
  bodyGeo.translate(0, 0, -DEPTH / 2)
  cam.add(edged(bodyGeo, palette.face, ROUND_EDGE_THRESHOLD))

  // Electronic viewfinder hump: a 4-sided tapered cylinder gives a real
  // pentaprism taper in one geometry, and its four faces are 90° apart so the
  // default edge threshold outlines it cleanly.
  const evf = edged(
    new THREE.CylinderGeometry(0.28, 0.36, 0.26, 4).rotateY(Math.PI / 4),
    palette.face
  )
  evf.scale.set(1, 1, 1.4)
  evf.position.set(-0.3, 0.62, 0)
  cam.add(evf)

  // Hot shoe
  const shoe = edged(new THREE.BoxGeometry(0.3, 0.05, 0.26), palette.faceDark)
  shoe.position.set(-0.3, 0.77, 0)
  cam.add(shoe)

  // Mode dial
  const dial = edged(
    new THREE.CylinderGeometry(0.21, 0.21, 0.12, 28),
    palette.faceDark,
    ROUND_EDGE_THRESHOLD
  )
  dial.position.set(0.72, 0.56, -0.02)
  cam.add(dial)

  // Shutter release, canted forward on the grip's shoulder the way it sits on
  // a real body — flat on top reads as a button glued on.
  const shutter = edged(
    new THREE.CylinderGeometry(0.11, 0.11, 0.07, 24),
    palette.faceDark,
    ROUND_EDGE_THRESHOLD
  )
  shutter.position.set(1.19, 0.44, 0.08)
  shutter.rotation.z = -0.18
  cam.add(shutter)

  /**
   * Lens as a lathed profile, not a plain cylinder. The profile carries the
   * steps a real barrel has — mount collar, focus ring, filter-thread lip,
   * recessed front element — and each of those steps is a genuine >25° crease
   * that survives the edge threshold, so the lens draws as a handful of
   * concentric rings instead of either a bare tube or a mess of seams.
   * Points are (radius, distance-along-axis) and the geometry is rotated so
   * the axis points along +Z, out of the camera's front.
   */
  const profile: [number, number][] = [
    [0.0, -0.31],
    [0.4, -0.31],
    [0.4, -0.2],
    [0.46, -0.16],
    [0.46, 0.02],
    [0.42, 0.06],
    [0.42, 0.26],
    [0.47, 0.3],
    [0.47, 0.42],
    [0.43, 0.46],
    [0.36, 0.46],
    [0.34, 0.4],
    [0.0, 0.36]
  ]
  const lens = edged(
    new THREE.LatheGeometry(
      profile.map(([r, y]) => new THREE.Vector2(r, y)),
      36
    ).rotateX(Math.PI / 2),
    palette.face,
    ROUND_EDGE_THRESHOLD
  )
  lens.position.set(-0.3, -0.02, 0.62)
  cam.add(lens)

  // Front element. Slightly domed (a sphere cap, not a flat disc) so it
  // catches the light differently from the barrel around it.
  const glass = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 24, 12, 0, Math.PI * 2, 0, 0.68),
    new THREE.MeshLambertMaterial({ color: palette.glass })
  )
  // +Y is the sphere cap's pole; rotating +90° about X maps it onto +Z so the
  // dome faces out of the lens rather than back into the body.
  glass.rotation.x = Math.PI / 2
  glass.position.set(-0.3, -0.02, 0.62 + 0.06)
  cam.add(glass)

  // Rear thumb rest / control cluster, read from behind as the body turns.
  const thumbRest = edged(new THREE.BoxGeometry(0.26, 0.3, 0.06), palette.faceDark)
  thumbRest.position.set(0.82, 0.05, -DEPTH / 2 - 0.02)
  cam.add(thumbRest)

  // Record indicator — the same accent as the laptop's status bar, the
  // diagram's live dots, and nothing else on the page.
  const indicator = flat(new THREE.CircleGeometry(0.06, 16), palette.signal)
  indicator.position.set(0.35, 0.3, DEPTH / 2 + 0.002)
  cam.add(indicator)

  const brandBar = flat(new THREE.PlaneGeometry(0.34, 0.05), palette.edge)
  brandBar.position.set(0.42, -0.28, DEPTH / 2 + 0.002)
  cam.add(brandBar)

  return cam
}

/**
 * Measures the rest pose in the camera's own screen basis and stores the
 * half-extents `resize` needs. Previously the orthographic frustum was a
 * hand-picked constant, which silently cropped the top of the laptop lid the
 * moment the geometry grew — a bug that is invisible in code review and
 * obvious in a screenshot. Deriving the frustum from the actual bounding box
 * means the composition cannot be clipped by a later geometry change.
 */
function fitRig(rig: THREE.Group, cam: THREE.OrthographicCamera) {
  // Aim first, then read the basis off the aimed camera — `getWorldDirection`
  // before `lookAt` returns the camera's default -Z, which silently measures
  // the rig against the wrong screen axes.
  const centre = new THREE.Box3().setFromObject(rig).getCenter(new THREE.Vector3())
  cam.lookAt(centre)

  const forward = new THREE.Vector3()
  cam.getWorldDirection(forward)
  const right = new THREE.Vector3().crossVectors(forward, cam.up).normalize()
  const up = new THREE.Vector3().crossVectors(right, forward).normalize()

  let maxX = 0
  let maxY = 0
  const corner = new THREE.Vector3()

  /**
   * Measured at both ends of the idle sway rather than once at rest with a
   * guessed safety multiplier. The rig turns, so its silhouette is widest at
   * the far end of the sway, not at rest — and a guessed pad is wrong in both
   * directions at once: too small and the composition clips mid-animation,
   * too large (the 10% this replaced) and the objects sit shrunken inside
   * permanent empty margins for the sake of an angle they mostly aren't at.
   * Measuring the actual extremes lets the real pad drop to 4%.
   */
  const restY = rig.rotation.y
  for (const angle of [restY, restY + SWAY_RAD]) {
    rig.rotation.y = angle
    rig.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(rig)
    for (let i = 0; i < 8; i++) {
      corner.set(
        i & 1 ? box.max.x : box.min.x,
        i & 2 ? box.max.y : box.min.y,
        i & 4 ? box.max.z : box.min.z
      )
      corner.sub(centre)
      maxX = Math.max(maxX, Math.abs(corner.dot(right)))
      maxY = Math.max(maxY, Math.abs(corner.dot(up)))
    }
  }
  rig.rotation.y = restY
  rig.updateMatrixWorld(true)

  fitHalfWidth = maxX * 1.04
  fitHalfHeight = maxY * 1.04
}

function resize() {
  if (!renderer || !camera || !root.value) return
  const w = root.value.clientWidth
  const h = root.value.clientHeight
  if (w === 0 || h === 0) return

  const aspect = w / h
  // Whichever axis is tighter decides the zoom, so the composition fits at
  // any container shape rather than only the one it was tuned at.
  const halfHeight = Math.max(fitHalfHeight, fitHalfWidth / aspect)
  const halfWidth = halfHeight * aspect

  camera.left = -halfWidth
  camera.right = halfWidth
  camera.top = halfHeight
  camera.bottom = -halfHeight
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

/**
 * A lost GPU context. Routine on iOS — Safari discards contexts under memory
 * pressure and when the app is backgrounded — and close to unheard of on the
 * desktop this scene was built against. That is precisely why it went
 * unhandled: the platform that needs the recovery is the one that was never
 * allowed to run the scene.
 *
 * Unhandled, the canvas freezes or clears while `forceArt` is already false
 * and the showcase has faded the static art out, so the hero becomes a
 * permanent empty box with nothing to bring it back.
 *
 * `preventDefault` is not optional here. It is what tells the browser this
 * page intends to recover; without it `webglcontextrestored` is never
 * dispatched at all.
 */
function onContextLost(event: Event) {
  event.preventDefault()
  contextLost = true
  // Stop drawing and stop the clock, but leave the canvas in the document:
  // the restore event is dispatched on that element, so removing it now would
  // throw away the only route back.
  stopRendering()
  entranceTl?.pause()
  idleTween?.pause()
  emit('contextlost')
}

/**
 * Rebuilt from scratch rather than resumed. Every material, both canvas
 * textures and all of the geometry lived on the context that just died, and a
 * partial re-upload would need a registry of all of them — the same argument
 * `onAppearanceChange` makes for rebuilding instead of patching in place.
 *
 * `animate: false` for that same reason too: a laptop that re-performs its
 * entrance because the OS reclaimed some memory is a glitch, not a delight.
 *
 * If the restore never arrives — which is allowed, since the browser only
 * promises to try — the static art simply stays up, which is the correct
 * degradation rather than a failure.
 */
function onContextRestored() {
  if (!contextLost) return
  contextLost = false
  teardown()
  build(false)
  emit('contextrestored')
}

/**
 * Renders on GSAP's ticker rather than a private rAF loop, so each draw lands
 * after the tweens that moved the scene have been applied for that same
 * frame.
 *
 * Idempotent: the intersection callback can fire repeatedly with the same
 * state, and two copies of this on the ticker would draw the scene twice per
 * frame for nothing.
 */
function startRendering() {
  if (tickerFn) return
  tickerFn = () => {
    if (renderer && scene && camera) renderer.render(scene, camera)
  }
  gsap.ticker.add(tickerFn)
}

/**
 * Stops drawing without touching the scene, which leaves the last composited
 * frame on screen — so this is only safe for a canvas nobody is looking at.
 * `preserveDrawingBuffer` is off, but that governs reading the buffer back,
 * not what stays composited, so pausing does not blank the canvas.
 *
 * A backgrounded tab is already covered for free: GSAP's ticker runs on
 * requestAnimationFrame, which the browser stops delivering there. This
 * handles the case rAF does not — the hero scrolled off a page the visitor is
 * still actively reading, which on a phone is most of the session.
 */
function stopRendering() {
  if (tickerFn) gsap.ticker.remove(tickerFn)
  tickerFn = null
}

/**
 * Builds the whole scene. Split out of `onMounted` so a change of appearance
 * can tear down and rebuild rather than trying to patch colours in place:
 * every material, both canvas textures and the hemisphere light's ground
 * colour are palette-derived, so a partial update would need a registry of
 * every one of them and would silently miss whichever was added next. The
 * geometry is procedural and rebuilding it costs a few milliseconds.
 *
 * `animate: false` is for that rebuild — a laptop that re-opens itself
 * because the sun went down is a surprise, not a delight.
 */
function build(animate: boolean) {
  if (!root.value) return

  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 40)
  camera.position.set(4.6, 3.4, 6.2)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  root.value.appendChild(renderer.domElement)
  renderer.domElement.addEventListener('webglcontextlost', onContextLost)
  renderer.domElement.addEventListener('webglcontextrestored', onContextRestored)

  // Three lights, no shadow maps: a hemisphere for ambient fill, a key from
  // the viewer's side to separate top faces from front faces, and a weak
  // counter-fill so the shaded side never goes muddy.
  //
  // The intensities are worked out, not dialled in by eye. three.js has used
  // physically-correct lighting since the legacy mode was removed, so a
  // Lambert surface reflects `dotNL * intensity / π` per light — an earlier
  // pass at 2.1 + 1.9 + 0.55 summed past 1.0 on any up-facing surface, which
  // clipped every top face to identical flat white and undid the whole reason
  // for lighting the scene. These land roughly top 0.89 / front 0.83 /
  // side 0.77 in display space: visible form, nothing clipped.
  // White lights in both appearances: the darkness of the dark scene comes
  // from the face tones being darker, not from dimming the lights. Tinting or
  // dimming them instead would desaturate the one signal-green accent, which
  // has to keep meaning "running" in both.
  const WHITE = 0xffffff
  scene.add(new THREE.HemisphereLight(WHITE, palette.faceDark.getHex(), 1.4))
  const key = new THREE.DirectionalLight(WHITE, 1.3)
  key.position.set(3, 6, 5)
  scene.add(key)
  const fill = new THREE.DirectionalLight(WHITE, 0.4)
  fill.position.set(-5, 2, -3)
  scene.add(fill)

  const rig = new THREE.Group()
  scene.add(rig)

  // Both objects sit on y = 0 — one shared ground plane, the thing that makes
  // them read as an arrangement on a desk rather than two shapes in a void.
  const laptop = buildLaptop()
  laptop.position.set(-1.15, 0, -0.35)
  laptop.rotation.y = 0.1
  rig.add(laptop)

  // Scaled a touch above life size against the laptop (a 12.5cm body next to
  // a 31cm notebook would be ~0.40 here). Strict scale buries the lens detail
  // this rebuild exists to show; 0.52 keeps the size relationship obviously
  // correct while leaving the barrel rings legible.
  const CAM_SCALE = 0.52
  const cam3d = buildCamera()
  cam3d.scale.setScalar(CAM_SCALE)
  cam3d.position.set(2.15, 0.5 * CAM_SCALE, 1.45)
  cam3d.rotation.y = -0.5
  rig.add(cam3d)

  // Framing is measured from the objects alone, before the shadows join the
  // rig. The shadow sprites are deliberately much larger than their subjects
  // (that softness is the whole point), so including them in the bounding box
  // would pad the frustum by the falloff radius and shrink the actual
  // composition to sit small and off-centre in its own slot.
  fitRig(rig, camera)

  const laptopShadow = shadowSprite(4.6, 3.6, 0.85)
  laptopShadow.position.set(-1.15, 0.004, 0.05)
  rig.add(laptopShadow)

  const camShadow = shadowSprite(1.9, 1.6, 0.8)
  camShadow.position.set(2.15, 0.005, 1.45)
  rig.add(camShadow)

  resize()
  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(root.value)

  // ---- Entrance: parts settle into place, screen opens ----
  // Hinge angle reference: the lid extends along the hinge's local +Y when
  // rotation.x is 0 (lid upright, ~vertical). Rotating +X tips it forward
  // toward +Z, onto the base — that's "closed" at rotation.x ≈ π/2. A natural
  // open laptop rests a little *past* vertical, reclined toward the viewer,
  // which is a small *negative* angle here — not the large negative sweep an
  // earlier version used, which read as the lid swinging almost flat.
  const HINGE_CLOSED = Math.PI / 2 - 0.07
  const HINGE_OPEN = -0.17
  const hinge = laptop.userData.hinge as THREE.Group
  const screenMaterials = laptop.userData.screenMaterials as THREE.Material[]

  /**
   * Entrance beats, in seconds from the timeline start. Named rather than
   * inlined as timeline offsets because the whole point of this sequence is
   * the rhythm between them, and that rhythm is unreadable as a column of
   * bare numbers in the third argument of each `.to()`.
   *
   * The laptop arrives closed, lands, and is allowed to sit for a beat before
   * the lid moves — an object that starts opening while it is still flying
   * into place reads as one blurred event, not as a thing arriving and then
   * being opened. The screen lights up last, once the lid is most of the way
   * up, so the sequence ends on the one green accent rather than on motion.
   */
  const LAPTOP_IN = 0
  const LAPTOP_SETTLE = 1.05
  const LAPTOP_SHADOW = 0.18
  const CAMERA_IN = 0.45
  const CAMERA_SHADOW = 0.7
  const LID_OPEN = LAPTOP_SETTLE + 0.3 // the beat
  const LID_DURATION = 1.1
  const SCREEN_ON = LID_OPEN + LID_DURATION * 0.55

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
  laptop.scale.setScalar(0.9)
  cam3d.position.y = camRestY - 0.55
  cam3d.rotation.y = -1.25
  laptopShadow.material.opacity = 0
  camShadow.material.opacity = 0
  rig.scale.setScalar(0.001) // avoid a one-frame flash of the resting pose

  entranceTl = gsap.timeline({ delay: 0.1 })
  entranceTl
    .to(rig.scale, { x: 1, y: 1, z: 1, duration: 0.01 })
    .to(laptop.position, { y: laptopRestY, duration: LAPTOP_SETTLE, ease: 'siteReveal' }, LAPTOP_IN)
    .to(laptop.scale, { x: 1, y: 1, z: 1, duration: LAPTOP_SETTLE, ease: 'siteReveal' }, LAPTOP_IN)
    // Shadows fade in slightly behind their objects, so each one reads as
    // arriving on the surface rather than being painted there already.
    .to(laptopShadow.material, { opacity: 0.85, duration: 0.9, ease: 'siteReveal' }, LAPTOP_SHADOW)
    .to(cam3d.position, { y: camRestY, duration: 1.0, ease: 'siteReveal' }, CAMERA_IN)
    .to(cam3d.rotation, { y: camRestRotY, duration: 1.0, ease: 'siteReveal' }, CAMERA_IN)
    .to(camShadow.material, { opacity: 0.8, duration: 0.9, ease: 'siteReveal' }, CAMERA_SHADOW)
    .to(hinge.rotation, { x: HINGE_OPEN, duration: LID_DURATION, ease: 'siteReveal' }, LID_OPEN)
    .to(screenMaterials, { opacity: 1, duration: 0.5, ease: 'power1.out' }, SCREEN_ON)
    .add(() => {
      // Idle: a slow sway, not a full turntable. A complete rotation was
      // tried and rejected — the laptop lid is a thin plane, and a full spin
      // necessarily crosses a near-edge-on angle where it visually
      // disappears, plus an angle where the lens faces away and the camera
      // reads as a featureless block. SWAY_RAD stays inside the range this
      // scene's resting angle was tuned for, verified by screenshot rather
      // than assumed, and `fitRig` measures the frustum at both ends of it.
      idleTween = gsap.to(rig.rotation, {
        y: `+=${SWAY_RAD}`,
        duration: 10,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      })
      // The entrance can finish after the hero has already been scrolled
      // past, and this tween is the one that never ends on its own — so it
      // has to start paused in that case or it runs unwatched for the rest of
      // the session.
      if (!inView) idleTween.pause()
    })

  // A rebuild wants the scene the entrance *arrives* at, not the pose it
  // starts from. Seeking to the end applies every final value and fires the
  // callback that starts the idle sway, so the rebuilt scene is identical to
  // one that animated — it just didn't perform.
  if (!animate) entranceTl.progress(1)

  if (inView) startRendering()
}

function teardown() {
  stopRendering()
  entranceTl?.kill()
  idleTween?.kill()
  resizeObserver?.disconnect()

  if (renderer) {
    renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
    renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored)
  }

  scene?.traverse((obj) => {
    if (
      obj instanceof THREE.Mesh ||
      obj instanceof THREE.LineSegments ||
      obj instanceof THREE.Line
    ) {
      obj.geometry?.dispose()
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      mats.forEach((m) => m?.dispose())
    }
  })
  disposableTextures.forEach((t) => t.dispose())
  disposableTextures.length = 0
  shadowTexture = null

  renderer?.dispose()
  renderer?.domElement.remove()
  renderer = null
  scene = null
  camera = null
  tickerFn = null
  entranceTl = null
  idleTween = null
  resizeObserver = null
}

/**
 * The appearance can change while the page is open — `dark-mode.md › Best
 * practices` calls this out directly: "people can choose the Auto appearance
 * setting, which switches between the light and dark appearances as
 * conditions change throughout the day, potentially while your app is
 * running." A canvas can't inherit that the way the CSS does, so it has to be
 * told.
 */
let appearance: MediaQueryList | null = null

function onAppearanceChange(event: MediaQueryListEvent) {
  palette = readPalette(event.matches)
  teardown()
  build(false)
}

onMounted(() => {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  appearance = mq
  palette = readPalette(mq.matches)
  build(true)
  mq.addEventListener('change', onAppearanceChange)

  // Observes the container rather than the canvas, so it survives every
  // rebuild — an appearance change and a context restore both replace the
  // canvas underneath it.
  intersectionObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[entries.length - 1]
      if (!entry) return
      inView = entry.isIntersecting
      // Nothing is resumed while the context is gone; `onContextRestored`
      // owns getting back to a drawing state.
      if (contextLost) return
      if (inView) {
        startRendering()
        entranceTl?.resume()
        idleTween?.resume()
      } else {
        stopRendering()
        entranceTl?.pause()
        idleTween?.pause()
      }
    },
    { rootMargin: RENDER_MARGIN }
  )
  if (root.value) intersectionObserver.observe(root.value)
})

onUnmounted(() => {
  appearance?.removeEventListener('change', onAppearanceChange)
  intersectionObserver?.disconnect()
  intersectionObserver = null
  teardown()
})
</script>

<template>
  <div ref="root" class="hero-scene" />
</template>

<style scoped>
/* Fills whatever box HeroShowcase gives it rather than declaring its own
   aspect ratio. The showcase lays this over the static line art, which is
   what reserves the slot's height, so the two always occupy exactly the same
   box and the crossfade between them doesn't move anything. `fitRig` derives
   the frustum from the measured container, so any resulting shape is fine. */
.hero-scene {
  width: 100%;
  height: 100%;
}

.hero-scene :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
