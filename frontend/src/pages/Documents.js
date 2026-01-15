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
  FileText, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2,
  Check,
  X,
  Clock,
  AlertCircle,
  FileCheck,
  FileX,
  Upload,
  Link as LinkIcon,
  MessageSquare,
  RefreshCw,
  Filter,
  ChevronRight,
  Send,
  RotateCcw,
  Users,
  Settings,
  Copy,
  Layers
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DOCUMENT_TYPES = [
  { value: 'policy', label: 'Policy Document', icon: '📋' },
  { value: 'contract', label: 'Contract', icon: '📝' },
  { value: 'report', label: 'Report', icon: '📊' },
  { value: 'proposal', label: 'Proposal', icon: '💡' },
  { value: 'invoice', label: 'Invoice', icon: '🧾' },
  { value: 'certificate', label: 'Certificate', icon: '🏆' },
  { value: 'other', label: 'Other', icon: '📄' }
];

const CATEGORIES = [
  { value: 'hr', label: 'Human Resources', color: 'bg-purple-100 text-purple-700' },
  { value: 'finance', label: 'Finance', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'legal', label: 'Legal', color: 'bg-rose-100 text-rose-700' },
  { value: 'operations', label: 'Operations', color: 'bg-blue-100 text-blue-700' },
  { value: 'technical', label: 'Technical', color: 'bg-amber-100 text-amber-700' },
  { value: 'general', label: 'General', color: 'bg-slate-100 text-slate-700' }
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-600' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  { value: 'high', label: 'High', color: 'bg-amber-100 text-amber-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-rose-100 text-rose-700' }
];

const STATUS_CONFIG = [
  { value: 'draft', label: 'Draft', color: 'bg-slate-100 text-slate-600', icon: FileText },
  { value: 'submitted', label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: Send },
  { value: 'under_review', label: 'Under Review', color: 'bg-amber-100 text-amber-700', icon: Eye },
  { value: 'approved', label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: FileCheck },
  { value: 'rejected', label: 'Rejected', color: 'bg-rose-100 text-rose-700', icon: FileX },
  { value: 'revision_requested', label: 'Revision Requested', color: 'bg-orange-100 text-orange-700', icon: RotateCcw },
  { value: 'pending_acknowledgment', label: 'Pending Acknowledgment', color: 'bg-purple-100 text-purple-700', icon: Clock },
  { value: 'acknowledged', label: 'Acknowledged', color: 'bg-teal-100 text-teal-700', icon: FileCheck }
];

const DEFAULT_TYPES = [
  { name: 'Policy', icon: '📋', color: 'bg-blue-100 text-blue-700' },
  { name: 'Contract', icon: '📝', color: 'bg-purple-100 text-purple-700' },
  { name: 'Report', icon: '📊', color: 'bg-emerald-100 text-emerald-700' },
  { name: 'Proposal', icon: '💡', color: 'bg-amber-100 text-amber-700' },
  { name: 'Invoice', icon: '🧾', color: 'bg-rose-100 text-rose-700' },
  { name: 'Certificate', icon: '🏆', color: 'bg-teal-100 text-teal-700' },
  { name: 'Other', icon: '📄', color: 'bg-slate-100 text-slate-700' }
];

const DEFAULT_CATEGORIES = [
  { name: 'Human Resources', color: 'bg-purple-100 text-purple-700' },
  { name: 'Finance', color: 'bg-emerald-100 text-emerald-700' },
  { name: 'Legal', color: 'bg-rose-100 text-rose-700' },
  { name: 'Operations', color: 'bg-blue-100 text-blue-700' },
  { name: 'Technical', color: 'bg-amber-100 text-amber-700' },
  { name: 'General', color: 'bg-slate-100 text-slate-700' }
];

const Documents = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [employeeTab, setEmployeeTab] = useState('submitted');
  
  // Data
  const [documents, setDocuments] = useState([]);
  const [myDocuments, setMyDocuments] = useState([]);
  const [assignedDocuments, setAssignedDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [documentCategories, setDocumentCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  
  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [resubmitDialogOpen, setResubmitDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  
  // Selected/Editing
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [editingDocument, setEditingDocument] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';
  
  // Forms
  const [documentForm, setDocumentForm] = useState({
    title: '',
    description: '',
    document_type: 'report',
    category: 'general',
    document_url: '',
    priority: 'normal',
    due_date: '',
    tags: '',
    assign_to_employees: false,
    employee_ids: []
  });
  
  // File upload state
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [templateUploadedFile, setTemplateUploadedFile] = useState(null);
  const [assignUploadedFile, setAssignUploadedFile] = useState(null);
  
  // Assignment form
  const [assignForm, setAssignForm] = useState({
    title: '',
    description: '',
    document_type: 'report',
    category: 'general',
    document_url: '',
    priority: 'normal',
    due_date: '',
    tags: '',
    employee_ids: []
  });
  
  // Template form
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    document_type_id: '',
    category_id: '',
    default_priority: 'normal',
    document_url: '',
    instructions: '',
    assign_to_employees: false,
    employee_ids: []
  });
  
  // Type form
  const [typeForm, setTypeForm] = useState({ name: '', icon: '📄', color: 'bg-slate-100 text-slate-700' });
  
  // Category form
  const [categoryForm, setCategoryForm] = useState({ name: '', color: 'bg-slate-100 text-slate-700' });
  
  const [rejectReason, setRejectReason] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [resubmitForm, setResubmitForm] = useState({ document_url: '', description: '' });
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchDocuments();
    fetchMyDocuments();
    fetchAssignedDocuments();
    fetchEmployees();
    fetchStats();
    fetchDocumentTypes();
    fetchDocumentCategories();
    fetchTemplates();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API}/document-approvals`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const fetchAssignedDocuments = async () => {
    try {
      const response = await axios.get(`${API}/document-approvals/assigned`);
      setAssignedDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch assigned documents:', error);
    }
  };

  const fetchMyDocuments = async () => {
    try {
      const response = await axios.get(`${API}/document-approvals/my`);
      setMyDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch my documents:', error);
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
      const response = await axios.get(`${API}/document-approvals/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchDocumentTypes = async () => {
    try {
      const response = await axios.get(`${API}/document-types`);
      setDocumentTypes(response.data);
    } catch (error) {
      console.error('Failed to fetch document types:', error);
    }
  };

  const fetchDocumentCategories = async () => {
    try {
      const response = await axios.get(`${API}/document-categories`);
      setDocumentCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch document categories:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API}/document-templates`);
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e, formType = 'document') => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }
    
    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post(`${API}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const fileData = {
        file_url: response.data.file_url,
        file_name: response.data.file_name,
        file_size: response.data.file_size
      };
      
      if (formType === 'document') {
        setUploadedFile(fileData);
        setDocumentForm(prev => ({ ...prev, document_url: response.data.file_url }));
      } else if (formType === 'template') {
        setTemplateUploadedFile(fileData);
        setTemplateForm(prev => ({ ...prev, document_url: response.data.file_url }));
      } else if (formType === 'assign') {
        setAssignUploadedFile(fileData);
        setAssignForm(prev => ({ ...prev, document_url: response.data.file_url }));
      }
      
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        title: documentForm.title,
        description: documentForm.description,
        document_type: documentForm.document_type,
        category: documentForm.category,
        document_url: documentForm.document_url,
        priority: documentForm.priority,
        due_date: documentForm.due_date,
        tags: documentForm.tags ? documentForm.tags.split(',').map(t => t.trim()) : []
      };
      
      if (editingDocument) {
        await axios.put(`${API}/document-approvals/${editingDocument.id}`, formData);
        toast.success('Document updated successfully');
      } else if (isAdmin && documentForm.assign_to_employees && documentForm.employee_ids.length > 0) {
        // Admin assigning document to employees
        await axios.post(`${API}/document-approvals/assign`, {
          ...formData,
          employee_ids: documentForm.employee_ids
        });
        toast.success(`Document assigned to ${documentForm.employee_ids.length} employee(s)`);
      } else {
        await axios.post(`${API}/document-approvals`, formData);
        toast.success('Document created successfully');
      }
      
      fetchDocuments();
      fetchMyDocuments();
      fetchStats();
      setCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to save document');
    }
  };

  const handleApprove = async (docId) => {
    try {
      await axios.put(`${API}/document-approvals/${docId}/approve`);
      toast.success('Document approved');
      fetchDocuments();
      fetchMyDocuments();
      fetchStats();
      setViewDialogOpen(false);
    } catch (error) {
      toast.error('Failed to approve document');
    }
  };

  const handleReject = async () => {
    if (!selectedDocument) return;
    try {
      await axios.put(`${API}/document-approvals/${selectedDocument.id}/reject`, {
        rejection_reason: rejectReason
      });
      toast.success('Document rejected');
      fetchDocuments();
      fetchMyDocuments();
      fetchStats();
      setRejectDialogOpen(false);
      setViewDialogOpen(false);
      setRejectReason('');
    } catch (error) {
      toast.error('Failed to reject document');
    }
  };

  const handleRequestRevision = async () => {
    if (!selectedDocument) return;
    try {
      await axios.put(`${API}/document-approvals/${selectedDocument.id}/request-revision`, {
        revision_notes: revisionNotes
      });
      toast.success('Revision requested');
      fetchDocuments();
      fetchMyDocuments();
      fetchStats();
      setRevisionDialogOpen(false);
      setViewDialogOpen(false);
      setRevisionNotes('');
    } catch (error) {
      toast.error('Failed to request revision');
    }
  };

  const handleResubmit = async () => {
    if (!selectedDocument) return;
    try {
      await axios.put(`${API}/document-approvals/${selectedDocument.id}/resubmit`, resubmitForm);
      toast.success('Document resubmitted');
      fetchDocuments();
      fetchMyDocuments();
      fetchStats();
      setResubmitDialogOpen(false);
      setViewDialogOpen(false);
      setResubmitForm({ document_url: '', description: '' });
    } catch (error) {
      toast.error('Failed to resubmit document');
    }
  };

  const handleStartReview = async (docId) => {
    try {
      await axios.put(`${API}/document-approvals/${docId}/review`);
      toast.success('Document marked as under review');
      fetchDocuments();
      fetchStats();
    } catch (error) {
      toast.error('Failed to start review');
    }
  };

  const handleAddComment = async () => {
    if (!selectedDocument || !newComment.trim()) return;
    try {
      const response = await axios.post(`${API}/document-approvals/${selectedDocument.id}/comment`, {
        text: newComment
      });
      setSelectedDocument(response.data);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await axios.delete(`${API}/document-approvals/${docId}`);
      toast.success('Document deleted');
      fetchDocuments();
      fetchMyDocuments();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete document');
    }
  };

  // Admin assign document to employees
  const handleAssignDocument = async (e) => {
    e.preventDefault();
    if (assignForm.employee_ids.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }
    try {
      await axios.post(`${API}/document-approvals/assign`, {
        ...assignForm,
        tags: assignForm.tags ? assignForm.tags.split(',').map(t => t.trim()) : []
      });
      toast.success(`Document assigned to ${assignForm.employee_ids.length} employee(s)`);
      fetchDocuments();
      fetchStats();
      setAssignDialogOpen(false);
      setAssignForm({
        title: '',
        description: '',
        document_type: 'policy',
        category: 'hr',
        document_url: '',
        priority: 'normal',
        due_date: '',
        employee_ids: []
      });
      setAssignUploadedFile(null);
    } catch (error) {
      toast.error('Failed to assign document');
    }
  };

  // Employee acknowledge document
  const handleAcknowledge = async (docId) => {
    try {
      await axios.put(`${API}/document-approvals/${docId}/acknowledge`);
      toast.success('Document acknowledged');
      fetchAssignedDocuments();
      fetchMyDocuments();
    } catch (error) {
      toast.error('Failed to acknowledge document');
    }
  };

  // Template handlers
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      // Validate employee selection if assigning
      if (templateForm.assign_to_employees && templateForm.employee_ids.length === 0) {
        toast.error('Please select at least one employee to assign');
        return;
      }
      
      if (editingTemplate) {
        await axios.put(`${API}/document-templates/${editingTemplate.id}`, templateForm);
        toast.success('Template updated');
      } else {
        // Create the template first
        const templateResponse = await axios.post(`${API}/document-templates`, {
          name: templateForm.name,
          description: templateForm.description,
          document_type_id: templateForm.document_type_id,
          category_id: templateForm.category_id,
          default_priority: templateForm.default_priority,
          document_url: templateForm.document_url,
          instructions: templateForm.instructions
        });
        
        // If assign_to_employees is checked, create documents for each employee
        if (templateForm.assign_to_employees && templateForm.employee_ids.length > 0) {
          const assignmentPromises = templateForm.employee_ids.map(empId => 
            axios.post(`${API}/document-approvals`, {
              title: templateForm.name,
              description: templateForm.description || templateForm.instructions || '',
              document_type: documentTypes.find(t => t.id === templateForm.document_type_id)?.name || 'general',
              category: documentCategories.find(c => c.id === templateForm.category_id)?.name || 'general',
              document_url: templateForm.document_url,
              priority: templateForm.default_priority,
              assigned_to: empId,
              acknowledgment_required: true,
              status: 'assigned'
            })
          );
          await Promise.all(assignmentPromises);
          toast.success(`Template created and assigned to ${templateForm.employee_ids.length} employee(s)`);
          fetchDocuments();
          fetchAssignedDocuments();
        } else {
          toast.success('Template created');
        }
      }
      fetchTemplates();
      setTemplateDialogOpen(false);
      resetTemplateForm();
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await axios.delete(`${API}/document-templates/${templateId}`);
      toast.success('Template deleted');
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      document_type_id: '',
      category_id: '',
      default_priority: 'normal',
      document_url: '',
      instructions: '',
      assign_to_employees: false,
      employee_ids: []
    });
    setEditingTemplate(null);
    setTemplateUploadedFile(null);
  };

  // Type handlers
  const handleSaveType = async (e) => {
    e.preventDefault();
    try {
      if (editingType) {
        await axios.put(`${API}/document-types/${editingType.id}`, typeForm);
        toast.success('Document type updated');
      } else {
        await axios.post(`${API}/document-types`, typeForm);
        toast.success('Document type created');
      }
      fetchDocumentTypes();
      setTypeDialogOpen(false);
      setTypeForm({ name: '', icon: '📄', color: 'bg-slate-100 text-slate-700' });
      setEditingType(null);
    } catch (error) {
      toast.error('Failed to save document type');
    }
  };

  const handleDeleteType = async (typeId) => {
    if (!window.confirm('Are you sure you want to delete this document type?')) return;
    try {
      await axios.delete(`${API}/document-types/${typeId}`);
      toast.success('Document type deleted');
      fetchDocumentTypes();
    } catch (error) {
      toast.error('Failed to delete document type');
    }
  };

  const addDefaultTypes = async () => {
    try {
      for (const type of DEFAULT_TYPES) {
        await axios.post(`${API}/document-types`, type);
      }
      toast.success('Default types added');
      fetchDocumentTypes();
    } catch (error) {
      toast.error('Failed to add default types');
    }
  };

  // Category handlers
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(`${API}/document-categories/${editingCategory.id}`, categoryForm);
        toast.success('Category updated');
      } else {
        await axios.post(`${API}/document-categories`, categoryForm);
        toast.success('Category created');
      }
      fetchDocumentCategories();
      setCategoryDialogOpen(false);
      setCategoryForm({ name: '', color: 'bg-slate-100 text-slate-700' });
      setEditingCategory(null);
    } catch (error) {
      toast.error('Failed to save category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await axios.delete(`${API}/document-categories/${categoryId}`);
      toast.success('Category deleted');
      fetchDocumentCategories();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const addDefaultCategories = async () => {
    try {
      for (const cat of DEFAULT_CATEGORIES) {
        await axios.post(`${API}/document-categories`, cat);
      }
      toast.success('Default categories added');
      fetchDocumentCategories();
    } catch (error) {
      toast.error('Failed to add default categories');
    }
  };

  // Helper functions for dynamic types/categories
  const getTypeName = (typeId) => {
    const type = documentTypes.find(t => t.id === typeId);
    return type ? type.name : typeId;
  };

  const getCategoryName = (categoryId) => {
    const cat = documentCategories.find(c => c.id === categoryId);
    return cat ? cat.name : categoryId;
  };

  const resetForm = () => {
    setDocumentForm({
      title: '',
      description: '',
      document_type: 'report',
      category: 'general',
      document_url: '',
      priority: 'normal',
      due_date: '',
      tags: '',
      assign_to_employees: false,
      employee_ids: []
    });
    setEditingDocument(null);
    setUploadedFile(null);
  };

  const openEditDocument = (doc) => {
    setEditingDocument(doc);
    setDocumentForm({
      title: doc.title || '',
      description: doc.description || '',
      document_type: doc.document_type || 'report',
      category: doc.category || 'general',
      document_url: doc.document_url || '',
      priority: doc.priority || 'normal',
      due_date: doc.due_date || '',
      tags: doc.tags ? doc.tags.join(', ') : '',
      assign_to_employees: false,
      employee_ids: []
    });
    setCreateDialogOpen(true);
  };

  const openViewDocument = (doc) => {
    setSelectedDocument(doc);
    setViewDialogOpen(true);
  };

  // Helper functions
  const getStatusInfo = (status) => STATUS_CONFIG.find(s => s.value === status) || STATUS_CONFIG[0];
  const getTypeInfo = (type) => DOCUMENT_TYPES.find(t => t.value === type) || DOCUMENT_TYPES[6];
  const getCategoryInfo = (cat) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[5];
  const getPriorityInfo = (priority) => PRIORITIES.find(p => p.value === priority) || PRIORITIES[1];
  const getEmployeeName = (empId) => employees.find(e => e.id === empId)?.full_name || 'Unknown';

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
    if (typeFilter !== 'all' && doc.document_type !== typeFilter) return false;
    return true;
  });

  const pendingDocuments = filteredDocuments.filter(d => ['submitted', 'under_review'].includes(d.status));
  const approvedDocuments = filteredDocuments.filter(d => d.status === 'approved');
  const rejectedDocuments = filteredDocuments.filter(d => ['rejected', 'revision_requested'].includes(d.status));
  const assignedDocs = filteredDocuments.filter(d => d.is_assigned);

  // Employee View
  if (!isAdmin) {
    const pendingAcknowledgment = assignedDocuments.filter(d => !d.acknowledged);
    const acknowledgedDocs = assignedDocuments.filter(d => d.acknowledged);
    
    return (
      <div data-testid="documents-page" className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
              My Documents
            </h1>
            <p className="text-slate-500 text-sm sm:text-base mt-1">Submit documents and view assigned documents</p>
          </div>
          <Button 
            onClick={() => { resetForm(); setCreateDialogOpen(true); }}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-2"
            data-testid="submit-document-btn"
          >
            <Plus size={18} />
            Submit Document
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-700">{myDocuments.filter(d => !d.is_assigned).length}</p>
            <p className="text-xs text-slate-500">Submitted</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {myDocuments.filter(d => ['submitted', 'under_review'].includes(d.status) && !d.is_assigned).length}
            </p>
            <p className="text-xs text-slate-500">Pending</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {myDocuments.filter(d => d.status === 'approved').length}
            </p>
            <p className="text-xs text-slate-500">Approved</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{assignedDocuments.length}</p>
            <p className="text-xs text-slate-500">Assigned</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{pendingAcknowledgment.length}</p>
            <p className="text-xs text-slate-500">To Review</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-teal-600">{acknowledgedDocs.length}</p>
            <p className="text-xs text-slate-500">Acknowledged</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={employeeTab} onValueChange={setEmployeeTab} className="w-full">
          <TabsList className="bg-slate-100 p-1 rounded-xl w-full sm:w-auto flex">
            <TabsTrigger value="submitted" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-3 sm:px-4">
              <Send size={14} />
              My Submissions
            </TabsTrigger>
            <TabsTrigger value="assigned" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-3 sm:px-4">
              <FileCheck size={14} />
              Assigned to Me
              {pendingAcknowledgment.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                  {pendingAcknowledgment.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* My Submissions Tab */}
          <TabsContent value="submitted" className="mt-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <FileText size={18} />
                  Documents I've Submitted
                </h3>
              </div>
              {myDocuments.filter(d => !d.is_assigned).length === 0 ? (
                <div className="p-12 text-center">
                  <FileText size={48} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">No documents submitted yet</p>
                  <Button onClick={() => setCreateDialogOpen(true)} variant="outline" className="mt-4 rounded-xl">
                    <Plus size={16} className="mr-2" />
                    Submit Your First Document
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {myDocuments.filter(d => !d.is_assigned).map((doc) => {
                    const statusInfo = getStatusInfo(doc.status);
                    const typeInfo = getTypeInfo(doc.document_type);
                    const priorityInfo = getPriorityInfo(doc.priority);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-lg">{typeInfo.icon}</span>
                              <h4 className="font-bold text-slate-900">{doc.title}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${statusInfo.color}`}>
                                <StatusIcon size={12} />
                                {statusInfo.label}
                              </span>
                              {doc.priority !== 'normal' && (
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityInfo.color}`}>
                                  {priorityInfo.label}
                                </span>
                              )}
                              {doc.version > 1 && (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                                  v{doc.version}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 line-clamp-2 mb-2">
                              {doc.description || 'No description'}
                            </p>
                            <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
                              <span>{typeInfo.label}</span>
                              <span>•</span>
                              <span>{getCategoryInfo(doc.category).label}</span>
                              {doc.due_date && (
                                <>
                                  <span>•</span>
                                  <span>Due: {new Date(doc.due_date).toLocaleDateString()}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                            </div>
                            {doc.status === 'rejected' && doc.rejection_reason && (
                              <div className="mt-2 p-2 bg-rose-50 rounded-lg text-sm text-rose-700">
                                <strong>Rejection reason:</strong> {doc.rejection_reason}
                              </div>
                            )}
                            {doc.status === 'revision_requested' && doc.revision_notes && (
                              <div className="mt-2 p-2 bg-orange-50 rounded-lg text-sm text-orange-700">
                                <strong>Revision notes:</strong> {doc.revision_notes}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button onClick={() => openViewDocument(doc)} size="sm" variant="ghost" className="rounded-lg">
                              <Eye size={16} />
                            </Button>
                            {['draft', 'rejected', 'revision_requested'].includes(doc.status) && (
                              <>
                                {doc.status === 'revision_requested' ? (
                                  <Button 
                                    onClick={() => { setSelectedDocument(doc); setResubmitDialogOpen(true); }} 
                                    size="sm" 
                                    className="rounded-lg bg-indigo-600 hover:bg-indigo-700"
                                  >
                                    <RefreshCw size={14} className="mr-1" />
                                    Resubmit
                                  </Button>
                                ) : (
                                  <Button onClick={() => openEditDocument(doc)} size="sm" variant="ghost" className="rounded-lg">
                                    <Edit2 size={16} />
                                  </Button>
                                )}
                                <Button onClick={() => handleDelete(doc.id)} size="sm" variant="ghost" className="rounded-lg text-rose-600">
                                  <Trash2 size={16} />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Assigned Documents Tab */}
          <TabsContent value="assigned" className="mt-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck size={18} />
                  Documents Assigned to Me
                </h3>
              </div>
              {assignedDocuments.length === 0 ? (
                <div className="p-12 text-center">
                  <FileCheck size={48} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">No documents assigned to you yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {assignedDocuments.map((doc) => {
                    const statusInfo = getStatusInfo(doc.status);
                    const typeInfo = getTypeInfo(doc.document_type);
                    const priorityInfo = getPriorityInfo(doc.priority);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <div key={doc.id} className={`p-4 hover:bg-slate-50 transition-colors ${!doc.acknowledged ? 'bg-amber-50/50' : ''}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-lg">{typeInfo.icon}</span>
                              <h4 className="font-bold text-slate-900">{doc.title}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${statusInfo.color}`}>
                                <StatusIcon size={12} />
                                {doc.acknowledged ? 'Acknowledged' : 'Pending Acknowledgment'}
                              </span>
                              {doc.priority !== 'normal' && (
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityInfo.color}`}>
                                  {priorityInfo.label}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 line-clamp-2 mb-2">
                              {doc.description || 'No description'}
                            </p>
                            <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
                              <span>{typeInfo.label}</span>
                              <span>•</span>
                              <span>{getCategoryInfo(doc.category).label}</span>
                              {doc.due_date && (
                                <>
                                  <span>•</span>
                                  <span className={new Date(doc.due_date) < new Date() && !doc.acknowledged ? 'text-rose-500 font-medium' : ''}>
                                    Due: {new Date(doc.due_date).toLocaleDateString()}
                                  </span>
                                </>
                              )}
                              <span>•</span>
                              <span>Assigned: {new Date(doc.assigned_at || doc.created_at).toLocaleDateString()}</span>
                              {doc.acknowledged_at && (
                                <>
                                  <span>•</span>
                                  <span className="text-teal-600">Acknowledged: {new Date(doc.acknowledged_at).toLocaleDateString()}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {doc.document_url && (
                              <a 
                                href={doc.document_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition-colors"
                              >
                                <LinkIcon size={14} />
                                View
                              </a>
                            )}
                            {!doc.acknowledged && (
                              <Button 
                                onClick={() => handleAcknowledge(doc.id)} 
                                size="sm" 
                                className="rounded-lg bg-teal-600 hover:bg-teal-700"
                              >
                                <Check size={14} className="mr-1" />
                                Acknowledge
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Create/Edit Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="rounded-2xl max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <FileText className="text-indigo-600" size={24} />
                {editingDocument ? 'Edit Document' : 'Submit Document for Approval'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateDocument} className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Document Title *</label>
                <Input 
                  value={documentForm.title} 
                  onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })} 
                  className="rounded-xl" 
                  placeholder="e.g. Q4 Financial Report" 
                  required 
                  data-testid="document-title-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Type *</label>
                  <Select value={documentForm.document_type} onValueChange={(v) => setDocumentForm({ ...documentForm, document_type: v })}>
                    <SelectTrigger className="rounded-xl" data-testid="document-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.icon} {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Category *</label>
                  <Select value={documentForm.category} onValueChange={(v) => setDocumentForm({ ...documentForm, category: v })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Priority</label>
                  <Select value={documentForm.priority} onValueChange={(v) => setDocumentForm({ ...documentForm, priority: v })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Due Date</label>
                  <Input 
                    type="date" 
                    value={documentForm.due_date} 
                    onChange={(e) => setDocumentForm({ ...documentForm, due_date: e.target.value })} 
                    className="rounded-xl" 
                  />
                </div>
              </div>
              
              {/* File Upload Section */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 block">Upload Document</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors">
                  <input 
                    type="file" 
                    id="document-file-upload"
                    className="hidden" 
                    onChange={(e) => handleFileUpload(e, 'document')}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.odt,.ods,.odp,.png,.jpg,.jpeg,.gif,.csv"
                  />
                  {uploadingFile ? (
                    <div className="py-2">
                      <RefreshCw size={24} className="mx-auto mb-2 text-indigo-500 animate-spin" />
                      <p className="text-sm text-slate-600">Uploading...</p>
                    </div>
                  ) : uploadedFile ? (
                    <div className="py-2">
                      <FileCheck size={24} className="mx-auto mb-2 text-emerald-500" />
                      <p className="text-sm font-medium text-slate-700">{uploadedFile.file_name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(uploadedFile.file_size)}</p>
                      <button 
                        type="button"
                        onClick={() => { setUploadedFile(null); setDocumentForm(prev => ({ ...prev, document_url: '' })); }}
                        className="text-xs text-rose-500 hover:text-rose-600 mt-1"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="document-file-upload" className="cursor-pointer py-2 block">
                      <Upload size={24} className="mx-auto mb-2 text-slate-400" />
                      <p className="text-sm text-slate-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-slate-400">PDF, DOC, XLS, PPT, images (max 10MB)</p>
                    </label>
                  )}
                </div>
              </div>
              
              {/* OR Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400">Or paste a link</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Document URL</label>
                <Input 
                  value={documentForm.document_url} 
                  onChange={(e) => { setDocumentForm({ ...documentForm, document_url: e.target.value }); setUploadedFile(null); }} 
                  className="rounded-xl" 
                  placeholder="https://drive.google.com/..." 
                  data-testid="document-url-input"
                />
                <p className="text-xs text-slate-400 mt-1">Link to Google Drive, Dropbox, or any file hosting service</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
                <textarea 
                  value={documentForm.description} 
                  onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none" 
                  rows={3} 
                  placeholder="Describe the document and its purpose..." 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Tags</label>
                <Input 
                  value={documentForm.tags} 
                  onChange={(e) => setDocumentForm({ ...documentForm, tags: e.target.value })} 
                  className="rounded-xl" 
                  placeholder="budget, quarterly, 2026 (comma separated)" 
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1" data-testid="submit-document-form-btn">
                  {editingDocument ? 'Update Document' : 'Submit for Approval'}
                </Button>
                <Button type="button" onClick={() => setCreateDialogOpen(false)} variant="outline" className="rounded-xl">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Document Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="rounded-2xl max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {selectedDocument && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <span className="text-2xl">{getTypeInfo(selectedDocument.document_type).icon}</span>
                    {selectedDocument.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusInfo(selectedDocument.status).color}`}>
                      {getStatusInfo(selectedDocument.status).label}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryInfo(selectedDocument.category).color}`}>
                      {getCategoryInfo(selectedDocument.category).label}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityInfo(selectedDocument.priority).color}`}>
                      {getPriorityInfo(selectedDocument.priority).label} Priority
                    </span>
                    {selectedDocument.version > 1 && (
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                        Version {selectedDocument.version}
                      </span>
                    )}
                  </div>
                  
                  {selectedDocument.description && (
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-slate-700">{selectedDocument.description}</p>
                    </div>
                  )}
                  
                  {selectedDocument.document_url && (
                    <a 
                      href={selectedDocument.document_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors"
                    >
                      <LinkIcon size={18} />
                      <span className="font-medium">View Document</span>
                      <ChevronRight size={16} className="ml-auto" />
                    </a>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Type:</span>
                      <span className="ml-2 font-medium">{getTypeInfo(selectedDocument.document_type).label}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Created:</span>
                      <span className="ml-2 font-medium">{new Date(selectedDocument.created_at).toLocaleDateString()}</span>
                    </div>
                    {selectedDocument.due_date && (
                      <div>
                        <span className="text-slate-500">Due Date:</span>
                        <span className="ml-2 font-medium">{new Date(selectedDocument.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {selectedDocument.approved_at && (
                      <div>
                        <span className="text-slate-500">
                          {selectedDocument.status === 'approved' ? 'Approved:' : 'Reviewed:'}
                        </span>
                        <span className="ml-2 font-medium">{new Date(selectedDocument.approved_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedDocument.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {selectedDocument.rejection_reason && (
                    <div className="p-4 bg-rose-50 rounded-xl text-rose-700">
                      <strong>Rejection Reason:</strong> {selectedDocument.rejection_reason}
                    </div>
                  )}
                  
                  {selectedDocument.revision_notes && (
                    <div className="p-4 bg-orange-50 rounded-xl text-orange-700">
                      <strong>Revision Notes:</strong> {selectedDocument.revision_notes}
                    </div>
                  )}
                  
                  {/* Comments Section */}
                  {selectedDocument.comments && selectedDocument.comments.length > 0 && (
                    <div className="border-t border-slate-200 pt-4">
                      <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <MessageSquare size={16} />
                        Comments
                      </h4>
                      <div className="space-y-3">
                        {selectedDocument.comments.map((comment) => (
                          <div key={comment.id} className="p-3 bg-slate-50 rounded-xl">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-slate-900 text-sm">{comment.user_name}</span>
                              <span className="text-xs text-slate-400">{new Date(comment.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-700 text-sm">{comment.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Resubmit Dialog */}
        <Dialog open={resubmitDialogOpen} onOpenChange={setResubmitDialogOpen}>
          <DialogContent className="rounded-2xl max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <RefreshCw className="text-indigo-600" size={24} />
                Resubmit Document
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <p className="text-slate-600 text-sm">
                Make the requested changes and resubmit your document for approval.
              </p>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Updated Document URL</label>
                <Input 
                  value={resubmitForm.document_url} 
                  onChange={(e) => setResubmitForm({ ...resubmitForm, document_url: e.target.value })} 
                  className="rounded-xl" 
                  placeholder="https://drive.google.com/..." 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Updated Description (optional)</label>
                <textarea 
                  value={resubmitForm.description} 
                  onChange={(e) => setResubmitForm({ ...resubmitForm, description: e.target.value })} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none" 
                  rows={3} 
                  placeholder="Describe the changes made..." 
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleResubmit} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1">
                  Resubmit Document
                </Button>
                <Button onClick={() => setResubmitDialogOpen(false)} variant="outline" className="rounded-xl">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Admin View
  return (
    <div data-testid="documents-page" className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Document Management
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1">Create, assign, and manage document approvals</p>
        </div>
        <Button 
          onClick={() => { resetForm(); setCreateDialogOpen(true); }}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-2"
        >
          <Plus size={18} />
          Create Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-xs sm:text-sm">Total Documents</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{stats?.total || 0}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <FileText size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-xs sm:text-sm">Pending Review</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{stats?.pending || 0}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <Clock size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs sm:text-sm">Approved</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{stats?.approved || 0}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <FileCheck size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-xs sm:text-sm">Rejected</p>
              <p className="text-2xl sm:text-3xl font-black mt-1">{stats?.rejected || 0}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <FileX size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs sm:text-sm">Urgent Pending</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{stats?.urgent_pending || 0}</p>
            </div>
            <div className="bg-slate-100 rounded-xl p-2 sm:p-3">
              <AlertCircle size={20} className="text-slate-600 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 rounded-xl">
            <Filter size={14} className="mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_CONFIG.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {DOCUMENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl w-full sm:w-auto flex flex-wrap">
          <TabsTrigger value="all" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
            <FileText size={14} />
            All
            <span className="ml-1 px-1.5 py-0.5 bg-slate-200 text-slate-600 text-xs rounded-full">{filteredDocuments.length}</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
            <Clock size={14} />
            Pending
            {pendingDocuments.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">{pendingDocuments.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
            <FileCheck size={14} />
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
            <FileX size={14} />
            Rejected
          </TabsTrigger>
          <TabsTrigger value="assigned" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
            <Users size={14} />
            Assigned
            {assignedDocs.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded-full">{assignedDocs.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="templates" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
            <Copy size={14} />
            Templates
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg flex-1 sm:flex-initial flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-4">
            <Settings size={14} />
            Types & Categories
          </TabsTrigger>
        </TabsList>

        {/* All Documents Tab */}
        <TabsContent value="all" className="mt-4">
          <DocumentList 
            documents={filteredDocuments}
            employees={employees}
            onView={openViewDocument}
            onApprove={handleApprove}
            onReject={(doc) => { setSelectedDocument(doc); setRejectDialogOpen(true); }}
            onRequestRevision={(doc) => { setSelectedDocument(doc); setRevisionDialogOpen(true); }}
            onStartReview={handleStartReview}
            onDelete={handleDelete}
            getStatusInfo={getStatusInfo}
            getTypeInfo={getTypeInfo}
            getCategoryInfo={getCategoryInfo}
            getPriorityInfo={getPriorityInfo}
            getEmployeeName={getEmployeeName}
          />
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="pending" className="mt-4">
          <DocumentList 
            documents={pendingDocuments}
            employees={employees}
            onView={openViewDocument}
            onApprove={handleApprove}
            onReject={(doc) => { setSelectedDocument(doc); setRejectDialogOpen(true); }}
            onRequestRevision={(doc) => { setSelectedDocument(doc); setRevisionDialogOpen(true); }}
            onStartReview={handleStartReview}
            onDelete={handleDelete}
            getStatusInfo={getStatusInfo}
            getTypeInfo={getTypeInfo}
            getCategoryInfo={getCategoryInfo}
            getPriorityInfo={getPriorityInfo}
            getEmployeeName={getEmployeeName}
          />
        </TabsContent>

        {/* Approved Tab */}
        <TabsContent value="approved" className="mt-4">
          <DocumentList 
            documents={approvedDocuments}
            employees={employees}
            onView={openViewDocument}
            onApprove={handleApprove}
            onReject={(doc) => { setSelectedDocument(doc); setRejectDialogOpen(true); }}
            onRequestRevision={(doc) => { setSelectedDocument(doc); setRevisionDialogOpen(true); }}
            onStartReview={handleStartReview}
            onDelete={handleDelete}
            getStatusInfo={getStatusInfo}
            getTypeInfo={getTypeInfo}
            getCategoryInfo={getCategoryInfo}
            getPriorityInfo={getPriorityInfo}
            getEmployeeName={getEmployeeName}
          />
        </TabsContent>

        {/* Rejected Tab */}
        <TabsContent value="rejected" className="mt-4">
          <DocumentList 
            documents={rejectedDocuments}
            employees={employees}
            onView={openViewDocument}
            onApprove={handleApprove}
            onReject={(doc) => { setSelectedDocument(doc); setRejectDialogOpen(true); }}
            onRequestRevision={(doc) => { setSelectedDocument(doc); setRevisionDialogOpen(true); }}
            onStartReview={handleStartReview}
            onDelete={handleDelete}
            getStatusInfo={getStatusInfo}
            getTypeInfo={getTypeInfo}
            getCategoryInfo={getCategoryInfo}
            getPriorityInfo={getPriorityInfo}
            getEmployeeName={getEmployeeName}
          />
        </TabsContent>

        {/* Assigned Documents Tab */}
        <TabsContent value="assigned" className="mt-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Users size={18} />
                Documents Assigned to Employees
              </h3>
              <span className="text-sm text-slate-500">{assignedDocs.length} assigned</span>
            </div>
            {assignedDocs.length === 0 ? (
              <div className="p-12 text-center">
                <Users size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No documents assigned yet</p>
                <Button onClick={() => setAssignDialogOpen(true)} variant="outline" className="mt-4 rounded-xl">
                  <Plus size={16} className="mr-2" />
                  Assign First Document
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {assignedDocs.map((doc) => {
                  const statusInfo = getStatusInfo(doc.status);
                  const typeInfo = getTypeInfo(doc.document_type);
                  return (
                    <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-lg">{typeInfo.icon}</span>
                            <h4 className="font-bold text-slate-900">{doc.title}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${doc.acknowledged ? 'bg-teal-100 text-teal-700' : 'bg-purple-100 text-purple-700'}`}>
                              {doc.acknowledged ? 'Acknowledged' : 'Pending'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 line-clamp-2 mb-2">{doc.description || 'No description'}</p>
                          <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
                            <span className="font-medium text-slate-600">{getEmployeeName(doc.employee_id)}</span>
                            <span>•</span>
                            <span>{typeInfo.label}</span>
                            <span>•</span>
                            <span>Assigned: {new Date(doc.assigned_at || doc.created_at).toLocaleDateString()}</span>
                            {doc.acknowledged_at && (
                              <>
                                <span>•</span>
                                <span className="text-teal-600">Acknowledged: {new Date(doc.acknowledged_at).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Button onClick={() => handleDelete(doc.id)} size="sm" variant="ghost" className="rounded-lg text-rose-600">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Copy size={18} />
                Document Templates
              </h3>
              <Button onClick={() => { resetTemplateForm(); setTemplateDialogOpen(true); }} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-2">
                <Plus size={16} />
                New Template
              </Button>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {templates.length === 0 ? (
                <div className="p-12 text-center">
                  <Copy size={48} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">No document templates yet</p>
                  <Button onClick={() => setTemplateDialogOpen(true)} variant="outline" className="mt-4 rounded-xl">
                    <Plus size={16} className="mr-2" />
                    Create First Template
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {templates.map((template) => (
                    <div key={template.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-bold text-slate-900">{template.name}</h4>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${template.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                              {template.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 line-clamp-2 mb-2">{template.description || 'No description'}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span>Priority: {template.default_priority}</span>
                            {template.document_url && <><span>•</span><span>Has template file</span></>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            onClick={() => { 
                              setEditingTemplate(template); 
                              setTemplateForm({
                                name: template.name,
                                description: template.description || '',
                                document_type_id: template.document_type_id || '',
                                category_id: template.category_id || '',
                                default_priority: template.default_priority || 'normal',
                                document_url: template.document_url || '',
                                instructions: template.instructions || ''
                              });
                              setTemplateDialogOpen(true); 
                            }} 
                            size="sm" 
                            variant="ghost" 
                            className="rounded-lg"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button onClick={() => handleDeleteTemplate(template.id)} size="sm" variant="ghost" className="rounded-lg text-rose-600">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Types & Categories Tab */}
        <TabsContent value="settings" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document Types */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Layers size={18} />
                  Document Types
                </h3>
                <div className="flex gap-2">
                  {documentTypes.length === 0 && (
                    <Button onClick={addDefaultTypes} size="sm" variant="outline" className="rounded-lg text-xs">
                      Add Defaults
                    </Button>
                  )}
                  <Button onClick={() => { setEditingType(null); setTypeForm({ name: '', icon: '📄', color: 'bg-slate-100 text-slate-700' }); setTypeDialogOpen(true); }} size="sm" className="rounded-lg bg-indigo-600 hover:bg-indigo-700">
                    <Plus size={14} />
                  </Button>
                </div>
              </div>
              {documentTypes.length === 0 ? (
                <div className="p-8 text-center">
                  <Layers size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500">No document types defined</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {documentTypes.map((type) => (
                    <div key={type.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{type.icon || '📄'}</span>
                        <span className="font-medium text-slate-700">{type.name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${type.color || 'bg-slate-100 text-slate-600'}`}>
                          {type.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          onClick={() => { 
                            setEditingType(type); 
                            setTypeForm({ name: type.name, icon: type.icon || '📄', color: type.color || 'bg-slate-100 text-slate-700' }); 
                            setTypeDialogOpen(true); 
                          }} 
                          size="sm" 
                          variant="ghost" 
                          className="rounded-lg"
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button onClick={() => handleDeleteType(type.id)} size="sm" variant="ghost" className="rounded-lg text-rose-600">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Document Categories */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Layers size={18} />
                  Document Categories
                </h3>
                <div className="flex gap-2">
                  {documentCategories.length === 0 && (
                    <Button onClick={addDefaultCategories} size="sm" variant="outline" className="rounded-lg text-xs">
                      Add Defaults
                    </Button>
                  )}
                  <Button onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', color: 'bg-slate-100 text-slate-700' }); setCategoryDialogOpen(true); }} size="sm" className="rounded-lg bg-indigo-600 hover:bg-indigo-700">
                    <Plus size={14} />
                  </Button>
                </div>
              </div>
              {documentCategories.length === 0 ? (
                <div className="p-8 text-center">
                  <Layers size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500">No categories defined</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {documentCategories.map((cat) => (
                    <div key={cat.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${cat.color || 'bg-slate-100 text-slate-600'}`}>
                          {cat.name}
                        </span>
                        {!cat.is_active && <span className="text-xs text-slate-400">(Inactive)</span>}
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          onClick={() => { 
                            setEditingCategory(cat); 
                            setCategoryForm({ name: cat.name, color: cat.color || 'bg-slate-100 text-slate-700' }); 
                            setCategoryDialogOpen(true); 
                          }} 
                          size="sm" 
                          variant="ghost" 
                          className="rounded-lg"
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button onClick={() => handleDeleteCategory(cat.id)} size="sm" variant="ghost" className="rounded-lg text-rose-600">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Copy className="text-indigo-600" size={24} />
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveTemplate} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Template Name *</label>
              <Input 
                value={templateForm.name} 
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} 
                className="rounded-xl" 
                placeholder="e.g. Employee NDA Template" 
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Document Type</label>
                <Select value={templateForm.document_type_id} onValueChange={(v) => setTemplateForm({ ...templateForm, document_type_id: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.icon} {t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Category</label>
                <Select value={templateForm.category_id} onValueChange={(v) => setTemplateForm({ ...templateForm, category_id: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Default Priority</label>
              <Select value={templateForm.default_priority} onValueChange={(v) => setTemplateForm({ ...templateForm, default_priority: v })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* File Upload Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 block">Upload Template File</label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors">
                <input 
                  type="file" 
                  id="template-file-upload"
                  className="hidden" 
                  onChange={(e) => handleFileUpload(e, 'template')}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.odt,.ods,.odp,.png,.jpg,.jpeg,.gif,.csv"
                />
                {uploadingFile ? (
                  <div className="py-2">
                    <RefreshCw size={24} className="mx-auto mb-2 text-indigo-500 animate-spin" />
                    <p className="text-sm text-slate-600">Uploading...</p>
                  </div>
                ) : templateUploadedFile ? (
                  <div className="py-2">
                    <FileCheck size={24} className="mx-auto mb-2 text-emerald-500" />
                    <p className="text-sm font-medium text-slate-700">{templateUploadedFile.file_name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(templateUploadedFile.file_size)}</p>
                    <button 
                      type="button"
                      onClick={() => { setTemplateUploadedFile(null); setTemplateForm(prev => ({ ...prev, document_url: '' })); }}
                      className="text-xs text-rose-500 hover:text-rose-600 mt-1"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <label htmlFor="template-file-upload" className="cursor-pointer py-2 block">
                    <Upload size={24} className="mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-600">Click to upload</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, DOC, XLS, PPT, Images (max 10MB)</p>
                  </label>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-slate-200"></div>
                <span className="text-xs text-slate-400 font-medium">OR PASTE A LINK</span>
                <div className="flex-1 border-t border-slate-200"></div>
              </div>
              <Input 
                value={templateUploadedFile ? '' : templateForm.document_url} 
                onChange={(e) => { setTemplateForm({ ...templateForm, document_url: e.target.value }); setTemplateUploadedFile(null); }} 
                className="rounded-xl" 
                placeholder="https://drive.google.com/..."
                disabled={!!templateUploadedFile}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
              <textarea 
                value={templateForm.description} 
                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none" 
                rows={2} 
                placeholder="What is this template for..." 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Instructions</label>
              <textarea 
                value={templateForm.instructions} 
                onChange={(e) => setTemplateForm({ ...templateForm, instructions: e.target.value })} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none" 
                rows={2} 
                placeholder="Instructions for filling out this template..." 
              />
            </div>
            
            {/* Assign to Employees Section */}
            <div className="border-t border-slate-200 pt-4 mt-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={templateForm.assign_to_employees}
                  onChange={(e) => setTemplateForm({ ...templateForm, assign_to_employees: e.target.checked, employee_ids: e.target.checked ? templateForm.employee_ids : [] })}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                />
                <div>
                  <span className="font-medium text-slate-700">Assign to Employees</span>
                  <p className="text-xs text-slate-500">Assign this template as a document to employees for acknowledgement</p>
                </div>
              </label>
              
              {templateForm.assign_to_employees && (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Select Employees *</label>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {employees.map((emp) => (
                      <label key={emp.id} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          checked={templateForm.employee_ids.includes(emp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTemplateForm({ ...templateForm, employee_ids: [...templateForm.employee_ids, emp.id] });
                            } else {
                              setTemplateForm({ ...templateForm, employee_ids: templateForm.employee_ids.filter(id => id !== emp.id) });
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                        />
                        <span className="text-sm text-slate-700">{emp.first_name} {emp.last_name}</span>
                        <span className="text-xs text-slate-400">{emp.work_email || emp.personal_email}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{templateForm.employee_ids.length} employee(s) selected</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1">
                {editingTemplate ? 'Update Template' : (templateForm.assign_to_employees ? 'Create & Assign' : 'Create Template')}
              </Button>
              <Button type="button" onClick={() => setTemplateDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
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
              {editingType ? 'Edit Document Type' : 'Create Document Type'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveType} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Type Name *</label>
              <Input 
                value={typeForm.name} 
                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} 
                className="rounded-xl" 
                placeholder="e.g. Policy" 
                required 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Icon (emoji)</label>
              <Input 
                value={typeForm.icon} 
                onChange={(e) => setTypeForm({ ...typeForm, icon: e.target.value })} 
                className="rounded-xl" 
                placeholder="📄" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Color</label>
              <Select value={typeForm.color} onValueChange={(v) => setTypeForm({ ...typeForm, color: v })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bg-slate-100 text-slate-700">Gray</SelectItem>
                  <SelectItem value="bg-blue-100 text-blue-700">Blue</SelectItem>
                  <SelectItem value="bg-emerald-100 text-emerald-700">Green</SelectItem>
                  <SelectItem value="bg-amber-100 text-amber-700">Amber</SelectItem>
                  <SelectItem value="bg-rose-100 text-rose-700">Red</SelectItem>
                  <SelectItem value="bg-purple-100 text-purple-700">Purple</SelectItem>
                  <SelectItem value="bg-teal-100 text-teal-700">Teal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1">
                {editingType ? 'Update Type' : 'Create Type'}
              </Button>
              <Button type="button" onClick={() => setTypeDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Layers className="text-indigo-600" size={24} />
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCategory} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Category Name *</label>
              <Input 
                value={categoryForm.name} 
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} 
                className="rounded-xl" 
                placeholder="e.g. Human Resources" 
                required 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Color</label>
              <Select value={categoryForm.color} onValueChange={(v) => setCategoryForm({ ...categoryForm, color: v })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bg-slate-100 text-slate-700">Gray</SelectItem>
                  <SelectItem value="bg-blue-100 text-blue-700">Blue</SelectItem>
                  <SelectItem value="bg-emerald-100 text-emerald-700">Green</SelectItem>
                  <SelectItem value="bg-amber-100 text-amber-700">Amber</SelectItem>
                  <SelectItem value="bg-rose-100 text-rose-700">Red</SelectItem>
                  <SelectItem value="bg-purple-100 text-purple-700">Purple</SelectItem>
                  <SelectItem value="bg-teal-100 text-teal-700">Teal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1">
                {editingCategory ? 'Update Category' : 'Create Category'}
              </Button>
              <Button type="button" onClick={() => setCategoryDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Document Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Users className="text-indigo-600" size={24} />
              Assign Document to Employees
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignDocument} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Document Title *</label>
              <Input 
                value={assignForm.title} 
                onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })} 
                className="rounded-xl" 
                placeholder="e.g. Employee Handbook 2026" 
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Type</label>
                <Select value={assignForm.document_type} onValueChange={(v) => setAssignForm({ ...assignForm, document_type: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.icon} {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Category</label>
                <Select value={assignForm.category} onValueChange={(v) => setAssignForm({ ...assignForm, category: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Priority</label>
                <Select value={assignForm.priority} onValueChange={(v) => setAssignForm({ ...assignForm, priority: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Due Date</label>
                <Input 
                  type="date" 
                  value={assignForm.due_date} 
                  onChange={(e) => setAssignForm({ ...assignForm, due_date: e.target.value })} 
                  className="rounded-xl" 
                />
              </div>
            </div>
            
            {/* File Upload Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 block">Upload Document</label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors">
                <input 
                  type="file" 
                  id="assign-document-file-upload"
                  className="hidden" 
                  onChange={(e) => handleFileUpload(e, 'assign')}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.odt,.ods,.odp,.png,.jpg,.jpeg,.gif,.csv"
                />
                {uploadingFile ? (
                  <div className="py-2">
                    <RefreshCw size={24} className="mx-auto mb-2 text-indigo-500 animate-spin" />
                    <p className="text-sm text-slate-600">Uploading...</p>
                  </div>
                ) : assignUploadedFile ? (
                  <div className="py-2">
                    <FileCheck size={24} className="mx-auto mb-2 text-emerald-500" />
                    <p className="text-sm font-medium text-slate-700">{assignUploadedFile.file_name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(assignUploadedFile.file_size)}</p>
                    <button 
                      type="button"
                      onClick={() => { setAssignUploadedFile(null); setAssignForm(prev => ({ ...prev, document_url: '' })); }}
                      className="text-xs text-rose-500 hover:text-rose-600 mt-1"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <label htmlFor="assign-document-file-upload" className="cursor-pointer py-2 block">
                    <Upload size={24} className="mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-600">Click to upload</p>
                    <p className="text-xs text-slate-400">PDF, DOC, XLS, PPT, images (max 10MB)</p>
                  </label>
                )}
              </div>
            </div>
            
            {/* OR Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400">Or paste a link</span>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Document URL</label>
              <Input 
                value={assignForm.document_url} 
                onChange={(e) => { setAssignForm({ ...assignForm, document_url: e.target.value }); setAssignUploadedFile(null); }} 
                className="rounded-xl" 
                placeholder="https://drive.google.com/..." 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
              <textarea 
                value={assignForm.description} 
                onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none" 
                rows={2} 
                placeholder="Brief description of the document..." 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Assign to Employees *</label>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1">
                {employees.length === 0 ? (
                  <p className="text-sm text-slate-500 p-2">No employees found</p>
                ) : (
                  employees.map((emp) => (
                    <label key={emp.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
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
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm font-medium text-slate-700">{emp.full_name}</span>
                      <span className="text-xs text-slate-400">{emp.email}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">{assignForm.employee_ids.length} employee(s) selected</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1">
                Assign Document
              </Button>
              <Button type="button" onClick={() => setAssignDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Document Dialog (Admin) */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="text-indigo-600" size={24} />
              {editingDocument ? 'Edit Document' : 'Create Document'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateDocument} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Document Title *</label>
              <Input 
                value={documentForm.title} 
                onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })} 
                className="rounded-xl" 
                placeholder="e.g. Q4 Financial Report" 
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Type *</label>
                <Select value={documentForm.document_type} onValueChange={(v) => setDocumentForm({ ...documentForm, document_type: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.icon} {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Category *</label>
                <Select value={documentForm.category} onValueChange={(v) => setDocumentForm({ ...documentForm, category: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Priority</label>
                <Select value={documentForm.priority} onValueChange={(v) => setDocumentForm({ ...documentForm, priority: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Due Date</label>
                <Input 
                  type="date" 
                  value={documentForm.due_date} 
                  onChange={(e) => setDocumentForm({ ...documentForm, due_date: e.target.value })} 
                  className="rounded-xl" 
                />
              </div>
            </div>
            
            {/* File Upload Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 block">Upload Document</label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors">
                <input 
                  type="file" 
                  id="admin-document-file-upload"
                  className="hidden" 
                  onChange={(e) => handleFileUpload(e, 'document')}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.odt,.ods,.odp,.png,.jpg,.jpeg,.gif,.csv"
                />
                {uploadingFile ? (
                  <div className="py-2">
                    <RefreshCw size={24} className="mx-auto mb-2 text-indigo-500 animate-spin" />
                    <p className="text-sm text-slate-600">Uploading...</p>
                  </div>
                ) : uploadedFile ? (
                  <div className="py-2">
                    <FileCheck size={24} className="mx-auto mb-2 text-emerald-500" />
                    <p className="text-sm font-medium text-slate-700">{uploadedFile.file_name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(uploadedFile.file_size)}</p>
                    <button 
                      type="button"
                      onClick={() => { setUploadedFile(null); setDocumentForm(prev => ({ ...prev, document_url: '' })); }}
                      className="text-xs text-rose-500 hover:text-rose-600 mt-1"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <label htmlFor="admin-document-file-upload" className="cursor-pointer py-2 block">
                    <Upload size={24} className="mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-600">Click to upload</p>
                    <p className="text-xs text-slate-400">PDF, DOC, XLS, PPT, images (max 10MB)</p>
                  </label>
                )}
              </div>
            </div>
            
            {/* OR Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400">Or paste a link</span>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Document URL</label>
              <Input 
                value={documentForm.document_url} 
                onChange={(e) => { setDocumentForm({ ...documentForm, document_url: e.target.value }); setUploadedFile(null); }} 
                className="rounded-xl" 
                placeholder="https://drive.google.com/..." 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
              <textarea 
                value={documentForm.description} 
                onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none" 
                rows={3} 
                placeholder="Describe the document..." 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Tags</label>
              <Input 
                value={documentForm.tags} 
                onChange={(e) => setDocumentForm({ ...documentForm, tags: e.target.value })} 
                className="rounded-xl" 
                placeholder="budget, quarterly, 2026 (comma separated)" 
              />
            </div>
            
            {/* Assign to Employees Section (Admin only, new documents only) */}
            {!editingDocument && (
              <div className="border-t border-slate-200 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={documentForm.assign_to_employees}
                    onChange={(e) => setDocumentForm({ ...documentForm, assign_to_employees: e.target.checked, employee_ids: [] })}
                    className="rounded border-slate-300 w-5 h-5"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-700">Assign to Employees</span>
                    <p className="text-xs text-slate-500">Assign this document to employees for acknowledgment</p>
                  </div>
                </label>
                
                {documentForm.assign_to_employees && (
                  <div className="mt-3">
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Select Employees *</label>
                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1">
                      {employees.length === 0 ? (
                        <p className="text-sm text-slate-500 p-2">No employees found</p>
                      ) : (
                        employees.map((emp) => (
                          <label key={emp.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={documentForm.employee_ids.includes(emp.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setDocumentForm({ ...documentForm, employee_ids: [...documentForm.employee_ids, emp.id] });
                                } else {
                                  setDocumentForm({ ...documentForm, employee_ids: documentForm.employee_ids.filter(id => id !== emp.id) });
                                }
                              }}
                              className="rounded border-slate-300"
                            />
                            <span className="text-sm font-medium text-slate-700">{emp.full_name}</span>
                            <span className="text-xs text-slate-400">{emp.email || emp.personal_email}</span>
                          </label>
                        ))
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{documentForm.employee_ids.length} employee(s) selected</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 flex-1">
                {editingDocument ? 'Update Document' : documentForm.assign_to_employees ? 'Create & Assign' : 'Create Document'}
              </Button>
              <Button type="button" onClick={() => setCreateDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          {selectedDocument && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <span className="text-2xl">{getTypeInfo(selectedDocument.document_type).icon}</span>
                  {selectedDocument.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusInfo(selectedDocument.status).color}`}>
                    {getStatusInfo(selectedDocument.status).label}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryInfo(selectedDocument.category).color}`}>
                    {getCategoryInfo(selectedDocument.category).label}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityInfo(selectedDocument.priority).color}`}>
                    {getPriorityInfo(selectedDocument.priority).label} Priority
                  </span>
                  {selectedDocument.version > 1 && (
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                      Version {selectedDocument.version}
                    </span>
                  )}
                </div>
                
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-500">Submitted by:</span>
                  <span className="ml-2 font-medium text-slate-900">{getEmployeeName(selectedDocument.employee_id)}</span>
                </div>
                
                {selectedDocument.description && (
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-slate-700">{selectedDocument.description}</p>
                  </div>
                )}
                
                {selectedDocument.document_url && (
                  <a 
                    href={selectedDocument.document_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors"
                  >
                    <LinkIcon size={18} />
                    <span className="font-medium">View Document</span>
                    <ChevronRight size={16} className="ml-auto" />
                  </a>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Type:</span>
                    <span className="ml-2 font-medium">{getTypeInfo(selectedDocument.document_type).label}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Created:</span>
                    <span className="ml-2 font-medium">{new Date(selectedDocument.created_at).toLocaleDateString()}</span>
                  </div>
                  {selectedDocument.due_date && (
                    <div>
                      <span className="text-slate-500">Due Date:</span>
                      <span className="ml-2 font-medium">{new Date(selectedDocument.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                
                {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedDocument.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {selectedDocument.rejection_reason && (
                  <div className="p-4 bg-rose-50 rounded-xl text-rose-700">
                    <strong>Rejection Reason:</strong> {selectedDocument.rejection_reason}
                  </div>
                )}
                
                {selectedDocument.revision_notes && (
                  <div className="p-4 bg-orange-50 rounded-xl text-orange-700">
                    <strong>Revision Notes:</strong> {selectedDocument.revision_notes}
                  </div>
                )}
                
                {/* Comments Section */}
                <div className="border-t border-slate-200 pt-4">
                  <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <MessageSquare size={16} />
                    Comments
                  </h4>
                  {selectedDocument.comments && selectedDocument.comments.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {selectedDocument.comments.map((comment) => (
                        <div key={comment.id} className="p-3 bg-slate-50 rounded-xl">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-slate-900 text-sm">{comment.user_name}</span>
                            <span className="text-xs text-slate-400">{new Date(comment.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-700 text-sm">{comment.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="rounded-xl flex-1"
                    />
                    <Button onClick={handleAddComment} className="rounded-xl bg-slate-600 hover:bg-slate-700">
                      <Send size={16} />
                    </Button>
                  </div>
                </div>
                
                {/* Action Buttons */}
                {['submitted', 'under_review'].includes(selectedDocument.status) && (
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <Button onClick={() => handleApprove(selectedDocument.id)} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 flex-1">
                      <Check size={16} className="mr-2" />
                      Approve
                    </Button>
                    <Button 
                      onClick={() => { setRevisionDialogOpen(true); }} 
                      variant="outline" 
                      className="rounded-xl text-orange-600 border-orange-200 hover:bg-orange-50"
                    >
                      <RotateCcw size={16} className="mr-2" />
                      Request Revision
                    </Button>
                    <Button 
                      onClick={() => { setRejectDialogOpen(true); }} 
                      variant="outline" 
                      className="rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      <X size={16} className="mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2 text-rose-600">
              <FileX size={24} />
              Reject Document
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-slate-600 text-sm">
              Please provide a reason for rejecting this document. This will be visible to the employee.
            </p>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Rejection Reason *</label>
              <textarea 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none resize-none" 
                rows={3} 
                placeholder="Explain why this document is being rejected..."
                required
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleReject} className="rounded-xl bg-rose-600 hover:bg-rose-700 flex-1">
                Confirm Rejection
              </Button>
              <Button onClick={() => setRejectDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revision Dialog */}
      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2 text-orange-600">
              <RotateCcw size={24} />
              Request Revision
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-slate-600 text-sm">
              Provide notes on what changes need to be made. The employee will be able to resubmit after making revisions.
            </p>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Revision Notes *</label>
              <textarea 
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none resize-none" 
                rows={3} 
                placeholder="Describe what changes are needed..."
                required
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleRequestRevision} className="rounded-xl bg-orange-600 hover:bg-orange-700 flex-1">
                Request Revision
              </Button>
              <Button onClick={() => setRevisionDialogOpen(false)} variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Document List Component
const DocumentList = ({ 
  documents, 
  employees,
  onView, 
  onApprove, 
  onReject, 
  onRequestRevision,
  onStartReview,
  onDelete,
  getStatusInfo,
  getTypeInfo,
  getCategoryInfo,
  getPriorityInfo,
  getEmployeeName
}) => {
  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <FileText size={48} className="mx-auto mb-4 text-slate-300" />
        <p className="text-slate-500">No documents found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="divide-y divide-slate-100">
        {documents.map((doc) => {
          const statusInfo = getStatusInfo(doc.status);
          const typeInfo = getTypeInfo(doc.document_type);
          const priorityInfo = getPriorityInfo(doc.priority);
          const StatusIcon = statusInfo.icon;
          
          return (
            <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-lg">{typeInfo.icon}</span>
                    <h4 className="font-bold text-slate-900">{doc.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${statusInfo.color}`}>
                      <StatusIcon size={12} />
                      {statusInfo.label}
                    </span>
                    {doc.priority !== 'normal' && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityInfo.color}`}>
                        {priorityInfo.label}
                      </span>
                    )}
                    {doc.version > 1 && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                        v{doc.version}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-2">
                    {doc.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
                    <span className="font-medium text-slate-600">{getEmployeeName(doc.employee_id)}</span>
                    <span>•</span>
                    <span>{typeInfo.label}</span>
                    <span>•</span>
                    <span className={getCategoryInfo(doc.category).color.replace('bg-', 'text-').replace('-100', '-600')}>
                      {getCategoryInfo(doc.category).label}
                    </span>
                    {doc.due_date && (
                      <>
                        <span>•</span>
                        <span>Due: {new Date(doc.due_date).toLocaleDateString()}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  <Button onClick={() => onView(doc)} size="sm" variant="ghost" className="rounded-lg">
                    <Eye size={16} />
                  </Button>
                  {doc.status === 'submitted' && (
                    <Button onClick={() => onStartReview(doc.id)} size="sm" variant="ghost" className="rounded-lg text-amber-600">
                      <Eye size={16} className="mr-1" />
                      Review
                    </Button>
                  )}
                  {['submitted', 'under_review'].includes(doc.status) && (
                    <>
                      <Button onClick={() => onApprove(doc.id)} size="sm" className="rounded-lg bg-emerald-600 hover:bg-emerald-700">
                        <Check size={14} className="mr-1" />
                        Approve
                      </Button>
                      <Button 
                        onClick={() => onRequestRevision(doc)} 
                        size="sm" 
                        variant="outline"
                        className="rounded-lg text-orange-600 border-orange-200 hover:bg-orange-50"
                      >
                        <RotateCcw size={14} />
                      </Button>
                      <Button 
                        onClick={() => onReject(doc)} 
                        size="sm" 
                        variant="outline"
                        className="rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        <X size={14} />
                      </Button>
                    </>
                  )}
                  <Button onClick={() => onDelete(doc.id)} size="sm" variant="ghost" className="rounded-lg text-rose-600">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Documents;
