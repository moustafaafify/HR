import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Plus, Edit2, Trash2, GitBranch, CheckCircle2, XCircle, Clock,
  ArrowRight, Users, User, Building2, ChevronDown, ChevronUp,
  Palmtree, DollarSign, GraduationCap, FileText, UserPlus, UserMinus,
  BarChart3, Settings, Play, Pause, Eye, AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MODULES = [
  { value: 'leave', label: 'Leave Requests', icon: Palmtree, color: 'emerald' },
  { value: 'time_correction', label: 'Time Corrections', icon: Clock, color: 'cyan' },
  { value: 'expense', label: 'Expense Claims', icon: DollarSign, color: 'amber' },
  { value: 'training', label: 'Training Requests', icon: GraduationCap, color: 'blue' },
  { value: 'document', label: 'Document Approvals', icon: FileText, color: 'purple' },
  { value: 'onboarding', label: 'Onboarding', icon: UserPlus, color: 'teal' },
  { value: 'offboarding', label: 'Offboarding', icon: UserMinus, color: 'rose' },
  { value: 'performance', label: 'Performance Reviews', icon: BarChart3, color: 'indigo' },
];

const APPROVER_TYPES = [
  { value: 'manager', label: 'Direct Manager', icon: User },
  { value: 'department_head', label: 'Department Head', icon: Building2 },
  { value: 'role', label: 'Specific Role', icon: Users },
  { value: 'specific_user', label: 'Specific User', icon: User },
];

const Workflows = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('workflows');
  const [workflows, setWorkflows] = useState([]);
  const [instances, setInstances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [instanceDetails, setInstanceDetails] = useState(null);
  const [expandedWorkflow, setExpandedWorkflow] = useState(null);
  const [filterModule, setFilterModule] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionComment, setRejectionComment] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    module: 'leave',
    is_active: true,
    steps: [],
    conditions: {}
  });

  const [newStep, setNewStep] = useState({
    name: '',
    approver_type: 'manager',
    approver_id: '',
    can_skip: false,
    auto_approve_after_days: null
  });

  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  const fetchWorkflows = async () => {
    try {
      const response = await axios.get(`${API}/workflows`);
      setWorkflows(response.data);
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    }
  };

  const fetchInstances = async () => {
    try {
      const response = await axios.get(`${API}/workflow-instances`);
      setInstances(response.data);
    } catch (error) {
      console.error('Failed to fetch instances:', error);
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

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API}/roles`);
      setRoles(response.data);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  useEffect(() => {
    fetchWorkflows();
    fetchInstances();
    fetchEmployees();
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInstanceDetails = async (instanceId) => {
    try {
      const response = await axios.get(`${API}/workflow-instances/${instanceId}/details`);
      setInstanceDetails(response.data);
    } catch (error) {
      console.error('Failed to fetch instance details:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingWorkflow) {
        await axios.put(`${API}/workflows/${editingWorkflow.id}`, formData);
        toast.success('Workflow updated successfully');
      } else {
        await axios.post(`${API}/workflows`, formData);
        toast.success('Workflow created successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchWorkflows();
    } catch (error) {
      toast.error('Failed to save workflow');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      module: 'leave',
      is_active: true,
      steps: [],
      conditions: {}
    });
    setNewStep({
      name: '',
      approver_type: 'manager',
      approver_id: '',
      can_skip: false,
      auto_approve_after_days: null
    });
    setEditingWorkflow(null);
  };

  const openEditDialog = (workflow) => {
    setEditingWorkflow(workflow);
    setFormData({
      name: workflow.name,
      description: workflow.description || '',
      module: workflow.module,
      is_active: workflow.is_active,
      steps: workflow.steps || [],
      conditions: workflow.conditions || {}
    });
    setDialogOpen(true);
  };

  const deleteWorkflow = async (id) => {
    if (!window.confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await axios.delete(`${API}/workflows/${id}`);
      toast.success('Workflow deleted');
      fetchWorkflows();
    } catch (error) {
      toast.error('Failed to delete workflow');
    }
  };

  const toggleWorkflowStatus = async (workflow) => {
    try {
      await axios.put(`${API}/workflows/${workflow.id}`, {
        is_active: !workflow.is_active
      });
      toast.success(`Workflow ${workflow.is_active ? 'deactivated' : 'activated'}`);
      fetchWorkflows();
    } catch (error) {
      toast.error('Failed to update workflow status');
    }
  };

  const addStep = () => {
    if (!newStep.name) {
      toast.error('Step name is required');
      return;
    }
    const step = {
      ...newStep,
      order: formData.steps.length + 1
    };
    setFormData({
      ...formData,
      steps: [...formData.steps, step]
    });
    setNewStep({
      name: '',
      approver_type: 'manager',
      approver_id: '',
      can_skip: false,
      auto_approve_after_days: null
    });
  };

  const removeStep = (index) => {
    const newSteps = formData.steps.filter((_, i) => i !== index).map((step, i) => ({
      ...step,
      order: i + 1
    }));
    setFormData({ ...formData, steps: newSteps });
  };

  const moveStep = (index, direction) => {
    const newSteps = [...formData.steps];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newSteps.length) return;
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
    newSteps.forEach((step, i) => step.order = i + 1);
    setFormData({ ...formData, steps: newSteps });
  };

  const handleWorkflowAction = async (instanceId, action, comment = '') => {
    try {
      await axios.put(`${API}/workflow-instances/${instanceId}/action`, {
        action,
        comment
      });
      toast.success(`Request ${action}ed successfully`);
      fetchInstances();
      setViewDialogOpen(false);
      setRejectDialogOpen(false);
      setRejectionComment('');
      setInstanceDetails(null);
    } catch (error) {
      toast.error('Failed to process action');
    }
  };

  const openInstanceDetails = async (instance) => {
    setSelectedInstance(instance);
    setViewDialogOpen(true);
    await fetchInstanceDetails(instance.id);
  };

  const getModuleInfo = (module) => {
    return MODULES.find(m => m.value === module) || MODULES[0];
  };

  const getApproverLabel = (step) => {
    if (step.approver_type === 'manager') return 'Direct Manager';
    if (step.approver_type === 'department_head') return 'Department Head';
    if (step.approver_type === 'role') {
      const role = roles.find(r => r.id === step.approver_id);
      return role ? role.display_name || role.name : 'Role';
    }
    if (step.approver_type === 'specific_user') {
      const emp = employees.find(e => e.id === step.approver_id);
      return emp ? emp.full_name : 'User';
    }
    return step.approver_type;
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.full_name : '-';
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
      pending_approval: { label: 'Pending Approval', color: 'bg-amber-100 text-amber-700', icon: Clock },
      in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: GitBranch },
      approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
      rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-700', icon: XCircle },
      cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-700', icon: XCircle }
    };
    return statusMap[status] || statusMap.pending;
  };

  // Filter instances
  const filteredInstances = instances.filter(i => {
    if (filterModule !== 'all' && i.module !== filterModule) return false;
    if (filterStatus !== 'all' && i.status !== filterStatus) return false;
    return true;
  });

  // Stats
  const pendingCount = instances.filter(i => i.status === 'pending' || i.status === 'in_progress').length;
  const approvedCount = instances.filter(i => i.status === 'approved').length;
  const rejectedCount = instances.filter(i => i.status === 'rejected').length;

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div data-testid="workflows-page" className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Workflows
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1">Configure approval workflows for HR processes</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs sm:text-sm">Active Workflows</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{workflows.filter(w => w.is_active).length}</p>
            </div>
            <div className="bg-indigo-100 rounded-xl p-2 sm:p-3">
              <GitBranch size={20} className="text-indigo-600 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-xs sm:text-sm">Pending Approvals</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{pendingCount}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <Clock size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs sm:text-sm">Approved</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{approvedCount}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <CheckCircle2 size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-xs sm:text-sm">Rejected</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{rejectedCount}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <XCircle size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl w-full sm:w-auto flex">
          <TabsTrigger value="workflows" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
            <Settings size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Workflow</span> Templates
          </TabsTrigger>
          <TabsTrigger value="instances" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
            <GitBranch size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Active</span> Requests
          </TabsTrigger>
        </TabsList>

        {/* Workflow Templates Tab */}
        <TabsContent value="workflows" className="mt-4 sm:mt-6">
          <div className="flex justify-end mb-4">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => { resetForm(); setDialogOpen(true); }}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg"
                >
                  <Plus size={20} className="me-2" />
                  Create Workflow
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <GitBranch className="text-indigo-600" size={24} />
                    {editingWorkflow ? 'Edit' : 'Create'} Workflow
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Workflow Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                        placeholder="e.g., Leave Approval"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Module *</label>
                      <Select value={formData.module} onValueChange={(value) => setFormData({ ...formData, module: value })}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MODULES.map((mod) => (
                            <SelectItem key={mod.value} value={mod.value}>
                              <div className="flex items-center gap-2">
                                <mod.icon size={16} />
                                {mod.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                      rows={2}
                      placeholder="Describe this workflow..."
                    />
                  </div>

                  {/* Steps Section */}
                  <div className="border border-slate-200 rounded-xl p-4">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <ArrowRight size={18} />
                      Approval Steps
                    </h3>
                    
                    {/* Existing Steps */}
                    {formData.steps.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {formData.steps.map((step, index) => (
                          <div key={index} className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                              {step.order}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">{step.name}</p>
                              <p className="text-sm text-slate-500">{getApproverLabel(step)}</p>
                            </div>
                            {step.can_skip && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">Skippable</span>
                            )}
                            <div className="flex gap-1">
                              <button type="button" onClick={() => moveStep(index, 'up')} disabled={index === 0} className="p-1 hover:bg-slate-200 rounded disabled:opacity-30">
                                <ChevronUp size={16} />
                              </button>
                              <button type="button" onClick={() => moveStep(index, 'down')} disabled={index === formData.steps.length - 1} className="p-1 hover:bg-slate-200 rounded disabled:opacity-30">
                                <ChevronDown size={16} />
                              </button>
                              <button type="button" onClick={() => removeStep(index)} className="p-1 hover:bg-red-100 text-red-600 rounded">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add New Step */}
                    <div className="bg-indigo-50 rounded-lg p-4 space-y-3">
                      <p className="text-sm font-medium text-indigo-900">Add New Step</p>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={newStep.name}
                          onChange={(e) => setNewStep({ ...newStep, name: e.target.value })}
                          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                          placeholder="Step name (e.g., Manager Approval)"
                        />
                        <Select value={newStep.approver_type} onValueChange={(value) => setNewStep({ ...newStep, approver_type: value, approver_id: '' })}>
                          <SelectTrigger className="rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {APPROVER_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {(newStep.approver_type === 'role' || newStep.approver_type === 'specific_user') && (
                        <Select value={newStep.approver_id} onValueChange={(value) => setNewStep({ ...newStep, approver_id: value })}>
                          <SelectTrigger className="rounded-lg">
                            <SelectValue placeholder={newStep.approver_type === 'role' ? 'Select Role' : 'Select User'} />
                          </SelectTrigger>
                          <SelectContent>
                            {newStep.approver_type === 'role' 
                              ? roles.map((role) => (
                                  <SelectItem key={role.id} value={role.id}>{role.display_name || role.name}</SelectItem>
                                ))
                              : employees.map((emp) => (
                                  <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                                ))
                            }
                          </SelectContent>
                        </Select>
                      )}
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newStep.can_skip}
                            onChange={(e) => setNewStep({ ...newStep, can_skip: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-sm text-slate-700">Can be skipped</span>
                        </label>
                      </div>
                      <Button type="button" onClick={addStep} variant="outline" className="rounded-lg w-full">
                        <Plus size={16} className="me-2" />
                        Add Step
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded w-5 h-5"
                    />
                    <label htmlFor="is_active" className="text-sm text-slate-700">Workflow is active</label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" className="rounded-xl bg-indigo-950 hover:bg-indigo-900 flex-1">
                      {editingWorkflow ? 'Update' : 'Create'} Workflow
                    </Button>
                    <Button type="button" onClick={() => setDialogOpen(false)} variant="outline" className="rounded-xl">
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Workflows Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {workflows.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-16 text-center">
                <GitBranch size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-slate-600 font-medium">No workflows configured</p>
                <p className="text-slate-400 text-sm mt-1">Create your first approval workflow</p>
              </div>
            ) : (
              workflows.map((workflow) => {
                const moduleInfo = getModuleInfo(workflow.module);
                const ModuleIcon = moduleInfo.icon;
                const isExpanded = expandedWorkflow === workflow.id;
                
                return (
                  <div key={workflow.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div 
                      className={`p-5 cursor-pointer hover:bg-slate-50 transition-colors`}
                      onClick={() => setExpandedWorkflow(isExpanded ? null : workflow.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-${moduleInfo.color}-100 flex items-center justify-center`}>
                            <ModuleIcon size={24} className={`text-${moduleInfo.color}-600`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900">{workflow.name}</h3>
                              {workflow.is_active ? (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Active</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">Inactive</span>
                              )}
                            </div>
                            <p className="text-slate-500 text-sm mt-1">{moduleInfo.label}</p>
                            {workflow.description && (
                              <p className="text-slate-400 text-sm mt-1">{workflow.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">{workflow.steps?.length || 0} steps</span>
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="border-t border-slate-100 p-5 bg-slate-50">
                        {/* Steps Timeline */}
                        {workflow.steps?.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-slate-700 mb-3">Approval Flow</p>
                            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                              {workflow.steps.map((step, idx) => (
                                <React.Fragment key={idx}>
                                  <div className="flex flex-col items-center min-w-[120px]">
                                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                                      {idx + 1}
                                    </div>
                                    <p className="text-xs font-medium text-slate-900 mt-2 text-center">{step.name}</p>
                                    <p className="text-xs text-slate-500 text-center">{getApproverLabel(step)}</p>
                                  </div>
                                  {idx < workflow.steps.length - 1 && (
                                    <ArrowRight size={20} className="text-slate-300 flex-shrink-0" />
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button onClick={() => openEditDialog(workflow)} variant="outline" size="sm" className="rounded-lg">
                            <Edit2 size={14} className="me-1" />
                            Edit
                          </Button>
                          <Button onClick={() => toggleWorkflowStatus(workflow)} variant="outline" size="sm" className="rounded-lg">
                            {workflow.is_active ? <Pause size={14} className="me-1" /> : <Play size={14} className="me-1" />}
                            {workflow.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button onClick={() => deleteWorkflow(workflow.id)} variant="outline" size="sm" className="rounded-lg text-red-600 hover:bg-red-50">
                            <Trash2 size={14} className="me-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Active Requests Tab */}
        <TabsContent value="instances" className="mt-4 sm:mt-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Select value={filterModule} onValueChange={setFilterModule}>
              <SelectTrigger className="w-full sm:w-48 rounded-xl">
                <SelectValue placeholder="Filter by Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {MODULES.map((mod) => (
                  <SelectItem key={mod.value} value={mod.value}>{mod.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48 rounded-xl">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            {(filterModule !== 'all' || filterStatus !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => { setFilterModule('all'); setFilterStatus('all'); }}
                className="rounded-xl text-sm"
              >
                Clear Filters
              </Button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Request</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700 hidden sm:table-cell">Module</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Requester</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700 hidden md:table-cell">Current Step</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Status</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstances.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 sm:py-16 text-center">
                        <GitBranch size={40} className="mx-auto mb-4 text-slate-300 sm:w-12 sm:h-12" />
                        <p className="text-slate-500 text-sm sm:text-base">No workflow requests found</p>
                        {(filterModule !== 'all' || filterStatus !== 'all') && (
                          <p className="text-slate-400 text-xs sm:text-sm mt-1">Try adjusting your filters</p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredInstances.map((instance) => {
                      const workflow = workflows.find(w => w.id === instance.workflow_id);
                      const moduleInfo = getModuleInfo(instance.module);
                      const ModuleIcon = moduleInfo.icon;
                      const statusInfo = getStatusInfo(instance.status);
                      const StatusIcon = statusInfo.icon;
                      const currentStepInfo = workflow?.steps?.[instance.current_step];
                      
                      return (
                        <tr key={instance.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <p className="font-medium text-slate-900 text-sm">{workflow?.name || 'Unknown'}</p>
                            <p className="text-xs text-slate-400">ID: {instance.reference_id?.slice(0, 8)}...</p>
                            <div className="sm:hidden mt-1 flex items-center gap-1">
                              <ModuleIcon size={12} className={`text-${moduleInfo.color}-600`} />
                              <span className="text-xs text-slate-500">{moduleInfo.label}</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                            <div className="flex items-center gap-2">
                              <ModuleIcon size={16} className={`text-${moduleInfo.color}-600`} />
                              <span className="text-slate-600 text-sm">{moduleInfo.label}</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 text-sm">
                            {getEmployeeName(instance.requester_id)}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                            {currentStepInfo ? (
                              <span className="text-sm">
                                Step {instance.current_step + 1}: {currentStepInfo.name}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}>
                              <StatusIcon size={10} className="sm:w-3 sm:h-3" />
                              <span className="hidden sm:inline">{statusInfo.label}</span>
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <div className="flex gap-1 sm:gap-2">
                              <Button
                                onClick={() => openInstanceDetails(instance)}
                                size="sm"
                                variant="ghost"
                                className="rounded-lg p-1 sm:p-2"
                                data-testid={`view-instance-${instance.id}`}
                              >
                                <Eye size={14} className="sm:w-4 sm:h-4" />
                              </Button>
                              {(instance.status === 'pending' || instance.status === 'in_progress') && (
                                <>
                                  <Button
                                    onClick={() => handleWorkflowAction(instance.id, 'approve')}
                                    size="sm"
                                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 p-1 sm:p-2"
                                    data-testid={`approve-instance-${instance.id}`}
                                  >
                                    <CheckCircle2 size={14} className="sm:w-4 sm:h-4" />
                                  </Button>
                                  <Button
                                    onClick={() => { setSelectedInstance(instance); setRejectDialogOpen(true); }}
                                    size="sm"
                                    variant="outline"
                                    className="rounded-lg text-red-600 p-1 sm:p-2"
                                    data-testid={`reject-instance-${instance.id}`}
                                  >
                                    <XCircle size={14} className="sm:w-4 sm:h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2 text-rose-600">
              <XCircle size={24} />
              Reject Request
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleWorkflowAction(selectedInstance?.id, 'reject', rejectionComment); }} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Reason for Rejection</label>
              <textarea
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none resize-none"
                rows={3}
                placeholder="Please provide a reason for rejection..."
                required
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="rounded-xl bg-rose-600 hover:bg-rose-700 flex-1">
                Reject Request
              </Button>
              <Button type="button" onClick={() => setRejectDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Instance Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => { setViewDialogOpen(open); if (!open) setInstanceDetails(null); }}>
        <DialogContent className="rounded-2xl max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <GitBranch className="text-indigo-600" size={24} />
              Workflow Details
            </DialogTitle>
          </DialogHeader>
          {selectedInstance && (
            <div className="space-y-4 mt-4">
              {/* Status Badge */}
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Status</p>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold mt-1 ${getStatusInfo(selectedInstance.status).color}`}>
                      {React.createElement(getStatusInfo(selectedInstance.status).icon, { size: 14 })}
                      {getStatusInfo(selectedInstance.status).label}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Submitted</p>
                    <p className="text-sm font-medium text-slate-900 mt-1">{formatDate(selectedInstance.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Request Details */}
              {instanceDetails?.reference_document && (
                <div className="border border-slate-200 rounded-xl p-4">
                  <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    {React.createElement(getModuleInfo(selectedInstance.module).icon, { size: 18 })}
                    Request Details
                  </h4>
                  {selectedInstance.module === 'leave' && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500">Leave Type</p>
                        <p className="font-medium text-slate-900 capitalize">{instanceDetails.reference_document.leave_type?.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Duration</p>
                        <p className="font-medium text-slate-900">
                          {formatDate(instanceDetails.reference_document.start_date)} - {formatDate(instanceDetails.reference_document.end_date)}
                        </p>
                      </div>
                      {instanceDetails.reference_document.reason && (
                        <div className="col-span-2">
                          <p className="text-slate-500">Reason</p>
                          <p className="font-medium text-slate-900">{instanceDetails.reference_document.reason}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedInstance.module === 'time_correction' && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500">Date</p>
                        <p className="font-medium text-slate-900">{formatDate(instanceDetails.reference_document.date)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Original Clock In/Out</p>
                        <p className="font-medium text-slate-900">
                          {instanceDetails.reference_document.original_clock_in || '-'} / {instanceDetails.reference_document.original_clock_out || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Requested Clock In/Out</p>
                        <p className="font-medium text-slate-900 text-blue-600">
                          {instanceDetails.reference_document.requested_clock_in || '-'} / {instanceDetails.reference_document.requested_clock_out || '-'}
                        </p>
                      </div>
                      {instanceDetails.reference_document.reason && (
                        <div className="col-span-2">
                          <p className="text-slate-500">Reason</p>
                          <p className="font-medium text-slate-900">{instanceDetails.reference_document.reason}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedInstance.module === 'expense' && instanceDetails.reference_document && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500">Title</p>
                        <p className="font-medium text-slate-900">{instanceDetails.reference_document.title}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Amount</p>
                        <p className="font-medium text-slate-900">
                          {instanceDetails.reference_document.currency} {instanceDetails.reference_document.amount}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Category</p>
                        <p className="font-medium text-slate-900 capitalize">{instanceDetails.reference_document.category}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Requester Info */}
              <div className="border border-slate-200 rounded-xl p-4">
                <h4 className="font-bold text-slate-900 mb-2">Requester</h4>
                <p className="text-slate-600">{instanceDetails?.requester?.full_name || getEmployeeName(selectedInstance.requester_id)}</p>
              </div>
              
              {/* Approval History */}
              <div className="border border-slate-200 rounded-xl p-4">
                <h4 className="font-bold text-slate-900 mb-3">Approval History</h4>
                <div className="space-y-2">
                  {selectedInstance.step_history?.length > 0 ? (
                    selectedInstance.step_history.map((history, idx) => (
                      <div key={idx} className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          history.action === 'approve' ? 'bg-emerald-100' : history.action === 'reject' ? 'bg-rose-100' : 'bg-amber-100'
                        }`}>
                          {history.action === 'approve' ? (
                            <CheckCircle2 size={16} className="text-emerald-600" />
                          ) : history.action === 'reject' ? (
                            <XCircle size={16} className="text-rose-600" />
                          ) : (
                            <ArrowRight size={16} className="text-amber-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 capitalize">{history.action}ed</p>
                          <p className="text-sm text-slate-500">Step {history.step + 1}</p>
                          {history.comment && <p className="text-sm text-slate-600 mt-1 break-words">&ldquo;{history.comment}&rdquo;</p>}
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(history.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-sm">No actions taken yet</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              {(selectedInstance.status === 'pending' || selectedInstance.status === 'in_progress') && (
                <div className="flex gap-3 pt-2">
                  <Button 
                    onClick={() => handleWorkflowAction(selectedInstance.id, 'approve')}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 flex-1"
                  >
                    <CheckCircle2 size={18} className="me-2" />
                    Approve
                  </Button>
                  <Button 
                    onClick={() => { setViewDialogOpen(false); setRejectDialogOpen(true); }}
                    variant="outline" 
                    className="rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50 flex-1"
                  >
                    <XCircle size={18} className="me-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Workflows;
