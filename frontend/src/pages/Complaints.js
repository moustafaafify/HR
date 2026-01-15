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
import { Checkbox } from '../components/ui/checkbox';
import { 
  AlertOctagon,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Send,
  Check,
  Clock,
  Users,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  MessageSquare,
  FileText,
  Shield,
  UserX,
  Scale,
  Gavel,
  Building2,
  ChevronRight,
  History,
  User,
  Lock,
  Unlock
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-700' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', color: 'bg-amber-100 text-amber-700' },
  critical: { label: 'Critical', color: 'bg-rose-100 text-rose-700' },
};

const STATUS_CONFIG = {
  submitted: { label: 'Submitted', color: 'bg-slate-100 text-slate-700', icon: FileText },
  under_review: { label: 'Under Review', color: 'bg-blue-100 text-blue-700', icon: Eye },
  investigating: { label: 'Investigating', color: 'bg-amber-100 text-amber-700', icon: Search },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-700', icon: Check },
  dismissed: { label: 'Dismissed', color: 'bg-rose-100 text-rose-700', icon: XCircle },
};

const CATEGORY_ICONS = {
  harassment: UserX,
  discrimination: Scale,
  safety: Shield,
  policy_violation: Gavel,
  workplace_conduct: Users,
  compensation: FileText,
  management: Building2,
  general: AlertOctagon,
};

const RESOLUTION_TYPES = [
  { value: 'resolved_in_favor', label: 'Resolved in Favor' },
  { value: 'partially_resolved', label: 'Partially Resolved' },
  { value: 'not_substantiated', label: 'Not Substantiated' },
  { value: 'dismissed', label: 'Dismissed' },
];

const Complaints = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState(null);
  
  // Data
  const [complaints, setComplaints] = useState([]);
  const [myComplaints, setMyComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [admins, setAdmins] = useState([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Dialogs
  const [complaintDialogOpen, setComplaintDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  
  // Selected items
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintComments, setComplaintComments] = useState([]);
  const [complaintHistory, setComplaintHistory] = useState([]);
  
  // Forms
  const [complaintForm, setComplaintForm] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    anonymous: false,
  });
  
  const [commentForm, setCommentForm] = useState({
    content: '',
    is_internal: false,
  });
  
  const [resolveForm, setResolveForm] = useState({
    resolution: '',
    resolution_type: 'resolved_in_favor',
    notes: '',
  });
  
  const [assigneeId, setAssigneeId] = useState('');

  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  // Fetch functions
  const fetchStats = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await axios.get(`${API}/complaints/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [isAdmin]);

  const fetchComplaints = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/complaints`);
      setComplaints(response.data);
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
    }
  }, []);

  const fetchMyComplaints = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/complaints/my`);
      setMyComplaints(response.data);
    } catch (error) {
      console.error('Failed to fetch my complaints:', error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/complaints/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  const fetchAdmins = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await axios.get(`${API}/users`);
      const adminUsers = response.data.filter(u => 
        u.role === 'super_admin' || u.role === 'corp_admin'
      );
      setAdmins(adminUsers);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    }
  }, [isAdmin]);

  const fetchComplaintDetails = useCallback(async (complaintId) => {
    try {
      const [commentsRes, historyRes] = await Promise.all([
        axios.get(`${API}/complaints/${complaintId}/comments`),
        axios.get(`${API}/complaints/${complaintId}/history`)
      ]);
      setComplaintComments(commentsRes.data);
      setComplaintHistory(historyRes.data);
    } catch (error) {
      console.error('Failed to fetch complaint details:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchComplaints(),
        fetchMyComplaints(),
        fetchCategories(),
        fetchAdmins(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchComplaints, fetchMyComplaints, fetchCategories, fetchAdmins]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter complaints
  const filteredComplaints = (isAdmin ? complaints : myComplaints).filter(complaint => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = complaint.title?.toLowerCase().includes(query);
      const refMatch = complaint.reference_number?.toLowerCase().includes(query);
      const descMatch = complaint.description?.toLowerCase().includes(query);
      if (!titleMatch && !refMatch && !descMatch) return false;
    }
    if (statusFilter !== 'all' && complaint.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && complaint.category !== categoryFilter) return false;
    if (priorityFilter !== 'all' && complaint.priority !== priorityFilter) return false;
    return true;
  });

  // Handlers
  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/complaints`, complaintForm);
      toast.success('Complaint submitted successfully');
      fetchComplaints();
      fetchMyComplaints();
      fetchStats();
      setComplaintDialogOpen(false);
      resetComplaintForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit complaint');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!selectedComplaint || !commentForm.content.trim()) return;
    try {
      await axios.post(`${API}/complaints/${selectedComplaint.id}/comments`, commentForm);
      toast.success('Comment added');
      fetchComplaintDetails(selectedComplaint.id);
      setCommentForm({ content: '', is_internal: false });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add comment');
    }
  };

  const handleAssign = async () => {
    if (!selectedComplaint || !assigneeId) return;
    try {
      await axios.post(`${API}/complaints/${selectedComplaint.id}/assign`, {
        assigned_to_id: assigneeId
      });
      toast.success('Complaint assigned');
      fetchComplaints();
      fetchStats();
      setAssignDialogOpen(false);
      setAssigneeId('');
      
      // Refresh selected complaint
      const updated = await axios.get(`${API}/complaints/${selectedComplaint.id}`);
      setSelectedComplaint(updated.data);
      fetchComplaintDetails(selectedComplaint.id);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to assign complaint');
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    try {
      await axios.post(`${API}/complaints/${selectedComplaint.id}/resolve`, resolveForm);
      toast.success('Complaint resolved');
      fetchComplaints();
      fetchMyComplaints();
      fetchStats();
      setResolveDialogOpen(false);
      setResolveForm({ resolution: '', resolution_type: 'resolved_in_favor', notes: '' });
      
      // Refresh selected complaint
      const updated = await axios.get(`${API}/complaints/${selectedComplaint.id}`);
      setSelectedComplaint(updated.data);
      fetchComplaintDetails(selectedComplaint.id);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to resolve complaint');
    }
  };

  const handleUpdateStatus = async (complaintId, newStatus, notes = '') => {
    try {
      await axios.put(`${API}/complaints/${complaintId}`, {
        status: newStatus,
        status_notes: notes
      });
      toast.success('Status updated');
      fetchComplaints();
      fetchStats();
      
      if (selectedComplaint?.id === complaintId) {
        const updated = await axios.get(`${API}/complaints/${complaintId}`);
        setSelectedComplaint(updated.data);
        fetchComplaintDetails(complaintId);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update status');
    }
  };

  const handleDeleteComplaint = async (complaintId) => {
    if (!window.confirm('Are you sure you want to delete this complaint? This cannot be undone.')) return;
    try {
      await axios.delete(`${API}/complaints/${complaintId}`);
      toast.success('Complaint deleted');
      fetchComplaints();
      fetchStats();
      if (selectedComplaint?.id === complaintId) {
        setViewDialogOpen(false);
        setSelectedComplaint(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete complaint');
    }
  };

  const openViewDialog = async (complaint) => {
    setSelectedComplaint(complaint);
    await fetchComplaintDetails(complaint.id);
    setViewDialogOpen(true);
  };

  // Reset forms
  const resetComplaintForm = () => {
    setComplaintForm({
      title: '',
      description: '',
      category: 'general',
      priority: 'medium',
      anonymous: false,
    });
  };

  const getCategoryIcon = (category) => {
    const Icon = CATEGORY_ICONS[category] || AlertOctagon;
    return Icon;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Employee View
  if (!isAdmin) {
    return (
      <div className="p-4 lg:p-6 space-y-6" data-testid="employee-complaints-view">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Complaints</h1>
            <p className="text-slate-500 mt-1">Submit and track workplace complaints</p>
          </div>
          <Button onClick={() => setComplaintDialogOpen(true)} data-testid="submit-complaint-btn">
            <Plus size={18} className="mr-2" />
            Submit Complaint
          </Button>
        </div>

        {/* My Complaints */}
        {myComplaints.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <AlertOctagon className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">No complaints submitted</p>
            <p className="text-sm text-slate-400 mt-1">You can submit anonymous complaints too</p>
            <Button className="mt-4" onClick={() => setComplaintDialogOpen(true)}>
              <Plus size={16} className="mr-2" />
              Submit a Complaint
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {myComplaints.map(complaint => {
              const StatusIcon = STATUS_CONFIG[complaint.status]?.icon || FileText;
              const CategoryIcon = getCategoryIcon(complaint.category);
              return (
                <div 
                  key={complaint.id} 
                  className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => openViewDialog(complaint)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                        <CategoryIcon className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{complaint.title}</h3>
                        <p className="text-sm text-slate-500">{complaint.reference_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_CONFIG[complaint.priority]?.color}`}>
                        {PRIORITY_CONFIG[complaint.priority]?.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[complaint.status]?.color}`}>
                        <StatusIcon size={12} />
                        {STATUS_CONFIG[complaint.status]?.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-600 line-clamp-2 mb-3">{complaint.description}</p>
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span className="capitalize">{complaint.category.replace('_', ' ')}</span>
                    <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                  </div>
                  {complaint.resolution && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-sm text-emerald-600 font-medium">Resolution:</p>
                      <p className="text-sm text-slate-600">{complaint.resolution}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Submit Complaint Dialog */}
        <Dialog open={complaintDialogOpen} onOpenChange={setComplaintDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit a Complaint</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                  <strong>Confidential:</strong> Your complaint will be handled with strict confidentiality. 
                  You can choose to submit anonymously if you prefer.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject *</label>
                <Input
                  value={complaintForm.title}
                  onChange={(e) => setComplaintForm({...complaintForm, title: e.target.value})}
                  placeholder="Brief description of the complaint"
                  required
                  data-testid="complaint-title-input"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <Select value={complaintForm.category} onValueChange={(v) => setComplaintForm({...complaintForm, category: v})}>
                    <SelectTrigger data-testid="complaint-category-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <Select value={complaintForm.priority} onValueChange={(v) => setComplaintForm({...complaintForm, priority: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                <Textarea
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm({...complaintForm, description: e.target.value})}
                  placeholder="Provide detailed information about the complaint, including dates, people involved, and any evidence..."
                  rows={6}
                  required
                />
              </div>
              
              <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-xl">
                <Checkbox
                  id="anonymous"
                  checked={complaintForm.anonymous}
                  onCheckedChange={(checked) => setComplaintForm({...complaintForm, anonymous: checked})}
                  data-testid="anonymous-checkbox"
                />
                <label htmlFor="anonymous" className="text-sm font-medium text-slate-700 cursor-pointer flex items-center gap-2">
                  {complaintForm.anonymous ? <Lock size={16} /> : <Unlock size={16} />}
                  Submit anonymously
                </label>
              </div>
              {complaintForm.anonymous && (
                <p className="text-sm text-slate-500">
                  Your identity will not be disclosed. However, you won't be able to track this complaint.
                </p>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setComplaintDialogOpen(false); resetComplaintForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="submit-complaint-form-btn">
                  <Send size={16} className="mr-2" />
                  Submit Complaint
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Complaint Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>{selectedComplaint?.title}</span>
                <span className="text-sm font-normal text-slate-500">({selectedComplaint?.reference_number})</span>
              </DialogTitle>
            </DialogHeader>
            
            {selectedComplaint && (
              <div className="space-y-6">
                {/* Status and Priority */}
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_CONFIG[selectedComplaint.status]?.color}`}>
                    {React.createElement(STATUS_CONFIG[selectedComplaint.status]?.icon || FileText, { size: 14 })}
                    {STATUS_CONFIG[selectedComplaint.status]?.label}
                  </span>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${PRIORITY_CONFIG[selectedComplaint.priority]?.color}`}>
                    {PRIORITY_CONFIG[selectedComplaint.priority]?.label} Priority
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-700 capitalize">
                    {selectedComplaint.category.replace('_', ' ')}
                  </span>
                </div>
                
                {/* Description */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-medium text-slate-900 mb-2">Description</h4>
                  <p className="text-slate-600 whitespace-pre-wrap">{selectedComplaint.description}</p>
                </div>
                
                {/* Resolution */}
                {selectedComplaint.resolution && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <h4 className="font-medium text-emerald-900 mb-2">Resolution</h4>
                    <p className="text-emerald-700">{selectedComplaint.resolution}</p>
                    {selectedComplaint.resolution_date && (
                      <p className="text-sm text-emerald-600 mt-2">
                        Resolved on: {new Date(selectedComplaint.resolution_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Comments */}
                <div>
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <MessageSquare size={18} />
                    Comments ({complaintComments.length})
                  </h4>
                  
                  {complaintComments.length === 0 ? (
                    <p className="text-slate-500 text-sm">No comments yet</p>
                  ) : (
                    <div className="space-y-3">
                      {complaintComments.map(comment => (
                        <div key={comment.id} className="bg-white border border-slate-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-slate-900">{comment.author_name}</span>
                            <span className="text-sm text-slate-500">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-600">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add Comment Form */}
                  {selectedComplaint.status !== 'closed' && selectedComplaint.status !== 'dismissed' && (
                    <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
                      <Input
                        value={commentForm.content}
                        onChange={(e) => setCommentForm({...commentForm, content: e.target.value})}
                        placeholder="Add a comment..."
                        className="flex-1"
                      />
                      <Button type="submit" disabled={!commentForm.content.trim()}>
                        <Send size={16} />
                      </Button>
                    </form>
                  )}
                </div>
                
                {/* History */}
                <div>
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <History size={18} />
                    Status History
                  </h4>
                  <div className="space-y-2">
                    {complaintHistory.map((entry, idx) => (
                      <div key={entry.id} className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="text-slate-600">
                          {entry.from_status ? (
                            <>Changed from <strong>{entry.from_status}</strong> to <strong>{entry.to_status}</strong></>
                          ) : (
                            <>Complaint <strong>{entry.to_status}</strong></>
                          )}
                        </span>
                        <span className="text-slate-400">by {entry.changed_by_name}</span>
                        <span className="text-slate-400">{new Date(entry.created_at).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Admin View
  return (
    <div className="p-4 lg:p-6 space-y-6" data-testid="admin-complaints-view">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Complaints Management</h1>
          <p className="text-slate-500 mt-1">Handle and resolve workplace complaints</p>
        </div>
        <Button variant="outline" onClick={() => fetchData()}>
          <RefreshCw size={18} className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-gradient-to-br from-slate-500 to-slate-600 rounded-2xl p-4 text-white">
          <AlertOctagon className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-slate-200 text-sm">Total</p>
          <p className="text-2xl font-bold">{stats?.total || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
          <FileText className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-blue-100 text-sm">Submitted</p>
          <p className="text-2xl font-bold">{stats?.submitted || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white">
          <Search className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-amber-100 text-sm">Investigating</p>
          <p className="text-2xl font-bold">{stats?.investigating || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white">
          <CheckCircle2 className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-emerald-100 text-sm">Resolved</p>
          <p className="text-2xl font-bold">{stats?.resolved || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-4 text-white">
          <AlertTriangle className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-rose-100 text-sm">Critical</p>
          <p className="text-2xl font-bold">{stats?.critical_priority || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
          <Clock className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-orange-100 text-sm">High Priority</p>
          <p className="text-2xl font-bold">{stats?.high_priority || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 text-white">
          <User className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-indigo-100 text-sm">Anonymous</p>
          <p className="text-2xl font-bold">{stats?.anonymous || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by title, reference, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="search-complaints-input"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([value, config]) => (
              <SelectItem key={value} value={value}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
              <SelectItem key={value} value={value}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Complaints List */}
      {filteredComplaints.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <AlertOctagon className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">No complaints found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Reference</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Subject</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">From</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Priority</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Assigned To</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredComplaints.map(complaint => {
                  const StatusIcon = STATUS_CONFIG[complaint.status]?.icon || FileText;
                  return (
                    <tr key={complaint.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <code className="bg-slate-100 px-2 py-1 rounded text-sm">{complaint.reference_number}</code>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900 truncate max-w-xs">{complaint.title}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600 capitalize">{complaint.category.replace('_', ' ')}</td>
                      <td className="py-3 px-4">
                        {complaint.anonymous ? (
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <Lock size={14} />
                            Anonymous
                          </span>
                        ) : (
                          <span className="text-slate-600">{complaint.employee_name || 'Unknown'}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_CONFIG[complaint.priority]?.color}`}>
                          {PRIORITY_CONFIG[complaint.priority]?.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[complaint.status]?.color}`}>
                          <StatusIcon size={12} />
                          {STATUS_CONFIG[complaint.status]?.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {complaint.assigned_to_name || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openViewDialog(complaint)} title="View">
                            <Eye size={16} />
                          </Button>
                          {complaint.status === 'submitted' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { setSelectedComplaint(complaint); setAssignDialogOpen(true); }}
                              title="Assign"
                            >
                              <Users size={16} />
                            </Button>
                          )}
                          {['under_review', 'investigating'].includes(complaint.status) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { setSelectedComplaint(complaint); setResolveDialogOpen(true); }}
                              title="Resolve"
                              className="text-emerald-600"
                            >
                              <CheckCircle2 size={16} />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteComplaint(complaint.id)}
                            title="Delete"
                            className="text-rose-600"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Complaint Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{selectedComplaint?.title}</span>
              <span className="text-sm font-normal text-slate-500">({selectedComplaint?.reference_number})</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedComplaint && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                {selectedComplaint.status === 'submitted' && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setAssignDialogOpen(true)}>
                      <Users size={14} className="mr-1" />
                      Assign
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(selectedComplaint.id, 'under_review')}>
                      Start Review
                    </Button>
                  </>
                )}
                {selectedComplaint.status === 'under_review' && (
                  <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(selectedComplaint.id, 'investigating')}>
                    <Search size={14} className="mr-1" />
                    Start Investigation
                  </Button>
                )}
                {['under_review', 'investigating'].includes(selectedComplaint.status) && (
                  <Button size="sm" onClick={() => setResolveDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle2 size={14} className="mr-1" />
                    Resolve
                  </Button>
                )}
                {selectedComplaint.status === 'resolved' && (
                  <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(selectedComplaint.id, 'closed')}>
                    <Check size={14} className="mr-1" />
                    Close
                  </Button>
                )}
              </div>
              
              {/* Status and Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_CONFIG[selectedComplaint.status]?.color}`}>
                      {React.createElement(STATUS_CONFIG[selectedComplaint.status]?.icon || FileText, { size: 14 })}
                      {STATUS_CONFIG[selectedComplaint.status]?.label}
                    </span>
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${PRIORITY_CONFIG[selectedComplaint.priority]?.color}`}>
                      {PRIORITY_CONFIG[selectedComplaint.priority]?.label}
                    </span>
                  </div>
                  
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Category:</span>
                      <span className="font-medium capitalize">{selectedComplaint.category.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Submitted by:</span>
                      <span className="font-medium">
                        {selectedComplaint.anonymous ? (
                          <span className="inline-flex items-center gap-1">
                            <Lock size={14} />
                            Anonymous
                          </span>
                        ) : selectedComplaint.employee_name}
                      </span>
                    </div>
                    {selectedComplaint.employee_department && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Department:</span>
                        <span className="font-medium">{selectedComplaint.employee_department}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Assigned to:</span>
                      <span className="font-medium">{selectedComplaint.assigned_to_name || 'Unassigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date:</span>
                      <span className="font-medium">{new Date(selectedComplaint.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-medium text-slate-900 mb-2">Description</h4>
                  <p className="text-slate-600 whitespace-pre-wrap text-sm">{selectedComplaint.description}</p>
                </div>
              </div>
              
              {/* Resolution */}
              {selectedComplaint.resolution && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <h4 className="font-medium text-emerald-900 mb-2">Resolution</h4>
                  <p className="text-emerald-700">{selectedComplaint.resolution}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-emerald-600">
                    <span>Type: {selectedComplaint.resolution_type?.replace('_', ' ')}</span>
                    {selectedComplaint.resolution_date && (
                      <span>Date: {new Date(selectedComplaint.resolution_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Comments */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                  <MessageSquare size={18} />
                  Comments ({complaintComments.length})
                </h4>
                
                {complaintComments.length === 0 ? (
                  <p className="text-slate-500 text-sm">No comments yet</p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {complaintComments.map(comment => (
                      <div 
                        key={comment.id} 
                        className={`border rounded-xl p-4 ${comment.is_internal ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-slate-900 flex items-center gap-2">
                            {comment.author_name}
                            {comment.is_internal && (
                              <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded">Internal Note</span>
                            )}
                          </span>
                          <span className="text-sm text-slate-500">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-600">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add Comment Form */}
                {selectedComplaint.status !== 'closed' && selectedComplaint.status !== 'dismissed' && (
                  <form onSubmit={handleAddComment} className="mt-4 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={commentForm.content}
                        onChange={(e) => setCommentForm({...commentForm, content: e.target.value})}
                        placeholder="Add a comment..."
                        className="flex-1"
                      />
                      <Button type="submit" disabled={!commentForm.content.trim()}>
                        <Send size={16} />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="internal"
                        checked={commentForm.is_internal}
                        onCheckedChange={(checked) => setCommentForm({...commentForm, is_internal: checked})}
                      />
                      <label htmlFor="internal" className="text-sm text-slate-600 cursor-pointer">
                        Internal note (only visible to admins)
                      </label>
                    </div>
                  </form>
                )}
              </div>
              
              {/* History */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                  <History size={18} />
                  Status History
                </h4>
                <div className="space-y-2">
                  {complaintHistory.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />
                      <div>
                        <span className="text-slate-600">
                          {entry.from_status ? (
                            <>Changed from <strong>{entry.from_status}</strong> to <strong>{entry.to_status}</strong></>
                          ) : (
                            <>Complaint <strong>{entry.to_status}</strong></>
                          )}
                        </span>
                        <span className="text-slate-400 ml-2">by {entry.changed_by_name}</span>
                        <p className="text-slate-400">{new Date(entry.created_at).toLocaleString()}</p>
                        {entry.notes && <p className="text-slate-500 mt-1">{entry.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Complaint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="font-medium">{selectedComplaint?.title}</p>
              <p className="text-sm text-slate-500">{selectedComplaint?.reference_number}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assign to</label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger data-testid="assign-to-select">
                  <SelectValue placeholder="Select an admin" />
                </SelectTrigger>
                <SelectContent>
                  {admins.map(admin => (
                    <SelectItem key={admin.id} value={admin.id}>{admin.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => { setAssignDialogOpen(false); setAssigneeId(''); }}>
                Cancel
              </Button>
              <Button onClick={handleAssign} disabled={!assigneeId}>
                <Users size={16} className="mr-2" />
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Resolve Complaint</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResolve} className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="font-medium">{selectedComplaint?.title}</p>
              <p className="text-sm text-slate-500">{selectedComplaint?.reference_number}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Resolution Type</label>
              <Select value={resolveForm.resolution_type} onValueChange={(v) => setResolveForm({...resolveForm, resolution_type: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOLUTION_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Resolution Details *</label>
              <Textarea
                value={resolveForm.resolution}
                onChange={(e) => setResolveForm({...resolveForm, resolution: e.target.value})}
                placeholder="Describe how the complaint was resolved..."
                rows={4}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Internal Notes</label>
              <Textarea
                value={resolveForm.notes}
                onChange={(e) => setResolveForm({...resolveForm, notes: e.target.value})}
                placeholder="Optional internal notes..."
                rows={2}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setResolveDialogOpen(false); setResolveForm({ resolution: '', resolution_type: 'resolved_in_favor', notes: '' }); }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 size={16} className="mr-2" />
                Resolve Complaint
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Complaints;
