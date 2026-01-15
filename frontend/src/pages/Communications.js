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
import { Checkbox } from '../components/ui/checkbox';
import { 
  Megaphone,
  Mail,
  ClipboardList,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Send,
  Check,
  Clock,
  Users,
  Search,
  Filter,
  Pin,
  Bell,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Archive,
  Star,
  ChevronRight,
  MessageSquare,
  FileText,
  Building2,
  FolderTree,
  Globe,
  PieChart
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-700' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', color: 'bg-amber-100 text-amber-700' },
  urgent: { label: 'Urgent', color: 'bg-rose-100 text-rose-700' },
};

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700' },
  published: { label: 'Published', color: 'bg-emerald-100 text-emerald-700' },
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700' },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-700' },
  archived: { label: 'Archived', color: 'bg-slate-100 text-slate-700' },
};

const QUESTION_TYPES = [
  { value: 'text', label: 'Text Answer' },
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'rating', label: 'Rating (1-5)' },
  { value: 'scale', label: 'Scale (1-10)' },
];

const Communications = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('announcements');
  const [stats, setStats] = useState(null);
  
  // Data
  const [announcements, setAnnouncements] = useState([]);
  const [memos, setMemos] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Dialogs
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [memoDialogOpen, setMemoDialogOpen] = useState(false);
  const [surveyDialogOpen, setSurveyDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [surveyResponseDialogOpen, setSurveyResponseDialogOpen] = useState(false);
  const [surveyResultsDialogOpen, setSurveyResultsDialogOpen] = useState(false);
  
  // Selected items
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editingMemo, setEditingMemo] = useState(null);
  const [editingSurvey, setEditingSurvey] = useState(null);
  const [surveyResults, setSurveyResults] = useState(null);
  
  // Forms
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    type: 'company',
    target_ids: [],
    priority: 'normal',
    status: 'draft',
    pinned: false,
    expires_at: '',
  });
  
  const [memoForm, setMemoForm] = useState({
    title: '',
    content: '',
    to_type: 'all',
    to_ids: [],
    priority: 'normal',
    requires_acknowledgment: false,
    status: 'sent',
  });
  
  const [surveyForm, setSurveyForm] = useState({
    title: '',
    description: '',
    questions: [],
    target_type: 'all',
    target_ids: [],
    anonymous: true,
    status: 'draft',
    start_date: '',
    end_date: '',
  });
  
  const [surveyAnswers, setSurveyAnswers] = useState({});

  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  // Fetch functions
  const fetchStats = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await axios.get(`${API}/communications/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [isAdmin]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/announcements`);
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    }
  }, []);

  const fetchMemos = useCallback(async () => {
    try {
      const endpoint = isAdmin ? '/memos' : '/memos/my';
      const response = await axios.get(`${API}${endpoint}`);
      setMemos(response.data);
    } catch (error) {
      console.error('Failed to fetch memos:', error);
    }
  }, [isAdmin]);

  const fetchSurveys = useCallback(async () => {
    try {
      const endpoint = isAdmin ? '/surveys' : '/surveys/my';
      const response = await axios.get(`${API}${endpoint}`);
      setSurveys(response.data);
    } catch (error) {
      console.error('Failed to fetch surveys:', error);
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

  const fetchBranches = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/branches`);
      setBranches(response.data);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchAnnouncements(),
        fetchMemos(),
        fetchSurveys(),
        fetchEmployees(),
        fetchDepartments(),
        fetchBranches(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchAnnouncements, fetchMemos, fetchSurveys, fetchEmployees, fetchDepartments, fetchBranches]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    try {
      if (editingAnnouncement) {
        await axios.put(`${API}/announcements/${editingAnnouncement.id}`, announcementForm);
        toast.success('Announcement updated');
      } else {
        await axios.post(`${API}/announcements`, announcementForm);
        toast.success('Announcement created');
      }
      fetchAnnouncements();
      fetchStats();
      setAnnouncementDialogOpen(false);
      resetAnnouncementForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save announcement');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await axios.delete(`${API}/announcements/${id}`);
      toast.success('Announcement deleted');
      fetchAnnouncements();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete announcement');
    }
  };

  const handleMarkAnnouncementRead = async (id) => {
    try {
      await axios.post(`${API}/announcements/${id}/read`);
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleSaveMemo = async (e) => {
    e.preventDefault();
    try {
      if (editingMemo) {
        await axios.put(`${API}/memos/${editingMemo.id}`, memoForm);
        toast.success('Memo updated');
      } else {
        await axios.post(`${API}/memos`, memoForm);
        toast.success('Memo sent');
      }
      fetchMemos();
      fetchStats();
      setMemoDialogOpen(false);
      resetMemoForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save memo');
    }
  };

  const handleDeleteMemo = async (id) => {
    if (!window.confirm('Delete this memo?')) return;
    try {
      await axios.delete(`${API}/memos/${id}`);
      toast.success('Memo deleted');
      fetchMemos();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete memo');
    }
  };

  const handleAcknowledgeMemo = async (id) => {
    try {
      await axios.post(`${API}/memos/${id}/acknowledge`);
      toast.success('Memo acknowledged');
      fetchMemos();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to acknowledge memo');
    }
  };

  const handleSaveSurvey = async (e) => {
    e.preventDefault();
    try {
      if (editingSurvey) {
        await axios.put(`${API}/surveys/${editingSurvey.id}`, surveyForm);
        toast.success('Survey updated');
      } else {
        await axios.post(`${API}/surveys`, surveyForm);
        toast.success('Survey created');
      }
      fetchSurveys();
      fetchStats();
      setSurveyDialogOpen(false);
      resetSurveyForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save survey');
    }
  };

  const handleDeleteSurvey = async (id) => {
    if (!window.confirm('Delete this survey and all responses?')) return;
    try {
      await axios.delete(`${API}/surveys/${id}`);
      toast.success('Survey deleted');
      fetchSurveys();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete survey');
    }
  };

  const handleSubmitSurveyResponse = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      await axios.post(`${API}/surveys/${selectedItem.id}/respond`, { answers: surveyAnswers });
      toast.success('Survey response submitted');
      fetchSurveys();
      setSurveyResponseDialogOpen(false);
      setSurveyAnswers({});
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit response');
    }
  };

  const handleViewSurveyResults = async (survey) => {
    try {
      const response = await axios.get(`${API}/surveys/${survey.id}/results`);
      setSurveyResults(response.data);
      setSurveyResultsDialogOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to load results');
    }
  };

  // Question management
  const addQuestion = () => {
    setSurveyForm({
      ...surveyForm,
      questions: [
        ...surveyForm.questions,
        {
          id: `q_${Date.now()}`,
          type: 'text',
          question: '',
          options: [],
          required: true,
        }
      ]
    });
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...surveyForm.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setSurveyForm({ ...surveyForm, questions: newQuestions });
  };

  const removeQuestion = (index) => {
    const newQuestions = surveyForm.questions.filter((_, i) => i !== index);
    setSurveyForm({ ...surveyForm, questions: newQuestions });
  };

  const addOption = (questionIndex) => {
    const newQuestions = [...surveyForm.questions];
    newQuestions[questionIndex].options = [...newQuestions[questionIndex].options, ''];
    setSurveyForm({ ...surveyForm, questions: newQuestions });
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const newQuestions = [...surveyForm.questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setSurveyForm({ ...surveyForm, questions: newQuestions });
  };

  const removeOption = (questionIndex, optionIndex) => {
    const newQuestions = [...surveyForm.questions];
    newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
    setSurveyForm({ ...surveyForm, questions: newQuestions });
  };

  // Reset forms
  const resetAnnouncementForm = () => {
    setEditingAnnouncement(null);
    setAnnouncementForm({
      title: '',
      content: '',
      type: 'company',
      target_ids: [],
      priority: 'normal',
      status: 'draft',
      pinned: false,
      expires_at: '',
    });
  };

  const resetMemoForm = () => {
    setEditingMemo(null);
    setMemoForm({
      title: '',
      content: '',
      to_type: 'all',
      to_ids: [],
      priority: 'normal',
      requires_acknowledgment: false,
      status: 'sent',
    });
  };

  const resetSurveyForm = () => {
    setEditingSurvey(null);
    setSurveyForm({
      title: '',
      description: '',
      questions: [],
      target_type: 'all',
      target_ids: [],
      anonymous: true,
      status: 'draft',
      start_date: '',
      end_date: '',
    });
  };

  const openEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      title: announcement.title || '',
      content: announcement.content || '',
      type: announcement.type || 'company',
      target_ids: announcement.target_ids || [],
      priority: announcement.priority || 'normal',
      status: announcement.status || 'draft',
      pinned: announcement.pinned || false,
      expires_at: announcement.expires_at || '',
    });
    setAnnouncementDialogOpen(true);
  };

  const openEditMemo = (memo) => {
    setEditingMemo(memo);
    setMemoForm({
      title: memo.title || '',
      content: memo.content || '',
      to_type: memo.to_type || 'all',
      to_ids: memo.to_ids || [],
      priority: memo.priority || 'normal',
      requires_acknowledgment: memo.requires_acknowledgment || false,
      status: memo.status || 'sent',
    });
    setMemoDialogOpen(true);
  };

  const openEditSurvey = (survey) => {
    setEditingSurvey(survey);
    setSurveyForm({
      title: survey.title || '',
      description: survey.description || '',
      questions: survey.questions || [],
      target_type: survey.target_type || 'all',
      target_ids: survey.target_ids || [],
      anonymous: survey.anonymous !== false,
      status: survey.status || 'draft',
      start_date: survey.start_date || '',
      end_date: survey.end_date || '',
    });
    setSurveyDialogOpen(true);
  };

  const openSurveyResponse = (survey) => {
    setSelectedItem(survey);
    setSurveyAnswers({});
    setSurveyResponseDialogOpen(true);
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
      <div className="p-4 lg:p-6 space-y-6" data-testid="employee-communications-view">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Communications</h1>
          <p className="text-slate-500 mt-1">Stay updated with company announcements, memos, and surveys</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="announcements" data-testid="tab-announcements">
              <Megaphone size={16} className="mr-2" />
              Announcements ({announcements.length})
            </TabsTrigger>
            <TabsTrigger value="memos" data-testid="tab-memos">
              <Mail size={16} className="mr-2" />
              Memos ({memos.length})
            </TabsTrigger>
            <TabsTrigger value="surveys" data-testid="tab-surveys">
              <ClipboardList size={16} className="mr-2" />
              Surveys ({surveys.length})
            </TabsTrigger>
          </TabsList>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="mt-4 space-y-4">
            {announcements.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <Megaphone className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No announcements</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map(ann => (
                  <div 
                    key={ann.id} 
                    className={`bg-white rounded-2xl border ${ann.pinned ? 'border-amber-300 shadow-amber-100' : 'border-slate-200'} p-6 hover:shadow-lg transition-shadow cursor-pointer`}
                    onClick={() => { setSelectedItem(ann); setViewDialogOpen(true); handleMarkAnnouncementRead(ann.id); }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {ann.pinned && <Pin className="w-5 h-5 text-amber-500" />}
                        <h3 className="font-semibold text-lg text-slate-900">{ann.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_CONFIG[ann.priority]?.color}`}>
                          {PRIORITY_CONFIG[ann.priority]?.label}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-600 line-clamp-2 mb-3">{ann.content}</p>
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>By {ann.created_by_name}</span>
                      <span>{new Date(ann.published_at || ann.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Memos Tab */}
          <TabsContent value="memos" className="mt-4 space-y-4">
            {memos.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <Mail className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No memos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {memos.map(memo => {
                  const hasAcknowledged = memo.acknowledged_by?.some(a => a.employee_name === user?.full_name);
                  return (
                    <div 
                      key={memo.id} 
                      className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg text-slate-900">{memo.title}</h3>
                          <p className="text-sm text-slate-500">From: {memo.from_name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_CONFIG[memo.priority]?.color}`}>
                            {PRIORITY_CONFIG[memo.priority]?.label}
                          </span>
                          {memo.requires_acknowledgment && (
                            hasAcknowledged ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                <Check size={12} className="inline mr-1" />
                                Acknowledged
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                <Clock size={12} className="inline mr-1" />
                                Pending
                              </span>
                            )
                          )}
                        </div>
                      </div>
                      <p className="text-slate-600 whitespace-pre-wrap mb-4">{memo.content}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">{new Date(memo.created_at).toLocaleDateString()}</span>
                        {memo.requires_acknowledgment && !hasAcknowledged && (
                          <Button size="sm" onClick={() => handleAcknowledgeMemo(memo.id)} data-testid={`acknowledge-memo-${memo.id}`}>
                            <Check size={14} className="mr-1" />
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Surveys Tab */}
          <TabsContent value="surveys" className="mt-4 space-y-4">
            {surveys.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <ClipboardList className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No active surveys</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {surveys.map(survey => (
                  <div key={survey.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg text-slate-900">{survey.title}</h3>
                      {survey.anonymous && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                          Anonymous
                        </span>
                      )}
                    </div>
                    {survey.description && (
                      <p className="text-slate-600 mb-4">{survey.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">{survey.questions?.length || 0} questions</span>
                      {survey.has_responded ? (
                        <span className="text-emerald-600 text-sm font-medium">
                          <CheckCircle2 size={16} className="inline mr-1" />
                          Completed
                        </span>
                      ) : (
                        <Button size="sm" onClick={() => openSurveyResponse(survey)} data-testid={`take-survey-${survey.id}`}>
                          Take Survey
                          <ChevronRight size={16} className="ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* View Announcement Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedItem?.pinned && <Pin className="w-5 h-5 text-amber-500" />}
                {selectedItem?.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span>By {selectedItem?.created_by_name}</span>
                <span>•</span>
                <span>{new Date(selectedItem?.published_at || selectedItem?.created_at).toLocaleDateString()}</span>
              </div>
              <div className="prose prose-slate max-w-none">
                <p className="whitespace-pre-wrap">{selectedItem?.content}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Survey Response Dialog */}
        <Dialog open={surveyResponseDialogOpen} onOpenChange={setSurveyResponseDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedItem?.title}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitSurveyResponse} className="space-y-6">
              {selectedItem?.description && (
                <p className="text-slate-600">{selectedItem.description}</p>
              )}
              
              {selectedItem?.questions?.map((q, idx) => (
                <div key={q.id} className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    {idx + 1}. {q.question}
                    {q.required && <span className="text-rose-500 ml-1">*</span>}
                  </label>
                  
                  {q.type === 'text' && (
                    <Textarea
                      value={surveyAnswers[q.id] || ''}
                      onChange={(e) => setSurveyAnswers({...surveyAnswers, [q.id]: e.target.value})}
                      placeholder="Your answer..."
                      required={q.required}
                    />
                  )}
                  
                  {q.type === 'single_choice' && (
                    <div className="space-y-2">
                      {q.options?.map((opt, optIdx) => (
                        <label key={optIdx} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`q_${q.id}`}
                            value={opt}
                            checked={surveyAnswers[q.id] === opt}
                            onChange={() => setSurveyAnswers({...surveyAnswers, [q.id]: opt})}
                            required={q.required}
                            className="w-4 h-4 text-indigo-600"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  
                  {q.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {q.options?.map((opt, optIdx) => (
                        <label key={optIdx} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={(surveyAnswers[q.id] || []).includes(opt)}
                            onCheckedChange={(checked) => {
                              const current = surveyAnswers[q.id] || [];
                              setSurveyAnswers({
                                ...surveyAnswers,
                                [q.id]: checked 
                                  ? [...current, opt]
                                  : current.filter(v => v !== opt)
                              });
                            }}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  
                  {q.type === 'rating' && (
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSurveyAnswers({...surveyAnswers, [q.id]: num})}
                          className={`w-10 h-10 rounded-lg border-2 font-medium transition-colors ${
                            surveyAnswers[q.id] === num
                              ? 'border-indigo-500 bg-indigo-500 text-white'
                              : 'border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {q.type === 'scale' && (
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSurveyAnswers({...surveyAnswers, [q.id]: num})}
                          className={`w-8 h-8 rounded-lg border-2 text-sm font-medium transition-colors ${
                            surveyAnswers[q.id] === num
                              ? 'border-indigo-500 bg-indigo-500 text-white'
                              : 'border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setSurveyResponseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="submit-survey-btn">
                  <Send size={16} className="mr-2" />
                  Submit Response
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
    <div className="p-4 lg:p-6 space-y-6" data-testid="admin-communications-view">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Communications</h1>
          <p className="text-slate-500 mt-1">Manage announcements, memos, and surveys</p>
        </div>
        <Button variant="outline" onClick={() => fetchData()}>
          <RefreshCw size={18} className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white">
          <Megaphone className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-amber-100 text-sm">Announcements</p>
          <p className="text-2xl font-bold">{stats?.announcements_total || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white">
          <CheckCircle2 className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-emerald-100 text-sm">Published</p>
          <p className="text-2xl font-bold">{stats?.announcements_published || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
          <Mail className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-blue-100 text-sm">Memos</p>
          <p className="text-2xl font-bold">{stats?.memos_total || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-4 text-white">
          <Clock className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-rose-100 text-sm">Pending Ack</p>
          <p className="text-2xl font-bold">{stats?.memos_pending_ack || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 text-white">
          <ClipboardList className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-indigo-100 text-sm">Surveys</p>
          <p className="text-2xl font-bold">{stats?.surveys_total || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
          <BarChart3 className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-purple-100 text-sm">Active Surveys</p>
          <p className="text-2xl font-bold">{stats?.surveys_active || 0}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="announcements" data-testid="tab-announcements">
            <Megaphone size={16} className="mr-2" />
            Announcements
          </TabsTrigger>
          <TabsTrigger value="memos" data-testid="tab-memos">
            <Mail size={16} className="mr-2" />
            Memos
          </TabsTrigger>
          <TabsTrigger value="surveys" data-testid="tab-surveys">
            <ClipboardList size={16} className="mr-2" />
            Surveys
          </TabsTrigger>
        </TabsList>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => { resetAnnouncementForm(); setAnnouncementDialogOpen(true); }} data-testid="create-announcement-btn">
              <Plus size={18} className="mr-2" />
              New Announcement
            </Button>
          </div>

          {announcements.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Megaphone className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No announcements yet</p>
              <Button className="mt-4" onClick={() => { resetAnnouncementForm(); setAnnouncementDialogOpen(true); }}>
                <Plus size={16} className="mr-2" />
                Create First Announcement
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Priority</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {announcements.filter(a => 
                    !searchQuery || a.title?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map(ann => (
                    <tr key={ann.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {ann.pinned && <Pin size={14} className="text-amber-500" />}
                          <span className="font-medium">{ann.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-600">
                        {ann.type === 'company' ? 'Company-wide' : ann.type}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_CONFIG[ann.priority]?.color}`}>
                          {PRIORITY_CONFIG[ann.priority]?.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[ann.status]?.color}`}>
                          {STATUS_CONFIG[ann.status]?.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">
                        {new Date(ann.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditAnnouncement(ann)}>
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteAnnouncement(ann.id)} className="text-rose-600">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Memos Tab */}
        <TabsContent value="memos" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search memos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => { resetMemoForm(); setMemoDialogOpen(true); }} data-testid="create-memo-btn">
              <Plus size={18} className="mr-2" />
              New Memo
            </Button>
          </div>

          {memos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Mail className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No memos yet</p>
              <Button className="mt-4" onClick={() => { resetMemoForm(); setMemoDialogOpen(true); }}>
                <Plus size={16} className="mr-2" />
                Send First Memo
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">To</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Priority</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Acknowledgments</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {memos.filter(m => 
                    !searchQuery || m.title?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map(memo => (
                    <tr key={memo.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium">{memo.title}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {memo.to_type === 'all' ? 'All Employees' : memo.to_names?.join(', ') || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_CONFIG[memo.priority]?.color}`}>
                          {PRIORITY_CONFIG[memo.priority]?.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {memo.requires_acknowledgment ? (
                          <span className="text-sm">{memo.acknowledged_by?.length || 0} acknowledged</span>
                        ) : (
                          <span className="text-slate-400 text-sm">Not required</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">
                        {new Date(memo.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditMemo(memo)}>
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteMemo(memo.id)} className="text-rose-600">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Surveys Tab */}
        <TabsContent value="surveys" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search surveys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => { resetSurveyForm(); setSurveyDialogOpen(true); }} data-testid="create-survey-btn">
              <Plus size={18} className="mr-2" />
              New Survey
            </Button>
          </div>

          {surveys.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <ClipboardList className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No surveys yet</p>
              <Button className="mt-4" onClick={() => { resetSurveyForm(); setSurveyDialogOpen(true); }}>
                <Plus size={16} className="mr-2" />
                Create First Survey
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Questions</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Responses</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {surveys.filter(s => 
                    !searchQuery || s.title?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map(survey => (
                    <tr key={survey.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{survey.title}</p>
                          {survey.anonymous && (
                            <span className="text-xs text-indigo-600">Anonymous</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{survey.questions?.length || 0}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[survey.status]?.color}`}>
                          {STATUS_CONFIG[survey.status]?.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{survey.response_count || 0}</td>
                      <td className="py-3 px-4 text-sm text-slate-500">
                        {new Date(survey.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewSurveyResults(survey)} title="View Results">
                            <PieChart size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditSurvey(survey)}>
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteSurvey(survey.id)} className="text-rose-600">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Announcement Dialog */}
      <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAnnouncement} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <Input
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                placeholder="Announcement title"
                required
                data-testid="announcement-title-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Content *</label>
              <Textarea
                value={announcementForm.content}
                onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                placeholder="Announcement content..."
                rows={6}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
                <Select value={announcementForm.type} onValueChange={(v) => setAnnouncementForm({...announcementForm, type: v, target_ids: []})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">Company-wide</SelectItem>
                    <SelectItem value="branch">Specific Branch</SelectItem>
                    <SelectItem value="department">Specific Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <Select value={announcementForm.priority} onValueChange={(v) => setAnnouncementForm({...announcementForm, priority: v})}>
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
            </div>
            
            {announcementForm.type === 'branch' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Branch</label>
                <Select value={announcementForm.target_ids[0] || ''} onValueChange={(v) => setAnnouncementForm({...announcementForm, target_ids: [v]})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {announcementForm.type === 'department' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Department</label>
                <Select value={announcementForm.target_ids[0] || ''} onValueChange={(v) => setAnnouncementForm({...announcementForm, target_ids: [v]})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <Select value={announcementForm.status} onValueChange={(v) => setAnnouncementForm({...announcementForm, status: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expires On</label>
                <Input
                  type="date"
                  value={announcementForm.expires_at}
                  onChange={(e) => setAnnouncementForm({...announcementForm, expires_at: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox
                id="pinned"
                checked={announcementForm.pinned}
                onCheckedChange={(checked) => setAnnouncementForm({...announcementForm, pinned: checked})}
              />
              <label htmlFor="pinned" className="text-sm font-medium text-slate-700 cursor-pointer">
                Pin this announcement
              </label>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setAnnouncementDialogOpen(false); resetAnnouncementForm(); }}>
                Cancel
              </Button>
              <Button type="submit" data-testid="save-announcement-btn">
                {editingAnnouncement ? 'Update' : 'Create'} Announcement
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Memo Dialog */}
      <Dialog open={memoDialogOpen} onOpenChange={setMemoDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMemo ? 'Edit Memo' : 'New Memo'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveMemo} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <Input
                value={memoForm.title}
                onChange={(e) => setMemoForm({...memoForm, title: e.target.value})}
                placeholder="Memo subject"
                required
                data-testid="memo-title-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Content *</label>
              <Textarea
                value={memoForm.content}
                onChange={(e) => setMemoForm({...memoForm, content: e.target.value})}
                placeholder="Memo content..."
                rows={6}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Send To</label>
                <Select value={memoForm.to_type} onValueChange={(v) => setMemoForm({...memoForm, to_type: v, to_ids: []})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    <SelectItem value="employees">Specific Employees</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="branch">Branch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <Select value={memoForm.priority} onValueChange={(v) => setMemoForm({...memoForm, priority: v})}>
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
            </div>
            
            {memoForm.to_type === 'employees' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Employees</label>
                <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                  {employees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-50 rounded">
                      <Checkbox
                        checked={memoForm.to_ids.includes(emp.id)}
                        onCheckedChange={(checked) => {
                          setMemoForm({
                            ...memoForm,
                            to_ids: checked 
                              ? [...memoForm.to_ids, emp.id]
                              : memoForm.to_ids.filter(id => id !== emp.id)
                          });
                        }}
                      />
                      <span className="text-sm">{emp.full_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {memoForm.to_type === 'department' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Department</label>
                <Select value={memoForm.to_ids[0] || ''} onValueChange={(v) => setMemoForm({...memoForm, to_ids: [v]})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {memoForm.to_type === 'branch' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Branch</label>
                <Select value={memoForm.to_ids[0] || ''} onValueChange={(v) => setMemoForm({...memoForm, to_ids: [v]})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Checkbox
                id="requires_ack"
                checked={memoForm.requires_acknowledgment}
                onCheckedChange={(checked) => setMemoForm({...memoForm, requires_acknowledgment: checked})}
              />
              <label htmlFor="requires_ack" className="text-sm font-medium text-slate-700 cursor-pointer">
                Require acknowledgment from recipients
              </label>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setMemoDialogOpen(false); resetMemoForm(); }}>
                Cancel
              </Button>
              <Button type="submit" data-testid="send-memo-btn">
                <Send size={16} className="mr-2" />
                {editingMemo ? 'Update' : 'Send'} Memo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Survey Dialog */}
      <Dialog open={surveyDialogOpen} onOpenChange={setSurveyDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSurvey ? 'Edit Survey' : 'New Survey'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSurvey} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <Input
                value={surveyForm.title}
                onChange={(e) => setSurveyForm({...surveyForm, title: e.target.value})}
                placeholder="Survey title"
                required
                data-testid="survey-title-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <Textarea
                value={surveyForm.description}
                onChange={(e) => setSurveyForm({...surveyForm, description: e.target.value})}
                placeholder="Brief description of the survey..."
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <Select value={surveyForm.status} onValueChange={(v) => setSurveyForm({...surveyForm, status: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <Input
                  type="date"
                  value={surveyForm.start_date}
                  onChange={(e) => setSurveyForm({...surveyForm, start_date: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                <Input
                  type="date"
                  value={surveyForm.end_date}
                  onChange={(e) => setSurveyForm({...surveyForm, end_date: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox
                id="anonymous"
                checked={surveyForm.anonymous}
                onCheckedChange={(checked) => setSurveyForm({...surveyForm, anonymous: checked})}
              />
              <label htmlFor="anonymous" className="text-sm font-medium text-slate-700 cursor-pointer">
                Anonymous responses
              </label>
            </div>
            
            {/* Questions */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-slate-700">Questions</label>
                <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                  <Plus size={14} className="mr-1" />
                  Add Question
                </Button>
              </div>
              
              {surveyForm.questions.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl">
                  <ClipboardList className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500 text-sm">No questions yet</p>
                  <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addQuestion}>
                    Add First Question
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {surveyForm.questions.map((q, idx) => (
                    <div key={q.id} className="border rounded-xl p-4 bg-slate-50">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-medium text-slate-500">Question {idx + 1}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(idx)} className="text-rose-600">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        <Input
                          value={q.question}
                          onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                          placeholder="Enter your question..."
                        />
                        
                        <div className="grid grid-cols-2 gap-3">
                          <Select value={q.type} onValueChange={(v) => updateQuestion(idx, 'type', v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {QUESTION_TYPES.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={q.required}
                              onCheckedChange={(checked) => updateQuestion(idx, 'required', checked)}
                            />
                            <span className="text-sm">Required</span>
                          </div>
                        </div>
                        
                        {(q.type === 'single_choice' || q.type === 'multiple_choice') && (
                          <div className="space-y-2">
                            <label className="text-sm text-slate-500">Options:</label>
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex gap-2">
                                <Input
                                  value={opt}
                                  onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                                  placeholder={`Option ${optIdx + 1}`}
                                />
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeOption(idx, optIdx)} className="text-rose-600">
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => addOption(idx)}>
                              <Plus size={14} className="mr-1" />
                              Add Option
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setSurveyDialogOpen(false); resetSurveyForm(); }}>
                Cancel
              </Button>
              <Button type="submit" data-testid="save-survey-btn">
                {editingSurvey ? 'Update' : 'Create'} Survey
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Survey Results Dialog */}
      <Dialog open={surveyResultsDialogOpen} onOpenChange={setSurveyResultsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Survey Results: {surveyResults?.survey?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-slate-900">{surveyResults?.total_responses || 0}</p>
              <p className="text-slate-500">Total Responses</p>
            </div>
            
            {surveyResults?.questions?.map((qResult, idx) => (
              <div key={idx} className="border rounded-xl p-4">
                <h4 className="font-medium text-slate-900 mb-3">
                  {idx + 1}. {qResult.question?.question}
                </h4>
                
                {qResult.question?.type === 'text' ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {qResult.responses?.map((resp, rIdx) => (
                      <p key={rIdx} className="text-sm text-slate-600 bg-slate-50 p-2 rounded">"{resp}"</p>
                    ))}
                    {(!qResult.responses || qResult.responses.length === 0) && (
                      <p className="text-slate-400 text-sm">No responses</p>
                    )}
                  </div>
                ) : qResult.summary && typeof qResult.summary === 'object' && !qResult.summary.average ? (
                  <div className="space-y-2">
                    {Object.entries(qResult.summary).map(([option, count]) => (
                      <div key={option} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{option}</span>
                            <span className="text-slate-500">{count} votes</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${surveyResults.total_responses > 0 ? (count / surveyResults.total_responses) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : qResult.summary?.average !== undefined ? (
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-indigo-600">{qResult.summary.average.toFixed(1)}</p>
                      <p className="text-sm text-slate-500">Average</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-medium text-slate-700">{qResult.summary.min} - {qResult.summary.max}</p>
                      <p className="text-sm text-slate-500">Range</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-medium text-slate-700">{qResult.summary.count}</p>
                      <p className="text-sm text-slate-500">Responses</p>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Communications;
