# Implementation Plan: Media Picker Optimization

## Overview

Tối ưu component `MediaPickerDialog` bằng cách triển khai infinite scroll (batch 20 ảnh/trang), cải thiện UX tìm kiếm (explicit trigger), tăng chiều cao dialog, và xử lý error states. Sử dụng custom hook `useMediaPagination` với IntersectionObserver API.

## Tasks

- [x] 1. Tạo custom hook `useMediaPagination`
  - [x] 1.1 Tạo file `hooks/use-media-pagination.ts` với interface và state management
    - Định nghĩa interface `UseMediaPaginationOptions` và `UseMediaPaginationReturn`
    - Implement state: items, currentPage, totalPages, isLoading, isLoadingMore, hasMore, error, searchQuery, loadedPages
    - Implement `fetchPage(page, search?)` gọi `mediaService.getMediaList({ page, limit: 20, search })`
    - Implement `fetchNextPage()`: kiểm tra `!isLoadingMore && hasMore && !loadedPages.has(nextPage)` trước khi fetch
    - Implement `search(query)`: reset items, page, loadedPages, set searchQuery, fetch page 1
    - Implement `reset()`: reset toàn bộ state về initial, dùng khi dialog đóng/mở lại
    - Implement `retry()`: gửi lại request cho trang đã thất bại với cùng params
    - Xử lý AbortController: cancel request khi reset hoặc search mới
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 2.1, 2.5, 5.2, 5.5_

  - [ ]* 1.2 Viết property test cho page accumulation (Property 1)
    - **Property 1: Page accumulation preserves existing items**
    - Tạo file `components/media/__tests__/media-picker-pagination.property.test.ts`
    - Dùng fast-check generate danh sách items hiện tại và trang mới, verify append giữ nguyên items cũ
    - **Validates: Requirements 1.4**

  - [ ]* 1.3 Viết property test cho pagination stop condition (Property 2)
    - **Property 2: Pagination stops at last page**
    - Verify khi `currentPage >= totalPages` thì `hasMore = false` và không gửi thêm request
    - **Validates: Requirements 1.5**

  - [ ]* 1.4 Viết property test cho error preservation (Property 3)
    - **Property 3: Error preserves existing data**
    - Verify khi fetch thất bại, danh sách items hiện tại không thay đổi
    - **Validates: Requirements 1.6, 2.7**

  - [ ]* 1.5 Viết property test cho search replaces list (Property 4)
    - **Property 4: Search replaces list entirely**
    - Verify sau khi search thành công, danh sách chỉ chứa kết quả tìm kiếm mới
    - **Validates: Requirements 2.3**

  - [ ]* 1.6 Viết property test cho search context in pagination (Property 5)
    - **Property 5: Infinite scroll with search maintains search context**
    - Verify mỗi request tải trang tiếp theo bao gồm cùng tham số search
    - **Validates: Requirements 2.5**

  - [ ]* 1.7 Viết property test cho no duplicate requests (Property 10)
    - **Property 10: No duplicate or concurrent page requests**
    - Verify không gửi request cho trang đã tải và không gửi request khi có request đang in-flight
    - **Validates: Requirements 1.3, 5.2, 5.5**

- [x] 2. Checkpoint - Đảm bảo hook logic hoạt động đúng
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Refactor `MediaPickerDialog` - Tích hợp hook và infinite scroll
  - [x] 3.1 Thay thế logic fetch hiện tại bằng `useMediaPagination` hook
    - Xóa state `items`, `isLoading`, `search` cũ và hàm `fetchMedia`
    - Xóa useEffect fetch theo `[open, search]`
    - Import và sử dụng `useMediaPagination({ batchSize: 20, enabled: open })`
    - Gọi `reset()` khi dialog mở (open chuyển từ false → true)
    - _Requirements: 1.1, 5.3_

  - [x] 3.2 Thêm IntersectionObserver sentinel element vào cuối Media_Grid
    - Tạo ref cho sentinel div ở cuối danh sách ảnh
    - Setup IntersectionObserver với `rootMargin: "200px"` để trigger trước khi cuộn đến cuối
    - Gọi `fetchNextPage()` khi sentinel intersect và `hasMore && !isLoadingMore`
    - Cleanup observer khi component unmount hoặc dialog đóng
    - _Requirements: 1.2, 1.3_

  - [x] 3.3 Cập nhật UI loading states và error handling
    - Hiển thị skeleton/spinner khi `isLoading` (trang đầu tiên)
    - Hiển thị loading indicator nhỏ ở cuối grid khi `isLoadingMore`
    - Hiển thị nút "Thử lại" khi `error !== null`, gọi `retry()` khi click
    - Hiển thị empty state khi `items.length === 0 && !isLoading`
    - _Requirements: 1.3, 1.6, 1.7, 1.8, 5.4_

  - [x] 3.4 Cập nhật logic tìm kiếm thành explicit trigger
    - Giữ local state `searchInput` cho ô input (controlled)
    - Gọi `hook.search(searchInput.trim())` khi nhấn Enter hoặc click nút tìm kiếm
    - Khi search input rỗng + Enter: gọi `hook.search("")` để reset về danh sách gốc
    - Không trigger search khi onChange (xóa dependency useEffect cũ)
    - _Requirements: 2.1, 2.3, 2.4, 2.6_

  - [ ]* 3.5 Viết property test cho selection preserved on append (Property 6)
    - **Property 6: Selection preserved on page append**
    - Verify `selectedMediaId` giữ nguyên khi append trang mới
    - **Validates: Requirements 4.1**

  - [ ]* 3.6 Viết property test cho search resets selection (Property 7)
    - **Property 7: Search resets selection**
    - Verify `selectedMediaId` reset về null khi search được trigger
    - **Validates: Requirements 4.2**

  - [ ]* 3.7 Viết property test cho orphaned selection reset (Property 9)
    - **Property 9: Orphaned selection is reset**
    - Verify khi selectedMediaId không tồn tại trong items mới, reset về null
    - **Validates: Requirements 4.4**

- [x] 4. Checkpoint - Đảm bảo infinite scroll và search hoạt động
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Cập nhật CSS chiều cao dialog và xử lý selection state
  - [x] 5.1 Tăng chiều cao dialog và grid theo requirements
    - Thay `max-h-[90vh]` thành `min-h-[85vh] max-h-[95vh]` cho DialogContent
    - Thay `max-h-[54vh]` thành `min-h-[70vh]` cho Media_Grid container, thêm `overflow-y-auto`
    - Thêm responsive: `max-h-[90vh]` cho viewport < 768px (dùng Tailwind `md:` prefix)
    - Cập nhật aside panel height tương ứng
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 5.2 Xử lý selection state khi tải thêm và tìm kiếm
    - Giữ nguyên `selectedMediaId` khi append trang mới (không auto-select)
    - Reset `selectedMediaId` về null khi search mới được trigger
    - Kiểm tra orphaned selection: nếu selectedMediaId không có trong items → reset về null
    - Hiển thị panel "Chi tiết ảnh" với đầy đủ thông tin khi có ảnh được chọn
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 5.3 Viết property test cho detail panel completeness (Property 8)
    - **Property 8: Detail panel displays all required fields**
    - Verify panel hiển thị đầy đủ: url, filename, size, mimeType, alt text input, caption input
    - **Validates: Requirements 4.3**

- [ ] 6. Viết unit tests cho component
  - [ ]* 6.1 Viết unit tests cho `MediaPickerDialog` refactored
    - Tạo file `components/media/__tests__/media-picker-dialog.test.tsx`
    - Test: dialog mở → fetch page 1 với limit=20
    - Test: IntersectionObserver trigger → fetch page tiếp theo
    - Test: empty state hiển thị khi data rỗng
    - Test: loading skeleton khi đang fetch page 1
    - Test: loading indicator cuối grid khi fetch page tiếp
    - Test: nút "Thử lại" hiển thị khi fetch thất bại
    - Test: dialog đóng/mở lại → reset hoàn toàn
    - Test: CSS height values đúng theo requirement
    - _Requirements: 1.1, 1.3, 1.6, 1.7, 3.1, 3.2, 5.3, 5.4_

- [x] 7. Final checkpoint - Đảm bảo toàn bộ tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks đánh dấu `*` là optional và có thể bỏ qua để triển khai MVP nhanh hơn
- Mỗi task tham chiếu đến requirements cụ thể để đảm bảo traceability
- Checkpoints đảm bảo kiểm tra tăng dần sau mỗi giai đoạn
- Property tests kiểm chứng correctness properties phổ quát (dùng fast-check)
- Unit tests kiểm tra behavior cụ thể và edge cases
- Backend API đã hỗ trợ sẵn `page`, `limit`, `search` params — không cần thay đổi backend
- File media service (`lib/api/services/media.service.ts`) không cần thay đổi interface

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5", "1.6", "1.7"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4"] },
    { "id": 4, "tasks": ["3.5", "3.6", "3.7", "5.1", "5.2"] },
    { "id": 5, "tasks": ["5.3", "6.1"] }
  ]
}
```
