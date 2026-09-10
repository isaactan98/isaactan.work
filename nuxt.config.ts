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
  }
})
