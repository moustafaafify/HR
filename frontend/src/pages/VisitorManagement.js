import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Users,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  BadgeCheck,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  Printer,
  QrCode,
  Building2,
  Phone,
  Mail,
  Briefcase,
  MapPin,
  Eye,
  ChevronRight,
  AlertCircle,
  User,
  FileSignature,
  Laptop,
  Camera,
  Package
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const VisitorManagement = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');
  
  // Data
  const [dashboard, setDashboard] = useState(null);
  const [myDashboard, setMyDashboard] = useState(null);
  const [visitors, setVisitors] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // Dialogs
  const [visitorDialog, setVisitorDialog] = useState(false);
  const [checkInDialog, setCheckInDialog] = useState(false);
  const [badgeDialog, setBadgeDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [walkInDialog, setWalkInDialog] = useState(false);
  
  // Selected items
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [badgeData, setBadgeData] = useState(null);
  
  // Forms
  const [visitorForm, setVisitorForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    visit_type: 'meeting',
    purpose: '',
    host_employee_id: '',
    expected_date: new Date().toISOString().split('T')[0],
    expected_time: '09:00',
    expected_duration_minutes: 60,
    building: '',
    meeting_room: '',
    notes: '',
    special_instructions: ''
  });
  
  const [checkInForm, setCheckInForm] = useState({
    id_type: 'drivers_license',
    id_number: '',
    has_laptop: false,
    has_camera: false,
    other_items: '',
    nda_signed: false
  });
  
  const [walkInForm, setWalkInForm] = useState({
    first_name: '',
    last_name: '',
    company: '',
    visit_type: 'meeting',
    purpose: '',
    host_employee_id: ''
  });
  
  // Filters
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    status: '',
    search: ''
  });
  
  // History
  const [history, setHistory] = useState([]);
  const [historyFilters, setHistoryFilters] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  
  const badgeRef = useRef(null);
  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin' || user?.role === 'branch_manager';
  
  // Fetch functions
  const fetchDashboard = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/visitors/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboard(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  }, [token]);
  
  const fetchMyDashboard = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/visitors/my-dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyDashboard(response.data);
    } catch (error) {
      console.error('Error fetching my dashboard:', error);
    }
  }, [token]);
  
  const fetchVisitors = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.date) params.append('date', filters.date);
      if (filters.status) params.append('status', filters.status);
      
      const response = await axios.get(`${API}/visitors?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVisitors(response.data);
    } catch (error) {
      console.error('Error fetching visitors:', error);
    }
  }, [token, filters]);
  
  const fetchEmployees = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, [token]);
  
  const fetchHistory = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const params = new URLSearchParams();
      if (historyFilters.start_date) params.append('start_date', historyFilters.start_date);
      if (historyFilters.end_date) params.append('end_date', historyFilters.end_date);
      
      const response = await axios.get(`${API}/visitors/history?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  }, [token, isAdmin, historyFilters]);
  
  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchEmployees();
        if (isAdmin) {
          await fetchDashboard();
          await fetchHistory();
        }
        await fetchMyDashboard();
        await fetchVisitors();
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [isAdmin, fetchDashboard, fetchMyDashboard, fetchVisitors, fetchEmployees, fetchHistory]);
  
  // Handlers
  const handleSaveVisitor = async () => {
    try {
      if (selectedVisitor) {
        await axios.put(`${API}/visitors/${selectedVisitor.id}`, visitorForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Visitor updated');
      } else {
        await axios.post(`${API}/visitors`, visitorForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Visitor pre-registered');
      }
      
      setVisitorDialog(false);
      setSelectedVisitor(null);
      fetchVisitors();
      fetchDashboard();
      fetchMyDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save visitor');
    }
  };
  
  const handleDeleteVisitor = async (id) => {
    if (!confirm('Are you sure you want to cancel this visitor registration?')) return;
    
    try {
      await axios.delete(`${API}/visitors/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Visitor registration cancelled');
      fetchVisitors();
      fetchDashboard();
      fetchMyDashboard();
    } catch (error) {
      toast.error('Failed to delete visitor');
    }
  };
  
  const handleCheckIn = async () => {
    if (!selectedVisitor) return;
    
    try {
      await axios.post(`${API}/visitors/${selectedVisitor.id}/check-in`, checkInForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Visitor checked in');
      setCheckInDialog(false);
      setSelectedVisitor(null);
      fetchVisitors();
      fetchDashboard();
      fetchMyDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to check in visitor');
    }
  };
  
  const handleCheckOut = async (visitorId) => {
    try {
      await axios.post(`${API}/visitors/${visitorId}/check-out`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Visitor checked out');
      fetchVisitors();
      fetchDashboard();
      fetchMyDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to check out visitor');
    }
  };
  
  const handlePrintBadge = async (visitorId) => {
    try {
      const response = await axios.get(`${API}/visitors/${visitorId}/badge`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBadgeData(response.data);
      setBadgeDialog(true);
      
      // Mark as printed
      await axios.post(`${API}/visitors/${visitorId}/print-badge`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      toast.error('Failed to generate badge');
    }
  };
  
  const handleWalkIn = async () => {
    try {
      await axios.post(`${API}/visitors/walk-in`, walkInForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Walk-in visitor registered and checked in');
      setWalkInDialog(false);
      setWalkInForm({
        first_name: '',
        last_name: '',
        company: '',
        visit_type: 'meeting',
        purpose: '',
        host_employee_id: ''
      });
      fetchVisitors();
      fetchDashboard();
      fetchMyDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to register walk-in');
    }
  };
  
  const printBadge = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Visitor Badge</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .badge { width: 300px; border: 2px solid #000; padding: 20px; text-align: center; }
            .badge-header { background: #4f46e5; color: white; padding: 10px; margin: -20px -20px 20px -20px; }
            .visitor-name { font-size: 24px; font-weight: bold; margin: 10px 0; }
            .company { font-size: 16px; color: #666; }
            .host { font-size: 14px; margin: 15px 0; }
            .badge-number { font-size: 20px; font-weight: bold; background: #f0f0f0; padding: 10px; margin: 15px 0; }
            .date { font-size: 12px; color: #666; }
            .qr-placeholder { width: 100px; height: 100px; background: #f0f0f0; margin: 10px auto; display: flex; align-items: center; justify-content: center; }
          </style>
        </head>
        <body>
          <div class="badge">
            <div class="badge-header">VISITOR</div>
            <div class="visitor-name">${badgeData?.badge_data?.visitor_name || ''}</div>
            <div class="company">${badgeData?.badge_data?.company || ''}</div>
            <div class="host">Host: ${badgeData?.badge_data?.host_name || 'N/A'}</div>
            <div class="badge-number">${badgeData?.badge_data?.badge_number || ''}</div>
            <div class="date">${badgeData?.badge_data?.visit_date || ''}</div>
            <div class="qr-placeholder">QR</div>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
  };
  
  // Utility functions
  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    if (timeStr.includes('T')) {
      return new Date(timeStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return timeStr;
  };
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const getStatusColor = (status) => {
    const colors = {
      pre_registered: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      checked_in: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      checked_out: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
      cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
      no_show: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };
  
  const getVisitTypeIcon = (type) => {
    const icons = {
      meeting: Users,
      interview: Briefcase,
      delivery: Package,
      contractor: Building2,
      event: Calendar,
      other: User
    };
    return icons[type] || Users;
  };
  
  const openNewVisitor = () => {
    setSelectedVisitor(null);
    setVisitorForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company: '',
      visit_type: 'meeting',
      purpose: '',
      host_employee_id: '',
      expected_date: new Date().toISOString().split('T')[0],
      expected_time: '09:00',
      expected_duration_minutes: 60,
      building: '',
      meeting_room: '',
      notes: '',
      special_instructions: ''
    });
    setVisitorDialog(true);
  };
  
  const openEditVisitor = (visitor) => {
    setSelectedVisitor(visitor);
    setVisitorForm({
      first_name: visitor.first_name || '',
      last_name: visitor.last_name || '',
      email: visitor.email || '',
      phone: visitor.phone || '',
      company: visitor.company || '',
      visit_type: visitor.visit_type || 'meeting',
      purpose: visitor.purpose || '',
      host_employee_id: visitor.host_employee_id || '',
      expected_date: visitor.expected_date || '',
      expected_time: visitor.expected_time || '',
      expected_duration_minutes: visitor.expected_duration_minutes || 60,
      building: visitor.building || '',
      meeting_room: visitor.meeting_room || '',
      notes: visitor.notes || '',
      special_instructions: visitor.special_instructions || ''
    });
    setVisitorDialog(true);
  };
  
  const openCheckIn = (visitor) => {
    setSelectedVisitor(visitor);
    setCheckInForm({
      id_type: 'drivers_license',
      id_number: '',
      has_laptop: false,
      has_camera: false,
      other_items: '',
      nda_signed: false
    });
    setCheckInDialog(true);
  };
  
  const openViewVisitor = (visitor) => {
    setSelectedVisitor(visitor);
    setViewDialog(true);
  };
  
  const filteredVisitors = visitors.filter(v => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const name = `${v.first_name} ${v.last_name}`.toLowerCase();
      const company = (v.company || '').toLowerCase();
      if (!name.includes(search) && !company.includes(search)) return false;
    }
    return true;
  });
  
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }
  
  // Render visitor card component
  const VisitorCard = ({ visitor, showActions = true }) => {
    const VisitIcon = getVisitTypeIcon(visitor.visit_type);
    
    return (
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl" data-testid={`visitor-card-${visitor.id}`}>
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => openViewVisitor(visitor)}>
          <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <VisitIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">
              {visitor.first_name} {visitor.last_name}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {visitor.company || 'No company'} • Host: {visitor.host_name || 'N/A'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {formatTime(visitor.expected_time)} • {visitor.visit_type}
              {visitor.badge_number && ` • Badge: ${visitor.badge_number}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(visitor.status)}`}>
            {visitor.status?.replace('_', ' ')}
          </span>
          {showActions && (
            <>
              <Button size="sm" variant="ghost" onClick={() => openViewVisitor(visitor)} data-testid={`view-visitor-${visitor.id}`}>
                <Eye className="w-4 h-4" />
              </Button>
              {visitor.status === 'pre_registered' && (
                <Button size="sm" onClick={() => openCheckIn(visitor)} data-testid={`checkin-visitor-${visitor.id}`}>
                  <LogIn className="w-4 h-4 mr-1" /> Check In
                </Button>
              )}
              {visitor.status === 'checked_in' && (
                <>
                  <Button size="sm" variant="outline" onClick={() => handlePrintBadge(visitor.id)} data-testid={`print-badge-${visitor.id}`}>
                    <Printer className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleCheckOut(visitor.id)} data-testid={`checkout-visitor-${visitor.id}`}>
                    <LogOut className="w-4 h-4 mr-1" /> Out
                  </Button>
                </>
              )}
              {visitor.status === 'pre_registered' && (
                <Button size="sm" variant="ghost" onClick={() => openEditVisitor(visitor)} data-testid={`edit-visitor-${visitor.id}`}>
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="p-4 lg:p-6 space-y-6" data-testid="visitor-management-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isAdmin ? 'Visitor Management' : 'My Visitors'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isAdmin ? 'Manage visitor registrations, check-ins, and badges' : 'Pre-register and manage your visitors'}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={() => setWalkInDialog(true)} data-testid="walk-in-btn">
              <LogIn className="w-4 h-4 mr-2" />
              Walk-in
            </Button>
          )}
          <Button onClick={openNewVisitor} data-testid="add-visitor-btn">
            <Plus className="w-4 h-4 mr-2" />
            Pre-register Visitor
          </Button>
        </div>
      </div>
      
      {/* Dashboard Summary */}
      {isAdmin && dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Today's Visitors</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{dashboard.summary.todays_visitors}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Checked In</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{dashboard.summary.checked_in}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Checked Out</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{dashboard.summary.checked_out}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Expected</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{dashboard.summary.pre_registered}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">On Site</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{dashboard.summary.currently_on_site}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Employee Summary */}
      {!isAdmin && myDashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Today's Visitors</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{myDashboard.summary.total_today}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Checked In</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{myDashboard.summary.checked_in}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Awaiting</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{myDashboard.summary.awaiting}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Upcoming</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{myDashboard.summary.upcoming_count}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="all">All Visitors</TabsTrigger>
            {isAdmin && <TabsTrigger value="on-site">On Site</TabsTrigger>}
            {isAdmin && <TabsTrigger value="history">History</TabsTrigger>}
          </TabsList>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search visitors..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9 w-[200px] bg-white dark:bg-slate-800"
              />
            </div>
            {activeTab === 'all' && (
              <Input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="w-[150px] bg-white dark:bg-slate-800"
              />
            )}
          </div>
        </div>
        
        {/* Today Tab */}
        <TabsContent value="today" className="mt-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Today's Visitors</h3>
            {(isAdmin ? dashboard?.todays_visitors : myDashboard?.todays_visitors)?.length > 0 ? (
              <div className="space-y-3">
                {(isAdmin ? dashboard?.todays_visitors : myDashboard?.todays_visitors)?.map((visitor) => (
                  <VisitorCard key={visitor.id} visitor={visitor} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400">No visitors scheduled for today</p>
                <Button className="mt-4" onClick={openNewVisitor}>Pre-register a Visitor</Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Upcoming Tab */}
        <TabsContent value="upcoming" className="mt-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Upcoming Visitors (Next 7 Days)</h3>
            {(isAdmin ? dashboard?.upcoming_visitors : myDashboard?.upcoming_visitors)?.length > 0 ? (
              <div className="space-y-3">
                {(isAdmin ? dashboard?.upcoming_visitors : myDashboard?.upcoming_visitors)?.map((visitor) => (
                  <div key={visitor.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {visitor.first_name} {visitor.last_name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {visitor.company || 'No company'} • Host: {visitor.host_name || 'N/A'}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {formatDate(visitor.expected_date)} at {formatTime(visitor.expected_time)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(visitor.status)}`}>
                        {visitor.status?.replace('_', ' ')}
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => openEditVisitor(visitor)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteVisitor(visitor.id)}>
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400">No upcoming visitors</p>
                <Button className="mt-4" onClick={openNewVisitor}>Pre-register a Visitor</Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* All Visitors Tab */}
        <TabsContent value="all" className="mt-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">All Visitors</h3>
            {filteredVisitors.length > 0 ? (
              <div className="space-y-3">
                {filteredVisitors.map((visitor) => (
                  <VisitorCard key={visitor.id} visitor={visitor} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400">No visitors found</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* On Site Tab (Admin only) */}
        {isAdmin && (
          <TabsContent value="on-site" className="mt-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Currently On Site</h3>
              {dashboard?.recent_checkins?.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.recent_checkins.map((visitor) => (
                    <div key={visitor.id} className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <BadgeCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {visitor.first_name} {visitor.last_name}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {visitor.company || 'No company'} • Badge: {visitor.badge_number || 'N/A'}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            Checked in at {formatTime(visitor.check_in_time)} • Host: {visitor.host_name || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handlePrintBadge(visitor.id)}>
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button size="sm" onClick={() => handleCheckOut(visitor.id)}>
                          <LogOut className="w-4 h-4 mr-1" /> Check Out
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No visitors currently on site</p>
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
      
      {/* Visitor Registration Dialog */}
      <Dialog open={visitorDialog} onOpenChange={setVisitorDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">
              {selectedVisitor ? 'Edit Visitor' : 'Pre-register Visitor'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">First Name *</label>
                <Input
                  value={visitorForm.first_name}
                  onChange={(e) => setVisitorForm({ ...visitorForm, first_name: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Last Name *</label>
                <Input
                  value={visitorForm.last_name}
                  onChange={(e) => setVisitorForm({ ...visitorForm, last_name: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Email</label>
                <Input
                  type="email"
                  value={visitorForm.email}
                  onChange={(e) => setVisitorForm({ ...visitorForm, email: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Phone</label>
                <Input
                  value={visitorForm.phone}
                  onChange={(e) => setVisitorForm({ ...visitorForm, phone: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Company</label>
                <Input
                  value={visitorForm.company}
                  onChange={(e) => setVisitorForm({ ...visitorForm, company: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Visit Type</label>
                <Select value={visitorForm.visit_type} onValueChange={(v) => setVisitorForm({ ...visitorForm, visit_type: v })}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Host Employee</label>
                <Select value={visitorForm.host_employee_id || "self"} onValueChange={(v) => setVisitorForm({ ...visitorForm, host_employee_id: v === "self" ? "" : v })}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Myself" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="self">Myself</SelectItem>
                    {employees.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Expected Date *</label>
                <Input
                  type="date"
                  value={visitorForm.expected_date}
                  onChange={(e) => setVisitorForm({ ...visitorForm, expected_date: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Expected Time</label>
                <Input
                  type="time"
                  value={visitorForm.expected_time}
                  onChange={(e) => setVisitorForm({ ...visitorForm, expected_time: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Purpose of Visit</label>
                <Input
                  value={visitorForm.purpose}
                  onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })}
                  placeholder="e.g., Project discussion, Job interview"
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Building</label>
                <Input
                  value={visitorForm.building}
                  onChange={(e) => setVisitorForm({ ...visitorForm, building: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Meeting Room</label>
                <Input
                  value={visitorForm.meeting_room}
                  onChange={(e) => setVisitorForm({ ...visitorForm, meeting_room: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Notes</label>
                <Textarea
                  value={visitorForm.notes}
                  onChange={(e) => setVisitorForm({ ...visitorForm, notes: e.target.value })}
                  rows={2}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" onClick={() => setVisitorDialog(false)} className="dark:border-slate-600 dark:text-slate-200">Cancel</Button>
              <Button onClick={handleSaveVisitor}>{selectedVisitor ? 'Update' : 'Pre-register'} Visitor</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Check-in Dialog */}
      <Dialog open={checkInDialog} onOpenChange={setCheckInDialog}>
        <DialogContent className="max-w-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">
              Check In: {selectedVisitor?.first_name} {selectedVisitor?.last_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <p className="text-sm text-slate-500 dark:text-slate-400">Company: {selectedVisitor?.company || 'N/A'}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Host: {selectedVisitor?.host_name || 'N/A'}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Purpose: {selectedVisitor?.purpose || 'N/A'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">ID Type</label>
                <Select value={checkInForm.id_type} onValueChange={(v) => setCheckInForm({ ...checkInForm, id_type: v })}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="drivers_license">Driver's License</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="national_id">National ID</SelectItem>
                    <SelectItem value="employee_id">Employee ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">ID Number</label>
                <Input
                  value={checkInForm.id_number}
                  onChange={(e) => setCheckInForm({ ...checkInForm, id_number: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkInForm.has_laptop}
                  onChange={(e) => setCheckInForm({ ...checkInForm, has_laptop: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600"
                />
                <Laptop className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-700 dark:text-slate-200">Laptop</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkInForm.has_camera}
                  onChange={(e) => setCheckInForm({ ...checkInForm, has_camera: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600"
                />
                <Camera className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-700 dark:text-slate-200">Camera</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkInForm.nda_signed}
                  onChange={(e) => setCheckInForm({ ...checkInForm, nda_signed: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600"
                />
                <FileSignature className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-700 dark:text-slate-200">NDA Signed</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Other Items</label>
              <Input
                value={checkInForm.other_items}
                onChange={(e) => setCheckInForm({ ...checkInForm, other_items: e.target.value })}
                placeholder="List any other items..."
                className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" onClick={() => setCheckInDialog(false)} className="dark:border-slate-600 dark:text-slate-200">Cancel</Button>
              <Button onClick={handleCheckIn}>
                <LogIn className="w-4 h-4 mr-2" /> Check In
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Walk-in Dialog */}
      <Dialog open={walkInDialog} onOpenChange={setWalkInDialog}>
        <DialogContent className="max-w-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">Walk-in Visitor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">First Name *</label>
                <Input
                  value={walkInForm.first_name}
                  onChange={(e) => setWalkInForm({ ...walkInForm, first_name: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Last Name *</label>
                <Input
                  value={walkInForm.last_name}
                  onChange={(e) => setWalkInForm({ ...walkInForm, last_name: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Company</label>
              <Input
                value={walkInForm.company}
                onChange={(e) => setWalkInForm({ ...walkInForm, company: e.target.value })}
                className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Visit Type</label>
                <Select value={walkInForm.visit_type} onValueChange={(v) => setWalkInForm({ ...walkInForm, visit_type: v })}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Host</label>
                <Select value={walkInForm.host_employee_id || "self"} onValueChange={(v) => setWalkInForm({ ...walkInForm, host_employee_id: v === "self" ? "" : v })}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Myself" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="self">Myself</SelectItem>
                    {employees.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Purpose</label>
              <Input
                value={walkInForm.purpose}
                onChange={(e) => setWalkInForm({ ...walkInForm, purpose: e.target.value })}
                className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" onClick={() => setWalkInDialog(false)} className="dark:border-slate-600 dark:text-slate-200">Cancel</Button>
              <Button onClick={handleWalkIn}>
                <LogIn className="w-4 h-4 mr-2" /> Register & Check In
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Badge Preview Dialog */}
      <Dialog open={badgeDialog} onOpenChange={setBadgeDialog}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">Visitor Badge</DialogTitle>
          </DialogHeader>
          <div className="mt-4" ref={badgeRef}>
            <div className="border-2 border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center">
              <div className="bg-indigo-600 text-white py-2 -mx-6 -mt-6 mb-4 rounded-t-xl">
                <p className="text-lg font-bold">VISITOR</p>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {badgeData?.badge_data?.visitor_name}
              </p>
              <p className="text-slate-500 dark:text-slate-400 mb-4">{badgeData?.badge_data?.company || ''}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Host: {badgeData?.badge_data?.host_name || 'N/A'}
              </p>
              <div className="bg-slate-100 dark:bg-slate-700 py-3 px-4 rounded-lg mb-4">
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {badgeData?.badge_data?.badge_number}
                </p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {badgeData?.badge_data?.visit_date}
              </p>
              <div className="mt-4 w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center">
                <QrCode className="w-12 h-12 text-slate-400" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setBadgeDialog(false)} className="dark:border-slate-600 dark:text-slate-200">Close</Button>
            <Button onClick={printBadge}>
              <Printer className="w-4 h-4 mr-2" /> Print Badge
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VisitorManagement;
