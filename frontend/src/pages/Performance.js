import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Plus, Star, TrendingUp, Clock, CheckCircle2, Users, Target,
  Edit2, Trash2, Eye, ChevronRight, Award, BarChart3, Calendar,
  MessageSquare, User, Briefcase, X, Send, FileText
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const REVIEW_TYPES = [
  { value: 'annual', label: 'Annual Review', icon: Calendar },
  { value: 'quarterly', label: 'Quarterly Review', icon: BarChart3 },
  { value: 'probation', label: 'Probation Review', icon: Clock },
  { value: 'project', label: 'Project Review', icon: Target },
  { value: '360', label: '360° Feedback', icon: Users }
];

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'slate', icon: FileText },
  pending_self_assessment: { label: 'Awaiting Self-Assessment', color: 'amber', icon: Clock },
  pending_review: { label: 'Pending Review', color: 'blue', icon: Eye },
  completed: { label: 'Completed', color: 'emerald', icon: CheckCircle2 }
};

const Performance = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({ total_reviews: 0, completed_reviews: 0, pending_reviews: 0, average_rating: 0 });
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selfAssessmentDialogOpen, setSelfAssessmentDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';
  const isManager = user?.role === 'branch_manager' || isAdmin;

  const [formData, setFormData] = useState({
    employee_id: '',
    reviewer_id: '',
    period: '',
    review_type: 'annual',
    goals: [],
    status: 'draft'
  });

  const [selfAssessmentForm, setSelfAssessmentForm] = useState({
    self_assessment: '',
    self_rating: '',
    achievements: '',
    challenges: ''
  });

  const [completeForm, setCompleteForm] = useState({
    communication_rating: '',
    teamwork_rating: '',
    technical_skills_rating: '',
    problem_solving_rating: '',
    leadership_rating: '',
    punctuality_rating: '',
    strengths: '',
    areas_for_improvement: '',
    feedback: '',
    recommendations: '',
    next_review_date: ''
  });

  useEffect(() => {
    fetchReviews();
    fetchEmployees();
    if (isManager) {
      fetchStats();
    }
  }, []);

  useEffect(() => {
    if (employees.length > 0 && user) {
      const emp = employees.find(e => e.personal_email === user.email || e.work_email === user.email);
      setCurrentEmployee(emp);
    }
  }, [employees, user]);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API}/reviews`);
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
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
      const response = await axios.get(`${API}/reviews/stats/summary`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingReview) {
        await axios.put(`${API}/reviews/${editingReview.id}`, formData);
        toast.success('Review updated successfully');
      } else {
        await axios.post(`${API}/reviews`, formData);
        toast.success('Performance review created successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchReviews();
      fetchStats();
    } catch (error) {
      toast.error('Failed to save review');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await axios.delete(`${API}/reviews/${id}`);
        toast.success('Review deleted');
        fetchReviews();
        fetchStats();
      } catch (error) {
        toast.error('Failed to delete review');
      }
    }
  };

  const handleSubmitSelfAssessment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/reviews/${selectedReview.id}/submit-self-assessment`, {
        ...selfAssessmentForm,
        self_rating: parseFloat(selfAssessmentForm.self_rating)
      });
      toast.success('Self-assessment submitted successfully');
      setSelfAssessmentDialogOpen(false);
      setSelfAssessmentForm({ self_assessment: '', self_rating: '', achievements: '', challenges: '' });
      fetchReviews();
    } catch (error) {
      toast.error('Failed to submit self-assessment');
    }
  };

  const handleCompleteReview = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...completeForm,
        communication_rating: parseFloat(completeForm.communication_rating) || null,
        teamwork_rating: parseFloat(completeForm.teamwork_rating) || null,
        technical_skills_rating: parseFloat(completeForm.technical_skills_rating) || null,
        problem_solving_rating: parseFloat(completeForm.problem_solving_rating) || null,
        leadership_rating: parseFloat(completeForm.leadership_rating) || null,
        punctuality_rating: parseFloat(completeForm.punctuality_rating) || null
      };
      await axios.post(`${API}/reviews/${selectedReview.id}/complete`, data);
      toast.success('Review completed successfully');
      setCompleteDialogOpen(false);
      resetCompleteForm();
      fetchReviews();
      fetchStats();
    } catch (error) {
      toast.error('Failed to complete review');
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      reviewer_id: '',
      period: '',
      review_type: 'annual',
      goals: [],
      status: 'draft'
    });
    setEditingReview(null);
  };

  const resetCompleteForm = () => {
    setCompleteForm({
      communication_rating: '',
      teamwork_rating: '',
      technical_skills_rating: '',
      problem_solving_rating: '',
      leadership_rating: '',
      punctuality_rating: '',
      strengths: '',
      areas_for_improvement: '',
      feedback: '',
      recommendations: '',
      next_review_date: ''
    });
  };

  const openEditDialog = (review) => {
    setEditingReview(review);
    setFormData({
      employee_id: review.employee_id,
      reviewer_id: review.reviewer_id,
      period: review.period,
      review_type: review.review_type || 'annual',
      goals: review.goals || [],
      status: review.status || 'draft'
    });
    setDialogOpen(true);
  };

  const openSelfAssessmentDialog = (review) => {
    setSelectedReview(review);
    setSelfAssessmentForm({
      self_assessment: review.self_assessment || '',
      self_rating: review.self_rating?.toString() || '',
      achievements: review.achievements || '',
      challenges: review.challenges || ''
    });
    setSelfAssessmentDialogOpen(true);
  };

  const openCompleteDialog = (review) => {
    setSelectedReview(review);
    setCompleteForm({
      communication_rating: review.communication_rating?.toString() || '',
      teamwork_rating: review.teamwork_rating?.toString() || '',
      technical_skills_rating: review.technical_skills_rating?.toString() || '',
      problem_solving_rating: review.problem_solving_rating?.toString() || '',
      leadership_rating: review.leadership_rating?.toString() || '',
      punctuality_rating: review.punctuality_rating?.toString() || '',
      strengths: review.strengths || '',
      areas_for_improvement: review.areas_for_improvement || '',
      feedback: review.feedback || '',
      recommendations: review.recommendations || '',
      next_review_date: review.next_review_date || ''
    });
    setCompleteDialogOpen(true);
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.full_name : '-';
  };

  const getEmployeeAvatar = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.full_name?.charAt(0)?.toUpperCase() : '?';
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={16} 
          className={i < fullStars ? 'text-amber-400 fill-amber-400' : 'text-slate-300'} 
        />
      );
    }
    return stars;
  };

  // Filter reviews based on role and filters
  const filteredReviews = reviews.filter(review => {
    // For non-managers, only show their own reviews
    if (!isManager && currentEmployee) {
      if (review.employee_id !== currentEmployee.id) return false;
    }
    if (filterStatus !== 'all' && review.status !== filterStatus) return false;
    if (filterType !== 'all' && review.review_type !== filterType) return false;
    return true;
  });

  // My reviews (for employees)
  const myReviews = currentEmployee ? reviews.filter(r => r.employee_id === currentEmployee.id) : [];
  const pendingSelfAssessment = myReviews.filter(r => r.status === 'pending_self_assessment');

  return (
    <div data-testid="performance-page" className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Performance Reviews
          </h1>
          <p className="text-slate-500 mt-1 text-sm lg:text-base">Track and manage employee performance</p>
        </div>
        {isManager && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => { resetForm(); setDialogOpen(true); }}
                data-testid="add-review-button"
                className="rounded-xl bg-indigo-950 text-white hover:bg-indigo-900 shadow-lg"
              >
                <Plus size={20} className="mr-2" />
                New Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingReview ? 'Edit Review' : 'Create Performance Review'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4" data-testid="review-form">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Employee</label>
                  <Select 
                    value={formData.employee_id} 
                    onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
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
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Reviewer</label>
                  <Select 
                    value={formData.reviewer_id} 
                    onValueChange={(value) => setFormData({ ...formData, reviewer_id: value })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select Reviewer" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Review Type</label>
                    <Select 
                      value={formData.review_type} 
                      onValueChange={(value) => setFormData({ ...formData, review_type: value })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REVIEW_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Period</label>
                    <input
                      type="text"
                      placeholder="e.g., Q1 2026"
                      value={formData.period}
                      onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Status</label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending_self_assessment">Send for Self-Assessment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="rounded-xl bg-indigo-950 hover:bg-indigo-900 flex-1">
                    {editingReview ? 'Update' : 'Create Review'}
                  </Button>
                  <Button type="button" onClick={() => setDialogOpen(false)} variant="outline" className="rounded-xl">
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards - Admin Only */}
      {isManager && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="bg-white rounded-xl lg:rounded-2xl border border-slate-200 p-4 lg:p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs lg:text-sm text-slate-500 truncate">Total Reviews</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{stats.total_reviews}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <FileText className="text-indigo-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Completed</p>
                <p className="text-3xl font-black text-emerald-600 mt-1">{stats.completed_reviews}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="text-emerald-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="text-3xl font-black text-amber-600 mt-1">{stats.pending_reviews}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="text-amber-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Avg. Rating</p>
                <p className="text-3xl font-black text-indigo-600 mt-1">{stats.average_rating || '-'}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Star className="text-indigo-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Self-Assessment Alert */}
      {currentEmployee && pendingSelfAssessment.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="text-amber-600" size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-800">Self-Assessment Required</p>
            <p className="text-sm text-amber-600">You have {pendingSelfAssessment.length} review(s) awaiting your self-assessment</p>
          </div>
          <Button 
            onClick={() => openSelfAssessmentDialog(pendingSelfAssessment[0])}
            className="rounded-xl bg-amber-600 hover:bg-amber-700"
          >
            Complete Now
          </Button>
        </div>
      )}

      {/* Filters */}
      {isManager && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-4 items-center">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48 rounded-xl">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_self_assessment">Awaiting Self-Assessment</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48 rounded-xl">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {REVIEW_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Reviews List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">{isManager ? 'All Reviews' : 'My Reviews'}</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {filteredReviews.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <FileText size={40} className="mx-auto mb-3 text-slate-300" />
              <p>No reviews found</p>
            </div>
          ) : (
            filteredReviews.map((review) => {
              const statusConfig = STATUS_CONFIG[review.status] || STATUS_CONFIG.draft;
              const StatusIcon = statusConfig.icon;
              return (
                <div key={review.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {getEmployeeAvatar(review.employee_id)}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{getEmployeeName(review.employee_id)}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${statusConfig.color}-100 text-${statusConfig.color}-700`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Briefcase size={14} />
                          {REVIEW_TYPES.find(t => t.value === review.review_type)?.label || 'Annual Review'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {review.period}
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={14} />
                          Reviewer: {getEmployeeName(review.reviewer_id)}
                        </span>
                      </div>
                    </div>

                    {/* Rating */}
                    {review.overall_rating && (
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          {renderStars(review.overall_rating)}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{review.overall_rating?.toFixed(1)}/5</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Employee can submit self-assessment */}
                      {!isManager && review.status === 'pending_self_assessment' && review.employee_id === currentEmployee?.id && (
                        <Button 
                          size="sm" 
                          onClick={() => openSelfAssessmentDialog(review)}
                          className="rounded-lg bg-amber-600 hover:bg-amber-700"
                        >
                          <Send size={16} className="mr-1" />
                          Self-Assess
                        </Button>
                      )}
                      
                      {/* Manager can complete review */}
                      {isManager && review.status === 'pending_review' && (
                        <Button 
                          size="sm" 
                          onClick={() => openCompleteDialog(review)}
                          className="rounded-lg bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle2 size={16} className="mr-1" />
                          Complete
                        </Button>
                      )}

                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => { setSelectedReview(review); setViewDialogOpen(true); }}
                        className="rounded-lg"
                      >
                        <Eye size={16} />
                      </Button>
                      
                      {isManager && (
                        <>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => openEditDialog(review)}
                            className="rounded-lg"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDelete(review.id)}
                            className="rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* View Review Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Performance Review Details</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                  {getEmployeeAvatar(selectedReview.employee_id)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{getEmployeeName(selectedReview.employee_id)}</h3>
                  <p className="text-slate-500">{selectedReview.period} • {REVIEW_TYPES.find(t => t.value === selectedReview.review_type)?.label}</p>
                </div>
                {selectedReview.overall_rating && (
                  <div className="ml-auto text-center">
                    <p className="text-3xl font-black text-indigo-600">{selectedReview.overall_rating?.toFixed(1)}</p>
                    <div className="flex gap-0.5 justify-center">{renderStars(selectedReview.overall_rating)}</div>
                  </div>
                )}
              </div>

              {/* Ratings Breakdown */}
              {selectedReview.status === 'completed' && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Performance Ratings</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Communication', value: selectedReview.communication_rating },
                      { label: 'Teamwork', value: selectedReview.teamwork_rating },
                      { label: 'Technical Skills', value: selectedReview.technical_skills_rating },
                      { label: 'Problem Solving', value: selectedReview.problem_solving_rating },
                      { label: 'Leadership', value: selectedReview.leadership_rating },
                      { label: 'Punctuality', value: selectedReview.punctuality_rating }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-600">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">{renderStars(item.value)}</div>
                          <span className="font-semibold text-slate-900">{item.value || '-'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Self Assessment */}
              {selectedReview.self_assessment && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Self Assessment</h4>
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-slate-700">{selectedReview.self_assessment}</p>
                    {selectedReview.self_rating && (
                      <p className="mt-2 text-sm text-blue-600">Self Rating: {selectedReview.self_rating}/5</p>
                    )}
                  </div>
                </div>
              )}

              {/* Achievements & Challenges */}
              {(selectedReview.achievements || selectedReview.challenges) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedReview.achievements && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Achievements</h4>
                      <p className="text-sm text-slate-600 p-3 bg-emerald-50 rounded-lg">{selectedReview.achievements}</p>
                    </div>
                  )}
                  {selectedReview.challenges && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Challenges</h4>
                      <p className="text-sm text-slate-600 p-3 bg-amber-50 rounded-lg">{selectedReview.challenges}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Manager Feedback */}
              {(selectedReview.strengths || selectedReview.areas_for_improvement || selectedReview.feedback) && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Manager's Assessment</h4>
                  <div className="space-y-3">
                    {selectedReview.strengths && (
                      <div className="p-3 bg-emerald-50 rounded-lg">
                        <p className="text-xs font-medium text-emerald-700 mb-1">Strengths</p>
                        <p className="text-sm text-slate-700">{selectedReview.strengths}</p>
                      </div>
                    )}
                    {selectedReview.areas_for_improvement && (
                      <div className="p-3 bg-amber-50 rounded-lg">
                        <p className="text-xs font-medium text-amber-700 mb-1">Areas for Improvement</p>
                        <p className="text-sm text-slate-700">{selectedReview.areas_for_improvement}</p>
                      </div>
                    )}
                    {selectedReview.feedback && (
                      <div className="p-3 bg-slate-100 rounded-lg">
                        <p className="text-xs font-medium text-slate-600 mb-1">General Feedback</p>
                        <p className="text-sm text-slate-700">{selectedReview.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Self-Assessment Dialog */}
      <Dialog open={selfAssessmentDialogOpen} onOpenChange={setSelfAssessmentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit Self-Assessment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitSelfAssessment} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">How would you rate your performance? (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.5"
                value={selfAssessmentForm.self_rating}
                onChange={(e) => setSelfAssessmentForm({ ...selfAssessmentForm, self_rating: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Self Assessment</label>
              <textarea
                value={selfAssessmentForm.self_assessment}
                onChange={(e) => setSelfAssessmentForm({ ...selfAssessmentForm, self_assessment: e.target.value })}
                placeholder="Describe your overall performance during this period..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                rows={4}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Key Achievements</label>
              <textarea
                value={selfAssessmentForm.achievements}
                onChange={(e) => setSelfAssessmentForm({ ...selfAssessmentForm, achievements: e.target.value })}
                placeholder="List your key achievements..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Challenges Faced</label>
              <textarea
                value={selfAssessmentForm.challenges}
                onChange={(e) => setSelfAssessmentForm({ ...selfAssessmentForm, challenges: e.target.value })}
                placeholder="Describe any challenges you faced..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="rounded-xl bg-indigo-950 hover:bg-indigo-900 flex-1">
                Submit Assessment
              </Button>
              <Button type="button" onClick={() => setSelfAssessmentDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Complete Review Dialog - Manager */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Performance Review</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCompleteReview} className="space-y-6">
            {/* Category Ratings */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Performance Ratings (1-5)</h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'communication_rating', label: 'Communication' },
                  { key: 'teamwork_rating', label: 'Teamwork' },
                  { key: 'technical_skills_rating', label: 'Technical Skills' },
                  { key: 'problem_solving_rating', label: 'Problem Solving' },
                  { key: 'leadership_rating', label: 'Leadership' },
                  { key: 'punctuality_rating', label: 'Punctuality' }
                ].map((item) => (
                  <div key={item.key}>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">{item.label}</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="0.5"
                      value={completeForm[item.key]}
                      onChange={(e) => setCompleteForm({ ...completeForm, [item.key]: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback Sections */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Strengths</label>
                <textarea
                  value={completeForm.strengths}
                  onChange={(e) => setCompleteForm({ ...completeForm, strengths: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Areas for Improvement</label>
                <textarea
                  value={completeForm.areas_for_improvement}
                  onChange={(e) => setCompleteForm({ ...completeForm, areas_for_improvement: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  rows={3}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">General Feedback</label>
              <textarea
                value={completeForm.feedback}
                onChange={(e) => setCompleteForm({ ...completeForm, feedback: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Recommendations for Next Period</label>
              <textarea
                value={completeForm.recommendations}
                onChange={(e) => setCompleteForm({ ...completeForm, recommendations: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Next Review Date</label>
              <input
                type="date"
                value={completeForm.next_review_date}
                onChange={(e) => setCompleteForm({ ...completeForm, next_review_date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 flex-1">
                <CheckCircle2 size={18} className="mr-2" />
                Complete Review
              </Button>
              <Button type="button" onClick={() => setCompleteDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Performance;
