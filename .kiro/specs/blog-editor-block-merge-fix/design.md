# Sửa lỗi Gộp khối khi Round-trip Visual ↔ HTML - Thiết kế

## Tổng quan

Lỗi xảy ra trong pipeline chuyển đổi nội dung giữa editor trực quan và textarea HTML. Hàm `minifyHtmlForStorage()` được gọi trong quá trình tạo HTML draft cho textarea, nhưng hàm này xóa `CONTENT_BLOCK_SEPARATOR` — vốn là ký hiệu cần thiết để tách nội dung thành các khối khi chuyển ngược lại. Cách sửa là tách logic minify cho storage (lưu DB) ra khỏi logic format cho editor display, đảm bảo HTML draft giữ nguyên separators.

## Thuật ngữ

- **Bug_Condition (C)**: Điều kiện kích hoạt lỗi — khi nội dung có ≥2 blocks thực hiện round-trip Visual → HTML → Visual
- **Property (P)**: Hành vi mong đợi — round-trip phải lossless, số lượng và nội dung blocks được bảo toàn
- **Preservation**: Hành vi hiện tại phải giữ nguyên — single-block round-trip, chỉnh sửa HTML, lưu storage, preview, format
- **`toHtmlDraftFromContent`**: Hàm chuyển đổi nội dung editor (có block wrappers) thành HTML draft cho textarea
- **`toContentFromHtmlDraft`**: Hàm chuyển đổi HTML draft từ textarea thành nội dung editor (có block wrappers)
- **`minifyHtmlForStorage`**: Hàm minify HTML để lưu vào database — hiện đang bị gọi sai context
- **`CONTENT_BLOCK_SEPARATOR`**: Chuỗi `<!-- duky-block -->` dùng để phân tách các khối nội dung
- **`prettyHtmlForEditor`**: Hàm format HTML đẹp cho textarea — hiện gọi `minifyHtmlForStorage` gây mất separator

## Chi tiết Lỗi

### Điều kiện Lỗi (Bug Condition)

Lỗi xảy ra khi nội dung blog có từ 2 khối trở lên và người dùng chuyển tab Visual → HTML → Visual mà không chỉnh sửa. Pipeline chuyển đổi hiện tại:

1. `toHtmlDraftFromContent(editor.getHTML())` được gọi
2. Bên trong gọi `stripBlockWrappersForHtml()` → nối các block bằng `\n\n` (mất separator)
3. Rồi gọi `prettyHtmlForEditor()` → gọi `minifyHtmlForStorage()` → thay `CONTENT_BLOCK_SEPARATOR` bằng space
4. Kết quả: HTML draft không có separator nào

Khi chuyển ngược:
1. `toContentFromHtmlDraft(htmlDraft)` split bằng `CONTENT_BLOCK_SEPARATOR`
2. Không tìm thấy separator → chỉ có 1 phần tử → gộp tất cả thành 1 block

**Đặc tả Hình thức:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type EditorContent
  OUTPUT: boolean
  
  blocks := splitContentToBlocks(input.editorHtml)
  RETURN blocks.length >= 2
         AND input.action = "roundtrip_visual_html_visual"
         AND input.noUserEdits = true
END FUNCTION
```

### Ví dụ

- Nội dung có 3 blocks (heading + paragraph + image) → sau round-trip chỉ còn 1 block chứa tất cả HTML
- Nội dung có 2 blocks (text + code) → sau round-trip gộp thành 1 block duy nhất
- Nội dung có 5 blocks → sau round-trip mất hoàn toàn cấu trúc phân khối
- Nội dung có 1 block → round-trip hoạt động bình thường (không bị ảnh hưởng)

## Hành vi Mong đợi

### Yêu cầu Bảo toàn (Preservation Requirements)

**Hành vi Không thay đổi:**
- Round-trip với single block phải tiếp tục hoạt động bình thường
- Chỉnh sửa HTML trong textarea phải tiếp tục được áp dụng khi chuyển về Visual
- Lưu nội dung vào database phải tiếp tục minify đúng cách (loại bỏ separator cho storage)
- Preview phải tiếp tục render HTML đã strip block wrappers
- Nút Format phải tiếp tục format HTML đẹp

**Phạm vi:**
Tất cả input KHÔNG liên quan đến round-trip multi-block Visual → HTML → Visual sẽ không bị ảnh hưởng bởi fix này. Bao gồm:
- Single-block content round-trip
- Chỉnh sửa trực tiếp trong textarea HTML
- Lưu/publish blog post
- Preview rendering
- Format HTML button

## Nguyên nhân Gốc Giả thuyết

Dựa trên phân tích code, nguyên nhân gốc đã được xác định rõ:

1. **`prettyHtmlForEditor` gọi `minifyHtmlForStorage` sai context**: Hàm `prettyHtmlForEditor` được thiết kế để format HTML cho textarea display, nhưng lại gọi `minifyHtmlForStorage` — hàm dành cho việc lưu vào DB. Hàm minify này xóa separator vì khi lưu DB không cần separator (blocks được wrap trong blockquote tags).

2. **`toHtmlDraftFromContent` mất separator sớm**: Hàm gọi `stripBlockWrappersForHtml()` trước, hàm này join các blocks bằng `\n\n` thay vì giữ separator. Sau đó `prettyHtmlForEditor` xóa nốt bất kỳ separator nào còn sót.

3. **Thiếu phân tách giữa "minify for storage" và "format for editor display"**: Cùng một hàm `minifyHtmlForStorage` được dùng cho cả hai mục đích khác nhau — lưu DB (cần xóa separator) và hiển thị textarea (cần giữ separator).

## Correctness Properties

Property 1: Bug Condition - Round-trip Bảo toàn Cấu trúc Khối

_For any_ nội dung editor có từ 2 blocks trở lên, khi thực hiện round-trip qua `toHtmlDraftFromContent` rồi `toContentFromHtmlDraft`, hàm đã sửa PHẢI trả về nội dung có cùng số lượng blocks và cùng nội dung HTML trong mỗi block như ban đầu.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Hành vi Không thay đổi cho Non-roundtrip Operations

_For any_ input không thuộc điều kiện lỗi (single-block content, storage minification, preview rendering, HTML editing), hàm đã sửa PHẢI cho kết quả giống hệt hàm gốc, bảo toàn tất cả hành vi hiện tại cho các thao tác không liên quan đến multi-block round-trip.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Triển khai Sửa lỗi

### Thay đổi Cần thiết

Giả sử phân tích nguyên nhân gốc là đúng:

**File**: `app/(dashboard)/blog/[id]/page.tsx`

**Thay đổi cụ thể**:

1. **Tạo hàm `minifyHtmlForEditorDraft`**: Hàm mới tương tự `minifyHtmlForStorage` nhưng KHÔNG xóa `CONTENT_BLOCK_SEPARATOR`. Chỉ loại bỏ whitespace thừa, giữ nguyên separator.

2. **Sửa `prettyHtmlForEditor`**: Thay thế lời gọi `minifyHtmlForStorage` bằng `minifyHtmlForEditorDraft` mới.

3. **Sửa `toHtmlDraftFromContent`**: Thay vì gọi `stripBlockWrappersForHtml` (join bằng `\n\n`), cần unwrap từng block riêng rồi join lại bằng `CONTENT_BLOCK_SEPARATOR` để giữ nguyên ranh giới giữa các blocks.

4. **Giữ nguyên `minifyHtmlForStorage`**: Hàm này vẫn cần thiết cho việc lưu vào DB — không thay đổi.

5. **Giữ nguyên `toContentFromHtmlDraft`**: Hàm này đã split đúng bằng separator — chỉ cần đảm bảo input có separator.

## Chiến lược Kiểm thử

### Phương pháp Xác nhận

Chiến lược kiểm thử theo hai giai đoạn: đầu tiên, tạo counterexamples chứng minh lỗi trên code chưa sửa, sau đó xác nhận fix hoạt động đúng và bảo toàn hành vi hiện tại.

### Exploratory Bug Condition Checking

**Mục tiêu**: Tạo counterexamples chứng minh lỗi TỒN TẠI TRƯỚC khi implement fix. Xác nhận hoặc bác bỏ phân tích nguyên nhân gốc.

**Kế hoạch Test**: Viết test tạo nội dung multi-block, chạy qua `toHtmlDraftFromContent` rồi `toContentFromHtmlDraft`, assert số blocks được bảo toàn. Chạy trên code CHƯA SỬA để quan sát failures.

**Test Cases**:
1. **2-block round-trip**: Tạo content với 2 blocks, round-trip, kiểm tra vẫn có 2 blocks (sẽ fail trên code chưa sửa)
2. **5-block round-trip**: Tạo content với 5 blocks, round-trip, kiểm tra vẫn có 5 blocks (sẽ fail trên code chưa sửa)
3. **Block content integrity**: Kiểm tra nội dung HTML trong mỗi block không bị thay đổi sau round-trip (sẽ fail trên code chưa sửa)

**Expected Counterexamples**:
- `splitContentToBlocks(toContentFromHtmlDraft(toHtmlDraftFromContent(content))).length` = 1 thay vì N
- Nội dung các blocks bị nối liền thành một chuỗi HTML duy nhất

### Fix Checking

**Mục tiêu**: Xác nhận rằng với mọi input thỏa bug condition, hàm đã sửa cho kết quả đúng.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  htmlDraft := toHtmlDraftFromContent_fixed(input.editorHtml)
  result := toContentFromHtmlDraft_fixed(htmlDraft)
  originalBlocks := splitContentToBlocks(input.editorHtml)
  resultBlocks := splitContentToBlocks(result)
  ASSERT originalBlocks.length = resultBlocks.length
  FOR i := 0 TO originalBlocks.length - 1 DO
    ASSERT unwrapBlockHtml(originalBlocks[i]) = unwrapBlockHtml(resultBlocks[i])
  END FOR
END FOR
```

### Preservation Checking

**Mục tiêu**: Xác nhận rằng với mọi input KHÔNG thỏa bug condition, hàm đã sửa cho kết quả giống hàm gốc.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT minifyHtmlForStorage_original(input) = minifyHtmlForStorage_fixed(input)
  ASSERT toPublishableBlogHtml_original(input) = toPublishableBlogHtml_fixed(input)
END FOR
```

**Phương pháp**: Property-based testing được khuyến nghị cho preservation checking vì:
- Tự động sinh nhiều test cases trên toàn bộ input domain
- Bắt được edge cases mà unit tests thủ công có thể bỏ sót
- Đảm bảo mạnh mẽ rằng hành vi không thay đổi cho tất cả non-buggy inputs

**Kế hoạch Test**: Quan sát hành vi trên code CHƯA SỬA trước cho single-block content, storage operations, rồi viết property-based tests capture hành vi đó.

**Test Cases**:
1. **Single-block round-trip preservation**: Xác nhận single-block content round-trip vẫn hoạt động đúng
2. **Storage minification preservation**: Xác nhận `minifyHtmlForStorage` vẫn xóa separator cho DB storage
3. **Preview rendering preservation**: Xác nhận `toPublishableBlogHtml` vẫn strip block wrappers đúng
4. **Format button preservation**: Xác nhận nút Format vẫn format HTML đẹp với separators

### Unit Tests

- Test `toHtmlDraftFromContent` giữ separator giữa các blocks
- Test `toContentFromHtmlDraft` split đúng khi có separator
- Test `minifyHtmlForStorage` vẫn xóa separator (cho DB storage)
- Test round-trip với 1, 2, 3, 5, 10 blocks

### Property-Based Tests

- Sinh random multi-block content, xác nhận round-trip bảo toàn số blocks và nội dung
- Sinh random single-block content, xác nhận hành vi không thay đổi
- Sinh random HTML, xác nhận `minifyHtmlForStorage` vẫn hoạt động đúng cho storage

### Integration Tests

- Test full flow: tạo blog với nhiều blocks → chuyển tab HTML → chuyển lại Visual → kiểm tra blocks
- Test chỉnh sửa HTML trong textarea → chuyển về Visual → kiểm tra thay đổi được áp dụng
- Test lưu blog sau round-trip → kiểm tra data trong DB đúng
