import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: '**/*.md',
      /**
       * `type: 'page'` already supplies title, description and path. This adds
       * the fields the /jb and /sg indexes sort and filter on.
       *
       * Everything is optional or defaulted on purpose: a post missing its
       * frontmatter should still build and still appear, just without a date.
       * A schema that rejects a half-finished draft is a schema that stops you
       * writing.
       */
      schema: z.object({
        // ISO `YYYY-MM-DD`. Stored as a string so it sorts lexicographically,
        // which for ISO dates is chronological — no timezone to get wrong.
        date: z.string().optional(),
        tags: z.array(z.string()).default([]),
        // Drafts stay out of the indexes but remain reachable by direct URL,
        // so a work in progress can be shared without being listed.
        draft: z.boolean().default(false)
      })
    })
  }
})
