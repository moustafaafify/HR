import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  GraduationCap, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2,
  Calendar,
  Building2,
  User,
  AlertCircle,
  Check,
  X,
  Download,
  Globe,
  Award,
  Users,
  Video,
  Presentation,
  Target,
  TrendingUp,
  DollarSign,
  Star,
  Play,
  Ban,
  ExternalLink
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TRAINING_TYPES = [
  { value: 'course', label: 'Course', icon: BookOpen, color: 'bg-blue-100 text-blue-700' },
  { value: 'certification', label: 'Certification', icon: Award, color: 'bg-emerald-100 text-emerald-700' },
  { value: 'workshop', label: 'Workshop', icon: Users, color: 'bg-purple-100 text-purple-700' },
  { value: 'conference', label: 'Conference', icon: Presentation, color: 'bg-amber-100 text-amber-700' },
  { value: 'online', label: 'Online Course', icon: Video, color: 'bg-cyan-100 text-cyan-700' },
  { value: 'seminar', label: 'Seminar', icon: GraduationCap, color: 'bg-indigo-100 text-indigo-700' },
  { value: 'bootcamp', label: 'Bootcamp', icon: Target, color: 'bg-rose-100 text-rose-700' }
];

const TRAINING_CATEGORIES = [
  { value: 'professional', label: 'Professional Development' },
  { value: 'technical', label: 'Technical Skills' },
  { value: 'leadership', label: 'Leadership & Management' },
  { value: 'compliance', label: 'Compliance & Regulatory' },
  { value: 'soft_skills', label: 'Soft Skills' },
  { value: 'other', label: 'Other' }
];

const TRAINING_STATUS = [
  { value: 'pending', label: 'Pending', color: 'bg-slate-100 text-slate-700' },
  { value: 'submitted', label: 'Submitted', color: 'bg-blue-100 text-blue-700' },
  { value: 'under_review', label: 'Under Review', color: 'bg-amber-100 text-amber-700' },
  { value: 'approved', label: 'Approved', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'rejected', label: 'Rejected', color: 'bg-rose-100 text-rose-700' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' }
];

const LOCATION_TYPES = [
  { value: 'online', label: 'Online' },
  { value: 'onsite', label: 'On-site' },
  { value: 'offsite', label: 'Off-site' },
  { value: 'hybrid', label: 'Hybrid' }
];

const Training = () => {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState('all');
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Dialogs
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  
  // Selected items
  const [editingRequest, setEditingRequest] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Filters
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  
  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';
  
  const [requestForm, setRequestForm] = useState({
    title: '',
    description: '',
    training_type: 'course',
    category: 'professional',
    provider: '',
    provider_url: '',
    cost: '',
    currency: 'USD',
    start_date: '',
    end_date: '',
    duration_hours: '',
    location: 'online',
    objectives: '',
    expected_outcomes: ''
  });

  const [rejectReason, setRejectReason] = useState('');
  const [completeForm, setCompleteForm] = useState({
    certificate_url: '',
    feedback: '',
    rating: 0
  });

  useEffect(() => {
    fetchRequests();
    fetchMyRequests();
    fetchEmployees();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${API}/training-requests`);
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch training requests:', error);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const response = await axios.get(`${API}/training-requests/my`);
      setMyRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch my training requests:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/training-requests/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API}/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        ...requestForm,
        cost: parseFloat(requestForm.cost) || 0,
        duration_hours: parseInt(requestForm.duration_hours) || null,
        status: 'submitted'
      };
      
      if (editingRequest) {
        await axios.put(`${API}/training-requests/${editingRequest.id}`, formData);
        toast.success('Training request updated');
      } else {
        await axios.post(`${API}/training-requests`, formData);
        toast.success('Training request submitted');
      }
      fetchRequests();
      fetchMyRequests();
      fetchStats();
      resetRequestForm();
    } catch (error) {
      toast.error('Failed to save training request');
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await axios.put(`${API}/training-requests/${requestId}/approve`);
      toast.success('Training request approved');
      fetchRequests();
      fetchStats();
    } catch (error) {
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/training-requests/${selectedRequest.id}/reject`, { reason: rejectReason });
      toast.success('Training request rejected');
      setRejectDialogOpen(false);
      setRejectReason('');
      fetchRequests();
      fetchStats();
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const handleStartTraining = async (requestId) => {
    try {
      await axios.put(`${API}/training-requests/${requestId}/start`);
      toast.success('Training marked as in progress');
      fetchRequests();
      fetchMyRequests();
      fetchStats();
    } catch (error) {
      toast.error('Failed to start training');
    }
  };

  const handleCompleteTraining = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/training-requests/${selectedRequest.id}/complete`, completeForm);
      toast.success('Training completed!');
      setCompleteDialogOpen(false);
      setCompleteForm({ certificate_url: '', feedback: '', rating: 0 });
      fetchRequests();
      fetchMyRequests();
      fetchStats();
    } catch (error) {
      toast.error('Failed to complete training');
    }
  };

  const handleDelete = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this training request?')) return;
    try {
      await axios.delete(`${API}/training-requests/${requestId}`);
      toast.success('Training request deleted');
      fetchRequests();
      fetchMyRequests();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete request');
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${API}/training-requests/export`);
      const blob = new Blob([response.data.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `training_requests_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      toast.success(`Exported ${response.data.count} requests`);
    } catch (error) {
      toast.error('Failed to export');
    }
  };

  const resetRequestForm = () => {
    setRequestForm({
      title: '',
      description: '',
      training_type: 'course',
      category: 'professional',
      provider: '',
      provider_url: '',
      cost: '',
      currency: 'USD',
      start_date: '',
      end_date: '',
      duration_hours: '',
      location: 'online',
      objectives: '',
      expected_outcomes: ''
    });
    setEditingRequest(null);
    setRequestDialogOpen(false);
  };

  const openEditRequest = (request) => {
    setEditingRequest(request);
    setRequestForm({
      title: request.title || '',
      description: request.description || '',
      training_type: request.training_type || 'course',
      category: request.category || 'professional',
      provider: request.provider || '',
      provider_url: request.provider_url || '',
      cost: request.cost?.toString() || '',
      currency: request.currency || 'USD',
      start_date: request.start_date || '',
      end_date: request.end_date || '',
      duration_hours: request.duration_hours?.toString() || '',
      location: request.location || 'online',
      objectives: request.objectives || '',
      expected_outcomes: request.expected_outcomes || ''
    });
    setRequestDialogOpen(true);
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.full_name : '-';
  };

  const getTypeInfo = (type) => {
    return TRAINING_TYPES.find(t => t.value === type) || TRAINING_TYPES[0];
  };

  const getStatusInfo = (status) => {
    return TRAINING_STATUS.find(s => s.value === status) || TRAINING_STATUS[0];
  };

  const getCategoryLabel = (category) => {
    const cat = TRAINING_CATEGORIES.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const filteredRequests = requests.filter(req => {
    if (filterType !== 'all' && req.training_type !== filterType) return false;
    if (filterCategory !== 'all' && req.category !== filterCategory) return false;
    return true;
  });

  const pendingRequests = requests.filter(r => ['pending', 'submitted', 'under_review'].includes(r.status));

  // Employee View
  const EmployeeTrainingView = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-700">{myRequests.length}</p>
          <p className="text-xs text-slate-500">Total Requests</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">
            {myRequests.filter(r => ['pending', 'submitted', 'under_review'].includes(r.status)).length}
          </p>
          <p className="text-xs text-slate-500">Pending</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">
            {myRequests.filter(r => r.status === 'in_progress').length}
          </p>
          <p className="text-xs text-slate-500">In Progress</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {myRequests.filter(r => r.status === 'completed').length}
          </p>
          <p className="text-xs text-slate-500">Completed</p>
        </div>
      </div>

      {/* My Training Requests */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">My Training Requests</h3>
          <Button 
            onClick={() => { resetRequestForm(); setRequestDialogOpen(true); }}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            <Plus size={18} />
            Request Training
          </Button>
        </div>
        <div className="divide-y divide-slate-100">
          {myRequests.length === 0 ? (
            <div className="p-12 text-center">
              <GraduationCap size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No training requests yet</p>
              <Button 
                onClick={() => setRequestDialogOpen(true)}
                variant="outline" 
                className="mt-4 rounded-xl"
              >
                <Plus size={16} className="mr-2" />
                Request Your First Training
              </Button>
            </div>
          ) : (
            myRequests.map((request) => {
              const typeInfo = getTypeInfo(request.training_type);
              const statusInfo = getStatusInfo(request.status);
              const TypeIcon = typeInfo.icon;
              return (
                <div key={request.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${typeInfo.color} flex items-center justify-center`}>
                      <TypeIcon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 truncate">{request.title}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        {request.provider || 'No provider'} • {new Date(request.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {request.cost > 0 && (
                        <p className="font-bold text-slate-900">{formatCurrency(request.cost)}</p>
                      )}
                      <p className="text-xs text-slate-400">{typeInfo.label}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => { setSelectedRequest(request); setViewDialogOpen(true); }}
                        size="sm"
                        variant="ghost"
                        className="rounded-lg"
                      >
                        <Eye size={16} />
                      </Button>
                      {request.status === 'approved' && (
                        <Button
                          onClick={() => handleStartTraining(request.id)}
                          size="sm"
                          variant="ghost"
                          className="rounded-lg text-indigo-600"
                        >
                          <Play size={16} />
                        </Button>
                      )}
                      {request.status === 'in_progress' && (
                        <Button
                          onClick={() => { setSelectedRequest(request); setCompleteDialogOpen(true); }}
                          size="sm"
                          variant="ghost"
                          className="rounded-lg text-green-600"
                        >
                          <CheckCircle2 size={16} />
                        </Button>
                      )}
                      {request.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => openEditRequest(request)}
                            size="sm"
                            variant="ghost"
                            className="rounded-lg"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            onClick={() => handleDelete(request.id)}
                            size="sm"
                            variant="ghost"
                            className="rounded-lg text-rose-600"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {request.status === 'rejected' && request.rejection_reason && (
                    <div className="mt-2 p-2 bg-rose-50 rounded-lg text-sm text-rose-700 flex items-start gap-2">
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      <span>Rejected: {request.rejection_reason}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  // If not admin, show employee view
  if (!isAdmin) {
    return (
      <div data-testid="training-page" className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
              My Training
            </h1>
            <p className="text-slate-500 text-sm sm:text-base mt-1">Request and track your training programs</p>
          </div>
        </div>
        <EmployeeTrainingView />

        {/* Request Form Dialog */}
        <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
          <DialogContent className="rounded-2xl max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <GraduationCap className="text-indigo-600" size={24} />
                {editingRequest ? 'Edit Training Request' : 'Request Training'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRequestSubmit} className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Training Title *</label>
                <Input
                  value={requestForm.title}
                  onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                  className="rounded-xl"
                  placeholder="e.g. AWS Solutions Architect Certification"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Type *</label>
                  <Select value={requestForm.training_type} onValueChange={(v) => setRequestForm({ ...requestForm, training_type: v })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRAINING_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Category *</label>
                  <Select value={requestForm.category} onValueChange={(v) => setRequestForm({ ...requestForm, category: v })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRAINING_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Provider</label>
                  <Input
                    value={requestForm.provider}
                    onChange={(e) => setRequestForm({ ...requestForm, provider: e.target.value })}
                    className="rounded-xl"
                    placeholder="e.g. Coursera, Udemy"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Cost</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={requestForm.cost}
                    onChange={(e) => setRequestForm({ ...requestForm, cost: e.target.value })}
                    className="rounded-xl"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Start Date *</label>
                  <Input
                    type="date"
                    value={requestForm.start_date}
                    onChange={(e) => setRequestForm({ ...requestForm, start_date: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">End Date *</label>
                  <Input
                    type="date"
                    value={requestForm.end_date}
                    onChange={(e) => setRequestForm({ ...requestForm, end_date: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Location</label>
                  <Select value={requestForm.location} onValueChange={(v) => setRequestForm({ ...requestForm, location: v })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATION_TYPES.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Duration (hours)</label>
                  <Input
                    type="number"
                    value={requestForm.duration_hours}
                    onChange={(e) => setRequestForm({ ...requestForm, duration_hours: e.target.value })}
                    className="rounded-xl"
                    placeholder="e.g. 40"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
                <textarea
                  value={requestForm.description}
                  onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                  rows={2}
                  placeholder="Describe the training..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Learning Objectives</label>
                <textarea
                  value={requestForm.objectives}
                  onChange={(e) => setRequestForm({ ...requestForm, objectives: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                  rows={2}
                  placeholder="What will you learn?"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1">
                  {editingRequest ? 'Update Request' : 'Submit Request'}
                </Button>
                <Button type="button" onClick={resetRequestForm} variant="outline" className="rounded-xl">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Request Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="rounded-2xl max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <GraduationCap className="text-indigo-600" size={24} />
                Training Details
              </DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm text-slate-500">Cost</p>
                    <p className="text-2xl font-black text-slate-900">{formatCurrency(selectedRequest.cost || 0)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusInfo(selectedRequest.status).color}`}>
                    {getStatusInfo(selectedRequest.status).label}
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">Title</p>
                    <p className="font-medium text-slate-900">{selectedRequest.title}</p>
                  </div>
                  {selectedRequest.description && (
                    <div>
                      <p className="text-xs text-slate-500">Description</p>
                      <p className="text-slate-700">{selectedRequest.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Type</p>
                      <p className="font-medium text-slate-900">{getTypeInfo(selectedRequest.training_type).label}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Category</p>
                      <p className="font-medium text-slate-900">{getCategoryLabel(selectedRequest.category)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Start Date</p>
                      <p className="font-medium text-slate-900">{new Date(selectedRequest.start_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">End Date</p>
                      <p className="font-medium text-slate-900">{new Date(selectedRequest.end_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {selectedRequest.provider && (
                    <div>
                      <p className="text-xs text-slate-500">Provider</p>
                      <p className="font-medium text-slate-900">{selectedRequest.provider}</p>
                    </div>
                  )}
                  {selectedRequest.rejection_reason && (
                    <div className="p-3 bg-rose-50 rounded-xl">
                      <p className="text-xs text-rose-600 font-medium">Rejection Reason</p>
                      <p className="text-rose-700">{selectedRequest.rejection_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Complete Training Dialog */}
        <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
          <DialogContent className="rounded-2xl max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Award className="text-green-600" size={24} />
                Complete Training
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCompleteTraining} className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Certificate URL (optional)</label>
                <Input
                  value={completeForm.certificate_url}
                  onChange={(e) => setCompleteForm({ ...completeForm, certificate_url: e.target.value })}
                  className="rounded-xl"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">How was the training?</label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCompleteForm({ ...completeForm, rating: star })}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        size={32}
                        className={star <= completeForm.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Feedback</label>
                <textarea
                  value={completeForm.feedback}
                  onChange={(e) => setCompleteForm({ ...completeForm, feedback: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none resize-none"
                  rows={3}
                  placeholder="Share your experience..."
                />
              </div>
              <Button type="submit" className="w-full rounded-xl bg-green-600 hover:bg-green-700">
                Mark as Completed
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Admin View
  return (
    <div data-testid="training-page" className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Training Requests
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1">Manage employee training and development</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" className="rounded-xl gap-2">
            <Download size={18} />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button 
            onClick={() => { resetRequestForm(); setRequestDialogOpen(true); }}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-2"
            data-testid="new-training-btn"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New Request</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-xs sm:text-sm">Total Requests</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{stats?.total_requests || 0}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <GraduationCap size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-xs sm:text-sm">Pending Review</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{stats?.pending_count || 0}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <Clock size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs sm:text-sm">In Progress</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{stats?.in_progress_count || 0}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <Play size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs sm:text-sm">Total Budget</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{formatCurrency(stats?.total_cost || 0)}</p>
            </div>
            <div className="bg-slate-100 rounded-xl p-2 sm:p-3">
              <DollarSign size={20} className="text-slate-600 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList className="bg-slate-100 p-1 rounded-xl w-full sm:w-auto flex">
            <TabsTrigger value="all" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
              <GraduationCap size={14} className="sm:w-4 sm:h-4" />
              All
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
              <Clock size={14} className="sm:w-4 sm:h-4" />
              Pending
              {pendingRequests.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
              <Play size={14} className="sm:w-4 sm:h-4" />
              Active
            </TabsTrigger>
          </TabsList>
          
          {/* Filters */}
          <div className="flex gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32 rounded-xl">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {TRAINING_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* All Requests Tab */}
        <TabsContent value="all" className="mt-4">
          <TrainingTable 
            requests={filteredRequests}
            employees={employees}
            onView={(r) => { setSelectedRequest(r); setViewDialogOpen(true); }}
            onApprove={handleApprove}
            onReject={(r) => { setSelectedRequest(r); setRejectDialogOpen(true); }}
            onStart={handleStartTraining}
            onComplete={(r) => { setSelectedRequest(r); setCompleteDialogOpen(true); }}
            onEdit={openEditRequest}
            onDelete={handleDelete}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="pending" className="mt-4">
          <TrainingTable 
            requests={pendingRequests}
            employees={employees}
            onView={(r) => { setSelectedRequest(r); setViewDialogOpen(true); }}
            onApprove={handleApprove}
            onReject={(r) => { setSelectedRequest(r); setRejectDialogOpen(true); }}
            onStart={handleStartTraining}
            onComplete={(r) => { setSelectedRequest(r); setCompleteDialogOpen(true); }}
            onEdit={openEditRequest}
            onDelete={handleDelete}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        {/* Active Tab */}
        <TabsContent value="active" className="mt-4">
          <TrainingTable 
            requests={requests.filter(r => ['approved', 'in_progress'].includes(r.status))}
            employees={employees}
            onView={(r) => { setSelectedRequest(r); setViewDialogOpen(true); }}
            onApprove={handleApprove}
            onReject={(r) => { setSelectedRequest(r); setRejectDialogOpen(true); }}
            onStart={handleStartTraining}
            onComplete={(r) => { setSelectedRequest(r); setCompleteDialogOpen(true); }}
            onEdit={openEditRequest}
            onDelete={handleDelete}
            formatCurrency={formatCurrency}
          />
        </TabsContent>
      </Tabs>

      {/* Request Form Dialog - Same as Employee View */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <GraduationCap className="text-indigo-600" size={24} />
              {editingRequest ? 'Edit Training Request' : 'New Training Request'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRequestSubmit} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Training Title *</label>
              <Input
                value={requestForm.title}
                onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                className="rounded-xl"
                placeholder="e.g. AWS Solutions Architect Certification"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Type *</label>
                <Select value={requestForm.training_type} onValueChange={(v) => setRequestForm({ ...requestForm, training_type: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRAINING_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Category *</label>
                <Select value={requestForm.category} onValueChange={(v) => setRequestForm({ ...requestForm, category: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRAINING_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Provider</label>
                <Input
                  value={requestForm.provider}
                  onChange={(e) => setRequestForm({ ...requestForm, provider: e.target.value })}
                  className="rounded-xl"
                  placeholder="e.g. Coursera, Udemy"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Cost</label>
                <Input
                  type="number"
                  step="0.01"
                  value={requestForm.cost}
                  onChange={(e) => setRequestForm({ ...requestForm, cost: e.target.value })}
                  className="rounded-xl"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Start Date *</label>
                <Input
                  type="date"
                  value={requestForm.start_date}
                  onChange={(e) => setRequestForm({ ...requestForm, start_date: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">End Date *</label>
                <Input
                  type="date"
                  value={requestForm.end_date}
                  onChange={(e) => setRequestForm({ ...requestForm, end_date: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
              <textarea
                value={requestForm.description}
                onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                rows={2}
                placeholder="Describe the training..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1">
                {editingRequest ? 'Update Request' : 'Submit Request'}
              </Button>
              <Button type="button" onClick={resetRequestForm} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Request Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <GraduationCap className="text-indigo-600" size={24} />
              Training Details
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm text-slate-500">Cost</p>
                  <p className="text-2xl font-black text-slate-900">{formatCurrency(selectedRequest.cost || 0)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusInfo(selectedRequest.status).color}`}>
                  {getStatusInfo(selectedRequest.status).label}
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500">Employee</p>
                  <p className="font-medium text-slate-900">{getEmployeeName(selectedRequest.employee_id)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Title</p>
                  <p className="font-medium text-slate-900">{selectedRequest.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Type</p>
                    <p className="font-medium text-slate-900">{getTypeInfo(selectedRequest.training_type).label}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Category</p>
                    <p className="font-medium text-slate-900">{getCategoryLabel(selectedRequest.category)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Start Date</p>
                    <p className="font-medium text-slate-900">{new Date(selectedRequest.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">End Date</p>
                    <p className="font-medium text-slate-900">{new Date(selectedRequest.end_date).toLocaleDateString()}</p>
                  </div>
                </div>
                {selectedRequest.rejection_reason && (
                  <div className="p-3 bg-rose-50 rounded-xl">
                    <p className="text-xs text-rose-600 font-medium">Rejection Reason</p>
                    <p className="text-rose-700">{selectedRequest.rejection_reason}</p>
                  </div>
                )}
              </div>
              
              {/* Admin Actions */}
              {['pending', 'submitted', 'under_review'].includes(selectedRequest.status) && (
                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={() => { handleApprove(selectedRequest.id); setViewDialogOpen(false); }}
                    className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Check size={16} className="mr-2" />
                    Approve
                  </Button>
                  <Button 
                    onClick={() => { setViewDialogOpen(false); setRejectDialogOpen(true); }}
                    variant="outline"
                    className="flex-1 rounded-xl text-rose-600 hover:bg-rose-50"
                  >
                    <X size={16} className="mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Ban className="text-rose-600" size={24} />
              Reject Training Request
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReject} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Reason for rejection *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none resize-none"
                rows={3}
                placeholder="Please provide a reason..."
                required
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700">
                Reject Request
              </Button>
              <Button type="button" onClick={() => setRejectDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Complete Training Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Award className="text-green-600" size={24} />
              Complete Training
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCompleteTraining} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Certificate URL (optional)</label>
              <Input
                value={completeForm.certificate_url}
                onChange={(e) => setCompleteForm({ ...completeForm, certificate_url: e.target.value })}
                className="rounded-xl"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Rating</label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCompleteForm({ ...completeForm, rating: star })}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={star <= completeForm.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Feedback</label>
              <textarea
                value={completeForm.feedback}
                onChange={(e) => setCompleteForm({ ...completeForm, feedback: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none resize-none"
                rows={3}
                placeholder="How was the training?"
              />
            </div>
            <Button type="submit" className="w-full rounded-xl bg-green-600 hover:bg-green-700">
              Mark as Completed
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Training Table Component
const TrainingTable = ({ requests, employees, onView, onApprove, onReject, onStart, onComplete, onEdit, onDelete, formatCurrency }) => {
  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.full_name : '-';
  };

  const getTypeInfo = (type) => {
    return TRAINING_TYPES.find(t => t.value === type) || TRAINING_TYPES[0];
  };

  const getStatusInfo = (status) => {
    return TRAINING_STATUS.find(s => s.value === status) || TRAINING_STATUS[0];
  };

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <GraduationCap size={48} className="mx-auto mb-4 text-slate-300" />
        <p className="text-slate-500">No training requests found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Employee</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Training</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700 hidden md:table-cell">Type</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Cost</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Status</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => {
              const typeInfo = getTypeInfo(request.training_type);
              const statusInfo = getStatusInfo(request.status);
              const TypeIcon = typeInfo.icon;
              return (
                <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <p className="font-medium text-slate-900">{getEmployeeName(request.employee_id)}</p>
                    <p className="text-xs text-slate-400">{new Date(request.start_date).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <p className="font-medium text-slate-900 truncate max-w-[200px]">{request.title}</p>
                    {request.provider && (
                      <p className="text-xs text-slate-400 truncate">{request.provider}</p>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${typeInfo.color}`}>
                      <TypeIcon size={12} />
                      {typeInfo.label}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <p className="font-bold text-slate-900">{formatCurrency(request.cost || 0)}</p>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex gap-1">
                      <Button onClick={() => onView(request)} size="sm" variant="ghost" className="rounded-lg">
                        <Eye size={16} />
                      </Button>
                      {['pending', 'submitted', 'under_review'].includes(request.status) && (
                        <>
                          <Button onClick={() => onApprove(request.id)} size="sm" variant="ghost" className="rounded-lg text-emerald-600">
                            <Check size={16} />
                          </Button>
                          <Button onClick={() => onReject(request)} size="sm" variant="ghost" className="rounded-lg text-rose-600">
                            <X size={16} />
                          </Button>
                        </>
                      )}
                      {request.status === 'approved' && (
                        <Button onClick={() => onStart(request.id)} size="sm" variant="ghost" className="rounded-lg text-indigo-600">
                          <Play size={16} />
                        </Button>
                      )}
                      {request.status === 'in_progress' && (
                        <Button onClick={() => onComplete(request)} size="sm" variant="ghost" className="rounded-lg text-green-600">
                          <CheckCircle2 size={16} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Training;
