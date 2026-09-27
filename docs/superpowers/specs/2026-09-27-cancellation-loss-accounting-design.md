# Thiết kế phân loại thiệt hại khi hủy đơn

## Mục tiêu

Phân biệt đơn hủy trước khi chế biến với đơn hủy sau khi quán đã bắt đầu làm món, để chủ quán biết số đơn hủy gây hao hụt và tổng số tiền lỗ. Việc phân loại phải tự động dựa trên trạng thái đơn ngay trước lúc hủy, không cho người thao tác tự chọn.

## Quy tắc nghiệp vụ

| Trạng thái trước khi hủy | Phân loại | Tiền lỗ |
|---|---|---:|
| `NEW` (Mới nhận) | `NO_MATERIAL_LOSS` | `0` |
| `PREPARING` (Đang chuẩn bị) | `FULL_ORDER_LOSS` | `total_amount` |
| `READY_FOR_PICKUP` (Chờ khách nhận) | `FULL_ORDER_LOSS` | `total_amount` |

Không cho hủy đơn ở trạng thái `COMPLETED` hoặc `CANCELLED`.

`refund_amount` là số tiền hoàn lại cho khách. `loss_amount` là thiệt hại của quán theo quy tắc trên. Hai số liệu được lưu và báo cáo riêng, dù trong trường hợp thường gặp chúng có thể cùng bằng tổng giá trị đơn.

Chi phí giấy in của đơn hủy ở trạng thái `NEW` không được tính vào `loss_amount` trong phạm vi tính năng này.

## Dữ liệu

Bổ sung cho bảng `orders`:

- `cancelled_from_status VARCHAR(30)`: trạng thái phục vụ ngay trước khi hủy.
- `cancellation_loss_type VARCHAR(30)`: `NO_MATERIAL_LOSS` hoặc `FULL_ORDER_LOSS`.
- `loss_amount BIGINT NOT NULL DEFAULT 0`: tiền lỗ, không âm.

Migration phải idempotent. Dữ liệu hủy cũ không có đủ lịch sử để suy ra chính xác nên được gắn `cancelled_from_status = NULL`, `cancellation_loss_type = NULL`, `loss_amount = 0`; không tự bịa số tiền lỗ cho dữ liệu cũ.

Entity backend ánh xạ đủ ba cột. API trả về camelCase: `cancelledFromStatus`, `cancellationLossType`, `lossAmount`.

## Backend

Endpoint hủy hiện tại tiếp tục được sử dụng. Backend đọc và khóa logic theo `fulfillment_status` hiện tại trong cùng transaction:

1. Kiểm tra trạng thái cho phép hủy.
2. Xác định loại thiệt hại và số tiền lỗ hoàn toàn ở server.
3. Cập nhật nguyên tử trạng thái hủy, trạng thái trước hủy, loại thiệt hại, tiền lỗ, lý do và tiền hoàn.
4. Nếu trạng thái đã thay đổi do thao tác đồng thời, trả `409 Conflict`.

Frontend không được gửi hoặc quyết định `lossAmount`; điều này ngăn sửa request để làm sai báo cáo.

## Giao diện hủy

Modal hủy hiển thị nội dung theo trạng thái hiện tại:

- `NEW`: nhãn “Hủy không hao hụt nguyên liệu”, tiền lỗ `0 đ`.
- `PREPARING` hoặc `READY_FOR_PICKUP`: cảnh báo “Hủy có hao hụt”, tiền lỗ dự kiến bằng tổng tiền đơn.

Sau khi hủy, thẻ và chi tiết đơn hiển thị loại hủy, tiền hoàn khách và tiền lỗ của quán. Loại hủy chỉ để xem, không có ô chọn thủ công.

## Báo cáo

Báo cáo bổ sung:

- Số đơn hủy không hao hụt.
- Số đơn hủy có hao hụt.
- Tổng tiền lỗ do hủy có hao hụt.

Doanh thu, tiền hoàn và tiền lỗ vẫn là ba chỉ số riêng. File Excel xuất báo cáo phải chứa các chỉ số mới.

## Kiểm thử

- Migration và entity mapping cho ba trường mới.
- Hủy từ `NEW` ghi `NO_MATERIAL_LOSS`, `loss_amount = 0`.
- Hủy từ `PREPARING` và `READY_FOR_PICKUP` ghi `FULL_ORDER_LOSS`, `loss_amount = total_amount`.
- Không thể giả mạo tiền lỗ từ request frontend.
- Không thể hủy `COMPLETED`, `CANCELLED` hoặc hủy đồng thời hai lần.
- Modal hủy hiển thị đúng cảnh báo và số tiền dự kiến.
- Báo cáo giao diện và Excel tổng hợp đúng hai loại hủy và tiền lỗ.

## Ngoài phạm vi

- Tính giá vốn theo nguyên liệu thực tế.
- Tính chi phí giấy in.
- Cho người dùng nhập thủ công phần trăm hao hụt hoặc sửa tiền lỗ.
