# Implementation Plan: Media Upload SEO Optimization

## Overview

Triển khai tính năng tối ưu SEO cho media upload trong hệ thống DukyStore. Bao gồm:
- Backend (NestJS): Trích xuất kích thước ảnh tự động bằng `sharp`, chấp nhận metadata SEO khi upload, validate fileName theo chuẩn slug.
- Frontend (Next.js): Form nhập SEO metadata, tự động sinh slug từ alt text/title (hỗ trợ tiếng Việt), hiển thị trạng thái SEO, chỉnh sửa metadata cho ảnh đã upload.

## Tasks

- [ ] 1. Backend - Trích xuất kích thước ảnh tự động khi upload
  - [ ] 1.1 Cài đặt thư viện sharp và tạo hàm extractDimensions + convertToWebp
    - Cài đặt `sharp` vào Backend-Dukyboot: `npm install sharp` và `npm install -D @types/sharp`
    - Tạo private method `extractDimensions(buffer: Buffer): Promise<ImageDimensions>` trong `media.service.ts`
    - Sử dụng `sharp(buffer).metadata()` để lấy width/height
    - Thêm timeout 5 giây bằng `Promise.race`
    - Trả về `{ width: null, height: null }` khi: file SVG, file corrupt, hoặc timeout
    - Validate width/height là số nguyên từ 1 đến 65535
    - Tạo private method `convertToWebp(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer, mimeType: string, extension: string }>` trong `media.service.ts`
    - Nếu mimeType là image/jpeg, image/png, image/gif, image/avif → chuyển đổi sang WebP bằng `sharp(buffer).webp({ quality: 85 }).toBuffer()`
    - Nếu mimeType đã là image/webp → giữ nguyên buffer gốc
    - Nếu mimeType là image/svg+xml → giữ nguyên buffer gốc (không convert SVG)
    - Nếu conversion thất bại → fallback giữ nguyên buffer gốc, log warning
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 1.7, 1.8, 1.9_

  - [ ] 1.2 Tích hợp extractDimensions và convertToWebp vào createLocal
    - Sửa method `createLocal` trong `media.service.ts`:
      1. Gọi `extractDimensions(buffer)` để lấy width/height
      2. Gọi `convertToWebp(buffer, mimeType)` để chuyển đổi sang WebP (quality 85)
      3. Lưu buffer đã convert (hoặc gốc nếu SVG/đã WebP) vào disk
      4. Sử dụng extension ".webp" cho file đã convert, giữ extension gốc cho SVG
      5. Lưu mimeType "image/webp" cho file đã convert
    - Lưu `width` và `height` vào database khi tạo record media
    - Đảm bảo response API upload trả về width, height, mimeType mới
    - _Requirements: 1.1, 1.4, 1.5, 1.6, 1.8_

  - [ ]* 1.3 Viết property test cho extractDimensions (Property 1)
    - **Property 1: Image dimension extraction accuracy**
    - Sử dụng `fast-check` + `jest` để test với ảnh buffer ngẫu nhiên tạo bằng sharp
    - Verify rằng với ảnh JPEG/PNG/WebP/GIF/AVIF hợp lệ, hàm trả về đúng width/height
    - **Validates: Requirements 1.1, 1.2**

- [ ] 2. Backend - Chấp nhận metadata SEO trong request upload
  - [ ] 2.1 Tạo UploadMediaMetadataDto
    - Tạo file `src/modules/media/dto/upload-media-metadata.dto.ts` trong Backend-Dukyboot
    - Định nghĩa class với 2 trường optional: `altText` và `title`
    - Thêm validation: `@IsOptional`, `@IsString`, `@MinLength(1)`, `@MaxLength(500)`, `@Matches(/^[^<>]*$/)` cho mỗi trường
    - Thêm Swagger decorators `@ApiPropertyOptional`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 2.2 Cập nhật MediaController để nhận metadata khi upload
    - Thêm `@Body() uploadMetadataDto: UploadMediaMetadataDto` vào method `upload` trong controller
    - Truyền `uploadMetadataDto` vào `mediaService.createLocal()`
    - Cập nhật signature của `createLocal` để nhận thêm parameter `metadata?: UploadMediaMetadataDto`
    - Lưu `altText` và `title` vào database (trim whitespace, null nếu không có)
    - Đảm bảo response trả về altText và title đã lưu
    - _Requirements: 5.1, 5.2, 5.3, 5.6_

  - [ ]* 2.3 Viết property test cho validation altText/title (Property 6)
    - **Property 6: Text field validation (altText/title)**
    - Test với chuỗi ngẫu nhiên: chuỗi 1-500 ký tự không chứa `<>` → pass
    - Chuỗi rỗng, > 500 ký tự, hoặc chứa HTML tags → reject
    - **Validates: Requirements 4.6, 5.4, 5.5**

- [ ] 3. Backend - Validate fileName trong endpoint update
  - [ ] 3.1 Thêm validation fileName vào UpdateMediaDto hoặc MediaService
    - Thêm logic validate fileName trong endpoint PATCH `/admin/media/:id`
    - Pattern: `^[a-z0-9]+(-[a-z0-9]+)*\.[a-z]{2,10}$`
    - Tổng độ dài fileName (bao gồm extension) không quá 200 ký tự
    - Trả về lỗi 400 với message rõ ràng nếu fileName không hợp lệ
    - Validate altText và title có độ dài tối đa 500 ký tự mỗi trường
    - _Requirements: 4.4, 4.5, 4.6_

  - [ ]* 3.2 Viết property test cho fileName validation (Property 5)
    - **Property 5: fileName validation correctness**
    - Test với chuỗi ngẫu nhiên: chuỗi khớp pattern + ≤ 200 chars → pass
    - Chuỗi chứa uppercase, spaces, ký tự đặc biệt, consecutive hyphens, > 200 chars → reject
    - **Validates: Requirements 4.4, 4.5**

  - [ ]* 3.3 Viết unit tests cho backend upload và update
    - Test upload với altText/title → verify lưu vào DB
    - Test upload không có altText/title → verify null
    - Test upload SVG → verify width/height = null, upload thành công
    - Test PATCH với fileName hợp lệ → verify cập nhật
    - Test PATCH với fileName chứa uppercase → verify reject
    - _Requirements: 1.3, 4.4, 4.5, 5.3_

- [ ] 4. Checkpoint - Đảm bảo backend hoạt động đúng
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Frontend - Tạo utility slugify
  - [ ] 5.1 Tạo file lib/utils/slugify.ts
    - Tạo file `lib/utils/slugify.ts` trong frontend project
    - Implement hàm `slugify(value: string): string` với các bước: normalize NFD, loại bỏ dấu tiếng Việt, xử lý đ/Đ, lowercase, loại bỏ ký tự không hợp lệ, thay khoảng trắng bằng gạch ngang, gộp gạch ngang liên tiếp, trim gạch ngang đầu/cuối
    - Implement hàm `generateSeoFilename(text: string, originalExtension: string, maxLength?: number): string` với logic cắt tại ranh giới từ khi vượt quá maxLength (default 100)
    - Fallback về "media" + extension khi slug rỗng
    - _Requirements: 3.3, 3.4, 3.6, 3.7_

  - [ ]* 5.2 Viết property test cho slugify (Property 2)
    - **Property 2: Slugify output invariants**
    - Sử dụng `fast-check` + `vitest` test với chuỗi ngẫu nhiên (bao gồm Unicode, Vietnamese)
    - Verify output chỉ chứa a-z, 0-9, gạch ngang; không bắt đầu/kết thúc bằng gạch ngang; không có gạch ngang liên tiếp; không có dấu tiếng Việt; toàn bộ lowercase
    - **Validates: Requirements 2.4, 3.1, 3.3, 3.4**

  - [ ]* 5.3 Viết property test cho generateSeoFilename - extension preservation (Property 3)
    - **Property 3: SEO filename extension preservation**
    - Test với text ngẫu nhiên và extension hợp lệ (.jpg, .png, .webp)
    - Verify output luôn kết thúc bằng đúng extension gốc
    - **Validates: Requirements 3.6**

  - [ ]* 5.4 Viết property test cho generateSeoFilename - truncation (Property 4)
    - **Property 4: Slug truncation at word boundary**
    - Test với input tạo slug > 100 ký tự
    - Verify phần slug (không bao gồm extension) ≤ 100 ký tự và cắt tại ranh giới gạch ngang
    - **Validates: Requirements 3.7**

- [ ] 6. Frontend - Tạo SEO Metadata Form component
  - [ ] 6.1 Tạo component SeoMetadataForm
    - Tạo file `components/media/seo-metadata-form.tsx`
    - Implement form với 3 trường: altText (required, maxLength=125, label "Mô tả nội dung ảnh"), title (optional, maxLength=200), seoFilename (auto-generated, editable, hiển thị preview với extension)
    - Thêm nút "Lưu thông tin SEO" với trạng thái loading/disabled khi đang lưu
    - Hiển thị validation error inline khi altText trống và user cố submit
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 2.7_

  - [ ] 6.2 Implement logic auto-slug generation với debounce
    - Khi altText thay đổi và filename chưa được chỉnh sửa thủ công → auto-generate slug từ altText (debounce 300ms)
    - Khi altText trống và title có giá trị và filename chưa chỉnh sửa thủ công → auto-generate slug từ title (debounce 300ms)
    - Track state `isManuallyEdited`: set true khi admin chỉnh sửa trực tiếp filename, reset khi admin xóa toàn bộ filename
    - Giữ nguyên extension gốc, chỉ thay đổi phần tên
    - _Requirements: 2.4, 2.5, 3.1, 3.2, 3.5_

  - [ ]* 6.3 Viết unit tests cho SeoMetadataForm
    - Test render form sau upload → verify 3 trường hiển thị
    - Test nhập altText → verify auto-slug generation
    - Test chỉnh sửa thủ công filename → verify auto-generation dừng
    - Test xóa toàn bộ filename → verify auto-generation resume
    - Test submit form trống altText → verify warning hiển thị
    - _Requirements: 2.1, 2.2, 2.4, 2.6, 3.5_

- [ ] 7. Frontend - Tích hợp API và cập nhật MediaPickerDialog
  - [ ] 7.1 Thêm updateMedia vào media.service.ts
    - Thêm method `updateMedia(id: string, data: { altText?: string; title?: string; fileName?: string })` vào `media.service.ts`
    - Gọi API `PATCH /admin/media/:id` với dữ liệu đã nhập
    - Parse response theo schema hiện có
    - _Requirements: 4.1, 4.2_

  - [ ] 7.2 Tích hợp SeoMetadataForm vào MediaPickerDialog sau upload
    - Sau khi upload thành công → hiển thị `SeoMetadataForm` thay vì chuyển thẳng về library
    - Truyền `originalExtension` từ file vừa upload
    - Khi lưu thành công → cập nhật media trong danh sách thư viện mà không reload trang
    - Xử lý lỗi: hiển thị thông báo lỗi, giữ nguyên form data, enable lại nút lưu
    - _Requirements: 2.1, 4.1, 4.2, 4.3_

  - [ ] 7.3 Thêm SEO status indicators trong media grid
    - Thêm icon cảnh báo (warning icon) cho các ảnh chưa có altText trong danh sách media
    - Sử dụng visual indicator rõ ràng (ví dụ: icon tam giác vàng hoặc viền màu khác)
    - _Requirements: 6.1_

  - [ ] 7.4 Thêm hiển thị và chỉnh sửa SEO trong detail panel
    - Khi chọn ảnh → hiển thị thông tin SEO hiện tại (altText, title, fileName) trong panel chi tiết
    - Khi ảnh chưa có altText → hiển thị gợi ý nhắc admin bổ sung
    - Thêm các trường editable cho altText, title, fileName với nút "Cập nhật"
    - Khi nhấn cập nhật → gọi `updateMedia`, phản ánh thay đổi ngay lập tức
    - _Requirements: 6.2, 6.3, 7.1, 7.2, 7.3_

  - [ ]* 7.5 Viết unit tests cho MediaPickerDialog cập nhật
    - Test media grid item thiếu altText → verify warning icon hiển thị
    - Test detail panel hiển thị SEO info khi chọn ảnh
    - Test nút lưu disabled khi đang saving
    - Test cập nhật thành công → verify UI phản ánh thay đổi
    - _Requirements: 6.1, 6.2, 7.3_

- [ ] 8. Checkpoint cuối - Đảm bảo toàn bộ tính năng hoạt động
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Các task đánh dấu `*` là optional và có thể bỏ qua để triển khai MVP nhanh hơn
- Mỗi task tham chiếu đến requirements cụ thể để đảm bảo traceability
- Checkpoints đảm bảo validation từng giai đoạn
- Property tests validate các thuộc tính đúng đắn phổ quát (universal correctness properties)
- Unit tests validate các ví dụ cụ thể và edge cases
- Backend project: `c:\Users\HT90\Desktop\ht90\job\Duky\Duky boot\Backend-Dukyboot`
- Frontend project: `c:\Users\HT90\Desktop\ht90\job\Duky\DukyStore\duky-store-dashboard\Duky-store-dashhboard`
- `fast-check` đã được cài sẵn trong frontend project
- Backend cần cài thêm `fast-check` nếu muốn chạy property tests

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "5.1"] },
    { "id": 1, "tasks": ["1.2", "2.2", "3.1", "5.2", "5.3", "5.4"] },
    { "id": 2, "tasks": ["1.3", "2.3", "3.2", "3.3", "6.1"] },
    { "id": 3, "tasks": ["6.2", "7.1"] },
    { "id": 4, "tasks": ["6.3", "7.2", "7.3", "7.4"] },
    { "id": 5, "tasks": ["7.5"] }
  ]
}
```
