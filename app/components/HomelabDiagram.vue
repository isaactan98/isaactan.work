<script setup lang="ts">
/**
 * The landing page's signature: a diagram of the setup Isaac actually runs,
 * and a small simulation of a request travelling through it.
 *
 * Only what the site states is drawn solid. `planned` dashes the isaactan.work
 * node and makes a simulated request to it report "not here yet"; it came off
 * once this page was genuinely served from the box drawn here. Keep the prop:
 * if the site moves off that hardware, one word puts the diagram back in step
 * with reality.
 */
const props = defineProps<{ planned?: boolean }>()

type NodeId = 'you' | 'tunnel' | 'server' | 'expense' | 'site' | 'laptop'
type Target = 'expense' | 'site'

const detail = computed<Record<NodeId, string>>(() => ({
  you: 'Any browser, anywhere. Nothing to install.',
  tunnel: 'Cloudflare Tunnel — the server dials out; nothing listens on the router.',
  server: 'One box at home running CasaOS and Docker Compose.',
  expense: 'expense-tracker — SGD/MYR, offline-first PWA, SQLite on disk. Used daily.',
  site: props.planned
    ? 'isaactan.work — this page. Moving here in the deploy phase.'
    : 'isaactan.work — this page, served from home.',
  laptop: 'Tailscale — a private mesh for admin access. Not reachable from the internet.'
}))

// Which wires light up with which node.
const wiresFor: Record<NodeId, string[]> = {
  you: ['w1'],
  tunnel: ['w1', 'w2'],
  server: ['w2', 'w3'],
  expense: ['w2'],
  site: ['w2'],
  laptop: ['w3']
}

const restText = 'The expense tracker runs here. So does this page.'

/**
 * The readout below the SVG now does double duty: what a node is, and — for
 * the two nodes that run actual code — what it's built with and where that's
 * proven. `site` has no entry in `nodeHref`: this page has no case study of
 * its own, and TechList's answer to a missing href is plain text, not a link
 * to somewhere that doesn't exist.
 */
const nodeStack: Partial<Record<NodeId, string[]>> = {
  expense: ['Nuxt', 'Express', 'SQLite'],
  site: ['Nuxt', 'Content']
}
const nodeHref: Partial<Record<NodeId, string>> = {
  expense: '/work#expense'
}

const active = ref<NodeId | null>(null)
const hit = ref<Target | null>(null)
const sending = ref(false)
const reducedMotion = ref(false)
const log = ref<{ id: number; target: Target; ok: boolean }[]>([])
const reqAnim = ref<SVGAnimateMotionElement | null>(null)
const figureRef = ref<HTMLElement | null>(null)

let seq = 0
let nextTarget: Target = 'expense'

onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

const isHot = (wire: string) => active.value !== null && wiresFor[active.value].includes(wire)

/**
 * The readout can now hold a real, clickable link (a node's stack, its case
 * study). Clearing `active` on each node's own mouseleave/blur — the
 * original behaviour — hides that link before a mouse moving down into the
 * readout ever arrives, and blurs it away before Tab can reach it. So
 * individual nodes only ever *set* `active` now (`@mouseenter`/`@focus` on
 * each node, unchanged); clearing it is handled once here, for the whole
 * figure, on the way out.
 *
 * `mouseleave` on the figure already has the right semantics for the pointer
 * case with no extra work — unlike `mouseover`/`mouseout`, it does not fire
 * when the pointer moves between children inside the figure, only when it
 * leaves the figure's bounds entirely. `focusout` has no such built-in
 * boundary (it bubbles from every descendant, including on a Tab between two
 * nodes inside the same figure), so it needs the explicit check below: only
 * clear `active` when focus is leaving the figure altogether.
 */
function clearActiveIfLeavingFigure(event: FocusEvent) {
  const next = event.relatedTarget as Node | null
  if (!next || !figureRef.value?.contains(next)) {
    active.value = null
  }
}

function send() {
  if (sending.value) return
  const target = nextTarget
  nextTarget = target === 'expense' ? 'site' : 'expense'
  sending.value = true

  const travel = reducedMotion.value ? 0 : 850
  if (!reducedMotion.value) reqAnim.value?.beginElement()

  window.setTimeout(() => {
    hit.value = target
    log.value = [{ id: ++seq, target, ok: target === 'expense' || !props.planned }, ...log.value].slice(0, 3)
    window.setTimeout(() => {
      hit.value = null
      sending.value = false
    }, 450)
  }, travel)
}
</script>

<template>
  <figure
    ref="figureRef"
    class="diagram"
    @mouseleave="active = null"
    @focusout="clearActiveIfLeavingFigure"
  >
    <div class="diagram-scroll">
      <svg
        viewBox="0 0 880 260"
        class="diagram-svg"
        :class="{ 'diagram-svg--sending': sending }"
        role="img"
        aria-labelledby="homelab-title"
      >
        <title id="homelab-title">
          A browser reaches a home server through a Cloudflare Tunnel; Isaac reaches the same server over Tailscale. The server runs Docker Compose with the expense tracker today and this site next.
        </title>

        <!-- The path a request takes. Invisible; the packets ride it. -->
        <path id="req-path" d="M132,125 H420" fill="none" stroke="none" />

        <!-- wires -->
        <line id="w1" class="wire draw draw-1" :class="{ 'wire--hot': isHot('w1') }" x1="132" y1="125" x2="188" y2="125" />
        <polygon class="arrow pop pop-1" :class="{ 'arrow--hot': isHot('w1') }" points="188,121 196,125 188,129" />
        <line id="w2" class="wire draw draw-2" :class="{ 'wire--hot': isHot('w2') }" x1="352" y1="125" x2="412" y2="125" />
        <polygon class="arrow pop pop-2" :class="{ 'arrow--hot': isHot('w2') }" points="412,121 420,125 412,129" />
        <line id="w3" class="wire wire--dash pop pop-4" :class="{ 'wire--hot': isHot('w3') }" x1="352" y1="207" x2="412" y2="207" />
        <polygon class="arrow arrow--dash pop pop-4" :class="{ 'arrow--hot': isHot('w3') }" points="412,203 420,207 412,211" />

        <!-- you -->
        <g
          class="node pop pop-0"
          :class="{ 'node--active': active === 'you' }"
          tabindex="0"
          role="button"
          aria-label="You: send a request through the tunnel"
          @mouseenter="active = 'you'"
          @focus="active = 'you'"
          @click="send"
          @keydown.enter.prevent="send"
          @keydown.space.prevent="send"
        >
          <rect class="box" x="20" y="96" width="112" height="58" rx="3" />
          <text class="lbl" x="36" y="121">you</text>
          <text class="sub" x="36" y="138">any browser</text>
        </g>

        <!-- tunnel -->
        <g
          class="node pop pop-1"
          :class="{ 'node--active': active === 'tunnel' }"
          tabindex="0"
          @mouseenter="active = 'tunnel'"
          @focus="active = 'tunnel'"
        >
          <rect class="box" x="196" y="96" width="156" height="58" rx="3" />
          <text class="lbl" x="212" y="121">Cloudflare Tunnel</text>
          <text class="sub" x="212" y="138">no open ports</text>
        </g>

        <!-- home server -->
        <g
          class="node pop pop-2"
          :class="{ 'node--active': active === 'server' }"
          tabindex="0"
          @mouseenter="active = 'server'"
          @focus="active = 'server'"
        >
          <rect class="box box--outer" x="420" y="24" width="440" height="212" rx="4" />
          <text class="lbl" x="436" y="46">home server</text>
          <text class="sub" x="530" y="46">CasaOS · Docker Compose</text>
          <text class="cap" x="436" y="76">CONTAINERS</text>
          <text class="cap" x="436" y="212">SQLITE ON DISK · NO THIRD-PARTY CLOUD</text>
        </g>

        <g
          class="node pop pop-3"
          :class="{ 'node--active': active === 'expense', 'node--hit': hit === 'expense' }"
          tabindex="0"
          @mouseenter="active = 'expense'"
          @focus="active = 'expense'"
        >
          <rect class="box" x="436" y="88" width="196" height="50" rx="3" />
          <circle class="live" cx="450" cy="106" r="3" />
          <text class="lbl" x="460" y="110">expense-tracker</text>
          <text class="sub" x="460" y="126">nuxt · express · sqlite</text>
        </g>

        <g
          class="node pop pop-3"
          :class="{ 'node--active': active === 'site', 'node--hit': hit === 'site' }"
          tabindex="0"
          @mouseenter="active = 'site'"
          @focus="active = 'site'"
        >
          <rect class="box" :class="{ 'box--ghost': planned }" x="648" y="88" width="196" height="50" rx="3" />
          <circle v-if="!planned" class="live" cx="662" cy="106" r="3" />
          <text class="lbl" :class="{ 'lbl--ghost': planned }" x="672" y="110">isaactan.work</text>
          <text class="sub" x="672" y="126">{{ planned ? 'nuxt · content · next' : 'nuxt · content' }}</text>
        </g>

        <!-- isaac -->
        <g
          class="node pop pop-4"
          :class="{ 'node--active': active === 'laptop' }"
          tabindex="0"
          @mouseenter="active = 'laptop'"
          @focus="active = 'laptop'"
        >
          <rect class="box" x="196" y="178" width="156" height="58" rx="3" />
          <text class="lbl" x="212" y="203">isaac · laptop</text>
          <text class="sub" x="212" y="220">Tailscale</text>
        </g>

        <!-- Ambient traffic: a faint packet every few seconds. -->
        <circle v-if="!reducedMotion" class="packet packet--ambient" r="3">
          <animateMotion id="amb" begin="1.4s; amb.end+3.2s" dur="1.6s" calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1" fill="freeze">
            <mpath href="#req-path" />
          </animateMotion>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.88;1" dur="1.6s" begin="amb.begin" fill="freeze" />
        </circle>

        <!-- The request you send. -->
        <circle class="packet packet--req" r="3.5" :class="{ 'packet--on': sending }">
          <animateMotion ref="reqAnim" begin="indefinite" dur="0.85s" calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1" fill="freeze">
            <mpath href="#req-path" />
          </animateMotion>
        </circle>
      </svg>
    </div>

    <button type="button" class="diagram-send" :disabled="sending" @click="send">
      {{ sending ? 'sending…' : 'send a request' }}
    </button>

    <div class="diagram-readout">
      <div class="diagram-inspect-group">
        <p class="diagram-inspect" aria-live="polite">
          <span class="diagram-inspect__marker" aria-hidden="true">{{ active ? '▸' : '·' }}</span>
          {{ active ? detail[active] : restText }}
        </p>
        <!-- Only the two nodes that run real code have a stack to show; the
             others (you, tunnel, laptop) stay one-line. -->
        <p v-if="active && nodeStack[active]" class="diagram-inspect__stack">
          <TechList :items="nodeStack[active]!" :href="nodeHref[active]" />
          <NuxtLink v-if="nodeHref[active]" :to="nodeHref[active]!" class="diagram-inspect__case">
            Case study <span aria-hidden="true">&rarr;</span>
          </NuxtLink>
        </p>
      </div>
      <span class="diagram-hint" aria-hidden="true">scroll &rarr;</span>
      <span class="diagram-meta">live demo on request</span>
    </div>

    <div class="diagram-log-panel">
      <p v-if="!log.length" class="diagram-log-rest">Press <b>send a request</b> to watch one travel the path.</p>
      <TransitionGroup v-else tag="ol" name="log" class="diagram-log" aria-label="Simulated requests">
        <li v-for="line in log" :key="line.id">
          <span class="log-tag">sim</span>
          <span>GET /</span>
          <span class="log-arrow">&rarr;</span>
          <span>tunnel</span>
          <span class="log-arrow">&rarr;</span>
          <span>{{ line.target === 'expense' ? 'expense-tracker' : 'isaactan.work' }}</span>
          <span class="log-sep">·</span>
          <span :class="line.ok ? 'log-ok' : 'log-miss'">{{ line.ok ? '200 OK' : 'not here yet' }}</span>
        </li>
      </TransitionGroup>
    </div>

    <figcaption class="diagram-caption">
      This diagram used to draw isaactan.work dashed and report every request to
      it as "not here yet." It's solid now because the page finally is.
    </figcaption>
  </figure>
</template>

<style scoped>
.diagram {
  position: relative;
  margin: 0;
}

/* The one lifted object on the page: white panel, hairline border. */
.diagram-scroll {
  overflow-x: auto;
  border: 1px solid theme('colors.line');
  border-radius: 4px;
  padding: 1.25rem;
  /* Edge shadows that show only while there is more diagram past that edge.
     The white cover gradients travel with the content (`local`); the shadows
     stay put (`scroll`), so each side uncovers itself exactly when it
     overflows and hides again at the end of the scroll. Pairs with the
     "scroll →" hint in the readout — one cue is textual, one is spatial. */
  background:
    linear-gradient(to right, theme('colors.surface') 40%, var(--c-surface-fade)) left center / 36px 100% no-repeat local,
    linear-gradient(to left, theme('colors.surface') 40%, var(--c-surface-fade)) right center / 36px 100% no-repeat local,
    radial-gradient(farthest-side at 0 50%, var(--c-edge-shadow), transparent) left center / 12px 100% no-repeat scroll,
    radial-gradient(farthest-side at 100% 50%, var(--c-edge-shadow), transparent) right center / 12px 100% no-repeat scroll,
    theme('colors.surface');
}

.diagram-svg {
  display: block;
  width: 100%;
  /* Below this the labels stop being legible; scroll instead of shrink. */
  min-width: 620px;
}

/* Claw back panel padding on a phone so more of the path is visible
   before the reader has to scroll it. */
@media (max-width: 700px) {
  .diagram-scroll {
    padding: 1rem 0.75rem;
  }
}

.diagram-svg text {
  font-family: theme('fontFamily.mono');
  fill: theme('colors.ink');
  pointer-events: none;
}
.lbl {
  font-size: 13px;
  font-weight: 500;
}
.lbl--ghost {
  fill: theme('colors.ink-muted');
}
.sub {
  font-size: 11.5px;
  fill: theme('colors.ink-muted');
}
/* 11px, not 10: Apple's iOS minimum type size is 11pt
   (`accessibility.md › Vision`), and points there are density-independent,
   so they map 1:1 onto CSS pixels. */
.cap {
  font-size: 11px;
  fill: theme('colors.ink-faint');
  letter-spacing: 0.08em;
}

/* ---- Nodes ---------------------------------------------------------- */

.node {
  cursor: default;
  outline: none;
}
.node[role='button'] {
  cursor: pointer;
}
.box {
  fill: theme('colors.canvas');
  stroke: theme('colors.line-strong');
  stroke-width: 1;
  transition: stroke 150ms ease, fill 150ms ease;
}
.box--outer {
  fill: transparent;
}
.box--ghost {
  stroke-dasharray: 3 3;
}
.node--active > .box,
.node:focus-visible > .box {
  stroke: theme('colors.ink');
}
.node--active .lbl--ghost {
  fill: theme('colors.ink');
}
/* A request landing: the target flashes the signal colour. */
.node--hit > .box {
  stroke: theme('colors.signal');
  fill: theme('colors.callout.success');
}

/* ---- Wires ---------------------------------------------------------- */

.wire {
  stroke: theme('colors.ink');
  stroke-width: 1;
  fill: none;
  transition: stroke 150ms ease, stroke-width 150ms ease;
}
.wire--dash {
  stroke: theme('colors.ink-muted');
  stroke-dasharray: 3 3;
}
.wire--hot {
  stroke: theme('colors.ink');
  stroke-width: 1.5;
}
.arrow {
  fill: theme('colors.ink');
  transition: fill 150ms ease;
}
.arrow--dash {
  fill: theme('colors.ink-muted');
}
.arrow--hot {
  fill: theme('colors.ink');
}

/* ---- Packets -------------------------------------------------------- */

.packet {
  fill: theme('colors.ink');
  opacity: 0;
}
.packet--ambient {
  fill: theme('colors.ink-faint');
}
.packet--req {
  fill: theme('colors.signal');
  transition: opacity 120ms ease;
}
.packet--on {
  opacity: 1;
}

/* Status dots breathe the way real dashboards' do. */
.live {
  fill: theme('colors.signal');
  animation: breathe 2.4s ease-in-out infinite;
}
@keyframes breathe {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}

/* ---- Load-in: wires draw, boxes settle, left to right ---------------- */

@media (prefers-reduced-motion: no-preference) {
  .draw {
    stroke-dasharray: 64;
    stroke-dashoffset: 64;
    animation: draw 420ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
  .draw-1 {
    animation-delay: 380ms;
  }
  .draw-2 {
    animation-delay: 640ms;
  }
  .pop {
    opacity: 0;
    animation: pop 380ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .pop-0 {
    animation-delay: 200ms;
  }
  .pop-1 {
    animation-delay: 460ms;
  }
  .pop-2 {
    animation-delay: 720ms;
  }
  .pop-3 {
    animation-delay: 900ms;
  }
  .pop-4 {
    animation-delay: 1040ms;
  }
  /* Tailscale link: dashes march, slowly. It is a live link. */
  .wire--dash {
    animation: march 1.2s linear infinite;
  }
}
@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}
@keyframes pop {
  from {
    opacity: 0;
    transform: translateY(3px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes march {
  to {
    stroke-dashoffset: -6;
  }
}
/* The dashed wire is both `pop` and `march`; give it both. */
.wire--dash.pop {
  animation: pop 380ms cubic-bezier(0.16, 1, 0.3, 1) 1040ms forwards, march 1.2s linear infinite;
}

/* ---- Controls and readout ------------------------------------------- */

.diagram-send {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  font-family: theme('fontFamily.mono');
  font-size: 0.6875rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: theme('colors.ink-muted');
  background: theme('colors.canvas');
  border: 1px solid theme('colors.line-strong');
  border-radius: 3px;
  padding: 0.3rem 0.6rem;
  cursor: pointer;
  transition: color 150ms ease, border-color 150ms ease, background-color 150ms ease;
}
.diagram-send:hover:not(:disabled),
.diagram-send:focus-visible {
  color: theme('colors.ink');
  border-color: theme('colors.ink');
  outline: none;
}
.diagram-send:disabled {
  cursor: progress;
  color: theme('colors.ink-faint');
}

.diagram-readout {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
  font-family: theme('fontFamily.mono');
  font-size: 0.75rem;
  color: theme('colors.ink-muted');
}
/* Takes over .diagram-inspect's old flex role, since the group now also
   holds the stack/case-study line. Reserves height for that second line
   whether or not it's currently rendered, so hovering a node never shifts
   the log panel below — the same fixed-height approach that panel already
   uses for its own three log lines. */
.diagram-inspect-group {
  flex: 1 1 24rem;
  min-height: 2.85em;
}
.diagram-inspect {
  margin: 0;
  min-height: 1.5em;
}
.diagram-inspect__marker {
  display: inline-block;
  width: 1ch;
  margin-right: 0.5ch;
  color: theme('colors.ink-faint');
}
.diagram-inspect__stack {
  margin: 0.35rem 0 0;
}
.diagram-inspect__case {
  margin-left: 0.75rem;
  color: theme('colors.ink-faint');
  transition: color 150ms ease;
}
.diagram-inspect__case:hover {
  color: theme('colors.ink');
}
.diagram-meta {
  white-space: nowrap;
}

/* Only shown while the diagram is wider than its panel. */
.diagram-hint {
  display: none;
}
@media (max-width: 700px) {
  .diagram-hint {
    display: inline;
    color: theme('colors.ink-faint');
  }
}

/* ---- Simulated request log ------------------------------------------ */

/* Fixed height for three lines, so sending never shifts the page. */
.diagram-log-panel {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid theme('colors.line');
  min-height: 4.6rem;
  font-family: theme('fontFamily.mono');
  font-size: 0.75rem;
  color: theme('colors.ink-muted');
}
.diagram-log-rest {
  margin: 0;
  color: theme('colors.ink-faint');
}
.diagram-log-rest b {
  font-weight: 500;
  color: theme('colors.ink-muted');
}
.diagram-log {
  list-style: none;
  margin: 0;
  padding: 0;
  font-variant-numeric: tabular-nums;
}
.diagram-log li {
  display: flex;
  gap: 0.5ch;
  flex-wrap: wrap;
  padding: 0.2rem 0;
}
.log-tag {
  color: theme('colors.ink-faint');
  letter-spacing: 0.08em;
  margin-right: 0.5ch;
}
.log-arrow,
.log-sep {
  color: theme('colors.ink-faint');
}
.log-ok {
  color: theme('colors.signal');
}
.log-miss {
  color: theme('colors.ink-faint');
}
.log-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
.log-enter-active {
  transition: opacity 220ms ease, transform 220ms ease;
}
.log-move {
  transition: transform 220ms ease;
}

/* ---- Caption ---------------------------------------------------------- */

.diagram-caption {
  margin-top: 0.75rem;
  font-size: 0.75rem;
  line-height: 1.5;
  color: theme('colors.ink-faint');
  max-width: 52ch;
}

@media (prefers-reduced-motion: reduce) {
  .live,
  .wire--dash,
  .wire--dash.pop {
    animation: none;
  }
  .box,
  .wire,
  .arrow,
  .packet--req,
  .diagram-send,
  .diagram-inspect__case {
    transition: none;
  }
  .log-enter-active,
  .log-move {
    transition: none;
  }
}
</style>
