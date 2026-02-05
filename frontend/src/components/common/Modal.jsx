import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle,
  children, 
  size = 'md',
  showClose = true 
}) {
  const { isLightTheme } = useSettings();
  const isLight = isLightTheme;

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className={`relative w-full ${sizeClasses[size]} transform transition-all ${
            isLight 
              ? 'bg-white shadow-2xl' 
              : 'bg-slate-900 shadow-2xl shadow-black/50'
          } rounded-2xl`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-700 bg-slate-800/50'
          } rounded-t-2xl`}>
            <div>
              <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {title}
              </h2>
              {subtitle && (
                <p className={`text-sm mt-0.5 ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                  {subtitle}
                </p>
              )}
            </div>
            {showClose && (
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isLight 
                    ? 'hover:bg-gray-200 text-gray-500 hover:text-gray-700' 
                    : 'hover:bg-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// Form wrapper for consistent styling inside modals
export function ModalForm({ children, onSubmit, className = '' }) {
  return (
    <form onSubmit={onSubmit} className={`p-6 space-y-5 ${className}`}>
      {children}
    </form>
  );
}

// Footer for modal buttons
export function ModalFooter({ children, className = '' }) {
  const { isLightTheme } = useSettings();
  const isLight = isLightTheme;
  
  return (
    <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${
      isLight ? 'border-gray-200 bg-gray-50' : 'border-slate-700 bg-slate-800/50'
    } rounded-b-2xl ${className}`}>
      {children}
    </div>
  );
}

// Error display for modals
export function ModalError({ message }) {
  if (!message) return null;
  
  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
      {message}
    </div>
  );
}
