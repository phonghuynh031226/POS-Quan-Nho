BEGIN;

-- 1. Test Owner User (admin / 123456)
INSERT INTO users(id, username, email, password_hash, full_name, role, is_active)
VALUES (1, 'admin', 'admin@quannho.vn', crypt('123456', gen_salt('bf', 10)), 'Chủ quán', 'OWNER', true)
ON CONFLICT (username) DO UPDATE SET password_hash = crypt('123456', gen_salt('bf', 10)), is_active = true;

-- 2. Test Category
INSERT INTO categories(id, code, name, display_order, is_active)
VALUES (1, 'COFFEE', 'Cà phê', 1, true)
ON CONFLICT (code) DO NOTHING;

-- 3. Test Products
INSERT INTO products(id, category_id, code, name, base_price, is_available, display_order)
VALUES (1, 1, 'CA_PHE_SUA_DA', 'Cà phê sữa đá', 29000, true, 1)
ON CONFLICT (code) DO NOTHING;

-- 4. Test Option Groups (IDs: 1=SIZE, 2=TEMPERATURE, 3=SUGAR, 4=ICE)
INSERT INTO option_groups(id, code, name, selection_type, default_required, default_min_select, default_max_select, display_order)
VALUES
    (1, 'SIZE', 'Kích cỡ', 'SINGLE', true, 1, 1, 1),
    (2, 'TEMPERATURE', 'Nhiệt độ', 'SINGLE', true, 1, 1, 2),
    (3, 'SUGAR', 'Mức đường', 'SINGLE', true, 1, 1, 3),
    (4, 'ICE', 'Mức đá', 'SINGLE', true, 1, 1, 4)
ON CONFLICT (code) DO NOTHING;

-- 5. Test Option Values
INSERT INTO option_values(id, option_group_id, code, name, extra_price, is_default, display_order)
VALUES
    (1, 1, 'SIZE_S', 'Size S', 0, false, 1),
    (2, 1, 'SIZE_M', 'Size M', 6000, true, 2),
    (3, 2, 'ICED', 'Uống đá', 0, true, 1),
    (4, 2, 'HOT', 'Uống nóng', 0, false, 2),
    (5, 3, 'SUGAR_100', '100% đường', 0, true, 1),
    (6, 3, 'SUGAR_50', '50% đường', 0, false, 2),
    (7, 4, 'ICE_NORMAL', 'Bình thường', 0, true, 1),
    (8, 4, 'ICE_LESS', 'Ít đá', 0, false, 2)
ON CONFLICT (option_group_id, code) DO NOTHING;

-- 6. Link Product and Option Groups
INSERT INTO product_option_groups(product_id, option_group_id, is_required, min_select, max_select, display_order)
VALUES
    (1, 1, true, 1, 1, 1),
    (1, 2, true, 1, 1, 2),
    (1, 3, true, 1, 1, 3),
    (1, 4, true, 1, 1, 4)
ON CONFLICT (product_id, option_group_id) DO NOTHING;

-- 7. Reset sequences to prevent duplicate key errors on subsequent inserts
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM categories));
SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM products));
SELECT setval('option_groups_id_seq', (SELECT COALESCE(MAX(id), 1) FROM option_groups));
SELECT setval('option_values_id_seq', (SELECT COALESCE(MAX(id), 1) FROM option_values));
SELECT setval('product_option_groups_id_seq', (SELECT COALESCE(MAX(id), 1) FROM product_option_groups));

-- 8. Shop settings and Sepay settings
INSERT INTO shop_settings(id, shop_name, phone, shop_address, show_wifi_on_receipt)
VALUES (1, 'Quán Nhỏ Test', '0901234567', '123 Đường Test', true)
ON CONFLICT (id) DO NOTHING;
SELECT setval('shop_settings_id_seq', (SELECT COALESCE(MAX(id), 1) FROM shop_settings));

INSERT INTO sepay_settings(id, is_configured)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;
SELECT setval('sepay_settings_id_seq', (SELECT COALESCE(MAX(id), 1) FROM sepay_settings));

COMMIT;
