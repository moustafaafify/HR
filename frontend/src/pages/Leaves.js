import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Plus, CheckCircle2, XCircle, Calendar, Clock, Sun, Palmtree, 
  Heart, Briefcase, AlertCircle, Filter, Eye, Trash2, CalendarDays,
  TrendingUp, CalendarCheck, CalendarX, Timer, ChevronRight, X, Download
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual Leave', icon: Palmtree, color: 'emerald' },
  { value: 'sick', label: 'Sick Leave', icon: Heart, color: 'rose' },
  { value: 'personal', label: 'Personal Leave', icon: Briefcase, color: 'blue' },
  { value: 'unpaid', label: 'Unpaid Leave', icon: AlertCircle, color: 'slate' },
  { value: 'maternity', label: 'Maternity Leave', icon: Heart, color: 'pink' },
  { value: 'paternity', label: 'Paternity Leave', icon: Heart, color: 'indigo' },
  { value: 'bereavement', label: 'Bereavement', icon: Heart, color: 'gray' },
  { value: 'other', label: 'Other', icon: Calendar, color: 'purple' },
];

const Leaves = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [myBalance, setMyBalance] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [selectedEmployeeForBalance, setSelectedEmployeeForBalance] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterEmployee, setFilterEmployee] = useState('all');
  
  const [formData, setFormData] = useState({ 
    employee_id: '', 
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: '',
    half_day: false,
    half_day_type: ''
  });

  const [balanceForm, setBalanceForm] = useState({
    annual_leave: 20,
    sick_leave: 10,
    personal_leave: 5,
    maternity_leave: 90,
    paternity_leave: 14,
    bereavement_leave: 5
  });

  // Export state
  const [exportRequestsDialogOpen, setExportRequestsDialogOpen] = useState(false);
  const [exportBalancesDialogOpen, setExportBalancesDialogOpen] = useState(false);
  const [exportRequestsFilters, setExportRequestsFilters] = useState({
    start_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    employee_id: 'all',
    status: 'all',
    leave_type: 'all'
  });
  const [exportBalancesYear, setExportBalancesYear] = useState(new Date().getFullYear());

  // Role-based access
  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';
  const isManager = user?.role === 'branch_manager' || isAdmin;

  useEffect(() => {
    fetchLeaves();
    fetchEmployees();
    if (isAdmin) {
      fetchAllBalances();
    }
  }, []);

  useEffect(() => {
    if (employees.length > 0 && user) {
      const emp = employees.find(e => e.personal_email === user.email || e.work_email === user.email);
      setCurrentEmployee(emp);
      if (emp) {
        fetchMyBalance(emp.id);
      }
    }
  }, [employees, user]);

  const fetchLeaves = async () => {
    try {
      const response = await axios.get(`${API}/leaves`);
      setLeaves(response.data);
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
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

  const fetchMyBalance = async (empId) => {
    try {
      const response = await axios.get(`${API}/leave-balances/${empId}`);
      setMyBalance(response.data);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const fetchAllBalances = async () => {
    try {
      const response = await axios.get(`${API}/leave-balances`);
      setLeaveBalances(response.data);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    }
  };

  // Export Leave Requests to CSV
  const handleExportRequests = async () => {
    try {
      const params = new URLSearchParams();
      if (exportRequestsFilters.start_date) params.append('start_date', exportRequestsFilters.start_date);
      if (exportRequestsFilters.end_date) params.append('end_date', exportRequestsFilters.end_date);
      if (exportRequestsFilters.employee_id !== 'all') params.append('employee_id', exportRequestsFilters.employee_id);
      if (exportRequestsFilters.status !== 'all') params.append('status', exportRequestsFilters.status);
      if (exportRequestsFilters.leave_type !== 'all') params.append('leave_type', exportRequestsFilters.leave_type);
      
      const response = await axios.get(`${API}/leaves/export?${params.toString()}`);
      const records = response.data.records;
      
      if (records.length === 0) {
        toast.error('No records found for the selected filters');
        return;
      }
      
      // Convert to CSV
      const headers = ['Employee', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason', 'Submitted'];
      const csvContent = [
        headers.join(','),
        ...records.map(r => [
          `"${r.employee_name || 'Unknown'}"`,
          r.leave_type || '-',
          r.start_date || '-',
          r.end_date || '-',
          r.days || '-',
          r.status || '-',
          `"${(r.reason || '').replace(/"/g, '""')}"`,
          r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'
        ].join(','))
      ].join('\n');
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `leave_requests_${exportRequestsFilters.start_date}_to_${exportRequestsFilters.end_date}.csv`;
      link.click();
      
      toast.success(`Exported ${records.length} leave requests`);
      setExportRequestsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to export leave requests');
    }
  };

  // Export Leave Balances to CSV
  const handleExportBalances = async () => {
    try {
      const response = await axios.get(`${API}/leave-balances/export?year=${exportBalancesYear}`);
      const records = response.data.records;
      
      if (records.length === 0) {
        toast.error('No balance records found');
        return;
      }
      
      // Convert to CSV
      const headers = ['Employee', 'Department', 'Annual (Total)', 'Annual (Used)', 'Sick (Total)', 'Sick (Used)', 'Personal (Total)', 'Personal (Used)', 'Maternity (Total)', 'Maternity (Used)', 'Paternity (Total)', 'Paternity (Used)', 'Bereavement (Total)', 'Bereavement (Used)'];
      const csvContent = [
        headers.join(','),
        ...records.map(r => [
          `"${r.employee_name || 'Unknown'}"`,
          `"${r.department_name || '-'}"`,
          r.annual_leave || 0,
          r.annual_used || 0,
          r.sick_leave || 0,
          r.sick_used || 0,
          r.personal_leave || 0,
          r.personal_used || 0,
          r.maternity_leave || 0,
          r.maternity_used || 0,
          r.paternity_leave || 0,
          r.paternity_used || 0,
          r.bereavement_leave || 0,
          r.bereavement_used || 0
        ].join(','))
      ].join('\n');
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `leave_balances_${exportBalancesYear}.csv`;
      link.click();
      
      toast.success(`Exported ${records.length} balance records`);
      setExportBalancesDialogOpen(false);
    } catch (error) {
      toast.error('Failed to export leave balances');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      employee_id: isAdmin ? formData.employee_id : currentEmployee?.id
    };
    
    if (!submitData.employee_id) {
      toast.error('Employee not found');
      return;
    }

    try {
      await axios.post(`${API}/leaves`, submitData);
      toast.success('Leave request submitted successfully');
      setDialogOpen(false);
      resetForm();
      fetchLeaves();
    } catch (error) {
      toast.error('Failed to submit leave request');
    }
  };

  const resetForm = () => {
    setFormData({ 
      employee_id: '', 
      leave_type: 'annual',
      start_date: '',
      end_date: '',
      reason: '',
      half_day: false,
      half_day_type: ''
    });
  };

  const updateLeaveStatus = async (leaveId, status, reason = null) => {
    try {
      const data = { status };
      if (reason) data.rejection_reason = reason;
      
      await axios.put(`${API}/leaves/${leaveId}`, data);
      toast.success(`Leave ${status}`);
      setRejectDialogOpen(false);
      setRejectionReason('');
      fetchLeaves();
    } catch (error) {
      toast.error('Failed to update leave status');
    }
  };

  const deleteLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to delete this leave request?')) return;
    try {
      await axios.delete(`${API}/leaves/${leaveId}`);
      toast.success('Leave request deleted');
      fetchLeaves();
    } catch (error) {
      toast.error('Failed to delete leave request');
    }
  };

  const updateBalance = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeForBalance) return;
    
    try {
      await axios.put(`${API}/leave-balances/${selectedEmployeeForBalance}`, {
        ...balanceForm,
        year: new Date().getFullYear()
      });
      toast.success('Leave balance updated');
      setBalanceDialogOpen(false);
      fetchAllBalances();
    } catch (error) {
      toast.error('Failed to update balance');
    }
  };

  const openBalanceDialog = (emp) => {
    setSelectedEmployeeForBalance(emp.id);
    const balance = leaveBalances.find(b => b.employee_id === emp.id) || {};
    setBalanceForm({
      annual_leave: balance.annual_leave || 20,
      sick_leave: balance.sick_leave || 10,
      personal_leave: balance.personal_leave || 5,
      maternity_leave: balance.maternity_leave || 90,
      paternity_leave: balance.paternity_leave || 14,
      bereavement_leave: balance.bereavement_leave || 5
    });
    setBalanceDialogOpen(true);
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.full_name : '-';
  };

  const getLeaveTypeInfo = (type) => {
    return LEAVE_TYPES.find(t => t.value === type) || LEAVE_TYPES[LEAVE_TYPES.length - 1];
  };

  const calculateDays = (startDate, endDate, halfDay) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return halfDay ? 0.5 : diffDays;
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
      approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
      rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: XCircle }
    };
    return statusMap[status] || statusMap.pending;
  };

  // Filter leaves
  const filteredLeaves = leaves.filter(leave => {
    // For employees, show only their leaves
    if (!isManager && currentEmployee) {
      if (leave.employee_id !== currentEmployee.id) return false;
    }
    if (filterStatus !== 'all' && leave.status !== filterStatus) return false;
    if (filterType !== 'all' && leave.leave_type !== filterType) return false;
    if (filterEmployee !== 'all' && leave.employee_id !== filterEmployee) return false;
    return true;
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Stats
  const stats = {
    total: filteredLeaves.length,
    pending: filteredLeaves.filter(l => l.status === 'pending').length,
    approved: filteredLeaves.filter(l => l.status === 'approved').length,
    rejected: filteredLeaves.filter(l => l.status === 'rejected').length
  };

  // Get available balance for leave type
  const getAvailableBalance = (type) => {
    if (!myBalance) return null;
    const mapping = {
      annual: { total: myBalance.annual_leave || 20, used: myBalance.annual_used || 0 },
      sick: { total: myBalance.sick_leave || 10, used: myBalance.sick_used || 0 },
      personal: { total: myBalance.personal_leave || 5, used: myBalance.personal_used || 0 },
      unpaid: { total: null, used: myBalance.unpaid_used || 0 },
      maternity: { total: myBalance.maternity_leave || 90, used: myBalance.maternity_used || 0 },
      paternity: { total: myBalance.paternity_leave || 14, used: myBalance.paternity_used || 0 },
      bereavement: { total: myBalance.bereavement_leave || 5, used: myBalance.bereavement_used || 0 },
      other: { total: null, used: myBalance.other_used || 0 }
    };
    return mapping[type];
  };

  return (
    <div data-testid="leaves-page" className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {t('leaves')}
          </h1>
          <p className="text-slate-500 mt-1 text-sm lg:text-base">Manage time off requests</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setDialogOpen(true)} 
              data-testid="add-leave-button"
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 px-4 sm:px-6 w-full sm:w-auto"
            >
              <Plus size={20} className="me-2" />
              Request Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-2xl mx-4 sm:mx-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Calendar className="text-indigo-600" size={24} />
                Request Time Off
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 mt-4" data-testid="leave-form">
              {isAdmin && (
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Employee</label>
                  <Select 
                    value={formData.employee_id} 
                    onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
                    required
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select Employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Leave Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {LEAVE_TYPES.slice(0, 4).map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.leave_type === type.value;
                    const balance = getAvailableBalance(type.value);
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, leave_type: type.value })}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          isSelected 
                            ? `border-${type.color}-500 bg-${type.color}-50` 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon size={18} className={isSelected ? `text-${type.color}-600` : 'text-slate-400'} />
                          <span className={`font-medium text-sm ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                            {type.label}
                          </span>
                        </div>
                        {balance && (
                          <p className="text-xs text-slate-400 mt-1 ml-6">
                            {balance.total - balance.used} days available
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
                <Select 
                  value={formData.leave_type} 
                  onValueChange={(value) => setFormData({ ...formData, leave_type: value })}
                >
                  <SelectTrigger className="rounded-xl mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAVE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    required
                    min={formData.start_date}
                  />
                </div>
              </div>

              {formData.start_date === formData.end_date && formData.start_date && (
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.half_day}
                      onChange={(e) => setFormData({ ...formData, half_day: e.target.checked, half_day_type: e.target.checked ? 'morning' : '' })}
                      className="rounded-md w-5 h-5"
                    />
                    <span className="text-sm text-slate-700">Half Day</span>
                  </label>
                  {formData.half_day && (
                    <Select 
                      value={formData.half_day_type} 
                      onValueChange={(value) => setFormData({ ...formData, half_day_type: value })}
                    >
                      <SelectTrigger className="w-36 rounded-lg">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="afternoon">Afternoon</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {formData.start_date && formData.end_date && (
                <div className="bg-indigo-50 rounded-xl p-4 flex items-center justify-between">
                  <span className="text-sm text-indigo-700">Total Days Requested</span>
                  <span className="text-2xl font-bold text-indigo-900">
                    {calculateDays(formData.start_date, formData.end_date, formData.half_day)}
                  </span>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Reason (Optional)</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                  rows={3}
                  placeholder="Add any notes or reason for your leave..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="rounded-xl bg-indigo-950 hover:bg-indigo-900 flex-1">
                  Submit Request
                </Button>
                <Button type="button" onClick={() => setDialogOpen(false)} variant="outline" className="rounded-xl">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Total Requests</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-slate-100 rounded-xl p-3">
              <CalendarDays size={24} className="text-slate-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Pending</p>
              <p className="text-3xl font-black mt-1">{stats.pending}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Approved</p>
              <p className="text-3xl font-black mt-1">{stats.approved}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <CalendarCheck size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-sm font-medium">Rejected</p>
              <p className="text-3xl font-black mt-1">{stats.rejected}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <CalendarX size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* My Leave Balance Card - For Employees */}
      {currentEmployee && myBalance && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
            <h3 className="text-lg font-bold">My Leave Balance</h3>
            <p className="text-slate-400 text-sm">{new Date().getFullYear()} Allocation</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Annual Leave */}
              <div className="bg-emerald-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Palmtree size={20} className="text-emerald-600" />
                  <span className="text-sm font-medium text-slate-700">Annual</span>
                </div>
                <p className="text-2xl font-black text-emerald-700">
                  {(myBalance.annual_leave || 20) - (myBalance.annual_used || 0)}
                  <span className="text-sm font-normal text-slate-400">/{myBalance.annual_leave || 20}</span>
                </p>
                <div className="w-full bg-emerald-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-emerald-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.max(0, ((myBalance.annual_leave - (myBalance.annual_used || 0)) / myBalance.annual_leave) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{myBalance.annual_used || 0} used</p>
              </div>
              
              {/* Sick Leave */}
              <div className="bg-rose-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart size={20} className="text-rose-600" />
                  <span className="text-sm font-medium text-slate-700">Sick</span>
                </div>
                <p className="text-2xl font-black text-rose-700">
                  {(myBalance.sick_leave || 10) - (myBalance.sick_used || 0)}
                  <span className="text-sm font-normal text-slate-400">/{myBalance.sick_leave || 10}</span>
                </p>
                <div className="w-full bg-rose-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-rose-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.max(0, ((myBalance.sick_leave - (myBalance.sick_used || 0)) / myBalance.sick_leave) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{myBalance.sick_used || 0} used</p>
              </div>
              
              {/* Personal Leave */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase size={20} className="text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">Personal</span>
                </div>
                <p className="text-2xl font-black text-blue-700">
                  {(myBalance.personal_leave || 5) - (myBalance.personal_used || 0)}
                  <span className="text-sm font-normal text-slate-400">/{myBalance.personal_leave || 5}</span>
                </p>
                <div className="w-full bg-blue-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.max(0, ((myBalance.personal_leave - (myBalance.personal_used || 0)) / myBalance.personal_leave) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{myBalance.personal_used || 0} used</p>
              </div>
              
              {/* Bereavement Leave */}
              <div className="bg-slate-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart size={20} className="text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Bereavement</span>
                </div>
                <p className="text-2xl font-black text-slate-700">
                  {(myBalance.bereavement_leave || 5) - (myBalance.bereavement_used || 0)}
                  <span className="text-sm font-normal text-slate-400">/{myBalance.bereavement_leave || 5}</span>
                </p>
                <div className="w-full bg-slate-300 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-slate-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.max(0, ((myBalance.bereavement_leave - (myBalance.bereavement_used || 0)) / myBalance.bereavement_leave) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{myBalance.bereavement_used || 0} used</p>
              </div>
              
              {/* Maternity Leave */}
              <div className="bg-pink-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart size={20} className="text-pink-600" />
                  <span className="text-sm font-medium text-slate-700">Maternity</span>
                </div>
                <p className="text-2xl font-black text-pink-700">
                  {(myBalance.maternity_leave || 90) - (myBalance.maternity_used || 0)}
                  <span className="text-sm font-normal text-slate-400">/{myBalance.maternity_leave || 90}</span>
                </p>
                <div className="w-full bg-pink-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-pink-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.max(0, ((myBalance.maternity_leave - (myBalance.maternity_used || 0)) / myBalance.maternity_leave) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{myBalance.maternity_used || 0} used</p>
              </div>
              
              {/* Paternity Leave */}
              <div className="bg-indigo-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart size={20} className="text-indigo-600" />
                  <span className="text-sm font-medium text-slate-700">Paternity</span>
                </div>
                <p className="text-2xl font-black text-indigo-700">
                  {(myBalance.paternity_leave || 14) - (myBalance.paternity_used || 0)}
                  <span className="text-sm font-normal text-slate-400">/{myBalance.paternity_leave || 14}</span>
                </p>
                <div className="w-full bg-indigo-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-indigo-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.max(0, ((myBalance.paternity_leave - (myBalance.paternity_used || 0)) / myBalance.paternity_leave) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{myBalance.paternity_used || 0} used</p>
              </div>
              
              {/* Unpaid Leave */}
              <div className="bg-amber-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={20} className="text-amber-600" />
                  <span className="text-sm font-medium text-slate-700">Unpaid</span>
                </div>
                <p className="text-2xl font-black text-amber-700">
                  {myBalance.unpaid_used || 0}
                  <span className="text-sm font-normal text-slate-400"> used</span>
                </p>
                <p className="text-xs text-slate-500 mt-3">No limit</p>
              </div>
              
              {/* Other Leave */}
              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={20} className="text-purple-600" />
                  <span className="text-sm font-medium text-slate-700">Other</span>
                </div>
                <p className="text-2xl font-black text-purple-700">
                  {myBalance.other_used || 0}
                  <span className="text-sm font-normal text-slate-400"> used</span>
                </p>
                <p className="text-xs text-slate-500 mt-3">As approved</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="requests" className="rounded-lg flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Calendar size={16} />
            Leave Requests
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="balances" className="rounded-lg flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <TrendingUp size={16} />
              Leave Balances
            </TabsTrigger>
          )}
        </TabsList>

        {/* Leave Requests Tab */}
        <TabsContent value="requests" className="mt-6">
          {/* Filters */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-4 py-2">
                <Filter size={18} className="text-slate-400" />
                <span className="text-sm text-slate-500">Filters:</span>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36 rounded-xl bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40 rounded-xl bg-white">
                  <SelectValue placeholder="Leave Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {LEAVE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isManager && (
                <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                  <SelectTrigger className="w-48 rounded-xl bg-white">
                    <SelectValue placeholder="Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {(filterStatus !== 'all' || filterType !== 'all' || filterEmployee !== 'all') && (
                <Button 
                  variant="ghost" 
                  onClick={() => { setFilterStatus('all'); setFilterType('all'); setFilterEmployee('all'); }}
                  className="text-slate-500"
                >
                  Clear
                </Button>
              )}
            </div>
            {isManager && (
              <Button 
                variant="outline" 
                onClick={() => setExportRequestsDialogOpen(true)}
                className="rounded-xl"
              >
                <Download size={18} className="mr-2" />
                Export
              </Button>
            )}
          </div>

          {/* Leave Requests List */}
          <div className="space-y-4">
            {filteredLeaves.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                <div className="bg-slate-50 rounded-2xl p-8 max-w-sm mx-auto">
                  <Calendar size={48} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-600 font-medium">No leave requests found</p>
                  <p className="text-slate-400 text-sm mt-1">Submit a new request to get started</p>
                </div>
              </div>
            ) : (
              filteredLeaves.map((leave) => {
                const typeInfo = getLeaveTypeInfo(leave.leave_type);
                const statusInfo = getStatusInfo(leave.status);
                const StatusIcon = statusInfo.icon;
                const TypeIcon = typeInfo.icon;
                const days = calculateDays(leave.start_date, leave.end_date, leave.half_day);
                
                return (
                  <div 
                    key={leave.id} 
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-${typeInfo.color}-100 flex items-center justify-center`}>
                            <TypeIcon size={24} className={`text-${typeInfo.color}-600`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              {isManager && (
                                <span className="font-bold text-slate-900">{getEmployeeName(leave.employee_id)}</span>
                              )}
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color} flex items-center gap-1`}>
                                <StatusIcon size={12} />
                                {statusInfo.label}
                              </span>
                            </div>
                            <p className="text-slate-600 mt-1">{typeInfo.label}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <CalendarDays size={14} />
                                {new Date(leave.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                {leave.start_date !== leave.end_date && (
                                  <> - {new Date(leave.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                                )}
                              </span>
                              <span className="flex items-center gap-1">
                                <Timer size={14} />
                                {days} {days === 1 ? 'day' : 'days'}
                                {leave.half_day && ` (${leave.half_day_type})`}
                              </span>
                            </div>
                            {leave.reason && (
                              <p className="text-slate-500 text-sm mt-2 italic">"{leave.reason}"</p>
                            )}
                            {leave.rejection_reason && (
                              <p className="text-rose-600 text-sm mt-2 bg-rose-50 px-3 py-2 rounded-lg">
                                <strong>Rejection reason:</strong> {leave.rejection_reason}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {leave.status === 'pending' && isAdmin && (
                            <>
                              <Button
                                onClick={() => updateLeaveStatus(leave.id, 'approved')}
                                size="sm"
                                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                <CheckCircle2 size={16} className="me-1" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => { setSelectedLeave(leave); setRejectDialogOpen(true); }}
                                size="sm"
                                variant="outline"
                                className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50"
                              >
                                <XCircle size={16} className="me-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {leave.status === 'pending' && !isAdmin && leave.employee_id === currentEmployee?.id && (
                            <Button
                              onClick={() => deleteLeave(leave.id)}
                              size="sm"
                              variant="ghost"
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                          <Button
                            onClick={() => { setSelectedLeave(leave); setViewDialogOpen(true); }}
                            size="sm"
                            variant="ghost"
                            className="text-slate-400 hover:text-indigo-600"
                          >
                            <Eye size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Leave Balances Tab - Admin Only */}
        {isAdmin && (
          <TabsContent value="balances" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">{new Date().getFullYear()} Leave Balances</h3>
              <Button 
                variant="outline" 
                onClick={() => setExportBalancesDialogOpen(true)}
                className="rounded-xl"
              >
                <Download size={18} className="mr-2" />
                Export Balances
              </Button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-4 text-start text-sm font-bold text-slate-700">Employee</th>
                      <th className="px-2 py-4 text-center text-xs font-bold text-slate-700">
                        <div className="flex flex-col items-center gap-1">
                          <Palmtree size={14} className="text-emerald-600" />
                          Annual
                        </div>
                      </th>
                      <th className="px-2 py-4 text-center text-xs font-bold text-slate-700">
                        <div className="flex flex-col items-center gap-1">
                          <Heart size={14} className="text-rose-600" />
                          Sick
                        </div>
                      </th>
                      <th className="px-2 py-4 text-center text-xs font-bold text-slate-700">
                        <div className="flex flex-col items-center gap-1">
                          <Briefcase size={14} className="text-blue-600" />
                          Personal
                        </div>
                      </th>
                      <th className="px-2 py-4 text-center text-xs font-bold text-slate-700">
                        <div className="flex flex-col items-center gap-1">
                          <Heart size={14} className="text-pink-600" />
                          Maternity
                        </div>
                      </th>
                      <th className="px-2 py-4 text-center text-xs font-bold text-slate-700">
                        <div className="flex flex-col items-center gap-1">
                          <Heart size={14} className="text-indigo-600" />
                          Paternity
                        </div>
                      </th>
                      <th className="px-2 py-4 text-center text-xs font-bold text-slate-700">
                        <div className="flex flex-col items-center gap-1">
                          <Heart size={14} className="text-slate-600" />
                          Bereav.
                        </div>
                      </th>
                      <th className="px-2 py-4 text-center text-xs font-bold text-slate-700">
                        <div className="flex flex-col items-center gap-1">
                          <AlertCircle size={14} className="text-amber-600" />
                          Unpaid
                        </div>
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-bold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => {
                      const balance = leaveBalances.find(b => b.employee_id === emp.id) || {};
                      return (
                        <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {emp.full_name?.charAt(0)}
                              </div>
                              <span className="font-medium text-slate-900">{emp.full_name}</span>
                            </div>
                          </td>
                          <td className="px-2 py-4 text-center">
                            <span className="font-bold text-emerald-600">
                              {(balance.annual_leave || 20) - (balance.annual_used || 0)}
                            </span>
                            <span className="text-slate-400 text-xs">/{balance.annual_leave || 20}</span>
                          </td>
                          <td className="px-2 py-4 text-center">
                            <span className="font-bold text-rose-600">
                              {(balance.sick_leave || 10) - (balance.sick_used || 0)}
                            </span>
                            <span className="text-slate-400 text-xs">/{balance.sick_leave || 10}</span>
                          </td>
                          <td className="px-2 py-4 text-center">
                            <span className="font-bold text-blue-600">
                              {(balance.personal_leave || 5) - (balance.personal_used || 0)}
                            </span>
                            <span className="text-slate-400 text-xs">/{balance.personal_leave || 5}</span>
                          </td>
                          <td className="px-2 py-4 text-center">
                            <span className="font-bold text-pink-600">
                              {(balance.maternity_leave || 90) - (balance.maternity_used || 0)}
                            </span>
                            <span className="text-slate-400 text-xs">/{balance.maternity_leave || 90}</span>
                          </td>
                          <td className="px-2 py-4 text-center">
                            <span className="font-bold text-indigo-600">
                              {(balance.paternity_leave || 14) - (balance.paternity_used || 0)}
                            </span>
                            <span className="text-slate-400 text-xs">/{balance.paternity_leave || 14}</span>
                          </td>
                          <td className="px-2 py-4 text-center">
                            <span className="font-bold text-slate-600">
                              {(balance.bereavement_leave || 5) - (balance.bereavement_used || 0)}
                            </span>
                            <span className="text-slate-400 text-xs">/{balance.bereavement_leave || 5}</span>
                          </td>
                          <td className="px-2 py-4 text-center">
                            <span className="font-bold text-amber-600">
                              {balance.unpaid_used || 0}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <Button
                              onClick={() => openBalanceDialog(emp)}
                              size="sm"
                              variant="outline"
                              className="rounded-xl"
                            >
                              Edit
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* View Leave Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Leave Request Details</DialogTitle>
          </DialogHeader>
          {selectedLeave && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-${getLeaveTypeInfo(selectedLeave.leave_type).color}-100 flex items-center justify-center`}>
                  {React.createElement(getLeaveTypeInfo(selectedLeave.leave_type).icon, { 
                    size: 24, 
                    className: `text-${getLeaveTypeInfo(selectedLeave.leave_type).color}-600` 
                  })}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{getEmployeeName(selectedLeave.employee_id)}</p>
                  <p className="text-slate-500">{getLeaveTypeInfo(selectedLeave.leave_type).label}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4">
                <div>
                  <p className="text-xs text-slate-500">Start Date</p>
                  <p className="font-medium text-slate-900">{new Date(selectedLeave.start_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">End Date</p>
                  <p className="font-medium text-slate-900">{new Date(selectedLeave.end_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Duration</p>
                  <p className="font-medium text-slate-900">
                    {calculateDays(selectedLeave.start_date, selectedLeave.end_date, selectedLeave.half_day)} days
                    {selectedLeave.half_day && ` (${selectedLeave.half_day_type})`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusInfo(selectedLeave.status).color}`}>
                    {getStatusInfo(selectedLeave.status).label}
                  </span>
                </div>
              </div>
              
              {selectedLeave.reason && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Reason</p>
                  <p className="text-slate-700 bg-slate-50 rounded-xl p-3">{selectedLeave.reason}</p>
                </div>
              )}
              
              {selectedLeave.rejection_reason && (
                <div>
                  <p className="text-xs text-rose-500 mb-1">Rejection Reason</p>
                  <p className="text-rose-700 bg-rose-50 rounded-xl p-3">{selectedLeave.rejection_reason}</p>
                </div>
              )}
              
              <p className="text-xs text-slate-400">
                Requested on {new Date(selectedLeave.created_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-rose-600">Reject Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-slate-600">Please provide a reason for rejecting this leave request:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none resize-none"
              rows={3}
              placeholder="Enter rejection reason..."
            />
            <div className="flex gap-3">
              <Button 
                onClick={() => updateLeaveStatus(selectedLeave?.id, 'rejected', rejectionReason)}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 flex-1"
              >
                Reject Request
              </Button>
              <Button 
                onClick={() => { setRejectDialogOpen(false); setRejectionReason(''); }}
                variant="outline"
                className="rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Balance Dialog */}
      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Leave Balance</DialogTitle>
          </DialogHeader>
          <form onSubmit={updateBalance} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-2">
                  <Palmtree size={16} className="text-emerald-600" />
                  Annual Leave
                </label>
                <input
                  type="number"
                  value={balanceForm.annual_leave}
                  onChange={(e) => setBalanceForm({ ...balanceForm, annual_leave: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-2">
                  <Heart size={16} className="text-rose-600" />
                  Sick Leave
                </label>
                <input
                  type="number"
                  value={balanceForm.sick_leave}
                  onChange={(e) => setBalanceForm({ ...balanceForm, sick_leave: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-2">
                  <Briefcase size={16} className="text-blue-600" />
                  Personal Leave
                </label>
                <input
                  type="number"
                  value={balanceForm.personal_leave}
                  onChange={(e) => setBalanceForm({ ...balanceForm, personal_leave: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-2">
                  <Heart size={16} className="text-slate-600" />
                  Bereavement
                </label>
                <input
                  type="number"
                  value={balanceForm.bereavement_leave}
                  onChange={(e) => setBalanceForm({ ...balanceForm, bereavement_leave: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-2">
                  <Heart size={16} className="text-pink-600" />
                  Maternity Leave
                </label>
                <input
                  type="number"
                  value={balanceForm.maternity_leave}
                  onChange={(e) => setBalanceForm({ ...balanceForm, maternity_leave: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-2">
                  <Heart size={16} className="text-indigo-600" />
                  Paternity Leave
                </label>
                <input
                  type="number"
                  value={balanceForm.paternity_leave}
                  onChange={(e) => setBalanceForm({ ...balanceForm, paternity_leave: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  min="0"
                  step="0.5"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-xl bg-indigo-950 hover:bg-indigo-900 flex-1">
                Save Changes
              </Button>
              <Button type="button" onClick={() => setBalanceDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Export Leave Requests Dialog */}
      <Dialog open={exportRequestsDialogOpen} onOpenChange={setExportRequestsDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Export Leave Requests</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Start Date</label>
                <input
                  type="date"
                  value={exportRequestsFilters.start_date}
                  onChange={(e) => setExportRequestsFilters({ ...exportRequestsFilters, start_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">End Date</label>
                <input
                  type="date"
                  value={exportRequestsFilters.end_date}
                  onChange={(e) => setExportRequestsFilters({ ...exportRequestsFilters, end_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Employee</label>
              <Select value={exportRequestsFilters.employee_id} onValueChange={(value) => setExportRequestsFilters({ ...exportRequestsFilters, employee_id: value })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Status</label>
                <Select value={exportRequestsFilters.status} onValueChange={(value) => setExportRequestsFilters({ ...exportRequestsFilters, status: value })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Leave Type</label>
                <Select value={exportRequestsFilters.leave_type} onValueChange={(value) => setExportRequestsFilters({ ...exportRequestsFilters, leave_type: value })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Leave Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {LEAVE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleExportRequests} className="rounded-xl bg-indigo-950 hover:bg-indigo-900 flex-1">
                <Download size={18} className="mr-2" />
                Download CSV
              </Button>
              <Button type="button" onClick={() => setExportRequestsDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Leave Balances Dialog */}
      <Dialog open={exportBalancesDialogOpen} onOpenChange={setExportBalancesDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Export Leave Balances</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Year</label>
              <Select value={exportBalancesYear.toString()} onValueChange={(value) => setExportBalancesYear(parseInt(value))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2027">2027</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-slate-500">
              This will export leave balances for all employees including their allocation and usage for each leave type.
            </p>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleExportBalances} className="rounded-xl bg-indigo-950 hover:bg-indigo-900 flex-1">
                <Download size={18} className="mr-2" />
                Download CSV
              </Button>
              <Button type="button" onClick={() => setExportBalancesDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leaves;
