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
  }
})
