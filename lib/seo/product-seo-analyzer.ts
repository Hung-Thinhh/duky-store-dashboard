export type SeoCheckStatus = "good" | "warning" | "error"

export type SeoCheck = {
  id: string
  label: string
  status: SeoCheckStatus
  score: number
  maxScore: number
  detail?: string
}

export type SeoCheckGroup = {
  id: string
  title: string
  checks: SeoCheck[]
}

export type ProductSeoAnalysis = {
  score: number
  rating: SeoCheckStatus
  wordCount: number
  keywordDensity: number
  keywordOccurrences: number
  groups: SeoCheckGroup[]
}

export type ProductSeoAnalyzerInput = {
  productName?: string | null
  slug?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  focusKeyword?: string | null
  descriptionHtml?: string | null
  shortDescriptionHtml?: string | null
  imageAlts?: Array<string | null | undefined>
  hasImages?: boolean
}

const htmlTagPattern = /<[^>]*>/g
const whitespacePattern = /\s+/g
const wordPattern = /[\p{L}\p{N}]+/gu

function normalizeText(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
}

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

function stripHtml(value?: string | null) {
  return (value ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(htmlTagPattern, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(whitespacePattern, " ")
    .trim()
}

function getWords(value: string) {
  return normalizeText(value).match(wordPattern) ?? []
}

function getKeywords(value?: string | null) {
  return (value ?? "")
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean)
}

function includesKeyword(value: string, keywords: string[]) {
  if (!value || !keywords.length) return false
  const normalizedValueNFC = value.normalize('NFC').toLowerCase()
  const normalizedValueAccentless = normalizeText(value)

  return keywords.some((keyword) => {
    const normalizedKeywordNFC = keyword.normalize('NFC').toLowerCase().trim()
    const normalizedKeywordAccentless = normalizeText(keyword)
    if (!normalizedKeywordNFC) return false
    
    return (
      normalizedValueNFC.includes(normalizedKeywordNFC) ||
      normalizedValueAccentless.includes(normalizedKeywordAccentless)
    )
  })
}

function includesKeywordInUrl(slug: string, keywords: string[]) {
  if (!slug || !keywords.length) return false
  const normalizedSlug = toSlug(slug)
  
  return keywords.some((keyword) => {
    const keywordSlug = toSlug(keyword)
    if (!keywordSlug) return false
    
    return (
      normalizedSlug.includes(keywordSlug) ||
      normalizedSlug.replace(/-/g, '').includes(keywordSlug.replace(/-/g, ''))
    )
  })
}

function countKeywordOccurrences(value: string, keywords: string[]) {
  const normalizedValue = normalizeText(value)

  return keywords.reduce((total, keyword) => {
    const normalizedKeyword = normalizeText(keyword)
    if (!normalizedKeyword) return total

    let count = 0
    let index = normalizedValue.indexOf(normalizedKeyword)
    while (index !== -1) {
      count += 1
      index = normalizedValue.indexOf(normalizedKeyword, index + normalizedKeyword.length)
    }

    return total + count
  }, 0)
}

function getHeadings(html?: string | null) {
  return Array.from((html ?? "").matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi)).map((match) =>
    stripHtml(match[1])
  )
}

function getLinks(html?: string | null) {
  return Array.from((html ?? "").matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi)).map(
    (match) => match[1]
  )
}

function getParagraphs(html?: string | null) {
  const paragraphs = Array.from((html ?? "").matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)).map((match) =>
    stripHtml(match[1])
  )

  return paragraphs.length ? paragraphs : stripHtml(html).split(/\n{2,}/)
}

function hasEmbeddedMedia(html?: string | null) {
  return /<(img|video|iframe)\b/i.test(html ?? "")
}

function makeCheck(
  id: string,
  label: string,
  passed: boolean,
  maxScore: number,
  detail?: string,
  warning?: boolean
): SeoCheck {
  return {
    id,
    label,
    status: passed ? "good" : warning ? "warning" : "error",
    score: passed ? maxScore : warning ? Math.round(maxScore / 2) : 0,
    maxScore,
    detail,
  }
}

function isKeywordNearStart(title: string, keyword: string): boolean {
  if (!title || !keyword) return false
  const normTitle = normalizeText(title)
  const normKeyword = normalizeText(keyword)
  const index = normTitle.indexOf(normKeyword)
  if (index === -1) return false
  return index <= Math.max(0, normTitle.length / 2)
}

export function analyzeProductSeo(input: ProductSeoAnalyzerInput): ProductSeoAnalysis {
  const keywords = getKeywords(input.focusKeyword)
  const title = input.metaTitle || input.productName || ""
  const metaDescription = input.metaDescription || ""
  const slug = input.slug || ""
  const content = [stripHtml(input.shortDescriptionHtml), stripHtml(input.descriptionHtml)]
    .filter(Boolean)
    .join(" ")
  const headings = getHeadings(input.descriptionHtml)
  const links = getLinks(input.descriptionHtml)
  const paragraphs = getParagraphs(input.descriptionHtml)

  // Extract inline image alts from descriptionHtml as well
  const descriptionImages = Array.from((input.descriptionHtml ?? "").matchAll(/<img\s+[^>]*alt=["']([^"']*)["']/gi))
    .map((match) => match[1])
    .filter(Boolean)

  const imageAlts = [
    ...(input.imageAlts?.filter(Boolean).map(String) ?? []),
    ...descriptionImages
  ]

  const words = getWords(content)
  const wordCount = words.length
  const keywordOccurrences = keywords.length ? countKeywordOccurrences(content, keywords) : 0
  const keywordDensity = wordCount ? Number(((keywordOccurrences / wordCount) * 100).toFixed(2)) : 0
  const firstTenPercent = words.slice(0, Math.max(20, Math.ceil(wordCount * 0.1))).join(" ")
  const hasKeyword = keywords.length > 0

  const siteUrl = input.siteUrl || "dukystore.com"
  const normalizedSiteUrl = siteUrl.toLowerCase()
  const hasInternalLink = links.some((href) => {
    const lowerHref = href.toLowerCase()
    return (
      lowerHref.startsWith("/") ||
      lowerHref.startsWith("#") ||
      lowerHref.startsWith("?") ||
      lowerHref.includes("dukystore") ||
      lowerHref.includes(normalizedSiteUrl)
    )
  })
  const hasExternalLink = links.some((href) => {
    const lowerHref = href.toLowerCase()
    const isHttp = /^https?:\/\//i.test(lowerHref)
    return (
      isHttp &&
      !lowerHref.includes("dukystore") &&
      !lowerHref.includes(normalizedSiteUrl)
    )
  })

  const longParagraphCount = paragraphs.filter((paragraph) => getWords(paragraph).length > 120).length
  const hasImage = Boolean(input.hasImages || imageAlts.length || hasEmbeddedMedia(input.descriptionHtml))

  const groups: SeoCheckGroup[] = [
    {
      id: "basic",
      title: "Basic SEO",
      checks: [
        makeCheck("focus-keyword", "Có focus keyword", hasKeyword, 8),
        makeCheck("keyword-title", "Focus keyword nằm trong SEO title", hasKeyword && includesKeyword(title, keywords), 10),
        makeCheck(
          "keyword-description",
          "Focus keyword nằm trong meta description",
          hasKeyword && includesKeyword(metaDescription, keywords),
          10
        ),
        makeCheck("keyword-url", "Focus keyword nằm trong URL", hasKeyword && includesKeywordInUrl(slug, keywords), 8),
        makeCheck(
          "keyword-intro",
          "Focus keyword xuất hiện trong 10% đầu nội dung",
          hasKeyword && includesKeyword(firstTenPercent, keywords),
          8
        ),
        makeCheck("keyword-content", "Focus keyword có trong nội dung", hasKeyword && keywordOccurrences > 0, 8),
        makeCheck(
          "content-length",
          `Nội dung có ${wordCount} từ`,
          wordCount >= 600,
          8,
          wordCount < 300 ? "Nên bổ sung mô tả chi tiết hơn." : undefined,
          wordCount >= 300
        ),
      ],
    },
    {
      id: "additional",
      title: "Additional",
      checks: [
        makeCheck(
          "keyword-heading",
          "Focus keyword có trong heading",
          hasKeyword && headings.some((heading) => includesKeyword(heading, keywords)),
          7
        ),
        makeCheck(
          "keyword-image-alt",
          "Focus keyword có trong alt ảnh",
          hasKeyword && imageAlts.some((alt) => includesKeyword(alt, keywords)),
          7,
          imageAlts.length ? undefined : "Chưa có alt ảnh để kiểm tra.",
          imageAlts.length > 0
        ),
        makeCheck(
          "keyword-density",
          `Keyword density ${keywordDensity}% (${keywordOccurrences} lần)`,
          keywordDensity >= 0.5 && keywordDensity <= 3,
          7,
          keywordDensity > 3 ? "Mật độ keyword hơi cao, dễ bị nhồi từ khóa." : undefined,
          keywordDensity > 0 && keywordDensity < 0.5
        ),
        makeCheck("url-length", `URL dài ${slug.length} ký tự`, slug.length > 0 && slug.length <= 75, 5, undefined, slug.length <= 100),
        makeCheck("external-link", "Có external link trong nội dung", hasExternalLink, 4, undefined, links.length > 0),
        makeCheck("internal-link", "Có internal link trong nội dung", hasInternalLink, 5, undefined, links.length > 0),
      ],
    },
    {
      id: "title-readability",
      title: "Title Readability",
      checks: [
        makeCheck("title-length", `SEO title dài ${title.length} ký tự`, title.length >= 35 && title.length <= 65, 7, undefined, title.length >= 25 && title.length <= 75),
        makeCheck(
          "keyword-title-start",
          "Focus keyword ở gần đầu SEO title",
          hasKeyword && keywords.some((keyword) => isKeywordNearStart(title, keyword)),
          5,
          undefined,
          hasKeyword && includesKeyword(title, keywords)
        ),
        makeCheck("title-number", "SEO title có số liệu/phiên bản/mã sản phẩm", /\d/.test(title), 3, undefined, true),
      ],
    },
    {
      id: "content-readability",
      title: "Content Readability",
      checks: [
        makeCheck(
          "description-length",
          `Meta description dài ${metaDescription.length} ký tự`,
          metaDescription.length >= 120 && metaDescription.length <= 160,
          7,
          undefined,
          metaDescription.length >= 90 && metaDescription.length <= 180
        ),
        makeCheck("short-paragraphs", "Đoạn văn ngắn, dễ đọc", longParagraphCount === 0, 4, `${longParagraphCount} đoạn quá dài.`, longParagraphCount <= 2),
        makeCheck("media-content", "Nội dung có ảnh hoặc video", hasImage, 5),
      ],
    },
  ]

  const totalScore = groups.reduce(
    (total, group) => total + group.checks.reduce((groupTotal, check) => groupTotal + check.score, 0),
    0
  )
  const maxScore = groups.reduce(
    (total, group) => total + group.checks.reduce((groupTotal, check) => groupTotal + check.maxScore, 0),
    0
  )
  const score = maxScore ? Math.round((totalScore / maxScore) * 100) : 0

  return {
    score,
    rating: score >= 80 ? "good" : score >= 55 ? "warning" : "error",
    wordCount,
    keywordDensity,
    keywordOccurrences,
    groups,
  }
}
