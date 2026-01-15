import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  GraduationCap, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2,
  Video,
  FileText,
  Users,
  Settings,
  Play,
  Star,
  Award,
  Target,
  Upload,
  Link as LinkIcon,
  Globe,
  BarChart3,
  ChevronRight,
  UserPlus,
  Check,
  X,
  Layers,
  Tag
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-amber-100 text-amber-700' },
  { value: 'advanced', label: 'Advanced', color: 'bg-rose-100 text-rose-700' }
];

const CONTENT_TYPES = [
  { value: 'video', label: 'Video', icon: Video },
  { value: 'document', label: 'Document', icon: FileText },
  { value: 'link', label: 'External Link', icon: Globe },
  { value: 'mixed', label: 'Mixed Content', icon: Layers }
];

const DEFAULT_TYPES = [
  { name: 'Course', icon: 'BookOpen', color: 'bg-blue-100 text-blue-700' },
  { name: 'Certification', icon: 'Award', color: 'bg-emerald-100 text-emerald-700' },
  { name: 'Workshop', icon: 'Users', color: 'bg-purple-100 text-purple-700' },
  { name: 'Webinar', icon: 'Video', color: 'bg-cyan-100 text-cyan-700' },
  { name: 'Tutorial', icon: 'GraduationCap', color: 'bg-indigo-100 text-indigo-700' }
];

const DEFAULT_CATEGORIES = [
  { name: 'Professional Development', color: 'bg-blue-100 text-blue-700' },
  { name: 'Technical Skills', color: 'bg-purple-100 text-purple-700' },
  { name: 'Leadership', color: 'bg-amber-100 text-amber-700' },
  { name: 'Compliance', color: 'bg-rose-100 text-rose-700' },
  { name: 'Soft Skills', color: 'bg-emerald-100 text-emerald-700' },
  { name: 'Onboarding', color: 'bg-cyan-100 text-cyan-700' }
];

const Training = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('courses');
  
  // Data
  const [courses, setCourses] = useState([]);
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Dialogs
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [viewCourseDialogOpen, setViewCourseDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  
  // Selected/Editing
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  
  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';
  
  // Forms
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    type_id: '',
    category_id: '',
    content_type: 'video',
    video_url: '',
    document_url: '',
    external_link: '',
    thumbnail_url: '',
    duration_minutes: '',
    difficulty_level: 'beginner',
    objectives: '',
    prerequisites: '',
    tags: '',
    is_mandatory: false,
    is_published: false
  });

  const [typeForm, setTypeForm] = useState({ name: '', description: '', color: 'bg-blue-100 text-blue-700' });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', color: 'bg-blue-100 text-blue-700' });
  const [assignForm, setAssignForm] = useState({ course_id: '', employee_ids: [], due_date: '' });
  const [completeForm, setCompleteForm] = useState({ feedback: '', rating: 0 });

  useEffect(() => {
    fetchCourses();
    fetchTypes();
    fetchCategories();
    fetchEmployees();
    fetchStats();
    if (isAdmin) {
      fetchAssignments();
    } else {
      fetchMyAssignments();
    }
  }, [isAdmin]);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API}/training-courses`);
      setCourses(response.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const fetchTypes = async () => {
    try {
      const response = await axios.get(`${API}/training-types`);
      setTypes(response.data);
    } catch (error) {
      console.error('Failed to fetch types:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/training-categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await axios.get(`${API}/training-assignments`);
      setAssignments(response.data);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    }
  };

  const fetchMyAssignments = async () => {
    try {
      const response = await axios.get(`${API}/training-assignments/my`);
      setMyAssignments(response.data);
    } catch (error) {
      console.error('Failed to fetch my assignments:', error);
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

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/training-courses/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Course handlers
  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        ...courseForm,
        duration_minutes: parseInt(courseForm.duration_minutes) || null,
        objectives: courseForm.objectives ? courseForm.objectives.split('\n').filter(o => o.trim()) : [],
        prerequisites: courseForm.prerequisites ? courseForm.prerequisites.split('\n').filter(p => p.trim()) : [],
        tags: courseForm.tags ? courseForm.tags.split(',').map(t => t.trim()).filter(t => t) : []
      };
      
      if (editingCourse) {
        await axios.put(`${API}/training-courses/${editingCourse.id}`, formData);
        toast.success('Course updated');
      } else {
        await axios.post(`${API}/training-courses`, formData);
        toast.success('Course created');
      }
      fetchCourses();
      fetchStats();
      resetCourseForm();
    } catch (error) {
      toast.error('Failed to save course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Delete this course? All assignments will also be removed.')) return;
    try {
      await axios.delete(`${API}/training-courses/${courseId}`);
      toast.success('Course deleted');
      fetchCourses();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete course');
    }
  };

  const handlePublishCourse = async (courseId, publish) => {
    try {
      await axios.put(`${API}/training-courses/${courseId}/${publish ? 'publish' : 'unpublish'}`);
      toast.success(publish ? 'Course published' : 'Course unpublished');
      fetchCourses();
    } catch (error) {
      toast.error('Failed to update course');
    }
  };

  // Type handlers
  const handleTypeSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingType) {
        await axios.put(`${API}/training-types/${editingType.id}`, typeForm);
        toast.success('Type updated');
      } else {
        await axios.post(`${API}/training-types`, typeForm);
        toast.success('Type created');
      }
      fetchTypes();
      resetTypeForm();
    } catch (error) {
      toast.error('Failed to save type');
    }
  };

  const handleDeleteType = async (typeId) => {
    if (!window.confirm('Delete this training type?')) return;
    try {
      await axios.delete(`${API}/training-types/${typeId}`);
      toast.success('Type deleted');
      fetchTypes();
    } catch (error) {
      toast.error('Failed to delete type');
    }
  };

  // Category handlers
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(`${API}/training-categories/${editingCategory.id}`, categoryForm);
        toast.success('Category updated');
      } else {
        await axios.post(`${API}/training-categories`, categoryForm);
        toast.success('Category created');
      }
      fetchCategories();
      resetCategoryForm();
    } catch (error) {
      toast.error('Failed to save category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await axios.delete(`${API}/training-categories/${categoryId}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  // Assignment handlers
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/training-assignments/bulk`, assignForm);
      toast.success('Training assigned');
      fetchAssignments();
      setAssignDialogOpen(false);
      setAssignForm({ course_id: '', employee_ids: [], due_date: '' });
    } catch (error) {
      toast.error('Failed to assign training');
    }
  };

  const handleStartTraining = async (assignmentId) => {
    try {
      await axios.put(`${API}/training-assignments/${assignmentId}/start`);
      toast.success('Training started');
      fetchMyAssignments();
    } catch (error) {
      toast.error('Failed to start training');
    }
  };

  const handleCompleteTraining = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/training-assignments/${selectedAssignment.id}/complete`, completeForm);
      toast.success('Training completed!');
      setCompleteDialogOpen(false);
      setCompleteForm({ feedback: '', rating: 0 });
      fetchMyAssignments();
      fetchStats();
    } catch (error) {
      toast.error('Failed to complete training');
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Remove this assignment?')) return;
    try {
      await axios.delete(`${API}/training-assignments/${assignmentId}`);
      toast.success('Assignment removed');
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to remove assignment');
    }
  };

  // Reset forms
  const resetCourseForm = () => {
    setCourseForm({
      title: '', description: '', type_id: '', category_id: '', content_type: 'video',
      video_url: '', document_url: '', external_link: '', thumbnail_url: '',
      duration_minutes: '', difficulty_level: 'beginner', objectives: '',
      prerequisites: '', tags: '', is_mandatory: false, is_published: false
    });
    setEditingCourse(null);
    setCourseDialogOpen(false);
  };

  const resetTypeForm = () => {
    setTypeForm({ name: '', description: '', color: 'bg-blue-100 text-blue-700' });
    setEditingType(null);
    setTypeDialogOpen(false);
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', description: '', color: 'bg-blue-100 text-blue-700' });
    setEditingCategory(null);
    setCategoryDialogOpen(false);
  };

  const openEditCourse = (course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title || '',
      description: course.description || '',
      type_id: course.type_id || '',
      category_id: course.category_id || '',
      content_type: course.content_type || 'video',
      video_url: course.video_url || '',
      document_url: course.document_url || '',
      external_link: course.external_link || '',
      thumbnail_url: course.thumbnail_url || '',
      duration_minutes: course.duration_minutes?.toString() || '',
      difficulty_level: course.difficulty_level || 'beginner',
      objectives: course.objectives?.join('\n') || '',
      prerequisites: course.prerequisites?.join('\n') || '',
      tags: course.tags?.join(', ') || '',
      is_mandatory: course.is_mandatory || false,
      is_published: course.is_published || false
    });
    setCourseDialogOpen(true);
  };

  // Helper functions
  const getTypeName = (typeId) => types.find(t => t.id === typeId)?.name || '-';
  const getCategoryName = (catId) => categories.find(c => c.id === catId)?.name || '-';
  const getEmployeeName = (empId) => employees.find(e => e.id === empId)?.full_name || '-';
  const getDifficultyInfo = (level) => DIFFICULTY_LEVELS.find(d => d.value === level) || DIFFICULTY_LEVELS[0];
  const getContentTypeInfo = (type) => CONTENT_TYPES.find(c => c.value === type) || CONTENT_TYPES[0];

  // Training Request constants for employees
  const TRAINING_TYPES_LIST = [
    { value: 'course', label: 'Course' },
    { value: 'certification', label: 'Certification' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'conference', label: 'Conference' },
    { value: 'online', label: 'Online Course' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'bootcamp', label: 'Bootcamp' }
  ];

  const TRAINING_CATEGORIES_LIST = [
    { value: 'professional', label: 'Professional Development' },
    { value: 'technical', label: 'Technical Skills' },
    { value: 'leadership', label: 'Leadership & Management' },
    { value: 'compliance', label: 'Compliance & Regulatory' },
    { value: 'soft_skills', label: 'Soft Skills' },
    { value: 'other', label: 'Other' }
  ];

  const REQUEST_STATUS = [
    { value: 'pending', label: 'Pending', color: 'bg-slate-100 text-slate-700' },
    { value: 'submitted', label: 'Submitted', color: 'bg-blue-100 text-blue-700' },
    { value: 'under_review', label: 'Under Review', color: 'bg-amber-100 text-amber-700' },
    { value: 'approved', label: 'Approved', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'rejected', label: 'Rejected', color: 'bg-rose-100 text-rose-700' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-indigo-100 text-indigo-700' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' }
  ];

  const getRequestStatusInfo = (status) => REQUEST_STATUS.find(s => s.value === status) || REQUEST_STATUS[0];

  // Employee View
  if (!isAdmin) {
    // State for training requests
    const [employeeTab, setEmployeeTab] = useState('assigned');
    const [myRequests, setMyRequests] = useState([]);
    const [requestDialogOpen, setRequestDialogOpen] = useState(false);
    const [editingRequest, setEditingRequest] = useState(null);
    const [requestForm, setRequestForm] = useState({
      title: '', description: '', training_type: 'course', category: 'professional',
      provider: '', provider_url: '', cost: '', currency: 'USD',
      start_date: '', end_date: '', duration_hours: '', location: 'online',
      objectives: '', expected_outcomes: ''
    });

    // Fetch training requests
    const fetchMyRequests = async () => {
      try {
        const response = await axios.get(`${API}/training-requests/my`);
        setMyRequests(response.data);
      } catch (error) {
        console.error('Failed to fetch my requests:', error);
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchMyRequests(); }, []);

    const handleRequestSubmit = async (e) => {
      e.preventDefault();
      try {
        const formData = {
          ...requestForm,
          cost: parseFloat(requestForm.cost) || 0,
          duration_hours: parseInt(requestForm.duration_hours) || null,
          status: 'submitted'
        };
        if (editingRequest) {
          await axios.put(`${API}/training-requests/${editingRequest.id}`, formData);
          toast.success('Request updated');
        } else {
          await axios.post(`${API}/training-requests`, formData);
          toast.success('Training request submitted!');
        }
        fetchMyRequests();
        setRequestDialogOpen(false);
        setEditingRequest(null);
        setRequestForm({
          title: '', description: '', training_type: 'course', category: 'professional',
          provider: '', provider_url: '', cost: '', currency: 'USD',
          start_date: '', end_date: '', duration_hours: '', location: 'online',
          objectives: '', expected_outcomes: ''
        });
      } catch (error) {
        toast.error('Failed to submit request');
      }
    };

    const handleDeleteRequest = async (requestId) => {
      if (!window.confirm('Delete this request?')) return;
      try {
        await axios.delete(`${API}/training-requests/${requestId}`);
        toast.success('Request deleted');
        fetchMyRequests();
      } catch (error) {
        toast.error('Failed to delete request');
      }
    };

    const openEditRequest = (request) => {
      setEditingRequest(request);
      setRequestForm({
        title: request.title || '',
        description: request.description || '',
        training_type: request.training_type || 'course',
        category: request.category || 'professional',
        provider: request.provider || '',
        provider_url: request.provider_url || '',
        cost: request.cost?.toString() || '',
        currency: request.currency || 'USD',
        start_date: request.start_date || '',
        end_date: request.end_date || '',
        duration_hours: request.duration_hours?.toString() || '',
        location: request.location || 'online',
        objectives: request.objectives || '',
        expected_outcomes: request.expected_outcomes || ''
      });
      setRequestDialogOpen(true);
    };

    return (
      <div data-testid="training-page" className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
              My Training
            </h1>
            <p className="text-slate-500 text-sm sm:text-base mt-1">Complete assigned courses and request new training</p>
          </div>
          <Button 
            onClick={() => { setEditingRequest(null); setRequestForm({ title: '', description: '', training_type: 'course', category: 'professional', provider: '', provider_url: '', cost: '', currency: 'USD', start_date: '', end_date: '', duration_hours: '', location: 'online', objectives: '', expected_outcomes: '' }); setRequestDialogOpen(true); }}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            <Plus size={18} />
            Request Training
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-700">{myAssignments.length}</p>
            <p className="text-xs text-slate-500">Assigned</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">
              {myAssignments.filter(a => a.status === 'in_progress').length}
            </p>
            <p className="text-xs text-slate-500">In Progress</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {myAssignments.filter(a => a.status === 'completed').length}
            </p>
            <p className="text-xs text-slate-500">Completed</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {myRequests.filter(r => ['pending', 'submitted', 'under_review'].includes(r.status)).length}
            </p>
            <p className="text-xs text-slate-500">Requests Pending</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {myRequests.filter(r => r.status === 'approved').length}
            </p>
            <p className="text-xs text-slate-500">Approved</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={employeeTab} onValueChange={setEmployeeTab} className="w-full">
          <TabsList className="bg-slate-100 p-1 rounded-xl w-full sm:w-auto flex">
            <TabsTrigger value="assigned" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-3 sm:px-4">
              <BookOpen size={14} />
              Assigned Courses
              {myAssignments.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-indigo-500 text-white text-xs rounded-full">{myAssignments.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="requests" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-3 sm:px-4">
              <GraduationCap size={14} />
              My Requests
              {myRequests.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">{myRequests.length}</span>}
            </TabsTrigger>
          </TabsList>

          {/* Assigned Courses Tab */}
          <TabsContent value="assigned" className="mt-4">
            <div className="space-y-4">
              {myAssignments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <BookOpen size={48} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">No training assigned yet</p>
                  <p className="text-sm text-slate-400 mt-1">Request training to get started!</p>
                </div>
              ) : (
                myAssignments.map((assignment) => {
                  const course = assignment.course || {};
                  const difficultyInfo = getDifficultyInfo(course.difficulty_level);
                  const ContentIcon = getContentTypeInfo(course.content_type).icon;
                  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date() && assignment.status !== 'completed';
                  
                  return (
                    <div key={assignment.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                      <div className="flex flex-col sm:flex-row">
                        <div className="sm:w-48 h-32 sm:h-auto bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          {course.thumbnail_url ? (
                            <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                          ) : (
                            <ContentIcon size={40} className="text-white/80" />
                          )}
                        </div>
                        <div className="flex-1 p-4 sm:p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-bold text-slate-900">{course.title}</h3>
                                {course.is_mandatory && <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-xs font-bold">Required</span>}
                                {isOverdue && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-bold">Overdue</span>}
                              </div>
                              <p className="text-sm text-slate-500 line-clamp-2">{course.description}</p>
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${difficultyInfo.color}`}>{difficultyInfo.label}</span>
                                {course.duration_minutes && <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={12} />{course.duration_minutes} min</span>}
                                {assignment.due_date && <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-amber-600' : 'text-slate-400'}`}>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>}
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                              {assignment.status === 'completed' ? (
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 size={14} />Completed</span>
                              ) : assignment.status === 'in_progress' ? (
                                <>
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-indigo-600">{assignment.progress || 0}%</p>
                                    <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${assignment.progress || 0}%` }} />
                                    </div>
                                  </div>
                                  <Button onClick={() => { setSelectedAssignment(assignment); setCompleteDialogOpen(true); }} size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
                                    <CheckCircle2 size={14} className="mr-1" />Complete
                                  </Button>
                                </>
                              ) : (
                                <Button onClick={() => handleStartTraining(assignment.id)} size="sm" className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
                                  <Play size={14} className="mr-1" />Start
                                </Button>
                              )}
                            </div>
                          </div>
                          {assignment.status !== 'assigned' && (
                            <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2 flex-wrap">
                              {course.video_url && <a href={course.video_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-indigo-100 transition-colors"><Video size={14} />Watch Video</a>}
                              {course.document_url && <a href={course.document_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-purple-100 transition-colors"><FileText size={14} />View Document</a>}
                              {course.external_link && <a href={course.external_link} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-slate-100 transition-colors"><Globe size={14} />External Link</a>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* My Requests Tab */}
          <TabsContent value="requests" className="mt-4">
            <div className="space-y-4">
              {myRequests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <GraduationCap size={48} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">No training requests yet</p>
                  <Button onClick={() => setRequestDialogOpen(true)} variant="outline" className="mt-4 rounded-xl">
                    <Plus size={16} className="mr-2" />Request Your First Training
                  </Button>
                </div>
              ) : (
                myRequests.map((request) => {
                  const statusInfo = getRequestStatusInfo(request.status);
                  return (
                    <div key={request.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold text-slate-900">{request.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusInfo.color}`}>{statusInfo.label}</span>
                          </div>
                          <p className="text-sm text-slate-500 line-clamp-2">{request.description || 'No description'}</p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-slate-400">
                            <span>{TRAINING_TYPES_LIST.find(t => t.value === request.training_type)?.label || request.training_type}</span>
                            <span>•</span>
                            <span>{request.provider || 'No provider'}</span>
                            {request.cost > 0 && <><span>•</span><span className="font-medium text-slate-600">${request.cost}</span></>}
                            {request.start_date && <><span>•</span><span>{new Date(request.start_date).toLocaleDateString()}</span></>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {request.status === 'pending' && (
                            <>
                              <Button onClick={() => openEditRequest(request)} size="sm" variant="ghost" className="rounded-lg"><Edit2 size={16} /></Button>
                              <Button onClick={() => handleDeleteRequest(request.id)} size="sm" variant="ghost" className="rounded-lg text-rose-600"><Trash2 size={16} /></Button>
                            </>
                          )}
                        </div>
                      </div>
                      {request.status === 'rejected' && request.rejection_reason && (
                        <div className="mt-3 p-3 bg-rose-50 rounded-xl text-sm text-rose-700">
                          <strong>Rejection reason:</strong> {request.rejection_reason}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Complete Training Dialog */}
        <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
          <DialogContent className="rounded-2xl max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Award className="text-emerald-600" size={24} />
                Complete Training
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCompleteTraining} className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">How was this training?</label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setCompleteForm({ ...completeForm, rating: star })} className="p-1 transition-transform hover:scale-110">
                      <Star size={32} className={star <= completeForm.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Feedback (optional)</label>
                <textarea value={completeForm.feedback} onChange={(e) => setCompleteForm({ ...completeForm, feedback: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none" rows={3} placeholder="Share your thoughts..." />
              </div>
              <Button type="submit" className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700">Mark as Completed</Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Request Training Dialog */}
        <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
          <DialogContent className="rounded-2xl max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <GraduationCap className="text-indigo-600" size={24} />
                {editingRequest ? 'Edit Training Request' : 'Request Training'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRequestSubmit} className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Training Title *</label>
                <Input value={requestForm.title} onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })} className="rounded-xl" placeholder="e.g. AWS Solutions Architect Certification" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Type *</label>
                  <Select value={requestForm.training_type} onValueChange={(v) => setRequestForm({ ...requestForm, training_type: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRAINING_TYPES_LIST.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Category *</label>
                  <Select value={requestForm.category} onValueChange={(v) => setRequestForm({ ...requestForm, category: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRAINING_CATEGORIES_LIST.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Provider</label>
                  <Input value={requestForm.provider} onChange={(e) => setRequestForm({ ...requestForm, provider: e.target.value })} className="rounded-xl" placeholder="e.g. Coursera, Udemy" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Cost ($)</label>
                  <Input type="number" step="0.01" value={requestForm.cost} onChange={(e) => setRequestForm({ ...requestForm, cost: e.target.value })} className="rounded-xl" placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Start Date *</label>
                  <Input type="date" value={requestForm.start_date} onChange={(e) => setRequestForm({ ...requestForm, start_date: e.target.value })} className="rounded-xl" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">End Date *</label>
                  <Input type="date" value={requestForm.end_date} onChange={(e) => setRequestForm({ ...requestForm, end_date: e.target.value })} className="rounded-xl" required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
                <textarea value={requestForm.description} onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none" rows={2} placeholder="Describe the training program..." />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Learning Objectives</label>
                <textarea value={requestForm.objectives} onChange={(e) => setRequestForm({ ...requestForm, objectives: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none" rows={2} placeholder="What will you learn from this training?" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1">{editingRequest ? 'Update Request' : 'Submit Request'}</Button>
                <Button type="button" onClick={() => setRequestDialogOpen(false)} variant="outline" className="rounded-xl">Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Admin View
  return (
    <div data-testid="training-page" className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Training Management
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1">Create courses, manage categories, and assign training</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { resetCourseForm(); setCourseDialogOpen(true); }} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-2">
            <Plus size={18} />
            <span className="hidden sm:inline">New Course</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-xs sm:text-sm">Total Courses</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{stats?.total_courses || 0}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <BookOpen size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs sm:text-sm">Published</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{stats?.published_courses || 0}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <CheckCircle2 size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-xs sm:text-sm">Assignments</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{stats?.total_assignments || 0}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <Users size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs sm:text-sm">Completions</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{stats?.completed_assignments || 0}</p>
            </div>
            <div className="bg-slate-100 rounded-xl p-2 sm:p-3">
              <Award size={20} className="text-slate-600 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl w-full sm:w-auto flex flex-wrap">
          <TabsTrigger value="courses" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
            <BookOpen size={14} />
            Courses
          </TabsTrigger>
          <TabsTrigger value="assignments" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
            <Users size={14} />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
            <Settings size={14} />
            Types & Categories
          </TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <BookOpen size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No courses created yet</p>
                <Button onClick={() => setCourseDialogOpen(true)} variant="outline" className="mt-4 rounded-xl">
                  <Plus size={16} className="mr-2" />
                  Create First Course
                </Button>
              </div>
            ) : (
              courses.map((course) => {
                const difficultyInfo = getDifficultyInfo(course.difficulty_level);
                const ContentIcon = getContentTypeInfo(course.content_type).icon;
                const courseAssignments = assignments.filter(a => a.course_id === course.id);
                
                return (
                  <div key={course.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {/* Thumbnail */}
                    <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 relative">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ContentIcon size={40} className="text-white/80" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {course.is_published ? (
                          <span className="px-2 py-0.5 bg-emerald-500 text-white rounded text-xs font-bold">Published</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-500 text-white rounded text-xs font-bold">Draft</span>
                        )}
                        {course.is_mandatory && (
                          <span className="px-2 py-0.5 bg-rose-500 text-white rounded text-xs font-bold">Required</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900 truncate">{course.title}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2 mt-1">{course.description || 'No description'}</p>
                      
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${difficultyInfo.color}`}>
                          {difficultyInfo.label}
                        </span>
                        {course.duration_minutes && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock size={12} />
                            {course.duration_minutes} min
                          </span>
                        )}
                        {course.avg_rating > 0 && (
                          <span className="text-xs text-amber-500 flex items-center gap-0.5">
                            <Star size={12} className="fill-amber-400" />
                            {course.avg_rating}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Users size={14} />
                          {courseAssignments.length} assigned
                        </div>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => { setSelectedCourse(course); setAssignForm({ ...assignForm, course_id: course.id }); setAssignDialogOpen(true); }}
                            size="sm"
                            variant="ghost"
                            className="rounded-lg text-indigo-600"
                          >
                            <UserPlus size={16} />
                          </Button>
                          <Button onClick={() => openEditCourse(course)} size="sm" variant="ghost" className="rounded-lg">
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            onClick={() => handlePublishCourse(course.id, !course.is_published)}
                            size="sm"
                            variant="ghost"
                            className={`rounded-lg ${course.is_published ? 'text-amber-600' : 'text-emerald-600'}`}
                          >
                            {course.is_published ? <X size={16} /> : <Check size={16} />}
                          </Button>
                          <Button onClick={() => handleDeleteCourse(course.id)} size="sm" variant="ghost" className="rounded-lg text-rose-600">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="mt-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-start text-xs sm:text-sm font-bold text-slate-700">Employee</th>
                  <th className="px-4 sm:px-6 py-3 text-start text-xs sm:text-sm font-bold text-slate-700">Course</th>
                  <th className="px-4 sm:px-6 py-3 text-start text-xs sm:text-sm font-bold text-slate-700 hidden md:table-cell">Due Date</th>
                  <th className="px-4 sm:px-6 py-3 text-start text-xs sm:text-sm font-bold text-slate-700">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-start text-xs sm:text-sm font-bold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Users size={40} className="mx-auto mb-4 text-slate-300" />
                      <p className="text-slate-500">No assignments yet</p>
                    </td>
                  </tr>
                ) : (
                  assignments.map((assignment) => {
                    const course = courses.find(c => c.id === assignment.course_id) || {};
                    const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date() && assignment.status !== 'completed';
                    return (
                      <tr key={assignment.id} className="border-b border-slate-100">
                        <td className="px-4 sm:px-6 py-3">
                          <p className="font-medium text-slate-900">{getEmployeeName(assignment.employee_id)}</p>
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          <p className="font-medium text-slate-900 truncate max-w-[200px]">{course.title || '-'}</p>
                        </td>
                        <td className="px-4 sm:px-6 py-3 hidden md:table-cell">
                          <span className={isOverdue ? 'text-amber-600' : 'text-slate-600'}>
                            {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : '-'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            assignment.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            assignment.status === 'in_progress' ? 'bg-indigo-100 text-indigo-700' :
                            isOverdue ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {assignment.status === 'completed' ? 'Completed' :
                             assignment.status === 'in_progress' ? `${assignment.progress || 0}%` :
                             isOverdue ? 'Overdue' : 'Assigned'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          <Button onClick={() => handleDeleteAssignment(assignment.id)} size="sm" variant="ghost" className="rounded-lg text-rose-600">
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Types */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Layers size={18} />
                  Training Types
                </h3>
                <Button onClick={() => { resetTypeForm(); setTypeDialogOpen(true); }} size="sm" className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
                  <Plus size={16} />
                </Button>
              </div>
              <div className="p-4 space-y-2">
                {types.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No types created. Add default types?</p>
                ) : (
                  types.map((type) => (
                    <div key={type.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${type.color || 'bg-slate-100 text-slate-700'}`}>
                          {type.name}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button onClick={() => { setEditingType(type); setTypeForm({ name: type.name, description: type.description || '', color: type.color || '' }); setTypeDialogOpen(true); }} size="sm" variant="ghost" className="rounded-lg">
                          <Edit2 size={14} />
                        </Button>
                        <Button onClick={() => handleDeleteType(type.id)} size="sm" variant="ghost" className="rounded-lg text-rose-600">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
                {types.length === 0 && (
                  <Button
                    onClick={async () => {
                      for (const t of DEFAULT_TYPES) {
                        await axios.post(`${API}/training-types`, t);
                      }
                      fetchTypes();
                      toast.success('Default types added');
                    }}
                    variant="outline"
                    className="w-full rounded-xl mt-2"
                  >
                    Add Default Types
                  </Button>
                )}
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Tag size={18} />
                  Training Categories
                </h3>
                <Button onClick={() => { resetCategoryForm(); setCategoryDialogOpen(true); }} size="sm" className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
                  <Plus size={16} />
                </Button>
              </div>
              <div className="p-4 space-y-2">
                {categories.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No categories created. Add default categories?</p>
                ) : (
                  categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${cat.color || 'bg-slate-100 text-slate-700'}`}>
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button onClick={() => { setEditingCategory(cat); setCategoryForm({ name: cat.name, description: cat.description || '', color: cat.color || '' }); setCategoryDialogOpen(true); }} size="sm" variant="ghost" className="rounded-lg">
                          <Edit2 size={14} />
                        </Button>
                        <Button onClick={() => handleDeleteCategory(cat.id)} size="sm" variant="ghost" className="rounded-lg text-rose-600">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
                {categories.length === 0 && (
                  <Button
                    onClick={async () => {
                      for (const c of DEFAULT_CATEGORIES) {
                        await axios.post(`${API}/training-categories`, c);
                      }
                      fetchCategories();
                      toast.success('Default categories added');
                    }}
                    variant="outline"
                    className="w-full rounded-xl mt-2"
                  >
                    Add Default Categories
                  </Button>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Course Dialog */}
      <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <BookOpen className="text-indigo-600" size={24} />
              {editingCourse ? 'Edit Course' : 'Create Course'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCourseSubmit} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Title *</label>
              <Input value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} className="rounded-xl" placeholder="Course title" required />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
              <textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none" rows={2} placeholder="Course description..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Type</label>
                <Select value={courseForm.type_id || 'none'} onValueChange={(v) => setCourseForm({ ...courseForm, type_id: v === 'none' ? '' : v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {types.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Category</label>
                <Select value={courseForm.category_id || 'none'} onValueChange={(v) => setCourseForm({ ...courseForm, category_id: v === 'none' ? '' : v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Content Type *</label>
                <Select value={courseForm.content_type} onValueChange={(v) => setCourseForm({ ...courseForm, content_type: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Difficulty</label>
                <Select value={courseForm.difficulty_level} onValueChange={(v) => setCourseForm({ ...courseForm, difficulty_level: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_LEVELS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Content URLs */}
            {(courseForm.content_type === 'video' || courseForm.content_type === 'mixed') && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-2"><Video size={14} /> Video URL</label>
                <Input value={courseForm.video_url} onChange={(e) => setCourseForm({ ...courseForm, video_url: e.target.value })} className="rounded-xl" placeholder="https://youtube.com/... or video file URL" />
              </div>
            )}
            {(courseForm.content_type === 'document' || courseForm.content_type === 'mixed') && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-2"><FileText size={14} /> Document URL</label>
                <Input value={courseForm.document_url} onChange={(e) => setCourseForm({ ...courseForm, document_url: e.target.value })} className="rounded-xl" placeholder="https://... (PDF, DOC, etc.)" />
              </div>
            )}
            {(courseForm.content_type === 'link' || courseForm.content_type === 'mixed') && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-2"><Globe size={14} /> External Link</label>
                <Input value={courseForm.external_link} onChange={(e) => setCourseForm({ ...courseForm, external_link: e.target.value })} className="rounded-xl" placeholder="https://..." />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Duration (minutes)</label>
                <Input type="number" value={courseForm.duration_minutes} onChange={(e) => setCourseForm({ ...courseForm, duration_minutes: e.target.value })} className="rounded-xl" placeholder="e.g. 60" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Thumbnail URL</label>
                <Input value={courseForm.thumbnail_url} onChange={(e) => setCourseForm({ ...courseForm, thumbnail_url: e.target.value })} className="rounded-xl" placeholder="https://..." />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Learning Objectives (one per line)</label>
              <textarea value={courseForm.objectives} onChange={(e) => setCourseForm({ ...courseForm, objectives: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none" rows={2} placeholder="What learners will achieve..." />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Tags (comma-separated)</label>
              <Input value={courseForm.tags} onChange={(e) => setCourseForm({ ...courseForm, tags: e.target.value })} className="rounded-xl" placeholder="e.g. leadership, communication, management" />
            </div>
            
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={courseForm.is_mandatory} onChange={(e) => setCourseForm({ ...courseForm, is_mandatory: e.target.checked })} className="rounded" />
                <span className="text-sm text-slate-700">Mandatory training</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={courseForm.is_published} onChange={(e) => setCourseForm({ ...courseForm, is_published: e.target.checked })} className="rounded" />
                <span className="text-sm text-slate-700">Publish immediately</span>
              </label>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1">
                {editingCourse ? 'Update Course' : 'Create Course'}
              </Button>
              <Button type="button" onClick={resetCourseForm} variant="outline" className="rounded-xl">Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Type Dialog */}
      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Layers className="text-indigo-600" size={24} />
              {editingType ? 'Edit Type' : 'Add Training Type'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTypeSubmit} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Name *</label>
              <Input value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} className="rounded-xl" placeholder="e.g. Workshop" required />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Color</label>
              <Select value={typeForm.color} onValueChange={(v) => setTypeForm({ ...typeForm, color: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bg-blue-100 text-blue-700">Blue</SelectItem>
                  <SelectItem value="bg-emerald-100 text-emerald-700">Green</SelectItem>
                  <SelectItem value="bg-purple-100 text-purple-700">Purple</SelectItem>
                  <SelectItem value="bg-amber-100 text-amber-700">Amber</SelectItem>
                  <SelectItem value="bg-rose-100 text-rose-700">Rose</SelectItem>
                  <SelectItem value="bg-cyan-100 text-cyan-700">Cyan</SelectItem>
                  <SelectItem value="bg-indigo-100 text-indigo-700">Indigo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1">
                {editingType ? 'Update' : 'Add Type'}
              </Button>
              <Button type="button" onClick={resetTypeForm} variant="outline" className="rounded-xl">Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Tag className="text-indigo-600" size={24} />
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Name *</label>
              <Input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} className="rounded-xl" placeholder="e.g. Leadership" required />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Color</label>
              <Select value={categoryForm.color} onValueChange={(v) => setCategoryForm({ ...categoryForm, color: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bg-blue-100 text-blue-700">Blue</SelectItem>
                  <SelectItem value="bg-emerald-100 text-emerald-700">Green</SelectItem>
                  <SelectItem value="bg-purple-100 text-purple-700">Purple</SelectItem>
                  <SelectItem value="bg-amber-100 text-amber-700">Amber</SelectItem>
                  <SelectItem value="bg-rose-100 text-rose-700">Rose</SelectItem>
                  <SelectItem value="bg-cyan-100 text-cyan-700">Cyan</SelectItem>
                  <SelectItem value="bg-indigo-100 text-indigo-700">Indigo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1">
                {editingCategory ? 'Update' : 'Add Category'}
              </Button>
              <Button type="button" onClick={resetCategoryForm} variant="outline" className="rounded-xl">Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <UserPlus className="text-indigo-600" size={24} />
              Assign Training
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignSubmit} className="space-y-4 mt-4">
            {selectedCourse && (
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="font-medium text-slate-900">{selectedCourse.title}</p>
                <p className="text-sm text-slate-500">{selectedCourse.description?.substring(0, 100)}...</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Select Employees *</label>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1">
                {employees.map((emp) => (
                  <label key={emp.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignForm.employee_ids.includes(emp.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAssignForm({ ...assignForm, employee_ids: [...assignForm.employee_ids, emp.id] });
                        } else {
                          setAssignForm({ ...assignForm, employee_ids: assignForm.employee_ids.filter(id => id !== emp.id) });
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-700">{emp.full_name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1">{assignForm.employee_ids.length} selected</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Due Date (optional)</label>
              <Input type="date" value={assignForm.due_date} onChange={(e) => setAssignForm({ ...assignForm, due_date: e.target.value })} className="rounded-xl" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1" disabled={assignForm.employee_ids.length === 0}>
                Assign Training
              </Button>
              <Button type="button" onClick={() => setAssignDialogOpen(false)} variant="outline" className="rounded-xl">Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Training;
