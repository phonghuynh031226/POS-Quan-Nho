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
