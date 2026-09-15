BEGIN;

-- ============================================================
-- POS QUAN NHO - POSTGRESQL DATABASE + SAMPLE DATA
-- Tai khoan demo: admin / 123456
-- Tien te luu bang so nguyen VND: 29000 = 29.000 dong
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Chu quan
CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(50) NOT NULL UNIQUE,
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
    status                VARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT',
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
    created_by            BIGINT NOT NULL REFERENCES users(id),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at               TIMESTAMPTZ,
    cancelled_at          TIMESTAMPTZ,
    refunded_at           TIMESTAMPTZ,
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_orders_status
        CHECK (status IN ('PENDING_PAYMENT', 'COMPLETED', 'CANCELLED')),
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
-- DU LIEU MAU
-- ============================================================

-- Tai khoan: admin / 123456. Production phai doi mat khau.
INSERT INTO users (username, password_hash, full_name, role, is_active)
VALUES ('admin', crypt('123456', gen_salt('bf', 10)), 'Chủ quán', 'OWNER', TRUE)
ON CONFLICT (username) DO NOTHING;

INSERT INTO categories (code, name, display_order, is_active)
VALUES
    ('COFFEE',       'Cà phê',                1, TRUE),
    ('OTHER_DRINKS', 'Trà & Nước khác',       2, TRUE),
    ('MILK_TEA',     'Trà sữa',               3, TRUE),
    ('SNACKS',       'Đồ ăn vặt',             4, TRUE),
    ('BAKERY',       'Bánh ngọt & Điểm tâm',  5, TRUE)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO products (
    category_id, code, name, base_price, image_url, is_available, display_order
)
SELECT c.id, p.code, p.name, p.base_price, p.image_url, p.is_available, p.display_order
FROM categories c
JOIN (VALUES
    ('COFFEE', 'CA_PHE_SUA_DA', 'Cà phê sữa đá truyền thống', 29000,
     'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=60', TRUE, 1),
    ('COFFEE', 'BAC_XIU', 'Bạc xỉu kem sữa 3 tầng', 32000,
     'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60', TRUE, 2),
    ('COFFEE', 'CA_PHE_DEN', 'Cà phê đen đá phin', 25000,
     'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60', TRUE, 3),
    ('COFFEE', 'COLD_BREW_CAM_SA', 'Cold Brew cam vàng sả tươi', 45000,
     'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=60', TRUE, 4),
    ('COFFEE', 'CA_PHE_MUOI', 'Cà phê muối xứ Huế', 35000,
     'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop&q=60', TRUE, 5),
    ('OTHER_DRINKS', 'TRA_DAO_CAM_SA', 'Trà đào cam sả thanh nhiệt', 38000,
     'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=60', TRUE, 6),
    ('OTHER_DRINKS', 'TRA_VAI_HOA_LAI', 'Trà vải hoa lài hạt sen', 38000,
     'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60', TRUE, 7),
    ('MILK_TEA', 'TRA_SUA_O_LONG', 'Trà sữa Ô long nướng trân châu', 42000,
     'https://images.unsplash.com/photo-1558857563-b371033873b8?w=500&auto=format&fit=crop&q=60', FALSE, 8),
    ('SNACKS', 'KHOAI_TAY_CHIEN', 'Khoai tây chiên lắc phô mai', 35000,
     'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60', TRUE, 9),
    ('SNACKS', 'CA_VIEN_CHIEN', 'Cá viên chiên sốt mắm tỏi bơ', 35000,
     'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60', TRUE, 10),
    ('SNACKS', 'BANH_MI_QUE', 'Bánh mì que Hải Phòng (2 chiếc)', 24000,
     'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=60', TRUE, 11)
) AS p(category_code, code, name, base_price, image_url, is_available, display_order)
    ON c.code = p.category_code
ON CONFLICT (code) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    base_price = EXCLUDED.base_price,
    image_url = EXCLUDED.image_url,
    is_available = EXCLUDED.is_available,
    display_order = EXCLUDED.display_order,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO option_groups (
    code, name, selection_type, default_required,
    default_min_select, default_max_select, display_order, is_active
)
VALUES
    ('SIZE',        'Size',          'SINGLE',   TRUE,  1, 1, 1, TRUE),
    ('TEMPERATURE', 'Nhiệt độ',      'SINGLE',   TRUE,  1, 1, 2, TRUE),
    ('SUGAR',       'Lượng đường',   'SINGLE',   TRUE,  1, 1, 3, TRUE),
    ('ICE',         'Lượng đá',      'SINGLE',   TRUE,  1, 1, 4, TRUE),
    ('TOPPING',     'Topping',       'MULTIPLE', FALSE, 0, 5, 5, TRUE),
    ('SPICE',       'Mức độ cay',    'SINGLE',   FALSE, 0, 1, 6, TRUE),
    ('SAUCE',       'Sốt dùng kèm',  'MULTIPLE', FALSE, 0, 3, 7, TRUE)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    selection_type = EXCLUDED.selection_type,
    default_required = EXCLUDED.default_required,
    default_min_select = EXCLUDED.default_min_select,
    default_max_select = EXCLUDED.default_max_select,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO option_values (
    option_group_id, code, name, extra_price, is_default, display_order, is_active
)
SELECT og.id, v.code, v.name, v.extra_price, v.is_default, v.display_order, TRUE
FROM option_groups og
JOIN (VALUES
    ('SIZE', 'SIZE_S', 'Size S', 0, FALSE, 1),
    ('SIZE', 'SIZE_M', 'Size M', 6000, TRUE, 2),
    ('SIZE', 'SIZE_L', 'Size L', 11000, FALSE, 3),
    ('TEMPERATURE', 'ICED', 'Lạnh', 0, TRUE, 1),
    ('TEMPERATURE', 'HOT', 'Nóng', 0, FALSE, 2),
    ('SUGAR', 'SUGAR_100', '100% đường', 0, TRUE, 1),
    ('SUGAR', 'SUGAR_70', '70% đường', 0, FALSE, 2),
    ('SUGAR', 'SUGAR_50', '50% đường', 0, FALSE, 3),
    ('SUGAR', 'SUGAR_30', '30% đường', 0, FALSE, 4),
    ('SUGAR', 'SUGAR_0', 'Không đường', 0, FALSE, 5),
    ('ICE', 'ICE_NORMAL', 'Đá bình thường', 0, TRUE, 1),
    ('ICE', 'ICE_LESS', 'Ít đá', 0, FALSE, 2),
    ('ICE', 'ICE_NONE', 'Không đá', 0, FALSE, 3),
    ('ICE', 'ICE_MORE', 'Nhiều đá', 0, FALSE, 4),
    ('TOPPING', 'BLACK_PEARL', 'Trân châu đen', 6000, FALSE, 1),
    ('TOPPING', 'COFFEE_JELLY', 'Thạch cà phê giòn', 6000, FALSE, 2),
    ('TOPPING', 'MACCHIATO', 'Kem béo Macchiato', 8000, FALSE, 3),
    ('TOPPING', 'CHEESE_CREAM', 'Kem cheese', 10000, FALSE, 4),
    ('TOPPING', 'ESPRESSO_SHOT', 'Thêm shot Espresso', 10000, FALSE, 5),
    ('TOPPING', 'ALOE_VERA', 'Thạch nha đam', 6000, FALSE, 6),
    ('TOPPING', 'LYCHEE', 'Thêm trái vải', 8000, FALSE, 7),
    ('TOPPING', 'PEACH', 'Thêm miếng đào', 10000, FALSE, 8),
    ('TOPPING', 'CHEESE', 'Thêm phô mai', 6000, FALSE, 9),
    ('TOPPING', 'FRIED_OKRA', 'Thêm đậu bắp chiên', 5000, FALSE, 10),
    ('SPICE', 'NOT_SPICY', 'Không cay', 0, TRUE, 1),
    ('SPICE', 'MILD', 'Cay nhẹ', 0, FALSE, 2),
    ('SPICE', 'MEDIUM', 'Cay vừa', 0, FALSE, 3),
    ('SPICE', 'VERY_SPICY', 'Rất cay', 0, FALSE, 4),
    ('SAUCE', 'MAYONNAISE', 'Sốt Mayonnaise', 4000, FALSE, 1),
    ('SAUCE', 'CHILI_SAUCE', 'Sốt tương ớt', 0, FALSE, 2),
    ('SAUCE', 'TOMATO_SAUCE', 'Sốt tương cà', 0, FALSE, 3)
) AS v(group_code, code, name, extra_price, is_default, display_order)
    ON og.code = v.group_code
ON CONFLICT (option_group_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    extra_price = EXCLUDED.extra_price,
    is_default = EXCLUDED.is_default,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO product_option_groups (
    product_id, option_group_id, is_required, min_select, max_select, display_order
)
SELECT p.id, og.id, r.is_required, r.min_select, r.max_select, r.display_order
FROM (VALUES
    ('CA_PHE_SUA_DA', 'SIZE', TRUE, 1, 1, 1),
    ('CA_PHE_SUA_DA', 'TEMPERATURE', TRUE, 1, 1, 2),
    ('CA_PHE_SUA_DA', 'SUGAR', TRUE, 1, 1, 3),
    ('CA_PHE_SUA_DA', 'ICE', TRUE, 1, 1, 4),
    ('CA_PHE_SUA_DA', 'TOPPING', FALSE, 0, 5, 5),
    ('BAC_XIU', 'SIZE', TRUE, 1, 1, 1),
    ('BAC_XIU', 'TEMPERATURE', TRUE, 1, 1, 2),
    ('BAC_XIU', 'SUGAR', TRUE, 1, 1, 3),
    ('BAC_XIU', 'ICE', TRUE, 1, 1, 4),
    ('BAC_XIU', 'TOPPING', FALSE, 0, 5, 5),
    ('CA_PHE_DEN', 'SIZE', TRUE, 1, 1, 1),
    ('CA_PHE_DEN', 'TEMPERATURE', TRUE, 1, 1, 2),
    ('CA_PHE_DEN', 'SUGAR', TRUE, 1, 1, 3),
    ('CA_PHE_DEN', 'ICE', TRUE, 1, 1, 4),
    ('CA_PHE_DEN', 'TOPPING', FALSE, 0, 3, 5),
    ('COLD_BREW_CAM_SA', 'SIZE', TRUE, 1, 1, 1),
    ('COLD_BREW_CAM_SA', 'SUGAR', FALSE, 0, 1, 2),
    ('COLD_BREW_CAM_SA', 'ICE', TRUE, 1, 1, 3),
    ('COLD_BREW_CAM_SA', 'TOPPING', FALSE, 0, 3, 4),
    ('CA_PHE_MUOI', 'SIZE', TRUE, 1, 1, 1),
    ('CA_PHE_MUOI', 'TEMPERATURE', TRUE, 1, 1, 2),
    ('CA_PHE_MUOI', 'SUGAR', TRUE, 1, 1, 3),
    ('CA_PHE_MUOI', 'ICE', TRUE, 1, 1, 4),
    ('CA_PHE_MUOI', 'TOPPING', FALSE, 0, 5, 5),
    ('TRA_DAO_CAM_SA', 'SIZE', TRUE, 1, 1, 1),
    ('TRA_DAO_CAM_SA', 'TEMPERATURE', TRUE, 1, 1, 2),
    ('TRA_DAO_CAM_SA', 'SUGAR', TRUE, 1, 1, 3),
    ('TRA_DAO_CAM_SA', 'ICE', TRUE, 1, 1, 4),
    ('TRA_DAO_CAM_SA', 'TOPPING', FALSE, 0, 5, 5),
    ('TRA_VAI_HOA_LAI', 'SIZE', TRUE, 1, 1, 1),
    ('TRA_VAI_HOA_LAI', 'SUGAR', TRUE, 1, 1, 2),
    ('TRA_VAI_HOA_LAI', 'ICE', TRUE, 1, 1, 3),
    ('TRA_VAI_HOA_LAI', 'TOPPING', FALSE, 0, 5, 4),
    ('TRA_SUA_O_LONG', 'SIZE', TRUE, 1, 1, 1),
    ('TRA_SUA_O_LONG', 'TEMPERATURE', TRUE, 1, 1, 2),
    ('TRA_SUA_O_LONG', 'SUGAR', TRUE, 1, 1, 3),
    ('TRA_SUA_O_LONG', 'ICE', TRUE, 1, 1, 4),
    ('TRA_SUA_O_LONG', 'TOPPING', FALSE, 0, 5, 5),
    ('KHOAI_TAY_CHIEN', 'SPICE', FALSE, 0, 1, 1),
    ('KHOAI_TAY_CHIEN', 'SAUCE', FALSE, 0, 3, 2),
    ('KHOAI_TAY_CHIEN', 'TOPPING', FALSE, 0, 2, 3),
    ('CA_VIEN_CHIEN', 'SPICE', FALSE, 0, 1, 1),
    ('CA_VIEN_CHIEN', 'SAUCE', FALSE, 0, 3, 2),
    ('CA_VIEN_CHIEN', 'TOPPING', FALSE, 0, 2, 3),
    ('BANH_MI_QUE', 'SPICE', FALSE, 0, 1, 1),
    ('BANH_MI_QUE', 'SAUCE', FALSE, 0, 3, 2),
    ('BANH_MI_QUE', 'TOPPING', FALSE, 0, 2, 3)
) AS r(product_code, group_code, is_required, min_select, max_select, display_order)
JOIN products p ON p.code = r.product_code
JOIN option_groups og ON og.code = r.group_code
ON CONFLICT (product_id, option_group_id) DO UPDATE SET
    is_required = EXCLUDED.is_required,
    min_select = EXCLUDED.min_select,
    max_select = EXCLUDED.max_select,
    display_order = EXCLUDED.display_order;

-- Cau hinh bill. Mat khau Wi-Fi de trong, nhap bang trang Cai dat sau.
INSERT INTO shop_settings (
    id, shop_name, shop_address, wifi_name, wifi_password_encrypted,
    receipt_message, show_wifi_on_receipt
)
VALUES (
    1, 'QUÁN NHỎ', 'Địa chỉ quán', 'QUAN_NHO_WIFI', NULL,
    'Cảm ơn quý khách, hẹn gặp lại!', TRUE
)
ON CONFLICT (id) DO NOTHING;

-- API Key de trong, dan bang trang Cai dat sau.
INSERT INTO sepay_settings (
    id, api_key_encrypted, api_key_last4, is_configured
)
VALUES (1, NULL, NULL, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Hai don hang mau cho trang lich su va bao cao.
INSERT INTO orders (
    order_code, status, payment_status, payment_method,
    subtotal, discount_amount, total_amount, payment_amount,
    cash_received, change_amount, refund_amount, created_by,
    created_at, paid_at
)
SELECT
    'QN-000001', 'COMPLETED', 'PAID', 'CASH',
    70000, 0, 70000, 70000,
    100000, 30000, 0, u.id,
    CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day'
FROM users u WHERE u.username = 'admin'
ON CONFLICT (order_code) DO NOTHING;

INSERT INTO orders (
    order_code, status, payment_status, payment_method,
    subtotal, discount_amount, total_amount, payment_amount,
    sepay_transaction_id, transfer_content, refund_amount, created_by,
    created_at, paid_at
)
SELECT
    'QN-000002', 'COMPLETED', 'PAID', 'BANK_TRANSFER',
    76000, 0, 76000, 76000,
    'DEMO-SEPAY-0002', 'QN000002', 0, u.id,
    CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours'
FROM users u WHERE u.username = 'admin'
ON CONFLICT (order_code) DO NOTHING;

INSERT INTO order_items (
    order_id, product_id, product_name, base_price,
    option_extra_price, unit_price, quantity, line_total, customer_note
)
SELECT o.id, p.id, p.name, 29000, 6000, 35000, 1, 35000, 'Ít đá'
FROM orders o
JOIN products p ON p.code = 'CA_PHE_SUA_DA'
WHERE o.order_code = 'QN-000001'
  AND NOT EXISTS (
      SELECT 1 FROM order_items oi
      WHERE oi.order_id = o.id AND oi.product_id = p.id
  );

INSERT INTO order_items (
    order_id, product_id, product_name, base_price,
    option_extra_price, unit_price, quantity, line_total
)
SELECT o.id, p.id, p.name, 35000, 0, 35000, 1, 35000
FROM orders o
JOIN products p ON p.code = 'KHOAI_TAY_CHIEN'
WHERE o.order_code = 'QN-000001'
  AND NOT EXISTS (
      SELECT 1 FROM order_items oi
      WHERE oi.order_id = o.id AND oi.product_id = p.id
  );

INSERT INTO order_items (
    order_id, product_id, product_name, base_price,
    option_extra_price, unit_price, quantity, line_total
)
SELECT o.id, p.id, p.name, 38000, 0, 38000, 2, 76000
FROM orders o
JOIN products p ON p.code = 'TRA_DAO_CAM_SA'
WHERE o.order_code = 'QN-000002'
  AND NOT EXISTS (
      SELECT 1 FROM order_items oi
      WHERE oi.order_id = o.id AND oi.product_id = p.id
  );

-- Snapshot tuy chon cho ca phe sua trong don QN-000001.
INSERT INTO order_item_options (
    order_item_id, option_group_id, option_value_id,
    group_name, option_name, extra_price
)
SELECT oi.id, og.id, ov.id, og.name, ov.name, ov.extra_price
FROM order_items oi
JOIN orders o ON o.id = oi.order_id AND o.order_code = 'QN-000001'
JOIN products p ON p.id = oi.product_id AND p.code = 'CA_PHE_SUA_DA'
JOIN option_groups og ON og.code = 'SIZE'
JOIN option_values ov ON ov.option_group_id = og.id AND ov.code = 'SIZE_M'
WHERE NOT EXISTS (
    SELECT 1 FROM order_item_options x
    WHERE x.order_item_id = oi.id AND x.group_name = og.name
);

INSERT INTO order_item_options (
    order_item_id, option_group_id, option_value_id,
    group_name, option_name, extra_price
)
SELECT oi.id, og.id, ov.id, og.name, ov.name, ov.extra_price
FROM order_items oi
JOIN orders o ON o.id = oi.order_id AND o.order_code = 'QN-000001'
JOIN products p ON p.id = oi.product_id AND p.code = 'CA_PHE_SUA_DA'
JOIN option_groups og ON og.code = 'SUGAR'
JOIN option_values ov ON ov.option_group_id = og.id AND ov.code = 'SUGAR_50'
WHERE NOT EXISTS (
    SELECT 1 FROM order_item_options x
    WHERE x.order_item_id = oi.id AND x.group_name = og.name
);

INSERT INTO order_item_options (
    order_item_id, option_group_id, option_value_id,
    group_name, option_name, extra_price
)
SELECT oi.id, og.id, ov.id, og.name, ov.name, ov.extra_price
FROM order_items oi
JOIN orders o ON o.id = oi.order_id AND o.order_code = 'QN-000001'
JOIN products p ON p.id = oi.product_id AND p.code = 'CA_PHE_SUA_DA'
JOIN option_groups og ON og.code = 'ICE'
JOIN option_values ov ON ov.option_group_id = og.id AND ov.code = 'ICE_LESS'
WHERE NOT EXISTS (
    SELECT 1 FROM order_item_options x
    WHERE x.order_item_id = oi.id AND x.group_name = og.name
);

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
