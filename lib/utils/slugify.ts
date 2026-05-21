/**
 * Chuyển đổi chuỗi bất kỳ (bao gồm tiếng Việt có dấu) thành URL slug.
 * Quy tắc:
 * - Normalize NFD để tách dấu tiếng Việt
 * - Loại bỏ dấu tiếng Việt (combining diacritical marks)
 * - Xử lý đ/Đ thành d
 * - Chuyển toàn bộ thành chữ thường
 * - Loại bỏ ký tự không phải a-z, 0-9, khoảng trắng, gạch ngang
 * - Thay khoảng trắng bằng gạch ngang đơn
 * - Gộp nhiều gạch ngang liên tiếp thành một
 * - Loại bỏ gạch ngang đầu/cuối
 */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Sinh SEO filename từ text, giữ nguyên extension gốc.
 * Giới hạn phần slug tối đa maxLength ký tự, cắt tại ranh giới từ (dấu gạch ngang).
 * Fallback về "media" + extension khi slug rỗng.
 */
export function generateSeoFilename(
  text: string,
  originalExtension: string,
  maxLength: number = 100,
): string {
  let slug = slugify(text)

  if (slug.length > maxLength) {
    const truncated = slug.substring(0, maxLength)
    const lastHyphen = truncated.lastIndexOf("-")
    slug = lastHyphen > 0 ? truncated.substring(0, lastHyphen) : truncated
  }

  if (!slug) {
    return `media${originalExtension}`
  }

  return `${slug}${originalExtension}`
}
