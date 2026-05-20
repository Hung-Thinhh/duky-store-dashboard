# Kế hoạch Triển khai

- [ ] 1. Viết test exploration cho bug condition (round-trip mất blocks)
  - **Property 1: Bug Condition** - Round-trip Visual ↔ HTML Gộp Khối
  - **CRITICAL**: Test này PHẢI FAIL trên code chưa sửa — failure xác nhận lỗi tồn tại
  - **KHÔNG cố sửa test hoặc code khi test fail**
  - **NOTE**: Test này encode hành vi mong đợi — sẽ validate fix khi pass sau implementation
  - **GOAL**: Tạo counterexamples chứng minh lỗi tồn tại
  - **Scoped PBT Approach**: Scope property vào concrete failing cases: content có ≥2 blocks qua round-trip
  - Tạo content với nhiều blocks (2, 3, 5 blocks) sử dụng `CONTENT_BLOCK_SEPARATOR` và `wrapHtmlAsBlock`
  - Chạy qua `toHtmlDraftFromContent(content)` rồi `toContentFromHtmlDraft(result)`
  - Assert: `splitContentToBlocks(output).length === splitContentToBlocks(input).length`
  - Assert: nội dung HTML trong mỗi block được bảo toàn sau round-trip
  - Chạy test trên code CHƯA SỬA
  - **EXPECTED OUTCOME**: Test FAILS (đúng — chứng minh lỗi tồn tại)
  - Document counterexamples: "content 3 blocks → sau round-trip chỉ còn 1 block"
  - Đánh dấu task hoàn thành khi test được viết, chạy, và failure được ghi nhận
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Viết preservation property tests (TRƯỚC khi implement fix)
  - **Property 2: Preservation** - Hành vi Không thay đổi cho Non-roundtrip Operations
  - **IMPORTANT**: Tuân theo observation-first methodology
  - Observe: `toHtmlDraftFromContent(singleBlockContent)` → round-trip trả về đúng 1 block trên code chưa sửa
  - Observe: `minifyHtmlForStorage(htmlWithSeparator)` → xóa separator, trả về minified HTML trên code chưa sửa
  - Observe: `toPublishableBlogHtml(content)` → strip block wrappers đúng trên code chưa sửa
  - Viết property-based test: với mọi single-block content, round-trip vẫn trả về 1 block với cùng nội dung
  - Viết property-based test: `minifyHtmlForStorage` vẫn xóa separator cho storage use case
  - Viết property-based test: `toPublishableBlogHtml` vẫn render đúng (không có block wrappers)
  - Xác nhận tests PASS trên code CHƯA SỬA
  - **EXPECTED OUTCOME**: Tests PASS (xác nhận baseline behavior cần bảo toàn)
  - Đánh dấu task hoàn thành khi tests được viết, chạy, và passing trên code chưa sửa
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Sửa lỗi gộp khối khi round-trip Visual ↔ HTML

  - [ ] 3.1 Implement fix
    - Tạo hàm `minifyHtmlForEditorDraft(html)`: tương tự `minifyHtmlForStorage` nhưng KHÔNG xóa `CONTENT_BLOCK_SEPARATOR` — chỉ loại bỏ whitespace thừa, giữ nguyên separator
    - Sửa hàm `toHtmlDraftFromContent`: thay vì gọi `toPublishableBlogHtml` (mất separator), cần:
      1. Split content thành blocks bằng `splitContentToBlocks`
      2. Unwrap mỗi block bằng `unwrapBlockHtml`
      3. Format mỗi block riêng (dùng `prettyHtmlForEditor` mới hoặc logic format không xóa separator)
      4. Join các blocks lại bằng `\n${CONTENT_BLOCK_SEPARATOR}\n`
    - Sửa hàm `prettyHtmlForEditor`: thay `minifyHtmlForStorage` bằng `minifyHtmlForEditorDraft` mới
    - Giữ nguyên `minifyHtmlForStorage` cho storage use case (publish/save)
    - Giữ nguyên `toContentFromHtmlDraft` — hàm này đã split đúng bằng separator
    - _Bug_Condition: isBugCondition(input) where input has ≥2 blocks AND action = roundtrip_
    - _Expected_Behavior: round-trip bảo toàn số blocks và nội dung mỗi block_
    - _Preservation: minifyHtmlForStorage vẫn xóa separator, preview vẫn strip wrappers, single-block vẫn hoạt động_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 3.2 Xác nhận bug condition exploration test PASS
    - **Property 1: Expected Behavior** - Round-trip Visual ↔ HTML Bảo toàn Khối
    - **IMPORTANT**: Chạy lại CÙNG test từ task 1 — KHÔNG viết test mới
    - Test từ task 1 encode hành vi mong đợi
    - Khi test pass, xác nhận hành vi mong đợi được thỏa mãn
    - Chạy bug condition exploration test từ bước 1
    - **EXPECTED OUTCOME**: Test PASSES (xác nhận lỗi đã được sửa)
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.3 Xác nhận preservation tests vẫn PASS
    - **Property 2: Preservation** - Hành vi Không thay đổi cho Non-roundtrip Operations
    - **IMPORTANT**: Chạy lại CÙNG tests từ task 2 — KHÔNG viết tests mới
    - Chạy preservation property tests từ bước 2
    - **EXPECTED OUTCOME**: Tests PASS (xác nhận không có regression)
    - Xác nhận tất cả tests vẫn pass sau fix (không có hồi quy)

- [ ] 4. Checkpoint - Đảm bảo tất cả tests pass
  - Chạy toàn bộ test suite
  - Xác nhận exploration test (task 1) PASS
  - Xác nhận preservation tests (task 2) PASS
  - Hỏi user nếu có câu hỏi phát sinh
