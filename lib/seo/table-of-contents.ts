/**
 * Table of Contents (TOC) auto-generation from HTML content.
 * Parses h2/h3 headings and generates anchor-friendly IDs.
 */

export interface TocItem {
  id: string
  text: string
  level: number
}

/**
 * Generate a slug ID from heading text for use as anchor links.
 * Handles Vietnamese characters by stripping diacritics.
 *
 * @param text - Heading text to slugify
 * @returns URL-safe slug string
 */
export function generateHeadingId(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Generate a Table of Contents from HTML content.
 * Extracts h2 and h3 headings, strips HTML tags from heading text,
 * and generates slug IDs for anchor links.
 *
 * @param htmlContent - Raw HTML content string
 * @returns Array of TOC items with id, text, and heading level
 */
export function generateTableOfContents(htmlContent: string): TocItem[] {
  if (!htmlContent) return []

  const items: TocItem[] = []
  const regex = /<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi
  let match: RegExpExecArray | null

  while ((match = regex.exec(htmlContent)) !== null) {
    const level = parseInt(match[1], 10)
    // Strip HTML tags from heading content
    const text = match[2]
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, ' ')
      .trim()

    if (text) {
      items.push({
        id: generateHeadingId(text),
        text,
        level,
      })
    }
  }

  return items
}
