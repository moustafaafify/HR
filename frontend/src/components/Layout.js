import React, { useState, useEffect } from 'react';
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
  X,
  ChevronDown,
  ChevronRight,
  Workflow,
  UserPlus,
  ClipboardCheck,
  UserMinus
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const { t, currentLanguage, availableLanguages, changeLanguage, isRTL } = useLanguage();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [employeesExpanded, setEmployeesExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Role-based access control
  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';
  const isManager = user?.role === 'branch_manager' || isAdmin;
  const isEmployee = user?.role === 'employee';

  // Only admins can see organization structure
  const organizationItems = isAdmin ? [
    { path: '/corporations', icon: Building2, label: t('corporations') },
    { path: '/branches', icon: GitBranch, label: t('branches'), nested: true },
  ] : [];

  // Only managers and admins can see departments/divisions
  const employeeSubItems = isManager ? [
    { path: '/departments', icon: FolderTree, label: t('departments') },
    { path: '/divisions', icon: Layers, label: t('divisions') },
  ] : [];

  // Everyone can see leaves/attendance/performance (employees see their own reviews)
  const peopleItems = [
    { path: '/leaves', icon: Calendar, label: t('leaves') },
    { path: '/attendance', icon: Clock, label: t('attendance') },
    { path: '/performance', icon: BarChart3, label: t('performance') },
  ];

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: t('dashboard') },
  ];

  const NavLink = ({ item, nested = false }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        data-testid={`nav-${item.path.slice(1) || 'dashboard'}`}
        className={`flex items-center gap-3 py-3 rounded-xl transition-all duration-200 ${
          nested ? 'ps-8 pe-4' : 'px-4'
        } ${
          isActive
            ? 'bg-indigo-950 text-white shadow-lg'
            : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-900'
        }`}
      >
        <Icon size={20} />
        <span className="font-medium">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50 noise-texture">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          data-testid="mobile-menu-toggle"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-black text-indigo-950" style={{ fontFamily: 'Manrope, sans-serif' }}>
          HR Platform
        </h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 lg:w-64 bg-white border-e border-slate-100 
        transition-transform duration-300 ease-in-out
        flex flex-col shadow-lg lg:shadow-sm
        ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
      `}>
        <div className="p-4 lg:p-6 border-b border-slate-100 flex items-center justify-between">
          <h1 className="text-xl lg:text-2xl font-black tracking-tight text-indigo-950" style={{ fontFamily: 'Manrope, sans-serif' }}>
            HR Platform
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
            data-testid="sidebar-close"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink key={item.path} item={item} />
          ))}

          {/* Organization Section - Only for admins */}
          {organizationItems.length > 0 && (
            <>
              <div className="pt-4 pb-2 px-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Organization</p>
              </div>
              {organizationItems.map((item) => (
                <NavLink key={item.path} item={item} nested={item.nested} />
              ))}
            </>
          )}

          {/* People Section */}
          <div className="pt-4 pb-2 px-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">People</p>
          </div>
          
          {/* Employees with collapsible sub-menu */}
          <div>
            <Link
              to="/employees"
              data-testid="nav-employees"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                location.pathname === '/employees' || location.pathname === '/departments' || location.pathname === '/divisions'
                  ? 'bg-indigo-950 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-900'
              }`}
            >
              <Users size={20} />
              <span className="font-medium flex-1">{t('employees')}</span>
              {employeeSubItems.length > 0 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEmployeesExpanded(!employeesExpanded);
                  }}
                  className="hover:bg-white/10 rounded p-1 transition-colors"
                >
                  {employeesExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              )}
            </Link>
            
            {/* Employee sub-items - Only for managers and admins */}
            {employeesExpanded && employeeSubItems.length > 0 && (
              <div className="ms-4 border-s-2 border-slate-200 mt-1">
                {employeeSubItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      data-testid={`nav-${item.path.slice(1)}`}
                      className={`flex items-center gap-3 ps-6 pe-4 py-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-indigo-100 text-indigo-950 font-medium'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-900'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Other People items */}
          {peopleItems.map((item) => (
            <NavLink key={item.path} item={item} />
          ))}
          
          {/* Job Openings for all users */}
          <NavLink item={{ path: '/recruitment', icon: UserPlus, label: isAdmin ? 'Recruitment' : 'Job Openings' }} />

          {/* My Onboarding for employees */}
          {!isAdmin && (
            <NavLink item={{ path: '/onboarding', icon: ClipboardCheck, label: 'My Onboarding' }} />
          )}

          {/* Admin-only items */}
          {isAdmin && (
            <>
              <div className="pt-4 pb-2 px-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Administration</p>
              </div>
              <NavLink item={{ path: '/onboarding', icon: ClipboardCheck, label: 'Onboarding' }} />
              <NavLink item={{ path: '/offboarding', icon: UserMinus, label: 'Offboarding' }} />
              <NavLink item={{ path: '/settings/workflows', icon: Workflow, label: 'Workflows' }} />
              <NavLink item={{ path: '/settings', icon: SettingsIcon, label: t('settings') }} />
            </>
          )}
        </nav>

        {/* User section */}
        <div className="p-3 lg:p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 lg:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {user?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 truncate text-sm lg:text-base">{user?.full_name || user?.email}</p>
                <p className="text-xs text-slate-500 capitalize truncate">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={logout}
              data-testid="logout-button"
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium text-sm"
            >
              <LogOut size={18} />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
