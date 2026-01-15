import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  UserPlus, 
  Briefcase, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Search,
  Filter,
  Star,
  Video,
  Phone,
  Building,
  Download,
  Send,
  ChevronRight,
  ExternalLink,
  Linkedin,
  Globe,
  Mail,
  User,
  Award
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const JOB_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'remote', label: 'Remote' }
];

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'executive', label: 'Executive' }
];

const JOB_STATUS = [
  { value: 'draft', label: 'Draft', color: 'bg-slate-100 text-slate-700' },
  { value: 'open', label: 'Open', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-amber-100 text-amber-700' },
  { value: 'closed', label: 'Closed', color: 'bg-rose-100 text-rose-700' }
];

const APPLICATION_STATUS = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-700', icon: User },
  { value: 'screening', label: 'Screening', color: 'bg-purple-100 text-purple-700', icon: FileText },
  { value: 'interview', label: 'Interview', color: 'bg-amber-100 text-amber-700', icon: Video },
  { value: 'offer', label: 'Offer', color: 'bg-cyan-100 text-cyan-700', icon: Send },
  { value: 'hired', label: 'Hired', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  { value: 'rejected', label: 'Rejected', color: 'bg-rose-100 text-rose-700', icon: XCircle }
];

const APPLICATION_SOURCES = [
  { value: 'direct', label: 'Direct Application' },
  { value: 'referral', label: 'Employee Referral' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'other', label: 'Other' }
];

const INTERVIEW_TYPES = [
  { value: 'phone', label: 'Phone Screen', icon: Phone },
  { value: 'video', label: 'Video Call', icon: Video },
  { value: 'onsite', label: 'On-site', icon: Building },
  { value: 'panel', label: 'Panel Interview', icon: Users },
  { value: 'technical', label: 'Technical', icon: FileText }
];

const Recruitment = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [stats, setStats] = useState(null);
  
  // Dialogs
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [viewJobDialogOpen, setViewJobDialogOpen] = useState(false);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [viewApplicationDialogOpen, setViewApplicationDialogOpen] = useState(false);
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [referralDialogOpen, setReferralDialogOpen] = useState(false);
  
  // Selected items
  const [editingJob, setEditingJob] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterJob, setFilterJob] = useState('all');
  
  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';
  
  const [jobForm, setJobForm] = useState({
    title: '',
    department_id: '',
    location: '',
    job_type: 'full_time',
    experience_level: 'mid',
    description: '',
    responsibilities: '',
    requirements: '',
    benefits: '',
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    show_salary: true,
    hiring_manager_id: '',
    positions_count: 1,
    is_internal: false,
    expiry_date: '',
    status: 'draft'
  });

  const [applicationForm, setApplicationForm] = useState({
    job_id: '',
    candidate_name: '',
    email: '',
    phone: '',
    resume_url: '',
    cover_letter: '',
    linkedin_url: '',
    portfolio_url: '',
    current_company: '',
    current_title: '',
    experience_years: '',
    expected_salary: '',
    notice_period: '',
    source: 'direct',
    referral_employee_id: '',
    status: 'new'
  });

  const [interviewForm, setInterviewForm] = useState({
    application_id: '',
    job_id: '',
    interview_type: 'video',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 60,
    location: '',
    meeting_link: '',
    interviewers: [],
    notes: ''
  });

  useEffect(() => {
    fetchJobs();
    fetchApplications();
    fetchInterviews();
    fetchDepartments();
    fetchEmployees();
    fetchStats();
    fetchCurrentEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCurrentEmployee = async () => {
    try {
      // Try to find the employee record for the current user
      const response = await axios.get(`${API}/employees`);
      const employees = response.data;
      // Find employee matching the current user's email
      if (user?.email) {
        const emp = employees.find(e => e.email?.toLowerCase() === user.email.toLowerCase());
        if (emp) {
          setCurrentEmployee(emp);
        }
      }
    } catch (error) {
      console.error('Failed to fetch current employee:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API}/jobs`);
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await axios.get(`${API}/applications`);
      setApplications(response.data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    }
  };

  const fetchInterviews = async () => {
    try {
      const response = await axios.get(`${API}/interviews`);
      setInterviews(response.data);
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API}/departments`);
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
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

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/recruitment/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        ...jobForm,
        salary_min: jobForm.salary_min ? parseFloat(jobForm.salary_min) : null,
        salary_max: jobForm.salary_max ? parseFloat(jobForm.salary_max) : null,
        positions_count: parseInt(jobForm.positions_count) || 1
      };
      if (editingJob) {
        await axios.put(`${API}/jobs/${editingJob.id}`, formData);
        toast.success('Job updated successfully');
      } else {
        await axios.post(`${API}/jobs`, formData);
        toast.success('Job created successfully');
      }
      fetchJobs();
      fetchStats();
      resetJobForm();
    } catch (error) {
      toast.error('Failed to save job');
    }
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        ...applicationForm,
        experience_years: applicationForm.experience_years ? parseInt(applicationForm.experience_years) : null,
        expected_salary: applicationForm.expected_salary ? parseFloat(applicationForm.expected_salary) : null,
        // Set referral_employee_id if this is a referral from an employee
        referral_employee_id: applicationForm.source === 'referral' && currentEmployee ? currentEmployee.id : applicationForm.referral_employee_id
      };
      await axios.post(`${API}/applications`, formData);
      toast.success('Application submitted successfully');
      fetchApplications();
      fetchStats();
      setApplicationDialogOpen(false);
      setReferralDialogOpen(false);
      resetApplicationForm();
    } catch (error) {
      toast.error('Failed to submit application');
    }
  };

  const handleInterviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/interviews`, interviewForm);
      toast.success('Interview scheduled successfully');
      fetchInterviews();
      fetchApplications();
      setInterviewDialogOpen(false);
      resetInterviewForm();
    } catch (error) {
      toast.error('Failed to schedule interview');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? All applications will also be deleted.')) return;
    try {
      await axios.delete(`${API}/jobs/${jobId}`);
      toast.success('Job deleted successfully');
      fetchJobs();
      fetchApplications();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      await axios.put(`${API}/applications/${applicationId}`, { status });
      toast.success('Application status updated');
      fetchApplications();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const updateApplicationRating = async (applicationId, rating) => {
    try {
      await axios.put(`${API}/applications/${applicationId}`, { rating });
      toast.success('Rating updated');
      fetchApplications();
    } catch (error) {
      toast.error('Failed to update rating');
    }
  };

  const handleExportApplications = async () => {
    try {
      const response = await axios.get(`${API}/applications/export`);
      const csv = [
        Object.keys(response.data[0] || {}).join(','),
        ...response.data.map(row => Object.values(row).map(v => `"${v || ''}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `applications_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      toast.success('Export completed');
    } catch (error) {
      toast.error('Failed to export');
    }
  };

  const resetJobForm = () => {
    setJobForm({
      title: '', department_id: '', location: '', job_type: 'full_time',
      experience_level: 'mid', description: '', responsibilities: '', requirements: '',
      benefits: '', salary_min: '', salary_max: '', salary_currency: 'USD',
      show_salary: true, hiring_manager_id: '', positions_count: 1,
      is_internal: false, expiry_date: '', status: 'draft'
    });
    setEditingJob(null);
    setJobDialogOpen(false);
  };

  const resetApplicationForm = () => {
    setApplicationForm({
      job_id: '', candidate_name: '', email: '', phone: '', resume_url: '',
      cover_letter: '', linkedin_url: '', portfolio_url: '', current_company: '',
      current_title: '', experience_years: '', expected_salary: '', notice_period: '',
      source: 'direct', referral_employee_id: '', status: 'new'
    });
  };

  const resetInterviewForm = () => {
    setInterviewForm({
      application_id: '', job_id: '', interview_type: 'video',
      scheduled_date: '', scheduled_time: '', duration_minutes: 60,
      location: '', meeting_link: '', interviewers: [], notes: ''
    });
  };

  const openEditJob = (job) => {
    setEditingJob(job);
    setJobForm({
      title: job.title || '',
      department_id: job.department_id || '',
      location: job.location || '',
      job_type: job.job_type || 'full_time',
      experience_level: job.experience_level || 'mid',
      description: job.description || '',
      responsibilities: job.responsibilities || '',
      requirements: job.requirements || '',
      benefits: job.benefits || '',
      salary_min: job.salary_min || '',
      salary_max: job.salary_max || '',
      salary_currency: job.salary_currency || 'USD',
      show_salary: job.show_salary !== false,
      hiring_manager_id: job.hiring_manager_id || '',
      positions_count: job.positions_count || 1,
      is_internal: job.is_internal || false,
      expiry_date: job.expiry_date || '',
      status: job.status || 'draft'
    });
    setJobDialogOpen(true);
  };

  const openScheduleInterview = (application) => {
    setInterviewForm({
      ...interviewForm,
      application_id: application.id,
      job_id: application.job_id
    });
    setInterviewDialogOpen(true);
  };

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : '-';
  };

  const getJobTitle = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    return job ? job.title : '-';
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.full_name : '-';
  };

  const getStatusInfo = (status, type = 'job') => {
    const statusList = type === 'job' ? JOB_STATUS : APPLICATION_STATUS;
    return statusList.find(s => s.value === status) || statusList[0];
  };

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    if (filterStatus !== 'all' && job.status !== filterStatus) return false;
    if (searchTerm && !job.title?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Filter applications
  const filteredApplications = applications.filter(app => {
    if (filterStatus !== 'all' && app.status !== filterStatus) return false;
    if (filterJob !== 'all' && app.job_id !== filterJob) return false;
    if (searchTerm && !app.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Pipeline counts for kanban
  const pipelineCounts = APPLICATION_STATUS.reduce((acc, status) => {
    acc[status.value] = applications.filter(a => a.status === status.value).length;
    return acc;
  }, {});

  // Render star rating
  const StarRating = ({ rating, onRate, readonly = false }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onRate && onRate(star)}
          disabled={readonly}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <Star
            size={16}
            className={star <= (rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div data-testid="recruitment-page" className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {isAdmin ? 'Recruitment' : 'Job Openings'}
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1">
            {isAdmin ? 'Manage job postings and candidate applications' : 'View open positions and refer candidates'}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button 
              onClick={handleExportApplications}
              variant="outline"
              className="rounded-xl gap-2"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button 
              onClick={() => { resetJobForm(); setJobDialogOpen(true); }}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-2"
              data-testid="create-job-btn"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Create Job</span>
              <span className="sm:hidden">New</span>
            </Button>
            <Button 
              onClick={() => { resetApplicationForm(); setApplicationDialogOpen(true); }}
              variant="outline"
              className="rounded-xl gap-2"
              data-testid="add-candidate-btn"
            >
              <UserPlus size={18} />
              <span className="hidden sm:inline">Add Candidate</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        )}
      </div>

      {/* Stats - Admin Only */}
      {isAdmin && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-xs sm:text-sm">Open Positions</p>
                <p className="text-2xl sm:text-3xl font-black mt-1">{stats.jobs?.open || 0}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-2 sm:p-3">
                <Briefcase size={20} className="sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs sm:text-sm">Total Candidates</p>
                <p className="text-2xl sm:text-3xl font-black mt-1">{stats.applications?.total || 0}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-2 sm:p-3">
                <Users size={20} className="sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-xs sm:text-sm">In Interview</p>
                <p className="text-2xl sm:text-3xl font-black mt-1">{stats.applications?.interview || 0}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-2 sm:p-3">
                <Video size={20} className="sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-xs sm:text-sm">Hired</p>
                <p className="text-2xl sm:text-3xl font-black mt-1">{stats.applications?.hired || 0}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-2 sm:p-3">
                <CheckCircle2 size={20} className="sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Overview - Admin Only */}
      {isAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-3">Candidate Pipeline</h3>
          <div className="flex flex-wrap gap-2">
            {APPLICATION_STATUS.map((status) => {
              const StatusIcon = status.icon;
              return (
                <div key={status.value} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${status.color}`}>
                  <StatusIcon size={14} />
                  <span className="text-sm font-medium">{status.label}</span>
                  <span className="font-bold">{pipelineCounts[status.value] || 0}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList className="bg-slate-100 p-1 rounded-xl w-full sm:w-auto flex">
            <TabsTrigger value="jobs" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
              <Briefcase size={14} className="sm:w-4 sm:h-4" />
              {isAdmin ? 'Job Postings' : 'Open Positions'}
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="applications" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
                <Users size={14} className="sm:w-4 sm:h-4" />
                Applications
              </TabsTrigger>
            )}
            <TabsTrigger value="referrals" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
              <Award size={14} className="sm:w-4 sm:h-4" />
              {isAdmin ? 'Referrals' : 'My Referrals'}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={activeTab === 'jobs' ? "Search jobs..." : "Search candidates..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          {activeTab === 'applications' && (
            <Select value={filterJob} onValueChange={setFilterJob}>
              <SelectTrigger className="w-full sm:w-48 rounded-xl">
                <SelectValue placeholder="Filter by Job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48 rounded-xl">
              <Filter size={16} className="mr-2" />
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {(activeTab === 'jobs' ? JOB_STATUS : APPLICATION_STATUS).map((status) => (
                <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="mt-4">
          {!isAdmin ? (
            // Employee view - Card layout for job board
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobs.filter(j => j.status === 'open').length === 0 ? (
                <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <Briefcase size={48} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">No open positions at the moment</p>
                </div>
              ) : (
                filteredJobs.filter(j => j.status === 'open').map((job) => (
                  <div key={job.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900">{job.title}</h3>
                        <p className="text-sm text-slate-500">{getDepartmentName(job.department_id)}</p>
                      </div>
                      {job.is_internal && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold">
                          Internal
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin size={12} />{job.location || 'Remote'}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500 capitalize">
                        <Briefcase size={12} />{job.job_type?.replace('_', ' ')}
                      </span>
                      {job.show_salary && job.salary_min && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <DollarSign size={12} />
                          {job.salary_min.toLocaleString()}{job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : '+'} {job.salary_currency}
                        </span>
                      )}
                    </div>
                    {job.description && (
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">{job.description}</p>
                    )}
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => { setSelectedJob(job); setViewJobDialogOpen(true); }}
                        variant="outline" 
                        className="flex-1 rounded-xl"
                      >
                        View Details
                      </Button>
                      <Button 
                        type="button"
                        onClick={(e) => { 
                          e.preventDefault();
                          e.stopPropagation();
                          setApplicationForm({ ...applicationForm, job_id: job.id, source: 'referral' });
                          setReferralDialogOpen(true);
                        }}
                        className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                      >
                        <UserPlus size={16} className="mr-1" />
                        Refer
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // Admin view - Table
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Position</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700 hidden md:table-cell">Department</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700 hidden lg:table-cell">Location</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700 hidden sm:table-cell">Candidates</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Status</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 sm:py-16 text-center">
                          <Briefcase size={40} className="mx-auto mb-4 text-slate-300 sm:w-12 sm:h-12" />
                          <p className="text-slate-500 text-sm sm:text-base">No job postings found</p>
                          <Button 
                            onClick={() => { resetJobForm(); setJobDialogOpen(true); }}
                            variant="outline" 
                            className="mt-4 rounded-xl"
                          >
                            <Plus size={16} className="mr-2" />
                            Create First Job
                          </Button>
                        </td>
                      </tr>
                    ) : (
                      filteredJobs.map((job) => {
                        const statusInfo = getStatusInfo(job.status, 'job');
                        const appCount = applications.filter(a => a.job_id === job.id).length;
                        return (
                          <tr key={job.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                              <p className="font-medium text-slate-900 text-sm">{job.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-400 capitalize">{job.job_type?.replace('_', ' ')}</span>
                                {job.is_internal && (
                                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">Internal</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 text-sm hidden md:table-cell">
                              {getDepartmentName(job.department_id)}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 text-sm hidden lg:table-cell">
                              <div className="flex items-center gap-1">
                                <MapPin size={14} />
                                {job.location || '-'}
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-sm">
                                <Users size={14} />
                                {appCount}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                              <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                              <div className="flex gap-1 sm:gap-2">
                                <Button
                                  onClick={() => { setSelectedJob(job); setViewJobDialogOpen(true); }}
                                  size="sm"
                                  variant="ghost"
                                  className="rounded-lg p-1 sm:p-2"
                                  data-testid={`view-job-${job.id}`}
                                >
                                  <Eye size={14} className="sm:w-4 sm:h-4" />
                                </Button>
                                <Button
                                  onClick={() => openEditJob(job)}
                                  size="sm"
                                  variant="ghost"
                                  className="rounded-lg p-1 sm:p-2"
                                  data-testid={`edit-job-${job.id}`}
                                >
                                  <Edit2 size={14} className="sm:w-4 sm:h-4" />
                                </Button>
                                <Button
                                  onClick={() => handleDeleteJob(job.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="rounded-lg p-1 sm:p-2 text-rose-600"
                                  data-testid={`delete-job-${job.id}`}
                                >
                                  <Trash2 size={14} className="sm:w-4 sm:h-4" />
                                </Button>
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
          )}
        </TabsContent>

        {/* Applications Tab - Admin Only */}
        {isAdmin && (
          <TabsContent value="applications" className="mt-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Candidate</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700 hidden md:table-cell">Position</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700 hidden lg:table-cell">Experience</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Rating</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Status</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 sm:py-16 text-center">
                          <Users size={40} className="mx-auto mb-4 text-slate-300 sm:w-12 sm:h-12" />
                          <p className="text-slate-500 text-sm sm:text-base">No applications found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredApplications.map((app) => {
                        const statusInfo = getStatusInfo(app.status, 'application');
                        return (
                          <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                              <p className="font-medium text-slate-900 text-sm">{app.candidate_name}</p>
                              <p className="text-xs text-slate-400">{app.email}</p>
                              {app.source === 'referral' && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs mt-1">
                                  <Award size={10} />Referral
                                </span>
                              )}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 text-sm hidden md:table-cell">
                              {getJobTitle(app.job_id)}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 text-sm hidden lg:table-cell">
                              {app.experience_years ? `${app.experience_years} years` : '-'}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                              <StarRating 
                                rating={app.rating} 
                                onRate={(r) => updateApplicationRating(app.id, r)} 
                              />
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                              <Select 
                                value={app.status} 
                                onValueChange={(value) => updateApplicationStatus(app.id, value)}
                              >
                                <SelectTrigger className={`w-28 sm:w-32 rounded-lg text-xs ${statusInfo.color} border-0`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {APPLICATION_STATUS.map((status) => (
                                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                              <div className="flex gap-1">
                                <Button
                                  onClick={() => { setSelectedApplication(app); setViewApplicationDialogOpen(true); }}
                                  size="sm"
                                  variant="ghost"
                                  className="rounded-lg p-1 sm:p-2"
                                  title="View Details"
                                >
                                  <Eye size={14} />
                                </Button>
                                <Button
                                  onClick={() => openScheduleInterview(app)}
                                  size="sm"
                                  variant="ghost"
                                  className="rounded-lg p-1 sm:p-2 text-indigo-600"
                                  title="Schedule Interview"
                                >
                                  <Calendar size={14} />
                                </Button>
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
        )}

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="mt-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-900">{isAdmin ? 'Employee Referrals' : 'My Referrals'}</h3>
                <p className="text-sm text-slate-500">
                  {isAdmin ? 'Track candidates referred by employees' : 'Candidates you have referred'}
                </p>
              </div>
              {!isAdmin && jobs.filter(j => j.status === 'open').length > 0 && (
                <Button 
                  onClick={() => setReferralDialogOpen(true)}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-2"
                >
                  <UserPlus size={16} />
                  Refer Candidate
                </Button>
              )}
            </div>
            
            {applications.filter(a => a.source === 'referral').length === 0 ? (
              <div className="text-center py-12">
                <Award size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No referrals yet</p>
                {!isAdmin && (
                  <p className="text-sm text-slate-400 mt-2">
                    Help us find great talent! Refer candidates for open positions.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {applications.filter(a => a.source === 'referral').map((app) => {
                  const statusInfo = getStatusInfo(app.status, 'application');
                  return (
                    <div key={app.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <User size={20} className="text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{app.candidate_name}</p>
                          <p className="text-sm text-slate-500">{getJobTitle(app.job_id)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isAdmin && app.referral_employee_id && (
                          <span className="text-sm text-slate-500">
                            by {getEmployeeName(app.referral_employee_id)}
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Job Dialog */}
      <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
        <DialogContent className="rounded-2xl max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Briefcase className="text-indigo-600" size={24} />
              {editingJob ? 'Edit Job Posting' : 'Create Job Posting'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleJobSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Job Title *</label>
                <Input
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  className="rounded-xl"
                  placeholder="e.g. Senior Software Engineer"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Department</label>
                <Select value={jobForm.department_id} onValueChange={(v) => setJobForm({ ...jobForm, department_id: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Hiring Manager</label>
                <Select value={jobForm.hiring_manager_id} onValueChange={(v) => setJobForm({ ...jobForm, hiring_manager_id: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Location</label>
                <Input
                  value={jobForm.location}
                  onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                  className="rounded-xl"
                  placeholder="e.g. New York, NY or Remote"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Job Type</label>
                <Select value={jobForm.job_type} onValueChange={(v) => setJobForm({ ...jobForm, job_type: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Experience Level</label>
                <Select value={jobForm.experience_level} onValueChange={(v) => setJobForm({ ...jobForm, experience_level: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Status</label>
                <Select value={jobForm.status} onValueChange={(v) => setJobForm({ ...jobForm, status: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_STATUS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Positions</label>
                <Input
                  type="number"
                  min="1"
                  value={jobForm.positions_count}
                  onChange={(e) => setJobForm({ ...jobForm, positions_count: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Salary Range</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={jobForm.salary_min}
                    onChange={(e) => setJobForm({ ...jobForm, salary_min: e.target.value })}
                    className="rounded-xl"
                    placeholder="Min"
                  />
                  <Input
                    type="number"
                    value={jobForm.salary_max}
                    onChange={(e) => setJobForm({ ...jobForm, salary_max: e.target.value })}
                    className="rounded-xl"
                    placeholder="Max"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Expiry Date</label>
                <Input
                  type="date"
                  value={jobForm.expiry_date}
                  onChange={(e) => setJobForm({ ...jobForm, expiry_date: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={jobForm.show_salary}
                    onChange={(e) => setJobForm({ ...jobForm, show_salary: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-700">Show salary</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={jobForm.is_internal}
                    onChange={(e) => setJobForm({ ...jobForm, is_internal: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-700">Internal only</span>
                </label>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
                <textarea
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                  rows={3}
                  placeholder="Brief overview of the role..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Responsibilities</label>
                <textarea
                  value={jobForm.responsibilities}
                  onChange={(e) => setJobForm({ ...jobForm, responsibilities: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                  rows={3}
                  placeholder="Key responsibilities..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Requirements</label>
                <textarea
                  value={jobForm.requirements}
                  onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                  rows={3}
                  placeholder="Required qualifications..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Benefits</label>
                <textarea
                  value={jobForm.benefits}
                  onChange={(e) => setJobForm({ ...jobForm, benefits: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                  rows={2}
                  placeholder="Benefits and perks..."
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1">
                {editingJob ? 'Update Job' : 'Create Job'}
              </Button>
              <Button type="button" onClick={resetJobForm} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Job Dialog */}
      <Dialog open={viewJobDialogOpen} onOpenChange={setViewJobDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Briefcase className="text-indigo-600" size={24} />
              Job Details
            </DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4 mt-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="text-xl font-bold text-slate-900">{selectedJob.title}</h3>
                <p className="text-slate-500">{getDepartmentName(selectedJob.department_id)}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusInfo(selectedJob.status, 'job').color}`}>
                    {getStatusInfo(selectedJob.status, 'job').label}
                  </span>
                  <span className="flex items-center gap-1 px-3 py-1 bg-slate-200 rounded-full text-xs text-slate-600">
                    <MapPin size={12} />{selectedJob.location || 'Remote'}
                  </span>
                  <span className="flex items-center gap-1 px-3 py-1 bg-slate-200 rounded-full text-xs text-slate-600 capitalize">
                    <Briefcase size={12} />{selectedJob.job_type?.replace('_', ' ')}
                  </span>
                  <span className="flex items-center gap-1 px-3 py-1 bg-slate-200 rounded-full text-xs text-slate-600 capitalize">
                    {selectedJob.experience_level} Level
                  </span>
                </div>
              </div>
              
              {selectedJob.show_salary && selectedJob.salary_min && (
                <div className="flex items-center gap-2 p-4 bg-emerald-50 rounded-xl">
                  <DollarSign className="text-emerald-600" size={20} />
                  <span className="font-bold text-emerald-700">
                    {selectedJob.salary_min.toLocaleString()}{selectedJob.salary_max ? ` - ${selectedJob.salary_max.toLocaleString()}` : '+'} {selectedJob.salary_currency}
                  </span>
                </div>
              )}
              
              {selectedJob.description && (
                <div className="border border-slate-200 rounded-xl p-4">
                  <h4 className="font-bold text-slate-900 mb-2">Description</h4>
                  <p className="text-slate-600 whitespace-pre-wrap">{selectedJob.description}</p>
                </div>
              )}
              
              {selectedJob.responsibilities && (
                <div className="border border-slate-200 rounded-xl p-4">
                  <h4 className="font-bold text-slate-900 mb-2">Responsibilities</h4>
                  <p className="text-slate-600 whitespace-pre-wrap">{selectedJob.responsibilities}</p>
                </div>
              )}
              
              {selectedJob.requirements && (
                <div className="border border-slate-200 rounded-xl p-4">
                  <h4 className="font-bold text-slate-900 mb-2">Requirements</h4>
                  <p className="text-slate-600 whitespace-pre-wrap">{selectedJob.requirements}</p>
                </div>
              )}
              
              {selectedJob.benefits && (
                <div className="border border-slate-200 rounded-xl p-4">
                  <h4 className="font-bold text-slate-900 mb-2">Benefits</h4>
                  <p className="text-slate-600 whitespace-pre-wrap">{selectedJob.benefits}</p>
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                {isAdmin ? (
                  <>
                    <Button onClick={() => { setViewJobDialogOpen(false); openEditJob(selectedJob); }} className="rounded-xl flex-1">
                      <Edit2 size={16} className="mr-2" />
                      Edit Job
                    </Button>
                    <Button onClick={() => setViewJobDialogOpen(false)} variant="outline" className="rounded-xl">
                      Close
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      onClick={() => {
                        setViewJobDialogOpen(false);
                        setReferralDialogOpen(true);
                        setApplicationForm({ ...applicationForm, job_id: selectedJob.id, source: 'referral' });
                      }}
                      className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1"
                    >
                      <UserPlus size={16} className="mr-2" />
                      Refer a Candidate
                    </Button>
                    <Button onClick={() => setViewJobDialogOpen(false)} variant="outline" className="rounded-xl">
                      Close
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Application Dialog */}
      <Dialog open={viewApplicationDialogOpen} onOpenChange={setViewApplicationDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="text-indigo-600" size={24} />
              Candidate Profile
            </DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4 mt-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedApplication.candidate_name}</h3>
                    <p className="text-slate-500">{selectedApplication.current_title} {selectedApplication.current_company && `at ${selectedApplication.current_company}`}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusInfo(selectedApplication.status, 'application').color}`}>
                      {getStatusInfo(selectedApplication.status, 'application').label}
                    </span>
                    <StarRating rating={selectedApplication.rating} onRate={(r) => updateApplicationRating(selectedApplication.id, r)} />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <p className="text-sm text-slate-500 flex items-center gap-1"><Mail size={14} /> Email</p>
                  <a href={`mailto:${selectedApplication.email}`} className="font-medium text-indigo-600 hover:underline">{selectedApplication.email}</a>
                </div>
                {selectedApplication.phone && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-sm text-slate-500 flex items-center gap-1"><Phone size={14} /> Phone</p>
                    <p className="font-medium text-slate-900">{selectedApplication.phone}</p>
                  </div>
                )}
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <p className="text-sm text-slate-500 flex items-center gap-1"><Briefcase size={14} /> Position</p>
                  <p className="font-medium text-slate-900">{getJobTitle(selectedApplication.job_id)}</p>
                </div>
                {selectedApplication.experience_years && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-sm text-slate-500">Experience</p>
                    <p className="font-medium text-slate-900">{selectedApplication.experience_years} years</p>
                  </div>
                )}
                {selectedApplication.expected_salary && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-sm text-slate-500 flex items-center gap-1"><DollarSign size={14} /> Expected Salary</p>
                    <p className="font-medium text-slate-900">${selectedApplication.expected_salary.toLocaleString()}</p>
                  </div>
                )}
                {selectedApplication.notice_period && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-sm text-slate-500 flex items-center gap-1"><Clock size={14} /> Notice Period</p>
                    <p className="font-medium text-slate-900">{selectedApplication.notice_period}</p>
                  </div>
                )}
              </div>
              
              {/* Links */}
              <div className="flex flex-wrap gap-2">
                {selectedApplication.linkedin_url && (
                  <a href={selectedApplication.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
                    <Linkedin size={16} />LinkedIn
                    <ExternalLink size={12} />
                  </a>
                )}
                {selectedApplication.portfolio_url && (
                  <a href={selectedApplication.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-colors">
                    <Globe size={16} />Portfolio
                    <ExternalLink size={12} />
                  </a>
                )}
                {selectedApplication.resume_url && (
                  <a href={selectedApplication.resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors">
                    <FileText size={16} />Resume
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
              
              {selectedApplication.cover_letter && (
                <div className="border border-slate-200 rounded-xl p-4">
                  <h4 className="font-bold text-slate-900 mb-2">Cover Letter</h4>
                  <p className="text-slate-600 whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                </div>
              )}
              
              {selectedApplication.source === 'referral' && selectedApplication.referral_employee_id && (
                <div className="flex items-center gap-2 p-4 bg-purple-50 rounded-xl">
                  <Award className="text-purple-600" size={20} />
                  <span className="text-purple-700">Referred by <strong>{getEmployeeName(selectedApplication.referral_employee_id)}</strong></span>
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <Button onClick={() => openScheduleInterview(selectedApplication)} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1">
                  <Calendar size={16} className="mr-2" />
                  Schedule Interview
                </Button>
                <Select 
                  value={selectedApplication.status} 
                  onValueChange={(value) => {
                    updateApplicationStatus(selectedApplication.id, value);
                    setSelectedApplication({ ...selectedApplication, status: value });
                  }}
                >
                  <SelectTrigger className="rounded-xl flex-1">
                    <SelectValue placeholder="Update Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {APPLICATION_STATUS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Dialog */}
      <Dialog open={interviewDialogOpen} onOpenChange={setInterviewDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Calendar className="text-indigo-600" size={24} />
              Schedule Interview
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInterviewSubmit} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Interview Type</label>
              <Select value={interviewForm.interview_type} onValueChange={(v) => setInterviewForm({ ...interviewForm, interview_type: v })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVIEW_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Date *</label>
                <Input
                  type="date"
                  value={interviewForm.scheduled_date}
                  onChange={(e) => setInterviewForm({ ...interviewForm, scheduled_date: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Time *</label>
                <Input
                  type="time"
                  value={interviewForm.scheduled_time}
                  onChange={(e) => setInterviewForm({ ...interviewForm, scheduled_time: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Duration (minutes)</label>
              <Input
                type="number"
                value={interviewForm.duration_minutes}
                onChange={(e) => setInterviewForm({ ...interviewForm, duration_minutes: parseInt(e.target.value) })}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                {interviewForm.interview_type === 'video' ? 'Meeting Link' : 'Location'}
              </label>
              <Input
                value={interviewForm.interview_type === 'video' ? interviewForm.meeting_link : interviewForm.location}
                onChange={(e) => setInterviewForm({ 
                  ...interviewForm, 
                  [interviewForm.interview_type === 'video' ? 'meeting_link' : 'location']: e.target.value 
                })}
                className="rounded-xl"
                placeholder={interviewForm.interview_type === 'video' ? 'https://zoom.us/...' : 'Office address'}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Notes</label>
              <textarea
                value={interviewForm.notes}
                onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                rows={2}
                placeholder="Additional notes..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1">
                Schedule Interview
              </Button>
              <Button type="button" onClick={() => setInterviewDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Referral Dialog */}
      <Dialog open={referralDialogOpen} onOpenChange={setReferralDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <UserPlus className="text-indigo-600" size={24} />
              Refer a Candidate
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleApplicationSubmit} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Position *</label>
              <Select value={applicationForm.job_id} onValueChange={(v) => setApplicationForm({ ...applicationForm, job_id: v })} required>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.filter(j => j.status === 'open').map((job) => (
                    <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Candidate Name *</label>
              <Input
                value={applicationForm.candidate_name}
                onChange={(e) => setApplicationForm({ ...applicationForm, candidate_name: e.target.value })}
                className="rounded-xl"
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Email *</label>
              <Input
                type="email"
                value={applicationForm.email}
                onChange={(e) => setApplicationForm({ ...applicationForm, email: e.target.value })}
                className="rounded-xl"
                placeholder="candidate@email.com"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Phone</label>
              <Input
                value={applicationForm.phone}
                onChange={(e) => setApplicationForm({ ...applicationForm, phone: e.target.value })}
                className="rounded-xl"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">LinkedIn Profile</label>
              <Input
                value={applicationForm.linkedin_url}
                onChange={(e) => setApplicationForm({ ...applicationForm, linkedin_url: e.target.value })}
                className="rounded-xl"
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Why are you referring this person?</label>
              <textarea
                value={applicationForm.cover_letter}
                onChange={(e) => setApplicationForm({ ...applicationForm, cover_letter: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                rows={3}
                placeholder="Tell us why this person would be a great fit..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1">
                <Send size={16} className="mr-2" />
                Submit Referral
              </Button>
              <Button type="button" onClick={() => setReferralDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recruitment;
