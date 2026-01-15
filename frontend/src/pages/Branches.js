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

const Branches = () => {
  const { t } = useLanguage();
  const [branches, setBranches] = useState([]);
  const [corporations, setCorporations] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    corporation_id: '', 
    parent_branch_id: '',
    address: '' 
  });

  useEffect(() => {
    fetchBranches();
    fetchCorporations();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${API}/branches`);
      setBranches(response.data);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      if (!submitData.parent_branch_id) delete submitData.parent_branch_id;
      
      if (editingBranch) {
        await axios.put(`${API}/branches/${editingBranch.id}`, submitData);
        toast.success('Branch updated successfully');
      } else {
        await axios.post(`${API}/branches`, submitData);
        toast.success('Branch created successfully');
      }
      setDialogOpen(false);
      setEditingBranch(null);
      setFormData({ name: '', corporation_id: '', parent_branch_id: '', address: '' });
      fetchBranches();
    } catch (error) {
      toast.error('Failed to save branch');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await axios.delete(`${API}/branches/${id}`);
        toast.success('Branch deleted');
        fetchBranches();
      } catch (error) {
        toast.error('Failed to delete branch');
      }
    }
  };

  const openDialog = (branch = null) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({ 
        name: branch.name, 
        corporation_id: branch.corporation_id,
        parent_branch_id: branch.parent_branch_id || '',
        address: branch.address || '' 
      });
    } else {
      setEditingBranch(null);
      setFormData({ name: '', corporation_id: '', parent_branch_id: '', address: '' });
    }
    setDialogOpen(true);
  };

  const getCorporationName = (corpId) => {
    const corp = corporations.find(c => c.id === corpId);
    return corp ? corp.name : '-';
  };

  const getParentBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : '-';
  };

  return (
    <div data-testid="branches-page">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {t('branches')}
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => openDialog()} 
              data-testid="add-branch-button"
              className="rounded-full bg-indigo-950 text-white hover:bg-indigo-900 shadow-lg hover:shadow-xl"
            >
              <Plus size={20} className="me-2" />
              {t('addNew')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBranch ? t('edit') : t('addNew')} {t('branches')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="branch-form">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">{t('name')}</label>
                <input
                  type="text"
                  data-testid="branch-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Corporation</label>
                <Select 
                  value={formData.corporation_id} 
                  onValueChange={(value) => setFormData({ ...formData, corporation_id: value })}
                  required
                >
                  <SelectTrigger data-testid="branch-corporation-select">
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
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Parent Branch (Optional)</label>
                <Select 
                  value={formData.parent_branch_id} 
                  onValueChange={(value) => setFormData({ ...formData, parent_branch_id: value })}
                >
                  <SelectTrigger data-testid="branch-parent-select">
                    <SelectValue placeholder="Select Parent Branch (Optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {branches.filter(b => b.corporation_id === formData.corporation_id).map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">{t('address')}</label>
                <input
                  type="text"
                  data-testid="branch-address-input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" data-testid="branch-submit-button" className="rounded-full bg-indigo-950 hover:bg-indigo-900">
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
          <table className="w-full" data-testid="branches-table">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">{t('name')}</th>
                <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Corporation</th>
                <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">Parent Branch</th>
                <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">{t('address')}</th>
                <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr key={branch.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors" data-testid={`branch-row-${branch.id}`}>
                  <td className="px-6 py-4 text-slate-900 font-medium">{branch.name}</td>
                  <td className="px-6 py-4 text-slate-600">{getCorporationName(branch.corporation_id)}</td>
                  <td className="px-6 py-4 text-slate-600">{branch.parent_branch_id ? getParentBranchName(branch.parent_branch_id) : '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{branch.address || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openDialog(branch)}
                        data-testid={`edit-branch-${branch.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(branch.id)}
                        data-testid={`delete-branch-${branch.id}`}
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

export default Branches;
