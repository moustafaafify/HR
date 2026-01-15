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
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Target,
  TrendingUp,
  BarChart3,
  ChevronRight,
  PlayCircle,
  PauseCircle,
  Archive,
  Filter,
  MoreVertical,
  UserPlus,
  ListTodo,
  MessageSquare,
  Briefcase,
  Building2,
  Flag,
  CheckSquare,
  Square,
  Circle,
  ArrowRight
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_CONFIG = {
  planning: { label: 'Planning', color: 'bg-slate-100 text-slate-700', icon: Circle },
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700', icon: PlayCircle },
  on_hold: { label: 'On Hold', color: 'bg-amber-100 text-amber-700', icon: PauseCircle },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-rose-100 text-rose-700', icon: XCircle },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-600' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-600' },
  critical: { label: 'Critical', color: 'bg-rose-100 text-rose-600' },
};

const TASK_STATUS_CONFIG = {
  todo: { label: 'To Do', color: 'bg-slate-100 text-slate-700' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  in_review: { label: 'In Review', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
  blocked: { label: 'Blocked', color: 'bg-rose-100 text-rose-700' },
};

const MEMBER_ROLES = [
  { value: 'owner', label: 'Owner' },
  { value: 'manager', label: 'Manager' },
  { value: 'lead', label: 'Team Lead' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' },
];

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', 
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'
];

const Projects = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');
  
  // Data
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDetails, setProjectDetails] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Dialogs
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [viewProjectOpen, setViewProjectOpen] = useState(false);
  
  // Selected items
  const [editingProject, setEditingProject] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  
  // Forms
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    client_name: '',
    category: 'internal',
    department_id: '',
    manager_id: '',
    status: 'planning',
    priority: 'medium',
    start_date: '',
    end_date: '',
    budget: 0,
    hourly_rate: 0,
    billable: true,
    color: '#6366f1'
  });
  
  const [memberForm, setMemberForm] = useState({
    employee_id: '',
    role: 'member',
    allocation_percentage: 100
  });
  
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignee_id: '',
    status: 'todo',
    priority: 'medium',
    due_date: '',
    estimated_hours: 0
  });

  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  // Fetch functions
  const fetchProjects = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      const response = await axios.get(`${API}/projects?${params}`);
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  }, [statusFilter, priorityFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/projects/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/departments`);
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  }, []);

  const fetchProjectDetails = async (projectId) => {
    try {
      const [detailsRes, analyticsRes] = await Promise.all([
        axios.get(`${API}/projects/${projectId}`),
        axios.get(`${API}/projects/${projectId}/analytics`)
      ]);
      setProjectDetails(detailsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Failed to fetch project details:', error);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProjects(),
        fetchStats(),
        fetchEmployees(),
        fetchDepartments(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchProjects, fetchStats, fetchEmployees, fetchDepartments]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchProjects();
  }, [statusFilter, priorityFilter, fetchProjects]);

  // Handlers
  const handleSaveProject = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await axios.put(`${API}/projects/${editingProject.id}`, projectForm);
        toast.success('Project updated!');
      } else {
        await axios.post(`${API}/projects`, projectForm);
        toast.success('Project created!');
      }
      fetchProjects();
      fetchStats();
      setProjectDialogOpen(false);
      resetProjectForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Archive this project?')) return;
    try {
      await axios.delete(`${API}/projects/${projectId}`);
      toast.success('Project archived');
      fetchProjects();
      fetchStats();
    } catch (error) {
      toast.error('Failed to archive project');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!projectDetails) return;
    try {
      await axios.post(`${API}/projects/${projectDetails.id}/members`, memberForm);
      toast.success('Member added!');
      fetchProjectDetails(projectDetails.id);
      setMemberDialogOpen(false);
      resetMemberForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await axios.delete(`${API}/projects/${projectDetails.id}/members/${memberId}`);
      toast.success('Member removed');
      fetchProjectDetails(projectDetails.id);
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!projectDetails) return;
    try {
      if (editingTask) {
        await axios.put(`${API}/projects/${projectDetails.id}/tasks/${editingTask.id}`, taskForm);
        toast.success('Task updated!');
      } else {
        await axios.post(`${API}/projects/${projectDetails.id}/tasks`, taskForm);
        toast.success('Task created!');
      }
      fetchProjectDetails(projectDetails.id);
      fetchProjects();
      setTaskDialogOpen(false);
      resetTaskForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save task');
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await axios.put(`${API}/projects/${projectDetails.id}/tasks/${taskId}`, { status: newStatus });
      fetchProjectDetails(projectDetails.id);
      fetchProjects();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await axios.delete(`${API}/projects/${projectDetails.id}/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchProjectDetails(projectDetails.id);
      fetchProjects();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const openEditProject = (project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name || '',
      description: project.description || '',
      client_name: project.client_name || '',
      category: project.category || 'internal',
      department_id: project.department_id || '',
      manager_id: project.manager_id || '',
      status: project.status || 'planning',
      priority: project.priority || 'medium',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      budget: project.budget || 0,
      hourly_rate: project.hourly_rate || 0,
      billable: project.billable !== false,
      color: project.color || '#6366f1'
    });
    setProjectDialogOpen(true);
  };

  const openViewProject = async (project) => {
    setSelectedProject(project);
    await fetchProjectDetails(project.id);
    setViewProjectOpen(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title || '',
      description: task.description || '',
      assignee_id: task.assignee_id || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      due_date: task.due_date || '',
      estimated_hours: task.estimated_hours || 0
    });
    setTaskDialogOpen(true);
  };

  const resetProjectForm = () => {
    setEditingProject(null);
    setProjectForm({
      name: '',
      description: '',
      client_name: '',
      category: 'internal',
      department_id: '',
      manager_id: '',
      status: 'planning',
      priority: 'medium',
      start_date: '',
      end_date: '',
      budget: 0,
      hourly_rate: 0,
      billable: true,
      color: '#6366f1'
    });
  };

  const resetMemberForm = () => {
    setMemberForm({
      employee_id: '',
      role: 'member',
      allocation_percentage: 100
    });
  };

  const resetTaskForm = () => {
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      assignee_id: '',
      status: 'todo',
      priority: 'medium',
      due_date: '',
      estimated_hours: 0
    });
  };

  const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.planning;
  const getPriorityConfig = (priority) => PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  const getTaskStatusConfig = (status) => TASK_STATUS_CONFIG[status] || TASK_STATUS_CONFIG.todo;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount || 0);
  };

  // Filter projects
  const filteredProjects = projects.filter(project => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!project.name?.toLowerCase().includes(query) &&
          !project.code?.toLowerCase().includes(query) &&
          !project.client_name?.toLowerCase().includes(query)) return false;
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
    <div className="p-4 lg:p-6 space-y-6" data-testid="projects-page">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500 mt-1">
            {isAdmin ? 'Manage projects and track progress' : 'View your assigned projects'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => { resetProjectForm(); setProjectDialogOpen(true); }} data-testid="create-project-btn">
            <Plus size={18} className="mr-2" />
            New Project
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 text-white">
          <FolderKanban className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-indigo-100 text-sm">Total Projects</p>
          <p className="text-2xl font-bold">{stats?.total_projects || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white">
          <PlayCircle className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-emerald-100 text-sm">Active</p>
          <p className="text-2xl font-bold">{stats?.active_projects || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
          <CheckCircle2 className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-blue-100 text-sm">Completed</p>
          <p className="text-2xl font-bold">{stats?.completed_projects || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
          <Clock className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-purple-100 text-sm">Total Hours</p>
          <p className="text-2xl font-bold">{stats?.total_hours || 0}</p>
        </div>
        {isAdmin && (
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white">
            <DollarSign className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-amber-100 text-sm">Total Budget</p>
            <p className="text-2xl font-bold">{formatCurrency(stats?.total_budget)}</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search projects..."
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
            {Object.entries(STATUS_CONFIG).map(([value, config]) => (
              <SelectItem key={value} value={value}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
              <SelectItem key={value} value={value}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <FolderKanban className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600 font-medium">No Projects Found</p>
          <p className="text-slate-500 text-sm mt-1">
            {isAdmin ? 'Create your first project' : 'You are not assigned to any projects yet'}
          </p>
          {isAdmin && (
            <Button className="mt-4" onClick={() => { resetProjectForm(); setProjectDialogOpen(true); }}>
              <Plus size={16} className="mr-2" /> New Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map(project => {
            const statusConfig = getStatusConfig(project.status);
            const priorityConfig = getPriorityConfig(project.priority);
            const StatusIcon = statusConfig.icon;
            const progressPercent = project.progress || 0;
            
            return (
              <div 
                key={project.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => openViewProject(project)}
                data-testid={`project-card-${project.id}`}
              >
                {/* Color bar */}
                <div className="h-2" style={{ backgroundColor: project.color || '#6366f1' }} />
                
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 mb-1">{project.code}</p>
                      <h3 className="font-semibold text-slate-900 truncate">{project.name}</h3>
                      {project.client_name && (
                        <p className="text-sm text-slate-500">{project.client_name}</p>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                      <StatusIcon size={12} />
                      {statusConfig.label}
                    </span>
                  </div>
                  
                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-500">Progress</span>
                      <span className="font-medium">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all"
                        style={{ 
                          width: `${progressPercent}%`, 
                          backgroundColor: project.color || '#6366f1' 
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-slate-900">{project.task_count || 0}</p>
                      <p className="text-xs text-slate-500">Tasks</p>
                    </div>
                    <div className="text-center border-x border-slate-100">
                      <p className="text-lg font-semibold text-slate-900">{project.member_count || 0}</p>
                      <p className="text-xs text-slate-500">Members</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-slate-900">{project.total_hours || 0}h</p>
                      <p className="text-xs text-slate-500">Hours</p>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityConfig.color}`}>
                        {priorityConfig.label}
                      </span>
                      {project.department_name && (
                        <span className="text-xs text-slate-500">{project.department_name}</span>
                      )}
                    </div>
                    {project.end_date && (
                      <span className="text-xs text-slate-500">
                        Due {formatDate(project.end_date)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Project Dialog */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Edit Project' : 'Create New Project'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProject} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Project Name *</label>
                <Input
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
                  placeholder="Enter project name"
                  required
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <Textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                  placeholder="Project description..."
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Client Name</label>
                <Input
                  value={projectForm.client_name}
                  onChange={(e) => setProjectForm({...projectForm, client_name: e.target.value})}
                  placeholder="Optional"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <Select value={projectForm.category} onValueChange={(v) => setProjectForm({...projectForm, category: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="r&d">R&D</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <Select value={projectForm.department_id} onValueChange={(v) => setProjectForm({...projectForm, department_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project Manager</label>
                <Select value={projectForm.manager_id} onValueChange={(v) => setProjectForm({...projectForm, manager_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <Select value={projectForm.status} onValueChange={(v) => setProjectForm({...projectForm, status: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <Select value={projectForm.priority} onValueChange={(v) => setProjectForm({...projectForm, priority: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <Input
                  type="date"
                  value={projectForm.start_date}
                  onChange={(e) => setProjectForm({...projectForm, start_date: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                <Input
                  type="date"
                  value={projectForm.end_date}
                  onChange={(e) => setProjectForm({...projectForm, end_date: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Budget ($)</label>
                <Input
                  type="number"
                  value={projectForm.budget}
                  onChange={(e) => setProjectForm({...projectForm, budget: parseFloat(e.target.value) || 0})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hourly Rate ($)</label>
                <Input
                  type="number"
                  value={projectForm.hourly_rate}
                  onChange={(e) => setProjectForm({...projectForm, hourly_rate: parseFloat(e.target.value) || 0})}
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Project Color</label>
                <div className="flex gap-2 flex-wrap">
                  {PROJECT_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setProjectForm({...projectForm, color})}
                      className={`w-8 h-8 rounded-full transition-all ${projectForm.color === color ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={projectForm.billable}
                    onChange={(e) => setProjectForm({...projectForm, billable: e.target.checked})}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span className="text-sm text-slate-700">Billable project</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setProjectDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="save-project-btn">
                {editingProject ? 'Update' : 'Create'} Project
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Project Dialog */}
      <Dialog open={viewProjectOpen} onOpenChange={setViewProjectOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: projectDetails?.color || '#6366f1' }} />
              {projectDetails?.name}
            </DialogTitle>
          </DialogHeader>
          
          {projectDetails && (
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="tasks">Tasks ({projectDetails.tasks?.length || 0})</TabsTrigger>
                <TabsTrigger value="members">Team ({projectDetails.members?.length || 0})</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
              
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-4 space-y-4">
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-500">Status</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium mt-1 ${getStatusConfig(projectDetails.status).color}`}>
                      {getStatusConfig(projectDetails.status).label}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-500">Priority</p>
                    <span className={`inline-flex px-2 py-1 rounded text-sm font-medium mt-1 ${getPriorityConfig(projectDetails.priority).color}`}>
                      {getPriorityConfig(projectDetails.priority).label}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-500">Progress</p>
                    <p className="text-xl font-bold mt-1" style={{ color: projectDetails.color }}>{projectDetails.progress || 0}%</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-500">Hours Logged</p>
                    <p className="text-xl font-bold mt-1">{projectDetails.total_hours || 0}h</p>
                  </div>
                </div>
                
                {projectDetails.description && (
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <h4 className="font-medium text-slate-900 mb-2">Description</h4>
                    <p className="text-slate-600">{projectDetails.description}</p>
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <h4 className="font-medium text-slate-900 mb-3">Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Code</span>
                        <span className="font-medium">{projectDetails.code}</span>
                      </div>
                      {projectDetails.client_name && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Client</span>
                          <span className="font-medium">{projectDetails.client_name}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-500">Department</span>
                        <span className="font-medium">{projectDetails.department_name || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Manager</span>
                        <span className="font-medium">{projectDetails.manager_name || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Start Date</span>
                        <span className="font-medium">{formatDate(projectDetails.start_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">End Date</span>
                        <span className="font-medium">{formatDate(projectDetails.end_date)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <h4 className="font-medium text-slate-900 mb-3">Budget</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Budget</span>
                        <span className="font-bold text-lg">{formatCurrency(projectDetails.budget)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Spent</span>
                        <span className="font-medium">{formatCurrency(analytics?.total_spent || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Remaining</span>
                        <span className={`font-medium ${(analytics?.budget_remaining || 0) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {formatCurrency(analytics?.budget_remaining || 0)}
                        </span>
                      </div>
                      <div className="pt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Budget Utilization</span>
                          <span>{analytics?.budget_utilization || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${(analytics?.budget_utilization || 0) > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, analytics?.budget_utilization || 0)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {isAdmin && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { openEditProject(projectDetails); setViewProjectOpen(false); }}>
                      <Edit2 size={16} className="mr-2" />
                      Edit Project
                    </Button>
                    <Button variant="outline" className="text-rose-600" onClick={() => { handleDeleteProject(projectDetails.id); setViewProjectOpen(false); }}>
                      <Archive size={16} className="mr-2" />
                      Archive
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              {/* Tasks Tab */}
              <TabsContent value="tasks" className="mt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Project Tasks</h4>
                  <Button size="sm" onClick={() => { resetTaskForm(); setTaskDialogOpen(true); }}>
                    <Plus size={14} className="mr-1" />
                    Add Task
                  </Button>
                </div>
                
                {projectDetails.tasks?.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl">
                    <ListTodo className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-500">No tasks yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projectDetails.tasks?.map(task => {
                      const taskStatusConfig = getTaskStatusConfig(task.status);
                      const taskPriorityConfig = getPriorityConfig(task.priority);
                      
                      return (
                        <div 
                          key={task.id} 
                          className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <button
                              onClick={() => handleUpdateTaskStatus(task.id, task.status === 'completed' ? 'todo' : 'completed')}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                task.status === 'completed' 
                                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                                  : 'border-slate-300 hover:border-emerald-500'
                              }`}
                            >
                              {task.status === 'completed' && <CheckCircle2 size={12} />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${taskStatusConfig.color}`}>
                                  {taskStatusConfig.label}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${taskPriorityConfig.color}`}>
                                  {taskPriorityConfig.label}
                                </span>
                                {task.assignee_name && (
                                  <span className="text-xs text-slate-500">• {task.assignee_name}</span>
                                )}
                                {task.due_date && (
                                  <span className="text-xs text-slate-500">• Due {formatDate(task.due_date)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openEditTask(task)}>
                              <Edit2 size={14} />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => handleDeleteTask(task.id)}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
              
              {/* Members Tab */}
              <TabsContent value="members" className="mt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Team Members</h4>
                  <Button size="sm" onClick={() => { resetMemberForm(); setMemberDialogOpen(true); }}>
                    <UserPlus size={14} className="mr-1" />
                    Add Member
                  </Button>
                </div>
                
                {projectDetails.members?.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-500">No team members yet</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    {projectDetails.members?.map(member => (
                      <div key={member.id} className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-medium">
                            {member.employee_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{member.employee_name}</p>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-indigo-600 font-medium capitalize">{member.role}</span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-500">{member.allocation_percentage}% allocated</span>
                            </div>
                          </div>
                        </div>
                        {member.role !== 'owner' && (
                          <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => handleRemoveMember(member.id)}>
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Analytics Tab */}
              <TabsContent value="analytics" className="mt-4 space-y-4">
                {analytics && (
                  <>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-xl p-4">
                        <p className="text-sm text-blue-600">Total Hours</p>
                        <p className="text-2xl font-bold text-blue-700">{analytics.total_hours}h</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-4">
                        <p className="text-sm text-emerald-600">Task Completion</p>
                        <p className="text-2xl font-bold text-emerald-700">{analytics.task_completion_rate}%</p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-4">
                        <p className="text-sm text-purple-600">Labor Cost</p>
                        <p className="text-2xl font-bold text-purple-700">{formatCurrency(analytics.labor_cost)}</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-4">
                        <p className="text-sm text-amber-600">Expenses</p>
                        <p className="text-2xl font-bold text-amber-700">{formatCurrency(analytics.expense_total)}</p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Hours by Member */}
                      <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <h4 className="font-medium text-slate-900 mb-3">Hours by Team Member</h4>
                        {analytics.hours_by_member?.length > 0 ? (
                          <div className="space-y-2">
                            {analytics.hours_by_member.slice(0, 5).map((item, i) => (
                              <div key={i} className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">{item.name}</span>
                                <span className="font-medium">{item.hours}h</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 text-sm">No time logged yet</p>
                        )}
                      </div>
                      
                      {/* Tasks by Status */}
                      <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <h4 className="font-medium text-slate-900 mb-3">Tasks by Status</h4>
                        {Object.keys(analytics.tasks_by_status || {}).length > 0 ? (
                          <div className="space-y-2">
                            {Object.entries(analytics.tasks_by_status).map(([status, count]) => (
                              <div key={status} className="flex items-center justify-between">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTaskStatusConfig(status).color}`}>
                                  {getTaskStatusConfig(status).label}
                                </span>
                                <span className="font-medium">{count}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 text-sm">No tasks yet</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Employee *</label>
              <Select value={memberForm.employee_id} onValueChange={(v) => setMemberForm({...memberForm, employee_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.filter(emp => 
                    !projectDetails?.members?.some(m => m.employee_id === emp.id)
                  ).map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <Select value={memberForm.role} onValueChange={(v) => setMemberForm({...memberForm, role: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEMBER_ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Allocation (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={memberForm.allocation_percentage}
                onChange={(e) => setMemberForm({...memberForm, allocation_percentage: parseInt(e.target.value) || 0})}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setMemberDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Member</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Add Task'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <Input
                value={taskForm.title}
                onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                placeholder="Task title"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <Textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                placeholder="Task description..."
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assignee</label>
                <Select value={taskForm.assignee_id} onValueChange={(v) => setTaskForm({...taskForm, assignee_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projectDetails?.members?.map(member => (
                      <SelectItem key={member.employee_id} value={member.employee_id}>
                        {member.employee_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <Select value={taskForm.status} onValueChange={(v) => setTaskForm({...taskForm, status: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_STATUS_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <Select value={taskForm.priority} onValueChange={(v) => setTaskForm({...taskForm, priority: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                <Input
                  type="date"
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm({...taskForm, due_date: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Hours</label>
              <Input
                type="number"
                value={taskForm.estimated_hours}
                onChange={(e) => setTaskForm({...taskForm, estimated_hours: parseFloat(e.target.value) || 0})}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setTaskDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingTask ? 'Update' : 'Add'} Task</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projects;
