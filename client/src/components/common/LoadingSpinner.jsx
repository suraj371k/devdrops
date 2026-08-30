const LoadingSpinner = ({ 
  size = 'md', 
  className = '', 
  color = 'primary',
  text,
}) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  }

  const colors = {
    primary: 'border-primary-500 border-t-transparent',
    white: 'border-white border-t-transparent',
    slate: 'border-slate-500 border-t-transparent',
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <svg 
        className={`${sizes[size]} rounded-full animate-spin ${colors[color]}`}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      </svg>
      {text && <p className="text-sm text-slate-500 dark:text-slate-400">{text}</p>}
    </div>
  )
}

export const LoadingOverlay = ({ isLoading, children, text }) => {
  if (!isLoading) return children

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  )
}

export default LoadingSpinner