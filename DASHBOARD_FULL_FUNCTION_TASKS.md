# Lộ trình hoàn thiện Duky Store Dashboard

Cập nhật gần nhất: 2026-05-13

## Chú thích trạng thái

- [ ] Chưa làm
- [~] Đang làm / đã làm một phần
- [x] Đã xong
- [!] Bị chặn / cần quyết định thêm

## Tình trạng tổng quan

Dashboard đã có phần lớn các bề mặt vận hành chính: đơn hàng, sản phẩm, khách hàng, nội dung, SEO, marketing và báo cáo. Một số module mới được thiết kế sẵn theo API dự kiến và có fallback mock/local để admin vẫn xem được UI khi backend chưa có endpoint tương ứng.

Ghi chú kiểm thử: theo yêu cầu, không dùng Playwright/smoke test trình duyệt nếu chưa được yêu cầu rõ. Các phase gần đây được xác nhận bằng `typecheck` và `build`.

## Phase 1 - Nền tảng vận hành

Mục tiêu: làm dashboard đủ ổn định để vận hành với dữ liệu backend thật, giảm phụ thuộc mock và chuẩn hoá phản hồi UI.

- [~] Tách hoặc loại bỏ mock fallback ở các trang đã có API backend.
  - Đã rà soát các trang dùng `lib/mock-data`, đặc biệt dashboard overview và media.
  - Các widget tổng quan chính đã chuyển sang lấy dữ liệu thật từ order/customer/product/inventory service.
  - Một vài fallback vẫn giữ lại ở các module chưa có API backend đầy đủ để UI không vỡ.
- [x] Sửa lệch contract frontend/backend làm hỏng workflow thật.
  - Phát hiện frontend gọi `/admin/media/upload` và `/admin/media/upload-multiple` nhưng backend lúc đó chỉ có media external.
  - Bổ sung backend endpoint upload local: `POST /admin/media/upload` và `POST /admin/media/upload-multiple`.
  - Bổ sung endpoint public serve file: `GET /media/files/:fileName`.
  - Cập nhật media service frontend để parse đúng response upload.
- [x] Kết nối Dashboard overview với dữ liệu thật.
  - KPI cards lấy dữ liệu từ orders, customers, products.
  - Recent orders lấy từ order API.
  - Top products được tính từ order items.
  - Low stock lấy từ inventory analytics.
- [~] Chuẩn hoá loading, error, empty, success feedback cho màn hình cốt lõi.
  - Tạo component dùng chung `InlineFeedback`.
  - Áp dụng vào media page và một số flow action quan trọng.
  - Các phase sau tiếp tục dùng alert/local feedback ở vài module mới khi backend chưa sẵn sàng.
- [x] Hiển thị admin thật ở sidebar/account menu.
  - Sidebar đọc tên/email admin từ cookie login thay vì text hard-coded.
  - Account menu có thông tin profile hiện tại.
- [x] Thêm UI profile và đổi mật khẩu.
  - Thêm profile dialog trong sidebar menu.
  - Thêm change-password dialog nối `PATCH /admin/auth/change-password`.
- [~] Thêm confirm và feedback cho hành động rủi ro.
  - Tạo component dùng chung `ConfirmDialog`.
  - Media delete/copy/upload và bulk product actions đã dùng confirm/feedback.
  - Một số trang mới vẫn dùng confirm native để đi nhanh, có thể gom về `ConfirmDialog` ở Phase 8.
- [x] Xác nhận Phase 1 bằng typecheck/build.
  - Backend build pass.
  - Frontend typecheck pass.
  - Frontend build pass.
- [!] Bỏ qua browser smoke test theo yêu cầu.
  - Không dùng Playwright cho các lần kiểm tra sau nếu user không yêu cầu rõ.

## Phase 2 - Hoàn thiện Product Catalog

- [x] Bộ lọc nâng cao danh sách sản phẩm.
  - Làm tại `/products`.
  - Hỗ trợ search, status, type, category, display flag, stock filter và price sort.
  - Category filter lấy option thật từ category API.
  - API lỗi thì hiển thị error state thay vì âm thầm dùng mock.
- [x] Bulk actions cho sản phẩm.
  - Chọn nhiều sản phẩm để publish, hide, delete.
  - Có confirm dialog và feedback sau thao tác.
  - Bulk action cập nhật qua product API khi có dữ liệu thật.
- [x] Product media picker và gallery reorder.
  - Làm tại `/products/[id]`.
  - Có chọn ảnh đại diện từ thư viện media, upload ảnh mới, chọn ảnh gallery.
  - Gallery hỗ trợ reorder, replace, upload, remove.
  - Khi load product, `galleryMediaIds` được reset theo ảnh hiện có để save đúng thứ tự.
- [x] Related products picker.
  - Thêm picker cho related/grouped, upsell và cross-sell products.
  - Dùng product list/search nội bộ để chọn sản phẩm liên quan.
- [x] Flag nổi bật/bán chạy/hàng mới trong UI sản phẩm.
  - Xác nhận và hiển thị các flag featured, bestseller, new-arrival trong product detail/list.
- [x] Variant generator theo size/color.
  - Làm trong product detail.
  - Admin nhập size/color, hệ thống sinh nhanh biến thể qua product variant API.
- [x] Bulk update giá và tồn kho.
  - Làm tại product list cho sản phẩm đã chọn.
  - Có dialog cập nhật giá/tồn kho hàng loạt.
- [x] Product SEO preview và schema fields.
  - Product detail có SEO fields, preview URL, điểm SEO, checklist và analysis payload.
- [x] CSV/WooCommerce import/export UI.
  - Export CSV cho sản phẩm đang chọn hoặc danh sách đang hiển thị.
  - Export format tương thích WooCommerce.
  - Import CSV cơ bản để tạo sản phẩm nhanh.
- [x] Kiểm tra Phase 2.
  - Frontend typecheck pass.
  - Frontend build pass.

## Phase 3 - Hoàn thiện Orders, Payment, Shipping

- [x] Bộ lọc đơn hàng nâng cao.
  - Làm tại `/orders`.
  - Hỗ trợ lọc date range, order status, payment status, shipping status, source và tab status có sẵn.
- [x] Chỉnh sửa nhanh thông tin đơn.
  - Thêm quick edit panel trong order detail.
  - Chỉnh customer, địa chỉ, shipping fee và discount.
  - Các field mở rộng đã được thêm vào order schema nếu backend trả về.
- [x] In đơn hàng và phiếu giao hàng.
  - Có action print invoice và shipping slip trong order detail dialog.
  - Dùng dữ liệu đơn hiện tại để render bản in.
- [x] Export đơn hàng CSV.
  - Export danh sách đơn theo filter hiện tại.
  - Bao gồm thông tin mã đơn, khách hàng, trạng thái, thanh toán, vận chuyển, tổng tiền.
- [x] Tracking number và shipping carrier.
  - Thêm control carrier, tracking number và shipping status.
  - Order schema có thêm `shippingCarrier`, `trackingNumber`.
- [x] Timeline trạng thái đơn hàng.
  - Hiển thị milestone created, confirmed, payment, shipping, completed, cancelled/refunded.
  - Dùng các mốc thời gian như `paidAt`, `completedAt`, `cancelledAt` khi có.
- [x] Payment panel.
  - Cập nhật paid/unpaid/refunded và transaction reference.
  - Nối API update payment khi backend có.
- [x] Hủy đơn có xử lý rõ.
  - Flow cancel tiếp tục gọi backend cancel endpoint với dữ liệu API thật.
  - Nếu đang ở mock mode thì cập nhật local để UI phản hồi ngay.
- [x] Cài đặt vận chuyển cơ bản.
  - Manual order creation vẫn có default shipping fee.
  - Zone/freeship threshold chưa làm sâu vì chưa có backend shipping settings API, để Phase 8 hoặc settings backend bổ sung.
- [x] Kiểm tra Phase 3.
  - Frontend typecheck pass.
  - Frontend build pass.

## Phase 4 - Customer CRM

- [x] Customer detail với lifetime value, order count, last order.
  - Làm tại `/customers`.
  - Customer detail sheet load customer detail và recent orders nếu API có.
  - Tính CRM metrics: số đơn, lifetime value, average order value, ngày đặt gần nhất.
- [x] Address book khách hàng.
  - Mở rộng customer schema với address optional.
  - Detail sheet hiển thị địa chỉ mặc định của khách.
- [x] Ghi chú nội bộ.
  - Thêm field internal notes trong customer detail.
  - Notes được đưa vào update payload khi lưu.
- [x] Tags/groups khách hàng.
  - Mở rộng customer schema với `tags`.
  - UI nhập tags dạng comma-separated.
  - Table hiển thị tag để phân nhóm new, returning, VIP, payment issue...
- [x] Export customers.
  - Export CSV danh sách khách theo filter/search hiện tại.
  - Bao gồm thông tin liên hệ, địa chỉ, tags và chỉ số CRM.
- [x] Search nâng cao.
  - Search theo phone, email, name, address và tags.
- [x] Kiểm tra Phase 4.
  - Frontend typecheck pass.
  - Frontend build pass.

## Phase 5 - Nội dung, Trang chủ, SEO

- [x] Homepage builder cho hero, banner, collection sản phẩm, blog/testimonial, CTA.
  - Làm tại `/home-content`.
  - Admin có thể tạo, sửa, xoá, ẩn/publish và nhân bản section.
  - Section có type, title, subtitle, content, media, CTA, sort order và metadata JSON.
  - Có thêm item trong section cho collection, feedback, banner phụ hoặc CTA con.
  - Nối `homepageService` endpoints `/admin/homepage/sections` và `/admin/homepage/sections/:id/items`.
- [x] Shared media picker cho product/blog/homepage/settings.
  - Tạo component dùng chung `components/media/media-picker-dialog.tsx`.
  - Component gọi `mediaService.getMediaList`, hỗ trợ search, reload và chọn ảnh.
  - Đã dùng ở homepage, blog editor, settings; product detail đã có media picker/library flow từ Phase 2.
- [x] Blog editor có preview và media.
  - Làm tại `/blog/[id]`.
  - Thêm chọn ảnh đại diện qua shared media picker và lưu `thumbnailMediaId`.
  - Thêm preview bài viết gồm ảnh, title, excerpt, content và SEO snippet.
  - Thêm canonical URL vào SEO meta form.
- [x] Static pages: contact, warranty, return, shipping, privacy, FAQ.
  - Làm trong `/home-content` tab Static pages.
  - Có form draft cho title, slug, content, SEO title, SEO description.
  - Backend chưa có static page API riêng nên hiện lưu local draft bằng `localStorage` để sau này nối API.
- [x] SEO metadata manager theo entity/route.
  - Blog editor quản lý SEO theo bài viết.
  - Settings quản lý default meta title, description và OG image mặc định.
  - Product detail đã có SEO fields/preview từ Phase 2.
- [x] Redirect import/export và kiểm tra loop/chain.
  - Làm tại `/seo`.
  - Có import/export CSV redirect.
  - Có xoá redirect.
  - Health check phát hiện duplicate source, self redirect, loop 2 chiều và chain redirect.
  - Nối `seoService` endpoints `/admin/redirects`.
- [x] Sitemap regenerate UI và robots editor.
  - Làm tại `/sitemap` và một phần trong `/seo`.
  - Có refresh/gọi sitemap endpoint, xem nội dung sitemap.xml và robots.txt.
  - Có copy/download sitemap và robots.
  - Robots editor hiện lưu draft local và download/copy vì backend chưa có endpoint publish robots trực tiếp.
- [x] Kiểm tra Phase 5.
  - Frontend typecheck pass.
  - Production build pass.

## Phase 6 - Marketing & Growth

- [x] Coupon module: fixed/percent, usage limit, date range, min order.
  - Làm tại `/marketing` tab Coupons.
  - Admin tạo coupon với code/name, giảm fixed hoặc percent, min order, usage limit, ngày bắt đầu/kết thúc, trạng thái active/paused.
  - Nối `marketingService` endpoint `/admin/coupons`; fallback local mock state nếu backend chưa sẵn sàng.
- [x] Campaign sale module.
  - Làm tại `/marketing` tab Campaigns.
  - Admin tạo campaign với name/slug, giảm fixed hoặc percent, date range, status, productIds và categoryIds scope.
  - Nối `/admin/campaigns`; fallback local mock state nếu backend chưa sẵn sàng.
- [x] Reviews moderation và replies.
  - Làm tại `/marketing` tab Reviews.
  - Admin duyệt/từ chối review pending và lưu phản hồi công khai cho từng review.
  - Nối `/admin/reviews`; fallback local mock state nếu backend chưa sẵn sàng.
- [x] Wishlist analytics.
  - Làm tại `/marketing` tab Wishlist.
  - Hiển thị wishlist count, conversion count, conversion rate và thời điểm khách thêm wishlist gần nhất.
  - Nối `/admin/wishlist/analytics`; fallback mock analytics nếu backend chưa sẵn sàng.
- [x] Notification template manager.
  - Làm tại `/notifications` tab Templates.
  - Admin tạo template email/SMS/in-app với key, name, subject, body và active status.
  - Nối `/admin/notification-templates`; fallback local mock state nếu backend chưa sẵn sàng.
- [x] Email test và logs chi tiết.
  - Làm tại `/notifications` tabs Email test và Logs.
  - Admin chọn template, nhập email nhận test và payload JSON rồi gửi test email.
  - Logs hiển thị recipient, subject, template key, queued/sent/failed status và lỗi chi tiết.
  - Nối `/admin/email/test` và `/admin/email-logs`; fallback local failed/sent log entries nếu backend chưa sẵn sàng.

## Phase 7 - Báo cáo & Analytics

- [x] Báo cáo doanh thu theo ngày/tháng/kênh.
  - Làm tại `/reports` tab Revenue.
  - Admin lọc from/to date và group report theo ngày, tháng hoặc kênh bán.
  - Hiển thị revenue bars, order count và tổng doanh thu.
  - Nối `/admin/reports/dashboard`; fallback mock report data nếu backend chưa sẵn sàng.
- [x] Báo cáo conversion/cancel/completion của đơn hàng.
  - Làm tại `/reports` tab Orders.
  - Hiển thị total orders, completed orders, cancelled orders, pending backlog, completion rate và cancel rate.
  - Dùng chung dashboard report payload để backend có thể aggregate trong một request.
- [x] Báo cáo best seller và slow-moving product.
  - Làm tại `/reports` tab Products.
  - Best sellers hiển thị product, SKU, sold quantity, revenue và stock on hand.
  - Slow-moving hiển thị sản phẩm bán chậm, doanh thu thấp, tồn còn lại và số ngày chưa bán.
- [x] Báo cáo khách hàng.
  - Làm tại `/reports` tab Customers.
  - Hiển thị customer name, order count, total spent, last order date và segment.
  - Dùng để review VIP/regular/new customer và lên kế hoạch retention.
- [x] Báo cáo định giá tồn kho.
  - Làm tại `/reports` tab Inventory.
  - Hiển thị stock on hand, unit cost, inventory value và retail value theo product/SKU.
  - Summary card hiển thị tổng giá trị vốn tồn kho.
- [x] Export reports.
  - Có nút Export CSV tại `/reports`.
  - Xuất revenue, best sellers, slow-moving products, customers và inventory vào một file CSV theo date range đang chọn.

## Phase 8 - Migration, Hardening, Deploy

- [ ] Dashboard migrate WooCommerce.
  - Dự kiến: import products, categories, customers, orders từ WooCommerce.
  - Cần UI upload file/API credential, preview dữ liệu và chạy migration theo batch.
- [ ] Báo cáo chất lượng dữ liệu migration.
  - Dự kiến: phát hiện thiếu SKU, trùng slug, thiếu ảnh, lệch tồn kho, thiếu customer phone/email.
- [ ] Audit log UI.
  - Dự kiến: xem admin nào thao tác gì, lúc nào, trên entity nào, trước/sau thay đổi ra sao.
- [ ] E2E smoke tests cho flow quan trọng.
  - Chưa làm vì user đã dặn không mở Playwright nếu không yêu cầu.
  - Khi được phép, nên test login, tạo sản phẩm, tạo đơn, upload media, sửa SEO, export report.
- [ ] Docker/deploy production.
  - Dự kiến: Dockerfile, compose, env template, health check, build command chuẩn.
- [ ] Database backup và health checks.
  - Dự kiến: backup schedule, restore guide, API health check, DB connection check, storage check.
- [ ] Hardening kỹ thuật còn lại.
  - Đổi `middleware.ts` sang convention `proxy` theo warning Next.js 16.
  - Gom các confirm native còn lại về `ConfirmDialog`.
  - Nối backend thật cho các API Phase 6/7 đang fallback nếu backend chưa có.
