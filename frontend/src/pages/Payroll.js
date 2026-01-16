import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  DollarSign, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2,
  Check,
  Clock,
  Users,
  Calendar,
  FileText,
  Download,
  RefreshCw,
  Search,
  Filter,
  CreditCard,
  Wallet,
  TrendingUp,
  Building2,
  Send,
  CheckCircle2,
  XCircle,
  Banknote,
  Receipt,
  Play,
  CircleDollarSign,
  PiggyBank
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PAY_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'bi_weekly', label: 'Bi-Weekly' },
  { value: 'weekly', label: 'Weekly' },
];

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'cash', label: 'Cash' },
];

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700', icon: FileText },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700', icon: RefreshCw },
  approved: { label: 'Approved', color: 'bg-amber-100 text-amber-700', icon: CheckCircle2 },
  paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700', icon: Check },
  cancelled: { label: 'Cancelled', color: 'bg-rose-100 text-rose-700', icon: XCircle },
};

const Payroll = () => {
  const { user } = useAuth();
  const { formatCurrency: formatCurrencyGlobal } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('payslips');
  const [stats, setStats] = useState(null);
  
  // Data
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [myPayslips, setMyPayslips] = useState([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  
  // Dialogs
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [payslipDialogOpen, setPayslipDialogOpen] = useState(false);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [viewPayslipDialogOpen, setViewPayslipDialogOpen] = useState(false);
  
  // Selected items
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [editingSalary, setEditingSalary] = useState(null);
  
  // Forms
  const [salaryForm, setSalaryForm] = useState({
    employee_id: '',
    basic_salary: '',
    currency: 'USD',
    pay_frequency: 'monthly',
    housing_allowance: '',
    transport_allowance: '',
    meal_allowance: '',
    phone_allowance: '',
    other_allowances: '',
    tax_rate: '',
    social_security: '',
    health_insurance: '',
    pension_contribution: '',
    other_deductions: '',
    bank_name: '',
    bank_account_number: '',
    payment_method: 'bank_transfer',
  });
  
  const [runForm, setRunForm] = useState({
    name: '',
    pay_period: '',
    pay_period_start: '',
    pay_period_end: '',
    payment_date: '',
  });

  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/payroll/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  const fetchSalaryStructures = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/payroll/salary-structures`);
      setSalaryStructures(response.data);
    } catch (error) {
      console.error('Failed to fetch salary structures:', error);
    }
  }, []);

  const fetchPayslips = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/payroll/payslips`);
      setPayslips(response.data);
    } catch (error) {
      console.error('Failed to fetch payslips:', error);
    }
  }, []);

  const fetchMyPayslips = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/payroll/payslips/my`);
      setMyPayslips(response.data);
    } catch (error) {
      console.error('Failed to fetch my payslips:', error);
    }
  }, []);

  const fetchPayrollRuns = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/payroll/runs`);
      setPayrollRuns(response.data);
    } catch (error) {
      console.error('Failed to fetch payroll runs:', error);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchSalaryStructures(),
        fetchPayslips(),
        fetchPayrollRuns(),
        fetchEmployees(),
        fetchMyPayslips(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchSalaryStructures, fetchPayslips, fetchPayrollRuns, fetchEmployees, fetchMyPayslips]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter payslips
  const filteredPayslips = (isAdmin ? payslips : myPayslips).filter(payslip => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = payslip.employee_name?.toLowerCase().includes(query);
      const emailMatch = payslip.employee_email?.toLowerCase().includes(query);
      if (!nameMatch && !emailMatch) return false;
    }
    if (statusFilter !== 'all' && payslip.status !== statusFilter) return false;
    if (periodFilter !== 'all' && payslip.pay_period !== periodFilter) return false;
    return true;
  });

  // Get unique pay periods for filter
  const payPeriods = [...new Set(payslips.map(p => p.pay_period))].sort().reverse();

  const handleSaveSalary = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...salaryForm,
        basic_salary: parseFloat(salaryForm.basic_salary) || 0,
        housing_allowance: parseFloat(salaryForm.housing_allowance) || 0,
        transport_allowance: parseFloat(salaryForm.transport_allowance) || 0,
        meal_allowance: parseFloat(salaryForm.meal_allowance) || 0,
        phone_allowance: parseFloat(salaryForm.phone_allowance) || 0,
        other_allowances: parseFloat(salaryForm.other_allowances) || 0,
        tax_rate: parseFloat(salaryForm.tax_rate) || 0,
        social_security: parseFloat(salaryForm.social_security) || 0,
        health_insurance: parseFloat(salaryForm.health_insurance) || 0,
        pension_contribution: parseFloat(salaryForm.pension_contribution) || 0,
        other_deductions: parseFloat(salaryForm.other_deductions) || 0,
      };
      
      if (editingSalary) {
        await axios.put(`${API}/payroll/salary-structures/${editingSalary.id}`, data);
        toast.success('Salary structure updated');
      } else {
        await axios.post(`${API}/payroll/salary-structures`, data);
        toast.success('Salary structure created');
      }
      fetchSalaryStructures();
      fetchStats();
      setSalaryDialogOpen(false);
      resetSalaryForm();
    } catch (error) {
      toast.error('Failed to save salary structure');
    }
  };

  const handleDeleteSalary = async (structureId) => {
    if (!window.confirm('Delete this salary structure?')) return;
    try {
      await axios.delete(`${API}/payroll/salary-structures/${structureId}`);
      toast.success('Salary structure deleted');
      fetchSalaryStructures();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete salary structure');
    }
  };

  const handleCreateRun = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/payroll/runs`, runForm);
      toast.success('Payroll run created');
      fetchPayrollRuns();
      setRunDialogOpen(false);
      resetRunForm();
      
      // Ask to generate payslips
      if (window.confirm('Generate payslips for all employees now?')) {
        await handleGeneratePayroll(response.data.id);
      }
    } catch (error) {
      toast.error('Failed to create payroll run');
    }
  };

  const handleGeneratePayroll = async (runId) => {
    try {
      const response = await axios.post(`${API}/payroll/runs/${runId}/generate`);
      toast.success(response.data.message);
      fetchPayslips();
      fetchPayrollRuns();
      fetchStats();
    } catch (error) {
      toast.error('Failed to generate payroll');
    }
  };

  const handleApproveAll = async (runId) => {
    if (!window.confirm('Approve all payslips in this run?')) return;
    try {
      const response = await axios.post(`${API}/payroll/runs/${runId}/approve-all`);
      toast.success(response.data.message);
      fetchPayslips();
      fetchPayrollRuns();
    } catch (error) {
      toast.error('Failed to approve payslips');
    }
  };

  const handleMarkAllPaid = async (runId) => {
    if (!window.confirm('Mark all approved payslips as paid?')) return;
    try {
      const response = await axios.post(`${API}/payroll/runs/${runId}/mark-paid`);
      toast.success(response.data.message);
      fetchPayslips();
      fetchPayrollRuns();
      fetchStats();
    } catch (error) {
      toast.error('Failed to mark payslips as paid');
    }
  };

  const handleDeleteRun = async (runId) => {
    if (!window.confirm('Delete this payroll run and all its payslips?')) return;
    try {
      await axios.delete(`${API}/payroll/runs/${runId}`);
      toast.success('Payroll run deleted');
      fetchPayrollRuns();
      fetchPayslips();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete payroll run');
    }
  };

  const handleApprovePayslip = async (payslipId) => {
    try {
      await axios.post(`${API}/payroll/payslips/${payslipId}/approve`);
      toast.success('Payslip approved');
      fetchPayslips();
    } catch (error) {
      toast.error('Failed to approve payslip');
    }
  };

  const handleMarkPaid = async (payslipId) => {
    try {
      await axios.post(`${API}/payroll/payslips/${payslipId}/mark-paid`, {});
      toast.success('Payslip marked as paid');
      fetchPayslips();
      fetchStats();
    } catch (error) {
      toast.error('Failed to mark payslip as paid');
    }
  };

  const resetSalaryForm = () => {
    setSalaryForm({
      employee_id: '',
      basic_salary: '',
      currency: 'USD',
      pay_frequency: 'monthly',
      housing_allowance: '',
      transport_allowance: '',
      meal_allowance: '',
      phone_allowance: '',
      other_allowances: '',
      tax_rate: '',
      social_security: '',
      health_insurance: '',
      pension_contribution: '',
      other_deductions: '',
      bank_name: '',
      bank_account_number: '',
      payment_method: 'bank_transfer',
    });
    setEditingSalary(null);
  };

  const resetRunForm = () => {
    setRunForm({
      name: '',
      pay_period: '',
      pay_period_start: '',
      pay_period_end: '',
      payment_date: '',
    });
  };

  // Use global formatCurrency from CurrencyContext
  const formatCurrency = (amount) => {
    return formatCurrencyGlobal(amount);
  };

  const getEmployeeName = (emp) => {
    if (!emp) return 'Unknown';
    const first = emp.first_name || '';
    const last = emp.last_name || '';
    const name = `${first} ${last}`.trim();
    if (name) return name;
    const email = emp.work_email || emp.personal_email || '';
    return email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="payroll-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isAdmin ? 'Payroll Management' : 'My Payslips'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isAdmin ? 'Manage salaries, payslips, and payroll runs' : 'View your salary and payment history'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" className="rounded-xl">
            <RefreshCw size={18} />
          </Button>
          {isAdmin && (
            <>
              <Button 
                onClick={() => { resetRunForm(); setRunDialogOpen(true); }}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
              >
                <Play size={18} className="mr-2" />
                New Payroll Run
              </Button>
              <Button 
                onClick={() => { resetSalaryForm(); setSalaryDialogOpen(true); }}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus size={18} className="mr-2" />
                Add Salary
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm">Employees</p>
              <p className="text-2xl font-bold">{stats?.total_salary_structures || 0}</p>
            </div>
            <Users size={24} className="text-indigo-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Total Payslips</p>
              <p className="text-2xl font-bold">{stats?.total_payslips || 0}</p>
            </div>
            <Receipt size={24} className="text-emerald-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Paid</p>
              <p className="text-2xl font-bold">{stats?.paid_payslips || 0}</p>
            </div>
            <CheckCircle2 size={24} className="text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Pending</p>
              <p className="text-2xl font-bold">{stats?.pending_payslips || 0}</p>
            </div>
            <Clock size={24} className="text-amber-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">This Month</p>
              <p className="text-xl font-bold">{formatCurrency(stats?.total_paid_this_month || 0)}</p>
            </div>
            <Wallet size={24} className="text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-sm">YTD Total</p>
              <p className="text-xl font-bold">{formatCurrency(stats?.total_paid_ytd || 0)}</p>
            </div>
            <TrendingUp size={24} className="text-rose-200" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
          <TabsTrigger value="payslips" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Receipt size={16} className="mr-2" />
            {isAdmin ? 'All Payslips' : 'My Payslips'}
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="salaries" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                <DollarSign size={16} className="mr-2" />
                Salary Structures
              </TabsTrigger>
              <TabsTrigger value="runs" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                <Play size={16} className="mr-2" />
                Payroll Runs
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Payslips Tab */}
        <TabsContent value="payslips" className="mt-4">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {payPeriods.length > 0 && (
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="w-full sm:w-40 rounded-xl">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Periods</SelectItem>
                    {payPeriods.map((period) => (
                      <SelectItem key={period} value={period}>{period}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {filteredPayslips.length === 0 ? (
              <div className="p-12 text-center">
                <Receipt size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">
                  {searchQuery || statusFilter !== 'all' ? 'No payslips match your filters' : 'No payslips found'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 text-left text-sm text-slate-600">
                      <th className="px-4 py-3 font-medium">Employee</th>
                      <th className="px-4 py-3 font-medium">Period</th>
                      <th className="px-4 py-3 font-medium text-right">Gross</th>
                      <th className="px-4 py-3 font-medium text-right">Deductions</th>
                      <th className="px-4 py-3 font-medium text-right">Net Pay</th>
                      <th className="px-4 py-3 font-medium text-center">Status</th>
                      <th className="px-4 py-3 font-medium text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayslips.map((payslip) => {
                      const statusConfig = STATUS_CONFIG[payslip.status] || STATUS_CONFIG.draft;
                      return (
                        <tr key={payslip.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-slate-900">{payslip.employee_name || 'Unknown'}</p>
                              <p className="text-xs text-slate-400">{payslip.department}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-700">{payslip.pay_period}</p>
                            <p className="text-xs text-slate-400">{payslip.payment_date}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-900">
                            {formatCurrency(payslip.gross_salary, payslip.currency)}
                          </td>
                          <td className="px-4 py-3 text-right text-rose-600">
                            -{formatCurrency(payslip.total_deductions, payslip.currency)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600">
                            {formatCurrency(payslip.net_salary, payslip.currency)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="rounded-lg"
                                onClick={() => { setSelectedPayslip(payslip); setViewPayslipDialogOpen(true); }}
                              >
                                <Eye size={16} />
                              </Button>
                              {isAdmin && payslip.status === 'draft' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="rounded-lg text-amber-600"
                                  onClick={() => handleApprovePayslip(payslip.id)}
                                >
                                  <CheckCircle2 size={16} />
                                </Button>
                              )}
                              {isAdmin && payslip.status === 'approved' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="rounded-lg text-emerald-600"
                                  onClick={() => handleMarkPaid(payslip.id)}
                                >
                                  <Banknote size={16} />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {filteredPayslips.length > 0 && (
            <p className="text-sm text-slate-500 mt-2">
              Showing {filteredPayslips.length} payslip(s)
            </p>
          )}
        </TabsContent>

        {/* Salary Structures Tab (Admin) */}
        {isAdmin && (
          <TabsContent value="salaries" className="mt-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {salaryStructures.length === 0 ? (
                <div className="p-12 text-center">
                  <DollarSign size={48} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 mb-2">No salary structures defined yet</p>
                  <Button 
                    onClick={() => setSalaryDialogOpen(true)}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Add First Salary Structure
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 text-left text-sm text-slate-600">
                        <th className="px-4 py-3 font-medium">Employee</th>
                        <th className="px-4 py-3 font-medium text-right">Basic Salary</th>
                        <th className="px-4 py-3 font-medium text-right">Allowances</th>
                        <th className="px-4 py-3 font-medium text-right">Deductions</th>
                        <th className="px-4 py-3 font-medium text-center">Frequency</th>
                        <th className="px-4 py-3 font-medium text-center">Status</th>
                        <th className="px-4 py-3 font-medium text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {salaryStructures.map((structure) => {
                        const totalAllowances = (structure.housing_allowance || 0) + 
                          (structure.transport_allowance || 0) + (structure.meal_allowance || 0) +
                          (structure.phone_allowance || 0) + (structure.other_allowances || 0);
                        const totalDeductions = (structure.social_security || 0) + 
                          (structure.health_insurance || 0) + (structure.pension_contribution || 0) +
                          (structure.other_deductions || 0);
                        
                        return (
                          <tr key={structure.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-slate-900">{structure.employee_name || 'Unknown'}</p>
                                <p className="text-xs text-slate-400">{structure.employee_email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-slate-900">
                              {formatCurrency(structure.basic_salary, structure.currency)}
                            </td>
                            <td className="px-4 py-3 text-right text-emerald-600">
                              +{formatCurrency(totalAllowances, structure.currency)}
                            </td>
                            <td className="px-4 py-3 text-right text-rose-600">
                              -{formatCurrency(totalDeductions, structure.currency)}
                              {structure.tax_rate > 0 && (
                                <span className="text-xs text-slate-400 block">+{structure.tax_rate}% tax</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700 capitalize">
                                {structure.pay_frequency?.replace('_', '-')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                structure.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {structure.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-center gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="rounded-lg"
                                  onClick={() => {
                                    setEditingSalary(structure);
                                    setSalaryForm({
                                      employee_id: structure.employee_id,
                                      basic_salary: structure.basic_salary?.toString() || '',
                                      currency: structure.currency || 'USD',
                                      pay_frequency: structure.pay_frequency || 'monthly',
                                      housing_allowance: structure.housing_allowance?.toString() || '',
                                      transport_allowance: structure.transport_allowance?.toString() || '',
                                      meal_allowance: structure.meal_allowance?.toString() || '',
                                      phone_allowance: structure.phone_allowance?.toString() || '',
                                      other_allowances: structure.other_allowances?.toString() || '',
                                      tax_rate: structure.tax_rate?.toString() || '',
                                      social_security: structure.social_security?.toString() || '',
                                      health_insurance: structure.health_insurance?.toString() || '',
                                      pension_contribution: structure.pension_contribution?.toString() || '',
                                      other_deductions: structure.other_deductions?.toString() || '',
                                      bank_name: structure.bank_name || '',
                                      bank_account_number: structure.bank_account_number || '',
                                      payment_method: structure.payment_method || 'bank_transfer',
                                    });
                                    setSalaryDialogOpen(true);
                                  }}
                                >
                                  <Edit2 size={16} />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="rounded-lg text-rose-600"
                                  onClick={() => handleDeleteSalary(structure.id)}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {/* Payroll Runs Tab (Admin) */}
        {isAdmin && (
          <TabsContent value="runs" className="mt-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {payrollRuns.length === 0 ? (
                <div className="p-12 text-center">
                  <Play size={48} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 mb-2">No payroll runs created yet</p>
                  <Button 
                    onClick={() => setRunDialogOpen(true)}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Create First Payroll Run
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {payrollRuns.map((run) => {
                    const statusConfig = STATUS_CONFIG[run.status] || STATUS_CONFIG.draft;
                    return (
                      <div key={run.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-slate-900">{run.name}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                {statusConfig.label}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600">
                              Period: {run.pay_period} ({run.pay_period_start} to {run.pay_period_end})
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="text-slate-500">
                                <Users size={14} className="inline mr-1" />
                                {run.total_employees} employees
                              </span>
                              <span className="text-emerald-600 font-medium">
                                Net: {formatCurrency(run.total_net, run.currency)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {run.status === 'draft' && (
                              <Button 
                                size="sm" 
                                className="rounded-lg bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleGeneratePayroll(run.id)}
                              >
                                <RefreshCw size={14} className="mr-1" />
                                Generate
                              </Button>
                            )}
                            {run.status === 'processing' && (
                              <Button 
                                size="sm" 
                                className="rounded-lg bg-amber-600 hover:bg-amber-700"
                                onClick={() => handleApproveAll(run.id)}
                              >
                                <CheckCircle2 size={14} className="mr-1" />
                                Approve All
                              </Button>
                            )}
                            {run.status === 'approved' && (
                              <Button 
                                size="sm" 
                                className="rounded-lg bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => handleMarkAllPaid(run.id)}
                              >
                                <Banknote size={14} className="mr-1" />
                                Mark All Paid
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="rounded-lg text-rose-600"
                              onClick={() => handleDeleteRun(run.id)}
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
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Add/Edit Salary Structure Dialog */}
      <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <DollarSign className="text-indigo-600" size={24} />
              {editingSalary ? 'Edit Salary Structure' : 'Add Salary Structure'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSalary} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Employee *</label>
              <Select 
                value={salaryForm.employee_id} 
                onValueChange={(v) => setSalaryForm({ ...salaryForm, employee_id: v })}
                disabled={!!editingSalary}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {getEmployeeName(emp)} - {emp.work_email || emp.personal_email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Basic Salary *</label>
                <Input 
                  type="number"
                  value={salaryForm.basic_salary} 
                  onChange={(e) => setSalaryForm({ ...salaryForm, basic_salary: e.target.value })} 
                  className="rounded-xl" 
                  placeholder="0.00"
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Pay Frequency</label>
                <Select value={salaryForm.pay_frequency} onValueChange={(v) => setSalaryForm({ ...salaryForm, pay_frequency: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAY_FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Allowances Section */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <h4 className="font-medium text-emerald-800 mb-3 flex items-center gap-2">
                <PiggyBank size={18} />
                Allowances
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-emerald-700 mb-1 block">Housing</label>
                  <Input 
                    type="number"
                    value={salaryForm.housing_allowance} 
                    onChange={(e) => setSalaryForm({ ...salaryForm, housing_allowance: e.target.value })} 
                    className="rounded-lg"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-xs text-emerald-700 mb-1 block">Transport</label>
                  <Input 
                    type="number"
                    value={salaryForm.transport_allowance} 
                    onChange={(e) => setSalaryForm({ ...salaryForm, transport_allowance: e.target.value })} 
                    className="rounded-lg"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-xs text-emerald-700 mb-1 block">Meal</label>
                  <Input 
                    type="number"
                    value={salaryForm.meal_allowance} 
                    onChange={(e) => setSalaryForm({ ...salaryForm, meal_allowance: e.target.value })} 
                    className="rounded-lg"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-xs text-emerald-700 mb-1 block">Phone</label>
                  <Input 
                    type="number"
                    value={salaryForm.phone_allowance} 
                    onChange={(e) => setSalaryForm({ ...salaryForm, phone_allowance: e.target.value })} 
                    className="rounded-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Deductions Section */}
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
              <h4 className="font-medium text-rose-800 mb-3 flex items-center gap-2">
                <CircleDollarSign size={18} />
                Deductions
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-rose-700 mb-1 block">Tax Rate (%)</label>
                  <Input 
                    type="number"
                    value={salaryForm.tax_rate} 
                    onChange={(e) => setSalaryForm({ ...salaryForm, tax_rate: e.target.value })} 
                    className="rounded-lg"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-rose-700 mb-1 block">Social Security</label>
                  <Input 
                    type="number"
                    value={salaryForm.social_security} 
                    onChange={(e) => setSalaryForm({ ...salaryForm, social_security: e.target.value })} 
                    className="rounded-lg"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-xs text-rose-700 mb-1 block">Health Insurance</label>
                  <Input 
                    type="number"
                    value={salaryForm.health_insurance} 
                    onChange={(e) => setSalaryForm({ ...salaryForm, health_insurance: e.target.value })} 
                    className="rounded-lg"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-xs text-rose-700 mb-1 block">Pension</label>
                  <Input 
                    type="number"
                    value={salaryForm.pension_contribution} 
                    onChange={(e) => setSalaryForm({ ...salaryForm, pension_contribution: e.target.value })} 
                    className="rounded-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                <Building2 size={18} />
                Bank Details
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-700 mb-1 block">Bank Name</label>
                  <Input 
                    value={salaryForm.bank_name} 
                    onChange={(e) => setSalaryForm({ ...salaryForm, bank_name: e.target.value })} 
                    className="rounded-lg"
                    placeholder="Bank name"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 mb-1 block">Account Number</label>
                  <Input 
                    value={salaryForm.bank_account_number} 
                    onChange={(e) => setSalaryForm({ ...salaryForm, bank_account_number: e.target.value })} 
                    className="rounded-lg"
                    placeholder="Account number"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs text-slate-700 mb-1 block">Payment Method</label>
                <Select value={salaryForm.payment_method} onValueChange={(v) => setSalaryForm({ ...salaryForm, payment_method: v })}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1">
                {editingSalary ? 'Update' : 'Create'} Salary Structure
              </Button>
              <Button type="button" onClick={() => { setSalaryDialogOpen(false); resetSalaryForm(); }} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Payroll Run Dialog */}
      <Dialog open={runDialogOpen} onOpenChange={setRunDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Play className="text-emerald-600" size={24} />
              Create Payroll Run
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRun} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Run Name *</label>
              <Input 
                value={runForm.name} 
                onChange={(e) => setRunForm({ ...runForm, name: e.target.value })} 
                className="rounded-xl"
                placeholder="e.g., January 2025 Payroll"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Pay Period *</label>
              <Input 
                value={runForm.pay_period} 
                onChange={(e) => setRunForm({ ...runForm, pay_period: e.target.value })} 
                className="rounded-xl"
                placeholder="e.g., 2025-01"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Period Start *</label>
                <Input 
                  type="date"
                  value={runForm.pay_period_start} 
                  onChange={(e) => setRunForm({ ...runForm, pay_period_start: e.target.value })} 
                  className="rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Period End *</label>
                <Input 
                  type="date"
                  value={runForm.pay_period_end} 
                  onChange={(e) => setRunForm({ ...runForm, pay_period_end: e.target.value })} 
                  className="rounded-xl"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Payment Date *</label>
              <Input 
                type="date"
                value={runForm.payment_date} 
                onChange={(e) => setRunForm({ ...runForm, payment_date: e.target.value })} 
                className="rounded-xl"
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 flex-1">
                Create Payroll Run
              </Button>
              <Button type="button" onClick={() => setRunDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Payslip Dialog */}
      <Dialog open={viewPayslipDialogOpen} onOpenChange={setViewPayslipDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Receipt className="text-indigo-600" size={24} />
              Payslip Details
            </DialogTitle>
          </DialogHeader>
          {selectedPayslip && (
            <div className="space-y-4 mt-4">
              {/* Header */}
              <div className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{selectedPayslip.employee_name}</h3>
                    <p className="text-indigo-100 text-sm">{selectedPayslip.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-indigo-100">Pay Period</p>
                    <p className="font-bold">{selectedPayslip.pay_period}</p>
                  </div>
                </div>
              </div>

              {/* Earnings */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <h4 className="font-medium text-emerald-800 mb-3">Earnings</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Basic Salary</span>
                    <span className="font-medium">{formatCurrency(selectedPayslip.basic_salary)}</span>
                  </div>
                  {selectedPayslip.housing_allowance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Housing Allowance</span>
                      <span className="font-medium">{formatCurrency(selectedPayslip.housing_allowance)}</span>
                    </div>
                  )}
                  {selectedPayslip.transport_allowance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Transport Allowance</span>
                      <span className="font-medium">{formatCurrency(selectedPayslip.transport_allowance)}</span>
                    </div>
                  )}
                  {selectedPayslip.meal_allowance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Meal Allowance</span>
                      <span className="font-medium">{formatCurrency(selectedPayslip.meal_allowance)}</span>
                    </div>
                  )}
                  {selectedPayslip.bonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Bonus</span>
                      <span className="font-medium">{formatCurrency(selectedPayslip.bonus)}</span>
                    </div>
                  )}
                  {selectedPayslip.overtime_pay > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Overtime</span>
                      <span className="font-medium">{formatCurrency(selectedPayslip.overtime_pay)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-emerald-200">
                    <span className="font-medium text-emerald-800">Gross Salary</span>
                    <span className="font-bold text-emerald-700">{formatCurrency(selectedPayslip.gross_salary)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                <h4 className="font-medium text-rose-800 mb-3">Deductions</h4>
                <div className="space-y-2 text-sm">
                  {selectedPayslip.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Income Tax</span>
                      <span className="font-medium text-rose-600">-{formatCurrency(selectedPayslip.tax_amount)}</span>
                    </div>
                  )}
                  {selectedPayslip.social_security > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Social Security</span>
                      <span className="font-medium text-rose-600">-{formatCurrency(selectedPayslip.social_security)}</span>
                    </div>
                  )}
                  {selectedPayslip.health_insurance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Health Insurance</span>
                      <span className="font-medium text-rose-600">-{formatCurrency(selectedPayslip.health_insurance)}</span>
                    </div>
                  )}
                  {selectedPayslip.pension_contribution > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Pension</span>
                      <span className="font-medium text-rose-600">-{formatCurrency(selectedPayslip.pension_contribution)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-rose-200">
                    <span className="font-medium text-rose-800">Total Deductions</span>
                    <span className="font-bold text-rose-700">-{formatCurrency(selectedPayslip.total_deductions)}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl text-white">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-100 font-medium">Net Pay</span>
                  <span className="text-3xl font-black">{formatCurrency(selectedPayslip.net_salary)}</span>
                </div>
              </div>

              {/* Status & Payment Info */}
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl text-sm">
                <span className={`px-3 py-1 rounded-full font-medium ${STATUS_CONFIG[selectedPayslip.status]?.color}`}>
                  {STATUS_CONFIG[selectedPayslip.status]?.label}
                </span>
                <span className="text-slate-500">
                  Payment Date: {selectedPayslip.payment_date}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payroll;
