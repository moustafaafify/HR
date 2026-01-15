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
  ClipboardCheck, 
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
  GripVertical,
  AlertCircle,
  Check,
  Star,
  ExternalLink,
  Video,
  Link as LinkIcon,
  BookOpen,
  MessageSquare,
  AlertTriangle,
  Sparkles,
  Target
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TASK_CATEGORIES = [
  { value: 'documentation', label: 'Documentation', color: 'bg-blue-100 text-blue-700', icon: FileText },
  { value: 'it_setup', label: 'IT Setup', color: 'bg-purple-100 text-purple-700', icon: Target },
  { value: 'training', label: 'Training', color: 'bg-amber-100 text-amber-700', icon: BookOpen },
  { value: 'compliance', label: 'Compliance', color: 'bg-rose-100 text-rose-700', icon: ClipboardCheck },
  { value: 'introduction', label: 'Team Introduction', color: 'bg-emerald-100 text-emerald-700', icon: Users },
  { value: 'administrative', label: 'Administrative', color: 'bg-slate-100 text-slate-700', icon: ListChecks },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700', icon: Sparkles }
];

const RESOURCE_TYPES = [
  { value: 'document', label: 'Document', icon: FileText },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'link', label: 'External Link', icon: LinkIcon },
  { value: 'form', label: 'Form', icon: ClipboardCheck }
];

const ONBOARDING_STATUS = [
  { value: 'not_started', label: 'Not Started', color: 'bg-slate-100 text-slate-700' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-amber-100 text-amber-700' }
];

const Onboarding = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('active');
  const [templates, setTemplates] = useState([]);
  const [onboardings, setOnboardings] = useState([]);
  const [myOnboarding, setMyOnboarding] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Dialogs
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  
  // Selected items
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedOnboarding, setSelectedOnboarding] = useState(null);
  const [expandedTemplate, setExpandedTemplate] = useState(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(null);
  
  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';
  
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    department_id: '',
    position_type: '',
    duration_days: 30,
    welcome_message: '',
    tasks: []
  });

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'documentation',
    due_day: 1,
    is_required: true,
    assigned_to_type: 'employee',
    resource_url: '',
    resource_type: ''
  });

  const [assignForm, setAssignForm] = useState({
    template_id: '',
    employee_id: '',
    start_date: new Date().toISOString().split('T')[0],
    manager_id: '',
    hr_contact_id: '',
    buddy_id: '',
    position: '',
    notes: ''
  });

  const [feedbackForm, setFeedbackForm] = useState({
    feedback: '',
    rating: 0
  });

  const [taskCompletionNotes, setTaskCompletionNotes] = useState('');

  useEffect(() => {
    fetchTemplates();
    fetchOnboardings();
    fetchEmployees();
    fetchDepartments();
    fetchStats();
    if (!isAdmin) {
      fetchMyOnboarding();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API}/onboarding-templates`);
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchOnboardings = async () => {
    try {
      const response = await axios.get(`${API}/onboardings`);
      setOnboardings(response.data);
    } catch (error) {
      console.error('Failed to fetch onboardings:', error);
    }
  };

  const fetchMyOnboarding = async () => {
    try {
      const response = await axios.get(`${API}/onboardings/my`);
      setMyOnboarding(response.data);
    } catch (error) {
      console.error('Failed to fetch my onboarding:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/onboardings/stats`);
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
        await axios.put(`${API}/onboarding-templates/${editingTemplate.id}`, formData);
        toast.success('Template updated successfully');
      } else {
        await axios.post(`${API}/onboarding-templates`, formData);
        toast.success('Template created successfully');
      }
      fetchTemplates();
      resetTemplateForm();
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const handleAssignOnboarding = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/onboardings`, assignForm);
      toast.success('Onboarding started successfully');
      fetchOnboardings();
      fetchStats();
      setAssignDialogOpen(false);
      resetAssignForm();
    } catch (error) {
      toast.error('Failed to start onboarding');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await axios.delete(`${API}/onboarding-templates/${templateId}`);
      toast.success('Template deleted');
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const handleTaskComplete = async (onboardingId, taskIndex, completed, notes = '') => {
    try {
      await axios.put(`${API}/onboardings/${onboardingId}/tasks/${taskIndex}`, { 
        completed,
        completion_notes: notes
      });
      toast.success(completed ? 'Task completed!' : 'Task marked incomplete');
      fetchOnboardings();
      fetchStats();
      if (!isAdmin) fetchMyOnboarding();
      // Refresh selected onboarding if open
      if (selectedOnboarding?.id === onboardingId) {
        const response = await axios.get(`${API}/onboardings/${onboardingId}`);
        setSelectedOnboarding(response.data);
      }
      setTaskDialogOpen(false);
      setTaskCompletionNotes('');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const updateOnboardingStatus = async (onboardingId, status) => {
    try {
      await axios.put(`${API}/onboardings/${onboardingId}`, { status });
      toast.success('Status updated');
      fetchOnboardings();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/onboardings/${selectedOnboarding.id}/feedback`, feedbackForm);
      toast.success('Thank you for your feedback!');
      setFeedbackDialogOpen(false);
      fetchOnboardings();
      if (!isAdmin) fetchMyOnboarding();
    } catch (error) {
      toast.error('Failed to submit feedback');
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
      category: 'documentation',
      due_day: 1,
      is_required: true,
      assigned_to_type: 'employee',
      resource_url: '',
      resource_type: ''
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
      position_type: '',
      duration_days: 30,
      welcome_message: '',
      tasks: []
    });
    setEditingTemplate(null);
    setTemplateDialogOpen(false);
  };

  const resetAssignForm = () => {
    setAssignForm({
      template_id: '',
      employee_id: '',
      start_date: new Date().toISOString().split('T')[0],
      manager_id: '',
      hr_contact_id: '',
      buddy_id: '',
      position: '',
      notes: ''
    });
  };

  const openEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name || '',
      description: template.description || '',
      department_id: template.department_id || '',
      position_type: template.position_type || '',
      duration_days: template.duration_days || 30,
      welcome_message: template.welcome_message || '',
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
    return TASK_CATEGORIES.find(c => c.value === category) || TASK_CATEGORIES[6];
  };

  const getStatusInfo = (status) => {
    return ONBOARDING_STATUS.find(s => s.value === status) || ONBOARDING_STATUS[0];
  };

  const calculateProgress = (onboarding) => {
    if (!onboarding?.tasks || onboarding.tasks.length === 0) return 0;
    const completed = onboarding.tasks.filter(t => t.completed).length;
    return Math.round((completed / onboarding.tasks.length) * 100);
  };

  const getTaskDueDate = (startDate, dueDay) => {
    if (!startDate) return null;
    const start = new Date(startDate);
    start.setDate(start.getDate() + dueDay - 1);
    return start;
  };

  const isTaskOverdue = (startDate, dueDay, completed) => {
    if (completed) return false;
    const dueDate = getTaskDueDate(startDate, dueDay);
    if (!dueDate) return false;
    return dueDate < new Date();
  };

  const getDaysRemaining = (startDate, durationDays) => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + durationDays);
    const today = new Date();
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Employee View Component
  const EmployeeOnboardingView = () => {
    if (!myOnboarding) {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Sparkles size={48} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Welcome!</h3>
          <p className="text-slate-500">You don't have an active onboarding at the moment.</p>
        </div>
      );
    }

    const progress = calculateProgress(myOnboarding);
    const daysRemaining = getDaysRemaining(myOnboarding.start_date, myOnboarding.duration_days);
    const completedTasks = myOnboarding.tasks?.filter(t => t.completed).length || 0;
    const totalTasks = myOnboarding.tasks?.length || 0;
    const overdueTasks = myOnboarding.tasks?.filter(t => 
      isTaskOverdue(myOnboarding.start_date, t.due_day, t.completed)
    ).length || 0;

    // Group tasks by category
    const tasksByCategory = TASK_CATEGORIES.map(cat => ({
      ...cat,
      tasks: myOnboarding.tasks?.filter(t => t.category === cat.value) || []
    })).filter(cat => cat.tasks.length > 0);

    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        {myOnboarding.welcome_message && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 rounded-xl p-3">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Welcome to the team!</h3>
                <p className="text-indigo-100">{myOnboarding.welcome_message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Overview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Your Onboarding Progress</h2>
              <p className="text-slate-500 text-sm">
                Started {new Date(myOnboarding.start_date).toLocaleDateString()}
                {daysRemaining !== null && daysRemaining > 0 && ` • ${daysRemaining} days remaining`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-indigo-600">{progress}%</p>
              <p className="text-sm text-slate-500">{completedTasks} of {totalTasks} tasks</p>
            </div>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {overdueTasks > 0 && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-rose-50 rounded-xl text-rose-700">
              <AlertTriangle size={18} />
              <span className="text-sm font-medium">{overdueTasks} overdue task{overdueTasks > 1 ? 's' : ''} - please complete as soon as possible</span>
            </div>
          )}
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
            <p className="text-2xl font-bold text-rose-600">{overdueTasks}</p>
            <p className="text-xs text-slate-500">Overdue</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{daysRemaining || 0}</p>
            <p className="text-xs text-slate-500">Days Left</p>
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
                    const globalIdx = myOnboarding.tasks.findIndex(t => t === task);
                    const dueDate = getTaskDueDate(myOnboarding.start_date, task.due_day);
                    const overdue = isTaskOverdue(myOnboarding.start_date, task.due_day, task.completed);
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                          task.completed 
                            ? 'bg-emerald-50 border-emerald-200' 
                            : overdue
                            ? 'bg-rose-50 border-rose-200'
                            : 'bg-white border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <button
                          onClick={() => {
                            if (!task.completed) {
                              setSelectedOnboarding(myOnboarding);
                              setCurrentTaskIndex(globalIdx);
                              setTaskDialogOpen(true);
                            } else {
                              handleTaskComplete(myOnboarding.id, globalIdx, false);
                            }
                          }}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all mt-0.5 ${
                            task.completed 
                              ? 'bg-emerald-500 border-emerald-500 text-white' 
                              : overdue
                              ? 'border-rose-400 hover:border-rose-500'
                              : 'border-slate-300 hover:border-indigo-500'
                          }`}
                        >
                          {task.completed && <Check size={14} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`font-medium ${task.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                              {task.title}
                            </p>
                            {task.resource_url && (
                              <a 
                                href={task.resource_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-shrink-0 text-indigo-600 hover:text-indigo-700"
                              >
                                <ExternalLink size={16} />
                              </a>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {dueDate && (
                              <span className={`text-xs flex items-center gap-1 ${overdue ? 'text-rose-600 font-medium' : 'text-slate-400'}`}>
                                <Calendar size={12} />
                                {overdue ? 'Overdue - ' : ''}Due {dueDate.toLocaleDateString()}
                              </span>
                            )}
                            {task.is_required && !task.completed && (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded text-xs font-medium">
                                Required
                              </span>
                            )}
                          </div>
                          {task.completed && task.completed_at && (
                            <p className="text-xs text-emerald-600 mt-2">
                              <Check size={12} className="inline mr-1" />
                              Completed {new Date(task.completed_at).toLocaleDateString()}
                            </p>
                          )}
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
        {(myOnboarding.manager_id || myOnboarding.buddy_id || myOnboarding.hr_contact_id) && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4">Your Onboarding Team</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {myOnboarding.manager_id && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <User size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Manager</p>
                    <p className="font-medium text-slate-900">{getEmployeeName(myOnboarding.manager_id)}</p>
                  </div>
                </div>
              )}
              {myOnboarding.buddy_id && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Users size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Onboarding Buddy</p>
                    <p className="font-medium text-slate-900">{getEmployeeName(myOnboarding.buddy_id)}</p>
                  </div>
                </div>
              )}
              {myOnboarding.hr_contact_id && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <ClipboardCheck size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">HR Contact</p>
                    <p className="font-medium text-slate-900">{getEmployeeName(myOnboarding.hr_contact_id)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feedback Button for Completed */}
        {myOnboarding.status === 'completed' && !myOnboarding.feedback && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Onboarding Complete!</h3>
                <p className="text-emerald-100">We'd love to hear your feedback on the onboarding experience.</p>
              </div>
              <Button 
                onClick={() => { setSelectedOnboarding(myOnboarding); setFeedbackDialogOpen(true); }}
                className="bg-white text-emerald-600 hover:bg-emerald-50 rounded-xl"
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
      <div data-testid="onboarding-page" className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            My Onboarding
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1">Track your onboarding progress and complete tasks</p>
        </div>
        <EmployeeOnboardingView />

        {/* Task Completion Dialog */}
        <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
          <DialogContent className="rounded-2xl max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600" size={24} />
                Complete Task
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {selectedOnboarding && currentTaskIndex !== null && selectedOnboarding.tasks[currentTaskIndex] && (
                <>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="font-medium text-slate-900">{selectedOnboarding.tasks[currentTaskIndex].title}</p>
                    {selectedOnboarding.tasks[currentTaskIndex].description && (
                      <p className="text-sm text-slate-500 mt-1">{selectedOnboarding.tasks[currentTaskIndex].description}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Notes (optional)</label>
                    <textarea
                      value={taskCompletionNotes}
                      onChange={(e) => setTaskCompletionNotes(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none"
                      rows={3}
                      placeholder="Add any notes about completing this task..."
                    />
                  </div>
                  <Button 
                    onClick={() => handleTaskComplete(selectedOnboarding.id, currentTaskIndex, true, taskCompletionNotes)}
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Check size={18} className="mr-2" />
                    Mark as Complete
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Feedback Dialog */}
        <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
          <DialogContent className="rounded-2xl max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <MessageSquare className="text-indigo-600" size={24} />
                Onboarding Feedback
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitFeedback} className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">How was your onboarding experience?</label>
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                  rows={4}
                  placeholder="What went well? What could be improved?"
                  required
                />
              </div>
              <Button type="submit" className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700">
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
    <div data-testid="onboarding-page" className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Onboarding
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1">Manage employee onboarding processes</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => { resetAssignForm(); setAssignDialogOpen(true); }}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-2"
            data-testid="assign-onboarding-btn"
          >
            <PlayCircle size={18} />
            <span className="hidden sm:inline">Start Onboarding</span>
            <span className="sm:hidden">Start</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-xs sm:text-sm">In Progress</p>
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

        {/* Active Onboardings Tab */}
        <TabsContent value="active" className="mt-4">
          <div className="space-y-4">
            {onboardings.filter(o => o.status !== 'completed').length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Users size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No active onboardings</p>
                <Button 
                  onClick={() => setAssignDialogOpen(true)}
                  variant="outline" 
                  className="mt-4 rounded-xl"
                >
                  <Plus size={16} className="mr-2" />
                  Start New Onboarding
                </Button>
              </div>
            ) : (
              onboardings.filter(o => o.status !== 'completed').map((onboarding) => {
                const progress = calculateProgress(onboarding);
                const statusInfo = getStatusInfo(onboarding.status);
                const daysRemaining = getDaysRemaining(onboarding.start_date, onboarding.duration_days);
                const overdueTasks = onboarding.tasks?.filter(t => 
                  isTaskOverdue(onboarding.start_date, t.due_day, t.completed)
                ).length || 0;
                
                return (
                  <div key={onboarding.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <User size={24} className="text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{getEmployeeName(onboarding.employee_id)}</h3>
                          <p className="text-sm text-slate-500">
                            {onboarding.position || getDepartmentName(onboarding.department_id)}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            {overdueTasks > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 flex items-center gap-1">
                                <AlertTriangle size={10} />
                                {overdueTasks} overdue
                              </span>
                            )}
                            {daysRemaining !== null && (
                              <span className="text-xs text-slate-400">
                                {daysRemaining > 0 ? `${daysRemaining} days left` : 'Ended'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-2xl font-bold text-slate-900">{progress}%</p>
                          <p className="text-xs text-slate-500">
                            {onboarding.tasks?.filter(t => t.completed).length}/{onboarding.tasks?.length} tasks
                          </p>
                        </div>
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              overdueTasks > 0 ? 'bg-rose-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <Button
                          onClick={() => { setSelectedOnboarding(onboarding); setViewDialogOpen(true); }}
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
                          className={`h-full rounded-full ${overdueTasks > 0 ? 'bg-rose-500' : 'bg-indigo-600'}`}
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

        {/* Completed Onboardings Tab */}
        <TabsContent value="completed" className="mt-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Employee</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700 hidden md:table-cell">Position</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700 hidden sm:table-cell">Duration</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Rating</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {onboardings.filter(o => o.status === 'completed').length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <CheckCircle2 size={40} className="mx-auto mb-4 text-slate-300" />
                      <p className="text-slate-500">No completed onboardings yet</p>
                    </td>
                  </tr>
                ) : (
                  onboardings.filter(o => o.status === 'completed').map((onboarding) => (
                    <tr key={onboarding.id} className="border-b border-slate-100">
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <p className="font-medium text-slate-900">{getEmployeeName(onboarding.employee_id)}</p>
                        <p className="text-xs text-slate-400">
                          Completed {onboarding.completed_at ? new Date(onboarding.completed_at).toLocaleDateString() : '-'}
                        </p>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 hidden md:table-cell">
                        {onboarding.position || getDepartmentName(onboarding.department_id)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 hidden sm:table-cell">
                        {onboarding.duration_days} days
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        {onboarding.feedback_rating ? (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={14}
                                className={star <= onboarding.feedback_rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">No rating</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <Button
                          onClick={() => { setSelectedOnboarding(onboarding); setViewDialogOpen(true); }}
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
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-2"
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
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                          <ListChecks size={20} className="text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{template.name}</h3>
                          <p className="text-sm text-slate-500">
                            {template.tasks?.length || 0} tasks • {template.duration_days} days
                            {template.department_id && ` • ${getDepartmentName(template.department_id)}`}
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
                              <CategoryIcon size={16} className={categoryInfo.color.replace('bg-', 'text-').split(' ')[0].replace('-100', '-600')} />
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
                                  {task.resource_url && (
                                    <ExternalLink size={12} className="text-indigo-500" />
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
              <ListChecks className="text-indigo-600" size={24} />
              {editingTemplate ? 'Edit Template' : 'Create Onboarding Template'}
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
                  placeholder="e.g. Engineering Onboarding"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Department</label>
                <Select value={templateForm.department_id || 'all'} onValueChange={(v) => setTemplateForm({ ...templateForm, department_id: v === 'all' ? '' : v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Duration (Days)</label>
                <Input
                  type="number"
                  value={templateForm.duration_days}
                  onChange={(e) => setTemplateForm({ ...templateForm, duration_days: parseInt(e.target.value) || 30 })}
                  className="rounded-xl"
                  min={1}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Welcome Message</label>
                <textarea
                  value={templateForm.welcome_message}
                  onChange={(e) => setTemplateForm({ ...templateForm, welcome_message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                  rows={2}
                  placeholder="Welcome message shown to new employees..."
                />
              </div>
            </div>

            {/* Tasks Section */}
            <div className="border-t border-slate-200 pt-4 mt-4">
              <p className="font-bold text-slate-900 mb-3">Onboarding Tasks</p>
              
              {/* Task List */}
              {templateForm.tasks.length > 0 && (
                <div className="space-y-2 mb-4">
                  {templateForm.tasks.map((task, idx) => {
                    const categoryInfo = getCategoryInfo(task.category);
                    return (
                      <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                        <GripVertical size={16} className="text-slate-400" />
                        <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
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
                  <div className="sm:col-span-2">
                    <Input
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      className="rounded-lg"
                      placeholder="Task description (optional)"
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
                  <div className="sm:col-span-2">
                    <Input
                      value={newTask.resource_url}
                      onChange={(e) => setNewTask({ ...newTask, resource_url: e.target.value })}
                      className="rounded-lg"
                      placeholder="Resource URL (optional)"
                    />
                  </div>
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
              <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1">
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </Button>
              <Button type="button" onClick={resetTemplateForm} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Onboarding Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <PlayCircle className="text-indigo-600" size={24} />
              Start Onboarding
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignOnboarding} className="space-y-4 mt-4">
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
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Onboarding Template *</label>
              <Select value={assignForm.template_id} onValueChange={(v) => setAssignForm({ ...assignForm, template_id: v })} required>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.tasks?.length || 0} tasks)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Position</label>
              <Input
                value={assignForm.position}
                onChange={(e) => setAssignForm({ ...assignForm, position: e.target.value })}
                className="rounded-xl"
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Start Date *</label>
              <Input
                type="date"
                value={assignForm.start_date}
                onChange={(e) => setAssignForm({ ...assignForm, start_date: e.target.value })}
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
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Onboarding Buddy</label>
              <Select value={assignForm.buddy_id} onValueChange={(v) => setAssignForm({ ...assignForm, buddy_id: v })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select buddy" />
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                rows={2}
                placeholder="Any special notes..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1">
                Start Onboarding
              </Button>
              <Button type="button" onClick={() => setAssignDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Onboarding Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <ClipboardCheck className="text-indigo-600" size={24} />
              Onboarding Details
            </DialogTitle>
          </DialogHeader>
          {selectedOnboarding && (
            <div className="space-y-4 mt-4">
              {/* Employee Info */}
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <User size={24} className="text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">{getEmployeeName(selectedOnboarding.employee_id)}</h3>
                    <p className="text-sm text-slate-500">{selectedOnboarding.position || getDepartmentName(selectedOnboarding.department_id)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-600">{calculateProgress(selectedOnboarding)}%</p>
                    <p className="text-xs text-slate-500">Complete</p>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full mt-4 overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${calculateProgress(selectedOnboarding)}%` }}
                  />
                </div>
              </div>

              {/* Status & Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <p className="text-sm text-slate-500 mb-1">Status</p>
                  <Select 
                    value={selectedOnboarding.status} 
                    onValueChange={(value) => {
                      updateOnboardingStatus(selectedOnboarding.id, value);
                      setSelectedOnboarding({ ...selectedOnboarding, status: value });
                    }}
                  >
                    <SelectTrigger className="w-full rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ONBOARDING_STATUS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <p className="text-sm text-slate-500">Started</p>
                  <p className="font-medium text-slate-900">{new Date(selectedOnboarding.start_date).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Feedback if completed */}
              {selectedOnboarding.feedback && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={16} className="text-emerald-600" />
                    <span className="font-medium text-emerald-700">Employee Feedback</span>
                    {selectedOnboarding.feedback_rating && (
                      <div className="flex items-center gap-0.5 ml-auto">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={star <= selectedOnboarding.feedback_rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-emerald-800">{selectedOnboarding.feedback}</p>
                </div>
              )}

              {/* Tasks */}
              <div>
                <p className="font-bold text-slate-900 mb-3">
                  Tasks ({selectedOnboarding.tasks?.filter(t => t.completed).length}/{selectedOnboarding.tasks?.length})
                </p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {selectedOnboarding.tasks?.map((task, idx) => {
                    const categoryInfo = getCategoryInfo(task.category);
                    const overdue = isTaskOverdue(selectedOnboarding.start_date, task.due_day, task.completed);
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                          task.completed 
                            ? 'bg-emerald-50 border-emerald-200' 
                            : overdue
                            ? 'bg-rose-50 border-rose-200'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <button
                          onClick={() => handleTaskComplete(selectedOnboarding.id, idx, !task.completed)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            task.completed 
                              ? 'bg-emerald-500 border-emerald-500 text-white' 
                              : 'border-slate-300 hover:border-indigo-500'
                          }`}
                        >
                          {task.completed && <Check size={14} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${task.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-xs ${categoryInfo.color}`}>
                              {categoryInfo.label}
                            </span>
                            <span className={`text-xs ${overdue ? 'text-rose-600' : 'text-slate-400'}`}>
                              Day {task.due_day}
                            </span>
                            {task.is_required && !task.completed && (
                              <span className="text-xs text-rose-500">Required</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Onboarding;
