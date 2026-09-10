import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

/**
 * Notion-inspired neutral light theme.
 * Colours are deliberately off-white / soft-grey rather than pure #fff / #000.
 */
export default <Partial<Config>>{
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ],
        // Data, labels, metadata — and the landing-page headline.
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      colors: {
        // Page surfaces
        canvas: '#fbfbfa',
        surface: '#ffffff',
        // Text
        ink: '#37352f',
        'ink-muted': '#787774',
        'ink-faint': '#9b9a97',
        // Lines
        line: '#e9e9e7',
        'line-strong': '#dfdfdd',
        // The page's only chromatic accent, and it is semantic: it marks a row
        // that is still running (current role, open to work). Nothing else.
        signal: '#4a8f5b',
        // Callout tints (Notion block backgrounds)
        callout: {
          default: '#f1f1ef',
          info: '#e7f3f8',
          warning: '#fbf3db',
          success: '#edf3ec'
        }
      },
      maxWidth: {
        content: '720px',
        // The landing page runs a four-column CV table and needs a little more
        // room than the 720px reading column.
        page: '820px'
      },
      typography: (theme: (path: string) => string) => ({
        notion: {
          css: {
            '--tw-prose-body': theme('colors.ink'),
            '--tw-prose-headings': theme('colors.ink'),
            '--tw-prose-lead': theme('colors.ink-muted'),
            '--tw-prose-links': theme('colors.ink'),
            '--tw-prose-bold': theme('colors.ink'),
            '--tw-prose-counters': theme('colors.ink-muted'),
            '--tw-prose-bullets': theme('colors.ink-faint'),
            '--tw-prose-hr': theme('colors.line'),
            '--tw-prose-quotes': theme('colors.ink'),
            '--tw-prose-quote-borders': theme('colors.ink'),
            '--tw-prose-captions': theme('colors.ink-muted'),
            '--tw-prose-code': theme('colors.ink'),
            '--tw-prose-pre-code': theme('colors.ink'),
            '--tw-prose-pre-bg': theme('colors.callout.default'),
            '--tw-prose-th-borders': theme('colors.line-strong'),
            '--tw-prose-td-borders': theme('colors.line'),

            maxWidth: '720px',
            fontSize: '1rem',
            lineHeight: '1.6',

            // Notion headings are restrained: semibold, modest scale, tight leading.
            'h1, h2, h3, h4': {
              fontWeight: '600',
              letterSpacing: '-0.01em',
              lineHeight: '1.3'
            },
            h1: { fontSize: '1.875rem', marginTop: '2rem', marginBottom: '0.5rem' },
            h2: { fontSize: '1.5rem', marginTop: '1.75rem', marginBottom: '0.5rem' },
            h3: { fontSize: '1.25rem', marginTop: '1.5rem', marginBottom: '0.4rem' },
            h4: { fontSize: '1.0625rem', marginTop: '1.25rem', marginBottom: '0.35rem' },

            p: { marginTop: '0.5rem', marginBottom: '0.5rem' },

            a: {
              textDecoration: 'underline',
              textDecorationColor: theme('colors.line-strong'),
              textUnderlineOffset: '3px',
              fontWeight: '500'
            },
            'a:hover': { textDecorationColor: theme('colors.ink-muted') },

            // Nuxt Content wraps headings in self-referencing anchors; keep
            // them looking like plain headings rather than links.
            'h1 a, h2 a, h3 a, h4 a': {
              color: 'inherit',
              fontWeight: 'inherit',
              textDecoration: 'none'
            },

            hr: { marginTop: '2rem', marginBottom: '2rem' },

            blockquote: {
              fontStyle: 'normal',
              fontWeight: '400',
              borderLeftWidth: '3px',
              paddingLeft: '0.875rem'
            },
            'blockquote p:first-of-type::before': { content: 'none' },
            'blockquote p:last-of-type::after': { content: 'none' },

            code: {
              backgroundColor: '#f4f3f1',
              color: '#eb5757',
              fontWeight: '400',
              borderRadius: '3px',
              padding: '0.15em 0.35em',
              fontSize: '0.875em'
            },
            'code::before': { content: 'none' },
            'code::after': { content: 'none' },

            pre: {
              border: `1px solid ${theme('colors.line')}`,
              borderRadius: '4px',
              padding: '1rem'
            },
            'pre code': {
              backgroundColor: 'transparent',
              color: 'inherit',
              padding: '0'
            },

            'ul, ol': { marginTop: '0.5rem', marginBottom: '0.5rem', paddingLeft: '1.5rem' },
            li: { marginTop: '0.15rem', marginBottom: '0.15rem' },

            img: { borderRadius: '4px' },

            // Never let the typography plugin restyle the custom MDC blocks.
            '[data-notion-block]': { margin: '0.5rem 0' },
            '[data-notion-block] p': { margin: '0' }
          }
        }
      })
    }
  },
  plugins: [typography]
}
