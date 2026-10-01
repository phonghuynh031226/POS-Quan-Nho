# Nền tảng POS desktop và đồng bộ đơn offline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tạo ứng dụng Windows Electron có thể lưu đơn tiền mặt an toàn vào SQLite khi mất mạng và tự đồng bộ đúng một lần lên Spring Boot/PostgreSQL khi kết nối trở lại.

**Architecture:** Electron main process sở hữu SQLite, cấu hình thiết bị và sync engine; React renderer chỉ sử dụng API giới hạn qua preload IPC. Backend nhận `clientOrderId` làm idempotency key, vì vậy mọi lần thử lại cùng một đơn đều trả về cùng một bản ghi server.

**Tech Stack:** Electron, React 19, Vite 6, Node test runner, better-sqlite3, electron-builder, Spring Boot 4.1.1, JdbcTemplate, PostgreSQL, JUnit 5.

**Spec:** `docs/superpowers/specs/2026-10-01-pos-desktop-offline-first-design.md`

## Global Constraints

- Chỉ tài khoản Chủ quán trong kế hoạch này; chưa thêm nhân viên hoặc phân quyền mới.
- Tiền mặt được tạo đơn offline; chuyển khoản không được xác nhận khi server không sẵn sàng.
- Đơn phải được commit vào SQLite trước khi UI báo thành công hoặc gửi lệnh in.
- UUID phía máy quán là idempotency key bất biến của đơn.
- Secret không nằm trong renderer, source control hoặc log.
- Sau một lần đăng nhập online thành công, Chủ quán có thể mở lại app offline bằng cùng mật khẩu trong thời hạn 7 ngày; app không lưu mật khẩu gốc.
- Không làm thay đổi luồng web hiện tại khi chạy `npm run dev`; desktop là runtime bổ sung.
- Không triển khai điều khiển máy in ESC/POS trong kế hoạch này; đó là kế hoạch kế tiếp dùng hàng đợi local đã tạo ở đây.

## Review Focus

- App bị tắt sau khi SQLite commit nhưng trước khi server trả lời: mở lại phải đồng bộ đúng một đơn, được kiểm thử ở Task 4.
- Hai lần gửi đồng thời cùng `clientOrderId`: server phải trả cùng order ID, được kiểm thử ở Task 1.
- Database local đang migration bị lỗi hoặc file hỏng: app phải dừng bán và báo lỗi có thể xử lý, được kiểm thử ở Task 2.
- Thực đơn server thay đổi khi offline: đơn local giữ snapshot tên, giá và tùy chọn lúc bán, được kiểm thử ở Task 3.
- Renderer gửi IPC payload giả mạo giá tiền/trạng thái: main process và server đều xác thực, được kiểm thử ở Task 3 và Task 1.
- App khởi động khi mất mạng sau khi phiên server hết hạn: xác thực local chỉ mở POS trong thời hạn 7 ngày và không giả lập phiên server, được kiểm thử ở Task 5.

---

## Phân rã tệp

- `Quan-Nho-Desktop/`: Electron main, preload, SQLite repositories, sync engine và bộ cài; không chứa UI nghiệp vụ.
- `Quan-Nho-Frontend/src/runtime/`: giao diện thống nhất cho browser runtime và desktop runtime.
- `Quan-Nho-Frontend/src/offline/`: điều phối lưu giỏ hàng, tạo đơn local và hiển thị trạng thái đồng bộ; không truy cập Node trực tiếp.
- `Quan-Nho-Backend/src/main/java/com/quannho/pos/order/`: hợp đồng idempotency và tạo đơn server.
- `Quan-Nho-Backend/database/migrations/`: thay đổi schema có thể áp dụng lặp an toàn.

### Task 1: API tạo đơn idempotent trên server

**Files:**
- Modify: `Quan-Nho-Backend/database/database.sql`
- Modify: `Quan-Nho-Backend/database/quan_nho_database.sql`
- Create: `Quan-Nho-Backend/database/migrations/2026-10-01_add_client_order_id.sql`
- Modify: `Quan-Nho-Backend/src/main/java/com/quannho/pos/order/Order.java`
- Modify: `Quan-Nho-Backend/src/main/java/com/quannho/pos/order/OrderController.java`
- Modify: `Quan-Nho-Backend/src/test/java/com/quannho/pos/order/OrderApiTest.java`

**Interfaces:**
- Consumes: `POST /api/orders` payload hiện tại.
- Produces: payload bắt buộc có `clientOrderId: UUID`; response có `clientOrderId`; cùng người dùng và cùng UUID luôn trả cùng đơn với HTTP 200 hoặc 201.

- [ ] **Step 1: Viết test API thất bại cho idempotency**

Thêm các test `createOrderReturnsExistingOrderForRepeatedClientOrderId`, `concurrentCreateWithSameClientOrderIdCreatesOneOrder`, `createOrderRejectsMissingOrMalformedClientOrderId` và `createOrderRepricesForgedOfflinePayload` vào `OrderApiTest`.

- [ ] **Step 2: Chạy test để xác nhận trạng thái đỏ**

Run: `cd Quan-Nho-Backend && .\mvnw.cmd -Dtest=OrderApiTest test`

Expected: FAIL vì schema và API chưa hỗ trợ `clientOrderId`.

- [ ] **Step 3: Thêm schema và migration idempotency**

Thêm `client_order_id UUID NOT NULL` và unique constraint vào bảng `orders`. Migration phải dùng kiểm tra tồn tại trước khi thêm cột/index và có hướng dẫn backfill UUID cho dữ liệu cũ trước khi đặt `NOT NULL`.

- [ ] **Step 4: Cập nhật entity và API**

Thêm `UUID clientOrderId` vào `Order`. Trong `OrderController.create`, validate UUID, tìm bản ghi hiện có trước khi tính giá, xử lý unique-constraint race bằng cách đọc lại bản ghi, và luôn lấy tên/giá/tùy chọn từ database thay vì tin snapshot client.

- [ ] **Step 5: Chạy test tập trung và toàn bộ backend**

Run: `cd Quan-Nho-Backend && .\mvnw.cmd -Dtest=OrderApiTest test`

Expected: PASS.

Run: `cd Quan-Nho-Backend && .\mvnw.cmd test`

Expected: tất cả test PASS.

- [ ] **Step 6: Commit**

```bash
git add Quan-Nho-Backend/database Quan-Nho-Backend/src/main/java/com/quannho/pos/order Quan-Nho-Backend/src/test/java/com/quannho/pos/order/OrderApiTest.java
git commit -m "feat: chống tạo trùng đơn khi đồng bộ"
```

### Task 2: Khung Electron, cấu hình và SQLite migration

**Files:**
- Create: `Quan-Nho-Desktop/package.json`
- Create: `Quan-Nho-Desktop/electron/main.js`
- Create: `Quan-Nho-Desktop/electron/preload.js`
- Create: `Quan-Nho-Desktop/electron/ipc/registerIpcHandlers.js`
- Create: `Quan-Nho-Desktop/electron/config/deviceConfig.js`
- Create: `Quan-Nho-Desktop/electron/db/openDatabase.js`
- Create: `Quan-Nho-Desktop/electron/db/migrations.js`
- Create: `Quan-Nho-Desktop/tests/database.test.mjs`
- Create: `Quan-Nho-Desktop/tests/security-boundary.test.mjs`

**Interfaces:**
- Consumes: frontend production output at `Quan-Nho-Frontend/dist`.
- Produces: `window.quanNhoDesktop.getRuntimeInfo()`, `getDeviceConfig()`, `saveDeviceConfig(input)`; SQLite schema version 1.

- [ ] **Step 1: Viết test đỏ cho migration và IPC boundary**

Kiểm thử database mới được tạo đủ bảng `local_orders`, `outbox_events`, `menu_cache`, `draft_cart`, `app_meta`; migration chạy lại không đổi dữ liệu; migration lỗi trả mã `LOCAL_DATABASE_MIGRATION_FAILED`; preload không lộ `require`, filesystem hoặc raw SQL.

- [ ] **Step 2: Chạy test để xác nhận trạng thái đỏ**

Run: `cd Quan-Nho-Desktop && npm test`

Expected: FAIL vì package và module chưa tồn tại.

- [ ] **Step 3: Khởi tạo Electron an toàn**

Tạo BrowserWindow với `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`; giới hạn navigation/new-window; chỉ nạp URL dev khi `ELECTRON_RENDERER_URL` được truyền rõ, còn production nạp file trong `dist`.

- [ ] **Step 4: Tạo database và migration version 1**

`openDatabase({ databasePath })` mở better-sqlite3, bật WAL và foreign keys, chạy migration trong transaction. Cấu hình thiết bị lưu trong `app.getPath('userData')`; secret dùng Electron `safeStorage`, không ghi plain text.

- [ ] **Step 5: Chạy test và build desktop tối thiểu**

Run: `cd Quan-Nho-Desktop && npm test`

Expected: PASS.

Run: `cd Quan-Nho-Desktop && npm run build`

Expected: tạo app unpacked, chưa yêu cầu ký số.

- [ ] **Step 6: Commit**

```bash
git add Quan-Nho-Desktop
git commit -m "feat: tạo nền tảng ứng dụng Windows và SQLite"
```

### Task 3: Local order repository và snapshot đơn

**Files:**
- Create: `Quan-Nho-Desktop/electron/orders/localOrderRepository.js`
- Create: `Quan-Nho-Desktop/electron/orders/validateOrderCommand.js`
- Create: `Quan-Nho-Desktop/tests/local-order-repository.test.mjs`
- Modify: `Quan-Nho-Desktop/electron/ipc/registerIpcHandlers.js`
- Modify: `Quan-Nho-Desktop/electron/preload.js`

**Interfaces:**
- Consumes: `CreateLocalOrderCommand { clientOrderId, paymentMethod, cashGiven, customerNote, items[] }`.
- Produces: `createLocalOrder(command) -> LocalOrder`; `listLocalOrders(filter)`; `getLocalOrder(clientOrderId)`; IPC `orders:create-local`, `orders:list-local`.

- [ ] **Step 1: Viết test đỏ cho lưu đơn nguyên tử**

Kiểm thử: đơn và outbox event được tạo cùng transaction; UUID trùng trả đơn cũ; payload không hợp lệ không ghi gì; snapshot giữ nguyên tên, giá, tùy chọn; renderer không thể gửi `SYNCED`, server ID hoặc tổng tiền tùy ý.

- [ ] **Step 2: Chạy test để xác nhận trạng thái đỏ**

Run: `cd Quan-Nho-Desktop && npm test -- tests/local-order-repository.test.mjs`

Expected: FAIL vì repository chưa tồn tại.

- [ ] **Step 3: Cài đặt validator và repository**

Validator chỉ nhận payment method `TIEN_MAT` trong chế độ offline, quantity nguyên dương, ID món/tùy chọn hợp lệ và snapshot đủ trường. Repository tự tính tổng snapshot để hiển thị local; server vẫn tính lại khi đồng bộ.

- [ ] **Step 4: Xuất API preload giới hạn**

Expose `window.quanNhoDesktop.orders.create(command)`, `.list(filter)` và `.get(clientOrderId)` bằng IPC invoke; không expose database handle.

- [ ] **Step 5: Chạy toàn bộ test desktop**

Run: `cd Quan-Nho-Desktop && npm test`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add Quan-Nho-Desktop/electron Quan-Nho-Desktop/tests
git commit -m "feat: lưu đơn offline an toàn tại máy quán"
```

### Task 4: Sync engine bền vững

**Files:**
- Create: `Quan-Nho-Desktop/electron/sync/syncEngine.js`
- Create: `Quan-Nho-Desktop/electron/sync/backoff.js`
- Create: `Quan-Nho-Desktop/electron/sync/serverClient.js`
- Create: `Quan-Nho-Desktop/tests/sync-engine.test.mjs`
- Modify: `Quan-Nho-Desktop/electron/main.js`
- Modify: `Quan-Nho-Desktop/electron/preload.js`
- Modify: `Quan-Nho-Desktop/electron/ipc/registerIpcHandlers.js`

**Interfaces:**
- Consumes: outbox `CREATE_ORDER` events và server URL/token từ device config.
- Produces: `startSyncEngine(deps)`, `syncNow()`, `getSyncStatus()` và event renderer `sync:status-changed`.

- [ ] **Step 1: Viết test đỏ cho mất mạng và crash recovery**

Kiểm thử: timeout chuyển event về `PENDING`; backoff có giới hạn; restart nhặt lại bản ghi `SYNCING` quá hạn; server trả cùng đơn đánh dấu `SYNCED`; lỗi 4xx validation chuyển `FAILED` không lặp vô hạn; app dừng sau local commit nhưng trước response không tạo bản ghi server thứ hai.

- [ ] **Step 2: Chạy test để xác nhận trạng thái đỏ**

Run: `cd Quan-Nho-Desktop && npm test -- tests/sync-engine.test.mjs`

Expected: FAIL vì sync engine chưa tồn tại.

- [ ] **Step 3: Cài đặt server client và backoff**

`serverClient.createOrder(localOrder)` gửi `clientOrderId` và payload order. Backoff dùng các mốc 5 giây, 15 giây, 60 giây, 5 phút và tối đa 15 phút; sự kiện mới hoặc nút thử lại được phép đánh thức hàng đợi sớm.

- [ ] **Step 4: Cài đặt sync engine và trạng thái quan sát**

Mỗi lần chỉ claim một event bằng transaction. Lưu `attempt_count`, `next_attempt_at`, `last_error_code`, `last_error_message`, `server_order_id`, `synced_at`. Phát snapshot `{ online, pendingCount, failedCount, lastSyncedAt, lastError }` cho renderer.

- [ ] **Step 5: Chạy toàn bộ test desktop**

Run: `cd Quan-Nho-Desktop && npm test`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add Quan-Nho-Desktop/electron Quan-Nho-Desktop/tests
git commit -m "feat: tự đồng bộ đơn offline khi có mạng"
```

### Task 5: Runtime adapter và POS offline trên React

**Files:**
- Create: `Quan-Nho-Desktop/electron/auth/deviceAuthRepository.js`
- Create: `Quan-Nho-Desktop/tests/device-auth.test.mjs`
- Modify: `Quan-Nho-Desktop/electron/preload.js`
- Modify: `Quan-Nho-Desktop/electron/ipc/registerIpcHandlers.js`
- Create: `Quan-Nho-Frontend/src/runtime/runtime.js`
- Create: `Quan-Nho-Frontend/src/runtime/browserRuntime.js`
- Create: `Quan-Nho-Frontend/src/runtime/desktopRuntime.js`
- Create: `Quan-Nho-Frontend/src/offline/orderSubmission.js`
- Create: `Quan-Nho-Frontend/src/offline/offlineAuth.js`
- Create: `Quan-Nho-Frontend/src/hooks/useSyncStatus.js`
- Create: `Quan-Nho-Frontend/src/components/common/SyncStatusIndicator.jsx`
- Modify: `Quan-Nho-Frontend/src/context/AuthContext.jsx`
- Modify: `Quan-Nho-Frontend/src/pages/Login/index.jsx`
- Modify: `Quan-Nho-Frontend/src/components/pos/PaymentModal.jsx`
- Modify: `Quan-Nho-Frontend/src/pages/Pos/index.jsx`
- Modify: `Quan-Nho-Frontend/src/components/layout/Navbar.jsx`
- Create: `Quan-Nho-Frontend/tests/desktop-runtime.test.mjs`
- Create: `Quan-Nho-Frontend/tests/offline-order-submission.test.mjs`

**Interfaces:**
- Consumes: preload API từ Task 2–4 và `orderApi.createOrder` trong browser runtime.
- Produces: `runtime.orders.create(command)`, `runtime.sync.getStatus()`, `runtime.sync.subscribe(listener)`, `runtime.auth.cacheOwnerVerifier(input)` và `runtime.auth.verifyOffline(input)`; kết quả đơn có `syncStatus` và `clientOrderId`.

- [ ] **Step 1: Viết test đỏ cho hai runtime và quy tắc thanh toán**

Kiểm thử: browser vẫn gọi API hiện tại; desktop ghi local trước; UUID được tạo một lần; offline từ chối `CHUYEN_KHOAN` bằng thông báo tiếng Việt; tiền mặt trả đơn local để mở bill; bấm hai lần dùng cùng command đang xử lý; navbar hiện số đơn chờ và lỗi sync. Bổ sung test đăng nhập online tạo verifier local, mật khẩu gốc không được lưu, mật khẩu sai bị từ chối, verifier quá 7 ngày bị từ chối và offline login không được coi là phiên server để đồng bộ.

- [ ] **Step 2: Chạy test để xác nhận trạng thái đỏ**

Run: `cd Quan-Nho-Frontend && node --test --experimental-test-isolation=none tests/desktop-runtime.test.mjs tests/offline-order-submission.test.mjs`

Expected: FAIL vì runtime adapter chưa tồn tại.

Run: `cd Quan-Nho-Desktop && node --test --experimental-test-isolation=none tests/device-auth.test.mjs`

Expected: FAIL vì device auth repository chưa tồn tại.

- [ ] **Step 3: Cài đặt runtime adapter**

Chọn desktop runtime khi `window.quanNhoDesktop` tồn tại; nếu không dùng browser runtime. Component không được tự kiểm tra Electron hoặc gọi IPC trực tiếp.

- [ ] **Step 4: Cài đặt xác thực Chủ quán khi offline**

Sau login online thành công, main process dùng `crypto.scrypt` với salt ngẫu nhiên để lưu verifier mật khẩu cùng profile Chủ quán và `verifiedAt`; dữ liệu nhạy cảm được bọc bằng Electron `safeStorage`. Khi server không truy cập được, Login cho phép kiểm tra local trong tối đa 7 ngày. Phiên này chỉ mở các chức năng local; sync engine giữ hàng đợi cho tới khi server session được xác thực lại.

- [ ] **Step 5: Chuyển PaymentModal sang order submission chung**

Tạo command bất biến khi người dùng xác nhận, khóa nút trong lúc lưu, mở bill sau khi local create thành công và giữ giỏ hàng nếu lưu thất bại. Hiển thị rõ “Đã lưu tại máy, đang chờ đồng bộ” cho đơn offline.

- [ ] **Step 6: Thêm chỉ báo sync toàn cục**

Hiển thị Online/Offline, số đơn chờ, số lỗi và nút “Thử lại”. Không dùng màu đơn lẻ; luôn có chữ và biểu tượng.

- [ ] **Step 7: Chạy test và build frontend**

Run: `cd Quan-Nho-Frontend && node --test --experimental-test-isolation=none tests/*.test.mjs`

Expected: tất cả test PASS.

Run: `cd Quan-Nho-Frontend && npm run build`

Expected: build PASS.

Run: `cd Quan-Nho-Desktop && npm test`

Expected: tất cả test PASS.

- [ ] **Step 8: Commit**

```bash
git add Quan-Nho-Desktop/electron Quan-Nho-Desktop/tests Quan-Nho-Frontend/src/runtime Quan-Nho-Frontend/src/offline Quan-Nho-Frontend/src/hooks Quan-Nho-Frontend/src/components Quan-Nho-Frontend/src/context Quan-Nho-Frontend/src/pages Quan-Nho-Frontend/tests
git commit -m "feat: cho phép bán tiền mặt khi mất mạng"
```

### Task 6: Tự lưu giỏ hàng và cache thực đơn

**Files:**
- Create: `Quan-Nho-Desktop/electron/menu/menuCacheRepository.js`
- Create: `Quan-Nho-Desktop/electron/cart/draftCartRepository.js`
- Create: `Quan-Nho-Desktop/tests/menu-cart-cache.test.mjs`
- Modify: `Quan-Nho-Desktop/electron/preload.js`
- Modify: `Quan-Nho-Desktop/electron/ipc/registerIpcHandlers.js`
- Modify: `Quan-Nho-Frontend/src/runtime/desktopRuntime.js`
- Modify: `Quan-Nho-Frontend/src/pages/Pos/index.jsx`
- Create: `Quan-Nho-Frontend/tests/pos-offline-cache.test.mjs`

**Interfaces:**
- Consumes: menu/category response hiện tại và cart line model hiện tại.
- Produces: `runtime.menu.load()`, `runtime.menu.refresh()`, `runtime.cart.loadDraft()`, `runtime.cart.saveDraft(cart)`, `runtime.cart.clearDraft()`.

- [ ] **Step 1: Viết test đỏ cho cache và khôi phục sau restart**

Kiểm thử: tải online ghi cache atomically; offline trả cache cuối; chưa từng cache thì báo không thể bán; draft cart debounce nhưng flush khi đóng cửa sổ; đơn thành công mới xóa draft; snapshot đơn không đổi khi menu cache được cập nhật.

- [ ] **Step 2: Chạy test để xác nhận trạng thái đỏ**

Run: `cd Quan-Nho-Desktop && npm test -- tests/menu-cart-cache.test.mjs`

Run: `cd Quan-Nho-Frontend && node --test --experimental-test-isolation=none tests/pos-offline-cache.test.mjs`

Expected: FAIL vì cache repository chưa tồn tại.

- [ ] **Step 3: Cài đặt cache repository và IPC**

Menu cache thay thế theo transaction và lưu `fetched_at`, `server_version`. Draft cart chỉ có một bản hiện hành, có `updated_at` và schema version.

- [ ] **Step 4: Tích hợp POS**

POS hiển thị cache ngay, refresh nền khi online, phục hồi draft sau restart và báo thời điểm thực đơn cập nhật gần nhất. Khi chưa có cache và server offline, chặn bán với hướng dẫn kết nối mạng lần đầu.

- [ ] **Step 5: Chạy toàn bộ test desktop/frontend và build**

Run: `cd Quan-Nho-Desktop && npm test`

Run: `cd Quan-Nho-Frontend && node --test --experimental-test-isolation=none tests/*.test.mjs`

Run: `cd Quan-Nho-Frontend && npm run build`

Expected: tất cả PASS.

- [ ] **Step 6: Commit**

```bash
git add Quan-Nho-Desktop Quan-Nho-Frontend/src Quan-Nho-Frontend/tests
git commit -m "feat: khôi phục giỏ hàng và thực đơn khi offline"
```

### Task 7: Màn hình phụ native và bộ cài thử nghiệm

**Files:**
- Create: `Quan-Nho-Desktop/electron/display/customerDisplayWindow.js`
- Create: `Quan-Nho-Desktop/tests/customer-display-window.test.mjs`
- Modify: `Quan-Nho-Desktop/electron/main.js`
- Modify: `Quan-Nho-Desktop/electron/preload.js`
- Modify: `Quan-Nho-Frontend/src/utils/customerDisplaySync.js`
- Modify: `Quan-Nho-Desktop/package.json`
- Create: `Quan-Nho-Desktop/README.md`

**Interfaces:**
- Consumes: `sendDisplayState(payload)` hiện tại và danh sách màn hình từ Electron `screen` API.
- Produces: cửa sổ `/display` trên màn hình phụ; IPC `display:update`, `display:list-screens`, `display:select-screen`; bộ cài Windows unsigned dành cho chạy thử nội bộ.

- [ ] **Step 1: Viết test đỏ cho lựa chọn màn hình và truyền trạng thái**

Kiểm thử: ưu tiên màn hình đã cấu hình; fallback sang màn hình thứ hai; không có màn hình phụ thì không crash; payload display được validate; đóng/mở lại giữ màn hình đã chọn; mất Internet vẫn cập nhật display qua IPC.

- [ ] **Step 2: Chạy test để xác nhận trạng thái đỏ**

Run: `cd Quan-Nho-Desktop && npm test -- tests/customer-display-window.test.mjs`

Expected: FAIL vì window manager chưa tồn tại.

- [ ] **Step 3: Cài đặt customer display window**

Cửa sổ không có quyền Node, mở đúng route `/display`, full-screen trên màn hình chọn và nhận state từ main process. Browser runtime tiếp tục dùng BroadcastChannel/localStorage để không phá chế độ web.

- [ ] **Step 4: Cấu hình electron-builder**

Tạo target NSIS x64, app ID ổn định, tên `POS Quán Nhỏ`, thư mục userData ổn định và artifact có version. Không nhúng secret hoặc URL production cố định vào bundle.

- [ ] **Step 5: Viết hướng dẫn chạy thử**

`Quan-Nho-Desktop/README.md` mô tả cài Node, build frontend, chạy desktop dev, tạo installer, cấu hình URL server và chọn màn hình phụ. Ghi rõ bộ cài chưa ký số chỉ dùng nội bộ.

- [ ] **Step 6: Chạy verification toàn dự án**

Run: `cd Quan-Nho-Backend && .\mvnw.cmd test`

Run: `cd Quan-Nho-Frontend && node --test --experimental-test-isolation=none tests/*.test.mjs`

Run: `cd Quan-Nho-Frontend && npm run build`

Run: `cd Quan-Nho-Desktop && npm test`

Run: `cd Quan-Nho-Desktop && npm run build`

Expected: mọi lệnh PASS và tạo được installer Windows.

- [ ] **Step 7: Kiểm thử thủ công bắt buộc trên máy Windows**

Chạy các kịch bản: online tạo đơn; ngắt mạng tạo ba đơn tiền mặt; đóng app; mở lại khi vẫn offline; nối mạng; xác nhận server chỉ có ba đơn; màn hình phụ cập nhật xuyên suốt; QR không thể xác nhận khi offline.

- [ ] **Step 8: Commit**

```bash
git add Quan-Nho-Desktop Quan-Nho-Frontend/src/utils/customerDisplaySync.js
git commit -m "feat: đóng gói bản POS Windows chạy thử"
```

## Các kế hoạch tiếp theo

Sau khi nền tảng này chạy thử ổn định, viết và duyệt riêng:

1. `ESC/POS USB printing`: hàng đợi in bền vững, bill khách/bếp, in lại và xử lý hết giấy.
2. `Shift and cash reconciliation`: mở/đóng ca, tiền đầu ca, doanh thu tiền mặt và chênh lệch.
3. `Desktop update and recovery`: cập nhật có rollback, backup local và gói hỗ trợ lỗi.
4. `Staff PIN and audit`: nhân viên, quyền, PIN, nhật ký thao tác và ca theo người dùng.
