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
  Gavel,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Send,
  Check,
  Clock,
  Users,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  MessageSquare,
  FileText,
  Shield,
  User,
  Calendar,
  History,
  AlertCircle,
  Scale,
  Ban,
  UserX,
  ChevronRight,
  FileWarning
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ACTION_TYPE_CONFIG = {
  verbal_warning: { label: 'Verbal Warning', color: 'bg-amber-100 text-amber-700', icon: MessageSquare, severity: 'minor' },
  written_warning: { label: 'Written Warning', color: 'bg-orange-100 text-orange-700', icon: FileWarning, severity: 'moderate' },
  final_warning: { label: 'Final Warning', color: 'bg-rose-100 text-rose-700', icon: AlertTriangle, severity: 'major' },
  suspension: { label: 'Suspension', color: 'bg-red-100 text-red-700', icon: Ban, severity: 'major' },
  probation: { label: 'Probation', color: 'bg-purple-100 text-purple-700', icon: Clock, severity: 'major' },
  demotion: { label: 'Demotion', color: 'bg-slate-100 text-slate-700', icon: UserX, severity: 'severe' },
  termination: { label: 'Termination', color: 'bg-slate-800 text-white', icon: XCircle, severity: 'severe' },
};

const SEVERITY_CONFIG = {
  minor: { label: 'Minor', color: 'bg-blue-100 text-blue-700' },
  moderate: { label: 'Moderate', color: 'bg-amber-100 text-amber-700' },
  major: { label: 'Major', color: 'bg-orange-100 text-orange-700' },
  severe: { label: 'Severe', color: 'bg-rose-100 text-rose-700' },
};

const STATUS_CONFIG = {
  pending_acknowledgment: { label: 'Pending Acknowledgment', color: 'bg-amber-100 text-amber-700', icon: Clock },
  acknowledged: { label: 'Acknowledged', color: 'bg-blue-100 text-blue-700', icon: Check },
  appealed: { label: 'Appealed', color: 'bg-purple-100 text-purple-700', icon: Scale },
  under_review: { label: 'Under Review', color: 'bg-indigo-100 text-indigo-700', icon: Search },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-700', icon: CheckCircle2 },
};

const APPEAL_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  under_review: { label: 'Under Review', color: 'bg-blue-100 text-blue-700' },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-700' },
  modified: { label: 'Modified', color: 'bg-purple-100 text-purple-700' },
};

const Disciplinary = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('actions');
  const [stats, setStats] = useState(null);
  
  // Data
  const [actions, setActions] = useState([]);
  const [myActions, setMyActions] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [actionTypes, setActionTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Dialogs
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [appealDialogOpen, setAppealDialogOpen] = useState(false);
  const [reviewAppealDialogOpen, setReviewAppealDialogOpen] = useState(false);
  const [acknowledgeDialogOpen, setAcknowledgeDialogOpen] = useState(false);
  
  // Selected items
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [editingAction, setEditingAction] = useState(null);
  const [actionNotes, setActionNotes] = useState([]);
  const [actionAppeal, setActionAppeal] = useState(null);
  
  // Forms
  const [actionForm, setActionForm] = useState({
    employee_id: '',
    action_type: 'verbal_warning',
    severity: 'minor',
    reason: '',
    description: '',
    incident_date: '',
    action_date: new Date().toISOString().split('T')[0],
    witnesses: '',
    follow_up_date: '',
    review_period_end: '',
    suspension_start: '',
    suspension_end: '',
    probation_end: '',
  });
  
  const [appealForm, setAppealForm] = useState({
    reason: '',
    supporting_details: '',
  });
  
  const [reviewForm, setReviewForm] = useState({
    status: 'approved',
    decision: '',
    decision_notes: '',
    modified_action: '',
  });
  
  const [acknowledgeForm, setAcknowledgeForm] = useState({
    response: '',
  });
  
  const [noteForm, setNoteForm] = useState({
    content: '',
    is_internal: true,
  });

  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  // Fetch functions
  const fetchStats = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await axios.get(`${API}/disciplinary/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [isAdmin]);

  const fetchActions = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/disciplinary/actions`);
      setActions(response.data);
    } catch (error) {
      console.error('Failed to fetch actions:', error);
    }
  }, []);

  const fetchMyActions = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/disciplinary/actions/my`);
      setMyActions(response.data);
    } catch (error) {
      console.error('Failed to fetch my actions:', error);
    }
  }, []);

  const fetchAppeals = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await axios.get(`${API}/disciplinary/appeals`);
      setAppeals(response.data);
    } catch (error) {
      console.error('Failed to fetch appeals:', error);
    }
  }, [isAdmin]);

  const fetchActionTypes = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/disciplinary/action-types`);
      setActionTypes(response.data);
    } catch (error) {
      console.error('Failed to fetch action types:', error);
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

  const fetchActionDetails = useCallback(async (actionId) => {
    try {
      const [notesRes, appealRes] = await Promise.all([
        axios.get(`${API}/disciplinary/actions/${actionId}/notes`),
        axios.get(`${API}/disciplinary/actions/${actionId}/appeal`)
      ]);
      setActionNotes(notesRes.data);
      setActionAppeal(appealRes.data);
    } catch (error) {
      console.error('Failed to fetch action details:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchActions(),
        fetchMyActions(),
        fetchAppeals(),
        fetchActionTypes(),
        fetchEmployees(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchActions, fetchMyActions, fetchAppeals, fetchActionTypes, fetchEmployees]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter actions
  const filteredActions = (isAdmin ? actions : myActions).filter(action => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const refMatch = action.reference_number?.toLowerCase().includes(query);
      const nameMatch = action.employee_name?.toLowerCase().includes(query);
      const reasonMatch = action.reason?.toLowerCase().includes(query);
      if (!refMatch && !nameMatch && !reasonMatch) return false;
    }
    if (statusFilter !== 'all' && action.status !== statusFilter) return false;
    if (typeFilter !== 'all' && action.action_type !== typeFilter) return false;
    return true;
  });

  // Handlers
  const handleSaveAction = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...actionForm,
        witnesses: actionForm.witnesses ? actionForm.witnesses.split(',').map(w => w.trim()) : [],
      };
      
      if (editingAction) {
        await axios.put(`${API}/disciplinary/actions/${editingAction.id}`, data);
        toast.success('Disciplinary action updated');
      } else {
        await axios.post(`${API}/disciplinary/actions`, data);
        toast.success('Disciplinary action created');
      }
      fetchActions();
      fetchStats();
      setActionDialogOpen(false);
      resetActionForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save disciplinary action');
    }
  };

  const handleAcknowledge = async (e) => {
    e.preventDefault();
    if (!selectedAction) return;
    try {
      await axios.post(`${API}/disciplinary/actions/${selectedAction.id}/acknowledge`, acknowledgeForm);
      toast.success('Action acknowledged');
      fetchActions();
      fetchMyActions();
      setAcknowledgeDialogOpen(false);
      setAcknowledgeForm({ response: '' });
      
      // Refresh view
      const updated = await axios.get(`${API}/disciplinary/actions/${selectedAction.id}`);
      setSelectedAction(updated.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to acknowledge');
    }
  };

  const handleSubmitAppeal = async (e) => {
    e.preventDefault();
    if (!selectedAction) return;
    try {
      await axios.post(`${API}/disciplinary/actions/${selectedAction.id}/appeal`, appealForm);
      toast.success('Appeal submitted');
      fetchActions();
      fetchMyActions();
      fetchAppeals();
      fetchStats();
      setAppealDialogOpen(false);
      setAppealForm({ reason: '', supporting_details: '' });
      
      // Refresh view
      const updated = await axios.get(`${API}/disciplinary/actions/${selectedAction.id}`);
      setSelectedAction(updated.data);
      fetchActionDetails(selectedAction.id);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit appeal');
    }
  };

  const handleReviewAppeal = async (e) => {
    e.preventDefault();
    if (!selectedAppeal) return;
    try {
      await axios.put(`${API}/disciplinary/appeals/${selectedAppeal.id}`, reviewForm);
      toast.success('Appeal reviewed');
      fetchAppeals();
      fetchActions();
      fetchStats();
      setReviewAppealDialogOpen(false);
      setReviewForm({ status: 'approved', decision: '', decision_notes: '', modified_action: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to review appeal');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!selectedAction || !noteForm.content.trim()) return;
    try {
      await axios.post(`${API}/disciplinary/actions/${selectedAction.id}/notes`, noteForm);
      toast.success('Note added');
      fetchActionDetails(selectedAction.id);
      setNoteForm({ content: '', is_internal: true });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add note');
    }
  };

  const handleCloseAction = async (actionId) => {
    const notes = window.prompt('Closing notes (optional):');
    if (notes === null) return;
    try {
      await axios.post(`${API}/disciplinary/actions/${actionId}/close`, { closing_notes: notes });
      toast.success('Action closed');
      fetchActions();
      fetchStats();
      if (selectedAction?.id === actionId) {
        const updated = await axios.get(`${API}/disciplinary/actions/${actionId}`);
        setSelectedAction(updated.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to close action');
    }
  };

  const handleDeleteAction = async (actionId) => {
    if (!window.confirm('Delete this disciplinary action? This cannot be undone.')) return;
    try {
      await axios.delete(`${API}/disciplinary/actions/${actionId}`);
      toast.success('Action deleted');
      fetchActions();
      fetchStats();
      if (selectedAction?.id === actionId) {
        setViewDialogOpen(false);
        setSelectedAction(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete action');
    }
  };

  const openViewDialog = async (action) => {
    setSelectedAction(action);
    await fetchActionDetails(action.id);
    setViewDialogOpen(true);
  };

  const openEditAction = (action) => {
    setEditingAction(action);
    setActionForm({
      employee_id: action.employee_id || '',
      action_type: action.action_type || 'verbal_warning',
      severity: action.severity || 'minor',
      reason: action.reason || '',
      description: action.description || '',
      incident_date: action.incident_date || '',
      action_date: action.action_date || new Date().toISOString().split('T')[0],
      witnesses: action.witnesses?.join(', ') || '',
      follow_up_date: action.follow_up_date || '',
      review_period_end: action.review_period_end || '',
      suspension_start: action.suspension_start || '',
      suspension_end: action.suspension_end || '',
      probation_end: action.probation_end || '',
    });
    setActionDialogOpen(true);
  };

  // Reset forms
  const resetActionForm = () => {
    setEditingAction(null);
    setActionForm({
      employee_id: '',
      action_type: 'verbal_warning',
      severity: 'minor',
      reason: '',
      description: '',
      incident_date: '',
      action_date: new Date().toISOString().split('T')[0],
      witnesses: '',
      follow_up_date: '',
      review_period_end: '',
      suspension_start: '',
      suspension_end: '',
      probation_end: '',
    });
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
      <div className="p-4 lg:p-6 space-y-6" data-testid="employee-disciplinary-view">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Disciplinary Records</h1>
          <p className="text-slate-500 mt-1">View and respond to disciplinary actions</p>
        </div>

        {myActions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-4" />
            <p className="text-slate-600 font-medium">No Disciplinary Actions</p>
            <p className="text-slate-500 text-sm mt-1">You have a clean record</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myActions.map(action => {
              const typeConfig = ACTION_TYPE_CONFIG[action.action_type] || ACTION_TYPE_CONFIG.verbal_warning;
              const statusConfig = STATUS_CONFIG[action.status] || STATUS_CONFIG.pending_acknowledgment;
              const TypeIcon = typeConfig.icon;
              const StatusIcon = statusConfig.icon;
              
              return (
                <div 
                  key={action.id} 
                  className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => openViewDialog(action)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${typeConfig.color}`}>
                        <TypeIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{typeConfig.label}</h3>
                        <p className="text-sm text-slate-500">{action.reference_number}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                      <StatusIcon size={14} />
                      {statusConfig.label}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-700">Reason:</p>
                    <p className="text-slate-600">{action.reason}</p>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Issued on: {new Date(action.action_date).toLocaleDateString()}</span>
                    <span>By: {action.issued_by_name}</span>
                  </div>
                  
                  {action.status === 'pending_acknowledgment' && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <Button 
                        onClick={(e) => { e.stopPropagation(); setSelectedAction(action); setAcknowledgeDialogOpen(true); }}
                        className="w-full"
                        data-testid={`acknowledge-action-${action.id}`}
                      >
                        <Check size={16} className="mr-2" />
                        Acknowledge Receipt
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedAction && React.createElement(ACTION_TYPE_CONFIG[selectedAction.action_type]?.icon || Gavel, { size: 20 })}
                <span>{ACTION_TYPE_CONFIG[selectedAction?.action_type]?.label}</span>
                <span className="text-sm font-normal text-slate-500">({selectedAction?.reference_number})</span>
              </DialogTitle>
            </DialogHeader>
            
            {selectedAction && (
              <div className="space-y-6">
                {/* Status Badge */}
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_CONFIG[selectedAction.status]?.color}`}>
                    {React.createElement(STATUS_CONFIG[selectedAction.status]?.icon || Clock, { size: 14 })}
                    {STATUS_CONFIG[selectedAction.status]?.label}
                  </span>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${SEVERITY_CONFIG[selectedAction.severity]?.color}`}>
                    {SEVERITY_CONFIG[selectedAction.severity]?.label} Severity
                  </span>
                </div>
                
                {/* Details */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-sm text-slate-500">Reason</p>
                    <p className="font-medium text-slate-900">{selectedAction.reason}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Description</p>
                    <p className="text-slate-700 whitespace-pre-wrap">{selectedAction.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Action Date</p>
                      <p className="font-medium">{new Date(selectedAction.action_date).toLocaleDateString()}</p>
                    </div>
                    {selectedAction.incident_date && (
                      <div>
                        <p className="text-sm text-slate-500">Incident Date</p>
                        <p className="font-medium">{new Date(selectedAction.incident_date).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Issued By</p>
                    <p className="font-medium">{selectedAction.issued_by_name}</p>
                  </div>
                </div>
                
                {/* Employee Response */}
                {selectedAction.employee_response && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm font-medium text-blue-900 mb-1">Your Response:</p>
                    <p className="text-blue-700">{selectedAction.employee_response}</p>
                  </div>
                )}
                
                {/* Appeal Info */}
                {actionAppeal && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-purple-900">Appeal Status</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${APPEAL_STATUS_CONFIG[actionAppeal.status]?.color}`}>
                        {APPEAL_STATUS_CONFIG[actionAppeal.status]?.label}
                      </span>
                    </div>
                    <p className="text-sm text-purple-700 mb-2">{actionAppeal.reason}</p>
                    {actionAppeal.decision && (
                      <div className="mt-3 pt-3 border-t border-purple-200">
                        <p className="text-sm font-medium text-purple-900">Decision:</p>
                        <p className="text-purple-700">{actionAppeal.decision}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex gap-2">
                  {selectedAction.status === 'pending_acknowledgment' && (
                    <Button onClick={() => setAcknowledgeDialogOpen(true)}>
                      <Check size={16} className="mr-2" />
                      Acknowledge
                    </Button>
                  )}
                  {selectedAction.status === 'acknowledged' && !actionAppeal && (
                    <Button variant="outline" onClick={() => setAppealDialogOpen(true)}>
                      <Scale size={16} className="mr-2" />
                      Submit Appeal
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Acknowledge Dialog */}
        <Dialog open={acknowledgeDialogOpen} onOpenChange={setAcknowledgeDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Acknowledge Disciplinary Action</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAcknowledge} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                  By acknowledging, you confirm that you have received and understood this disciplinary action. 
                  You may add a response below.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Your Response (Optional)</label>
                <Textarea
                  value={acknowledgeForm.response}
                  onChange={(e) => setAcknowledgeForm({...acknowledgeForm, response: e.target.value})}
                  placeholder="Add any comments or response..."
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setAcknowledgeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Check size={16} className="mr-2" />
                  Acknowledge
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Appeal Dialog */}
        <Dialog open={appealDialogOpen} onOpenChange={setAppealDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Submit Appeal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitAppeal} className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="font-medium">{ACTION_TYPE_CONFIG[selectedAction?.action_type]?.label}</p>
                <p className="text-sm text-slate-500">{selectedAction?.reference_number}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Appeal *</label>
                <Textarea
                  value={appealForm.reason}
                  onChange={(e) => setAppealForm({...appealForm, reason: e.target.value})}
                  placeholder="Explain why you believe this action should be reconsidered..."
                  rows={4}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Supporting Details</label>
                <Textarea
                  value={appealForm.supporting_details}
                  onChange={(e) => setAppealForm({...appealForm, supporting_details: e.target.value})}
                  placeholder="Any additional information, evidence, or context..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setAppealDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Send size={16} className="mr-2" />
                  Submit Appeal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Admin View
  return (
    <div className="p-4 lg:p-6 space-y-6" data-testid="admin-disciplinary-view">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Disciplinary Actions</h1>
          <p className="text-slate-500 mt-1">Manage employee disciplinary actions and appeals</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchData()}>
            <RefreshCw size={18} className="mr-2" />
            Refresh
          </Button>
          <Button onClick={() => { resetActionForm(); setActionDialogOpen(true); }} data-testid="create-action-btn">
            <Plus size={18} className="mr-2" />
            New Action
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-slate-500 to-slate-600 rounded-2xl p-4 text-white">
          <Gavel className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-slate-200 text-sm">Total Actions</p>
          <p className="text-2xl font-bold">{stats?.total || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white">
          <Clock className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-amber-100 text-sm">Pending Ack</p>
          <p className="text-2xl font-bold">{stats?.pending_acknowledgment || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
          <Scale className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-purple-100 text-sm">Appeals</p>
          <p className="text-2xl font-bold">{stats?.pending_appeals || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
          <AlertTriangle className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-orange-100 text-sm">Warnings</p>
          <p className="text-2xl font-bold">{(stats?.verbal_warnings || 0) + (stats?.written_warnings || 0) + (stats?.final_warnings || 0)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 text-white">
          <Ban className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-red-100 text-sm">Suspensions</p>
          <p className="text-2xl font-bold">{stats?.suspensions || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-4 text-white">
          <XCircle className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-slate-300 text-sm">Terminations</p>
          <p className="text-2xl font-bold">{stats?.terminations || 0}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="actions" data-testid="tab-actions">
            <Gavel size={16} className="mr-2" />
            All Actions
          </TabsTrigger>
          <TabsTrigger value="appeals" data-testid="tab-appeals">
            <Scale size={16} className="mr-2" />
            Appeals
            {stats?.pending_appeals > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full">
                {stats.pending_appeals}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Actions Tab */}
        <TabsContent value="actions" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by reference, employee, or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                  <SelectItem key={value} value={value}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(ACTION_TYPE_CONFIG).map(([value, config]) => (
                  <SelectItem key={value} value={value}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions Table */}
          {filteredActions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Gavel className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No disciplinary actions found</p>
              <Button className="mt-4" onClick={() => { resetActionForm(); setActionDialogOpen(true); }}>
                <Plus size={16} className="mr-2" />
                Create First Action
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Reference</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Employee</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Reason</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredActions.map(action => {
                      const typeConfig = ACTION_TYPE_CONFIG[action.action_type] || ACTION_TYPE_CONFIG.verbal_warning;
                      const statusConfig = STATUS_CONFIG[action.status] || STATUS_CONFIG.pending_acknowledgment;
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <tr key={action.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <code className="bg-slate-100 px-2 py-1 rounded text-sm">{action.reference_number}</code>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-slate-900">{action.employee_name}</p>
                            {action.employee_department && (
                              <p className="text-sm text-slate-500">{action.employee_department}</p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>
                              {React.createElement(typeConfig.icon, { size: 12 })}
                              {typeConfig.label}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-slate-600 truncate max-w-xs">{action.reason}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              <StatusIcon size={12} />
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-500">
                            {new Date(action.action_date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openViewDialog(action)} title="View">
                                <Eye size={16} />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openEditAction(action)} title="Edit">
                                <Edit2 size={16} />
                              </Button>
                              {action.status !== 'closed' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleCloseAction(action.id)}
                                  title="Close"
                                  className="text-emerald-600"
                                >
                                  <CheckCircle2 size={16} />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteAction(action.id)}
                                title="Delete"
                                className="text-rose-600"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Appeals Tab */}
        <TabsContent value="appeals" className="mt-4">
          {appeals.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Scale className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No appeals submitted</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Employee</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Action Type</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Appeal Reason</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Submitted</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appeals.map(appeal => {
                    const relatedAction = actions.find(a => a.id === appeal.disciplinary_action_id);
                    const statusConfig = APPEAL_STATUS_CONFIG[appeal.status] || APPEAL_STATUS_CONFIG.pending;
                    
                    return (
                      <tr key={appeal.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium">{appeal.employee_name}</td>
                        <td className="py-3 px-4">
                          {relatedAction && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${ACTION_TYPE_CONFIG[relatedAction.action_type]?.color}`}>
                              {ACTION_TYPE_CONFIG[relatedAction.action_type]?.label}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-slate-600 truncate max-w-xs">{appeal.reason}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500">
                          {new Date(appeal.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-1">
                            {appeal.status === 'pending' && (
                              <Button 
                                size="sm"
                                onClick={() => { setSelectedAppeal(appeal); setReviewAppealDialogOpen(true); }}
                              >
                                Review
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAction ? 'Edit Disciplinary Action' : 'New Disciplinary Action'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Employee *</label>
              <Select 
                value={actionForm.employee_id} 
                onValueChange={(v) => setActionForm({...actionForm, employee_id: v})}
                disabled={!!editingAction}
              >
                <SelectTrigger data-testid="employee-select">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Action Type *</label>
                <Select 
                  value={actionForm.action_type} 
                  onValueChange={(v) => {
                    const type = actionTypes.find(t => t.value === v);
                    setActionForm({
                      ...actionForm, 
                      action_type: v,
                      severity: type?.severity || 'minor'
                    });
                  }}
                >
                  <SelectTrigger data-testid="action-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTION_TYPE_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
                <Select value={actionForm.severity} onValueChange={(v) => setActionForm({...actionForm, severity: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SEVERITY_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason *</label>
              <Input
                value={actionForm.reason}
                onChange={(e) => setActionForm({...actionForm, reason: e.target.value})}
                placeholder="Brief reason for the action"
                required
                data-testid="reason-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
              <Textarea
                value={actionForm.description}
                onChange={(e) => setActionForm({...actionForm, description: e.target.value})}
                placeholder="Detailed description of the incident and action taken..."
                rows={4}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Incident Date</label>
                <Input
                  type="date"
                  value={actionForm.incident_date}
                  onChange={(e) => setActionForm({...actionForm, incident_date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Action Date *</label>
                <Input
                  type="date"
                  value={actionForm.action_date}
                  onChange={(e) => setActionForm({...actionForm, action_date: e.target.value})}
                  required
                />
              </div>
            </div>
            
            {(actionForm.action_type === 'suspension') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Suspension Start</label>
                  <Input
                    type="date"
                    value={actionForm.suspension_start}
                    onChange={(e) => setActionForm({...actionForm, suspension_start: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Suspension End</label>
                  <Input
                    type="date"
                    value={actionForm.suspension_end}
                    onChange={(e) => setActionForm({...actionForm, suspension_end: e.target.value})}
                  />
                </div>
              </div>
            )}
            
            {actionForm.action_type === 'probation' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Probation End Date</label>
                <Input
                  type="date"
                  value={actionForm.probation_end}
                  onChange={(e) => setActionForm({...actionForm, probation_end: e.target.value})}
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Witnesses (comma-separated)</label>
              <Input
                value={actionForm.witnesses}
                onChange={(e) => setActionForm({...actionForm, witnesses: e.target.value})}
                placeholder="John Doe, Jane Smith"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Follow-up Date</label>
              <Input
                type="date"
                value={actionForm.follow_up_date}
                onChange={(e) => setActionForm({...actionForm, follow_up_date: e.target.value})}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setActionDialogOpen(false); resetActionForm(); }}>
                Cancel
              </Button>
              <Button type="submit" data-testid="save-action-btn">
                {editingAction ? 'Update Action' : 'Create Action'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Action Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAction && React.createElement(ACTION_TYPE_CONFIG[selectedAction.action_type]?.icon || Gavel, { size: 20 })}
              <span>{ACTION_TYPE_CONFIG[selectedAction?.action_type]?.label}</span>
              <span className="text-sm font-normal text-slate-500">({selectedAction?.reference_number})</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedAction && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                {selectedAction.status !== 'closed' && (
                  <Button size="sm" variant="outline" onClick={() => handleCloseAction(selectedAction.id)}>
                    <CheckCircle2 size={14} className="mr-1" />
                    Close Action
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => openEditAction(selectedAction)}>
                  <Edit2 size={14} className="mr-1" />
                  Edit
                </Button>
              </div>
              
              {/* Status and Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_CONFIG[selectedAction.status]?.color}`}>
                      {React.createElement(STATUS_CONFIG[selectedAction.status]?.icon || Clock, { size: 14 })}
                      {STATUS_CONFIG[selectedAction.status]?.label}
                    </span>
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${SEVERITY_CONFIG[selectedAction.severity]?.color}`}>
                      {SEVERITY_CONFIG[selectedAction.severity]?.label}
                    </span>
                  </div>
                  
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Employee:</span>
                      <span className="font-medium">{selectedAction.employee_name}</span>
                    </div>
                    {selectedAction.employee_department && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Department:</span>
                        <span className="font-medium">{selectedAction.employee_department}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Issued by:</span>
                      <span className="font-medium">{selectedAction.issued_by_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Action date:</span>
                      <span className="font-medium">{new Date(selectedAction.action_date).toLocaleDateString()}</span>
                    </div>
                    {selectedAction.incident_date && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Incident date:</span>
                        <span className="font-medium">{new Date(selectedAction.incident_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-medium text-slate-900 mb-2">Reason</h4>
                  <p className="text-slate-700 font-medium mb-3">{selectedAction.reason}</p>
                  <h4 className="font-medium text-slate-900 mb-2">Description</h4>
                  <p className="text-slate-600 text-sm whitespace-pre-wrap">{selectedAction.description}</p>
                </div>
              </div>
              
              {/* Employee Response */}
              {selectedAction.employee_response && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-blue-900 mb-1">Employee Response:</p>
                  <p className="text-blue-700">{selectedAction.employee_response}</p>
                </div>
              )}
              
              {/* Appeal Info */}
              {actionAppeal && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-purple-900">Appeal</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${APPEAL_STATUS_CONFIG[actionAppeal.status]?.color}`}>
                      {APPEAL_STATUS_CONFIG[actionAppeal.status]?.label}
                    </span>
                  </div>
                  <p className="text-sm text-purple-700 mb-2"><strong>Reason:</strong> {actionAppeal.reason}</p>
                  {actionAppeal.supporting_details && (
                    <p className="text-sm text-purple-700"><strong>Details:</strong> {actionAppeal.supporting_details}</p>
                  )}
                  {actionAppeal.decision && (
                    <div className="mt-3 pt-3 border-t border-purple-200">
                      <p className="text-sm font-medium text-purple-900">Decision:</p>
                      <p className="text-purple-700">{actionAppeal.decision}</p>
                    </div>
                  )}
                  {actionAppeal.status === 'pending' && (
                    <Button 
                      size="sm" 
                      className="mt-3"
                      onClick={() => { setSelectedAppeal(actionAppeal); setReviewAppealDialogOpen(true); }}
                    >
                      Review Appeal
                    </Button>
                  )}
                </div>
              )}
              
              {/* Notes */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                  <MessageSquare size={18} />
                  Notes ({actionNotes.length})
                </h4>
                
                {actionNotes.length > 0 && (
                  <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                    {actionNotes.map(note => (
                      <div 
                        key={note.id} 
                        className={`p-3 rounded-lg ${note.is_internal ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            {note.author_name}
                            {note.is_internal && <span className="ml-2 text-xs text-amber-600">(Internal)</span>}
                          </span>
                          <span className="text-xs text-slate-500">{new Date(note.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-600">{note.content}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <Input
                    value={noteForm.content}
                    onChange={(e) => setNoteForm({...noteForm, content: e.target.value})}
                    placeholder="Add a note..."
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!noteForm.content.trim()}>
                    <Send size={16} />
                  </Button>
                </form>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Appeal Dialog */}
      <Dialog open={reviewAppealDialogOpen} onOpenChange={setReviewAppealDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Appeal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReviewAppeal} className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-500">Appeal from:</p>
              <p className="font-medium">{selectedAppeal?.employee_name}</p>
              <p className="text-sm text-slate-600 mt-2">{selectedAppeal?.reason}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Decision *</label>
              <Select value={reviewForm.status} onValueChange={(v) => setReviewForm({...reviewForm, status: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approve (Overturn Action)</SelectItem>
                  <SelectItem value="modified">Modify (Change Action Type)</SelectItem>
                  <SelectItem value="rejected">Reject (Uphold Action)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {reviewForm.status === 'modified' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Action Type</label>
                <Select value={reviewForm.modified_action} onValueChange={(v) => setReviewForm({...reviewForm, modified_action: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new action type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTION_TYPE_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Decision Summary *</label>
              <Textarea
                value={reviewForm.decision}
                onChange={(e) => setReviewForm({...reviewForm, decision: e.target.value})}
                placeholder="Summary of the decision..."
                rows={3}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Internal Notes</label>
              <Textarea
                value={reviewForm.decision_notes}
                onChange={(e) => setReviewForm({...reviewForm, decision_notes: e.target.value})}
                placeholder="Additional notes (internal)..."
                rows={2}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setReviewAppealDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Gavel size={16} className="mr-2" />
                Submit Decision
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Disciplinary;
