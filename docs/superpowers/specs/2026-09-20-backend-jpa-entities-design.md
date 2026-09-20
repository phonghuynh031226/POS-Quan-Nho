# Thiết kế JPA entity cho Quán Nhỏ Backend

## Mục tiêu và phạm vi

Tạo đúng 11 JPA entity tương ứng 11 bảng trong
`Quan-Nho-Backend/database/quan_nho_database.sql`. Entity nằm trực tiếp trong
package nghiệp vụ đã được tạo theo Package by Feature. Lần này không tạo API,
controller, service, repository hoặc thay đổi SQL.

## Vị trí và quyền sở hữu

| Bảng | Entity | Package |
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

## Ánh xạ cột

- `BIGSERIAL` và `BIGINT` → `Long`; ID dùng `@Id` và
  `@GeneratedValue(strategy = GenerationType.IDENTITY)`.
- `INTEGER` → `Integer`; `BOOLEAN` → `Boolean`; `VARCHAR` và `TEXT` →
  `String`; `TIMESTAMPTZ` → `OffsetDateTime`.
- Tiền VND dùng `Long` để bảo toàn số nguyên, không dùng `double`.
- Mỗi cột có tên rõ ràng bằng `@Column(name = ...)`; độ dài, `nullable`,
  `unique` và `columnDefinition = "text"` phản ánh schema khi áp dụng.
- Giá trị mặc định Java của các trường NOT NULL có DEFAULT trong SQL phản ánh
  mặc định SQL, nhưng PostgreSQL vẫn là nguồn xác thực cuối cùng cho constraint.
- Các chuỗi trạng thái hữu hạn dùng enum lưu bằng `@Enumerated(EnumType.STRING)`:
  `UserRole`, `OptionSelectionType`, `OrderStatus`, `PaymentStatus`,
  `PaymentMethod`. Giá trị enum khớp chính xác CHECK constraint của SQL.
- Không thêm trường `description` vào `Category` hoặc `Product`; không tạo
  entity `Payment`/`PaymentSettings`.

## Quan hệ

- `Product.category` → `Category` (bắt buộc).
- `OptionValue.optionGroup` → `OptionGroup` (bắt buộc).
- `ProductOptionGroup.product` → `Product` (bắt buộc), và `.optionGroup` →
  `OptionGroup` (bắt buộc). Đây là entity nối có thuộc tính riêng, không dùng
  `@ManyToMany`.
- `Order.createdBy` → `User` (bắt buộc).
- `OrderItem.order` → `Order` (bắt buộc), `.product` → `Product` (có thể NULL).
- `OrderItemOption.orderItem` → `OrderItem` (bắt buộc), `.optionGroup` →
  `OptionGroup` và `.optionValue` → `OptionValue` (có thể NULL).
- Tất cả FK dùng `@ManyToOne(fetch = FetchType.LAZY)` và `@JoinColumn` đúng tên
  cột. Không thêm `@OneToMany` collection phía cha ở giai đoạn này; quan hệ 1:N
  vẫn được thể hiện bằng FK, còn truy vấn tập con sẽ do repository sau này xử lý.
- Không dùng cascade JPA ở giai đoạn entity; SQL đã quy định hành vi xóa cho
  từng FK. Các trường snapshot trong `order_items` và `order_item_options` được
  giữ độc lập để không thay đổi lịch sử khi menu thay đổi.

## Quy ước an toàn và vòng đời

- Entity có constructor không tham số cho JPA. Không dùng `@Data`,
  `@ToString`, `@EqualsAndHashCode` của Lombok trên entity để tránh tải quan hệ
  LAZY hoặc lộ `password_hash`, `api_key_encrypted`.
- Dùng Lombok `@Getter`/`@Setter` tại class; không có
  serialization trực tiếp ra API. DTO của từng feature sẽ được xây dựng khi có
  endpoint.
- `created_at`, `updated_at` và các thời điểm nghiệp vụ được ánh xạ đúng cột.
  Dùng callback `@PrePersist` đặt `createdAt` và `updatedAt` (nếu có) khi NULL;
  `@PreUpdate` đặt lại `updatedAt`. Thời điểm dùng `OffsetDateTime.now(ZoneOffset.UTC)`.
  Không sửa SQL. Không tự mã hóa giá trị bí mật trong entity: service tương lai
  chịu trách nhiệm mã hóa trước khi lưu.

## Kiểm thử và xác nhận

- Test phản chiếu JPA kiểm tra đủ 11 `@Entity`, tên bảng, tên cột và FK quan
  trọng; test enum kiểm tra giá trị lưu trùng CHECK constraint.
- Chạy Maven compile và các test không cần database.
- Test Spring `contextLoads` hiện thiếu datasource; lỗi này được báo riêng, không
  sửa cấu hình database trong phạm vi entity.
- Không thay đổi frontend đang có sửa đổi cục bộ.
