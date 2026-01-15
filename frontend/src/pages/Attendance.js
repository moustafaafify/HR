import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Plus, Clock, LogIn, LogOut, Calendar, Edit2, Filter, Trash2, 
  Users, CalendarDays, TrendingUp, Timer, CheckCircle2, XCircle,
  Sun, Moon, Coffee, ChevronLeft, ChevronRight, BarChart3,
  Download, FileText, AlertCircle, Send, Eye, MessageSquare
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Attendance = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('attendance');
  
  // Attendance state
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [todayRecord, setTodayRecord] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [formData, setFormData] = useState({ 
    employee_id: '', 
    date: new Date().toISOString().split('T')[0],
    clock_in: '',
    clock_out: ''
  });
  const [editingRecord, setEditingRecord] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);

  // Schedule state
  const [schedules, setSchedules] = useState([]);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    description: '',
    start_time: '09:00',
    end_time: '17:00',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    break_start: '12:00',
    break_end: '13:00',
    is_default: false
  });
  const [assignForm, setAssignForm] = useState({
    employee_id: '',
    schedule_id: ''
  });

  // Time Correction state
  const [corrections, setCorrections] = useState([]);
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false);
  const [viewCorrectionDialogOpen, setViewCorrectionDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedCorrection, setSelectedCorrection] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({
    attendance_id: '',
    date: '',
    original_clock_in: '',
    original_clock_out: '',
    requested_clock_in: '',
    requested_clock_out: '',
    reason: ''
  });
  const [rejectionReason, setRejectionReason] = useState('');

  // Export state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    start_date: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    employee_id: 'all'
  });

  // Role-based access
  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';
  const isManager = user?.role === 'branch_manager' || isAdmin;

  useEffect(() => {
    fetchAttendance();
    fetchEmployees();
    fetchSchedules();
    fetchCorrections();
  }, []);

  useEffect(() => {
    if (employees.length > 0 && user) {
      const emp = employees.find(e => e.personal_email === user.email || e.work_email === user.email);
      setCurrentEmployee(emp);
      
      if (emp) {
        const today = new Date().toISOString().split('T')[0];
        const todayRec = attendance.find(a => a.employee_id === emp.id && a.date === today);
        setTodayRecord(todayRec);
      }
    }
  }, [employees, attendance, user]);

  const fetchAttendance = async () => {
    try {
      const response = await axios.get(`${API}/attendance`);
      setAttendance(response.data);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
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

  const fetchSchedules = async () => {
    try {
      const response = await axios.get(`${API}/schedules`);
      setSchedules(response.data);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    }
  };

  const fetchCorrections = async () => {
    try {
      const response = await axios.get(`${API}/time-corrections`);
      setCorrections(response.data);
    } catch (error) {
      console.error('Failed to fetch time corrections:', error);
    }
  };

  // Time Correction handlers
  const openCorrectionDialog = (record) => {
    setCorrectionForm({
      attendance_id: record.id,
      date: record.date,
      original_clock_in: record.clock_in || '',
      original_clock_out: record.clock_out || '',
      requested_clock_in: record.clock_in || '',
      requested_clock_out: record.clock_out || '',
      reason: ''
    });
    setCorrectionDialogOpen(true);
  };

  const handleSubmitCorrection = async (e) => {
    e.preventDefault();
    if (!currentEmployee) {
      toast.error('Employee profile not found');
      return;
    }
    try {
      await axios.post(`${API}/time-corrections`, {
        ...correctionForm,
        employee_id: currentEmployee.id
      });
      toast.success('Time correction request submitted');
      setCorrectionDialogOpen(false);
      setCorrectionForm({
        attendance_id: '',
        date: '',
        original_clock_in: '',
        original_clock_out: '',
        requested_clock_in: '',
        requested_clock_out: '',
        reason: ''
      });
      fetchCorrections();
    } catch (error) {
      toast.error('Failed to submit correction request');
    }
  };

  const handleApproveCorrection = async (correctionId) => {
    try {
      await axios.put(`${API}/time-corrections/${correctionId}/approve`);
      toast.success('Time correction approved');
      fetchCorrections();
      fetchAttendance();
    } catch (error) {
      toast.error('Failed to approve correction');
    }
  };

  const handleRejectCorrection = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/time-corrections/${selectedCorrection.id}/reject`, {
        rejection_reason: rejectionReason
      });
      toast.success('Time correction rejected');
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedCorrection(null);
      fetchCorrections();
    } catch (error) {
      toast.error('Failed to reject correction');
    }
  };

  // Export handlers
  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (exportFilters.start_date) params.append('start_date', exportFilters.start_date);
      if (exportFilters.end_date) params.append('end_date', exportFilters.end_date);
      if (exportFilters.employee_id !== 'all') params.append('employee_id', exportFilters.employee_id);
      
      const response = await axios.get(`${API}/attendance/export?${params.toString()}`);
      const records = response.data.records;
      
      if (records.length === 0) {
        toast.error('No records found for the selected filters');
        return;
      }
      
      // Convert to CSV
      const headers = ['Date', 'Employee', 'Clock In', 'Clock Out', 'Status'];
      const csvContent = [
        headers.join(','),
        ...records.map(r => [
          r.date,
          `"${r.employee_name || 'Unknown'}"`,
          r.clock_in || '-',
          r.clock_out || '-',
          r.status || 'present'
        ].join(','))
      ].join('\n');
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `attendance_report_${exportFilters.start_date}_to_${exportFilters.end_date}.csv`;
      link.click();
      
      toast.success(`Exported ${records.length} records`);
      setExportDialogOpen(false);
    } catch (error) {
      toast.error('Failed to export attendance');
    }
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.full_name : '-';
  };

  // Get week dates
  const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1) + (weekOffset * 7));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Attendance handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRecord) {
        await axios.put(`${API}/attendance/${editingRecord.id}`, formData);
        toast.success('Attendance updated successfully');
      } else {
        await axios.post(`${API}/attendance`, formData);
        toast.success('Attendance recorded successfully');
      }
      setDialogOpen(false);
      setEditingRecord(null);
      setFormData({ employee_id: '', date: new Date().toISOString().split('T')[0], clock_in: '', clock_out: '' });
      fetchAttendance();
    } catch (error) {
      toast.error('Failed to save attendance');
    }
  };

  const handleClockIn = async () => {
    if (!currentEmployee) {
      toast.error('Employee profile not found');
      return;
    }
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    try {
      if (todayRecord) {
        await axios.put(`${API}/attendance/${todayRecord.id}`, { clock_in: currentTime });
      } else {
        await axios.post(`${API}/attendance`, {
          employee_id: currentEmployee.id,
          date: today,
          clock_in: currentTime,
          clock_out: ''
        });
      }
      toast.success(`Clocked in at ${currentTime}`);
      fetchAttendance();
    } catch (error) {
      toast.error('Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    if (!currentEmployee || !todayRecord) {
      toast.error('No clock-in record found for today');
      return;
    }
    
    const currentTime = new Date().toTimeString().slice(0, 5);
    
    try {
      await axios.put(`${API}/attendance/${todayRecord.id}`, { clock_out: currentTime });
      toast.success(`Clocked out at ${currentTime}`);
      fetchAttendance();
    } catch (error) {
      toast.error('Failed to clock out');
    }
  };

  const openEditDialog = (record) => {
    setEditingRecord(record);
    setFormData({
      employee_id: record.employee_id,
      date: record.date,
      clock_in: record.clock_in || '',
      clock_out: record.clock_out || ''
    });
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingRecord(null);
    setFormData({ employee_id: '', date: new Date().toISOString().split('T')[0], clock_in: '', clock_out: '' });
    setDialogOpen(true);
  };

  // Schedule handlers
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        await axios.put(`${API}/schedules/${editingSchedule.id}`, scheduleForm);
        toast.success('Schedule updated successfully');
      } else {
        await axios.post(`${API}/schedules`, scheduleForm);
        toast.success('Schedule created successfully');
      }
      setScheduleDialogOpen(false);
      setEditingSchedule(null);
      resetScheduleForm();
      fetchSchedules();
    } catch (error) {
      toast.error('Failed to save schedule');
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;
    try {
      await axios.delete(`${API}/schedules/${id}`);
      toast.success('Schedule deleted');
      fetchSchedules();
    } catch (error) {
      toast.error('Failed to delete schedule');
    }
  };

  const handleAssignSchedule = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/employees/${assignForm.employee_id}/assign-schedule`, {
        schedule_id: assignForm.schedule_id === 'none' ? null : assignForm.schedule_id
      });
      toast.success('Schedule assigned successfully');
      setAssignDialogOpen(false);
      setAssignForm({ employee_id: '', schedule_id: '' });
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to assign schedule');
    }
  };

  const openScheduleDialog = (schedule = null) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setScheduleForm({
        name: schedule.name,
        description: schedule.description || '',
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        days: schedule.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        break_start: schedule.break_start || '',
        break_end: schedule.break_end || '',
        is_default: schedule.is_default || false
      });
    } else {
      setEditingSchedule(null);
      resetScheduleForm();
    }
    setScheduleDialogOpen(true);
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      name: '',
      description: '',
      start_time: '09:00',
      end_time: '17:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      break_start: '12:00',
      break_end: '13:00',
      is_default: false
    });
  };

  const toggleDay = (day) => {
    if (scheduleForm.days.includes(day)) {
      setScheduleForm({ ...scheduleForm, days: scheduleForm.days.filter(d => d !== day) });
    } else {
      setScheduleForm({ ...scheduleForm, days: [...scheduleForm.days, day] });
    }
  };

  // Helper functions
  const getScheduleName = (scheduleId) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    return schedule ? schedule.name : '-';
  };

  const calculateHours = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return null;
    const [inH, inM] = clockIn.split(':').map(Number);
    const [outH, outM] = clockOut.split(':').map(Number);
    const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    if (totalMinutes < 0) return null;
    return totalMinutes / 60;
  };

  const formatHours = (hours) => {
    if (hours === null) return '-';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getStatus = (record) => {
    if (!record.clock_in) return { label: 'Absent', color: 'bg-red-100 text-red-700', icon: XCircle };
    if (!record.clock_out) return { label: 'Working', color: 'bg-amber-100 text-amber-700', icon: Timer };
    return { label: 'Complete', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 };
  };

  const filteredAttendance = attendance.filter(record => {
    if (!isManager && currentEmployee) {
      if (record.employee_id !== currentEmployee.id) return false;
    }
    if (filterDate && record.date !== filterDate) return false;
    if (filterEmployee !== 'all' && record.employee_id !== filterEmployee) return false;
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  // Stats calculations
  const getStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);
    
    const relevantRecords = isManager ? attendance : attendance.filter(a => a.employee_id === currentEmployee?.id);
    const todayRecords = relevantRecords.filter(a => a.date === today);
    const monthRecords = relevantRecords.filter(a => a.date?.startsWith(thisMonth));
    
    const presentToday = todayRecords.filter(a => a.clock_in).length;
    const workingNow = todayRecords.filter(a => a.clock_in && !a.clock_out).length;
    const totalHoursMonth = monthRecords.reduce((sum, r) => {
      const hours = calculateHours(r.clock_in, r.clock_out);
      return sum + (hours || 0);
    }, 0);
    const avgHours = monthRecords.length > 0 ? totalHoursMonth / monthRecords.filter(r => r.clock_out).length : 0;

    return { presentToday, workingNow, totalHoursMonth, avgHours, monthRecords: monthRecords.length };
  };

  const stats = getStats();

  // Get attendance for a specific date
  const getAttendanceForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    if (currentEmployee) {
      return attendance.find(a => a.employee_id === currentEmployee.id && a.date === dateStr);
    }
    return null;
  };

  const weekDates = getWeekDates();
  const today = new Date().toISOString().split('T')[0];

  return (
    <div data-testid="attendance-page" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {t('attendance')}
          </h1>
          <p className="text-slate-500 mt-1">Track and manage work hours</p>
        </div>
        
        {/* Clock In/Out Buttons */}
        {currentEmployee && activeTab === 'attendance' && (
          <div className="flex gap-3">
            <Button 
              onClick={handleClockIn}
              disabled={todayRecord?.clock_in}
              data-testid="clock-in-button"
              size="lg"
              className={`rounded-2xl shadow-lg px-6 transition-all duration-300 ${
                todayRecord?.clock_in 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white hover:shadow-xl hover:scale-105'
              }`}
            >
              <LogIn size={22} className="me-2" />
              Clock In
            </Button>
            <Button 
              onClick={handleClockOut}
              disabled={!todayRecord?.clock_in || todayRecord?.clock_out}
              data-testid="clock-out-button"
              size="lg"
              className={`rounded-2xl shadow-lg px-6 transition-all duration-300 ${
                !todayRecord?.clock_in || todayRecord?.clock_out
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white hover:shadow-xl hover:scale-105'
              }`}
            >
              <LogOut size={22} className="me-2" />
              Clock Out
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">
                {isManager ? 'Present Today' : 'Days This Month'}
              </p>
              <p className="text-3xl font-black mt-1">
                {isManager ? stats.presentToday : stats.monthRecords}
              </p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">
                {isManager ? 'Working Now' : 'Hours Today'}
              </p>
              <p className="text-3xl font-black mt-1">
                {isManager ? stats.workingNow : (todayRecord ? formatHours(calculateHours(todayRecord.clock_in, todayRecord.clock_out)) : '0h')}
              </p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <Timer size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Total Hours (Month)</p>
              <p className="text-3xl font-black mt-1">{Math.round(stats.totalHoursMonth)}h</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Avg Hours/Day</p>
              <p className="text-3xl font-black mt-1">{stats.avgHours ? stats.avgHours.toFixed(1) : '0'}h</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <BarChart3 size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Today's Status Card - Employee View */}
      {currentEmployee && activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm flex items-center gap-2">
                  <Sun size={16} />
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <h2 className="text-2xl font-bold mt-2">{currentEmployee.full_name}</h2>
                {currentEmployee.schedule_id && (
                  <p className="text-slate-400 mt-1 text-sm flex items-center gap-2">
                    <Calendar size={14} />
                    Schedule: {getScheduleName(currentEmployee.schedule_id)}
                  </p>
                )}
              </div>
              
              {todayRecord ? (
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="bg-emerald-500/20 rounded-xl px-4 py-3 mb-1">
                      <LogIn size={20} className="mx-auto text-emerald-400" />
                    </div>
                    <p className="text-slate-400 text-xs">Clock In</p>
                    <p className="text-xl font-bold font-mono">{todayRecord.clock_in || '--:--'}</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-rose-500/20 rounded-xl px-4 py-3 mb-1">
                      <LogOut size={20} className="mx-auto text-rose-400" />
                    </div>
                    <p className="text-slate-400 text-xs">Clock Out</p>
                    <p className="text-xl font-bold font-mono">{todayRecord.clock_out || '--:--'}</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-blue-500/20 rounded-xl px-4 py-3 mb-1">
                      <Clock size={20} className="mx-auto text-blue-400" />
                    </div>
                    <p className="text-slate-400 text-xs">Duration</p>
                    <p className="text-xl font-bold">{formatHours(calculateHours(todayRecord.clock_in, todayRecord.clock_out))}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-700/50 rounded-2xl px-8 py-6 text-center">
                  <Moon size={32} className="mx-auto mb-2 text-slate-500" />
                  <p className="text-slate-400">Not clocked in yet</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Weekly View */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Weekly Overview</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setWeekOffset(weekOffset - 1)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-sm text-slate-600 min-w-[140px] text-center">
                  {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <button 
                  onClick={() => setWeekOffset(weekOffset + 1)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  disabled={weekOffset >= 0}
                >
                  <ChevronRight size={20} className={weekOffset >= 0 ? 'text-slate-300' : ''} />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {weekDates.map((date, idx) => {
                const record = getAttendanceForDate(date);
                const isToday = date.toISOString().split('T')[0] === today;
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = date.getDate();
                const hours = record ? calculateHours(record.clock_in, record.clock_out) : null;
                
                return (
                  <div 
                    key={idx}
                    className={`rounded-xl p-3 text-center transition-all ${
                      isToday 
                        ? 'bg-indigo-950 text-white ring-2 ring-indigo-400 ring-offset-2' 
                        : record?.clock_in 
                          ? 'bg-emerald-50 border border-emerald-200' 
                          : 'bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <p className={`text-xs font-medium ${isToday ? 'text-indigo-200' : 'text-slate-500'}`}>{dayName}</p>
                    <p className={`text-lg font-bold ${isToday ? 'text-white' : 'text-slate-900'}`}>{dayNum}</p>
                    {record?.clock_in ? (
                      <div className={`mt-2 text-xs ${isToday ? 'text-indigo-200' : 'text-emerald-600'}`}>
                        <p className="font-mono">{record.clock_in}</p>
                        {record.clock_out && (
                          <>
                            <p className="font-mono">{record.clock_out}</p>
                            <p className="font-bold mt-1">{formatHours(hours)}</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <p className={`mt-2 text-xs ${isToday ? 'text-indigo-300' : 'text-slate-400'}`}>-</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="attendance" className="rounded-lg flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Clock size={16} />
            Attendance Records
          </TabsTrigger>
          <TabsTrigger value="corrections" className="rounded-lg flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <AlertCircle size={16} />
            Time Corrections
            {corrections.filter(c => c.status === 'pending').length > 0 && (
              <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                {corrections.filter(c => c.status === 'pending').length}
              </span>
            )}
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="schedules" className="rounded-lg flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <CalendarDays size={16} />
              Schedules
            </TabsTrigger>
          )}
        </TabsList>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="mt-6">
          {/* Admin Controls */}
          <div className="flex items-center justify-between mb-4">
            {isManager && (
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-4 py-2">
                  <Filter size={18} className="text-slate-400" />
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="border-0 outline-none text-sm bg-transparent"
                    placeholder="Filter date"
                  />
                </div>
                <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                  <SelectTrigger className="w-48 rounded-xl">
                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(filterDate || filterEmployee !== 'all') && (
                  <Button 
                    variant="ghost" 
                    onClick={() => { setFilterDate(''); setFilterEmployee('all'); }}
                    className="text-slate-500"
                  >
                    Clear
                  </Button>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-2">
              {/* Export Button */}
              {isManager && (
                <Button 
                  onClick={() => setExportDialogOpen(true)}
                  variant="outline"
                  className="rounded-xl"
                >
                  <Download size={18} className="mr-2" />
                  Export
                </Button>
              )}
              
              {isAdmin && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={openAddDialog}
                      data-testid="add-attendance-button"
                      className="rounded-xl bg-indigo-950 text-white hover:bg-indigo-900 shadow-lg"
                    >
                      <Plus size={20} className="me-2" />
                      Add Record
                    </Button>
                  </DialogTrigger>
                <DialogContent className="rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl">{editingRecord ? 'Edit' : 'Record'} Attendance</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 mt-4" data-testid="attendance-form">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Employee</label>
                      <Select 
                        value={formData.employee_id} 
                        onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
                        required
                        disabled={!!editingRecord}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select Employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Date</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                        required
                        disabled={!!editingRecord}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Clock In</label>
                        <input
                          type="time"
                          value={formData.clock_in}
                          onChange={(e) => setFormData({ ...formData, clock_in: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Clock Out</label>
                        <input
                          type="time"
                          value={formData.clock_out}
                          onChange={(e) => setFormData({ ...formData, clock_out: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" className="rounded-xl bg-indigo-950 hover:bg-indigo-900 flex-1">Save</Button>
                      <Button type="button" onClick={() => setDialogOpen(false)} variant="outline" className="rounded-xl">Cancel</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="attendance-table">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {isManager && <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Employee</th>}
                    <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Date</th>
                    <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Clock In</th>
                    <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Clock Out</th>
                    <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Duration</th>
                    <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Status</th>
                    {(isAdmin || (!isManager && currentEmployee)) && <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 7 : (isManager ? 6 : (!isManager && currentEmployee ? 7 : 6))} className="px-6 py-16 text-center">
                        <div className="bg-slate-50 rounded-2xl p-8 max-w-sm mx-auto">
                          <Clock size={48} className="mx-auto mb-4 text-slate-300" />
                          <p className="text-slate-500 font-medium">No attendance records found</p>
                          <p className="text-slate-400 text-sm mt-1">Records will appear here once logged</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((record) => {
                      const status = getStatus(record);
                      const StatusIcon = status.icon;
                      const hours = calculateHours(record.clock_in, record.clock_out);
                      return (
                        <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                          {isManager && <td className="px-6 py-4 text-slate-900 font-medium">{getEmployeeName(record.employee_id)}</td>}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="bg-slate-100 rounded-lg p-2">
                                <Calendar size={16} className="text-slate-500" />
                              </div>
                              <div>
                                <p className="text-slate-900 font-medium">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {record.clock_in ? (
                              <span className="font-mono text-sm bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-medium">{record.clock_in}</span>
                            ) : <span className="text-slate-300">-</span>}
                          </td>
                          <td className="px-6 py-4">
                            {record.clock_out ? (
                              <span className="font-mono text-sm bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg font-medium">{record.clock_out}</span>
                            ) : <span className="text-slate-300">-</span>}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-900">{formatHours(hours)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${status.color}`}>
                              <StatusIcon size={14} />
                              {status.label}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="px-6 py-4">
                              <button
                                onClick={() => openEditDialog(record)}
                                className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                              >
                                <Edit2 size={18} />
                              </button>
                            </td>
                          )}
                          {!isManager && currentEmployee && record.employee_id === currentEmployee.id && (
                            <td className="px-6 py-4">
                              <button
                                onClick={() => openCorrectionDialog(record)}
                                className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-all flex items-center gap-1"
                              >
                                <AlertCircle size={14} />
                                Request Correction
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Schedules Tab */}
        {isAdmin && (
          <TabsContent value="schedules" className="mt-6">
            <div className="flex justify-end gap-3 mb-6">
              <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="rounded-xl">
                    <Users size={20} className="me-2" />
                    Assign Schedule
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Assign Schedule to Employee</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAssignSchedule} className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Employee</label>
                      <Select 
                        value={assignForm.employee_id} 
                        onValueChange={(value) => setAssignForm({ ...assignForm, employee_id: value })}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select Employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.full_name} {emp.schedule_id && `(${getScheduleName(emp.schedule_id)})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Schedule</label>
                      <Select 
                        value={assignForm.schedule_id} 
                        onValueChange={(value) => setAssignForm({ ...assignForm, schedule_id: value })}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select Schedule" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Schedule</SelectItem>
                          {schedules.map((schedule) => (
                            <SelectItem key={schedule.id} value={schedule.id}>
                              {schedule.name} ({schedule.start_time} - {schedule.end_time})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" className="rounded-xl bg-indigo-950 hover:bg-indigo-900 flex-1">Assign</Button>
                      <Button type="button" onClick={() => setAssignDialogOpen(false)} variant="outline" className="rounded-xl">Cancel</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => openScheduleDialog()}
                    className="rounded-xl bg-indigo-950 text-white hover:bg-indigo-900 shadow-lg"
                  >
                    <Plus size={20} className="me-2" />
                    Create Schedule
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl">{editingSchedule ? 'Edit' : 'Create'} Schedule</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleScheduleSubmit} className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Schedule Name *</label>
                      <input
                        type="text"
                        value={scheduleForm.name}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                        placeholder="e.g., Regular Office Hours"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
                      <input
                        type="text"
                        value={scheduleForm.description}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                        placeholder="Optional description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Start Time *</label>
                        <input
                          type="time"
                          value={scheduleForm.start_time}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">End Time *</label>
                        <input
                          type="time"
                          value={scheduleForm.end_time}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-2">
                          <Coffee size={14} />
                          Break Start
                        </label>
                        <input
                          type="time"
                          value={scheduleForm.break_start}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, break_start: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Break End</label>
                        <input
                          type="time"
                          value={scheduleForm.break_end}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, break_end: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">Working Days *</label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                              scheduleForm.days.includes(day)
                                ? 'bg-indigo-950 text-white shadow-md'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                      <input
                        type="checkbox"
                        id="is_default"
                        checked={scheduleForm.is_default}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, is_default: e.target.checked })}
                        className="rounded-md w-5 h-5"
                      />
                      <label htmlFor="is_default" className="text-sm text-slate-700">Set as default schedule for new employees</label>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" className="rounded-xl bg-indigo-950 hover:bg-indigo-900 flex-1">Save Schedule</Button>
                      <Button type="button" onClick={() => setScheduleDialogOpen(false)} variant="outline" className="rounded-xl">Cancel</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Schedules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {schedules.length === 0 ? (
                <div className="col-span-full bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
                  <div className="bg-slate-50 rounded-2xl p-8 max-w-sm mx-auto">
                    <CalendarDays size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-600 font-medium">No schedules created yet</p>
                    <p className="text-slate-400 text-sm mt-1">Create a schedule to assign to employees</p>
                  </div>
                </div>
              ) : (
                schedules.map((schedule) => {
                  const assignedCount = employees.filter(e => e.schedule_id === schedule.id).length;
                  return (
                    <div key={schedule.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-lg">{schedule.name}</h3>
                            {schedule.description && <p className="text-indigo-100 text-sm mt-1">{schedule.description}</p>}
                          </div>
                          {schedule.is_default && (
                            <span className="bg-white/20 text-xs px-2 py-1 rounded-full">Default</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-100 rounded-lg p-2">
                            <Clock size={18} className="text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Working Hours</p>
                            <p className="font-bold text-slate-900">{schedule.start_time} - {schedule.end_time}</p>
                          </div>
                        </div>
                        
                        {schedule.break_start && schedule.break_end && (
                          <div className="flex items-center gap-3">
                            <div className="bg-amber-100 rounded-lg p-2">
                              <Coffee size={18} className="text-amber-600" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Break Time</p>
                              <p className="font-medium text-slate-700">{schedule.break_start} - {schedule.break_end}</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-1.5">
                          {DAYS_OF_WEEK.map((day) => (
                            <span
                              key={day}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                                schedule.days?.includes(day)
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'bg-slate-100 text-slate-300'
                              }`}
                            >
                              {day.slice(0, 3)}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <span className="text-sm text-slate-600 flex items-center gap-1.5">
                          <Users size={16} className="text-slate-400" />
                          <span className="font-medium">{assignedCount}</span> assigned
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openScheduleDialog(schedule)}
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Employee Assignments Table */}
            {schedules.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Employee Schedule Assignments</h3>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Employee</th>
                          <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Assigned Schedule</th>
                          <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Working Hours</th>
                          <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Working Days</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map((emp) => {
                          const schedule = schedules.find(s => s.id === emp.schedule_id);
                          return (
                            <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                    {emp.full_name?.charAt(0)}
                                  </div>
                                  <span className="font-medium text-slate-900">{emp.full_name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {schedule ? (
                                  <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-100 text-indigo-800">
                                    {schedule.name}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Not assigned</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-slate-600 font-mono">
                                {schedule ? `${schedule.start_time} - ${schedule.end_time}` : '-'}
                              </td>
                              <td className="px-6 py-4">
                                {schedule ? (
                                  <span className="text-slate-600 text-sm">
                                    {schedule.days?.map(d => d.slice(0, 3)).join(', ')}
                                  </span>
                                ) : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        )}

        {/* Time Corrections Tab */}
        <TabsContent value="corrections" className="mt-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Time Correction Requests</h2>
              {!isManager && currentEmployee && (
                <p className="text-sm text-slate-500">Submit requests to correct your attendance records</p>
              )}
            </div>
            
            {/* My Correction Requests (Employee View) */}
            {!isManager && currentEmployee && (
              <div className="divide-y divide-slate-100">
                {corrections.filter(c => c.employee_id === currentEmployee.id).length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <AlertCircle size={40} className="mx-auto mb-3 text-slate-300" />
                    <p>No correction requests</p>
                    <p className="text-sm mt-1">Click "Request Correction" on any attendance record to submit a request</p>
                  </div>
                ) : (
                  corrections.filter(c => c.employee_id === currentEmployee.id).map(correction => (
                    <div key={correction.id} className="p-4 hover:bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{correction.date}</p>
                          <p className="text-sm text-slate-500">
                            {correction.original_clock_in} - {correction.original_clock_out} → {correction.requested_clock_in} - {correction.requested_clock_out}
                          </p>
                          <p className="text-sm text-slate-400 mt-1">{correction.reason}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          correction.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          correction.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {correction.status.charAt(0).toUpperCase() + correction.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* All Correction Requests (Manager/Admin View) */}
            {isManager && (
              <div className="divide-y divide-slate-100">
                {corrections.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <AlertCircle size={40} className="mx-auto mb-3 text-slate-300" />
                    <p>No correction requests</p>
                  </div>
                ) : (
                  corrections.map(correction => (
                    <div key={correction.id} className="p-4 hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        {/* Employee Info */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {getEmployeeName(correction.employee_id)?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900">{getEmployeeName(correction.employee_id)}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              correction.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                              correction.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {correction.status.charAt(0).toUpperCase() + correction.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500">{correction.date}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm">
                            <span className="text-slate-400">Original: {correction.original_clock_in || '-'} - {correction.original_clock_out || '-'}</span>
                            <span className="text-indigo-600">→ Requested: {correction.requested_clock_in || '-'} - {correction.requested_clock_out || '-'}</span>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">Reason: {correction.reason}</p>
                        </div>
                        
                        {/* Actions */}
                        {correction.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm"
                              onClick={() => handleApproveCorrection(correction.id)}
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CheckCircle2 size={16} className="mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => { setSelectedCorrection(correction); setRejectDialogOpen(true); }}
                              className="rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <XCircle size={16} className="mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                        
                        {correction.status !== 'pending' && (
                          <Button 
                            size="sm"
                            variant="ghost"
                            onClick={() => { setSelectedCorrection(correction); setViewCorrectionDialogOpen(true); }}
                            className="rounded-lg"
                          >
                            <Eye size={16} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Export Attendance Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Start Date</label>
                <input
                  type="date"
                  value={exportFilters.start_date}
                  onChange={(e) => setExportFilters({ ...exportFilters, start_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">End Date</label>
                <input
                  type="date"
                  value={exportFilters.end_date}
                  onChange={(e) => setExportFilters({ ...exportFilters, end_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Employee</label>
              <Select value={exportFilters.employee_id} onValueChange={(value) => setExportFilters({ ...exportFilters, employee_id: value })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleExportCSV} className="rounded-xl bg-indigo-950 hover:bg-indigo-900 flex-1">
                <Download size={18} className="mr-2" />
                Download CSV
              </Button>
              <Button type="button" onClick={() => setExportDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Time Correction Request Dialog */}
      <Dialog open={correctionDialogOpen} onOpenChange={setCorrectionDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Request Time Correction</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitCorrection} className="space-y-4 mt-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-500 mb-1">Date</p>
              <p className="font-medium text-slate-900">{correctionForm.date}</p>
              <p className="text-sm text-slate-500 mt-2 mb-1">Original Time</p>
              <p className="font-medium text-slate-900">{correctionForm.original_clock_in || '-'} - {correctionForm.original_clock_out || '-'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Corrected Clock In</label>
                <input
                  type="time"
                  value={correctionForm.requested_clock_in}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, requested_clock_in: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Corrected Clock Out</label>
                <input
                  type="time"
                  value={correctionForm.requested_clock_out}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, requested_clock_out: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Reason for Correction</label>
              <textarea
                value={correctionForm.reason}
                onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                placeholder="Please explain why you need this correction..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                rows={3}
                required
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="rounded-xl bg-indigo-950 hover:bg-indigo-900 flex-1">
                <Send size={18} className="mr-2" />
                Submit Request
              </Button>
              <Button type="button" onClick={() => setCorrectionDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Correction Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Reject Time Correction</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRejectCorrection} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Reason for Rejection</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                rows={3}
                required
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="rounded-xl bg-red-600 hover:bg-red-700 flex-1">
                Reject
              </Button>
              <Button type="button" onClick={() => setRejectDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Correction Details Dialog */}
      <Dialog open={viewCorrectionDialogOpen} onOpenChange={setViewCorrectionDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Correction Details</DialogTitle>
          </DialogHeader>
          {selectedCorrection && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {getEmployeeName(selectedCorrection.employee_id)?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{getEmployeeName(selectedCorrection.employee_id)}</p>
                  <p className="text-sm text-slate-500">{selectedCorrection.date}</p>
                </div>
                <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${
                  selectedCorrection.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                  selectedCorrection.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {selectedCorrection.status.charAt(0).toUpperCase() + selectedCorrection.status.slice(1)}
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-sm text-slate-500">Original Time</p>
                  <p className="font-medium">{selectedCorrection.original_clock_in || '-'} - {selectedCorrection.original_clock_out || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Requested Time</p>
                  <p className="font-medium text-indigo-600">{selectedCorrection.requested_clock_in || '-'} - {selectedCorrection.requested_clock_out || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Reason</p>
                  <p className="font-medium">{selectedCorrection.reason}</p>
                </div>
                {selectedCorrection.rejection_reason && (
                  <div>
                    <p className="text-sm text-slate-500">Rejection Reason</p>
                    <p className="font-medium text-red-600">{selectedCorrection.rejection_reason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Attendance;
