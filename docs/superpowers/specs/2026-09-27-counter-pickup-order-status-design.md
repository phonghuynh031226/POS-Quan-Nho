# Thiết kế trạng thái đơn bán tại quầy

## Mục tiêu

Điều chỉnh vòng đời đơn cho mô hình khách gọi món và thanh toán tại quầy, quán in bill để chế biến, sau đó gọi khách quay lại nhận món. Trạng thái phải phản ánh tiến độ làm món, không dùng thuật ngữ giao hàng và không làm sai số liệu thanh toán hoặc doanh thu.

## Phạm vi

- PostgreSQL: bổ sung trạng thái tiến độ chế biến cho bảng `orders`.
- Backend: trả trạng thái đúng, kiểm soát chuyển trạng thái và hủy đơn.
- Frontend: đổi bộ lọc, nhãn, KPI và nút thao tác trên trang Đơn hàng.
- Báo cáo: tiếp tục tính doanh thu theo trạng thái thanh toán/hủy, không nhầm với tiến độ chế biến.
- In bill: giữ nguyên hai phần bill khách và phiếu chế biến; đơn vừa in bắt đầu ở trạng thái mới nhận.

Không khôi phục trang Nhân viên, Bếp hoặc Tra cứu đơn. Chủ quán thao tác trực tiếp tại trang Đơn hàng.

## Mô hình dữ liệu

Giữ cột `status` cho trạng thái nghiệp vụ của đơn:

- `COMPLETED`: giao dịch đã thanh toán và được ghi nhận.
- `CANCELLED`: đơn bị hủy; thông tin hoàn tiền nằm ở `payment_status` và `refund_amount`.
- `PENDING_PAYMENT`: giữ để tương thích với dữ liệu/thanh toán trong tương lai.

Bổ sung cột `fulfillment_status VARCHAR(30) NOT NULL DEFAULT 'NEW'` với ràng buộc:

- `NEW`: mới nhận, đã in bill và đang chờ bắt đầu làm.
- `PREPARING`: đang chuẩn bị món.
- `READY_FOR_PICKUP`: món đã xong, đang chờ gọi khách nhận.
- `COMPLETED`: khách đã nhận món.
- `CANCELLED`: đơn đã hủy.

Dữ liệu cũ được chuyển như sau:

- `orders.status = 'CANCELLED'` → `fulfillment_status = 'CANCELLED'`.
- Các đơn còn lại đã tồn tại → `fulfillment_status = 'COMPLETED'`, để lịch sử cũ không quay lại hàng chờ chế biến.

Đơn mới đã thanh toán được tạo với `status = 'COMPLETED'`, `payment_status = 'PAID'` và `fulfillment_status = 'NEW'`.

## Luồng chuyển trạng thái

Chỉ cho phép chuyển xuôi từng bước:

1. `NEW` → `PREPARING` qua nút **Bắt đầu làm**.
2. `PREPARING` → `READY_FOR_PICKUP` qua nút **Làm xong**.
3. `READY_FOR_PICKUP` → `COMPLETED` qua nút **Khách đã nhận**.

Không cho bỏ qua bước, quay ngược hoặc cập nhật đơn đã `COMPLETED`/`CANCELLED`. Backend là nơi kiểm tra quy tắc, frontend chỉ hỗ trợ trải nghiệm.

Hủy đơn được phép khi `fulfillment_status` là `NEW`, `PREPARING` hoặc `READY_FOR_PICKUP`. Hủy thực hiện trong một transaction và đồng thời cập nhật:

- `status = 'CANCELLED'`;
- `fulfillment_status = 'CANCELLED'`;
- `payment_status`, `refund_amount`, lý do và thời gian hủy/hoàn tiền.

Đơn `COMPLETED` không được hủy.

## API

### Đọc đơn

Các API đọc đơn trả `fulfillmentStatus` bằng một trong năm giá trị mới. `status` và `paymentStatus` vẫn được trả riêng.

### Chuyển tiến độ

`PATCH /api/orders/{id}/fulfillment-status`

Body:

```json
{ "status": "PREPARING" }
```

Kết quả thành công trả lại toàn bộ đơn đã cập nhật. API trả:

- `400` nếu giá trị trạng thái không hợp lệ;
- `404` nếu không có đơn;
- `409` nếu chuyển sai thứ tự hoặc đơn đã hoàn tất/hủy.

## Giao diện trang Đơn hàng

Bộ lọc trạng thái:

- Tất cả
- Mới nhận
- Đang chuẩn bị
- Chờ khách nhận
- Hoàn tất
- Đã hủy

Mỗi thẻ đơn hiển thị badge tiếng Việt tương ứng và tối đa một nút chuyển trạng thái hợp lệ. Trong lúc gọi API, nút bị vô hiệu hóa để tránh bấm lặp. Sau khi thành công, danh sách và KPI được tải lại; lỗi API hiển thị toast và giữ nguyên trạng thái hiện tại.

KPI **Đã giao xong** đổi thành **Đã hoàn tất**. Mô tả trang dùng ngôn ngữ bán tại quầy và nhận món, không dùng “giao hàng”.

## Báo cáo và tính tiền

- Doanh thu dựa trên `payment_status` và trạng thái hủy, không phụ thuộc việc món đang `NEW`, `PREPARING` hay `READY_FOR_PICKUP`.
- Số đơn hoàn tất phục vụ dựa trên `fulfillment_status = 'COMPLETED'`.
- Đơn hủy không được tính là hoàn tất; tiền hoàn được lấy từ `refund_amount`.

## Kiểm thử

Backend cần kiểm thử:

- đơn mới bắt đầu ở `NEW`;
- ba bước chuyển trạng thái hợp lệ;
- từ chối bỏ bước, quay ngược, cập nhật đơn hoàn tất và cập nhật đơn hủy;
- chỉ hủy được trước `COMPLETED` và cập nhật hai trạng thái nhất quán;
- dữ liệu trả về chứa `fulfillmentStatus` đúng.

Frontend cần kiểm thử:

- ánh xạ nhãn/nút cho từng trạng thái;
- hàm xác định trạng thái kế tiếp;
- quy tắc hiển thị nút hủy;
- API gửi đúng endpoint và payload;
- trang Đơn hàng không còn các nhãn `Chờ làm`, `Sẵn sàng` và `Đã giao` cũ.

