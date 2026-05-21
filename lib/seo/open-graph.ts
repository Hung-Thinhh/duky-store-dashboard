/**
 * Open Graph and Twitter Card meta tag generator for blog posts.
 * Generates meta tag objects for use in the storefront <head>.
 */

export interface OpenGraphPost {
  title: string
  excerpt?: string | null
  coverMedia?: { url: string } | null
  slug?: string | null
  siteUrl?: string
  seo?: {
    ogTitle?: string | null
    ogDescription?: string | null
    ogImageMediaId?: string | null
    twitterTitle?: string | null
    twitterDescription?: string | null
    metaTitle?: string | null
    metaDescription?: string | null
  } | null
}

export interface MetaTag {
  property?: string
  name?: string
  content: string
}

/**
 * Generate Open Graph and Twitter Card meta tags for a blog post.
 * Falls back to SEO title/description, then to post title/excerpt.
 *
 * @param post - Blog post data with optional SEO fields
 * @returns Array of meta tag objects ready to be rendered as <meta> tags
 */
export function generateOpenGraphMeta(post: OpenGraphPost): MetaTag[] {
  const siteUrl = post.siteUrl || 'https://duky.store'
  const postUrl = post.slug ? `${siteUrl}/blog/${post.slug}` : siteUrl

  const ogTitle = post.seo?.ogTitle || post.seo?.metaTitle || post.title || ''
  const ogDescription =
    post.seo?.ogDescription || post.seo?.metaDescription || post.excerpt || ''
  const ogImage = post.coverMedia?.url || ''

  const twitterTitle = post.seo?.twitterTitle || ogTitle
  const twitterDescription = post.seo?.twitterDescription || ogDescription

  const tags: MetaTag[] = [
    // Open Graph tags
    { property: 'og:title', content: ogTitle },
    { property: 'og:description', content: ogDescription },
    { property: 'og:image', content: ogImage },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: postUrl },
    // Twitter Card tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: twitterTitle },
    { name: 'twitter:description', content: twitterDescription },
    { name: 'twitter:image', content: ogImage },
  ]

  return tags
}
