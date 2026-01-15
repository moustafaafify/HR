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
  UserMinus, 
  Users, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2,
  PlayCircle,
  ListChecks,
  User,
  Calendar,
  FileText,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Check,
  Star,
  Shield,
  Key,
  Laptop,
  DollarSign,
  MessageSquare,
  AlertTriangle,
  Target,
  Briefcase,
  ClipboardList,
  UserX
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TASK_CATEGORIES = [
  { value: 'asset_return', label: 'Asset Return', color: 'bg-amber-100 text-amber-700', icon: Laptop },
  { value: 'access_revocation', label: 'Access Revocation', color: 'bg-red-100 text-red-700', icon: Key },
  { value: 'knowledge_transfer', label: 'Knowledge Transfer', color: 'bg-blue-100 text-blue-700', icon: FileText },
  { value: 'documentation', label: 'Documentation', color: 'bg-purple-100 text-purple-700', icon: ClipboardList },
  { value: 'exit_interview', label: 'Exit Interview', color: 'bg-emerald-100 text-emerald-700', icon: MessageSquare },
  { value: 'clearance', label: 'Clearance', color: 'bg-indigo-100 text-indigo-700', icon: Shield },
  { value: 'administrative', label: 'Administrative', color: 'bg-slate-100 text-slate-700', icon: Briefcase },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700', icon: ListChecks }
];

const SEPARATION_REASONS = [
  { value: 'resignation', label: 'Resignation' },
  { value: 'termination', label: 'Termination' },
  { value: 'retirement', label: 'Retirement' },
  { value: 'contract_end', label: 'Contract End' },
  { value: 'layoff', label: 'Layoff' }
];

const OFFBOARDING_STATUS = [
  { value: 'not_started', label: 'Not Started', color: 'bg-slate-100 text-slate-700' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-amber-100 text-amber-700' }
];

const Offboarding = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('active');
  const [templates, setTemplates] = useState([]);
  const [offboardings, setOffboardings] = useState([]);
  const [myOffboarding, setMyOffboarding] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Dialogs
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [clearanceDialogOpen, setClearanceDialogOpen] = useState(false);
  const [exitInterviewDialogOpen, setExitInterviewDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  
  // Selected items
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedOffboarding, setSelectedOffboarding] = useState(null);
  const [expandedTemplate, setExpandedTemplate] = useState(null);
  
  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';
  
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    department_id: '',
    reason_type: '',
    duration_days: 14,
    exit_message: '',
    tasks: []
  });

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'administrative',
    due_day: 1,
    is_required: true,
    assigned_to_type: 'hr'
  });

  const [assignForm, setAssignForm] = useState({
    template_id: '',
    employee_id: '',
    last_working_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reason: 'resignation',
    reason_details: '',
    manager_id: '',
    hr_contact_id: '',
    notes: ''
  });

  const [clearanceForm, setClearanceForm] = useState({
    clearance_hr: false,
    clearance_it: false,
    clearance_finance: false,
    clearance_manager: false,
    clearance_admin: false
  });

  const [exitInterviewForm, setExitInterviewForm] = useState({
    conducted: false,
    date: '',
    notes: ''
  });

  const [feedbackForm, setFeedbackForm] = useState({
    feedback: '',
    rating: 0
  });

  useEffect(() => {
    fetchTemplates();
    fetchOffboardings();
    fetchEmployees();
    fetchDepartments();
    fetchStats();
    if (!isAdmin) {
      fetchMyOffboarding();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API}/offboarding-templates`);
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchOffboardings = async () => {
    try {
      const response = await axios.get(`${API}/offboardings`);
      setOffboardings(response.data);
    } catch (error) {
      console.error('Failed to fetch offboardings:', error);
    }
  };

  const fetchMyOffboarding = async () => {
    try {
      const response = await axios.get(`${API}/offboardings/my`);
      setMyOffboarding(response.data);
    } catch (error) {
      console.error('Failed to fetch my offboarding:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/offboardings/stats`);
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

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API}/departments`);
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const handleTemplateSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        ...templateForm,
        department_id: templateForm.department_id === 'all' ? '' : templateForm.department_id
      };
      if (editingTemplate) {
        await axios.put(`${API}/offboarding-templates/${editingTemplate.id}`, formData);
        toast.success('Template updated successfully');
      } else {
        await axios.post(`${API}/offboarding-templates`, formData);
        toast.success('Template created successfully');
      }
      fetchTemplates();
      resetTemplateForm();
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const handleAssignOffboarding = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/offboardings`, assignForm);
      toast.success('Offboarding started successfully');
      fetchOffboardings();
      fetchStats();
      setAssignDialogOpen(false);
      resetAssignForm();
    } catch (error) {
      toast.error('Failed to start offboarding');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await axios.delete(`${API}/offboarding-templates/${templateId}`);
      toast.success('Template deleted');
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const handleTaskComplete = async (offboardingId, taskIndex, completed) => {
    try {
      await axios.put(`${API}/offboardings/${offboardingId}/tasks/${taskIndex}`, { completed });
      toast.success(completed ? 'Task completed!' : 'Task marked incomplete');
      fetchOffboardings();
      fetchStats();
      if (!isAdmin) fetchMyOffboarding();
      if (selectedOffboarding?.id === offboardingId) {
        const response = await axios.get(`${API}/offboardings/${offboardingId}`);
        setSelectedOffboarding(response.data);
      }
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleClearanceUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/offboardings/${selectedOffboarding.id}/clearance`, clearanceForm);
      toast.success('Clearance updated');
      fetchOffboardings();
      const response = await axios.get(`${API}/offboardings/${selectedOffboarding.id}`);
      setSelectedOffboarding(response.data);
      setClearanceDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update clearance');
    }
  };

  const handleExitInterviewUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/offboardings/${selectedOffboarding.id}/exit-interview`, exitInterviewForm);
      toast.success('Exit interview updated');
      fetchOffboardings();
      const response = await axios.get(`${API}/offboardings/${selectedOffboarding.id}`);
      setSelectedOffboarding(response.data);
      setExitInterviewDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update exit interview');
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/offboardings/${selectedOffboarding.id}/feedback`, feedbackForm);
      toast.success('Thank you for your feedback!');
      setFeedbackDialogOpen(false);
      fetchOffboardings();
      if (!isAdmin) fetchMyOffboarding();
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  };

  const updateOffboardingStatus = async (offboardingId, status) => {
    try {
      await axios.put(`${API}/offboardings/${offboardingId}`, { status });
      toast.success('Status updated');
      fetchOffboardings();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const addTask = () => {
    if (!newTask.title) return;
    setTemplateForm({
      ...templateForm,
      tasks: [...templateForm.tasks, { ...newTask, order: templateForm.tasks.length + 1 }]
    });
    setNewTask({
      title: '',
      description: '',
      category: 'administrative',
      due_day: 1,
      is_required: true,
      assigned_to_type: 'hr'
    });
  };

  const removeTask = (index) => {
    const newTasks = templateForm.tasks.filter((_, i) => i !== index);
    newTasks.forEach((task, i) => task.order = i + 1);
    setTemplateForm({ ...templateForm, tasks: newTasks });
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      department_id: '',
      reason_type: '',
      duration_days: 14,
      exit_message: '',
      tasks: []
    });
    setEditingTemplate(null);
    setTemplateDialogOpen(false);
  };

  const resetAssignForm = () => {
    setAssignForm({
      template_id: '',
      employee_id: '',
      last_working_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reason: 'resignation',
      reason_details: '',
      manager_id: '',
      hr_contact_id: '',
      notes: ''
    });
  };

  const openEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name || '',
      description: template.description || '',
      department_id: template.department_id || '',
      reason_type: template.reason_type || '',
      duration_days: template.duration_days || 14,
      exit_message: template.exit_message || '',
      tasks: template.tasks || []
    });
    setTemplateDialogOpen(true);
  };

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : '-';
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.full_name : '-';
  };

  const getCategoryInfo = (category) => {
    return TASK_CATEGORIES.find(c => c.value === category) || TASK_CATEGORIES[7];
  };

  const getStatusInfo = (status) => {
    return OFFBOARDING_STATUS.find(s => s.value === status) || OFFBOARDING_STATUS[0];
  };

  const getReasonLabel = (reason) => {
    const r = SEPARATION_REASONS.find(s => s.value === reason);
    return r ? r.label : reason;
  };

  const calculateProgress = (offboarding) => {
    if (!offboarding?.tasks || offboarding.tasks.length === 0) return 0;
    const completed = offboarding.tasks.filter(t => t.completed).length;
    return Math.round((completed / offboarding.tasks.length) * 100);
  };

  const getDaysUntilLastDay = (lastWorkingDate) => {
    if (!lastWorkingDate) return null;
    const lastDay = new Date(lastWorkingDate);
    const today = new Date();
    const diff = Math.ceil((lastDay - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getClearanceCount = (offboarding) => {
    const fields = ['clearance_hr', 'clearance_it', 'clearance_finance', 'clearance_manager', 'clearance_admin'];
    return fields.filter(f => offboarding[f]).length;
  };

  // Employee View Component
  const EmployeeOffboardingView = () => {
    if (!myOffboarding) {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <UserMinus size={48} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Offboarding</h3>
          <p className="text-slate-500">You don't have an active offboarding process at the moment.</p>
        </div>
      );
    }

    const progress = calculateProgress(myOffboarding);
    const daysLeft = getDaysUntilLastDay(myOffboarding.last_working_date);
    const completedTasks = myOffboarding.tasks?.filter(t => t.completed).length || 0;
    const totalTasks = myOffboarding.tasks?.length || 0;
    const clearanceCount = getClearanceCount(myOffboarding);

    // Group tasks by category
    const tasksByCategory = TASK_CATEGORIES.map(cat => ({
      ...cat,
      tasks: myOffboarding.tasks?.filter(t => t.category === cat.value) || []
    })).filter(cat => cat.tasks.length > 0);

    return (
      <div className="space-y-6">
        {/* Exit Message Banner */}
        {myOffboarding.exit_message && (
          <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-2xl p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 rounded-xl p-3">
                <UserMinus size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Offboarding in Progress</h3>
                <p className="text-slate-300">{myOffboarding.exit_message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Overview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Your Offboarding Progress</h2>
              <p className="text-slate-500 text-sm">
                Last working day: {new Date(myOffboarding.last_working_date).toLocaleDateString()}
                {daysLeft !== null && daysLeft > 0 && ` • ${daysLeft} days remaining`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-slate-700">{progress}%</p>
              <p className="text-sm text-slate-500">{completedTasks} of {totalTasks} tasks</p>
            </div>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-slate-600 to-slate-800 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{completedTasks}</p>
            <p className="text-xs text-slate-500">Completed</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{totalTasks - completedTasks}</p>
            <p className="text-xs text-slate-500">Remaining</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">{clearanceCount}/5</p>
            <p className="text-xs text-slate-500">Clearances</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{daysLeft || 0}</p>
            <p className="text-xs text-slate-500">Days Left</p>
          </div>
        </div>

        {/* Clearance Status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4">Clearance Status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { key: 'clearance_hr', label: 'HR', icon: Users },
              { key: 'clearance_it', label: 'IT', icon: Laptop },
              { key: 'clearance_finance', label: 'Finance', icon: DollarSign },
              { key: 'clearance_manager', label: 'Manager', icon: User },
              { key: 'clearance_admin', label: 'Admin', icon: Shield }
            ].map(item => {
              const Icon = item.icon;
              const cleared = myOffboarding[item.key];
              return (
                <div 
                  key={item.key} 
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    cleared 
                      ? 'bg-emerald-50 border-emerald-500' 
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <Icon size={24} className={`mx-auto mb-2 ${cleared ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <p className={`text-sm font-medium ${cleared ? 'text-emerald-700' : 'text-slate-600'}`}>{item.label}</p>
                  <p className={`text-xs mt-1 ${cleared ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {cleared ? 'Cleared' : 'Pending'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tasks by Category */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900">Your Tasks</h3>
          {tasksByCategory.map((category) => {
            const CategoryIcon = category.icon;
            const categoryCompleted = category.tasks.filter(t => t.completed).length;
            return (
              <div key={category.value} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className={`p-4 ${category.color} flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <CategoryIcon size={20} />
                    <span className="font-bold">{category.label}</span>
                  </div>
                  <span className="text-sm">{categoryCompleted}/{category.tasks.length} completed</span>
                </div>
                <div className="p-4 space-y-3">
                  {category.tasks.map((task, idx) => {
                    const globalIdx = myOffboarding.tasks.findIndex(t => t === task);
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                          task.completed 
                            ? 'bg-emerald-50 border-emerald-200' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <button
                          onClick={() => handleTaskComplete(myOffboarding.id, globalIdx, !task.completed)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all mt-0.5 ${
                            task.completed 
                              ? 'bg-emerald-500 border-emerald-500 text-white' 
                              : 'border-slate-300 hover:border-slate-500'
                          }`}
                        >
                          {task.completed && <Check size={14} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${task.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs text-slate-400">
                              Assigned to: {task.assigned_to_type?.toUpperCase()}
                            </span>
                            {task.is_required && !task.completed && (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded text-xs font-medium">
                                Required
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Contacts */}
        {(myOffboarding.manager_id || myOffboarding.hr_contact_id) && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4">Your Offboarding Contacts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myOffboarding.manager_id && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                    <User size={20} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Manager</p>
                    <p className="font-medium text-slate-900">{getEmployeeName(myOffboarding.manager_id)}</p>
                  </div>
                </div>
              )}
              {myOffboarding.hr_contact_id && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Users size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">HR Contact</p>
                    <p className="font-medium text-slate-900">{getEmployeeName(myOffboarding.hr_contact_id)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Exit Interview Info */}
        {myOffboarding.exit_interview_date && (
          <div className="bg-indigo-50 rounded-2xl border border-indigo-200 p-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="text-indigo-600" size={24} />
              <div>
                <h3 className="font-bold text-indigo-900">Exit Interview Scheduled</h3>
                <p className="text-indigo-700">
                  {new Date(myOffboarding.exit_interview_date).toLocaleDateString()} at {new Date(myOffboarding.exit_interview_date).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Button */}
        {myOffboarding.status === 'completed' && !myOffboarding.feedback && (
          <div className="bg-gradient-to-r from-slate-600 to-slate-800 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Offboarding Complete</h3>
                <p className="text-slate-300">We'd appreciate your feedback on your experience.</p>
              </div>
              <Button 
                onClick={() => { setSelectedOffboarding(myOffboarding); setFeedbackDialogOpen(true); }}
                className="bg-white text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                <MessageSquare size={16} className="mr-2" />
                Give Feedback
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // If not admin, show employee view
  if (!isAdmin) {
    return (
      <div data-testid="offboarding-page" className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            My Offboarding
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1">Track your offboarding progress and complete tasks</p>
        </div>
        <EmployeeOffboardingView />

        {/* Feedback Dialog */}
        <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
          <DialogContent className="rounded-2xl max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <MessageSquare className="text-slate-600" size={24} />
                Exit Feedback
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitFeedback} className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">How was your overall experience?</label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        size={32}
                        className={star <= feedbackForm.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Your feedback</label>
                <textarea
                  value={feedbackForm.feedback}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all outline-none resize-none"
                  rows={4}
                  placeholder="Share your thoughts about your experience..."
                  required
                />
              </div>
              <Button type="submit" className="w-full rounded-xl bg-slate-700 hover:bg-slate-800">
                Submit Feedback
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Admin View
  return (
    <div data-testid="offboarding-page" className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Offboarding
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1">Manage employee offboarding processes</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => { resetAssignForm(); setAssignDialogOpen(true); }}
            className="rounded-xl bg-slate-700 hover:bg-slate-800 gap-2"
            data-testid="start-offboarding-btn"
          >
            <UserMinus size={18} />
            <span className="hidden sm:inline">Start Offboarding</span>
            <span className="sm:hidden">Start</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300 text-xs sm:text-sm">In Progress</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{stats?.in_progress || 0}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <Users size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs sm:text-sm">Completed</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{stats?.completed || 0}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <CheckCircle2 size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-xs sm:text-sm">Overdue Tasks</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{stats?.overdue_tasks || 0}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <AlertTriangle size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs sm:text-sm">Avg Completion</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{stats?.avg_completion_rate || 0}%</p>
            </div>
            <div className="bg-slate-100 rounded-xl p-2 sm:p-3">
              <Target size={20} className="text-slate-600 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList className="bg-slate-100 p-1 rounded-xl w-full sm:w-auto flex">
            <TabsTrigger value="active" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
              <Users size={14} className="sm:w-4 sm:h-4" />
              Active
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
              <CheckCircle2 size={14} className="sm:w-4 sm:h-4" />
              Completed
            </TabsTrigger>
            <TabsTrigger value="templates" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
              <ListChecks size={14} className="sm:w-4 sm:h-4" />
              Templates
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Active Offboardings Tab */}
        <TabsContent value="active" className="mt-4">
          <div className="space-y-4">
            {offboardings.filter(o => o.status !== 'completed').length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <UserMinus size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No active offboardings</p>
                <Button 
                  onClick={() => setAssignDialogOpen(true)}
                  variant="outline" 
                  className="mt-4 rounded-xl"
                >
                  <Plus size={16} className="mr-2" />
                  Start New Offboarding
                </Button>
              </div>
            ) : (
              offboardings.filter(o => o.status !== 'completed').map((offboarding) => {
                const progress = calculateProgress(offboarding);
                const statusInfo = getStatusInfo(offboarding.status);
                const daysLeft = getDaysUntilLastDay(offboarding.last_working_date);
                const clearanceCount = getClearanceCount(offboarding);
                
                return (
                  <div key={offboarding.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                          <UserX size={24} className="text-slate-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{getEmployeeName(offboarding.employee_id)}</h3>
                          <p className="text-sm text-slate-500">
                            {getReasonLabel(offboarding.reason)} • Last day: {new Date(offboarding.last_working_date).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            <span className="text-xs text-slate-400">
                              Clearance: {clearanceCount}/5
                            </span>
                            {daysLeft !== null && (
                              <span className={`text-xs ${daysLeft <= 3 ? 'text-rose-600 font-medium' : 'text-slate-400'}`}>
                                {daysLeft > 0 ? `${daysLeft} days left` : 'Last day passed'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-2xl font-bold text-slate-900">{progress}%</p>
                          <p className="text-xs text-slate-500">
                            {offboarding.tasks?.filter(t => t.completed).length}/{offboarding.tasks?.length} tasks
                          </p>
                        </div>
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                          <div 
                            className="h-full bg-slate-600 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <Button
                          onClick={() => { setSelectedOffboarding(offboarding); setViewDialogOpen(true); }}
                          variant="outline"
                          className="rounded-xl"
                        >
                          <Eye size={16} className="sm:mr-2" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                      </div>
                    </div>
                    {/* Mobile progress bar */}
                    <div className="sm:hidden mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">Progress</span>
                        <span className="font-bold">{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-slate-600 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Completed Offboardings Tab */}
        <TabsContent value="completed" className="mt-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Employee</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700 hidden md:table-cell">Reason</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700 hidden sm:table-cell">Last Day</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Rating</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {offboardings.filter(o => o.status === 'completed').length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <CheckCircle2 size={40} className="mx-auto mb-4 text-slate-300" />
                      <p className="text-slate-500">No completed offboardings yet</p>
                    </td>
                  </tr>
                ) : (
                  offboardings.filter(o => o.status === 'completed').map((offboarding) => (
                    <tr key={offboarding.id} className="border-b border-slate-100">
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <p className="font-medium text-slate-900">{getEmployeeName(offboarding.employee_id)}</p>
                        <p className="text-xs text-slate-400">
                          Completed {offboarding.completed_at ? new Date(offboarding.completed_at).toLocaleDateString() : '-'}
                        </p>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 hidden md:table-cell">
                        {getReasonLabel(offboarding.reason)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 hidden sm:table-cell">
                        {new Date(offboarding.last_working_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        {offboarding.feedback_rating ? (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={14}
                                className={star <= offboarding.feedback_rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">No rating</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <Button
                          onClick={() => { setSelectedOffboarding(offboarding); setViewDialogOpen(true); }}
                          size="sm"
                          variant="ghost"
                          className="rounded-lg"
                        >
                          <Eye size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button 
              onClick={() => { resetTemplateForm(); setTemplateDialogOpen(true); }}
              className="rounded-xl bg-slate-700 hover:bg-slate-800 gap-2"
            >
              <Plus size={18} />
              Create Template
            </Button>
          </div>
          <div className="space-y-4">
            {templates.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <ListChecks size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No templates created yet</p>
                <Button 
                  onClick={() => setTemplateDialogOpen(true)}
                  variant="outline" 
                  className="mt-4 rounded-xl"
                >
                  <Plus size={16} className="mr-2" />
                  Create First Template
                </Button>
              </div>
            ) : (
              templates.map((template) => (
                <div key={template.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div 
                    className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                    onClick={() => setExpandedTemplate(expandedTemplate === template.id ? null : template.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center">
                          <ListChecks size={20} className="text-slate-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{template.name}</h3>
                          <p className="text-sm text-slate-500">
                            {template.tasks?.length || 0} tasks • {template.duration_days} days
                            {template.reason_type && ` • ${getReasonLabel(template.reason_type)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={(e) => { e.stopPropagation(); openEditTemplate(template); }}
                          size="sm"
                          variant="ghost"
                          className="rounded-lg"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }}
                          size="sm"
                          variant="ghost"
                          className="rounded-lg text-rose-600"
                        >
                          <Trash2 size={16} />
                        </Button>
                        {expandedTemplate === template.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </div>
                    </div>
                  </div>
                  {expandedTemplate === template.id && template.tasks?.length > 0 && (
                    <div className="border-t border-slate-200 p-5 bg-slate-50/50">
                      <p className="text-sm font-medium text-slate-700 mb-3">Tasks</p>
                      <div className="space-y-2">
                        {template.tasks.map((task, idx) => {
                          const categoryInfo = getCategoryInfo(task.category);
                          const CategoryIcon = categoryInfo.icon;
                          return (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                {idx + 1}
                              </span>
                              <CategoryIcon size={16} className="text-slate-500" />
                              <div className="flex-1">
                                <p className="font-medium text-slate-900 text-sm">{task.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`px-2 py-0.5 rounded text-xs ${categoryInfo.color}`}>
                                    {categoryInfo.label}
                                  </span>
                                  <span className="text-xs text-slate-400">Day {task.due_day}</span>
                                  {task.is_required && (
                                    <span className="text-xs text-rose-500">Required</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <ListChecks className="text-slate-600" size={24} />
              {editingTemplate ? 'Edit Template' : 'Create Offboarding Template'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTemplateSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Template Name *</label>
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="rounded-xl"
                  placeholder="e.g. Standard Resignation"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Separation Reason</label>
                <Select value={templateForm.reason_type || 'all'} onValueChange={(v) => setTemplateForm({ ...templateForm, reason_type: v === 'all' ? '' : v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="All reasons" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reasons</SelectItem>
                    {SEPARATION_REASONS.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>{reason.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Duration (Days)</label>
                <Input
                  type="number"
                  value={templateForm.duration_days}
                  onChange={(e) => setTemplateForm({ ...templateForm, duration_days: parseInt(e.target.value) || 14 })}
                  className="rounded-xl"
                  min={1}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Exit Message</label>
                <textarea
                  value={templateForm.exit_message}
                  onChange={(e) => setTemplateForm({ ...templateForm, exit_message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all outline-none resize-none"
                  rows={2}
                  placeholder="Message shown to departing employees..."
                />
              </div>
            </div>

            {/* Tasks Section */}
            <div className="border-t border-slate-200 pt-4 mt-4">
              <p className="font-bold text-slate-900 mb-3">Offboarding Tasks</p>
              
              {templateForm.tasks.length > 0 && (
                <div className="space-y-2 mb-4">
                  {templateForm.tasks.map((task, idx) => {
                    const categoryInfo = getCategoryInfo(task.category);
                    return (
                      <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                        <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`px-1.5 py-0.5 rounded text-xs ${categoryInfo.color}`}>
                              {categoryInfo.label}
                            </span>
                            <span className="text-xs text-slate-400">Day {task.due_day}</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={() => removeTask(idx)}
                          size="sm"
                          variant="ghost"
                          className="text-rose-600 flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add New Task */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <Input
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="rounded-lg"
                      placeholder="Task title *"
                    />
                  </div>
                  <Select value={newTask.category} onValueChange={(v) => setNewTask({ ...newTask, category: v })}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={newTask.due_day}
                    onChange={(e) => setNewTask({ ...newTask, due_day: parseInt(e.target.value) || 1 })}
                    className="rounded-lg"
                    placeholder="Due day"
                    min={1}
                  />
                  <Select value={newTask.assigned_to_type} onValueChange={(v) => setNewTask({ ...newTask, assigned_to_type: v })}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Assigned to" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                      <SelectItem value="it">IT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTask.is_required}
                      onChange={(e) => setNewTask({ ...newTask, is_required: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-700">Required task</span>
                  </label>
                  <Button type="button" onClick={addTask} variant="outline" className="rounded-lg" disabled={!newTask.title}>
                    <Plus size={16} className="mr-1" />
                    Add Task
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="rounded-xl bg-slate-700 hover:bg-slate-800 flex-1">
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </Button>
              <Button type="button" onClick={resetTemplateForm} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Start Offboarding Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <UserMinus className="text-slate-600" size={24} />
              Start Offboarding
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignOffboarding} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Employee *</label>
              <Select value={assignForm.employee_id} onValueChange={(v) => setAssignForm({ ...assignForm, employee_id: v })} required>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Offboarding Template</label>
              <Select value={assignForm.template_id} onValueChange={(v) => setAssignForm({ ...assignForm, template_id: v })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No template</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.tasks?.length || 0} tasks)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Separation Reason *</label>
              <Select value={assignForm.reason} onValueChange={(v) => setAssignForm({ ...assignForm, reason: v })} required>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEPARATION_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>{reason.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Last Working Date *</label>
              <Input
                type="date"
                value={assignForm.last_working_date}
                onChange={(e) => setAssignForm({ ...assignForm, last_working_date: e.target.value })}
                className="rounded-xl"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Reporting Manager</label>
              <Select value={assignForm.manager_id} onValueChange={(v) => setAssignForm({ ...assignForm, manager_id: v })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">HR Contact</label>
              <Select value={assignForm.hr_contact_id} onValueChange={(v) => setAssignForm({ ...assignForm, hr_contact_id: v })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select HR contact" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Notes</label>
              <textarea
                value={assignForm.notes}
                onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all outline-none resize-none"
                rows={2}
                placeholder="Any special notes..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-xl bg-slate-700 hover:bg-slate-800 flex-1">
                Start Offboarding
              </Button>
              <Button type="button" onClick={() => setAssignDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Offboarding Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <UserMinus className="text-slate-600" size={24} />
              Offboarding Details
            </DialogTitle>
          </DialogHeader>
          {selectedOffboarding && (
            <div className="space-y-6 mt-4">
              {/* Employee Info */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center">
                  <UserX size={28} className="text-slate-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-900">{getEmployeeName(selectedOffboarding.employee_id)}</h3>
                  <p className="text-slate-500">{getReasonLabel(selectedOffboarding.reason)}</p>
                  <p className="text-sm text-slate-400">
                    Last day: {new Date(selectedOffboarding.last_working_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-slate-700">{calculateProgress(selectedOffboarding)}%</p>
                  <p className="text-xs text-slate-500">Complete</p>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex flex-wrap gap-2">
                <Select 
                  value={selectedOffboarding.status} 
                  onValueChange={(v) => updateOffboardingStatus(selectedOffboarding.id, v)}
                >
                  <SelectTrigger className="w-40 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OFFBOARDING_STATUS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    setClearanceForm({
                      clearance_hr: selectedOffboarding.clearance_hr || false,
                      clearance_it: selectedOffboarding.clearance_it || false,
                      clearance_finance: selectedOffboarding.clearance_finance || false,
                      clearance_manager: selectedOffboarding.clearance_manager || false,
                      clearance_admin: selectedOffboarding.clearance_admin || false
                    });
                    setClearanceDialogOpen(true);
                  }}
                  variant="outline"
                  className="rounded-xl"
                >
                  <Shield size={16} className="mr-2" />
                  Clearance
                </Button>
                <Button
                  onClick={() => {
                    setExitInterviewForm({
                      conducted: selectedOffboarding.exit_interview_conducted || false,
                      date: selectedOffboarding.exit_interview_date || '',
                      notes: selectedOffboarding.exit_interview_notes || ''
                    });
                    setExitInterviewDialogOpen(true);
                  }}
                  variant="outline"
                  className="rounded-xl"
                >
                  <MessageSquare size={16} className="mr-2" />
                  Exit Interview
                </Button>
              </div>

              {/* Clearance Status */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">Clearance Status</p>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { key: 'clearance_hr', label: 'HR' },
                    { key: 'clearance_it', label: 'IT' },
                    { key: 'clearance_finance', label: 'Finance' },
                    { key: 'clearance_manager', label: 'Manager' },
                    { key: 'clearance_admin', label: 'Admin' }
                  ].map(item => (
                    <div 
                      key={item.key} 
                      className={`p-2 rounded-lg text-center text-xs font-medium ${
                        selectedOffboarding[item.key] 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.label}
                      <br />
                      {selectedOffboarding[item.key] ? '✓' : '-'}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tasks */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">Tasks ({selectedOffboarding.tasks?.filter(t => t.completed).length}/{selectedOffboarding.tasks?.length})</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedOffboarding.tasks?.map((task, idx) => {
                    const categoryInfo = getCategoryInfo(task.category);
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-center gap-3 p-3 rounded-xl border ${
                          task.completed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'
                        }`}
                      >
                        <button
                          onClick={() => handleTaskComplete(selectedOffboarding.id, idx, !task.completed)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            task.completed 
                              ? 'bg-emerald-500 border-emerald-500 text-white' 
                              : 'border-slate-300'
                          }`}
                        >
                          {task.completed && <Check size={12} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${task.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                            {task.title}
                          </p>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${categoryInfo.color}`}>
                            {categoryInfo.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contacts */}
              {(selectedOffboarding.manager_id || selectedOffboarding.hr_contact_id) && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">Contacts</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedOffboarding.manager_id && (
                      <span className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
                        Manager: {getEmployeeName(selectedOffboarding.manager_id)}
                      </span>
                    )}
                    {selectedOffboarding.hr_contact_id && (
                      <span className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
                        HR: {getEmployeeName(selectedOffboarding.hr_contact_id)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Clearance Dialog */}
      <Dialog open={clearanceDialogOpen} onOpenChange={setClearanceDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Shield className="text-indigo-600" size={24} />
              Update Clearance
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleClearanceUpdate} className="space-y-4 mt-4">
            {[
              { key: 'clearance_hr', label: 'HR Clearance', desc: 'Exit formalities, documentation' },
              { key: 'clearance_it', label: 'IT Clearance', desc: 'Access revoked, devices returned' },
              { key: 'clearance_finance', label: 'Finance Clearance', desc: 'Expense settlements, dues cleared' },
              { key: 'clearance_manager', label: 'Manager Clearance', desc: 'Knowledge transfer, handover' },
              { key: 'clearance_admin', label: 'Admin Clearance', desc: 'ID card, parking, access cards' }
            ].map(item => (
              <label key={item.key} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={clearanceForm[item.key]}
                  onChange={(e) => setClearanceForm({ ...clearanceForm, [item.key]: e.target.checked })}
                  className="mt-1 rounded"
                />
                <div>
                  <p className="font-medium text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </label>
            ))}
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1">
                Update Clearance
              </Button>
              <Button type="button" onClick={() => setClearanceDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Exit Interview Dialog */}
      <Dialog open={exitInterviewDialogOpen} onOpenChange={setExitInterviewDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <MessageSquare className="text-emerald-600" size={24} />
              Exit Interview
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleExitInterviewUpdate} className="space-y-4 mt-4">
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={exitInterviewForm.conducted}
                onChange={(e) => setExitInterviewForm({ ...exitInterviewForm, conducted: e.target.checked })}
                className="rounded"
              />
              <span className="font-medium text-slate-900">Exit interview conducted</span>
            </label>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Interview Date</label>
              <Input
                type="datetime-local"
                value={exitInterviewForm.date}
                onChange={(e) => setExitInterviewForm({ ...exitInterviewForm, date: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Notes</label>
              <textarea
                value={exitInterviewForm.notes}
                onChange={(e) => setExitInterviewForm({ ...exitInterviewForm, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none"
                rows={4}
                placeholder="Key points from the exit interview..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 flex-1">
                Save
              </Button>
              <Button type="button" onClick={() => setExitInterviewDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <MessageSquare className="text-slate-600" size={24} />
              Exit Feedback
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitFeedback} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Rating</label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={star <= feedbackForm.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Feedback</label>
              <textarea
                value={feedbackForm.feedback}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all outline-none resize-none"
                rows={4}
                placeholder="Employee feedback..."
                required
              />
            </div>
            <Button type="submit" className="w-full rounded-xl bg-slate-700 hover:bg-slate-800">
              Submit Feedback
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Offboarding;
