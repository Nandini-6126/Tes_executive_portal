import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AIAssistant from '../common/AIAssistant';
import { Menu, X } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLightTheme } = useSettings();

  // Use isLightTheme directly from context
  const isLight = isLightTheme;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isLight ? 'bg-slate-100' : 'bg-slate-950'
    }`}>
      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none">
        {isLight ? (
          <>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
          </>
        ) : (
          <>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-600/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
          </>
        )}
      </div>

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className={`fixed top-4 left-4 z-50 p-2 rounded-lg lg:hidden ${
          isLight ? 'bg-white shadow-md' : 'bg-slate-800'
        }`}
      >
        {mobileMenuOpen ? (
          <X className={`w-6 h-6 ${isLight ? 'text-slate-700' : 'text-white'}`} />
        ) : (
          <Menu className={`w-6 h-6 ${isLight ? 'text-slate-700' : 'text-white'}`} />
        )}
      </button>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div 
          className={`fixed inset-0 backdrop-blur-sm z-30 lg:hidden ${
            isLight ? 'bg-black/30' : 'bg-black/60'
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile unless menu is open */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 lg:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
      </div>

      {/* Main content area */}
      <div className={`
        transition-all duration-300 relative
        ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
      `}>
        <Header />
        
        {/* Page content */}
        <main className="p-6 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>

      {/* AI Assistant - Floating Chat */}
      <AIAssistant />
    </div>
  );
}
