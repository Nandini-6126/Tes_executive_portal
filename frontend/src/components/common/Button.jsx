import { Loader2 } from 'lucide-react';

/**
 * Button - Reusable button component with variants
 * 
 * @param {string} variant - 'primary' | 'secondary' | 'ghost' | 'danger'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} isLoading - Show loading spinner
 * @param {boolean} disabled - Disable button
 * @param {React.ReactNode} leftIcon - Icon before text
 * @param {React.ReactNode} rightIcon - Icon after text
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-accent-600 hover:bg-accent-500 text-white shadow-lg shadow-accent-600/25 hover:shadow-accent-500/40 focus:ring-accent-500',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 hover:border-slate-500 focus:ring-slate-500',
    ghost: 'text-slate-300 hover:text-white hover:bg-slate-800/50 focus:ring-slate-500',
    danger: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25 focus:ring-red-500',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 focus:ring-emerald-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  const iconSizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className={`${iconSizeClasses[size]} animate-spin`} />
      ) : (
        leftIcon && <span className={iconSizeClasses[size]}>{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && (
        <span className={iconSizeClasses[size]}>{rightIcon}</span>
      )}
    </button>
  );
}

/**
 * IconButton - Button with only an icon
 */
export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  label,
  className = '',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-accent-600 hover:bg-accent-500 text-white focus:ring-accent-500',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 focus:ring-slate-500',
    ghost: 'text-slate-400 hover:text-white hover:bg-slate-800/50 focus:ring-slate-500',
    danger: 'bg-red-600/20 hover:bg-red-600/30 text-red-400 focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      aria-label={label}
      title={label}
      {...props}
    >
      <span className={iconSizeClasses[size]}>{icon}</span>
    </button>
  );
}
