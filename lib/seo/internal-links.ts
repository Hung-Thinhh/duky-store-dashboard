/**
 * Internal link suggestion utility.
 * Suggests related blog posts to link to based on word overlap.
 */

export interface PostSummary {
  title: string
  slug: string
}

export interface InternalLinkSuggestion {
  title: string
  slug: string
  relevance: number
}

/**
 * Normalize text for word matching: strip diacritics, lowercase, split into words.
 */
function normalizeWords(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2)
}

/**
 * Suggest internal links based on word overlap between current content
 * and other blog post titles.
 *
 * Simple relevance scoring: count how many words from the post title
 * appear in the current content. Higher count = more relevant.
 *
 * @param currentContent - HTML content of the current blog post
 * @param allPosts - Array of other blog posts with title and slug
 * @returns Top 5 suggestions sorted by relevance (descending)
 */
export function suggestInternalLinks(
  currentContent: string,
  allPosts: PostSummary[]
): InternalLinkSuggestion[] {
  if (!currentContent || allPosts.length === 0) return []

  const contentWords = new Set(normalizeWords(currentContent))

  const scored: InternalLinkSuggestion[] = allPosts
    .map((post) => {
      const titleWords = normalizeWords(post.title)
      if (titleWords.length === 0) return { ...post, relevance: 0 }

      const matchCount = titleWords.filter((word) => contentWords.has(word)).length
      const relevance = matchCount / titleWords.length

      return {
        title: post.title,
        slug: post.slug,
        relevance: Math.round(relevance * 100) / 100,
      }
    })
    .filter((item) => item.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)

  return scored.slice(0, 5)
}
