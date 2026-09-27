import { useEffect, useState } from 'react'
import { Coffee } from 'lucide-react'
import { shouldShowProductPlaceholder } from '../../utils/productImageState'

export default function ProductImage({ src, alt, imageClassName = '' }) {
  const [hasLoadError, setHasLoadError] = useState(false)

  useEffect(() => {
    setHasLoadError(false)
  }, [src])

  if (!shouldShowProductPlaceholder(src, hasLoadError)) {
    return (
      <img
        src={src}
        alt={alt}
        className={imageClassName}
        onError={() => setHasLoadError(true)}
        loading="lazy"
      />
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center text-[#7A4A32] select-none p-2">
      <div
        className="flex items-end justify-center gap-1 border-b-[3px] border-current pb-1"
        role="img"
        aria-label="Cà phê và hamburger"
      >
        <Coffee className="w-16 h-16 shrink-0" strokeWidth={1.7} />
        <span
          data-product-hamburger
          aria-hidden="true"
          className="relative mb-1 block h-8 w-10 shrink-0"
        >
          <span className="absolute left-0 top-0 h-3 w-full rounded-t-full border-2 border-b-0 border-current" />
          <span className="absolute left-0 top-3 h-2 w-full -rotate-2 rounded border-2 border-current" />
          <span className="absolute left-0.5 top-5 h-1.5 w-9 rounded-full border-2 border-current" />
          <span className="absolute bottom-0 left-0 h-1.5 w-full rounded-b-lg border-2 border-current" />
        </span>
      </div>
    </div>
  )
}
