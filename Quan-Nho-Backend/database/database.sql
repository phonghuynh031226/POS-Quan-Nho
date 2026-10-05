BEGIN;

-- ============================================================
-- POS QUAN NHO - POSTGRESQL SCHEMA
-- Tien te luu bang so nguyen VND: 29000 = 29.000 dong
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Chu quan
CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(50) NOT NULL UNIQUE,
    email           VARCHAR(255) UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'OWNER',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_role CHECK (role = 'OWNER')
);

-- 2. Danh muc mon
CREATE TABLE IF NOT EXISTS categories (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(50) NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    display_order   INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. San pham
CREATE TABLE IF NOT EXISTS products (
    id              BIGSERIAL PRIMARY KEY,
    category_id     BIGINT NOT NULL REFERENCES categories(id),
    code            VARCHAR(50) NOT NULL UNIQUE,
    name            VARCHAR(200) NOT NULL,
    base_price      BIGINT NOT NULL CHECK (base_price >= 0),
    image_url       TEXT,
    is_available    BOOLEAN NOT NULL DEFAULT TRUE,
    display_order   INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Neu da tung chay ban SQL cu, hai lenh nay bo cot description.
ALTER TABLE categories DROP COLUMN IF EXISTS description;
ALTER TABLE products DROP COLUMN IF EXISTS description;

-- 4. Nhom tuy chon dung chung
CREATE TABLE IF NOT EXISTS option_groups (
    id                  BIGSERIAL PRIMARY KEY,
    code                VARCHAR(50) NOT NULL UNIQUE,
    name                VARCHAR(100) NOT NULL,
    selection_type      VARCHAR(20) NOT NULL,
    default_required    BOOLEAN NOT NULL DEFAULT FALSE,
    default_min_select  INTEGER NOT NULL DEFAULT 0,
    default_max_select  INTEGER NOT NULL DEFAULT 1,
    display_order       INTEGER NOT NULL DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_option_groups_type
        CHECK (selection_type IN ('SINGLE', 'MULTIPLE')),
        CONSTRAINT chk_option_groups_range
        CHECK (
            default_min_select >= 0
            AND default_max_select >= default_min_select
                    AND (selection_type = 'MULTIPLE' OR default_max_select = 1)
        )
);

-- 5. Gia tri cua tung nhom tuy chon
CREATE TABLE IF NOT EXISTS option_values (
    id               BIGSERIAL PRIMARY KEY,
    option_group_id  BIGINT NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE,
    code             VARCHAR(50) NOT NULL,
    name             VARCHAR(100) NOT NULL,
    extra_price      BIGINT NOT NULL DEFAULT 0 CHECK (extra_price >= 0),
    is_default       BOOLEAN NOT NULL DEFAULT FALSE,
    display_order    INTEGER NOT NULL DEFAULT 0,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_option_values_group_code UNIQUE (option_group_id, code)
);

-- 6. Gan nhom tuy chon cho san pham
CREATE TABLE IF NOT EXISTS product_option_groups (
    id               BIGSERIAL PRIMARY KEY,
    product_id       BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    option_group_id  BIGINT NOT NULL REFERENCES option_groups(id),
    is_required      BOOLEAN NOT NULL DEFAULT FALSE,
    min_select       INTEGER NOT NULL DEFAULT 0,
    max_select       INTEGER NOT NULL DEFAULT 1,
    display_order    INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_product_option_groups UNIQUE (product_id, option_group_id),
    CONSTRAINT chk_product_option_groups_range
        CHECK (min_select >= 0 AND max_select >= min_select)
);

-- 7. Don hang, gom luon thong tin thanh toan
CREATE TABLE IF NOT EXISTS orders (
    id                    BIGSERIAL PRIMARY KEY,
    order_code            VARCHAR(30) NOT NULL UNIQUE,
    token                 VARCHAR(100) UNIQUE,
    status                VARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT',
    fulfillment_status    VARCHAR(30) NOT NULL DEFAULT 'NEW',
    payment_status        VARCHAR(30) NOT NULL DEFAULT 'UNPAID',
    payment_method        VARCHAR(30),
    subtotal              BIGINT NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    discount_amount       BIGINT NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount          BIGINT NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    payment_amount        BIGINT CHECK (payment_amount IS NULL OR payment_amount >= 0),
    cash_received         BIGINT CHECK (cash_received IS NULL OR cash_received >= 0),
    change_amount         BIGINT CHECK (change_amount IS NULL OR change_amount >= 0),
    sepay_transaction_id  VARCHAR(100),
    transfer_content      VARCHAR(100),
    customer_note         VARCHAR(1000),
    cancel_reason         VARCHAR(500),
    refund_amount         BIGINT NOT NULL DEFAULT 0 CHECK (refund_amount >= 0),
    cancelled_from_status VARCHAR(30),
    cancellation_loss_type VARCHAR(30),
    loss_amount           BIGINT NOT NULL DEFAULT 0 CHECK (loss_amount >= 0),
    created_by            BIGINT NOT NULL REFERENCES users(id),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at               TIMESTAMPTZ,
    cancelled_at          TIMESTAMPTZ,
    refunded_at           TIMESTAMPTZ,
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_orders_status
        CHECK (status IN ('PENDING_PAYMENT', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_orders_fulfillment_status
        CHECK (fulfillment_status IN ('NEW', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_orders_cancelled_from_status
        CHECK (cancelled_from_status IS NULL OR cancelled_from_status IN ('NEW', 'PREPARING', 'READY_FOR_PICKUP')),
    CONSTRAINT chk_orders_cancellation_loss_type
        CHECK (cancellation_loss_type IS NULL OR cancellation_loss_type IN ('NO_MATERIAL_LOSS', 'FULL_ORDER_LOSS')),
    CONSTRAINT chk_orders_payment_status
        CHECK (payment_status IN ('UNPAID', 'PAID', 'REFUNDED', 'PARTIALLY_REFUNDED')),
    CONSTRAINT chk_orders_payment_method
        CHECK (payment_method IS NULL OR payment_method IN ('CASH', 'BANK_TRANSFER')),
    CONSTRAINT chk_orders_total
        CHECK (total_amount = subtotal - discount_amount)
);

-- 8. Cac mon trong don; ten va gia la snapshot tai thoi diem ban
CREATE TABLE IF NOT EXISTS order_items (
    id                    BIGSERIAL PRIMARY KEY,
    order_id              BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id            BIGINT REFERENCES products(id) ON DELETE SET NULL,
    product_name          VARCHAR(200) NOT NULL,
    base_price            BIGINT NOT NULL CHECK (base_price >= 0),
    option_extra_price    BIGINT NOT NULL DEFAULT 0 CHECK (option_extra_price >= 0),
    unit_price            BIGINT NOT NULL CHECK (unit_price >= 0),
    quantity              INTEGER NOT NULL CHECK (quantity > 0),
    line_total            BIGINT NOT NULL CHECK (line_total >= 0),
    customer_note         VARCHAR(500),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_order_items_unit_price
        CHECK (unit_price = base_price + option_extra_price),
    CONSTRAINT chk_order_items_line_total
        CHECK (line_total = unit_price * quantity)
);

-- 9. Tùy chon da chon; ten va gia cung la snapshot
CREATE TABLE IF NOT EXISTS order_item_options (
    id                BIGSERIAL PRIMARY KEY,
    order_item_id     BIGINT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    option_group_id   BIGINT REFERENCES option_groups(id) ON DELETE SET NULL,
    option_value_id   BIGINT REFERENCES option_values(id) ON DELETE SET NULL,
    group_name        VARCHAR(100) NOT NULL,
    option_name       VARCHAR(100) NOT NULL,
    extra_price       BIGINT NOT NULL DEFAULT 0 CHECK (extra_price >= 0),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Cau hinh thong tin in bill
CREATE TABLE IF NOT EXISTS shop_settings (
    id                       BIGSERIAL PRIMARY KEY,
    shop_name                VARCHAR(150) NOT NULL,
    store_subtitle           VARCHAR(200),
    phone                    VARCHAR(30),
    shop_address             VARCHAR(500),
    wifi_name                VARCHAR(100),
    wifi_password_encrypted  TEXT,
    receipt_message          VARCHAR(500),
    show_wifi_on_receipt     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. Trang cai dat chi co mot o dan API Key SePay
CREATE TABLE IF NOT EXISTS sepay_settings (
    id                 BIGSERIAL PRIMARY KEY,
    api_key_encrypted  TEXT,
    api_key_last4      VARCHAR(4),
    is_configured      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_sepay_last4
        CHECK (api_key_last4 IS NULL OR length(api_key_last4) = 4)
);

-- Tuong thich database da tao bang schema cu.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS token VARCHAR(100);
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS store_subtitle VARCHAR(200);
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_token ON orders(token);

-- Chi muc
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_option_values_group_id ON option_values(option_group_id);
CREATE INDEX IF NOT EXISTS idx_product_option_groups_product_id ON product_option_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_sepay_transaction_id ON orders(sepay_transaction_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_item_options_item_id ON order_item_options(order_item_id);

-- ============================================================
COMMIT;

-- Kiem tra so luong du lieu sau khi chay.
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'option_groups', COUNT(*) FROM option_groups
UNION ALL SELECT 'option_values', COUNT(*) FROM option_values
UNION ALL SELECT 'product_option_groups', COUNT(*) FROM product_option_groups
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL SELECT 'order_item_options', COUNT(*) FROM order_item_options
UNION ALL SELECT 'shop_settings', COUNT(*) FROM shop_settings
UNION ALL SELECT 'sepay_settings', COUNT(*) FROM sepay_settings
ORDER BY table_name;
