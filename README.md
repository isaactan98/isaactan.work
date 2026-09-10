# isaactan.work

Personal portfolio site — Markdown content rendered in a Notion-inspired visual
style with Nuxt Content.

## Stack

| | |
|---|---|
| Node | 22 |
| Nuxt | 4 |
| Content | `@nuxt/content` v3 (`content.config.ts` collections API) |
| Styling | `@nuxtjs/tailwindcss` + `@tailwindcss/typography` (Tailwind 3.4) |
| Font | Inter, via Google Fonts |

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Layout

```
content.config.ts        # single `content` collection, type: 'page', source: '**/*.md'
content/                 # markdown, at the project root — NOT under app/
  jb/japan-trip.md
  sg/steps-to-success.md
app/
  assets/css/tailwind.css
  pages/
    index.vue            # hand-written landing page (wins over the catch-all)
    [...slug].vue        # renders any content/ page
  components/mdc/        # MDC components usable from markdown
    Callout.vue
    Toggle.vue
    PageHeader.vue
public/covers/           # placeholder page covers
tailwind.config.ts       # Notion-inspired design tokens + `prose-notion` preset
```

## MDC components

Components in `app/components/mdc/` are registered globally by `@nuxtjs/mdc`
and addressed from markdown in kebab-case:

```markdown
::page-header{icon="🗾" cover="/covers/japan.svg"}
::

::callout{type="info"}
Info, warning, success, or default.
::

::toggle{title="Click to expand"}
Hidden content.
::
```

`page-header` falls back to the page's frontmatter `title` when no `title` prop
is given.

> Note: MDC slot content must sit flush against the left margin. Indenting it
> silently turns the block into a code block instead of raising an error.

## Design system

Defined in `tailwind.config.ts` and `app/assets/css/tailwind.css`:

- Off-white `#fbfbfa` canvas, `#37352f` text — no pure black or white
- 720px centred reading column for content pages (`.content-column`);
  820px for the landing page (`.page-column`), which needs the extra width
  for its four-column CV table
- Two type roles: **Inter** for body and UI, **IBM Plex Mono** for years,
  labels, metadata — and the landing-page headline, where it runs at 600
- Restrained heading weights (600) at modest sizes, body line-height 1.6
- Soft callout tints, hairline `#e9e9e7` dividers, no drop shadows
- One chromatic accent, `signal` `#4a8f5b`, and it is semantic: it marks a
  service or a role that is still running. Nothing else uses it.

### Landing page

`app/pages/index.vue` is a CV with an interactive diagram on top, not a
marketing page. It links to Experience, Work and Contact only — the `/jb` and
`/sg` writing is deliberately not surfaced here yet, though both routes still
render and are reachable directly.

The hero is `app/components/HomelabDiagram.vue`: an inline SVG of the setup
Isaac actually runs — browser -> Cloudflare Tunnel -> home server (CasaOS,
Docker Compose), with Isaac reaching the same box over Tailscale. It is the
page's one interactive object:

- **Hover or focus any node** to light its wires and swap the readout line.
- **"Send a request"** (or click the `you` node) flies a packet along the
  path, flashes the container it lands on, and appends a line to a simulated
  request log. Requests alternate between the two containers; the log panel
  is a fixed height so sending never shifts the page.
- On load, boxes settle and wires draw themselves left to right; the
  Tailscale link marches; live containers breathe.

Only what the site states is drawn solid. `isaactan.work` is dashed via the
`planned` prop, and a simulated request to it honestly reports "not here yet"
— flip the prop off in the deploy phase and it goes solid with a live dot.

Section load-in is a plain CSS animation in `app/assets/css/tailwind.css`
(`.section--reveal`), staggered per section via `--s` and per row via `--i`.
It is deliberately **not** an IntersectionObserver: a background tab throttles
both observer callbacks and `setTimeout`, so anything gated on them can leave
sections permanently invisible. A CSS animation with `both` fill always runs to
completion on its own. Reduced motion switches it off.

Portrait: `public/me-badge.png` (150x240, alpha) is the header badge, made
with `sips -Z 240` from `public/me.png` (720x1148, 724 KB), which nothing
references yet — drop it if no larger use turns up.

Project star counts in `index.vue` are from the GitHub API on 2026-09-09.

### Work page

`app/pages/work.vue` at `/work` carries the fuller list: three expandable case
studies (Isaac's own copy, brought over from isaactan.vercel.app) plus all 17
public repositories, filterable by tag with live counts and sortable by recency
or stars. Repository names, descriptions, languages and star counts are the
real GitHub API values read on 2026-09-10; pure tutorial repos are excluded.
The case-study accordion animates height with a `grid-template-rows: 0fr -> 1fr`
transition, so nothing is measured in JavaScript.

### Shared chrome and page transitions

`app/layouts/site.vue` holds the header, and `/` and `/work` opt into it with
`definePageMeta({ layout: 'site' })`. `app.vue` wraps `<NuxtPage>` in
`<NuxtLayout>`. Because the header lives in the layout, its DOM node survives
navigation and only the page body crossfades — verified, the same element
instance persists across a route change.

`app.pageTransition` in `nuxt.config.ts` names the transition `page`; its CSS
sits in `app/assets/css/tailwind.css` **outside** `@layer components` on
purpose. Vue only adds `.page-enter-active` and friends at runtime, so inside a
layer Tailwind's purge strips them — the transition silently does nothing.

Content pages under `[...slug].vue` set no layout, so they stay exactly as they
were, with the Notion cover flush to the top of the viewport.

**Placeholders to fill in before this goes public:**

| Where | Placeholder |
|---|---|
| Contact | `hello@isaactan.work` |

## Notes on the toolchain

- `.npmrc` sets `legacy-peer-deps=true`. Plain `npm install` crashes on
  npm 10.9.7 with `Cannot read properties of null (reading 'edgesOut')` while
  resolving Nuxt's optional peer deps; this flag avoids the buggy code path.
- `better-sqlite3` is a direct dependency because Nuxt Content v3 requires it
  to build its content database.
- `nuxt.config.ts` sets `tailwindcss.cssPath` explicitly: the module resolves
  its default path against `rootDir`, which misses Nuxt 4's `app/` srcDir.

## Deployment

Images are built by GitHub Actions and published to GitHub Container Registry;
the home server only ever pulls. Nothing is compiled on the box, and a build
that fails never reaches it.

```
push to master ──▶ .github/workflows/docker.yml ──▶ ghcr.io/isaactan98/isaactan.work:latest
                                                              │
                                          docker compose pull │ on the server
                                                              ▼
                                                   compose.yml ──▶ :3000 (loopback)
                                                              ▼
                                                     cloudflared ──▶ isaactan.work
```

### Building

`Dockerfile` is two stages. The build stage is pinned to `$BUILDPLATFORM` so
`npm ci` and `nuxt build` always run natively on the amd64 runner rather than
under emulation; only the runtime stage varies per architecture. This works
because `better-sqlite3` ships prebuilt binaries for linux x64 and arm64, glibc
and musl alike, and selects one *at runtime* — `lib/binding.js` resolves
`prebuilds/${platform}-${arch}.node`, detecting musl from the absence of
`glibcVersionRuntime`. Nothing is bound at build time, so one bundle runs on all
of them. Images are published for `linux/amd64` and `linux/arm64`.

The runtime stage installs nothing — `nuxt build` emits a self-contained server
under `.output`, its dependencies included.

#### Why `npm ci --ignore-scripts`

Required, not tidiness. `better-sqlite3` ships a `binding.gyp`, so npm runs
`node-gyp rebuild` for it whatever the lockfile says. That build is a no-op —
`binding.gyp` executes `lib/binding.js`, finds a matching prebuilt binary and
compiles nothing, which is why there is never a `build/Release/*.node` — but
node-gyp still needs Python merely to evaluate the gyp file, and the Alpine
image has none. The install dies before it can decide to do nothing.

Skipping install scripts sidesteps it: the prebuilds are already in the package
and are resolved ahead of any node-gyp output. The root `postinstall`
(`nuxt prepare`) is skipped too, and `nuxt build` performs the same preparation
itself. As a side benefit, no dependency executes arbitrary code at install time.

### On the server

```bash
docker compose pull && docker compose up -d
```

The package is private by default, so the box authenticates once with a classic
PAT carrying `read:packages`:

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u isaactan98 --password-stdin
```

Making the package public in the repository's Package settings removes that step.

The host port is bound to loopback, not `0.0.0.0`: the only thing that should
reach it is `cloudflared` on the same host. Nothing is exposed to the LAN and no
port is forwarded on the router — which is exactly what the diagram on the
landing page claims, so it needs to stay true. If `cloudflared` runs as a
container instead, swap the `ports` block for the shared network commented out
in `compose.yml`.

The published port is **8168**, not 3000 — 3000 is heavily contested on a
homelab (Grafana and half of npm default to it). Only the host side moved; the
container still listens on 3000, so the Dockerfile's `ENV`, `EXPOSE` and
healthcheck are unchanged. Point the tunnel at `http://localhost:8168`.

Anything replacing it wants to be above 1024 (no privilege needed), below 32768
(the ephemeral range this box allocates outgoing connections from — check with
`cat /proc/sys/net/ipv4/ip_local_port_range`), and clear of the usual squatters:
9000 is Portainer, 8888 Jupyter, 8080 http-alt, 1688 Microsoft KMS.

### Two things worth knowing

- `server/api/health.ts` backs the container healthcheck. It deliberately does
  not touch the content database: a health check that fails for reasons
  unrelated to liveness causes restart loops rather than preventing them.
- The container is **not** `read_only`. Nuxt Content v3 builds its query
  database on the first request, writing `.output/server/contents.sqlite`. That
  file is derived entirely from baked-in content and is rebuilt on every start,
  so there is nothing to persist — but the filesystem has to be writable and the
  `node` user has to own `.output`.

## Not in this phase

Nuxt Studio and static generation (`nuxt generate`) are out of scope for now —
the site is served by the Nitro node server, not as static files.
