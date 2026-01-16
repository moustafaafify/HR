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
import { Textarea } from '../components/ui/textarea';
import { 
  Package, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2,
  Check,
  Clock,
  Users,
  Search,
  Filter,
  Laptop,
  Monitor,
  Smartphone,
  Printer,
  Car,
  Armchair,
  HardDrive,
  Tag,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send,
  ArrowLeftRight,
  History,
  Box,
  Settings,
  UserCheck,
  FileText
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ASSET_CONDITIONS = [
  { value: 'excellent', label: 'Excellent', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'good', label: 'Good', color: 'bg-blue-100 text-blue-700' },
  { value: 'fair', label: 'Fair', color: 'bg-amber-100 text-amber-700' },
  { value: 'poor', label: 'Poor', color: 'bg-rose-100 text-rose-700' },
];

const ASSET_STATUSES = [
  { value: 'available', label: 'Available', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  { value: 'assigned', label: 'Assigned', color: 'bg-blue-100 text-blue-700', icon: UserCheck },
  { value: 'under_maintenance', label: 'Maintenance', color: 'bg-amber-100 text-amber-700', icon: RefreshCw },
  { value: 'retired', label: 'Retired', color: 'bg-slate-100 text-slate-700', icon: XCircle },
  { value: 'lost', label: 'Lost', color: 'bg-rose-100 text-rose-700', icon: AlertTriangle },
];

const REQUEST_TYPES = [
  { value: 'new', label: 'New Asset Request' },
  { value: 'replacement', label: 'Replacement' },
  { value: 'return', label: 'Return Asset' },
  { value: 'repair', label: 'Repair Request' },
];

const REQUEST_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  { value: 'approved', label: 'Approved', color: 'bg-blue-100 text-blue-700' },
  { value: 'rejected', label: 'Rejected', color: 'bg-rose-100 text-rose-700' },
  { value: 'fulfilled', label: 'Fulfilled', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-slate-100 text-slate-700' },
];

const DEFAULT_CATEGORIES = [
  { name: 'Laptops', icon: 'laptop', color: '#3B82F6' },
  { name: 'Monitors', icon: 'monitor', color: '#8B5CF6' },
  { name: 'Phones', icon: 'smartphone', color: '#10B981' },
  { name: 'Printers', icon: 'printer', color: '#F59E0B' },
  { name: 'Furniture', icon: 'armchair', color: '#EC4899' },
  { name: 'Vehicles', icon: 'car', color: '#6366F1' },
  { name: 'Storage Devices', icon: 'hard-drive', color: '#14B8A6' },
  { name: 'Other', icon: 'box', color: '#64748B' },
];

const getCategoryIcon = (iconName) => {
  const icons = {
    'laptop': Laptop,
    'monitor': Monitor,
    'smartphone': Smartphone,
    'printer': Printer,
    'armchair': Armchair,
    'car': Car,
    'hard-drive': HardDrive,
    'box': Box,
  };
  return icons[iconName] || Package;
};

const Assets = () => {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assets');
  const [stats, setStats] = useState(null);
  
  // Data
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [requests, setRequests] = useState([]);
  const [myAssets, setMyAssets] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Dialogs
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [viewAssetDialogOpen, setViewAssetDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  
  // Selected items
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [editingAsset, setEditingAsset] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [assetHistory, setAssetHistory] = useState([]);
  
  // Forms
  const [assetForm, setAssetForm] = useState({
    name: '',
    asset_tag: '',
    category_id: '',
    description: '',
    serial_number: '',
    model: '',
    manufacturer: '',
    purchase_date: '',
    purchase_price: '',
    currency: 'USD',
    warranty_expiry: '',
    location: '',
    condition: 'good',
    status: 'available',
    notes: '',
  });
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: 'box',
    color: '#64748B',
  });
  
  const [assignForm, setAssignForm] = useState({
    employee_id: '',
    assigned_date: new Date().toISOString().split('T')[0],
    expected_return_date: '',
    notes: '',
  });
  
  const [returnForm, setReturnForm] = useState({
    condition: 'good',
    new_status: 'available',
    notes: '',
  });
  
  const [requestForm, setRequestForm] = useState({
    request_type: 'new',
    category_id: '',
    asset_id: '',
    title: '',
    description: '',
    priority: 'normal',
  });

  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  // Fetch functions
  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/assets/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  const fetchAssets = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/assets`);
      setAssets(response.data);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/asset-categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/asset-requests`);
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
  }, []);

  const fetchMyAssets = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/assets/my`);
      setMyAssets(response.data);
    } catch (error) {
      console.error('Failed to fetch my assets:', error);
    }
  }, []);

  const fetchMyRequests = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/asset-requests/my`);
      setMyRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch my requests:', error);
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

  const fetchAssignments = useCallback(async (assetId) => {
    try {
      const response = await axios.get(`${API}/asset-assignments`, {
        params: { asset_id: assetId }
      });
      setAssetHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchAssets(),
        fetchCategories(),
        fetchRequests(),
        fetchMyAssets(),
        fetchMyRequests(),
        fetchEmployees(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchAssets, fetchCategories, fetchRequests, fetchMyAssets, fetchMyRequests, fetchEmployees]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter assets
  const filteredAssets = assets.filter(asset => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = asset.name?.toLowerCase().includes(query);
      const tagMatch = asset.asset_tag?.toLowerCase().includes(query);
      const serialMatch = asset.serial_number?.toLowerCase().includes(query);
      if (!nameMatch && !tagMatch && !serialMatch) return false;
    }
    if (statusFilter !== 'all' && asset.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && asset.category_id !== categoryFilter) return false;
    return true;
  });

  // Filter requests
  const filteredRequests = (isAdmin ? requests : myRequests).filter(request => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = request.title?.toLowerCase().includes(query);
      const nameMatch = request.employee_name?.toLowerCase().includes(query);
      if (!titleMatch && !nameMatch) return false;
    }
    if (statusFilter !== 'all' && request.status !== statusFilter) return false;
    return true;
  });

  // Handlers
  const handleSaveAsset = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...assetForm,
        purchase_price: parseFloat(assetForm.purchase_price) || null,
      };
      
      if (editingAsset) {
        await axios.put(`${API}/assets/${editingAsset.id}`, data);
        toast.success('Asset updated');
      } else {
        await axios.post(`${API}/assets`, data);
        toast.success('Asset created');
      }
      fetchAssets();
      fetchStats();
      setAssetDialogOpen(false);
      resetAssetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save asset');
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (!window.confirm('Delete this asset?')) return;
    try {
      await axios.delete(`${API}/assets/${assetId}`);
      toast.success('Asset deleted');
      fetchAssets();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete asset');
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(`${API}/asset-categories/${editingCategory.id}`, categoryForm);
        toast.success('Category updated');
      } else {
        await axios.post(`${API}/asset-categories`, categoryForm);
        toast.success('Category created');
      }
      fetchCategories();
      setCategoryDialogOpen(false);
      resetCategoryForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await axios.delete(`${API}/asset-categories/${categoryId}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete category');
    }
  };

  const handleAssignAsset = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;
    try {
      await axios.post(`${API}/assets/${selectedAsset.id}/assign`, assignForm);
      toast.success('Asset assigned');
      fetchAssets();
      fetchStats();
      setAssignDialogOpen(false);
      resetAssignForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to assign asset');
    }
  };

  const handleReturnAsset = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;
    try {
      await axios.post(`${API}/assets/${selectedAsset.id}/return`, returnForm);
      toast.success('Asset returned');
      fetchAssets();
      fetchStats();
      fetchMyAssets();
      setReturnDialogOpen(false);
      resetReturnForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to return asset');
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/asset-requests`, requestForm);
      toast.success('Request submitted');
      fetchRequests();
      fetchMyRequests();
      fetchStats();
      setRequestDialogOpen(false);
      resetRequestForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit request');
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await axios.post(`${API}/asset-requests/${requestId}/approve`, {});
      toast.success('Request approved');
      fetchRequests();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    const reason = window.prompt('Rejection reason:');
    if (reason === null) return;
    try {
      await axios.post(`${API}/asset-requests/${requestId}/reject`, { reason });
      toast.success('Request rejected');
      fetchRequests();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reject request');
    }
  };

  const handleFulfillRequest = async (request) => {
    const availableAssets = assets.filter(a => 
      a.status === 'available' && 
      (!request.category_id || a.category_id === request.category_id)
    );
    
    if (availableAssets.length === 0) {
      toast.error('No available assets to fulfill this request');
      return;
    }
    
    // For simplicity, show a prompt. In production, use a proper dialog.
    const assetNames = availableAssets.map(a => `${a.asset_tag}: ${a.name}`).join('\n');
    const selectedTag = window.prompt(`Select asset tag to assign:\n\n${assetNames}`);
    
    if (!selectedTag) return;
    
    const asset = availableAssets.find(a => a.asset_tag === selectedTag.split(':')[0].trim());
    if (!asset) {
      toast.error('Invalid asset tag');
      return;
    }
    
    try {
      await axios.post(`${API}/asset-requests/${request.id}/fulfill`, { asset_id: asset.id });
      toast.success('Request fulfilled');
      fetchRequests();
      fetchAssets();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to fulfill request');
    }
  };

  const handleAddDefaultCategories = async () => {
    try {
      for (const cat of DEFAULT_CATEGORIES) {
        await axios.post(`${API}/asset-categories`, cat);
      }
      toast.success('Default categories added');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to add default categories');
    }
  };

  const viewAssetHistory = async (asset) => {
    setSelectedAsset(asset);
    await fetchAssignments(asset.id);
    setHistoryDialogOpen(true);
  };

  // Reset forms
  const resetAssetForm = () => {
    setEditingAsset(null);
    setAssetForm({
      name: '',
      asset_tag: '',
      category_id: '',
      description: '',
      serial_number: '',
      model: '',
      manufacturer: '',
      purchase_date: '',
      purchase_price: '',
      currency: 'USD',
      warranty_expiry: '',
      location: '',
      condition: 'good',
      status: 'available',
      notes: '',
    });
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      description: '',
      icon: 'box',
      color: '#64748B',
    });
  };

  const resetAssignForm = () => {
    setSelectedAsset(null);
    setAssignForm({
      employee_id: '',
      assigned_date: new Date().toISOString().split('T')[0],
      expected_return_date: '',
      notes: '',
    });
  };

  const resetReturnForm = () => {
    setSelectedAsset(null);
    setReturnForm({
      condition: 'good',
      new_status: 'available',
      notes: '',
    });
  };

  const resetRequestForm = () => {
    setRequestForm({
      request_type: 'new',
      category_id: '',
      asset_id: '',
      title: '',
      description: '',
      priority: 'normal',
    });
  };

  const openEditAsset = (asset) => {
    setEditingAsset(asset);
    setAssetForm({
      name: asset.name || '',
      asset_tag: asset.asset_tag || '',
      category_id: asset.category_id || '',
      description: asset.description || '',
      serial_number: asset.serial_number || '',
      model: asset.model || '',
      manufacturer: asset.manufacturer || '',
      purchase_date: asset.purchase_date || '',
      purchase_price: asset.purchase_price?.toString() || '',
      currency: asset.currency || 'USD',
      warranty_expiry: asset.warranty_expiry || '',
      location: asset.location || '',
      condition: asset.condition || 'good',
      status: asset.status || 'available',
      notes: asset.notes || '',
    });
    setAssetDialogOpen(true);
  };

  const openAssignDialog = (asset) => {
    setSelectedAsset(asset);
    setAssignDialogOpen(true);
  };

  const openReturnDialog = (asset) => {
    setSelectedAsset(asset);
    setReturnDialogOpen(true);
  };

  const getStatusConfig = (status) => ASSET_STATUSES.find(s => s.value === status) || ASSET_STATUSES[0];
  const getConditionConfig = (condition) => ASSET_CONDITIONS.find(c => c.value === condition) || ASSET_CONDITIONS[1];
  const getRequestStatusConfig = (status) => REQUEST_STATUSES.find(s => s.value === status) || REQUEST_STATUSES[0];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Employee View
  if (!isAdmin) {
    return (
      <div className="p-4 lg:p-6 space-y-6" data-testid="employee-assets-view">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">My Assets</h1>
            <p className="text-slate-500 mt-1">View assigned assets and make requests</p>
          </div>
          <Button onClick={() => setRequestDialogOpen(true)} data-testid="new-request-btn">
            <Plus size={18} className="mr-2" />
            New Request
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
            <Package className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-blue-100 text-sm">My Assets</p>
            <p className="text-2xl font-bold">{myAssets.length}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white">
            <Clock className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-amber-100 text-sm">Pending Requests</p>
            <p className="text-2xl font-bold">{myRequests.filter(r => r.status === 'pending').length}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white">
            <CheckCircle2 className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-emerald-100 text-sm">Approved</p>
            <p className="text-2xl font-bold">{myRequests.filter(r => r.status === 'approved' || r.status === 'fulfilled').length}</p>
          </div>
          <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-4 text-white">
            <XCircle className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-rose-100 text-sm">Rejected</p>
            <p className="text-2xl font-bold">{myRequests.filter(r => r.status === 'rejected').length}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="assets" data-testid="tab-my-assets">
              <Package size={16} className="mr-2" />
              My Assets ({myAssets.length})
            </TabsTrigger>
            <TabsTrigger value="requests" data-testid="tab-my-requests">
              <FileText size={16} className="mr-2" />
              My Requests ({myRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assets" className="mt-4">
            {myAssets.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No assets assigned to you</p>
                <Button variant="outline" className="mt-4" onClick={() => setRequestDialogOpen(true)}>
                  Request an Asset
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {myAssets.map(asset => {
                  const statusConfig = getStatusConfig(asset.status);
                  const conditionConfig = getConditionConfig(asset.condition);
                  const CategoryIcon = getCategoryIcon(categories.find(c => c.id === asset.category_id)?.icon);
                  return (
                    <div key={asset.id} className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <CategoryIcon className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{asset.name}</h3>
                            <p className="text-sm text-slate-500">{asset.asset_tag}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${conditionConfig.color}`}>
                          {conditionConfig.label}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-slate-600">
                        {asset.model && <p><span className="text-slate-400">Model:</span> {asset.model}</p>}
                        {asset.serial_number && <p><span className="text-slate-400">Serial:</span> {asset.serial_number}</p>}
                        {asset.assigned_date && <p><span className="text-slate-400">Assigned:</span> {asset.assigned_date}</p>}
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedAsset(asset);
                            setRequestForm({
                              ...requestForm,
                              request_type: 'repair',
                              asset_id: asset.id,
                              title: `Repair request for ${asset.name}`,
                            });
                            setRequestDialogOpen(true);
                          }}
                        >
                          <AlertTriangle size={14} className="mr-1" />
                          Report Issue
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openReturnDialog(asset)}
                        >
                          <ArrowLeftRight size={14} className="mr-1" />
                          Return
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="mt-4">
            {myRequests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No requests yet</p>
                <Button variant="outline" className="mt-4" onClick={() => setRequestDialogOpen(true)}>
                  Submit a Request
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Request</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myRequests.map(request => {
                      const statusConfig = getRequestStatusConfig(request.status);
                      return (
                        <tr key={request.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <p className="font-medium text-slate-900">{request.title}</p>
                            {request.description && (
                              <p className="text-sm text-slate-500 truncate max-w-xs">{request.description}</p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-slate-600 capitalize">{request.request_type}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-500">
                            {new Date(request.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Request Dialog */}
        <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Submit Asset Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Request Type</label>
                <Select value={requestForm.request_type} onValueChange={(v) => setRequestForm({...requestForm, request_type: v})}>
                  <SelectTrigger data-testid="request-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {(requestForm.request_type === 'new' || requestForm.request_type === 'replacement') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <Select value={requestForm.category_id} onValueChange={(v) => setRequestForm({...requestForm, category_id: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <Input
                  value={requestForm.title}
                  onChange={(e) => setRequestForm({...requestForm, title: e.target.value})}
                  placeholder="Brief description of your request"
                  required
                  data-testid="request-title-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <Textarea
                  value={requestForm.description}
                  onChange={(e) => setRequestForm({...requestForm, description: e.target.value})}
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <Select value={requestForm.priority} onValueChange={(v) => setRequestForm({...requestForm, priority: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setRequestDialogOpen(false); resetRequestForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="submit-request-btn">
                  <Send size={16} className="mr-2" />
                  Submit Request
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Return Dialog */}
        <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Return Asset</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleReturnAsset} className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-500">Returning:</p>
                <p className="font-medium">{selectedAsset?.name}</p>
                <p className="text-sm text-slate-500">{selectedAsset?.asset_tag}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
                <Select value={returnForm.condition} onValueChange={(v) => setReturnForm({...returnForm, condition: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_CONDITIONS.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <Textarea
                  value={returnForm.notes}
                  onChange={(e) => setReturnForm({...returnForm, notes: e.target.value})}
                  placeholder="Any notes about the return..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setReturnDialogOpen(false); resetReturnForm(); }}>
                  Cancel
                </Button>
                <Button type="submit">
                  <ArrowLeftRight size={16} className="mr-2" />
                  Return Asset
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Admin View
  return (
    <div className="p-4 lg:p-6 space-y-6" data-testid="admin-assets-view">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Asset Management</h1>
          <p className="text-slate-500 mt-1">Manage company assets and track assignments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchData()}>
            <RefreshCw size={18} className="mr-2" />
            Refresh
          </Button>
          <Button onClick={() => { resetAssetForm(); setAssetDialogOpen(true); }} data-testid="add-asset-btn">
            <Plus size={18} className="mr-2" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-slate-500 to-slate-600 rounded-2xl p-4 text-white">
          <Package className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-slate-200 text-sm">Total Assets</p>
          <p className="text-2xl font-bold">{stats?.total_assets || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white">
          <CheckCircle2 className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-emerald-100 text-sm">Available</p>
          <p className="text-2xl font-bold">{stats?.available || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
          <UserCheck className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-blue-100 text-sm">Assigned</p>
          <p className="text-2xl font-bold">{stats?.assigned || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white">
          <RefreshCw className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-amber-100 text-sm">Maintenance</p>
          <p className="text-2xl font-bold">{stats?.under_maintenance || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-4 text-white">
          <Clock className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-rose-100 text-sm">Pending Requests</p>
          <p className="text-2xl font-bold">{stats?.pending_requests || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 text-white">
          <DollarSign className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-indigo-100 text-sm">Total Value</p>
          <p className="text-2xl font-bold">${(stats?.total_value || 0).toLocaleString()}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="assets" data-testid="tab-all-assets">
            <Package size={16} className="mr-2" />
            All Assets
          </TabsTrigger>
          <TabsTrigger value="requests" data-testid="tab-requests">
            <FileText size={16} className="mr-2" />
            Requests
            {stats?.pending_requests > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-rose-500 text-white text-xs rounded-full">
                {stats.pending_requests}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories">
            <Settings size={16} className="mr-2" />
            Categories
          </TabsTrigger>
        </TabsList>

        {/* Assets Tab */}
        <TabsContent value="assets" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, tag, or serial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-assets-input"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter size={16} className="mr-2" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {ASSET_STATUSES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Tag size={16} className="mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assets Table */}
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No assets found</p>
              <Button className="mt-4" onClick={() => { resetAssetForm(); setAssetDialogOpen(true); }}>
                <Plus size={16} className="mr-2" />
                Add First Asset
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Asset</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Tag</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Assigned To</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Condition</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAssets.map(asset => {
                      const statusConfig = getStatusConfig(asset.status);
                      const conditionConfig = getConditionConfig(asset.condition);
                      const StatusIcon = statusConfig.icon;
                      return (
                        <tr key={asset.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-slate-900">{asset.name}</p>
                              {asset.model && <p className="text-sm text-slate-500">{asset.manufacturer} {asset.model}</p>}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <code className="bg-slate-100 px-2 py-1 rounded text-sm">{asset.asset_tag}</code>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{asset.category_name || '-'}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              <StatusIcon size={12} />
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{asset.assigned_to_name || '-'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${conditionConfig.color}`}>
                              {conditionConfig.label}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => viewAssetHistory(asset)} title="View History">
                                <History size={16} />
                              </Button>
                              {asset.status === 'available' && (
                                <Button variant="ghost" size="sm" onClick={() => openAssignDialog(asset)} title="Assign">
                                  <UserCheck size={16} />
                                </Button>
                              )}
                              {asset.status === 'assigned' && (
                                <Button variant="ghost" size="sm" onClick={() => openReturnDialog(asset)} title="Return">
                                  <ArrowLeftRight size={16} />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => openEditAsset(asset)} title="Edit">
                                <Edit2 size={16} />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteAsset(asset.id)} title="Delete" className="text-rose-600 hover:text-rose-700">
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
            </div>
          )}
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="mt-4">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No requests found</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Request</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Employee</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Priority</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map(request => {
                    const statusConfig = getRequestStatusConfig(request.status);
                    return (
                      <tr key={request.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900">{request.title}</p>
                          {request.description && (
                            <p className="text-sm text-slate-500 truncate max-w-xs">{request.description}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{request.employee_name}</td>
                        <td className="py-3 px-4 text-slate-600 capitalize">{request.request_type}</td>
                        <td className="py-3 px-4 text-slate-600">{request.category_name || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            request.priority === 'urgent' ? 'bg-rose-100 text-rose-700' :
                            request.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                            request.priority === 'low' ? 'bg-slate-100 text-slate-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {request.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500">
                          {new Date(request.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-1">
                            {request.status === 'pending' && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => handleApproveRequest(request.id)} className="text-emerald-600" title="Approve">
                                  <Check size={16} />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleRejectRequest(request.id)} className="text-rose-600" title="Reject">
                                  <XCircle size={16} />
                                </Button>
                              </>
                            )}
                            {request.status === 'approved' && (
                              <Button variant="ghost" size="sm" onClick={() => handleFulfillRequest(request)} className="text-blue-600" title="Fulfill">
                                <Package size={16} />
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
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-slate-500">Manage asset categories</p>
            <div className="flex gap-2">
              {categories.length === 0 && (
                <Button variant="outline" onClick={handleAddDefaultCategories}>
                  Add Default Categories
                </Button>
              )}
              <Button onClick={() => { resetCategoryForm(); setCategoryDialogOpen(true); }} data-testid="add-category-btn">
                <Plus size={16} className="mr-2" />
                Add Category
              </Button>
            </div>
          </div>
          
          {categories.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Tag className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No categories yet</p>
              <Button className="mt-4" onClick={handleAddDefaultCategories}>
                Add Default Categories
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {categories.map(category => {
                const Icon = getCategoryIcon(category.icon);
                const assetCount = assets.filter(a => a.category_id === category.id).length;
                return (
                  <div key={category.id} className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: category.color }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{category.name}</h3>
                          <p className="text-sm text-slate-500">{assetCount} assets</p>
                        </div>
                      </div>
                    </div>
                    {category.description && (
                      <p className="text-sm text-slate-500 mb-4">{category.description}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setEditingCategory(category);
                          setCategoryForm({
                            name: category.name,
                            description: category.description || '',
                            icon: category.icon || 'box',
                            color: category.color || '#64748B',
                          });
                          setCategoryDialogOpen(true);
                        }}
                      >
                        <Edit2 size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-rose-600 hover:text-rose-700"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Asset Dialog */}
      <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAsset ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAsset} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Asset Name *</label>
                <Input
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({...assetForm, name: e.target.value})}
                  placeholder="MacBook Pro 16"
                  required
                  data-testid="asset-name-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Asset Tag *</label>
                <Input
                  value={assetForm.asset_tag}
                  onChange={(e) => setAssetForm({...assetForm, asset_tag: e.target.value})}
                  placeholder="LAPTOP-001"
                  required
                  data-testid="asset-tag-input"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <Select value={assetForm.category_id} onValueChange={(v) => setAssetForm({...assetForm, category_id: v})}>
                  <SelectTrigger data-testid="asset-category-select">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <Select value={assetForm.status} onValueChange={(v) => setAssetForm({...assetForm, status: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number</label>
                <Input
                  value={assetForm.serial_number}
                  onChange={(e) => setAssetForm({...assetForm, serial_number: e.target.value})}
                  placeholder="ABC123XYZ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                <Input
                  value={assetForm.model}
                  onChange={(e) => setAssetForm({...assetForm, model: e.target.value})}
                  placeholder="Pro 16-inch M3 Max"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Manufacturer</label>
                <Input
                  value={assetForm.manufacturer}
                  onChange={(e) => setAssetForm({...assetForm, manufacturer: e.target.value})}
                  placeholder="Apple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
                <Select value={assetForm.condition} onValueChange={(v) => setAssetForm({...assetForm, condition: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_CONDITIONS.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Date</label>
                <Input
                  type="date"
                  value={assetForm.purchase_date}
                  onChange={(e) => setAssetForm({...assetForm, purchase_date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Price</label>
                <Input
                  type="number"
                  value={assetForm.purchase_price}
                  onChange={(e) => setAssetForm({...assetForm, purchase_price: e.target.value})}
                  placeholder="2499.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Warranty Expiry</label>
                <Input
                  type="date"
                  value={assetForm.warranty_expiry}
                  onChange={(e) => setAssetForm({...assetForm, warranty_expiry: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <Input
                value={assetForm.location}
                onChange={(e) => setAssetForm({...assetForm, location: e.target.value})}
                placeholder="Main Office - Floor 3"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <Textarea
                value={assetForm.description}
                onChange={(e) => setAssetForm({...assetForm, description: e.target.value})}
                placeholder="Additional details..."
                rows={2}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setAssetDialogOpen(false); resetAssetForm(); }}>
                Cancel
              </Button>
              <Button type="submit" data-testid="save-asset-btn">
                {editingAsset ? 'Update Asset' : 'Create Asset'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                placeholder="Laptops"
                required
                data-testid="category-name-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                placeholder="Description..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Icon</label>
                <Select value={categoryForm.icon} onValueChange={(v) => setCategoryForm({...categoryForm, icon: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="laptop">Laptop</SelectItem>
                    <SelectItem value="monitor">Monitor</SelectItem>
                    <SelectItem value="smartphone">Phone</SelectItem>
                    <SelectItem value="printer">Printer</SelectItem>
                    <SelectItem value="armchair">Furniture</SelectItem>
                    <SelectItem value="car">Vehicle</SelectItem>
                    <SelectItem value="hard-drive">Storage</SelectItem>
                    <SelectItem value="box">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                <Input
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({...categoryForm, color: e.target.value})}
                  className="h-10 p-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setCategoryDialogOpen(false); resetCategoryForm(); }}>
                Cancel
              </Button>
              <Button type="submit" data-testid="save-category-btn">
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignAsset} className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-500">Assigning:</p>
              <p className="font-medium">{selectedAsset?.name}</p>
              <p className="text-sm text-slate-500">{selectedAsset?.asset_tag}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Employee *</label>
              <Select value={assignForm.employee_id} onValueChange={(v) => setAssignForm({...assignForm, employee_id: v})}>
                <SelectTrigger data-testid="assign-employee-select">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assignment Date</label>
                <Input
                  type="date"
                  value={assignForm.assigned_date}
                  onChange={(e) => setAssignForm({...assignForm, assigned_date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expected Return</label>
                <Input
                  type="date"
                  value={assignForm.expected_return_date}
                  onChange={(e) => setAssignForm({...assignForm, expected_return_date: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <Textarea
                value={assignForm.notes}
                onChange={(e) => setAssignForm({...assignForm, notes: e.target.value})}
                placeholder="Assignment notes..."
                rows={2}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setAssignDialogOpen(false); resetAssignForm(); }}>
                Cancel
              </Button>
              <Button type="submit" data-testid="confirm-assign-btn">
                <UserCheck size={16} className="mr-2" />
                Assign Asset
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Return Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReturnAsset} className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-500">Returning:</p>
              <p className="font-medium">{selectedAsset?.name}</p>
              <p className="text-sm text-slate-500">{selectedAsset?.asset_tag}</p>
              {selectedAsset?.assigned_to_name && (
                <p className="text-sm text-slate-500 mt-2">Currently assigned to: {selectedAsset.assigned_to_name}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
                <Select value={returnForm.condition} onValueChange={(v) => setReturnForm({...returnForm, condition: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_CONDITIONS.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Status</label>
                <Select value={returnForm.new_status} onValueChange={(v) => setReturnForm({...returnForm, new_status: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <Textarea
                value={returnForm.notes}
                onChange={(e) => setReturnForm({...returnForm, notes: e.target.value})}
                placeholder="Return notes..."
                rows={2}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setReturnDialogOpen(false); resetReturnForm(); }}>
                Cancel
              </Button>
              <Button type="submit">
                <ArrowLeftRight size={16} className="mr-2" />
                Return Asset
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Asset History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="font-medium">{selectedAsset?.name}</p>
              <p className="text-sm text-slate-500">{selectedAsset?.asset_tag}</p>
            </div>
            
            {assetHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <History className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p>No assignment history</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {assetHistory.map(record => (
                  <div key={record.id} className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{record.employee_name}</p>
                        <p className="text-sm text-slate-500">
                          {record.assigned_date} - {record.actual_return_date || 'Present'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === 'active' ? 'bg-blue-100 text-blue-700' :
                        record.status === 'returned' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                    {record.return_notes && (
                      <p className="text-sm text-slate-500 mt-2">{record.return_notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Assets;
