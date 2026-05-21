/**
 * Schema Markup / Structured Data (JSON-LD) generator for blog posts.
 * Generates BlogPosting schema for use in the storefront <head>.
 */

export interface SchemaMarkupPost {
  title: string
  excerpt?: string | null
  coverMedia?: { url: string } | null
  author?: { fullName?: string | null } | null
  publishedAt?: string | null
  updatedAt?: string | null
  slug?: string | null
  siteUrl?: string
}

export interface BlogPostingJsonLd {
  '@context': string
  '@type': string
  headline: string
  description: string
  image: string
  author: {
    '@type': string
    name: string
  }
  datePublished: string
  dateModified: string
  publisher: {
    '@type': string
    name: string
  }
  mainEntityOfPage: {
    '@type': string
    '@id': string
  }
}

/**
 * Generate JSON-LD structured data for a blog post (BlogPosting schema).
 * This is intended to be rendered as a <script type="application/ld+json"> tag
 * in the storefront's <head> section.
 *
 * @param post - Blog post data
 * @returns JSON-LD object conforming to schema.org BlogPosting
 */
export function generateArticleJsonLd(post: SchemaMarkupPost): BlogPostingJsonLd {
  const siteUrl = post.siteUrl || 'https://duky.store'
  const postUrl = post.slug ? `${siteUrl}/blog/${post.slug}` : siteUrl

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title || '',
    description: post.excerpt || '',
    image: post.coverMedia?.url || '',
    author: {
      '@type': 'Person',
      name: post.author?.fullName || 'Duky Store',
    },
    datePublished: post.publishedAt || new Date().toISOString(),
    dateModified: post.updatedAt || post.publishedAt || new Date().toISOString(),
    publisher: {
      '@type': 'Organization',
      name: 'Duky Store',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
  }
}
