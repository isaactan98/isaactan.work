/**
 * Regenerates the icon set in public/ from one geometry definition.
 *
 *   npm i --no-save --package-lock=false sharp png-to-ico
 *   node scripts/generate-icons.mjs public
 *
 * Deliberately not a project dependency: this runs by hand when the mark
 * changes, never during a build, and the outputs are committed.
 *
 * The mark is one node from the landing page's homelab diagram — a hairline box
 * carrying a live status dot and its label bar, i.e. the `● expense-tracker`
 * row of app/components/HomelabDiagram.vue reduced until it survives 16px.
 * Everything is drawn from the design tokens; nothing new is invented here.
 *
 * Two things are load-bearing and easy to undo by accident:
 *
 * 1. The 32px master's edges land on whole pixels at 16, 32 and 48. `x=3`,
 *    `width=26` and `stroke-width=2` put the stroke on a pixel boundary at each
 *    of those scales, so the box stays crisp instead of smearing over two rows
 *    of half-lit pixels. Change any of the three and re-check at 16px.
 *
 * 2. The large tiles get their own stroke ratio. The master's stroke is 7.7% of
 *    the box, which reads as a hairline at 16px and as a heavy slab at 512px, so
 *    `strokeFrac` below is tuned down for the home-screen sizes. Same drawing,
 *    optically sized — not one file scaled.
 */
import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import fs from 'node:fs'
import path from 'node:path'

const OUT = process.argv[2]
if (!OUT) { console.error('usage: node generate.mjs <public dir>'); process.exit(1) }

const INK = '#37352f'     // colors.ink
const CANVAS = '#fbfbfa'  // colors.canvas
const SIGNAL = '#4a8f5b'  // colors.signal — "still running"

/**
 * The mark at an arbitrary tile size. Geometry is expressed as fractions of the
 * box, taken from the 32px master below, so every size is the same drawing.
 */
function mark({ tile, boxFrac, strokeFrac, opaque }) {
  const box = Math.round(tile * boxFrac)
  const o = (tile - box) / 2               // box origin
  const sw = +(box * strokeFrac).toFixed(3)
  const rx = +(box * 0.154).toFixed(3)     // 4/26 at the 32px master
  const cy = o + box / 2
  const dotR = +(box * 0.154).toFixed(3)   // 4/26
  const dotCx = +(o + box * 0.327).toFixed(3)   // 11.5-3 over 26
  const barX = +(o + box * 0.558).toFixed(3)    // 17.5-3 over 26
  const barW = +(box * 0.269).toFixed(3)        // 7/26
  const barH = +(box * 0.154).toFixed(3)        // 4/26

  const bg = opaque ? `<rect width="${tile}" height="${tile}" fill="${CANVAS}"/>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tile}" height="${tile}" viewBox="0 0 ${tile} ${tile}">${bg}<rect x="${o}" y="${o}" width="${box}" height="${box}" rx="${rx}" fill="${CANVAS}" stroke="${INK}" stroke-width="${sw}"/><circle cx="${dotCx}" cy="${cy}" r="${dotR}" fill="${SIGNAL}"/><rect x="${barX}" y="${+(cy - barH / 2).toFixed(3)}" width="${barW}" height="${barH}" rx="${+(barH / 2).toFixed(3)}" fill="${INK}"/></svg>`
}

/* --- favicon.svg: the 32px master. Edges land on whole pixels at 16/32/48. --- */
const master = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" role="img" aria-label="isaactan.work">
  <title>isaactan.work</title>
  <!-- A node from the homelab diagram: one box, one container still running. -->
  <rect x="3" y="3" width="26" height="26" rx="4" fill="${CANVAS}" stroke="${INK}" stroke-width="2"/>
  <circle cx="11.5" cy="16" r="4" fill="${SIGNAL}"/>
  <rect x="17.5" y="14" width="7" height="4" rx="2" fill="${INK}"/>
</svg>
`
fs.writeFileSync(path.join(OUT, 'favicon.svg'), master)

const render = (svg, size) =>
  sharp(Buffer.from(svg)).resize(size, size, { fit: 'fill' }).png({ compressionLevel: 9 }).toBuffer()

/* --- favicon.ico: 16 + 32 + 48, straight from the master --- */
const icoSizes = [16, 32, 48]
const icoBufs = await Promise.all(icoSizes.map((s) => render(master, s)))
fs.writeFileSync(path.join(OUT, 'favicon.ico'), await pngToIco(icoBufs))

/* --- Home-screen tiles: opaque, box at 62% of the tile, lighter stroke --- */
const tiles = [
  { name: 'apple-touch-icon.png', tile: 180 },
  { name: 'icon-192.png', tile: 192 },
  { name: 'icon-512.png', tile: 512 }
]
for (const { name, tile } of tiles) {
  const svg = mark({ tile, boxFrac: 0.62, strokeFrac: 0.045, opaque: true })
  fs.writeFileSync(path.join(OUT, name), await render(svg, tile))
}

console.log('wrote favicon.svg, favicon.ico (16/32/48), ' + tiles.map((t) => t.name).join(', '))
