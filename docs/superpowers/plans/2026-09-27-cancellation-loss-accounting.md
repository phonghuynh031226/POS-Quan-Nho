# Cancellation Loss Accounting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically classify cancelled orders as no-material-loss or full-order-loss based on the fulfillment state at cancellation time, persist the audit trail, and expose the totals in the UI, reports, and Excel exports.

**Architecture:** PostgreSQL stores the pre-cancellation state, server-owned loss classification, and server-calculated loss amount. The cancellation endpoint performs one guarded atomic update so clients cannot forge loss figures. Frontend presentation derives only the pre-submit preview; persisted API values remain the source of truth for order history and reporting.

**Tech Stack:** PostgreSQL 18, Java 23, Spring Boot 4, JdbcTemplate/JPA mapping, React 19, Node test runner, `xlsx-js-style`.

**Spec:** `docs/superpowers/specs/2026-09-27-cancellation-loss-accounting-design.md`

## Global Constraints

- `NEW` cancellation produces `NO_MATERIAL_LOSS` and `loss_amount = 0`.
- `PREPARING` and `READY_FOR_PICKUP` cancellation produce `FULL_ORDER_LOSS` and `loss_amount = total_amount`.
- `COMPLETED` and `CANCELLED` cannot be cancelled.
- Backend alone calculates and persists loss classification and amount; frontend request values cannot override them.
- `refund_amount` and `loss_amount` remain distinct report metrics.
- Historical cancelled rows remain unclassified with `loss_amount = 0` when their prior fulfillment state cannot be proven.
- Ingredient cost accounting, paper cost accounting, and manually editable loss are out of scope.

## Review Focus

- A request containing forged `lossAmount` or `cancellationLossType` must be ignored and server-calculated values returned; covered by Task 2 API tests.
- Two concurrent cancellation requests must not both update the order; covered by Task 2 guarded-update test.
- A legacy cancelled row with null classification must not be counted as either known loss category; covered by Task 3 report aggregation test.
- Missing or string-form numeric fields in report input must safely aggregate to zero/number without `NaN`; covered by Task 3 report aggregation test.
- Excel export with no cancelled orders must still render all loss rows with zero values and valid formatting; covered by Task 4 workbook test.

---

### Task 1: Persist cancellation loss audit data

**Files:**
- Create: `Quan-Nho-Backend/src/main/java/com/quannho/pos/order/CancellationLossType.java`
- Create: `Quan-Nho-Backend/database/migrations/2026-09-27_add_cancellation_loss_accounting.sql`
- Modify: `Quan-Nho-Backend/src/main/java/com/quannho/pos/order/Order.java`
- Modify: `Quan-Nho-Backend/database/database.sql`
- Modify: `Quan-Nho-Backend/database/quan_nho_database.sql`
- Test: `Quan-Nho-Backend/src/test/java/com/quannho/pos/EntityMappingTest.java`

**Interfaces:**
- Consumes: existing `FulfillmentStatus` values and `orders.total_amount`.
- Produces: enum `CancellationLossType { NO_MATERIAL_LOSS, FULL_ORDER_LOSS }`; nullable `cancelledFromStatus`; nullable `cancellationLossType`; non-null `long lossAmount` defaulting to zero.

- [ ] **Step 1: Write the failing entity mapping test**

Add `orderMapsCancellationLossAuditFields()` asserting `Order` exposes fields `cancelledFromStatus`, `cancellationLossType`, and `lossAmount`, with the two enum values exactly matching the spec.

- [ ] **Step 2: Run the mapping test and verify RED**

Run: `.\mvnw.cmd -q -Dtest=EntityMappingTest test`

Expected: FAIL because the enum and fields do not exist.

- [ ] **Step 3: Add the enum, entity mappings, baseline schema columns, and idempotent migration**

Map `cancelled_from_status` as nullable `FulfillmentStatus`, `cancellation_loss_type` as nullable `CancellationLossType`, and `loss_amount` as non-null `long`. Add SQL constraints for the allowed enum values and `loss_amount >= 0`; do not backfill invented classifications for legacy rows.

- [ ] **Step 4: Run the mapping test and migration verification**

Run: `.\mvnw.cmd -q -Dtest=EntityMappingTest test`

Expected: PASS.

Apply the migration to `POS_QUAN_NHO`, then query `information_schema.columns` and `pg_constraint` to verify all three columns/defaults/constraints exist and legacy cancelled rows retain zero loss with null audit classification.

- [ ] **Step 5: Commit**

```powershell
git add -- Quan-Nho-Backend/src/main/java/com/quannho/pos/order/CancellationLossType.java Quan-Nho-Backend/src/main/java/com/quannho/pos/order/Order.java Quan-Nho-Backend/src/test/java/com/quannho/pos/EntityMappingTest.java Quan-Nho-Backend/database/database.sql Quan-Nho-Backend/database/quan_nho_database.sql Quan-Nho-Backend/database/migrations/2026-09-27_add_cancellation_loss_accounting.sql
git commit -m "feat: persist cancellation loss audit data"
```

### Task 2: Calculate cancellation loss atomically in the backend

**Files:**
- Modify: `Quan-Nho-Backend/src/main/java/com/quannho/pos/order/OrderController.java`
- Test: `Quan-Nho-Backend/src/test/java/com/quannho/pos/order/OrderApiTest.java`

**Interfaces:**
- Consumes: `CancellationLossType`, `FulfillmentStatus`, and the three columns from Task 1.
- Produces: cancellation responses containing `cancelledFromStatus`, `cancellationLossType`, and `lossAmount`; no new request field.

- [ ] **Step 1: Write failing API tests for all cancellation origins and hostile input**

Add tests asserting:

- cancelling `NEW` returns `NO_MATERIAL_LOSS` and zero loss;
- cancelling `PREPARING` or `READY_FOR_PICKUP` returns `FULL_ORDER_LOSS` and the persisted `totalAmount`;
- request body values such as `lossAmount: 1` and `cancellationLossType: NO_MATERIAL_LOSS` cannot alter a loss-producing cancellation;
- completed/already-cancelled and stale concurrent transitions return `409`.

- [ ] **Step 2: Run the endpoint tests and verify RED**

Run: `.\mvnw.cmd -Dtest=OrderApiTest test`

Expected: FAIL because the response fields and server calculation are absent.

- [ ] **Step 3: Extend response mapping and guarded cancellation update**

Add camelCase response fields in `one(long id)`. Inside `cancel`, derive classification and amount from the queried fulfillment state and `total_amount`, then include all audit fields in the existing `UPDATE ... WHERE fulfillment_status=? AND status<>'CANCELLED'`. Do not read client-supplied loss fields.

- [ ] **Step 4: Run API and backend tests**

Run: `.\mvnw.cmd -Dtest=OrderApiTest test`

Expected: all `OrderApiTest` cases PASS.

Run: `.\mvnw.cmd test`

Expected: full backend suite PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- Quan-Nho-Backend/src/main/java/com/quannho/pos/order/OrderController.java Quan-Nho-Backend/src/test/java/com/quannho/pos/order/OrderApiTest.java
git commit -m "feat: calculate cancellation loss on the server"
```

### Task 3: Show cancellation impact and aggregate report metrics

**Files:**
- Create: `Quan-Nho-Frontend/src/utils/cancellationLoss.js`
- Create: `Quan-Nho-Frontend/tests/cancellation-loss.test.mjs`
- Modify: `Quan-Nho-Frontend/src/pages/OrderHistory/index.jsx`
- Modify: `Quan-Nho-Frontend/src/api/reportApi.js`
- Modify: `Quan-Nho-Frontend/src/pages/Reports/index.jsx`

**Interfaces:**
- Consumes: API properties `cancelledFromStatus`, `cancellationLossType`, and `lossAmount` from Task 2.
- Produces: `getCancellationLossPreview(order)` returning `{ type, lossAmount, label, description }`; report statistics `noMaterialLossCancellationCount`, `fullOrderLossCancellationCount`, and `totalCancellationLoss`.

- [ ] **Step 1: Write failing utility, source-contract, and aggregation tests**

Test `getCancellationLossPreview` for all three cancellable fulfillment states and string/numeric totals. Assert Order History renders the preview but does not add editable loss fields to the cancel request. Test report aggregation for both known types, one legacy null type, and missing/string loss amounts without producing `NaN`.

- [ ] **Step 2: Run frontend tests and verify RED**

Run: `node --test --test-isolation=none tests/cancellation-loss.test.mjs tests/order-history-status.test.mjs`

Expected: FAIL because the utility, copy, and report fields do not exist.

- [ ] **Step 3: Implement preview, persisted cancellation display, and report aggregation**

Use the utility only for pre-submit messaging. In the cancellation modal show either “Hủy không hao hụt nguyên liệu” with `0 đ`, or “Hủy có hao hụt” with the full order amount. For cancelled cards/details, render persisted classification, refund, and shop loss. Add three report metrics and visible summary labels without merging loss into refund or net revenue.

- [ ] **Step 4: Run focused and full frontend tests**

Run: `node --test --test-isolation=none tests/cancellation-loss.test.mjs tests/order-history-status.test.mjs`

Expected: focused tests PASS.

Run: `npm test`

Expected: full frontend suite PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- Quan-Nho-Frontend/src/utils/cancellationLoss.js Quan-Nho-Frontend/tests/cancellation-loss.test.mjs Quan-Nho-Frontend/src/pages/OrderHistory/index.jsx Quan-Nho-Frontend/src/api/reportApi.js Quan-Nho-Frontend/src/pages/Reports/index.jsx
git commit -m "feat: show cancellation loss impact"
```

### Task 4: Export cancellation loss to Excel and verify end to end

**Files:**
- Modify: `Quan-Nho-Frontend/src/utils/reportExcel.js`
- Modify: `Quan-Nho-Frontend/tests/report-excel.test.mjs`
- Modify: `Quan-Nho-Frontend/src/api/springBootGuide.js`

**Interfaces:**
- Consumes: report statistics from Task 3 and persisted per-order loss properties from Task 2.
- Produces: summary workbook rows for both cancellation classes and total loss; order sheet columns for cancellation class and shop loss.

- [ ] **Step 1: Write failing workbook tests**

Assert the summary sheet includes “Đơn hủy không hao hụt”, “Đơn hủy có hao hụt”, and “Tiền lỗ do đơn hủy”, including zeros when no cancellations exist. Assert the order sheet exports the persisted cancellation type and currency-formatted loss amount.

- [ ] **Step 2: Run workbook tests and verify RED**

Run: `node --test --test-isolation=none tests/report-excel.test.mjs`

Expected: FAIL because the rows and columns are absent.

- [ ] **Step 3: Extend workbook generation and integration guide**

Add the three summary rows, extend borders/number formats to the new final row, add “Loại hủy” and “Tiền lỗ của quán (VNĐ)” columns to the order sheet, and document server-owned cancellation loss fields in `springBootGuide.js`.

- [ ] **Step 4: Run final verification**

Run: `node --test --test-isolation=none tests/report-excel.test.mjs`

Expected: PASS.

Run: `npm test`

Expected: full frontend suite PASS.

Run: `npm run build`

Expected: Vite production build succeeds; the existing large-chunk advisory may remain.

Run: `.\mvnw.cmd test` from `Quan-Nho-Backend`.

Expected: full backend suite PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- Quan-Nho-Frontend/src/utils/reportExcel.js Quan-Nho-Frontend/tests/report-excel.test.mjs Quan-Nho-Frontend/src/api/springBootGuide.js
git commit -m "feat: export cancellation loss reporting"
```
