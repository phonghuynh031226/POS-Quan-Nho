export default function Input({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  id,
  type = 'text',
  ...props
}) {
  const inputId = id || (label ? 'inp_' + label.replace(/\s+/g, '_') : undefined)

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-[#3E2723]">
          {label}
        </label>
      )}
      <div className="relative rounded-xl shadow-xs">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={`block w-full rounded-xl border transition-all text-sm font-medium py-3 px-4 bg-white focus:outline-none focus:ring-2 placeholder:text-stone-400 ${
            Icon ? 'pl-11' : ''
          } ${
            error
              ? 'border-rose-400 text-rose-900 focus:border-rose-500 focus:ring-rose-200'
              : 'border-[#D4C7B8] text-[#2D1B14] focus:border-[#C88A35] focus:ring-[#F5E6D0]'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-stone-500">{helperText}</p>}
    </div>
  )
}
