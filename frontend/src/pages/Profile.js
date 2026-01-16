import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  Award,
  Shield,
  Heart,
  FileText,
  Edit2,
  Camera,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  GraduationCap,
  Target,
  Wallet,
  Star,
  Globe,
  Linkedin,
  Github,
  Twitter,
  UserCircle,
  BadgeCheck,
  CalendarDays,
  Timer,
  Receipt,
  Plane,
  Activity,
  Lock,
  Bell,
  Eye,
  EyeOff,
  Save,
  RefreshCw
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Data
  const [employee, setEmployee] = useState(null);
  const [department, setDepartment] = useState(null);
  const [manager, setManager] = useState(null);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [skills, setSkills] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [stats, setStats] = useState({});

  // Dialogs
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [editEmergencyOpen, setEditEmergencyOpen] = useState(false);

  // Forms
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    personal_email: '',
    date_of_birth: '',
    gender: '',
    marital_status: '',
    nationality: '',
    bio: '',
    linkedin_url: '',
    twitter_url: '',
    github_url: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [contactForm, setContactForm] = useState({
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: ''
  });

  const [emergencyForm, setEmergencyForm] = useState({
    emergency_contact_name: '',
    emergency_contact_relationship: '',
    emergency_contact_phone: '',
    emergency_contact_email: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Fetch functions
  const fetchEmployeeData = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/employees/me`);
      setEmployee(response.data);

      // Set form data
      setProfileForm({
        first_name: response.data.first_name || '',
        last_name: response.data.last_name || '',
        phone: response.data.phone || '',
        personal_email: response.data.personal_email || '',
        date_of_birth: response.data.date_of_birth || '',
        gender: response.data.gender || '',
        marital_status: response.data.marital_status || '',
        nationality: response.data.nationality || '',
        bio: response.data.bio || '',
        linkedin_url: response.data.linkedin_url || '',
        twitter_url: response.data.twitter_url || '',
        github_url: response.data.github_url || ''
      });

      setContactForm({
        address_line1: response.data.address_line1 || '',
        address_line2: response.data.address_line2 || '',
        city: response.data.city || '',
        state: response.data.state || '',
        postal_code: response.data.postal_code || '',
        country: response.data.country || ''
      });

      setEmergencyForm({
        emergency_contact_name: response.data.emergency_contact_name || '',
        emergency_contact_relationship: response.data.emergency_contact_relationship || '',
        emergency_contact_phone: response.data.emergency_contact_phone || '',
        emergency_contact_email: response.data.emergency_contact_email || ''
      });

      // Fetch department
      if (response.data.department_id) {
        const deptRes = await axios.get(`${API}/departments/${response.data.department_id}`);
        setDepartment(deptRes.data);
      }

      // Fetch manager
      if (response.data.reporting_manager_id) {
        const mgrRes = await axios.get(`${API}/employees/${response.data.reporting_manager_id}`);
        setManager(mgrRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch employee data:', error);
    }
  }, []);

  const fetchLeaveData = useCallback(async () => {
    try {
      const [balancesRes, leavesRes] = await Promise.all([
        axios.get(`${API}/leave-balances/my`),
        axios.get(`${API}/leaves/my?limit=5`)
      ]);
      setLeaveBalances(balancesRes.data || []);
      setRecentLeaves(leavesRes.data || []);
    } catch (error) {
      console.error('Failed to fetch leave data:', error);
    }
  }, []);

  const fetchBenefits = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/benefits/enrollments/my`);
      setBenefits(response.data || []);
    } catch (error) {
      console.error('Failed to fetch benefits:', error);
    }
  }, []);

  const fetchSkills = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/skills/my`);
      setSkills(response.data || []);
    } catch (error) {
      console.error('Failed to fetch skills:', error);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      // Fetch various stats
      const [attendanceRes, expensesRes, trainingRes] = await Promise.all([
        axios.get(`${API}/attendance/my/stats`).catch(() => ({ data: {} })),
        axios.get(`${API}/expenses/my/stats`).catch(() => ({ data: {} })),
        axios.get(`${API}/training/my/stats`).catch(() => ({ data: {} }))
      ]);

      setStats({
        attendance: attendanceRes.data,
        expenses: expensesRes.data,
        training: trainingRes.data
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  const fetchRecentActivity = useCallback(async () => {
    try {
      // Combine recent activities from various modules
      const activities = [];

      // Recent leaves
      const leavesRes = await axios.get(`${API}/leaves/my?limit=3`).catch(() => ({ data: [] }));
      leavesRes.data?.forEach(leave => {
        activities.push({
          type: 'leave',
          title: `${leave.leave_type} Leave Request`,
          status: leave.status,
          date: leave.created_at,
          icon: Calendar
        });
      });

      // Recent expenses
      const expensesRes = await axios.get(`${API}/expenses?limit=3`).catch(() => ({ data: [] }));
      expensesRes.data?.forEach(expense => {
        activities.push({
          type: 'expense',
          title: expense.title || 'Expense Claim',
          status: expense.status,
          date: expense.created_at,
          icon: Receipt
        });
      });

      // Sort by date
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchEmployeeData(),
        fetchLeaveData(),
        fetchBenefits(),
        fetchSkills(),
        fetchStats(),
        fetchRecentActivity()
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchEmployeeData, fetchLeaveData, fetchBenefits, fetchSkills, fetchStats, fetchRecentActivity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/employees/me`, profileForm);
      toast.success('Profile updated successfully!');
      fetchEmployeeData();
      setEditProfileOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    }
  };

  const handleUpdateContact = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/employees/me`, contactForm);
      toast.success('Contact information updated!');
      fetchEmployeeData();
      setEditContactOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update contact');
    }
  };

  const handleUpdateEmergency = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/employees/me`, emergencyForm);
      toast.success('Emergency contact updated!');
      fetchEmployeeData();
      setEditEmergencyOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update emergency contact');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await axios.post(`${API}/auth/change-password`, {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      toast.success('Password changed successfully!');
      setChangePasswordOpen(false);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      approved: 'bg-emerald-100 text-emerald-700',
      pending: 'bg-amber-100 text-amber-700',
      rejected: 'bg-rose-100 text-rose-700',
      active: 'bg-emerald-100 text-emerald-700',
      completed: 'bg-blue-100 text-blue-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const calculateTenure = (hireDate) => {
    if (!hireDate) return '-';
    const start = new Date(hireDate);
    const now = new Date();
    const years = Math.floor((now - start) / (365.25 * 24 * 60 * 60 * 1000));
    const months = Math.floor(((now - start) % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
    if (years > 0) return `${years}y ${months}m`;
    return `${months} months`;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6" data-testid="profile-page">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl lg:text-4xl font-bold border-4 border-white/30">
              {employee?.profile_picture ? (
                <img src={employee.profile_picture} alt={employee.full_name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                getInitials(employee?.full_name || user?.full_name)
              )}
            </div>
            <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-50 transition-colors">
              <Camera size={16} />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 mb-2">
              <h1 className="text-2xl lg:text-3xl font-bold">{employee?.full_name || user?.full_name}</h1>
              {employee?.employment_status === 'active' && (
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-100 px-3 py-1 rounded-full text-sm font-medium w-fit">
                  <CheckCircle2 size={14} />
                  Active Employee
                </span>
              )}
            </div>
            <p className="text-indigo-200 text-lg mb-4">{employee?.job_title || 'Employee'}</p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-indigo-100">
                <Building2 size={16} className="text-indigo-300" />
                <span className="text-sm">{department?.name || 'No Department'}</span>
              </div>
              <div className="flex items-center gap-2 text-indigo-100">
                <Mail size={16} className="text-indigo-300" />
                <span className="text-sm truncate">{employee?.work_email || user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-indigo-100">
                <Calendar size={16} className="text-indigo-300" />
                <span className="text-sm">Joined {formatDate(employee?.hire_date)}</span>
              </div>
              <div className="flex items-center gap-2 text-indigo-100">
                <Clock size={16} className="text-indigo-300" />
                <span className="text-sm">Tenure: {calculateTenure(employee?.hire_date)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={() => setEditProfileOpen(true)}
            >
              <Edit2 size={16} className="mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Leave Balance</p>
              <p className="text-xl font-bold text-slate-900">
                {leaveBalances.reduce((sum, b) => sum + (b.balance || 0), 0)} days
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Heart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Benefits</p>
              <p className="text-xl font-bold text-slate-900">{benefits.filter(b => b.status === 'active').length} active</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Skills</p>
              <p className="text-xl font-bold text-slate-900">{skills.length} listed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Performance</p>
              <p className="text-xl font-bold text-slate-900">{employee?.performance_rating || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="benefits">Benefits</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* About */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bio */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <UserCircle size={20} className="text-indigo-600" />
                  About Me
                </h3>
                {employee?.bio ? (
                  <p className="text-slate-600">{employee.bio}</p>
                ) : (
                  <p className="text-slate-400 italic">No bio added yet. Click "Edit Profile" to add one.</p>
                )}

                {/* Social Links */}
                {(employee?.linkedin_url || employee?.twitter_url || employee?.github_url) && (
                  <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                    {employee?.linkedin_url && (
                      <a href={employee.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600">
                        <Linkedin size={20} />
                      </a>
                    )}
                    {employee?.twitter_url && (
                      <a href={employee.twitter_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-sky-500">
                        <Twitter size={20} />
                      </a>
                    )}
                    {employee?.github_url && (
                      <a href={employee.github_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900">
                        <Github size={20} />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Leave Balances */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-indigo-600" />
                  Leave Balances
                </h3>
                {leaveBalances.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {leaveBalances.map((balance, i) => (
                      <div key={i} className="bg-slate-50 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-slate-900">{balance.balance || 0}</p>
                        <p className="text-sm text-slate-500 capitalize">{balance.leave_type?.replace('_', ' ')}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No leave balances found</p>
                )}
              </div>

              {/* Skills */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Award size={20} className="text-indigo-600" />
                  Skills & Expertise
                </h3>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, i) => (
                      <span key={i} className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium">
                        {skill.skill_name || skill.name}
                        {skill.proficiency_level && (
                          <span className="ml-1 text-indigo-400">• {skill.proficiency_level}</span>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No skills added yet. Visit the Skills page to add your skills.</p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Reporting Structure */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Users size={20} className="text-indigo-600" />
                  Reporting Structure
                </h3>
                {manager ? (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                      {getInitials(manager.full_name)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{manager.full_name}</p>
                      <p className="text-sm text-slate-500">{manager.job_title || 'Manager'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No reporting manager assigned</p>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Activity size={20} className="text-indigo-600" />
                  Recent Activity
                </h3>
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((activity, i) => {
                      const Icon = activity.icon;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Icon size={14} className="text-slate-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{activity.title}</p>
                            <p className="text-xs text-slate-500">{formatDate(activity.date)}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                            {activity.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-sm">No recent activity</p>
                )}
              </div>

              {/* Active Benefits */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Heart size={20} className="text-indigo-600" />
                  Active Benefits
                </h3>
                {benefits.filter(b => b.status === 'active').length > 0 ? (
                  <div className="space-y-2">
                    {benefits.filter(b => b.status === 'active').slice(0, 4).map((benefit, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium text-slate-700">{benefit.plan_name}</span>
                        <span className="text-xs text-emerald-600 font-medium">Active</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-sm">No active benefits</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Employment Tab */}
        <TabsContent value="employment" className="mt-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Briefcase size={20} className="text-indigo-600" />
              Employment Information
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">Employee ID</p>
                <p className="font-medium text-slate-900">{employee?.employee_id || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Job Title</p>
                <p className="font-medium text-slate-900">{employee?.job_title || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Department</p>
                <p className="font-medium text-slate-900">{department?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Employment Type</p>
                <p className="font-medium text-slate-900 capitalize">{employee?.employment_type?.replace('_', ' ') || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Employment Status</p>
                <p className="font-medium text-slate-900 capitalize">{employee?.employment_status || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Work Location</p>
                <p className="font-medium text-slate-900">{employee?.work_location || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Hire Date</p>
                <p className="font-medium text-slate-900">{formatDate(employee?.hire_date)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Work Email</p>
                <p className="font-medium text-slate-900">{employee?.work_email || user?.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Work Phone</p>
                <p className="font-medium text-slate-900">{employee?.work_phone || '-'}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Personal Tab */}
        <TabsContent value="personal" className="mt-6 space-y-6">
          {/* Personal Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <User size={20} className="text-indigo-600" />
                Personal Information
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setEditProfileOpen(true)}>
                <Edit2 size={14} className="mr-1" /> Edit
              </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">Full Name</p>
                <p className="font-medium text-slate-900">{employee?.full_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Date of Birth</p>
                <p className="font-medium text-slate-900">{formatDate(employee?.date_of_birth)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Gender</p>
                <p className="font-medium text-slate-900 capitalize">{employee?.gender || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Marital Status</p>
                <p className="font-medium text-slate-900 capitalize">{employee?.marital_status || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Nationality</p>
                <p className="font-medium text-slate-900">{employee?.nationality || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Personal Email</p>
                <p className="font-medium text-slate-900">{employee?.personal_email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Phone</p>
                <p className="font-medium text-slate-900">{employee?.phone || '-'}</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <MapPin size={20} className="text-indigo-600" />
                Contact Address
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setEditContactOpen(true)}>
                <Edit2 size={14} className="mr-1" /> Edit
              </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <p className="text-sm text-slate-500 mb-1">Address</p>
                <p className="font-medium text-slate-900">
                  {employee?.address_line1 || '-'}
                  {employee?.address_line2 && <>, {employee.address_line2}</>}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">City</p>
                <p className="font-medium text-slate-900">{employee?.city || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">State/Province</p>
                <p className="font-medium text-slate-900">{employee?.state || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Postal Code</p>
                <p className="font-medium text-slate-900">{employee?.postal_code || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Country</p>
                <p className="font-medium text-slate-900">{employee?.country || '-'}</p>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <AlertCircle size={20} className="text-rose-600" />
                Emergency Contact
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setEditEmergencyOpen(true)}>
                <Edit2 size={14} className="mr-1" /> Edit
              </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">Contact Name</p>
                <p className="font-medium text-slate-900">{employee?.emergency_contact_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Relationship</p>
                <p className="font-medium text-slate-900 capitalize">{employee?.emergency_contact_relationship || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Phone</p>
                <p className="font-medium text-slate-900">{employee?.emergency_contact_phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Email</p>
                <p className="font-medium text-slate-900">{employee?.emergency_contact_email || '-'}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Benefits Tab */}
        <TabsContent value="benefits" className="mt-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Heart size={20} className="text-indigo-600" />
              My Benefits
            </h3>
            {benefits.length > 0 ? (
              <div className="space-y-4">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{benefit.plan_name}</p>
                        <p className="text-sm text-slate-500 capitalize">{benefit.plan_category} • {benefit.coverage_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(benefit.status)}`}>
                        {benefit.status}
                      </span>
                      <p className="text-sm text-slate-500 mt-1">{formatCurrency(benefit.employee_contribution)}/mo</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">No benefits enrolled</p>
                <p className="text-sm text-slate-400">Visit the Benefits page to explore and enroll in benefits</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Lock size={20} className="text-indigo-600" />
              Account Security
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Password</p>
                    <p className="text-sm text-slate-500">Change your account password</p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setChangePasswordOpen(true)}>
                  Change Password
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Email</p>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                  </div>
                </div>
                <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 size={14} /> Verified
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Notifications</p>
                    <p className="text-sm text-slate-500">Manage notification preferences</p>
                  </div>
                </div>
                <Button variant="outline" disabled>
                  Coming Soon
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Activity size={20} className="text-indigo-600" />
              Recent Login Activity
            </h3>
            <p className="text-sm text-slate-500">Last login: {formatDate(user?.last_login || new Date().toISOString())}</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                <Input
                  value={profileForm.first_name}
                  onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                <Input
                  value={profileForm.last_name}
                  onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <Input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Personal Email</label>
                <Input
                  type="email"
                  value={profileForm.personal_email}
                  onChange={(e) => setProfileForm({ ...profileForm, personal_email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                <Input
                  type="date"
                  value={profileForm.date_of_birth}
                  onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                <Select value={profileForm.gender} onValueChange={(v) => setProfileForm({ ...profileForm, gender: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Marital Status</label>
                <Select value={profileForm.marital_status} onValueChange={(v) => setProfileForm({ ...profileForm, marital_status: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nationality</label>
                <Input
                  value={profileForm.nationality}
                  onChange={(e) => setProfileForm({ ...profileForm, nationality: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                <Textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn URL</label>
                <Input
                  value={profileForm.linkedin_url}
                  onChange={(e) => setProfileForm({ ...profileForm, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Twitter URL</label>
                <Input
                  value={profileForm.twitter_url}
                  onChange={(e) => setProfileForm({ ...profileForm, twitter_url: e.target.value })}
                  placeholder="https://twitter.com/..."
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">GitHub URL</label>
                <Input
                  value={profileForm.github_url}
                  onChange={(e) => setProfileForm({ ...profileForm, github_url: e.target.value })}
                  placeholder="https://github.com/..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditProfileOpen(false)}>Cancel</Button>
              <Button type="submit">
                <Save size={16} className="mr-2" /> Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={editContactOpen} onOpenChange={setEditContactOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Contact Address</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateContact} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 1</label>
              <Input
                value={contactForm.address_line1}
                onChange={(e) => setContactForm({ ...contactForm, address_line1: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 2</label>
              <Input
                value={contactForm.address_line2}
                onChange={(e) => setContactForm({ ...contactForm, address_line2: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                <Input
                  value={contactForm.city}
                  onChange={(e) => setContactForm({ ...contactForm, city: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State/Province</label>
                <Input
                  value={contactForm.state}
                  onChange={(e) => setContactForm({ ...contactForm, state: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Postal Code</label>
                <Input
                  value={contactForm.postal_code}
                  onChange={(e) => setContactForm({ ...contactForm, postal_code: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                <Input
                  value={contactForm.country}
                  onChange={(e) => setContactForm({ ...contactForm, country: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditContactOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Emergency Contact Dialog */}
      <Dialog open={editEmergencyOpen} onOpenChange={setEditEmergencyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Emergency Contact</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateEmergency} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
              <Input
                value={emergencyForm.emergency_contact_name}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, emergency_contact_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Relationship</label>
              <Select
                value={emergencyForm.emergency_contact_relationship}
                onValueChange={(v) => setEmergencyForm({ ...emergencyForm, emergency_contact_relationship: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spouse">Spouse</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="sibling">Sibling</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                  <SelectItem value="friend">Friend</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <Input
                value={emergencyForm.emergency_contact_phone}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, emergency_contact_phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <Input
                type="email"
                value={emergencyForm.emergency_contact_email}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, emergency_contact_email: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditEmergencyOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
              <Input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setChangePasswordOpen(false)}>Cancel</Button>
              <Button type="submit">Change Password</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
