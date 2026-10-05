export function buildResetShopSettings(currentSettings, defaults) {
  return {
    ...defaults,
    storeName: currentSettings?.storeName || currentSettings?.shop_name || '',
    address: currentSettings?.address || currentSettings?.shop_address || '',
    phone: currentSettings?.phone || '',
  }
}
