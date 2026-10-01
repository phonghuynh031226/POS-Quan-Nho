# Thiết kế nâng cấp POS desktop offline-first cho một quán

## 1. Mục tiêu

Đưa hệ thống POS Quán Nhỏ vào vận hành ổn định tại một quán thực tế. Hệ thống phục vụ mô hình khách đặt món, quán in phiếu chế biến, làm món và gọi khách nhận. Phiên bản đầu ưu tiên tài khoản Chủ quán; tài khoản nhân viên và phân quyền được triển khai sau khi luồng vận hành chính ổn định.

Thiết bị tại quán gồm một máy Windows chạy màn hình đặt món, một máy in nhiệt USB hoặc Bluetooth và một màn hình phụ tối đa 7 inch để hiển thị giỏ hàng, tổng tiền và mã QR chuyển khoản.

## 2. Phạm vi

### Trong phạm vi

- Đóng gói frontend React thành ứng dụng Windows `.exe`.
- Vận hành offline-first với SQLite tại máy quán.
- Tự đồng bộ đơn lên Spring Boot/PostgreSQL khi kết nối trở lại.
- Điều khiển máy in ESC/POS, ưu tiên USB; Bluetooth triển khai sau.
- Điều khiển màn hình khách hàng từ ứng dụng desktop.
- Chống trùng đơn và chống thanh toán lặp.
- Mở/đóng ca, kiểm tiền, nhật ký vận hành, backup và cập nhật ứng dụng.
- Bổ sung tài khoản nhân viên, PIN và phân quyền ở giai đoạn cuối.

### Ngoài phạm vi hiện tại

- Nhiều chi nhánh hoặc mô hình SaaS cho nhiều quán.
- Tích điểm và khách hàng thân thiết.
- Đặt bàn, giao hàng và đặt món trực tuyến.
- Quản lý nguyên liệu chuyên sâu trước khi quán xác nhận nhu cầu thực tế.

## 3. Kiến trúc lựa chọn

Sử dụng Electron để đóng gói giao diện React hiện tại. Electron phù hợp nhất với nền tảng JavaScript sẵn có, hỗ trợ cửa sổ thứ hai, tự khởi động cùng Windows, truy cập máy in và phát hành bộ cài mà không cần bổ sung Rust.

Hệ thống gồm ba lớp:

1. **Ứng dụng Windows:** Electron chứa React, quản lý cửa sổ POS, màn hình phụ, trạng thái mạng, máy in và cập nhật ứng dụng.
2. **Kho dữ liệu tại quán:** SQLite lưu thực đơn đã tải, cấu hình, giỏ hàng, đơn, thanh toán và hàng đợi đồng bộ.
3. **Máy chủ:** Spring Boot cung cấp API, PostgreSQL lưu dữ liệu chính sau đồng bộ và Cloudinary lưu ảnh món.

Frontend không được truy cập trực tiếp API hệ điều hành. Mọi thao tác native phải đi qua IPC có danh sách lệnh cho phép và dữ liệu đầu vào được kiểm tra.

## 4. Luồng dữ liệu offline-first

Mỗi đơn được cấp UUID tại máy quán. UUID đồng thời là idempotency key để server trả lại kết quả cũ khi nhận lại cùng một lệnh, thay vì tạo đơn mới.

Trạng thái đồng bộ của bản ghi local gồm:

- `PENDING`: đã lưu tại máy và đang chờ gửi.
- `SYNCING`: đang gửi lên server.
- `SYNCED`: server đã xác nhận.
- `FAILED`: gửi thất bại và cần thử lại hoặc xử lý.

Luồng tạo đơn:

1. Ứng dụng tải thực đơn, tùy chọn và cấu hình mới nhất khi có mạng.
2. Chủ quán tạo đơn; app ghi đơn và sự kiện đồng bộ vào SQLite trong cùng transaction.
3. Chỉ sau khi SQLite xác nhận, app mới báo tạo đơn thành công và đưa yêu cầu in vào hàng đợi.
4. Có mạng thì sync engine gửi ngay; mất mạng thì giữ `PENDING` và vẫn cho thanh toán tiền mặt.
5. Khi mạng trở lại, sync engine gửi lần lượt và thử lại theo khoảng thời gian tăng dần.
6. Xung đột không được ghi đè âm thầm; app đưa bản ghi vào danh sách cần xử lý.

Giỏ hàng đang làm phải được lưu tự động để việc đóng app hoặc khởi động lại không làm mất dữ liệu.

## 5. Thanh toán

- Tiền mặt hoạt động khi online và offline.
- Thanh toán chuyển khoản chỉ được xác nhận sau phản hồi hợp lệ từ server/SePay.
- Khi offline, màn hình phải báo không thể xác nhận chuyển khoản; không được tự đánh dấu đã thanh toán.
- Lệnh thanh toán dùng idempotency key riêng để thao tác lặp không tạo hai giao dịch.
- Trạng thái thanh toán và trạng thái đồng bộ phải tách biệt.

## 6. In hóa đơn

Print service dùng chuẩn ESC/POS và hàng đợi độc lập với luồng lưu đơn.

- Ưu tiên máy in USB và giấy K80; khổ K58 vẫn là cấu hình tùy chọn.
- Bluetooth là bước sau vì phụ thuộc driver và độ ổn định của thiết bị Windows.
- Bill khách được in trước; phiếu bếp/bar bắt đầu ở phiếu hoặc trang tiếp theo.
- In lại phải có dấu `BẢN IN LẠI` và được ghi vào nhật ký.
- Lỗi hết giấy, ngắt kết nối hoặc tắt máy in không được làm mất đơn.
- Người dùng có thể chọn máy in, in thử và gửi lại lệnh in thất bại.

## 7. Màn hình khách hàng

Electron mở một cửa sổ riêng trên màn hình phụ tối đa 7 inch. Cửa sổ nhận dữ liệu trực tiếp từ tiến trình desktop nên vẫn hiển thị giỏ hàng khi mất Internet.

Màn hình lần lượt hiển thị trạng thái chờ, giỏ hàng, tổng tiền, tiền khách đưa/tiền thừa và kết quả thanh toán. QR chỉ xuất hiện khi chọn chuyển khoản và dịch vụ server sẵn sàng. Sau khi thanh toán hoàn tất, màn hình xác nhận trong thời gian ngắn rồi quay lại trạng thái chờ.

## 8. Các mô-đun

### Desktop shell

- Quản lý cửa sổ chính và màn hình phụ.
- Chỉ cho chạy một phiên bản ứng dụng.
- Tự khởi động cùng Windows.
- Lưu cấu hình URL server, máy in, khổ giấy và màn hình.
- Cung cấp IPC tối thiểu cho database, in, màn hình và cập nhật.

### Local database

- SQLite có migration theo phiên bản.
- Transaction bảo vệ đơn và hàng đợi đồng bộ.
- Lưu cache thực đơn, tùy chọn, cấu hình, giỏ hàng, đơn và thanh toán.
- Việc nâng cấp app không được xóa dữ liệu hoặc cấu hình cũ.

### Sync engine

- Đồng bộ theo thứ tự sự kiện.
- Dùng idempotency key chống lặp.
- Thử lại theo exponential backoff có giới hạn.
- Hiển thị số bản ghi chờ, thời điểm đồng bộ cuối và lỗi gần nhất.
- Cho phép thử lại thủ công và xử lý xung đột.

### Print service

- Chuyển mẫu bill sang lệnh ESC/POS.
- Hàng đợi in bền vững và có trạng thái.
- Hỗ trợ chọn máy in, in thử, in lại và ghi audit.

### Server

- API đồng bộ idempotent.
- Lưu lịch sử thay đổi thay vì chỉ ghi đè trạng thái cuối.
- Endpoint health check, phiên bản app tối thiểu và thời gian server.
- Backup PostgreSQL tự động và cảnh báo khi backup thất bại.

## 9. Lộ trình chức năng

### Giai đoạn 1: Vận hành an toàn

- Electron `.exe`, bộ cài và tự khởi động.
- SQLite, tự lưu giỏ hàng và hàng đợi đồng bộ.
- Chống trùng đơn và thanh toán lặp.
- Tiền mặt offline; QR chỉ dùng khi server sẵn sàng.
- In ESC/POS USB, chọn máy in và in thử.
- Màn hình phụ hoạt động không phụ thuộc Internet.
- Sao lưu/phục hồi cấu hình local.
- Nhật ký lỗi và thao tác thử đồng bộ lại.

### Giai đoạn 2: Vận hành hằng ngày

- Mở ca, đóng ca và kiểm đếm tiền mặt.
- Báo cáo chênh lệch tiền thực tế và hệ thống.
- Cảnh báo đơn chưa đồng bộ trước khi thoát.
- Hoàn tiền, hủy đơn và hao hụt rõ ràng.
- In lại có đánh dấu và audit.
- Cập nhật ứng dụng có kiểm soát và khả năng quay lại phiên bản trước.
- Backup máy chủ và cảnh báo backup.

### Giai đoạn 3: Chuẩn bị bàn giao

- Tài khoản nhân viên và đăng nhập PIN nhanh.
- Phân quyền bán hàng, hủy đơn, báo cáo và sửa thực đơn.
- Audit người tạo, sửa, hủy, hoàn tiền và in lại.
- Ca làm việc theo nhân viên.
- Kiểm thử sự cố thực tế và hoàn thiện tài liệu vận hành.

## 10. Xử lý lỗi và quan sát hệ thống

Lỗi phải được diễn đạt bằng tiếng Việt và nêu hành động tiếp theo. App không dùng một thông báo chung cho lỗi lưu local, lỗi server, lỗi thanh toán và lỗi máy in.

Nhật ký kỹ thuật phải có mã đơn/UUID, loại sự kiện, thời gian, số lần thử và mã lỗi; không ghi mật khẩu, API key, token hoặc dữ liệu thanh toán nhạy cảm. Người dùng xem được bản tóm tắt, còn file log chi tiết phục vụ hỗ trợ kỹ thuật.

## 11. Bảo mật và cấu hình

- Cloudinary secret, database password và SePay secret không nằm trong frontend hoặc Git.
- Máy chủ bắt buộc HTTPS khi triển khai.
- Cấu hình nhạy cảm của app Windows lưu qua cơ chế bảo vệ thông tin của Windows.
- SQLite được mã hóa nếu thư viện được chọn đáp ứng ổn định; tối thiểu phải hạn chế chỉnh sửa thông thường và phát hiện dữ liệu hỏng.
- Backend xác thực mọi thao tác; không tin dữ liệu giá tiền, trạng thái thanh toán hoặc quyền gửi từ client.

## 12. Kiểm thử và tiêu chí chấp nhận

Hệ thống phải vượt qua các kịch bản:

- Mất Internet trong lúc tạo đơn nhưng vẫn lưu, in và đồng bộ sau đó.
- Mất điện hoặc tắt app ngay sau thanh toán nhưng không mất hoặc nhân đôi đơn.
- Bấm thanh toán/in nhiều lần nhưng chỉ có một giao dịch và ghi đúng số bản in.
- Máy in hết giấy, mất kết nối hoặc tắt nguồn nhưng đơn vẫn an toàn.
- Server dừng tạm thời nhưng bán tiền mặt tiếp tục và số đơn chờ được hiển thị.
- QR hết hạn hoặc SePay chậm nhưng không tự xác nhận thanh toán.
- Thực đơn thay đổi khi app offline nhưng đơn cũ vẫn giữ đúng tên, giá và tùy chọn lúc bán.
- Nâng cấp app không làm mất SQLite hoặc cấu hình thiết bị.
- Phục hồi backup giữ đủ đơn, báo cáo và lịch sử hủy/hoàn tiền.

Mục tiêu hiệu năng:

- Mở màn POS trong khoảng 3 giây trên máy quán mục tiêu.
- Thêm món phản hồi gần như tức thời.
- Ghi đơn local dưới 500 ms.
- App chạy liên tục cả ca mà không tăng bộ nhớ bất thường.
- Trạng thái mạng và đồng bộ luôn nhìn thấy được.

## 13. Điều kiện bàn giao

- Bộ cài `.exe` đã ký hoặc có hướng dẫn xử lý cảnh báo Windows rõ ràng.
- Có hướng dẫn cấu hình server, máy in, màn hình phụ và chuyển khoản.
- Có quy trình backup, phục hồi, cập nhật và quay lại phiên bản trước.
- Có danh sách kiểm tra đầu ca/cuối ca và xử lý sự cố thường gặp.
- Một đợt chạy thử tại quán hoàn tất với các kịch bản mất mạng, lỗi máy in và phục hồi app.
