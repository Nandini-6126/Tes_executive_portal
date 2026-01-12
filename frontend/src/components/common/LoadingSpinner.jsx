import { Loader2 } from 'lucide-react';

/**
 * LoadingSpinner - Animated loading indicator
 * 
 * @param {string} size - 'sm' | 'md' | 'lg' | 'xl'
 * @param {string} text - Optional loading text
 * @param {string} className - Additional classes
 */
export default function LoadingSpinner({ size = 'md', text, className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
    xl: 'w-16 h-16',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} text-accent-500 animate-spin`} />
      {text && (
        <p className={`${textSizeClasses[size]} text-slate-400 animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );
}

/**
 * PageLoader - Full page loading state
 */
export function PageLoader({ text = 'Loading...' }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

/**
 * OverlayLoader - Loading overlay for existing content
 */
export function OverlayLoader({ text }) {
  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}
