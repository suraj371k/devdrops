import { forwardRef } from 'react'

const Card = forwardRef(({ 
  children, 
  className = '', 
  hover = false, 
  padding = 'md',
  border = true,
  ...props 
}, ref) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  }

  return (
    <div
      ref={ref}
      className={`
        rounded-xl bg-white dark:bg-slate-800
        ${border ? 'border border-slate-200 dark:border-slate-700' : ''}
        ${hover ? 'hover:shadow-lg hover:border-primary-500/50 transition-all duration-300 cursor-pointer' : ''}
        ${paddings[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
})

Card.displayName = 'Card'
export default Card