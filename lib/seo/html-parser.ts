import type { ParsedContent } from './types'

/**
 * Strip all HTML tags and return plain text content.
 */
export function extractTextContent(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extract all h2 and h3 headings from HTML.
 */
export function extractHeadings(html: string): { level: number; text: string }[] {
  const headings: { level: number; text: string }[] = []
  const regex = /<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi
  let match: RegExpExecArray | null

  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1], 10)
    const text = extractTextContent(match[2])
    if (text) {
      headings.push({ level, text })
    }
  }

  return headings
}

/**
 * Extract all images with their src and alt attributes.
 */
export function extractImages(html: string): { src: string; alt: string }[] {
  const images: { src: string; alt: string }[] = []
  const regex = /<img\s[^>]*?>/gi
  let match: RegExpExecArray | null

  while ((match = regex.exec(html)) !== null) {
    const tag = match[0]
    const srcMatch = tag.match(/src=["']([^"']*)["']/i)
    const altMatch = tag.match(/alt=["']([^"']*)["']/i)
    images.push({
      src: srcMatch ? srcMatch[1] : '',
      alt: altMatch ? altMatch[1] : '',
    })
  }

  return images
}

/**
 * Extract all links and classify them as internal or external.
 */
export function extractLinks(
  html: string,
  siteUrl: string
): { internal: { href: string }[]; external: { href: string }[] } {
  const internal: { href: string }[] = []
  const external: { href: string }[] = []
  const regex = /<a\s[^>]*?href=["']([^"']*)["'][^>]*?>/gi
  let match: RegExpExecArray | null

  while ((match = regex.exec(html)) !== null) {
    const href = match[1]
    if (isExternalLink(href, siteUrl)) {
      external.push({ href })
    } else {
      internal.push({ href })
    }
  }

  return { internal, external }
}

/**
 * Count words in a text string.
 */
export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

/**
 * Extract paragraph text content from HTML.
 */
export function extractParagraphs(html: string): string[] {
  const paragraphs: string[] = []
  const regex = /<p[^>]*>([\s\S]*?)<\/p>/gi
  let match: RegExpExecArray | null

  while ((match = regex.exec(html)) !== null) {
    const text = extractTextContent(match[1])
    if (text) {
      paragraphs.push(text)
    }
  }

  return paragraphs
}

/**
 * Determine if a link is external based on hostname comparison.
 */
export function isExternalLink(href: string, siteUrl: string): boolean {
  try {
    // Handle protocol-relative URLs
    const normalizedHref = href.startsWith('//')
      ? `https:${href}`
      : href

    const linkUrl = new URL(normalizedHref, siteUrl)
    const site = new URL(siteUrl)
    return linkUrl.hostname !== site.hostname
  } catch {
    // If URL parsing fails, treat as internal (relative path)
    return false
  }
}

/**
 * Parse HTML content into structured data for SEO analysis.
 * Uses regex-based parsing for server/client compatibility.
 */
export function parseHtmlContent(html: string, siteUrl: string): ParsedContent {
  const text = extractTextContent(html)
  const words = text.split(/\s+/).filter(Boolean)
  const headings = extractHeadings(html)
  const images = extractImages(html)
  const linkResult = extractLinks(html, siteUrl)
  const paragraphs = extractParagraphs(html)

  const links = [
    ...linkResult.internal.map((l) => ({ href: l.href, isExternal: false })),
    ...linkResult.external.map((l) => ({ href: l.href, isExternal: true })),
  ]

  const hasMedia =
    images.length > 0 || /<video[\s>]/i.test(html)

  return { text, words, headings, images, links, paragraphs, hasMedia }
}
