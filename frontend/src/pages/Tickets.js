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
  Send,
  Trash2,
  UserPlus,
  Star,
  AlertTriangle,
  Zap,
  Building2,
  ChevronRight,
  Inbox,
  CircleDot,
  Timer,
  Settings2,
  FileText,
  MessageCircle,
  GitBranch,
  Sparkles,
  Copy,
  Edit2
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
  const [templates, setTemplates] = useState([]);
  const [cannedResponses, setCannedResponses] = useState([]);
  const [assignmentRules, setAssignmentRules] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [cannedDialogOpen, setCannedDialogOpen] = useState(false);
  const [showCannedPicker, setShowCannedPicker] = useState(false);

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

  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    subject_template: '',
    body_template: '',
    category: 'other',
    priority: 'medium'
  });

  const [ruleForm, setRuleForm] = useState({
    name: '',
    category: 'it',
    assignee_id: '',
    priority_filter: ''
  });

  const [cannedForm, setCannedForm] = useState({
    name: '',
    shortcut: '',
    content: '',
    category: ''
  });

  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  const [editingCanned, setEditingCanned] = useState(null);
  const [ratingForm, setRatingForm] = useState(0);
  const [settingsTab, setSettingsTab] = useState('templates');

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

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/tickets/templates`);
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  }, []);

  const fetchCannedResponses = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await axios.get(`${API}/tickets/canned-responses`);
      setCannedResponses(response.data);
    } catch (error) {
      console.error('Failed to fetch canned responses:', error);
    }
  }, [isAdmin]);

  const fetchAssignmentRules = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await axios.get(`${API}/tickets/assignment-rules`);
      setAssignmentRules(response.data);
    } catch (error) {
      console.error('Failed to fetch assignment rules:', error);
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
      await Promise.all([
        fetchTickets(),
        fetchStats(),
        fetchEmployees(),
        fetchTemplates(),
        fetchCannedResponses(),
        fetchAssignmentRules()
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchTickets, fetchStats, fetchEmployees, fetchTemplates, fetchCannedResponses, fetchAssignmentRules]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter, categoryFilter, searchQuery, fetchTickets]);

  // Ticket handlers
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
      if (selectedTicket?.id === ticketId) fetchTicketDetails(ticketId);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAssignTicket = async (ticketId, assigneeId) => {
    try {
      await axios.post(`${API}/tickets/${ticketId}/assign`, { assigned_to: assigneeId === 'unassigned' ? null : assigneeId });
      toast.success('Ticket assigned!');
      fetchTickets();
      if (selectedTicket?.id === ticketId) fetchTicketDetails(ticketId);
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

  // Template handlers
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await axios.put(`${API}/tickets/templates/${editingTemplate.id}`, templateForm);
        toast.success('Template updated!');
      } else {
        await axios.post(`${API}/tickets/templates`, templateForm);
        toast.success('Template created!');
      }
      fetchTemplates();
      setTemplateDialogOpen(false);
      resetTemplateForm();
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await axios.delete(`${API}/tickets/templates/${id}`);
      toast.success('Template deleted');
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const handleSeedTemplates = async () => {
    try {
      const response = await axios.post(`${API}/tickets/templates/seed-defaults`);
      toast.success(response.data.message);
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to seed templates');
    }
  };

  const applyTemplate = (template) => {
    setTicketForm({
      ...ticketForm,
      subject: template.subject_template,
      description: template.body_template,
      category: template.category,
      priority: template.priority
    });
  };

  // Assignment Rule handlers
  const handleSaveRule = async (e) => {
    e.preventDefault();
    try {
      const data = { ...ruleForm };
      if (!data.priority_filter) delete data.priority_filter;
      
      if (editingRule) {
        await axios.put(`${API}/tickets/assignment-rules/${editingRule.id}`, data);
        toast.success('Rule updated!');
      } else {
        await axios.post(`${API}/tickets/assignment-rules`, data);
        toast.success('Rule created!');
      }
      fetchAssignmentRules();
      setRuleDialogOpen(false);
      resetRuleForm();
    } catch (error) {
      toast.error('Failed to save rule');
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    try {
      await axios.delete(`${API}/tickets/assignment-rules/${id}`);
      toast.success('Rule deleted');
      fetchAssignmentRules();
    } catch (error) {
      toast.error('Failed to delete rule');
    }
  };

  // Canned Response handlers
  const handleSaveCanned = async (e) => {
    e.preventDefault();
    try {
      const data = { ...cannedForm };
      if (!data.category) delete data.category;
      
      if (editingCanned) {
        await axios.put(`${API}/tickets/canned-responses/${editingCanned.id}`, data);
        toast.success('Response updated!');
      } else {
        await axios.post(`${API}/tickets/canned-responses`, data);
        toast.success('Response created!');
      }
      fetchCannedResponses();
      setCannedDialogOpen(false);
      resetCannedForm();
    } catch (error) {
      toast.error('Failed to save response');
    }
  };

  const handleDeleteCanned = async (id) => {
    if (!window.confirm('Delete this canned response?')) return;
    try {
      await axios.delete(`${API}/tickets/canned-responses/${id}`);
      toast.success('Response deleted');
      fetchCannedResponses();
    } catch (error) {
      toast.error('Failed to delete response');
    }
  };

  const handleSeedCanned = async () => {
    try {
      const response = await axios.post(`${API}/tickets/canned-responses/seed-defaults`);
      toast.success(response.data.message);
      fetchCannedResponses();
    } catch (error) {
      toast.error('Failed to seed responses');
    }
  };

  const insertCannedResponse = async (response) => {
    setCommentForm({ ...commentForm, content: commentForm.content + response.content });
    setShowCannedPicker(false);
    // Increment usage count
    try {
      await axios.post(`${API}/tickets/canned-responses/${response.id}/use`);
    } catch (error) {
      // Silent fail
    }
  };

  // Reset forms
  const resetTemplateForm = () => {
    setEditingTemplate(null);
    setTemplateForm({ name: '', description: '', subject_template: '', body_template: '', category: 'other', priority: 'medium' });
  };

  const resetRuleForm = () => {
    setEditingRule(null);
    setRuleForm({ name: '', category: 'it', assignee_id: '', priority_filter: '' });
  };

  const resetCannedForm = () => {
    setEditingCanned(null);
    setCannedForm({ name: '', shortcut: '', content: '', category: '' });
  };

  const openTicketView = (ticket) => {
    setSelectedTicket(ticket);
    fetchTicketDetails(ticket.id);
    setViewDialogOpen(true);
  };

  const openEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      subject_template: template.subject_template,
      body_template: template.body_template,
      category: template.category,
      priority: template.priority
    });
    setTemplateDialogOpen(true);
  };

  const openEditRule = (rule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      category: rule.category,
      assignee_id: rule.assignee_id,
      priority_filter: rule.priority_filter || ''
    });
    setRuleDialogOpen(true);
  };

  const openEditCanned = (canned) => {
    setEditingCanned(canned);
    setCannedForm({
      name: canned.name,
      shortcut: canned.shortcut || '',
      content: canned.content,
      category: canned.category || ''
    });
    setCannedDialogOpen(true);
  };

  // Helpers
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

  const getFilteredTickets = () => {
    let filtered = tickets;
    if (activeTab === 'open') filtered = tickets.filter(t => ['open', 'in_progress', 'pending'].includes(t.status));
    else if (activeTab === 'resolved') filtered = tickets.filter(t => ['resolved', 'closed'].includes(t.status));
    else if (activeTab === 'unassigned' && isAdmin) filtered = tickets.filter(t => !t.assigned_to && !['resolved', 'closed'].includes(t.status));
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
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={() => setSettingsDialogOpen(true)} data-testid="ticket-settings-btn">
              <Settings2 size={18} className="mr-2" />
              Settings
            </Button>
          )}
          <Button onClick={() => setCreateDialogOpen(true)} className="bg-[#2D4F38] hover:bg-[#1F3A29]" data-testid="create-ticket-btn">
            <Plus size={18} className="mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D4F38]/10 flex items-center justify-center">
              <Inbox className="w-5 h-5 text-[#2D4F38]" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Total</p>
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

      {/* Filters and List */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm">
        <div className="p-4 border-b border-stone-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input placeholder="Search tickets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Category" /></SelectTrigger>
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start rounded-none border-b border-stone-100 bg-transparent h-auto p-0">
            <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2D4F38] data-[state=active]:bg-transparent">All ({tickets.length})</TabsTrigger>
            <TabsTrigger value="open" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2D4F38] data-[state=active]:bg-transparent">Open ({tickets.filter(t => ['open', 'in_progress', 'pending'].includes(t.status)).length})</TabsTrigger>
            <TabsTrigger value="resolved" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2D4F38] data-[state=active]:bg-transparent">Resolved ({tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length})</TabsTrigger>
            {isAdmin && <TabsTrigger value="unassigned" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2D4F38] data-[state=active]:bg-transparent">Unassigned ({tickets.filter(t => !t.assigned_to && !['resolved', 'closed'].includes(t.status)).length})</TabsTrigger>}
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-12">
                <Ticket className="w-12 h-12 mx-auto text-stone-300 mb-4" />
                <p className="text-stone-600 font-medium">No tickets found</p>
                <p className="text-stone-500 text-sm mt-1">{searchQuery ? 'Try adjusting your search' : 'Create a new ticket to get started'}</p>
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
                    <div key={ticket.id} className="p-4 hover:bg-stone-50 cursor-pointer transition-colors" onClick={() => openTicketView(ticket)} data-testid={`ticket-row-${ticket.id}`}>
                      <div className="flex items-start gap-4">
                        <div className={`w-8 h-8 rounded-lg ${statusConfig.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          {StatusIcon && <StatusIcon size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-stone-400">{ticket.ticket_number}</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryConfig.color}`}>{categoryConfig.label}</span>
                                {PriorityIcon && <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${priorityConfig.color}`}><PriorityIcon size={12} />{priorityConfig.label}</span>}
                              </div>
                              <h3 className="font-medium text-stone-900 line-clamp-1">{ticket.subject}</h3>
                              <p className="text-sm text-stone-500 line-clamp-1 mt-0.5">{ticket.description}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-stone-400 flex-shrink-0" />
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-stone-500">
                            <span className="flex items-center gap-1"><User size={12} />{ticket.requester_name}</span>
                            <span className="flex items-center gap-1"><Clock size={12} />{formatRelativeTime(ticket.created_at)}</span>
                            {ticket.assigned_to_name && <span className="flex items-center gap-1"><UserPlus size={12} />{ticket.assigned_to_name}</span>}
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
          
          {/* Templates */}
          {templates.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-stone-700 mb-2">Quick Templates</p>
              <div className="flex flex-wrap gap-2">
                {templates.slice(0, 4).map(template => (
                  <button key={template.id} onClick={() => applyTemplate(template)} className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-sm text-stone-700 transition-colors flex items-center gap-1">
                    <FileText size={14} />
                    {template.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Subject *</label>
              <Input value={ticketForm.subject} onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })} placeholder="Brief summary of your issue" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Description *</label>
              <Textarea value={ticketForm.description} onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })} placeholder="Provide detailed information..." rows={4} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
                <Select value={ticketForm.category} onValueChange={(v) => setTicketForm({ ...ticketForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                  {isAdmin && (
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteTicket(selectedTicket.id)}>
                      <Trash2 size={16} className="text-rose-500" />
                    </Button>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Status badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_CONFIG[selectedTicket.status]?.color}`}>{STATUS_CONFIG[selectedTicket.status]?.label}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${PRIORITY_CONFIG[selectedTicket.priority]?.color}`}>{PRIORITY_CONFIG[selectedTicket.priority]?.label} Priority</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${CATEGORY_CONFIG[selectedTicket.category]?.color}`}>{CATEGORY_CONFIG[selectedTicket.category]?.label}</span>
                </div>

                {/* Admin Actions */}
                {isAdmin && (
                  <div className="flex flex-wrap gap-2 p-3 bg-stone-50 rounded-xl">
                    <Select value={selectedTicket.status} onValueChange={(v) => handleUpdateStatus(selectedTicket.id, v)}>
                      <SelectTrigger className="w-[140px] h-8"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                          <SelectItem key={value} value={value}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedTicket.assigned_to || 'unassigned'} onValueChange={(v) => handleAssignTicket(selectedTicket.id, v)}>
                      <SelectTrigger className="w-[160px] h-8"><SelectValue placeholder="Assign to..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
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
                    <div className="flex items-center gap-2 text-sm"><User size={14} className="text-stone-400" /><span className="text-stone-500">Requester:</span><span className="font-medium">{selectedTicket.requester_name}</span></div>
                    {selectedTicket.requester_department && <div className="flex items-center gap-2 text-sm"><Building2 size={14} className="text-stone-400" /><span className="text-stone-500">Department:</span><span className="font-medium">{selectedTicket.requester_department}</span></div>}
                    <div className="flex items-center gap-2 text-sm"><Calendar size={14} className="text-stone-400" /><span className="text-stone-500">Created:</span><span className="font-medium">{formatDate(selectedTicket.created_at)}</span></div>
                  </div>
                  <div className="space-y-3">
                    {selectedTicket.assigned_to_name && <div className="flex items-center gap-2 text-sm"><UserPlus size={14} className="text-stone-400" /><span className="text-stone-500">Assigned to:</span><span className="font-medium">{selectedTicket.assigned_to_name}{selectedTicket.assigned_to_role && <span className="text-stone-400 ml-1">({selectedTicket.assigned_to_role})</span>}</span></div>}
                    {selectedTicket.due_date && <div className="flex items-center gap-2 text-sm"><Clock size={14} className="text-stone-400" /><span className="text-stone-500">Due:</span><span className="font-medium">{formatDate(selectedTicket.due_date)}</span></div>}
                    {selectedTicket.resolved_at && <div className="flex items-center gap-2 text-sm"><CheckCircle2 size={14} className="text-emerald-500" /><span className="text-stone-500">Resolved:</span><span className="font-medium">{formatDate(selectedTicket.resolved_at)}</span></div>}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-sm font-medium text-stone-700 mb-2">Description</h4>
                  <div className="bg-stone-50 rounded-xl p-4">
                    <p className="text-stone-600 whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>
                </div>

                {/* Rating for resolved tickets */}
                {['resolved', 'closed'].includes(selectedTicket.status) && !selectedTicket.satisfaction_rating && !isAdmin && (
                  <div className="bg-amber-50 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-amber-800 mb-2">How was your experience?</h4>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <button key={rating} onClick={() => setRatingForm(rating)} className={`p-1.5 rounded transition-colors ${ratingForm >= rating ? 'text-amber-500' : 'text-stone-300 hover:text-amber-400'}`}>
                          <Star size={24} fill={ratingForm >= rating ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                      {ratingForm > 0 && <Button size="sm" onClick={handleRateTicket} className="ml-2 bg-amber-500 hover:bg-amber-600">Submit</Button>}
                    </div>
                  </div>
                )}

                {selectedTicket.satisfaction_rating && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-stone-500">Rating:</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <Star key={rating} size={16} className={rating <= selectedTicket.satisfaction_rating ? 'text-amber-500 fill-amber-500' : 'text-stone-300'} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments */}
                <div>
                  <h4 className="text-sm font-medium text-stone-700 mb-3 flex items-center gap-2">
                    <MessageSquare size={16} />Comments ({comments.length})
                  </h4>

                  {comments.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {comments.map(comment => (
                        <div key={comment.id} className={`rounded-xl p-4 ${comment.is_internal ? 'bg-amber-50 border border-amber-200' : 'bg-stone-50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#2D4F38] flex items-center justify-center text-white text-xs font-medium">{comment.author_name?.charAt(0) || 'U'}</div>
                              <span className="font-medium text-sm text-stone-900">{comment.author_name}</span>
                              {comment.is_internal && <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded">Internal</span>}
                            </div>
                            <span className="text-xs text-stone-500">{formatRelativeTime(comment.created_at)}</span>
                          </div>
                          <p className="text-sm text-stone-600">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {!['closed'].includes(selectedTicket.status) && (
                    <form onSubmit={handleAddComment} className="space-y-3">
                      <div className="relative">
                        <Textarea value={commentForm.content} onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })} placeholder="Add a comment..." rows={3} />
                        {isAdmin && cannedResponses.length > 0 && (
                          <div className="absolute bottom-2 right-2">
                            <Button type="button" variant="ghost" size="sm" onClick={() => setShowCannedPicker(!showCannedPicker)} className="text-stone-400 hover:text-stone-600">
                              <Sparkles size={16} />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Canned response picker */}
                      {showCannedPicker && (
                        <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 max-h-48 overflow-y-auto">
                          <p className="text-xs font-medium text-stone-500 mb-2">Quick Responses</p>
                          <div className="space-y-1">
                            {cannedResponses.map(response => (
                              <button key={response.id} type="button" onClick={() => insertCannedResponse(response)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white text-sm text-stone-700 transition-colors">
                                <span className="font-medium">{response.name}</span>
                                {response.shortcut && <span className="ml-2 text-xs text-stone-400">{response.shortcut}</span>}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        {isAdmin && (
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={commentForm.is_internal} onChange={(e) => setCommentForm({ ...commentForm, is_internal: e.target.checked })} className="rounded border-stone-300 text-[#2D4F38]" />
                            <span className="text-stone-600">Internal note</span>
                          </label>
                        )}
                        <Button type="submit" size="sm" className="bg-[#2D4F38] hover:bg-[#1F3A29] ml-auto">
                          <Send size={14} className="mr-1" />Send
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

      {/* Settings Dialog (Admin) */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket Settings</DialogTitle>
          </DialogHeader>

          <Tabs value={settingsTab} onValueChange={setSettingsTab} className="mt-4">
            <TabsList>
              <TabsTrigger value="templates" className="flex items-center gap-2"><FileText size={16} />Templates</TabsTrigger>
              <TabsTrigger value="rules" className="flex items-center gap-2"><GitBranch size={16} />Auto-Assignment</TabsTrigger>
              <TabsTrigger value="canned" className="flex items-center gap-2"><MessageCircle size={16} />Canned Responses</TabsTrigger>
            </TabsList>

            {/* Templates Tab */}
            <TabsContent value="templates" className="mt-4 space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-stone-600">Pre-defined templates for common ticket types</p>
                <div className="flex gap-2">
                  {templates.length === 0 && <Button variant="outline" size="sm" onClick={handleSeedTemplates}><Sparkles size={14} className="mr-1" />Add Defaults</Button>}
                  <Button size="sm" onClick={() => { resetTemplateForm(); setTemplateDialogOpen(true); }}><Plus size={14} className="mr-1" />New Template</Button>
                </div>
              </div>
              
              {templates.length === 0 ? (
                <div className="text-center py-8 bg-stone-50 rounded-xl">
                  <FileText className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                  <p className="text-stone-500">No templates yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map(template => (
                    <div key={template.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                      <div>
                        <p className="font-medium text-stone-900">{template.name}</p>
                        <p className="text-sm text-stone-500">{template.description || template.subject_template}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditTemplate(template)}><Edit2 size={14} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template.id)}><Trash2 size={14} className="text-rose-500" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Auto-Assignment Rules Tab */}
            <TabsContent value="rules" className="mt-4 space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-stone-600">Auto-assign tickets based on category</p>
                <Button size="sm" onClick={() => { resetRuleForm(); setRuleDialogOpen(true); }}><Plus size={14} className="mr-1" />New Rule</Button>
              </div>
              
              {assignmentRules.length === 0 ? (
                <div className="text-center py-8 bg-stone-50 rounded-xl">
                  <GitBranch className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                  <p className="text-stone-500">No assignment rules yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {assignmentRules.map(rule => (
                    <div key={rule.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                      <div>
                        <p className="font-medium text-stone-900">{rule.name}</p>
                        <p className="text-sm text-stone-500">
                          {CATEGORY_CONFIG[rule.category]?.label} → {rule.assignee_name}
                          {rule.priority_filter && ` (${PRIORITY_CONFIG[rule.priority_filter]?.label} only)`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditRule(rule)}><Edit2 size={14} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteRule(rule.id)}><Trash2 size={14} className="text-rose-500" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Canned Responses Tab */}
            <TabsContent value="canned" className="mt-4 space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-stone-600">Quick responses for common solutions</p>
                <div className="flex gap-2">
                  {cannedResponses.length === 0 && <Button variant="outline" size="sm" onClick={handleSeedCanned}><Sparkles size={14} className="mr-1" />Add Defaults</Button>}
                  <Button size="sm" onClick={() => { resetCannedForm(); setCannedDialogOpen(true); }}><Plus size={14} className="mr-1" />New Response</Button>
                </div>
              </div>
              
              {cannedResponses.length === 0 ? (
                <div className="text-center py-8 bg-stone-50 rounded-xl">
                  <MessageCircle className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                  <p className="text-stone-500">No canned responses yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cannedResponses.map(response => (
                    <div key={response.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-stone-900">{response.name}</p>
                          {response.shortcut && <span className="text-xs bg-stone-200 px-2 py-0.5 rounded">{response.shortcut}</span>}
                        </div>
                        <p className="text-sm text-stone-500 truncate">{response.content.substring(0, 80)}...</p>
                      </div>
                      <div className="flex gap-1 ml-4">
                        <Button variant="ghost" size="sm" onClick={() => openEditCanned(response)}><Edit2 size={14} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCanned(response.id)}><Trash2 size={14} className="text-rose-500" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Template Form Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'New Template'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveTemplate} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Name *</label>
              <Input value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
              <Input value={templateForm.description} onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Subject Template *</label>
              <Input value={templateForm.subject_template} onChange={(e) => setTemplateForm({ ...templateForm, subject_template: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Body Template *</label>
              <Textarea value={templateForm.body_template} onChange={(e) => setTemplateForm({ ...templateForm, body_template: e.target.value })} rows={4} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
                <Select value={templateForm.category} onValueChange={(v) => setTemplateForm({ ...templateForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(CATEGORY_CONFIG).map(([value, config]) => (<SelectItem key={value} value={value}>{config.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Priority</label>
                <Select value={templateForm.priority} onValueChange={(v) => setTemplateForm({ ...templateForm, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(PRIORITY_CONFIG).map(([value, config]) => (<SelectItem key={value} value={value}>{config.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#2D4F38] hover:bg-[#1F3A29]">{editingTemplate ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assignment Rule Form Dialog */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Rule' : 'New Assignment Rule'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveRule} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Rule Name *</label>
              <Input value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} placeholder="e.g., IT Support Assignment" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Category *</label>
              <Select value={ruleForm.category} onValueChange={(v) => setRuleForm({ ...ruleForm, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(CATEGORY_CONFIG).map(([value, config]) => (<SelectItem key={value} value={value}>{config.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Assign To *</label>
              <Select value={ruleForm.assignee_id} onValueChange={(v) => setRuleForm({ ...ruleForm, assignee_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{employees.map(emp => (<SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Priority Filter (Optional)</label>
              <Select value={ruleForm.priority_filter} onValueChange={(v) => setRuleForm({ ...ruleForm, priority_filter: v })}>
                <SelectTrigger><SelectValue placeholder="All priorities" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priorities</SelectItem>
                  {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (<SelectItem key={value} value={value}>{config.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setRuleDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#2D4F38] hover:bg-[#1F3A29]">{editingRule ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Canned Response Form Dialog */}
      <Dialog open={cannedDialogOpen} onOpenChange={setCannedDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCanned ? 'Edit Canned Response' : 'New Canned Response'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCanned} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Name *</label>
              <Input value={cannedForm.name} onChange={(e) => setCannedForm({ ...cannedForm, name: e.target.value })} placeholder="e.g., Password Reset Complete" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Shortcut (Optional)</label>
              <Input value={cannedForm.shortcut} onChange={(e) => setCannedForm({ ...cannedForm, shortcut: e.target.value })} placeholder="e.g., /password" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Content *</label>
              <Textarea value={cannedForm.content} onChange={(e) => setCannedForm({ ...cannedForm, content: e.target.value })} rows={6} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Category (Optional)</label>
              <Select value={cannedForm.category || 'none'} onValueChange={(v) => setCannedForm({ ...cannedForm, category: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All Categories</SelectItem>
                  {Object.entries(CATEGORY_CONFIG).map(([value, config]) => (<SelectItem key={value} value={value}>{config.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setCannedDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#2D4F38] hover:bg-[#1F3A29]">{editingCanned ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tickets;
