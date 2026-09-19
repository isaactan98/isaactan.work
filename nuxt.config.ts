// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/content', '@nuxtjs/tailwindcss'],

  css: ['~/assets/css/tailwind.css'],

  // @nuxtjs/tailwindcss resolves its default cssPath against rootDir, which
  // misses Nuxt 4's app/ srcDir — point it at the real file explicitly.
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: '~~/tailwind.config.ts',
    viewer: false
  },

  app: {
    // The header lives in layouts/site.vue, so only the page body crossfades.
    pageTransition: { name: 'page', mode: 'out-in' },

    head: {
      htmlAttrs: { lang: 'en' },

      // The address bar and the tab strip either side of the page. `theme-color`
      // is the canvas, so mobile Chrome's chrome continues the page rather than
      // sitting against it in default grey.
      meta: [{ name: 'theme-color', content: '#fbfbfa' }],

      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href:
            'https://fonts.googleapis.com/css2' +
            '?family=Inter:wght@400;500;600;700' +
            '&family=IBM+Plex+Mono:wght@400;500;600' +
            '&display=swap'
        },

        // Icons. `.ico` is declared first and carries `sizes`, so a browser that
        // cannot read SVG picks it without guessing; anything modern prefers the
        // vector on the line below and scales it without a raster step.
        // See scripts/generate-icons.mjs — the rasters are rendered from
        // favicon.svg, so edit the SVG and re-run rather than touching a PNG.
        { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        // iOS ignores the manifest icons when adding to the home screen.
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' }
      ]
    }
  },

  content: {
    build: {
      markdown: {
        toc: { depth: 3 },
        highlight: {
          theme: { default: 'github-light', dark: 'github-dark' }
        }
      }
    }
  },

  hooks: {
    /**
     * Nuxt injects a <link rel="prefetch"> for every async-loaded chunk
     * reachable from a page, independent of Vite's own `modulePreload`
     * mechanism (confirmed: setting `vite.build.modulePreload.
     * resolveDependencies` to strip everything had zero effect on these
     * specific links — they come from Nuxt's own manifest-prefetch step,
     * not Vite's). HeroShowcase.vue's `import('./HeroScene3D.vue')` is
     * written as an imperative call inside a feature-detection check
     * specifically so reduced-motion, no-WebGL and saved-data visitors never
     * fetch the three.js+gsap bundle behind it — Nuxt's build-time manifest
     * step can't see that runtime condition, so without this hook every
     * visitor downloaded it regardless of whether the scene ever renders.
     *
     * Phones were on that list until 2026-09-19 and are not any more, which
     * makes the hook matter more rather than less: prefetching would now hand
     * the chunk to every visitor on every device up front, including the ones
     * that have explicitly asked not to be given it.
     *
     * Matched by the manifest's source-path key (contains "HeroScene3D"),
     * not the hashed output filename, which changes every build. Scoped to
     * that one entry rather than disabling prefetch globally — the same
     * mechanism legitimately speeds up navigation to /work, /freelance and
     * the writing indexes, and there is no reason to give that up here.
     */
    'build:manifest': (manifest) => {
      for (const [key, chunk] of Object.entries(manifest)) {
        if (key.includes('HeroScene3D')) {
          chunk.prefetch = false
          chunk.preload = false
        }
      }
    }
  }
})
