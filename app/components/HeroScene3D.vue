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

const CANVAS = 0xfbfbfa
const SURFACE = 0xffffff
const INK = 0x37352f
const INK_FAINT = 0x9b9a97
const LINE_STRONG = 0xdfdfdd
const SIGNAL = 0x4a8f5b

/**
 * Face tone sits a little below the page's canvas colour, because the lights
 * multiply it up: a surface that starts at the background colour has nowhere
 * to go but blown-out. Chosen together with the light intensities in
 * `onMounted` so an up-facing surface lands around 0.89 in display space —
 * pale, clearly lighter than the sides, and still short of clipping.
 */
const FACE = 0xf7f7f5
const FACE_DARK = 0xe6e6e3

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

const root = ref<HTMLDivElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
let resizeObserver: ResizeObserver | null = null
let tickerFn: (() => void) | null = null
let idleTween: gsap.core.Tween | null = null
let entranceTl: gsap.core.Timeline | null = null
let shadowTexture: THREE.CanvasTexture | null = null
const disposableTextures: THREE.Texture[] = []

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
  color = FACE,
  threshold = 1
): THREE.Group {
  const group = new THREE.Group()
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshLambertMaterial({
      color,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    })
  )
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, threshold),
    new THREE.LineBasicMaterial({ color: INK })
  )
  group.add(mesh, edges)
  return group
}

/** An unlit detail chip — status bars, indicator dots, screen furniture. */
function flat(geometry: THREE.BufferGeometry, color: number): THREE.Mesh {
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
    gradient.addColorStop(0, 'rgba(55,53,47,0.55)')
    gradient.addColorStop(0.45, 'rgba(55,53,47,0.22)')
    gradient.addColorStop(1, 'rgba(55,53,47,0)')
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

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)

  // Title bar with the three window dots — one glyph everyone reads as
  // "a real window" without needing to resolve any text.
  ctx.fillStyle = '#f4f4f2'
  ctx.fillRect(0, 0, w, 28)
  ctx.fillStyle = '#dfdfdd'
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.arc(20 + i * 18, 14, 5, 0, Math.PI * 2)
    ctx.fill()
  }

  // Sidebar
  ctx.fillStyle = '#fbfbfa'
  ctx.fillRect(0, 28, 104, h - 28)
  ctx.fillStyle = '#e9e9e7'
  for (let i = 0; i < 7; i++) ctx.fillRect(16, 50 + i * 26, 60 - (i % 3) * 12, 6)

  // Code lines: indentation varied so it scans as code, not as a paragraph.
  const indents = [0, 0, 1, 2, 2, 1, 0, 1, 2, 3, 2, 1]
  const widths = [180, 240, 150, 210, 120, 260, 90, 200, 160, 130, 220, 100]
  ctx.fillStyle = '#e3e3e0'
  indents.forEach((indent, i) => {
    ctx.fillRect(128 + indent * 18, 52 + i * 22, widths[i]!, 7)
  })

  // The site's one accent, doing the same job it does everywhere else on the
  // page: marking something as running.
  ctx.fillStyle = '#4a8f5b'
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

  ctx.fillStyle = '#f2f2f0'
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

  ctx.fillStyle = '#dcdcd9'
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
    new THREE.MeshLambertMaterial({ color: 0xf5f5f3 })
  )
  trackpad.rotation.x = -Math.PI / 2
  trackpad.position.set(0, BASE_H + 0.002, 0.58)
  laptop.add(trackpad)

  const trackpadEdge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.0, 0.66)),
    new THREE.LineBasicMaterial({ color: LINE_STRONG })
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

  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(BASE_W - 0.26, LID_H - 0.3),
    new THREE.MeshBasicMaterial({ map: screenTexture() })
  )
  display.position.set(0, LID_H / 2 + 0.02, 0.035)
  hinge.add(display)

  const displayEdge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(BASE_W - 0.26, LID_H - 0.3)),
    new THREE.LineBasicMaterial({ color: INK })
  )
  displayEdge.position.copy(display.position)
  displayEdge.position.z += 0.002
  hinge.add(displayEdge)

  laptop.userData.hinge = hinge
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
  cam.add(edged(bodyGeo, FACE, ROUND_EDGE_THRESHOLD))

  // Electronic viewfinder hump: a 4-sided tapered cylinder gives a real
  // pentaprism taper in one geometry, and its four faces are 90° apart so the
  // default edge threshold outlines it cleanly.
  const evf = edged(
    new THREE.CylinderGeometry(0.28, 0.36, 0.26, 4).rotateY(Math.PI / 4),
    FACE
  )
  evf.scale.set(1, 1, 1.4)
  evf.position.set(-0.3, 0.62, 0)
  cam.add(evf)

  // Hot shoe
  const shoe = edged(new THREE.BoxGeometry(0.3, 0.05, 0.26), FACE_DARK)
  shoe.position.set(-0.3, 0.77, 0)
  cam.add(shoe)

  // Mode dial
  const dial = edged(
    new THREE.CylinderGeometry(0.21, 0.21, 0.12, 28),
    FACE_DARK,
    ROUND_EDGE_THRESHOLD
  )
  dial.position.set(0.72, 0.56, -0.02)
  cam.add(dial)

  // Shutter release, canted forward on the grip's shoulder the way it sits on
  // a real body — flat on top reads as a button glued on.
  const shutter = edged(
    new THREE.CylinderGeometry(0.11, 0.11, 0.07, 24),
    FACE_DARK,
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
    FACE,
    ROUND_EDGE_THRESHOLD
  )
  lens.position.set(-0.3, -0.02, 0.62)
  cam.add(lens)

  // Front element. Slightly domed (a sphere cap, not a flat disc) so it
  // catches the light differently from the barrel around it.
  const glass = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 24, 12, 0, Math.PI * 2, 0, 0.68),
    new THREE.MeshLambertMaterial({ color: 0x2c2b27 })
  )
  // +Y is the sphere cap's pole; rotating +90° about X maps it onto +Z so the
  // dome faces out of the lens rather than back into the body.
  glass.rotation.x = Math.PI / 2
  glass.position.set(-0.3, -0.02, 0.62 + 0.06)
  cam.add(glass)

  // Rear thumb rest / control cluster, read from behind as the body turns.
  const thumbRest = edged(new THREE.BoxGeometry(0.26, 0.3, 0.06), FACE_DARK)
  thumbRest.position.set(0.82, 0.05, -DEPTH / 2 - 0.02)
  cam.add(thumbRest)

  // Record indicator — the same accent as the laptop's status bar, the
  // diagram's live dots, and nothing else on the page.
  const indicator = flat(new THREE.CircleGeometry(0.06, 16), SIGNAL)
  indicator.position.set(0.35, 0.3, DEPTH / 2 + 0.002)
  cam.add(indicator)

  const brandBar = flat(new THREE.PlaneGeometry(0.34, 0.05), INK_FAINT)
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

onMounted(() => {
  if (!root.value) return

  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 40)
  camera.position.set(4.6, 3.4, 6.2)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  root.value.appendChild(renderer.domElement)

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
  scene.add(new THREE.HemisphereLight(SURFACE, LINE_STRONG, 1.4))
  const key = new THREE.DirectionalLight(SURFACE, 1.3)
  key.position.set(3, 6, 5)
  scene.add(key)
  const fill = new THREE.DirectionalLight(SURFACE, 0.4)
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
  const HINGE_CLOSED = Math.PI / 2 - 0.18
  const HINGE_OPEN = -0.17
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
  laptop.scale.setScalar(0.9)
  cam3d.position.y = camRestY - 0.55
  cam3d.rotation.y = -1.25
  laptopShadow.material.opacity = 0
  camShadow.material.opacity = 0
  rig.scale.setScalar(0.001) // avoid a one-frame flash of the resting pose

  entranceTl = gsap.timeline({ delay: 0.15 })
  entranceTl
    .to(rig.scale, { x: 1, y: 1, z: 1, duration: 0.01 })
    .to(laptop.position, { y: laptopRestY, duration: 1.1, ease: 'siteReveal' }, 0)
    .to(laptop.scale, { x: 1, y: 1, z: 1, duration: 1.1, ease: 'siteReveal' }, 0)
    // Shadows fade in slightly behind their objects, so each one reads as
    // arriving on the surface rather than being painted there already.
    .to(laptopShadow.material, { opacity: 0.85, duration: 0.9, ease: 'siteReveal' }, 0.25)
    .to(hinge.rotation, { x: HINGE_OPEN, duration: 1.0, ease: 'siteReveal' }, 0.15)
    .to(cam3d.position, { y: camRestY, duration: 1.05, ease: 'siteReveal' }, 0.25)
    .to(cam3d.rotation, { y: camRestRotY, duration: 1.05, ease: 'siteReveal' }, 0.25)
    .to(camShadow.material, { opacity: 0.8, duration: 0.9, ease: 'siteReveal' }, 0.5)
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
})
</script>

<template>
  <div ref="root" class="hero-scene" />
</template>

<style scoped>
.hero-scene {
  width: 100%;
  aspect-ratio: 5 / 3.4;
}

.hero-scene :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
