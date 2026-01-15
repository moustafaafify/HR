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
  Code,
  Users,
  Crown,
  Briefcase,
  Globe,
  Award,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  Star,
  ThumbsUp,
  CheckCircle2,
  Shield,
  BookOpen,
  Zap,
  TrendingUp,
  Filter,
  User,
  Building2
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ICON_MAP = {
  code: Code,
  users: Users,
  crown: Crown,
  briefcase: Briefcase,
  globe: Globe,
  award: Award,
  star: Star,
  book: BookOpen,
  zap: Zap,
};

const PROFICIENCY_LEVELS = [
  { value: 1, label: 'Beginner', color: 'bg-slate-200' },
  { value: 2, label: 'Elementary', color: 'bg-blue-200' },
  { value: 3, label: 'Intermediate', color: 'bg-emerald-200' },
  { value: 4, label: 'Advanced', color: 'bg-purple-200' },
  { value: 5, label: 'Expert', color: 'bg-amber-200' },
];

const Skills = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-skills');
  
  // Data
  const [categories, setCategories] = useState([]);
  const [skillsLibrary, setSkillsLibrary] = useState([]);
  const [mySkills, setMySkills] = useState([]);
  const [allEmployeeSkills, setAllEmployeeSkills] = useState([]);
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  
  // Dialogs
  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [editSkillOpen, setEditSkillOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false);
  const [endorseDialogOpen, setEndorseDialogOpen] = useState(false);
  const [viewEmployeeSkillsOpen, setViewEmployeeSkillsOpen] = useState(false);
  
  // Selected items
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedEmployeeSkill, setSelectedEmployeeSkill] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingLibrarySkill, setEditingLibrarySkill] = useState(null);
  
  // Forms
  const [skillForm, setSkillForm] = useState({
    skill_id: '',
    proficiency_level: 3,
    years_experience: '',
    notes: '',
    certifications: ''
  });
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    icon: 'code'
  });
  
  const [libraryForm, setLibraryForm] = useState({
    name: '',
    description: '',
    category_id: ''
  });
  
  const [endorseComment, setEndorseComment] = useState('');

  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  // Fetch functions
  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/skills/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  const fetchSkillsLibrary = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category_id', categoryFilter);
      const response = await axios.get(`${API}/skills/library?${params}`);
      setSkillsLibrary(response.data);
    } catch (error) {
      console.error('Failed to fetch skills library:', error);
    }
  }, [categoryFilter]);

  const fetchMySkills = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/skills/my`);
      setMySkills(response.data);
    } catch (error) {
      console.error('Failed to fetch my skills:', error);
    }
  }, []);

  const fetchAllEmployeeSkills = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const params = new URLSearchParams();
      if (departmentFilter !== 'all') params.append('department_id', departmentFilter);
      const response = await axios.get(`${API}/skills/all-employees?${params}`);
      setAllEmployeeSkills(response.data);
    } catch (error) {
      console.error('Failed to fetch all employee skills:', error);
    }
  }, [isAdmin, departmentFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/skills/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
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

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/departments`);
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCategories(),
        fetchSkillsLibrary(),
        fetchMySkills(),
        fetchAllEmployeeSkills(),
        fetchStats(),
        fetchEmployees(),
        fetchDepartments(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchCategories, fetchSkillsLibrary, fetchMySkills, fetchAllEmployeeSkills, fetchStats, fetchEmployees, fetchDepartments]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchSkillsLibrary();
  }, [categoryFilter, fetchSkillsLibrary]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllEmployeeSkills();
    }
  }, [departmentFilter, fetchAllEmployeeSkills, isAdmin]);

  // Handlers
  const handleAddSkill = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/skills/my`, skillForm);
      toast.success('Skill added to your profile!');
      fetchMySkills();
      fetchStats();
      setAddSkillOpen(false);
      resetSkillForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add skill');
    }
  };

  const handleUpdateSkill = async (e) => {
    e.preventDefault();
    if (!selectedSkill) return;
    try {
      await axios.put(`${API}/skills/my/${selectedSkill.id}`, {
        proficiency_level: skillForm.proficiency_level,
        years_experience: skillForm.years_experience,
        notes: skillForm.notes,
        certifications: skillForm.certifications
      });
      toast.success('Skill updated!');
      fetchMySkills();
      setEditSkillOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update skill');
    }
  };

  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm('Remove this skill from your profile?')) return;
    try {
      await axios.delete(`${API}/skills/my/${skillId}`);
      toast.success('Skill removed');
      fetchMySkills();
      fetchStats();
    } catch (error) {
      toast.error('Failed to remove skill');
    }
  };

  const handleEndorse = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeSkill) return;
    try {
      await axios.post(`${API}/skills/endorse/${selectedEmployeeSkill.id}`, {
        comment: endorseComment
      });
      toast.success('Skill endorsed!');
      setEndorseDialogOpen(false);
      setEndorseComment('');
      // Refresh the view
      if (selectedEmployee) {
        const response = await axios.get(`${API}/skills/employee/${selectedEmployee.employee_id}`);
        setSelectedEmployee({ ...selectedEmployee, skills: response.data });
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to endorse');
    }
  };

  const handleVerifySkill = async (employeeSkillId) => {
    try {
      await axios.post(`${API}/skills/verify/${employeeSkillId}`);
      toast.success('Skill verified!');
      fetchAllEmployeeSkills();
    } catch (error) {
      toast.error('Failed to verify skill');
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(`${API}/skills/categories/${editingCategory.id}`, categoryForm);
        toast.success('Category updated');
      } else {
        await axios.post(`${API}/skills/categories`, categoryForm);
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
      await axios.delete(`${API}/skills/categories/${categoryId}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const handleSaveLibrarySkill = async (e) => {
    e.preventDefault();
    try {
      if (editingLibrarySkill) {
        await axios.put(`${API}/skills/library/${editingLibrarySkill.id}`, libraryForm);
        toast.success('Skill updated');
      } else {
        await axios.post(`${API}/skills/library`, libraryForm);
        toast.success('Skill added to library');
      }
      fetchSkillsLibrary();
      fetchStats();
      setLibraryDialogOpen(false);
      resetLibraryForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save skill');
    }
  };

  const handleDeleteLibrarySkill = async (skillId) => {
    if (!window.confirm('Delete this skill from library?')) return;
    try {
      await axios.delete(`${API}/skills/library/${skillId}`);
      toast.success('Skill deleted');
      fetchSkillsLibrary();
    } catch (error) {
      toast.error('Failed to delete skill');
    }
  };

  const openEditSkill = (skill) => {
    setSelectedSkill(skill);
    setSkillForm({
      skill_id: skill.skill_id,
      proficiency_level: skill.proficiency_level || 3,
      years_experience: skill.years_experience || '',
      notes: skill.notes || '',
      certifications: skill.certifications || ''
    });
    setEditSkillOpen(true);
  };

  const openEndorseDialog = (employeeSkill) => {
    setSelectedEmployeeSkill(employeeSkill);
    setEndorseComment('');
    setEndorseDialogOpen(true);
  };

  const openViewEmployeeSkills = async (emp) => {
    try {
      const response = await axios.get(`${API}/skills/employee/${emp.employee_id}`);
      setSelectedEmployee({ ...emp, skills: response.data });
      setViewEmployeeSkillsOpen(true);
    } catch (error) {
      toast.error('Failed to load employee skills');
    }
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name || '',
      description: category.description || '',
      color: category.color || '#6366f1',
      icon: category.icon || 'code'
    });
    setCategoryDialogOpen(true);
  };

  const openEditLibrarySkill = (skill) => {
    setEditingLibrarySkill(skill);
    setLibraryForm({
      name: skill.name || '',
      description: skill.description || '',
      category_id: skill.category_id || ''
    });
    setLibraryDialogOpen(true);
  };

  const resetSkillForm = () => {
    setSelectedSkill(null);
    setSkillForm({
      skill_id: '',
      proficiency_level: 3,
      years_experience: '',
      notes: '',
      certifications: ''
    });
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      description: '',
      color: '#6366f1',
      icon: 'code'
    });
  };

  const resetLibraryForm = () => {
    setEditingLibrarySkill(null);
    setLibraryForm({
      name: '',
      description: '',
      category_id: ''
    });
  };

  const getIcon = (iconName) => {
    return ICON_MAP[iconName] || Code;
  };

  const getProficiencyLabel = (level) => {
    return PROFICIENCY_LEVELS.find(p => p.value === level)?.label || 'Unknown';
  };

  const getProficiencyColor = (level) => {
    return PROFICIENCY_LEVELS.find(p => p.value === level)?.color || 'bg-slate-200';
  };

  // Filter skills
  const filteredMySkills = mySkills.filter(skill => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!skill.skill_name?.toLowerCase().includes(query)) return false;
    }
    if (categoryFilter !== 'all' && skill.category_id !== categoryFilter) return false;
    return true;
  });

  const filteredLibrary = skillsLibrary.filter(skill => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!skill.name?.toLowerCase().includes(query)) return false;
    }
    return true;
  });

  const availableSkills = skillsLibrary.filter(s => !mySkills.some(ms => ms.skill_id === s.id));

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6" data-testid="skills-page">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Skills</h1>
          <p className="text-slate-500 mt-1">Manage your skills and discover talent</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => { resetSkillForm(); setAddSkillOpen(true); }} data-testid="add-skill-btn">
            <Plus size={18} className="mr-2" />
            Add Skill
          </Button>
          {isAdmin && (
            <Button variant="outline" onClick={() => { resetLibraryForm(); setLibraryDialogOpen(true); }}>
              <BookOpen size={18} className="mr-2" />
              Add to Library
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
          <Code className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-blue-100 text-sm">My Skills</p>
          <p className="text-2xl font-bold">{mySkills.length}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white">
          <ThumbsUp className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-emerald-100 text-sm">Endorsements</p>
          <p className="text-2xl font-bold">{mySkills.reduce((sum, s) => sum + (s.endorsement_count || 0), 0)}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
          <BookOpen className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-purple-100 text-sm">Skills Library</p>
          <p className="text-2xl font-bold">{stats?.total_skills || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white">
          <TrendingUp className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-amber-100 text-sm">Avg Proficiency</p>
          <p className="text-2xl font-bold">
            {mySkills.length > 0 
              ? (mySkills.reduce((sum, s) => sum + (s.proficiency_level || 0), 0) / mySkills.length).toFixed(1)
              : '0'}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-skills" data-testid="tab-my-skills">
            <Star size={16} className="mr-1" /> My Skills
          </TabsTrigger>
          <TabsTrigger value="library" data-testid="tab-library">
            <BookOpen size={16} className="mr-1" /> Skills Library
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="all-employees" data-testid="tab-all-employees">
              <Users size={16} className="mr-1" /> All Employees
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="categories" data-testid="tab-categories">
              <Filter size={16} className="mr-1" /> Categories
            </TabsTrigger>
          )}
        </TabsList>

        {/* My Skills */}
        <TabsContent value="my-skills" className="mt-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search your skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredMySkills.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Code className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">No Skills Added Yet</p>
              <p className="text-slate-500 text-sm mt-1">Add skills to showcase your expertise</p>
              <Button className="mt-4" onClick={() => { resetSkillForm(); setAddSkillOpen(true); }}>
                <Plus size={16} className="mr-2" /> Add Your First Skill
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMySkills.map(skill => {
                const category = categories.find(c => c.id === skill.category_id);
                const CategoryIcon = getIcon(category?.icon);
                
                return (
                  <div 
                    key={skill.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-shadow"
                    data-testid={`skill-card-${skill.id}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${category?.color || '#6366f1'}20`, color: category?.color || '#6366f1' }}
                        >
                          <CategoryIcon size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{skill.skill_name}</h3>
                          <p className="text-sm text-slate-500">{skill.category_name}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditSkill(skill)}>
                          <Edit2 size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteSkill(skill.id)} className="text-rose-600">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Proficiency Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">Proficiency</span>
                        <span className="font-medium text-slate-700">{getProficiencyLabel(skill.proficiency_level)}</span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(level => (
                          <div 
                            key={level}
                            className={`h-2 flex-1 rounded-full ${
                              level <= skill.proficiency_level 
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500' 
                                : 'bg-slate-100'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {skill.years_experience && (
                      <p className="text-sm text-slate-500 mb-2">
                        {skill.years_experience} years experience
                      </p>
                    )}
                    
                    {/* Endorsements */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <ThumbsUp size={14} />
                        <span>{skill.endorsement_count || 0} endorsements</span>
                      </div>
                      {skill.is_verified && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          <CheckCircle2 size={12} /> Verified
                        </span>
                      )}
                    </div>
                    
                    {/* Endorsers */}
                    {skill.endorsements?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-500 mb-2">Endorsed by:</p>
                        <div className="flex flex-wrap gap-1">
                          {skill.endorsements.slice(0, 5).map((e, i) => (
                            <span key={i} className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">
                              {e.endorser_name}
                            </span>
                          ))}
                          {skill.endorsements.length > 5 && (
                            <span className="text-xs text-slate-500">+{skill.endorsements.length - 5} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Skills Library */}
        <TabsContent value="library" className="mt-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredLibrary.map(skill => {
              const category = categories.find(c => c.id === skill.category_id);
              const isAdded = mySkills.some(ms => ms.skill_id === skill.id);
              
              return (
                <div 
                  key={skill.id}
                  className={`bg-white rounded-xl border p-4 ${isAdded ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900">{skill.name}</h3>
                      <p className="text-sm text-slate-500">{skill.category_name}</p>
                    </div>
                    {isAdded ? (
                      <span className="text-emerald-600">
                        <CheckCircle2 size={20} />
                      </span>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSkillForm({ ...skillForm, skill_id: skill.id });
                          setAddSkillOpen(true);
                        }}
                      >
                        <Plus size={14} />
                      </Button>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditLibrarySkill(skill)}>
                        <Edit2 size={12} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteLibrarySkill(skill.id)} className="text-rose-600">
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* All Employees (Admin) */}
        {isAdmin && (
          <TabsContent value="all-employees" className="mt-4 space-y-4">
            <div className="flex gap-4">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {allEmployeeSkills.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No employees with skills found</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Employee</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Department</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Skills</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Avg Proficiency</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allEmployeeSkills.map(emp => (
                        <tr key={emp.employee_id} className="hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <p className="font-medium text-slate-900">{emp.employee_name}</p>
                            <p className="text-sm text-slate-500">{emp.job_title}</p>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{emp.department || '-'}</td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {emp.skills?.slice(0, 3).map((s, i) => (
                                <span key={i} className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">
                                  {s.skill_name}
                                </span>
                              ))}
                              {emp.skill_count > 3 && (
                                <span className="text-xs text-slate-500">+{emp.skill_count - 3}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${(emp.avg_proficiency / 5) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{emp.avg_proficiency?.toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button size="sm" variant="outline" onClick={() => openViewEmployeeSkills(emp)}>
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => {
                const CategoryIcon = getIcon(category.icon);
                const skillCount = skillsLibrary.filter(s => s.category_id === category.id).length;
                
                return (
                  <div 
                    key={category.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20`, color: category.color }}
                      >
                        <CategoryIcon size={24} />
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
                    <h3 className="font-semibold text-slate-900">{category.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{category.description}</p>
                    <p className="text-sm text-slate-400 mt-2">{skillCount} skills</p>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Add Skill Dialog */}
      <Dialog open={addSkillOpen} onOpenChange={setAddSkillOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Skill</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSkill} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Skill *</label>
              <Select 
                value={skillForm.skill_id} 
                onValueChange={(v) => setSkillForm({...skillForm, skill_id: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select skill" />
                </SelectTrigger>
                <SelectContent>
                  {availableSkills.map(skill => (
                    <SelectItem key={skill.id} value={skill.id}>
                      {skill.name} ({skill.category_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Proficiency Level *</label>
              <div className="flex gap-2">
                {PROFICIENCY_LEVELS.map(level => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setSkillForm({...skillForm, proficiency_level: level.value})}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      skillForm.proficiency_level === level.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {level.value}
                  </button>
                ))}
              </div>
              <p className="text-sm text-slate-500 mt-1 text-center">
                {getProficiencyLabel(skillForm.proficiency_level)}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Years of Experience</label>
              <Input
                type="number"
                value={skillForm.years_experience}
                onChange={(e) => setSkillForm({...skillForm, years_experience: e.target.value})}
                placeholder="e.g., 3"
                min="0"
                step="0.5"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Certifications</label>
              <Input
                value={skillForm.certifications}
                onChange={(e) => setSkillForm({...skillForm, certifications: e.target.value})}
                placeholder="Related certifications..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <Textarea
                value={skillForm.notes}
                onChange={(e) => setSkillForm({...skillForm, notes: e.target.value})}
                placeholder="Additional details about your expertise..."
                rows={2}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setAddSkillOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="save-skill-btn">
                Add Skill
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Skill Dialog */}
      <Dialog open={editSkillOpen} onOpenChange={setEditSkillOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Skill - {selectedSkill?.skill_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSkill} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Proficiency Level</label>
              <div className="flex gap-2">
                {PROFICIENCY_LEVELS.map(level => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setSkillForm({...skillForm, proficiency_level: level.value})}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      skillForm.proficiency_level === level.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {level.value}
                  </button>
                ))}
              </div>
              <p className="text-sm text-slate-500 mt-1 text-center">
                {getProficiencyLabel(skillForm.proficiency_level)}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Years of Experience</label>
              <Input
                type="number"
                value={skillForm.years_experience}
                onChange={(e) => setSkillForm({...skillForm, years_experience: e.target.value})}
                min="0"
                step="0.5"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Certifications</label>
              <Input
                value={skillForm.certifications}
                onChange={(e) => setSkillForm({...skillForm, certifications: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <Textarea
                value={skillForm.notes}
                onChange={(e) => setSkillForm({...skillForm, notes: e.target.value})}
                rows={2}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditSkillOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Update Skill
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                placeholder="e.g., Technical Skills"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                placeholder="Brief description..."
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({...categoryForm, color: e.target.value})}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({...categoryForm, color: e.target.value})}
                    className="flex-1"
                  />
                </div>
              </div>
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

      {/* Library Skill Dialog */}
      <Dialog open={libraryDialogOpen} onOpenChange={setLibraryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLibrarySkill ? 'Edit Skill' : 'Add Skill to Library'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveLibrarySkill} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Skill Name *</label>
              <Input
                value={libraryForm.name}
                onChange={(e) => setLibraryForm({...libraryForm, name: e.target.value})}
                placeholder="e.g., Python"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
              <Select value={libraryForm.category_id} onValueChange={(v) => setLibraryForm({...libraryForm, category_id: v})}>
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
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <Textarea
                value={libraryForm.description}
                onChange={(e) => setLibraryForm({...libraryForm, description: e.target.value})}
                placeholder="Brief description..."
                rows={2}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setLibraryDialogOpen(false); resetLibraryForm(); }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingLibrarySkill ? 'Update' : 'Add'} Skill
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Endorse Dialog */}
      <Dialog open={endorseDialogOpen} onOpenChange={setEndorseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Endorse Skill</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEndorse} className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="font-medium text-slate-900">{selectedEmployeeSkill?.skill_name}</p>
              <p className="text-sm text-slate-500">{selectedEmployeeSkill?.employee_name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Comment (optional)</label>
              <Textarea
                value={endorseComment}
                onChange={(e) => setEndorseComment(e.target.value)}
                placeholder="Add a comment about their expertise..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEndorseDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <ThumbsUp size={16} className="mr-2" />
                Endorse
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Employee Skills Dialog */}
      <Dialog open={viewEmployeeSkillsOpen} onOpenChange={setViewEmployeeSkillsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User size={20} />
              {selectedEmployee?.employee_name}'s Skills
            </DialogTitle>
          </DialogHeader>
          
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-slate-600">{selectedEmployee.job_title}</p>
                <p className="text-sm text-slate-500">{selectedEmployee.department}</p>
              </div>
              
              {selectedEmployee.skills?.length === 0 ? (
                <p className="text-center text-slate-500 py-6">No skills added</p>
              ) : (
                <div className="space-y-3">
                  {selectedEmployee.skills?.map(skill => (
                    <div key={skill.id} className="bg-white border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-slate-900">{skill.skill_name}</h4>
                          <p className="text-sm text-slate-500">{skill.category_name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {skill.is_verified && (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                              <CheckCircle2 size={12} /> Verified
                            </span>
                          )}
                          {isAdmin && !skill.is_verified && (
                            <Button size="sm" variant="outline" onClick={() => handleVerifySkill(skill.id)}>
                              <Shield size={14} className="mr-1" /> Verify
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => openEndorseDialog(skill)}>
                            <ThumbsUp size={14} className="mr-1" /> Endorse
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-500">
                          Proficiency: <span className="font-medium text-slate-700">{getProficiencyLabel(skill.proficiency_level)}</span>
                        </span>
                        {skill.years_experience && (
                          <span className="text-slate-500">
                            {skill.years_experience} years
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-slate-500">
                          <ThumbsUp size={14} /> {skill.endorsement_count || 0}
                        </span>
                      </div>
                      
                      {skill.endorsements?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-xs text-slate-500 mb-2">Endorsements:</p>
                          <div className="space-y-2">
                            {skill.endorsements.slice(0, 3).map((e, i) => (
                              <div key={i} className="text-sm">
                                <span className="font-medium text-slate-700">{e.endorser_name}</span>
                                {e.comment && <span className="text-slate-500 ml-2">"{e.comment}"</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Skills;
