export function shouldShowProductPlaceholder(imageUrl, hasLoadError) {
  return !imageUrl?.trim?.() || hasLoadError
}
