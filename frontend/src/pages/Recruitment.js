import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
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
  Filter
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

const JOB_STATUS = [
  { value: 'draft', label: 'Draft', color: 'bg-slate-100 text-slate-700' },
  { value: 'open', label: 'Open', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-amber-100 text-amber-700' },
  { value: 'closed', label: 'Closed', color: 'bg-rose-100 text-rose-700' }
];

const APPLICATION_STATUS = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-700' },
  { value: 'screening', label: 'Screening', color: 'bg-purple-100 text-purple-700' },
  { value: 'interview', label: 'Interview', color: 'bg-amber-100 text-amber-700' },
  { value: 'offer', label: 'Offer', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'hired', label: 'Hired', color: 'bg-green-100 text-green-700' },
  { value: 'rejected', label: 'Rejected', color: 'bg-rose-100 text-rose-700' }
];

const Recruitment = () => {
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [jobForm, setJobForm] = useState({
    title: '',
    department_id: '',
    location: '',
    job_type: 'full_time',
    description: '',
    requirements: '',
    salary_min: '',
    salary_max: '',
    status: 'draft'
  });

  const [applicationForm, setApplicationForm] = useState({
    job_id: '',
    candidate_name: '',
    email: '',
    phone: '',
    resume_url: '',
    cover_letter: '',
    status: 'new'
  });

  useEffect(() => {
    fetchJobs();
    fetchApplications();
    fetchDepartments();
  }, []);

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

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API}/departments`);
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingJob) {
        await axios.put(`${API}/jobs/${editingJob.id}`, jobForm);
        toast.success('Job updated successfully');
      } else {
        await axios.post(`${API}/jobs`, jobForm);
        toast.success('Job created successfully');
      }
      fetchJobs();
      resetJobForm();
    } catch (error) {
      toast.error('Failed to save job');
    }
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/applications`, applicationForm);
      toast.success('Application submitted successfully');
      fetchApplications();
      setApplicationDialogOpen(false);
      resetApplicationForm();
    } catch (error) {
      toast.error('Failed to submit application');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      await axios.delete(`${API}/jobs/${jobId}`);
      toast.success('Job deleted successfully');
      fetchJobs();
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      await axios.put(`${API}/applications/${applicationId}`, { status });
      toast.success('Application status updated');
      fetchApplications();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const resetJobForm = () => {
    setJobForm({
      title: '',
      department_id: '',
      location: '',
      job_type: 'full_time',
      description: '',
      requirements: '',
      salary_min: '',
      salary_max: '',
      status: 'draft'
    });
    setEditingJob(null);
    setDialogOpen(false);
  };

  const resetApplicationForm = () => {
    setApplicationForm({
      job_id: '',
      candidate_name: '',
      email: '',
      phone: '',
      resume_url: '',
      cover_letter: '',
      status: 'new'
    });
  };

  const openEditJob = (job) => {
    setEditingJob(job);
    setJobForm({
      title: job.title || '',
      department_id: job.department_id || '',
      location: job.location || '',
      job_type: job.job_type || 'full_time',
      description: job.description || '',
      requirements: job.requirements || '',
      salary_min: job.salary_min || '',
      salary_max: job.salary_max || '',
      status: job.status || 'draft'
    });
    setDialogOpen(true);
  };

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : '-';
  };

  const getJobTitle = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    return job ? job.title : '-';
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
    if (searchTerm && !app.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Stats
  const openJobs = jobs.filter(j => j.status === 'open').length;
  const totalApplications = applications.length;
  const newApplications = applications.filter(a => a.status === 'new').length;
  const hiredCount = applications.filter(a => a.status === 'hired').length;

  return (
    <div data-testid="recruitment-page" className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Recruitment
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1">Manage job postings and candidate applications</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-xs sm:text-sm">Open Positions</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{openJobs}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <Briefcase size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs sm:text-sm">Total Applications</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{totalApplications}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <Users size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-xs sm:text-sm">New Applications</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{newApplications}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <Clock size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs sm:text-sm">Hired</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{hiredCount}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <CheckCircle2 size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList className="bg-slate-100 p-1 rounded-xl w-full sm:w-auto flex">
            <TabsTrigger value="jobs" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
              <Briefcase size={14} className="sm:w-4 sm:h-4" />
              Job Postings
            </TabsTrigger>
            <TabsTrigger value="applications" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
              <Users size={14} className="sm:w-4 sm:h-4" />
              Applications
            </TabsTrigger>
          </TabsList>
          
          <Button 
            onClick={() => { resetJobForm(); setDialogOpen(true); }}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-2"
            data-testid="create-job-btn"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Create Job</span>
            <span className="sm:hidden">New Job</span>
          </Button>
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Position</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700 hidden md:table-cell">Department</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700 hidden lg:table-cell">Location</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700 hidden sm:table-cell">Type</th>
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
                          onClick={() => { resetJobForm(); setDialogOpen(true); }}
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
                            <p className="text-xs text-slate-400">{appCount} application{appCount !== 1 ? 's' : ''}</p>
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
                            <span className="text-sm text-slate-600 capitalize">{job.job_type?.replace('_', ' ')}</span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <div className="flex gap-1 sm:gap-2">
                              <Button
                                onClick={() => { setSelectedJob(job); setViewDialogOpen(true); }}
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
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="mt-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Candidate</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700 hidden md:table-cell">Position</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700 hidden lg:table-cell">Applied</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Status</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 sm:py-16 text-center">
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
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 text-sm hidden md:table-cell">
                            {getJobTitle(app.job_id)}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 text-sm hidden lg:table-cell">
                            {app.created_at ? new Date(app.created_at).toLocaleDateString() : '-'}
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
                            <Button
                              onClick={() => { setSelectedApplication(app); setViewDialogOpen(true); }}
                              size="sm"
                              variant="ghost"
                              className="rounded-lg p-1 sm:p-2"
                              data-testid={`view-application-${app.id}`}
                            >
                              <Eye size={14} className="sm:w-4 sm:h-4" />
                            </Button>
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

      {/* Create/Edit Job Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
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
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Location</label>
                <Input
                  value={jobForm.location}
                  onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                  className="rounded-xl"
                  placeholder="e.g. New York, NY"
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
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Salary Min</label>
                <Input
                  type="number"
                  value={jobForm.salary_min}
                  onChange={(e) => setJobForm({ ...jobForm, salary_min: e.target.value })}
                  className="rounded-xl"
                  placeholder="50000"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Salary Max</label>
                <Input
                  type="number"
                  value={jobForm.salary_max}
                  onChange={(e) => setJobForm({ ...jobForm, salary_max: e.target.value })}
                  className="rounded-xl"
                  placeholder="80000"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
                <textarea
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                  rows={3}
                  placeholder="Job description..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Requirements</label>
                <textarea
                  value={jobForm.requirements}
                  onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                  rows={3}
                  placeholder="Job requirements..."
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
      <Dialog open={viewDialogOpen && selectedJob && !selectedApplication} onOpenChange={(open) => { if (!open) { setViewDialogOpen(false); setSelectedJob(null); } }}>
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
                <div className="flex flex-wrap gap-3 mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusInfo(selectedJob.status, 'job').color}`}>
                    {getStatusInfo(selectedJob.status, 'job').label}
                  </span>
                  <span className="text-sm text-slate-500 flex items-center gap-1">
                    <MapPin size={14} />
                    {selectedJob.location || 'Not specified'}
                  </span>
                  <span className="text-sm text-slate-500 capitalize">{selectedJob.job_type?.replace('_', ' ')}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <p className="text-sm text-slate-500">Department</p>
                  <p className="font-medium text-slate-900">{getDepartmentName(selectedJob.department_id)}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <p className="text-sm text-slate-500">Salary Range</p>
                  <p className="font-medium text-slate-900">
                    {selectedJob.salary_min && selectedJob.salary_max 
                      ? `$${selectedJob.salary_min.toLocaleString()} - $${selectedJob.salary_max.toLocaleString()}`
                      : 'Not specified'}
                  </p>
                </div>
              </div>
              
              {selectedJob.description && (
                <div className="border border-slate-200 rounded-xl p-4">
                  <h4 className="font-bold text-slate-900 mb-2">Description</h4>
                  <p className="text-slate-600 whitespace-pre-wrap">{selectedJob.description}</p>
                </div>
              )}
              
              {selectedJob.requirements && (
                <div className="border border-slate-200 rounded-xl p-4">
                  <h4 className="font-bold text-slate-900 mb-2">Requirements</h4>
                  <p className="text-slate-600 whitespace-pre-wrap">{selectedJob.requirements}</p>
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <Button onClick={() => openEditJob(selectedJob)} className="rounded-xl flex-1">
                  <Edit2 size={16} className="mr-2" />
                  Edit Job
                </Button>
                <Button onClick={() => setViewDialogOpen(false)} variant="outline" className="rounded-xl">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Application Dialog */}
      <Dialog open={viewDialogOpen && selectedApplication} onOpenChange={(open) => { if (!open) { setViewDialogOpen(false); setSelectedApplication(null); } }}>
        <DialogContent className="rounded-2xl max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="text-indigo-600" size={24} />
              Application Details
            </DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4 mt-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="text-xl font-bold text-slate-900">{selectedApplication.candidate_name}</h3>
                <p className="text-slate-500">{selectedApplication.email}</p>
                {selectedApplication.phone && <p className="text-slate-500">{selectedApplication.phone}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <p className="text-sm text-slate-500">Applied For</p>
                  <p className="font-medium text-slate-900">{getJobTitle(selectedApplication.job_id)}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <p className="text-sm text-slate-500">Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mt-1 ${getStatusInfo(selectedApplication.status, 'application').color}`}>
                    {getStatusInfo(selectedApplication.status, 'application').label}
                  </span>
                </div>
              </div>
              
              {selectedApplication.cover_letter && (
                <div className="border border-slate-200 rounded-xl p-4">
                  <h4 className="font-bold text-slate-900 mb-2">Cover Letter</h4>
                  <p className="text-slate-600 whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                </div>
              )}
              
              {selectedApplication.resume_url && (
                <div className="border border-slate-200 rounded-xl p-4">
                  <h4 className="font-bold text-slate-900 mb-2">Resume</h4>
                  <a href={selectedApplication.resume_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                    View Resume
                  </a>
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
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
                <Button onClick={() => setViewDialogOpen(false)} variant="outline" className="rounded-xl">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recruitment;
