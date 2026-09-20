# Thiết kế đồng bộ database và entity BE theo FE hiện tại

## Mục tiêu

Lấy dữ liệu và các luồng đang dùng trong `Quan-Nho-Frontend` làm nguồn chuẩn
để chỉnh **chỉ** `Quan-Nho-Backend/database/database.sql` và tạo 11 JPA entity
trong backend theo Package by Feature. Không sửa FE, không viết API/service/
repository, không chạy SQL lên PostgreSQL của người dùng trong bước này.

Spec này thay thế giả định lấy SQL làm nguồn chuẩn trong
`2026-09-20-backend-jpa-entities-design.md`. File
`database/quan_nho_database.sql` và `database/menu_seed.sql` được giữ nguyên;
`database.sql` là script mục tiêu cho lần đồng bộ này.

## 11 bảng và 4 field bổ sung

Giữ đủ 11 bảng: `users`, `categories`, `products`, `option_groups`,
`option_values`, `product_option_groups`, `orders`, `order_items`,
`order_item_options`, `shop_settings`, `sepay_settings`.

- Thêm `users.email` (nullable, unique) vì FE cho đăng nhập bằng email.
- Thêm `orders.token` (nullable, unique) vì FE tạo token để tra cứu đơn; đơn
  mẫu có token. Nullable để script không làm hỏng database cũ có đơn chưa có
  token; đơn mới do BE tạo sau này phải cấp token ở service.
- Thêm `shop_settings.store_subtitle` và `shop_settings.phone` (nullable) vì
  đây là hai ô đang có trên trang Cài đặt và phục vụ in bill.
- Không thêm các field cũ không còn có ô chỉnh trong trang Cài đặt: ngân hàng,
  khổ giấy, nội dung màn hình khách. Không thêm bảng `payments` hoặc
  `payment_settings`.
- `categories` và `products` không có `description`.

## Dữ liệu mẫu

- Đồng bộ 5 danh mục, 11 sản phẩm, 7 nhóm tùy chọn, 22 giá trị tùy chọn,
  33 liên kết sản phẩm–nhóm tùy chọn từ `INITIAL_*` trong
  `Quan-Nho-Frontend/src/api/mockDb.js`. Mã `code` và quan hệ là khóa đối chiếu,
  không dựa vào ID giả định nếu database đã có dữ liệu.
- Tên món, giá, ảnh, `is_available`, thứ tự và tùy chọn mặc định theo FE; ví dụ
  trà sữa Ô long đang bán, `SIZE_S` là mặc định, không thêm các topping/chọn
  thêm chỉ có trong SQL cũ.
- Hai đơn mẫu `QN-000001` và `QN-000002` theo FE, gồm snapshot món và tùy chọn.
  `QN-000001` là 64.000đ; `QN-000002` là 76.000đ. `order_items` và
  `order_item_options` vẫn là bảng riêng dù FE mock lưu nested JSON.
- `shop_settings` mặc định theo các ô đang dùng trong FE; `sepay_settings`
  có API key NULL, không đưa key thật vào seed. Mật khẩu Wi-Fi mẫu cần được
  xử lý như dữ liệu demo, không khẳng định đã mã hóa chỉ vì tên cột có hậu tố
  `_encrypted`.
- Script có thể chạy lại mà không nhân đôi dữ liệu mẫu (`ON CONFLICT` hoặc
  `NOT EXISTS`). Không dùng `DROP TABLE`, `TRUNCATE`, hoặc xóa dữ liệu người
  dùng. Với 4 field mới, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` hỗ trợ
  database đã được tạo từ schema cũ.
- Không ghi đè đơn hàng thực của người dùng khi chạy lại script. Món/danh mục
  có cùng `code` được seed theo FE chỉ khi là dữ liệu mẫu; để tránh ghi đè món
  do người dùng sửa, nếu mã đã tồn tại thì không thay đổi dòng đó.

## Entity theo Package by Feature

| Bảng | Class | Package |
| --- | --- | --- |
| `users` | `User` | `com.quannho.pos.auth` |
| `categories` | `Category` | `com.quannho.pos.catalog.category` |
| `products` | `Product` | `com.quannho.pos.catalog.product` |
| `option_groups` | `OptionGroup` | `com.quannho.pos.catalog.option` |
| `option_values` | `OptionValue` | `com.quannho.pos.catalog.option` |
| `product_option_groups` | `ProductOptionGroup` | `com.quannho.pos.catalog.option` |
| `orders` | `Order` | `com.quannho.pos.order` |
| `order_items` | `OrderItem` | `com.quannho.pos.order` |
| `order_item_options` | `OrderItemOption` | `com.quannho.pos.order` |
| `shop_settings` | `ShopSettings` | `com.quannho.pos.settings.shop` |
| `sepay_settings` | `SepaySettings` | `com.quannho.pos.settings.sepay` |

Các entity ánh xạ đúng `database.sql`: `BIGINT`/VND thành `Long`, timestamp
thành `OffsetDateTime`, trạng thái hữu hạn thành enum lưu chuỗi. FK là lazy
`@ManyToOne`, không tạo `@OneToMany` collection hay `@ManyToMany`; bảng nối
`product_option_groups` là entity riêng. Snapshot trong đơn được giữ ngay cả
khi sản phẩm/tùy chọn gốc bị xóa. JPA không tự cascade xóa. Không dùng
`@Data`/`@ToString` để tránh lộ secret hoặc tải quan hệ lazy. Có constructor
không tham số và getter/setter. Entity không trực tiếp trả ra API.

## Kiểm thử

- Test không cần database để so số lượng/mã dữ liệu mẫu FE với script SQL, kiểm
  tra 4 cột mới, 11 bảng, các trạng thái và FK cốt lõi.
- Test reflection/JPA annotation kiểm tra đủ 11 entity, tên bảng/cột, enum,
  nullable FK và kiểu dữ liệu tiền.
- Chạy Maven compile, targeted tests và frontend test liên quan. Test
  `contextLoads` có thể vẫn lỗi do chưa cấu hình datasource; không sửa cấu hình
  kết nối trong phạm vi này.
- Không commit hoặc thay đổi các file FE đang có sửa đổi cục bộ.
