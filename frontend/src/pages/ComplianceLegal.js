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
  Shield,
  FileText,
  BookOpen,
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Eye,
  Download,
  Upload,
  Users,
  Calendar,
  FileSignature,
  AlertCircle,
  CheckSquare,
  XCircle,
  ChevronRight,
  Lock,
  Unlock,
  Send,
  Flag,
  Target,
  ClipboardList
} from 'lucide-react';
import {
  ComplianceStatsCard,
  PolicyCard,
  TrainingCard,
  MyTrainingCard,
  IncidentCard,
  CertificationCard,
  LegalDocumentCard,
  PolicyDialog,
  TrainingDialog,
  IncidentDialog
} from '../components/compliance';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ComplianceLegal = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Admin data
  const [dashboard, setDashboard] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // Employee data
  const [myOverview, setMyOverview] = useState(null);
  
  // Dialogs
  const [policyDialog, setPolicyDialog] = useState(false);
  const [trainingDialog, setTrainingDialog] = useState(false);
  const [documentDialog, setDocumentDialog] = useState(false);
  const [incidentDialog, setIncidentDialog] = useState(false);
  const [certificationDialog, setCertificationDialog] = useState(false);
  const [assignTrainingDialog, setAssignTrainingDialog] = useState(false);
  const [viewPolicyDialog, setViewPolicyDialog] = useState(false);
  
  // Forms
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  
  const [policyForm, setPolicyForm] = useState({
    title: '',
    description: '',
    category: 'general',
    content: '',
    version: '1.0',
    status: 'draft',
    effective_date: '',
    requires_acknowledgement: true,
    acknowledgement_frequency: 'once'
  });
  
  const [trainingForm, setTrainingForm] = useState({
    title: '',
    description: '',
    category: 'general',
    content_type: 'video',
    content_url: '',
    duration_minutes: 30,
    is_mandatory: true,
    passing_score: 80,
    certification_validity_months: 12
  });
  
  const [documentForm, setDocumentForm] = useState({
    title: '',
    document_type: 'contract',
    description: '',
    employee_id: '',
    status: 'draft',
    effective_date: '',
    expiry_date: '',
    requires_employee_signature: true,
    requires_company_signature: true
  });
  
  const [incidentForm, setIncidentForm] = useState({
    title: '',
    description: '',
    incident_type: 'policy_violation',
    severity: 'medium',
    incident_date: new Date().toISOString().split('T')[0],
    is_confidential: false
  });
  
  const [certificationForm, setCertificationForm] = useState({
    employee_id: '',
    certification_name: '',
    certification_type: 'internal',
    issuing_authority: '',
    issued_date: '',
    expiry_date: '',
    requires_renewal: true
  });
  
  const [assignForm, setAssignForm] = useState({
    employee_ids: []
  });
  
  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';
  
  // Fetch functions
  const fetchDashboard = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/compliance/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboard(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  }, [token]);
  
  const fetchPolicies = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/compliance/policies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPolicies(response.data);
    } catch (error) {
      console.error('Error fetching policies:', error);
    }
  }, [token]);
  
  const fetchTrainings = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/compliance/trainings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrainings(response.data);
    } catch (error) {
      console.error('Error fetching trainings:', error);
    }
  }, [token]);
  
  const fetchDocuments = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/compliance/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  }, [token]);
  
  const fetchIncidents = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/compliance/incidents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIncidents(response.data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    }
  }, [token]);
  
  const fetchCertifications = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/compliance/certifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCertifications(response.data);
    } catch (error) {
      console.error('Error fetching certifications:', error);
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
  
  const fetchMyOverview = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/compliance/my-overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyOverview(response.data);
    } catch (error) {
      console.error('Error fetching my overview:', error);
    }
  }, [token]);
  
  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (isAdmin) {
          await Promise.all([
            fetchDashboard(),
            fetchPolicies(),
            fetchTrainings(),
            fetchDocuments(),
            fetchIncidents(),
            fetchCertifications(),
            fetchEmployees()
          ]);
        } else {
          await fetchMyOverview();
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [isAdmin, fetchDashboard, fetchPolicies, fetchTrainings, fetchDocuments, 
      fetchIncidents, fetchCertifications, fetchEmployees, fetchMyOverview]);
  
  // Handlers
  const handleSavePolicy = async () => {
    try {
      if (selectedItem) {
        await axios.put(`${API}/compliance/policies/${selectedItem.id}`, policyForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Policy updated');
      } else {
        await axios.post(`${API}/compliance/policies`, policyForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Policy created');
      }
      
      setPolicyDialog(false);
      setSelectedItem(null);
      fetchPolicies();
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save policy');
    }
  };
  
  const handleDeletePolicy = async (id) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;
    
    try {
      await axios.delete(`${API}/compliance/policies/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Policy deleted');
      fetchPolicies();
      fetchDashboard();
    } catch (error) {
      toast.error('Failed to delete policy');
    }
  };
  
  const handleAcknowledgePolicy = async (policyId) => {
    try {
      await axios.post(`${API}/compliance/policies/${policyId}/acknowledge`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Policy acknowledged');
      fetchMyOverview();
    } catch (error) {
      toast.error('Failed to acknowledge policy');
    }
  };
  
  const handleSaveTraining = async () => {
    try {
      if (selectedItem) {
        await axios.put(`${API}/compliance/trainings/${selectedItem.id}`, trainingForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Training updated');
      } else {
        await axios.post(`${API}/compliance/trainings`, trainingForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Training created');
      }
      
      setTrainingDialog(false);
      setSelectedItem(null);
      fetchTrainings();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save training');
    }
  };
  
  const handleAssignTraining = async () => {
    if (!selectedItem || assignForm.employee_ids.length === 0) return;
    
    try {
      await axios.post(`${API}/compliance/trainings/${selectedItem.id}/assign`, assignForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Training assigned');
      setAssignTrainingDialog(false);
      setSelectedItem(null);
      setAssignForm({ employee_ids: [] });
    } catch (error) {
      toast.error('Failed to assign training');
    }
  };
  
  const handleSaveDocument = async () => {
    try {
      if (selectedItem) {
        await axios.put(`${API}/compliance/documents/${selectedItem.id}`, documentForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Document updated');
      } else {
        await axios.post(`${API}/compliance/documents`, documentForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Document created');
      }
      
      setDocumentDialog(false);
      setSelectedItem(null);
      fetchDocuments();
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save document');
    }
  };
  
  const handleSignDocument = async (docId) => {
    try {
      await axios.post(`${API}/compliance/documents/${docId}/sign`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Document signed');
      fetchMyOverview();
    } catch (error) {
      toast.error('Failed to sign document');
    }
  };
  
  const handleSaveIncident = async () => {
    try {
      if (selectedItem) {
        await axios.put(`${API}/compliance/incidents/${selectedItem.id}`, incidentForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Incident updated');
      } else {
        await axios.post(`${API}/compliance/incidents`, incidentForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Incident reported');
      }
      
      setIncidentDialog(false);
      setSelectedItem(null);
      fetchIncidents();
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save incident');
    }
  };
  
  const handleSaveCertification = async () => {
    try {
      if (selectedItem) {
        await axios.put(`${API}/compliance/certifications/${selectedItem.id}`, certificationForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Certification updated');
      } else {
        await axios.post(`${API}/compliance/certifications`, certificationForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Certification added');
      }
      
      setCertificationDialog(false);
      setSelectedItem(null);
      fetchCertifications();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save certification');
    }
  };
  
  const handleUpdateTrainingProgress = async (completionId, status, progress) => {
    try {
      await axios.put(`${API}/compliance/my-trainings/${completionId}`, {
        status,
        progress_percentage: progress
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Progress updated');
      fetchMyOverview();
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };
  
  // Utility functions
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
      high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      low: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
    };
    return colors[severity] || colors.medium;
  };
  
  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
      published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      signed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      pending_signature: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      reported: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      under_investigation: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      closed: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
      expired: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
      failed: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
      archived: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };
  
  const getCategoryIcon = (category) => {
    const icons = {
      general: ClipboardList,
      hr: Users,
      safety: Shield,
      data_privacy: Lock,
      security: Shield,
      financial: FileText,
      ethics: Target,
      harassment: AlertTriangle
    };
    return icons[category] || ClipboardList;
  };
  
  const openEditPolicy = (policy) => {
    setSelectedItem(policy);
    setPolicyForm({
      title: policy.title || '',
      description: policy.description || '',
      category: policy.category || 'general',
      content: policy.content || '',
      version: policy.version || '1.0',
      status: policy.status || 'draft',
      effective_date: policy.effective_date || '',
      requires_acknowledgement: policy.requires_acknowledgement !== false,
      acknowledgement_frequency: policy.acknowledgement_frequency || 'once'
    });
    setPolicyDialog(true);
  };
  
  const openNewPolicy = () => {
    setSelectedItem(null);
    setPolicyForm({
      title: '',
      description: '',
      category: 'general',
      content: '',
      version: '1.0',
      status: 'draft',
      effective_date: '',
      requires_acknowledgement: true,
      acknowledgement_frequency: 'once'
    });
    setPolicyDialog(true);
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
      <div className="p-4 lg:p-6 space-y-6" data-testid="compliance-legal-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Compliance</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">View policies, trainings, and documents assigned to you</p>
          </div>
          <Button onClick={() => { setSelectedItem(null); setIncidentDialog(true); }} data-testid="report-incident-btn">
            <Flag className="w-4 h-4 mr-2" />
            Report Incident
          </Button>
        </div>
        
        {/* Stats */}
        {myOverview?.stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Pending Policies</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{myOverview.stats.pending_policies_count}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Pending Trainings</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{myOverview.stats.pending_trainings_count}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <FileSignature className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Pending Signatures</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{myOverview.stats.pending_signatures_count}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Certifications</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{myOverview.stats.active_certifications}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Pending Policies */}
        {myOverview?.pending_policies?.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              Policies Requiring Acknowledgement
            </h2>
            <div className="space-y-3">
              {myOverview.pending_policies.map((policy) => {
                const CategoryIcon = getCategoryIcon(policy.category);
                return (
                  <div key={policy.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <CategoryIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{policy.title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{policy.category} • v{policy.version}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setSelectedPolicy(policy); setViewPolicyDialog(true); }}>
                        <Eye className="w-4 h-4 mr-1" /> View
                      </Button>
                      <Button size="sm" onClick={() => handleAcknowledgePolicy(policy.id)}>
                        <CheckSquare className="w-4 h-4 mr-1" /> Acknowledge
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Trainings */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            My Trainings
          </h2>
          {myOverview?.trainings?.length > 0 ? (
            <div className="space-y-3">
              {myOverview.trainings.map((training) => (
                <div key={training.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{training.training_title}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Due: {formatDate(training.expires_at)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(training.status)}`}>
                      {training.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Progress value={training.progress_percentage} className="h-2" />
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{training.progress_percentage}%</span>
                    {training.status !== 'completed' && (
                      <Button size="sm" variant="outline" onClick={() => handleUpdateTrainingProgress(training.id, 'in_progress', Math.min(100, training.progress_percentage + 25))}>
                        Continue
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-center py-8">No trainings assigned</p>
          )}
        </div>
        
        {/* Documents Pending Signature */}
        {myOverview?.pending_signatures?.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-purple-600" />
              Documents Pending Signature
            </h2>
            <div className="space-y-3">
              {myOverview.pending_signatures.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{doc.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{doc.document_type.replace('_', ' ')}</p>
                  </div>
                  <Button size="sm" onClick={() => handleSignDocument(doc.id)}>
                    <FileSignature className="w-4 h-4 mr-1" /> Sign
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* My Certifications */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            My Certifications
          </h2>
          {myOverview?.certifications?.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {myOverview.certifications.map((cert) => (
                <div key={cert.id} className="p-4 border border-slate-200 dark:border-slate-600 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{cert.certification_name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{cert.issuing_authority || cert.certification_type}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cert.status)}`}>
                      {cert.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Issued: {formatDate(cert.issued_date)}</span>
                    {cert.expiry_date && (
                      <span className="text-slate-500 dark:text-slate-400">Expires: {formatDate(cert.expiry_date)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-center py-8">No certifications on record</p>
          )}
        </div>
        
        {/* View Policy Dialog */}
        <Dialog open={viewPolicyDialog} onOpenChange={setViewPolicyDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white">{selectedPolicy?.title}</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span className="capitalize">{selectedPolicy?.category}</span>
                <span>•</span>
                <span>Version {selectedPolicy?.version}</span>
                <span>•</span>
                <span>Effective: {formatDate(selectedPolicy?.effective_date)}</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{selectedPolicy?.content || selectedPolicy?.description || 'No content available'}</p>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" onClick={() => setViewPolicyDialog(false)} className="dark:border-slate-600 dark:text-slate-200">Close</Button>
                <Button onClick={() => { handleAcknowledgePolicy(selectedPolicy?.id); setViewPolicyDialog(false); }}>
                  <CheckSquare className="w-4 h-4 mr-1" /> Acknowledge
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Report Incident Dialog */}
        <Dialog open={incidentDialog} onOpenChange={setIncidentDialog}>
          <DialogContent className="max-w-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white">Report Compliance Incident</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Title *</label>
                <Input
                  value={incidentForm.title}
                  onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })}
                  placeholder="Brief description of the incident"
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Incident Type</label>
                <Select value={incidentForm.incident_type} onValueChange={(v) => setIncidentForm({ ...incidentForm, incident_type: v })}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="policy_violation">Policy Violation</SelectItem>
                    <SelectItem value="safety">Safety Concern</SelectItem>
                    <SelectItem value="harassment">Harassment</SelectItem>
                    <SelectItem value="data_breach">Data Breach</SelectItem>
                    <SelectItem value="ethics">Ethics Violation</SelectItem>
                    <SelectItem value="fraud">Fraud</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Severity</label>
                <Select value={incidentForm.severity} onValueChange={(v) => setIncidentForm({ ...incidentForm, severity: v })}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Date of Incident</label>
                <Input
                  type="date"
                  value={incidentForm.incident_date}
                  onChange={(e) => setIncidentForm({ ...incidentForm, incident_date: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Description *</label>
                <Textarea
                  value={incidentForm.description}
                  onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                  rows={4}
                  placeholder="Provide details about the incident..."
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incidentForm.is_confidential}
                  onChange={(e) => setIncidentForm({ ...incidentForm, is_confidential: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600"
                />
                <span className="text-sm text-slate-700 dark:text-slate-200">Keep this report confidential</span>
              </label>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" onClick={() => setIncidentDialog(false)} className="dark:border-slate-600 dark:text-slate-200">Cancel</Button>
                <Button onClick={handleSaveIncident}>Submit Report</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  
  // Admin View
  return (
    <div className="p-4 lg:p-6 space-y-6" data-testid="compliance-legal-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Compliance & Legal</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage policies, trainings, documents, and compliance tracking</p>
        </div>
      </div>
      
      {/* Dashboard Summary */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Policies</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{dashboard.summary.total_policies}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pending Ack</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{dashboard.summary.pending_acknowledgements}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Trainings</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{dashboard.summary.total_trainings}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Open Incidents</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{dashboard.summary.open_incidents}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <FileSignature className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pending Sign</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{dashboard.summary.pending_signatures}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Expiring Certs</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{dashboard.summary.expiring_certifications}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="trainings">Trainings</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Incidents */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  Recent Incidents
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('incidents')}>
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="space-y-3">
                {dashboard?.recent_incidents?.slice(0, 4).map((incident) => (
                  <div key={incident.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{incident.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{incident.incident_type.replace('_', ' ')} • {formatDate(incident.reported_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                        {incident.status}
                      </span>
                    </div>
                  </div>
                ))}
                {(!dashboard?.recent_incidents || dashboard.recent_incidents.length === 0) && (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-4">No recent incidents</p>
                )}
              </div>
            </div>
            
            {/* Overdue/Critical Items */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Attention Required
              </h3>
              <div className="space-y-3">
                {dashboard?.summary?.overdue_trainings > 0 && (
                  <div className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-rose-600" />
                      <span className="text-slate-900 dark:text-white">{dashboard.summary.overdue_trainings} overdue trainings</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setActiveTab('trainings')}>View</Button>
                  </div>
                )}
                {dashboard?.summary?.critical_incidents > 0 && (
                  <div className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                      <span className="text-slate-900 dark:text-white">{dashboard.summary.critical_incidents} critical incidents</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setActiveTab('incidents')}>View</Button>
                  </div>
                )}
                {dashboard?.summary?.expired_certifications > 0 && (
                  <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-amber-600" />
                      <span className="text-slate-900 dark:text-white">{dashboard.summary.expired_certifications} expired certifications</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setActiveTab('certifications')}>View</Button>
                  </div>
                )}
                {dashboard?.policies_expiring?.length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="text-slate-900 dark:text-white">{dashboard.policies_expiring.length} policies expiring soon</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setActiveTab('policies')}>View</Button>
                  </div>
                )}
                {!dashboard?.summary?.overdue_trainings && !dashboard?.summary?.critical_incidents && 
                 !dashboard?.summary?.expired_certifications && !dashboard?.policies_expiring?.length && (
                  <p className="text-emerald-600 dark:text-emerald-400 text-center py-4 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> All compliance items are up to date
                  </p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Policies Tab */}
        <TabsContent value="policies" className="mt-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900 dark:text-white">Company Policies</h3>
              <Button onClick={openNewPolicy} data-testid="add-policy-btn">
                <Plus className="w-4 h-4 mr-2" />
                New Policy
              </Button>
            </div>
            <div className="p-4">
              {policies.length > 0 ? (
                <div className="space-y-3">
                  {policies.map((policy) => {
                    const CategoryIcon = getCategoryIcon(policy.category);
                    return (
                      <div key={policy.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <CategoryIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{policy.title}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                              {policy.category} • v{policy.version} • {policy.requires_acknowledgement ? 'Requires ack' : 'No ack required'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(policy.status)}`}>
                            {policy.status}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => openEditPolicy(policy)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeletePolicy(policy.id)}>
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No policies created</p>
                  <Button className="mt-4" onClick={openNewPolicy}>Create First Policy</Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Trainings Tab */}
        <TabsContent value="trainings" className="mt-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900 dark:text-white">Compliance Trainings</h3>
              <Button onClick={() => { setSelectedItem(null); setTrainingDialog(true); }} data-testid="add-training-btn">
                <Plus className="w-4 h-4 mr-2" />
                New Training
              </Button>
            </div>
            <div className="p-4">
              {trainings.length > 0 ? (
                <div className="space-y-3">
                  {trainings.map((training) => (
                    <div key={training.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{training.title}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                            {training.category} • {training.duration_minutes} min • {training.is_mandatory ? 'Mandatory' : 'Optional'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(training.status)}`}>
                          {training.status}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => { setSelectedItem(training); setAssignTrainingDialog(true); }}>
                          <Users className="w-4 h-4 mr-1" /> Assign
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(training); setTrainingForm(training); setTrainingDialog(true); }}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No trainings created</p>
                  <Button className="mt-4" onClick={() => setTrainingDialog(true)}>Create First Training</Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900 dark:text-white">Legal Documents</h3>
              <Button onClick={() => { setSelectedItem(null); setDocumentDialog(true); }} data-testid="add-document-btn">
                <Plus className="w-4 h-4 mr-2" />
                New Document
              </Button>
            </div>
            <div className="p-4">
              {documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <FileSignature className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{doc.title}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                            {doc.document_type.replace('_', ' ')} {doc.employee_name && `• ${doc.employee_name}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                          {doc.status.replace('_', ' ')}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(doc); setDocumentForm(doc); setDocumentDialog(true); }}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileSignature className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No documents created</p>
                  <Button className="mt-4" onClick={() => setDocumentDialog(true)}>Create First Document</Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Incidents Tab */}
        <TabsContent value="incidents" className="mt-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900 dark:text-white">Compliance Incidents</h3>
            </div>
            <div className="p-4">
              {incidents.length > 0 ? (
                <div className="space-y-3">
                  {incidents.map((incident) => (
                    <div key={incident.id} className="p-4 border border-slate-200 dark:border-slate-600 rounded-xl">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{incident.title}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                            {incident.incident_type.replace('_', ' ')} • Reported by {incident.reported_by_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                            {incident.severity}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                            {incident.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{incident.description}</p>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Incident Date: {formatDate(incident.incident_date)}</span>
                        <span>Reported: {formatDate(incident.reported_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No incidents reported</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Certifications Tab */}
        <TabsContent value="certifications" className="mt-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900 dark:text-white">Employee Certifications</h3>
              <Button onClick={() => { setSelectedItem(null); setCertificationDialog(true); }} data-testid="add-certification-btn">
                <Plus className="w-4 h-4 mr-2" />
                Add Certification
              </Button>
            </div>
            <div className="p-4">
              {certifications.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="p-4 border border-slate-200 dark:border-slate-600 rounded-xl">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{cert.certification_name}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{cert.employee_name}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cert.status)}`}>
                          {cert.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                        <p>Issued: {formatDate(cert.issued_date)}</p>
                        {cert.expiry_date && <p>Expires: {formatDate(cert.expiry_date)}</p>}
                        <p className="capitalize">{cert.certification_type} • {cert.issuing_authority || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No certifications recorded</p>
                  <Button className="mt-4" onClick={() => setCertificationDialog(true)}>Add First Certification</Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Policy Dialog */}
      <Dialog open={policyDialog} onOpenChange={setPolicyDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">{selectedItem ? 'Edit Policy' : 'New Policy'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Title *</label>
                <Input
                  value={policyForm.title}
                  onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value })}
                  placeholder="e.g., Code of Conduct"
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Category</label>
                <Select value={policyForm.category} onValueChange={(v) => setPolicyForm({ ...policyForm, category: v })}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="data_privacy">Data Privacy</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="ethics">Ethics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Status</label>
                <Select value={policyForm.status} onValueChange={(v) => setPolicyForm({ ...policyForm, status: v })}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Version</label>
                <Input
                  value={policyForm.version}
                  onChange={(e) => setPolicyForm({ ...policyForm, version: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Effective Date</label>
                <Input
                  type="date"
                  value={policyForm.effective_date}
                  onChange={(e) => setPolicyForm({ ...policyForm, effective_date: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Description</label>
                <Input
                  value={policyForm.description}
                  onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
                  placeholder="Brief description of the policy"
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Policy Content</label>
                <Textarea
                  value={policyForm.content}
                  onChange={(e) => setPolicyForm({ ...policyForm, content: e.target.value })}
                  rows={6}
                  placeholder="Full policy text..."
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div className="col-span-2 flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={policyForm.requires_acknowledgement}
                    onChange={(e) => setPolicyForm({ ...policyForm, requires_acknowledgement: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-200">Requires Acknowledgement</span>
                </label>
                {policyForm.requires_acknowledgement && (
                  <Select value={policyForm.acknowledgement_frequency} onValueChange={(v) => setPolicyForm({ ...policyForm, acknowledgement_frequency: v })}>
                    <SelectTrigger className="w-[150px] bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                      <SelectItem value="once">Once</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" onClick={() => setPolicyDialog(false)} className="dark:border-slate-600 dark:text-slate-200">Cancel</Button>
              <Button onClick={handleSavePolicy}>{selectedItem ? 'Update' : 'Create'} Policy</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Training Dialog */}
      <Dialog open={trainingDialog} onOpenChange={setTrainingDialog}>
        <DialogContent className="max-w-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">{selectedItem ? 'Edit Training' : 'New Training'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Title *</label>
              <Input
                value={trainingForm.title}
                onChange={(e) => setTrainingForm({ ...trainingForm, title: e.target.value })}
                placeholder="e.g., Anti-Harassment Training"
                className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Category</label>
                <Select value={trainingForm.category} onValueChange={(v) => setTrainingForm({ ...trainingForm, category: v })}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="harassment">Harassment</SelectItem>
                    <SelectItem value="ethics">Ethics</SelectItem>
                    <SelectItem value="data_privacy">Data Privacy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Duration (min)</label>
                <Input
                  type="number"
                  value={trainingForm.duration_minutes}
                  onChange={(e) => setTrainingForm({ ...trainingForm, duration_minutes: parseInt(e.target.value) || 30 })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Description</label>
              <Textarea
                value={trainingForm.description}
                onChange={(e) => setTrainingForm({ ...trainingForm, description: e.target.value })}
                rows={3}
                className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Passing Score (%)</label>
                <Input
                  type="number"
                  value={trainingForm.passing_score}
                  onChange={(e) => setTrainingForm({ ...trainingForm, passing_score: parseInt(e.target.value) || 80 })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Valid for (months)</label>
                <Input
                  type="number"
                  value={trainingForm.certification_validity_months}
                  onChange={(e) => setTrainingForm({ ...trainingForm, certification_validity_months: parseInt(e.target.value) || 12 })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={trainingForm.is_mandatory}
                onChange={(e) => setTrainingForm({ ...trainingForm, is_mandatory: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600"
              />
              <span className="text-sm text-slate-700 dark:text-slate-200">Mandatory Training</span>
            </label>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" onClick={() => setTrainingDialog(false)} className="dark:border-slate-600 dark:text-slate-200">Cancel</Button>
              <Button onClick={handleSaveTraining}>{selectedItem ? 'Update' : 'Create'} Training</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Assign Training Dialog */}
      <Dialog open={assignTrainingDialog} onOpenChange={setAssignTrainingDialog}>
        <DialogContent className="max-w-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">Assign Training: {selectedItem?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Select Employees</label>
              <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-lg p-2 space-y-1">
                {employees.map((emp) => (
                  <label key={emp.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer">
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
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-200">{emp.full_name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{assignForm.employee_ids.length} selected</p>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" onClick={() => setAssignTrainingDialog(false)} className="dark:border-slate-600 dark:text-slate-200">Cancel</Button>
              <Button onClick={handleAssignTraining} disabled={assignForm.employee_ids.length === 0}>
                Assign to {assignForm.employee_ids.length} Employee(s)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Document Dialog */}
      <Dialog open={documentDialog} onOpenChange={setDocumentDialog}>
        <DialogContent className="max-w-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">{selectedItem ? 'Edit Document' : 'New Document'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Title *</label>
              <Input
                value={documentForm.title}
                onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })}
                placeholder="e.g., Employment Contract"
                className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Document Type</label>
                <Select value={documentForm.document_type} onValueChange={(v) => setDocumentForm({ ...documentForm, document_type: v })}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="nda">NDA</SelectItem>
                    <SelectItem value="agreement">Agreement</SelectItem>
                    <SelectItem value="amendment">Amendment</SelectItem>
                    <SelectItem value="offer_letter">Offer Letter</SelectItem>
                    <SelectItem value="termination">Termination</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Employee</label>
                <Select value={documentForm.employee_id || "none"} onValueChange={(v) => setDocumentForm({ ...documentForm, employee_id: v === "none" ? "" : v })}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="none">No specific employee</SelectItem>
                    {employees.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Description</label>
              <Textarea
                value={documentForm.description}
                onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })}
                rows={2}
                className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Effective Date</label>
                <Input
                  type="date"
                  value={documentForm.effective_date}
                  onChange={(e) => setDocumentForm({ ...documentForm, effective_date: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Expiry Date</label>
                <Input
                  type="date"
                  value={documentForm.expiry_date}
                  onChange={(e) => setDocumentForm({ ...documentForm, expiry_date: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={documentForm.requires_employee_signature}
                  onChange={(e) => setDocumentForm({ ...documentForm, requires_employee_signature: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600"
                />
                <span className="text-sm text-slate-700 dark:text-slate-200">Employee Signature</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={documentForm.requires_company_signature}
                  onChange={(e) => setDocumentForm({ ...documentForm, requires_company_signature: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600"
                />
                <span className="text-sm text-slate-700 dark:text-slate-200">Company Signature</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" onClick={() => setDocumentDialog(false)} className="dark:border-slate-600 dark:text-slate-200">Cancel</Button>
              <Button onClick={handleSaveDocument}>{selectedItem ? 'Update' : 'Create'} Document</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Certification Dialog */}
      <Dialog open={certificationDialog} onOpenChange={setCertificationDialog}>
        <DialogContent className="max-w-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">{selectedItem ? 'Edit Certification' : 'Add Certification'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Employee *</label>
              <Select value={certificationForm.employee_id || "select"} onValueChange={(v) => setCertificationForm({ ...certificationForm, employee_id: v === "select" ? "" : v })}>
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Certification Name *</label>
              <Input
                value={certificationForm.certification_name}
                onChange={(e) => setCertificationForm({ ...certificationForm, certification_name: e.target.value })}
                placeholder="e.g., ISO 27001 Lead Auditor"
                className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Type</label>
                <Select value={certificationForm.certification_type} onValueChange={(v) => setCertificationForm({ ...certificationForm, certification_type: v })}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                    <SelectItem value="regulatory">Regulatory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Issuing Authority</label>
                <Input
                  value={certificationForm.issuing_authority}
                  onChange={(e) => setCertificationForm({ ...certificationForm, issuing_authority: e.target.value })}
                  placeholder="e.g., ISO, AWS, Google"
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Issued Date *</label>
                <Input
                  type="date"
                  value={certificationForm.issued_date}
                  onChange={(e) => setCertificationForm({ ...certificationForm, issued_date: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Expiry Date</label>
                <Input
                  type="date"
                  value={certificationForm.expiry_date}
                  onChange={(e) => setCertificationForm({ ...certificationForm, expiry_date: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" onClick={() => setCertificationDialog(false)} className="dark:border-slate-600 dark:text-slate-200">Cancel</Button>
              <Button onClick={handleSaveCertification}>{selectedItem ? 'Update' : 'Add'} Certification</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Incident Dialog for Admin */}
      <Dialog open={incidentDialog} onOpenChange={setIncidentDialog}>
        <DialogContent className="max-w-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">{selectedItem ? 'Edit Incident' : 'Report Incident'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Title *</label>
              <Input
                value={incidentForm.title}
                onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })}
                placeholder="Brief description"
                className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Type</label>
                <Select value={incidentForm.incident_type} onValueChange={(v) => setIncidentForm({ ...incidentForm, incident_type: v })}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="policy_violation">Policy Violation</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="harassment">Harassment</SelectItem>
                    <SelectItem value="data_breach">Data Breach</SelectItem>
                    <SelectItem value="ethics">Ethics</SelectItem>
                    <SelectItem value="fraud">Fraud</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Severity</label>
                <Select value={incidentForm.severity} onValueChange={(v) => setIncidentForm({ ...incidentForm, severity: v })}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Description *</label>
              <Textarea
                value={incidentForm.description}
                onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                rows={4}
                className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" onClick={() => setIncidentDialog(false)} className="dark:border-slate-600 dark:text-slate-200">Cancel</Button>
              <Button onClick={handleSaveIncident}>{selectedItem ? 'Update' : 'Submit'} Report</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComplianceLegal;
