import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import {
  Ticket,
  Plus,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  User,
  Calendar,
  Tag,
  Send,
  Filter,
  MoreVertical,
  Eye,
  Trash2,
  UserPlus,
  Star,
  AlertTriangle,
  Zap,
  ArrowRight,
  Building2,
  X,
  ChevronRight,
  Inbox,
  CircleDot,
  Timer,
  TrendingUp
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-600', icon: null },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700', icon: null },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  urgent: { label: 'Urgent', color: 'bg-rose-100 text-rose-700', icon: Zap }
};

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'bg-emerald-100 text-emerald-700', icon: CircleDot },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Timer },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  resolved: { label: 'Resolved', color: 'bg-purple-100 text-purple-700', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-600', icon: CheckCircle2 }
};

const CATEGORY_CONFIG = {
  it: { label: 'IT Support', color: 'bg-indigo-50 text-indigo-700' },
  hr: { label: 'HR', color: 'bg-pink-50 text-pink-700' },
  facilities: { label: 'Facilities', color: 'bg-teal-50 text-teal-700' },
  payroll: { label: 'Payroll', color: 'bg-emerald-50 text-emerald-700' },
  benefits: { label: 'Benefits', color: 'bg-rose-50 text-rose-700' },
  leave: { label: 'Leave', color: 'bg-cyan-50 text-cyan-700' },
  onboarding: { label: 'Onboarding', color: 'bg-violet-50 text-violet-700' },
  other: { label: 'Other', color: 'bg-slate-50 text-slate-700' }
};

const Tickets = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Data
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  // Forms
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: '',
    category: 'other',
    priority: 'medium'
  });

  const [commentForm, setCommentForm] = useState({
    content: '',
    is_internal: false
  });

  const [ratingForm, setRatingForm] = useState(0);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  // Fetch functions
  const fetchTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await axios.get(`${API}/tickets?${params}`);
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    }
  }, [statusFilter, priorityFilter, categoryFilter, searchQuery]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/tickets/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await axios.get(`${API}/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  }, [isAdmin]);

  const fetchTicketDetails = useCallback(async (ticketId) => {
    try {
      const response = await axios.get(`${API}/tickets/${ticketId}`);
      setSelectedTicket(response.data);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Failed to fetch ticket details:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchTickets(), fetchStats(), fetchEmployees()]);
    } finally {
      setLoading(false);
    }
  }, [fetchTickets, fetchStats, fetchEmployees]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter, categoryFilter, searchQuery, fetchTickets]);

  // Handlers
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/tickets`, ticketForm);
      toast.success('Ticket created successfully!');
      fetchTickets();
      fetchStats();
      setCreateDialogOpen(false);
      setTicketForm({ subject: '', description: '', category: 'other', priority: 'medium' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create ticket');
    }
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      await axios.put(`${API}/tickets/${ticketId}`, { status: newStatus });
      toast.success('Status updated!');
      fetchTickets();
      fetchStats();
      if (selectedTicket?.id === ticketId) {
        fetchTicketDetails(ticketId);
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAssignTicket = async (ticketId, assigneeId) => {
    try {
      await axios.post(`${API}/tickets/${ticketId}/assign`, { assigned_to: assigneeId });
      toast.success('Ticket assigned!');
      fetchTickets();
      setAssignDialogOpen(false);
      if (selectedTicket?.id === ticketId) {
        fetchTicketDetails(ticketId);
      }
    } catch (error) {
      toast.error('Failed to assign ticket');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentForm.content.trim()) return;
    try {
      await axios.post(`${API}/tickets/${selectedTicket.id}/comments`, commentForm);
      toast.success('Comment added!');
      fetchTicketDetails(selectedTicket.id);
      setCommentForm({ content: '', is_internal: false });
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleRateTicket = async () => {
    if (!ratingForm) return;
    try {
      await axios.post(`${API}/tickets/${selectedTicket.id}/rate`, { rating: ratingForm });
      toast.success('Thank you for your feedback!');
      fetchTicketDetails(selectedTicket.id);
      setRatingForm(0);
    } catch (error) {
      toast.error('Failed to submit rating');
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Delete this ticket?')) return;
    try {
      await axios.delete(`${API}/tickets/${ticketId}`);
      toast.success('Ticket deleted');
      fetchTickets();
      fetchStats();
      setViewDialogOpen(false);
    } catch (error) {
      toast.error('Failed to delete ticket');
    }
  };

  const openTicketView = (ticket) => {
    setSelectedTicket(ticket);
    fetchTicketDetails(ticket.id);
    setViewDialogOpen(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

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
    return formatDate(dateStr);
  };

  // Filter tickets by tab
  const getFilteredTickets = () => {
    let filtered = tickets;
    if (activeTab === 'open') {
      filtered = tickets.filter(t => ['open', 'in_progress', 'pending'].includes(t.status));
    } else if (activeTab === 'resolved') {
      filtered = tickets.filter(t => ['resolved', 'closed'].includes(t.status));
    } else if (activeTab === 'assigned' && isAdmin) {
      filtered = tickets.filter(t => t.assigned_to);
    } else if (activeTab === 'unassigned' && isAdmin) {
      filtered = tickets.filter(t => !t.assigned_to && !['resolved', 'closed'].includes(t.status));
    }
    return filtered;
  };

  const filteredTickets = getFilteredTickets();

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#2D4F38]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="tickets-page">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-stone-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {isAdmin ? 'Ticket Management' : 'My Tickets'}
          </h1>
          <p className="text-stone-500 mt-1">
            {isAdmin ? 'Manage and resolve support tickets' : 'Track your support requests'}
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="bg-[#2D4F38] hover:bg-[#1F3A29]" data-testid="create-ticket-btn">
          <Plus size={18} className="mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D4F38]/10 flex items-center justify-center">
              <Inbox className="w-5 h-5 text-[#2D4F38]" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Total Tickets</p>
              <p className="text-2xl font-bold text-stone-900">{stats?.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CircleDot className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Open</p>
              <p className="text-2xl font-bold text-stone-900">{stats?.open_tickets || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Resolved</p>
              <p className="text-2xl font-bold text-stone-900">{(stats?.by_status?.resolved || 0) + (stats?.by_status?.closed || 0)}</p>
            </div>
          </div>
        </div>

        {isAdmin ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-stone-500">Unassigned</p>
                <p className="text-2xl font-bold text-stone-900">{stats?.unassigned || 0}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Timer className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-stone-500">In Progress</p>
                <p className="text-2xl font-bold text-stone-900">{stats?.by_status?.in_progress || 0}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters and Tabs */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm">
        <div className="p-4 border-b border-stone-100">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(CATEGORY_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start rounded-none border-b border-stone-100 bg-transparent h-auto p-0">
            <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2D4F38] data-[state=active]:bg-transparent">
              All ({tickets.length})
            </TabsTrigger>
            <TabsTrigger value="open" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2D4F38] data-[state=active]:bg-transparent">
              Open ({tickets.filter(t => ['open', 'in_progress', 'pending'].includes(t.status)).length})
            </TabsTrigger>
            <TabsTrigger value="resolved" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2D4F38] data-[state=active]:bg-transparent">
              Resolved ({tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length})
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="unassigned" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2D4F38] data-[state=active]:bg-transparent">
                  Unassigned ({tickets.filter(t => !t.assigned_to && !['resolved', 'closed'].includes(t.status)).length})
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {/* Ticket List */}
            {filteredTickets.length === 0 ? (
              <div className="text-center py-12">
                <Ticket className="w-12 h-12 mx-auto text-stone-300 mb-4" />
                <p className="text-stone-600 font-medium">No tickets found</p>
                <p className="text-stone-500 text-sm mt-1">
                  {searchQuery ? 'Try adjusting your search' : 'Create a new ticket to get started'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {filteredTickets.map(ticket => {
                  const priorityConfig = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;
                  const statusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                  const categoryConfig = CATEGORY_CONFIG[ticket.category] || CATEGORY_CONFIG.other;
                  const StatusIcon = statusConfig.icon;
                  const PriorityIcon = priorityConfig.icon;

                  return (
                    <div
                      key={ticket.id}
                      className="p-4 hover:bg-stone-50 cursor-pointer transition-colors"
                      onClick={() => openTicketView(ticket)}
                      data-testid={`ticket-row-${ticket.id}`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Status Icon */}
                        <div className={`w-8 h-8 rounded-lg ${statusConfig.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          {StatusIcon && <StatusIcon size={16} />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-stone-400">{ticket.ticket_number}</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryConfig.color}`}>
                                  {categoryConfig.label}
                                </span>
                                {PriorityIcon && (
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${priorityConfig.color}`}>
                                    <PriorityIcon size={12} />
                                    {priorityConfig.label}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-medium text-stone-900 line-clamp-1">{ticket.subject}</h3>
                              <p className="text-sm text-stone-500 line-clamp-1 mt-0.5">{ticket.description}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-stone-400 flex-shrink-0" />
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-xs text-stone-500">
                            <span className="flex items-center gap-1">
                              <User size={12} />
                              {ticket.requester_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {formatRelativeTime(ticket.created_at)}
                            </span>
                            {ticket.assigned_to_name && (
                              <span className="flex items-center gap-1">
                                <UserPlus size={12} />
                                {ticket.assigned_to_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Ticket Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Ticket</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTicket} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Subject *</label>
              <Input
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                placeholder="Brief summary of your issue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Description *</label>
              <Textarea
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                placeholder="Provide detailed information about your request..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
                <Select value={ticketForm.category} onValueChange={(v) => setTicketForm({ ...ticketForm, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Priority</label>
                <Select value={ticketForm.priority} onValueChange={(v) => setTicketForm({ ...ticketForm, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#2D4F38] hover:bg-[#1F3A29]">Create Ticket</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Ticket Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-mono text-stone-400">{selectedTicket.ticket_number}</p>
                    <DialogTitle className="mt-1">{selectedTicket.subject}</DialogTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteTicket(selectedTicket.id)}>
                        <Trash2 size={16} className="text-rose-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Status and Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_CONFIG[selectedTicket.status]?.color}`}>
                    {STATUS_CONFIG[selectedTicket.status]?.label}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${PRIORITY_CONFIG[selectedTicket.priority]?.color}`}>
                    {PRIORITY_CONFIG[selectedTicket.priority]?.label} Priority
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${CATEGORY_CONFIG[selectedTicket.category]?.color}`}>
                    {CATEGORY_CONFIG[selectedTicket.category]?.label}
                  </span>
                </div>

                {/* Admin Actions */}
                {isAdmin && (
                  <div className="flex flex-wrap gap-2 p-3 bg-stone-50 rounded-xl">
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(v) => handleUpdateStatus(selectedTicket.id, v)}
                    >
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                          <SelectItem key={value} value={value}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedTicket.assigned_to || ''}
                      onValueChange={(v) => handleAssignTicket(selectedTicket.id, v)}
                    >
                      <SelectTrigger className="w-[160px] h-8">
                        <SelectValue placeholder="Assign to..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Details */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User size={14} className="text-stone-400" />
                      <span className="text-stone-500">Requester:</span>
                      <span className="font-medium">{selectedTicket.requester_name}</span>
                    </div>
                    {selectedTicket.requester_department && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 size={14} className="text-stone-400" />
                        <span className="text-stone-500">Department:</span>
                        <span className="font-medium">{selectedTicket.requester_department}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-stone-400" />
                      <span className="text-stone-500">Created:</span>
                      <span className="font-medium">{formatDate(selectedTicket.created_at)}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {selectedTicket.assigned_to_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <UserPlus size={14} className="text-stone-400" />
                        <span className="text-stone-500">Assigned to:</span>
                        <span className="font-medium">{selectedTicket.assigned_to_name}</span>
                      </div>
                    )}
                    {selectedTicket.due_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-stone-400" />
                        <span className="text-stone-500">Due:</span>
                        <span className="font-medium">{formatDate(selectedTicket.due_date)}</span>
                      </div>
                    )}
                    {selectedTicket.resolved_at && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span className="text-stone-500">Resolved:</span>
                        <span className="font-medium">{formatDate(selectedTicket.resolved_at)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-sm font-medium text-stone-700 mb-2">Description</h4>
                  <div className="bg-stone-50 rounded-xl p-4">
                    <p className="text-stone-600 whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>
                </div>

                {/* Resolution Notes */}
                {selectedTicket.resolution_notes && (
                  <div>
                    <h4 className="text-sm font-medium text-stone-700 mb-2">Resolution</h4>
                    <div className="bg-emerald-50 rounded-xl p-4">
                      <p className="text-emerald-700 whitespace-pre-wrap">{selectedTicket.resolution_notes}</p>
                    </div>
                  </div>
                )}

                {/* Rating */}
                {['resolved', 'closed'].includes(selectedTicket.status) && !selectedTicket.satisfaction_rating && !isAdmin && (
                  <div className="bg-amber-50 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-amber-800 mb-2">How was your experience?</h4>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <button
                          key={rating}
                          onClick={() => setRatingForm(rating)}
                          className={`p-1.5 rounded transition-colors ${ratingForm >= rating ? 'text-amber-500' : 'text-stone-300 hover:text-amber-400'}`}
                        >
                          <Star size={24} fill={ratingForm >= rating ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                      {ratingForm > 0 && (
                        <Button size="sm" onClick={handleRateTicket} className="ml-2 bg-amber-500 hover:bg-amber-600">
                          Submit
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {selectedTicket.satisfaction_rating && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-stone-500">Rating:</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <Star
                          key={rating}
                          size={16}
                          className={rating <= selectedTicket.satisfaction_rating ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments */}
                <div>
                  <h4 className="text-sm font-medium text-stone-700 mb-3 flex items-center gap-2">
                    <MessageSquare size={16} />
                    Comments ({comments.length})
                  </h4>

                  {comments.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {comments.map(comment => (
                        <div
                          key={comment.id}
                          className={`rounded-xl p-4 ${comment.is_internal ? 'bg-amber-50 border border-amber-200' : 'bg-stone-50'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#2D4F38] flex items-center justify-center text-white text-xs font-medium">
                                {comment.author_name?.charAt(0) || 'U'}
                              </div>
                              <span className="font-medium text-sm text-stone-900">{comment.author_name}</span>
                              {comment.is_internal && (
                                <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded">Internal</span>
                              )}
                            </div>
                            <span className="text-xs text-stone-500">{formatRelativeTime(comment.created_at)}</span>
                          </div>
                          <p className="text-sm text-stone-600">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment Form */}
                  {!['closed'].includes(selectedTicket.status) && (
                    <form onSubmit={handleAddComment} className="space-y-3">
                      <Textarea
                        value={commentForm.content}
                        onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
                        placeholder="Add a comment..."
                        rows={3}
                      />
                      <div className="flex items-center justify-between">
                        {isAdmin && (
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={commentForm.is_internal}
                              onChange={(e) => setCommentForm({ ...commentForm, is_internal: e.target.checked })}
                              className="rounded border-stone-300 text-[#2D4F38]"
                            />
                            <span className="text-stone-600">Internal note (not visible to requester)</span>
                          </label>
                        )}
                        <Button type="submit" size="sm" className="bg-[#2D4F38] hover:bg-[#1F3A29]">
                          <Send size={14} className="mr-1" />
                          Send
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tickets;
