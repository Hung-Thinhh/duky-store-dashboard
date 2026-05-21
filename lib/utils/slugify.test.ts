import { describe, it, expect } from "vitest"
import { slugify, generateSeoFilename } from "./slugify"

describe("slugify", () => {
  it("converts Vietnamese text with diacritics to slug", () => {
    expect(slugify("Áo blazer nữ 2026")).toBe("ao-blazer-nu-2026")
  })

  it("handles đ and Đ characters", () => {
    expect(slugify("Đầm đỏ đẹp")).toBe("dam-do-dep")
  })

  it("converts to lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world")
  })

  it("removes special characters", () => {
    expect(slugify("hello @world! #test")).toBe("hello-world-test")
  })

  it("collapses multiple hyphens into one", () => {
    expect(slugify("hello---world")).toBe("hello-world")
  })

  it("trims hyphens from start and end", () => {
    expect(slugify("--hello--")).toBe("hello")
  })

  it("replaces spaces with hyphens", () => {
    expect(slugify("hello   world")).toBe("hello-world")
  })

  it("returns empty string for input with only special characters", () => {
    expect(slugify("@#$%^&*")).toBe("")
  })

  it("handles empty string", () => {
    expect(slugify("")).toBe("")
  })

  it("handles numbers", () => {
    expect(slugify("Product 123 Test")).toBe("product-123-test")
  })

  it("handles mixed Vietnamese and English", () => {
    expect(slugify("Sản phẩm mới - New Product")).toBe("san-pham-moi-new-product")
  })
})

describe("generateSeoFilename", () => {
  it("generates filename with extension", () => {
    expect(generateSeoFilename("Áo blazer nữ 2026", ".jpg")).toBe("ao-blazer-nu-2026.jpg")
  })

  it("truncates at word boundary when exceeding maxLength", () => {
    const longText = "this is a very long title that should be truncated at word boundary for seo optimization purposes and more words here"
    const result = generateSeoFilename(longText, ".png", 50)
    const slugPart = result.replace(".png", "")
    expect(slugPart.length).toBeLessThanOrEqual(50)
    expect(slugPart).not.toMatch(/-$/)
  })

  it("preserves original extension", () => {
    expect(generateSeoFilename("test image", ".webp")).toBe("test-image.webp")
  })

  it("falls back to media + extension when slug is empty", () => {
    expect(generateSeoFilename("@#$%", ".jpg")).toBe("media.jpg")
  })

  it("falls back to media + extension for empty string", () => {
    expect(generateSeoFilename("", ".png")).toBe("media.png")
  })

  it("uses default maxLength of 100", () => {
    const longText = Array(30).fill("word").join(" ")
    const result = generateSeoFilename(longText, ".jpg")
    const slugPart = result.replace(".jpg", "")
    expect(slugPart.length).toBeLessThanOrEqual(100)
  })

  it("does not truncate when slug is within maxLength", () => {
    expect(generateSeoFilename("short title", ".jpg")).toBe("short-title.jpg")
  })

  it("handles custom maxLength", () => {
    const result = generateSeoFilename("hello world test", ".jpg", 10)
    const slugPart = result.replace(".jpg", "")
    expect(slugPart.length).toBeLessThanOrEqual(10)
  })
})
