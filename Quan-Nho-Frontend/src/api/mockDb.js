import { generateToken } from '../utils/formatters.js'
import {
  DEFAULT_SHOP_SETTINGS,
  DEFAULT_SEPAY_SETTINGS,
  DEFAULT_STORE_SETTINGS,
} from '../constants/index.js'

// 11 Storage Keys corresponding to the 11 database tables
export const STORAGE_KEYS = {
  USERS: 'pos_qn_users_v2',
  CATEGORIES: 'pos_qn_categories_v2',
  PRODUCTS: 'pos_qn_products_v2',
  OPTION_GROUPS: 'pos_qn_option_groups_v2',
  OPTION_VALUES: 'pos_qn_option_values_v2',
  PRODUCT_OPTION_GROUPS: 'pos_qn_product_option_groups_v2',
  ORDERS: 'pos_qn_orders_v2',
  ORDER_ITEMS: 'pos_qn_order_items_v2',
  ORDER_ITEM_OPTIONS: 'pos_qn_order_item_options_v2',
  SHOP_SETTINGS: 'pos_qn_shop_settings_v2',
  SEPAY_SETTINGS: 'pos_qn_sepay_settings_v2',

  // Session & Runtime state
  CURRENT_USER: 'pos_qn_current_user_v2',
  ORDER_SEQUENCE: 'pos_qn_order_seq_v2',
  SETTINGS: 'pos_qn_store_settings_v2',
}

const BROADCAST_CHANNEL_NAME = 'pos_qn_channel_v2'

// Table 1: users (Sample data: admin / Chủ quán / OWNER)
const INITIAL_USERS = [
  {
    id: 1,
    username: 'admin',
    email: 'giamdoc@gmail.com',
    password_hash: '$2a$10$w81oGj8aBq3kXmZq9X6P4eF1.2yZ3a4b5c6d7e8f9g0h1i2j3k4l5',
    full_name: 'Chủ quán',
    name: 'Chủ quán',
    role: 'OWNER',
    is_active: true,
    isActive: true,
    last_login_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Table 2: categories (Khóa ngoại: id, code, name, display_order, is_active - KHÔNG có description)
const INITIAL_CATEGORIES = [
  { id: 1, code: 'COFFEE', name: 'Cà phê', display_order: 1, is_active: true },
  { id: 2, code: 'OTHER_DRINKS', name: 'Trà & Nước khác', display_order: 2, is_active: true },
  { id: 3, code: 'MILK_TEA', name: 'Trà sữa', display_order: 3, is_active: true },
  { id: 4, code: 'SNACKS', name: 'Đồ ăn vặt', display_order: 4, is_active: true },
  { id: 5, code: 'BAKERY', name: 'Bánh ngọt & Điểm tâm', display_order: 5, is_active: true },
]

// Table 3: products (Khóa ngoại: category_id -> categories.id - KHÔNG có description)
const INITIAL_PRODUCTS = [
  {
    id: 1,
    category_id: 1,
    code: 'CA_PHE_SUA_DA',
    name: 'Cà phê sữa đá truyền thống',
    base_price: 29000,
    image_url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=60',
    is_available: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    category_id: 1,
    code: 'BAC_XIU',
    name: 'Bạc xỉu kem sữa 3 tầng',
    base_price: 32000,
    image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60',
    is_available: true,
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    category_id: 1,
    code: 'CA_PHE_DEN',
    name: 'Cà phê đen đá phin',
    base_price: 25000,
    image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60',
    is_available: true,
    display_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    category_id: 1,
    code: 'COLD_BREW_CAM_SA',
    name: 'Cold Brew cam sả',
    base_price: 45000,
    image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=60',
    is_available: true,
    display_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    category_id: 1,
    code: 'CA_PHE_MUOI',
    name: 'Cà phê muối',
    base_price: 35000,
    image_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop&q=60',
    is_available: true,
    display_order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 6,
    category_id: 2,
    code: 'TRA_DAO_CAM_SA',
    name: 'Trà đào cam sả',
    base_price: 38000,
    image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=60',
    is_available: true,
    display_order: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 7,
    category_id: 2,
    code: 'TRA_VAI_HOA_LAI',
    name: 'Trà vải hoa lài',
    base_price: 38000,
    image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60',
    is_available: true,
    display_order: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 8,
    category_id: 3,
    code: 'TRA_SUA_O_LONG',
    name: 'Trà sữa Ô long nướng',
    base_price: 42000,
    image_url: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=500&auto=format&fit=crop&q=60',
    is_available: true,
    display_order: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 9,
    category_id: 4,
    code: 'KHOAI_TAY_CHIEN',
    name: 'Khoai tây chiên phô mai',
    base_price: 35000,
    image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60',
    is_available: true,
    display_order: 9,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 10,
    category_id: 4,
    code: 'CA_VIEN_CHIEN',
    name: 'Cá viên chiên sốt mắm',
    base_price: 35000,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60',
    is_available: true,
    display_order: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 11,
    category_id: 4,
    code: 'BANH_MI_QUE',
    name: 'Bánh mì que Hải Phòng',
    base_price: 24000,
    image_url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=60',
    is_available: true,
    display_order: 11,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Table 4: option_groups
const INITIAL_OPTION_GROUPS = [
  {
    id: 1,
    code: 'SIZE',
    name: 'Size',
    selection_type: 'SINGLE',
    default_required: true,
    default_min_select: 1,
    default_max_select: 1,
    display_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    code: 'TEMPERATURE',
    name: 'Nhiệt độ',
    selection_type: 'SINGLE',
    default_required: true,
    default_min_select: 1,
    default_max_select: 1,
    display_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    code: 'SUGAR',
    name: 'Lượng đường',
    selection_type: 'SINGLE',
    default_required: true,
    default_min_select: 1,
    default_max_select: 1,
    display_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    code: 'ICE',
    name: 'Lượng đá',
    selection_type: 'SINGLE',
    default_required: true,
    default_min_select: 1,
    default_max_select: 1,
    display_order: 4,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    code: 'TOPPING',
    name: 'Topping',
    selection_type: 'MULTIPLE',
    default_required: false,
    default_min_select: 0,
    default_max_select: 5,
    display_order: 5,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 6,
    code: 'SPICE',
    name: 'Mức độ cay',
    selection_type: 'SINGLE',
    default_required: false,
    default_min_select: 0,
    default_max_select: 1,
    display_order: 6,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 7,
    code: 'SAUCE',
    name: 'Sốt dùng kèm',
    selection_type: 'MULTIPLE',
    default_required: false,
    default_min_select: 0,
    default_max_select: 3,
    display_order: 7,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Table 5: option_values
const INITIAL_OPTION_VALUES = [
  // Size (option_group_id: 1)
  { id: 1, option_group_id: 1, code: 'SIZE_S', name: 'Size S', extra_price: 0, is_default: true, display_order: 1, is_active: true },
  { id: 2, option_group_id: 1, code: 'SIZE_M', name: 'Size M', extra_price: 6000, is_default: false, display_order: 2, is_active: true },
  { id: 3, option_group_id: 1, code: 'SIZE_L', name: 'Size L', extra_price: 11000, is_default: false, display_order: 3, is_active: true },

  // Nhiệt độ (option_group_id: 2)
  { id: 4, option_group_id: 2, code: 'ICED', name: 'Lạnh', extra_price: 0, is_default: true, display_order: 1, is_active: true },
  { id: 5, option_group_id: 2, code: 'HOT', name: 'Nóng', extra_price: 0, is_default: false, display_order: 2, is_active: true },

  // Đường (option_group_id: 3)
  { id: 6, option_group_id: 3, code: 'SUGAR_100', name: '100% đường', extra_price: 0, is_default: true, display_order: 1, is_active: true },
  { id: 7, option_group_id: 3, code: 'SUGAR_70', name: '70% đường', extra_price: 0, is_default: false, display_order: 2, is_active: true },
  { id: 8, option_group_id: 3, code: 'SUGAR_50', name: '50% đường', extra_price: 0, is_default: false, display_order: 3, is_active: true },
  { id: 9, option_group_id: 3, code: 'SUGAR_30', name: '30% đường', extra_price: 0, is_default: false, display_order: 4, is_active: true },
  { id: 10, option_group_id: 3, code: 'SUGAR_0', name: 'Không đường', extra_price: 0, is_default: false, display_order: 5, is_active: true },

  // Đá (option_group_id: 4)
  { id: 11, option_group_id: 4, code: 'ICE_NORMAL', name: 'Đá bình thường', extra_price: 0, is_default: true, display_order: 1, is_active: true },
  { id: 12, option_group_id: 4, code: 'ICE_LESS', name: 'Ít đá', extra_price: 0, is_default: false, display_order: 2, is_active: true },
  { id: 13, option_group_id: 4, code: 'ICE_NONE', name: 'Không đá', extra_price: 0, is_default: false, display_order: 3, is_active: true },

  // Topping (option_group_id: 5)
  { id: 14, option_group_id: 5, code: 'BLACK_PEARL', name: 'Trân châu', extra_price: 6000, is_default: false, display_order: 1, is_active: true },
  { id: 15, option_group_id: 5, code: 'CHEESE_CREAM', name: 'Kem cheese', extra_price: 10000, is_default: false, display_order: 2, is_active: true },
  { id: 16, option_group_id: 5, code: 'ESPRESSO_SHOT', name: 'Thêm shot Espresso', extra_price: 10000, is_default: false, display_order: 3, is_active: true },

  // Cay (option_group_id: 6)
  { id: 17, option_group_id: 6, code: 'NOT_SPICY', name: 'Không cay', extra_price: 0, is_default: true, display_order: 1, is_active: true },
  { id: 18, option_group_id: 6, code: 'MILD', name: 'Cay nhẹ', extra_price: 0, is_default: false, display_order: 2, is_active: true },
  { id: 19, option_group_id: 6, code: 'VERY_SPICY', name: 'Rất cay', extra_price: 0, is_default: false, display_order: 3, is_active: true },

  // Sốt (option_group_id: 7)
  { id: 20, option_group_id: 7, code: 'MAYONNAISE', name: 'Sốt Mayonnaise', extra_price: 4000, is_default: false, display_order: 1, is_active: true },
  { id: 21, option_group_id: 7, code: 'CHILI_SAUCE', name: 'Sốt tương ớt', extra_price: 0, is_default: false, display_order: 2, is_active: true },
  { id: 22, option_group_id: 7, code: 'TOMATO_SAUCE', name: 'Sốt tương cà', extra_price: 0, is_default: false, display_order: 3, is_active: true },
]

// Table 6: product_option_groups
const INITIAL_PRODUCT_OPTION_GROUPS = [
  // Product 1: Cà phê sữa đá (Size, Nhiệt độ, Đường, Đá, Topping)
  { id: 1, product_id: 1, option_group_id: 1, is_required: true, min_select: 1, max_select: 1, display_order: 1 },
  { id: 2, product_id: 1, option_group_id: 2, is_required: true, min_select: 1, max_select: 1, display_order: 2 },
  { id: 3, product_id: 1, option_group_id: 3, is_required: true, min_select: 1, max_select: 1, display_order: 3 },
  { id: 4, product_id: 1, option_group_id: 4, is_required: true, min_select: 1, max_select: 1, display_order: 4 },
  { id: 5, product_id: 1, option_group_id: 5, is_required: false, min_select: 0, max_select: 5, display_order: 5 },

  // Product 2: Bạc xỉu (Size, Nhiệt độ, Đường, Đá, Topping)
  { id: 6, product_id: 2, option_group_id: 1, is_required: true, min_select: 1, max_select: 1, display_order: 1 },
  { id: 7, product_id: 2, option_group_id: 2, is_required: true, min_select: 1, max_select: 1, display_order: 2 },
  { id: 8, product_id: 2, option_group_id: 3, is_required: true, min_select: 1, max_select: 1, display_order: 3 },
  { id: 9, product_id: 2, option_group_id: 4, is_required: true, min_select: 1, max_select: 1, display_order: 4 },
  { id: 10, product_id: 2, option_group_id: 5, is_required: false, min_select: 0, max_select: 5, display_order: 5 },

  // Product 3: Cà phê đen (Size, Nhiệt độ, Đường, Đá)
  { id: 11, product_id: 3, option_group_id: 1, is_required: true, min_select: 1, max_select: 1, display_order: 1 },
  { id: 12, product_id: 3, option_group_id: 2, is_required: true, min_select: 1, max_select: 1, display_order: 2 },
  { id: 13, product_id: 3, option_group_id: 3, is_required: true, min_select: 1, max_select: 1, display_order: 3 },
  { id: 14, product_id: 3, option_group_id: 4, is_required: true, min_select: 1, max_select: 1, display_order: 4 },

  // Product 4: Cold Brew (Size, Đường, Đá)
  { id: 15, product_id: 4, option_group_id: 1, is_required: true, min_select: 1, max_select: 1, display_order: 1 },
  { id: 16, product_id: 4, option_group_id: 3, is_required: false, min_select: 0, max_select: 1, display_order: 2 },
  { id: 17, product_id: 4, option_group_id: 4, is_required: true, min_select: 1, max_select: 1, display_order: 3 },

  // Product 5: Cà phê muối (Size, Nhiệt độ, Đường, Đá, Topping)
  { id: 18, product_id: 5, option_group_id: 1, is_required: true, min_select: 1, max_select: 1, display_order: 1 },
  { id: 19, product_id: 5, option_group_id: 2, is_required: true, min_select: 1, max_select: 1, display_order: 2 },
  { id: 20, product_id: 5, option_group_id: 3, is_required: true, min_select: 1, max_select: 1, display_order: 3 },
  { id: 21, product_id: 5, option_group_id: 4, is_required: true, min_select: 1, max_select: 1, display_order: 4 },
  { id: 22, product_id: 5, option_group_id: 5, is_required: false, min_select: 0, max_select: 5, display_order: 5 },

  // Product 6: Trà đào cam sả (Size, Đường, Đá, Topping)
  { id: 23, product_id: 6, option_group_id: 1, is_required: true, min_select: 1, max_select: 1, display_order: 1 },
  { id: 24, product_id: 6, option_group_id: 3, is_required: true, min_select: 1, max_select: 1, display_order: 2 },
  { id: 25, product_id: 6, option_group_id: 4, is_required: true, min_select: 1, max_select: 1, display_order: 3 },
  { id: 26, product_id: 6, option_group_id: 5, is_required: false, min_select: 0, max_select: 5, display_order: 4 },

  // Product 8: Trà sữa Ô long nướng (Size, Nhiệt độ, Đường, Đá, Topping)
  { id: 27, product_id: 8, option_group_id: 1, is_required: true, min_select: 1, max_select: 1, display_order: 1 },
  { id: 28, product_id: 8, option_group_id: 2, is_required: true, min_select: 1, max_select: 1, display_order: 2 },
  { id: 29, product_id: 8, option_group_id: 3, is_required: true, min_select: 1, max_select: 1, display_order: 3 },
  { id: 30, product_id: 8, option_group_id: 4, is_required: true, min_select: 1, max_select: 1, display_order: 4 },
  { id: 31, product_id: 8, option_group_id: 5, is_required: false, min_select: 0, max_select: 5, display_order: 5 },

  // Product 9: Khoai tây chiên (Mức độ cay, Sốt)
  { id: 32, product_id: 9, option_group_id: 6, is_required: false, min_select: 0, max_select: 1, display_order: 1 },
  { id: 33, product_id: 9, option_group_id: 7, is_required: false, min_select: 0, max_select: 3, display_order: 2 },
]

// Table 7, 8, 9: orders, order_items, order_item_options
function createInitialOrders() {
  const now = Date.now()
  return [
    {
      id: 1,
      order_code: 'QN-000001',
      token: 'demo001tok',
      status: 'COMPLETED',
      payment_status: 'PAID',
      payment_method: 'CASH',
      subtotal: 64000,
      discount_amount: 0,
      total_amount: 64000,
      payment_amount: 64000,
      cash_received: 100000,
      change_amount: 36000,
      sepay_transaction_id: null,
      transfer_content: null,
      customer_note: 'Mang đi túi đôi',
      cancel_reason: null,
      refund_amount: 0,
      created_by: 1,
      created_at: new Date(now - 14 * 60000).toISOString(),
      paid_at: new Date(now - 14 * 60000).toISOString(),
      cancelled_at: null,
      refunded_at: null,
      updated_at: new Date(now - 12 * 60000).toISOString(),
      order_items: [
        {
          id: 1,
          order_id: 1,
          product_id: 1,
          product_name: 'Cà phê sữa đá truyền thống',
          base_price: 29000,
          option_extra_price: 6000,
          unit_price: 35000,
          quantity: 1,
          line_total: 35000,
          customer_note: 'Mang đi túi đôi',
          created_at: new Date(now - 14 * 60000).toISOString(),
          order_item_options: [
            { id: 1, order_item_id: 1, option_group_id: 1, option_value_id: 2, group_name: 'Size', option_name: 'Size M', extra_price: 6000 },
            { id: 2, order_item_id: 1, option_group_id: 2, option_value_id: 4, group_name: 'Nhiệt độ', option_name: 'Lạnh', extra_price: 0 },
            { id: 3, order_item_id: 1, option_group_id: 3, option_value_id: 7, group_name: 'Lượng đường', option_name: '70% đường', extra_price: 0 },
            { id: 4, order_item_id: 1, option_group_id: 4, option_value_id: 11, group_name: 'Lượng đá', option_name: 'Đá bình thường', extra_price: 0 },
          ],
        },
        {
          id: 2,
          order_id: 1,
          product_id: 1,
          product_name: 'Cà phê sữa đá truyền thống',
          base_price: 29000,
          option_extra_price: 0,
          unit_price: 29000,
          quantity: 1,
          line_total: 29000,
          customer_note: '',
          created_at: new Date(now - 14 * 60000).toISOString(),
          order_item_options: [
            { id: 5, order_item_id: 2, option_group_id: 1, option_value_id: 1, group_name: 'Size', option_name: 'Size S', extra_price: 0 },
            { id: 6, order_item_id: 2, option_group_id: 2, option_value_id: 4, group_name: 'Nhiệt độ', option_name: 'Lạnh', extra_price: 0 },
            { id: 7, order_item_id: 2, option_group_id: 3, option_value_id: 6, group_name: 'Lượng đường', option_name: '100% đường', extra_price: 0 },
            { id: 8, order_item_id: 2, option_group_id: 4, option_value_id: 11, group_name: 'Lượng đá', option_name: 'Đá bình thường', extra_price: 0 },
          ],
        },
      ],
    },
    {
      id: 2,
      order_code: 'QN-000002',
      token: 'demo002tok',
      status: 'COMPLETED',
      payment_status: 'PAID',
      payment_method: 'BANK_TRANSFER',
      subtotal: 76000,
      discount_amount: 0,
      total_amount: 76000,
      payment_amount: 76000,
      cash_received: null,
      change_amount: null,
      sepay_transaction_id: 'SP_DEMO_998822',
      transfer_content: 'QN-000002',
      customer_note: 'Uống tại quán lầu 1',
      cancel_reason: null,
      refund_amount: 0,
      created_by: 1,
      created_at: new Date(now - 8 * 60000).toISOString(),
      paid_at: new Date(now - 8 * 60000).toISOString(),
      cancelled_at: null,
      refunded_at: null,
      updated_at: new Date(now - 3 * 60000).toISOString(),
      order_items: [
        {
          id: 3,
          order_id: 2,
          product_id: 6,
          product_name: 'Trà đào cam sả',
          base_price: 38000,
          option_extra_price: 0,
          unit_price: 38000,
          quantity: 2,
          line_total: 76000,
          customer_note: 'Uống tại quán lầu 1',
          created_at: new Date(now - 8 * 60000).toISOString(),
          order_item_options: [
            { id: 9, order_item_id: 3, option_group_id: 1, option_value_id: 1, group_name: 'Size', option_name: 'Size S', extra_price: 0 },
            { id: 10, order_item_id: 3, option_group_id: 3, option_value_id: 8, group_name: 'Lượng đường', option_name: '50% đường', extra_price: 0 },
            { id: 11, order_item_id: 3, option_group_id: 4, option_value_id: 12, group_name: 'Lượng đá', option_name: 'Ít đá', extra_price: 0 },
          ],
        },
      ],
    },
  ]
}

// Broadcast channel helper
let channel = null
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
  } catch {
    channel = null
  }
}

function notifyUpdate(type, payload = null) {
  const event = { type, payload, timestamp: Date.now() }
  if (channel) {
    try {
      channel.postMessage(event)
    } catch {
      // ignore
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pos_qn_db_change', { detail: event }))
  }
}

// Helper to normalize product object with fallback properties
function normalizeProduct(p, categories) {
  const cat = categories.find((c) => c.id === p.category_id || c.code === p.category_id)
  return {
    ...p,
    price: Number(p.base_price ?? p.price ?? 0),
    image: p.image_url ?? p.image ?? '',
    isAvailable: p.is_available !== false && p.isAvailable !== false,
    category: cat ? cat.code : (p.category_id || 'COFFEE'),
  }
}

// Helper to normalize order with backward compatibility getters
function normalizeOrder(o) {
  const items = (o.order_items || o.items || []).map((it) => ({
    ...it,
    menuItemId: it.product_id ?? it.menuItemId,
    name: it.product_name ?? it.name,
    unitPrice: it.unit_price ?? it.base_price ?? it.unitPrice,
    surcharge: it.option_extra_price ?? it.surcharge ?? 0,
    lineTotal: it.line_total ?? it.lineTotal,
    notes: it.customer_note ?? it.notes ?? '',
    options: it.options || (it.order_item_options ? formatItemOptionsObject(it.order_item_options) : {}),
  }))

  return {
    ...o,
    orderNumber: o.order_code || o.orderNumber,
    fulfillmentStatus: o.status === 'COMPLETED' ? 'DA_GIAO' : (o.status === 'CANCELLED' ? 'DA_HUY' : (o.fulfillmentStatus || 'CHO_LAM')),
    paymentStatus: o.payment_status === 'PAID' ? 'DA_THANH_TOAN' : (o.payment_status === 'REFUNDED' ? 'DA_HOAN_TIEN' : (o.paymentStatus || 'CHUA_THANH_TOAN')),
    paymentMethod: o.payment_method || o.paymentMethod || 'TIEN_MAT',
    totalAmount: o.total_amount ?? o.totalAmount ?? 0,
    cashGiven: o.cash_received ?? o.cashGiven ?? null,
    changeReturned: o.change_amount ?? o.changeReturned ?? null,
    items,
    createdBy: o.createdBy || 'Chủ quán',
  }
}

function formatItemOptionsObject(itemOptions = []) {
  const obj = { toppings: [] }
  itemOptions.forEach((opt) => {
    const gName = (opt.group_name || '').toLowerCase()
    if (gName.includes('size')) obj.size = opt.option_name
    else if (gName.includes('nhiệt') || gName.includes('temp')) obj.temperature = opt.option_name
    else if (gName.includes('đường') || gName.includes('sugar')) obj.sugar = opt.option_name
    else if (gName.includes('đá') || gName.includes('ice')) obj.ice = opt.option_name
    else if (gName.includes('cay') || gName.includes('spice')) obj.spice = opt.option_name
    else if (gName.includes('sốt') || gName.includes('sauce')) obj.sauce = opt.option_name
    else if (gName.includes('topping')) obj.toppings.push({ name: opt.option_name, price: opt.extra_price })
    else obj[opt.group_name] = opt.option_name
  })
  return obj
}

export const mockDb = {
  // --- DATABASE INITIALIZATION ---
  init() {
    if (typeof localStorage === 'undefined') return

    // 1. Users
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS))
    }

    // 2. Categories
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES))
    }

    // 3. Products
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS))
    }

    // 4. Option Groups
    if (!localStorage.getItem(STORAGE_KEYS.OPTION_GROUPS)) {
      localStorage.setItem(STORAGE_KEYS.OPTION_GROUPS, JSON.stringify(INITIAL_OPTION_GROUPS))
    }

    // 5. Option Values
    if (!localStorage.getItem(STORAGE_KEYS.OPTION_VALUES)) {
      localStorage.setItem(STORAGE_KEYS.OPTION_VALUES, JSON.stringify(INITIAL_OPTION_VALUES))
    }

    // 6. Product Option Groups
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCT_OPTION_GROUPS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCT_OPTION_GROUPS, JSON.stringify(INITIAL_PRODUCT_OPTION_GROUPS))
    }

    // 7. Orders
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(createInitialOrders()))
    }

    // 8. Shop Settings (Table 10)
    if (!localStorage.getItem(STORAGE_KEYS.SHOP_SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SHOP_SETTINGS, JSON.stringify(DEFAULT_SHOP_SETTINGS))
    }

    // 9. SePay Settings (Table 11)
    if (!localStorage.getItem(STORAGE_KEYS.SEPAY_SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SEPAY_SETTINGS, JSON.stringify(DEFAULT_SEPAY_SETTINGS))
    }

    // 10. Store Settings
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_STORE_SETTINGS))
    }

    // Auto login demo admin if no user
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]))
    }
  },

  // --- USERS / STAFF OPERATIONS ---
  getUsers() {
    this.init()
    try {
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || INITIAL_USERS
      return users.map((u) => ({
        ...u,
        email: u.email || 'giamdoc@gmail.com',
        isActive: u.is_active !== false && u.isActive !== false,
      }))
    } catch {
      return INITIAL_USERS
    }
  },

  getStaffList() {
    return this.getUsers()
  },

  getCurrentUser() {
    this.init()
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
      return raw ? JSON.parse(raw) : INITIAL_USERS[0]
    } catch {
      return INITIAL_USERS[0]
    }
  },

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
    }
    notifyUpdate('AUTH_CHANGED', user)
  },

  // --- CATEGORIES OPERATIONS (Table 2) ---
  getCategories() {
    this.init()
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES)) || INITIAL_CATEGORIES
    } catch {
      return INITIAL_CATEGORIES
    }
  },

  saveCategory(cat) {
    const list = this.getCategories()
    let updatedCat = null

    if (cat.id) {
      const idx = list.findIndex((c) => c.id === cat.id || c.code === cat.id)
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          name: cat.name.trim(),
          code: (cat.code || list[idx].code || cat.name).toUpperCase().replace(/\s+/g, '_'),
          display_order: cat.display_order ?? list[idx].display_order ?? (idx + 1),
          is_active: cat.is_active !== false,
          updated_at: new Date().toISOString(),
        }
        updatedCat = list[idx]
      }
    } else {
      const newId = list.length ? Math.max(...list.map((c) => Number(c.id) || 0)) + 1 : 1
      const code = (cat.code || cat.name || `CAT_${newId}`).toUpperCase().replace(/[^A-Z0-9]/g, '_')
      updatedCat = {
        id: newId,
        code,
        name: cat.name.trim(),
        display_order: cat.display_order ?? (list.length + 1),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      list.push(updatedCat)
    }

    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(list))
    notifyUpdate('CATEGORIES_UPDATED', list)
    return updatedCat
  },

  deleteCategory(id) {
    let list = this.getCategories()
    list = list.filter((c) => c.id !== id && c.code !== id)
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(list))
    notifyUpdate('CATEGORIES_UPDATED', list)
    return true
  },

  // --- PRODUCTS / MENU OPERATIONS (Table 3) ---
  getProducts() {
    this.init()
    try {
      const products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || INITIAL_PRODUCTS
      const categories = this.getCategories()
      return products.map((p) => normalizeProduct(p, categories))
    } catch {
      const categories = this.getCategories()
      return INITIAL_PRODUCTS.map((p) => normalizeProduct(p, categories))
    }
  },

  // Alias for backward compatibility
  getMenu() {
    return this.getProducts()
  },

  saveProduct(product) {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || INITIAL_PRODUCTS
    let saved = null

    const basePrice = Number(product.base_price ?? product.price ?? 0)
    const categoryId = Number(product.category_id) || (this.getCategories().find((c) => c.code === product.category)?.id || 1)

    if (product.id) {
      const idx = list.findIndex((p) => p.id === product.id || String(p.id) === String(product.id))
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          category_id: categoryId,
          code: product.code || list[idx].code,
          name: product.name.trim(),
          base_price: basePrice,
          image_url: product.image_url ?? product.image ?? list[idx].image_url,
          is_available: product.is_available !== false && product.isAvailable !== false,
          display_order: product.display_order ?? list[idx].display_order ?? (idx + 1),
          updated_at: new Date().toISOString(),
        }
        saved = list[idx]
      }
    } else {
      const nextId = list.length ? Math.max(...list.map((p) => Number(p.id) || 0)) + 1 : 1
      const generatedCode = product.code || product.name.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 30)
      saved = {
        id: nextId,
        category_id: categoryId,
        code: generatedCode,
        name: product.name.trim(),
        base_price: basePrice,
        image_url: product.image_url ?? product.image ?? '',
        is_available: true,
        display_order: product.display_order ?? (list.length + 1),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      list.push(saved)
    }

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list))
    notifyUpdate('MENU_UPDATED', list)
    const categories = this.getCategories()
    return normalizeProduct(saved, categories)
  },

  // Alias for backward compatibility
  saveMenuItem(item) {
    return this.saveProduct(item)
  },

  toggleItemAvailability(id) {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || INITIAL_PRODUCTS
    const item = list.find((p) => p.id === id || String(p.id) === String(id))
    if (item) {
      item.is_available = !item.is_available
      item.updated_at = new Date().toISOString()
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list))
      notifyUpdate('MENU_UPDATED', list)
    }
    const categories = this.getCategories()
    return item ? normalizeProduct(item, categories) : null
  },

  deleteMenuItem(id) {
    let list = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || INITIAL_PRODUCTS
    list = list.filter((p) => p.id !== id && String(p.id) !== String(id))
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list))

    // Also remove relations from product_option_groups
    let relations = this.getProductOptionGroupsRaw()
    relations = relations.filter((r) => r.product_id !== id && String(r.product_id) !== String(id))
    localStorage.setItem(STORAGE_KEYS.PRODUCT_OPTION_GROUPS, JSON.stringify(relations))

    notifyUpdate('MENU_UPDATED', list)
    return true
  },

  // --- OPTION GROUPS & OPTION VALUES (Table 4 & Table 5) ---
  getOptionGroups() {
    this.init()
    try {
      const groups = JSON.parse(localStorage.getItem(STORAGE_KEYS.OPTION_GROUPS)) || INITIAL_OPTION_GROUPS
      const values = this.getOptionValuesRaw()

      return groups.map((g) => {
        const groupOptions = values
          .filter((v) => v.option_group_id === g.id || String(v.option_group_id) === String(g.id))
          .sort((a, b) => a.display_order - b.display_order)
          .map((v) => ({
            ...v,
            extraPrice: v.extra_price,
            isDefault: v.is_default,
            isActive: v.is_active,
          }))

        return {
          ...g,
          selectionType: g.selection_type,
          required: g.default_required,
          minSelect: g.default_min_select,
          maxSelect: g.default_max_select,
          displayOrder: g.display_order,
          isActive: g.is_active,
          options: groupOptions,
        }
      })
    } catch {
      return INITIAL_OPTION_GROUPS
    }
  },

  getOptionValuesRaw() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.OPTION_VALUES)) || INITIAL_OPTION_VALUES
    } catch {
      return INITIAL_OPTION_VALUES
    }
  },

  saveOptionGroup(group) {
    const groups = JSON.parse(localStorage.getItem(STORAGE_KEYS.OPTION_GROUPS)) || INITIAL_OPTION_GROUPS
    let values = this.getOptionValuesRaw()

    let groupId = group.id
    if (groupId) {
      const idx = groups.findIndex((g) => g.id === groupId || String(g.id) === String(groupId))
      if (idx !== -1) {
        groups[idx] = {
          ...groups[idx],
          code: (group.code || groups[idx].code).toUpperCase().replace(/\s+/g, '_'),
          name: group.name.trim(),
          selection_type: group.selection_type || group.selectionType || 'SINGLE',
          default_required: Boolean(group.default_required ?? group.required),
          default_min_select: Number(group.default_min_select ?? (group.required ? 1 : 0)),
          default_max_select: Number(group.default_max_select ?? group.maxSelect ?? 1),
          display_order: Number(group.display_order ?? group.displayOrder ?? (idx + 1)),
          is_active: group.is_active !== false && group.isActive !== false,
          updated_at: new Date().toISOString(),
        }
      }
    } else {
      groupId = groups.length ? Math.max(...groups.map((g) => Number(g.id) || 0)) + 1 : 1
      const newGroup = {
        id: groupId,
        code: (group.code || group.name).toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 30),
        name: group.name.trim(),
        selection_type: group.selection_type || group.selectionType || 'SINGLE',
        default_required: Boolean(group.default_required ?? group.required),
        default_min_select: Number(group.default_min_select ?? (group.required ? 1 : 0)),
        default_max_select: Number(group.default_max_select ?? group.maxSelect ?? 1),
        display_order: Number(group.display_order ?? group.displayOrder ?? (groups.length + 1)),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      groups.push(newGroup)
    }

    // Save embedded options if provided
    if (Array.isArray(group.options)) {
      // Remove old values of this group
      values = values.filter((v) => v.option_group_id !== groupId && String(v.option_group_id) !== String(groupId))

      group.options.forEach((opt, idx) => {
        const nextValId = values.length ? Math.max(...values.map((v) => Number(v.id) || 0)) + 1 : idx + 1
        values.push({
          id: nextValId,
          option_group_id: groupId,
          code: opt.code || opt.name.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 30),
          name: opt.name.trim(),
          extra_price: Number(opt.extra_price ?? opt.extraPrice ?? 0),
          is_default: Boolean(opt.is_default ?? opt.isDefault),
          display_order: idx + 1,
          is_active: opt.is_active !== false && opt.isActive !== false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      })

      localStorage.setItem(STORAGE_KEYS.OPTION_VALUES, JSON.stringify(values))
    }

    localStorage.setItem(STORAGE_KEYS.OPTION_GROUPS, JSON.stringify(groups))
    notifyUpdate('OPTION_GROUPS_UPDATED')
    return this.getOptionGroups().find((g) => g.id === groupId)
  },

  deleteOptionGroup(id) {
    let groups = JSON.parse(localStorage.getItem(STORAGE_KEYS.OPTION_GROUPS)) || INITIAL_OPTION_GROUPS
    groups = groups.filter((g) => g.id !== id && String(g.id) !== String(id))
    localStorage.setItem(STORAGE_KEYS.OPTION_GROUPS, JSON.stringify(groups))

    // Remove values
    let values = this.getOptionValuesRaw()
    values = values.filter((v) => v.option_group_id !== id && String(v.option_group_id) !== String(id))
    localStorage.setItem(STORAGE_KEYS.OPTION_VALUES, JSON.stringify(values))

    // Remove relations
    let relations = this.getProductOptionGroupsRaw()
    relations = relations.filter((r) => r.option_group_id !== id && String(r.option_group_id) !== String(id))
    localStorage.setItem(STORAGE_KEYS.PRODUCT_OPTION_GROUPS, JSON.stringify(relations))

    notifyUpdate('OPTION_GROUPS_UPDATED')
    return true
  },

  // --- PRODUCT OPTION GROUPS (Table 6) ---
  getProductOptionGroupsRaw() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCT_OPTION_GROUPS)) || INITIAL_PRODUCT_OPTION_GROUPS
    } catch {
      return INITIAL_PRODUCT_OPTION_GROUPS
    }
  },

  getProductOptionGroups(productId) {
    this.init()
    const all = this.getProductOptionGroupsRaw()
    const targetId = (productId === 'm1' || productId === '1' || productId === 1) ? 1 : productId
    return all
      .filter((r) => r.product_id === targetId || String(r.product_id) === String(targetId) || String(r.product_id) === String(productId))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map((r) => ({
        ...r,
        productId: r.product_id,
        optionGroupId: r.option_group_id,
        required: r.is_required,
        maxSelect: r.max_select,
        displayOrder: r.display_order,
      }))
  },

  saveProductOptionGroups(productId, relations = []) {
    let all = this.getProductOptionGroupsRaw()
    // Remove existing relations for this product
    all = all.filter((r) => r.product_id !== productId && String(r.product_id) !== String(productId))

    relations.forEach((rel, idx) => {
      const nextId = all.length ? Math.max(...all.map((r) => Number(r.id) || 0)) + 1 : idx + 1
      all.push({
        id: nextId,
        product_id: productId,
        option_group_id: rel.option_group_id ?? rel.optionGroupId,
        is_required: Boolean(rel.is_required ?? rel.required),
        min_select: Number(rel.min_select ?? (rel.required ? 1 : 0)),
        max_select: Number(rel.max_select ?? rel.maxSelect ?? 1),
        display_order: Number(rel.display_order ?? rel.displayOrder ?? (idx + 1)),
        created_at: new Date().toISOString(),
      })
    })

    localStorage.setItem(STORAGE_KEYS.PRODUCT_OPTION_GROUPS, JSON.stringify(all))
    notifyUpdate('PRODUCT_OPTION_GROUPS_UPDATED', { productId })
    return this.getProductOptionGroups(productId)
  },

  getProductOptionGroupsDetailed(productId) {
    const relations = this.getProductOptionGroups(productId)
    const allGroups = this.getOptionGroups()

    return relations
      .map((rel) => {
        const group = allGroups.find(
          (g) => g.id === rel.option_group_id || g.id === rel.optionGroupId || String(g.id) === String(rel.optionGroupId)
        )
        if (!group) return null

        return {
          ...group,
          relationId: rel.id,
          required: rel.required ?? group.required,
          maxSelect: rel.maxSelect ?? group.maxSelect,
          displayOrder: rel.displayOrder ?? group.displayOrder,
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.displayOrder - b.displayOrder)
  },

  // Legacy Toppings support
  getToppings() {
    const values = this.getOptionValuesRaw()
    return values
      .filter((v) => v.option_group_id === 5)
      .map((v) => ({
        id: String(v.id),
        name: v.name,
        price: v.extra_price,
      }))
  },

  saveTopping(topping) {
    let values = this.getOptionValuesRaw()
    if (topping.id) {
      const idx = values.findIndex((v) => String(v.id) === String(topping.id))
      if (idx !== -1) {
        values[idx].name = topping.name
        values[idx].extra_price = Number(topping.price)
        localStorage.setItem(STORAGE_KEYS.OPTION_VALUES, JSON.stringify(values))
        return { id: String(values[idx].id), name: values[idx].name, price: values[idx].extra_price }
      }
    }
    const nextId = values.length ? Math.max(...values.map((v) => Number(v.id) || 0)) + 1 : 1
    const newVal = {
      id: nextId,
      option_group_id: 5,
      code: topping.name.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
      name: topping.name,
      extra_price: Number(topping.price),
      is_default: false,
      display_order: values.length + 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    values.push(newVal)
    localStorage.setItem(STORAGE_KEYS.OPTION_VALUES, JSON.stringify(values))
    return { id: String(newVal.id), name: newVal.name, price: newVal.extra_price }
  },

  deleteTopping(id) {
    let values = this.getOptionValuesRaw()
    values = values.filter((v) => String(v.id) !== String(id))
    localStorage.setItem(STORAGE_KEYS.OPTION_VALUES, JSON.stringify(values))
    return true
  },

  // --- ORDERS OPERATIONS (Table 7, 8, 9) ---
  getOrders() {
    this.init()
    try {
      const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || createInitialOrders()
      return orders.map(normalizeOrder)
    } catch {
      return createInitialOrders().map(normalizeOrder)
    }
  },

  getOrderById(id) {
    const orders = this.getOrders()
    return orders.find((o) => o.id === id || String(o.id) === String(id) || o.order_code === id || o.orderNumber === id) || null
  },

  getOrderByToken(token) {
    const orders = this.getOrders()
    return orders.find((o) => o.token === token) || null
  },

  createOrder(payload) {
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || createInitialOrders()
    const nextId = orders.length ? Math.max(...orders.map((o) => Number(o.id) || 0)) + 1 : 1
    const orderCode = payload.order_code || payload.orderNumber || `QN-${String(nextId).padStart(6, '0')}`

    const now = new Date().toISOString()
    const currentUser = this.getCurrentUser()

    // Normalize order items and order item options snapshots
    let nextItemId = 1
    let nextOptionId = 1

    const orderItems = (payload.items || payload.order_items || []).map((item, idx) => {
      const basePrice = Number(item.base_price ?? item.unitPrice ?? 0)
      const extraPrice = Number(item.option_extra_price ?? item.surcharge ?? 0)
      const unitPrice = basePrice + extraPrice
      const quantity = Number(item.quantity || 1)
      const lineTotal = unitPrice * quantity
      const itemId = nextItemId++

      // Create snapshot options
      const itemOptions = []
      if (Array.isArray(item.order_item_options)) {
        item.order_item_options.forEach((opt) => {
          itemOptions.push({
            id: nextOptionId++,
            order_item_id: itemId,
            option_group_id: opt.option_group_id || null,
            option_value_id: opt.option_value_id || null,
            group_name: opt.group_name || 'Tùy chọn',
            option_name: opt.option_name || opt.name,
            extra_price: Number(opt.extra_price ?? opt.extraPrice ?? 0),
            created_at: now,
          })
        })
      } else if (item.options && typeof item.options === 'object') {
        Object.entries(item.options).forEach(([k, v]) => {
          if (!v) return
          if (Array.isArray(v)) {
            v.forEach((top) => {
              itemOptions.push({
                id: nextOptionId++,
                order_item_id: itemId,
                option_group_id: 5,
                option_value_id: null,
                group_name: 'Topping',
                option_name: top.name || String(top),
                extra_price: Number(top.price || 0),
                created_at: now,
              })
            })
          } else {
            itemOptions.push({
              id: nextOptionId++,
              order_item_id: itemId,
              option_group_id: null,
              option_value_id: null,
              group_name: k,
              option_name: String(v),
              extra_price: 0,
              created_at: now,
            })
          }
        })
      }

      return {
        id: itemId,
        order_id: nextId,
        product_id: item.product_id ?? item.menuItemId ?? null,
        product_name: item.product_name ?? item.name,
        base_price: basePrice,
        option_extra_price: extraPrice,
        unit_price: unitPrice,
        quantity,
        line_total: lineTotal,
        customer_note: item.customer_note ?? item.notes ?? '',
        created_at: now,
        order_item_options: itemOptions,
        options: item.options || formatItemOptionsObject(itemOptions),
      }
    })

    const subtotal = orderItems.reduce((sum, it) => sum + it.line_total, 0)
    const discountAmount = Number(payload.discount_amount || 0)
    const totalAmount = subtotal - discountAmount

    const newOrder = {
      id: nextId,
      order_code: orderCode,
      token: generateToken(orderCode),
      status: payload.status || 'COMPLETED',
      payment_status: payload.payment_status || 'PAID',
      payment_method: payload.payment_method || (payload.paymentMethod === 'TIEN_MAT' ? 'CASH' : 'BANK_TRANSFER'),
      subtotal,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      payment_amount: totalAmount,
      cash_received: payload.cash_received ?? payload.cashGiven ?? null,
      change_amount: payload.change_amount ?? payload.changeReturned ?? null,
      sepay_transaction_id: payload.sepay_transaction_id || null,
      transfer_content: payload.transfer_content || orderCode,
      customer_note: payload.customer_note || payload.notes || '',
      cancel_reason: null,
      refund_amount: 0,
      created_by: currentUser?.id || 1,
      created_at: now,
      paid_at: now,
      cancelled_at: null,
      refunded_at: null,
      updated_at: now,
      order_items: orderItems,
    }

    orders.unshift(newOrder)
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders))
    notifyUpdate('ORDER_CREATED', newOrder)
    return normalizeOrder(newOrder)
  },

  updateFulfillmentStatus(orderId, newStatus) {
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || createInitialOrders()
    const order = orders.find((o) => o.id === orderId || String(o.id) === String(orderId) || o.order_code === orderId)
    if (!order) return null

    order.fulfillmentStatus = newStatus
    if (newStatus === 'DA_GIAO') order.status = 'COMPLETED'
    if (newStatus === 'DA_HUY') order.status = 'CANCELLED'
    order.updated_at = new Date().toISOString()

    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders))
    notifyUpdate('ORDER_UPDATED', order)
    return normalizeOrder(order)
  },

  cancelOrder(orderId, reason, refundAmount) {
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || createInitialOrders()
    const order = orders.find((o) => o.id === orderId || String(o.id) === String(orderId) || o.order_code === orderId)
    if (!order) return null

    order.status = 'CANCELLED'
    order.fulfillmentStatus = 'DA_HUY'
    order.payment_status = 'REFUNDED'
    order.paymentStatus = 'DA_HOAN_TIEN'
    order.cancel_reason = reason
    order.refund_amount = Number(refundAmount || order.total_amount || 0)
    order.cancelled_at = new Date().toISOString()
    order.refunded_at = new Date().toISOString()
    order.updated_at = new Date().toISOString()

    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders))
    notifyUpdate('ORDER_CANCELLED', order)
    return normalizeOrder(order)
  },

  markReprint(orderId) {
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || createInitialOrders()
    const order = orders.find((o) => o.id === orderId || String(o.id) === String(orderId) || o.order_code === orderId)
    if (!order) return null

    order.isReprinted = true
    order.reprintCount = (order.reprintCount || 0) + 1
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders))
    return normalizeOrder(order)
  },

  // --- SHOP SETTINGS (Table 10) ---
  getShopSettings() {
    this.init()
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SHOP_SETTINGS)
      return raw ? JSON.parse(raw) : { ...DEFAULT_SHOP_SETTINGS }
    } catch {
      return { ...DEFAULT_SHOP_SETTINGS }
    }
  },

  saveShopSettings(settings) {
    const current = this.getShopSettings()
    const updated = {
      ...current,
      ...settings,
      updated_at: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEYS.SHOP_SETTINGS, JSON.stringify(updated))

    // Synchronize to STORE_SETTINGS for unified receipt printing
    this.saveStoreSettings({
      storeName: updated.shop_name,
      shop_name: updated.shop_name,
      address: updated.shop_address,
      shop_address: updated.shop_address,
      wifiName: updated.wifi_name,
      wifi_name: updated.wifi_name,
      wifiPass: updated.wifi_password_encrypted,
      receipt_message: updated.receipt_message,
      receiptFooterMessage: updated.receipt_message,
      show_wifi_on_receipt: updated.show_wifi_on_receipt,
    })

    notifyUpdate('SHOP_SETTINGS_UPDATED', updated)
    return updated
  },

  // --- SEPAY SETTINGS (Table 11) ---
  // Đặc tả: "Trang cài đặt chỉ có ô dán API Key. Sau khi lưu: Frontend không được nhận lại API Key đầy đủ, chỉ nhận ••••••••1234"
  getSepaySettings() {
    this.init()
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SEPAY_SETTINGS)
      const data = raw ? JSON.parse(raw) : { ...DEFAULT_SEPAY_SETTINGS }
      // Security: Never return full key back to client
      return {
        id: data.id || 1,
        is_configured: Boolean(data.is_configured),
        api_key_last4: data.api_key_last4 || null,
        masked_key: data.api_key_last4 ? `••••••••${data.api_key_last4}` : null,
        updated_at: data.updated_at,
      }
    } catch {
      return { ...DEFAULT_SEPAY_SETTINGS }
    }
  },

  saveSepayApiKey(apiKeyRaw) {
    if (!apiKeyRaw || typeof apiKeyRaw !== 'string' || apiKeyRaw.trim().length < 4) {
      throw new Error('Vui lòng nhập SePay API Key hợp lệ (tối thiểu 4 ký tự)')
    }

    const trimmed = apiKeyRaw.trim()
    const last4 = trimmed.slice(-4)
    // Mock encrypted string
    const encrypted = 'enc_' + btoa(trimmed).split('').reverse().join('')

    const savedRecord = {
      id: 1,
      api_key_encrypted: encrypted,
      api_key_last4: last4,
      is_configured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    localStorage.setItem(STORAGE_KEYS.SEPAY_SETTINGS, JSON.stringify(savedRecord))

    // Sync to store settings
    this.saveStoreSettings({
      sepay_configured: true,
      sepay_last4: last4,
    })

    notifyUpdate('SEPAY_SETTINGS_UPDATED')

    // Trả về frontend: CHỈ masked key và trạng thái
    return {
      id: 1,
      is_configured: true,
      api_key_last4: last4,
      masked_key: `••••••••${last4}`,
      updated_at: savedRecord.updated_at,
    }
  },

  // --- GENERAL STORE SETTINGS OPERATIONS ---
  getStoreSettings() {
    this.init()
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      const shop = this.getShopSettings()
      const sepay = this.getSepaySettings()
      const base = raw ? JSON.parse(raw) : { ...DEFAULT_STORE_SETTINGS }
      return {
        ...DEFAULT_STORE_SETTINGS,
        ...base,
        storeName: shop.shop_name || base.storeName,
        shop_name: shop.shop_name || base.storeName,
        address: shop.shop_address || base.address,
        shop_address: shop.shop_address || base.address,
        wifiName: shop.wifi_name || base.wifiName,
        wifi_name: shop.wifi_name || base.wifiName,
        receipt_message: shop.receipt_message || base.receipt_message,
        receiptFooterMessage: shop.receipt_message || base.receiptFooterMessage,
        show_wifi_on_receipt: shop.show_wifi_on_receipt !== false,
        sepay_configured: sepay.is_configured,
        sepay_last4: sepay.api_key_last4,
      }
    } catch {
      return { ...DEFAULT_STORE_SETTINGS }
    }
  },

  saveStoreSettings(settings) {
    const updated = {
      ...this.getStoreSettings(),
      ...settings,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated))
    notifyUpdate('SETTINGS_UPDATED', updated)
    return updated
  },

  resetStoreSettings() {
    localStorage.setItem(STORAGE_KEYS.SHOP_SETTINGS, JSON.stringify(DEFAULT_SHOP_SETTINGS))
    localStorage.setItem(STORAGE_KEYS.SEPAY_SETTINGS, JSON.stringify(DEFAULT_SEPAY_SETTINGS))
    const defaults = { ...DEFAULT_STORE_SETTINGS, updatedAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaults))
    notifyUpdate('SETTINGS_UPDATED', defaults)
    return defaults
  },

  // --- SUBSCRIPTION HELPER ---
  subscribe(callback) {
    const handler = (e) => {
      callback(e.detail || e.data)
    }
    const storageHandler = () => {
      callback({ type: 'STORAGE_SYNC' })
    }

    if (channel) {
      channel.addEventListener('message', handler)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('pos_qn_db_change', handler)
      window.addEventListener('storage', storageHandler)
    }

    return () => {
      if (channel) {
        channel.removeEventListener('message', handler)
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('pos_qn_db_change', handler)
        window.removeEventListener('storage', storageHandler)
      }
    }
  },
}
