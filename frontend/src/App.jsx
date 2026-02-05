import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext';
import { SettingsProvider } from './context/SettingsContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import EmployeesPage from './pages/EmployeesPage';
import InquiriesPage from './pages/InquiriesPage';
import NewCustomersPage from './pages/NewCustomersPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import InventoryPage from './pages/InventoryPage';
import TaskPilotPage from './pages/TaskPilotPage';
import UserManagementPage from './components/admin/UserManagementPage';
import { PERMISSIONS } from './utils/constants';

const AnalyticsPage = () => (
  <div className="glass-card p-8 text-center">
    <h1 className="text-2xl font-bold text-white mb-2">Analytics</h1>
    <p className="text-slate-400">Analytics dashboard coming soon...</p>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <FilterProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/clients" element={<ProtectedRoute permissions={[PERMISSIONS.SERVICES_READ]}><ClientsPage /></ProtectedRoute>} />
                <Route path="/services" element={<ProtectedRoute permissions={[PERMISSIONS.SERVICES_READ]}><ServicesPage /></ProtectedRoute>} />
                <Route path="/services/:id" element={<ProtectedRoute permissions={[PERMISSIONS.SERVICES_READ]}><ServiceDetailPage /></ProtectedRoute>} />
                <Route path="/employees" element={<ProtectedRoute permissions={[PERMISSIONS.SERVICES_READ]}><EmployeesPage /></ProtectedRoute>} />
                <Route path="/inquiries" element={<ProtectedRoute permissions={[PERMISSIONS.SERVICES_READ]}><InquiriesPage /></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute permissions={[PERMISSIONS.SERVICES_READ]}><InventoryPage /></ProtectedRoute>} />
                <Route path="/task-pilot" element={<ProtectedRoute permissions={[PERMISSIONS.SERVICES_READ]}><TaskPilotPage /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute permissions={[PERMISSIONS.ANALYTICS_READ]}><AnalyticsPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/admin/users" element={<ProtectedRoute permissions={[PERMISSIONS.ADMIN_USERS]}><UserManagementPage /></ProtectedRoute>} />
              </Route>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </FilterProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
