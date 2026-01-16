import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Building2, 
  GitBranch, 
  FolderTree, 
  Layers, 
  Users, 
  Calendar,
  Ticket,
  CircleDot,
  Timer,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  TrendingUp,
  Bell,
  FileText,
  Heart,
  GraduationCap,
  Receipt,
  Briefcase,
  Award,
  Target,
  Megaphone,
  BarChart3,
  PieChart,
  Activity,
  UserPlus,
  UserCheck,
  Plane,
  CalendarDays,
  ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/button';

const API = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const { t } = useLanguage();
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    total_corporations: 0,
    total_branches: 0,
    total_departments: 0,
    total_divisions: 0,
    total_employees: 0,
    pending_leaves: 0
  });
  const [ticketStats, setTicketStats] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  const fetchAllData = useCallback(async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [statsRes, ticketStatsRes, ticketsRes, notifRes, unreadRes] = await Promise.all([
        axios.get(`${API}/api/dashboard/stats`).catch(() => ({ data: {} })),
        axios.get(`${API}/api/tickets/stats`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API}/api/tickets?limit=5`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/api/notifications?limit=5`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/api/notifications/unread-count`, { headers }).catch(() => ({ data: { count: 0 } }))
      ]);

      setStats(statsRes.data);
      setTicketStats(ticketStatsRes.data);
      setRecentTickets(ticketsRes.data?.slice?.(0, 5) || []);
      setNotifications(notifRes.data?.slice?.(0, 5) || []);
      setUnreadCount(unreadRes.data?.count || 0);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusConfig = (status) => {
    const configs = {
      open: { label: 'Open', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
      in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
      pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
      resolved: { label: 'Resolved', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
      closed: { label: 'Closed', color: 'bg-stone-100 text-stone-600', dot: 'bg-stone-500' }
    };
    return configs[status] || configs.open;
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      low: { label: 'Low', color: 'text-stone-500' },
      medium: { label: 'Medium', color: 'text-blue-600' },
      high: { label: 'High', color: 'text-orange-600' },
      urgent: { label: 'Urgent', color: 'text-rose-600' }
    };
    return configs[priority] || configs.medium;
  };

  // Quick Action Cards for Admin
  const adminQuickActions = [
    { label: 'Add Employee', icon: UserPlus, path: '/employees', color: 'from-emerald-500 to-teal-600' },
    { label: 'Post Job', icon: Briefcase, path: '/recruitment', color: 'from-blue-500 to-indigo-600' },
    { label: 'Send Announcement', icon: Megaphone, path: '/notifications', color: 'from-amber-500 to-orange-600' },
    { label: 'View Reports', icon: BarChart3, path: '/reports', color: 'from-purple-500 to-pink-600' },
  ];

  // Quick Action Cards for Employee
  const employeeQuickActions = [
    { label: 'Request Leave', icon: Calendar, path: '/time-off', color: 'from-emerald-500 to-teal-600' },
    { label: 'Submit Expense', icon: Receipt, path: '/expenses', color: 'from-blue-500 to-indigo-600' },
    { label: 'Create Ticket', icon: Ticket, path: '/tickets', color: 'from-amber-500 to-orange-600' },
    { label: 'View Benefits', icon: Heart, path: '/benefits', color: 'from-purple-500 to-pink-600' },
  ];

  const quickActions = isAdmin ? adminQuickActions : employeeQuickActions;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2D4F38]"></div>
      </div>
    );
  }

  return (
    <div data-testid="dashboard-page" className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Welcome back, {user?.full_name?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="text-stone-500 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {unreadCount > 0 && (
          <Link 
            to="/notifications"
            className="flex items-center gap-2 bg-[#2D4F38]/10 text-[#2D4F38] px-4 py-2 rounded-full hover:bg-[#2D4F38]/20 transition-colors"
          >
            <Bell size={18} />
            <span className="font-medium">{unreadCount} new notification{unreadCount !== 1 ? 's' : ''}</span>
          </Link>
        )}
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        
        {/* Quick Actions - Spans 12 cols on mobile, 8 on desktop */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={i}
                    to={action.path}
                    className={`
                      group relative overflow-hidden rounded-xl p-4 
                      bg-gradient-to-br ${action.color} text-white
                      hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl
                    `}
                    data-testid={`quick-action-${action.label.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <Icon size={24} className="mb-2 relative z-10" />
                    <span className="text-sm font-medium relative z-10">{action.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Notifications Widget - Spans 4 cols on desktop */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                <Bell size={18} className="text-[#2D4F38]" />
                Notifications
              </h2>
              <Link to="/notifications" className="text-sm text-[#2D4F38] hover:underline">
                View all
              </Link>
            </div>
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.slice(0, 3).map((notif) => (
                  <div key={notif.id} className={`p-3 rounded-lg ${notif.is_read ? 'bg-stone-50' : 'bg-[#2D4F38]/5'}`}>
                    <p className="text-sm font-medium text-stone-900 truncate">{notif.title}</p>
                    <p className="text-xs text-stone-500 mt-1">{formatTimeAgo(notif.created_at)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-stone-400">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            )}
          </div>
        </div>

        {/* Organization Stats - Large Bento Card */}
        {isAdmin && (
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Activity size={20} />
                  Organization Overview
                </h2>
                <Link to="/org-chart" className="text-sm text-white/70 hover:text-white flex items-center gap-1">
                  View Chart <ChevronRight size={16} />
                </Link>
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                {[
                  { icon: Building2, label: 'Corporations', value: stats.total_corporations, color: 'bg-blue-500/20 text-blue-400' },
                  { icon: GitBranch, label: 'Branches', value: stats.total_branches, color: 'bg-emerald-500/20 text-emerald-400' },
                  { icon: FolderTree, label: 'Departments', value: stats.total_departments, color: 'bg-purple-500/20 text-purple-400' },
                  { icon: Layers, label: 'Divisions', value: stats.total_divisions, color: 'bg-indigo-500/20 text-indigo-400' },
                  { icon: Users, label: 'Employees', value: stats.total_employees, color: 'bg-amber-500/20 text-amber-400' },
                  { icon: Calendar, label: 'Pending Leaves', value: stats.pending_leaves, color: 'bg-rose-500/20 text-rose-400' },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="text-center" data-testid={`org-stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>
                      <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-2`}>
                        <Icon size={20} />
                      </div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-white/60">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Ticket Stats - Vertical Bento */}
        <div className={`col-span-12 ${isAdmin ? 'lg:col-span-4' : 'lg:col-span-6'}`}>
          <div className="bg-gradient-to-br from-[#2D4F38] to-[#1F3A29] rounded-2xl p-6 text-white h-full" data-testid="ticket-stats-widget">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Ticket size={18} />
                Support Tickets
              </h2>
              <Link to="/tickets" className="text-white/70 hover:text-white">
                <ArrowRight size={18} />
              </Link>
            </div>

            {ticketStats ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'Open', value: ticketStats.by_status?.open || 0, icon: CircleDot, color: 'text-emerald-400' },
                    { label: 'In Progress', value: ticketStats.by_status?.in_progress || 0, icon: Timer, color: 'text-blue-400' },
                    { label: 'Pending', value: ticketStats.by_status?.pending || 0, icon: Clock, color: 'text-amber-400' },
                    { label: 'Resolved', value: ticketStats.by_status?.resolved || 0, icon: CheckCircle2, color: 'text-purple-400' },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="bg-white/10 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon size={14} className={item.color} />
                          <span className="text-xs text-white/70">{item.label}</span>
                        </div>
                        <p className="text-xl font-bold">{item.value}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2 pt-3 border-t border-white/20">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Total Tickets</span>
                    <span className="font-semibold">{ticketStats.total}</span>
                  </div>
                  {isAdmin && ticketStats.unassigned > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70 flex items-center gap-1">
                        <AlertCircle size={14} className="text-amber-400" />
                        Unassigned
                      </span>
                      <span className="font-semibold text-amber-400">{ticketStats.unassigned}</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-white/50">
                <Ticket size={40} className="mx-auto mb-2 opacity-50" />
                <p>No ticket data</p>
              </div>
            )}
          </div>
        </div>

        {/* Employee Stats for non-admins */}
        {!isAdmin && (
          <div className="col-span-12 lg:col-span-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-6 h-full">
              <h2 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <Target size={18} className="text-[#2D4F38]" />
                My Overview
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Calendar, label: 'Leave Balance', value: '12 days', color: 'bg-emerald-100 text-emerald-600' },
                  { icon: Ticket, label: 'My Tickets', value: ticketStats?.total || 0, color: 'bg-blue-100 text-blue-600' },
                  { icon: GraduationCap, label: 'Trainings', value: '3 pending', color: 'bg-purple-100 text-purple-600' },
                  { icon: Award, label: 'Recognition', value: '5 pts', color: 'bg-amber-100 text-amber-600' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50">
                      <div className={`p-2 rounded-lg ${item.color}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-stone-900">{item.value}</p>
                        <p className="text-xs text-stone-500">{item.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Recent Tickets - Wide Bento */}
        <div className="col-span-12">
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden" data-testid="recent-tickets-widget">
            <div className="p-4 sm:p-6 border-b border-stone-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Recent Tickets</h2>
              <Link to="/tickets" className="text-sm text-[#2D4F38] hover:underline flex items-center gap-1">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            
            {recentTickets.length === 0 ? (
              <div className="p-8 text-center">
                <Ticket className="w-12 h-12 mx-auto text-stone-300 mb-3" />
                <p className="text-stone-500 mb-2">No tickets yet</p>
                <Link to="/tickets">
                  <Button className="bg-[#2D4F38] hover:bg-[#1F3A29]">Create your first ticket</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {recentTickets.map(ticket => {
                  const statusConfig = getStatusConfig(ticket.status);
                  const priorityConfig = getPriorityConfig(ticket.priority);
                  return (
                    <Link
                      key={ticket.id}
                      to="/tickets"
                      className="p-4 hover:bg-stone-50 transition-colors flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                            {ticket.ticket_number}
                          </span>
                          <span className={`text-xs font-medium ${priorityConfig.color}`}>
                            {priorityConfig.label}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`}></span>
                        </div>
                        <p className="font-medium text-stone-900 truncate">{ticket.subject}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-stone-500">
                          <span>{ticket.requester_name}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(ticket.created_at)}</span>
                          {ticket.assigned_to_name && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <UserCheck size={12} />
                                {ticket.assigned_to_name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color} whitespace-nowrap self-start sm:self-center`}>
                        {statusConfig.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events / Calendar Preview - Optional Bento */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                <CalendarDays size={18} className="text-[#2D4F38]" />
                Upcoming
              </h2>
              <Link to="/team-calendar" className="text-sm text-[#2D4F38] hover:underline">
                View Calendar
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { title: 'Team Standup', time: 'Today, 10:00 AM', type: 'meeting' },
                { title: 'Performance Review', time: 'Tomorrow, 2:00 PM', type: 'review' },
                { title: 'Training: Leadership', time: 'Jan 20, 9:00 AM', type: 'training' },
              ].map((event, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer">
                  <div className={`w-2 h-10 rounded-full ${
                    event.type === 'meeting' ? 'bg-blue-500' : 
                    event.type === 'review' ? 'bg-purple-500' : 'bg-emerald-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-stone-900">{event.title}</p>
                    <p className="text-xs text-stone-500">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Quick Links</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Documents', icon: FileText, path: '/documents' },
                { label: 'Training', icon: GraduationCap, path: '/training' },
                { label: 'Benefits', icon: Heart, path: '/benefits' },
                { label: 'Time Off', icon: Plane, path: '/time-off' },
                { label: 'Profile', icon: Users, path: '/profile' },
                { label: 'Settings', icon: Target, path: '/settings' },
              ].map((link, i) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={i}
                    to={link.path}
                    className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 hover:bg-[#2D4F38]/10 hover:text-[#2D4F38] transition-colors group"
                  >
                    <Icon size={18} className="text-stone-400 group-hover:text-[#2D4F38]" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
