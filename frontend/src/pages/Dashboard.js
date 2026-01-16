import React, { useEffect, useState } from 'react';
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
  TrendingUp
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
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

  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  useEffect(() => {
    fetchStats();
    fetchTicketStats();
    fetchRecentTickets();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchTicketStats = async () => {
    try {
      const response = await axios.get(`${API}/tickets/stats`);
      setTicketStats(response.data);
    } catch (error) {
      console.error('Failed to fetch ticket stats:', error);
    }
  };

  const fetchRecentTickets = async () => {
    try {
      const response = await axios.get(`${API}/tickets?limit=5`);
      setRecentTickets(response.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch recent tickets:', error);
    }
  };

  const statCards = [
    {
      label: t('totalCorporations'),
      value: stats.total_corporations,
      icon: Building2,
      color: 'bg-blue-500',
      testId: 'stat-corporations'
    },
    {
      label: t('totalBranches'),
      value: stats.total_branches,
      icon: GitBranch,
      color: 'bg-green-500',
      testId: 'stat-branches'
    },
    {
      label: t('totalDepartments'),
      value: stats.total_departments,
      icon: FolderTree,
      color: 'bg-purple-500',
      testId: 'stat-departments'
    },
    {
      label: t('totalDivisions'),
      value: stats.total_divisions,
      icon: Layers,
      color: 'bg-indigo-500',
      testId: 'stat-divisions'
    },
    {
      label: t('totalEmployees'),
      value: stats.total_employees,
      icon: Users,
      color: 'bg-orange-500',
      testId: 'stat-employees'
    },
    {
      label: t('pendingLeaves'),
      value: stats.pending_leaves,
      icon: Calendar,
      color: 'bg-red-500',
      testId: 'stat-pending-leaves'
    }
  ];

  const formatRelativeTime = (dateStr) => {
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
      open: { label: 'Open', color: 'bg-emerald-100 text-emerald-700' },
      in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
      pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
      resolved: { label: 'Resolved', color: 'bg-purple-100 text-purple-700' },
      closed: { label: 'Closed', color: 'bg-slate-100 text-slate-600' }
    };
    return configs[status] || configs.open;
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      low: { label: 'Low', color: 'text-slate-500' },
      medium: { label: 'Medium', color: 'text-blue-600' },
      high: { label: 'High', color: 'text-orange-600' },
      urgent: { label: 'Urgent', color: 'text-rose-600' }
    };
    return configs[priority] || configs.medium;
  };

  return (
    <div data-testid="dashboard-page" className="space-y-6">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
        {t('dashboard')}
      </h1>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              data-testid={stat.testId}
              className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-5 lg:p-6 card-hover"
            >
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className={`p-2 sm:p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                  <Icon className={stat.color.replace('bg-', 'text-')} size={20} />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mb-1 truncate">{stat.label}</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Tickets Section */}
      {ticketStats && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Ticket Stats Widget */}
          <div className="lg:col-span-1 bg-gradient-to-br from-[#2D4F38] to-[#1F3A29] rounded-2xl p-6 text-white" data-testid="ticket-stats-widget">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Ticket className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold">Support Tickets</h2>
              </div>
              <Link to="/tickets" className="text-white/80 hover:text-white transition-colors">
                <ArrowRight size={20} />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CircleDot size={14} className="text-emerald-400" />
                  <span className="text-sm text-white/70">Open</span>
                </div>
                <p className="text-2xl font-bold">{ticketStats.by_status?.open || 0}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Timer size={14} className="text-blue-400" />
                  <span className="text-sm text-white/70">In Progress</span>
                </div>
                <p className="text-2xl font-bold">{ticketStats.by_status?.in_progress || 0}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={14} className="text-amber-400" />
                  <span className="text-sm text-white/70">Pending</span>
                </div>
                <p className="text-2xl font-bold">{ticketStats.by_status?.pending || 0}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 size={14} className="text-purple-400" />
                  <span className="text-sm text-white/70">Resolved</span>
                </div>
                <p className="text-2xl font-bold">{ticketStats.by_status?.resolved || 0}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/20">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">Total Tickets</span>
                <span className="font-semibold">{ticketStats.total}</span>
              </div>
              {isAdmin && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-white/70 flex items-center gap-1">
                    <AlertCircle size={14} className="text-amber-400" />
                    Unassigned
                  </span>
                  <span className="font-semibold">{ticketStats.unassigned || 0}</span>
                </div>
              )}
              {ticketStats.avg_resolution_hours > 0 && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-white/70 flex items-center gap-1">
                    <TrendingUp size={14} className="text-emerald-400" />
                    Avg Resolution
                  </span>
                  <span className="font-semibold">{ticketStats.avg_resolution_hours}h</span>
                </div>
              )}
            </div>
          </div>

          {/* Recent Tickets List */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm" data-testid="recent-tickets-widget">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Recent Tickets</h2>
              <Link to="/tickets" className="text-sm text-[#2D4F38] hover:underline flex items-center gap-1">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            
            {recentTickets.length === 0 ? (
              <div className="p-8 text-center">
                <Ticket className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500">No tickets yet</p>
                <Link to="/tickets" className="text-sm text-[#2D4F38] hover:underline mt-2 inline-block">
                  Create your first ticket
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentTickets.map(ticket => {
                  const statusConfig = getStatusConfig(ticket.status);
                  const priorityConfig = getPriorityConfig(ticket.priority);
                  return (
                    <Link
                      key={ticket.id}
                      to="/tickets"
                      className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-slate-400">{ticket.ticket_number}</span>
                          <span className={`text-xs font-medium ${priorityConfig.color}`}>
                            {priorityConfig.label}
                          </span>
                        </div>
                        <p className="font-medium text-slate-900 truncate">{ticket.subject}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span>{ticket.requester_name}</span>
                          <span>{formatRelativeTime(ticket.created_at)}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color} whitespace-nowrap`}>
                        {statusConfig.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
