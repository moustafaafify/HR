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
  Plane,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Check,
  X,
  Clock,
  Search,
  RefreshCw,
  MapPin,
  Calendar,
  DollarSign,
  Building2,
  Car,
  Train,
  Bus,
  Hotel,
  FileText,
  Send,
  PlayCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Globe,
  Briefcase,
  Users,
  TrendingUp
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TRIP_TYPE_CONFIG = {
  domestic: { label: 'Domestic', color: 'bg-blue-100 text-blue-700' },
  international: { label: 'International', color: 'bg-purple-100 text-purple-700' },
};

const PURPOSE_CONFIG = {
  business_meeting: { label: 'Business Meeting', icon: Briefcase },
  conference: { label: 'Conference', icon: Users },
  training: { label: 'Training', icon: FileText },
  client_visit: { label: 'Client Visit', icon: Building2 },
  site_visit: { label: 'Site Visit', icon: MapPin },
  other: { label: 'Other', icon: Globe },
};

const TRANSPORT_CONFIG = {
  flight: { label: 'Flight', icon: Plane },
  train: { label: 'Train', icon: Train },
  bus: { label: 'Bus', icon: Bus },
  car: { label: 'Car/Taxi', icon: Car },
  rental: { label: 'Rental Car', icon: Car },
  other: { label: 'Other', icon: Globe },
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: Check },
  rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-700', icon: XCircle },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: PlayCircle },
  completed: { label: 'Completed', color: 'bg-slate-100 text-slate-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500', icon: X },
};

const Travel = () => {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState(null);
  
  // Data
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Dialogs
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  
  // Selected items
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  
  // Forms
  const [requestForm, setRequestForm] = useState({
    trip_type: 'domestic',
    purpose: 'business_meeting',
    purpose_details: '',
    destination_city: '',
    destination_country: '',
    departure_date: '',
    return_date: '',
    transportation_type: 'flight',
    transportation_details: '',
    flight_class: 'economy',
    accommodation_required: true,
    accommodation_type: 'hotel',
    hotel_name: '',
    check_in_date: '',
    check_out_date: '',
    estimated_transportation_cost: '',
    estimated_accommodation_cost: '',
    estimated_meals_cost: '',
    estimated_other_cost: '',
    itinerary: '',
    meetings_scheduled: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: '',
  });
  
  const [rejectForm, setRejectForm] = useState({ reason: '' });
  
  const [completeForm, setCompleteForm] = useState({
    actual_transportation_cost: '',
    actual_accommodation_cost: '',
    actual_meals_cost: '',
    actual_other_cost: '',
    trip_report: '',
  });

  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  // Fetch functions
  const fetchStats = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await axios.get(`${API}/travel/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [isAdmin]);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/travel`);
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
  }, []);

  const fetchMyRequests = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/travel/my`);
      setMyRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch my requests:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchRequests(),
        fetchMyRequests(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchRequests, fetchMyRequests]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter requests
  const filteredRequests = (isAdmin ? requests : myRequests).filter(req => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const refMatch = req.reference_number?.toLowerCase().includes(query);
      const destMatch = req.destination_city?.toLowerCase().includes(query);
      const nameMatch = req.employee_name?.toLowerCase().includes(query);
      if (!refMatch && !destMatch && !nameMatch) return false;
    }
    if (statusFilter !== 'all' && req.status !== statusFilter) return false;
    if (activeTab !== 'all') {
      if (activeTab === 'pending' && req.status !== 'pending') return false;
      if (activeTab === 'approved' && !['approved', 'in_progress'].includes(req.status)) return false;
      if (activeTab === 'completed' && req.status !== 'completed') return false;
    }
    return true;
  });

  // Handlers
  const handleSaveRequest = async (e) => {
    e.preventDefault();
    try {
      if (editingRequest) {
        await axios.put(`${API}/travel/${editingRequest.id}`, requestForm);
        toast.success('Travel request updated');
      } else {
        await axios.post(`${API}/travel`, requestForm);
        toast.success('Travel request submitted');
      }
      fetchData();
      setRequestDialogOpen(false);
      resetRequestForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save travel request');
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await axios.post(`${API}/travel/${requestId}/approve`);
      toast.success('Travel request approved');
      fetchData();
      if (selectedRequest?.id === requestId) {
        const updated = await axios.get(`${API}/travel/${requestId}`);
        setSelectedRequest(updated.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to approve');
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      await axios.post(`${API}/travel/${selectedRequest.id}/reject`, rejectForm);
      toast.success('Travel request rejected');
      fetchData();
      setRejectDialogOpen(false);
      setRejectForm({ reason: '' });
      const updated = await axios.get(`${API}/travel/${selectedRequest.id}`);
      setSelectedRequest(updated.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reject');
    }
  };

  const handleStartTrip = async (requestId) => {
    try {
      await axios.post(`${API}/travel/${requestId}/start`);
      toast.success('Trip started');
      fetchData();
      if (selectedRequest?.id === requestId) {
        const updated = await axios.get(`${API}/travel/${requestId}`);
        setSelectedRequest(updated.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start trip');
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      await axios.post(`${API}/travel/${selectedRequest.id}/complete`, completeForm);
      toast.success('Trip completed');
      fetchData();
      setCompleteDialogOpen(false);
      setCompleteForm({
        actual_transportation_cost: '',
        actual_accommodation_cost: '',
        actual_meals_cost: '',
        actual_other_cost: '',
        trip_report: '',
      });
      const updated = await axios.get(`${API}/travel/${selectedRequest.id}`);
      setSelectedRequest(updated.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to complete');
    }
  };

  const handleCancel = async (requestId) => {
    if (!window.confirm('Cancel this travel request?')) return;
    try {
      await axios.post(`${API}/travel/${requestId}/cancel`);
      toast.success('Travel request cancelled');
      fetchData();
      if (selectedRequest?.id === requestId) {
        setViewDialogOpen(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to cancel');
    }
  };

  const handleDelete = async (requestId) => {
    if (!window.confirm('Delete this travel request? This cannot be undone.')) return;
    try {
      await axios.delete(`${API}/travel/${requestId}`);
      toast.success('Travel request deleted');
      fetchData();
      if (selectedRequest?.id === requestId) {
        setViewDialogOpen(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete');
    }
  };

  const openViewDialog = (request) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const openEditRequest = (request) => {
    setEditingRequest(request);
    setRequestForm({
      trip_type: request.trip_type || 'domestic',
      purpose: request.purpose || 'business_meeting',
      purpose_details: request.purpose_details || '',
      destination_city: request.destination_city || '',
      destination_country: request.destination_country || '',
      departure_date: request.departure_date || '',
      return_date: request.return_date || '',
      transportation_type: request.transportation_type || 'flight',
      transportation_details: request.transportation_details || '',
      flight_class: request.flight_class || 'economy',
      accommodation_required: request.accommodation_required ?? true,
      accommodation_type: request.accommodation_type || 'hotel',
      hotel_name: request.hotel_name || '',
      check_in_date: request.check_in_date || '',
      check_out_date: request.check_out_date || '',
      estimated_transportation_cost: request.estimated_transportation_cost || '',
      estimated_accommodation_cost: request.estimated_accommodation_cost || '',
      estimated_meals_cost: request.estimated_meals_cost || '',
      estimated_other_cost: request.estimated_other_cost || '',
      itinerary: request.itinerary || '',
      meetings_scheduled: request.meetings_scheduled || '',
      emergency_contact_name: request.emergency_contact_name || '',
      emergency_contact_phone: request.emergency_contact_phone || '',
      notes: request.notes || '',
    });
    setRequestDialogOpen(true);
  };

  const resetRequestForm = () => {
    setEditingRequest(null);
    setRequestForm({
      trip_type: 'domestic',
      purpose: 'business_meeting',
      purpose_details: '',
      destination_city: '',
      destination_country: '',
      departure_date: '',
      return_date: '',
      transportation_type: 'flight',
      transportation_details: '',
      flight_class: 'economy',
      accommodation_required: true,
      accommodation_type: 'hotel',
      hotel_name: '',
      check_in_date: '',
      check_out_date: '',
      estimated_transportation_cost: '',
      estimated_accommodation_cost: '',
      estimated_meals_cost: '',
      estimated_other_cost: '',
      itinerary: '',
      meetings_scheduled: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      notes: '',
    });
  };

  const calculateTotal = (form) => {
    return (
      parseFloat(form.estimated_transportation_cost || 0) +
      parseFloat(form.estimated_accommodation_cost || 0) +
      parseFloat(form.estimated_meals_cost || 0) +
      parseFloat(form.estimated_other_cost || 0)
    );
  };

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
      <div className="p-4 lg:p-6 space-y-6" data-testid="employee-travel-view">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">My Travel Requests</h1>
            <p className="text-slate-500 mt-1">Submit and track your business travel requests</p>
          </div>
          <Button onClick={() => { resetRequestForm(); setRequestDialogOpen(true); }} data-testid="new-travel-btn">
            <Plus size={18} className="mr-2" />
            New Travel Request
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{myRequests.filter(r => r.status === 'pending').length}</p>
                <p className="text-sm text-slate-500">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{myRequests.filter(r => r.status === 'approved').length}</p>
                <p className="text-sm text-slate-500">Approved</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Plane className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{myRequests.filter(r => r.status === 'in_progress').length}</p>
                <p className="text-sm text-slate-500">In Progress</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{myRequests.filter(r => r.status === 'completed').length}</p>
                <p className="text-sm text-slate-500">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Requests List */}
        {myRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <Plane className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600 font-medium">No Travel Requests</p>
            <p className="text-slate-500 text-sm mt-1">Submit your first travel request</p>
            <Button className="mt-4" onClick={() => { resetRequestForm(); setRequestDialogOpen(true); }}>
              <Plus size={16} className="mr-2" />
              New Travel Request
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {myRequests.map(request => {
              const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              const purposeConfig = PURPOSE_CONFIG[request.purpose] || PURPOSE_CONFIG.other;
              const PurposeIcon = purposeConfig.icon;
              
              return (
                <div 
                  key={request.id} 
                  className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => openViewDialog(request)}
                  data-testid={`travel-card-${request.id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <PurposeIcon className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{request.destination_city}</h3>
                        <p className="text-sm text-slate-500">{request.reference_number}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                      <StatusIcon size={14} />
                      {statusConfig.label}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-slate-500">Purpose</p>
                      <p className="font-medium">{purposeConfig.label}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Dates</p>
                      <p className="font-medium">{new Date(request.departure_date).toLocaleDateString()} - {new Date(request.return_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Trip Type</p>
                      <p className="font-medium">{TRIP_TYPE_CONFIG[request.trip_type]?.label}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Est. Budget</p>
                      <p className="font-medium">{formatCurrency(request.total_estimated_cost)}</p>
                    </div>
                  </div>
                  
                  {request.status === 'rejected' && request.rejection_reason && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 mb-4">
                      <p className="text-sm text-rose-700"><strong>Rejection Reason:</strong> {request.rejection_reason}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {request.status === 'pending' && (
                      <>
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openEditRequest(request); }}>
                          <Edit2 size={14} className="mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" className="text-rose-600" onClick={(e) => { e.stopPropagation(); handleCancel(request.id); }}>
                          <X size={14} className="mr-1" /> Cancel
                        </Button>
                      </>
                    )}
                    {request.status === 'approved' && (
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); handleStartTrip(request.id); }}>
                        <PlayCircle size={14} className="mr-1" /> Start Trip
                      </Button>
                    )}
                    {request.status === 'in_progress' && (
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); setSelectedRequest(request); setCompleteDialogOpen(true); }}>
                        <CheckCircle2 size={14} className="mr-1" /> Complete Trip
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Request Form Dialog */}
        <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRequest ? 'Edit Travel Request' : 'New Travel Request'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveRequest} className="space-y-6">
              {/* Trip Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Globe size={18} /> Trip Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Trip Type *</label>
                    <Select value={requestForm.trip_type} onValueChange={(v) => setRequestForm({...requestForm, trip_type: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="domestic">Domestic</SelectItem>
                        <SelectItem value="international">International</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Purpose *</label>
                    <Select value={requestForm.purpose} onValueChange={(v) => setRequestForm({...requestForm, purpose: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PURPOSE_CONFIG).map(([value, config]) => (
                          <SelectItem key={value} value={value}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Purpose Details</label>
                  <Textarea
                    value={requestForm.purpose_details}
                    onChange={(e) => setRequestForm({...requestForm, purpose_details: e.target.value})}
                    placeholder="Describe the purpose of your trip..."
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Destination City *</label>
                    <Input
                      value={requestForm.destination_city}
                      onChange={(e) => setRequestForm({...requestForm, destination_city: e.target.value})}
                      placeholder="e.g., New York"
                      required
                    />
                  </div>
                  {requestForm.trip_type === 'international' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Destination Country *</label>
                      <Input
                        value={requestForm.destination_country}
                        onChange={(e) => setRequestForm({...requestForm, destination_country: e.target.value})}
                        placeholder="e.g., United States"
                        required={requestForm.trip_type === 'international'}
                      />
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Departure Date *</label>
                    <Input
                      type="date"
                      value={requestForm.departure_date}
                      onChange={(e) => setRequestForm({...requestForm, departure_date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Return Date *</label>
                    <Input
                      type="date"
                      value={requestForm.return_date}
                      onChange={(e) => setRequestForm({...requestForm, return_date: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Transportation */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Plane size={18} /> Transportation
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Transportation Type *</label>
                    <Select value={requestForm.transportation_type} onValueChange={(v) => setRequestForm({...requestForm, transportation_type: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TRANSPORT_CONFIG).map(([value, config]) => (
                          <SelectItem key={value} value={value}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {requestForm.transportation_type === 'flight' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Flight Class</label>
                      <Select value={requestForm.flight_class} onValueChange={(v) => setRequestForm({...requestForm, flight_class: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="economy">Economy</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="first">First Class</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Transportation Details</label>
                  <Input
                    value={requestForm.transportation_details}
                    onChange={(e) => setRequestForm({...requestForm, transportation_details: e.target.value})}
                    placeholder="Preferred airlines, routes, etc."
                  />
                </div>
              </div>

              {/* Accommodation */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Hotel size={18} /> Accommodation
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="accommodation_required"
                    checked={requestForm.accommodation_required}
                    onChange={(e) => setRequestForm({...requestForm, accommodation_required: e.target.checked})}
                    className="rounded"
                  />
                  <label htmlFor="accommodation_required" className="text-sm font-medium text-slate-700">Accommodation Required</label>
                </div>
                
                {requestForm.accommodation_required && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Accommodation Type</label>
                        <Select value={requestForm.accommodation_type} onValueChange={(v) => setRequestForm({...requestForm, accommodation_type: v})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hotel">Hotel</SelectItem>
                            <SelectItem value="airbnb">Airbnb</SelectItem>
                            <SelectItem value="company_guest_house">Company Guest House</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Hotel/Property Name</label>
                        <Input
                          value={requestForm.hotel_name}
                          onChange={(e) => setRequestForm({...requestForm, hotel_name: e.target.value})}
                          placeholder="Preferred hotel"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Check-in Date</label>
                        <Input
                          type="date"
                          value={requestForm.check_in_date}
                          onChange={(e) => setRequestForm({...requestForm, check_in_date: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Check-out Date</label>
                        <Input
                          type="date"
                          value={requestForm.check_out_date}
                          onChange={(e) => setRequestForm({...requestForm, check_out_date: e.target.value})}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Budget */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <DollarSign size={18} /> Estimated Budget
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Transportation</label>
                    <Input
                      type="number"
                      value={requestForm.estimated_transportation_cost}
                      onChange={(e) => setRequestForm({...requestForm, estimated_transportation_cost: e.target.value})}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Accommodation</label>
                    <Input
                      type="number"
                      value={requestForm.estimated_accommodation_cost}
                      onChange={(e) => setRequestForm({...requestForm, estimated_accommodation_cost: e.target.value})}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Meals</label>
                    <Input
                      type="number"
                      value={requestForm.estimated_meals_cost}
                      onChange={(e) => setRequestForm({...requestForm, estimated_meals_cost: e.target.value})}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Other</label>
                    <Input
                      type="number"
                      value={requestForm.estimated_other_cost}
                      onChange={(e) => setRequestForm({...requestForm, estimated_other_cost: e.target.value})}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 flex justify-between items-center">
                  <span className="font-medium text-slate-700">Total Estimated Budget:</span>
                  <span className="text-xl font-bold text-indigo-600">{formatCurrency(calculateTotal(requestForm))}</span>
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <FileText size={18} /> Additional Details
                </h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Itinerary</label>
                  <Textarea
                    value={requestForm.itinerary}
                    onChange={(e) => setRequestForm({...requestForm, itinerary: e.target.value})}
                    placeholder="Day-by-day itinerary..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Meetings Scheduled</label>
                  <Textarea
                    value={requestForm.meetings_scheduled}
                    onChange={(e) => setRequestForm({...requestForm, meetings_scheduled: e.target.value})}
                    placeholder="List of scheduled meetings..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact Name</label>
                    <Input
                      value={requestForm.emergency_contact_name}
                      onChange={(e) => setRequestForm({...requestForm, emergency_contact_name: e.target.value})}
                      placeholder="Emergency contact"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact Phone</label>
                    <Input
                      value={requestForm.emergency_contact_phone}
                      onChange={(e) => setRequestForm({...requestForm, emergency_contact_phone: e.target.value})}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <Textarea
                    value={requestForm.notes}
                    onChange={(e) => setRequestForm({...requestForm, notes: e.target.value})}
                    placeholder="Any additional notes..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => { setRequestDialogOpen(false); resetRequestForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="submit-travel-btn">
                  <Send size={16} className="mr-2" />
                  {editingRequest ? 'Update Request' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plane size={20} />
                <span>Travel Request</span>
                <span className="text-sm font-normal text-slate-500">({selectedRequest?.reference_number})</span>
              </DialogTitle>
            </DialogHeader>
            
            {selectedRequest && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_CONFIG[selectedRequest.status]?.color}`}>
                    {React.createElement(STATUS_CONFIG[selectedRequest.status]?.icon || Clock, { size: 14 })}
                    {STATUS_CONFIG[selectedRequest.status]?.label}
                  </span>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${TRIP_TYPE_CONFIG[selectedRequest.trip_type]?.color}`}>
                    {TRIP_TYPE_CONFIG[selectedRequest.trip_type]?.label}
                  </span>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Destination:</span>
                    <span className="font-medium">{selectedRequest.destination_city}{selectedRequest.destination_country && `, ${selectedRequest.destination_country}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Purpose:</span>
                    <span className="font-medium">{PURPOSE_CONFIG[selectedRequest.purpose]?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dates:</span>
                    <span className="font-medium">{new Date(selectedRequest.departure_date).toLocaleDateString()} - {new Date(selectedRequest.return_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transportation:</span>
                    <span className="font-medium">{TRANSPORT_CONFIG[selectedRequest.transportation_type]?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Budget:</span>
                    <span className="font-bold text-indigo-600">{formatCurrency(selectedRequest.total_estimated_cost)}</span>
                  </div>
                  {selectedRequest.total_actual_cost && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Actual Cost:</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(selectedRequest.total_actual_cost)}</span>
                    </div>
                  )}
                </div>
                
                {selectedRequest.purpose_details && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Purpose Details</p>
                    <p className="text-slate-600">{selectedRequest.purpose_details}</p>
                  </div>
                )}
                
                {selectedRequest.itinerary && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Itinerary</p>
                    <p className="text-slate-600 whitespace-pre-wrap">{selectedRequest.itinerary}</p>
                  </div>
                )}
                
                {selectedRequest.trip_report && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-sm font-medium text-emerald-900 mb-1">Trip Report</p>
                    <p className="text-emerald-700 whitespace-pre-wrap">{selectedRequest.trip_report}</p>
                  </div>
                )}
                
                {selectedRequest.rejection_reason && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                    <p className="text-sm font-medium text-rose-900 mb-1">Rejection Reason</p>
                    <p className="text-rose-700">{selectedRequest.rejection_reason}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Complete Trip Dialog */}
        <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Complete Trip</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleComplete} className="space-y-4">
              <p className="text-sm text-slate-600">Enter actual expenses and trip report</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Transportation Cost</label>
                  <Input
                    type="number"
                    value={completeForm.actual_transportation_cost}
                    onChange={(e) => setCompleteForm({...completeForm, actual_transportation_cost: e.target.value})}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Accommodation Cost</label>
                  <Input
                    type="number"
                    value={completeForm.actual_accommodation_cost}
                    onChange={(e) => setCompleteForm({...completeForm, actual_accommodation_cost: e.target.value})}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Meals Cost</label>
                  <Input
                    type="number"
                    value={completeForm.actual_meals_cost}
                    onChange={(e) => setCompleteForm({...completeForm, actual_meals_cost: e.target.value})}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Other Cost</label>
                  <Input
                    type="number"
                    value={completeForm.actual_other_cost}
                    onChange={(e) => setCompleteForm({...completeForm, actual_other_cost: e.target.value})}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Trip Report *</label>
                <Textarea
                  value={completeForm.trip_report}
                  onChange={(e) => setCompleteForm({...completeForm, trip_report: e.target.value})}
                  placeholder="Summary of your trip, meetings attended, outcomes..."
                  rows={4}
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setCompleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <CheckCircle2 size={16} className="mr-2" />
                  Complete Trip
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
    <div className="p-4 lg:p-6 space-y-6" data-testid="admin-travel-view">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Travel Management</h1>
          <p className="text-slate-500 mt-1">Manage employee travel requests and approvals</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchData()}>
            <RefreshCw size={18} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-slate-500 to-slate-600 rounded-2xl p-4 text-white">
          <Plane className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-slate-200 text-sm">Total Requests</p>
          <p className="text-2xl font-bold">{stats?.total || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white">
          <Clock className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-amber-100 text-sm">Pending</p>
          <p className="text-2xl font-bold">{stats?.pending || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white">
          <Check className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-emerald-100 text-sm">Approved</p>
          <p className="text-2xl font-bold">{stats?.approved || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
          <PlayCircle className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-blue-100 text-sm">In Progress</p>
          <p className="text-2xl font-bold">{stats?.in_progress || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 text-white">
          <DollarSign className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-indigo-100 text-sm">Total Budget</p>
          <p className="text-2xl font-bold">{formatCurrency(stats?.total_budget || 0)}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
          <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-purple-100 text-sm">Actual Spent</p>
          <p className="text-2xl font-bold">{formatCurrency(stats?.total_actual || 0)}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">All Requests</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending
            {stats?.pending > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                {stats.pending}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">Approved</TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by reference, destination, or employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                  <SelectItem key={value} value={value}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Requests Table */}
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Plane className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No travel requests found</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Reference</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Employee</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Destination</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Dates</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Budget</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.map(request => {
                      const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <tr key={request.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <code className="bg-slate-100 px-2 py-1 rounded text-sm">{request.reference_number}</code>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-slate-900">{request.employee_name}</p>
                            {request.department && (
                              <p className="text-sm text-slate-500">{request.department}</p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <MapPin size={14} className="text-slate-400" />
                              <span>{request.destination_city}</span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${TRIP_TYPE_CONFIG[request.trip_type]?.color}`}>
                              {TRIP_TYPE_CONFIG[request.trip_type]?.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <p>{new Date(request.departure_date).toLocaleDateString()}</p>
                            <p className="text-slate-500">to {new Date(request.return_date).toLocaleDateString()}</p>
                          </td>
                          <td className="py-3 px-4 font-medium">
                            ${request.total_estimated_cost?.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              <StatusIcon size={12} />
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openViewDialog(request)} title="View">
                                <Eye size={16} />
                              </Button>
                              {request.status === 'pending' && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleApprove(request.id)}
                                    title="Approve"
                                    className="text-emerald-600"
                                  >
                                    <Check size={16} />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => { setSelectedRequest(request); setRejectDialogOpen(true); }}
                                    title="Reject"
                                    className="text-rose-600"
                                  >
                                    <X size={16} />
                                  </Button>
                                </>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDelete(request.id)}
                                title="Delete"
                                className="text-rose-600"
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
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plane size={20} />
              <span>Travel Request Details</span>
              <span className="text-sm font-normal text-slate-500">({selectedRequest?.reference_number})</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Quick Actions */}
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApprove(selectedRequest.id)}>
                    <Check size={14} className="mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="text-rose-600" onClick={() => setRejectDialogOpen(true)}>
                    <X size={14} className="mr-1" /> Reject
                  </Button>
                </div>
              )}
              
              {/* Status and Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_CONFIG[selectedRequest.status]?.color}`}>
                      {React.createElement(STATUS_CONFIG[selectedRequest.status]?.icon || Clock, { size: 14 })}
                      {STATUS_CONFIG[selectedRequest.status]?.label}
                    </span>
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${TRIP_TYPE_CONFIG[selectedRequest.trip_type]?.color}`}>
                      {TRIP_TYPE_CONFIG[selectedRequest.trip_type]?.label}
                    </span>
                  </div>
                  
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Employee:</span>
                      <span className="font-medium">{selectedRequest.employee_name}</span>
                    </div>
                    {selectedRequest.department && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Department:</span>
                        <span className="font-medium">{selectedRequest.department}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Destination:</span>
                      <span className="font-medium">{selectedRequest.destination_city}{selectedRequest.destination_country && `, ${selectedRequest.destination_country}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Purpose:</span>
                      <span className="font-medium">{PURPOSE_CONFIG[selectedRequest.purpose]?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Dates:</span>
                      <span className="font-medium">{new Date(selectedRequest.departure_date).toLocaleDateString()} - {new Date(selectedRequest.return_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transportation:</span>
                      <span className="font-medium">{TRANSPORT_CONFIG[selectedRequest.transportation_type]?.label}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-medium text-slate-900 mb-3">Budget</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transportation:</span>
                      <span>${selectedRequest.estimated_transportation_cost?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Accommodation:</span>
                      <span>${selectedRequest.estimated_accommodation_cost?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Meals:</span>
                      <span>${selectedRequest.estimated_meals_cost?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Other:</span>
                      <span>${selectedRequest.estimated_other_cost?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200">
                      <span className="font-medium">Total Estimated:</span>
                      <span className="font-bold text-indigo-600">${selectedRequest.total_estimated_cost?.toLocaleString()}</span>
                    </div>
                    {selectedRequest.total_actual_cost && (
                      <div className="flex justify-between">
                        <span className="font-medium">Total Actual:</span>
                        <span className="font-bold text-emerald-600">${selectedRequest.total_actual_cost?.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedRequest.purpose_details && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">Purpose Details</p>
                  <p className="text-slate-600">{selectedRequest.purpose_details}</p>
                </div>
              )}
              
              {selectedRequest.itinerary && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">Itinerary</p>
                  <p className="text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg">{selectedRequest.itinerary}</p>
                </div>
              )}
              
              {selectedRequest.meetings_scheduled && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">Meetings Scheduled</p>
                  <p className="text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg">{selectedRequest.meetings_scheduled}</p>
                </div>
              )}
              
              {selectedRequest.trip_report && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-emerald-900 mb-1">Trip Report</p>
                  <p className="text-emerald-700 whitespace-pre-wrap">{selectedRequest.trip_report}</p>
                </div>
              )}
              
              {selectedRequest.rejection_reason && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-rose-900 mb-1">Rejection Reason</p>
                  <p className="text-rose-700">{selectedRequest.rejection_reason}</p>
                </div>
              )}
              
              {selectedRequest.approved_by_name && selectedRequest.status !== 'rejected' && (
                <div className="text-sm text-slate-500">
                  Approved by {selectedRequest.approved_by_name} on {new Date(selectedRequest.approved_at).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Travel Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReject} className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="font-medium">{selectedRequest?.employee_name}</p>
              <p className="text-sm text-slate-500">{selectedRequest?.destination_city} • {new Date(selectedRequest?.departure_date).toLocaleDateString()}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rejection Reason *</label>
              <Textarea
                value={rejectForm.reason}
                onChange={(e) => setRejectForm({...rejectForm, reason: e.target.value})}
                placeholder="Explain why this request is being rejected..."
                rows={3}
                required
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive">
                <XCircle size={16} className="mr-2" />
                Reject Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Travel;
