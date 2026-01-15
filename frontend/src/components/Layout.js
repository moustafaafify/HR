import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  LayoutDashboard, 
  Building2, 
  GitBranch, 
  FolderTree,
  Layers,
  Users, 
  Calendar, 
  Clock, 
  BarChart3, 
  Settings as SettingsIcon, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const { t, currentLanguage, availableLanguages, changeLanguage, isRTL } = useLanguage();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/corporations', icon: Building2, label: t('corporations') },
    { path: '/branches', icon: GitBranch, label: t('branches') },
    { path: '/employees', icon: Users, label: t('employees') },
    { path: '/leaves', icon: Calendar, label: t('leaves') },
    { path: '/attendance', icon: Clock, label: t('attendance') },
    { path: '/performance', icon: BarChart3, label: t('performance') },
    { path: '/settings', icon: SettingsIcon, label: t('settings') },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 noise-texture">
      {/* Sidebar */}
      <aside className={`${
        sidebarOpen ? 'w-64' : 'w-20'
      } bg-white border-e border-slate-100 transition-all duration-300 flex flex-col shadow-sm`}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-2xl font-black tracking-tight text-indigo-950" style={{ fontFamily: 'Manrope, sans-serif' }}>
              HR Platform
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            data-testid="sidebar-toggle"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.path.slice(1) || 'dashboard'}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-950 text-white shadow-lg'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-900'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={logout}
            data-testid="logout-button"
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="font-medium">{t('logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-100 px-8 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {t('welcome')}, {user?.full_name}
              </h2>
              <p className="text-sm text-slate-500 mt-1">{user?.role}</p>
            </div>

            {/* Language Switcher */}
            {availableLanguages.length > 1 && (
              <div className="flex gap-2" data-testid="language-switcher">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => changeLanguage(lang)}
                    data-testid={`lang-${lang}`}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      currentLanguage === lang
                        ? 'bg-indigo-950 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
