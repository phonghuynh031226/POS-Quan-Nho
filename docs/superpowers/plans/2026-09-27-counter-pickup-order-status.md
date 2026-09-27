# Counter Pickup Order Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay vòng đời “đã giao” bằng quy trình bán tại quầy: mới nhận, đang chuẩn bị, chờ khách nhận, hoàn tất và đã hủy.

**Architecture:** Giữ `orders.status` và `payment_status` cho nghiệp vụ đơn/thanh toán, thêm `orders.fulfillment_status` cho tiến độ làm món. Backend kiểm soát state machine và frontend chỉ hiển thị hành động hợp lệ, nhờ đó báo cáo doanh thu không bị phụ thuộc vào tiến độ chế biến.

**Tech Stack:** PostgreSQL 18, Java 17+, Spring Boot 4.1.1, JdbcTemplate, JUnit 5/MockMvc, React 19, Axios, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-27-counter-pickup-order-status-design.md`

## Global Constraints

- Không khôi phục trang Nhân viên, Bếp hoặc Tra cứu đơn.
- Chủ quán chuyển trạng thái trực tiếp tại trang Đơn hàng.
- Trạng thái chỉ đi xuôi `NEW → PREPARING → READY_FOR_PICKUP → COMPLETED`.
- `CANCELLED` chỉ được đặt qua nghiệp vụ hủy và chỉ trước `COMPLETED`.
- Dữ liệu cũ không được xuất hiện lại trong hàng chờ chế biến.
- Doanh thu dựa trên thanh toán/hủy; chỉ KPI phục vụ dựa trên `fulfillment_status`.

## Review Focus

- Hai yêu cầu chuyển trạng thái đồng thời: chỉ một yêu cầu được cập nhật, yêu cầu còn lại nhận `409`.
- Body thiếu, null hoặc trạng thái không thuộc enum: API trả `400`, không phát sinh lỗi `500`.
- Đơn đã hủy hoặc đã hoàn tất: mọi yêu cầu chuyển trạng thái tiếp theo trả `409`.
- Dữ liệu lịch sử trước migration: đơn hủy thành `CANCELLED`, mọi đơn còn lại thành `COMPLETED`.
- Khi API cập nhật thất bại: frontend giữ badge hiện tại, mở lại nút và hiển thị toast lỗi.

---

### Task 1: Persistence contract and migration

**Files:**
- Create: `Quan-Nho-Backend/database/migrations/2026-09-27_add_fulfillment_status.sql`
- Create: `Quan-Nho-Backend/src/main/java/com/quannho/pos/order/FulfillmentStatus.java`
- Modify: `Quan-Nho-Backend/database/database.sql`
- Modify: `Quan-Nho-Backend/database/quan_nho_database.sql`
- Modify: `Quan-Nho-Backend/src/main/java/com/quannho/pos/order/Order.java`
- Test: `Quan-Nho-Backend/src/test/java/com/quannho/pos/EntityMappingTest.java`

**Interfaces:**
- Produces: enum `FulfillmentStatus { NEW, PREPARING, READY_FOR_PICKUP, COMPLETED, CANCELLED }` and non-null column `orders.fulfillment_status`.
- Migration is idempotent and maps old rows from `orders.status` before adding the final check constraint.

- [ ] **Step 1: Write the failing entity mapping test**

Add `orderMapsFulfillmentStatus()` asserting the `Order.fulfillmentStatus` field exists, is annotated `@Enumerated(EnumType.STRING)`, maps to `fulfillment_status`, and defaults to `FulfillmentStatus.NEW`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `.\mvnw.cmd -Dtest=EntityMappingTest test`

Expected: FAIL because `Order.fulfillmentStatus` and `FulfillmentStatus` do not exist.

- [ ] **Step 3: Add the enum, entity field, baseline schema and idempotent migration**

The migration must add the column nullable, backfill `CANCELLED` or `COMPLETED`, set default `NEW`, set `NOT NULL`, then add `chk_orders_fulfillment_status` for the five exact values. Both baseline schema files define the final column and constraint directly.

- [ ] **Step 4: Apply and verify the migration against local PostgreSQL**

Run the migration on `POS_QUAN_NHO`, then query `information_schema.columns` and `pg_constraint`.

Expected: column is non-null with default `NEW`; constraint exists; all current rows contain `COMPLETED` or `CANCELLED`.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `.\mvnw.cmd -Dtest=EntityMappingTest test`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add Quan-Nho-Backend/database Quan-Nho-Backend/src/main/java/com/quannho/pos/order/FulfillmentStatus.java Quan-Nho-Backend/src/main/java/com/quannho/pos/order/Order.java Quan-Nho-Backend/src/test/java/com/quannho/pos/EntityMappingTest.java
git commit -m "feat: add order fulfillment status persistence"
```

### Task 2: Backend fulfillment state machine

**Files:**
- Modify: `Quan-Nho-Backend/src/main/java/com/quannho/pos/order/OrderController.java`
- Modify: `Quan-Nho-Backend/src/test/java/com/quannho/pos/order/OrderApiTest.java`

**Interfaces:**
- Consumes: `FulfillmentStatus` and `orders.fulfillment_status` from Task 1.
- Produces: `PATCH /api/orders/{id}/fulfillment-status` with body `{ "status": string }`; every order response contains camel-case `fulfillmentStatus`.

- [ ] **Step 1: Write failing API tests**

Add tests asserting: a created order returns `NEW`; valid transitions return `PREPARING`, `READY_FOR_PICKUP`, then `COMPLETED`; skipping/reversing a step returns `409`; null/unknown status returns `400`; completed/cancelled updates return `409`; concurrent updates use `UPDATE ... WHERE fulfillment_status=?` so the loser returns `409`.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `.\mvnw.cmd -Dtest=OrderApiTest test`

Expected: FAIL because responses currently force `DA_GIAO` and the PATCH endpoint does not exist.

- [ ] **Step 3: Return the persisted fulfillment state and create orders as `NEW`**

In `one(long id)`, map `row.get("fulfillment_status")` directly to `fulfillmentStatus`. Add `fulfillment_status='NEW'` to the order insert; keep `status='COMPLETED'` and `payment_status='PAID'`.

- [ ] **Step 4: Implement the guarded PATCH transition**

Add `updateFulfillmentStatus(long id, Map<String,Object> body)` and a private next-state mapping. Validate the input, update atomically using both `id` and expected current state, and return `409` when the row count is zero because another request won or the transition is invalid.

- [ ] **Step 5: Correct cancellation rules and atomic updates**

Allow cancellation only for `NEW`, `PREPARING`, or `READY_FOR_PICKUP`; reject `COMPLETED`/`CANCELLED`. The existing transaction must set both `status='CANCELLED'` and `fulfillment_status='CANCELLED'` while preserving refund validation.

- [ ] **Step 6: Run the focused tests and verify GREEN**

Run: `.\mvnw.cmd -Dtest=OrderApiTest test`

Expected: all `OrderApiTest` tests PASS.

- [ ] **Step 7: Commit**

```bash
git add Quan-Nho-Backend/src/main/java/com/quannho/pos/order/OrderController.java Quan-Nho-Backend/src/test/java/com/quannho/pos/order/OrderApiTest.java
git commit -m "feat: enforce counter pickup order workflow"
```

### Task 3: Frontend order workflow domain and API

**Files:**
- Modify: `Quan-Nho-Frontend/src/constants/index.js`
- Modify: `Quan-Nho-Frontend/src/utils/orderActions.js`
- Modify: `Quan-Nho-Frontend/src/api/orderApi.js`
- Modify: `Quan-Nho-Frontend/tests/order-actions.test.mjs`
- Modify: `Quan-Nho-Frontend/tests/real-api-wiring.test.mjs`

**Interfaces:**
- Consumes: backend states and PATCH endpoint from Task 2.
- Produces: `FULFILLMENT_STATUS`, `getNextFulfillmentAction(order)`, `canCancelOrder(order)`, and `orderApi.updateFulfillmentStatus(id, status)`.

- [ ] **Step 1: Write failing domain tests**

Assert exact labels/actions: `NEW/Mới nhận/Bắt đầu làm`, `PREPARING/Đang chuẩn bị/Làm xong`, `READY_FOR_PICKUP/Chờ khách nhận/Khách đã nhận`, `COMPLETED/Hoàn tất/no action`, `CANCELLED/Đã hủy/no action`. Assert cancellation is true only for the first three states and unknown/null states expose no action.

- [ ] **Step 2: Write the failing API wiring test**

Assert `updateFulfillmentStatus(12, 'PREPARING')` performs `PATCH /orders/12/fulfillment-status` with `{ status: 'PREPARING' }` and returns `response.data`.

- [ ] **Step 3: Run the focused frontend tests and verify RED**

Run: `node --test --test-isolation=none tests/order-actions.test.mjs tests/real-api-wiring.test.mjs`

Expected: FAIL because the new constants, helper and API method do not exist.

- [ ] **Step 4: Implement the constants, pure helpers and API method**

Remove the old `CHO_LAM`, `DANG_LAM`, `SAN_SANG`, `DA_GIAO`, `DA_HUY` compatibility entries from the active order workflow. Keep payment/order status constants separate.

- [ ] **Step 5: Run the focused frontend tests and verify GREEN**

Run: `node --test --test-isolation=none tests/order-actions.test.mjs tests/real-api-wiring.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add Quan-Nho-Frontend/src/constants/index.js Quan-Nho-Frontend/src/utils/orderActions.js Quan-Nho-Frontend/src/api/orderApi.js Quan-Nho-Frontend/tests/order-actions.test.mjs Quan-Nho-Frontend/tests/real-api-wiring.test.mjs
git commit -m "feat: add frontend pickup workflow domain"
```

### Task 4: Order History interaction and copy

**Files:**
- Modify: `Quan-Nho-Frontend/src/pages/OrderHistory/index.jsx`
- Modify: `Quan-Nho-Frontend/tests/order-actions.test.mjs`
- Create: `Quan-Nho-Frontend/tests/order-history-status.test.mjs`

**Interfaces:**
- Consumes: `FULFILLMENT_STATUS`, `getNextFulfillmentAction`, `canCancelOrder`, and `orderApi.updateFulfillmentStatus` from Task 3.
- Produces: owner-facing status filters, badges, KPIs and one guarded transition button per order card/table row.

- [ ] **Step 1: Write the failing page contract test**

Assert the page source contains the six new tab labels and calls `updateFulfillmentStatus`; assert it no longer contains user-facing `Chờ làm`, `Sẵn sàng`, `Đã giao`, or KPI `Đã giao xong`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test --test-isolation=none tests/order-history-status.test.mjs`

Expected: FAIL on the legacy labels and missing update call.

- [ ] **Step 3: Replace filters, counts, badges and KPI copy**

Use the five persisted states. Compute completed count from `COMPLETED`, cancelled count/refunds from `CANCELLED`, and keep revenue tied to non-cancelled paid orders.

- [ ] **Step 4: Add the transition action with pending/error handling**

Track the updating order ID; disable only that order's button; call the API; on success reload orders; on failure show an error toast and clear pending state without changing the local order.

- [ ] **Step 5: Align card, table and detail modal behavior**

Show the same badge and next action in both views. Hide cancellation for `COMPLETED`/`CANCELLED`; keep view and reprint available.

- [ ] **Step 6: Run the focused tests and verify GREEN**

Run: `node --test --test-isolation=none tests/order-actions.test.mjs tests/order-history-status.test.mjs`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add Quan-Nho-Frontend/src/pages/OrderHistory/index.jsx Quan-Nho-Frontend/tests/order-actions.test.mjs Quan-Nho-Frontend/tests/order-history-status.test.mjs
git commit -m "feat: manage pickup progress from order history"
```

### Task 5: Reports, documentation cleanup and full verification

**Files:**
- Modify: `Quan-Nho-Frontend/src/api/reportApi.js`
- Modify: `Quan-Nho-Frontend/src/pages/Reports/index.jsx`
- Modify: `Quan-Nho-Frontend/src/api/springBootGuide.js`
- Test: `Quan-Nho-Frontend/tests/order-history-status.test.mjs`

**Interfaces:**
- Consumes: new fulfillment states from Tasks 2–4.
- Produces: reports that exclude `CANCELLED` without treating in-progress paid orders as unpaid or invalid.

- [ ] **Step 1: Extend the failing contract test**

Assert report code recognizes `CANCELLED`, no active source refers to Vietnamese state keys, and the API guide documents the PATCH endpoint and exact English states.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test --test-isolation=none tests/order-history-status.test.mjs`

Expected: FAIL because report/guide files still reference `DA_HUY`, `DANG_LAM`, `SAN_SANG`, or `DA_GIAO`.

- [ ] **Step 3: Update report cancellation checks and API guide**

Use `fulfillmentStatus === 'CANCELLED'` for exclusion and leave payment status as the revenue source. Document the new endpoint and state sequence.

- [ ] **Step 4: Run all backend verification**

Run: `.\mvnw.cmd test`

Expected: BUILD SUCCESS with zero failures/errors.

- [ ] **Step 5: Run all frontend tests and production build**

Run: `npm test`

Expected: zero failed tests.

Run: `npm run build`

Expected: Vite build exits `0`.

- [ ] **Step 6: Perform a localhost smoke test**

Create one cash order and verify visually/API-wise: it starts at Mới nhận, progresses through all three buttons, ends at Hoàn tất, cannot be cancelled afterward, and remains included in paid revenue throughout.

- [ ] **Step 7: Commit**

```bash
git add Quan-Nho-Frontend/src/api/reportApi.js Quan-Nho-Frontend/src/pages/Reports/index.jsx Quan-Nho-Frontend/src/api/springBootGuide.js Quan-Nho-Frontend/tests/order-history-status.test.mjs
git commit -m "fix: align reports with pickup workflow"
```

