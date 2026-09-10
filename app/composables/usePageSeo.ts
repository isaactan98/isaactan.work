/**
 * One place for the page metadata, because the share card is the first thing
 * most people see of this site — links travel through WhatsApp and LinkedIn
 * long before anyone types the domain. A page without og: tags renders there as
 * a bare grey URL.
 *
 * `og.png` is generated from the card template rather than hand-drawn; regenerate
 * it if the headline changes so the two do not drift apart.
 */
const SITE_URL = 'https://isaactan.work'
const SITE_NAME = 'Isaac Tan'

type PageSeo = {
  title: string
  description: string
  /** Route path, leading slash, no trailing slash — used for og:url and canonical. */
  path: string
  /** Absolute-from-root image path. Defaults to the site card. */
  image?: string
}

export function usePageSeo({ title, description, path, image = '/og.png' }: PageSeo) {
  const url = `${SITE_URL}${path}`
  const imageUrl = `${SITE_URL}${image}`

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogType: 'website',
    ogUrl: url,
    ogSiteName: SITE_NAME,
    ogImage: imageUrl,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: description,
    ogLocale: 'en_SG',
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: imageUrl
  })

  // Canonical names the production URL even while developing locally; that is
  // what it is for.
  useHead({ link: [{ rel: 'canonical', href: url }] })
}
