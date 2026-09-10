# syntax=docker/dockerfile:1

# Two stages: build the Nitro bundle once, then ship it on a bare Node runtime.
# The runtime stage installs nothing — `nuxt build` already emits a
# self-contained server under .output, dependencies included.

ARG NODE_IMAGE=node:22-alpine

# ---- build ------------------------------------------------------------------
# Pinned to the *builder's* own architecture rather than the target's.
# better-sqlite3 ships prebuilt binaries for every platform it supports
# (linux-x64, linux-arm64 and the musl variants of both), so the bundle this
# stage produces already runs on any of them. There is nothing to cross-compile,
# and emulating an npm install + Nuxt build under QEMU would cost several
# minutes per architecture for an identical result.
FROM --platform=$BUILDPLATFORM ${NODE_IMAGE} AS build

WORKDIR /app

# .npmrc carries legacy-peer-deps, without which npm 10.9.x crashes resolving
# Nuxt's optional peer dependencies. It has to be present before `npm ci` runs.
COPY package.json package-lock.json .npmrc ./
RUN npm ci

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
