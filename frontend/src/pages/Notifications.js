import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  Ticket,
  Calendar,
  Heart,
  FileText,
  GraduationCap,
  Receipt,
  BarChart3,
  Megaphone,
  ClipboardList,
  Settings,
  Archive,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCw,
  Send
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const NotificationTypeIcons = {
  ticket: Ticket,
  leave: Calendar,
  benefit: Heart,
  document: FileText,
  training: GraduationCap,
  expense: Receipt,
  performance: BarChart3,
  announcement: Megaphone,
  task: ClipboardList,
  system: Settings
};

const NotificationTypeColors = {
  ticket: 'bg-blue-100 text-blue-600',
  leave: 'bg-purple-100 text-purple-600',
  benefit: 'bg-pink-100 text-pink-600',
  document: 'bg-amber-100 text-amber-600',
  training: 'bg-emerald-100 text-emerald-600',
  expense: 'bg-orange-100 text-orange-600',
  performance: 'bg-indigo-100 text-indigo-600',
  announcement: 'bg-red-100 text-red-600',
  task: 'bg-cyan-100 text-cyan-600',
  system: 'bg-stone-100 text-stone-600'
};

const PriorityBadges = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  normal: 'bg-stone-100 text-stone-600 border-stone-200',
  low: 'bg-green-100 text-green-700 border-green-200'
};

const Notifications = () => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, read: 0, by_type: {} });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementData, setAnnouncementData] = useState({
    title: '',
    message: '',
    priority: 'normal',
    target: 'all'
  });
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  const fetchNotifications = useCallback(async () => {
    try {
      const params = {};
      if (filter === 'unread') params.is_read = false;
      if (filter === 'read') params.is_read = true;
      if (typeFilter !== 'all') params.type = typeFilter;

      const [notifRes, statsRes] = await Promise.all([
        axios.get(`${API}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
          params
        }),
        axios.get(`${API}/api/notifications/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setNotifications(notifRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [token, filter, typeFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(
        `${API}/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setStats(prev => ({ ...prev, unread: prev.unread - 1, read: prev.read + 1 }));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(
        `${API}/api/notifications/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setStats(prev => ({ ...prev, unread: 0, read: prev.total }));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const archiveNotification = async (notificationId) => {
    try {
      await axios.put(
        `${API}/api/notifications/${notificationId}/archive`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setStats(prev => ({ ...prev, total: prev.total - 1 }));
      toast.success('Notification archived');
    } catch (error) {
      toast.error('Failed to archive notification');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(
        `${API}/api/notifications/${notificationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm('Are you sure you want to delete all notifications? This cannot be undone.')) {
      return;
    }
    try {
      await axios.delete(
        `${API}/api/notifications/clear-all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications([]);
      setStats({ total: 0, unread: 0, read: 0, by_type: {} });
      toast.success('All notifications cleared');
    } catch (error) {
      toast.error('Failed to clear notifications');
    }
  };

  const sendAnnouncement = async () => {
    if (!announcementData.title || !announcementData.message) {
      toast.error('Please fill in title and message');
      return;
    }

    setSendingAnnouncement(true);
    try {
      const response = await axios.post(
        `${API}/api/notifications/announcement`,
        announcementData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message);
      setShowAnnouncementForm(false);
      setAnnouncementData({ title: '', message: '', priority: 'normal', target: 'all' });
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to send announcement');
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(n => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        n.title?.toLowerCase().includes(query) ||
        n.message?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const NotificationCard = ({ notification }) => {
    const Icon = NotificationTypeIcons[notification.type] || Bell;
    const colorClass = NotificationTypeColors[notification.type] || NotificationTypeColors.system;
    const priorityClass = PriorityBadges[notification.priority] || PriorityBadges.normal;

    return (
      <div
        data-testid={`notification-${notification.id}`}
        className={`
          group p-4 rounded-xl border transition-all cursor-pointer
          ${notification.is_read 
            ? 'bg-white border-stone-200 hover:border-stone-300' 
            : 'bg-[#2D4F38]/5 border-[#2D4F38]/20 hover:border-[#2D4F38]/40'
          }
        `}
        onClick={() => {
          if (!notification.is_read) {
            markAsRead(notification.id);
          }
          if (notification.link) {
            window.location.href = notification.link;
          }
        }}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`p-2 rounded-lg ${colorClass}`}>
            <Icon size={18} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className={`text-sm font-semibold ${notification.is_read ? 'text-stone-700' : 'text-stone-900'}`}>
                  {notification.title}
                  {!notification.is_read && (
                    <span className="ml-2 inline-block w-2 h-2 bg-[#2D4F38] rounded-full"></span>
                  )}
                </h4>
                <p className="text-sm text-stone-600 mt-1 line-clamp-2">
                  {notification.message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!notification.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                  >
                    <CheckCircle2 size={14} className="text-[#2D4F38]" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => { e.stopPropagation(); archiveNotification(notification.id); }}
                >
                  <Archive size={14} className="text-stone-400" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                >
                  <Trash2 size={14} className="text-red-400" />
                </Button>
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-stone-400 flex items-center gap-1">
                <Clock size={12} />
                {formatTimeAgo(notification.created_at)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityClass}`}>
                {notification.priority}
              </span>
              <span className="text-xs text-stone-400 capitalize">
                {notification.type}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D4F38]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="notifications-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Notifications</h1>
          <p className="text-stone-500 text-sm mt-1">
            Stay updated with your latest alerts and announcements
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
              className="bg-[#2D4F38] hover:bg-[#2D4F38]/90"
              data-testid="send-announcement-btn"
            >
              <Megaphone size={16} className="mr-2" />
              Send Announcement
            </Button>
          )}
          <Button
            variant="outline"
            onClick={fetchNotifications}
            data-testid="refresh-notifications-btn"
          >
            <RefreshCw size={16} />
          </Button>
        </div>
      </div>

      {/* Announcement Form (Admin) */}
      {isAdmin && showAnnouncementForm && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4" data-testid="announcement-form">
          <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
            <Megaphone size={20} className="text-[#2D4F38]" />
            Send Announcement
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1">Title *</label>
              <Input
                value={announcementData.title}
                onChange={(e) => setAnnouncementData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Announcement title"
                data-testid="announcement-title"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1">Message *</label>
              <textarea
                value={announcementData.message}
                onChange={(e) => setAnnouncementData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Write your announcement message..."
                rows={4}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D4F38]/20 focus:border-[#2D4F38]"
                data-testid="announcement-message"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Priority</label>
              <Select
                value={announcementData.priority}
                onValueChange={(val) => setAnnouncementData(prev => ({ ...prev, priority: val }))}
              >
                <SelectTrigger data-testid="announcement-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Target Audience</label>
              <Select
                value={announcementData.target}
                onValueChange={(val) => setAnnouncementData(prev => ({ ...prev, target: val }))}
              >
                <SelectTrigger data-testid="announcement-target">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="admins">Admins Only</SelectItem>
                  <SelectItem value="employees">Employees Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowAnnouncementForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={sendAnnouncement}
              disabled={sendingAnnouncement}
              className="bg-[#2D4F38] hover:bg-[#2D4F38]/90"
              data-testid="send-announcement-submit"
            >
              {sendingAnnouncement ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  Send Announcement
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-100 rounded-lg">
              <Bell size={20} className="text-stone-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{stats.total}</p>
              <p className="text-xs text-stone-500">Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#2D4F38]/10 rounded-lg">
              <AlertTriangle size={20} className="text-[#2D4F38]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#2D4F38]">{stats.unread}</p>
              <p className="text-xs text-stone-500">Unread</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCheck size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{stats.read}</p>
              <p className="text-xs text-stone-500">Read</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Megaphone size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.by_type?.announcement || 0}</p>
              <p className="text-xs text-stone-500">Announcements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {['all', 'unread', 'read'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className={filter === f ? 'bg-[#2D4F38] hover:bg-[#2D4F38]/90' : ''}
              data-testid={`filter-${f}`}
            >
              {f === 'all' && <Bell size={14} className="mr-1" />}
              {f === 'unread' && <AlertTriangle size={14} className="mr-1" />}
              {f === 'read' && <CheckCheck size={14} className="mr-1" />}
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'unread' && stats.unread > 0 && (
                <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                  {stats.unread}
                </span>
              )}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className="pl-9"
              data-testid="search-notifications"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]" data-testid="type-filter">
              <Filter size={14} className="mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="ticket">Tickets</SelectItem>
              <SelectItem value="leave">Leave</SelectItem>
              <SelectItem value="benefit">Benefits</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="expense">Expenses</SelectItem>
              <SelectItem value="announcement">Announcements</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions Bar */}
      {filteredNotifications.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-stone-500">
            Showing {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            {stats.unread > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                data-testid="mark-all-read-btn"
              >
                <CheckCheck size={14} className="mr-1" />
                Mark all as read
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllNotifications}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              data-testid="clear-all-btn"
            >
              <Trash2 size={14} className="mr-1" />
              Clear all
            </Button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BellOff size={32} className="text-stone-400" />
          </div>
          <h3 className="text-lg font-semibold text-stone-700 mb-2">No notifications</h3>
          <p className="text-stone-500 text-sm">
            {filter === 'unread' 
              ? "You're all caught up! No unread notifications."
              : "You don't have any notifications yet."}
          </p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
