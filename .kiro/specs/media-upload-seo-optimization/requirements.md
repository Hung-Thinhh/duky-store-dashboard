# Requirements Document

## Introduction

Tính năng tối ưu SEO cho media upload trong hệ thống quản trị DukyStore. Hiện tại khi upload ảnh, các trường `altText`, `title`, `width`, `height`, `metadata` đều là `null`, và `fileName` được lưu dưới dạng UUID không thân thiện với SEO. Tính năng này cho phép admin nhập thông tin SEO (alt text, title, custom filename) sau khi upload ảnh, đồng thời backend tự động trích xuất kích thước ảnh (width/height) để phục vụ Core Web Vitals.

## Glossary

- **Media_Upload_Service**: Service backend (NestJS) xử lý việc upload file ảnh lên server và lưu thông tin vào database
- **Media_Picker_Dialog**: Component dialog trên frontend (Next.js) cho phép admin upload và chọn ảnh
- **SEO_Metadata_Form**: Form hiển thị sau khi upload ảnh để admin nhập thông tin SEO (alt text, title, custom filename)
- **Slug**: Chuỗi ký tự URL-friendly, chỉ chứa chữ thường, số, và dấu gạch ngang, không dấu tiếng Việt (ví dụ: `ao-blazer-nu-2026`)
- **Alt_Text**: Văn bản mô tả nội dung ảnh, giúp công cụ tìm kiếm hiểu nội dung ảnh và hỗ trợ accessibility
- **SEO_Filename**: Tên file thân thiện SEO dạng slug, được sử dụng làm phần hiển thị trong URL hoặc thuộc tính của ảnh
- **Image_Dimensions**: Chiều rộng (width) và chiều cao (height) của ảnh tính bằng pixel
- **Admin**: Người dùng có quyền quản trị, sử dụng dashboard để quản lý nội dung

## Requirements

### Requirement 1: Trích xuất kích thước ảnh và chuyển đổi sang WebP khi upload

**User Story:** Là một Admin, tôi muốn hệ thống tự động trích xuất width/height và chuyển đổi ảnh sang định dạng WebP chất lượng cao khi upload, để ảnh nhẹ hơn, tải nhanh hơn, và tránh layout shift (CLS) trên trang blog.

#### Acceptance Criteria

1. WHEN một file ảnh được upload và lưu trữ thành công vào storage, THE Media_Upload_Service SHALL trích xuất width và height (đơn vị pixel, kiểu số nguyên, giá trị từ 1 đến 65535) từ buffer của file ảnh và lưu vào database trong cùng một request xử lý upload
2. WHEN file upload có định dạng JPEG, PNG, WebP, GIF, hoặc AVIF, THE Media_Upload_Service SHALL trích xuất Image_Dimensions với giá trị width và height khớp chính xác với kích thước pixel thực tế của ảnh gốc
3. IF file upload có định dạng SVG, hoặc file bị hỏng (corrupt) khiến thư viện xử lý ảnh không đọc được metadata kích thước, hoặc quá trình trích xuất vượt quá 5 giây, THEN THE Media_Upload_Service SHALL lưu width và height là null và tiếp tục xử lý upload bình thường mà không trả về lỗi cho client
4. THE Media_Upload_Service SHALL trả về width và height trong response của API upload, bao gồm cả trường hợp giá trị là null khi không trích xuất được kích thước
5. WHEN file upload có định dạng JPEG, PNG, GIF, hoặc AVIF (không phải SVG), THE Media_Upload_Service SHALL chuyển đổi ảnh sang định dạng WebP với chất lượng 85 (quality: 85) trước khi lưu vào storage
6. THE Media_Upload_Service SHALL giữ nguyên kích thước pixel gốc (width/height) khi chuyển đổi sang WebP, không resize hoặc crop ảnh
7. WHEN file upload đã là định dạng WebP, THE Media_Upload_Service SHALL giữ nguyên file gốc mà không chuyển đổi lại
8. THE Media_Upload_Service SHALL lưu mimeType là "image/webp" và extension là ".webp" cho file đã chuyển đổi
9. IF quá trình chuyển đổi WebP thất bại, THEN THE Media_Upload_Service SHALL lưu file gốc không chuyển đổi và tiếp tục xử lý upload bình thường

### Requirement 2: Hiển thị form nhập thông tin SEO sau khi upload

**User Story:** Là một Admin, tôi muốn thấy một form nhập thông tin SEO ngay sau khi upload ảnh, để tôi có thể bổ sung alt text, title và custom filename cho ảnh phục vụ SEO blog.

#### Acceptance Criteria

1. WHEN một file ảnh được upload thành công trong Media_Picker_Dialog, THE SEO_Metadata_Form SHALL hiển thị tự động với các trường: Alt_Text, Title, và SEO_Filename
2. THE SEO_Metadata_Form SHALL hiển thị trường Alt_Text là bắt buộc, với nhãn gợi ý "Mô tả nội dung ảnh", và giới hạn tối đa 125 ký tự
3. THE SEO_Metadata_Form SHALL hiển thị trường Title là tùy chọn, với giới hạn tối đa 200 ký tự
4. WHEN Admin nhập hoặc thay đổi giá trị Alt_Text, THE SEO_Metadata_Form SHALL tự động cập nhật trường SEO_Filename bằng cách chuyển Alt_Text thành định dạng URL slug (chữ thường, thay khoảng trắng và ký tự đặc biệt bằng dấu gạch ngang, tối đa 100 ký tự)
5. IF Alt_Text trống và Title có giá trị, THEN THE SEO_Metadata_Form SHALL sinh SEO_Filename từ giá trị Title theo cùng quy tắc URL slug
6. IF Admin cố gắng lưu form mà trường Alt_Text còn trống, THEN THE SEO_Metadata_Form SHALL hiển thị thông báo cảnh báo inline ngay dưới trường Alt_Text cho biết Alt_Text là bắt buộc cho SEO
7. THE SEO_Metadata_Form SHALL cho phép Admin chỉnh sửa thủ công giá trị SEO_Filename sau khi được tự động sinh

### Requirement 3: Tự động sinh SEO filename dạng slug

**User Story:** Là một Admin, tôi muốn hệ thống tự động tạo filename dạng slug từ alt text hoặc title tôi nhập, để tôi không phải tự gõ slug thủ công mỗi lần.

#### Acceptance Criteria

1. WHEN Admin nhập hoặc thay đổi giá trị Alt_Text trong SEO_Metadata_Form và trường SEO_Filename chưa được chỉnh sửa thủ công, THE SEO_Metadata_Form SHALL tự động sinh SEO_Filename dạng Slug từ giá trị Alt_Text trong vòng 300ms sau khi Admin ngừng nhập (debounce)
2. WHEN Admin nhập hoặc thay đổi giá trị Title trong SEO_Metadata_Form và Alt_Text đang trống và trường SEO_Filename chưa được chỉnh sửa thủ công, THE SEO_Metadata_Form SHALL tự động sinh SEO_Filename dạng Slug từ giá trị Title trong vòng 300ms sau khi Admin ngừng nhập (debounce)
3. THE SEO_Metadata_Form SHALL chuyển đổi tiếng Việt có dấu thành không dấu khi sinh Slug (ví dụ: "Áo blazer nữ 2026" thành "ao-blazer-nu-2026")
4. THE SEO_Metadata_Form SHALL áp dụng các quy tắc sau khi sinh Slug: chuyển toàn bộ thành chữ thường, loại bỏ tất cả ký tự không phải chữ cái (a-z), chữ số (0-9), khoảng trắng hoặc dấu gạch ngang, thay khoảng trắng bằng dấu gạch ngang đơn, gộp nhiều dấu gạch ngang liên tiếp thành một dấu gạch ngang duy nhất, và loại bỏ dấu gạch ngang ở đầu và cuối chuỗi
5. WHEN Admin chỉnh sửa trực tiếp giá trị trong trường SEO_Filename (thay đổi ít nhất một ký tự), THE SEO_Metadata_Form SHALL ngừng tự động cập nhật Slug từ Alt_Text hoặc Title cho đến khi Admin xóa toàn bộ nội dung trường SEO_Filename
6. THE SEO_Metadata_Form SHALL giữ nguyên phần extension gốc của file (ví dụ: .jpg, .png) và chỉ thay đổi phần tên trước extension
7. THE SEO_Metadata_Form SHALL giới hạn phần tên slug (không bao gồm extension) tối đa 100 ký tự, cắt tại ranh giới từ (dấu gạch ngang) gần nhất nếu vượt quá giới hạn

### Requirement 4: Lưu thông tin SEO metadata vào database

**User Story:** Là một Admin, tôi muốn lưu thông tin SEO đã nhập vào database, để khi hiển thị ảnh trên blog thì có đầy đủ alt text, title và filename chuẩn SEO.

#### Acceptance Criteria

1. WHEN Admin nhấn nút lưu trên SEO_Metadata_Form, THE Media_Picker_Dialog SHALL disable nút lưu, hiển thị trạng thái đang xử lý, và gọi API PATCH /admin/media/:id với dữ liệu altText, title, và fileName đã nhập
2. WHEN API PATCH trả về thành công, THE Media_Picker_Dialog SHALL cập nhật altText, title, và fileName của media tương ứng trong danh sách thư viện mà không cần reload trang, và enable lại nút lưu
3. IF API PATCH trả về lỗi, THEN THE Media_Picker_Dialog SHALL hiển thị thông báo lỗi cho Admin chỉ rõ nguyên nhân (ví dụ: lỗi mạng hoặc dữ liệu không hợp lệ), giữ nguyên dữ liệu form, và enable lại nút lưu để Admin thử lại
4. THE Media_Upload_Service SHALL validate rằng fileName (nếu được gửi) chỉ chứa ký tự hợp lệ cho Slug (chữ thường, số, dấu gạch ngang) cộng extension, và có độ dài tổng cộng (bao gồm extension) không quá 200 ký tự
5. IF fileName không hợp lệ theo quy tắc Slug hoặc vượt quá 200 ký tự, THEN THE Media_Upload_Service SHALL từ chối request và trả về lỗi validation chỉ rõ trường fileName không hợp lệ
6. THE Media_Upload_Service SHALL validate rằng altText và title (nếu được gửi) có độ dài tối đa 500 ký tự mỗi trường

### Requirement 5: Hỗ trợ nhập metadata trong quá trình upload

**User Story:** Là một Admin, tôi muốn có thể gửi altText và title ngay trong request upload, để giảm số bước thao tác khi đã biết trước thông tin SEO.

#### Acceptance Criteria

1. WHEN request upload chứa trường altText trong form data, THE Media_Upload_Service SHALL lưu giá trị altText vào database cùng với file
2. WHEN request upload chứa trường title trong form data, THE Media_Upload_Service SHALL lưu giá trị title vào database cùng với file
3. WHEN request upload không chứa altText hoặc title, THE Media_Upload_Service SHALL lưu các trường đó là null và upload vẫn thành công
4. THE Media_Upload_Service SHALL validate altText và title có độ dài từ 1 đến 500 ký tự, không chứa HTML tags, và chỉ chấp nhận chuỗi văn bản thuần (plain text)
5. IF altText hoặc title trong request upload không vượt qua validation, THEN THE Media_Upload_Service SHALL từ chối toàn bộ request upload, trả về lỗi chỉ rõ trường nào không hợp lệ, và không lưu file
6. WHEN upload thành công với altText hoặc title, THE Media_Upload_Service SHALL trả về giá trị altText và title đã lưu trong response của API upload

### Requirement 6: Hiển thị trạng thái SEO của ảnh trong thư viện

**User Story:** Là một Admin, tôi muốn nhìn thấy nhanh ảnh nào đã có thông tin SEO và ảnh nào chưa, để tôi biết cần bổ sung thông tin cho ảnh nào.

#### Acceptance Criteria

1. WHILE hiển thị danh sách media trong thư viện, THE Media_Picker_Dialog SHALL đánh dấu trực quan các ảnh chưa có Alt_Text (ví dụ: icon cảnh báo hoặc viền màu khác)
2. WHEN Admin chọn một ảnh trong thư viện, THE Media_Picker_Dialog SHALL hiển thị thông tin SEO hiện tại (Alt_Text, Title, SEO_Filename) trong panel chi tiết bên phải
3. WHEN Admin chọn một ảnh chưa có Alt_Text, THE Media_Picker_Dialog SHALL hiển thị gợi ý nhắc Admin bổ sung Alt_Text cho SEO

### Requirement 7: Chỉnh sửa thông tin SEO cho ảnh đã upload

**User Story:** Là một Admin, tôi muốn chỉnh sửa thông tin SEO của ảnh đã upload trước đó, để tôi có thể cập nhật alt text hoặc title khi cần tối ưu lại SEO.

#### Acceptance Criteria

1. WHEN Admin chọn một ảnh trong thư viện và chỉnh sửa Alt_Text, Title, hoặc SEO_Filename trong panel chi tiết, THE Media_Picker_Dialog SHALL cho phép lưu thay đổi bằng nút cập nhật
2. WHEN Admin nhấn nút cập nhật, THE Media_Picker_Dialog SHALL gọi API PATCH /admin/media/:id với dữ liệu đã chỉnh sửa
3. WHEN cập nhật thành công, THE Media_Picker_Dialog SHALL phản ánh thay đổi ngay lập tức trong danh sách thư viện và panel chi tiết
