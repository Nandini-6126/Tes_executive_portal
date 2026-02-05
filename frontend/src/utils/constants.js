// Permission constants - must match backend
export const PERMISSIONS = {
  // Services
  SERVICES_READ: 'services.read',
  SERVICES_WRITE: 'services.write',
  SERVICES_DELETE: 'services.delete',
  
  // Products
  PRODUCTS_READ: 'products.read',
  PRODUCTS_WRITE: 'products.write',
  PRODUCTS_DELETE: 'products.delete',
  
  // CTI (Restricted)
  CTI_READ: 'cti.read',
  CTI_WRITE: 'cti.write',
  CTI_PRODUCTS_READ: 'cti_products.read',
  CTI_PRODUCTS_WRITE: 'cti_products.write',
  
  // Analytics
  ANALYTICS_READ: 'analytics.read',
  ANALYTICS_EXECUTIVE: 'analytics.executive',
  
  // Admin
  ADMIN_USERS: 'admin.users',
  ADMIN_ROLES: 'admin.roles',
  ADMIN_MASTER_DATA: 'admin.master_data',
  ADMIN_AUDIT_LOGS: 'admin.audit_logs',
};

// Role names
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  ENGINEER: 'engineer',
};

// Role display names
export const ROLE_DISPLAY_NAMES = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.ENGINEER]: 'Engineer',
};

// Status badge mappings
export const STATUS_VARIANTS = {
  // Service/Project status
  draft: 'neutral',
  active: 'success',
  on_hold: 'warning',
  completed: 'info',
  cancelled: 'error',
  
  // Project status
  planning: 'neutral',
  in_progress: 'info',
  review: 'warning',
  
  // Product deployment status
  discovery: 'neutral',
  development: 'info',
  alpha: 'warning',
  beta: 'warning',
  production: 'success',
  deprecated: 'error',
};

// Navigation items
export const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    permissions: [],
  },
  {
    id: 'clients',
    label: 'Clients',
    path: '/clients',
    icon: 'Building2',
    permissions: [PERMISSIONS.SERVICES_READ],
  },
  {
    id: 'employees',
    label: 'Employees',
    path: '/employees',
    icon: 'Users',
    permissions: [PERMISSIONS.SERVICES_READ],
  },
  {
    id: 'task-pilot',
    label: 'Task Pilot',
    path: '/task-pilot',
    icon: 'Zap',
    permissions: [PERMISSIONS.SERVICES_READ],
    badge: 'AI',
  },
  {
    id: 'inquiries',
    label: 'Inquiries',
    path: '/inquiries',
    icon: 'FileText',
    permissions: [PERMISSIONS.SERVICES_READ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    path: '/inventory',
    icon: 'Package',
    permissions: [PERMISSIONS.SERVICES_READ],
  },
  {
    id: 'admin',
    label: 'Admin Panel',
    path: '/admin',
    icon: 'Settings',
    permissions: [PERMISSIONS.ADMIN_USERS],
    children: [
      {
        id: 'users',
        label: 'User Management',
        path: '/admin/users',
        icon: 'Users',
      },
      {
        id: 'roles',
        label: 'Roles & Permissions',
        path: '/admin/roles',
        icon: 'Shield',
      },
      {
        id: 'master-data',
        label: 'Master Data',
        path: '/admin/master-data',
        icon: 'Database',
      },
      {
        id: 'audit-logs',
        label: 'Audit Logs',
        path: '/admin/audit-logs',
        icon: 'FileText',
      },
    ],
  },
];

// Filter options (will be replaced with API data)
export const DEFAULT_FILTER_OPTIONS = {
  engagementModels: [
    { value: 1, label: 'Fixed Price' },
    { value: 2, label: 'Time & Materials' },
    { value: 3, label: 'Retainer' },
    { value: 4, label: 'Managed Services' },
  ],
  serviceCategories: [
    { value: 1, label: 'Consulting' },
    { value: 2, label: 'Development' },
    { value: 3, label: 'Managed Services' },
    { value: 4, label: 'Training' },
    { value: 5, label: 'Support' },
  ],
  sectors: [
    { value: 1, label: 'Technology' },
    { value: 2, label: 'Healthcare' },
    { value: 3, label: 'Finance' },
    { value: 4, label: 'Manufacturing' },
    { value: 5, label: 'Retail' },
    { value: 6, label: 'Energy' },
  ],
  technologies: [
    { value: 1, label: 'React' },
    { value: 2, label: 'Angular' },
    { value: 3, label: 'Vue.js' },
    { value: 4, label: 'Python' },
    { value: 5, label: 'Node.js' },
    { value: 6, label: 'Java' },
    { value: 7, label: 'PostgreSQL' },
    { value: 8, label: 'MongoDB' },
    { value: 9, label: 'AWS' },
    { value: 10, label: 'Azure' },
    { value: 11, label: 'Docker' },
    { value: 12, label: 'Kubernetes' },
  ],
  statuses: [
    { value: 'active', label: 'Active' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'draft', label: 'Draft' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
  resourceCountRanges: [
    { value: '1-5', label: '1-5 resources', min: 1, max: 5 },
    { value: '6-10', label: '6-10 resources', min: 6, max: 10 },
    { value: '11-25', label: '11-25 resources', min: 11, max: 25 },
    { value: '26-50', label: '26-50 resources', min: 26, max: 50 },
    { value: '50+', label: '50+ resources', min: 50, max: 999 },
  ],
};
