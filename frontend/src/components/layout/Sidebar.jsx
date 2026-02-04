import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, Package, Settings, 
  ChevronDown, Shield, Users, Boxes, 
  ChevronLeft, ChevronRight, Zap, BarChart3
} from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { useSettings } from '../../context/SettingsContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/clients', label: 'Clients', icon: Building2, permission: 'services.read' },
  { path: '/employees', label: 'Employees', icon: Users, permission: 'services.read' },
  { path: '/task-pilot', label: 'Task Pilot', icon: Zap, permission: 'services.read', badge: 'AI' },
  { path: '/inventory', label: 'Inventory', icon: Boxes, permission: 'services.read' },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, permission: 'analytics.read' },
];

const adminItems = [
  { path: '/admin/users', label: 'User Management', icon: Users },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { isAdmin } = usePermissions();
  const { isLightTheme } = useSettings();
  const [adminExpanded, setAdminExpanded] = useState(location.pathname.startsWith('/admin'));

  const isLight = isLightTheme;

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    
    return (
      <NavLink
        to={item.path}
        title={collapsed ? item.label : ''}
        className={`flex items-center gap-3 px-4 py-3 mx-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
          isActive 
            ? 'bg-primary-500/20 text-primary-500 border border-primary-500/30' 
            : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              : 'text-slate-400 hover:text-white hover:bg-dark-800/50'
        } ${collapsed ? 'justify-center px-2' : ''}`}
      >
        <item.icon className={`w-5 h-5 transition-colors flex-shrink-0 ${
          isActive 
            ? 'text-primary-500' 
            : isLight
              ? 'text-slate-500 group-hover:text-primary-500'
              : 'text-slate-500 group-hover:text-primary-400'
        }`} />
        {!collapsed && (
          <>
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                {item.badge}
              </span>
            )}
            {isActive && !item.badge && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 shadow-lg shadow-primary-500/50" />}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <aside className={`fixed left-0 top-0 h-screen backdrop-blur-xl border-r flex flex-col z-40 transition-all duration-300 ${
      collapsed ? 'w-20' : 'w-64'
    } ${
      isLight 
        ? 'bg-white border-slate-200 shadow-lg shadow-slate-200/50' 
        : 'bg-dark-900/80 border-dark-700/50'
    }`}>
      {/* Logo */}
      <div className={`h-16 flex items-center px-4 border-b ${
        isLight ? 'border-slate-200' : 'border-dark-700/50'
      } ${collapsed ? 'justify-center' : ''}`}>
        {collapsed ? (
          <img 
            src="/tessolve-logo.png" 
            alt="Tessolve" 
            className="h-8 w-8 object-contain"
          />
        ) : (
          <img 
            src="/tessolve-logo.png" 
            alt="Tessolve" 
            className="h-10 w-auto object-contain"
          />
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-colors ${
          isLight 
            ? 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700' 
            : 'bg-dark-800 border border-dark-700 text-slate-400 hover:text-white'
        }`}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 py-6 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map(item => (
            <NavItem key={item.path} item={item} />
          ))}
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="mt-8">
            {!collapsed && (
              <button
                onClick={() => setAdminExpanded(!adminExpanded)}
                className={`flex items-center justify-between w-full px-6 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  isLight
                    ? 'text-slate-500 hover:text-slate-700'
                    : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  Admin Panel
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${adminExpanded ? 'rotate-180' : ''}`} />
              </button>
            )}
            
            {(adminExpanded || collapsed) && (
              <div className={`${collapsed ? '' : 'mt-2'} space-y-1`}>
                {adminItems.map(item => (
                  <NavItem key={item.path} item={item} />
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className={`p-4 border-t ${isLight ? 'border-slate-200' : 'border-dark-700/50'}`}>
          <div className={`p-3 text-center rounded-lg ${
            isLight 
              ? 'bg-slate-100 border border-slate-200' 
              : 'bg-dark-800/50 border border-dark-700/30'
          }`}>
            <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Executive Portal</p>
            <p className={`text-[9px] mt-1 ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>© 2024 Tessolve Semiconductor</p>
          </div>
        </div>
      )}
    </aside>
  );
}
