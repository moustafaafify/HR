import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { 
  CalendarClock, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Edit2, 
  Clock, 
  Mail, 
  FileText, 
  BarChart3, 
  Calendar, 
  Shield, 
  Users, 
  UserCheck, 
  User, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  History,
  Send,
  X,
  ChevronRight,
  Settings,
  Zap
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Report type icons mapping
const REPORT_ICONS = {
  analytics: BarChart3,
  leave: Calendar,
  attendance: Clock,
  compliance: Shield,
  workforce: Users,
  visitors: UserCheck,
  employees: User
};

// Frequency options
const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }
];

// Days of week
const DAYS_OF_WEEK = [
  { value: 0, label: 'Monday' },
  { value: 1, label: 'Tuesday' },
  { value: 2, label: 'Wednesday' },
  { value: 3, label: 'Thursday' },
  { value: 4, label: 'Friday' },
  { value: 5, label: 'Saturday' },
  { value: 6, label: 'Sunday' }
];

// Date range options
const DATE_RANGES = [
  { value: 'last_period', label: 'Last Period (based on frequency)' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_quarter', label: 'Last Quarter (90 days)' }
];

// Format options
const FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'csv', label: 'CSV' },
  { value: 'both', label: 'PDF & CSV' }
];

const ScheduledReports = () => {
  const { token, user } = useAuth();
  const [reports, setReports] = useState([]);
  const [reportTypes, setReportTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRunsDialog, setShowRunsDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportRuns, setReportRuns] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    report_type: 'analytics',
    frequency: 'weekly',
    day_of_week: 0,
    day_of_month: 1,
    time_of_day: '09:00',
    recipients: '',
    cc_recipients: '',
    format: 'pdf',
    include_charts: true,
    date_range: 'last_period'
  });

  useEffect(() => {
    fetchReportTypes();
    fetchReports();
  }, []);

  const fetchReportTypes = async () => {
    try {
      const res = await axios.get(`${API}/scheduled-reports/report-types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportTypes(res.data);
    } catch (error) {
      console.error('Failed to fetch report types:', error);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/scheduled-reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(res.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('Failed to load scheduled reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchReportRuns = async (reportId) => {
    try {
      const res = await axios.get(`${API}/scheduled-reports/${reportId}/runs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportRuns(res.data);
    } catch (error) {
      console.error('Failed to fetch report runs:', error);
      toast.error('Failed to load report history');
    }
  };

  const handleCreateReport = async () => {
    try {
      setActionLoading(true);
      const payload = {
        ...form,
        recipients: form.recipients.split(',').map(e => e.trim()).filter(Boolean),
        cc_recipients: form.cc_recipients ? form.cc_recipients.split(',').map(e => e.trim()).filter(Boolean) : []
      };
      
      await axios.post(`${API}/scheduled-reports`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Scheduled report created successfully');
      setShowCreateDialog(false);
      resetForm();
      fetchReports();
    } catch (error) {
      console.error('Failed to create report:', error);
      toast.error(error.response?.data?.detail || 'Failed to create scheduled report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateReport = async () => {
    try {
      setActionLoading(true);
      const payload = {
        ...form,
        recipients: form.recipients.split(',').map(e => e.trim()).filter(Boolean),
        cc_recipients: form.cc_recipients ? form.cc_recipients.split(',').map(e => e.trim()).filter(Boolean) : []
      };
      
      await axios.put(`${API}/scheduled-reports/${selectedReport.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Scheduled report updated successfully');
      setShowEditDialog(false);
      setSelectedReport(null);
      resetForm();
      fetchReports();
    } catch (error) {
      console.error('Failed to update report:', error);
      toast.error(error.response?.data?.detail || 'Failed to update scheduled report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this scheduled report?')) return;
    
    try {
      await axios.delete(`${API}/scheduled-reports/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Scheduled report deleted');
      fetchReports();
    } catch (error) {
      console.error('Failed to delete report:', error);
      toast.error('Failed to delete scheduled report');
    }
  };

  const handleRunNow = async (reportId) => {
    try {
      setActionLoading(true);
      const res = await axios.post(`${API}/scheduled-reports/${reportId}/run`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        toast.success(res.data.message);
      } else {
        toast.warning(res.data.message);
      }
      fetchReports();
    } catch (error) {
      console.error('Failed to run report:', error);
      toast.error(error.response?.data?.detail || 'Failed to run report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (report) => {
    try {
      const endpoint = report.status === 'active' ? 'pause' : 'resume';
      await axios.post(`${API}/scheduled-reports/${report.id}/${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Report ${endpoint === 'pause' ? 'paused' : 'resumed'}`);
      fetchReports();
    } catch (error) {
      console.error('Failed to toggle report status:', error);
      toast.error('Failed to update report status');
    }
  };

  const handlePreview = async (reportType, dateRange) => {
    try {
      setActionLoading(true);
      const res = await axios.post(`${API}/scheduled-reports/preview`, {
        report_type: reportType,
        date_range: dateRange
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPreviewData(res.data);
      setShowPreviewDialog(true);
    } catch (error) {
      console.error('Failed to preview report:', error);
      toast.error('Failed to generate preview');
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      report_type: 'analytics',
      frequency: 'weekly',
      day_of_week: 0,
      day_of_month: 1,
      time_of_day: '09:00',
      recipients: '',
      cc_recipients: '',
      format: 'pdf',
      include_charts: true,
      date_range: 'last_period'
    });
  };

  const openEditDialog = (report) => {
    setSelectedReport(report);
    setForm({
      name: report.name,
      description: report.description || '',
      report_type: report.report_type,
      frequency: report.frequency,
      day_of_week: report.day_of_week || 0,
      day_of_month: report.day_of_month || 1,
      time_of_day: report.time_of_day || '09:00',
      recipients: report.recipients.join(', '),
      cc_recipients: report.cc_recipients?.join(', ') || '',
      format: report.format,
      include_charts: report.include_charts,
      date_range: report.date_range
    });
    setShowEditDialog(true);
  };

  const openRunsDialog = async (report) => {
    setSelectedReport(report);
    await fetchReportRuns(report.id);
    setShowRunsDialog(true);
  };

  const formatNextRun = (dateStr) => {
    if (!dateStr) return 'Not scheduled';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      generating: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      sending: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
    };
    return styles[status] || styles.active;
  };

  const getRunStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="text-green-500" size={16} />;
      case 'failed': return <XCircle className="text-red-500" size={16} />;
      case 'generating':
      case 'sending': return <RefreshCw className="text-purple-500 animate-spin" size={16} />;
      default: return <AlertCircle className="text-amber-500" size={16} />;
    }
  };

  const activeReports = reports.filter(r => r.status === 'active');
  const pausedReports = reports.filter(r => r.status === 'paused');

  // Check if user is admin
  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-2xl mx-auto text-center py-16">
          <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Access Restricted</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Only administrators can manage scheduled reports.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <CalendarClock className="text-indigo-600" />
              Scheduled Reports
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Automate report delivery to stakeholders on a schedule
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            data-testid="create-report-btn"
          >
            <Plus size={18} className="mr-2" />
            Create Schedule
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <CalendarClock className="text-indigo-600 dark:text-indigo-400" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{reports.length}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Schedules</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Play className="text-green-600 dark:text-green-400" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeReports.length}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Pause className="text-amber-600 dark:text-amber-400" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{pausedReports.length}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Paused</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Send className="text-purple-600 dark:text-purple-400" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {reports.reduce((sum, r) => sum + (r.run_count || 0), 0)}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Runs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 bg-slate-100 dark:bg-slate-800">
            <TabsTrigger value="active" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
              Active ({activeReports.length})
            </TabsTrigger>
            <TabsTrigger value="paused" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
              Paused ({pausedReports.length})
            </TabsTrigger>
            <TabsTrigger value="types" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
              Report Types
            </TabsTrigger>
          </TabsList>

          {/* Active Reports Tab */}
          <TabsContent value="active">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="animate-spin text-indigo-600" size={32} />
              </div>
            ) : activeReports.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                <CalendarClock className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">No Active Schedules</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  Create your first scheduled report to automate delivery.
                </p>
                <Button onClick={() => setShowCreateDialog(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus size={18} className="mr-2" /> Create Schedule
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {activeReports.map((report) => {
                  const Icon = REPORT_ICONS[report.report_type] || FileText;
                  return (
                    <div 
                      key={report.id} 
                      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow"
                      data-testid={`report-card-${report.id}`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Report Info */}
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                            <Icon className="text-indigo-600 dark:text-indigo-400" size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-slate-900 dark:text-white">{report.name}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(report.status)}`}>
                                {report.status}
                              </span>
                            </div>
                            {report.description && (
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{report.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {report.frequency.charAt(0).toUpperCase() + report.frequency.slice(1)} at {report.time_of_day}
                              </span>
                              <span className="flex items-center gap-1">
                                <Mail size={14} />
                                {report.recipients.length} recipient{report.recipients.length !== 1 ? 's' : ''}
                              </span>
                              <span className="flex items-center gap-1">
                                <FileText size={14} />
                                {report.format.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Next Run & Actions */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="text-sm">
                            <p className="text-slate-500 dark:text-slate-400">Next Run</p>
                            <p className="font-medium text-slate-800 dark:text-white">{formatNextRun(report.next_run)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRunNow(report.id)}
                              disabled={actionLoading}
                              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-900/30"
                              data-testid={`run-now-btn-${report.id}`}
                            >
                              <Zap size={14} className="mr-1" /> Run Now
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRunsDialog(report)}
                              className="dark:border-slate-600 dark:hover:bg-slate-700"
                            >
                              <History size={14} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(report)}
                              className="dark:border-slate-600 dark:hover:bg-slate-700"
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(report)}
                              className="text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-900/30"
                            >
                              <Pause size={14} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteReport(report.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/30"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Paused Reports Tab */}
          <TabsContent value="paused">
            {pausedReports.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                <Pause className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">No Paused Schedules</h3>
                <p className="text-slate-500 dark:text-slate-400">
                  All your scheduled reports are currently active.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pausedReports.map((report) => {
                  const Icon = REPORT_ICONS[report.report_type] || FileText;
                  return (
                    <div 
                      key={report.id} 
                      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 opacity-75"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl">
                            <Icon className="text-slate-500 dark:text-slate-400" size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-slate-700 dark:text-slate-300">{report.name}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(report.status)}`}>
                                {report.status}
                              </span>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              {report.frequency.charAt(0).toUpperCase() + report.frequency.slice(1)} • {report.format.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(report)}
                            className="text-green-600 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/30"
                          >
                            <Play size={14} className="mr-1" /> Resume
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(report)}
                            className="dark:border-slate-600 dark:hover:bg-slate-700"
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteReport(report.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/30"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Report Types Tab */}
          <TabsContent value="types">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportTypes.map((type) => {
                const Icon = REPORT_ICONS[type.id] || FileText;
                return (
                  <div 
                    key={type.id}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                        <Icon className="text-indigo-600 dark:text-indigo-400" size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{type.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{type.description}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => handlePreview(type.id, 'last_7_days')}
                          disabled={actionLoading}
                        >
                          <Eye size={14} className="mr-1" /> Preview
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setShowEditDialog(false);
            setSelectedReport(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white">
                {showEditDialog ? 'Edit Scheduled Report' : 'Create Scheduled Report'}
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400">
                Configure automated report delivery to stakeholders
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Report Name *
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Weekly HR Summary"
                    className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    data-testid="report-name-input"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Description
                  </label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description of the report..."
                    className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    rows={2}
                  />
                </div>
              </div>

              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Report Type *
                </label>
                <Select value={form.report_type} onValueChange={(v) => setForm({ ...form, report_type: v })}>
                  <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" data-testid="report-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Schedule */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-4">
                <h4 className="font-medium text-slate-800 dark:text-white flex items-center gap-2">
                  <Clock size={16} /> Schedule
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Frequency
                    </label>
                    <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                      <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCIES.map((f) => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {form.frequency === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Day of Week
                      </label>
                      <Select value={String(form.day_of_week)} onValueChange={(v) => setForm({ ...form, day_of_week: parseInt(v) })}>
                        <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((d) => (
                            <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {form.frequency === 'monthly' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Day of Month
                      </label>
                      <Select value={String(form.day_of_month)} onValueChange={(v) => setForm({ ...form, day_of_month: parseInt(v) })}>
                        <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 28 }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Time (UTC)
                    </label>
                    <Input
                      type="time"
                      value={form.time_of_day}
                      onChange={(e) => setForm({ ...form, time_of_day: e.target.value })}
                      className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Recipients */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Recipients * (comma-separated)
                  </label>
                  <Input
                    value={form.recipients}
                    onChange={(e) => setForm({ ...form, recipients: e.target.value })}
                    placeholder="email1@example.com, email2@example.com"
                    className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    data-testid="recipients-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    CC Recipients (comma-separated)
                  </label>
                  <Input
                    value={form.cc_recipients}
                    onChange={(e) => setForm({ ...form, cc_recipients: e.target.value })}
                    placeholder="cc1@example.com, cc2@example.com"
                    className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Format & Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Format
                  </label>
                  <Select value={form.format} onValueChange={(v) => setForm({ ...form, format: v })}>
                    <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMATS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Date Range
                  </label>
                  <Select value={form.date_range} onValueChange={(v) => setForm({ ...form, date_range: v })}>
                    <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_RANGES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Include Charts */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="include_charts"
                  checked={form.include_charts}
                  onChange={(e) => setForm({ ...form, include_charts: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="include_charts" className="text-sm text-slate-700 dark:text-slate-300">
                  Include charts and visualizations in report
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setShowEditDialog(false);
                    setSelectedReport(null);
                    resetForm();
                  }}
                  className="dark:border-slate-600 dark:text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={showEditDialog ? handleUpdateReport : handleCreateReport}
                  disabled={!form.name || !form.recipients || actionLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  data-testid="save-report-btn"
                >
                  {actionLoading ? (
                    <RefreshCw size={16} className="animate-spin mr-2" />
                  ) : null}
                  {showEditDialog ? 'Update Schedule' : 'Create Schedule'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Report Runs History Dialog */}
        <Dialog open={showRunsDialog} onOpenChange={(open) => {
          if (!open) {
            setShowRunsDialog(false);
            setSelectedReport(null);
            setReportRuns([]);
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-800">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white">
                Run History: {selectedReport?.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-4">
              {reportRuns.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No runs yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reportRuns.map((run) => (
                    <div 
                      key={run.id}
                      className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {getRunStatusIcon(run.status)}
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">
                            {formatDate(run.started_at)}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {run.recipients.length} recipient{run.recipients.length !== 1 ? 's' : ''} • {run.format.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(run.status)}`}>
                          {run.status}
                        </span>
                        {run.error_message && (
                          <p className="text-xs text-red-500 mt-1 max-w-[200px] truncate" title={run.error_message}>
                            {run.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={(open) => {
          if (!open) {
            setShowPreviewDialog(false);
            setPreviewData(null);
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-800">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white">
                Report Preview: {previewData?.report_type?.replace('_', ' ').toUpperCase()}
              </DialogTitle>
            </DialogHeader>
            
            {previewData && (
              <div className="mt-4 space-y-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Date Range: {previewData.date_range?.start} to {previewData.date_range?.end}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Generated: {formatDate(previewData.generated_at)}
                  </p>
                </div>
                
                <div className="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-4">
                  <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(previewData.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ScheduledReports;
