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
        }
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
     * specifically so mobile, reduced-motion and no-WebGL visitors never
     * fetch the three.js+gsap bundle behind it — Nuxt's build-time manifest
     * step can't see that runtime condition, so without this hook every
     * visitor downloaded it regardless of whether the scene ever renders.
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
