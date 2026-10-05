import { DEFAULT_STORE_SETTINGS } from '../constants/index.js'

export function resolveReceiptPrintSettings({
  savedSettings,
  customSettings,
  initialPrintType,
} = {}) {
  const settings = {
    ...DEFAULT_STORE_SETTINGS,
    ...(savedSettings || {}),
    ...(customSettings || {}),
  }

  return {
    settings,
    paperSize: settings.defaultPaperSize || '80mm',
    printType: initialPrintType || settings.defaultPrintMode || 'both',
  }
}

export function getLatestOrderForPreview(orders = []) {
  return [...orders]
    .filter((order) => order?.createdAt || order?.created_at)
    .sort((left, right) =>
      new Date(right.createdAt || right.created_at) - new Date(left.createdAt || left.created_at)
    )[0] || null
}
