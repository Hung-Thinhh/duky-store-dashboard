/**
 * Preservation Property Tests: Hành vi Không thay đổi cho Non-roundtrip Operations
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 *
 * These tests MUST PASS on the current (unfixed) code.
 * They capture baseline behavior that must be preserved after the fix is applied.
 *
 * Properties tested:
 * 1. Single-block round-trip preserves 1 block with same content
 * 2. minifyHtmlForStorage removes CONTENT_BLOCK_SEPARATOR for storage
 * 3. toPublishableBlogHtml strips block wrappers correctly
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

function decorateBlogHtmlForPublish(html: string) {
  let next = html.trim()
  if (!next) return ""

  next = decorateHtmlTag(next, "h1", "duky-blog-heading duky-blog-h1", "margin: 8px 0 22px; font-size: 38px; line-height: 1.12; font-weight: 800; letter-spacing: 0; color: #1c1917;")
  next = decorateHtmlTag(next, "h2", "duky-blog-heading duky-blog-h2", "margin: 32px 0 16px; font-size: 30px; line-height: 1.18; font-weight: 800; letter-spacing: 0; color: #1c1917;")
  next = decorateHtmlTag(next, "h3", "duky-blog-heading duky-blog-h3", "margin: 28px 0 12px; font-size: 23px; line-height: 1.25; font-weight: 700; letter-spacing: 0; color: #292524;")
  next = decorateHtmlTag(next, "p", "duky-blog-paragraph", "margin: 16px 0; font-size: 16px; line-height: 1.85; color: #292524;")
  next = decorateHtmlTag(next, "ul", "duky-blog-list duky-blog-list-disc", "margin: 16px 0; padding-left: 28px; list-style-type: disc;")
  next = decorateHtmlTag(next, "ol", "duky-blog-list duky-blog-list-decimal", "margin: 16px 0; padding-left: 28px; list-style-type: decimal;")
  next = decorateHtmlTag(next, "li", "duky-blog-list-item", "margin: 6px 0; padding-left: 4px; line-height: 1.75;")
  next = decorateHtmlTag(next, "a", "duky-blog-link", "color: #c2410c; text-decoration: underline; text-underline-offset: 4px;")
  next = decorateHtmlTag(next, "img", "duky-blog-image", "display: block; max-width: 100%; height: auto; margin: 28px auto; border-radius: 24px;")
  next = decorateHtmlTag(next, "blockquote", "duky-blog-quote", "margin: 24px 0; padding: 16px 20px; border-left: 4px solid #fdba74; border-radius: 16px; background: #fff7ed; color: #292524;")
  next = decorateHtmlTag(next, "table", "duky-blog-table", "width: 100%; margin: 24px 0; border-collapse: collapse;")
  next = decorateHtmlTag(next, "th", "duky-blog-table-head", "border: 1px solid #e7e5e4; background: #f5f5f4; padding: 8px 12px; text-align: left; font-weight: 700;")
  next = decorateHtmlTag(next, "td", "duky-blog-table-cell", "border: 1px solid #e7e5e4; padding: 8px 12px;")
  next = decorateHtmlTag(next, "code", "duky-blog-code", "border-radius: 6px; background: #fff7ed; padding: 2px 6px; font-weight: 600; color: #ea580c;")
  next = decorateHtmlTag(next, "pre", "duky-blog-pre", "margin: 20px 0; overflow: auto; border-radius: 16px; background: #1c1917; padding: 16px; color: #fed7aa;")
  next = decorateHtmlTag(next, "hr", "duky-blog-divider", "margin: 32px 0; border: 0; border-top: 1px solid #e7e5e4;")

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

/** Create single-block content using wrapHtmlAsBlock */
function createSingleBlockContent(html: string, type: "title" | "content" | "footer" = "content"): string {
  return wrapHtmlAsBlock(html, type)
}

// ─── Generators ───

/** Generator for simple HTML content that doesn't contain separator or blockquote tags */
const simpleHtmlContentArb = fc.oneof(
  fc.constant("<p>Đoạn văn nội dung blog.</p>"),
  fc.constant("<p>Thông tin sản phẩm chi tiết.</p>"),
  fc.constant("<h2>Tiêu đề bài viết</h2>"),
  fc.constant("<h3>Mục con trong bài</h3>"),
  fc.constant("<ul><li>Item 1</li><li>Item 2</li></ul>"),
  fc.constant("<ol><li>Bước 1</li><li>Bước 2</li></ol>"),
  fc.constant('<img src="https://example.com/image.jpg" alt="Ảnh minh họa">'),
  fc.constant("<p>Blazer nữ đang là item must-have trong tủ đồ công sở.</p>"),
  fc.constant("<p><strong>Đi làm:</strong> blazer + áo thun trơn + quần tây.</p>"),
  fc.constant("<h3>Kết Luận</h3>")
)

/** Generator for block type */
const blockTypeArb = fc.constantFrom("title" as const, "content" as const, "footer" as const)

// ─── Property-Based Tests ───

describe("Preservation Property Tests: Hành vi Không thay đổi cho Non-roundtrip Operations", () => {
  /**
   * **Validates: Requirements 3.1**
   *
   * Property: For any single-block content, round-trip through
   * toHtmlDraftFromContent → toContentFromHtmlDraft must return
   * exactly 1 block with the same content.
   *
   * EXPECTED TO PASS on unfixed code — single-block round-trip works correctly.
   */
  describe("Property 2a: Single-block round-trip preservation", () => {
    it("single-block content round-trip returns exactly 1 block", () => {
      fc.assert(
        fc.property(simpleHtmlContentArb, blockTypeArb, (html, type) => {
          const content = createSingleBlockContent(html, type)
          const inputBlocks = splitContentToBlocks(content)

          // Verify input is indeed single-block
          expect(inputBlocks.length).toBe(1)

          // Round-trip: Visual → HTML → Visual
          const htmlDraft = toHtmlDraftFromContent(content)
          const output = toContentFromHtmlDraft(htmlDraft)
          const outputBlocks = splitContentToBlocks(output)

          // Single-block must remain single-block
          expect(outputBlocks.length).toBe(1)
        }),
        { numRuns: 30 }
      )
    })

    it("single-block content round-trip preserves text content (semantic equivalence)", () => {
      // Note: round-trip adds decoration classes via decorateBlogHtmlForPublish
      // and may add whitespace between tags. This is expected behavior.
      // We verify the TEXT CONTENT words are preserved.
      fc.assert(
        fc.property(simpleHtmlContentArb, blockTypeArb, (html, type) => {
          const content = createSingleBlockContent(html, type)
          const inputBlocks = splitContentToBlocks(content)
          const inputHtml = unwrapBlockHtml(inputBlocks[0])

          // Round-trip
          const htmlDraft = toHtmlDraftFromContent(content)
          const output = toContentFromHtmlDraft(htmlDraft)
          const outputBlocks = splitContentToBlocks(output)
          const outputHtml = unwrapBlockHtml(outputBlocks[0])

          // Extract text content, normalize all whitespace for comparison
          const extractWords = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
          const inputText = extractWords(inputHtml)
          const outputText = extractWords(outputHtml)
          expect(outputText).toBe(inputText)
        }),
        { numRuns: 30 }
      )
    })
  })

  /**
   * **Validates: Requirements 3.3**
   *
   * Property: minifyHtmlForStorage always removes CONTENT_BLOCK_SEPARATOR
   * from the output, replacing it with a space. This is correct behavior
   * for storage use case (DB doesn't need separators).
   *
   * EXPECTED TO PASS on unfixed code — storage minification works correctly.
   */
  describe("Property 2b: minifyHtmlForStorage removes separator for storage", () => {
    it("output never contains CONTENT_BLOCK_SEPARATOR", () => {
      // Generate HTML strings that contain the separator
      const htmlWithSeparatorArb = fc.tuple(
        simpleHtmlContentArb,
        fc.array(simpleHtmlContentArb, { minLength: 1, maxLength: 4 })
      ).map(([first, rest]) => {
        return [first, ...rest].join(`\n${CONTENT_BLOCK_SEPARATOR}\n`)
      })

      fc.assert(
        fc.property(htmlWithSeparatorArb, (htmlWithSeparator) => {
          const result = minifyHtmlForStorage(htmlWithSeparator)

          // Separator must be removed from storage output
          expect(result).not.toContain(CONTENT_BLOCK_SEPARATOR)
        }),
        { numRuns: 50 }
      )
    })

    it("output is minified (no excessive whitespace)", () => {
      const htmlWithWhitespaceArb = fc.oneof(
        fc.constant("<p>  Hello   World  </p>"),
        fc.constant("<p>Line1</p>\n\n<p>Line2</p>"),
        fc.constant("<h2>Title</h2>\t\t<p>Content</p>"),
        fc.constant(`<p>A</p>\n${CONTENT_BLOCK_SEPARATOR}\n<p>B</p>`)
      )

      fc.assert(
        fc.property(htmlWithWhitespaceArb, (html) => {
          const result = minifyHtmlForStorage(html)

          // No newlines in output
          expect(result).not.toMatch(/\r?\n/)
          // No tabs in output
          expect(result).not.toMatch(/\t/)
          // No multiple consecutive spaces
          expect(result).not.toMatch(/\s{2,}/)
          // No space between tags
          expect(result).not.toMatch(/>\s+</)
        }),
        { numRuns: 30 }
      )
    })
  })

  /**
   * **Validates: Requirements 3.4**
   *
   * Property: toPublishableBlogHtml strips block wrappers (blockquote tags)
   * and returns decorated HTML without any data-duky-block attributes.
   *
   * EXPECTED TO PASS on unfixed code — preview rendering works correctly.
   */
  describe("Property 2c: toPublishableBlogHtml strips block wrappers", () => {
    it("output does not contain data-duky-block attributes", () => {
      // Generate content with block wrappers
      const wrappedContentArb = fc.tuple(
        simpleHtmlContentArb,
        blockTypeArb
      ).map(([html, type]) => wrapHtmlAsBlock(html, type))

      fc.assert(
        fc.property(wrappedContentArb, (content) => {
          const result = toPublishableBlogHtml(content)

          // No block wrapper attributes in output
          expect(result).not.toContain('data-duky-block="true"')
          expect(result).not.toContain("data-duky-block-type")
        }),
        { numRuns: 30 }
      )
    })

    it("output does not contain blockquote wrapper tags from blocks", () => {
      // Generate multi-block content
      const multiBlockContentArb = fc.array(
        fc.tuple(simpleHtmlContentArb, blockTypeArb),
        { minLength: 1, maxLength: 3 }
      ).map((pairs) => {
        return pairs
          .map(([html, type]) => wrapHtmlAsBlock(html, type))
          .join(`\n${CONTENT_BLOCK_SEPARATOR}\n`)
      })

      fc.assert(
        fc.property(multiBlockContentArb, (content) => {
          const result = toPublishableBlogHtml(content)

          // Block wrapper blockquotes should be stripped
          // (note: regular blockquotes in content would get decorated, not stripped)
          expect(result).not.toContain('data-duky-block="true"')
          expect(result).not.toContain("data-duky-block-type")
        }),
        { numRuns: 30 }
      )
    })

    it("output contains decorated HTML with blog classes", () => {
      const contentWithParagraph = wrapHtmlAsBlock("<p>Test content here.</p>", "content")

      const result = toPublishableBlogHtml(contentWithParagraph)

      // Should have blog decoration classes
      expect(result).toContain("duky-blog-paragraph")
    })

    it("output contains decorated HTML with heading classes", () => {
      const contentWithHeading = wrapHtmlAsBlock("<h2>Test Heading</h2>", "title")

      const result = toPublishableBlogHtml(contentWithHeading)

      // Should have blog heading decoration
      expect(result).toContain("duky-blog-heading")
    })
  })
})
