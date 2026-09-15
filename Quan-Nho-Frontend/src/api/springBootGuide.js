/**
 * TÀI LIỆU ĐẶC TẢ TÍCH HỢP JAVA SPRING BOOT BACKEND CHO DỰ ÁN POS QUÁN NHỎ
 *
 * Frontend được thiết kế chuẩn RESTful API, sẵn sàng kết nối với Spring Boot:
 * - Cấu hình CORS: allowCredentials = true, origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
 * - Cơ chế bảo mật: Spring Security Session Cookie (JSESSIONID, SameSite=Lax, HttpOnly)
 *
 * CÁC ENDPOINT REST CHÍNH CẦN TRIỂN KHAI TRÊN SPRING BOOT:
 *
 * 1. AUTHENTICATION (Spring Security Form/JSON Login):
 *    - POST /api/auth/login
 *      Body: { "username": "admin", "password": "..." }
 *      Response: 200 OK + Set-Cookie: JSESSIONID=...
 *      Payload: { "id": 1, "username": "admin", "name": "Chị Mai", "role": "ADMIN" }
 *    - POST /api/auth/logout
 *      Response: 200 OK (Xóa session)
 *    - GET /api/auth/me
 *      Response: 200 OK (Thông tin user đang đăng nhập từ Session)
 *
 * 2. MENU SERVICE:
 *    - GET /api/menu
 *      Response: Danh sách món ăn kèm mảng tùy chọn optionsConfig
 *    - POST /api/menu (ADMIN)
 *      Body: { "name": "...", "category": "COFFEE", "price": 35000, "isAvailable": true, ... }
 *    - PUT /api/menu/{id} (ADMIN)
 *    - PATCH /api/menu/{id}/toggle-availability (CASHIER, ADMIN)
 *
 * 3. ORDER & POS SERVICE:
 *    - POST /api/orders
 *      Body: {
 *        "paymentMethod": "TIEN_MAT" | "CHUYEN_KHOAN",
 *        "cashGiven": 100000,
 *        "changeReturned": 36000,
 *        "totalAmount": 64000,
 *        "items": [
 *          {
 *            "menuItemId": "m1",
 *            "name": "Cà phê sữa đá truyền thống",
 *            "unitPrice": 29000,
 *            "quantity": 1,
 *            "surcharge": 0,
 *            "lineTotal": 29000,
 *            "options": { "temperature": "Đá", "size": "M", "sugar": "70%", "ice": "100%", "toppings": [] },
 *            "notes": "Mang đi"
 *          }
 *        ]
 *      }
 *      Response: 201 Created -> Order Object kèm orderNumber ("QN-105") và token ngẫu nhiên ("x9k2p8z...")
 *
 *    - GET /api/orders
 *      Params: ?date=YYYY-MM-DD&fulfillmentStatus=...&paymentStatus=...&search=...
 *
 *    - GET /api/orders/{id}
 *
 *    - PATCH /api/orders/{id}/fulfillment-status
 *      Body: { "fulfillmentStatus": "DANG_LAM" | "SAN_SANG" | "DA_GIAO" }
 *
 *    - PATCH /api/orders/{id}/items/{lineId}/toggle-done
 *
 *    - POST /api/orders/{id}/cancel (ADMIN)
 *      Body: { "reason": "Khách đổi ý", "refundAmount": 64000 }
 *
 * 4. PUBLIC TRACKING (NO AUTH REQUIRED):
 *    - GET /api/public/track/{token}
 *      Cho phép khách hàng truy cập trực tiếp bằng token QR mà không cần đăng nhập.
 *      Chỉ trả về: orderNumber, createdAt, fulfillmentStatus, items (tên, số lượng, tùy chọn)
 *      Không lộ dữ liệu nhạy cảm của quán.
 *
 * 5. REPORTS (ADMIN):
 *    - GET /api/reports/daily?date=YYYY-MM-DD
 *      Trả về tổng doanh thu, phân bổ tiền mặt/chuyển khoản, tiền hoàn, top 5 món bán chạy.
 *
 * 6. STAFF MANAGEMENT (ADMIN):
 *    - GET /api/staff
 *    - POST /api/staff
 *    - PUT /api/staff/{id}
 *    - PATCH /api/staff/{id}/toggle-active
 */

export const SPRING_BOOT_DOC = {
  version: '1.0.0',
  description: 'Hướng dẫn kết nối Spring Boot Backend cho POS Quán Nhỏ',
}
