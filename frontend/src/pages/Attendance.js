import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, Clock, LogIn, LogOut, Calendar, Edit2, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Attendance = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
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

  // Role-based access
  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';
  const isManager = user?.role === 'branch_manager' || isAdmin;

  useEffect(() => {
    fetchAttendance();
    fetchEmployees();
  }, []);

  useEffect(() => {
    // Find current employee record for self clock-in/out
    if (employees.length > 0 && user) {
      const emp = employees.find(e => e.personal_email === user.email || e.work_email === user.email);
      setCurrentEmployee(emp);
      
      // Find today's record for this employee
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
        // Update existing record
        await axios.put(`${API}/attendance/${todayRecord.id}`, {
          clock_in: currentTime
        });
      } else {
        // Create new record
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
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    try {
      await axios.put(`${API}/attendance/${todayRecord.id}`, {
        clock_out: currentTime
      });
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
    setFormData({ 
      employee_id: '', 
      date: new Date().toISOString().split('T')[0], 
      clock_in: '', 
      clock_out: '' 
    });
    setDialogOpen(true);
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.full_name : '-';
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

  // Filter attendance records
  const filteredAttendance = attendance.filter(record => {
    // For employees, only show their own records
    if (!isManager && currentEmployee) {
      if (record.employee_id !== currentEmployee.id) return false;
    }
    
    // Apply date filter
    if (filterDate && record.date !== filterDate) return false;
    
    // Apply employee filter (admin only)
    if (filterEmployee !== 'all' && record.employee_id !== filterEmployee) return false;
    
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div data-testid="attendance-page">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {t('attendance')}
        </h1>
        
        <div className="flex gap-3">
          {/* Employee Clock In/Out Buttons */}
          {currentEmployee && (
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
          
          {/* Admin Add Button */}
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={openAddDialog}
                  data-testid="add-attendance-button"
                  className="rounded-full bg-indigo-950 text-white hover:bg-indigo-900 shadow-lg hover:shadow-xl"
                >
                  <Plus size={20} className="me-2" />
                  {t('addNew')}
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
                      <SelectTrigger data-testid="attendance-employee-select">
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
                      data-testid="attendance-date-input"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      required
                      disabled={!!editingRecord}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Clock In</label>
                      <input
                        type="time"
                        data-testid="attendance-clockin-input"
                        value={formData.clock_in}
                        onChange={(e) => setFormData({ ...formData, clock_in: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Clock Out</label>
                      <input
                        type="time"
                        data-testid="attendance-clockout-input"
                        value={formData.clock_out}
                        onChange={(e) => setFormData({ ...formData, clock_out: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" data-testid="attendance-submit-button" className="rounded-full bg-indigo-950 hover:bg-indigo-900">
                      {t('save')}
                    </Button>
                    <Button type="button" onClick={() => setDialogOpen(false)} variant="outline" className="rounded-full">
                      {t('cancel')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Today's Status Card for Employee */}
      {currentEmployee && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 mb-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm">Today's Status</p>
              <h2 className="text-2xl font-bold mt-1">{currentEmployee.full_name}</h2>
              <p className="text-indigo-200 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="text-end">
              {todayRecord ? (
                <>
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
                </>
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

      {/* Filters - Admin Only */}
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
                  Clear Filters
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
                    <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors" data-testid={`attendance-row-${record.id}`}>
                      {isManager && <td className="px-6 py-4 text-slate-900 font-medium">{getEmployeeName(record.employee_id)}</td>}
                      <td className="px-6 py-4 text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-slate-400" />
                          {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {record.clock_in ? (
                          <span className="font-mono bg-green-50 text-green-700 px-2 py-1 rounded">{record.clock_in}</span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {record.clock_out ? (
                          <span className="font-mono bg-red-50 text-red-700 px-2 py-1 rounded">{record.clock_out}</span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {calculateHours(record.clock_in, record.clock_out)}
                      </td>
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
                            title="Edit"
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
    </div>
  );
};

export default Attendance;
