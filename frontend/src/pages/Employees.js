import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Employees = () => {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  const { token } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [corporations, setCorporations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [importStep, setImportStep] = useState('upload'); // upload, preview, results
  const [csvData, setCsvData] = useState([]);
  const [importResults, setImportResults] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({ 
    full_name: '', 
    email: '',
    phone: '',
    position: '',
    branch_id: '',
    corporation_id: '',
    department_id: '',
    division_id: '',
    salary: '',
    currency: 'USD',
    hire_date: '',
    user_id: ''
  });

  useEffect(() => {
    fetchEmployees();
    fetchCorporations();
    fetchBranches();
    fetchDepartments();
    fetchDivisions();
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

      if (editingEmp) {
        await axios.put(`${API}/employees/${editingEmp.id}`, submitData);
        toast.success('Employee updated successfully');
      } else {
        await axios.post(`${API}/employees`, submitData);
        toast.success('Employee created successfully');
      }
      setDialogOpen(false);
      setEditingEmp(null);
      setFormData({ 
        full_name: '', email: '', phone: '', position: '', 
        branch_id: '', corporation_id: '', department_id: '', division_id: '',
        salary: '', currency: 'USD', hire_date: '', user_id: '' 
      });
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to save employee');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await axios.delete(`${API}/employees/${id}`);
        toast.success('Employee deleted');
        fetchEmployees();
      } catch (error) {
        toast.error('Failed to delete employee');
      }
    }
  };

  const openDialog = (emp = null) => {
    if (emp) {
      setEditingEmp(emp);
      setFormData({ 
        full_name: emp.full_name,
        email: emp.email,
        phone: emp.phone || '',
        position: emp.position || '',
        branch_id: emp.branch_id,
        corporation_id: emp.corporation_id,
        department_id: emp.department_id || '',
        division_id: emp.division_id || '',
        salary: emp.salary?.toString() || '',
        currency: emp.currency || 'USD',
        hire_date: emp.hire_date || '',
        user_id: emp.user_id
      });
    } else {
      setEditingEmp(null);
      setFormData({ 
        full_name: '', email: '', phone: '', position: '', 
        branch_id: '', corporation_id: '', department_id: '', division_id: '',
        salary: '', currency: 'USD', hire_date: '', user_id: '' 
      });
    }
    setDialogOpen(true);
  };

  // ===== BULK IMPORT FUNCTIONS =====
  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx];
        });
        data.push(row);
      }
    }
    return data;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast.error('Could not parse CSV file. Make sure it has headers and data.');
        return;
      }
      setCsvData(parsed);
      setImportStep('preview');
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const template = `email,full_name,job_title,phone,department_id,hire_date
john.doe@example.com,John Doe,Software Engineer,+1234567890,,2024-01-15
jane.smith@example.com,Jane Smith,Product Manager,+0987654321,,2024-02-01`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  const handleBulkImport = async () => {
    if (csvData.length === 0) {
      toast.error('No data to import');
      return;
    }

    setImporting(true);
    try {
      const response = await axios.post(
        `${API}/employees/bulk-import`,
        { employees: csvData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setImportResults(response.data);
      setImportStep('results');
      if (response.data.success > 0) {
        fetchEmployees();
        toast.success(`Successfully imported ${response.data.success} employees`);
      }
    } catch (error) {
      toast.error('Import failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setImporting(false);
    }
  };

  const resetBulkImport = () => {
    setCsvData([]);
    setImportResults(null);
    setImportStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const copyTempPassword = (password) => {
    navigator.clipboard.writeText(password);
    toast.success('Password copied to clipboard');
  };

  return (
    <div data-testid="employees-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {t('employees')}
        </h1>
        <div className="flex items-center gap-2">
          {/* Bulk Import Button */}
          <Button
            onClick={() => setBulkImportOpen(true)}
            variant="outline"
            className="rounded-full"
            data-testid="bulk-import-button"
          >
            <Upload size={18} className="mr-2" />
            Bulk Import
          </Button>
          
          {/* Add Employee Button */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => openDialog()} 
                data-testid="add-employee-button"
                className="rounded-full bg-[#2D4F38] text-white hover:bg-[#1F3A29] shadow-lg hover:shadow-xl"
              >
                <Plus size={20} className="me-2" />
                {t('addNew')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingEmp ? t('edit') : t('addNew')} {t('employees')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4" data-testid="employee-form">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">{t('fullName')}</label>
                    <input
                      type="text"
                      data-testid="emp-fullname-input"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#2D4F38]/20 focus:border-[#2D4F38] transition-all duration-200 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">{t('email')}</label>
                    <input
                      type="email"
                      data-testid="emp-email-input"
                      value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">{t('phone')}</label>
                  <input
                    type="text"
                    data-testid="emp-phone-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Position</label>
                  <input
                    type="text"
                    data-testid="emp-position-input"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Corporation</label>
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
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Branch</label>
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
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Department (Optional)</label>
                  <Select 
                    value={formData.department_id} 
                    onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                  >
                    <SelectTrigger data-testid="emp-department-select">
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
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Division (Optional)</label>
                  <Select 
                    value={formData.division_id} 
                    onValueChange={(value) => setFormData({ ...formData, division_id: value })}
                  >
                    <SelectTrigger data-testid="emp-division-select">
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
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Salary</label>
                  <input
                    type="number"
                    data-testid="emp-salary-input"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Currency</label>
                  <Select 
                    value={formData.currency} 
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger data-testid="emp-currency-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AED', 'CNY', 'CAD', 'AUD'].map((curr) => (
                        <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Hire Date</label>
                  <input
                    type="date"
                    data-testid="emp-hiredate-input"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2">
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

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="employees-table">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">{t('name')}</th>
                <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">{t('email')}</th>
                <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Position</th>
                <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Salary</th>
                <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors" data-testid={`emp-row-${emp.id}`}>
                  <td className="px-6 py-4 text-slate-900 font-medium">{emp.full_name}</td>
                  <td className="px-6 py-4 text-slate-600">{emp.email}</td>
                  <td className="px-6 py-4 text-slate-600">{emp.position || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {emp.salary ? formatCurrency(emp.salary, emp.currency) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
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
    </div>
  );
};

export default Employees;
