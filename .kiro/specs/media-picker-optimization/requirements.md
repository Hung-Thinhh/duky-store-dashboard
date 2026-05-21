# Requirements Document

## Introduction

Tối ưu hiệu suất popup chọn ảnh (Media Picker Dialog) trong hệ thống quản trị. Hiện tại popup fetch toàn bộ 80 ảnh cùng lúc từ database gây chậm trải nghiệm người dùng. Cần cải thiện bằng cách áp dụng lazy loading (tải từng phần), tìm kiếm toàn bộ bảng media, và tăng chiều cao popup để hiển thị nhiều ảnh hơn.

## Glossary

- **Media_Picker_Dialog**: Component popup dạng dialog cho phép người dùng chọn ảnh từ thư viện media để chèn vào nội dung
- **Media_Grid**: Khu vực hiển thị lưới ảnh bên trong tab "Thư viện" của Media_Picker_Dialog
- **Media_Service**: Service frontend gọi API backend để lấy danh sách media với phân trang và tìm kiếm
- **Backend_Media_API**: API endpoint `/admin/media` trên backend xử lý truy vấn danh sách media từ database
- **Infinite_Scroll**: Cơ chế tự động tải thêm dữ liệu khi người dùng cuộn đến cuối danh sách hiện tại
- **Batch_Size**: Số lượng ảnh được tải trong mỗi lần request (mặc định 20 ảnh)

## Requirements

### Requirement 1: Lazy Loading với phân trang

**User Story:** Là quản trị viên, tôi muốn popup chọn ảnh chỉ tải 20 ảnh đầu tiên và tải thêm khi cuộn xuống, để popup mở nhanh hơn và không bị chậm khi thư viện có nhiều ảnh.

#### Acceptance Criteria

1. WHEN Media_Picker_Dialog mở tab "Thư viện", THE Media_Service SHALL gửi request với limit bằng Batch_Size (20 ảnh) và page bằng 1
2. WHEN người dùng cuộn Media_Grid đến vị trí cách cuối danh sách 200px AND không có request tải trang nào đang in-flight, THE Media_Picker_Dialog SHALL gửi request tải trang tiếp theo
3. WHILE Media_Service đang tải trang tiếp theo, THE Media_Picker_Dialog SHALL hiển thị indicator loading ở cuối Media_Grid và SHALL không gửi thêm request tải trang mới
4. WHEN trang tiếp theo được tải thành công, THE Media_Picker_Dialog SHALL nối (append) ảnh mới vào cuối danh sách hiện tại mà không thay thế ảnh đã hiển thị
5. WHEN Backend_Media_API trả về trang cuối cùng (page >= totalPages), THE Media_Picker_Dialog SHALL ngừng gửi request tải thêm và SHALL ẩn indicator loading
6. IF request tải trang tiếp theo thất bại (lỗi mạng hoặc response timeout sau 15 giây), THEN THE Media_Picker_Dialog SHALL hiển thị nút "Thử lại" ở cuối Media_Grid, và danh sách ảnh đã tải trước đó SHALL được giữ nguyên
7. IF Backend_Media_API trả về tổng số ảnh bằng 0 ở trang đầu tiên, THEN THE Media_Picker_Dialog SHALL hiển thị thông báo trạng thái trống (empty state) thay vì Media_Grid
8. WHEN người dùng nhấn nút "Thử lại", THE Media_Service SHALL gửi lại request cho cùng trang đã thất bại với cùng tham số limit và page

### Requirement 2: Tìm kiếm toàn bộ bảng media

**User Story:** Là quản trị viên, tôi muốn tìm kiếm ảnh theo tên file, alt text, hoặc tiêu đề trong toàn bộ thư viện media, để nhanh chóng tìm được ảnh cần dùng mà không phải cuộn qua hàng trăm ảnh.

#### Acceptance Criteria

1. WHEN người dùng nhập từ khóa có ít nhất 1 ký tự (sau khi trim khoảng trắng) vào ô tìm kiếm và nhấn Enter hoặc nhấn nút tìm kiếm, THE Media_Service SHALL gửi request với tham số search chứa từ khóa đó, reset page về 1, và giữ nguyên limit hiện tại (tối đa 100 items mỗi trang)
2. WHEN Backend_Media_API nhận tham số search, THE Backend_Media_API SHALL tìm kiếm theo phương thức "contains" (chứa chuỗi con) trong các trường: url, fileName, originalName, title, và altText với chế độ không phân biệt hoa thường (case-insensitive), và chỉ trả về các media chưa bị xóa (deletedAt = null)
3. WHEN kết quả tìm kiếm được trả về, THE Media_Picker_Dialog SHALL thay thế toàn bộ danh sách ảnh hiện tại bằng kết quả tìm kiếm mới và hiển thị loading indicator trong thời gian chờ response
4. WHEN kết quả tìm kiếm trống (data trả về là mảng rỗng), THE Media_Picker_Dialog SHALL hiển thị thông báo cho biết không tìm thấy media phù hợp với từ khóa đã nhập
5. WHILE có từ khóa tìm kiếm đang active, THE Media_Picker_Dialog SHALL áp dụng Infinite_Scroll cho kết quả tìm kiếm, tải thêm trang tiếp theo (page + 1) với cùng tham số search và limit khi người dùng cuộn đến cuối danh sách, và dừng tải khi page hiện tại bằng totalPages từ response
6. WHEN người dùng xóa toàn bộ từ khóa tìm kiếm (ô input rỗng sau khi trim) và nhấn Enter hoặc nhấn nút tìm kiếm, THE Media_Picker_Dialog SHALL tải lại danh sách media không có tham số search từ trang 1 với limit mặc định
7. IF request tìm kiếm thất bại (lỗi mạng hoặc server trả về lỗi), THEN THE Media_Picker_Dialog SHALL giữ nguyên danh sách media hiện tại và hiển thị thông báo lỗi cho người dùng biết tìm kiếm không thành công

### Requirement 3: Tăng chiều cao popup

**User Story:** Là quản trị viên, tôi muốn popup chọn ảnh có chiều cao lớn hơn, để nhìn thấy nhiều ảnh hơn cùng lúc và giảm số lần cuộn.

#### Acceptance Criteria

1. THE Media_Picker_Dialog SHALL có chiều cao tối thiểu 85vh (85% chiều cao viewport) và chiều cao tối đa 95vh trên viewport có chiều rộng từ 768px trở lên
2. THE Media_Grid SHALL có chiều cao tối thiểu 70vh và hiển thị thanh cuộn dọc bên trong (overflow-y scroll) khi nội dung ảnh vượt quá chiều cao khả dụng của grid
3. WHILE kích thước viewport có chiều rộng nhỏ hơn 768px, THE Media_Picker_Dialog SHALL giữ chiều cao tối đa 90vh để toàn bộ dialog nằm trong vùng nhìn thấy được mà không tạo thanh cuộn trên body
4. WHEN Media_Picker_Dialog được mở, THE Media_Grid SHALL hiển thị ít nhất 3 hàng ảnh mà không cần cuộn trên viewport có chiều cao từ 900px trở lên

### Requirement 4: Giữ trạng thái chọn ảnh khi tải thêm

**User Story:** Là quản trị viên, tôi muốn ảnh đã chọn vẫn được highlight khi tải thêm ảnh mới, để không bị mất lựa chọn trong quá trình cuộn.

#### Acceptance Criteria

1. WHILE người dùng đã chọn một ảnh trong Media_Grid, THE Media_Picker_Dialog SHALL giữ nguyên giá trị selectedMediaId và hiển thị viền highlight (border + ring) trên ảnh đó khi danh sách media được cập nhật do tải thêm trang mới hoặc làm mới dữ liệu
2. WHEN người dùng thay đổi giá trị trong ô tìm kiếm và hệ thống thực hiện fetch danh sách media mới, THE Media_Picker_Dialog SHALL reset trạng thái selectedMediaId về null và ẩn panel chi tiết ảnh
3. WHILE một ảnh đang được chọn (selectedMediaId khác null), THE Media_Picker_Dialog SHALL hiển thị panel "Chi tiết ảnh" bên phải bao gồm: ảnh preview, tên file, kích thước file, định dạng MIME, và các trường nhập liệu cho văn bản thay thế (alt text) và chú thích (caption)
4. IF ảnh đang được chọn không còn tồn tại trong danh sách items sau khi tải lại dữ liệu, THEN THE Media_Picker_Dialog SHALL reset selectedMediaId về null và hiển thị thông báo "Chọn một ảnh để xem chi tiết" trong panel bên phải

### Requirement 5: Hiệu suất tải ảnh

**User Story:** Là quản trị viên, tôi muốn popup mở nhanh và phản hồi mượt mà, để không bị gián đoạn workflow khi chèn ảnh vào bài viết.

#### Acceptance Criteria

1. WHEN Media_Picker_Dialog mở (bao gồm cả lần đầu và mở lại), THE Media_Picker_Dialog SHALL hiển thị ảnh đầu tiên của trang 1 trong vòng 1000ms tính từ thời điểm nhận được response từ Backend_Media_API
2. THE Media_Picker_Dialog SHALL không gửi request trùng lặp cho cùng một trang đã được tải trong cùng phiên mở dialog với cùng tham số search hiện tại
3. WHEN Media_Picker_Dialog đóng và mở lại, THE Media_Picker_Dialog SHALL reset danh sách, xóa cache các trang đã tải, và gửi request tải lại từ trang 1
4. WHILE Media_Service đang tải trang đầu tiên (page 1), THE Media_Picker_Dialog SHALL hiển thị trạng thái loading (skeleton hoặc spinner) trong khu vực Media_Grid
5. WHILE một request tải trang đang in-flight, THE Media_Picker_Dialog SHALL không gửi thêm request tải trang mới cho đến khi request hiện tại hoàn thành hoặc thất bại
