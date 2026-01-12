import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * ProtectedRoute - Restricts access to authenticated users
 * Optionally checks for specific permissions
 * 
 * @param {React.ReactNode} children - Child components to render
 * @param {string[]} permissions - Required permissions (any match = access granted)
 * @param {boolean} requireAll - If true, all permissions required
 * @param {string} redirectTo - Redirect path for unauthorized users
 */
export default function ProtectedRoute({ 
  children, 
  permissions = [], 
  requireAll = false,
  redirectTo = '/login' 
}) {
  const { isAuthenticated, isLoading, hasAnyPermission, hasAllPermissions } = useAuth();
  const location = useLocation();

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Verifying session..." />
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check permissions if specified
  if (permissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(permissions) 
      : hasAnyPermission(permissions);

    if (!hasAccess) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="glass-panel p-8 max-w-md text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400 mb-6">
              You don't have permission to access this resource. 
              Contact your administrator if you believe this is an error.
            </p>
            <button 
              onClick={() => window.history.back()}
              className="btn-secondary"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  return children;
}

/**
 * PermissionGate - Conditionally renders children based on permissions
 * Use for hiding UI elements without redirecting
 * 
 * @param {React.ReactNode} children - Content to show if permitted
 * @param {string[]} permissions - Required permissions
 * @param {boolean} requireAll - If true, all permissions required
 * @param {React.ReactNode} fallback - Content to show if not permitted
 */
export function PermissionGate({ 
  children, 
  permissions = [], 
  requireAll = false, 
  fallback = null 
}) {
  const { hasAnyPermission, hasAllPermissions, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return fallback;
  }

  if (permissions.length === 0) {
    return children;
  }

  const hasAccess = requireAll 
    ? hasAllPermissions(permissions) 
    : hasAnyPermission(permissions);

  return hasAccess ? children : fallback;
}
