# POS Quán Nhỏ

Hệ thống Quản lý Bán hàng (Point of Sale) dành cho Quán Nhỏ (Cà phê & Đồ ăn vặt), phát triển bằng React + Vite (Frontend) và Spring Boot + PostgreSQL (Backend).

---

## 🏗️ Cấu trúc dự án

```text
POS Quan Nho/
├── Quan-Nho-Frontend/     # Giao diện POS React 19 + TailwindCSS + Vite
│   ├── src/
│   │   ├── api/           # Axios HTTP API clients
│   │   ├── components/    # Components dùng chung, POS, thực đơn, in bill
│   │   ├── pages/         # POS, Đơn hàng, Thực đơn, Tùy chọn, Báo cáo, Cài đặt
│   │   ├── routes/        # Cấu hình React Router
│   │   └── utils/         # Tiện ích tính tiền, xuất Excel, in ấn, sync màn hình phụ
│   └── tests/             # Bộ kiểm thử frontend (node --test)
│
├── Quan-Nho-Backend/      # REST API Spring Boot 4 + Spring Data JPA
│   ├── database/          # File schema CSDL (database.sql) & test fixtures
│   └── src/               # Controllers, Entities, Services (auth, catalog, order, settings)
│
├── TEST_CASES_GIAO_DIEN_CUON.md  # Bộ 55 test cases giao diện, nghiệp vụ & API
└── BACKEND_TEST_ERRORS.md         # Báo cáo kết quả xử lý 16 lỗi kiểm thử backend
```

---

## 🚀 Hướng dẫn khởi chạy

### 1. Frontend
```bash
cd Quan-Nho-Frontend
npm install
npm run dev      # Khởi chạy máy chủ phát triển (http://localhost:5173)
npm test         # Chạy toàn bộ 61 automated tests
npm run build    # Biên dịch production bundle
```

### 2. Backend
```bash
cd Quan-Nho-Backend
mvnw.cmd test    # Chạy toàn bộ 59 automated unit/integration tests
mvnw.cmd spring-boot:run  # Khởi chạy máy chủ backend (http://localhost:8080)
```

---

## ☕ Tài khoản kiểm thử
- **Tài khoản:** `admin`
- **Mật khẩu:** `123456`
- **Vai trò:** `OWNER` (Chủ quán)
