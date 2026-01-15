import React, { useEffect, useState } from 'react';
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
  Receipt, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2,
  FileText,
  Calendar,
  Building2,
  User,
  AlertCircle,
  Check,
  X,
  Download,
  Upload,
  Plane,
  Utensils,
  Monitor,
  Car,
  Hotel,
  Phone,
  GraduationCap,
  MoreHorizontal,
  Filter,
  TrendingUp,
  Wallet,
  CreditCard,
  Ban
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EXPENSE_CATEGORIES = [
  { value: 'travel', label: 'Travel', icon: Plane, color: 'bg-blue-100 text-blue-700' },
  { value: 'meals', label: 'Meals & Food', icon: Utensils, color: 'bg-orange-100 text-orange-700' },
  { value: 'transportation', label: 'Transportation', icon: Car, color: 'bg-emerald-100 text-emerald-700' },
  { value: 'accommodation', label: 'Accommodation', icon: Hotel, color: 'bg-purple-100 text-purple-700' },
  { value: 'equipment', label: 'Equipment', icon: Monitor, color: 'bg-indigo-100 text-indigo-700' },
  { value: 'office', label: 'Office Supplies', icon: FileText, color: 'bg-slate-100 text-slate-700' },
  { value: 'communication', label: 'Communication', icon: Phone, color: 'bg-cyan-100 text-cyan-700' },
  { value: 'training', label: 'Training', icon: GraduationCap, color: 'bg-amber-100 text-amber-700' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-700' }
];

const EXPENSE_STATUS = [
  { value: 'pending', label: 'Pending', color: 'bg-slate-100 text-slate-700' },
  { value: 'submitted', label: 'Submitted', color: 'bg-blue-100 text-blue-700' },
  { value: 'under_review', label: 'Under Review', color: 'bg-amber-100 text-amber-700' },
  { value: 'approved', label: 'Approved', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'rejected', label: 'Rejected', color: 'bg-rose-100 text-rose-700' },
  { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-700' }
];

const PAYMENT_METHODS = [
  { value: 'personal', label: 'Personal Card/Cash' },
  { value: 'corporate_card', label: 'Corporate Card' },
  { value: 'reimbursement', label: 'Reimbursement' }
];

const Expenses = () => {
  const { user } = useAuth();
  const { currency, formatAmount } = useCurrency();
  const [activeTab, setActiveTab] = useState('all');
  const [expenses, setExpenses] = useState([]);
  const [myExpenses, setMyExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Dialogs
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  
  // Selected items
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  
  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';
  
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    description: '',
    amount: '',
    currency: 'USD',
    category: 'other',
    expense_date: new Date().toISOString().split('T')[0],
    merchant_name: '',
    payment_method: 'personal',
    receipt_url: '',
    notes: ''
  });

  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchExpenses();
    fetchMyExpenses();
    fetchEmployees();
    fetchDepartments();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(`${API}/expenses`);
      setExpenses(response.data);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    }
  };

  const fetchMyExpenses = async () => {
    try {
      const response = await axios.get(`${API}/expenses/my`);
      setMyExpenses(response.data);
    } catch (error) {
      console.error('Failed to fetch my expenses:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/expenses/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
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

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API}/departments`);
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        status: 'submitted'
      };
      
      if (editingExpense) {
        await axios.put(`${API}/expenses/${editingExpense.id}`, formData);
        toast.success('Expense updated successfully');
      } else {
        await axios.post(`${API}/expenses`, formData);
        toast.success('Expense submitted successfully');
      }
      fetchExpenses();
      fetchMyExpenses();
      fetchStats();
      resetExpenseForm();
    } catch (error) {
      toast.error('Failed to save expense');
    }
  };

  const handleApprove = async (expenseId) => {
    try {
      await axios.put(`${API}/expenses/${expenseId}/approve`);
      toast.success('Expense approved');
      fetchExpenses();
      fetchStats();
    } catch (error) {
      toast.error('Failed to approve expense');
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/expenses/${selectedExpense.id}/reject`, { reason: rejectReason });
      toast.success('Expense rejected');
      setRejectDialogOpen(false);
      setRejectReason('');
      fetchExpenses();
      fetchStats();
    } catch (error) {
      toast.error('Failed to reject expense');
    }
  };

  const handleMarkPaid = async (expenseId) => {
    try {
      await axios.put(`${API}/expenses/${expenseId}/mark-paid`);
      toast.success('Expense marked as paid');
      fetchExpenses();
      fetchStats();
    } catch (error) {
      toast.error('Failed to mark as paid');
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await axios.delete(`${API}/expenses/${expenseId}`);
      toast.success('Expense deleted');
      fetchExpenses();
      fetchMyExpenses();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${API}/expenses/export`);
      const blob = new Blob([response.data.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      toast.success(`Exported ${response.data.count} expenses`);
    } catch (error) {
      toast.error('Failed to export expenses');
    }
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      title: '',
      description: '',
      amount: '',
      currency: 'USD',
      category: 'other',
      expense_date: new Date().toISOString().split('T')[0],
      merchant_name: '',
      payment_method: 'personal',
      receipt_url: '',
      notes: ''
    });
    setEditingExpense(null);
    setExpenseDialogOpen(false);
  };

  const openEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      title: expense.title || '',
      description: expense.description || '',
      amount: expense.amount?.toString() || '',
      currency: expense.currency || 'USD',
      category: expense.category || 'other',
      expense_date: expense.expense_date || '',
      merchant_name: expense.merchant_name || '',
      payment_method: expense.payment_method || 'personal',
      receipt_url: expense.receipt_url || '',
      notes: expense.notes || ''
    });
    setExpenseDialogOpen(true);
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.full_name : '-';
  };

  const getCategoryInfo = (category) => {
    return EXPENSE_CATEGORIES.find(c => c.value === category) || EXPENSE_CATEGORIES[8];
  };

  const getStatusInfo = (status) => {
    return EXPENSE_STATUS.find(s => s.value === status) || EXPENSE_STATUS[0];
  };

  const filteredExpenses = expenses.filter(exp => {
    if (filterStatus !== 'all' && exp.status !== filterStatus) return false;
    if (filterCategory !== 'all' && exp.category !== filterCategory) return false;
    return true;
  });

  const pendingExpenses = expenses.filter(e => ['pending', 'submitted', 'under_review'].includes(e.status));

  // Employee View
  const EmployeeExpenseView = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-700">{myExpenses.length}</p>
          <p className="text-xs text-slate-500">Total Claims</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">
            {myExpenses.filter(e => ['pending', 'submitted', 'under_review'].includes(e.status)).length}
          </p>
          <p className="text-xs text-slate-500">Pending</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {myExpenses.filter(e => e.status === 'approved').length}
          </p>
          <p className="text-xs text-slate-500">Approved</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {formatAmount(myExpenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + (e.amount || 0), 0))}
          </p>
          <p className="text-xs text-slate-500">Reimbursed</p>
        </div>
      </div>

      {/* My Expenses List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">My Expense Claims</h3>
          <Button 
            onClick={() => { resetExpenseForm(); setExpenseDialogOpen(true); }}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 gap-2"
          >
            <Plus size={18} />
            New Claim
          </Button>
        </div>
        <div className="divide-y divide-slate-100">
          {myExpenses.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No expense claims yet</p>
              <Button 
                onClick={() => setExpenseDialogOpen(true)}
                variant="outline" 
                className="mt-4 rounded-xl"
              >
                <Plus size={16} className="mr-2" />
                Submit Your First Claim
              </Button>
            </div>
          ) : (
            myExpenses.map((expense) => {
              const categoryInfo = getCategoryInfo(expense.category);
              const statusInfo = getStatusInfo(expense.status);
              const CategoryIcon = categoryInfo.icon;
              return (
                <div key={expense.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${categoryInfo.color} flex items-center justify-center`}>
                      <CategoryIcon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 truncate">{expense.title}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        {new Date(expense.expense_date).toLocaleDateString()} • {categoryInfo.label}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{formatAmount(expense.amount)}</p>
                      <p className="text-xs text-slate-400">{expense.currency}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => { setSelectedExpense(expense); setViewDialogOpen(true); }}
                        size="sm"
                        variant="ghost"
                        className="rounded-lg"
                      >
                        <Eye size={16} />
                      </Button>
                      {expense.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => openEditExpense(expense)}
                            size="sm"
                            variant="ghost"
                            className="rounded-lg"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            onClick={() => handleDelete(expense.id)}
                            size="sm"
                            variant="ghost"
                            className="rounded-lg text-rose-600"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {expense.status === 'rejected' && expense.rejection_reason && (
                    <div className="mt-2 p-2 bg-rose-50 rounded-lg text-sm text-rose-700 flex items-start gap-2">
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      <span>Rejected: {expense.rejection_reason}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  // If not admin, show employee view
  if (!isAdmin) {
    return (
      <div data-testid="expenses-page" className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
              My Expenses
            </h1>
            <p className="text-slate-500 text-sm sm:text-base mt-1">Submit and track your expense claims</p>
          </div>
        </div>
        <EmployeeExpenseView />

        {/* Expense Form Dialog */}
        <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
          <DialogContent className="rounded-2xl max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Receipt className="text-emerald-600" size={24} />
                {editingExpense ? 'Edit Expense' : 'New Expense Claim'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleExpenseSubmit} className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Title *</label>
                <Input
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="rounded-xl"
                  placeholder="e.g. Client lunch meeting"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Amount *</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="rounded-xl"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Category *</label>
                  <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Expense Date *</label>
                  <Input
                    type="date"
                    value={expenseForm.expense_date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Payment Method</label>
                  <Select value={expenseForm.payment_method} onValueChange={(v) => setExpenseForm({ ...expenseForm, payment_method: v })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((pm) => (
                        <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Merchant/Vendor</label>
                <Input
                  value={expenseForm.merchant_name}
                  onChange={(e) => setExpenseForm({ ...expenseForm, merchant_name: e.target.value })}
                  className="rounded-xl"
                  placeholder="e.g. Restaurant name, Store name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
                <textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none"
                  rows={2}
                  placeholder="Add details about this expense..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Receipt URL (optional)</label>
                <Input
                  value={expenseForm.receipt_url}
                  onChange={(e) => setExpenseForm({ ...expenseForm, receipt_url: e.target.value })}
                  className="rounded-xl"
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 flex-1">
                  {editingExpense ? 'Update Expense' : 'Submit Claim'}
                </Button>
                <Button type="button" onClick={resetExpenseForm} variant="outline" className="rounded-xl">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Expense Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="rounded-2xl max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Receipt className="text-emerald-600" size={24} />
                Expense Details
              </DialogTitle>
            </DialogHeader>
            {selectedExpense && (
              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm text-slate-500">Amount</p>
                    <p className="text-2xl font-black text-slate-900">{formatAmount(selectedExpense.amount)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusInfo(selectedExpense.status).color}`}>
                    {getStatusInfo(selectedExpense.status).label}
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">Title</p>
                    <p className="font-medium text-slate-900">{selectedExpense.title}</p>
                  </div>
                  {selectedExpense.description && (
                    <div>
                      <p className="text-xs text-slate-500">Description</p>
                      <p className="text-slate-700">{selectedExpense.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Category</p>
                      <p className="font-medium text-slate-900">{getCategoryInfo(selectedExpense.category).label}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Expense Date</p>
                      <p className="font-medium text-slate-900">{new Date(selectedExpense.expense_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {selectedExpense.merchant_name && (
                    <div>
                      <p className="text-xs text-slate-500">Merchant</p>
                      <p className="font-medium text-slate-900">{selectedExpense.merchant_name}</p>
                    </div>
                  )}
                  {selectedExpense.receipt_url && (
                    <div>
                      <p className="text-xs text-slate-500">Receipt</p>
                      <a href={selectedExpense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                        View Receipt
                      </a>
                    </div>
                  )}
                  {selectedExpense.rejection_reason && (
                    <div className="p-3 bg-rose-50 rounded-xl">
                      <p className="text-xs text-rose-600 font-medium">Rejection Reason</p>
                      <p className="text-rose-700">{selectedExpense.rejection_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Admin View
  return (
    <div data-testid="expenses-page" className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Expense Claims
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1">Review and manage employee expense claims</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleExport}
            variant="outline"
            className="rounded-xl gap-2"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button 
            onClick={() => { resetExpenseForm(); setExpenseDialogOpen(true); }}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 gap-2"
            data-testid="new-expense-btn"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New Claim</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs sm:text-sm">Total Claims</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{stats?.total_claims || 0}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <Receipt size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-xs sm:text-sm">Pending Review</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{stats?.pending_count || 0}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <Clock size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs sm:text-sm">Approved Amount</p>
              <p className="text-xl sm:text-2xl font-black mt-1">{formatAmount(stats?.approved_amount || 0)}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <CheckCircle2 size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs sm:text-sm">Total Amount</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{formatAmount(stats?.total_amount || 0)}</p>
            </div>
            <div className="bg-slate-100 rounded-xl p-2 sm:p-3">
              <DollarSign size={20} className="text-slate-600 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList className="bg-slate-100 p-1 rounded-xl w-full sm:w-auto flex">
            <TabsTrigger value="all" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
              <Receipt size={14} className="sm:w-4 sm:h-4" />
              All
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
              <Clock size={14} className="sm:w-4 sm:h-4" />
              Pending
              {pendingExpenses.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                  {pendingExpenses.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
              <CheckCircle2 size={14} className="sm:w-4 sm:h-4" />
              Approved
            </TabsTrigger>
          </TabsList>
          
          {/* Filters */}
          <div className="flex gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-32 rounded-xl">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* All Expenses Tab */}
        <TabsContent value="all" className="mt-4">
          <ExpenseTable 
            expenses={filteredExpenses}
            employees={employees}
            onView={(e) => { setSelectedExpense(e); setViewDialogOpen(true); }}
            onApprove={handleApprove}
            onReject={(e) => { setSelectedExpense(e); setRejectDialogOpen(true); }}
            onMarkPaid={handleMarkPaid}
            onEdit={openEditExpense}
            onDelete={handleDelete}
            formatAmount={formatAmount}
          />
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="pending" className="mt-4">
          <ExpenseTable 
            expenses={pendingExpenses}
            employees={employees}
            onView={(e) => { setSelectedExpense(e); setViewDialogOpen(true); }}
            onApprove={handleApprove}
            onReject={(e) => { setSelectedExpense(e); setRejectDialogOpen(true); }}
            onMarkPaid={handleMarkPaid}
            onEdit={openEditExpense}
            onDelete={handleDelete}
            formatAmount={formatAmount}
          />
        </TabsContent>

        {/* Approved Tab */}
        <TabsContent value="approved" className="mt-4">
          <ExpenseTable 
            expenses={expenses.filter(e => ['approved', 'paid'].includes(e.status))}
            employees={employees}
            onView={(e) => { setSelectedExpense(e); setViewDialogOpen(true); }}
            onApprove={handleApprove}
            onReject={(e) => { setSelectedExpense(e); setRejectDialogOpen(true); }}
            onMarkPaid={handleMarkPaid}
            onEdit={openEditExpense}
            onDelete={handleDelete}
            formatAmount={formatAmount}
          />
        </TabsContent>
      </Tabs>

      {/* Expense Form Dialog */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Receipt className="text-emerald-600" size={24} />
              {editingExpense ? 'Edit Expense' : 'New Expense Claim'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleExpenseSubmit} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Title *</label>
              <Input
                value={expenseForm.title}
                onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                className="rounded-xl"
                placeholder="e.g. Client lunch meeting"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Amount *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="rounded-xl"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Category *</label>
                <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Expense Date *</label>
                <Input
                  type="date"
                  value={expenseForm.expense_date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Payment Method</label>
                <Select value={expenseForm.payment_method} onValueChange={(v) => setExpenseForm({ ...expenseForm, payment_method: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((pm) => (
                      <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Merchant/Vendor</label>
              <Input
                value={expenseForm.merchant_name}
                onChange={(e) => setExpenseForm({ ...expenseForm, merchant_name: e.target.value })}
                className="rounded-xl"
                placeholder="e.g. Restaurant name, Store name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
              <textarea
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none"
                rows={2}
                placeholder="Add details about this expense..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Receipt URL (optional)</label>
              <Input
                value={expenseForm.receipt_url}
                onChange={(e) => setExpenseForm({ ...expenseForm, receipt_url: e.target.value })}
                className="rounded-xl"
                placeholder="https://..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 flex-1">
                {editingExpense ? 'Update Expense' : 'Submit Claim'}
              </Button>
              <Button type="button" onClick={resetExpenseForm} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Expense Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Receipt className="text-emerald-600" size={24} />
              Expense Details
            </DialogTitle>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm text-slate-500">Amount</p>
                  <p className="text-2xl font-black text-slate-900">{formatAmount(selectedExpense.amount)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusInfo(selectedExpense.status).color}`}>
                  {getStatusInfo(selectedExpense.status).label}
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500">Employee</p>
                  <p className="font-medium text-slate-900">{getEmployeeName(selectedExpense.employee_id)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Title</p>
                  <p className="font-medium text-slate-900">{selectedExpense.title}</p>
                </div>
                {selectedExpense.description && (
                  <div>
                    <p className="text-xs text-slate-500">Description</p>
                    <p className="text-slate-700">{selectedExpense.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Category</p>
                    <p className="font-medium text-slate-900">{getCategoryInfo(selectedExpense.category).label}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Expense Date</p>
                    <p className="font-medium text-slate-900">{new Date(selectedExpense.expense_date).toLocaleDateString()}</p>
                  </div>
                </div>
                {selectedExpense.merchant_name && (
                  <div>
                    <p className="text-xs text-slate-500">Merchant</p>
                    <p className="font-medium text-slate-900">{selectedExpense.merchant_name}</p>
                  </div>
                )}
                {selectedExpense.receipt_url && (
                  <div>
                    <p className="text-xs text-slate-500">Receipt</p>
                    <a href={selectedExpense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                      View Receipt
                    </a>
                  </div>
                )}
                {selectedExpense.rejection_reason && (
                  <div className="p-3 bg-rose-50 rounded-xl">
                    <p className="text-xs text-rose-600 font-medium">Rejection Reason</p>
                    <p className="text-rose-700">{selectedExpense.rejection_reason}</p>
                  </div>
                )}
              </div>
              
              {/* Admin Actions */}
              {['pending', 'submitted', 'under_review'].includes(selectedExpense.status) && (
                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={() => { handleApprove(selectedExpense.id); setViewDialogOpen(false); }}
                    className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Check size={16} className="mr-2" />
                    Approve
                  </Button>
                  <Button 
                    onClick={() => { setViewDialogOpen(false); setRejectDialogOpen(true); }}
                    variant="outline"
                    className="flex-1 rounded-xl text-rose-600 hover:bg-rose-50"
                  >
                    <X size={16} className="mr-2" />
                    Reject
                  </Button>
                </div>
              )}
              {selectedExpense.status === 'approved' && (
                <Button 
                  onClick={() => { handleMarkPaid(selectedExpense.id); setViewDialogOpen(false); }}
                  className="w-full rounded-xl bg-green-600 hover:bg-green-700"
                >
                  <DollarSign size={16} className="mr-2" />
                  Mark as Paid
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Ban className="text-rose-600" size={24} />
              Reject Expense
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReject} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Reason for rejection *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none resize-none"
                rows={3}
                placeholder="Please provide a reason for rejection..."
                required
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700">
                Reject Expense
              </Button>
              <Button type="button" onClick={() => setRejectDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Expense Table Component
const ExpenseTable = ({ expenses, employees, onView, onApprove, onReject, onMarkPaid, onEdit, onDelete, formatAmount }) => {
  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.full_name : '-';
  };

  const getCategoryInfo = (category) => {
    return EXPENSE_CATEGORIES.find(c => c.value === category) || EXPENSE_CATEGORIES[8];
  };

  const getStatusInfo = (status) => {
    return EXPENSE_STATUS.find(s => s.value === status) || EXPENSE_STATUS[0];
  };

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <Receipt size={48} className="mx-auto mb-4 text-slate-300" />
        <p className="text-slate-500">No expenses found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Employee</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Expense</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700 hidden md:table-cell">Category</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Amount</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Status</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-start text-xs sm:text-sm font-bold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => {
              const categoryInfo = getCategoryInfo(expense.category);
              const statusInfo = getStatusInfo(expense.status);
              const CategoryIcon = categoryInfo.icon;
              return (
                <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <p className="font-medium text-slate-900">{getEmployeeName(expense.employee_id)}</p>
                    <p className="text-xs text-slate-400">{new Date(expense.expense_date).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <p className="font-medium text-slate-900 truncate max-w-[200px]">{expense.title}</p>
                    {expense.merchant_name && (
                      <p className="text-xs text-slate-400 truncate">{expense.merchant_name}</p>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${categoryInfo.color}`}>
                      <CategoryIcon size={12} />
                      {categoryInfo.label}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <p className="font-bold text-slate-900">{formatAmount(expense.amount)}</p>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex gap-1">
                      <Button onClick={() => onView(expense)} size="sm" variant="ghost" className="rounded-lg">
                        <Eye size={16} />
                      </Button>
                      {['pending', 'submitted', 'under_review'].includes(expense.status) && (
                        <>
                          <Button onClick={() => onApprove(expense.id)} size="sm" variant="ghost" className="rounded-lg text-emerald-600">
                            <Check size={16} />
                          </Button>
                          <Button onClick={() => onReject(expense)} size="sm" variant="ghost" className="rounded-lg text-rose-600">
                            <X size={16} />
                          </Button>
                        </>
                      )}
                      {expense.status === 'approved' && (
                        <Button onClick={() => onMarkPaid(expense.id)} size="sm" variant="ghost" className="rounded-lg text-green-600">
                          <DollarSign size={16} />
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
    </div>
  );
};

export default Expenses;
