# Tài liệu Yêu cầu Sửa lỗi

## Giới thiệu

Khi chuyển đổi giữa tab "Trực quan" (Visual) và tab "HTML" trong trình soạn thảo blog, các khối nội dung (content blocks) bị gộp lại thành một khối duy nhất mặc dù người dùng không thực hiện bất kỳ chỉnh sửa nào. Lỗi này xảy ra do hàm `minifyHtmlForStorage()` xóa ký hiệu phân tách khối (`<!-- duky-block -->`) trong quá trình chuyển đổi Visual → HTML, khiến cho quá trình chuyển ngược HTML → Visual không thể tách nội dung thành các khối riêng biệt.

## Phân tích Lỗi

### Hành vi Hiện tại (Lỗi)

1.1 KHI người dùng chuyển từ tab Trực quan sang tab HTML THÌ hệ thống gọi `toHtmlDraftFromContent()` → `prettyHtmlForEditor()` → `minifyHtmlForStorage()` và xóa tất cả `CONTENT_BLOCK_SEPARATOR` (`<!-- duky-block -->`) khỏi HTML draft, thay thế bằng khoảng trắng

1.2 KHI người dùng chuyển từ tab HTML quay lại tab Trực quan (không chỉnh sửa gì) THÌ hệ thống gọi `toContentFromHtmlDraft(htmlDraft)` nhưng không tìm thấy separator nào để split, dẫn đến toàn bộ nội dung bị gộp thành một khối duy nhất

1.3 KHI nội dung blog có nhiều khối (≥2 blocks) và người dùng thực hiện round-trip Visual → HTML → Visual THÌ hệ thống mất cấu trúc phân khối, số lượng blocks giảm từ N xuống còn 1

### Hành vi Mong đợi (Đúng)

2.1 KHI người dùng chuyển từ tab Trực quan sang tab HTML THÌ hệ thống PHẢI giữ nguyên `CONTENT_BLOCK_SEPARATOR` (`<!-- duky-block -->`) giữa các khối trong HTML draft hiển thị ở textarea

2.2 KHI người dùng chuyển từ tab HTML quay lại tab Trực quan (không chỉnh sửa gì) THÌ hệ thống PHẢI khôi phục đúng số lượng và nội dung của từng khối như trước khi chuyển tab

2.3 KHI nội dung blog có nhiều khối (≥2 blocks) và người dùng thực hiện round-trip Visual → HTML → Visual THÌ hệ thống PHẢI đảm bảo cấu trúc phân khối được bảo toàn hoàn toàn (lossless round-trip)

### Hành vi Không thay đổi (Ngăn ngừa Hồi quy)

3.1 KHI nội dung blog chỉ có một khối duy nhất THÌ hệ thống PHẢI TIẾP TỤC xử lý round-trip Visual → HTML → Visual bình thường mà không tạo thêm khối mới

3.2 KHI người dùng chỉnh sửa HTML trực tiếp trong textarea (thêm/xóa/sửa nội dung) THÌ hệ thống PHẢI TIẾP TỤC áp dụng các thay đổi đó khi chuyển về tab Trực quan

3.3 KHI nội dung được lưu vào database (publish/save) THÌ hệ thống PHẢI TIẾP TỤC minify HTML đúng cách cho storage (loại bỏ whitespace thừa, format gọn)

3.4 KHI hiển thị preview blog THÌ hệ thống PHẢI TIẾP TỤC render HTML đã strip block wrappers đúng cách

3.5 KHI người dùng sử dụng nút "Format" trong tab HTML THÌ hệ thống PHẢI TIẾP TỤC format lại HTML đẹp mà vẫn giữ nguyên separators giữa các khối
