BEGIN;

-- =========================================================
-- POS QUAN NHO - MENU SCHEMA
-- Script an toan khi chay lai: khong DROP bang, khong nhan doi du lieu.
-- Tien te duoc luu bang so nguyen VND (29000 = 29.000 dong).
-- =========================================================

CREATE TABLE IF NOT EXISTS categories (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(50) NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    description     VARCHAR(500),
    display_order   INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id              BIGSERIAL PRIMARY KEY,
    category_id     BIGINT NOT NULL REFERENCES categories(id),
    code            VARCHAR(50) NOT NULL UNIQUE,
    name            VARCHAR(200) NOT NULL,
    description     VARCHAR(1000),
    base_price      BIGINT NOT NULL CHECK (base_price >= 0),
    image_url       TEXT,
    is_available    BOOLEAN NOT NULL DEFAULT TRUE,
    display_order   INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Nhom tuy chon dung chung, khong thuoc co dinh vao san pham.
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
    CONSTRAINT chk_option_group_type
        CHECK (selection_type IN ('SINGLE', 'MULTIPLE')),
    CONSTRAINT chk_option_group_range
        CHECK (
            default_min_select >= 0
            AND default_max_select >= default_min_select
        )
);

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
    CONSTRAINT uq_option_value_code UNIQUE (option_group_id, code)
);

-- San pham can nhom nao thi tao quan he voi nhom do.
CREATE TABLE IF NOT EXISTS product_option_groups (
    id               BIGSERIAL PRIMARY KEY,
    product_id       BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    option_group_id  BIGINT NOT NULL REFERENCES option_groups(id),
    is_required      BOOLEAN NOT NULL DEFAULT FALSE,
    min_select       INTEGER NOT NULL DEFAULT 0,
    max_select       INTEGER NOT NULL DEFAULT 1,
    display_order    INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_product_option_group UNIQUE (product_id, option_group_id),
    CONSTRAINT chk_product_option_group_range
        CHECK (min_select >= 0 AND max_select >= min_select)
);

CREATE INDEX IF NOT EXISTS idx_products_category
    ON products(category_id);

CREATE INDEX IF NOT EXISTS idx_option_values_group
    ON option_values(option_group_id);

CREATE INDEX IF NOT EXISTS idx_product_option_groups_product
    ON product_option_groups(product_id);

-- =========================================================
-- DANH MUC
-- =========================================================

COMMIT;

-- Kiem tra nhanh sau khi chay:
SELECT 'categories' AS table_name, COUNT(*) AS row_count FROM categories
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'option_groups', COUNT(*) FROM option_groups
UNION ALL
SELECT 'option_values', COUNT(*) FROM option_values
UNION ALL
SELECT 'product_option_groups', COUNT(*) FROM product_option_groups;
