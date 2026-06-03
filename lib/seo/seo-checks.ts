import type { SeoInput, SeoCheckResult, ParsedContent } from './types'
import {
  extractTextContent,
  extractHeadings,
  extractImages,
  extractLinks,
  extractParagraphs,
  countWords,
  parseHtmlContent,
} from './html-parser'

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Check if text contains keyword (case-insensitive, whole phrase match, Vietnamese NFC normalized).
 */
export function containsKeyword(text: string, keyword: string): boolean {
  if (!keyword.trim()) return false
  const normalizedText = text.normalize('NFC').toLowerCase()
  const normalizedKeyword = keyword.normalize('NFC').toLowerCase().trim()
  return normalizedText.includes(normalizedKeyword)
}

function getSecondaryKeywords(input: SeoInput): string[] {
  return (input.secondaryKeywords ?? [])
    .map((keyword) => keyword.trim())
    .filter(Boolean)
}

function countMatchedKeywords(text: string, keywords: string[]): number {
  return keywords.filter((keyword) => containsKeyword(text, keyword)).length
}

/**
 * Count non-overlapping occurrences of keyword in text (case-insensitive, Vietnamese NFC normalized).
 */
export function countKeywordOccurrences(text: string, keyword: string): number {
  if (!keyword.trim()) return 0
  const normalizedText = text.normalize('NFC').toLowerCase()
  const normalizedKeyword = keyword.normalize('NFC').toLowerCase().trim()
  let count = 0
  let pos = 0
  while ((pos = normalizedText.indexOf(normalizedKeyword, pos)) !== -1) {
    count++
    pos += normalizedKeyword.length
  }
  return count
}

/**
 * Helper to convert text to a clean URL slug.
 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Loai bo dau tieng Viet
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')    // Loai bo ky tu dac biet
    .trim()
    .replace(/\s+/g, '-')            // Thay the khoang trang bang dau gach ngang
    .replace(/-+/g, '-')             // Tranh nhieu dau gach ngang lien nhau
}

/**
 * Calculate keyword density: (occurrences * keywordWordCount / totalWords) × 100.
 */
export function calculateKeywordDensity(text: string, keyword: string): number {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0 || !keyword.trim()) return 0
  const occurrences = countKeywordOccurrences(text, keyword)
  const keywordWordCount = keyword.split(/\s+/).filter(Boolean).length
  return (occurrences * keywordWordCount / words.length) * 100
}

/**
 * Check if keyword appears in the first 10% of words.
 */
export function keywordInIntro(words: string[], keyword: string): boolean {
  if (words.length === 0 || !keyword.trim()) return false
  const introLength = Math.max(1, Math.ceil(words.length * 0.1))
  const introText = words.slice(0, introLength).join(' ')
  return containsKeyword(introText, keyword)
}

/**
 * Check if keyword appears in the first 50% of the title.
 */
export function keywordAtBeginningOfTitle(title: string, keyword: string): boolean {
  if (!title.trim() || !keyword.trim()) return false
  const normalizedTitle = title.normalize('NFC').toLowerCase()
  const normalizedKeyword = keyword.normalize('NFC').toLowerCase().trim()

  const index = normalizedTitle.indexOf(normalizedKeyword)
  if (index === -1) return false

  return index <= Math.max(0, title.length / 2)
}

// ─── Individual Check Functions ──────────────────────────────────────────────

/**
 * Check: Focus keyword appears in SEO title.
 */
export function checkKeywordInTitle(input: SeoInput): SeoCheckResult {
  return {
    id: 'keyword-in-title',
    label: 'Focus keyword trong SEO Title',
    passed: containsKeyword(input.seoTitle, input.focusKeyword),
    category: 'basic',
    description: 'Focus keyword nên xuất hiện trong SEO title để cải thiện ranking.',
  }
}

/**
 * Check: Focus keyword appears in meta description.
 */
export function checkKeywordInMetaDescription(input: SeoInput): SeoCheckResult {
  return {
    id: 'keyword-in-meta-description',
    label: 'Focus keyword trong Meta Description',
    passed: containsKeyword(input.metaDescription, input.focusKeyword),
    category: 'basic',
    description: 'Focus keyword nên xuất hiện trong meta description.',
  }
}

/**
 * Check: Focus keyword appears in URL slug (normalized Vietnamese tone & special chars comparison).
 */
export function checkKeywordInUrl(input: SeoInput): SeoCheckResult {
  const normalizedSlug = toSlug(input.slug)
  const keywordSlug = toSlug(input.focusKeyword)
  const passed = keywordSlug ? normalizedSlug.includes(keywordSlug) || normalizedSlug.replace(/-/g, '').includes(keywordSlug.replace(/-/g, '')) : false

  return {
    id: 'keyword-in-slug',
    label: 'Focus keyword trong URL slug',
    passed,
    category: 'basic',
    description: 'URL slug nên chứa focus keyword.',
  }
}

/**
 * Check: Focus keyword appears in the first 10% of content.
 */
export function checkKeywordInIntro(input: SeoInput): SeoCheckResult {
  const text = extractTextContent(input.htmlContent)
  const words = text.split(/\s+/).filter(Boolean)
  return {
    id: 'keyword-in-intro',
    label: 'Focus keyword trong phần mở đầu nội dung',
    passed: keywordInIntro(words, input.focusKeyword),
    category: 'basic',
    description: 'Focus keyword nên xuất hiện trong 10% đầu tiên của nội dung.',
  }
}

/**
 * Check: Focus keyword appears at least once in content.
 */
export function checkKeywordInContent(input: SeoInput): SeoCheckResult {
  const text = extractTextContent(input.htmlContent)
  return {
    id: 'keyword-in-content',
    label: 'Focus keyword xuất hiện trong nội dung',
    passed: containsKeyword(text, input.focusKeyword),
    category: 'basic',
    description: 'Focus keyword phải xuất hiện ít nhất một lần trong nội dung.',
  }
}

/**
 * Check: Content has at least 600 words.
 */
export function checkContentLength(input: SeoInput): SeoCheckResult {
  const text = extractTextContent(input.htmlContent)
  const wordCount = countWords(text)
  return {
    id: 'content-length',
    label: 'Nội dung tối thiểu 600 từ',
    passed: wordCount >= 600,
    category: 'basic',
    description: `Nội dung hiện có ${wordCount} từ. Cần tối thiểu 600 từ.`,
  }
}

/**
 * Check: Focus keyword appears in at least one h2/h3 subheading.
 */
export function checkKeywordInSubheadings(input: SeoInput): SeoCheckResult {
  const headings = extractHeadings(input.htmlContent)
  return {
    id: 'keyword-in-subheading',
    label: 'Focus keyword trong subheading (H2/H3)',
    passed: headings.some((h) => containsKeyword(h.text, input.focusKeyword)),
    category: 'additional',
    description: 'Focus keyword nên xuất hiện trong ít nhất một subheading.',
  }
}

/**
 * Check: Focus keyword appears in at least one image alt text.
 */
export function checkKeywordInImageAlt(input: SeoInput): SeoCheckResult {
  const images = extractImages(input.htmlContent)
  const hasImages = images.length > 0
  const passed = hasImages && images.some((img) => containsKeyword(img.alt, input.focusKeyword))
  return {
    id: 'keyword-in-image-alt',
    label: 'Focus keyword trong alt text ảnh',
    passed,
    category: 'additional',
    description: hasImages 
      ? 'Focus keyword nên xuất hiện trong alt text của ít nhất một ảnh.' 
      : 'Bài viết chưa có hình ảnh. Hãy thêm ảnh và tối ưu alt text chứa focus keyword.',
  }
}

/**
 * Check: Keyword density is between 1% and 2.5%.
 */
export function checkKeywordDensity(input: SeoInput): SeoCheckResult {
  const text = extractTextContent(input.htmlContent)
  const density = calculateKeywordDensity(text, input.focusKeyword)
  const passed = density >= 1.0 && density <= 2.5
  let msg = `Mật độ từ khóa hiện tại: ${density.toFixed(1)}%.`
  if (density < 1.0) msg += ' Hãy bổ sung thêm từ khóa một cách tự nhiên.'
  else if (density > 2.5) msg += ' Hãy giảm tần suất xuất hiện để tránh spam từ khóa.'
  else msg += ' Đây là mật độ lý tưởng.'

  return {
    id: 'keyword-density',
    label: `Keyword density (${density.toFixed(1)}%) trong khoảng 1-2.5%`,
    passed,
    category: 'additional',
    description: msg,
  }
}

/**
 * Check: URL slug is 75 characters or fewer.
 */
export function checkUrlLength(input: SeoInput): SeoCheckResult {
  return {
    id: 'url-length',
    label: 'URL slug không quá 75 ký tự',
    passed: input.slug.length <= 75,
    category: 'additional',
    description: `URL slug hiện có ${input.slug.length} ký tự. Nên không quá 75 ký tự.`,
  }
}

/**
 * Check: Content has at least one external link.
 */
export function checkExternalLinks(input: SeoInput): SeoCheckResult {
  const { external } = extractLinks(input.htmlContent, input.siteUrl)
  return {
    id: 'has-external-link',
    label: 'Có ít nhất một external link',
    passed: external.length > 0,
    category: 'additional',
    description: 'Nội dung nên có ít nhất một liên kết đến trang web bên ngoài.',
  }
}

/**
 * Check: Content has at least one internal link.
 */
export function checkInternalLinks(input: SeoInput): SeoCheckResult {
  const { internal } = extractLinks(input.htmlContent, input.siteUrl)
  return {
    id: 'has-internal-link',
    label: 'Có ít nhất một internal link',
    passed: internal.length > 0,
    category: 'additional',
    description: 'Nội dung nên có ít nhất một liên kết nội bộ.',
  }
}

export function checkSecondaryKeywordsInContent(input: SeoInput): SeoCheckResult {
  const keywords = getSecondaryKeywords(input)
  const text = extractTextContent(input.htmlContent)
  const matchedCount = countMatchedKeywords(text, keywords)
  const targetCount = Math.min(2, keywords.length)

  return {
    id: 'secondary-keywords-in-content',
    label: 'Từ khóa phụ xuất hiện tự nhiên trong nội dung',
    passed: keywords.length === 0 || matchedCount >= targetCount,
    category: 'additional',
    description:
      keywords.length === 0
        ? 'Chưa có từ khóa phụ. Không trừ điểm SEO.'
        : `Đã bao phủ ${matchedCount}/${keywords.length} từ khóa phụ. Nên có ít nhất ${targetCount} từ khóa phụ trong nội dung.`,
  }
}

export function checkSecondaryKeywordsInSubheadings(input: SeoInput): SeoCheckResult {
  const keywords = getSecondaryKeywords(input)
  const headingsText = extractHeadings(input.htmlContent)
    .map((heading) => heading.text)
    .join(' ')
  const matchedCount = countMatchedKeywords(headingsText, keywords)

  return {
    id: 'secondary-keywords-in-subheadings',
    label: 'Từ khóa phụ hỗ trợ H2/H3',
    passed: keywords.length === 0 || matchedCount > 0,
    category: 'additional',
    description:
      keywords.length === 0
        ? 'Chưa có từ khóa phụ. Không trừ điểm SEO.'
        : `Đã có ${matchedCount}/${keywords.length} từ khóa phụ trong heading. Đây là điểm cộng nhẹ, không bắt buộc.`,
  }
}

/**
 * Check: Focus keyword appears in the first 50% of the title.
 */
export function checkKeywordAtBeginningOfTitle(input: SeoInput): SeoCheckResult {
  return {
    id: 'keyword-at-beginning',
    label: 'Focus keyword ở đầu title (50% đầu)',
    passed: keywordAtBeginningOfTitle(input.seoTitle, input.focusKeyword),
    category: 'titleReadability',
    description: 'Focus keyword nên xuất hiện trong nửa đầu của SEO title.',
  }
}

/**
 * Check: Title contains at least one digit.
 */
export function checkTitleContainsNumber(input: SeoInput): SeoCheckResult {
  return {
    id: 'title-has-number',
    label: 'Title chứa chữ số',
    passed: /\d/.test(input.seoTitle),
    category: 'titleReadability',
    description: 'Title có chứa số sẽ thu hút click hơn (ví dụ: "10 cách...").',
  }
}

/**
 * Check: All paragraphs are 150 words or fewer.
 */
export function checkShortParagraphs(input: SeoInput): SeoCheckResult {
  const paragraphs = extractParagraphs(input.htmlContent)
  const allShort =
    paragraphs.length === 0 ||
    paragraphs.every((p) => countWords(p) <= 150)
  return {
    id: 'paragraph-length',
    label: 'Tất cả đoạn văn không quá 150 từ',
    passed: allShort,
    category: 'contentReadability',
    description: 'Mỗi đoạn văn nên có tối đa 150 từ để dễ đọc.',
  }
}

/**
 * Check: Content has at least one image or video.
 */
export function checkContentHasMedia(input: SeoInput): SeoCheckResult {
  const images = extractImages(input.htmlContent)
  const hasVideo = /<video[\s>]/i.test(input.htmlContent)
  return {
    id: 'has-media',
    label: 'Nội dung có ít nhất một ảnh hoặc video',
    passed: images.length > 0 || hasVideo,
    category: 'contentReadability',
    description: 'Nội dung nên có ít nhất một hình ảnh hoặc video.',
  }
}

/**
 * Split text into sentences using common sentence-ending punctuation.
 */
function splitSentences(text: string): string[] {
  return text
    .split(/[.!?。]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/**
 * Check: Average sentence length is ≤ 20 words.
 * Helps ensure content is easy to read.
 */
export function checkAverageSentenceLength(input: SeoInput): SeoCheckResult {
  const text = extractTextContent(input.htmlContent)
  const sentences = splitSentences(text)

  if (sentences.length === 0) {
    return {
      id: 'avg-sentence-length',
      label: 'Độ dài câu trung bình ≤ 20 từ',
      passed: true,
      category: 'contentReadability',
      description: 'Không có câu nào để phân tích.',
    }
  }

  const totalWords = sentences.reduce(
    (sum, sentence) => sum + sentence.split(/\s+/).filter(Boolean).length,
    0
  )
  const average = totalWords / sentences.length
  const passed = average <= 20

  return {
    id: 'avg-sentence-length',
    label: 'Độ dài câu trung bình ≤ 20 từ',
    passed,
    category: 'contentReadability',
    description: `Trung bình ${average.toFixed(1)} từ/câu. ${passed ? 'Tốt!' : 'Nên rút ngắn câu để dễ đọc hơn.'}`,
  }
}

/**
 * Check: No more than 3 consecutive sentences starting with the same word.
 * Improves readability by encouraging varied sentence structure.
 */
export function checkConsecutiveSentences(input: SeoInput): SeoCheckResult {
  const text = extractTextContent(input.htmlContent)
  const sentences = splitSentences(text)

  if (sentences.length <= 3) {
    return {
      id: 'consecutive-sentences',
      label: 'Không quá 3 câu liên tiếp bắt đầu cùng một từ',
      passed: true,
      category: 'contentReadability',
      description: 'Nội dung quá ngắn để kiểm tra.',
    }
  }

  let maxConsecutive = 1
  let currentConsecutive = 1

  for (let i = 1; i < sentences.length; i++) {
    const prevFirstWord = sentences[i - 1].split(/\s+/)[0]?.toLowerCase() || ''
    const currFirstWord = sentences[i].split(/\s+/)[0]?.toLowerCase() || ''

    if (prevFirstWord && currFirstWord && prevFirstWord === currFirstWord) {
      currentConsecutive++
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive)
    } else {
      currentConsecutive = 1
    }
  }

  const passed = maxConsecutive <= 3

  return {
    id: 'consecutive-sentences',
    label: 'Không quá 3 câu liên tiếp bắt đầu cùng một từ',
    passed,
    category: 'contentReadability',
    description: passed
      ? 'Cấu trúc câu đa dạng, tốt cho readability.'
      : `Có ${maxConsecutive} câu liên tiếp bắt đầu cùng một từ. Nên thay đổi cách mở đầu câu.`,
  }
}

/**
 * Run all 18 SEO checks and return the results.
 */
export function runAllChecks(input: SeoInput): SeoCheckResult[] {
  return [
    // Basic SEO (6 checks)
    checkKeywordInTitle(input),
    checkKeywordInMetaDescription(input),
    checkKeywordInUrl(input),
    checkKeywordInIntro(input),
    checkKeywordInContent(input),
    checkContentLength(input),
    // Additional (8 checks)
    checkKeywordInSubheadings(input),
    checkKeywordInImageAlt(input),
    checkKeywordDensity(input),
    checkSecondaryKeywordsInContent(input),
    checkSecondaryKeywordsInSubheadings(input),
    checkUrlLength(input),
    checkExternalLinks(input),
    checkInternalLinks(input),
    // Title Readability (2 checks)
    checkKeywordAtBeginningOfTitle(input),
    checkTitleContainsNumber(input),
    // Content Readability (4 checks)
    checkShortParagraphs(input),
    checkContentHasMedia(input),
    checkAverageSentenceLength(input),
    checkConsecutiveSentences(input),
  ]
}
