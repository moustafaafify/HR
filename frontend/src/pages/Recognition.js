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
  Award,
  Star,
  Users,
  Lightbulb,
  Heart,
  Rocket,
  Crown,
  ThumbsUp,
  Trophy,
  Send,
  MessageCircle,
  Search,
  RefreshCw,
  Plus,
  Settings,
  Clock,
  Check,
  X,
  TrendingUp,
  Medal,
  Gift,
  Sparkles,
  Edit2,
  Trash2
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Icon mapping
const ICON_MAP = {
  star: Star,
  users: Users,
  lightbulb: Lightbulb,
  heart: Heart,
  rocket: Rocket,
  award: Award,
  crown: Crown,
  'thumbs-up': ThumbsUp,
  trophy: Trophy,
  medal: Medal,
  gift: Gift,
  sparkles: Sparkles,
};

const Recognition = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('wall');
  
  // Data
  const [categories, setCategories] = useState([]);
  const [wall, setWall] = useState([]);
  const [myRecognitions, setMyRecognitions] = useState({ received: [], given: [], total_points: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [nominations, setNominations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('all');
  
  // Dialogs
  const [giveRecognitionOpen, setGiveRecognitionOpen] = useState(false);
  const [nominateOpen, setNominateOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [viewRecognitionOpen, setViewRecognitionOpen] = useState(false);
  
  // Selected items
  const [selectedRecognition, setSelectedRecognition] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Forms
  const [recognitionForm, setRecognitionForm] = useState({
    recipient_id: '',
    category_id: '',
    title: '',
    message: '',
    is_public: true
  });
  
  const [nominationForm, setNominationForm] = useState({
    nominee_id: '',
    category_id: '',
    reason: '',
    achievements: ''
  });
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: 'star',
    points: 10,
    color: '#6366f1',
    is_nomination_required: false
  });
  
  const [commentText, setCommentText] = useState('');

  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  // Fetch functions
  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/recognition/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  const fetchWall = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/recognition/wall?limit=100`);
      setWall(response.data);
    } catch (error) {
      console.error('Failed to fetch wall:', error);
    }
  }, []);

  const fetchMyRecognitions = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/recognition/my`);
      setMyRecognitions(response.data);
    } catch (error) {
      console.error('Failed to fetch my recognitions:', error);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/recognition/leaderboard?period=${leaderboardPeriod}`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  }, [leaderboardPeriod]);

  const fetchNominations = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/recognition/nominations`);
      setNominations(response.data);
    } catch (error) {
      console.error('Failed to fetch nominations:', error);
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

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/recognition/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCategories(),
        fetchWall(),
        fetchMyRecognitions(),
        fetchLeaderboard(),
        fetchNominations(),
        fetchEmployees(),
        fetchStats(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchCategories, fetchWall, fetchMyRecognitions, fetchLeaderboard, fetchNominations, fetchEmployees, fetchStats]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchLeaderboard();
  }, [leaderboardPeriod, fetchLeaderboard]);

  // Handlers
  const handleGiveRecognition = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/recognition`, recognitionForm);
      toast.success('Recognition sent!');
      fetchData();
      setGiveRecognitionOpen(false);
      setRecognitionForm({ recipient_id: '', category_id: '', title: '', message: '', is_public: true });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send recognition');
    }
  };

  const handleNominate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/recognition/nominations`, nominationForm);
      toast.success('Nomination submitted for review!');
      fetchNominations();
      setNominateOpen(false);
      setNominationForm({ nominee_id: '', category_id: '', reason: '', achievements: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit nomination');
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(`${API}/recognition/categories/${editingCategory.id}`, categoryForm);
        toast.success('Category updated');
      } else {
        await axios.post(`${API}/recognition/categories`, categoryForm);
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
      await axios.delete(`${API}/recognition/categories/${categoryId}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete');
    }
  };

  const handleLike = async (recognitionId) => {
    try {
      await axios.post(`${API}/recognition/${recognitionId}/like`);
      fetchWall();
      if (selectedRecognition?.id === recognitionId) {
        const updated = wall.find(r => r.id === recognitionId);
        if (updated) setSelectedRecognition(updated);
      }
    } catch (error) {
      toast.error('Failed to like');
    }
  };

  const handleComment = async (recognitionId) => {
    if (!commentText.trim()) return;
    try {
      await axios.post(`${API}/recognition/${recognitionId}/comment`, { text: commentText });
      setCommentText('');
      fetchWall();
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleApproveNomination = async (nominationId) => {
    try {
      await axios.post(`${API}/recognition/nominations/${nominationId}/approve`);
      toast.success('Nomination approved!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to approve');
    }
  };

  const handleRejectNomination = async (nominationId) => {
    const notes = window.prompt('Rejection reason (optional):');
    try {
      await axios.post(`${API}/recognition/nominations/${nominationId}/reject`, { notes });
      toast.success('Nomination rejected');
      fetchNominations();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reject');
    }
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      icon: category.icon || 'star',
      points: category.points || 10,
      color: category.color || '#6366f1',
      is_nomination_required: category.is_nomination_required || false
    });
    setCategoryDialogOpen(true);
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      description: '',
      icon: 'star',
      points: 10,
      color: '#6366f1',
      is_nomination_required: false
    });
  };

  const getIcon = (iconName) => {
    return ICON_MAP[iconName] || Star;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const filteredWall = wall.filter(r => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.recipient_name?.toLowerCase().includes(query) ||
      r.giver_name?.toLowerCase().includes(query) ||
      r.message?.toLowerCase().includes(query) ||
      r.category_name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-4 lg:p-6 space-y-6" data-testid="recognition-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Recognition & Awards</h1>
          <p className="text-slate-500 mt-1">Celebrate achievements and recognize great work</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setGiveRecognitionOpen(true)} data-testid="give-recognition-btn">
            <Sparkles size={18} className="mr-2" />
            Give Recognition
          </Button>
          <Button variant="outline" onClick={() => setNominateOpen(true)} data-testid="nominate-btn">
            <Award size={18} className="mr-2" />
            Nominate
          </Button>
          {isAdmin && (
            <Button variant="outline" onClick={() => { resetCategoryForm(); setCategoryDialogOpen(true); }}>
              <Settings size={18} className="mr-2" />
              Manage Categories
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-4 text-white">
          <Trophy className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-amber-100 text-sm">Your Points</p>
          <p className="text-2xl font-bold">{myRecognitions.total_points}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-4 text-white">
          <Award className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-emerald-100 text-sm">Received</p>
          <p className="text-2xl font-bold">{myRecognitions.received?.length || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl p-4 text-white">
          <Heart className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-blue-100 text-sm">Given</p>
          <p className="text-2xl font-bold">{myRecognitions.given?.length || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 text-white">
          <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-purple-100 text-sm">This Month</p>
          <p className="text-2xl font-bold">{stats?.this_month || 0}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="wall" data-testid="tab-wall">
            <Sparkles size={16} className="mr-1" /> Wall
          </TabsTrigger>
          <TabsTrigger value="leaderboard" data-testid="tab-leaderboard">
            <Trophy size={16} className="mr-1" /> Leaderboard
          </TabsTrigger>
          <TabsTrigger value="my" data-testid="tab-my">
            <Award size={16} className="mr-1" /> My Recognition
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="nominations" data-testid="tab-nominations">
              <Clock size={16} className="mr-1" /> Nominations
              {stats?.pending_nominations > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                  {stats.pending_nominations}
                </span>
              )}
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="categories" data-testid="tab-categories">
              <Settings size={16} className="mr-1" /> Categories
            </TabsTrigger>
          )}
        </TabsList>

        {/* Recognition Wall */}
        <TabsContent value="wall" className="mt-4 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search recognitions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredWall.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Sparkles className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">No recognitions yet</p>
              <p className="text-slate-500 text-sm mt-1">Be the first to recognize someone!</p>
              <Button className="mt-4" onClick={() => setGiveRecognitionOpen(true)}>
                <Sparkles size={16} className="mr-2" />
                Give Recognition
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredWall.map(recognition => {
                const IconComponent = getIcon(categories.find(c => c.id === recognition.category_id)?.icon);
                const categoryColor = categories.find(c => c.id === recognition.category_id)?.color || '#6366f1';
                
                return (
                  <div 
                    key={recognition.id} 
                    className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-shadow"
                    data-testid={`recognition-card-${recognition.id}`}
                  >
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                      >
                        <IconComponent size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span 
                            className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: categoryColor }}
                          >
                            {recognition.category_name}
                          </span>
                          <span className="text-xs text-slate-400">{formatDate(recognition.created_at)}</span>
                        </div>
                        <h3 className="font-semibold text-slate-900 mt-2">{recognition.recipient_name}</h3>
                        <p className="text-sm text-slate-500">
                          Recognized by {recognition.giver_name}
                          {recognition.recipient_department && ` • ${recognition.recipient_department}`}
                        </p>
                        <p className="mt-3 text-slate-700">{recognition.message}</p>
                        
                        {/* Points badge */}
                        {recognition.points > 0 && (
                          <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
                            <Star size={14} fill="currentColor" />
                            +{recognition.points} points
                          </div>
                        )}
                        
                        {/* Engagement */}
                        <div className="mt-4 flex items-center gap-4">
                          <button 
                            onClick={() => handleLike(recognition.id)}
                            className={`flex items-center gap-1 text-sm ${recognition.likes?.includes(user?.id) ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
                          >
                            <Heart size={16} fill={recognition.likes?.includes(user?.id) ? 'currentColor' : 'none'} />
                            {recognition.likes?.length || 0}
                          </button>
                          <button 
                            onClick={() => { setSelectedRecognition(recognition); setViewRecognitionOpen(true); }}
                            className="flex items-center gap-1 text-sm text-slate-400 hover:text-blue-500"
                          >
                            <MessageCircle size={16} />
                            {recognition.comments?.length || 0}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Leaderboard */}
        <TabsContent value="leaderboard" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Select value={leaderboardPeriod} onValueChange={setLeaderboardPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Trophy className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No data for this period</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {/* Top 3 */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6">
                <div className="flex items-end justify-center gap-4">
                  {/* 2nd Place */}
                  {leaderboard[1] && (
                    <div className="text-center flex-1 max-w-[140px]">
                      <div className="w-16 h-16 mx-auto rounded-full bg-slate-600 flex items-center justify-center text-2xl font-bold text-white mb-2">
                        {leaderboard[1].name?.charAt(0) || '?'}
                      </div>
                      <div className="w-8 h-8 mx-auto -mt-4 rounded-full bg-slate-400 flex items-center justify-center text-white font-bold text-sm">
                        2
                      </div>
                      <p className="text-white font-medium mt-2 truncate">{leaderboard[1].name}</p>
                      <p className="text-amber-400 font-bold">{leaderboard[1].total_points} pts</p>
                    </div>
                  )}
                  
                  {/* 1st Place */}
                  {leaderboard[0] && (
                    <div className="text-center flex-1 max-w-[160px]">
                      <Crown className="w-8 h-8 mx-auto text-amber-400 mb-2" />
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-3xl font-bold text-white mb-2">
                        {leaderboard[0].name?.charAt(0) || '?'}
                      </div>
                      <div className="w-10 h-10 mx-auto -mt-5 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                        1
                      </div>
                      <p className="text-white font-semibold mt-2 truncate">{leaderboard[0].name}</p>
                      <p className="text-amber-400 font-bold text-lg">{leaderboard[0].total_points} pts</p>
                    </div>
                  )}
                  
                  {/* 3rd Place */}
                  {leaderboard[2] && (
                    <div className="text-center flex-1 max-w-[140px]">
                      <div className="w-16 h-16 mx-auto rounded-full bg-amber-700 flex items-center justify-center text-2xl font-bold text-white mb-2">
                        {leaderboard[2].name?.charAt(0) || '?'}
                      </div>
                      <div className="w-8 h-8 mx-auto -mt-4 rounded-full bg-amber-700 flex items-center justify-center text-white font-bold text-sm">
                        3
                      </div>
                      <p className="text-white font-medium mt-2 truncate">{leaderboard[2].name}</p>
                      <p className="text-amber-400 font-bold">{leaderboard[2].total_points} pts</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Rest of leaderboard */}
              <div className="divide-y divide-slate-100">
                {leaderboard.slice(3).map((entry) => (
                  <div key={entry.employee_id} className="flex items-center gap-4 p-4 hover:bg-slate-50">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                      {entry.rank}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-medium text-indigo-600">
                      {entry.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{entry.name}</p>
                      <p className="text-sm text-slate-500">{entry.department || 'No department'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-600">{entry.total_points} pts</p>
                      <p className="text-sm text-slate-500">{entry.recognition_count} recognitions</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* My Recognition */}
        <TabsContent value="my" className="mt-4 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Received */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Award size={18} /> Received ({myRecognitions.received?.length || 0})
              </h3>
              {myRecognitions.received?.length === 0 ? (
                <div className="bg-slate-50 rounded-xl p-6 text-center">
                  <Award className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500">No recognitions received yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myRecognitions.received?.map(rec => {
                    const categoryColor = categories.find(c => c.id === rec.category_id)?.color || '#6366f1';
                    return (
                      <div key={rec.id} className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span 
                            className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: categoryColor }}
                          >
                            {rec.category_name}
                          </span>
                          <span className="text-xs text-slate-400">{formatDate(rec.created_at)}</span>
                        </div>
                        <p className="text-slate-700">{rec.message}</p>
                        <p className="text-sm text-slate-500 mt-2">From: {rec.giver_name}</p>
                        {rec.points > 0 && (
                          <div className="mt-2 inline-flex items-center gap-1 text-amber-600 text-sm font-medium">
                            <Star size={14} fill="currentColor" /> +{rec.points} points
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Given */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Heart size={18} /> Given ({myRecognitions.given?.length || 0})
              </h3>
              {myRecognitions.given?.length === 0 ? (
                <div className="bg-slate-50 rounded-xl p-6 text-center">
                  <Heart className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500">You haven't given any recognitions yet</p>
                  <Button size="sm" className="mt-2" onClick={() => setGiveRecognitionOpen(true)}>
                    Give Recognition
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myRecognitions.given?.map(rec => {
                    const categoryColor = categories.find(c => c.id === rec.category_id)?.color || '#6366f1';
                    return (
                      <div key={rec.id} className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span 
                            className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: categoryColor }}
                          >
                            {rec.category_name}
                          </span>
                          <span className="text-xs text-slate-400">{formatDate(rec.created_at)}</span>
                        </div>
                        <p className="text-slate-700">{rec.message}</p>
                        <p className="text-sm text-slate-500 mt-2">To: {rec.recipient_name}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Nominations (Admin) */}
        {isAdmin && (
          <TabsContent value="nominations" className="mt-4 space-y-4">
            {nominations.filter(n => n.status === 'pending').length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <Clock className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No pending nominations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {nominations.filter(n => n.status === 'pending').map(nomination => (
                  <div 
                    key={nomination.id} 
                    className="bg-white rounded-2xl border border-slate-200 p-6"
                    data-testid={`nomination-${nomination.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                            {nomination.category_name}
                          </span>
                          <span className="text-sm text-slate-500">{formatDate(nomination.created_at)}</span>
                        </div>
                        <h3 className="font-semibold text-lg text-slate-900">{nomination.nominee_name}</h3>
                        <p className="text-slate-500">{nomination.nominee_department}</p>
                        
                        <div className="mt-4">
                          <p className="text-sm font-medium text-slate-700">Reason for Nomination:</p>
                          <p className="text-slate-600 mt-1">{nomination.reason}</p>
                        </div>
                        
                        {nomination.achievements && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-slate-700">Achievements:</p>
                            <p className="text-slate-600 mt-1">{nomination.achievements}</p>
                          </div>
                        )}
                        
                        <p className="text-sm text-slate-500 mt-4">Nominated by: {nomination.nominator_name}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApproveNomination(nomination.id)}>
                          <Check size={14} className="mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectNomination(nomination.id)}>
                          <X size={14} className="mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* Categories (Admin) */}
        {isAdmin && (
          <TabsContent value="categories" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { resetCategoryForm(); setCategoryDialogOpen(true); }}>
                <Plus size={16} className="mr-2" /> Add Category
              </Button>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => {
                const IconComponent = getIcon(category.icon);
                return (
                  <div 
                    key={category.id} 
                    className="bg-white rounded-2xl border border-slate-200 p-5"
                    data-testid={`category-${category.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20`, color: category.color }}
                      >
                        <IconComponent size={24} />
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditCategory(category)}>
                          <Edit2 size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)} className="text-rose-600">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-slate-900 mt-3">{category.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{category.description}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-sm text-amber-600">
                        <Star size={14} fill="currentColor" /> {category.points} pts
                      </span>
                      {category.is_nomination_required && (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Requires Approval
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Give Recognition Dialog */}
      <Dialog open={giveRecognitionOpen} onOpenChange={setGiveRecognitionOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500" />
              Give Recognition
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGiveRecognition} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Who do you want to recognize? *</label>
              <Select 
                value={recognitionForm.recipient_id} 
                onValueChange={(v) => setRecognitionForm({...recognitionForm, recipient_id: v})}
              >
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
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Recognition Type *</label>
              <Select 
                value={recognitionForm.category_id} 
                onValueChange={(v) => {
                  const cat = categories.find(c => c.id === v);
                  setRecognitionForm({...recognitionForm, category_id: v, title: cat?.name || ''});
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.is_active && !c.is_nomination_required).map(cat => {
                    const IconComp = getIcon(cat.icon);
                    return (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <IconComp size={16} style={{ color: cat.color }} />
                          {cat.name} (+{cat.points} pts)
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message *</label>
              <Textarea
                value={recognitionForm.message}
                onChange={(e) => setRecognitionForm({...recognitionForm, message: e.target.value})}
                placeholder="Share why you're recognizing this person..."
                rows={4}
                required
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_public"
                checked={recognitionForm.is_public}
                onChange={(e) => setRecognitionForm({...recognitionForm, is_public: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="is_public" className="text-sm text-slate-700">Show on recognition wall</label>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setGiveRecognitionOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="submit-recognition-btn">
                <Send size={16} className="mr-2" />
                Send Recognition
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Nominate Dialog */}
      <Dialog open={nominateOpen} onOpenChange={setNominateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award size={20} className="text-indigo-500" />
              Nominate for Award
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleNominate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nominee *</label>
              <Select 
                value={nominationForm.nominee_id} 
                onValueChange={(v) => setNominationForm({...nominationForm, nominee_id: v})}
              >
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
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Award Category *</label>
              <Select 
                value={nominationForm.category_id} 
                onValueChange={(v) => setNominationForm({...nominationForm, category_id: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select award" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.is_active && c.is_nomination_required).map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Nomination *</label>
              <Textarea
                value={nominationForm.reason}
                onChange={(e) => setNominationForm({...nominationForm, reason: e.target.value})}
                placeholder="Why should this person receive this award?"
                rows={3}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Key Achievements</label>
              <Textarea
                value={nominationForm.achievements}
                onChange={(e) => setNominationForm({...nominationForm, achievements: e.target.value})}
                placeholder="List specific achievements or contributions..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setNominateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Send size={16} className="mr-2" />
                Submit Nomination
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                placeholder="e.g., Star Performer"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                placeholder="Brief description of this recognition type"
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
                    {Object.entries(ICON_MAP).map(([key, Icon]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon size={16} /> {key}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Points</label>
                <Input
                  type="number"
                  value={categoryForm.points}
                  onChange={(e) => setCategoryForm({...categoryForm, points: parseInt(e.target.value) || 0})}
                  min="0"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({...categoryForm, color: e.target.value})}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({...categoryForm, color: e.target.value})}
                  placeholder="#6366f1"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_nomination_required"
                checked={categoryForm.is_nomination_required}
                onChange={(e) => setCategoryForm({...categoryForm, is_nomination_required: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="is_nomination_required" className="text-sm text-slate-700">
                Requires admin approval (for formal awards like "Employee of the Month")
              </label>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setCategoryDialogOpen(false); resetCategoryForm(); }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCategory ? 'Update' : 'Create'} Category
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Recognition Dialog */}
      <Dialog open={viewRecognitionOpen} onOpenChange={setViewRecognitionOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Recognition Details</DialogTitle>
          </DialogHeader>
          
          {selectedRecognition && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span 
                    className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: categories.find(c => c.id === selectedRecognition.category_id)?.color || '#6366f1' }}
                  >
                    {selectedRecognition.category_name}
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(selectedRecognition.created_at)}</span>
                </div>
                <h3 className="font-semibold text-slate-900">{selectedRecognition.recipient_name}</h3>
                <p className="text-sm text-slate-500">Recognized by {selectedRecognition.giver_name}</p>
                <p className="mt-3 text-slate-700">{selectedRecognition.message}</p>
                
                <div className="mt-4 flex items-center gap-4">
                  <button 
                    onClick={() => handleLike(selectedRecognition.id)}
                    className={`flex items-center gap-1 text-sm ${selectedRecognition.likes?.includes(user?.id) ? 'text-rose-500' : 'text-slate-400'}`}
                  >
                    <Heart size={16} fill={selectedRecognition.likes?.includes(user?.id) ? 'currentColor' : 'none'} />
                    {selectedRecognition.likes?.length || 0} likes
                  </button>
                </div>
              </div>
              
              {/* Comments */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Comments ({selectedRecognition.comments?.length || 0})</h4>
                
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedRecognition.comments?.map(comment => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-medium text-indigo-600 flex-shrink-0">
                        {comment.user_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 bg-slate-50 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 text-sm">{comment.user_name}</span>
                          <span className="text-xs text-slate-400">{formatDate(comment.created_at)}</span>
                        </div>
                        <p className="text-slate-700 text-sm mt-1">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 flex gap-2">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    onKeyPress={(e) => e.key === 'Enter' && handleComment(selectedRecognition.id)}
                  />
                  <Button onClick={() => handleComment(selectedRecognition.id)} disabled={!commentText.trim()}>
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recognition;
