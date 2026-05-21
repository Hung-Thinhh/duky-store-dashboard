/**
 * Bug Condition Exploration Test: Round-trip Visual ↔ HTML Gộp Khối
 *
 * **Validates: Requirements 1.1, 1.2, 1.3**
 *
 * This test is EXPECTED TO FAIL on unfixed code — failure confirms the bug exists.
 * DO NOT fix the test or code when it fails.
 *
 * Bug: When content has ≥2 blocks and goes through round-trip
 * toHtmlDraftFromContent → toContentFromHtmlDraft, blocks get merged into one.
 *
 * Root cause: toHtmlDraftFromContent calls toPublishableBlogHtml which strips
 * CONTENT_BLOCK_SEPARATOR, then prettyHtmlForEditor calls minifyHtmlForStorage
 * which also removes separators.
 */
import { describe, it, expect } from "vitest"
import * as fc from "fast-check"

// ─── Extracted functions from app/(dashboard)/blog/[id]/page.tsx ───

const CONTENT_BLOCK_SEPARATOR = "<!-- duky-block -->"

function minifyHtmlForStorage(html: string) {
  return html
    .replace(new RegExp(CONTENT_BLOCK_SEPARATOR, "g"), " ")
    .replace(/\r?\n/g, " ")
    .replace(/\t+/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function minifyHtmlForEditorDraft(html: string) {
  const separator = CONTENT_BLOCK_SEPARATOR
  const parts = html.split(separator)
  const minifiedParts = parts.map((part) =>
    part
      .replace(/\r?\n/g, " ")
      .replace(/\t+/g, " ")
      .replace(/>\s+</g, "><")
      .replace(/\s{2,}/g, " ")
      .trim()
  )
  return minifiedParts.filter(Boolean).join(` ${separator} `)
}

function splitContentToBlocks(content?: string | null) {
  const raw = (content ?? "").trim()
  if (!raw) return []

  const bySeparator = raw
    .split(CONTENT_BLOCK_SEPARATOR)
    .map((block) => block.trim())
    .filter(Boolean)
  if (bySeparator.length > 1) return bySeparator

  const wrappedBlocks = raw.match(
    /<blockquote[^>]*(?:data-duky-block="true"|data-duky-block)[^>]*>[\s\S]*?<\/blockquote>/gi
  )
  if (wrappedBlocks?.length) {
    return wrappedBlocks.map((block) => block.trim())
  }

  const labeledBlocks = raw.match(
    /<blockquote[^>]*>[\s\S]*?<p>\s*<strong>\s*block[^<]*<\/strong>\s*<\/p>[\s\S]*?<\/blockquote>/gi
  )
  if (labeledBlocks?.length) {
    return labeledBlocks.map((block) => block.trim())
  }

  return [raw]
}

function blockTypeLabel(type: "title" | "content" | "footer") {
  if (type === "title") return "Block Tiêu Đề"
  if (type === "footer") return "Block Footer Liên Hệ"
  return "Block Nội Dung"
}

function inferBlockTypeFromHtml(html: string): "title" | "content" | "footer" {
  const normalized = html.toLowerCase()
  if (normalized.includes("thông tin liên hệ") || normalized.includes("hotline:")) {
    return "footer"
  }
  if (normalized.startsWith("<h1") || normalized.startsWith("<h2") || normalized.startsWith("<h3")) {
    return "title"
  }
  return "content"
}

function stripLegacyBlockLabel(html: string) {
  return html
    .replace(/^\s*<div[^>]*data-duky-block-head[^>]*>[\s\S]*?<\/div>\s*/i, "")
    .replace(
      /^\s*<p>\s*<strong>\s*block\s+(?:tiêu\s*đề|nội\s*dung|footer\s+liên\s+hệ)\s*<\/strong>\s*<\/p>\s*/i,
      ""
    )
    .replace(/^\s*<p>\s*[↑↓×\s]+\s*<\/p>\s*/i, "")
    .trim()
}

function wrapHtmlAsBlock(html: string, type: "title" | "content" | "footer") {
  return `<blockquote data-duky-block="true" data-duky-block-type="${type}">${stripLegacyBlockLabel(html)}</blockquote>`
}

function unwrapBlockHtml(blockHtml: string) {
  const normalized = blockHtml.trim()
  const blockquoteWrapper = normalized.match(
    /^<blockquote\b[^>]*>([\s\S]*)<\/blockquote>\s*$/i
  )
  const raw = blockquoteWrapper ? blockquoteWrapper[1].trim() : normalized
  return stripLegacyBlockLabel(raw)
}

function isBlockWrapperHtml(html: string) {
  const normalized = html.toLowerCase()
  if (normalized.includes('data-duky-block="true"') || normalized.includes("data-duky-block")) {
    return true
  }
  return (
    normalized.startsWith("<blockquote") &&
    normalized.includes("<p><strong>block ") &&
    normalized.includes("</strong></p>")
  )
}

function flattenNestedBlockWrappers(html: string) {
  let next = html.trim()
  const nestedPattern =
    /<blockquote[^>]*>\s*<p>\s*<strong>\s*block[^<]*<\/strong>\s*<\/p>\s*(<blockquote[^>]*>[\s\S]*<\/blockquote>)\s*<\/blockquote>/i

  while (nestedPattern.test(next)) {
    next = next.replace(nestedPattern, "$1").trim()
  }

  next = stripLegacyBlockLabel(next.replace(/<p>\s*[↑↓×\s]+\s*<\/p>/gi, ""))

  return next
}

function mergeBlocksToContent(blocks: string[]) {
  return blocks
    .map((block) => flattenNestedBlockWrappers(block))
    .filter(Boolean)
    .map((block) =>
      isBlockWrapperHtml(block)
        ? block
        : wrapHtmlAsBlock(block, inferBlockTypeFromHtml(block))
    )
    .join(`\n${CONTENT_BLOCK_SEPARATOR}\n`)
}

function stripBlockWrappersForHtml(content?: string | null) {
  const blocks = splitContentToBlocks(content)
  return blocks.map((block) => unwrapBlockHtml(block)).join("\n\n").trim()
}

function decorateHtmlTag(
  html: string,
  tagName: string,
  className: string,
  style: string
) {
  return html.replace(
    new RegExp(`<${tagName}(\\s[^>]*)?>`, "gi"),
    (_match, rawAttrs = "") => {
      let attrs = rawAttrs as string
      attrs = mergeHtmlClass(attrs, className)
      attrs = mergeHtmlStyle(attrs, style)
      return `<${tagName}${attrs}>`
    }
  )
}

function mergeHtmlClass(attrs: string, className: string) {
  const classMatch = attrs.match(/\sclass=(["'])(.*?)\1/i)
  if (!classMatch) return `${attrs} class="${className}"`

  const quote = classMatch[1]
  const existing = classMatch[2].split(/\s+/).filter(Boolean)
  const next = [...existing]

  className.split(/\s+/).filter(Boolean).forEach((item) => {
    if (!next.includes(item)) next.push(item)
  })

  return attrs.replace(classMatch[0], ` class=${quote}${next.join(" ")}${quote}`)
}

function mergeHtmlStyle(attrs: string, style: string) {
  const styleMatch = attrs.match(/\sstyle=(["'])(.*?)\1/i)
  if (!styleMatch) return `${attrs} style="${style}"`

  const quote = styleMatch[1]
  const existing = styleMatch[2].trim()
  const existingKeys = new Set(
    existing
      .split(";")
      .map((rule) => rule.split(":")[0]?.trim().toLowerCase())
      .filter(Boolean)
  )
  const additions = style
    .split(";")
    .map((rule) => rule.trim())
    .filter((rule) => {
      const key = rule.split(":")[0]?.trim().toLowerCase()
      return key && !existingKeys.has(key)
    })

  if (!additions.length) return attrs

  const nextStyle = [existing.replace(/;$/, ""), ...additions].filter(Boolean).join("; ")
  return attrs.replace(styleMatch[0], ` style=${quote}${nextStyle}${quote}`)
}

function decorateBlogHtmlForPublish(html: string) {
  let next = html.trim()
  if (!next) return ""

  next = decorateHtmlTag(next, "h1", "duky-blog-heading duky-blog-h1", "margin: 8px 0 22px; font-size: 38px; line-height: 1.12; font-weight: 800; letter-spacing: 0; color: #1c1917;")
  next = decorateHtmlTag(next, "h2", "duky-blog-heading duky-blog-h2", "margin: 32px 0 16px; font-size: 30px; line-height: 1.18; font-weight: 800; letter-spacing: 0; color: #1c1917;")
  next = decorateHtmlTag(next, "p", "duky-blog-paragraph", "margin: 16px 0; font-size: 16px; line-height: 1.85; color: #292524;")
  next = decorateHtmlTag(next, "ul", "duky-blog-list duky-blog-list-disc", "margin: 16px 0; padding-left: 28px; list-style-type: disc;")
  next = decorateHtmlTag(next, "ol", "duky-blog-list duky-blog-list-decimal", "margin: 16px 0; padding-left: 28px; list-style-type: decimal;")
  next = decorateHtmlTag(next, "li", "duky-blog-list-item", "margin: 6px 0; padding-left: 4px; line-height: 1.75;")
  next = decorateHtmlTag(next, "img", "duky-blog-image", "display: block; max-width: 100%; height: auto; margin: 28px auto; border-radius: 24px;")

  return next
}

function toPublishableBlogHtml(content?: string | null) {
  return decorateBlogHtmlForPublish(stripBlockWrappersForHtml(content))
}

function prettyHtmlForEditor(html: string) {
  const minified = minifyHtmlForEditorDraft(html)
  if (!minified) return ""

  const withBreaks = minified
    .replace(/></g, ">\n<")
    .replace(/<(\/?(?:p|div|section|article|header|footer|h1|h2|h3|h4|h5|h6|ul|ol|li|table|thead|tbody|tr|th|td|blockquote|pre))/g, "\n<$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return withBreaks
}

function toHtmlDraftFromContent(content?: string | null) {
  const blocks = splitContentToBlocks(content)
  if (blocks.length <= 1) {
    const singleHtml = blocks.length === 1 ? unwrapBlockHtml(blocks[0]) : ""
    return prettyHtmlForEditor(singleHtml)
  }
  const formattedBlocks = blocks.map((block) => {
    const unwrapped = unwrapBlockHtml(block)
    return prettyHtmlForEditor(unwrapped)
  })
  return formattedBlocks.filter(Boolean).join(`\n${CONTENT_BLOCK_SEPARATOR}\n`)
}

function toContentFromHtmlDraft(htmlDraft: string) {
  const rawBlocks = htmlDraft
    .split(CONTENT_BLOCK_SEPARATOR)
    .map((block) => block.trim())
    .filter(Boolean)
  return mergeBlocksToContent(rawBlocks)
}

// ─── Test Helpers ───

/** Create multi-block content using wrapHtmlAsBlock and CONTENT_BLOCK_SEPARATOR */
function createMultiBlockContent(htmlBlocks: string[]): string {
  return htmlBlocks
    .map((html, i) => {
      const type = i === 0 ? "title" : "content"
      return wrapHtmlAsBlock(html, type)
    })
    .join(`\n${CONTENT_BLOCK_SEPARATOR}\n`)
}

// ─── Property-Based Tests ───

describe("Bug Condition Exploration: Round-trip Visual ↔ HTML Gộp Khối", () => {
  /**
   * **Validates: Requirements 1.1, 1.2, 1.3**
   *
   * Property: For any content with ≥2 blocks, round-trip through
   * toHtmlDraftFromContent → toContentFromHtmlDraft must preserve
   * the number of blocks.
   *
   * EXPECTED TO FAIL on unfixed code — confirms the bug exists.
   */
  it("Property 1: round-trip preserves block count for multi-block content", () => {
    // Generator: create arrays of 2-5 simple HTML blocks
    const htmlBlockArb = fc.oneof(
      fc.constant("<h2>Tiêu đề bài viết</h2>"),
      fc.constant("<p>Đoạn văn nội dung blog.</p>"),
      fc.constant("<p>Thông tin sản phẩm chi tiết.</p>"),
      fc.constant("<ul><li>Item 1</li><li>Item 2</li></ul>"),
      fc.constant('<img src="https://example.com/image.jpg" alt="Ảnh minh họa">')
    )

    const multiBlockArb = fc.array(htmlBlockArb, { minLength: 2, maxLength: 5 })

    fc.assert(
      fc.property(multiBlockArb, (htmlBlocks) => {
        const content = createMultiBlockContent(htmlBlocks)
        const inputBlockCount = splitContentToBlocks(content).length

        // Round-trip: Visual → HTML → Visual
        const htmlDraft = toHtmlDraftFromContent(content)
        const output = toContentFromHtmlDraft(htmlDraft)
        const outputBlockCount = splitContentToBlocks(output).length

        // Block count must be preserved
        expect(outputBlockCount).toBe(inputBlockCount)
      }),
      { numRuns: 50 }
    )
  })

  /**
   * **Validates: Requirements 1.1, 1.2, 1.3**
   *
   * Concrete test cases demonstrating the bug with specific block counts.
   */
  it("Concrete: 2 blocks → round-trip should preserve 2 blocks", () => {
    const content = createMultiBlockContent([
      "<h2>Tiêu đề</h2>",
      "<p>Nội dung đoạn văn.</p>",
    ])

    const inputBlocks = splitContentToBlocks(content)
    expect(inputBlocks.length).toBe(2)

    const htmlDraft = toHtmlDraftFromContent(content)
    const output = toContentFromHtmlDraft(htmlDraft)
    const outputBlocks = splitContentToBlocks(output)

    expect(outputBlocks.length).toBe(2)
  })

  it("Concrete: 3 blocks → round-trip should preserve 3 blocks", () => {
    const content = createMultiBlockContent([
      "<h2>Tiêu đề bài viết</h2>",
      "<p>Đoạn nội dung chính của bài blog.</p>",
      "<p>Hotline: 0123456789</p>",
    ])

    const inputBlocks = splitContentToBlocks(content)
    expect(inputBlocks.length).toBe(3)

    const htmlDraft = toHtmlDraftFromContent(content)
    const output = toContentFromHtmlDraft(htmlDraft)
    const outputBlocks = splitContentToBlocks(output)

    expect(outputBlocks.length).toBe(3)
  })

  it("Concrete: 5 blocks → round-trip should preserve 5 blocks", () => {
    const content = createMultiBlockContent([
      "<h2>Tiêu đề</h2>",
      "<p>Đoạn 1</p>",
      "<p>Đoạn 2</p>",
      "<ul><li>Mục 1</li><li>Mục 2</li></ul>",
      "<p>Thông tin liên hệ: Hotline 0909</p>",
    ])

    const inputBlocks = splitContentToBlocks(content)
    expect(inputBlocks.length).toBe(5)

    const htmlDraft = toHtmlDraftFromContent(content)
    const output = toContentFromHtmlDraft(htmlDraft)
    const outputBlocks = splitContentToBlocks(output)

    expect(outputBlocks.length).toBe(5)
  })

  /**
   * **Validates: Requirements 1.1, 1.2, 1.3**
   *
   * Property: HTML content within each block must be preserved after round-trip.
   * EXPECTED TO FAIL on unfixed code.
   */
  it("Property 2: round-trip preserves HTML content of each block", () => {
    const content = createMultiBlockContent([
      "<h2>Tiêu đề quan trọng</h2>",
      "<p>Nội dung chi tiết của bài viết.</p>",
      "<ul><li>Điểm 1</li><li>Điểm 2</li></ul>",
    ])

    const inputBlocks = splitContentToBlocks(content)
    const inputHtmlPerBlock = inputBlocks.map((b) => unwrapBlockHtml(b))

    const htmlDraft = toHtmlDraftFromContent(content)
    const output = toContentFromHtmlDraft(htmlDraft)
    const outputBlocks = splitContentToBlocks(output)
    const outputHtmlPerBlock = outputBlocks.map((b) => unwrapBlockHtml(b))

    // Each block's HTML content should be preserved
    expect(outputHtmlPerBlock.length).toBe(inputHtmlPerBlock.length)
    for (let i = 0; i < inputHtmlPerBlock.length; i++) {
      // Normalize whitespace for comparison: minify then collapse any remaining spaces before closing tags
      const normalize = (s: string) => minifyHtmlForStorage(s).replace(/\s+</g, "<").replace(/>\s+/g, ">")
      const inputNormalized = normalize(inputHtmlPerBlock[i])
      const outputNormalized = normalize(outputHtmlPerBlock[i])
      expect(outputNormalized).toBe(inputNormalized)
    }
  })
})
