BEGIN;

-- =========================================================
-- POS QUAN NHO - MENU SCHEMA + DEMO DATA
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

INSERT INTO categories (code, name, display_order, is_active)
VALUES
    ('COFFEE',       'Cà phê',                  1, TRUE),
    ('OTHER_DRINKS', 'Trà & Nước khác',         2, TRUE),
    ('MILK_TEA',     'Trà sữa',                 3, TRUE),
    ('SNACKS',       'Đồ ăn vặt',               4, TRUE),
    ('BAKERY',       'Bánh ngọt & Điểm tâm',    5, TRUE)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- =========================================================
-- SAN PHAM
-- =========================================================

INSERT INTO products (
    category_id, code, name, description, base_price,
    image_url, is_available, display_order
)
SELECT
    c.id,
    p.code,
    p.name,
    p.description,
    p.base_price,
    p.image_url,
    p.is_available,
    p.display_order
FROM categories c
JOIN (VALUES
    ('COFFEE', 'CA_PHE_SUA_DA',
     'Cà phê sữa đá truyền thống',
     'Cà phê phin Robusta Đắk Lắk đậm đà hòa quyện cùng sữa đặc thơm béo.',
     29000,
     'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=60',
     TRUE, 1),

    ('COFFEE', 'BAC_XIU',
     'Bạc xỉu kem sữa 3 tầng',
     'Nhiều sữa tươi béo ngọt, nhẹ nhàng vị cà phê, phù hợp với người thích ngọt dịu.',
     32000,
     'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60',
     TRUE, 2),

    ('COFFEE', 'CA_PHE_DEN',
     'Cà phê đen đá phin',
     'Cà phê đen nguyên chất đậm chất Việt, thơm và đắng đặc trưng.',
     25000,
     'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60',
     TRUE, 3),

    ('COFFEE', 'COLD_BREW_CAM_SA',
     'Cold Brew cam vàng sả tươi',
     'Cà phê ủ lạnh kết hợp cam vàng và hương sả tươi.',
     45000,
     'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=60',
     TRUE, 4),

    ('COFFEE', 'CA_PHE_MUOI',
     'Cà phê muối xứ Huế',
     'Lớp kem mặn béo hòa quyện với vị cà phê đắng đậm.',
     35000,
     'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop&q=60',
     TRUE, 5),

    ('OTHER_DRINKS', 'TRA_DAO_CAM_SA',
     'Trà đào cam sả thanh nhiệt',
     'Trà thơm dịu với đào giòn, cam và sả tươi.',
     38000,
     'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=60',
     TRUE, 6),

    ('OTHER_DRINKS', 'TRA_VAI_HOA_LAI',
     'Trà vải hoa lài hạt sen',
     'Trà hoa lài kết hợp trái vải ngọt và hạt sen bùi.',
     38000,
     'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60',
     TRUE, 7),

    ('MILK_TEA', 'TRA_SUA_O_LONG_NUONG',
     'Trà sữa Ô long nướng trân châu',
     'Trà ô long nướng đậm vị kết hợp trân châu đường nâu.',
     42000,
     'https://images.unsplash.com/photo-1558857563-b371033873b8?w=500&auto=format&fit=crop&q=60',
     FALSE, 8),

    ('SNACKS', 'KHOAI_TAY_CHIEN',
     'Khoai tây chiên lắc phô mai',
     'Khoai chiên giòn phủ bột phô mai mặn béo.',
     35000,
     'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60',
     TRUE, 9),

    ('SNACKS', 'CA_VIEN_CHIEN',
     'Cá viên chiên sốt mắm tỏi bơ',
     'Cá viên chiên xóc mắm tỏi ớt và bơ thơm.',
     35000,
     'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60',
     TRUE, 10),

    ('SNACKS', 'BANH_MI_QUE',
     'Bánh mì que Hải Phòng (2 chiếc)',
     'Bánh mì que nướng giòn với nhân pate và tương ớt.',
     24000,
     'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=60',
     TRUE, 11)
) AS p(
    category_code, code, name, description, base_price,
    image_url, is_available, display_order
) ON c.code = p.category_code
ON CONFLICT (code) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    base_price = EXCLUDED.base_price,
    image_url = EXCLUDED.image_url,
    is_available = EXCLUDED.is_available,
    display_order = EXCLUDED.display_order,
    updated_at = CURRENT_TIMESTAMP;

-- =========================================================
-- NHOM TUY CHON DUNG CHUNG
-- =========================================================

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

-- =========================================================
-- GIA TRI TUY CHON
-- =========================================================

INSERT INTO option_values (
    option_group_id, code, name, extra_price,
    is_default, display_order, is_active
)
SELECT
    og.id,
    v.code,
    v.name,
    v.extra_price,
    v.is_default,
    v.display_order,
    TRUE
FROM option_groups og
JOIN (VALUES
    ('SIZE',        'SIZE_S',          'Size S',                  0, FALSE, 1),
    ('SIZE',        'SIZE_M',          'Size M',               6000, TRUE,  2),
    ('SIZE',        'SIZE_L',          'Size L',              11000, FALSE, 3),

    ('TEMPERATURE', 'ICED',            'Lạnh (đá)',               0, TRUE,  1),
    ('TEMPERATURE', 'HOT',             'Nóng',                    0, FALSE, 2),

    ('SUGAR',       'SUGAR_100',       '100% đường',              0, TRUE,  1),
    ('SUGAR',       'SUGAR_70',        '70% đường',               0, FALSE, 2),
    ('SUGAR',       'SUGAR_50',        '50% đường',               0, FALSE, 3),
    ('SUGAR',       'SUGAR_30',        '30% đường',               0, FALSE, 4),
    ('SUGAR',       'SUGAR_0',         'Không đường',             0, FALSE, 5),

    ('ICE',         'ICE_NORMAL',      'Đá bình thường',          0, TRUE,  1),
    ('ICE',         'ICE_LESS',        'Ít đá',                   0, FALSE, 2),
    ('ICE',         'ICE_NONE',        'Không đá',                0, FALSE, 3),
    ('ICE',         'ICE_MORE',        'Nhiều đá',                0, FALSE, 4),

    ('TOPPING',     'BLACK_PEARL',     'Trân châu đen',        6000, FALSE, 1),
    ('TOPPING',     'COFFEE_JELLY',    'Thạch cà phê giòn',    6000, FALSE, 2),
    ('TOPPING',     'MACCHIATO',       'Kem béo Macchiato',    8000, FALSE, 3),
    ('TOPPING',     'CHEESE_CREAM',    'Kem cheese',          10000, FALSE, 4),
    ('TOPPING',     'ESPRESSO_SHOT',   'Thêm 1 shot Espresso',10000, FALSE, 5),
    ('TOPPING',     'ALOE_VERA',       'Thạch nha đam',        6000, FALSE, 6),
    ('TOPPING',     'LYCHEE',          'Thêm trái vải',        8000, FALSE, 7),
    ('TOPPING',     'PEACH',           'Thêm miếng đào',      10000, FALSE, 8),
    ('TOPPING',     'CHEESE',          'Thêm phô mai',         6000, FALSE, 9),
    ('TOPPING',     'FRIED_OKRA',      'Thêm đậu bắp chiên',   5000, FALSE, 10),

    ('SPICE',       'NOT_SPICY',       'Không cay',               0, TRUE,  1),
    ('SPICE',       'MILD',            'Cay nhẹ',                 0, FALSE, 2),
    ('SPICE',       'MEDIUM',          'Cay vừa',                 0, FALSE, 3),
    ('SPICE',       'VERY_SPICY',      'Rất cay',                 0, FALSE, 4),

    ('SAUCE',       'MAYONNAISE',      'Sốt Mayonnaise',       4000, FALSE, 1),
    ('SAUCE',       'CHILI_SAUCE',     'Sốt tương ớt',            0, FALSE, 2),
    ('SAUCE',       'TOMATO_SAUCE',    'Sốt tương cà',            0, FALSE, 3)
) AS v(group_code, code, name, extra_price, is_default, display_order)
    ON og.code = v.group_code
ON CONFLICT (option_group_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    extra_price = EXCLUDED.extra_price,
    is_default = EXCLUDED.is_default,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- =========================================================
-- GAN NHOM TUY CHON CHO SAN PHAM
-- =========================================================

INSERT INTO product_option_groups (
    product_id, option_group_id, is_required,
    min_select, max_select, display_order
)
SELECT
    p.id,
    og.id,
    r.is_required,
    r.min_select,
    r.max_select,
    r.display_order
FROM (VALUES
    ('CA_PHE_SUA_DA',       'SIZE',        TRUE,  1, 1, 1),
    ('CA_PHE_SUA_DA',       'TEMPERATURE', TRUE,  1, 1, 2),
    ('CA_PHE_SUA_DA',       'SUGAR',       TRUE,  1, 1, 3),
    ('CA_PHE_SUA_DA',       'ICE',         TRUE,  1, 1, 4),
    ('CA_PHE_SUA_DA',       'TOPPING',     FALSE, 0, 5, 5),

    ('BAC_XIU',             'SIZE',        TRUE,  1, 1, 1),
    ('BAC_XIU',             'TEMPERATURE', TRUE,  1, 1, 2),
    ('BAC_XIU',             'SUGAR',       TRUE,  1, 1, 3),
    ('BAC_XIU',             'ICE',         TRUE,  1, 1, 4),
    ('BAC_XIU',             'TOPPING',     FALSE, 0, 5, 5),

    ('CA_PHE_DEN',          'SIZE',        TRUE,  1, 1, 1),
    ('CA_PHE_DEN',          'TEMPERATURE', TRUE,  1, 1, 2),
    ('CA_PHE_DEN',          'SUGAR',       TRUE,  1, 1, 3),
    ('CA_PHE_DEN',          'ICE',         TRUE,  1, 1, 4),
    ('CA_PHE_DEN',          'TOPPING',     FALSE, 0, 3, 5),

    ('COLD_BREW_CAM_SA',    'SIZE',        TRUE,  1, 1, 1),
    ('COLD_BREW_CAM_SA',    'SUGAR',       FALSE, 0, 1, 2),
    ('COLD_BREW_CAM_SA',    'ICE',         TRUE,  1, 1, 3),
    ('COLD_BREW_CAM_SA',    'TOPPING',     FALSE, 0, 3, 4),

    ('CA_PHE_MUOI',         'SIZE',        TRUE,  1, 1, 1),
    ('CA_PHE_MUOI',         'TEMPERATURE', TRUE,  1, 1, 2),
    ('CA_PHE_MUOI',         'SUGAR',       TRUE,  1, 1, 3),
    ('CA_PHE_MUOI',         'ICE',         TRUE,  1, 1, 4),
    ('CA_PHE_MUOI',         'TOPPING',     FALSE, 0, 5, 5),

    ('TRA_DAO_CAM_SA',      'SIZE',        TRUE,  1, 1, 1),
    ('TRA_DAO_CAM_SA',      'TEMPERATURE', TRUE,  1, 1, 2),
    ('TRA_DAO_CAM_SA',      'SUGAR',       TRUE,  1, 1, 3),
    ('TRA_DAO_CAM_SA',      'ICE',         TRUE,  1, 1, 4),
    ('TRA_DAO_CAM_SA',      'TOPPING',     FALSE, 0, 5, 5),

    ('TRA_VAI_HOA_LAI',     'SIZE',        TRUE,  1, 1, 1),
    ('TRA_VAI_HOA_LAI',     'SUGAR',       TRUE,  1, 1, 2),
    ('TRA_VAI_HOA_LAI',     'ICE',         TRUE,  1, 1, 3),
    ('TRA_VAI_HOA_LAI',     'TOPPING',     FALSE, 0, 5, 4),

    ('TRA_SUA_O_LONG_NUONG','SIZE',        TRUE,  1, 1, 1),
    ('TRA_SUA_O_LONG_NUONG','TEMPERATURE', TRUE,  1, 1, 2),
    ('TRA_SUA_O_LONG_NUONG','SUGAR',       TRUE,  1, 1, 3),
    ('TRA_SUA_O_LONG_NUONG','ICE',         TRUE,  1, 1, 4),
    ('TRA_SUA_O_LONG_NUONG','TOPPING',     FALSE, 0, 5, 5),

    ('KHOAI_TAY_CHIEN',     'SPICE',       FALSE, 0, 1, 1),
    ('KHOAI_TAY_CHIEN',     'SAUCE',       FALSE, 0, 3, 2),
    ('KHOAI_TAY_CHIEN',     'TOPPING',     FALSE, 0, 2, 3),

    ('CA_VIEN_CHIEN',       'SPICE',       FALSE, 0, 1, 1),
    ('CA_VIEN_CHIEN',       'SAUCE',       FALSE, 0, 3, 2),
    ('CA_VIEN_CHIEN',       'TOPPING',     FALSE, 0, 2, 3),

    ('BANH_MI_QUE',         'SPICE',       FALSE, 0, 1, 1),
    ('BANH_MI_QUE',         'SAUCE',       FALSE, 0, 3, 2),
    ('BANH_MI_QUE',         'TOPPING',     FALSE, 0, 2, 3)
) AS r(product_code, group_code, is_required, min_select, max_select, display_order)
JOIN products p ON p.code = r.product_code
JOIN option_groups og ON og.code = r.group_code
ON CONFLICT (product_id, option_group_id) DO UPDATE SET
    is_required = EXCLUDED.is_required,
    min_select = EXCLUDED.min_select,
    max_select = EXCLUDED.max_select,
    display_order = EXCLUDED.display_order;

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
