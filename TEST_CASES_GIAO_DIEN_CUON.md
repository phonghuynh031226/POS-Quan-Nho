# Bộ test toàn diện: Thực đơn, Tùy chọn, Đơn hàng và Cài đặt

> Đây là tài liệu mô tả ca kiểm thử thủ công, không phải mã test tự động. Phạm vi bám theo các luồng đang làm việc trong cuộc trò chuyện và API được frontend gọi: quản lý món/danh mục/nhóm tùy chọn, lịch sử và xử lý đơn hàng, cài đặt quán, SePay, hồ sơ và mật khẩu.

## Môi trường và dữ liệu chuẩn bị

- Chạy frontend và backend ở môi trường test; không dùng dữ liệu cửa hàng đang bán thật.
- Đăng nhập bằng tài khoản Chủ quán. Chuẩn bị thêm tài khoản Admin và tài khoản không có quyền quản trị nếu môi trường có phân quyền này.
- API ghi dữ liệu cần phiên đăng nhập hợp lệ và CSRF token (`X-XSRF-TOKEN`). Gọi `GET /api/auth/csrf` trước thao tác ghi nếu chưa có token.
- Chuẩn bị một danh mục đang hoạt động; một món còn bán và một món hết hàng; một nhóm chọn một; một nhóm chọn nhiều; một nhóm có lựa chọn bắt buộc; một món có liên kết nhóm tùy chọn.
- Chuẩn bị các đơn ở trạng thái `NEW`, `PREPARING`, `READY_FOR_PICKUP`, `COMPLETED`, `CANCELLED`; có đơn tiền mặt, có món và nhóm tùy chọn đã cấu hình.
- Với kiểm thử UI cuộn, chuẩn bị đủ dữ liệu để danh sách dài hơn vùng hiển thị. Với kiểm thử bố cục Cài đặt, dùng màn hình desktop 1920 × 1080.
- Dọn các bản ghi kiểm thử sau khi chạy; ghi lại ID của bản ghi tạo mới để xóa đúng dữ liệu.

## A. Validate phía giao diện

### VAL-01 — Không cho lưu món thiếu tên

- **Given:** Mở “Thêm món mới”, để trống tên, điền danh mục hợp lệ và giá lớn hơn 0.
- **When:** Nhấn lưu.
- **Then:** Hiện lỗi tên món; không đóng modal, không tạo món và không gọi API `POST /api/menu`.

### VAL-02 — Không cho lưu món thiếu danh mục

- **Given:** Mở form thêm món, điền tên hợp lệ và giá hợp lệ nhưng không chọn được danh mục.
- **When:** Nhấn lưu.
- **Then:** Hiện lỗi danh mục; không tạo món và không gọi API lưu món.

### VAL-03 — Giá món phải lớn hơn 0

- **Given:** Mở form thêm món, điền tên và danh mục hợp lệ.
- **When:** Nhập giá 0 hoặc số âm rồi lưu.
- **Then:** Hiện lỗi giá phải lớn hơn 0; không tạo hoặc cập nhật món.

### VAL-04 — Chấp nhận giá món hợp lệ

- **Given:** Form món có tên, danh mục và giá dương hợp lệ.
- **When:** Lưu món.
- **Then:** Form chuyển dữ liệu sang thao tác lưu; giá gửi lên là số, tên được bỏ khoảng trắng đầu/cuối.

### VAL-05 — Tên nhóm tùy chọn bắt buộc

- **Given:** Mở form tạo nhóm, thêm ít nhất một lựa chọn nhưng để tên nhóm trống.
- **When:** Nhấn lưu.
- **Then:** Hiện lỗi tên nhóm; không gọi API tạo nhóm.

### VAL-06 — Nhóm tùy chọn phải có ít nhất một lựa chọn

- **Given:** Mở form tạo nhóm, nhập tên nhóm hợp lệ nhưng chưa thêm lựa chọn nào.
- **When:** Nhấn lưu.
- **Then:** Hiện lỗi nhóm cần ít nhất một lựa chọn; không gọi API tạo nhóm.

### VAL-07 — Tên lựa chọn bắt buộc khi thêm lựa chọn

- **Given:** Mở form nhóm tùy chọn và để trống tên lựa chọn mới.
- **When:** Nhấn “Thêm lựa chọn”.
- **Then:** Hiện lỗi tên lựa chọn; danh sách lựa chọn không tăng.

### VAL-08 — Hồ sơ yêu cầu họ tên và số điện thoại

- **Given:** Mở tab tài khoản; chỉ xóa họ tên hoặc chỉ xóa số điện thoại, giữ trường còn lại hợp lệ.
- **When:** Nhấn lưu thông tin.
- **Then:** Hiện đúng lỗi của trường trống và không gọi API cập nhật hồ sơ.
- **Ghi chú:** Chạy riêng từng trường để xác nhận hai điều kiện độc lập.

### VAL-09 — Mật khẩu mới phải đạt các điều kiện

- **Given:** Mở phần đổi mật khẩu.
- **When:** Thử lần lượt bỏ trống mật khẩu hiện tại, bỏ trống mật khẩu mới, nhập mật khẩu mới 5 ký tự, nhập mật khẩu mới trùng mật khẩu hiện tại, và nhập xác nhận không khớp.
- **Then:** Mỗi lần hiện thông báo tương ứng; không gọi API đổi mật khẩu. Giá trị hợp lệ tối thiểu là 6 ký tự và phải khác mật khẩu hiện tại, đồng thời xác nhận phải khớp.

### VAL-10 — Không cho lưu SePay API Key trống

- **Given:** Mở tab SePay và để ô API Key trống hoặc chỉ có khoảng trắng.
- **When:** Nhấn lưu khóa.
- **Then:** Hiện cảnh báo yêu cầu nhập khóa; không gọi API lưu khóa.

### VAL-11 — Chặn tải ảnh món sai định dạng hoặc quá dung lượng

- **Given:** Mở form món.
- **When:** Chọn một tệp không phải ảnh; sau đó thử ảnh lớn hơn 2 MB.
- **Then:** Hiện lỗi đúng nguyên nhân, không gửi upload; người dùng vẫn có thể chọn tệp hợp lệ khác.

## B. Chức năng giao diện

### FUNC-01 — Tạo, sửa và xóa món

- **Given:** Có danh mục đang hoạt động.
- **When:** Tạo món với dữ liệu hợp lệ; mở sửa và đổi tên/giá; sau đó xóa chính món thử nghiệm.
- **Then:** Món mới xuất hiện; chỉnh sửa được phản ánh trong danh sách; sau xác nhận xóa món biến mất và không còn được liên kết với nhóm tùy chọn.

### FUNC-02 — Tự tạo mã món từ tên khi bỏ trống mã

- **Given:** Thêm món mới, không nhập mã và nhập tên có dấu, ví dụ “Bạc xỉu kem”.
- **When:** Lưu món.
- **Then:** Mã được tự sinh dạng chữ hoa không dấu, ký tự phân cách thành `_`; món vẫn lưu được.

### FUNC-03 — Checkbox “Đang có sẵn để bán” bật và tắt

- **Given:** Mở form sửa một món.
- **When:** Bật checkbox rồi lưu; mở lại, tắt checkbox rồi lưu.
- **Then:** Món ở trạng thái đang bán khi bật và hết món khi tắt; trạng thái vẫn đúng sau khi tải lại trang.

### FUNC-04 — Nút trạng thái bán trên thẻ món

- **Given:** Danh sách có một món đang bán.
- **When:** Nhấn trạng thái “Đang bán” trên thẻ món.
- **Then:** API đổi availability thành công, giao diện đổi thành “Hết món”; nhấn lần nữa thì trở lại đang bán.

### FUNC-05 — Tìm và lọc món

- **Given:** Danh sách có món thuộc ít nhất hai danh mục và có mã món.
- **When:** Lọc theo danh mục; tìm lần lượt theo một phần tên và mã.
- **Then:** Chỉ hiển thị món khớp cả điều kiện danh mục và từ khóa; xóa từ khóa/đặt “Tất cả món” khôi phục danh sách tương ứng.

### FUNC-06 — Tạo và sửa nhóm tùy chọn

- **Given:** Có dữ liệu hợp lệ gồm tên nhóm và lựa chọn.
- **When:** Tạo nhóm chọn một; tạo hoặc sửa nhóm chọn nhiều, đặt số lượng tối đa, bắt buộc/không bắt buộc, giá cộng thêm và lựa chọn mặc định.
- **Then:** Thông tin được lưu và hiển thị lại chính xác sau khi tải lại trang.

### FUNC-07 — Checkbox kích hoạt nhóm tùy chọn bật và tắt

- **Given:** Mở form nhóm tùy chọn hoặc xem thẻ nhóm đang kích hoạt.
- **When:** Tắt “Kích hoạt” rồi lưu; sau đó bật lại và lưu.
- **Then:** Trạng thái nhóm phản ánh đúng lựa chọn sau mỗi lần tải lại; thao tác bật/tắt nhanh trên thẻ cũng cập nhật được.

### FUNC-08 — Quy tắc mặc định lựa chọn

- **Given:** Một nhóm chọn một có nhiều lựa chọn và một nhóm chọn nhiều có nhiều lựa chọn.
- **When:** Đổi lựa chọn mặc định ở từng nhóm.
- **Then:** Nhóm chọn một chỉ có tối đa một lựa chọn mặc định; nhóm chọn nhiều có thể bật/tắt mặc định riêng từng lựa chọn.

### FUNC-09 — Liên kết nhóm tùy chọn với món và thứ tự hiển thị

- **Given:** Có món thử nghiệm và hai nhóm tùy chọn.
- **When:** Gắn cả hai nhóm vào món, đặt required/maxSelect, đổi thứ tự rồi lưu món.
- **Then:** Liên kết, quy tắc và thứ tự còn nguyên khi mở lại form sửa món; bỏ một nhóm rồi lưu thì nhóm đó không còn gắn với món.

### FUNC-10 — Tìm kiếm và lọc nhóm tùy chọn

- **Given:** Có nhóm chọn một, nhóm chọn nhiều, nhóm bật và nhóm tắt.
- **When:** Tìm theo tên/mã và chọn từng bộ lọc loại.
- **Then:** Kết quả phù hợp từ khóa và loại được chọn; bộ lọc “Tất cả” trả lại các nhóm theo dữ liệu hiện tại.

### FUNC-11 — Checkbox Wi-Fi trên hóa đơn đạt và không đạt

- **Given:** Trang Cài đặt có tên và mật khẩu Wi-Fi đã nhập.
- **When:** Bật “In thông tin Wi-Fi lên hóa đơn”, lưu và mở xem/in thử hóa đơn; sau đó tắt checkbox, lưu và mở xem/in thử lại.
- **Then:** **Đạt khi bật:** hóa đơn có tên và mật khẩu Wi-Fi. **Đạt khi tắt:** hóa đơn không có thông tin Wi-Fi. Giá trị checkbox còn đúng sau khi tải lại trang.

### FUNC-12 — Thay đổi checkbox Wi-Fi chỉ lưu sau khi nhấn lưu

- **Given:** Ghi nhận trạng thái Wi-Fi đang lưu trên máy chủ.
- **When:** Đổi trạng thái checkbox nhưng rời trang/tải lại trước khi nhấn lưu.
- **Then:** Trạng thái quay lại giá trị đã lưu; sau khi bật/tắt và nhấn lưu, giá trị mới được giữ lại.

### FUNC-13 — Lưu thông tin in hóa đơn

- **Given:** Trang Cài đặt có tên quán, địa chỉ, hotline, Wi-Fi và câu cảm ơn.
- **When:** Sửa từng trường, lưu và tải lại trang.
- **Then:** Các giá trị mới được giữ nguyên; thông tin quán và câu cảm ơn xuất hiện đúng ở bản xem trước hóa đơn.

### FUNC-14 — Lọc lịch sử đơn và chuyển chế độ xem

- **Given:** Có đơn ở nhiều trạng thái, nhiều ngày, tên món và người tạo khác nhau.
- **When:** Lọc theo trạng thái, ngày, mã đơn, tên món hoặc người tạo; chuyển giữa “Dạng Thẻ” và “Dạng Bảng”.
- **Then:** Kết quả phù hợp bộ lọc; hai chế độ thể hiện cùng tập đơn; xóa bộ lọc đưa kết quả về trạng thái tương ứng.

### FUNC-15 — Tiến trình trạng thái phục vụ đơn

- **Given:** Có đơn `NEW` chưa bị hủy.
- **When:** Thực hiện lần lượt “Đang chuẩn bị”, “Chờ khách nhận”, “Hoàn tất”.
- **Then:** Trạng thái lần lượt là `PREPARING`, `READY_FOR_PICKUP`, `COMPLETED`; giao diện và số liệu thống kê cập nhật theo trạng thái.

### FUNC-16 — Hủy đơn và thống kê tiền hoàn/lỗ

- **Given:** Có một đơn `NEW` và một đơn `PREPARING`.
- **When:** Hủy từng đơn với lý do hợp lệ và số tiền hoàn hợp lệ.
- **Then:** Đơn chuyển sang `CANCELLED`; lý do, tiền hoàn và trạng thái trước khi hủy được hiển thị. Đơn `NEW` được ghi nhận không hao hụt nguyên liệu; đơn đã chuẩn bị được tính lỗ theo toàn bộ giá trị đơn. Thống kê hoàn khách và lỗ không bị cộng nhầm vào nhau.

### FUNC-17 — Chỉ vùng danh sách cuộn

- **Given:** Danh sách ở trang Thực đơn, Tùy chọn hoặc Lịch sử đơn hàng dài hơn chiều cao còn lại.
- **When:** Cuộn bên trong danh sách.
- **Then:** Thanh điều hướng, tiêu đề trang và thanh tìm kiếm/bộ lọc đứng yên; danh sách cuộn độc lập tới đầu/cuối; không mất điều khiển phía trên.

### FUNC-18 — Cài đặt vừa màn hình desktop và checkbox vẫn dễ bấm

- **Given:** Tab “Thông tin in bill” mở ở màn hình 1920 × 1080.
- **When:** Quan sát biểu mẫu và thử bấm checkbox Wi-Fi bằng cả ô lẫn nhãn.
- **Then:** Các trường, checkbox và nút lưu hiển thị đầy đủ trong khung; checkbox nhỏ gọn nhưng cả nhãn vẫn thao tác được.

### FUNC-19 — Tải danh sách thất bại hiển thị thông báo và kết thúc trạng thái tải

- **Given:** Backend tạm thời không phản hồi một yêu cầu tải dữ liệu của trang Thực đơn, Tùy chọn, Lịch sử đơn hàng hoặc Cài đặt.
- **When:** Mở trang tương ứng.
- **Then:** Có thông báo lỗi phù hợp, trạng thái tải kết thúc và giao diện không mắc kẹt ở spinner vô hạn.

## C. Logic và quy tắc nghiệp vụ

### LOGIC-01 — Tính tổng dòng đơn theo giá món, phụ thu và số lượng

- **Given:** Món giá 30.000 ₫, lựa chọn cộng thêm 6.000 ₫ và số lượng 2.
- **When:** Tạo đơn tiền mặt với đủ tiền khách đưa.
- **Then:** Đơn giá dòng là 36.000 ₫; tổng dòng là 72.000 ₫; tiền thối bằng tiền khách đưa trừ tổng đơn.

### LOGIC-02 — Không chấp nhận số lượng không hợp lệ

- **Given:** Có món đang bán.
- **When:** Gửi đơn với số lượng 0, số âm hoặc vượt giới hạn số nguyên hỗ trợ.
- **Then:** API từ chối yêu cầu; không tạo đơn.

### LOGIC-03 — Bắt buộc chọn đúng số tùy chọn của nhóm

- **Given:** Món có nhóm bắt buộc min 1/max 2 và một nhóm chọn một.
- **When:** Gửi đơn bỏ nhóm bắt buộc, vượt maxSelect, chọn hai giá trị trong nhóm chọn một, hoặc gửi lựa chọn không thuộc món.
- **Then:** Từng yêu cầu sai bị từ chối; không có đơn một phần nào được tạo.

### LOGIC-04 — Chặn lựa chọn trùng lặp

- **Given:** Đơn chứa cùng một lựa chọn hai lần.
- **When:** Gửi yêu cầu tạo đơn.
- **Then:** Yêu cầu bị từ chối là lựa chọn trùng; không tạo đơn.

### LOGIC-05 — Đơn hàng phải là tiền mặt và đủ tiền

- **Given:** Giỏ hàng có ít nhất một món hợp lệ.
- **When:** Gửi phương thức chuyển khoản chưa tích hợp hoặc tiền khách đưa thấp hơn tổng tiền.
- **Then:** Chuyển khoản bị từ chối với lỗi chưa hỗ trợ; thanh toán thiếu bị từ chối; không lưu đơn.

### LOGIC-06 — Chuyển trạng thái chỉ theo đúng thứ tự

- **Given:** Một đơn `NEW` và một đơn `COMPLETED`.
- **When:** Từ `NEW` yêu cầu nhảy thẳng đến `COMPLETED`; từ `COMPLETED` yêu cầu chuyển ngược; gửi trạng thái không hợp lệ.
- **Then:** Các yêu cầu sai bị từ chối; trạng thái đã lưu không đổi. Chỉ các bước kế tiếp hợp lệ mới được chấp nhận.

### LOGIC-07 — Không hủy đơn đã hoàn tất hoặc đã hủy

- **Given:** Một đơn `COMPLETED` và một đơn `CANCELLED`.
- **When:** Gửi yêu cầu hủy cho từng đơn.
- **Then:** Cả hai yêu cầu bị từ chối; dữ liệu hủy/hoàn tiền trước đó không bị thay đổi.

### LOGIC-08 — Ranh giới số tiền hoàn và loại hao hụt

- **Given:** Có đơn chưa hoàn tất với tổng 30.000 ₫.
- **When:** Hủy với hoàn 0 ₫, đúng 30.000 ₫, âm 1 ₫ hoặc 30.001 ₫; thử hủy không có lý do.
- **Then:** 0 và đúng tổng đơn được chấp nhận nếu có lý do; số âm, cao hơn tổng đơn hoặc thiếu lý do bị từ chối. Logic hao hụt phụ thuộc trạng thái lúc hủy.

## D. Kiểm thử API

> Thực hiện qua Postman/cURL hoặc công cụ API tương đương trên môi trường test. Dùng phiên cookie và CSRF token hợp lệ cho các request ghi. Không dùng API Key SePay thật trong tài liệu hoặc log.

### API-01 — Phân quyền và CSRF

- **Given:** Chưa đăng nhập; sau đó đăng nhập nhưng bỏ CSRF token.
- **When:** Gọi `GET /api/settings/shop`, `GET /api/settings/shop/public` và một request ghi như `PUT /api/settings/shop`.
- **Then:** Settings riêng tư trả `401` khi chưa đăng nhập; public shop info cho phép truy cập; request ghi thiếu/không hợp lệ CSRF bị từ chối `403`; với phiên và token hợp lệ, request được xử lý theo dữ liệu.

### API-02 — Đọc và cập nhật cài đặt quán

- **Given:** Phiên Chủ quán hợp lệ và CSRF token hợp lệ.
- **When:** Gọi `GET /api/settings/shop`, `PUT /api/settings/shop` với tên quán hợp lệ, rồi GET lại.
- **Then:** GET trả các trường quán; PUT trả dữ liệu mới; GET sau đó xác nhận giá trị đã lưu, gồm `show_wifi_on_receipt` đúng true/false.

### API-03 — Validate tên quán ở API

- **Given:** Phiên hợp lệ.
- **When:** Gọi `PUT /api/settings/shop` với `shop_name` trống hoặc chỉ khoảng trắng.
- **Then:** API trả `400`; tên quán cũ không bị thay đổi.

### API-04 — Đọc, lưu và kiểm tra khóa SePay

- **Given:** Phiên hợp lệ; môi trường test không dùng khóa thật.
- **When:** Gọi `GET /api/settings/sepay`; thử `POST /api/settings/sepay/key` với chuỗi rỗng, khóa ngắn 3 ký tự, khóa dài hơn 2048 ký tự, rồi khóa test hợp lệ từ 4 đến 2048 ký tự; cuối cùng gọi `POST /api/settings/sepay/test`.
- **Then:** Các khóa rỗng/quá ngắn/quá dài trả `400`; khóa hợp lệ lưu được, chỉ trả trạng thái cấu hình và bốn ký tự cuối/mask, không trả khóa thô; test trả thành công khi đã cấu hình. Nếu chưa cấu hình, test trả `503`.

### API-05 — Đọc danh sách món, danh mục, topping và nhóm tùy chọn

- **Given:** Phiên hợp lệ.
- **When:** Gọi `GET /api/menu`, `/api/categories`, `/api/toppings`, `/api/options` và `/api/product-option-groups`.
- **Then:** API trả danh sách có cấu trúc; giá, trạng thái availability, danh mục và liên kết nhóm nhất quán với dữ liệu cơ sở dữ liệu.

### API-06 — Tạo và cập nhật món

- **Given:** Phiên hợp lệ, danh mục tồn tại.
- **When:** `POST /api/menu` với tên, category_id và base_price hợp lệ; sau đó `PUT /api/menu/{id}` đổi tên/giá/trạng thái.
- **Then:** Tạo trả `200` với bản ghi mới; cập nhật trả `200` với giá trị mới; `GET /api/menu` xác nhận các thay đổi.

### API-07 — Từ chối món không hợp lệ

- **Given:** Phiên hợp lệ.
- **When:** Gọi `POST /api/menu` thiếu tên, giá 0/âm hoặc category không tồn tại.
- **Then:** API trả `400` và không tạo bản ghi.

### API-08 — Availability và xóa món

- **Given:** Có món test.
- **When:** Gọi `PATCH /api/menu/{id}/availability` hai lần; sau đó `DELETE /api/menu/{id}`; gọi lại toggle/delete với ID không tồn tại.
- **Then:** Mỗi toggle đảo trạng thái; xóa thành công; ID không tồn tại trả `404`.

### API-09 — Tạo và cập nhật nhóm tùy chọn

- **Given:** Phiên hợp lệ.
- **When:** `POST /api/options` với tên và ít nhất một option hợp lệ; `PUT /api/options/{id}` đổi nhóm/options, phụ thu, mặc định và availability.
- **Then:** API trả dữ liệu nhóm/option đã lưu; GET danh sách phản ánh giá trị và thứ tự cập nhật.

### API-10 — API từ chối tên nhóm/option trống và phụ thu âm

- **Given:** Nhóm test hiện có để đối chiếu trước/sau.
- **When:** Gửi POST/PUT `/api/options` với tên nhóm rỗng, option name rỗng hoặc extra_price âm.
- **Then:** API trả `400`; giao dịch không lưu một phần; dữ liệu nhóm cũ vẫn nguyên vẹn sau request lỗi.

### API-11 — Availability, liên kết và xóa nhóm tùy chọn

- **Given:** Có nhóm được liên kết với một món.
- **When:** Toggle `PATCH /api/options/{id}/availability`; đọc liên kết qua `GET /api/products/{productId}/option-groups`; thay liên kết bằng `PUT` rồi xóa nhóm.
- **Then:** Trạng thái nhóm được đảo; liên kết trả đúng required/maxSelect/displayOrder; khi xóa nhóm, liên kết sản phẩm tương ứng được dọn; ID không tồn tại trả `404` khi toggle/delete.

### API-12 — Tạo đơn thành công và xác nhận tính tiền

- **Given:** Phiên hợp lệ; món đang bán; lựa chọn thuộc nhóm của món; tiền khách đủ.
- **When:** Gọi `POST /api/orders` với phương thức `TIEN_MAT`, item, quantity, selectedOptions và cashGiven hợp lệ.
- **Then:** API trả `201`; đơn có mã `QN-xxxxxx`, trạng thái thanh toán `PAID`, trạng thái phục vụ `NEW`, tổng/tiền thối đúng; chi tiết item và lựa chọn được lưu.

### API-13 — API tạo đơn từ chối request không hợp lệ

- **Given:** Phiên hợp lệ.
- **When:** Gọi `POST /api/orders` không có items, phương thức khác `TIEN_MAT`, product không tồn tại, món hết hàng, quantity không hợp lệ hoặc tiền không đủ.
- **Then:** Giỏ trống/ID món/số lượng/tiền thiếu trả `400`; phương thức chuyển khoản chưa tích hợp trả `422`; không tạo đơn.

### API-14 — API tạo đơn kiểm tra option và ranh giới min/max

- **Given:** Món có nhóm option bắt buộc, nhóm chọn một và nhóm chọn nhiều có giới hạn.
- **When:** Gửi thiếu lựa chọn bắt buộc, thừa lựa chọn, option không thuộc món, option đã tắt hoặc cùng option lặp lại.
- **Then:** Mỗi payload vi phạm trả `400`; không tạo order/order_items; payload đạt min/max được chấp nhận.

### API-15 — API chuyển trạng thái đơn hợp lệ và không hợp lệ

- **Given:** Một order `NEW` và một order đã `COMPLETED`.
- **When:** Gọi `PATCH /api/orders/{id}/fulfillment-status` với các trạng thái kế tiếp hợp lệ, nhảy bước, chuyển lùi, trạng thái không hợp lệ và ID không tồn tại.
- **Then:** Bước hợp lệ trả `200`; chuyển sai thứ tự trả `409`; trạng thái không hợp lệ hoặc thiếu trả `400`; ID không tồn tại trả `404`.

### API-16 — API hủy đơn validate lý do, trạng thái và tiền hoàn

- **Given:** Một order `NEW`, một order `PREPARING`, một order `COMPLETED`.
- **When:** Gọi `POST /api/orders/{id}/cancel` với lý do trống, refund âm, refund lớn hơn tổng, refund 0, refund bằng tổng, và hủy order đã hoàn tất.
- **Then:** Lý do trống hoặc refund ngoài khoảng `[0, tổng đơn]` trả `400`; hủy đơn hoàn tất trả `409`; request hợp lệ trả `200`, lưu lý do/tiền hoàn/trạng thái trước hủy và ghi loss theo quy tắc nghiệp vụ.

### API-17 — Lấy lịch sử và chi tiết đơn

- **Given:** Có order vừa tạo và order cũ.
- **When:** Gọi `GET /api/orders` và `GET /api/orders/{id}`.
- **Then:** Danh sách và chi tiết trả trạng thái, phương thức, tiền, creator, items, lựa chọn, ghi chú và thông tin hủy/hoàn nhất quán; ID không tồn tại trả `404`.

## Tiêu chí hoàn tất

- Đánh dấu đúng một ô **Đạt** hoặc **Không đạt** cho mỗi ca trong bảng bên dưới sau khi thực thi.
- Ca bị lỗi ghi lại: ID dữ liệu, request/response (đã che thông tin nhạy cảm), bước tái hiện và ảnh màn hình nếu lỗi giao diện.
- Không đánh dấu đạt nếu API trả lỗi nhưng giao diện vẫn báo lưu thành công, hoặc UI đổi trạng thái nhưng dữ liệu không còn đúng sau khi tải lại.

## Bảng đánh dấu kết quả

| Mã ca | Đạt | Không đạt | Ghi chú / lỗi |
|---|:---:|:---:|---|
| VAL-01 | [x] | ☐ | MenuItemModal kiểm tra name.trim() != '', hiển thị 'Vui lòng nhập tên món', không đóng modal và không gọi API |
| VAL-02 | [x] | ☐ | MenuItemModal kiểm tra categoryId bắt buộc, hiển thị 'Vui lòng chọn danh mục', chặn gọi API lưu |
| VAL-03 | [x] | ☐ | MenuItemModal kiểm tra giá bán > 0, hiển thị 'Giá bán phải lớn hơn 0đ' khi nhập <= 0 |
| VAL-04 | [x] | ☐ | MenuItemModal tự động trim khoảng trắng tên món, ép kiểu số dương hợp lệ trước khi gửi |
| VAL-05 | [x] | ☐ | OptionGroupModal kiểm tra tên nhóm bắt buộc, hiển thị 'Vui lòng nhập tên nhóm tùy chọn' |
| VAL-06 | [x] | ☐ | OptionGroupModal yêu cầu danh sách options.length >= 1, chặn lưu khi chưa có lựa chọn |
| VAL-07 | [x] | ☐ | OptionGroupModal kiểm tra ô tên lựa chọn mới trước khi thêm, không tăng mảng options nếu trống |
| VAL-08 | [x] | ☐ | Settings tab tài khoản validate độc lập Họ và tên / Số điện thoại, báo lỗi trường tương ứng |
| VAL-09 | [x] | ☐ | Settings đổi mật khẩu kiểm tra đầy đủ: hiện tại bắt buộc, mới >= 6 ký tự, khác mật khẩu cũ, xác nhận khớp |
| VAL-10 | [x] | ☐ | Settings SePay chặn gửi request khi API Key trống hoặc chỉ chứa khoảng trắng |
| VAL-11 | [x] | ☐ | MenuItemModal chặn tệp không phải ảnh và tệp vượt quá giới hạn 2MB (chỉ chấp nhận JPG/PNG/WEBP) |
| FUNC-01 | [x] | ☐ | Thao tác Thêm, Sửa (tên/giá) và Xóa món kiểm thử hoạt động chính xác, danh sách và liên kết đồng bộ |
| FUNC-02 | [x] | ☐ | Tự sinh mã món chữ hoa không dấu chuẩn cú pháp khi để trống (ví dụ: 'Bạc xỉu kem' -> 'BAC_XIU_KEM') |
| FUNC-03 | [x] | ☐ | Checkbox 'Đang có sẵn để bán' trong modal cập nhật đúng trạng thái và giữ nguyên sau khi tải lại |
| FUNC-04 | [x] | ☐ | Nút chuyển đổi trạng thái bán trên thẻ món gọi PATCH /api/menu/{id}/availability thành công, UI đổi 'Hết món' / 'Đang bán' |
| FUNC-05 | [x] | ☐ | Tìm kiếm theo tên/mã và bộ lọc danh mục hoạt động đồng thời; xóa bộ lọc hiển thị lại danh sách đầy đủ |
| FUNC-06 | [x] | ☐ | Tạo và sửa nhóm tùy chọn SINGLE/MULTIPLE, min/max, extra_price, default được lưu và hiển thị chuẩn |
| FUNC-07 | [x] | ☐ | Checkbox kích hoạt nhóm tùy chọn cập nhật ngay lập tức và duy trì trạng thái sau khi tải lại trang |
| FUNC-08 | [x] | ☐ | Nhóm SINGLE chỉ cho phép tối đa 1 lựa chọn mặc định; nhóm MULTIPLE cho phép nhiều mặc định độc lập |
| FUNC-09 | [x] | ☐ | Gắn nhóm tùy chọn vào món, cấu hình required/maxSelect/thứ tự và gỡ bỏ nhóm lưu đúng vào CSDL |
| FUNC-10 | [x] | ☐ | Lọc nhóm tùy chọn theo từ khóa tìm kiếm và trạng thái (Tất cả / Bắt buộc / Không bắt buộc) chính xác |
| FUNC-11 | [x] | ☐ | Checkbox in Wi-Fi trên hóa đơn: khi bật hiển thị tên + mật khẩu Wi-Fi trên bill xem trước, khi tắt thì ẩn đi |
| FUNC-12 | [x] | ☐ | Thay đổi checkbox Wi-Fi chỉ được ghi nhận vào CSDL sau khi nhấn 'Lưu cài đặt'; tải lại khi chưa lưu sẽ hoàn tác |
| FUNC-13 | [x] | ☐ | Thông tin in hóa đơn (tên quán, địa chỉ, hotline, Wi-Fi, câu cảm ơn) lưu thành công và hiển thị đúng trên bản xem trước |
| FUNC-14 | [x] | ☐ | Lịch sử đơn hàng: bộ lọc trạng thái, ngày, từ khóa hoạt động mượt; chuyển đổi 'Dạng Thẻ' và 'Dạng Bảng' nhất quán |
| FUNC-15 | [x] | ☐ | Tiến trình phục vụ đơn chuyển tuần tự: NEW -> PREPARING -> READY_FOR_PICKUP -> COMPLETED chuẩn xác |
| FUNC-16 | [x] | ☐ | Hủy đơn ghi nhận lý do, tiền hoàn; đơn NEW không hao hụt, đơn PREPARING tính lỗ toàn bộ đơn (KPI tách biệt) |
| FUNC-17 | [x] | ☐ | Cuộn danh sách độc lập: thanh điều hướng, tiêu đề, bộ lọc đứng yên; chỉ vùng danh sách cuộn mượt (thanh cuộn vàng ấm) |
| FUNC-18 | [x] | ☐ | Bố cục Cài đặt hiển thị vừa vặn 1 khung hình trên desktop 1920x1080; checkbox và nhãn Wi-Fi dễ click |
| FUNC-19 | [x] | ☐ | Xử lý lỗi tải dữ liệu: hiển thị thông báo lỗi, kết thúc trạng thái loading, không bị treo spinner vô hạn |
| LOGIC-01 | [x] | ☐ | Tính toán tiền đơn: đơn giá dòng = base + phụ thu, tổng dòng = đơn giá * SL, tiền thối = tiền khách - tổng đơn (OrderPricingTest pass) |
| LOGIC-02 | [x] | ☐ | Từ chối tạo đơn khi số lượng món <= 0 hoặc vượt giới hạn số nguyên (OrderBusinessLogicTest pass) |
| LOGIC-03 | [x] | ☐ | Bắt buộc chọn đúng số lượng tùy chọn theo min/max của nhóm; từ chối option không thuộc món (OrderBusinessLogicTest pass) |
| LOGIC-04 | [x] | ☐ | Chặn tạo đơn khi payload chứa tùy chọn trùng lặp (OrderBusinessLogicTest pass) |
| LOGIC-05 | [x] | ☐ | Bắt buộc phương thức tiền mặt và tiền khách đưa >= tổng tiền đơn; chặn thanh toán thiếu (OrderBusinessLogicTest pass) |
| LOGIC-06 | [x] | ☐ | Trạng thái đơn chỉ chuyển theo đúng thứ tự (NEW -> PREPARING -> READY -> COMPLETED); chặn nhảy cóc hoặc quay lui |
| LOGIC-07 | [x] | ☐ | Chặn hủy đơn đã ở trạng thái hoàn tất (COMPLETED) hoặc đơn đã bị hủy (CANCELLED) |
| LOGIC-08 | [x] | ☐ | Tiền hoàn hợp lệ trong khoảng [0, tổng đơn], bắt buộc có lý do; phân loại hao hụt theo trạng thái lúc hủy |
| API-01 | [x] | ☐ | Settings private trả 401 khi chưa login, 403 khi thiếu CSRF token; endpoint public trả 200 (AuthApiTest pass) |
| API-02 | [x] | ☐ | GET/PUT /api/settings/shop đọc và lưu chính xác thông tin quán, bao gồm trường show_wifi_on_receipt boolean |
| API-03 | [x] | ☐ | PUT /api/settings/shop validate tên quán rỗng/khoảng trắng trả mã lỗi 400 Bad Request |
| API-04 | [x] | ☐ | /api/settings/sepay chặn key < 4 ký tự trả 400; key hợp lệ lưu hash bcrypt, test connection trả 200 không lộ secret (SepaySettingsApiTest pass) |
| API-05 | [x] | ☐ | GET /api/menu, /categories, /options, /product-option-groups trả cấu trúc JSON đầy đủ, khớp CSDL |
| API-06 | [x] | ☐ | POST /api/menu tạo món mới (200), PUT /api/menu/{id} cập nhật thành công (CatalogApiTest pass) |
| API-07 | [x] | ☐ | POST /api/menu từ chối món thiếu tên, giá <= 0 hoặc categoryId không tồn tại trả 400 (CatalogApiTest pass) |
| API-08 | [x] | ☐ | PATCH /api/menu/{id}/availability đảo trạng thái; DELETE xóa món thành công; ID không tồn tại trả 404 |
| API-09 | [x] | ☐ | POST/PUT /api/options tạo và cập nhật nhóm kèm danh sách lựa chọn và phụ thu chính xác |
| API-10 | [x] | ☐ | POST/PUT /api/options trả 400 khi tên nhóm rỗng hoặc phụ thu âm; rollback giao dịch an toàn |
| API-11 | [x] | ☐ | Xóa nhóm tùy chọn tự động cascade dọn dẹp liên kết product_option_groups; ID không tồn tại trả 404 |
| API-12 | [x] | ☐ | POST /api/orders tạo đơn thành công (201), sinh mã QN-xxxxxx, trạng thái PAID/NEW, lưu item và options chuẩn |
| API-13 | [x] | ☐ | POST /api/orders trả 400 khi giỏ trống/số lượng sai/tiền thiếu; trả 422 khi phương thức khác TIEN_MAT |
| API-14 | [x] | ☐ | POST /api/orders kiểm tra ranh giới min/max options, chặn option không thuộc món trả 400 |
| API-15 | [x] | ☐ | PATCH /api/orders/{id}/fulfillment-status chuyển hợp lệ trả 200, sai thứ tự trả 409, sai ID trả 404 |
| API-16 | [x] | ☐ | POST /api/orders/{id}/cancel validate lý do & tiền hoàn trả 400; hủy đơn đã xong trả 409; hợp lệ trả 200 kèm ghi nhận loss |
| API-17 | [x] | ☐ | GET /api/orders và GET /api/orders/{id} trả dữ liệu nhất quán về items, options, refund, loss; ID sai trả 404 |


