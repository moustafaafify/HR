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
  Heart,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Shield,
  Eye,
  Stethoscope,
  Smile,
  Wallet,
  Activity,
  Users,
  FileText,
  Calendar,
  AlertCircle,
  Building2,
  UserPlus,
  TrendingUp,
  BadgeCheck,
  Sparkles
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CATEGORY_CONFIG = {
  health: { label: 'Health Insurance', icon: Heart, color: 'bg-rose-100 text-rose-700' },
  dental: { label: 'Dental', icon: Smile, color: 'bg-cyan-100 text-cyan-700' },
  vision: { label: 'Vision', icon: Eye, color: 'bg-violet-100 text-violet-700' },
  life: { label: 'Life Insurance', icon: Shield, color: 'bg-slate-100 text-slate-700' },
  disability: { label: 'Disability', icon: Activity, color: 'bg-amber-100 text-amber-700' },
  retirement: { label: 'Retirement', icon: Wallet, color: 'bg-emerald-100 text-emerald-700' },
  wellness: { label: 'Wellness', icon: Sparkles, color: 'bg-pink-100 text-pink-700' },
  other: { label: 'Other', icon: FileText, color: 'bg-gray-100 text-gray-700' }
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
  terminated: { label: 'Terminated', color: 'bg-slate-100 text-slate-600' },
  on_hold: { label: 'On Hold', color: 'bg-orange-100 text-orange-700' }
};

const CLAIM_STATUS_CONFIG = {
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700' },
  under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700' },
  denied: { label: 'Denied', color: 'bg-rose-100 text-rose-700' },
  paid: { label: 'Paid', color: 'bg-indigo-100 text-indigo-700' }
};

const Benefits = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');

  // Data
  const [plans, setPlans] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Dialogs
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [viewPlanOpen, setViewPlanOpen] = useState(false);
  const [dependentDialogOpen, setDependentDialogOpen] = useState(false);

  // Selected items
  const [editingPlan, setEditingPlan] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  // Forms
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    category: 'health',
    plan_type: 'individual',
    provider_name: '',
    provider_contact: '',
    provider_website: '',
    employee_cost_monthly: 0,
    employer_cost_monthly: 0,
    deductible: 0,
    out_of_pocket_max: 0,
    coverage_amount: 0,
    coverage_details: '',
    eligibility_rules: '',
    waiting_period_days: 0,
    enrollment_start: '',
    enrollment_end: '',
    is_open_enrollment: false,
    is_active: true
  });

  const [enrollForm, setEnrollForm] = useState({
    plan_id: '',
    employee_id: '',
    coverage_type: 'individual',
    coverage_start_date: new Date().toISOString().split('T')[0],
    dependents: [],
    beneficiaries: []
  });

  const [claimForm, setClaimForm] = useState({
    enrollment_id: '',
    claim_type: 'medical',
    claim_date: new Date().toISOString().split('T')[0],
    service_date: '',
    provider_name: '',
    description: '',
    claim_amount: 0,
    receipt_url: ''
  });

  const [dependentForm, setDependentForm] = useState({
    name: '',
    relationship: 'spouse',
    date_of_birth: ''
  });

  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  // Fetch functions
  const fetchPlans = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      const response = await axios.get(`${API}/benefits/plans?${params}`);
      setPlans(response.data);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  }, [categoryFilter]);

  const fetchEnrollments = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/benefits/enrollments`);
      setEnrollments(response.data);
    } catch (error) {
      console.error('Failed to fetch enrollments:', error);
    }
  }, []);

  const fetchMyEnrollments = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/benefits/enrollments/my`);
      setMyEnrollments(response.data);
    } catch (error) {
      console.error('Failed to fetch my enrollments:', error);
    }
  }, []);

  const fetchClaims = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/benefits/claims`);
      setClaims(response.data);
    } catch (error) {
      console.error('Failed to fetch claims:', error);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/benefits/stats`);
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPlans(),
        fetchEnrollments(),
        fetchMyEnrollments(),
        fetchClaims(),
        fetchStats(),
        fetchEmployees()
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchPlans, fetchEnrollments, fetchMyEnrollments, fetchClaims, fetchStats, fetchEmployees]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchPlans();
  }, [categoryFilter, fetchPlans]);

  // Handlers
  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await axios.put(`${API}/benefits/plans/${editingPlan.id}`, planForm);
        toast.success('Plan updated!');
      } else {
        await axios.post(`${API}/benefits/plans`, planForm);
        toast.success('Plan created!');
      }
      fetchPlans();
      fetchStats();
      setPlanDialogOpen(false);
      resetPlanForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save plan');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Deactivate this plan?')) return;
    try {
      await axios.delete(`${API}/benefits/plans/${planId}`);
      toast.success('Plan deactivated');
      fetchPlans();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete plan');
    }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/benefits/enrollments`, enrollForm);
      toast.success('Enrollment submitted!');
      fetchEnrollments();
      fetchMyEnrollments();
      fetchStats();
      setEnrollDialogOpen(false);
      resetEnrollForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to enroll');
    }
  };

  const handleApproveEnrollment = async (enrollmentId) => {
    try {
      await axios.post(`${API}/benefits/enrollments/${enrollmentId}/approve`);
      toast.success('Enrollment approved!');
      fetchEnrollments();
    } catch (error) {
      toast.error('Failed to approve enrollment');
    }
  };

  const handleTerminateEnrollment = async (enrollmentId) => {
    if (!window.confirm('Terminate this enrollment?')) return;
    try {
      await axios.post(`${API}/benefits/enrollments/${enrollmentId}/terminate`, {
        reason: 'Terminated by administrator'
      });
      toast.success('Enrollment terminated');
      fetchEnrollments();
      fetchMyEnrollments();
    } catch (error) {
      toast.error('Failed to terminate enrollment');
    }
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/benefits/claims`, claimForm);
      toast.success('Claim submitted!');
      fetchClaims();
      fetchStats();
      setClaimDialogOpen(false);
      resetClaimForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit claim');
    }
  };

  const handleUpdateClaim = async (claimId, data) => {
    try {
      await axios.put(`${API}/benefits/claims/${claimId}`, data);
      toast.success('Claim updated!');
      fetchClaims();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update claim');
    }
  };

  const handleSeedDefaults = async () => {
    try {
      const response = await axios.post(`${API}/benefits/seed-defaults`);
      toast.success(response.data.message);
      fetchPlans();
      fetchStats();
    } catch (error) {
      toast.error('Failed to seed default benefits');
    }
  };

  const openEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name || '',
      description: plan.description || '',
      category: plan.category || 'health',
      plan_type: plan.plan_type || 'individual',
      provider_name: plan.provider_name || '',
      provider_contact: plan.provider_contact || '',
      provider_website: plan.provider_website || '',
      employee_cost_monthly: plan.employee_cost_monthly || 0,
      employer_cost_monthly: plan.employer_cost_monthly || 0,
      deductible: plan.deductible || 0,
      out_of_pocket_max: plan.out_of_pocket_max || 0,
      coverage_amount: plan.coverage_amount || 0,
      coverage_details: plan.coverage_details || '',
      eligibility_rules: plan.eligibility_rules || '',
      waiting_period_days: plan.waiting_period_days || 0,
      enrollment_start: plan.enrollment_start || '',
      enrollment_end: plan.enrollment_end || '',
      is_open_enrollment: plan.is_open_enrollment || false,
      is_active: plan.is_active !== false
    });
    setPlanDialogOpen(true);
  };

  const openEnrollDialog = (plan) => {
    setSelectedPlan(plan);
    setEnrollForm({
      ...enrollForm,
      plan_id: plan.id,
      coverage_type: plan.plan_type === 'family' ? 'family' : 'individual'
    });
    setEnrollDialogOpen(true);
  };

  const addDependent = () => {
    if (!dependentForm.name) return;
    setEnrollForm({
      ...enrollForm,
      dependents: [...enrollForm.dependents, { ...dependentForm }]
    });
    setDependentForm({ name: '', relationship: 'spouse', date_of_birth: '' });
    setDependentDialogOpen(false);
  };

  const removeDependent = (index) => {
    setEnrollForm({
      ...enrollForm,
      dependents: enrollForm.dependents.filter((_, i) => i !== index)
    });
  };

  const resetPlanForm = () => {
    setEditingPlan(null);
    setPlanForm({
      name: '',
      description: '',
      category: 'health',
      plan_type: 'individual',
      provider_name: '',
      provider_contact: '',
      provider_website: '',
      employee_cost_monthly: 0,
      employer_cost_monthly: 0,
      deductible: 0,
      out_of_pocket_max: 0,
      coverage_amount: 0,
      coverage_details: '',
      eligibility_rules: '',
      waiting_period_days: 0,
      enrollment_start: '',
      enrollment_end: '',
      is_open_enrollment: false,
      is_active: true
    });
  };

  const resetEnrollForm = () => {
    setSelectedPlan(null);
    setEnrollForm({
      plan_id: '',
      employee_id: '',
      coverage_type: 'individual',
      coverage_start_date: new Date().toISOString().split('T')[0],
      dependents: [],
      beneficiaries: []
    });
  };

  const resetClaimForm = () => {
    setClaimForm({
      enrollment_id: '',
      claim_type: 'medical',
      claim_date: new Date().toISOString().split('T')[0],
      service_date: '',
      provider_name: '',
      description: '',
      claim_amount: 0,
      receipt_url: ''
    });
  };

  const getCategoryConfig = (category) => CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Filter plans
  const filteredPlans = plans.filter(plan => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!plan.name?.toLowerCase().includes(query) &&
          !plan.provider_name?.toLowerCase().includes(query)) return false;
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
    <div className="p-4 lg:p-6 space-y-6" data-testid="benefits-page">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Benefits</h1>
          <p className="text-slate-500 mt-1">
            {isAdmin ? 'Manage employee benefits and enrollments' : 'View and enroll in benefits'}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && plans.length === 0 && (
            <Button variant="outline" onClick={handleSeedDefaults}>
              <Sparkles size={18} className="mr-2" />
              Add Default Plans
            </Button>
          )}
          {isAdmin && (
            <Button onClick={() => { resetPlanForm(); setPlanDialogOpen(true); }} data-testid="create-plan-btn">
              <Plus size={18} className="mr-2" />
              New Plan
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 text-white">
          <Shield className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-indigo-100 text-sm">Available Plans</p>
          <p className="text-2xl font-bold">{stats?.total_plans || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white">
          <BadgeCheck className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-emerald-100 text-sm">{isAdmin ? 'Active Enrollments' : 'My Enrollments'}</p>
          <p className="text-2xl font-bold">{stats?.active_enrollments || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white">
          <FileText className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-amber-100 text-sm">Pending Claims</p>
          <p className="text-2xl font-bold">{stats?.pending_claims || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
          <DollarSign className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-purple-100 text-sm">Monthly Cost</p>
          <p className="text-2xl font-bold">{formatCurrency(stats?.total_employee_cost_monthly)}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="plans">Available Plans</TabsTrigger>
          <TabsTrigger value="my-benefits">My Benefits</TabsTrigger>
          {isAdmin && <TabsTrigger value="enrollments">All Enrollments</TabsTrigger>}
          <TabsTrigger value="claims">Claims</TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans" className="mt-6 space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search plans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
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

          {/* Plans Grid */}
          {filteredPlans.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Shield className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">No Benefit Plans Found</p>
              <p className="text-slate-500 text-sm mt-1">
                {isAdmin ? 'Create your first benefit plan or add defaults' : 'No plans available yet'}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlans.map(plan => {
                const categoryConfig = getCategoryConfig(plan.category);
                const CategoryIcon = categoryConfig.icon;
                const isEnrolled = myEnrollments.some(e => e.plan_id === plan.id && e.status === 'active');

                return (
                  <div
                    key={plan.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                    data-testid={`plan-card-${plan.id}`}
                  >
                    <div className={`p-4 ${categoryConfig.color}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CategoryIcon size={20} />
                          <span className="font-medium text-sm">{categoryConfig.label}</span>
                        </div>
                        {isEnrolled && (
                          <span className="bg-white/30 px-2 py-0.5 rounded-full text-xs font-medium">
                            Enrolled
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="font-semibold text-slate-900 mb-1">{plan.name}</h3>
                      {plan.provider_name && (
                        <p className="text-sm text-slate-500 mb-3">{plan.provider_name}</p>
                      )}

                      {plan.description && (
                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{plan.description}</p>
                      )}

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Your Cost</span>
                          <span className="font-semibold">{formatCurrency(plan.employee_cost_monthly)}/mo</span>
                        </div>
                        {plan.deductible > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Deductible</span>
                            <span className="font-medium">{formatCurrency(plan.deductible)}</span>
                          </div>
                        )}
                        {plan.coverage_amount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Coverage</span>
                            <span className="font-medium">{formatCurrency(plan.coverage_amount)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => { setSelectedPlan(plan); setViewPlanOpen(true); }}
                        >
                          <Eye size={14} className="mr-1" />
                          Details
                        </Button>
                        {!isEnrolled && (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => openEnrollDialog(plan)}
                          >
                            <UserPlus size={14} className="mr-1" />
                            Enroll
                          </Button>
                        )}
                        {isAdmin && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => openEditPlan(plan)}>
                              <Edit2 size={14} />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => handleDeletePlan(plan.id)}>
                              <Trash2 size={14} />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* My Benefits Tab */}
        <TabsContent value="my-benefits" className="mt-6 space-y-4">
          {myEnrollments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <BadgeCheck className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">No Benefits Enrolled</p>
              <p className="text-slate-500 text-sm mt-1">Browse available plans and enroll to get started</p>
              <Button className="mt-4" onClick={() => setActiveTab('plans')}>
                View Available Plans
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {myEnrollments.map(enrollment => {
                const categoryConfig = getCategoryConfig(enrollment.plan_category);
                const CategoryIcon = categoryConfig.icon;
                const statusConfig = STATUS_CONFIG[enrollment.status] || STATUS_CONFIG.active;

                return (
                  <div
                    key={enrollment.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5"
                    data-testid={`enrollment-${enrollment.id}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${categoryConfig.color} flex items-center justify-center`}>
                          <CategoryIcon size={24} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{enrollment.plan_name}</h3>
                          <p className="text-sm text-slate-500">{categoryConfig.label}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-500">Coverage Type</p>
                        <p className="font-medium capitalize">{enrollment.coverage_type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Start Date</p>
                        <p className="font-medium">{formatDate(enrollment.coverage_start_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Your Cost</p>
                        <p className="font-medium">{formatCurrency(enrollment.employee_contribution)}/mo</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Employer Contribution</p>
                        <p className="font-medium">{formatCurrency(enrollment.employer_contribution)}/mo</p>
                      </div>
                    </div>

                    {enrollment.dependents?.length > 0 && (
                      <div className="border-t border-slate-100 pt-4 mt-4">
                        <p className="text-sm font-medium text-slate-700 mb-2">Covered Dependents</p>
                        <div className="flex flex-wrap gap-2">
                          {enrollment.dependents.map((dep, i) => (
                            <span key={i} className="bg-slate-100 px-3 py-1 rounded-full text-sm">
                              {dep.name} ({dep.relationship})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {enrollment.status === 'active' && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEnrollment(enrollment);
                            setClaimForm({ ...claimForm, enrollment_id: enrollment.id });
                            setClaimDialogOpen(true);
                          }}
                        >
                          <FileText size={14} className="mr-1" />
                          File Claim
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* All Enrollments Tab (Admin) */}
        {isAdmin && (
          <TabsContent value="enrollments" className="mt-6 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-4 font-medium text-slate-600">Employee</th>
                      <th className="text-left p-4 font-medium text-slate-600">Plan</th>
                      <th className="text-left p-4 font-medium text-slate-600">Coverage</th>
                      <th className="text-left p-4 font-medium text-slate-600">Start Date</th>
                      <th className="text-left p-4 font-medium text-slate-600">Status</th>
                      <th className="text-left p-4 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {enrollments.map(enrollment => {
                      const statusConfig = STATUS_CONFIG[enrollment.status] || STATUS_CONFIG.active;
                      return (
                        <tr key={enrollment.id} className="hover:bg-slate-50">
                          <td className="p-4 font-medium">{enrollment.employee_name}</td>
                          <td className="p-4">{enrollment.plan_name}</td>
                          <td className="p-4 capitalize">{enrollment.coverage_type}</td>
                          <td className="p-4">{formatDate(enrollment.coverage_start_date)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-1">
                              {enrollment.status === 'pending' && (
                                <Button size="sm" variant="ghost" onClick={() => handleApproveEnrollment(enrollment.id)}>
                                  <CheckCircle2 size={14} className="text-emerald-600" />
                                </Button>
                              )}
                              {enrollment.status === 'active' && (
                                <Button size="sm" variant="ghost" onClick={() => handleTerminateEnrollment(enrollment.id)}>
                                  <XCircle size={14} className="text-rose-600" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {enrollments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">No enrollments found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        )}

        {/* Claims Tab */}
        <TabsContent value="claims" className="mt-6 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {isAdmin && <th className="text-left p-4 font-medium text-slate-600">Employee</th>}
                    <th className="text-left p-4 font-medium text-slate-600">Plan</th>
                    <th className="text-left p-4 font-medium text-slate-600">Type</th>
                    <th className="text-left p-4 font-medium text-slate-600">Date</th>
                    <th className="text-left p-4 font-medium text-slate-600">Amount</th>
                    <th className="text-left p-4 font-medium text-slate-600">Status</th>
                    {isAdmin && <th className="text-left p-4 font-medium text-slate-600">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {claims.map(claim => {
                    const statusConfig = CLAIM_STATUS_CONFIG[claim.status] || CLAIM_STATUS_CONFIG.submitted;
                    return (
                      <tr key={claim.id} className="hover:bg-slate-50">
                        {isAdmin && <td className="p-4 font-medium">{claim.employee_name}</td>}
                        <td className="p-4">{claim.plan_name}</td>
                        <td className="p-4 capitalize">{claim.claim_type}</td>
                        <td className="p-4">{formatDate(claim.service_date)}</td>
                        <td className="p-4 font-medium">{formatCurrency(claim.claim_amount)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="p-4">
                            <div className="flex gap-1">
                              {claim.status === 'submitted' && (
                                <>
                                  <Button size="sm" variant="ghost" onClick={() => handleUpdateClaim(claim.id, { status: 'under_review' })}>
                                    <Clock size={14} className="text-amber-600" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleUpdateClaim(claim.id, { status: 'approved', covered_amount: claim.claim_amount })}>
                                    <CheckCircle2 size={14} className="text-emerald-600" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleUpdateClaim(claim.id, { status: 'denied' })}>
                                    <XCircle size={14} className="text-rose-600" />
                                  </Button>
                                </>
                              )}
                              {claim.status === 'under_review' && (
                                <>
                                  <Button size="sm" variant="ghost" onClick={() => handleUpdateClaim(claim.id, { status: 'approved', covered_amount: claim.claim_amount })}>
                                    <CheckCircle2 size={14} className="text-emerald-600" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleUpdateClaim(claim.id, { status: 'denied' })}>
                                    <XCircle size={14} className="text-rose-600" />
                                  </Button>
                                </>
                              )}
                              {claim.status === 'approved' && (
                                <Button size="sm" variant="ghost" onClick={() => handleUpdateClaim(claim.id, { status: 'paid' })}>
                                  <DollarSign size={14} className="text-indigo-600" />
                                </Button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {claims.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} className="p-8 text-center text-slate-500">No claims found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* View Plan Dialog */}
      <Dialog open={viewPlanOpen} onOpenChange={setViewPlanOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPlan?.name}</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-6 mt-4">
              <div className={`p-4 rounded-xl ${getCategoryConfig(selectedPlan.category).color}`}>
                <div className="flex items-center gap-2">
                  {React.createElement(getCategoryConfig(selectedPlan.category).icon, { size: 24 })}
                  <span className="font-semibold">{getCategoryConfig(selectedPlan.category).label}</span>
                </div>
              </div>

              {selectedPlan.description && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Description</h4>
                  <p className="text-slate-600">{selectedPlan.description}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900">Cost Details</h4>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Your Monthly Cost</span>
                      <span className="font-semibold">{formatCurrency(selectedPlan.employee_cost_monthly)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Employer Contribution</span>
                      <span className="font-medium">{formatCurrency(selectedPlan.employer_cost_monthly)}</span>
                    </div>
                    {selectedPlan.deductible > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Annual Deductible</span>
                        <span className="font-medium">{formatCurrency(selectedPlan.deductible)}</span>
                      </div>
                    )}
                    {selectedPlan.out_of_pocket_max > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Out-of-Pocket Max</span>
                        <span className="font-medium">{formatCurrency(selectedPlan.out_of_pocket_max)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900">Provider</h4>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                    {selectedPlan.provider_name && (
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-slate-400" />
                        <span>{selectedPlan.provider_name}</span>
                      </div>
                    )}
                    {selectedPlan.provider_contact && (
                      <div className="flex items-center gap-2">
                        <Stethoscope size={16} className="text-slate-400" />
                        <span>{selectedPlan.provider_contact}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedPlan.coverage_details && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Coverage Details</h4>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-slate-600">{selectedPlan.coverage_details}</p>
                  </div>
                </div>
              )}

              {selectedPlan.eligibility_rules && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Eligibility</h4>
                  <div className="bg-amber-50 rounded-xl p-4 flex items-start gap-2">
                    <AlertCircle size={18} className="text-amber-600 mt-0.5" />
                    <p className="text-amber-800">{selectedPlan.eligibility_rules}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setViewPlanOpen(false)}>Close</Button>
                {!myEnrollments.some(e => e.plan_id === selectedPlan.id && e.status === 'active') && (
                  <Button onClick={() => { setViewPlanOpen(false); openEnrollDialog(selectedPlan); }}>
                    Enroll Now
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Plan Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Edit Benefit Plan' : 'Create Benefit Plan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSavePlan} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Plan Name *</label>
                <Input
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <Textarea
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <Select value={planForm.category} onValueChange={(v) => setPlanForm({ ...planForm, category: v })}>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Plan Type</label>
                <Select value={planForm.plan_type} onValueChange={(v) => setPlanForm({ ...planForm, plan_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="employee_spouse">Employee + Spouse</SelectItem>
                    <SelectItem value="employee_children">Employee + Children</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Provider Name</label>
                <Input
                  value={planForm.provider_name}
                  onChange={(e) => setPlanForm({ ...planForm, provider_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Provider Contact</label>
                <Input
                  value={planForm.provider_contact}
                  onChange={(e) => setPlanForm({ ...planForm, provider_contact: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee Cost (Monthly)</label>
                <Input
                  type="number"
                  value={planForm.employee_cost_monthly}
                  onChange={(e) => setPlanForm({ ...planForm, employee_cost_monthly: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employer Cost (Monthly)</label>
                <Input
                  type="number"
                  value={planForm.employer_cost_monthly}
                  onChange={(e) => setPlanForm({ ...planForm, employer_cost_monthly: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deductible</label>
                <Input
                  type="number"
                  value={planForm.deductible}
                  onChange={(e) => setPlanForm({ ...planForm, deductible: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Out-of-Pocket Max</label>
                <Input
                  type="number"
                  value={planForm.out_of_pocket_max}
                  onChange={(e) => setPlanForm({ ...planForm, out_of_pocket_max: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Coverage Amount</label>
                <Input
                  type="number"
                  value={planForm.coverage_amount}
                  onChange={(e) => setPlanForm({ ...planForm, coverage_amount: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Waiting Period (Days)</label>
                <Input
                  type="number"
                  value={planForm.waiting_period_days}
                  onChange={(e) => setPlanForm({ ...planForm, waiting_period_days: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Coverage Details</label>
                <Textarea
                  value={planForm.coverage_details}
                  onChange={(e) => setPlanForm({ ...planForm, coverage_details: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Eligibility Rules</label>
                <Input
                  value={planForm.eligibility_rules}
                  onChange={(e) => setPlanForm({ ...planForm, eligibility_rules: e.target.value })}
                  placeholder="e.g., Full-time employees after 30 days"
                />
              </div>

              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.is_active}
                    onChange={(e) => setPlanForm({ ...planForm, is_active: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span className="text-sm text-slate-700">Plan is active</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setPlanDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingPlan ? 'Update' : 'Create'} Plan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enroll Dialog */}
      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enroll in {selectedPlan?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEnroll} className="space-y-4 mt-4">
            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee</label>
                <Select value={enrollForm.employee_id} onValueChange={(v) => setEnrollForm({ ...enrollForm, employee_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Coverage Type</label>
              <Select value={enrollForm.coverage_type} onValueChange={(v) => setEnrollForm({ ...enrollForm, coverage_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="employee_spouse">Employee + Spouse</SelectItem>
                  <SelectItem value="employee_children">Employee + Children</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Coverage Start Date</label>
              <Input
                type="date"
                value={enrollForm.coverage_start_date}
                onChange={(e) => setEnrollForm({ ...enrollForm, coverage_start_date: e.target.value })}
                required
              />
            </div>

            {enrollForm.coverage_type !== 'individual' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">Dependents</label>
                  <Button type="button" size="sm" variant="outline" onClick={() => setDependentDialogOpen(true)}>
                    <Plus size={14} className="mr-1" /> Add
                  </Button>
                </div>
                {enrollForm.dependents.length > 0 ? (
                  <div className="space-y-2">
                    {enrollForm.dependents.map((dep, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg p-2">
                        <span className="text-sm">{dep.name} ({dep.relationship})</span>
                        <Button type="button" size="sm" variant="ghost" onClick={() => removeDependent(i)}>
                          <Trash2 size={14} className="text-rose-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No dependents added</p>
                )}
              </div>
            )}

            <div className="bg-indigo-50 rounded-xl p-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-indigo-700">Your Monthly Cost</span>
                <span className="font-semibold text-indigo-900">{formatCurrency(selectedPlan?.employee_cost_monthly)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-indigo-700">Employer Contribution</span>
                <span className="font-medium text-indigo-900">{formatCurrency(selectedPlan?.employer_cost_monthly)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEnrollDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Enroll</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Dependent Dialog */}
      <Dialog open={dependentDialogOpen} onOpenChange={setDependentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Dependent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <Input
                value={dependentForm.name}
                onChange={(e) => setDependentForm({ ...dependentForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Relationship</label>
              <Select value={dependentForm.relationship} onValueChange={(v) => setDependentForm({ ...dependentForm, relationship: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spouse">Spouse</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                  <SelectItem value="domestic_partner">Domestic Partner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
              <Input
                type="date"
                value={dependentForm.date_of_birth}
                onChange={(e) => setDependentForm({ ...dependentForm, date_of_birth: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDependentDialogOpen(false)}>Cancel</Button>
              <Button type="button" onClick={addDependent}>Add Dependent</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submit Claim Dialog */}
      <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>File Benefit Claim</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitClaim} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Benefit Plan</label>
              <Select value={claimForm.enrollment_id} onValueChange={(v) => setClaimForm({ ...claimForm, enrollment_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {myEnrollments.filter(e => e.status === 'active').map(enrollment => (
                    <SelectItem key={enrollment.id} value={enrollment.id}>{enrollment.plan_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Claim Type</label>
              <Select value={claimForm.claim_type} onValueChange={(v) => setClaimForm({ ...claimForm, claim_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="dental">Dental</SelectItem>
                  <SelectItem value="vision">Vision</SelectItem>
                  <SelectItem value="prescription">Prescription</SelectItem>
                  <SelectItem value="wellness">Wellness</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Service Date</label>
                <Input
                  type="date"
                  value={claimForm.service_date}
                  onChange={(e) => setClaimForm({ ...claimForm, service_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Claim Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  value={claimForm.claim_amount}
                  onChange={(e) => setClaimForm({ ...claimForm, claim_amount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Provider Name</label>
              <Input
                value={claimForm.provider_name}
                onChange={(e) => setClaimForm({ ...claimForm, provider_name: e.target.value })}
                placeholder="e.g., Dr. Smith's Office"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <Textarea
                value={claimForm.description}
                onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })}
                rows={2}
                placeholder="Brief description of the service"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Receipt URL (Optional)</label>
              <Input
                value={claimForm.receipt_url}
                onChange={(e) => setClaimForm({ ...claimForm, receipt_url: e.target.value })}
                placeholder="Link to receipt or documentation"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setClaimDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Submit Claim</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Benefits;
