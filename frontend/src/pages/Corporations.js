import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Corporations = () => {
  const { t } = useLanguage();
  const [corporations, setCorporations] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCorp, setEditingCorp] = useState(null);
  const [formData, setFormData] = useState({ name: '', address: '' });

  useEffect(() => {
    fetchCorporations();
  }, []);

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
      if (editingCorp) {
        await axios.put(`${API}/corporations/${editingCorp.id}`, formData);
        toast.success('Corporation updated successfully');
      } else {
        await axios.post(`${API}/corporations`, formData);
        toast.success('Corporation created successfully');
      }
      setDialogOpen(false);
      setEditingCorp(null);
      setFormData({ name: '', address: '' });
      fetchCorporations();
    } catch (error) {
      toast.error('Failed to save corporation');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await axios.delete(`${API}/corporations/${id}`);
        toast.success('Corporation deleted');
        fetchCorporations();
      } catch (error) {
        toast.error('Failed to delete corporation');
      }
    }
  };

  const openDialog = (corp = null) => {
    if (corp) {
      setEditingCorp(corp);
      setFormData({ name: corp.name, address: corp.address || '' });
    } else {
      setEditingCorp(null);
      setFormData({ name: '', address: '' });
    }
    setDialogOpen(true);
  };

  return (
    <div data-testid="corporations-page">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {t('corporations')}
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => openDialog()} 
              data-testid="add-corporation-button"
              className="rounded-full bg-indigo-950 text-white hover:bg-indigo-900 shadow-lg hover:shadow-xl"
            >
              <Plus size={20} className="me-2" />
              {t('addNew')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCorp ? t('edit') : t('addNew')} {t('corporations')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="corporation-form">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">{t('name')}</label>
                <input
                  type="text"
                  data-testid="corp-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">{t('address')}</label>
                <input
                  type="text"
                  data-testid="corp-address-input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" data-testid="corp-submit-button" className="rounded-full bg-indigo-950 hover:bg-indigo-900">
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
          <table className="w-full" data-testid="corporations-table">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">{t('name')}</th>
                <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">{t('address')}</th>
                <th className="px-6 py-4 text-start text-sm font-bold text-slate-700">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {corporations.map((corp) => (
                <tr key={corp.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors" data-testid={`corp-row-${corp.id}`}>
                  <td className="px-6 py-4 text-slate-900 font-medium">{corp.name}</td>
                  <td className="px-6 py-4 text-slate-600">{corp.address || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openDialog(corp)}
                        data-testid={`edit-corp-${corp.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(corp.id)}
                        data-testid={`delete-corp-${corp.id}`}
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

export default Corporations;
