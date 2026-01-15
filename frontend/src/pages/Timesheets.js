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
  Clock,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Send,
  FileText,
  Timer,
  ChevronLeft,
  ChevronRight,
  Download,
  Settings,
  Play,
  Pause,
  Coffee,
  Briefcase,
  MapPin,
  Building2,
  TrendingUp,
  Users
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WORK_TYPES = [
  { value: 'regular', label: 'Regular', color: 'bg-blue-100 text-blue-700' },
  { value: 'overtime', label: 'Overtime', color: 'bg-orange-100 text-orange-700' },
  { value: 'remote', label: 'Remote', color: 'bg-purple-100 text-purple-700' },
  { value: 'on_site', label: 'On-Site', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'training', label: 'Training', color: 'bg-amber-100 text-amber-700' },
];

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700', icon: FileText },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: Send },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-700', icon: XCircle },
  revision_requested: { label: 'Revision Needed', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
};

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const Timesheets = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current');
  
  // Data
  const [currentTimesheet, setCurrentTimesheet] = useState(null);
  const [timesheets, setTimesheets] = useState([]);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Dialogs
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [viewTimesheetOpen, setViewTimesheetOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  
  // Selected items
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Form
  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '17:00',
    break_minutes: 60,
    work_type: 'regular',
    project_name: '',
    task_description: '',
    location: '',
    is_billable: true,
    notes: ''
  });
  
  const [settingsForm, setSettingsForm] = useState({
    standard_hours_per_day: 8,
    standard_hours_per_week: 40,
    overtime_threshold_daily: 8,
    overtime_threshold_weekly: 40,
    default_break_minutes: 60
  });

  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  // Fetch functions
  const fetchCurrentTimesheet = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/timesheets/current`);
      setCurrentTimesheet(response.data);
    } catch (error) {
      console.error('Failed to fetch current timesheet:', error);
    }
  }, []);

  const fetchTimesheets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('year', selectedYear);
      params.append('month', selectedMonth);
      const response = await axios.get(`${API}/timesheets?${params}`);
      setTimesheets(response.data);
    } catch (error) {
      console.error('Failed to fetch timesheets:', error);
    }
  }, [statusFilter, selectedYear, selectedMonth]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/timesheets/stats?year=${selectedYear}&month=${selectedMonth}`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [selectedYear, selectedMonth]);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/timesheets/settings`);
      setSettings(response.data);
      setSettingsForm({
        standard_hours_per_day: response.data.standard_hours_per_day || 8,
        standard_hours_per_week: response.data.standard_hours_per_week || 40,
        overtime_threshold_daily: response.data.overtime_threshold_daily || 8,
        overtime_threshold_weekly: response.data.overtime_threshold_weekly || 40,
        default_break_minutes: response.data.default_break_minutes || 60
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCurrentTimesheet(),
        fetchTimesheets(),
        fetchStats(),
        fetchSettings(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentTimesheet, fetchTimesheets, fetchStats, fetchSettings]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchTimesheets();
    fetchStats();
  }, [statusFilter, selectedYear, selectedMonth, fetchTimesheets, fetchStats]);

  // Handlers
  const handleSaveEntry = async (e) => {
    e.preventDefault();
    try {
      if (selectedEntry) {
        await axios.put(`${API}/time-entries/${selectedEntry.id}`, entryForm);
        toast.success('Entry updated!');
      } else {
        await axios.post(`${API}/time-entries`, entryForm);
        toast.success('Time entry added!');
      }
      fetchCurrentTimesheet();
      fetchStats();
      setEntryDialogOpen(false);
      resetEntryForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save entry');
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Delete this time entry?')) return;
    try {
      await axios.delete(`${API}/time-entries/${entryId}`);
      toast.success('Entry deleted');
      fetchCurrentTimesheet();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  const handleSubmitTimesheet = async () => {
    if (!currentTimesheet) return;
    if (!window.confirm('Submit this timesheet for approval?')) return;
    
    try {
      await axios.put(`${API}/timesheets/${currentTimesheet.id}/submit`);
      toast.success('Timesheet submitted!');
      fetchCurrentTimesheet();
      fetchTimesheets();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit');
    }
  };

  const handleApproveTimesheet = async (timesheetId) => {
    try {
      await axios.put(`${API}/timesheets/${timesheetId}/approve`);
      toast.success('Timesheet approved!');
      fetchTimesheets();
      fetchStats();
      setViewTimesheetOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to approve');
    }
  };

  const handleRejectTimesheet = async () => {
    if (!selectedTimesheet) return;
    try {
      await axios.put(`${API}/timesheets/${selectedTimesheet.id}/reject`, {
        reason: rejectionReason
      });
      toast.success('Timesheet rejected');
      fetchTimesheets();
      fetchStats();
      setRejectDialogOpen(false);
      setRejectionReason('');
    } catch (error) {
      toast.error('Failed to reject');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/timesheets/settings`, settingsForm);
      toast.success('Settings updated');
      fetchSettings();
      setSettingsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${API}/timesheets/export?year=${selectedYear}&month=${selectedMonth}`);
      const data = response.data;
      
      const headers = ['Employee', 'Period', 'Total Hours', 'Regular', 'Overtime', 'Status'];
      const rows = data.timesheets.map(t => [
        t.employee_name,
        `${t.period_start} - ${t.period_end}`,
        t.total_hours,
        t.regular_hours,
        t.overtime_hours,
        t.status
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timesheets_${selectedYear}_${selectedMonth}.csv`;
      a.click();
      
      toast.success(`Exported ${data.total} timesheets`);
    } catch (error) {
      toast.error('Failed to export');
    }
  };

  const openAddEntry = (date = null) => {
    resetEntryForm();
    if (date) {
      setEntryForm(prev => ({ ...prev, date }));
    }
    setSelectedEntry(null);
    setEntryDialogOpen(true);
  };

  const openEditEntry = (entry) => {
    setSelectedEntry(entry);
    setEntryForm({
      date: entry.date || '',
      start_time: entry.start_time || '09:00',
      end_time: entry.end_time || '17:00',
      break_minutes: entry.break_minutes || 60,
      work_type: entry.work_type || 'regular',
      project_name: entry.project_name || '',
      task_description: entry.task_description || '',
      location: entry.location || '',
      is_billable: entry.is_billable !== false,
      notes: entry.notes || ''
    });
    setEntryDialogOpen(true);
  };

  const openViewTimesheet = async (timesheet) => {
    try {
      const response = await axios.get(`${API}/timesheets/${timesheet.id}`);
      setSelectedTimesheet(response.data);
      setViewTimesheetOpen(true);
    } catch (error) {
      toast.error('Failed to load timesheet');
    }
  };

  const openReject = (timesheet) => {
    setSelectedTimesheet(timesheet);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const resetEntryForm = () => {
    setSelectedEntry(null);
    setEntryForm({
      date: new Date().toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '17:00',
      break_minutes: settings?.default_break_minutes || 60,
      work_type: 'regular',
      project_name: '',
      task_description: '',
      location: '',
      is_billable: true,
      notes: ''
    });
  };

  const calculateHours = (start, end, breakMins = 0) => {
    try {
      const startTime = new Date(`2000-01-01T${start}`);
      const endTime = new Date(`2000-01-01T${end}`);
      let diff = (endTime - startTime) / (1000 * 60 * 60);
      if (diff < 0) diff += 24;
      diff = Math.max(0, diff - breakMins / 60);
      return diff.toFixed(1);
    } catch {
      return '0';
    }
  };

  const getWeekDates = () => {
    if (!currentTimesheet) return [];
    const start = new Date(currentTimesheet.period_start);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const getEntriesForDate = (date) => {
    if (!currentTimesheet?.entries) return [];
    return currentTimesheet.entries.filter(e => e.date === date);
  };

  const getDayTotal = (date) => {
    const entries = getEntriesForDate(date);
    return entries.reduce((sum, e) => sum + (e.hours || 0), 0);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getWorkTypeConfig = (type) => {
    return WORK_TYPES.find(t => t.value === type) || WORK_TYPES[0];
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const weekDates = getWeekDates();
  const canEdit = currentTimesheet?.status === 'draft' || currentTimesheet?.status === 'revision_requested';

  return (
    <div className="p-4 lg:p-6 space-y-6" data-testid="timesheets-page">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Timesheets</h1>
          <p className="text-slate-500 mt-1">
            {isAdmin ? 'Manage employee timesheets' : 'Track your work hours'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isAdmin && (
            <>
              <Button variant="outline" onClick={() => setSettingsDialogOpen(true)}>
                <Settings size={18} className="mr-2" />
                Settings
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download size={18} className="mr-2" />
                Export
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
          <Timer className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-blue-100 text-sm">Total Hours</p>
          <p className="text-2xl font-bold">{stats?.total_hours || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white">
          <Briefcase className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-emerald-100 text-sm">Regular</p>
          <p className="text-2xl font-bold">{stats?.regular_hours || 0}h</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
          <Clock className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-orange-100 text-sm">Overtime</p>
          <p className="text-2xl font-bold">{stats?.overtime_hours || 0}h</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
          <FileText className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-purple-100 text-sm">{isAdmin ? 'Pending' : 'Timesheets'}</p>
          <p className="text-2xl font-bold">{isAdmin ? stats?.pending_approvals || 0 : stats?.total_timesheets || 0}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="current" data-testid="tab-current">
            <Calendar size={16} className="mr-1" /> Current Week
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            <FileText size={16} className="mr-1" /> {isAdmin ? 'All Timesheets' : 'History'}
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <TrendingUp size={16} className="mr-1" /> Analytics
            </TabsTrigger>
          )}
        </TabsList>

        {/* Current Week Tab */}
        <TabsContent value="current" className="mt-4 space-y-4">
          {currentTimesheet && (
            <>
              {/* Week Header */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-lg text-slate-900">
                        Week {currentTimesheet.week_number}
                      </h2>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[currentTimesheet.status]?.color || STATUS_CONFIG.draft.color}`}>
                        {STATUS_CONFIG[currentTimesheet.status]?.label || 'Draft'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {formatDate(currentTimesheet.period_start)} - {formatDate(currentTimesheet.period_end)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Total Hours</p>
                      <p className="text-2xl font-bold text-indigo-600">{currentTimesheet.total_hours || 0}h</p>
                    </div>
                    {canEdit && currentTimesheet.entries?.length > 0 && (
                      <Button onClick={handleSubmitTimesheet} data-testid="submit-timesheet-btn">
                        <Send size={16} className="mr-2" />
                        Submit
                      </Button>
                    )}
                  </div>
                </div>
                
                {currentTimesheet.status === 'revision_requested' && currentTimesheet.rejection_reason && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-amber-800">Revision Requested:</p>
                    <p className="text-sm text-amber-700">{currentTimesheet.rejection_reason}</p>
                  </div>
                )}
              </div>

              {/* Weekly Grid */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-7 border-b border-slate-200">
                  {weekDates.map((date, i) => {
                    const dayTotal = getDayTotal(date);
                    const isToday = date === new Date().toISOString().split('T')[0];
                    const isWeekend = i >= 5;
                    
                    return (
                      <div 
                        key={date} 
                        className={`p-3 text-center border-r last:border-r-0 ${isWeekend ? 'bg-slate-50' : ''} ${isToday ? 'bg-indigo-50' : ''}`}
                      >
                        <p className={`text-xs font-medium ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>
                          {DAYS_OF_WEEK[i]}
                        </p>
                        <p className={`text-sm font-semibold ${isToday ? 'text-indigo-600' : 'text-slate-900'}`}>
                          {new Date(date).getDate()}
                        </p>
                        <p className={`text-xs mt-1 ${dayTotal > 0 ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                          {dayTotal > 0 ? `${dayTotal}h` : '-'}
                        </p>
                      </div>
                    );
                  })}
                </div>
                
                <div className="grid grid-cols-7 min-h-[200px]">
                  {weekDates.map((date, i) => {
                    const entries = getEntriesForDate(date);
                    const isWeekend = i >= 5;
                    
                    return (
                      <div 
                        key={date} 
                        className={`p-2 border-r last:border-r-0 ${isWeekend ? 'bg-slate-50' : ''}`}
                      >
                        <div className="space-y-2">
                          {entries.map(entry => {
                            const typeConfig = getWorkTypeConfig(entry.work_type);
                            return (
                              <div 
                                key={entry.id}
                                className={`p-2 rounded-lg text-xs cursor-pointer hover:opacity-80 ${typeConfig.color}`}
                                onClick={() => canEdit && openEditEntry(entry)}
                              >
                                <p className="font-medium">{entry.hours}h</p>
                                <p className="truncate">{entry.project_name || entry.task_description || typeConfig.label}</p>
                                {entry.start_time && entry.end_time && (
                                  <p className="text-xs opacity-70">{entry.start_time}-{entry.end_time}</p>
                                )}
                              </div>
                            );
                          })}
                          {canEdit && (
                            <button
                              onClick={() => openAddEntry(date)}
                              className="w-full p-2 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 text-xs flex items-center justify-center gap-1"
                            >
                              <Plus size={12} /> Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Entries List */}
              {currentTimesheet.entries?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-900">Time Entries</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {currentTimesheet.entries.map(entry => {
                      const typeConfig = getWorkTypeConfig(entry.work_type);
                      return (
                        <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                          <div className="flex items-center gap-4">
                            <div className="text-center min-w-[60px]">
                              <p className="text-xs text-slate-500">{DAYS_OF_WEEK[new Date(entry.date).getDay() === 0 ? 6 : new Date(entry.date).getDay() - 1]}</p>
                              <p className="font-semibold">{new Date(entry.date).getDate()}</p>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeConfig.color}`}>
                                  {typeConfig.label}
                                </span>
                                <span className="font-semibold text-slate-900">{entry.hours}h</span>
                                {entry.start_time && entry.end_time && (
                                  <span className="text-sm text-slate-500">
                                    ({entry.start_time} - {entry.end_time})
                                  </span>
                                )}
                              </div>
                              {(entry.project_name || entry.task_description) && (
                                <p className="text-sm text-slate-600 mt-1">
                                  {entry.project_name && <span className="font-medium">{entry.project_name}</span>}
                                  {entry.project_name && entry.task_description && ' - '}
                                  {entry.task_description}
                                </p>
                              )}
                            </div>
                          </div>
                          {canEdit && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => openEditEntry(entry)}>
                                <Edit2 size={14} />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => handleDeleteEntry(entry.id)}>
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                  <SelectItem key={m} value={m.toString()}>
                    {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {timesheets.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">No Timesheets Found</p>
              <p className="text-slate-500 text-sm mt-1">No timesheets match your filters</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {isAdmin && <th className="text-left py-3 px-4 font-medium text-slate-600">Employee</th>}
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Period</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Hours</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {timesheets.map(timesheet => {
                      const statusConfig = STATUS_CONFIG[timesheet.status] || STATUS_CONFIG.draft;
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <tr 
                          key={timesheet.id} 
                          className="hover:bg-slate-50 cursor-pointer"
                          onClick={() => openViewTimesheet(timesheet)}
                        >
                          {isAdmin && (
                            <td className="py-3 px-4">
                              <p className="font-medium text-slate-900">{timesheet.employee_name}</p>
                              <p className="text-xs text-slate-500">{timesheet.department}</p>
                            </td>
                          )}
                          <td className="py-3 px-4">
                            <p className="font-medium text-slate-900">Week {timesheet.week_number}</p>
                            <p className="text-xs text-slate-500">
                              {formatDate(timesheet.period_start)} - {formatDate(timesheet.period_end)}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-900">{timesheet.total_hours}h</p>
                            <p className="text-xs text-slate-500">
                              {timesheet.regular_hours}h reg / {timesheet.overtime_hours}h OT
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              <StatusIcon size={12} />
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            {isAdmin && timesheet.status === 'submitted' && (
                              <div className="flex justify-end gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-emerald-600"
                                  onClick={() => handleApproveTimesheet(timesheet.id)}
                                >
                                  <CheckCircle2 size={16} />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-rose-600"
                                  onClick={() => openReject(timesheet)}
                                >
                                  <XCircle size={16} />
                                </Button>
                              </div>
                            )}
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

        {/* Analytics Tab (Admin) */}
        {isAdmin && (
          <TabsContent value="analytics" className="mt-4 space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* By Status */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">By Status</h3>
                {stats?.by_status && Object.entries(stats.by_status).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(stats.by_status).map(([status, data]) => {
                      const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${config.color}`}>
                              {config.label}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900">{data.count}</p>
                            <p className="text-xs text-slate-500">{data.hours}h</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No data for this period</p>
                )}
              </div>

              {/* By Department */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">By Department</h3>
                {stats?.by_department && Object.entries(stats.by_department).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(stats.by_department).slice(0, 5).map(([dept, data]) => (
                      <div key={dept} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-slate-500" />
                          <span className="text-sm text-slate-600">{dept}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">{data.hours}h</p>
                          <p className="text-xs text-slate-500">{data.count} sheets</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No data for this period</p>
                )}
              </div>

              {/* Summary */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Monthly Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Hours</span>
                    <span className="font-bold text-slate-900">{stats?.total_hours || 0}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Regular Hours</span>
                    <span className="font-semibold text-blue-600">{stats?.regular_hours || 0}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Overtime Hours</span>
                    <span className="font-semibold text-orange-600">{stats?.overtime_hours || 0}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Billable Hours</span>
                    <span className="font-semibold text-emerald-600">{stats?.billable_hours || 0}h</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Add/Edit Entry Dialog */}
      <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedEntry ? 'Edit Time Entry' : 'Add Time Entry'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEntry} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                <Input
                  type="date"
                  value={entryForm.date}
                  onChange={(e) => setEntryForm({...entryForm, date: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Work Type</label>
                <Select value={entryForm.work_type} onValueChange={(v) => setEntryForm({...entryForm, work_type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                <Input
                  type="time"
                  value={entryForm.start_time}
                  onChange={(e) => setEntryForm({...entryForm, start_time: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                <Input
                  type="time"
                  value={entryForm.end_time}
                  onChange={(e) => setEntryForm({...entryForm, end_time: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Break (min)</label>
                <Input
                  type="number"
                  value={entryForm.break_minutes}
                  onChange={(e) => setEntryForm({...entryForm, break_minutes: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-slate-600">Calculated Hours</span>
              <span className="font-bold text-indigo-600">
                {calculateHours(entryForm.start_time, entryForm.end_time, entryForm.break_minutes)} hours
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
              <Input
                value={entryForm.project_name}
                onChange={(e) => setEntryForm({...entryForm, project_name: e.target.value})}
                placeholder="Optional"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Task Description</label>
              <Textarea
                value={entryForm.task_description}
                onChange={(e) => setEntryForm({...entryForm, task_description: e.target.value})}
                placeholder="What did you work on?"
                rows={2}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_billable"
                checked={entryForm.is_billable}
                onChange={(e) => setEntryForm({...entryForm, is_billable: e.target.checked})}
                className="rounded border-slate-300"
              />
              <label htmlFor="is_billable" className="text-sm text-slate-700">Billable hours</label>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEntryDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="save-entry-btn">
                {selectedEntry ? 'Update' : 'Add'} Entry
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Timesheet Dialog */}
      <Dialog open={viewTimesheetOpen} onOpenChange={setViewTimesheetOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Timesheet Details</DialogTitle>
          </DialogHeader>
          {selectedTimesheet && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{selectedTimesheet.employee_name}</p>
                  <p className="text-sm text-slate-500">{selectedTimesheet.department}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${STATUS_CONFIG[selectedTimesheet.status]?.color}`}>
                  {STATUS_CONFIG[selectedTimesheet.status]?.label}
                </span>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Period</p>
                  <p className="font-medium">Week {selectedTimesheet.week_number}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Hours</p>
                  <p className="font-bold text-indigo-600">{selectedTimesheet.total_hours}h</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Regular</p>
                  <p className="font-medium">{selectedTimesheet.regular_hours}h</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Overtime</p>
                  <p className="font-medium">{selectedTimesheet.overtime_hours}h</p>
                </div>
              </div>
              
              {selectedTimesheet.entries?.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Time Entries</h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedTimesheet.entries.map(entry => {
                      const typeConfig = getWorkTypeConfig(entry.work_type);
                      return (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeConfig.color}`}>
                                {typeConfig.label}
                              </span>
                              <span className="font-medium">{entry.hours}h</span>
                              <span className="text-slate-500 text-sm">
                                {formatDate(entry.date)}
                              </span>
                            </div>
                            {entry.task_description && (
                              <p className="text-sm text-slate-600 mt-1">{entry.task_description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {selectedTimesheet.rejection_reason && (
                <div className="bg-rose-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-rose-700">Rejection Reason:</p>
                  <p className="text-sm text-rose-600">{selectedTimesheet.rejection_reason}</p>
                </div>
              )}
              
              {isAdmin && selectedTimesheet.status === 'submitted' && (
                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleApproveTimesheet(selectedTimesheet.id)}
                  >
                    <CheckCircle2 size={16} className="mr-2" />
                    Approve
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50"
                    onClick={() => {
                      setViewTimesheetOpen(false);
                      openReject(selectedTimesheet);
                    }}
                  >
                    <XCircle size={16} className="mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Timesheet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-600">
              Please provide a reason for rejecting this timesheet.
            </p>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-rose-600 hover:bg-rose-700"
                onClick={handleRejectTimesheet}
              >
                Reject Timesheet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog (Admin) */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Timesheet Settings</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hours/Day</label>
                <Input
                  type="number"
                  value={settingsForm.standard_hours_per_day}
                  onChange={(e) => setSettingsForm({...settingsForm, standard_hours_per_day: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hours/Week</label>
                <Input
                  type="number"
                  value={settingsForm.standard_hours_per_week}
                  onChange={(e) => setSettingsForm({...settingsForm, standard_hours_per_week: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Daily OT Threshold</label>
                <Input
                  type="number"
                  value={settingsForm.overtime_threshold_daily}
                  onChange={(e) => setSettingsForm({...settingsForm, overtime_threshold_daily: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Weekly OT Threshold</label>
                <Input
                  type="number"
                  value={settingsForm.overtime_threshold_weekly}
                  onChange={(e) => setSettingsForm({...settingsForm, overtime_threshold_weekly: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Default Break (min)</label>
              <Input
                type="number"
                value={settingsForm.default_break_minutes}
                onChange={(e) => setSettingsForm({...settingsForm, default_break_minutes: parseInt(e.target.value)})}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setSettingsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Settings
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Timesheets;
