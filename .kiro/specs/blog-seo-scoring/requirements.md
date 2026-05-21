# Requirements Document

## Giới thiệu

Hệ thống chấm điểm SEO real-time cho blog editor, tương tự Rank Math SEO / Yoast SEO. Hệ thống phân tích nội dung bài viết dựa trên focus keyword và cho điểm theo các tiêu chí chuẩn SEO. Toàn bộ phân tích chạy client-side, cập nhật real-time khi user thay đổi nội dung.

## Glossary

- **SEO_Scorer**: Module phân tích và chấm điểm SEO cho bài viết blog, chạy hoàn toàn client-side
- **Focus_Keyword**: Từ khóa chính mà user nhập vào để hệ thống phân tích mức độ tối ưu SEO của bài viết
- **SEO_Title**: Tiêu đề SEO (meta title) của bài viết, hiển thị trên kết quả tìm kiếm
- **Meta_Description**: Mô tả ngắn của bài viết hiển thị trên kết quả tìm kiếm
- **Keyword_Density**: Tỷ lệ phần trăm số lần Focus Keyword xuất hiện so với tổng số từ trong nội dung
- **SEO_Panel**: Giao diện hiển thị kết quả chấm điểm SEO, bao gồm điểm tổng và danh sách tiêu chí
- **Blog_Editor**: Trang chỉnh sửa bài viết blog hiện tại sử dụng TipTap editor
- **Content_Section**: Phần nội dung chính của bài viết lấy từ TipTap editor qua editor.getHTML()
- **Subheading**: Các thẻ heading h2, h3 trong nội dung bài viết
- **External_Link**: Liên kết trỏ đến domain khác với domain hiện tại
- **Internal_Link**: Liên kết trỏ đến cùng domain với website hiện tại

## Requirements

### Requirement 1: Nhập Focus Keyword

**User Story:** Là một người viết blog, tôi muốn nhập focus keyword cho bài viết, để hệ thống có thể phân tích mức độ tối ưu SEO dựa trên từ khóa đó.

#### Acceptance Criteria

1. THE SEO_Panel SHALL hiển thị một input field cho phép user nhập Focus_Keyword trong section "Rank Math SEO" hiện tại
2. WHEN user nhập Focus_Keyword, THE SEO_Scorer SHALL kích hoạt phân tích SEO ngay lập tức
3. WHILE Focus_Keyword trống, THE SEO_Panel SHALL hiển thị trạng thái chờ nhập keyword và không hiển thị điểm số
4. THE SEO_Scorer SHALL thực hiện so sánh Focus_Keyword theo dạng case-insensitive

### Requirement 2: Tính điểm SEO tổng

**User Story:** Là một người viết blog, tôi muốn xem điểm SEO tổng của bài viết trên thang 100, để nhanh chóng đánh giá mức độ tối ưu SEO.

#### Acceptance Criteria

1. WHEN Focus_Keyword được nhập, THE SEO_Scorer SHALL tính điểm tổng trên thang 100 dựa trên tất cả tiêu chí SEO
2. THE SEO_Panel SHALL hiển thị điểm tổng dưới dạng số /100 cùng với indicator màu sắc (đỏ: 0-50, cam: 51-80, xanh: 81-100)
3. WHEN user thay đổi nội dung, SEO_Title, slug, hoặc Meta_Description, THE SEO_Scorer SHALL cập nhật điểm tổng trong vòng 300ms (debounce)
4. THE SEO_Scorer SHALL tính điểm bằng cách gán trọng số cho mỗi tiêu chí và cộng điểm các tiêu chí pass

### Requirement 3: Phân tích Basic SEO

**User Story:** Là một người viết blog, tôi muốn kiểm tra các tiêu chí SEO cơ bản, để đảm bảo bài viết đáp ứng yêu cầu tối thiểu cho SEO.

#### Acceptance Criteria

1. WHEN Focus_Keyword được nhập, THE SEO_Scorer SHALL kiểm tra Focus_Keyword có xuất hiện trong SEO_Title
2. WHEN Focus_Keyword được nhập, THE SEO_Scorer SHALL kiểm tra Focus_Keyword có xuất hiện trong Meta_Description
3. WHEN Focus_Keyword được nhập, THE SEO_Scorer SHALL kiểm tra Focus_Keyword có xuất hiện trong URL slug
4. WHEN Focus_Keyword được nhập, THE SEO_Scorer SHALL kiểm tra Focus_Keyword có xuất hiện trong 10% đầu tiên của nội dung (tính theo số từ)
5. WHEN Focus_Keyword được nhập, THE SEO_Scorer SHALL kiểm tra Focus_Keyword có xuất hiện ít nhất một lần trong Content_Section
6. THE SEO_Scorer SHALL kiểm tra Content_Section có độ dài tối thiểu 600 từ
7. THE SEO_Panel SHALL hiển thị section "Basic SEO" với số lỗi (errors count) và danh sách tiêu chí kèm icon xanh (pass) hoặc đỏ (fail)

### Requirement 4: Phân tích Additional SEO

**User Story:** Là một người viết blog, tôi muốn kiểm tra các tiêu chí SEO bổ sung, để tối ưu hóa bài viết ở mức cao hơn.

#### Acceptance Criteria

1. WHEN Focus_Keyword được nhập, THE SEO_Scorer SHALL kiểm tra Focus_Keyword có xuất hiện trong ít nhất một Subheading (h2 hoặc h3)
2. WHEN Focus_Keyword được nhập, THE SEO_Scorer SHALL kiểm tra Focus_Keyword có xuất hiện trong alt text của ít nhất một ảnh
3. WHEN Focus_Keyword được nhập, THE SEO_Scorer SHALL tính Keyword_Density và đánh giá pass khi giá trị nằm trong khoảng 1% đến 2.5%
4. THE SEO_Scorer SHALL kiểm tra độ dài URL slug không vượt quá 75 ký tự
5. THE SEO_Scorer SHALL kiểm tra Content_Section có chứa ít nhất một External_Link
6. THE SEO_Scorer SHALL kiểm tra Content_Section có chứa ít nhất một Internal_Link
7. THE SEO_Panel SHALL hiển thị section "Additional" với số lỗi (errors count) và danh sách tiêu chí kèm icon xanh (pass) hoặc đỏ (fail)

### Requirement 5: Phân tích Title Readability

**User Story:** Là một người viết blog, tôi muốn kiểm tra tiêu đề SEO có dễ đọc và thu hút click, để tăng CTR trên kết quả tìm kiếm.

#### Acceptance Criteria

1. WHEN Focus_Keyword được nhập, THE SEO_Scorer SHALL kiểm tra Focus_Keyword có xuất hiện ở đầu SEO_Title (trong 50% đầu tiên của title)
2. THE SEO_Scorer SHALL kiểm tra SEO_Title có chứa ít nhất một chữ số
3. THE SEO_Panel SHALL hiển thị section "Title Readability" với số lỗi (errors count) và danh sách tiêu chí kèm icon xanh (pass) hoặc đỏ (fail)

### Requirement 6: Phân tích Content Readability

**User Story:** Là một người viết blog, tôi muốn kiểm tra nội dung có dễ đọc, để cải thiện trải nghiệm người đọc và giảm bounce rate.

#### Acceptance Criteria

1. THE SEO_Scorer SHALL kiểm tra tất cả đoạn văn trong Content_Section có độ dài không quá 150 từ mỗi đoạn
2. THE SEO_Scorer SHALL kiểm tra Content_Section có chứa ít nhất một ảnh hoặc video
3. THE SEO_Panel SHALL hiển thị section "Content Readability" với số lỗi (errors count) và danh sách tiêu chí kèm icon xanh (pass) hoặc đỏ (fail)

### Requirement 7: Giao diện SEO Panel

**User Story:** Là một người viết blog, tôi muốn xem kết quả phân tích SEO trong một panel rõ ràng và dễ hiểu, để nhanh chóng biết cần cải thiện gì.

#### Acceptance Criteria

1. THE SEO_Panel SHALL được tích hợp vào section "Rank Math SEO" hiện tại trên trang Blog_Editor
2. THE SEO_Panel SHALL chia kết quả thành 4 section: Basic SEO, Additional, Title Readability, Content Readability
3. WHEN một section có tiêu chí fail, THE SEO_Panel SHALL hiển thị số lượng lỗi bên cạnh tên section
4. THE SEO_Panel SHALL hiển thị mỗi tiêu chí với icon màu xanh khi pass và icon màu đỏ khi fail
5. THE SEO_Panel SHALL cho phép user mở rộng hoặc thu gọn từng section

### Requirement 8: Xử lý real-time và hiệu năng

**User Story:** Là một người viết blog, tôi muốn kết quả phân tích SEO cập nhật ngay khi tôi chỉnh sửa, để không phải chờ đợi hay refresh trang.

#### Acceptance Criteria

1. WHEN user thay đổi nội dung trong TipTap editor, THE SEO_Scorer SHALL cập nhật kết quả phân tích với debounce 300ms
2. WHEN user thay đổi SEO_Title, Meta_Description, hoặc slug, THE SEO_Scorer SHALL cập nhật kết quả phân tích với debounce 300ms
3. THE SEO_Scorer SHALL thực hiện toàn bộ phân tích client-side mà không gọi API bên ngoài
4. THE SEO_Scorer SHALL parse HTML content từ TipTap editor thông qua editor.getHTML() để trích xuất text, headings, links, và images

### Requirement 9: Tính Keyword Density

**User Story:** Là một người viết blog, tôi muốn biết mật độ từ khóa trong bài viết, để tránh keyword stuffing hoặc thiếu keyword.

#### Acceptance Criteria

1. WHEN Focus_Keyword được nhập, THE SEO_Scorer SHALL tính Keyword_Density bằng công thức: (số lần Focus_Keyword xuất hiện / tổng số từ trong Content_Section) × 100
2. THE SEO_Scorer SHALL đếm số lần xuất hiện của Focus_Keyword theo dạng case-insensitive và khớp toàn bộ cụm từ (whole phrase match)
3. WHEN Keyword_Density nằm trong khoảng 1.0% đến 2.5%, THE SEO_Scorer SHALL đánh giá tiêu chí Keyword Density là pass
4. WHEN Keyword_Density nằm ngoài khoảng 1.0% đến 2.5%, THE SEO_Scorer SHALL đánh giá tiêu chí Keyword Density là fail
5. FOR ALL nội dung hợp lệ, tính Keyword_Density rồi thay đổi nội dung rồi tính lại SHALL cho kết quả phản ánh đúng nội dung mới (round-trip property)
