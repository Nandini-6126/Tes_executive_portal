import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS, ROLES } from '../utils/constants';

/**
 * Hook for checking user permissions
 * Provides convenient methods for RBAC checks
 */
export function usePermissions() {
  const { user, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  const permissions = useMemo(() => ({
    // Current user info
    role: user?.role,
    permissionList: user?.permissions || [],

    // Role checks
    isAdmin: user?.role === ROLES.ADMIN,
    isManager: user?.role === ROLES.MANAGER,
    isEngineer: user?.role === ROLES.ENGINEER,
    isManagerOrAbove: [ROLES.ADMIN, ROLES.MANAGER].includes(user?.role),

    // Services permissions
    canReadServices: hasPermission(PERMISSIONS.SERVICES_READ),
    canWriteServices: hasPermission(PERMISSIONS.SERVICES_WRITE),
    canDeleteServices: hasPermission(PERMISSIONS.SERVICES_DELETE),

    // Products permissions
    canReadProducts: hasPermission(PERMISSIONS.PRODUCTS_READ),
    canWriteProducts: hasPermission(PERMISSIONS.PRODUCTS_WRITE),
    canDeleteProducts: hasPermission(PERMISSIONS.PRODUCTS_DELETE),

    // CTI permissions (restricted)
    canReadCTI: hasPermission(PERMISSIONS.CTI_READ),
    canWriteCTI: hasPermission(PERMISSIONS.CTI_WRITE),
    canReadCTIProducts: hasPermission(PERMISSIONS.CTI_PRODUCTS_READ),

    // Analytics permissions
    canReadAnalytics: hasPermission(PERMISSIONS.ANALYTICS_READ),
    canReadExecutiveInsights: hasPermission(PERMISSIONS.ANALYTICS_EXECUTIVE),

    // Admin permissions
    canManageUsers: hasPermission(PERMISSIONS.ADMIN_USERS),
    canManageRoles: hasPermission(PERMISSIONS.ADMIN_ROLES),
    canManageMasterData: hasPermission(PERMISSIONS.ADMIN_MASTER_DATA),
    canViewAuditLogs: hasPermission(PERMISSIONS.ADMIN_AUDIT_LOGS),

    // Combined admin check
    hasAdminAccess: hasAnyPermission([
      PERMISSIONS.ADMIN_USERS,
      PERMISSIONS.ADMIN_ROLES,
      PERMISSIONS.ADMIN_MASTER_DATA,
      PERMISSIONS.ADMIN_AUDIT_LOGS,
    ]),

    // Helper methods
    has: hasPermission,
    hasAny: hasAnyPermission,
    hasAll: hasAllPermissions,
  }), [user, hasPermission, hasAnyPermission, hasAllPermissions]);

  return permissions;
}

/**
 * Check if navigation item should be visible
 * @param {Object} navItem - Navigation item with permissions array
 * @param {Function} hasAnyPermission - Permission check function
 * @returns {boolean}
 */
export function canAccessNavItem(navItem, hasAnyPermission) {
  // No permissions required - visible to all authenticated users
  if (!navItem.permissions || navItem.permissions.length === 0) {
    return true;
  }
  
  return hasAnyPermission(navItem.permissions);
}

export default usePermissions;
