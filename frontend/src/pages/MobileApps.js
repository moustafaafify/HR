import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Smartphone, 
  Tablet,
  Download,
  QrCode,
  Palette,
  Bell,
  Settings2,
  Eye,
  LayoutGrid,
  Users,
  Calendar,
  FileText,
  Ticket,
  BarChart3,
  Briefcase,
  Clock,
  DollarSign,
  GraduationCap,
  Heart,
  Building2,
  Shield,
  ChevronRight,
  Home,
  Menu,
  Search,
  User,
  LogOut,
  CheckCircle2,
  Circle,
  Wifi,
  Battery,
  Signal,
  GitBranch,
  FolderTree,
  Layers,
  TrendingUp,
  UserPlus,
  UserMinus,
  ClipboardCheck,
  Network,
  Package,
  Megaphone,
  AlertOctagon,
  Gavel,
  Plane,
  Award,
  Target,
  CalendarDays,
  Code,
  Timer,
  Sheet,
  FolderKanban,
  Receipt
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MobileApps = () => {
  const [activeTab, setActiveTab] = useState('preview');
  const [mobileConfig, setMobileConfig] = useState({
    appName: 'HR Portal',
    appDescription: 'Your complete HR management solution',
    primaryColor: '#2D4F38',
    secondaryColor: '#4F7942',
    accentColor: '#FFB800',
    logoUrl: '',
    splashColor: '#2D4F38',
    enabledModules: {
      dashboard: true,
      employees: true,
      leaves: true,
      attendance: true,
      payroll: true,
      expenses: true,
      tickets: true,
      notifications: true,
      training: true,
      benefits: true,
      documents: true,
      profile: true
    },
    pushNotifications: {
      enabled: true,
      leaveApprovals: true,
      expenseApprovals: true,
      announcements: true,
      ticketUpdates: true,
      payrollAlerts: true
    }
  });
  const [previewDevice, setPreviewDevice] = useState('iphone14');
  const [previewScreen, setPreviewScreen] = useState('home');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ employees: 0, pendingLeaves: 0, tickets: 0 });

  useEffect(() => {
    fetchStats();
    fetchMobileConfig();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats({
        employees: response.data.total_employees || 0,
        pendingLeaves: response.data.pending_leaves || 0,
        tickets: 4
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchMobileConfig = async () => {
    try {
      const response = await axios.get(`${API}/settings/mobile`);
      if (response.data) {
        setMobileConfig(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Failed to fetch mobile config:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(`${API}/settings/mobile`, mobileConfig);
      toast.success('Mobile app configuration saved!');
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = () => {
    const installUrl = `${window.location.origin}?utm_source=qr&install=pwa`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(installUrl)}`;
  };

  const deviceFrames = {
    iphone14: { width: 280, height: 580, name: 'iPhone 14', radius: 40 },
    iphone14pro: { width: 280, height: 600, name: 'iPhone 14 Pro', radius: 45 },
    pixel7: { width: 275, height: 580, name: 'Pixel 7', radius: 35 },
    galaxys23: { width: 275, height: 590, name: 'Galaxy S23', radius: 30 },
    ipad: { width: 400, height: 540, name: 'iPad', radius: 20 }
  };

  const currentDevice = deviceFrames[previewDevice];

  const tabs = [
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'modules', label: 'Modules', icon: LayoutGrid },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'install', label: 'Install', icon: Download }
  ];

  const moduleList = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, description: 'Main dashboard with stats and quick actions' },
    { id: 'employees', label: 'Employees', icon: Users, description: 'Employee directory and profiles' },
    { id: 'leaves', label: 'Time Off', icon: Calendar, description: 'Leave requests and approvals' },
    { id: 'attendance', label: 'Attendance', icon: Clock, description: 'Clock in/out and attendance tracking' },
    { id: 'payroll', label: 'Payroll', icon: DollarSign, description: 'Payslips and salary information' },
    { id: 'expenses', label: 'Expenses', icon: FileText, description: 'Expense claims and reimbursements' },
    { id: 'tickets', label: 'Support', icon: Ticket, description: 'Help desk and support tickets' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Alerts and announcements' },
    { id: 'training', label: 'Training', icon: GraduationCap, description: 'Learning and development' },
    { id: 'benefits', label: 'Benefits', icon: Heart, description: 'Employee benefits information' },
    { id: 'documents', label: 'Documents', icon: FileText, description: 'Document management' },
    { id: 'profile', label: 'My Profile', icon: User, description: 'Personal profile and settings' }
  ];

  // Phone Simulator Component
  const PhoneSimulator = () => {
    const screens = {
      home: (
        <div className="h-full flex flex-col" style={{ backgroundColor: '#f8fafc' }}>
          {/* App Header */}
          <div 
            className="px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: mobileConfig.primaryColor }}
          >
            <div className="flex items-center gap-2">
              <Menu size={20} className="text-white" />
              <span className="text-white font-semibold text-sm">{mobileConfig.appName}</span>
            </div>
            <div className="flex items-center gap-3">
              <Search size={18} className="text-white/80" />
              <div className="relative">
                <Bell size={18} className="text-white/80" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">3</span>
              </div>
            </div>
          </div>

          {/* Welcome Card */}
          <div className="p-3">
            <div 
              className="rounded-xl p-4 text-white"
              style={{ background: `linear-gradient(135deg, ${mobileConfig.primaryColor}, ${mobileConfig.secondaryColor})` }}
            >
              <p className="text-white/80 text-xs">Good morning</p>
              <h2 className="font-bold text-lg">John Smith</h2>
              <p className="text-white/70 text-xs mt-1">Software Engineer • Engineering</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="px-3 grid grid-cols-3 gap-2">
            <div className="bg-white rounded-lg p-2 shadow-sm text-center">
              <p className="text-lg font-bold" style={{ color: mobileConfig.primaryColor }}>{stats.employees}</p>
              <p className="text-[10px] text-slate-500">Employees</p>
            </div>
            <div className="bg-white rounded-lg p-2 shadow-sm text-center">
              <p className="text-lg font-bold text-amber-500">{stats.pendingLeaves}</p>
              <p className="text-[10px] text-slate-500">Pending</p>
            </div>
            <div className="bg-white rounded-lg p-2 shadow-sm text-center">
              <p className="text-lg font-bold text-blue-500">{stats.tickets}</p>
              <p className="text-[10px] text-slate-500">Tickets</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-3">
            <h3 className="text-xs font-semibold text-slate-700 mb-2">Quick Actions</h3>
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: Calendar, label: 'Leave', color: '#10b981' },
                { icon: Clock, label: 'Clock In', color: '#3b82f6' },
                { icon: FileText, label: 'Expense', color: '#f59e0b' },
                { icon: Ticket, label: 'Ticket', color: '#8b5cf6' }
              ].map((action, i) => (
                <button 
                  key={i}
                  className="flex flex-col items-center gap-1 p-2 bg-white rounded-lg shadow-sm"
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${action.color}20` }}
                  >
                    <action.icon size={16} style={{ color: action.color }} />
                  </div>
                  <span className="text-[9px] text-slate-600">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="p-3 flex-1">
            <h3 className="text-xs font-semibold text-slate-700 mb-2">Recent Activity</h3>
            <div className="space-y-2">
              {[
                { title: 'Leave Approved', desc: 'Annual leave for Jan 20-22', time: '2h ago', color: '#10b981' },
                { title: 'New Announcement', desc: 'Q1 Town Hall Meeting', time: '5h ago', color: '#3b82f6' },
                { title: 'Expense Pending', desc: 'Travel reimbursement', time: '1d ago', color: '#f59e0b' }
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-lg p-2 shadow-sm flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <CheckCircle2 size={14} style={{ color: item.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{item.title}</p>
                    <p className="text-[10px] text-slate-500 truncate">{item.desc}</p>
                  </div>
                  <span className="text-[9px] text-slate-400">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="bg-white border-t border-slate-200 px-2 py-2 flex justify-around">
            {[
              { icon: Home, label: 'Home', active: true },
              { icon: Calendar, label: 'Leave', active: false },
              { icon: Users, label: 'Team', active: false },
              { icon: Bell, label: 'Alerts', active: false },
              { icon: User, label: 'Profile', active: false }
            ].map((item, i) => (
              <button 
                key={i}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg ${item.active ? 'bg-slate-100' : ''}`}
              >
                <item.icon 
                  size={18} 
                  style={{ color: item.active ? mobileConfig.primaryColor : '#94a3b8' }}
                />
                <span 
                  className="text-[9px]"
                  style={{ color: item.active ? mobileConfig.primaryColor : '#94a3b8' }}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      ),
      leaves: (
        <div className="h-full flex flex-col" style={{ backgroundColor: '#f8fafc' }}>
          <div 
            className="px-4 py-3 flex items-center gap-3"
            style={{ backgroundColor: mobileConfig.primaryColor }}
          >
            <ChevronRight size={20} className="text-white rotate-180" />
            <span className="text-white font-semibold text-sm">Time Off</span>
          </div>
          <div className="p-3 flex-1">
            <div className="bg-white rounded-xl p-3 shadow-sm mb-3">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-medium text-slate-700">Leave Balance</span>
                <span className="text-xs text-slate-500">2024</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold" style={{ color: mobileConfig.primaryColor }}>12</p>
                  <p className="text-[10px] text-slate-500">Annual</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-500">5</p>
                  <p className="text-[10px] text-slate-500">Sick</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-purple-500">3</p>
                  <p className="text-[10px] text-slate-500">Personal</p>
                </div>
              </div>
            </div>
            <Button 
              className="w-full mb-3 text-sm"
              style={{ backgroundColor: mobileConfig.primaryColor }}
            >
              + Request Leave
            </Button>
            <h3 className="text-xs font-semibold text-slate-700 mb-2">Recent Requests</h3>
            {[
              { type: 'Annual Leave', dates: 'Jan 20-22, 2024', status: 'Approved', color: '#10b981' },
              { type: 'Sick Leave', dates: 'Jan 10, 2024', status: 'Approved', color: '#10b981' },
              { type: 'Personal', dates: 'Dec 24, 2023', status: 'Pending', color: '#f59e0b' }
            ].map((leave, i) => (
              <div key={i} className="bg-white rounded-lg p-3 shadow-sm mb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-slate-800">{leave.type}</p>
                    <p className="text-[10px] text-slate-500">{leave.dates}</p>
                  </div>
                  <span 
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${leave.color}20`, color: leave.color }}
                  >
                    {leave.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
      profile: (
        <div className="h-full flex flex-col" style={{ backgroundColor: '#f8fafc' }}>
          <div 
            className="px-4 py-6 text-center"
            style={{ background: `linear-gradient(135deg, ${mobileConfig.primaryColor}, ${mobileConfig.secondaryColor})` }}
          >
            <div className="w-16 h-16 rounded-full bg-white/20 mx-auto mb-2 flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
            <h2 className="text-white font-bold">John Smith</h2>
            <p className="text-white/70 text-xs">Software Engineer</p>
          </div>
          <div className="p-3 flex-1">
            {[
              { icon: User, label: 'Personal Information' },
              { icon: Briefcase, label: 'Employment Details' },
              { icon: FileText, label: 'Documents' },
              { icon: DollarSign, label: 'Payroll' },
              { icon: Bell, label: 'Notification Settings' },
              { icon: Shield, label: 'Security' },
              { icon: Settings2, label: 'App Settings' }
            ].map((item, i) => (
              <button 
                key={i}
                className="w-full bg-white rounded-lg p-3 shadow-sm mb-2 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className="text-slate-500" />
                  <span className="text-xs font-medium text-slate-700">{item.label}</span>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            ))}
            <button className="w-full bg-red-50 rounded-lg p-3 mt-4 flex items-center justify-center gap-2">
              <LogOut size={16} className="text-red-500" />
              <span className="text-xs font-medium text-red-500">Sign Out</span>
            </button>
          </div>
        </div>
      )
    };

    return (
      <div className="relative" style={{ width: currentDevice.width, height: currentDevice.height }}>
        {/* Phone Frame */}
        <div 
          className="absolute inset-0 bg-slate-900 shadow-2xl"
          style={{ borderRadius: currentDevice.radius }}
        >
          {/* Status Bar */}
          <div className="absolute top-0 left-0 right-0 h-7 px-5 flex items-center justify-between text-white text-[10px] z-10">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <Signal size={12} />
              <Wifi size={12} />
              <Battery size={12} />
            </div>
          </div>
          
          {/* Dynamic Island / Notch */}
          {previewDevice.includes('iphone') && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20" />
          )}
          
          {/* Screen Content */}
          <div 
            className="absolute top-7 left-2 right-2 bottom-2 bg-white overflow-hidden"
            style={{ borderRadius: currentDevice.radius - 8 }}
          >
            {screens[previewScreen]}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div data-testid="mobile-apps-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Mobile Apps
          </h1>
          <p className="text-slate-500 mt-1">Configure and preview your HR mobile application</p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={loading}
          className="bg-[#2D4F38] hover:bg-[#1a3a24]"
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Panel - Configuration */}
        <div className="space-y-6">
          {activeTab === 'preview' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Preview Options</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Device</label>
                  <Select value={previewDevice} onValueChange={setPreviewDevice}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(deviceFrames).map(([key, device]) => (
                        <SelectItem key={key} value={key}>{device.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Screen</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'home', label: 'Home' },
                      { id: 'leaves', label: 'Leaves' },
                      { id: 'profile', label: 'Profile' }
                    ].map(screen => (
                      <button
                        key={screen.id}
                        onClick={() => setPreviewScreen(screen.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          previewScreen === screen.id
                            ? 'bg-[#2D4F38] text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {screen.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">App Branding</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">App Name</label>
                  <input
                    type="text"
                    value={mobileConfig.appName}
                    onChange={(e) => setMobileConfig(prev => ({ ...prev, appName: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2D4F38]/20 focus:border-[#2D4F38] outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">App Description</label>
                  <textarea
                    value={mobileConfig.appDescription}
                    onChange={(e) => setMobileConfig(prev => ({ ...prev, appDescription: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2D4F38]/20 focus:border-[#2D4F38] outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Primary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={mobileConfig.primaryColor}
                        onChange={(e) => setMobileConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={mobileConfig.primaryColor}
                        onChange={(e) => setMobileConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Secondary</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={mobileConfig.secondaryColor}
                        onChange={(e) => setMobileConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={mobileConfig.secondaryColor}
                        onChange={(e) => setMobileConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Accent</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={mobileConfig.accentColor}
                        onChange={(e) => setMobileConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={mobileConfig.accentColor}
                        onChange={(e) => setMobileConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Splash Screen Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={mobileConfig.splashColor}
                      onChange={(e) => setMobileConfig(prev => ({ ...prev, splashColor: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={mobileConfig.splashColor}
                      onChange={(e) => setMobileConfig(prev => ({ ...prev, splashColor: e.target.value }))}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'modules' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Enabled Modules</h3>
              <p className="text-sm text-slate-500 mb-4">Select which modules to include in the mobile app</p>
              
              <div className="space-y-2">
                {moduleList.map(module => (
                  <label 
                    key={module.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={mobileConfig.enabledModules[module.id] || false}
                      onChange={(e) => setMobileConfig(prev => ({
                        ...prev,
                        enabledModules: { ...prev.enabledModules, [module.id]: e.target.checked }
                      }))}
                      className="w-5 h-5 rounded border-slate-300 text-[#2D4F38] focus:ring-[#2D4F38]"
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <module.icon size={16} className="text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{module.label}</p>
                        <p className="text-xs text-slate-500">{module.description}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Push Notifications</h3>
              
              <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 mb-4">
                <input
                  type="checkbox"
                  checked={mobileConfig.pushNotifications.enabled}
                  onChange={(e) => setMobileConfig(prev => ({
                    ...prev,
                    pushNotifications: { ...prev.pushNotifications, enabled: e.target.checked }
                  }))}
                  className="w-5 h-5 rounded border-slate-300 text-[#2D4F38] focus:ring-[#2D4F38]"
                />
                <div>
                  <p className="text-sm font-medium text-slate-800">Enable Push Notifications</p>
                  <p className="text-xs text-slate-500">Allow the app to send push notifications</p>
                </div>
              </label>

              {mobileConfig.pushNotifications.enabled && (
                <div className="space-y-2">
                  {[
                    { id: 'leaveApprovals', label: 'Leave Approvals', desc: 'When leave requests are approved/rejected' },
                    { id: 'expenseApprovals', label: 'Expense Approvals', desc: 'When expense claims are processed' },
                    { id: 'announcements', label: 'Announcements', desc: 'Company-wide announcements' },
                    { id: 'ticketUpdates', label: 'Ticket Updates', desc: 'When support tickets are updated' },
                    { id: 'payrollAlerts', label: 'Payroll Alerts', desc: 'Payslip availability and updates' }
                  ].map(notif => (
                    <label 
                      key={notif.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={mobileConfig.pushNotifications[notif.id] || false}
                        onChange={(e) => setMobileConfig(prev => ({
                          ...prev,
                          pushNotifications: { ...prev.pushNotifications, [notif.id]: e.target.checked }
                        }))}
                        className="w-5 h-5 rounded border-slate-300 text-[#2D4F38] focus:ring-[#2D4F38]"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{notif.label}</p>
                        <p className="text-xs text-slate-500">{notif.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'install' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Install PWA</h3>
              
              <div className="text-center mb-6">
                <div className="inline-block p-4 bg-white rounded-xl shadow-lg border border-slate-200">
                  <img 
                    src={generateQRCode()} 
                    alt="QR Code to install app"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm text-slate-600 mt-4">
                  Scan this QR code on your mobile device to install the app
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <Smartphone size={18} />
                    iOS Installation
                  </h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Open Safari and navigate to the app URL</li>
                    <li>Tap the Share button</li>
                    <li>Select "Add to Home Screen"</li>
                    <li>Tap "Add" to install</li>
                  </ol>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                    <Smartphone size={18} />
                    Android Installation
                  </h4>
                  <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
                    <li>Open Chrome and navigate to the app URL</li>
                    <li>Tap the menu (three dots)</li>
                    <li>Select "Install app" or "Add to Home screen"</li>
                    <li>Tap "Install" to confirm</li>
                  </ol>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-slate-900 mb-2">Direct Link</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={window.location.origin}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.origin);
                        toast.success('Link copied to clipboard!');
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Phone Preview */}
        <div className="flex flex-col items-center justify-start pt-4">
          <div className="sticky top-4">
            <div className="mb-4 text-center">
              <span className="text-sm font-medium text-slate-600">{currentDevice.name} Preview</span>
            </div>
            <PhoneSimulator />
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500">
                This is a live preview using real data from your platform
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileApps;
