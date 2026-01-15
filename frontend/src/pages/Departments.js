import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Departments = () => {
  const { t } = useLanguage();
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({ name: '', branch_id: '' });

  useEffect(() => {
    fetchDepartments();
    fetchBranches();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API}/departments`);
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await axios.put(`${API}/departments/${editingDept.id}`, formData);
        toast.success('Department updated successfully');
      } else {
        await axios.post(`${API}/departments`, formData);
        toast.success('Department created successfully');
      }
      setDialogOpen(false);
      setEditingDept(null);
      setFormData({ name: '', branch_id: '' });
      fetchDepartments();
    } catch (error) {
      toast.error('Failed to save department');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await axios.delete(`${API}/departments/${id}`);
        toast.success('Department deleted');
        fetchDepartments();
      } catch (error) {
        toast.error('Failed to delete department');
      }
    }
  };

  const openDialog = (dept = null) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({ name: dept.name, branch_id: dept.branch_id });
    } else {
      setEditingDept(null);
      setFormData({ name: '', branch_id: '' });
    }
    setDialogOpen(true);
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : '-';
  };

  return (
    <div data-testid="departments-page">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {t('departments')}
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => openDialog()} 
              data-testid="add-department-button"
              className="rounded-full bg-indigo-950 text-white hover:bg-indigo-900 shadow-lg hover:shadow-xl"
            >
              <Plus size={20} className="me-2" />
              {t('addNew')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDept ? t('edit') : t('addNew')} {t('departments')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="department-form">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">{t('name')}</label>
                <input
                  type="text"
                  data-testid="dept-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Branch</label>
                <Select 
                  value={formData.branch_id} 
                  onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
                  required
                >
                  <SelectTrigger data-testid="dept-branch-select">
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" data-testid="dept-submit-button" className="rounded-full bg-indigo-950 hover:bg-indigo-900">
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
          <table className="w-full" data-testid="departments-table">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">{t('name')}</th>
                <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Branch</th>
                <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors" data-testid={`dept-row-${dept.id}`}>
                  <td className="px-6 py-4 text-slate-900 font-medium">{dept.name}</td>
                  <td className="px-6 py-4 text-slate-600">{getBranchName(dept.branch_id)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openDialog(dept)}
                        data-testid={`edit-dept-${dept.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(dept.id)}
                        data-testid={`delete-dept-${dept.id}`}
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

export default Departments;