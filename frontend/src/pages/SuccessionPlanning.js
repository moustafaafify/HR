import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { 
  Target,
  Users,
  TrendingUp,
  AlertTriangle,
  Shield,
  Star,
  Plus,
  Edit2,
  Trash2,
  Eye,
  ChevronRight,
  Search,
  RefreshCw,
  UserPlus,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Briefcase,
  Building2,
  MessageSquare,
  BarChart3
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CRITICALITY_CONFIG = {
  critical: { label: 'Critical', color: 'bg-rose-100 text-rose-700', icon: AlertTriangle },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700', icon: Shield },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700', icon: Target },
  low: { label: 'Low', color: 'bg-slate-100 text-slate-600', icon: Target },
};

const RISK_CONFIG = {
  high: { label: 'High Risk', color: 'text-rose-600 bg-rose-50' },
  medium: { label: 'Medium Risk', color: 'text-amber-600 bg-amber-50' },
  low: { label: 'Low Risk', color: 'text-emerald-600 bg-emerald-50' },
};

const STRENGTH_CONFIG = {
  strong: { label: 'Strong', color: 'bg-emerald-500' },
  adequate: { label: 'Adequate', color: 'bg-blue-500' },
  developing: { label: 'Developing', color: 'bg-amber-500' },
  weak: { label: 'Weak', color: 'bg-rose-500' },
};

const READINESS_CONFIG = {
  ready_now: { label: 'Ready Now', color: 'bg-emerald-100 text-emerald-700' },
  '1-2_years': { label: '1-2 Years', color: 'bg-blue-100 text-blue-700' },
  '3-5_years': { label: '3-5 Years', color: 'bg-amber-100 text-amber-700' },
  development_needed: { label: 'Development Needed', color: 'bg-slate-100 text-slate-600' },
};

const CATEGORY_CONFIG = {
  high_potential: { label: 'High Potential', color: 'bg-purple-100 text-purple-700', icon: Star },
  emerging_leader: { label: 'Emerging Leader', color: 'bg-blue-100 text-blue-700', icon: TrendingUp },
  key_contributor: { label: 'Key Contributor', color: 'bg-emerald-100 text-emerald-700', icon: Award },
  specialist: { label: 'Specialist', color: 'bg-amber-100 text-amber-700', icon: Target },
};

const NINE_BOX_CONFIG = {
  star: { label: 'Star', color: 'bg-emerald-500', position: [2, 0] },
  high_potential: { label: 'High Potential', color: 'bg-emerald-400', position: [2, 1] },
  potential_gem: { label: 'Potential Gem', color: 'bg-amber-400', position: [2, 2] },
  high_performer: { label: 'High Performer', color: 'bg-blue-400', position: [1, 0] },
  core_player: { label: 'Core Player', color: 'bg-blue-300', position: [1, 1] },
  inconsistent: { label: 'Inconsistent', color: 'bg-amber-300', position: [1, 2] },
  solid_performer: { label: 'Solid Performer', color: 'bg-slate-400', position: [0, 0] },
  average: { label: 'Average', color: 'bg-slate-300', position: [0, 1] },
  underperformer: { label: 'Underperformer', color: 'bg-rose-300', position: [0, 2] },
};

const SuccessionPlanning = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('positions');
  
  // Data
  const [stats, setStats] = useState(null);
  const [positions, setPositions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [talentPool, setTalentPool] = useState([]);
  const [nineBoxData, setNineBoxData] = useState({});
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [myStatus, setMyStatus] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [criticalityFilter, setCriticalityFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  
  // Dialogs
  const [positionDialogOpen, setPositionDialogOpen] = useState(false);
  const [candidateDialogOpen, setCandidateDialogOpen] = useState(false);
  const [talentDialogOpen, setTalentDialogOpen] = useState(false);
  const [viewPositionOpen, setViewPositionOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  
  // Selected items
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [editingPosition, setEditingPosition] = useState(null);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [editingTalent, setEditingTalent] = useState(null);
  
  // Forms
  const [positionForm, setPositionForm] = useState({
    title: '',
    description: '',
    department_id: '',
    current_holder_id: '',
    criticality: 'high',
    vacancy_risk: 'medium',
    flight_risk: 'medium',
    target_successors: 2
  });
  
  const [candidateForm, setCandidateForm] = useState({
    position_id: '',
    employee_id: '',
    readiness: '1-2_years',
    potential: 'high',
    performance: 'exceeds',
    development_areas: [],
    development_plan: '',
    mentor_id: ''
  });
  
  const [talentForm, setTalentForm] = useState({
    employee_id: '',
    category: 'high_potential',
    leadership_potential: 3,
    technical_expertise: 3,
    business_acumen: 3,
    adaptability: 3,
    collaboration: 3,
    career_aspirations: '',
    mobility: 'flexible',
    strengths: '',
    development_needs: '',
    notes: ''
  });
  
  const [noteText, setNoteText] = useState('');

  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  // Fetch functions
  const fetchStats = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await axios.get(`${API}/succession/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [isAdmin]);

  const fetchPositions = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const params = new URLSearchParams();
      if (criticalityFilter !== 'all') params.append('criticality', criticalityFilter);
      if (departmentFilter !== 'all') params.append('department_id', departmentFilter);
      const response = await axios.get(`${API}/succession/positions?${params}`);
      setPositions(response.data);
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    }
  }, [isAdmin, criticalityFilter, departmentFilter]);

  const fetchCandidates = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await axios.get(`${API}/succession/candidates`);
      setCandidates(response.data);
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    }
  }, [isAdmin]);

  const fetchTalentPool = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await axios.get(`${API}/succession/talent-pool`);
      setTalentPool(response.data);
    } catch (error) {
      console.error('Failed to fetch talent pool:', error);
    }
  }, [isAdmin]);

  const fetchNineBox = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await axios.get(`${API}/succession/9-box`);
      setNineBoxData(response.data);
    } catch (error) {
      console.error('Failed to fetch 9-box:', error);
    }
  }, [isAdmin]);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/departments`);
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  }, []);

  const fetchMyStatus = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/succession/my-status`);
      setMyStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch my status:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchPositions(),
        fetchCandidates(),
        fetchTalentPool(),
        fetchNineBox(),
        fetchEmployees(),
        fetchDepartments(),
        fetchMyStatus(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchPositions, fetchCandidates, fetchTalentPool, fetchNineBox, fetchEmployees, fetchDepartments, fetchMyStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (isAdmin) {
      fetchPositions();
    }
  }, [criticalityFilter, departmentFilter, fetchPositions, isAdmin]);

  // Handlers
  const handleSavePosition = async (e) => {
    e.preventDefault();
    try {
      if (editingPosition) {
        await axios.put(`${API}/succession/positions/${editingPosition.id}`, positionForm);
        toast.success('Position updated');
      } else {
        await axios.post(`${API}/succession/positions`, positionForm);
        toast.success('Position created');
      }
      fetchData();
      setPositionDialogOpen(false);
      resetPositionForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save position');
    }
  };

  const handleDeletePosition = async (positionId) => {
    if (!window.confirm('Delete this position and all associated candidates?')) return;
    try {
      await axios.delete(`${API}/succession/positions/${positionId}`);
      toast.success('Position deleted');
      fetchData();
      setViewPositionOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete');
    }
  };

  const handleSaveCandidate = async (e) => {
    e.preventDefault();
    try {
      if (editingCandidate) {
        await axios.put(`${API}/succession/candidates/${editingCandidate.id}`, candidateForm);
        toast.success('Candidate updated');
      } else {
        await axios.post(`${API}/succession/candidates`, candidateForm);
        toast.success('Candidate added');
      }
      fetchData();
      setCandidateDialogOpen(false);
      resetCandidateForm();
      // Refresh position view if open
      if (selectedPosition) {
        const updated = await axios.get(`${API}/succession/positions/${selectedPosition.id}`);
        setSelectedPosition(updated.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save candidate');
    }
  };

  const handleDeleteCandidate = async (candidateId) => {
    if (!window.confirm('Remove this succession candidate?')) return;
    try {
      await axios.delete(`${API}/succession/candidates/${candidateId}`);
      toast.success('Candidate removed');
      fetchData();
      if (selectedPosition) {
        const updated = await axios.get(`${API}/succession/positions/${selectedPosition.id}`);
        setSelectedPosition(updated.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to remove');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!selectedCandidate || !noteText.trim()) return;
    try {
      await axios.post(`${API}/succession/candidates/${selectedCandidate.id}/note`, { text: noteText });
      toast.success('Note added');
      setNoteText('');
      setNoteDialogOpen(false);
      fetchCandidates();
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const handleSaveTalent = async (e) => {
    e.preventDefault();
    try {
      if (editingTalent) {
        await axios.put(`${API}/succession/talent-pool/${editingTalent.id}`, talentForm);
        toast.success('Talent pool entry updated');
      } else {
        await axios.post(`${API}/succession/talent-pool`, talentForm);
        toast.success('Added to talent pool');
      }
      fetchTalentPool();
      setTalentDialogOpen(false);
      resetTalentForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save');
    }
  };

  const handleRemoveFromTalentPool = async (entryId) => {
    if (!window.confirm('Remove from talent pool?')) return;
    try {
      await axios.delete(`${API}/succession/talent-pool/${entryId}`);
      toast.success('Removed from talent pool');
      fetchTalentPool();
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  const openViewPosition = async (position) => {
    try {
      const response = await axios.get(`${API}/succession/positions/${position.id}`);
      setSelectedPosition(response.data);
      setViewPositionOpen(true);
    } catch (error) {
      toast.error('Failed to load position details');
    }
  };

  const openEditPosition = (position) => {
    setEditingPosition(position);
    setPositionForm({
      title: position.title || '',
      description: position.description || '',
      department_id: position.department_id || '',
      current_holder_id: position.current_holder_id || '',
      criticality: position.criticality || 'high',
      vacancy_risk: position.vacancy_risk || 'medium',
      flight_risk: position.flight_risk || 'medium',
      target_successors: position.target_successors || 2
    });
    setPositionDialogOpen(true);
  };

  const openAddCandidate = (position = null) => {
    resetCandidateForm();
    if (position) {
      setCandidateForm(prev => ({ ...prev, position_id: position.id }));
    }
    setCandidateDialogOpen(true);
  };

  const openEditCandidate = (candidate) => {
    setEditingCandidate(candidate);
    setCandidateForm({
      position_id: candidate.position_id || '',
      employee_id: candidate.employee_id || '',
      readiness: candidate.readiness || '1-2_years',
      potential: candidate.potential || 'high',
      performance: candidate.performance || 'exceeds',
      development_areas: candidate.development_areas || [],
      development_plan: candidate.development_plan || '',
      mentor_id: candidate.mentor_id || ''
    });
    setCandidateDialogOpen(true);
  };

  const openEditTalent = (entry) => {
    setEditingTalent(entry);
    setTalentForm({
      employee_id: entry.employee_id || '',
      category: entry.category || 'high_potential',
      leadership_potential: entry.leadership_potential || 3,
      technical_expertise: entry.technical_expertise || 3,
      business_acumen: entry.business_acumen || 3,
      adaptability: entry.adaptability || 3,
      collaboration: entry.collaboration || 3,
      career_aspirations: entry.career_aspirations || '',
      mobility: entry.mobility || 'flexible',
      strengths: entry.strengths || '',
      development_needs: entry.development_needs || '',
      notes: entry.notes || ''
    });
    setTalentDialogOpen(true);
  };

  const resetPositionForm = () => {
    setEditingPosition(null);
    setPositionForm({
      title: '',
      description: '',
      department_id: '',
      current_holder_id: '',
      criticality: 'high',
      vacancy_risk: 'medium',
      flight_risk: 'medium',
      target_successors: 2
    });
  };

  const resetCandidateForm = () => {
    setEditingCandidate(null);
    setCandidateForm({
      position_id: '',
      employee_id: '',
      readiness: '1-2_years',
      potential: 'high',
      performance: 'exceeds',
      development_areas: [],
      development_plan: '',
      mentor_id: ''
    });
  };

  const resetTalentForm = () => {
    setEditingTalent(null);
    setTalentForm({
      employee_id: '',
      category: 'high_potential',
      leadership_potential: 3,
      technical_expertise: 3,
      business_acumen: 3,
      adaptability: 3,
      collaboration: 3,
      career_aspirations: '',
      mobility: 'flexible',
      strengths: '',
      development_needs: '',
      notes: ''
    });
  };

  // Filter positions
  const filteredPositions = positions.filter(pos => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!pos.title?.toLowerCase().includes(query) && 
          !pos.current_holder_name?.toLowerCase().includes(query) &&
          !pos.department_name?.toLowerCase().includes(query)) {
        return false;
      }
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

  // Employee View (limited access)
  if (!isAdmin) {
    return (
      <div className="p-4 lg:p-6 space-y-6" data-testid="succession-employee-view">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">My Development</h1>
          <p className="text-slate-500 mt-1">Your career development and succession status</p>
        </div>

        {myStatus?.in_talent_pool && (
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <Star className="w-8 h-8" />
              <div>
                <h2 className="text-xl font-bold">You're in the Talent Pool!</h2>
                <p className="text-purple-100">Category: {CATEGORY_CONFIG[myStatus.talent_pool_category]?.label || myStatus.talent_pool_category}</p>
              </div>
            </div>
            <p className="text-purple-100 text-sm">
              You've been identified as a high-value contributor with strong potential for growth.
            </p>
          </div>
        )}

        {myStatus?.succession_positions?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <Target size={20} className="text-indigo-600" />
              Succession Pipeline
            </h3>
            <p className="text-slate-600 mb-4">You are being considered for the following positions:</p>
            <div className="space-y-3">
              {myStatus.succession_positions.map((pos, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
                  <div>
                    <p className="font-medium text-slate-900">{pos.position_title}</p>
                    <p className="text-sm text-slate-500">Rank #{pos.ranking} successor</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${READINESS_CONFIG[pos.readiness]?.color}`}>
                    {READINESS_CONFIG[pos.readiness]?.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!myStatus?.in_talent_pool && myStatus?.succession_positions?.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <Target className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600 font-medium">No succession information available</p>
            <p className="text-slate-500 text-sm mt-1">Talk to your manager about career development opportunities</p>
          </div>
        )}
      </div>
    );
  }

  // Admin View
  return (
    <div className="p-4 lg:p-6 space-y-6" data-testid="succession-admin-view">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Succession Planning</h1>
          <p className="text-slate-500 mt-1">Manage key positions and succession pipeline</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => { resetTalentForm(); setTalentDialogOpen(true); }}>
            <Star size={18} className="mr-2" />
            Add to Talent Pool
          </Button>
          <Button onClick={() => { resetPositionForm(); setPositionDialogOpen(true); }} data-testid="add-position-btn">
            <Plus size={18} className="mr-2" />
            Add Key Position
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-4 text-white">
          <Target className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-slate-300 text-sm">Key Positions</p>
          <p className="text-2xl font-bold">{stats?.total_positions || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-4 text-white">
          <AlertTriangle className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-rose-100 text-sm">Critical</p>
          <p className="text-2xl font-bold">{stats?.critical_positions || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white">
          <Shield className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-amber-100 text-sm">High Risk</p>
          <p className="text-2xl font-bold">{stats?.high_risk_positions || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
          <Users className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-blue-100 text-sm">Candidates</p>
          <p className="text-2xl font-bold">{stats?.total_candidates || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white">
          <CheckCircle2 className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-emerald-100 text-sm">Ready Now</p>
          <p className="text-2xl font-bold">{stats?.ready_now_candidates || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
          <Star className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-purple-100 text-sm">Talent Pool</p>
          <p className="text-2xl font-bold">{stats?.talent_pool_count || 0}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="positions" data-testid="tab-positions">
            <Target size={16} className="mr-1" /> Key Positions
          </TabsTrigger>
          <TabsTrigger value="9box" data-testid="tab-9box">
            <BarChart3 size={16} className="mr-1" /> 9-Box Grid
          </TabsTrigger>
          <TabsTrigger value="talent" data-testid="tab-talent">
            <Star size={16} className="mr-1" /> Talent Pool
          </TabsTrigger>
        </TabsList>

        {/* Key Positions */}
        <TabsContent value="positions" className="mt-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search positions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={criticalityFilter} onValueChange={setCriticalityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Criticality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Criticality</SelectItem>
                {Object.entries(CRITICALITY_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredPositions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Target className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">No Key Positions</p>
              <p className="text-slate-500 text-sm mt-1">Add key positions to start succession planning</p>
              <Button className="mt-4" onClick={() => { resetPositionForm(); setPositionDialogOpen(true); }}>
                <Plus size={16} className="mr-2" /> Add Key Position
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPositions.map(position => {
                const criticality = CRITICALITY_CONFIG[position.criticality] || CRITICALITY_CONFIG.medium;
                const strength = STRENGTH_CONFIG[position.succession_strength] || STRENGTH_CONFIG.developing;
                const CriticalityIcon = criticality.icon;
                
                return (
                  <div 
                    key={position.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => openViewPosition(position)}
                    data-testid={`position-${position.id}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${criticality.color}`}>
                          <CriticalityIcon size={24} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-slate-900">{position.title}</h3>
                          <p className="text-slate-500">{position.department_name || 'No department'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${criticality.color}`}>
                          {criticality.label}
                        </span>
                        {position.vacancy_risk === 'high' && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${RISK_CONFIG.high.color}`}>
                            High Risk
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-slate-500">Current Holder</p>
                        <p className="font-medium">{position.current_holder_name || 'Vacant'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Tenure</p>
                        <p className="font-medium">{position.current_holder_tenure ? `${position.current_holder_tenure} years` : '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Candidates</p>
                        <p className="font-medium">{position.candidate_count || 0} / {position.target_successors}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Pipeline Strength</p>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${strength.color}`} />
                          <span className="font-medium">{strength.label}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                      <div className="flex gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${RISK_CONFIG[position.vacancy_risk]?.color}`}>
                          Vacancy: {position.vacancy_risk}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${RISK_CONFIG[position.flight_risk]?.color}`}>
                          Flight: {position.flight_risk}
                        </span>
                      </div>
                      <ChevronRight size={18} className="text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* 9-Box Grid */}
        <TabsContent value="9box" className="mt-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-lg text-slate-900 mb-6">9-Box Talent Matrix</h3>
            
            <div className="flex">
              {/* Y-axis label */}
              <div className="flex flex-col justify-center items-center pr-4">
                <span className="text-sm font-medium text-slate-600 transform -rotate-90 whitespace-nowrap">
                  Potential →
                </span>
              </div>
              
              <div className="flex-1">
                <div className="grid grid-cols-3 gap-2">
                  {/* Row 1 (High Potential) */}
                  {['potential_gem', 'high_potential', 'star'].map((box) => (
                    <div key={box} className={`min-h-[120px] rounded-xl p-3 ${NINE_BOX_CONFIG[box]?.color} bg-opacity-20 border-2 border-opacity-30`}
                      style={{ borderColor: NINE_BOX_CONFIG[box]?.color?.replace('bg-', '').replace('-500', '').replace('-400', '').replace('-300', '') }}>
                      <p className="text-xs font-medium text-slate-700 mb-2">{NINE_BOX_CONFIG[box]?.label}</p>
                      <div className="space-y-1">
                        {(nineBoxData[box] || []).slice(0, 4).map((person, i) => (
                          <div key={i} className="text-xs bg-white bg-opacity-70 rounded px-2 py-1 truncate">
                            {person.employee_name}
                          </div>
                        ))}
                        {(nineBoxData[box]?.length || 0) > 4 && (
                          <p className="text-xs text-slate-500">+{nineBoxData[box].length - 4} more</p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Row 2 (Medium Potential) */}
                  {['inconsistent', 'core_player', 'high_performer'].map((box) => (
                    <div key={box} className={`min-h-[120px] rounded-xl p-3 ${NINE_BOX_CONFIG[box]?.color} bg-opacity-20 border-2 border-opacity-30`}>
                      <p className="text-xs font-medium text-slate-700 mb-2">{NINE_BOX_CONFIG[box]?.label}</p>
                      <div className="space-y-1">
                        {(nineBoxData[box] || []).slice(0, 4).map((person, i) => (
                          <div key={i} className="text-xs bg-white bg-opacity-70 rounded px-2 py-1 truncate">
                            {person.employee_name}
                          </div>
                        ))}
                        {(nineBoxData[box]?.length || 0) > 4 && (
                          <p className="text-xs text-slate-500">+{nineBoxData[box].length - 4} more</p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Row 3 (Low Potential) */}
                  {['underperformer', 'average', 'solid_performer'].map((box) => (
                    <div key={box} className={`min-h-[120px] rounded-xl p-3 ${NINE_BOX_CONFIG[box]?.color} bg-opacity-20 border-2 border-opacity-30`}>
                      <p className="text-xs font-medium text-slate-700 mb-2">{NINE_BOX_CONFIG[box]?.label}</p>
                      <div className="space-y-1">
                        {(nineBoxData[box] || []).slice(0, 4).map((person, i) => (
                          <div key={i} className="text-xs bg-white bg-opacity-70 rounded px-2 py-1 truncate">
                            {person.employee_name}
                          </div>
                        ))}
                        {(nineBoxData[box]?.length || 0) > 4 && (
                          <p className="text-xs text-slate-500">+{nineBoxData[box].length - 4} more</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* X-axis label */}
                <div className="text-center mt-4">
                  <span className="text-sm font-medium text-slate-600">← Performance →</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Talent Pool */}
        <TabsContent value="talent" className="mt-4 space-y-4">
          {talentPool.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Star className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">Talent Pool is Empty</p>
              <p className="text-slate-500 text-sm mt-1">Add high-potential employees to your talent pool</p>
              <Button className="mt-4" onClick={() => { resetTalentForm(); setTalentDialogOpen(true); }}>
                <Plus size={16} className="mr-2" /> Add to Talent Pool
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {talentPool.map(entry => {
                const category = CATEGORY_CONFIG[entry.category] || CATEGORY_CONFIG.high_potential;
                const CategoryIcon = category.icon;
                const avgScore = Math.round((
                  entry.leadership_potential + entry.technical_expertise + 
                  entry.business_acumen + entry.adaptability + entry.collaboration
                ) / 5 * 10) / 10;
                
                return (
                  <div 
                    key={entry.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5"
                    data-testid={`talent-${entry.id}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${category.color}`}>
                          <CategoryIcon size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{entry.employee_name}</h3>
                          <p className="text-sm text-slate-500">{entry.employee_current_role}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditTalent(entry)}>
                          <Edit2 size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveFromTalentPool(entry.id)} className="text-rose-600">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                    
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${category.color}`}>
                      {category.label}
                    </span>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Overall Score</span>
                        <span className="font-medium">{avgScore}/5</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                          style={{ width: `${(avgScore / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-slate-500">
                      <p>Mobility: {entry.mobility === 'flexible' ? 'Flexible' : entry.mobility === 'limited' ? 'Limited' : 'Not Mobile'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Position Dialog */}
      <Dialog open={positionDialogOpen} onOpenChange={setPositionDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPosition ? 'Edit Key Position' : 'Add Key Position'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSavePosition} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Position Title *</label>
              <Input
                value={positionForm.title}
                onChange={(e) => setPositionForm({...positionForm, title: e.target.value})}
                placeholder="e.g., Chief Technology Officer"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <Textarea
                value={positionForm.description}
                onChange={(e) => setPositionForm({...positionForm, description: e.target.value})}
                placeholder="Key responsibilities and requirements..."
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <Select value={positionForm.department_id} onValueChange={(v) => setPositionForm({...positionForm, department_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Holder</label>
                <Select value={positionForm.current_holder_id} onValueChange={(v) => setPositionForm({...positionForm, current_holder_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Criticality</label>
                <Select value={positionForm.criticality} onValueChange={(v) => setPositionForm({...positionForm, criticality: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CRITICALITY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Successors</label>
                <Input
                  type="number"
                  value={positionForm.target_successors}
                  onChange={(e) => setPositionForm({...positionForm, target_successors: parseInt(e.target.value) || 2})}
                  min="1"
                  max="5"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vacancy Risk</label>
                <Select value={positionForm.vacancy_risk} onValueChange={(v) => setPositionForm({...positionForm, vacancy_risk: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Flight Risk</label>
                <Select value={positionForm.flight_risk} onValueChange={(v) => setPositionForm({...positionForm, flight_risk: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setPositionDialogOpen(false); resetPositionForm(); }}>
                Cancel
              </Button>
              <Button type="submit" data-testid="save-position-btn">
                {editingPosition ? 'Update Position' : 'Create Position'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Position Dialog */}
      <Dialog open={viewPositionOpen} onOpenChange={setViewPositionOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target size={20} className="text-indigo-600" />
              {selectedPosition?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPosition && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${CRITICALITY_CONFIG[selectedPosition.criticality]?.color}`}>
                  {CRITICALITY_CONFIG[selectedPosition.criticality]?.label}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${RISK_CONFIG[selectedPosition.vacancy_risk]?.color}`}>
                  Vacancy: {selectedPosition.vacancy_risk}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4">
                <div>
                  <p className="text-sm text-slate-500">Current Holder</p>
                  <p className="font-medium">{selectedPosition.current_holder_name || 'Vacant'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Department</p>
                  <p className="font-medium">{selectedPosition.department_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Pipeline Strength</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${STRENGTH_CONFIG[selectedPosition.succession_strength]?.color}`} />
                    <span className="font-medium">{STRENGTH_CONFIG[selectedPosition.succession_strength]?.label}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Target Successors</p>
                  <p className="font-medium">{selectedPosition.candidates?.length || 0} / {selectedPosition.target_successors}</p>
                </div>
              </div>
              
              {/* Succession Candidates */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-900">Succession Candidates</h4>
                  <Button size="sm" onClick={() => openAddCandidate(selectedPosition)}>
                    <UserPlus size={14} className="mr-1" /> Add Candidate
                  </Button>
                </div>
                
                {selectedPosition.candidates?.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-xl">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-500 text-sm">No candidates identified yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedPosition.candidates?.map((candidate, i) => (
                      <div key={candidate.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                            {candidate.ranking}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{candidate.employee_name}</p>
                            <p className="text-sm text-slate-500">{candidate.employee_current_role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${READINESS_CONFIG[candidate.readiness]?.color}`}>
                            {READINESS_CONFIG[candidate.readiness]?.label}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => openEditCandidate(candidate)}>
                            <Edit2 size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedCandidate(candidate); setNoteDialogOpen(true); }}>
                            <MessageSquare size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteCandidate(candidate.id)} className="text-rose-600">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => openEditPosition(selectedPosition)}>
                  <Edit2 size={14} className="mr-1" /> Edit Position
                </Button>
                <Button variant="outline" className="text-rose-600" onClick={() => handleDeletePosition(selectedPosition.id)}>
                  <Trash2 size={14} className="mr-1" /> Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Candidate Dialog */}
      <Dialog open={candidateDialogOpen} onOpenChange={setCandidateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCandidate ? 'Edit Candidate' : 'Add Succession Candidate'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCandidate} className="space-y-4">
            {!editingCandidate && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Position *</label>
                  <Select value={candidateForm.position_id} onValueChange={(v) => setCandidateForm({...candidateForm, position_id: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map(pos => (
                        <SelectItem key={pos.id} value={pos.id}>{pos.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employee *</label>
                  <Select value={candidateForm.employee_id} onValueChange={(v) => setCandidateForm({...candidateForm, employee_id: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Readiness</label>
                <Select value={candidateForm.readiness} onValueChange={(v) => setCandidateForm({...candidateForm, readiness: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(READINESS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Potential</label>
                <Select value={candidateForm.potential} onValueChange={(v) => setCandidateForm({...candidateForm, potential: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exceptional">Exceptional</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="limited">Limited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Performance</label>
                <Select value={candidateForm.performance} onValueChange={(v) => setCandidateForm({...candidateForm, performance: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exceptional">Exceptional</SelectItem>
                    <SelectItem value="exceeds">Exceeds</SelectItem>
                    <SelectItem value="meets">Meets</SelectItem>
                    <SelectItem value="below">Below</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mentor</label>
              <Select value={candidateForm.mentor_id} onValueChange={(v) => setCandidateForm({...candidateForm, mentor_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mentor" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Development Plan</label>
              <Textarea
                value={candidateForm.development_plan}
                onChange={(e) => setCandidateForm({...candidateForm, development_plan: e.target.value})}
                placeholder="Key development activities, training, stretch assignments..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setCandidateDialogOpen(false); resetCandidateForm(); }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCandidate ? 'Update Candidate' : 'Add Candidate'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Talent Pool Dialog */}
      <Dialog open={talentDialogOpen} onOpenChange={setTalentDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTalent ? 'Edit Talent Pool Entry' : 'Add to Talent Pool'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveTalent} className="space-y-4">
            {!editingTalent && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee *</label>
                <Select value={talentForm.employee_id} onValueChange={(v) => setTalentForm({...talentForm, employee_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.filter(e => !talentPool.some(t => t.employee_id === e.id)).map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <Select value={talentForm.category} onValueChange={(v) => setTalentForm({...talentForm, category: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Assessment Scores (1-5)</label>
              <div className="space-y-3">
                {[
                  { key: 'leadership_potential', label: 'Leadership Potential' },
                  { key: 'technical_expertise', label: 'Technical Expertise' },
                  { key: 'business_acumen', label: 'Business Acumen' },
                  { key: 'adaptability', label: 'Adaptability' },
                  { key: 'collaboration', label: 'Collaboration' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{label}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(score => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setTalentForm({...talentForm, [key]: score})}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            talentForm[key] >= score 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mobility</label>
              <Select value={talentForm.mobility} onValueChange={(v) => setTalentForm({...talentForm, mobility: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flexible">Flexible</SelectItem>
                  <SelectItem value="limited">Limited</SelectItem>
                  <SelectItem value="not_mobile">Not Mobile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Career Aspirations</label>
              <Textarea
                value={talentForm.career_aspirations}
                onChange={(e) => setTalentForm({...talentForm, career_aspirations: e.target.value})}
                placeholder="What are their career goals?"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Strengths</label>
                <Textarea
                  value={talentForm.strengths}
                  onChange={(e) => setTalentForm({...talentForm, strengths: e.target.value})}
                  placeholder="Key strengths..."
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Development Needs</label>
                <Textarea
                  value={talentForm.development_needs}
                  onChange={(e) => setTalentForm({...talentForm, development_needs: e.target.value})}
                  placeholder="Areas for growth..."
                  rows={2}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setTalentDialogOpen(false); resetTalentForm(); }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingTalent ? 'Update' : 'Add to Talent Pool'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Progress Note</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddNote} className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="font-medium">{selectedCandidate?.employee_name}</p>
              <p className="text-sm text-slate-500">{selectedCandidate?.position_title}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a progress note, development update, or observation..."
                rows={4}
                required
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setNoteDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Note
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuccessionPlanning;
