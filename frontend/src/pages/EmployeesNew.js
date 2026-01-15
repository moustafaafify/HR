import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Eye, Key, Lock, Unlock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmployeesNew = () => {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  const [employees, setEmployees] = useState([]);
  const [corporations, setCorporations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [viewingEmp, setViewingEmp] = useState(null);
  const [selectedEmpForPassword, setSelectedEmpForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState({
    // Personal & Contact
    full_name: '',
    employee_id: '',
    personal_email: '',
    work_email: '',
    home_address: '',
    personal_phone: '',
    work_phone: '',
    emergency_contact_name: '',
    emergency_contact_relationship: '',
    emergency_contact_phone: '',
    date_of_birth: '',
    gender: '',
    marital_status: '',
    ssn: '',
    
    // Employment & Job Details
    job_title: '',
    department_id: '',
    division_id: '',
    branch_id: '',
    corporation_id: '',
    work_location: '',
    reporting_manager_id: '',
    hire_date: '',
    employment_status: 'full-time',
    probation_end_date: '',
    role: 'employee',
    
    // Payroll & Benefits
    bank_account_number: '',
    bank_name: '',
    bank_routing_number: '',
    tax_code: '',
    salary: '',
    currency: 'USD',
    benefits_enrolled: '',
    
    // Time & Leave
    holiday_allowance: '',
    sick_leave_allowance: '',
    working_hours: '40',
    shift_pattern: 'day',
    
    // Talent & Compliance
    certifications: '',
    professional_memberships: '',
    skills: '',
    performance_notes: '',
    visa_status: '',
    passport_number: '',
    right_to_work_verified: false,
    dbs_check_status: '',
    
    user_id: ''
  });

  useEffect(() => {
    fetchEmployees();
    fetchCorporations();
    fetchBranches();
    fetchDepartments();
    fetchDivisions();
    fetchRoles();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API}/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchCorporations = async () => {
    try {
      const response = await axios.get(`${API}/corporations`);
      setCorporations(response.data);
    } catch (error) {
      console.error('Failed to fetch corporations:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${API}/branches`);
      setBranches(response.data);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
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

  const fetchDivisions = async () => {
    try {
      const response = await axios.get(`${API}/divisions`);
      setDivisions(response.data);
    } catch (error) {
      console.error('Failed to fetch divisions:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      if (!submitData.user_id) {
        submitData.user_id = `user_${Date.now()}`;
      }
      if (submitData.salary) {
        submitData.salary = parseFloat(submitData.salary);
      }
      if (submitData.holiday_allowance) {
        submitData.holiday_allowance = parseFloat(submitData.holiday_allowance);
      }
      if (submitData.sick_leave_allowance) {
        submitData.sick_leave_allowance = parseFloat(submitData.sick_leave_allowance);
      }

      if (editingEmp) {
        await axios.put(`${API}/employees/${editingEmp.id}`, submitData);
        toast.success('Employee updated successfully');
      } else {
        await axios.post(`${API}/employees`, submitData);
        toast.success('Employee created successfully');
      }
      setDialogOpen(false);
      setEditingEmp(null);
      resetForm();
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to save employee');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await axios.delete(`${API}/employees/${id}`);
        toast.success('Employee deleted');
        fetchEmployees();
      } catch (error) {
        toast.error('Failed to delete employee');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '', employee_id: '', personal_email: '', work_email: '',
      home_address: '', personal_phone: '', work_phone: '',
      emergency_contact_name: '', emergency_contact_relationship: '', emergency_contact_phone: '',
      date_of_birth: '', gender: '', marital_status: '', ssn: '',
      job_title: '', department_id: '', division_id: '', branch_id: '', corporation_id: '',
      work_location: '', reporting_manager_id: '', hire_date: '', employment_status: 'full-time',
      probation_end_date: '', bank_account_number: '', bank_name: '', bank_routing_number: '',
      tax_code: '', salary: '', currency: 'USD', benefits_enrolled: '',
      holiday_allowance: '', sick_leave_allowance: '', working_hours: '40', shift_pattern: 'day',
      certifications: '', professional_memberships: '', skills: '', performance_notes: '',
      visa_status: '', passport_number: '', right_to_work_verified: false, dbs_check_status: '',
      user_id: ''
    });
  };

  const openDialog = (emp = null) => {
    if (emp) {
      setEditingEmp(emp);
      setFormData({
        full_name: emp.full_name || '',
        employee_id: emp.employee_id || '',
        personal_email: emp.personal_email || '',
        work_email: emp.work_email || '',
        home_address: emp.home_address || '',
        personal_phone: emp.personal_phone || '',
        work_phone: emp.work_phone || '',
        emergency_contact_name: emp.emergency_contact_name || '',
        emergency_contact_relationship: emp.emergency_contact_relationship || '',
        emergency_contact_phone: emp.emergency_contact_phone || '',
        date_of_birth: emp.date_of_birth || '',
        gender: emp.gender || '',
        marital_status: emp.marital_status || '',
        ssn: emp.ssn || '',
        job_title: emp.job_title || '',
        department_id: emp.department_id || '',
        division_id: emp.division_id || '',
        branch_id: emp.branch_id || '',
        corporation_id: emp.corporation_id || '',
        work_location: emp.work_location || '',
        reporting_manager_id: emp.reporting_manager_id || '',
        hire_date: emp.hire_date || '',
        employment_status: emp.employment_status || 'full-time',
        probation_end_date: emp.probation_end_date || '',
        bank_account_number: emp.bank_account_number || '',
        bank_name: emp.bank_name || '',
        bank_routing_number: emp.bank_routing_number || '',
        tax_code: emp.tax_code || '',
        salary: emp.salary?.toString() || '',
        currency: emp.currency || 'USD',
        benefits_enrolled: emp.benefits_enrolled || '',
        holiday_allowance: emp.holiday_allowance?.toString() || '',
        sick_leave_allowance: emp.sick_leave_allowance?.toString() || '',
        working_hours: emp.working_hours || '40',
        shift_pattern: emp.shift_pattern || 'day',
        certifications: emp.certifications || '',
        professional_memberships: emp.professional_memberships || '',
        skills: emp.skills || '',
        performance_notes: emp.performance_notes || '',
        visa_status: emp.visa_status || '',
        passport_number: emp.passport_number || '',
        right_to_work_verified: emp.right_to_work_verified || false,
        dbs_check_status: emp.dbs_check_status || '',
        user_id: emp.user_id || ''
      });
    } else {
      setEditingEmp(null);
      resetForm();
    }
    setDialogOpen(true);
  };

  const openViewDialog = (emp) => {
    setViewingEmp(emp);
    setViewDialogOpen(true);
  };

  const getManagerName = (managerId) => {
    if (!managerId || managerId === 'none') return '-';
    const manager = employees.find(emp => emp.id === managerId);
    return manager ? manager.full_name : '-';
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await axios.post(`${API}/employees/${selectedEmpForPassword.id}/reset-password`, {
        new_password: newPassword
      });
      toast.success('Password reset successfully. Employee will be prompted to change it on next login.');
      setPasswordDialogOpen(false);
      setNewPassword('');
      setSelectedEmpForPassword(null);
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  const handleTogglePortalAccess = async (empId, currentStatus) => {
    try {
      await axios.put(`${API}/employees/${empId}/portal-access`, {
        portal_access_enabled: !currentStatus
      });
      toast.success(`Portal access ${!currentStatus ? 'enabled' : 'disabled'}`);
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to update portal access');
    }
  };

  const openPasswordDialog = (emp) => {
    setSelectedEmpForPassword(emp);
    setNewPassword('');
    setPasswordDialogOpen(true);
  };

  return (
    <div data-testid="employees-page">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {t('employees')}
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => openDialog()} 
              data-testid="add-employee-button"
              className="rounded-full bg-indigo-950 text-white hover:bg-indigo-900 shadow-lg hover:shadow-xl"
            >
              <Plus size={20} className="me-2" />
              {t('addNew')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEmp ? t('edit') : t('addNew')} Employee</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} data-testid="employee-form">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="employment">Employment</TabsTrigger>
                  <TabsTrigger value="payroll">Payroll</TabsTrigger>
                  <TabsTrigger value="time">Time & Leave</TabsTrigger>
                  <TabsTrigger value="talent">Talent</TabsTrigger>
                  <TabsTrigger value="compliance">Compliance</TabsTrigger>
                </TabsList>

                {/* Personal & Contact Information */}
                <TabsContent value="personal" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Full Name *</label>
                      <input
                        type="text"
                        data-testid="emp-fullname-input"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Employee ID</label>
                      <input
                        type="text"
                        value={formData.employee_id}
                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Personal Email *</label>
                      <input
                        type="email"
                        data-testid="emp-personal-email-input"
                        value={formData.personal_email}
                        onChange={(e) => setFormData({ ...formData, personal_email: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Work Email</label>
                      <input
                        type="email"
                        value={formData.work_email}
                        onChange={(e) => setFormData({ ...formData, work_email: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Home Address</label>
                      <input
                        type="text"
                        value={formData.home_address}
                        onChange={(e) => setFormData({ ...formData, home_address: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Personal Phone</label>
                      <input
                        type="tel"
                        value={formData.personal_phone}
                        onChange={(e) => setFormData({ ...formData, personal_phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Work Phone</label>
                      <input
                        type="tel"
                        value={formData.work_phone}
                        onChange={(e) => setFormData({ ...formData, work_phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">Emergency Contact</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Name</label>
                      <input
                        type="text"
                        value={formData.emergency_contact_name}
                        onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Relationship</label>
                      <input
                        type="text"
                        value={formData.emergency_contact_relationship}
                        onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Phone</label>
                      <input
                        type="tel"
                        value={formData.emergency_contact_phone}
                        onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">Demographics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Gender</label>
                      <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Marital Status</label>
                      <Select value={formData.marital_status} onValueChange={(value) => setFormData({ ...formData, marital_status: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Status" />
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
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">SSN / National ID</label>
                      <input
                        type="text"
                        value={formData.ssn}
                        onChange={(e) => setFormData({ ...formData, ssn: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Employment & Job Details */}
                <TabsContent value="employment" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Job Title</label>
                      <input
                        type="text"
                        value={formData.job_title}
                        onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Corporation *</label>
                      <Select 
                        value={formData.corporation_id} 
                        onValueChange={(value) => setFormData({ ...formData, corporation_id: value })}
                        required
                      >
                        <SelectTrigger data-testid="emp-corporation-select">
                          <SelectValue placeholder="Select Corporation" />
                        </SelectTrigger>
                        <SelectContent>
                          {corporations.map((corp) => (
                            <SelectItem key={corp.id} value={corp.id}>{corp.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Branch *</label>
                      <Select 
                        value={formData.branch_id} 
                        onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
                        required
                      >
                        <SelectTrigger data-testid="emp-branch-select">
                          <SelectValue placeholder="Select Branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.filter(b => b.corporation_id === formData.corporation_id).map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Department</label>
                      <Select 
                        value={formData.department_id} 
                        onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {departments.filter(d => d.branch_id === formData.branch_id).map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Division</label>
                      <Select 
                        value={formData.division_id} 
                        onValueChange={(value) => setFormData({ ...formData, division_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Division" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {divisions.filter(dv => dv.department_id === formData.department_id).map((div) => (
                            <SelectItem key={div.id} value={div.id}>{div.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Work Location</label>
                      <input
                        type="text"
                        value={formData.work_location}
                        onChange={(e) => setFormData({ ...formData, work_location: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Reporting Manager</label>
                      <Select 
                        value={formData.reporting_manager_id} 
                        onValueChange={(value) => setFormData({ ...formData, reporting_manager_id: value })}
                      >
                        <SelectTrigger data-testid="emp-manager-select">
                          <SelectValue placeholder="Select Manager" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {employees.filter(emp => emp.id !== editingEmp?.id).map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Hire Date</label>
                      <input
                        type="date"
                        value={formData.hire_date}
                        onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Employment Status</label>
                      <Select value={formData.employment_status} onValueChange={(value) => setFormData({ ...formData, employment_status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contractor">Contractor</SelectItem>
                          <SelectItem value="intern">Intern</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Probation End Date</label>
                      <input
                        type="date"
                        value={formData.probation_end_date}
                        onChange={(e) => setFormData({ ...formData, probation_end_date: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Payroll & Benefits */}
                <TabsContent value="payroll" className="space-y-4 mt-4">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Bank Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Bank Name</label>
                      <input
                        type="text"
                        value={formData.bank_name}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Account Number</label>
                      <input
                        type="text"
                        value={formData.bank_account_number}
                        onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Routing Number</label>
                      <input
                        type="text"
                        value={formData.bank_routing_number}
                        onChange={(e) => setFormData({ ...formData, bank_routing_number: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Tax Code</label>
                      <input
                        type="text"
                        value={formData.tax_code}
                        onChange={(e) => setFormData({ ...formData, tax_code: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">Compensation</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Salary</label>
                      <input
                        type="number"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Currency</label>
                      <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AED', 'CNY', 'CAD', 'AUD'].map((curr) => (
                            <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Benefits Enrolled</label>
                      <textarea
                        value={formData.benefits_enrolled}
                        onChange={(e) => setFormData({ ...formData, benefits_enrolled: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                        rows={3}
                        placeholder="Health insurance, 401(k), etc."
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Time, Attendance & Leave */}
                <TabsContent value="time" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Holiday Allowance (days)</label>
                      <input
                        type="number"
                        value={formData.holiday_allowance}
                        onChange={(e) => setFormData({ ...formData, holiday_allowance: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Sick Leave Allowance (days)</label>
                      <input
                        type="number"
                        value={formData.sick_leave_allowance}
                        onChange={(e) => setFormData({ ...formData, sick_leave_allowance: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Working Hours (per week)</label>
                      <input
                        type="number"
                        value={formData.working_hours}
                        onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Shift Pattern</label>
                      <Select value={formData.shift_pattern} onValueChange={(value) => setFormData({ ...formData, shift_pattern: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">Day Shift</SelectItem>
                          <SelectItem value="night">Night Shift</SelectItem>
                          <SelectItem value="rotating">Rotating</SelectItem>
                          <SelectItem value="flexible">Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                {/* Talent & Compliance */}
                <TabsContent value="talent" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Certifications</label>
                      <textarea
                        value={formData.certifications}
                        onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                        rows={2}
                        placeholder="List certifications (comma-separated)"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Professional Memberships</label>
                      <textarea
                        value={formData.professional_memberships}
                        onChange={(e) => setFormData({ ...formData, professional_memberships: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                        rows={2}
                        placeholder="List memberships (comma-separated)"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Skills</label>
                      <textarea
                        value={formData.skills}
                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                        rows={2}
                        placeholder="List skills (comma-separated)"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Performance Notes</label>
                      <textarea
                        value={formData.performance_notes}
                        onChange={(e) => setFormData({ ...formData, performance_notes: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                        rows={3}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Compliance */}
                <TabsContent value="compliance" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Visa Status</label>
                      <input
                        type="text"
                        value={formData.visa_status}
                        onChange={(e) => setFormData({ ...formData, visa_status: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Passport Number</label>
                      <input
                        type="text"
                        value={formData.passport_number}
                        onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">DBS Check Status</label>
                      <Select value={formData.dbs_check_status} onValueChange={(value) => setFormData({ ...formData, dbs_check_status: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="cleared">Cleared</SelectItem>
                          <SelectItem value="not-required">Not Required</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center pt-8">
                      <input
                        type="checkbox"
                        checked={formData.right_to_work_verified}
                        onChange={(e) => setFormData({ ...formData, right_to_work_verified: e.target.checked })}
                        className="w-4 h-4 text-indigo-950 rounded focus:ring-indigo-500"
                      />
                      <label className="ms-2 text-sm font-medium text-slate-700">Right to Work Verified</label>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 mt-6 pt-4 border-t">
                <Button type="submit" data-testid="emp-submit-button" className="rounded-full bg-indigo-950 hover:bg-indigo-900">
                  {t('save')}
                </Button>
                <Button type="button" onClick={() => setDialogOpen(false)} variant="outline" className="rounded-full">
                  {t('cancel')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Employee List Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="employees-table">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Employee ID</th>
                <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">{t('name')}</th>
                <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Job Title</th>
                <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Manager</th>
                <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">{t('email')}</th>
                <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Portal Access</th>
                <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Status</th>
                <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors" data-testid={`emp-row-${emp.id}`}>
                  <td className="px-6 py-4 text-slate-600">{emp.employee_id || '-'}</td>
                  <td className="px-6 py-4 text-slate-900 font-medium">{emp.full_name}</td>
                  <td className="px-6 py-4 text-slate-600">{emp.job_title || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{getManagerName(emp.reporting_manager_id)}</td>
                  <td className="px-6 py-4 text-slate-600">{emp.personal_email}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleTogglePortalAccess(emp.id, emp.portal_access_enabled)}
                      data-testid={`toggle-access-${emp.id}`}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        emp.portal_access_enabled !== false
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                      title={emp.portal_access_enabled !== false ? 'Click to disable' : 'Click to enable'}
                    >
                      {emp.portal_access_enabled !== false ? (
                        <>
                          <Unlock size={14} />
                          <span>Enabled</span>
                        </>
                      ) : (
                        <>
                          <Lock size={14} />
                          <span>Disabled</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      emp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openPasswordDialog(emp)}
                        data-testid={`reset-password-${emp.id}`}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Reset Password"
                      >
                        <Key size={16} />
                      </button>
                      <button
                        onClick={() => openViewDialog(emp)}
                        data-testid={`view-emp-${emp.id}`}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => openDialog(emp)}
                        data-testid={`edit-emp-${emp.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        data-testid={`delete-emp-${emp.id}`}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Employee Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {viewingEmp && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Full Name</p>
                  <p className="font-medium text-slate-900">{viewingEmp.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Employee ID</p>
                  <p className="font-medium text-slate-900">{viewingEmp.employee_id || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Job Title</p>
                  <p className="font-medium text-slate-900">{viewingEmp.job_title || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Reporting Manager</p>
                  <p className="font-medium text-slate-900">{getManagerName(viewingEmp.reporting_manager_id)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Employment Status</p>
                  <p className="font-medium text-slate-900">{viewingEmp.employment_status || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Personal Email</p>
                  <p className="font-medium text-slate-900">{viewingEmp.personal_email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Personal Phone</p>
                  <p className="font-medium text-slate-900">{viewingEmp.personal_phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Hire Date</p>
                  <p className="font-medium text-slate-900">{viewingEmp.hire_date || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Salary</p>
                  <p className="font-medium text-slate-900">
                    {viewingEmp.salary ? formatCurrency(viewingEmp.salary, viewingEmp.currency) : '-'}
                  </p>
                </div>
              </div>
              
              {viewingEmp.emergency_contact_name && (
                <div className="border-t pt-4">
                  <h3 className="font-bold text-slate-900 mb-2">Emergency Contact</h3>
                  <p>{viewingEmp.emergency_contact_name} ({viewingEmp.emergency_contact_relationship})</p>
                  <p>{viewingEmp.emergency_contact_phone}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          {selectedEmpForPassword && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Employee:</strong> {selectedEmpForPassword.full_name}
                </p>
                <p className="text-sm text-blue-900">
                  <strong>Email:</strong> {selectedEmpForPassword.personal_email}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  New Password (minimum 6 characters)
                </label>
                <input
                  type="password"
                  data-testid="new-password-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                  placeholder="Enter new password"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-900">
                  ⚠️ The employee will be prompted to change this password on their next login.
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleResetPassword} 
                  data-testid="confirm-reset-button"
                  className="rounded-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Key size={16} className="me-2" />
                  Reset Password
                </Button>
                <Button 
                  type="button" 
                  onClick={() => {
                    setPasswordDialogOpen(false);
                    setNewPassword('');
                  }} 
                  variant="outline" 
                  className="rounded-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeesNew;
