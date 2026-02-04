import axios from 'axios';

const API_BASE_URL = '/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors and token refresh
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token: newRefreshToken } = response.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return client(originalRequest);
        } catch (refreshError) {
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;

// Auth API
export const authAPI = {
  login: (credentials) => client.post('/auth/login', credentials),
  logout: () => client.post('/auth/logout'),
  refresh: (refreshToken) => client.post('/auth/refresh', { refresh_token: refreshToken }),
  me: () => client.get('/auth/me'),
  changePassword: (data) => client.post('/auth/change-password', data),
};

// Services API
export const servicesAPI = {
  filter: (filters) => client.post('/services/filter', filters),
  getAll: () => client.post('/services/filter', { page: 1, page_size: 1000 }),
  getList: () => client.get('/services/list'),  // Simple list for dropdowns
  getById: (id) => client.get(`/services/${id}`),
  create: (data) => client.post('/services', data),
  update: (id, data) => client.put(`/services/${id}`, data),
  delete: (id) => client.delete(`/services/${id}`),
  getCTI: (serviceId) => client.get(`/services/${serviceId}/cti`),
  getAnalytics: () => client.get('/services/analytics/dashboard'),
  // Projects
  addProject: (serviceId, data) => client.post(`/services/${serviceId}/projects`, data),
  updateProject: (projectId, data) => client.put(`/services/projects/${projectId}`, data),
  deleteProject: (projectId) => client.delete(`/services/projects/${projectId}`),
};

// Master Data API
export const masterDataAPI = {
  getAll: () => client.get('/master-data/all'),
  getSectors: () => client.get('/master-data/sectors'),
  getTechnologies: () => client.get('/master-data/technologies'),
  getEngagementModels: () => client.get('/master-data/engagement-models'),
  getServiceCategories: () => client.get('/master-data/service-categories'),
  getDepartments: () => client.get('/master-data/departments'),
};

// Admin API
export const adminAPI = {
  // Users
  getUsers: () => client.get('/admin/users'),
  getUserById: (id) => client.get(`/admin/users/${id}`),
  createUser: (data) => client.post('/admin/users', data),
  updateUser: (id, data) => client.put(`/admin/users/${id}`, data),
  deleteUser: (id) => client.delete(`/admin/users/${id}`),
  // Roles
  getRoles: () => client.get('/admin/roles'),
  // Audit
  getAuditLogs: (filters) => client.post('/admin/audit-logs/filter', filters),
  getAuditStats: () => client.get('/admin/audit-logs/stats'),
};

// Settings API
export const settingsAPI = {
  get: () => client.get('/settings'),
  update: (data) => client.put('/settings', data),
  reset: () => client.delete('/settings'),
};

// AI API
export const aiAPI = {
  chat: (data) => client.post('/ai/chat', data),
  serviceSummary: (serviceId) => client.post('/ai/service-summary', { service_id: serviceId }),
  riskAnalysis: () => client.get('/ai/risk-analysis'),
  suggestions: () => client.get('/ai/suggestions'),
  status: () => client.get('/ai/status'),
};

// Dashboard API
export const dashboardAPI = {
  getAnalytics: () => client.get('/dashboard/analytics'),
  getSummary: () => client.get('/dashboard/summary'),
};

// Inquiries API
export const inquiriesAPI = {
  getAll: (params) => client.get('/inquiries', { params }),
  getById: (id) => client.get(`/inquiries/${id}`),
  create: (data) => client.post('/inquiries', data),
  update: (id, data) => client.put(`/inquiries/${id}`, data),
  delete: (id) => client.delete(`/inquiries/${id}`),
  getStats: () => client.get('/inquiries/stats'),
  addActivity: (id, data) => client.post(`/inquiries/${id}/activities`, data),
  convert: (id, data) => client.post(`/inquiries/${id}/convert`, data),
};

// Clients API
export const clientsAPI = {
  getAll: (params) => client.get('/clients', { params }),
  getById: (id) => client.get(`/clients/${id}`),
  create: (data) => client.post('/clients', data),
  update: (id, data) => client.put(`/clients/${id}`, data),
  delete: (id) => client.delete(`/clients/${id}`),
  getServices: (id) => client.get(`/clients/${id}/services`),
};

// Employees API
export const employeesAPI = {
  getAll: (params) => client.get('/employees', { params }),
  getById: (id) => client.get(`/employees/${id}`),
  create: (data) => client.post('/employees', data),
  update: (id, data) => client.put(`/employees/${id}`, data),
  delete: (id) => client.delete(`/employees/${id}`),
  bulkImport: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return client.post('/employees/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getSkills: () => client.get('/employees/skills/all'),
  createSkill: (data) => client.post('/employees/skills', data),
};

// Tasks API
export const tasksAPI = {
  getAll: (params) => client.get('/tasks', { params }),
  getById: (id) => client.get(`/tasks/${id}`),
  create: (data) => client.post('/tasks', data),
  update: (id, data) => client.put(`/tasks/${id}`, data),
  delete: (id) => client.delete(`/tasks/${id}`),
  assign: (taskId, data) => client.post(`/tasks/${taskId}/assign`, data),
  // AI endpoints
  generateTasks: (data) => client.post('/tasks/ai/generate', data),
  generateAndSaveTasks: (data) => client.post('/tasks/ai/generate-and-save', data),
  recommendEmployees: (data) => client.post('/tasks/ai/recommend-employees', data),
};

// Inventory API
export const inventoryAPI = {
  // Dashboard
  getDashboard: () => client.get('/inventory/reports/dashboard'),
  
  // Components
  getComponents: (params) => client.get('/inventory/components', { params }),
  getComponent: (id) => client.get(`/inventory/components/${id}`),
  createComponent: (data) => client.post('/inventory/components', data),
  getLowStock: () => client.get('/inventory/components/alerts/low-stock'),
  
  // Vendors
  getVendors: () => client.get('/inventory/vendors'),
  getVendor: (id) => client.get(`/inventory/vendors/${id}`),
  createVendor: (data) => client.post('/inventory/vendors', data),
  updateVendor: (id, data) => client.put(`/inventory/vendors/${id}`, data),
  
  // BOMs
  getBOMs: (serviceId) => client.get('/inventory/bom', { params: { service_id: serviceId } }),
  getBOM: (id) => client.get(`/inventory/bom/${id}`),
  createBOM: (data) => client.post('/inventory/bom', data),
  uploadBOM: (data) => client.post('/inventory/bom/upload', data),
  
  // Requests
  getRequests: (params) => client.get('/inventory/requests', { params }),
  getRequest: (id) => client.get(`/inventory/requests/${id}`),
  createRequest: (data) => client.post('/inventory/requests', data),
  submitForApproval: (id) => client.post(`/inventory/requests/${id}/submit`),
  processApproval: (requestId, approvalId, data) => 
    client.post(`/inventory/requests/${requestId}/approvals/${approvalId}`, data),
  
  // AI Analysis
  analyzeService: (data) => client.post('/inventory/ai/analyze-service', data),
  suggestVendors: (data) => client.post('/inventory/ai/suggest-vendors', data),
  generateBOM: (serviceId, requirements) => 
    client.post(`/inventory/ai/generate-bom/${serviceId}`, null, { params: { requirements } }),
  
  // Reports
  generateReport: (data) => client.post('/inventory/reports', data),
};
