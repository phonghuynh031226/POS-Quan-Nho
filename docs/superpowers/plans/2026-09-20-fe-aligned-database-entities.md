# FE-Aligned Backend Database and Entities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `database/database.sql` seed data and 11 JPA entities agree with the current frontend's active data model.

**Architecture:** Keep the existing 11-table relational model and Package by Feature layout. Add only four persisted fields used by the current frontend (`users.email`, `orders.token`, `shop_settings.store_subtitle`, `shop_settings.phone`), rewrite demo seed rows from the frontend constants/mock database, then map each table to one JPA entity. Use no live database writes.

**Tech Stack:** PostgreSQL SQL, Java 17, Spring Boot 4.1.1/Jakarta Persistence, Lombok, JUnit 5, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-20-fe-aligned-database-entities-design.md`

## Global Constraints

- Edit only `Quan-Nho-Backend/database/database.sql`, backend Java entity/enum/test files, and this plan; do not edit FE or the other SQL files.
- Preserve 11 tables, no `payments`/`payment_settings`, no `description` on categories/products.
- Preserve user data on rerun: no `DROP TABLE`, `TRUNCATE`, `DELETE FROM`, or overwriting existing business rows.
- Add four columns idempotently and map all required FK by code rather than assuming FE demo IDs match generated PostgreSQL IDs.
- `Long` for BIGINT/VND, `OffsetDateTime` for TIMESTAMPTZ, lazy unidirectional ManyToOne for FK, no JPA cascade, no `@Data`/`@ToString`.
- Do not stage, reset, or commit the existing dirty FE files.

## Review Focus

- Existing PostgreSQL DB with real menu edits: script must not overwrite their rows when rerun; Task 1's idempotency test scans every menu `ON CONFLICT` action.
- Existing orders without token: new column must permit NULL; Task 1's migration test checks `ADD COLUMN IF NOT EXISTS` and nullable token.
- FE mock keeps nested order items: SQL must normalize them into `orders`, `order_items`, `order_item_options` without changing totals; Task 2 verifies snapshot arithmetic.
- Deleted products/options referenced by history: nullable references must preserve snapshot text/prices; Task 3 checks `@JoinColumn(nullable=true)` and no JPA cascade.
- SePay key/Wi-Fi password: seed must not claim plaintext is encrypted or include a real key; Task 2 checks key NULL and comments accurately describe demo Wi-Fi.

---

### Task 1: Align schema and menu seed

**Files:**
- Modify: `Quan-Nho-Backend/database/database.sql`
- Create: `Quan-Nho-Backend/src/test/java/com/quannho/pos/FrontendSeedContractTest.java`

**Interfaces:** Consumes FE `INITIAL_USERS`, `INITIAL_CATEGORIES`, `INITIAL_PRODUCTS`, `INITIAL_OPTION_GROUPS`, `INITIAL_OPTION_VALUES`, `INITIAL_PRODUCT_OPTION_GROUPS` from `Quan-Nho-Frontend/src/api/mockDb.js`, plus `DEFAULT_SHOP_SETTINGS` from `src/constants/index.js`. Produces SQL with 11 tables, new columns and frontend-equivalent menu seed. Task 2 appends order seed; Task 3 maps entity fields.

- [ ] **Step 1: Write red contract test.** The test reads `database/database.sql` and FE source with `Files.readString(Path.of(...))`. Assert 11 `CREATE TABLE IF NOT EXISTS` entries, `users.email`, `orders.token`, `shop_settings.store_subtitle`, `shop_settings.phone`, and no `payments` table. Compare menu codes using literal regex captures: 5 category codes, 11 product codes, 7 group codes, 22 option-value codes, and 33 `(product_code, group_code)` pairs. Assert FE names/prices/availability and default option flags for distinctive rows: `TRA_SUA_O_LONG` available, `SIZE_S` default, `SIZE_M` not default. Assert SQL has no `DROP TABLE`, `TRUNCATE`, `DELETE FROM` or menu `DO UPDATE SET` on conflicts.
- [ ] **Step 2: Run targeted test RED:** `mvn -Dtest=FrontendSeedContractTest test`; expected failure on missing columns and 31/47 legacy option rows.
- [ ] **Step 3: Apply minimal SQL edits:** add four columns to initial CREATE TABLE definitions and idempotent ALTERs for older DBs; change menu seed values to current FE names/prices/images/defaults/availability; remove only excess seed value/relationship tuples (do not delete existing DB rows). Use `ON CONFLICT DO NOTHING` on seed inserts. Seed user email in a way that does not overwrite an existing owner. Preserve code-based lookups for all foreign keys.
- [ ] **Step 4: Run targeted test GREEN:** same command; expect all Task 1 assertions pass.
- [ ] **Step 5: Stage only SQL and test, commit:** `git add Quan-Nho-Backend/database/database.sql Quan-Nho-Backend/src/test/java/com/quannho/pos/FrontendSeedContractTest.java`, then commit `feat: align menu database seed with frontend`.

### Task 2: Align order and settings seed

**Files:**
- Modify: `Quan-Nho-Backend/database/database.sql`
- Modify: `Quan-Nho-Backend/src/test/java/com/quannho/pos/FrontendSeedContractTest.java`

**Interfaces:** Consumes SQL from Task 1 and FE `createInitialOrders()` plus current settings form fields. Produces two demo orders, three order items, 11 snapshot options, shop settings and a blank SePay API key.

- [ ] **Step 1: Extend red test:** assert `QN-000001` token `demo001tok`, total 64000, cash 100000/change 36000 and two `CA_PHE_SUA_DA` lines (35000 + 29000); assert `QN-000002` token `demo002tok`, total 76000, two `TRA_DAO_CAM_SA` units; check 11 snapshot option tuples by code/name/price. Check `store_subtitle` and `phone` FE values, `sepay_settings.api_key_encrypted` NULL. Check all demo order inserts are guarded against rerun and no existing order is updated.
- [ ] **Step 2: Run targeted test RED:** expected order 1 still 70000 and missing tokens.
- [ ] **Step 3: Rewrite only demo order/settings seed:** use `INSERT ... SELECT` with natural keys `order_code`/product code/option code; for the two same-product order 1 lines, distinguish snapshots by stable per-order position or unique chosen size, not merely `product_id`. Preserve real rows using `ON CONFLICT DO NOTHING`/`NOT EXISTS`; use FE sample values exactly, including both tokens. Seed shop settings only if absent, with subtitle/phone, keep SePay key NULL, and comment that demo Wi-Fi value is plaintext sample rather than actual ciphertext.
- [ ] **Step 4: Run targeted test GREEN:** same command; verify SQL contract assertions pass.
- [ ] **Step 5: Stage only SQL and test, commit:** `git add` the two Task 2 files; commit `feat: align sample orders and shop settings with frontend`.

### Task 3: Map all 11 JPA entities

**Files:**
- Create: `Quan-Nho-Backend/src/main/java/com/quannho/pos/auth/User.java`, `UserRole.java`
- Create: `Quan-Nho-Backend/src/main/java/com/quannho/pos/catalog/category/Category.java`
- Create: `Quan-Nho-Backend/src/main/java/com/quannho/pos/catalog/product/Product.java`
- Create: `Quan-Nho-Backend/src/main/java/com/quannho/pos/catalog/option/OptionGroup.java`, `OptionSelectionType.java`, `OptionValue.java`, `ProductOptionGroup.java`
- Create: `Quan-Nho-Backend/src/main/java/com/quannho/pos/order/Order.java`, `OrderItem.java`, `OrderItemOption.java`, `OrderStatus.java`, `PaymentStatus.java`, `PaymentMethod.java`
- Create: `Quan-Nho-Backend/src/main/java/com/quannho/pos/settings/shop/ShopSettings.java`
- Create: `Quan-Nho-Backend/src/main/java/com/quannho/pos/settings/sepay/SepaySettings.java`
- Create: `Quan-Nho-Backend/src/test/java/com/quannho/pos/EntityMappingTest.java`

**Interfaces:** Consumes Task 2 SQL as the authoritative field/constraint list. Produces JPA classes usable by feature-local repositories later. Enum constants: `OWNER`; `SINGLE/MULTIPLE`; `PENDING_PAYMENT/COMPLETED/CANCELLED`; `UNPAID/PAID/REFUNDED/PARTIALLY_REFUNDED`; `CASH/BANK_TRANSFER`.

- [ ] **Step 1: Write red reflection test:** assert exactly 11 classes have `@Entity` and expected `@Table` names, all IDs are `Long` + IDENTITY, four added properties exist with correct `@Column` names, all `@ManyToOne` joins use LAZY and correct optionality, and `Category`/`Product` have no `description`. Check `Long` money fields and exact enum constant sets. Check no entity has Lombok `@Data`, `@ToString` or JPA cascade and historical nullable joins remain optional.
- [ ] **Step 2: Run targeted test RED:** `mvn -Dtest=EntityMappingTest test`; expect compile failure because entity classes do not exist.
- [ ] **Step 3: Implement entities in feature packages:** each has public/protected no-arg constructor, `@Getter @Setter`, `@Entity @Table`, IDENTITY id, explicit columns matching SQL length/nullability, enum `@Enumerated(STRING)`, and `@ManyToOne(fetch=LAZY)` joins. Field sets exactly match 11 CREATE TABLE definitions after Task 2. `Order` includes `token`; `User` includes `email`; `ShopSettings` includes `storeSubtitle`/`phone`. Add `@PrePersist`/`@PreUpdate` timestamps using UTC, no secret serialization or encryption behavior in entities.
- [ ] **Step 4: Run targeted test GREEN:** same command; expect pass.
- [ ] **Step 5: Stage only BE entity/enum/test files and commit:** `feat: map frontend-aligned PostgreSQL entities`.

### Task 4: Final verification

**Files:** no production changes expected; revise only tests if a missing assertion is discovered.

**Interfaces:** Consumes Tasks 1–3. Produces verification report.

- [ ] **Step 1: Run backend targeted tests and compile:** `mvn -Dtest=FrontendSeedContractTest,EntityMappingTest test` and `mvn compile`; both must pass.
- [ ] **Step 2: Run full backend suite:** `mvn test`; if only pre-existing `contextLoads` fails because datasource is absent, record exact cause and keep scope unchanged.
- [ ] **Step 3: Run FE reference test:** from `Quan-Nho-Frontend`, `node --test --test-isolation=none tests/database-schema-alignment.test.mjs`; record results without changing FE.
- [ ] **Step 4: Inspect diff:** `git diff --check`, `git status --short`, inspect changed path list and ensure no dirty FE file entered the backend commits. Report which SQL file is authoritative and that no SQL was run on a live database.
