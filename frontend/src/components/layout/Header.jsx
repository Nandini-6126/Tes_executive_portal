import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, ChevronDown, Bell, Search, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { ROLE_DISPLAY_NAMES } from '../../utils/constants';

export default function Header() {
  const { user, logout } = useAuth();
  const { isLightTheme } = useSettings();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  // Use isLightTheme directly from context
  const isLight = isLightTheme;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/20 text-purple-500 border-purple-500/30';
      case 'manager': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      case 'engineer': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-500 border-slate-500/30';
    }
  };

  return (
    <header className={`h-16 backdrop-blur-xl border-b flex items-center justify-between px-6 sticky top-0 z-30 transition-colors duration-300 ${
      isLight 
        ? 'bg-white border-slate-200 shadow-sm' 
        : 'bg-slate-900/60 border-slate-700/50'
    }`}>
      {/* Left side - Search */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            isLight ? 'text-slate-400' : 'text-slate-500'
          }`} />
          <input
            type="text"
            placeholder="Search services, products..."
            className={`w-80 pl-10 pr-4 py-2 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 ${
              isLight 
                ? 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400' 
                : 'bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder-slate-500'
            }`}
          />
        </div>
      </div>

      {/* Right side - User menu */}
      <div className="flex items-center gap-4" ref={menuRef}>
        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-lg transition-colors ${
              isLight 
                ? 'hover:bg-slate-100' 
                : 'hover:bg-slate-800/50'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-accent-500/25">
              {user?.full_name?.charAt(0) || user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="text-left hidden md:block">
              <p className={`text-sm font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {user?.full_name || user?.username}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${
              isLight ? 'text-slate-400' : 'text-slate-400'
            } ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {showUserMenu && (
            <div className={`absolute right-0 mt-2 w-64 rounded-2xl overflow-hidden animate-fadeIn shadow-xl ${
              isLight 
                ? 'bg-white border border-slate-200' 
                : 'bg-dark-900/95 backdrop-blur-xl border border-dark-700/50'
            }`}>
              <div className={`p-4 border-b ${isLight ? 'border-slate-200' : 'border-slate-700/50'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-white font-semibold shadow-lg shadow-accent-500/25">
                    {user?.full_name?.charAt(0) || user?.username?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {user?.full_name || user?.username}
                    </p>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {user?.email}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user?.role)}`}>
                    <Shield className="w-3 h-3" />
                    {ROLE_DISPLAY_NAMES[user?.role] || user?.role}
                  </span>
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    isLight 
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <User className="w-4 h-4" />My Profile
                </button>
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    isLight 
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Settings className="w-4 h-4" />Settings
                </button>
              </div>

              <div className={`p-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-700/50'}`}>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
