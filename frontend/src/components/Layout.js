import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBranding } from '../contexts/BrandingContext';
import axios from 'axios';
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
  ChevronLeft,
  Ticket,
  Bell,
  Smartphone,
  Activity,
  Sun,
  Moon,
  Shield,
  UserCheck
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

// Helper to apply dark mode CSS variables
const applyDarkMode = (isDark) => {
  const root = document.documentElement;
  if (isDark) {
    document.body.classList.add('dark-mode');
    root.style.setProperty('--background', '#0f172a');
    root.style.setProperty('--foreground', '#f8fafc');
    root.style.setProperty('--card', '#1e293b');
    root.style.setProperty('--card-foreground', '#f8fafc');
    root.style.setProperty('--muted', '#334155');
    root.style.setProperty('--muted-foreground', '#94a3b8');
    root.style.setProperty('--border', '#334155');
    root.style.setProperty('--sidebar-bg', '#0f172a');
    root.style.setProperty('--sidebar-border', '#1e293b');
  } else {
    document.body.classList.remove('dark-mode');
    root.style.setProperty('--background', '#FCFCFA');
    root.style.setProperty('--foreground', '#0f172a');
    root.style.setProperty('--card', '#ffffff');
    root.style.setProperty('--card-foreground', '#0f172a');
    root.style.setProperty('--muted', '#f1f5f9');
    root.style.setProperty('--muted-foreground', '#64748b');
    root.style.setProperty('--border', '#e2e8f0');
    root.style.setProperty('--sidebar-bg', '#ffffff');
    root.style.setProperty('--sidebar-border', '#e2e8f0');
  }
};

const Layout = () => {
  const { user, logout, token } = useAuth();
  const { t } = useLanguage();
  const { branding } = useBranding();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(['core']);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage first, then fall back to system preference
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);

  // Apply dark mode on mount and when changed
  useEffect(() => {
    applyDarkMode(darkMode);
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [token]);

  // Fetch recent notifications for dropdown
  const fetchRecentNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API}/api/notifications?limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [token]);

  // Fetch notifications on mount and periodically
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch recent notifications when dropdown opens
  useEffect(() => {
    if (showNotifDropdown) {
      fetchRecentNotifications();
    }
  }, [showNotifDropdown, fetchRecentNotifications]);

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
        { path: '/notifications', icon: Bell, label: 'Notifications' },
        ...(isAdmin ? [{ path: '/reports', icon: BarChart3, label: 'Reports' }] : []),
        ...(isAdmin ? [{ path: '/analytics', icon: Activity, label: 'HR Analytics' }] : []),
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
        { path: '/workforce-planning', icon: TrendingUp, label: isAdmin ? 'Workforce Planning' : 'My Workforce' },
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
        { path: '/tickets', icon: Ticket, label: isAdmin ? 'Tickets' : 'My Tickets' },
        { path: '/complaints', icon: AlertOctagon, label: 'Complaints' },
        ...(isAdmin ? [
          { path: '/settings/workflows', icon: Workflow, label: 'Workflows' },
          { path: '/settings/mobile-apps', icon: Smartphone, label: 'Mobile Apps' },
          { path: '/settings', icon: SettingsIcon, label: 'Settings' },
        ] : []),
      ]
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: Shield,
      items: [
        { path: '/compliance', icon: Shield, label: isAdmin ? 'Compliance & Legal' : 'My Compliance' },
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

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(
        `${API}/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecentNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  // Notification Bell Component
  const NotificationBell = ({ className = '' }) => (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowNotifDropdown(!showNotifDropdown)}
        className="p-2 hover:bg-stone-100 rounded-lg transition-colors relative"
        data-testid="notification-bell"
      >
        <Bell size={20} className="text-stone-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showNotifDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowNotifDropdown(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-stone-200 z-50 overflow-hidden">
            <div className="p-3 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-semibold text-stone-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-[#2D4F38] text-white px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {recentNotifications.length > 0 ? (
                recentNotifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.is_read) markAsRead(notif.id);
                      if (notif.link) window.location.href = notif.link;
                      setShowNotifDropdown(false);
                    }}
                    className={`
                      p-3 border-b border-stone-50 cursor-pointer transition-colors
                      ${notif.is_read ? 'bg-white hover:bg-stone-50' : 'bg-[#2D4F38]/5 hover:bg-[#2D4F38]/10'}
                    `}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notif.is_read ? 'bg-stone-300' : 'bg-[#2D4F38]'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-900 truncate">{notif.title}</p>
                        <p className="text-xs text-stone-500 line-clamp-2 mt-0.5">{notif.message}</p>
                        <p className="text-xs text-stone-400 mt-1">{formatTimeAgo(notif.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-stone-500 text-sm">
                  No notifications yet
                </div>
              )}
            </div>

            <Link
              to="/notifications"
              onClick={() => setShowNotifDropdown(false)}
              className="block p-3 text-center text-sm font-medium text-[#2D4F38] hover:bg-stone-50 border-t border-stone-100"
            >
              View all notifications
            </Link>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--background, #FCFCFA)' }}>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between" style={{ backgroundColor: 'var(--card, white)', borderBottom: '1px solid var(--border, #e2e8f0)' }}>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
          data-testid="mobile-menu-toggle"
        >
          <Menu size={22} style={{ color: 'var(--foreground, #374151)' }} />
        </button>
        <div className="flex items-center gap-2">
          {branding.logo_url && (
            <img src={branding.logo_url} alt="Logo" className="w-7 h-7 object-contain" />
          )}
          <h1 className="text-lg font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--primary, #2D4F38)' }}>
            {branding.app_name || 'HR Platform'}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: darkMode ? 'var(--muted, #334155)' : 'transparent' }}
            data-testid="dark-mode-toggle-mobile"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? (
              <Sun size={20} style={{ color: '#fbbf24' }} />
            ) : (
              <Moon size={20} style={{ color: 'var(--muted-foreground, #64748b)' }} />
            )}
          </button>
          <NotificationBell />
          <Link to="/profile" className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ backgroundColor: 'var(--primary, #2D4F38)' }}>
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </Link>
        </div>
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
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        flex flex-col h-screen
        ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
      `} style={{ backgroundColor: 'var(--sidebar-bg, white)', borderRight: '1px solid var(--sidebar-border, #e2e8f0)' }}>
        {/* Header */}
        <div className={`p-4 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`} style={{ borderBottom: '1px solid var(--border, #f1f5f9)' }}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              {branding.logo_url ? (
                <img src={branding.logo_url} alt="Logo" className="w-8 h-8 object-contain rounded" />
              ) : null}
              <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--primary, #2D4F38)' }}>
                {branding.app_name || 'HR Platform'}
              </h1>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--primary, #2D4F38)' }}>
              {branding.logo_url ? (
                <img src={branding.logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-white font-bold text-sm">{(branding.app_name || 'HR').substring(0, 2).toUpperCase()}</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-1">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X size={18} style={{ color: 'var(--muted-foreground, #64748b)' }} />
              </button>
            )}
            {!isMobile && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors hidden lg:flex"
              >
                <ChevronLeft size={18} className={`transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} style={{ color: 'var(--muted-foreground, #64748b)' }} />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        {!sidebarCollapsed && (
          <div className="p-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground, #9ca3af)' }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm rounded-lg focus:outline-none transition-all"
                style={{ 
                  backgroundColor: 'var(--muted, #f1f5f9)', 
                  border: '1px solid var(--border, #e2e8f0)',
                  color: 'var(--foreground, #0f172a)'
                }}
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-0.5 rounded px-1.5 text-[10px] font-medium" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
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
                    ${sidebarCollapsed ? 'justify-center' : ''}
                  `}
                  style={hasActiveItem ? { 
                    color: 'var(--primary, #2D4F38)', 
                    backgroundColor: 'rgba(var(--primary-rgb, 45, 79, 56), 0.05)' 
                  } : { 
                    color: 'var(--muted-foreground, #64748b)' 
                  }}
                  data-testid={`nav-group-${group.id}`}
                >
                  <GroupIcon size={18} style={{ color: hasActiveItem ? 'var(--primary, #2D4F38)' : 'var(--muted-foreground, #9ca3af)' }} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left">{group.label}</span>
                      <ChevronDown 
                        size={14} 
                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        style={{ color: 'var(--muted-foreground, #9ca3af)' }}
                      />
                    </>
                  )}
                </button>

                {/* Group Items */}
                {!sidebarCollapsed && isExpanded && (
                  <div className="ml-3 pl-3 space-y-0.5" style={{ borderLeft: '1px solid var(--border, #f1f5f9)' }}>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = isItemActive(item.path);

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          data-testid={`nav-item-${item.path.slice(1) || 'dashboard'}`}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all"
                          style={isActive ? {
                            backgroundColor: 'var(--primary, #2D4F38)',
                            color: 'white',
                            fontWeight: '500'
                          } : {
                            color: 'var(--foreground, #475569)'
                          }}
                        >
                          <Icon size={16} style={{ color: isActive ? 'white' : 'var(--muted-foreground, #9ca3af)' }} />
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
        <div className="p-3" style={{ borderTop: '1px solid var(--border, #f1f5f9)' }}>
          <Link
            to="/profile"
            className={`
              flex items-center gap-3 p-2 rounded-xl transition-all
              ${sidebarCollapsed ? 'justify-center' : ''}
            `}
            data-testid="nav-user-profile"
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0" style={{ background: `linear-gradient(135deg, var(--primary, #2D4F38), var(--accent, #4A7C59))` }}>
              {user?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground, #0f172a)' }}>{user?.full_name || user?.email}</p>
                <p className="text-xs capitalize truncate" style={{ color: 'var(--muted-foreground, #64748b)' }}>{user?.role?.replace('_', ' ')}</p>
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
        {/* Desktop Top Bar */}
        <div className="hidden lg:flex items-center justify-end gap-3 px-6 py-3" style={{ borderBottom: '1px solid var(--border, #e2e8f0)' }}>
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl transition-all duration-200 hover:scale-105"
            style={{ 
              backgroundColor: darkMode ? 'var(--muted, #334155)' : 'var(--muted, #f1f5f9)',
            }}
            data-testid="dark-mode-toggle-desktop"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? (
              <Sun size={20} style={{ color: '#fbbf24' }} />
            ) : (
              <Moon size={20} style={{ color: 'var(--muted-foreground, #64748b)' }} />
            )}
          </button>
          <NotificationBell />
        </div>
        <div className="p-4 lg:p-6 xl:p-8 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
