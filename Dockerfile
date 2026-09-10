# syntax=docker/dockerfile:1

# Two stages: build the Nitro bundle once, then ship it on a bare Node runtime.
# The runtime stage installs nothing — `nuxt build` already emits a
# self-contained server under .output, dependencies included.

ARG NODE_IMAGE=node:22-alpine

# ---- build ------------------------------------------------------------------
# Pinned to the *builder's* own architecture rather than the target's.
#
# better-sqlite3 ships prebuilt binaries for every platform it supports
# (linux-x64, linux-arm64 and the musl variants of both) and picks one at
# runtime: lib/binding.js resolves prebuilds/${platform}-${arch}.node, detecting
# musl from the absence of glibcVersionRuntime. Nothing is chosen at build time,
# so the bundle this stage produces runs unmodified on any of those targets.
#
# There is therefore nothing to cross-compile, and emulating an npm install plus
# a Nuxt build under QEMU would cost minutes per architecture for a byte-identical
# result. Only the runtime stage below varies per target.
FROM --platform=$BUILDPLATFORM ${NODE_IMAGE} AS build

WORKDIR /app

# .npmrc carries legacy-peer-deps, without which npm 10.9.x crashes resolving
# Nuxt's optional peer dependencies. It has to be present before `npm ci` runs.
COPY package.json package-lock.json .npmrc ./

# --ignore-scripts is required here, not merely tidy.
#
# better-sqlite3 ships a binding.gyp, so npm runs `node-gyp rebuild` for it
# regardless of anything in the lockfile. That build is a no-op — binding.gyp
# executes lib/binding.js, sees a matching prebuilt binary and compiles nothing
# (there is never a build/Release/*.node) — but node-gyp still needs Python
# just to evaluate the gyp file, and this image has none. The install dies
# before it can decide to do nothing.
#
# Skipping install scripts avoids that entirely: the prebuilt binaries ship in
# the package and lib/binding.js resolves them at runtime by platform, arch and
# libc, ahead of any node-gyp output. It also stops dependencies executing
# arbitrary code at install time, which is worth having on its own.
#
# The root postinstall (`nuxt prepare`) is skipped too; `nuxt build` performs
# the same preparation itself, verified against a clean install.
RUN npm ci --ignore-scripts

# Manifests are copied separately above so this layer — the expensive one — is
# only invalidated when a dependency actually changes.
COPY . .
RUN npm run build

# ---- runtime ----------------------------------------------------------------
FROM ${NODE_IMAGE} AS runtime

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

WORKDIR /app

# The chown is load-bearing, not tidiness: Nuxt Content v3 builds its query
# database on the first request, writing .output/server/contents.sqlite. The
# unprivileged user has to own that directory or the first hit 500s.
COPY --from=build --chown=node:node /app/.output ./.output

USER node
EXPOSE 3000

# Hits the dedicated endpoint rather than `/` so a check does not render the
# whole page every thirty seconds.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", ".output/server/index.mjs"]
