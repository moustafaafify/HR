import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import {
  Users,
  TrendingUp,
  Target,
  PieChart,
  BarChart3,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Briefcase,
  UserPlus,
  UserMinus,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Zap,
  FileText,
  Settings,
  ChevronRight,
  Building2,
  Award,
  Search,
  Filter,
  Download,
  Eye,
  Play,
  Pause,
  MoreVertical
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const WorkforcePlanning = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Admin data
  const [dashboard, setDashboard] = useState(null);
  const [headcountPlans, setHeadcountPlans] = useState([]);
  const [skillGaps, setSkillGaps] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [capacityPlans, setCapacityPlans] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  
  // Employee data
  const [myOverview, setMyOverview] = useState(null);
  
  // Dialogs
  const [headcountPlanDialog, setHeadcountPlanDialog] = useState(false);
  const [allocationDialog, setAllocationDialog] = useState(false);
  const [scenarioDialog, setScenarioDialog] = useState(false);
  const [capacityDialog, setCapacityDialog] = useState(false);
  const [preferencesDialog, setPreferencesDialog] = useState(false);
  const [availabilityDialog, setAvailabilityDialog] = useState(false);
  
  // Forms
  const [selectedItem, setSelectedItem] = useState(null);
  const [headcountForm, setHeadcountForm] = useState({
    name: '',
    department_id: '',
    fiscal_year: new Date().getFullYear().toString(),
    quarter: '',
    current_headcount: 0,
    planned_hires: 0,
    planned_departures: 0,
    target_headcount: 0,
    budget_allocated: 0,
    notes: ''
  });
  
  const [allocationForm, setAllocationForm] = useState({
    employee_id: '',
    project_id: '',
    project_name: '',
    role_in_project: '',
    allocation_percentage: 100,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    billable: true,
    notes: ''
  });
  
  const [scenarioForm, setScenarioForm] = useState({
    name: '',
    description: '',
    scenario_type: 'growth',
    base_headcount: 0,
    base_cost: 0,
    projected_headcount: 0,
    projected_cost: 0,
    implementation_months: 6,
    productivity_impact: 'neutral',
    morale_impact: 'neutral'
  });
  
  const [capacityForm, setCapacityForm] = useState({
    name: '',
    department_id: '',
    period_start: '',
    period_end: '',
    total_fte: 0,
    available_hours: 0,
    allocated_hours: 0,
    utilization_target: 80
  });
  
  const [preferencesForm, setPreferencesForm] = useState({
    preferred_projects: [],
    interested_roles: [],
    open_to_relocation: false,
    open_to_travel: false
  });
  
  const [availabilityForm, setAvailabilityForm] = useState({
    date: new Date().toISOString().split('T')[0],
    available_hours: 8,
    status: 'available',
    reason: ''
  });
  
  // Filters
  const [filters, setFilters] = useState({
    department: '',
    year: new Date().getFullYear().toString(),
    status: ''
  });
  
  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';
  
  // Fetch functions
  const fetchDashboard = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/workforce/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboard(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  }, [token]);
  
  const fetchHeadcountPlans = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.year) params.append('fiscal_year', filters.year);
      if (filters.department) params.append('department_id', filters.department);
      if (filters.status) params.append('status', filters.status);
      
      const response = await axios.get(`${API}/workforce/headcount-plans?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHeadcountPlans(response.data);
    } catch (error) {
      console.error('Error fetching headcount plans:', error);
    }
  }, [token, filters]);
  
  const fetchSkillGaps = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.department) params.append('department_id', filters.department);
      
      const response = await axios.get(`${API}/workforce/skills-gap?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSkillGaps(response.data);
    } catch (error) {
      console.error('Error fetching skill gaps:', error);
    }
  }, [token, filters]);
  
  const fetchAllocations = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/workforce/allocations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllocations(response.data);
    } catch (error) {
      console.error('Error fetching allocations:', error);
    }
  }, [token]);
  
  const fetchCapacityPlans = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/workforce/capacity-plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCapacityPlans(response.data);
    } catch (error) {
      console.error('Error fetching capacity plans:', error);
    }
  }, [token]);
  
  const fetchScenarios = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/workforce/scenarios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScenarios(response.data);
    } catch (error) {
      console.error('Error fetching scenarios:', error);
    }
  }, [token]);
  
  const fetchDepartments = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, [token]);
  
  const fetchEmployees = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, [token]);
  
  const fetchProjects = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }, [token]);
  
  const fetchMyOverview = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/workforce/my-overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyOverview(response.data);
      
      // Set preferences form from response
      if (response.data.preferences) {
        setPreferencesForm({
          preferred_projects: response.data.preferences.preferred_projects || [],
          interested_roles: response.data.preferences.interested_roles || [],
          open_to_relocation: response.data.preferences.open_to_relocation || false,
          open_to_travel: response.data.preferences.open_to_travel || false
        });
      }
    } catch (error) {
      console.error('Error fetching my overview:', error);
    }
  }, [token]);
  
  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchDepartments();
        
        if (isAdmin) {
          await Promise.all([
            fetchDashboard(),
            fetchHeadcountPlans(),
            fetchSkillGaps(),
            fetchAllocations(),
            fetchCapacityPlans(),
            fetchScenarios(),
            fetchEmployees(),
            fetchProjects()
          ]);
        } else {
          await fetchMyOverview();
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [isAdmin, fetchDashboard, fetchHeadcountPlans, fetchSkillGaps, fetchAllocations, 
      fetchCapacityPlans, fetchScenarios, fetchDepartments, fetchEmployees, fetchProjects, fetchMyOverview]);
  
  // Refresh data when filters change
  useEffect(() => {
    if (isAdmin) {
      fetchHeadcountPlans();
      fetchSkillGaps();
    }
  }, [filters, isAdmin, fetchHeadcountPlans, fetchSkillGaps]);
  
  // Handlers
  const handleSaveHeadcountPlan = async () => {
    try {
      const dept = departments.find(d => d.id === headcountForm.department_id);
      const payload = {
        ...headcountForm,
        department_name: dept?.name || ''
      };
      
      if (selectedItem) {
        await axios.put(`${API}/workforce/headcount-plans/${selectedItem.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Headcount plan updated');
      } else {
        await axios.post(`${API}/workforce/headcount-plans`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Headcount plan created');
      }
      
      setHeadcountPlanDialog(false);
      setSelectedItem(null);
      fetchHeadcountPlans();
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save plan');
    }
  };
  
  const handleDeleteHeadcountPlan = async (id) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      await axios.delete(`${API}/workforce/headcount-plans/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Plan deleted');
      fetchHeadcountPlans();
      fetchDashboard();
    } catch (error) {
      toast.error('Failed to delete plan');
    }
  };
  
  const handleSaveAllocation = async () => {
    try {
      const project = projects.find(p => p.id === allocationForm.project_id);
      const payload = {
        ...allocationForm,
        project_name: project?.name || allocationForm.project_name
      };
      
      if (selectedItem) {
        await axios.put(`${API}/workforce/allocations/${selectedItem.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Allocation updated');
      } else {
        await axios.post(`${API}/workforce/allocations`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Allocation created');
      }
      
      setAllocationDialog(false);
      setSelectedItem(null);
      fetchAllocations();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save allocation');
    }
  };
  
  const handleSaveScenario = async () => {
    try {
      if (selectedItem) {
        await axios.put(`${API}/workforce/scenarios/${selectedItem.id}`, scenarioForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Scenario updated');
      } else {
        await axios.post(`${API}/workforce/scenarios`, scenarioForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Scenario created');
      }
      
      setScenarioDialog(false);
      setSelectedItem(null);
      fetchScenarios();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save scenario');
    }
  };
  
  const handleRunSkillsAnalysis = async () => {
    try {
      toast.info('Running skills gap analysis...');
      await axios.post(`${API}/workforce/skills-gap/analyze`, 
        { department_id: filters.department || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Skills gap analysis completed');
      fetchSkillGaps();
    } catch (error) {
      toast.error('Failed to run analysis');
    }
  };
  
  const handleSavePreferences = async () => {
    try {
      await axios.put(`${API}/workforce/availability/my/preferences`, preferencesForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Preferences updated');
      setPreferencesDialog(false);
      fetchMyOverview();
    } catch (error) {
      toast.error('Failed to update preferences');
    }
  };
  
  const handleSaveAvailability = async () => {
    try {
      await axios.post(`${API}/workforce/availability/my`, availabilityForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Availability updated');
      setAvailabilityDialog(false);
      fetchMyOverview();
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };
  
  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount || 0);
  };
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-rose-100 text-rose-700 border-rose-200',
      high: 'bg-amber-100 text-amber-700 border-amber-200',
      medium: 'bg-blue-100 text-blue-700 border-blue-200',
      low: 'bg-slate-100 text-slate-700 border-slate-200'
    };
    return colors[priority] || colors.medium;
  };
  
  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700',
      approved: 'bg-emerald-100 text-emerald-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-purple-100 text-purple-700',
      active: 'bg-emerald-100 text-emerald-700',
      under_review: 'bg-amber-100 text-amber-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };
  
  const openEditHeadcountPlan = (plan) => {
    setSelectedItem(plan);
    setHeadcountForm({
      name: plan.name || '',
      department_id: plan.department_id || '',
      fiscal_year: plan.fiscal_year || new Date().getFullYear().toString(),
      quarter: plan.quarter || '',
      current_headcount: plan.current_headcount || 0,
      planned_hires: plan.planned_hires || 0,
      planned_departures: plan.planned_departures || 0,
      target_headcount: plan.target_headcount || 0,
      budget_allocated: plan.budget_allocated || 0,
      notes: plan.notes || ''
    });
    setHeadcountPlanDialog(true);
  };
  
  const openNewHeadcountPlan = () => {
    setSelectedItem(null);
    setHeadcountForm({
      name: '',
      department_id: '',
      fiscal_year: new Date().getFullYear().toString(),
      quarter: '',
      current_headcount: 0,
      planned_hires: 0,
      planned_departures: 0,
      target_headcount: 0,
      budget_allocated: 0,
      notes: ''
    });
    setHeadcountPlanDialog(true);
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
      <div className="p-4 lg:p-6 space-y-6" data-testid="workforce-planning-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Workforce Profile</h1>
            <p className="text-slate-500 mt-1">View your allocations and manage your availability</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAvailabilityDialog(true)} data-testid="set-availability-btn">
              <Calendar className="w-4 h-4 mr-2" />
              Set Availability
            </Button>
            <Button onClick={() => setPreferencesDialog(true)} data-testid="update-preferences-btn">
              <Settings className="w-4 h-4 mr-2" />
              Preferences
            </Button>
          </div>
        </div>
        
        {/* Utilization Card */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-sm font-medium">Current Utilization</p>
              <p className="text-4xl font-bold mt-1">{myOverview?.current_utilization || 0}%</p>
            </div>
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <PieChart className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <Progress value={myOverview?.current_utilization || 0} className="h-2 bg-white/20" />
          </div>
        </div>
        
        {/* Active Allocations */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            My Allocations
          </h2>
          
          {myOverview?.allocations?.length > 0 ? (
            <div className="space-y-3">
              {myOverview.allocations.map((allocation) => (
                <div key={allocation.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <Layers className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{allocation.project_name || allocation.team_name || 'Project'}</p>
                      <p className="text-sm text-slate-500">{allocation.role_in_project || 'Team Member'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{allocation.allocation_percentage}%</p>
                    <p className="text-xs text-slate-500">
                      {formatDate(allocation.start_date)} - {allocation.end_date ? formatDate(allocation.end_date) : 'Ongoing'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No active allocations</p>
            </div>
          )}
        </div>
        
        {/* Skills */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            My Skills
          </h2>
          
          {myOverview?.skills?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {myOverview.skills.map((skill, i) => (
                <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                  {skill.skill_name || skill.name}
                  {skill.proficiency_level && (
                    <span className="ml-1 text-indigo-400">• {skill.proficiency_level}</span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">No skills listed. Visit the Skills page to add your skills.</p>
          )}
        </div>
        
        {/* Preferences */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              My Preferences
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setPreferencesDialog(true)}>
              <Edit2 className="w-4 h-4 mr-1" /> Edit
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500 mb-2">Interested Roles</p>
              {myOverview?.preferences?.interested_roles?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {myOverview.preferences.interested_roles.map((role, i) => (
                    <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-sm">{role}</span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic text-sm">No roles specified</p>
              )}
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-2">Availability</p>
              <div className="flex gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${myOverview?.preferences?.open_to_relocation ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {myOverview?.preferences?.open_to_relocation ? '✓ Open to Relocation' : 'Not Open to Relocation'}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${myOverview?.preferences?.open_to_travel ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {myOverview?.preferences?.open_to_travel ? '✓ Open to Travel' : 'Not Open to Travel'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Availability Dialog */}
        <Dialog open={availabilityDialog} onOpenChange={setAvailabilityDialog}>
          <DialogContent className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white">Set Availability</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Date</label>
                <Input
                  type="date"
                  value={availabilityForm.date}
                  onChange={(e) => setAvailabilityForm({ ...availabilityForm, date: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Available Hours</label>
                <Input
                  type="number"
                  min="0"
                  max="12"
                  value={availabilityForm.available_hours}
                  onChange={(e) => setAvailabilityForm({ ...availabilityForm, available_hours: parseFloat(e.target.value) })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Status</label>
                <Select value={availabilityForm.status} onValueChange={(v) => setAvailabilityForm({ ...availabilityForm, status: v })}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="partial">Partially Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Reason (Optional)</label>
                <Input
                  value={availabilityForm.reason}
                  onChange={(e) => setAvailabilityForm({ ...availabilityForm, reason: e.target.value })}
                  placeholder="e.g., Working from home, Conference..."
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" onClick={() => setAvailabilityDialog(false)} className="dark:border-slate-600 dark:text-slate-200">Cancel</Button>
                <Button onClick={handleSaveAvailability}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Preferences Dialog */}
        <Dialog open={preferencesDialog} onOpenChange={setPreferencesDialog}>
          <DialogContent className="max-w-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white">Update Preferences</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Interested Roles</label>
                <Input
                  placeholder="Enter roles separated by commas"
                  value={preferencesForm.interested_roles.join(', ')}
                  onChange={(e) => setPreferencesForm({ 
                    ...preferencesForm, 
                    interested_roles: e.target.value.split(',').map(r => r.trim()).filter(Boolean)
                  })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">e.g., Team Lead, Senior Developer, Product Manager</p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferencesForm.open_to_relocation}
                    onChange={(e) => setPreferencesForm({ ...preferencesForm, open_to_relocation: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-700"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-200">Open to Relocation</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferencesForm.open_to_travel}
                    onChange={(e) => setPreferencesForm({ ...preferencesForm, open_to_travel: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-700"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-200">Open to Travel</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" onClick={() => setPreferencesDialog(false)} className="dark:border-slate-600 dark:text-slate-200">Cancel</Button>
                <Button onClick={handleSavePreferences}>Save Preferences</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  
  // Admin View
  return (
    <div className="p-4 lg:p-6 space-y-6" data-testid="workforce-planning-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workforce Planning</h1>
          <p className="text-slate-500 mt-1">Plan headcount, analyze skills gaps, and allocate resources</p>
        </div>
      </div>
      
      {/* Dashboard Summary */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Employees</p>
                <p className="text-xl font-bold text-slate-900">{dashboard.summary.total_employees}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Active Plans</p>
                <p className="text-xl font-bold text-slate-900">{dashboard.summary.active_headcount_plans}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Skill Gaps</p>
                <p className="text-xl font-bold text-slate-900">{dashboard.summary.critical_skill_gaps}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Avg Utilization</p>
                <p className="text-xl font-bold text-slate-900">{dashboard.summary.avg_utilization}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Layers className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Allocations</p>
                <p className="text-xl font-bold text-slate-900">{dashboard.summary.total_allocations}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="headcount">Headcount Plans</TabsTrigger>
          <TabsTrigger value="skills">Skills Gap</TabsTrigger>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Department Headcount */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Department Headcount
              </h3>
              <div className="space-y-3">
                {dashboard?.department_headcount?.slice(0, 6).map((dept, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{dept.department_name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-slate-100 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{ width: `${Math.min((dept.headcount / (dashboard?.summary?.total_employees || 1)) * 100 * 5, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900 w-8 text-right">{dept.headcount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Critical Skill Gaps */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  Critical Skill Gaps
                </h3>
                <Button variant="ghost" size="sm" onClick={handleRunSkillsAnalysis}>
                  <RefreshCw className="w-4 h-4 mr-1" /> Analyze
                </Button>
              </div>
              <div className="space-y-3">
                {dashboard?.skill_gaps?.slice(0, 5).map((gap, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-900">{gap.skill_name}</p>
                      <p className="text-xs text-slate-500">Gap: {gap.gap_score} • {gap.recommended_action}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(gap.priority)}`}>
                      {gap.priority}
                    </span>
                  </div>
                ))}
                {(!dashboard?.skill_gaps || dashboard.skill_gaps.length === 0) && (
                  <p className="text-slate-500 text-center py-4">No skill gaps identified. Run analysis to detect gaps.</p>
                )}
              </div>
            </div>
            
            {/* Active Headcount Plans */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Active Headcount Plans
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('headcount')}>
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="space-y-3">
                {dashboard?.headcount_plans?.slice(0, 4).map((plan, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-900">{plan.name}</p>
                      <p className="text-xs text-slate-500">
                        {plan.department_name || 'All Departments'} • {plan.fiscal_year} {plan.quarter || ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">
                        {plan.current_headcount} → {plan.target_headcount}
                      </p>
                      <p className="text-xs text-emerald-600">+{plan.planned_hires} hires</p>
                    </div>
                  </div>
                ))}
                {(!dashboard?.headcount_plans || dashboard.headcount_plans.length === 0) && (
                  <p className="text-slate-500 text-center py-4">No active headcount plans</p>
                )}
              </div>
            </div>
            
            {/* Recent Scenarios */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  Recent Scenarios
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('scenarios')}>
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="space-y-3">
                {dashboard?.recent_scenarios?.slice(0, 4).map((scenario, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-900">{scenario.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{scenario.scenario_type}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(scenario.status)}`}>
                      {scenario.status}
                    </span>
                  </div>
                ))}
                {(!dashboard?.recent_scenarios || dashboard.recent_scenarios.length === 0) && (
                  <p className="text-slate-500 text-center py-4">No scenarios created</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Headcount Plans Tab */}
        <TabsContent value="headcount" className="mt-6">
          <div className="bg-white rounded-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Select value={filters.year} onValueChange={(v) => setFilters({ ...filters, year: v })}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.department || "all"} onValueChange={(v) => setFilters({ ...filters, department: v === "all" ? "" : v })}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={openNewHeadcountPlan} data-testid="add-headcount-plan-btn">
                <Plus className="w-4 h-4 mr-2" />
                New Plan
              </Button>
            </div>
            
            <div className="p-4">
              {headcountPlans.length > 0 ? (
                <div className="space-y-4">
                  {headcountPlans.map((plan) => (
                    <div key={plan.id} className="border border-slate-200 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-slate-900">{plan.name}</h4>
                          <p className="text-sm text-slate-500">
                            {plan.department_name || 'All Departments'} • {plan.fiscal_year} {plan.quarter || ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                            {plan.status}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => openEditHeadcountPlan(plan)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteHeadcountPlan(plan.id)}>
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                          <p className="text-2xl font-bold text-slate-900">{plan.current_headcount}</p>
                          <p className="text-xs text-slate-500">Current</p>
                        </div>
                        <div className="text-center p-3 bg-emerald-50 rounded-lg">
                          <p className="text-2xl font-bold text-emerald-600">+{plan.planned_hires}</p>
                          <p className="text-xs text-slate-500">Hires</p>
                        </div>
                        <div className="text-center p-3 bg-rose-50 rounded-lg">
                          <p className="text-2xl font-bold text-rose-600">-{plan.planned_departures}</p>
                          <p className="text-xs text-slate-500">Departures</p>
                        </div>
                        <div className="text-center p-3 bg-indigo-50 rounded-lg">
                          <p className="text-2xl font-bold text-indigo-600">{plan.target_headcount}</p>
                          <p className="text-xs text-slate-500">Target</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">{formatCurrency(plan.budget_allocated)}</p>
                          <p className="text-xs text-slate-500">Budget</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">No headcount plans found</p>
                  <Button className="mt-4" onClick={openNewHeadcountPlan}>Create First Plan</Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Skills Gap Tab */}
        <TabsContent value="skills" className="mt-6">
          <div className="bg-white rounded-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Select value={filters.department || "all"} onValueChange={(v) => setFilters({ ...filters, department: v === "all" ? "" : v })}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleRunSkillsAnalysis} data-testid="run-skills-analysis-btn">
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Analysis
              </Button>
            </div>
            
            <div className="p-4">
              {skillGaps.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Skill</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Category</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">Required</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">Current Avg</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">Gap</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">Employees</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Priority</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skillGaps.map((gap) => (
                        <tr key={gap.id || gap.skill_name} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-900">{gap.skill_name}</td>
                          <td className="py-3 px-4 text-slate-600 capitalize">{gap.skill_category}</td>
                          <td className="py-3 px-4 text-center text-slate-900">{gap.required_level}</td>
                          <td className="py-3 px-4 text-center text-slate-900">{gap.current_avg_level}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-medium ${gap.gap_score > 1 ? 'text-rose-600' : gap.gap_score > 0.5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {gap.gap_score}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-900">{gap.employees_with_skill}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(gap.priority)}`}>
                              {gap.priority}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 capitalize">{gap.recommended_action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">No skills gap data</p>
                  <p className="text-sm text-slate-400 mt-1">Run analysis to identify skill gaps</p>
                  <Button className="mt-4" onClick={handleRunSkillsAnalysis}>Run Analysis</Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Allocations Tab */}
        <TabsContent value="allocations" className="mt-6">
          <div className="bg-white rounded-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900">Resource Allocations</h3>
              <Button onClick={() => { setSelectedItem(null); setAllocationDialog(true); }} data-testid="add-allocation-btn">
                <Plus className="w-4 h-4 mr-2" />
                New Allocation
              </Button>
            </div>
            
            <div className="p-4">
              {allocations.length > 0 ? (
                <div className="space-y-3">
                  {allocations.map((allocation) => (
                    <div key={allocation.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                          <Users className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{allocation.employee_name || 'Employee'}</p>
                          <p className="text-sm text-slate-500">{allocation.project_name || allocation.team_name || 'Project'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900">{allocation.allocation_percentage}%</p>
                          <p className="text-xs text-slate-500">{allocation.role_in_project || 'Team Member'}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(allocation.status)}`}>
                          {allocation.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Layers className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">No allocations found</p>
                  <Button className="mt-4" onClick={() => setAllocationDialog(true)}>Create First Allocation</Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Scenarios Tab */}
        <TabsContent value="scenarios" className="mt-6">
          <div className="bg-white rounded-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900">Workforce Scenarios</h3>
              <Button onClick={() => { setSelectedItem(null); setScenarioDialog(true); }} data-testid="add-scenario-btn">
                <Plus className="w-4 h-4 mr-2" />
                New Scenario
              </Button>
            </div>
            
            <div className="p-4">
              {scenarios.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {scenarios.map((scenario) => (
                    <div key={scenario.id} className="border border-slate-200 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-900">{scenario.name}</h4>
                          <p className="text-sm text-slate-500 capitalize">{scenario.scenario_type} • {scenario.implementation_months} months</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(scenario.status)}`}>
                          {scenario.status}
                        </span>
                      </div>
                      
                      {scenario.description && (
                        <p className="text-sm text-slate-600 mb-3">{scenario.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                          <p className="text-lg font-bold text-slate-900">{scenario.base_headcount} → {scenario.projected_headcount}</p>
                          <p className="text-xs text-slate-500">Headcount</p>
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                          <p className="text-lg font-bold text-slate-900">{formatCurrency(scenario.projected_cost - scenario.base_cost)}</p>
                          <p className="text-xs text-slate-500">Cost Impact</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${scenario.productivity_impact === 'positive' ? 'bg-emerald-100 text-emerald-700' : scenario.productivity_impact === 'negative' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                          Productivity: {scenario.productivity_impact}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${scenario.morale_impact === 'positive' ? 'bg-emerald-100 text-emerald-700' : scenario.morale_impact === 'negative' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                          Morale: {scenario.morale_impact}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Zap className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">No scenarios created</p>
                  <p className="text-sm text-slate-400 mt-1">Model different workforce scenarios</p>
                  <Button className="mt-4" onClick={() => setScenarioDialog(true)}>Create First Scenario</Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Headcount Plan Dialog */}
      <Dialog open={headcountPlanDialog} onOpenChange={setHeadcountPlanDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">{selectedItem ? 'Edit Headcount Plan' : 'New Headcount Plan'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Plan Name *</label>
                <Input
                  value={headcountForm.name}
                  onChange={(e) => setHeadcountForm({ ...headcountForm, name: e.target.value })}
                  placeholder="e.g., Q1 2025 Engineering Hiring"
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Department</label>
                <Select value={headcountForm.department_id || "all"} onValueChange={(v) => setHeadcountForm({ ...headcountForm, department_id: v === "all" ? "" : v })}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Fiscal Year</label>
                <Select value={headcountForm.fiscal_year} onValueChange={(v) => setHeadcountForm({ ...headcountForm, fiscal_year: v })}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Quarter (Optional)</label>
                <Select value={headcountForm.quarter || "full_year"} onValueChange={(v) => setHeadcountForm({ ...headcountForm, quarter: v === "full_year" ? "" : v })}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Select quarter" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="full_year">Full Year</SelectItem>
                    <SelectItem value="Q1">Q1</SelectItem>
                    <SelectItem value="Q2">Q2</SelectItem>
                    <SelectItem value="Q3">Q3</SelectItem>
                    <SelectItem value="Q4">Q4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Current Headcount</label>
                <Input
                  type="number"
                  value={headcountForm.current_headcount}
                  onChange={(e) => setHeadcountForm({ ...headcountForm, current_headcount: parseInt(e.target.value) || 0 })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Planned Hires</label>
                <Input
                  type="number"
                  value={headcountForm.planned_hires}
                  onChange={(e) => setHeadcountForm({ ...headcountForm, planned_hires: parseInt(e.target.value) || 0 })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Planned Departures</label>
                <Input
                  type="number"
                  value={headcountForm.planned_departures}
                  onChange={(e) => setHeadcountForm({ ...headcountForm, planned_departures: parseInt(e.target.value) || 0 })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Target Headcount</label>
                <Input
                  type="number"
                  value={headcountForm.target_headcount}
                  onChange={(e) => setHeadcountForm({ ...headcountForm, target_headcount: parseInt(e.target.value) || 0 })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Budget Allocated ($)</label>
                <Input
                  type="number"
                  value={headcountForm.budget_allocated}
                  onChange={(e) => setHeadcountForm({ ...headcountForm, budget_allocated: parseFloat(e.target.value) || 0 })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Notes</label>
                <Textarea
                  value={headcountForm.notes}
                  onChange={(e) => setHeadcountForm({ ...headcountForm, notes: e.target.value })}
                  rows={3}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" onClick={() => setHeadcountPlanDialog(false)} className="dark:border-slate-600 dark:text-slate-200">Cancel</Button>
              <Button onClick={handleSaveHeadcountPlan} data-testid="save-headcount-plan-btn">
                {selectedItem ? 'Update Plan' : 'Create Plan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Allocation Dialog */}
      <Dialog open={allocationDialog} onOpenChange={setAllocationDialog}>
        <DialogContent className="max-w-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">{selectedItem ? 'Edit Allocation' : 'New Allocation'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Employee *</label>
              <Select value={allocationForm.employee_id || "select"} onValueChange={(v) => setAllocationForm({ ...allocationForm, employee_id: v === "select" ? "" : v })}>
                <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectItem value="select" disabled>Select employee</SelectItem>
                  {employees.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Project</label>
              <Select value={allocationForm.project_id || "select"} onValueChange={(v) => setAllocationForm({ ...allocationForm, project_id: v === "select" ? "" : v })}>
                <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectItem value="select" disabled>Select project</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Role in Project</label>
              <Input
                value={allocationForm.role_in_project}
                onChange={(e) => setAllocationForm({ ...allocationForm, role_in_project: e.target.value })}
                placeholder="e.g., Lead Developer, Consultant"
                className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Allocation % *</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={allocationForm.allocation_percentage}
                onChange={(e) => setAllocationForm({ ...allocationForm, allocation_percentage: parseInt(e.target.value) || 0 })}
                className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Start Date</label>
                <Input
                  type="date"
                  value={allocationForm.start_date}
                  onChange={(e) => setAllocationForm({ ...allocationForm, start_date: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">End Date</label>
                <Input
                  type="date"
                  value={allocationForm.end_date}
                  onChange={(e) => setAllocationForm({ ...allocationForm, end_date: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" onClick={() => setAllocationDialog(false)} className="dark:border-slate-600 dark:text-slate-200">Cancel</Button>
              <Button onClick={handleSaveAllocation}>
                {selectedItem ? 'Update' : 'Create'} Allocation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Scenario Dialog */}
      <Dialog open={scenarioDialog} onOpenChange={setScenarioDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">{selectedItem ? 'Edit Scenario' : 'New Scenario'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Scenario Name *</label>
                <Input
                  value={scenarioForm.name}
                  onChange={(e) => setScenarioForm({ ...scenarioForm, name: e.target.value })}
                  placeholder="e.g., 20% Growth Scenario"
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Description</label>
                <Textarea
                  value={scenarioForm.description}
                  onChange={(e) => setScenarioForm({ ...scenarioForm, description: e.target.value })}
                  rows={2}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Scenario Type</label>
                <Select value={scenarioForm.scenario_type} onValueChange={(v) => setScenarioForm({ ...scenarioForm, scenario_type: v })}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="reduction">Reduction</SelectItem>
                    <SelectItem value="restructure">Restructure</SelectItem>
                    <SelectItem value="merger">Merger/Acquisition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Implementation (months)</label>
                <Input
                  type="number"
                  value={scenarioForm.implementation_months}
                  onChange={(e) => setScenarioForm({ ...scenarioForm, implementation_months: parseInt(e.target.value) || 6 })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Base Headcount</label>
                <Input
                  type="number"
                  value={scenarioForm.base_headcount}
                  onChange={(e) => setScenarioForm({ ...scenarioForm, base_headcount: parseInt(e.target.value) || 0 })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Projected Headcount</label>
                <Input
                  type="number"
                  value={scenarioForm.projected_headcount}
                  onChange={(e) => setScenarioForm({ ...scenarioForm, projected_headcount: parseInt(e.target.value) || 0 })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Base Cost ($)</label>
                <Input
                  type="number"
                  value={scenarioForm.base_cost}
                  onChange={(e) => setScenarioForm({ ...scenarioForm, base_cost: parseFloat(e.target.value) || 0 })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Projected Cost ($)</label>
                <Input
                  type="number"
                  value={scenarioForm.projected_cost}
                  onChange={(e) => setScenarioForm({ ...scenarioForm, projected_cost: parseFloat(e.target.value) || 0 })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Productivity Impact</label>
                <Select value={scenarioForm.productivity_impact} onValueChange={(v) => setScenarioForm({ ...scenarioForm, productivity_impact: v })}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Morale Impact</label>
                <Select value={scenarioForm.morale_impact} onValueChange={(v) => setScenarioForm({ ...scenarioForm, morale_impact: v })}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" onClick={() => setScenarioDialog(false)} className="dark:border-slate-600 dark:text-slate-200">Cancel</Button>
              <Button onClick={handleSaveScenario}>
                {selectedItem ? 'Update' : 'Create'} Scenario
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkforcePlanning;
