import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  ClipboardList, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2,
  Check,
  Clock,
  AlertCircle,
  Star,
  Users,
  Calendar,
  Target,
  MessageSquare,
  Send,
  Award,
  TrendingUp,
  UserCheck,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Bell,
  Download,
  BarChart3,
  CheckCircle2,
  XCircle,
  ArrowRight
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CYCLE_TYPES = [
  { value: 'annual', label: 'Annual Review', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'quarterly', label: 'Quarterly Review', color: 'bg-blue-100 text-blue-700' },
  { value: 'mid_year', label: 'Mid-Year Review', color: 'bg-purple-100 text-purple-700' },
  { value: 'probation', label: 'Probation Review', color: 'bg-amber-100 text-amber-700' },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock, description: 'Waiting for employee to start' },
  self_assessment: { label: 'Self Assessment', color: 'bg-blue-100 text-blue-700', icon: FileText, description: 'Employee completing self-assessment' },
  manager_review: { label: 'Manager Review', color: 'bg-purple-100 text-purple-700', icon: UserCheck, description: 'Waiting for manager review' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, description: 'Review completed' },
  rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-700', icon: XCircle, description: 'Review rejected' },
};

const Appraisals = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('appraisals');
  const [cycles, setCycles] = useState([]);
  const [appraisals, setAppraisals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [cycleFilter, setCycleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialogs
  const [cycleDialogOpen, setCycleDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selfAssessmentDialogOpen, setSelfAssessmentDialogOpen] = useState(false);
  const [managerReviewDialogOpen, setManagerReviewDialogOpen] = useState(false);
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);
  
  // Selected items
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [selectedAppraisal, setSelectedAppraisal] = useState(null);
  const [editingCycle, setEditingCycle] = useState(null);
  
  // Forms
  const [cycleForm, setCycleForm] = useState({
    name: '',
    description: '',
    cycle_type: 'annual',
    start_date: '',
    end_date: '',
    review_period_start: '',
    review_period_end: '',
    rating_scale: 5,
    self_assessment_required: true,
    manager_review_required: true,
  });
  
  const [assignForm, setAssignForm] = useState({
    employee_ids: [],
    reviewer_id: '',
  });
  
  const [selfAssessmentForm, setSelfAssessmentForm] = useState({
    answers: [],
    overall_rating: '',
    achievements: '',
    challenges: '',
    goals: '',
  });
  
  const [managerReviewForm, setManagerReviewForm] = useState({
    answers: [],
    overall_rating: '',
    feedback: '',
    strengths: '',
    improvements: '',
    recommendations: '',
    final_comments: '',
  });

  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  const fetchCycles = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/appraisal-cycles`);
      setCycles(response.data);
    } catch (error) {
      console.error('Failed to fetch cycles:', error);
    }
  }, []);

  const fetchAppraisals = useCallback(async () => {
    try {
      const endpoint = isAdmin ? `${API}/appraisals` : `${API}/appraisals/my`;
      const response = await axios.get(endpoint);
      setAppraisals(response.data);
    } catch (error) {
      console.error('Failed to fetch appraisals:', error);
    }
  }, [isAdmin]);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/appraisals/stats/summary`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCycles(),
        fetchAppraisals(),
        fetchEmployees(),
        fetchStats(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchCycles, fetchAppraisals, fetchEmployees, fetchStats]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter appraisals
  const filteredAppraisals = appraisals.filter(appraisal => {
    if (statusFilter !== 'all' && appraisal.status !== statusFilter) return false;
    if (cycleFilter !== 'all' && appraisal.cycle_id !== cycleFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = appraisal.employee_name?.toLowerCase().includes(query);
      const emailMatch = appraisal.employee_email?.toLowerCase().includes(query);
      const deptMatch = appraisal.department?.toLowerCase().includes(query);
      if (!nameMatch && !emailMatch && !deptMatch) return false;
    }
    return true;
  });

  const handleCreateCycle = async (e) => {
    e.preventDefault();
    try {
      if (editingCycle) {
        await axios.put(`${API}/appraisal-cycles/${editingCycle.id}`, cycleForm);
        toast.success('Cycle updated successfully');
      } else {
        await axios.post(`${API}/appraisal-cycles`, cycleForm);
        toast.success('Cycle created successfully');
      }
      fetchCycles();
      setCycleDialogOpen(false);
      resetCycleForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save cycle');
    }
  };

  const handleDeleteCycle = async (cycleId) => {
    if (!window.confirm('Delete this cycle and all its appraisals?')) return;
    try {
      await axios.delete(`${API}/appraisal-cycles/${cycleId}`);
      toast.success('Cycle deleted');
      fetchCycles();
      fetchAppraisals();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete cycle');
    }
  };

  const handleAssignAppraisals = async (e) => {
    e.preventDefault();
    if (!selectedCycle) return;
    if (assignForm.employee_ids.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }
    try {
      const response = await axios.post(`${API}/appraisal-cycles/${selectedCycle.id}/assign`, assignForm);
      toast.success(`Assigned ${response.data.created_count} appraisals`);
      fetchAppraisals();
      fetchCycles();
      fetchStats();
      setAssignDialogOpen(false);
      setAssignForm({ employee_ids: [], reviewer_id: '' });
    } catch (error) {
      toast.error('Failed to assign appraisals');
    }
  };

  const handleBulkAssign = async (e) => {
    e.preventDefault();
    if (!selectedCycle) return;
    try {
      // Assign to all employees
      const allEmployeeIds = employees.map(e => e.id);
      const response = await axios.post(`${API}/appraisal-cycles/${selectedCycle.id}/assign`, {
        employee_ids: allEmployeeIds,
        reviewer_id: ''
      });
      toast.success(`Assigned ${response.data.created_count} appraisals to all employees`);
      fetchAppraisals();
      fetchCycles();
      fetchStats();
      setBulkAssignDialogOpen(false);
    } catch (error) {
      toast.error('Failed to bulk assign appraisals');
    }
  };

  const handleSubmitSelfAssessment = async (e) => {
    e.preventDefault();
    if (!selectedAppraisal) return;
    
    if (!selfAssessmentForm.overall_rating) {
      toast.error('Please provide an overall rating');
      return;
    }
    if (!selfAssessmentForm.achievements) {
      toast.error('Please describe your achievements');
      return;
    }
    
    try {
      await axios.post(`${API}/appraisals/${selectedAppraisal.id}/self-assessment`, selfAssessmentForm);
      toast.success('Self-assessment submitted successfully!');
      fetchAppraisals();
      fetchStats();
      setSelfAssessmentDialogOpen(false);
    } catch (error) {
      toast.error('Failed to submit self-assessment');
    }
  };

  const handleSubmitManagerReview = async (e) => {
    e.preventDefault();
    if (!selectedAppraisal) return;
    
    if (!managerReviewForm.overall_rating) {
      toast.error('Please provide an overall rating');
      return;
    }
    if (!managerReviewForm.strengths) {
      toast.error('Please describe employee strengths');
      return;
    }
    
    try {
      await axios.post(`${API}/appraisals/${selectedAppraisal.id}/manager-review`, managerReviewForm);
      toast.success('Manager review submitted successfully!');
      fetchAppraisals();
      fetchStats();
      setManagerReviewDialogOpen(false);
    } catch (error) {
      toast.error('Failed to submit review');
    }
  };

  const handleAcknowledge = async (appraisalId) => {
    try {
      await axios.post(`${API}/appraisals/${appraisalId}/acknowledge`);
      toast.success('Appraisal acknowledged');
      fetchAppraisals();
    } catch (error) {
      toast.error('Failed to acknowledge appraisal');
    }
  };

  const handleDeleteAppraisal = async (appraisalId) => {
    if (!window.confirm('Delete this appraisal?')) return;
    try {
      await axios.delete(`${API}/appraisals/${appraisalId}`);
      toast.success('Appraisal deleted');
      fetchAppraisals();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete appraisal');
    }
  };

  const handleSendReminder = async (appraisal) => {
    // Placeholder for reminder functionality
    toast.success(`Reminder sent to ${appraisal.employee_name}`);
  };

  const resetCycleForm = () => {
    setCycleForm({
      name: '',
      description: '',
      cycle_type: 'annual',
      start_date: '',
      end_date: '',
      review_period_start: '',
      review_period_end: '',
      rating_scale: 5,
      self_assessment_required: true,
      manager_review_required: true,
    });
    setEditingCycle(null);
  };

  const openSelfAssessment = (appraisal) => {
    setSelectedAppraisal(appraisal);
    const answers = (appraisal.questions || []).map(q => ({
      question_id: q.id,
      answer: '',
      rating: null,
    }));
    setSelfAssessmentForm({
      answers,
      overall_rating: '',
      achievements: '',
      challenges: '',
      goals: '',
    });
    setSelfAssessmentDialogOpen(true);
  };

  const openManagerReview = (appraisal) => {
    setSelectedAppraisal(appraisal);
    const answers = (appraisal.questions || []).map(q => ({
      question_id: q.id,
      answer: '',
      rating: null,
    }));
    setManagerReviewForm({
      answers,
      overall_rating: '',
      feedback: '',
      strengths: '',
      improvements: '',
      recommendations: '',
      final_comments: '',
    });
    setManagerReviewDialogOpen(true);
  };

  const renderStars = (rating, max = 5, size = 16, interactive = false, onChange = null) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(max)].map((_, i) => (
          <Star 
            key={i} 
            size={size} 
            className={`${i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={interactive && onChange ? () => onChange(i + 1) : undefined}
          />
        ))}
      </div>
    );
  };

  const getRatingLabel = (rating, max = 5) => {
    const percentage = (rating / max) * 100;
    if (percentage >= 90) return { label: 'Exceptional', color: 'text-emerald-600' };
    if (percentage >= 75) return { label: 'Exceeds Expectations', color: 'text-blue-600' };
    if (percentage >= 60) return { label: 'Meets Expectations', color: 'text-indigo-600' };
    if (percentage >= 40) return { label: 'Needs Improvement', color: 'text-amber-600' };
    return { label: 'Below Expectations', color: 'text-rose-600' };
  };

  const getProgressPercentage = () => {
    if (!stats || stats.total === 0) return 0;
    return Math.round((stats.completed / stats.total) * 100);
  };

  const selectAllEmployees = () => {
    setAssignForm({ ...assignForm, employee_ids: employees.map(e => e.id) });
  };

  const deselectAllEmployees = () => {
    setAssignForm({ ...assignForm, employee_ids: [] });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="appraisals-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isAdmin ? 'Appraisal Management' : 'My Appraisals'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isAdmin ? 'Manage performance appraisals and review cycles' : 'View and complete your performance appraisals'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchData}
            variant="outline"
            className="rounded-xl"
            data-testid="refresh-btn"
          >
            <RefreshCw size={18} />
          </Button>
          {isAdmin && (
            <Button 
              onClick={() => { resetCycleForm(); setCycleDialogOpen(true); }}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg"
              data-testid="create-cycle-btn"
            >
              <Plus size={18} className="mr-2" />
              New Cycle
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm">Total</p>
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
            </div>
            <ClipboardList size={24} className="text-indigo-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Pending</p>
              <p className="text-2xl font-bold">{stats?.pending || 0}</p>
            </div>
            <Clock size={24} className="text-amber-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Self Review</p>
              <p className="text-2xl font-bold">{stats?.self_assessment || 0}</p>
            </div>
            <FileText size={24} className="text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Manager Review</p>
              <p className="text-2xl font-bold">{stats?.manager_review || 0}</p>
            </div>
            <UserCheck size={24} className="text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Completed</p>
              <p className="text-2xl font-bold">{stats?.completed || 0}</p>
            </div>
            <CheckCircle2 size={24} className="text-emerald-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-sm">Avg Rating</p>
              <p className="text-2xl font-bold">{stats?.average_rating || '-'}</p>
            </div>
            <Award size={24} className="text-rose-200" />
          </div>
        </div>
      </div>

      {/* Progress Bar (Admin only) */}
      {isAdmin && stats?.total > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Overall Completion Progress</span>
            <span className="text-sm font-bold text-indigo-600">{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>{stats.completed} completed</span>
            <span>{stats.total - stats.completed} remaining</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
          <TabsTrigger value="appraisals" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <ClipboardList size={16} className="mr-2" />
            {isAdmin ? 'All Appraisals' : 'My Appraisals'}
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="cycles" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <Calendar size={16} className="mr-2" />
              Cycles
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <BarChart3 size={16} className="mr-2" />
              Analytics
            </TabsTrigger>
          )}
        </TabsList>

        {/* Appraisals Tab */}
        <TabsContent value="appraisals" className="mt-4">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by name, email, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 rounded-xl">
                  <Filter size={16} className="mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isAdmin && cycles.length > 0 && (
                <Select value={cycleFilter} onValueChange={setCycleFilter}>
                  <SelectTrigger className="w-full sm:w-48 rounded-xl">
                    <Calendar size={16} className="mr-2" />
                    <SelectValue placeholder="Filter by cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cycles</SelectItem>
                    {cycles.map((cycle) => (
                      <SelectItem key={cycle.id} value={cycle.id}>{cycle.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {filteredAppraisals.length === 0 ? (
              <div className="p-12 text-center">
                <ClipboardList size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500 mb-2">
                  {searchQuery || statusFilter !== 'all' || cycleFilter !== 'all'
                    ? 'No appraisals match your filters'
                    : isAdmin 
                      ? 'No appraisals created yet' 
                      : 'No appraisals assigned to you yet'
                  }
                </p>
                {isAdmin && !searchQuery && statusFilter === 'all' && (
                  <p className="text-sm text-slate-400">Create a cycle and assign employees to get started</p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredAppraisals.map((appraisal) => {
                  const statusConfig = STATUS_CONFIG[appraisal.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusConfig.icon;
                  const ratingInfo = appraisal.final_rating ? getRatingLabel(appraisal.final_rating, appraisal.rating_scale || 5) : null;
                  
                  return (
                    <div key={appraisal.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-bold text-slate-900 truncate">{appraisal.employee_name || 'Unknown Employee'}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
                              <StatusIcon size={12} />
                              {statusConfig.label}
                            </span>
                            {appraisal.final_rating && (
                              <span className="flex items-center gap-1 text-sm">
                                <Star size={14} className="fill-amber-400 text-amber-400" />
                                <span className="font-bold">{appraisal.final_rating}</span>
                                {ratingInfo && <span className={`text-xs ${ratingInfo.color}`}>({ratingInfo.label})</span>}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 font-medium">{appraisal.cycle_name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                            {appraisal.department && <span className="bg-slate-100 px-2 py-0.5 rounded">{appraisal.department}</span>}
                            <span>{appraisal.employee_email}</span>
                            {appraisal.acknowledged_by_employee && (
                              <span className="flex items-center gap-1 text-emerald-600">
                                <Check size={12} />
                                Acknowledged
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {/* Employee Actions */}
                          {!isAdmin && appraisal.status === 'pending' && (
                            <Button 
                              onClick={() => openSelfAssessment(appraisal)} 
                              size="sm" 
                              className="rounded-xl bg-blue-600 hover:bg-blue-700"
                              data-testid="start-self-assessment-btn"
                            >
                              <FileText size={14} className="mr-1" />
                              Start Self-Assessment
                            </Button>
                          )}
                          {!isAdmin && appraisal.status === 'completed' && !appraisal.acknowledged_by_employee && (
                            <Button 
                              onClick={() => handleAcknowledge(appraisal.id)} 
                              size="sm" 
                              className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                              data-testid="acknowledge-btn"
                            >
                              <Check size={14} className="mr-1" />
                              Acknowledge
                            </Button>
                          )}
                          
                          {/* Admin Actions */}
                          {isAdmin && appraisal.status === 'pending' && (
                            <Button 
                              onClick={() => handleSendReminder(appraisal)} 
                              size="sm" 
                              variant="outline"
                              className="rounded-xl"
                              title="Send reminder"
                            >
                              <Bell size={14} />
                            </Button>
                          )}
                          {isAdmin && appraisal.status === 'manager_review' && (
                            <Button 
                              onClick={() => openManagerReview(appraisal)} 
                              size="sm" 
                              className="rounded-xl bg-purple-600 hover:bg-purple-700"
                              data-testid="manager-review-btn"
                            >
                              <UserCheck size={14} className="mr-1" />
                              Review
                            </Button>
                          )}
                          
                          {/* View Button */}
                          <Button 
                            onClick={() => { setSelectedAppraisal(appraisal); setViewDialogOpen(true); }} 
                            size="sm" 
                            variant="outline" 
                            className="rounded-xl"
                            data-testid="view-appraisal-btn"
                          >
                            <Eye size={14} className="mr-1" />
                            View
                          </Button>
                          
                          {/* Delete (Admin only) */}
                          {isAdmin && (
                            <Button 
                              onClick={() => handleDeleteAppraisal(appraisal.id)} 
                              size="sm" 
                              variant="ghost" 
                              className="rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              data-testid="delete-appraisal-btn"
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Results count */}
          {filteredAppraisals.length > 0 && (
            <p className="text-sm text-slate-500 mt-2">
              Showing {filteredAppraisals.length} of {appraisals.length} appraisals
            </p>
          )}
        </TabsContent>

        {/* Cycles Tab (Admin only) */}
        {isAdmin && (
          <TabsContent value="cycles" className="mt-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {cycles.length === 0 ? (
                <div className="p-12 text-center">
                  <Calendar size={48} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 mb-2">No appraisal cycles created yet</p>
                  <p className="text-sm text-slate-400 mb-4">Create your first cycle to start assigning appraisals</p>
                  <Button 
                    onClick={() => setCycleDialogOpen(true)} 
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Create First Cycle
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {cycles.map((cycle) => {
                    const cycleType = CYCLE_TYPES.find(t => t.value === cycle.cycle_type);
                    const cycleAppraisals = appraisals.filter(a => a.cycle_id === cycle.id);
                    const completedCount = cycleAppraisals.filter(a => a.status === 'completed').length;
                    const cycleProgress = cycleAppraisals.length > 0 ? Math.round((completedCount / cycleAppraisals.length) * 100) : 0;
                    
                    return (
                      <div key={cycle.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4 className="font-bold text-slate-900">{cycle.name}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                cycle.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                cycle.status === 'closed' ? 'bg-slate-100 text-slate-600' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {cycle.status.charAt(0).toUpperCase() + cycle.status.slice(1)}
                              </span>
                              {cycleType && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cycleType.color}`}>
                                  {cycleType.label}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 line-clamp-1">{cycle.description || 'No description'}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {cycle.review_period_start} to {cycle.review_period_end}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users size={12} />
                                {cycleAppraisals.length} assigned
                              </span>
                              {cycleAppraisals.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <TrendingUp size={12} />
                                  {cycleProgress}% complete
                                </span>
                              )}
                            </div>
                            {/* Mini Progress Bar */}
                            {cycleAppraisals.length > 0 && (
                              <div className="w-full max-w-xs bg-slate-200 rounded-full h-1.5 mt-2">
                                <div 
                                  className="bg-indigo-500 h-1.5 rounded-full transition-all"
                                  style={{ width: `${cycleProgress}%` }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button 
                              onClick={() => { setSelectedCycle(cycle); setAssignDialogOpen(true); }} 
                              size="sm" 
                              className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
                              data-testid="assign-btn"
                            >
                              <Users size={14} className="mr-1" />
                              Assign
                            </Button>
                            <Button 
                              onClick={() => { setSelectedCycle(cycle); setBulkAssignDialogOpen(true); }} 
                              size="sm" 
                              variant="outline"
                              className="rounded-xl"
                              title="Assign to all employees"
                            >
                              <Users size={14} />
                              <ArrowRight size={12} />
                            </Button>
                            <Button 
                              onClick={() => { 
                                setEditingCycle(cycle);
                                setCycleForm({
                                  name: cycle.name,
                                  description: cycle.description || '',
                                  cycle_type: cycle.cycle_type,
                                  start_date: cycle.start_date,
                                  end_date: cycle.end_date,
                                  review_period_start: cycle.review_period_start,
                                  review_period_end: cycle.review_period_end,
                                  rating_scale: cycle.rating_scale || 5,
                                  self_assessment_required: cycle.self_assessment_required ?? true,
                                  manager_review_required: cycle.manager_review_required ?? true,
                                });
                                setCycleDialogOpen(true);
                              }} 
                              size="sm" 
                              variant="outline" 
                              className="rounded-xl"
                              data-testid="edit-cycle-btn"
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button 
                              onClick={() => handleDeleteCycle(cycle.id)} 
                              size="sm" 
                              variant="ghost" 
                              className="rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              data-testid="delete-cycle-btn"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {/* Analytics Tab (Admin only) */}
        {isAdmin && (
          <TabsContent value="analytics" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-indigo-600" />
                  Status Distribution
                </h3>
                <div className="space-y-3">
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                    const count = appraisals.filter(a => a.status === status).length;
                    const percentage = appraisals.length > 0 ? Math.round((count / appraisals.length) * 100) : 0;
                    const StatusIcon = config.icon;
                    
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.color}`}>
                          <StatusIcon size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-slate-700">{config.label}</span>
                            <span className="text-slate-500">{count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${config.color.replace('bg-', 'bg-').replace('-100', '-400')}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Star size={20} className="text-amber-500" />
                  Rating Distribution
                </h3>
                {stats?.completed > 0 ? (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
                      <p className="text-sm text-amber-700 mb-1">Average Rating</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-4xl font-black text-amber-600">{stats.average_rating}</span>
                        <span className="text-slate-400">/ 5</span>
                      </div>
                      {renderStars(stats.average_rating, 5, 24)}
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = appraisals.filter(a => Math.round(a.final_rating) === rating).length;
                        return (
                          <div key={rating} className="text-center p-2 bg-slate-50 rounded-lg">
                            <Star size={16} className="mx-auto mb-1 text-amber-400 fill-amber-400" />
                            <p className="text-lg font-bold text-slate-700">{count}</p>
                            <p className="text-xs text-slate-400">{rating} star</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Star size={32} className="mx-auto mb-2 opacity-30" />
                    <p>No completed reviews yet</p>
                  </div>
                )}
              </div>

              {/* Cycle Summary */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-2">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-indigo-600" />
                  Cycles Overview
                </h3>
                {cycles.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500 border-b border-slate-200">
                          <th className="pb-3 font-medium">Cycle</th>
                          <th className="pb-3 font-medium">Type</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium text-center">Assigned</th>
                          <th className="pb-3 font-medium text-center">Completed</th>
                          <th className="pb-3 font-medium text-center">Progress</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cycles.map((cycle) => {
                          const cycleAppraisals = appraisals.filter(a => a.cycle_id === cycle.id);
                          const completedCount = cycleAppraisals.filter(a => a.status === 'completed').length;
                          const progress = cycleAppraisals.length > 0 ? Math.round((completedCount / cycleAppraisals.length) * 100) : 0;
                          
                          return (
                            <tr key={cycle.id} className="hover:bg-slate-50">
                              <td className="py-3 font-medium text-slate-900">{cycle.name}</td>
                              <td className="py-3 capitalize">{cycle.cycle_type.replace('_', ' ')}</td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  cycle.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                  cycle.status === 'closed' ? 'bg-slate-100 text-slate-600' :
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {cycle.status}
                                </span>
                              </td>
                              <td className="py-3 text-center">{cycleAppraisals.length}</td>
                              <td className="py-3 text-center text-emerald-600 font-medium">{completedCount}</td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-slate-200 rounded-full h-2">
                                    <div 
                                      className="bg-indigo-500 h-2 rounded-full"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-slate-500 w-10">{progress}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                    <p>No cycles created yet</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Create/Edit Cycle Dialog */}
      <Dialog open={cycleDialogOpen} onOpenChange={setCycleDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Calendar className="text-indigo-600" size={24} />
              {editingCycle ? 'Edit Appraisal Cycle' : 'Create Appraisal Cycle'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCycle} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Cycle Name *</label>
              <Input 
                value={cycleForm.name} 
                onChange={(e) => setCycleForm({ ...cycleForm, name: e.target.value })} 
                className="rounded-xl" 
                placeholder="e.g. Q1 2025 Performance Review" 
                required 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Cycle Type</label>
              <Select value={cycleForm.cycle_type} onValueChange={(v) => setCycleForm({ ...cycleForm, cycle_type: v })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CYCLE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Cycle Start *</label>
                <Input 
                  type="date" 
                  value={cycleForm.start_date} 
                  onChange={(e) => setCycleForm({ ...cycleForm, start_date: e.target.value })} 
                  className="rounded-xl" 
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Cycle End *</label>
                <Input 
                  type="date" 
                  value={cycleForm.end_date} 
                  onChange={(e) => setCycleForm({ ...cycleForm, end_date: e.target.value })} 
                  className="rounded-xl" 
                  required 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Review Period Start *</label>
                <Input 
                  type="date" 
                  value={cycleForm.review_period_start} 
                  onChange={(e) => setCycleForm({ ...cycleForm, review_period_start: e.target.value })} 
                  className="rounded-xl" 
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Review Period End *</label>
                <Input 
                  type="date" 
                  value={cycleForm.review_period_end} 
                  onChange={(e) => setCycleForm({ ...cycleForm, review_period_end: e.target.value })} 
                  className="rounded-xl" 
                  required 
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Rating Scale</label>
              <Select value={String(cycleForm.rating_scale)} onValueChange={(v) => setCycleForm({ ...cycleForm, rating_scale: parseInt(v) })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">1-5 Scale</SelectItem>
                  <SelectItem value="10">1-10 Scale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
              <textarea 
                value={cycleForm.description} 
                onChange={(e) => setCycleForm({ ...cycleForm, description: e.target.value })} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none" 
                rows={2} 
                placeholder="Description of this appraisal cycle..." 
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1">
                {editingCycle ? 'Update Cycle' : 'Create Cycle'}
              </Button>
              <Button type="button" onClick={() => { setCycleDialogOpen(false); resetCycleForm(); }} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Appraisals Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Users className="text-indigo-600" size={24} />
              Assign Appraisals
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignAppraisals} className="space-y-4 mt-4">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <p className="text-sm font-medium text-indigo-900">Cycle: {selectedCycle?.name}</p>
              <p className="text-xs text-indigo-600 mt-1">
                Period: {selectedCycle?.review_period_start} to {selectedCycle?.review_period_end}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Select Employees *</label>
                <div className="flex gap-2">
                  <button type="button" onClick={selectAllEmployees} className="text-xs text-indigo-600 hover:underline">Select All</button>
                  <span className="text-slate-300">|</span>
                  <button type="button" onClick={deselectAllEmployees} className="text-xs text-slate-500 hover:underline">Clear</button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1">
                {employees.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No employees found</p>
                ) : (
                  employees.map((emp) => (
                    <label key={emp.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={assignForm.employee_ids.includes(emp.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssignForm({ ...assignForm, employee_ids: [...assignForm.employee_ids, emp.id] });
                          } else {
                            setAssignForm({ ...assignForm, employee_ids: assignForm.employee_ids.filter(id => id !== emp.id) });
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                      />
                      <span className="text-sm text-slate-700 flex-1">{emp.first_name} {emp.last_name}</span>
                      <span className="text-xs text-slate-400">{emp.department}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">{assignForm.employee_ids.length} employee(s) selected</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1" disabled={assignForm.employee_ids.length === 0}>
                Assign {assignForm.employee_ids.length} Employee(s)
              </Button>
              <Button type="button" onClick={() => setAssignDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Confirmation Dialog */}
      <Dialog open={bulkAssignDialogOpen} onOpenChange={setBulkAssignDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Users className="text-indigo-600" size={24} />
              Bulk Assign
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              This will assign appraisals to <span className="font-bold text-indigo-600">{employees.length} employees</span> for the cycle:
            </p>
            <p className="font-medium text-slate-900 mt-2">{selectedCycle?.name}</p>
            <p className="text-sm text-slate-500 mt-1">
              Employees who already have an appraisal for this cycle will be skipped.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleBulkAssign} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1">
              Assign to All
            </Button>
            <Button onClick={() => setBulkAssignDialogOpen(false)} variant="outline" className="rounded-xl">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Appraisal Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <ClipboardList className="text-indigo-600" size={24} />
              Appraisal Details
            </DialogTitle>
          </DialogHeader>
          {selectedAppraisal && (
            <div className="space-y-6 mt-4">
              {/* Header Info */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900">{selectedAppraisal.employee_name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[selectedAppraisal.status]?.color}`}>
                    {STATUS_CONFIG[selectedAppraisal.status]?.label}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{selectedAppraisal.cycle_name}</p>
                <p className="text-xs text-slate-400 mt-1">{selectedAppraisal.department} • {selectedAppraisal.employee_email}</p>
                
                {selectedAppraisal.final_rating && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-sm font-medium text-slate-700 mb-2">Final Rating</p>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold text-indigo-600">{selectedAppraisal.final_rating}</span>
                      <span className="text-slate-400">/ {selectedAppraisal.rating_scale || 5}</span>
                      {renderStars(selectedAppraisal.final_rating, selectedAppraisal.rating_scale || 5, 20)}
                    </div>
                    {getRatingLabel(selectedAppraisal.final_rating, selectedAppraisal.rating_scale || 5) && (
                      <p className={`text-sm font-medium mt-1 ${getRatingLabel(selectedAppraisal.final_rating, selectedAppraisal.rating_scale || 5).color}`}>
                        {getRatingLabel(selectedAppraisal.final_rating, selectedAppraisal.rating_scale || 5).label}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Self Assessment Section */}
              {selectedAppraisal.self_submitted_at && (
                <div className="p-4 border border-blue-200 rounded-xl bg-blue-50/50">
                  <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-3">
                    <FileText size={18} />
                    Self Assessment
                    <span className="text-xs text-blue-600 font-normal ml-auto">
                      {new Date(selectedAppraisal.self_submitted_at).toLocaleDateString()}
                    </span>
                  </h4>
                  {selectedAppraisal.self_overall_rating && (
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-sm text-blue-700">Self Rating:</span>
                      <span className="font-bold text-blue-900">{selectedAppraisal.self_overall_rating}</span>
                      {renderStars(selectedAppraisal.self_overall_rating, selectedAppraisal.rating_scale || 5, 14)}
                    </div>
                  )}
                  {selectedAppraisal.self_achievements && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-blue-700 mb-1">Achievements:</p>
                      <p className="text-sm text-slate-700 bg-white p-3 rounded-lg">{selectedAppraisal.self_achievements}</p>
                    </div>
                  )}
                  {selectedAppraisal.self_challenges && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-blue-700 mb-1">Challenges:</p>
                      <p className="text-sm text-slate-700 bg-white p-3 rounded-lg">{selectedAppraisal.self_challenges}</p>
                    </div>
                  )}
                  {selectedAppraisal.self_goals && (
                    <div>
                      <p className="text-xs font-medium text-blue-700 mb-1">Goals:</p>
                      <p className="text-sm text-slate-700 bg-white p-3 rounded-lg">{selectedAppraisal.self_goals}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Manager Review Section */}
              {selectedAppraisal.manager_submitted_at && (
                <div className="p-4 border border-purple-200 rounded-xl bg-purple-50/50">
                  <h4 className="font-bold text-purple-900 flex items-center gap-2 mb-3">
                    <UserCheck size={18} />
                    Manager Review
                    <span className="text-xs text-purple-600 font-normal ml-auto">
                      {selectedAppraisal.reviewer_name && `${selectedAppraisal.reviewer_name} • `}
                      {new Date(selectedAppraisal.manager_submitted_at).toLocaleDateString()}
                    </span>
                  </h4>
                  {selectedAppraisal.manager_overall_rating && (
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-sm text-purple-700">Manager Rating:</span>
                      <span className="font-bold text-purple-900">{selectedAppraisal.manager_overall_rating}</span>
                      {renderStars(selectedAppraisal.manager_overall_rating, selectedAppraisal.rating_scale || 5, 14)}
                    </div>
                  )}
                  {selectedAppraisal.manager_strengths && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-purple-700 mb-1">Strengths:</p>
                      <p className="text-sm text-slate-700 bg-white p-3 rounded-lg">{selectedAppraisal.manager_strengths}</p>
                    </div>
                  )}
                  {selectedAppraisal.manager_improvements && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-purple-700 mb-1">Areas for Improvement:</p>
                      <p className="text-sm text-slate-700 bg-white p-3 rounded-lg">{selectedAppraisal.manager_improvements}</p>
                    </div>
                  )}
                  {selectedAppraisal.manager_feedback && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-purple-700 mb-1">Feedback:</p>
                      <p className="text-sm text-slate-700 bg-white p-3 rounded-lg">{selectedAppraisal.manager_feedback}</p>
                    </div>
                  )}
                  {selectedAppraisal.manager_recommendations && (
                    <div>
                      <p className="text-xs font-medium text-purple-700 mb-1">Recommendations:</p>
                      <p className="text-sm text-slate-700 bg-white p-3 rounded-lg">{selectedAppraisal.manager_recommendations}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Acknowledgment Status */}
              {selectedAppraisal.status === 'completed' && (
                <div className={`p-3 rounded-xl text-center ${
                  selectedAppraisal.acknowledged_by_employee 
                    ? 'bg-emerald-50 border border-emerald-200' 
                    : 'bg-amber-50 border border-amber-200'
                }`}>
                  {selectedAppraisal.acknowledged_by_employee ? (
                    <p className="text-sm font-medium text-emerald-700 flex items-center justify-center gap-2">
                      <CheckCircle2 size={16} />
                      Acknowledged on {new Date(selectedAppraisal.acknowledged_at).toLocaleDateString()}
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-amber-700 flex items-center justify-center gap-2">
                      <Clock size={16} />
                      Pending employee acknowledgment
                    </p>
                  )}
                </div>
              )}

              {/* Status Timeline */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm font-medium text-slate-700 mb-3">Status Timeline</p>
                <div className="flex items-center justify-between">
                  {['pending', 'manager_review', 'completed'].map((status, idx) => {
                    const config = STATUS_CONFIG[status];
                    const StatusIcon = config.icon;
                    const isActive = ['pending', 'self_assessment'].includes(selectedAppraisal.status) ? idx === 0 :
                                     selectedAppraisal.status === 'manager_review' ? idx <= 1 :
                                     selectedAppraisal.status === 'completed' ? true : false;
                    
                    return (
                      <div key={status} className="flex flex-col items-center flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? config.color : 'bg-slate-200 text-slate-400'}`}>
                          <StatusIcon size={20} />
                        </div>
                        <p className={`text-xs mt-1 ${isActive ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                          {status === 'pending' ? 'Self Review' : status === 'manager_review' ? 'Manager' : 'Complete'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Self Assessment Dialog */}
      <Dialog open={selfAssessmentDialogOpen} onOpenChange={setSelfAssessmentDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="text-blue-600" size={24} />
              Self Assessment
            </DialogTitle>
          </DialogHeader>
          {selectedAppraisal && (
            <form onSubmit={handleSubmitSelfAssessment} className="space-y-6 mt-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <p className="text-sm font-medium text-blue-900">{selectedAppraisal.cycle_name}</p>
                <p className="text-xs text-blue-600 mt-1">Complete your self-assessment honestly and thoroughly</p>
              </div>

              {/* Questions */}
              {selectedAppraisal.questions?.map((question, idx) => (
                <div key={question.id} className="p-4 border border-slate-200 rounded-xl">
                  <p className="text-sm font-medium text-slate-700 mb-3">
                    {idx + 1}. {question.question}
                    {question.required && <span className="text-rose-500 ml-1">*</span>}
                  </p>
                  {question.type === 'rating' ? (
                    <div className="flex gap-2">
                      {[...Array(selectedAppraisal.rating_scale || 5)].map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            const newAnswers = [...selfAssessmentForm.answers];
                            newAnswers[idx] = { ...newAnswers[idx], question_id: question.id, rating: i + 1 };
                            setSelfAssessmentForm({ ...selfAssessmentForm, answers: newAnswers });
                          }}
                          className={`w-10 h-10 rounded-lg border-2 transition-all font-medium ${
                            selfAssessmentForm.answers[idx]?.rating === i + 1
                              ? 'border-blue-500 bg-blue-100 text-blue-700'
                              : 'border-slate-200 hover:border-blue-300 text-slate-600'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      value={selfAssessmentForm.answers[idx]?.answer || ''}
                      onChange={(e) => {
                        const newAnswers = [...selfAssessmentForm.answers];
                        newAnswers[idx] = { ...newAnswers[idx], question_id: question.id, answer: e.target.value };
                        setSelfAssessmentForm({ ...selfAssessmentForm, answers: newAnswers });
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
                      rows={3}
                      placeholder="Your answer..."
                      required={question.required}
                    />
                  )}
                </div>
              ))}

              {/* Overall Rating */}
              <div className="p-4 border-2 border-blue-200 rounded-xl bg-blue-50/30">
                <p className="text-sm font-bold text-slate-700 mb-3">Overall Self Rating *</p>
                <div className="flex gap-2 flex-wrap">
                  {[...Array(selectedAppraisal.rating_scale || 5)].map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelfAssessmentForm({ ...selfAssessmentForm, overall_rating: i + 1 })}
                      className={`w-12 h-12 rounded-xl border-2 transition-all font-bold ${
                        selfAssessmentForm.overall_rating === i + 1
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-slate-200 hover:border-blue-300 text-slate-600'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                {selfAssessmentForm.overall_rating && (
                  <p className={`text-sm mt-2 ${getRatingLabel(selfAssessmentForm.overall_rating, selectedAppraisal.rating_scale || 5).color}`}>
                    {getRatingLabel(selfAssessmentForm.overall_rating, selectedAppraisal.rating_scale || 5).label}
                  </p>
                )}
              </div>

              {/* Achievements */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Key Achievements *</label>
                <textarea
                  value={selfAssessmentForm.achievements}
                  onChange={(e) => setSelfAssessmentForm({ ...selfAssessmentForm, achievements: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
                  rows={3}
                  placeholder="List your key achievements this period..."
                  required
                />
              </div>

              {/* Challenges */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Challenges Faced</label>
                <textarea
                  value={selfAssessmentForm.challenges}
                  onChange={(e) => setSelfAssessmentForm({ ...selfAssessmentForm, challenges: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
                  rows={2}
                  placeholder="Describe any challenges you faced..."
                />
              </div>

              {/* Goals */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Goals for Next Period *</label>
                <textarea
                  value={selfAssessmentForm.goals}
                  onChange={(e) => setSelfAssessmentForm({ ...selfAssessmentForm, goals: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
                  rows={2}
                  placeholder="What are your goals for the next period..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-700 flex-1">
                  <Send size={16} className="mr-2" />
                  Submit Self Assessment
                </Button>
                <Button type="button" onClick={() => setSelfAssessmentDialogOpen(false)} variant="outline" className="rounded-xl">
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Manager Review Dialog */}
      <Dialog open={managerReviewDialogOpen} onOpenChange={setManagerReviewDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <UserCheck className="text-purple-600" size={24} />
              Manager Review
            </DialogTitle>
          </DialogHeader>
          {selectedAppraisal && (
            <form onSubmit={handleSubmitManagerReview} className="space-y-6 mt-4">
              <div className="p-3 bg-purple-50 rounded-xl">
                <p className="text-sm font-medium text-purple-900">Reviewing: {selectedAppraisal.employee_name}</p>
                <p className="text-xs text-purple-600">{selectedAppraisal.cycle_name}</p>
              </div>

              {/* Show Self Assessment Summary */}
              {selectedAppraisal.self_submitted_at && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <FileText size={16} />
                    Employee's Self Assessment
                  </h4>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-blue-700">Self Rating:</span>
                    <span className="font-bold text-blue-900">{selectedAppraisal.self_overall_rating}</span>
                    {renderStars(selectedAppraisal.self_overall_rating, selectedAppraisal.rating_scale || 5, 14)}
                  </div>
                  {selectedAppraisal.self_achievements && (
                    <div className="mt-2">
                      <p className="text-xs text-blue-600 font-medium">Achievements:</p>
                      <p className="text-sm text-slate-700 bg-white p-2 rounded mt-1">{selectedAppraisal.self_achievements}</p>
                    </div>
                  )}
                  {selectedAppraisal.self_goals && (
                    <div className="mt-2">
                      <p className="text-xs text-blue-600 font-medium">Goals:</p>
                      <p className="text-sm text-slate-700 bg-white p-2 rounded mt-1">{selectedAppraisal.self_goals}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Manager Rating */}
              <div className="p-4 border-2 border-purple-200 rounded-xl bg-purple-50/30">
                <p className="text-sm font-bold text-slate-700 mb-3">Your Rating for this Employee *</p>
                <div className="flex gap-2 flex-wrap">
                  {[...Array(selectedAppraisal.rating_scale || 5)].map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setManagerReviewForm({ ...managerReviewForm, overall_rating: i + 1 })}
                      className={`w-12 h-12 rounded-xl border-2 transition-all font-bold ${
                        managerReviewForm.overall_rating === i + 1
                          ? 'border-purple-500 bg-purple-500 text-white'
                          : 'border-slate-200 hover:border-purple-300 text-slate-600'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                {managerReviewForm.overall_rating && (
                  <p className={`text-sm mt-2 ${getRatingLabel(managerReviewForm.overall_rating, selectedAppraisal.rating_scale || 5).color}`}>
                    {getRatingLabel(managerReviewForm.overall_rating, selectedAppraisal.rating_scale || 5).label}
                  </p>
                )}
              </div>

              {/* Strengths */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Employee Strengths *</label>
                <textarea
                  value={managerReviewForm.strengths}
                  onChange={(e) => setManagerReviewForm({ ...managerReviewForm, strengths: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none resize-none"
                  rows={2}
                  placeholder="What are this employee's strengths..."
                  required
                />
              </div>

              {/* Areas for Improvement */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Areas for Improvement *</label>
                <textarea
                  value={managerReviewForm.improvements}
                  onChange={(e) => setManagerReviewForm({ ...managerReviewForm, improvements: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none resize-none"
                  rows={2}
                  placeholder="Areas where the employee can improve..."
                  required
                />
              </div>

              {/* Feedback */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">General Feedback</label>
                <textarea
                  value={managerReviewForm.feedback}
                  onChange={(e) => setManagerReviewForm({ ...managerReviewForm, feedback: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none resize-none"
                  rows={2}
                  placeholder="Additional feedback..."
                />
              </div>

              {/* Recommendations */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Recommendations</label>
                <textarea
                  value={managerReviewForm.recommendations}
                  onChange={(e) => setManagerReviewForm({ ...managerReviewForm, recommendations: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none resize-none"
                  rows={2}
                  placeholder="Training, promotion, or other recommendations..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="rounded-xl bg-purple-600 hover:bg-purple-700 flex-1">
                  <Send size={16} className="mr-2" />
                  Submit Review
                </Button>
                <Button type="button" onClick={() => setManagerReviewDialogOpen(false)} variant="outline" className="rounded-xl">
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Appraisals;
