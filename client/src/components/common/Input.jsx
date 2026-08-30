import { forwardRef, useId } from 'react'

const Input = forwardRef(({ 
  label, 
  error, 
  hint, 
  className = '', 
  leftIcon, 
  rightIcon,
  fullWidth = true,
  ...props 
}, ref) => {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={`
            w-full rounded-lg border transition-colors duration-200
            bg-white dark:bg-slate-800
            text-slate-900 dark:text-slate-100
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed
            ${leftIcon ? 'pl-10' : 'pl-4'}
            ${rightIcon ? 'pr-10' : 'pr-4'}
            py-2.5
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-600'}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-500" role="alert">{error}</p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{hint}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
export default Input