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
  CalendarDays,
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
  UserMinus,
  Receipt,
  GraduationCap,
  FileCheck,
  ClipboardList,
  Network,
  Wallet,
  Package,
  Megaphone,
  AlertOctagon,
  Gavel,
  Plane,
  Award,
  Target,
  Code,
  Timer,
  Sheet,
  FolderKanban,
  Heart,
  Search,
  User,
  Briefcase,
  TrendingUp,
  DollarSign,
  HelpCircle,
  ChevronLeft
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(['core']);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Auto-expand group based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    navGroups.forEach(group => {
      const hasActiveItem = group.items.some(item => item.path === currentPath);
      if (hasActiveItem && !expandedGroups.includes(group.id)) {
        setExpandedGroups(prev => [...prev, group.id]);
      }
    });
  }, [location.pathname]);

  // Role-based access control
  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';
  const isManager = user?.role === 'branch_manager' || isAdmin;

  // Navigation groups with categorized structure
  const navGroups = [
    {
      id: 'core',
      label: 'Core',
      icon: LayoutDashboard,
      items: [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/team-calendar', icon: CalendarDays, label: 'Calendar' },
        { path: '/communications', icon: Megaphone, label: 'Communications' },
        { path: '/documents', icon: FileCheck, label: 'Documents' },
      ]
    },
    {
      id: 'people',
      label: 'People',
      icon: Users,
      items: [
        { path: '/employees', icon: Users, label: 'Employees', adminOnly: false },
        ...(isAdmin ? [
          { path: '/corporations', icon: Building2, label: 'Corporations' },
          { path: '/branches', icon: GitBranch, label: 'Branches' },
          { path: '/departments', icon: FolderTree, label: 'Departments' },
          { path: '/divisions', icon: Layers, label: 'Divisions' },
        ] : []),
        { path: '/recruitment', icon: UserPlus, label: isAdmin ? 'Recruitment' : 'Job Openings' },
        { path: '/onboarding', icon: ClipboardCheck, label: isAdmin ? 'Onboarding' : 'My Onboarding' },
        { path: '/offboarding', icon: UserMinus, label: isAdmin ? 'Offboarding' : 'My Offboarding' },
        ...(isAdmin ? [{ path: '/succession', icon: Target, label: 'Succession' }] : []),
        { path: '/org-chart', icon: Network, label: 'Org Chart' },
      ]
    },
    {
      id: 'work',
      label: 'Work',
      icon: Briefcase,
      items: [
        { path: '/projects', icon: FolderKanban, label: isAdmin ? 'Projects' : 'My Projects' },
        { path: '/timesheets', icon: Sheet, label: isAdmin ? 'Timesheets' : 'My Timesheets' },
        { path: '/overtime', icon: Timer, label: isAdmin ? 'Overtime' : 'My Overtime' },
        { path: '/attendance', icon: Clock, label: 'Attendance' },
        { path: '/leaves', icon: Calendar, label: 'Leaves' },
        { path: '/travel', icon: Plane, label: isAdmin ? 'Travel' : 'My Travel' },
        { path: '/assets', icon: Package, label: isAdmin ? 'Assets' : 'My Assets' },
      ]
    },
    {
      id: 'growth',
      label: 'Growth',
      icon: TrendingUp,
      items: [
        { path: '/performance', icon: BarChart3, label: 'Performance' },
        { path: '/appraisals', icon: ClipboardList, label: isAdmin ? 'Appraisals' : 'My Appraisals' },
        { path: '/training', icon: GraduationCap, label: isAdmin ? 'Training' : 'My Training' },
        { path: '/skills', icon: Code, label: isAdmin ? 'Skills' : 'My Skills' },
        { path: '/recognition', icon: Award, label: 'Recognition' },
        ...(isAdmin ? [{ path: '/disciplinary', icon: Gavel, label: 'Disciplinary' }] : []),
      ]
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: DollarSign,
      items: [
        { path: '/payroll', icon: Wallet, label: isAdmin ? 'Payroll' : 'My Payslips' },
        { path: '/expenses', icon: Receipt, label: isAdmin ? 'Expenses' : 'My Expenses' },
        { path: '/benefits', icon: Heart, label: isAdmin ? 'Benefits' : 'My Benefits' },
      ]
    },
    {
      id: 'support',
      label: 'Support',
      icon: HelpCircle,
      items: [
        { path: '/complaints', icon: AlertOctagon, label: 'Complaints' },
        ...(isAdmin ? [
          { path: '/settings/workflows', icon: Workflow, label: 'Workflows' },
          { path: '/settings', icon: SettingsIcon, label: 'Settings' },
        ] : []),
      ]
    }
  ];

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const isItemActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Filter items based on search
  const getFilteredGroups = () => {
    if (!searchQuery) return navGroups;
    
    const query = searchQuery.toLowerCase();
    return navGroups.map(group => ({
      ...group,
      items: group.items.filter(item => 
        item.label.toLowerCase().includes(query)
      )
    })).filter(group => group.items.length > 0);
  };

  const filteredGroups = getFilteredGroups();

  return (
    <div className="flex min-h-screen bg-[#FCFCFA]">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
          data-testid="mobile-menu-toggle"
        >
          <Menu size={22} className="text-stone-700" />
        </button>
        <h1 className="text-lg font-bold text-[#2D4F38]" style={{ fontFamily: 'Manrope, sans-serif' }}>
          HR Platform
        </h1>
        <Link to="/profile" className="w-8 h-8 rounded-full bg-[#2D4F38] flex items-center justify-center text-white text-sm font-medium">
          {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
        </Link>
      </header>

      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50
        ${sidebarCollapsed ? 'w-[72px]' : 'w-64'}
        bg-white border-r border-stone-200
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        flex flex-col h-screen
        ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
      `}>
        {/* Header */}
        <div className={`p-4 border-b border-stone-100 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-[#2D4F38] tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              HR Platform
            </h1>
          )}
          {sidebarCollapsed && (
            <div className="w-9 h-9 rounded-lg bg-[#2D4F38] flex items-center justify-center">
              <span className="text-white font-bold text-sm">HR</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X size={18} className="text-stone-500" />
              </button>
            )}
            {!isMobile && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors hidden lg:flex"
              >
                <ChevronLeft size={18} className={`text-stone-500 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        {!sidebarCollapsed && (
          <div className="p-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D4F38]/20 focus:border-[#2D4F38] transition-all"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-stone-200 bg-stone-100 px-1.5 text-[10px] font-medium text-stone-500">
                ⌘K
              </kbd>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {filteredGroups.map((group) => {
            const GroupIcon = group.icon;
            const isExpanded = expandedGroups.includes(group.id) || searchQuery;
            const hasActiveItem = group.items.some(item => isItemActive(item.path));

            return (
              <div key={group.id} className="space-y-0.5">
                {/* Group Header */}
                <button
                  onClick={() => !sidebarCollapsed && toggleGroup(group.id)}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${hasActiveItem ? 'text-[#2D4F38] bg-[#2D4F38]/5' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'}
                    ${sidebarCollapsed ? 'justify-center' : ''}
                  `}
                  data-testid={`nav-group-${group.id}`}
                >
                  <GroupIcon size={18} className={hasActiveItem ? 'text-[#2D4F38]' : 'text-stone-400'} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left">{group.label}</span>
                      <ChevronDown 
                        size={14} 
                        className={`text-stone-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                      />
                    </>
                  )}
                </button>

                {/* Group Items */}
                {!sidebarCollapsed && isExpanded && (
                  <div className="ml-3 pl-3 border-l border-stone-100 space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = isItemActive(item.path);

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          data-testid={`nav-item-${item.path.slice(1) || 'dashboard'}`}
                          className={`
                            flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all
                            ${isActive 
                              ? 'bg-[#2D4F38] text-white font-medium shadow-sm' 
                              : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                            }
                          `}
                        >
                          <Icon size={16} className={isActive ? 'text-white' : 'text-stone-400'} />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-stone-100">
          <Link
            to="/profile"
            className={`
              flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 transition-all
              ${sidebarCollapsed ? 'justify-center' : ''}
            `}
            data-testid="nav-user-profile"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2D4F38] to-[#4A7C59] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {user?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-900 truncate">{user?.full_name || user?.email}</p>
                <p className="text-xs text-stone-500 capitalize truncate">{user?.role?.replace('_', ' ')}</p>
              </div>
            )}
          </Link>
          
          {!sidebarCollapsed && (
            <button
              onClick={logout}
              data-testid="logout-button"
              className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-[#D97757] hover:bg-[#D97757]/10 rounded-lg transition-colors font-medium"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          )}
          
          {sidebarCollapsed && (
            <button
              onClick={logout}
              data-testid="logout-button-collapsed"
              className="mt-2 w-full flex items-center justify-center p-2 text-[#D97757] hover:bg-[#D97757]/10 rounded-lg transition-colors"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        <div className="p-4 lg:p-6 xl:p-8 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
