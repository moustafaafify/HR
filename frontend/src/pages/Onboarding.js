import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
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
  Check
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TASK_CATEGORIES = [
  { value: 'documentation', label: 'Documentation', color: 'bg-blue-100 text-blue-700' },
  { value: 'it_setup', label: 'IT Setup', color: 'bg-purple-100 text-purple-700' },
  { value: 'training', label: 'Training', color: 'bg-amber-100 text-amber-700' },
  { value: 'compliance', label: 'Compliance', color: 'bg-rose-100 text-rose-700' },
  { value: 'introduction', label: 'Team Introduction', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'administrative', label: 'Administrative', color: 'bg-slate-100 text-slate-700' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700' }
];

const ONBOARDING_STATUS = [
  { value: 'not_started', label: 'Not Started', color: 'bg-slate-100 text-slate-700' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-amber-100 text-amber-700' }
];

const Onboarding = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [templates, setTemplates] = useState([]);
  const [onboardings, setOnboardings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Dialogs
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  // Selected items
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedOnboarding, setSelectedOnboarding] = useState(null);
  const [expandedTemplate, setExpandedTemplate] = useState(null);
  
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    department_id: '',
    duration_days: 30,
    tasks: []
  });

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'documentation',
    due_day: 1,
    is_required: true,
    assigned_to_type: 'employee' // employee, manager, hr
  });

  const [assignForm, setAssignForm] = useState({
    template_id: '',
    employee_id: '',
    start_date: new Date().toISOString().split('T')[0],
    manager_id: '',
    hr_contact_id: ''
  });

  useEffect(() => {
    fetchTemplates();
    fetchOnboardings();
    fetchEmployees();
    fetchDepartments();
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
      if (editingTemplate) {
        await axios.put(`${API}/onboarding-templates/${editingTemplate.id}`, templateForm);
        toast.success('Template updated successfully');
      } else {
        await axios.post(`${API}/onboarding-templates`, templateForm);
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
      toast.success('Onboarding assigned successfully');
      fetchOnboardings();
      setAssignDialogOpen(false);
      resetAssignForm();
    } catch (error) {
      toast.error('Failed to assign onboarding');
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

  const handleTaskComplete = async (onboardingId, taskIndex, completed) => {
    try {
      await axios.put(`${API}/onboardings/${onboardingId}/tasks/${taskIndex}`, { completed });
      toast.success(completed ? 'Task completed!' : 'Task marked incomplete');
      fetchOnboardings();
      // Refresh selected onboarding if open
      if (selectedOnboarding?.id === onboardingId) {
        const response = await axios.get(`${API}/onboardings/${onboardingId}`);
        setSelectedOnboarding(response.data);
      }
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const updateOnboardingStatus = async (onboardingId, status) => {
    try {
      await axios.put(`${API}/onboardings/${onboardingId}`, { status });
      toast.success('Status updated');
      fetchOnboardings();
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
      category: 'documentation',
      due_day: 1,
      is_required: true,
      assigned_to_type: 'employee'
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
      duration_days: 30,
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
      hr_contact_id: ''
    });
  };

  const openEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name || '',
      description: template.description || '',
      department_id: template.department_id || '',
      duration_days: template.duration_days || 30,
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
    if (!onboarding.tasks || onboarding.tasks.length === 0) return 0;
    const completed = onboarding.tasks.filter(t => t.completed).length;
    return Math.round((completed / onboarding.tasks.length) * 100);
  };

  // Stats
  const activeOnboardings = onboardings.filter(o => o.status === 'in_progress').length;
  const completedOnboardings = onboardings.filter(o => o.status === 'completed').length;
  const pendingTasks = onboardings.reduce((acc, o) => {
    return acc + (o.tasks?.filter(t => !t.completed).length || 0);
  }, 0);

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
              <p className="text-indigo-100 text-xs sm:text-sm">Active Onboardings</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{activeOnboardings}</p>
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
              <p className="text-2xl sm:text-3xl font-black mt-1">{completedOnboardings}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <CheckCircle2 size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-xs sm:text-sm">Pending Tasks</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{pendingTasks}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <Clock size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs sm:text-sm">Templates</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{templates.length}</p>
            </div>
            <div className="bg-slate-100 rounded-xl p-2 sm:p-3">
              <ListChecks size={20} className="text-slate-600 sm:w-6 sm:h-6" />
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
                return (
                  <div key={onboarding.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <User size={24} className="text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{getEmployeeName(onboarding.employee_id)}</h3>
                          <p className="text-sm text-slate-500">{getDepartmentName(onboarding.department_id)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            <span className="text-xs text-slate-400">
                              Started {new Date(onboarding.start_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-slate-900">{progress}%</p>
                          <p className="text-xs text-slate-500">{onboarding.tasks?.filter(t => t.completed).length}/{onboarding.tasks?.length} tasks</p>
                        </div>
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <Button
                          onClick={() => { setSelectedOnboarding(onboarding); setViewDialogOpen(true); }}
                          variant="outline"
                          className="rounded-xl"
                        >
                          <Eye size={16} className="mr-2" />
                          View
                        </Button>
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
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700 hidden md:table-cell">Department</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700 hidden sm:table-cell">Duration</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Completed</th>
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
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 hidden md:table-cell">
                        {getDepartmentName(onboarding.department_id)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 hidden sm:table-cell">
                        {onboarding.duration_days} days
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <span className="text-emerald-600 font-medium">
                          {onboarding.completed_at ? new Date(onboarding.completed_at).toLocaleDateString() : '-'}
                        </span>
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
                          return (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                {idx + 1}
                              </span>
                              <div className="flex-1">
                                <p className="font-medium text-slate-900">{task.title}</p>
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
                  onChange={(e) => setTemplateForm({ ...templateForm, duration_days: parseInt(e.target.value) })}
                  className="rounded-xl"
                  min={1}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
                <textarea
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                  rows={2}
                  placeholder="Template description..."
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
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 text-sm">{task.title}</p>
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
                          className="text-rose-600"
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
                      placeholder="Task title"
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
                    onChange={(e) => setNewTask({ ...newTask, due_day: parseInt(e.target.value) })}
                    className="rounded-lg"
                    placeholder="Due day"
                    min={1}
                  />
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
                  <Button type="button" onClick={addTask} variant="outline" className="rounded-lg">
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
        <DialogContent className="rounded-2xl max-w-lg mx-4">
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
              Onboarding Progress
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
                    <p className="text-sm text-slate-500">Started {new Date(selectedOnboarding.start_date).toLocaleDateString()}</p>
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

              {/* Status */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700">Status:</span>
                <Select 
                  value={selectedOnboarding.status} 
                  onValueChange={(value) => {
                    updateOnboardingStatus(selectedOnboarding.id, value);
                    setSelectedOnboarding({ ...selectedOnboarding, status: value });
                  }}
                >
                  <SelectTrigger className="w-40 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ONBOARDING_STATUS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tasks */}
              <div>
                <p className="font-bold text-slate-900 mb-3">Tasks ({selectedOnboarding.tasks?.filter(t => t.completed).length}/{selectedOnboarding.tasks?.length})</p>
                <div className="space-y-2">
                  {selectedOnboarding.tasks?.map((task, idx) => {
                    const categoryInfo = getCategoryInfo(task.category);
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                          task.completed 
                            ? 'bg-emerald-50 border-emerald-200' 
                            : 'bg-white border-slate-200 hover:border-indigo-300'
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
                        <div className="flex-1">
                          <p className={`font-medium ${task.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-xs ${categoryInfo.color}`}>
                              {categoryInfo.label}
                            </span>
                            <span className="text-xs text-slate-400">Due Day {task.due_day}</span>
                            {task.is_required && !task.completed && (
                              <span className="flex items-center gap-1 text-xs text-rose-500">
                                <AlertCircle size={12} />Required
                              </span>
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
