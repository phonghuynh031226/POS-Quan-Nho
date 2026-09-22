# Backend JPA Entities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 11 JPA entities matching `Quan-Nho-Backend/database/quan_nho_database.sql`.

**Architecture:** Keep every entity in the feature package that owns its table. Model foreign keys as lazy, unidirectional `@ManyToOne` references, preserving order snapshots independently of live menu records. Use Lombok getters/setters only and entity lifecycle callbacks for timestamps.

**Tech Stack:** Java 17, Spring Boot 4.1.1, Jakarta Persistence, Lombok, JUnit 5, Maven Wrapper.

**Spec:** `docs/superpowers/specs/2026-09-20-backend-jpa-entities-design.md`

## Global Constraints

- Exactly 11 entities matching the 11 SQL tables; no payment entity or table.
- No `description` field on `Category` or `Product`.
- No root-level `entity`, `controller`, `service`, or `repository` package.
- No controller/service/repository/API/SQL/frontend changes in this task.
- `Long` for all VND amounts and bigint IDs; `OffsetDateTime` for timestamptz.
- No bidirectional collections, no JPA cascade, no entity `@Data`, `@ToString`, or `@EqualsAndHashCode`.
- Preserve all existing frontend modifications without staging or resetting them.

## Review Focus

- Nullable references in historical rows (`order_items.product_id`, option references) remain optional and never erase snapshot names/prices.
- Persisting a new entity with null timestamps fills `createdAt` and `updatedAt` where those columns exist.
- Updating an entity changes `updatedAt` but leaves `createdAt` intact.
- Enum names are exact SQL CHECK values, including `PARTIALLY_REFUNDED` and `BANK_TRANSFER`.
- The `product_option_groups` table is represented by an entity with its own ID and selection constraints, never `@ManyToMany`.

---

### Task 1: Account and menu entities

**Files:**
- Create: `Quan-Nho-Backend/src/main/java/com/quannho/pos/auth/User.java`, `UserRole.java`
- Create: `Quan-Nho-Backend/src/main/java/com/quannho/pos/catalog/category/Category.java`
- Create: `Quan-Nho-Backend/src/main/java/com/quannho/pos/catalog/product/Product.java`
- Create: `Quan-Nho-Backend/src/main/java/com/quannho/pos/catalog/option/OptionGroup.java`, `OptionSelectionType.java`, `OptionValue.java`, `ProductOptionGroup.java`
- Create: `Quan-Nho-Backend/src/test/java/com/quannho/pos/EntityMappingTest.java`

**Interfaces:** Produces `User`, `Category`, `Product`, `OptionGroup`, `OptionValue`, and `ProductOptionGroup` classes with public no-arg constructors and Lombok accessors. Task 2 imports these classes for FK fields. Enum constants: `UserRole.OWNER`; `OptionSelectionType.SINGLE`, `MULTIPLE`.

- [ ] **Step 1: Add failing JUnit reflection tests**

In `EntityMappingTest.java`, assert `@Entity` and `@Table.name()` for the six classes above, `@JoinColumn(name="category_id", nullable=false)` on `Product.category`, `@JoinColumn(name="option_group_id", nullable=false)` on `OptionValue.optionGroup`, and both joins plus ID on `ProductOptionGroup`. Assert `Category` and `Product` have no `description` field. Assert `OptionSelectionType` and `UserRole` constants exactly match SQL. Assert no `@ManyToMany` exists. Use `Class.getDeclaredField`, `getAnnotation`, and `assertThrows(NoSuchFieldException.class, ...)`; no Spring context.

- [ ] **Step 2: Verify red**

Run from `Quan-Nho-Backend`: `mvn -Dtest=EntityMappingTest test` (or Maven Wrapper with a working Maven installation). Expected: test compilation fails because the new classes do not exist.

- [ ] **Step 3: Implement minimal production code**

Use `@Entity`, `@Table(name="...")`, `@Id`, `@GeneratedValue(strategy=IDENTITY)`, and explicit `@Column`. Fields must mirror these SQL columns exactly:

```text
User: id, username, passwordHash, fullName, role, isActive, lastLoginAt, createdAt, updatedAt
Category: id, code, name, displayOrder, isActive, createdAt, updatedAt
Product: id, category, code, name, basePrice, imageUrl, isAvailable, displayOrder, createdAt, updatedAt
OptionGroup: id, code, name, selectionType, defaultRequired, defaultMinSelect, defaultMaxSelect, displayOrder, isActive, createdAt, updatedAt
OptionValue: id, optionGroup, code, name, extraPrice, isDefault, displayOrder, isActive, createdAt, updatedAt
ProductOptionGroup: id, product, optionGroup, isRequired, minSelect, maxSelect, displayOrder, createdAt
```

Use the SQL table definition as the authoritative source for `nullable`, length, uniqueness, defaults, and text columns. Example FK:

```java
@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(name = "category_id", nullable = false)
private Category category;
```

Initialize SQL defaults in Java field declarations. Implement `@PrePersist`/`@PreUpdate` on each class with timestamps, setting creation time only if null and update time on update. Do not expose secret fields in any custom string representation.

- [ ] **Step 4: Verify green and commit**

Run targeted test. Then stage only Task 1 files and commit `feat: map account and catalog JPA entities`.

### Task 2: Order and settings entities

**Files:**
- Create: `Quan-Nho-Backend/src/main/java/com/quannho/pos/order/Order.java`, `OrderItem.java`, `OrderItemOption.java`, `OrderStatus.java`, `PaymentStatus.java`, `PaymentMethod.java`
- Create: `Quan-Nho-Backend/src/main/java/com/quannho/pos/settings/shop/ShopSettings.java`
- Create: `Quan-Nho-Backend/src/main/java/com/quannho/pos/settings/sepay/SepaySettings.java`
- Modify: `Quan-Nho-Backend/src/test/java/com/quannho/pos/EntityMappingTest.java`

**Interfaces:** Consumes entity classes from Task 1. Produces the remaining five entities and three enums. Enum constants must be:

```text
OrderStatus: PENDING_PAYMENT, COMPLETED, CANCELLED
PaymentStatus: UNPAID, PAID, REFUNDED, PARTIALLY_REFUNDED
PaymentMethod: CASH, BANK_TRANSFER
```

- [ ] **Step 1: Extend failing tests**

Check five additional `@Entity`/`@Table` mappings. Check `Order.createdBy`, `OrderItem.order` and `OrderItem.product`, `OrderItemOption.orderItem`, `.optionGroup`, `.optionValue` join names, lazy fetch, and required versus nullable status. Verify snapshot field annotations and `Long` money fields. Verify enum constants exactly. Verify timestamps via `getDeclaredMethod("onCreate")` and `getDeclaredMethod("onUpdate")` invocation or equivalent package-independent reflection, checking update leaves creation unchanged.

- [ ] **Step 2: Verify red**

Run targeted test; expect test compilation failure for missing Task 2 classes.

- [ ] **Step 3: Implement minimal production code**

Map these exact field lists:

```text
Order: id, orderCode, status, paymentStatus, paymentMethod, subtotal, discountAmount, totalAmount, paymentAmount, cashReceived, changeAmount, sepayTransactionId, transferContent, customerNote, cancelReason, refundAmount, createdBy, createdAt, paidAt, cancelledAt, refundedAt, updatedAt
OrderItem: id, order, product, productName, basePrice, optionExtraPrice, unitPrice, quantity, lineTotal, customerNote, createdAt
OrderItemOption: id, orderItem, optionGroup, optionValue, groupName, optionName, extraPrice, createdAt
ShopSettings: id, shopName, shopAddress, wifiName, wifiPasswordEncrypted, receiptMessage, showWifiOnReceipt, createdAt, updatedAt
SepaySettings: id, apiKeyEncrypted, apiKeyLast4, isConfigured, createdAt, updatedAt
```

Use the same JPA conventions as Task 1. `Product`, `OptionGroup`, and `OptionValue` references on historical snapshots are optional; snapshot text and prices are mandatory. No `payments` table/entity. Do not encrypt values in entities; later service owns that behavior.

- [ ] **Step 4: Verify green and commit**

Run targeted test. Stage only Task 2 files plus test and commit `feat: map orders and settings JPA entities`.

### Task 3: Cross-check and full verification

**Files:**
- Modify: `Quan-Nho-Backend/src/test/java/com/quannho/pos/EntityMappingTest.java`

**Interfaces:** Consumes all 11 mapped entities. Produces confidence that Java mapping covers the SQL contract.

- [ ] **Step 1: Add contract test**

Parse `database/quan_nho_database.sql` for the 11 `CREATE TABLE` names and compare the set to `@Table.name()` values of all 11 classes. Assert all entity ID fields are `Long` with `@GeneratedValue(strategy=IDENTITY)`, all `@ManyToOne` fields use LAZY, and there are no forbidden entity-level Lombok annotations. This test is independent of a database connection.

- [ ] **Step 2: Verify red when a mapping is deliberately omitted in a local temporary test change, then restore**

Expected: contract test fails on omitted mapping, then passes after restoration. Do not leave the temporary change in the tree.

- [ ] **Step 3: Run complete checks**

Run `mvn -Dtest=EntityMappingTest test`, then `mvn compile`, then `mvn test`. If `contextLoads` fails because no datasource is configured, record the exact error as a pre-existing integration-test limitation; do not alter database config in this task.

- [ ] **Step 4: Final review and commit**

Check `git diff --check`, the 11 entity file locations, no unrelated staged frontend files, and commit test refinements as `test: verify JPA entity schema contract`.
