import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, Clock, LogIn, LogOut, Calendar, Edit2, Filter, Trash2, Users, CalendarDays } from 'lucide-react';
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

  // Role-based access
  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';
  const isManager = user?.role === 'branch_manager' || isAdmin;

  useEffect(() => {
    fetchAttendance();
    fetchEmployees();
    fetchSchedules();
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
        schedule_id: assignForm.schedule_id
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
  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.full_name : '-';
  };

  const getScheduleName = (scheduleId) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    return schedule ? schedule.name : '-';
  };

  const calculateHours = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return '-';
    const [inH, inM] = clockIn.split(':').map(Number);
    const [outH, outM] = clockOut.split(':').map(Number);
    const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    if (totalMinutes < 0) return '-';
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatus = (record) => {
    if (!record.clock_in) return { label: 'Absent', color: 'bg-red-100 text-red-800' };
    if (!record.clock_out) return { label: 'Working', color: 'bg-blue-100 text-blue-800' };
    return { label: 'Complete', color: 'bg-green-100 text-green-800' };
  };

  const filteredAttendance = attendance.filter(record => {
    if (!isManager && currentEmployee) {
      if (record.employee_id !== currentEmployee.id) return false;
    }
    if (filterDate && record.date !== filterDate) return false;
    if (filterEmployee !== 'all' && record.employee_id !== filterEmployee) return false;
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div data-testid="attendance-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {t('attendance')}
        </h1>
        
        {/* Employee Clock In/Out Buttons */}
        {currentEmployee && activeTab === 'attendance' && (
          <div className="flex gap-2">
            <Button 
              onClick={handleClockIn}
              disabled={todayRecord?.clock_in}
              data-testid="clock-in-button"
              className={`rounded-full shadow-lg ${
                todayRecord?.clock_in 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <LogIn size={20} className="me-2" />
              Clock In
            </Button>
            <Button 
              onClick={handleClockOut}
              disabled={!todayRecord?.clock_in || todayRecord?.clock_out}
              data-testid="clock-out-button"
              className={`rounded-full shadow-lg ${
                !todayRecord?.clock_in || todayRecord?.clock_out
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <LogOut size={20} className="me-2" />
              Clock Out
            </Button>
          </div>
        )}
      </div>

      {/* Today's Status Card for Employee */}
      {currentEmployee && activeTab === 'attendance' && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 mb-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm">Today's Status</p>
              <h2 className="text-2xl font-bold mt-1">{currentEmployee.full_name}</h2>
              <p className="text-indigo-200 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              {currentEmployee.schedule_id && (
                <p className="text-indigo-200 mt-1 text-sm">Schedule: {getScheduleName(currentEmployee.schedule_id)}</p>
              )}
            </div>
            <div className="text-end">
              {todayRecord ? (
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-indigo-200 text-xs">Clock In</p>
                    <p className="text-xl font-bold">{todayRecord.clock_in || '--:--'}</p>
                  </div>
                  <div>
                    <p className="text-indigo-200 text-xs">Clock Out</p>
                    <p className="text-xl font-bold">{todayRecord.clock_out || '--:--'}</p>
                  </div>
                  <div>
                    <p className="text-indigo-200 text-xs">Hours</p>
                    <p className="text-xl font-bold">{calculateHours(todayRecord.clock_in, todayRecord.clock_out)}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white/20 rounded-lg px-4 py-2">
                  <Clock size={24} className="mx-auto mb-1" />
                  <p className="text-sm">Not clocked in yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Clock size={16} />
            Attendance
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="schedules" className="flex items-center gap-2">
              <CalendarDays size={16} />
              Schedules
            </TabsTrigger>
          )}
        </TabsList>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          {/* Admin Controls */}
          {isAdmin && (
            <div className="flex justify-end mb-4">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={openAddDialog}
                    data-testid="add-attendance-button"
                    className="rounded-full bg-indigo-950 text-white hover:bg-indigo-900 shadow-lg"
                  >
                    <Plus size={20} className="me-2" />
                    Add Record
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingRecord ? 'Edit' : 'Record'} Attendance</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4" data-testid="attendance-form">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Employee</label>
                      <Select 
                        value={formData.employee_id} 
                        onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
                        required
                        disabled={!!editingRecord}
                      >
                        <SelectTrigger>
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
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
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
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Clock Out</label>
                        <input
                          type="time"
                          value={formData.clock_out}
                          onChange={(e) => setFormData({ ...formData, clock_out: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="rounded-full bg-indigo-950 hover:bg-indigo-900">Save</Button>
                      <Button type="button" onClick={() => setDialogOpen(false)} variant="outline" className="rounded-full">Cancel</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Filters */}
          {isManager && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-6">
              <div className="flex items-center gap-4">
                <Filter size={20} className="text-slate-400" />
                <div className="flex gap-4 flex-1">
                  <div className="w-48">
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Filter by Date</label>
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    />
                  </div>
                  <div className="w-48">
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Filter by Employee</label>
                    <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Employees" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Employees</SelectItem>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {(filterDate || filterEmployee !== 'all') && (
                    <Button 
                      variant="outline" 
                      onClick={() => { setFilterDate(''); setFilterEmployee('all'); }}
                      className="self-end rounded-full"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Attendance Table */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="attendance-table">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {isManager && <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Employee</th>}
                    <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Date</th>
                    <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Clock In</th>
                    <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Clock Out</th>
                    <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Hours</th>
                    <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Status</th>
                    {isAdmin && <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 7 : (isManager ? 6 : 5)} className="px-6 py-12 text-center text-slate-500">
                        <Clock size={48} className="mx-auto mb-4 text-slate-300" />
                        <p>No attendance records found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((record) => {
                      const status = getStatus(record);
                      return (
                        <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          {isManager && <td className="px-6 py-4 text-slate-900 font-medium">{getEmployeeName(record.employee_id)}</td>}
                          <td className="px-6 py-4 text-slate-600">
                            <div className="flex items-center gap-2">
                              <Calendar size={16} className="text-slate-400" />
                              {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {record.clock_in ? (
                              <span className="font-mono bg-green-50 text-green-700 px-2 py-1 rounded">{record.clock_in}</span>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4">
                            {record.clock_out ? (
                              <span className="font-mono bg-red-50 text-red-700 px-2 py-1 rounded">{record.clock_out}</span>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 font-medium">{calculateHours(record.clock_in, record.clock_out)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="px-6 py-4">
                              <button
                                onClick={() => openEditDialog(record)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit2 size={16} />
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

        {/* Schedules Tab - Admin Only */}
        {isAdmin && (
          <TabsContent value="schedules">
            <div className="flex justify-end gap-3 mb-4">
              <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="rounded-full">
                    <Users size={20} className="me-2" />
                    Assign Schedule
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Schedule to Employee</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAssignSchedule} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Employee</label>
                      <Select 
                        value={assignForm.employee_id} 
                        onValueChange={(value) => setAssignForm({ ...assignForm, employee_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.full_name} {emp.schedule_id && `(Current: ${getScheduleName(emp.schedule_id)})`}
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
                        <SelectTrigger>
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
                    <div className="flex gap-2">
                      <Button type="submit" className="rounded-full bg-indigo-950 hover:bg-indigo-900">Assign</Button>
                      <Button type="button" onClick={() => setAssignDialogOpen(false)} variant="outline" className="rounded-full">Cancel</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => openScheduleDialog()}
                    className="rounded-full bg-indigo-950 text-white hover:bg-indigo-900 shadow-lg"
                  >
                    <Plus size={20} className="me-2" />
                    Add Schedule
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingSchedule ? 'Edit' : 'Create'} Schedule</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleScheduleSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Schedule Name *</label>
                      <input
                        type="text"
                        value={scheduleForm.name}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
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
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
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
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">End Time *</label>
                        <input
                          type="time"
                          value={scheduleForm.end_time}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Break Start</label>
                        <input
                          type="time"
                          value={scheduleForm.break_start}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, break_start: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Break End</label>
                        <input
                          type="time"
                          value={scheduleForm.break_end}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, break_end: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
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
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                              scheduleForm.days.includes(day)
                                ? 'bg-indigo-950 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_default"
                        checked={scheduleForm.is_default}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, is_default: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="is_default" className="text-sm text-slate-700">Set as default schedule</label>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="rounded-full bg-indigo-950 hover:bg-indigo-900">Save</Button>
                      <Button type="button" onClick={() => setScheduleDialogOpen(false)} variant="outline" className="rounded-full">Cancel</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Schedules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedules.length === 0 ? (
                <div className="col-span-full bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
                  <CalendarDays size={48} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">No schedules created yet</p>
                  <p className="text-slate-400 text-sm mt-1">Create a schedule to assign to employees</p>
                </div>
              ) : (
                schedules.map((schedule) => {
                  const assignedCount = employees.filter(e => e.schedule_id === schedule.id).length;
                  return (
                    <div key={schedule.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-slate-900">{schedule.name}</h3>
                          {schedule.description && <p className="text-sm text-slate-500 mt-1">{schedule.description}</p>}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openScheduleDialog(schedule)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock size={16} className="text-slate-400" />
                          <span>{schedule.start_time} - {schedule.end_time}</span>
                        </div>
                        {schedule.break_start && schedule.break_end && (
                          <div className="flex items-center gap-2 text-slate-500">
                            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">Break: {schedule.break_start} - {schedule.break_end}</span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {DAYS_OF_WEEK.map((day) => (
                            <span
                              key={day}
                              className={`px-2 py-0.5 rounded text-xs ${
                                schedule.days?.includes(day)
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'bg-slate-50 text-slate-300'
                              }`}
                            >
                              {day.slice(0, 2)}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          <Users size={14} className="inline me-1" />
                          {assignedCount} employee{assignedCount !== 1 ? 's' : ''} assigned
                        </span>
                        {schedule.is_default && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Default</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Employees with Schedules Table */}
            {schedules.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Employee Schedule Assignments</h3>
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-100">
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
                            <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 text-slate-900 font-medium">{emp.full_name}</td>
                              <td className="px-6 py-4">
                                {schedule ? (
                                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                    {schedule.name}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-slate-600">
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
      </Tabs>
    </div>
  );
};

export default Attendance;
