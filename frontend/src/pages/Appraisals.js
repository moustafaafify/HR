import React, { useEffect, useState } from 'react';
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
  ChevronRight
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CYCLE_TYPES = [
  { value: 'annual', label: 'Annual Review' },
  { value: 'quarterly', label: 'Quarterly Review' },
  { value: 'mid_year', label: 'Mid-Year Review' },
  { value: 'probation', label: 'Probation Review' },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  self_assessment: { label: 'Self Assessment', color: 'bg-blue-100 text-blue-700', icon: FileText },
  manager_review: { label: 'Manager Review', color: 'bg-purple-100 text-purple-700', icon: UserCheck },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: Check },
  rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-700', icon: AlertCircle },
};

const Appraisals = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('appraisals');
  const [cycles, setCycles] = useState([]);
  const [appraisals, setAppraisals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Dialogs
  const [cycleDialogOpen, setCycleDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selfAssessmentDialogOpen, setSelfAssessmentDialogOpen] = useState(false);
  const [managerReviewDialogOpen, setManagerReviewDialogOpen] = useState(false);
  
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
  };

  const fetchCycles = async () => {
    try {
      const response = await axios.get(`${API}/appraisal-cycles`);
      setCycles(response.data);
    } catch (error) {
      console.error('Failed to fetch cycles:', error);
    }
  };

  const fetchAppraisals = async () => {
    try {
      const endpoint = isAdmin ? `${API}/appraisals` : `${API}/appraisals/my`;
      const response = await axios.get(endpoint);
      setAppraisals(response.data);
    } catch (error) {
      console.error('Failed to fetch appraisals:', error);
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

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/appraisals/stats/summary`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

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
      setAssignDialogOpen(false);
      setAssignForm({ employee_ids: [], reviewer_id: '' });
    } catch (error) {
      toast.error('Failed to assign appraisals');
    }
  };

  const handleSubmitSelfAssessment = async (e) => {
    e.preventDefault();
    if (!selectedAppraisal) return;
    try {
      await axios.post(`${API}/appraisals/${selectedAppraisal.id}/self-assessment`, selfAssessmentForm);
      toast.success('Self-assessment submitted');
      fetchAppraisals();
      setSelfAssessmentDialogOpen(false);
    } catch (error) {
      toast.error('Failed to submit self-assessment');
    }
  };

  const handleSubmitManagerReview = async (e) => {
    e.preventDefault();
    if (!selectedAppraisal) return;
    try {
      await axios.post(`${API}/appraisals/${selectedAppraisal.id}/manager-review`, managerReviewForm);
      toast.success('Manager review submitted');
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

  const renderStars = (rating, max = 5, size = 16) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(max)].map((_, i) => (
          <Star 
            key={i} 
            size={size} 
            className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'} 
          />
        ))}
      </div>
    );
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
            <Check size={24} className="text-emerald-200" />
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
        </TabsList>

        {/* Appraisals Tab */}
        <TabsContent value="appraisals" className="mt-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {appraisals.length === 0 ? (
              <div className="p-12 text-center">
                <ClipboardList size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">
                  {isAdmin ? 'No appraisals created yet. Create a cycle and assign employees.' : 'No appraisals assigned to you yet.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {appraisals.map((appraisal) => {
                  const statusConfig = STATUS_CONFIG[appraisal.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div key={appraisal.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-bold text-slate-900">{appraisal.employee_name || 'Unknown Employee'}</h4>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
                              <StatusIcon size={12} />
                              {statusConfig.label}
                            </span>
                            {appraisal.final_rating && (
                              <span className="flex items-center gap-1 text-sm text-amber-600">
                                <Star size={14} className="fill-amber-400 text-amber-400" />
                                {appraisal.final_rating}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">{appraisal.cycle_name}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {appraisal.department && `${appraisal.department} • `}
                            {appraisal.employee_email}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {/* Employee Actions */}
                          {!isAdmin && appraisal.status === 'pending' && (
                            <Button 
                              onClick={() => openSelfAssessment(appraisal)} 
                              size="sm" 
                              className="rounded-lg bg-blue-600 hover:bg-blue-700"
                            >
                              <FileText size={14} className="mr-1" />
                              Start Self-Assessment
                            </Button>
                          )}
                          {!isAdmin && appraisal.status === 'completed' && !appraisal.acknowledged_by_employee && (
                            <Button 
                              onClick={() => handleAcknowledge(appraisal.id)} 
                              size="sm" 
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-700"
                            >
                              <Check size={14} className="mr-1" />
                              Acknowledge
                            </Button>
                          )}
                          
                          {/* Admin Actions */}
                          {isAdmin && appraisal.status === 'manager_review' && (
                            <Button 
                              onClick={() => openManagerReview(appraisal)} 
                              size="sm" 
                              className="rounded-lg bg-purple-600 hover:bg-purple-700"
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
                            className="rounded-lg"
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
                              className="rounded-lg text-rose-600"
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
        </TabsContent>

        {/* Cycles Tab (Admin only) */}
        {isAdmin && (
          <TabsContent value="cycles" className="mt-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {cycles.length === 0 ? (
                <div className="p-12 text-center">
                  <Calendar size={48} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">No appraisal cycles created yet</p>
                  <Button 
                    onClick={() => setCycleDialogOpen(true)} 
                    variant="outline" 
                    className="mt-4 rounded-xl"
                  >
                    <Plus size={16} className="mr-2" />
                    Create First Cycle
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {cycles.map((cycle) => (
                    <div key={cycle.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-bold text-slate-900">{cycle.name}</h4>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              cycle.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                              cycle.status === 'closed' ? 'bg-slate-100 text-slate-600' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {cycle.status.charAt(0).toUpperCase() + cycle.status.slice(1)}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                              {CYCLE_TYPES.find(t => t.value === cycle.cycle_type)?.label || cycle.cycle_type}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500">{cycle.description || 'No description'}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Period: {cycle.review_period_start} to {cycle.review_period_end}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => { setSelectedCycle(cycle); setAssignDialogOpen(true); }} 
                            size="sm" 
                            className="rounded-lg bg-indigo-600 hover:bg-indigo-700"
                          >
                            <Users size={14} className="mr-1" />
                            Assign
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
                            className="rounded-lg"
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button 
                            onClick={() => handleDeleteCycle(cycle.id)} 
                            size="sm" 
                            variant="ghost" 
                            className="rounded-lg text-rose-600"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Start Date *</label>
                <Input 
                  type="date" 
                  value={cycleForm.start_date} 
                  onChange={(e) => setCycleForm({ ...cycleForm, start_date: e.target.value })} 
                  className="rounded-xl" 
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">End Date *</label>
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
              <label className="text-sm font-medium text-slate-700 mb-2 block">Select Employees *</label>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1">
                {employees.map((emp) => (
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
                    <span className="text-sm text-slate-700">{emp.first_name} {emp.last_name}</span>
                    <span className="text-xs text-slate-400">{emp.department}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1">{assignForm.employee_ids.length} employee(s) selected</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1">
                Assign {assignForm.employee_ids.length} Employee(s)
              </Button>
              <Button type="button" onClick={() => setAssignDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
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
                  </div>
                )}
              </div>

              {/* Self Assessment Section */}
              {selectedAppraisal.self_submitted_at && (
                <div className="p-4 border border-blue-200 rounded-xl bg-blue-50/50">
                  <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-3">
                    <FileText size={18} />
                    Self Assessment
                    <span className="text-xs text-blue-600 font-normal">
                      Submitted: {new Date(selectedAppraisal.self_submitted_at).toLocaleDateString()}
                    </span>
                  </h4>
                  {selectedAppraisal.self_overall_rating && (
                    <div className="mb-3">
                      <p className="text-sm text-blue-700">Self Rating: <span className="font-bold">{selectedAppraisal.self_overall_rating}</span></p>
                    </div>
                  )}
                  {selectedAppraisal.self_achievements && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-blue-700 mb-1">Achievements:</p>
                      <p className="text-sm text-slate-700 bg-white p-2 rounded-lg">{selectedAppraisal.self_achievements}</p>
                    </div>
                  )}
                  {selectedAppraisal.self_challenges && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-blue-700 mb-1">Challenges:</p>
                      <p className="text-sm text-slate-700 bg-white p-2 rounded-lg">{selectedAppraisal.self_challenges}</p>
                    </div>
                  )}
                  {selectedAppraisal.self_goals && (
                    <div>
                      <p className="text-xs font-medium text-blue-700 mb-1">Goals:</p>
                      <p className="text-sm text-slate-700 bg-white p-2 rounded-lg">{selectedAppraisal.self_goals}</p>
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
                    <span className="text-xs text-purple-600 font-normal">
                      By: {selectedAppraisal.reviewer_name || 'Manager'} • {new Date(selectedAppraisal.manager_submitted_at).toLocaleDateString()}
                    </span>
                  </h4>
                  {selectedAppraisal.manager_overall_rating && (
                    <div className="mb-3">
                      <p className="text-sm text-purple-700">Manager Rating: <span className="font-bold">{selectedAppraisal.manager_overall_rating}</span></p>
                    </div>
                  )}
                  {selectedAppraisal.manager_strengths && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-purple-700 mb-1">Strengths:</p>
                      <p className="text-sm text-slate-700 bg-white p-2 rounded-lg">{selectedAppraisal.manager_strengths}</p>
                    </div>
                  )}
                  {selectedAppraisal.manager_improvements && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-purple-700 mb-1">Areas for Improvement:</p>
                      <p className="text-sm text-slate-700 bg-white p-2 rounded-lg">{selectedAppraisal.manager_improvements}</p>
                    </div>
                  )}
                  {selectedAppraisal.manager_feedback && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-purple-700 mb-1">Feedback:</p>
                      <p className="text-sm text-slate-700 bg-white p-2 rounded-lg">{selectedAppraisal.manager_feedback}</p>
                    </div>
                  )}
                  {selectedAppraisal.manager_recommendations && (
                    <div>
                      <p className="text-xs font-medium text-purple-700 mb-1">Recommendations:</p>
                      <p className="text-sm text-slate-700 bg-white p-2 rounded-lg">{selectedAppraisal.manager_recommendations}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Acknowledgment Status */}
              {selectedAppraisal.status === 'completed' && (
                <div className={`p-3 rounded-xl text-center ${
                  selectedAppraisal.acknowledged_by_employee 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {selectedAppraisal.acknowledged_by_employee ? (
                    <p className="text-sm font-medium flex items-center justify-center gap-2">
                      <Check size={16} />
                      Acknowledged on {new Date(selectedAppraisal.acknowledged_at).toLocaleDateString()}
                    </p>
                  ) : (
                    <p className="text-sm font-medium">Pending employee acknowledgment</p>
                  )}
                </div>
              )}
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
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${
                            selfAssessmentForm.answers[idx]?.rating === i + 1
                              ? 'border-indigo-500 bg-indigo-100 text-indigo-700 font-bold'
                              : 'border-slate-200 hover:border-indigo-300'
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
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                      rows={3}
                      placeholder="Your answer..."
                      required={question.required}
                    />
                  )}
                </div>
              ))}

              {/* Overall Rating */}
              <div className="p-4 border border-slate-200 rounded-xl">
                <p className="text-sm font-medium text-slate-700 mb-3">Overall Self Rating *</p>
                <div className="flex gap-2">
                  {[...Array(selectedAppraisal.rating_scale || 5)].map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelfAssessmentForm({ ...selfAssessmentForm, overall_rating: i + 1 })}
                      className={`w-12 h-12 rounded-xl border-2 transition-all ${
                        selfAssessmentForm.overall_rating === i + 1
                          ? 'border-indigo-500 bg-indigo-100 text-indigo-700 font-bold'
                          : 'border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Key Achievements *</label>
                <textarea
                  value={selfAssessmentForm.achievements}
                  onChange={(e) => setSelfAssessmentForm({ ...selfAssessmentForm, achievements: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
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
                  <h4 className="text-sm font-bold text-blue-900 mb-2">Employee's Self Assessment</h4>
                  <p className="text-sm text-blue-700">Self Rating: <span className="font-bold">{selectedAppraisal.self_overall_rating}</span></p>
                  {selectedAppraisal.self_achievements && (
                    <div className="mt-2">
                      <p className="text-xs text-blue-600">Achievements:</p>
                      <p className="text-sm text-slate-700 mt-1">{selectedAppraisal.self_achievements}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Manager Rating */}
              <div className="p-4 border border-slate-200 rounded-xl">
                <p className="text-sm font-medium text-slate-700 mb-3">Your Rating for this Employee *</p>
                <div className="flex gap-2">
                  {[...Array(selectedAppraisal.rating_scale || 5)].map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setManagerReviewForm({ ...managerReviewForm, overall_rating: i + 1 })}
                      className={`w-12 h-12 rounded-xl border-2 transition-all ${
                        managerReviewForm.overall_rating === i + 1
                          ? 'border-purple-500 bg-purple-100 text-purple-700 font-bold'
                          : 'border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
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
