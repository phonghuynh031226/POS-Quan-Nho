# Thiết kế Package by Feature cho Quán Nhỏ Backend

## Mục tiêu

Tổ chức mã nguồn Spring Boot theo nghiệp vụ. Mỗi feature sở hữu controller,
service, entity, repository và DTO của chính nó; dự án không có các package
toàn cục như `controller`, `service`, `entity` hoặc `repository`.

## Cấu trúc package

Package gốc là `com.quannho.pos`.

```text
com.quannho.pos
├── auth
│   └── dto
├── catalog
│   ├── category
│   │   └── dto
│   ├── product
│   │   └── dto
│   └── option
│       └── dto
├── order
│   └── dto
├── settings
│   ├── shop
│   │   └── dto
│   └── sepay
│       └── dto
├── report
├── display
└── shared
    ├── config
    ├── exception
    └── security
```

## Quyền sở hữu bảng

- `auth`: `users`.
- `catalog.category`: `categories`.
- `catalog.product`: `products`.
- `catalog.option`: `option_groups`, `option_values`,
  `product_option_groups`.
- `order`: `orders`, `order_items`, `order_item_options`.
- `settings.shop`: `shop_settings`.
- `settings.sepay`: `sepay_settings`.
- `report`: truy vấn báo cáo từ đơn hàng, không sở hữu bảng riêng.
- `display`: dữ liệu số tiền và QR cho màn hình khách, không sở hữu bảng riêng.
- `shared`: chỉ chứa hạ tầng dùng chung, không chứa nghiệp vụ.

## Quy ước bên trong feature

Các class nằm thẳng trong feature nếu số lượng còn ít, ví dụ
`catalog.product.Product`, `ProductRepository`, `ProductService` và
`ProductController`. DTO request/response nằm trong package `dto` của feature.
Không tạo thêm tầng package chỉ để chứa một class.

Feature chỉ gọi feature khác thông qua service công khai. Controller không gọi
repository trực tiếp. Entity không được trả thẳng ra API; API dùng DTO để tránh
vòng lặp quan hệ JPA và tránh lộ trường nội bộ.

## Phạm vi lần scaffold đầu tiên

Tạo toàn bộ package trên bằng `package-info.java` có mô tả trách nhiệm. Chưa tạo
class Java rỗng. Entity, repository, service, controller và DTO sẽ được thêm theo
từng feature cùng với bài kiểm thử khi triển khai hành vi thật.

## Kiểm tra

- Maven test hiện tại vẫn chạy thành công.
- Kiểm tra không xuất hiện package toàn cục `controller`, `service`, `entity`,
  `repository` dưới package gốc.
- Tất cả package dự kiến tồn tại trong mã nguồn và được Git lưu nhờ
  `package-info.java`.
