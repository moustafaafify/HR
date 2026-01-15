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
  Clock,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Filter,
  Download,
  FileText,
  Timer,
  Moon,
  Sun,
  Zap,
  Building2,
  ChevronRight
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OVERTIME_TYPES = [
  { value: 'regular', label: 'Regular Overtime', icon: Clock, color: 'text-blue-600 bg-blue-50' },
  { value: 'weekend', label: 'Weekend', icon: Sun, color: 'text-orange-600 bg-orange-50' },
  { value: 'holiday', label: 'Holiday', icon: Calendar, color: 'text-purple-600 bg-purple-50' },
  { value: 'emergency', label: 'Emergency', icon: Zap, color: 'text-red-600 bg-red-50' },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-700', icon: XCircle },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-700', icon: XCircle },
};

const Overtime = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests');
  
  // Data
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  
  // Selected items
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Form
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    start_time: '18:00',
    end_time: '22:00',
    overtime_type: 'regular',
    reason: '',
    tasks_performed: '',
    project_name: '',
    compensation_type: 'paid',
    notes: ''
  });
  
  const [policyForm, setPolicyForm] = useState({
    name: '',
    description: '',
    regular_rate: 1.5,
    weekend_rate: 1.5,
    holiday_rate: 2.0,
    emergency_rate: 2.0,
    max_daily_hours: 4,
    max_weekly_hours: 20,
    max_monthly_hours: 60
  });

  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  // Fetch functions
  const fetchRequests = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('overtime_type', typeFilter);
      const response = await axios.get(`${API}/overtime?${params}`);
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
  }, [statusFilter, typeFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/overtime/stats?year=${selectedYear}&month=${selectedMonth}`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [selectedYear, selectedMonth]);

  const fetchPolicies = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/overtime/policies`);
      setPolicies(response.data);
    } catch (error) {
      console.error('Failed to fetch policies:', error);
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

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/departments`);
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchRequests(),
        fetchStats(),
        fetchPolicies(),
        fetchEmployees(),
        fetchDepartments(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchRequests, fetchStats, fetchPolicies, fetchEmployees, fetchDepartments]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, typeFilter, fetchRequests]);

  useEffect(() => {
    fetchStats();
  }, [selectedMonth, selectedYear, fetchStats]);

  // Handlers
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/overtime`, form);
      toast.success('Overtime request submitted!');
      fetchRequests();
      fetchStats();
      setCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit request');
    }
  };

  const handleUpdateRequest = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      await axios.put(`${API}/overtime/${selectedRequest.id}`, form);
      toast.success('Request updated!');
      fetchRequests();
      setEditDialogOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update request');
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Cancel this overtime request?')) return;
    try {
      await axios.delete(`${API}/overtime/${requestId}`);
      toast.success('Request cancelled');
      fetchRequests();
      fetchStats();
    } catch (error) {
      toast.error('Failed to cancel request');
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await axios.put(`${API}/overtime/${requestId}/approve`);
      toast.success('Overtime approved!');
      fetchRequests();
      fetchStats();
      setViewDialogOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to approve');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    try {
      await axios.put(`${API}/overtime/${selectedRequest.id}/reject`, {
        reason: rejectionReason
      });
      toast.success('Overtime rejected');
      fetchRequests();
      fetchStats();
      setRejectDialogOpen(false);
      setRejectionReason('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reject');
    }
  };

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    try {
      if (editingPolicy) {
        await axios.put(`${API}/overtime/policies/${editingPolicy.id}`, policyForm);
        toast.success('Policy updated');
      } else {
        await axios.post(`${API}/overtime/policies`, policyForm);
        toast.success('Policy created');
      }
      fetchPolicies();
      setPolicyDialogOpen(false);
      resetPolicyForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save policy');
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${API}/overtime/export?year=${selectedYear}&month=${selectedMonth}`);
      const data = response.data;
      
      // Convert to CSV
      const headers = ['Reference', 'Employee', 'Date', 'Hours', 'Type', 'Status', 'Reason'];
      const rows = data.records.map(r => [
        r.reference_number,
        r.employee_name,
        r.date,
        r.hours,
        r.overtime_type,
        r.status,
        r.reason
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `overtime_${selectedYear}_${selectedMonth}.csv`;
      a.click();
      
      toast.success(`Exported ${data.total} records`);
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const openEdit = (request) => {
    setSelectedRequest(request);
    setForm({
      date: request.date || '',
      start_time: request.start_time || '18:00',
      end_time: request.end_time || '22:00',
      overtime_type: request.overtime_type || 'regular',
      reason: request.reason || '',
      tasks_performed: request.tasks_performed || '',
      project_name: request.project_name || '',
      compensation_type: request.compensation_type || 'paid',
      notes: request.notes || ''
    });
    setEditDialogOpen(true);
  };

  const openView = (request) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const openReject = (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const openEditPolicy = (policy) => {
    setEditingPolicy(policy);
    setPolicyForm({
      name: policy.name || '',
      description: policy.description || '',
      regular_rate: policy.regular_rate || 1.5,
      weekend_rate: policy.weekend_rate || 1.5,
      holiday_rate: policy.holiday_rate || 2.0,
      emergency_rate: policy.emergency_rate || 2.0,
      max_daily_hours: policy.max_daily_hours || 4,
      max_weekly_hours: policy.max_weekly_hours || 20,
      max_monthly_hours: policy.max_monthly_hours || 60
    });
    setPolicyDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedRequest(null);
    setForm({
      date: new Date().toISOString().split('T')[0],
      start_time: '18:00',
      end_time: '22:00',
      overtime_type: 'regular',
      reason: '',
      tasks_performed: '',
      project_name: '',
      compensation_type: 'paid',
      notes: ''
    });
  };

  const resetPolicyForm = () => {
    setEditingPolicy(null);
    setPolicyForm({
      name: '',
      description: '',
      regular_rate: 1.5,
      weekend_rate: 1.5,
      holiday_rate: 2.0,
      emergency_rate: 2.0,
      max_daily_hours: 4,
      max_weekly_hours: 20,
      max_monthly_hours: 60
    });
  };

  const calculateHours = (start, end) => {
    try {
      const startTime = new Date(`2000-01-01T${start}`);
      const endTime = new Date(`2000-01-01T${end}`);
      let diff = (endTime - startTime) / (1000 * 60 * 60);
      if (diff < 0) diff += 24; // Handle crossing midnight
      return diff.toFixed(1);
    } catch {
      return '0';
    }
  };

  const getOvertimeTypeConfig = (type) => {
    return OVERTIME_TYPES.find(t => t.value === type) || OVERTIME_TYPES[0];
  };

  // Filter requests
  const filteredRequests = requests.filter(request => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!request.employee_name?.toLowerCase().includes(query) &&
          !request.reference_number?.toLowerCase().includes(query) &&
          !request.reason?.toLowerCase().includes(query)) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6" data-testid="overtime-page">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Overtime Management</h1>
          <p className="text-slate-500 mt-1">
            {isAdmin ? 'Manage overtime requests and policies' : 'Track and submit overtime requests'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => { resetForm(); setCreateDialogOpen(true); }} data-testid="create-overtime-btn">
            <Plus size={18} className="mr-2" />
            Request Overtime
          </Button>
          {isAdmin && (
            <Button variant="outline" onClick={handleExport}>
              <Download size={18} className="mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
          <Clock className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-blue-100 text-sm">Total Hours</p>
          <p className="text-2xl font-bold">{stats?.total_hours || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white">
          <CheckCircle2 className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-emerald-100 text-sm">Approved</p>
          <p className="text-2xl font-bold">{stats?.approved_hours || 0}h</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white">
          <AlertCircle className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-amber-100 text-sm">Pending</p>
          <p className="text-2xl font-bold">{stats?.pending_hours || 0}h</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
          <FileText className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-purple-100 text-sm">Requests</p>
          <p className="text-2xl font-bold">{stats?.total_requests || 0}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="requests" data-testid="tab-requests">
            <FileText size={16} className="mr-1" /> {isAdmin ? 'All Requests' : 'My Requests'}
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <TrendingUp size={16} className="mr-1" /> Analytics
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="policies" data-testid="tab-policies">
              <FileText size={16} className="mr-1" /> Policies
            </TabsTrigger>
          )}
        </TabsList>

        {/* Requests Tab */}
        <TabsContent value="requests" className="mt-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {OVERTIME_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Clock className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">No Overtime Requests</p>
              <p className="text-slate-500 text-sm mt-1">Submit your first overtime request</p>
              <Button className="mt-4" onClick={() => { resetForm(); setCreateDialogOpen(true); }}>
                <Plus size={16} className="mr-2" /> Request Overtime
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Reference</th>
                      {isAdmin && <th className="text-left py-3 px-4 font-medium text-slate-600">Employee</th>}
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Hours</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.map(request => {
                      const typeConfig = getOvertimeTypeConfig(request.overtime_type);
                      const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
                      const StatusIcon = statusConfig.icon;
                      const TypeIcon = typeConfig.icon;
                      
                      return (
                        <tr 
                          key={request.id} 
                          className="hover:bg-slate-50 cursor-pointer"
                          onClick={() => openView(request)}
                          data-testid={`overtime-row-${request.id}`}
                        >
                          <td className="py-3 px-4">
                            <p className="font-medium text-slate-900">{request.reference_number}</p>
                            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{request.reason}</p>
                          </td>
                          {isAdmin && (
                            <td className="py-3 px-4">
                              <p className="font-medium text-slate-900">{request.employee_name}</p>
                              <p className="text-xs text-slate-500">{request.department}</p>
                            </td>
                          )}
                          <td className="py-3 px-4 text-slate-600">
                            {new Date(request.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-900">{request.hours}h</span>
                            <span className="text-xs text-slate-500 ml-1">
                              ({request.start_time} - {request.end_time})
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>
                              <TypeIcon size={12} />
                              {typeConfig.label}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              <StatusIcon size={12} />
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              {request.status === 'pending' && (
                                <>
                                  {isAdmin && (
                                    <>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="text-emerald-600"
                                        onClick={() => handleApprove(request.id)}
                                      >
                                        <CheckCircle2 size={16} />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="text-rose-600"
                                        onClick={() => openReject(request)}
                                      >
                                        <XCircle size={16} />
                                      </Button>
                                    </>
                                  )}
                                  {!isAdmin && (
                                    <>
                                      <Button size="sm" variant="ghost" onClick={() => openEdit(request)}>
                                        <Edit2 size={14} />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="text-rose-600"
                                        onClick={() => handleDeleteRequest(request.id)}
                                      >
                                        <Trash2 size={14} />
                                      </Button>
                                    </>
                                  )}
                                </>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => openView(request)}>
                                <ChevronRight size={16} />
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
        </TabsContent>

        {/* Analytics Tab (Admin) */}
        {isAdmin && (
          <TabsContent value="analytics" className="mt-4 space-y-6">
            <div className="flex gap-4 items-center">
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                    <SelectItem key={m} value={m.toString()}>
                      {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* By Type */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">By Type</h3>
                {stats?.by_type && Object.entries(stats.by_type).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(stats.by_type).map(([type, data]) => {
                      const typeConfig = getOvertimeTypeConfig(type);
                      return (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <typeConfig.icon size={16} className="text-slate-500" />
                            <span className="text-sm text-slate-600">{typeConfig.label}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900">{data.hours}h</p>
                            <p className="text-xs text-slate-500">{data.count} requests</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No data for this period</p>
                )}
              </div>

              {/* By Department */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">By Department</h3>
                {stats?.by_department && Object.entries(stats.by_department).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(stats.by_department).slice(0, 5).map(([dept, data]) => (
                      <div key={dept} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-slate-500" />
                          <span className="text-sm text-slate-600">{dept}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">{data.hours}h</p>
                          <p className="text-xs text-slate-500">{data.count} requests</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No data for this period</p>
                )}
              </div>

              {/* Top Employees */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Top Overtime</h3>
                {stats?.top_employees?.length > 0 ? (
                  <div className="space-y-3">
                    {stats.top_employees.slice(0, 5).map((emp, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </div>
                          <span className="text-sm text-slate-600 truncate max-w-[120px]">{emp.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">{emp.hours}h</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No data for this period</p>
                )}
              </div>
            </div>
          </TabsContent>
        )}

        {/* Policies Tab (Admin) */}
        {isAdmin && (
          <TabsContent value="policies" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { resetPolicyForm(); setPolicyDialogOpen(true); }}>
                <Plus size={16} className="mr-2" /> Add Policy
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {policies.map(policy => (
                <div key={policy.id} className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">{policy.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">{policy.description}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => openEditPolicy(policy)}>
                      <Edit2 size={14} />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Regular Rate</p>
                      <p className="font-semibold text-slate-900">{policy.regular_rate}x</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Weekend Rate</p>
                      <p className="font-semibold text-slate-900">{policy.weekend_rate}x</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Holiday Rate</p>
                      <p className="font-semibold text-slate-900">{policy.holiday_rate}x</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Emergency Rate</p>
                      <p className="font-semibold text-slate-900">{policy.emergency_rate}x</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <p className="text-slate-500">Daily Max</p>
                      <p className="font-semibold text-slate-900">{policy.max_daily_hours}h</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <p className="text-slate-500">Weekly Max</p>
                      <p className="font-semibold text-slate-900">{policy.max_weekly_hours}h</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <p className="text-slate-500">Monthly Max</p>
                      <p className="font-semibold text-slate-900">{policy.max_monthly_hours}h</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Create/Edit Request Dialog */}
      <Dialog open={createDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editDialogOpen ? 'Edit Overtime Request' : 'Request Overtime'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editDialogOpen ? handleUpdateRequest : handleCreateRequest} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({...form, date: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
                <Select value={form.overtime_type} onValueChange={(v) => setForm({...form, overtime_type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OVERTIME_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Time *</label>
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({...form, start_time: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Time *</label>
                <Input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({...form, end_time: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-slate-600">Calculated Hours</span>
              <span className="font-bold text-indigo-600">
                {calculateHours(form.start_time, form.end_time)} hours
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason *</label>
              <Textarea
                value={form.reason}
                onChange={(e) => setForm({...form, reason: e.target.value})}
                placeholder="Why is overtime required?"
                rows={2}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tasks to Perform</label>
              <Textarea
                value={form.tasks_performed}
                onChange={(e) => setForm({...form, tasks_performed: e.target.value})}
                placeholder="What tasks will you work on?"
                rows={2}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Project/Client Name</label>
              <Input
                value={form.project_name}
                onChange={(e) => setForm({...form, project_name: e.target.value})}
                placeholder="Optional"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => {
                setCreateDialogOpen(false);
                setEditDialogOpen(false);
              }}>
                Cancel
              </Button>
              <Button type="submit" data-testid="submit-overtime-btn">
                {editDialogOpen ? 'Update' : 'Submit'} Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Request Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Overtime Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">{selectedRequest.reference_number}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[selectedRequest.status]?.color}`}>
                  {STATUS_CONFIG[selectedRequest.status]?.label}
                </span>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee</span>
                  <span className="font-medium">{selectedRequest.employee_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Department</span>
                  <span className="font-medium">{selectedRequest.department || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date</span>
                  <span className="font-medium">{new Date(selectedRequest.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Time</span>
                  <span className="font-medium">{selectedRequest.start_time} - {selectedRequest.end_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hours</span>
                  <span className="font-bold text-indigo-600">{selectedRequest.hours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Type</span>
                  <span className="font-medium capitalize">{selectedRequest.overtime_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rate</span>
                  <span className="font-medium">{selectedRequest.rate_multiplier}x</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Reason</p>
                <p className="text-slate-600">{selectedRequest.reason}</p>
              </div>
              
              {selectedRequest.tasks_performed && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">Tasks</p>
                  <p className="text-slate-600">{selectedRequest.tasks_performed}</p>
                </div>
              )}
              
              {selectedRequest.status === 'rejected' && selectedRequest.rejection_reason && (
                <div className="bg-rose-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-rose-700 mb-1">Rejection Reason</p>
                  <p className="text-rose-600 text-sm">{selectedRequest.rejection_reason}</p>
                </div>
              )}
              
              {selectedRequest.approved_by_name && (
                <div className="text-sm text-slate-500">
                  {selectedRequest.status === 'approved' ? 'Approved' : 'Processed'} by {selectedRequest.approved_by_name}
                  {selectedRequest.approved_at && ` on ${new Date(selectedRequest.approved_at).toLocaleDateString()}`}
                </div>
              )}
              
              {isAdmin && selectedRequest.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleApprove(selectedRequest.id)}
                  >
                    <CheckCircle2 size={16} className="mr-2" />
                    Approve
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50"
                    onClick={() => {
                      setViewDialogOpen(false);
                      openReject(selectedRequest);
                    }}
                  >
                    <XCircle size={16} className="mr-2" />
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Overtime Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-600">
              Please provide a reason for rejecting this overtime request.
            </p>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-rose-600 hover:bg-rose-700"
                onClick={handleReject}
              >
                Reject Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Policy Dialog */}
      <Dialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? 'Edit Policy' : 'Create Policy'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSavePolicy} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Policy Name *</label>
              <Input
                value={policyForm.name}
                onChange={(e) => setPolicyForm({...policyForm, name: e.target.value})}
                placeholder="e.g., Standard Overtime Policy"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <Textarea
                value={policyForm.description}
                onChange={(e) => setPolicyForm({...policyForm, description: e.target.value})}
                placeholder="Policy description..."
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Regular Rate</label>
                <Input
                  type="number"
                  step="0.1"
                  value={policyForm.regular_rate}
                  onChange={(e) => setPolicyForm({...policyForm, regular_rate: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Weekend Rate</label>
                <Input
                  type="number"
                  step="0.1"
                  value={policyForm.weekend_rate}
                  onChange={(e) => setPolicyForm({...policyForm, weekend_rate: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Holiday Rate</label>
                <Input
                  type="number"
                  step="0.1"
                  value={policyForm.holiday_rate}
                  onChange={(e) => setPolicyForm({...policyForm, holiday_rate: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Rate</label>
                <Input
                  type="number"
                  step="0.1"
                  value={policyForm.emergency_rate}
                  onChange={(e) => setPolicyForm({...policyForm, emergency_rate: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Daily</label>
                <Input
                  type="number"
                  value={policyForm.max_daily_hours}
                  onChange={(e) => setPolicyForm({...policyForm, max_daily_hours: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Weekly</label>
                <Input
                  type="number"
                  value={policyForm.max_weekly_hours}
                  onChange={(e) => setPolicyForm({...policyForm, max_weekly_hours: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Monthly</label>
                <Input
                  type="number"
                  value={policyForm.max_monthly_hours}
                  onChange={(e) => setPolicyForm({...policyForm, max_monthly_hours: parseInt(e.target.value)})}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setPolicyDialogOpen(false); resetPolicyForm(); }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingPolicy ? 'Update' : 'Create'} Policy
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Overtime;
