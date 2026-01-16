import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Shield, 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  CheckCircle2, 
  Circle, 
  Copy, 
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Lock,
  Unlock,
  UserPlus,
  UserMinus,
  Settings,
  Eye,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  Check,
  X,
  Crown,
  Briefcase,
  Building2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const API = process.env.REACT_APP_BACKEND_URL;

const RolesPermissions = () => {
  const { token } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [permissionCategories, setPermissionCategories] = useState({});
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [activeTab, setActiveTab] = useState('roles'); // roles, permissions, assignments
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleUsers, setRoleUsers] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // create, edit, duplicate, assign
  const [editingRole, setEditingRole] = useState(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    permissions: [],
    level: 5,
    color: '#64748b'
  });

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes, catsRes, statsRes, usersRes] = await Promise.all([
        axios.get(`${API}/api/roles`, { headers }),
        axios.get(`${API}/api/permissions`, { headers }),
        axios.get(`${API}/api/permissions/categories`, { headers }),
        axios.get(`${API}/api/roles/stats`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API}/api/users`, { headers }).catch(() => ({ data: [] }))
      ]);
      
      setRoles(rolesRes.data);
      setPermissions(permsRes.data);
      setPermissionCategories(catsRes.data);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      
      // Expand first category by default
      if (Object.keys(catsRes.data).length > 0) {
        setExpandedCategories([Object.keys(catsRes.data)[0]]);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load roles and permissions');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchRoleUsers = async (roleId) => {
    try {
      const response = await axios.get(`${API}/api/roles/${roleId}/users`, { headers });
      setRoleUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch role users:', error);
    }
  };

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    fetchRoleUsers(role.id);
  };

  const initializeDefaults = async () => {
    try {
      await axios.post(`${API}/api/roles/initialize-defaults`, {}, { headers });
      toast.success('Default roles initialized successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to initialize roles');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (dialogMode === 'edit' && editingRole) {
        await axios.put(`${API}/api/roles/${editingRole.id}`, formData, { headers });
        toast.success('Role updated successfully');
      } else if (dialogMode === 'duplicate' && editingRole) {
        await axios.post(`${API}/api/roles/duplicate/${editingRole.id}`, formData, { headers });
        toast.success('Role duplicated successfully');
      } else {
        await axios.post(`${API}/api/roles`, formData, { headers });
        toast.success('Role created successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save role');
    }
  };

  const handleDelete = async (role) => {
    if (role.is_system_role) {
      toast.error('Cannot delete system roles');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete "${role.display_name}"?`)) return;
    
    try {
      await axios.delete(`${API}/api/roles/${role.id}`, { headers });
      toast.success('Role deleted successfully');
      if (selectedRole?.id === role.id) {
        setSelectedRole(null);
        setRoleUsers([]);
      }
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete role');
    }
  };

  const assignRoleToUser = async (userId) => {
    if (!selectedRole) return;
    try {
      await axios.post(`${API}/api/roles/${selectedRole.id}/assign`, { user_id: userId }, { headers });
      toast.success('Role assigned successfully');
      fetchRoleUsers(selectedRole.id);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to assign role');
    }
  };

  const removeRoleFromUser = async (userId) => {
    if (!selectedRole) return;
    try {
      await axios.post(`${API}/api/roles/${selectedRole.id}/remove`, { user_id: userId }, { headers });
      toast.success('Role removed successfully');
      fetchRoleUsers(selectedRole.id);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to remove role');
    }
  };

  const openDialog = (mode, role = null) => {
    setDialogMode(mode);
    setEditingRole(role);
    
    if (role && (mode === 'edit' || mode === 'duplicate')) {
      setFormData({
        name: mode === 'duplicate' ? '' : role.name,
        display_name: mode === 'duplicate' ? `${role.display_name} (Copy)` : role.display_name,
        description: role.description || '',
        permissions: [...(role.permissions || [])],
        level: role.level || 5,
        color: role.color || '#64748b'
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      permissions: [],
      level: 5,
      color: '#64748b'
    });
    setEditingRole(null);
  };

  const togglePermission = (permId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const selectAllInCategory = (category) => {
    const categoryPerms = permissionCategories[category]?.map(p => p.id) || [];
    const allSelected = categoryPerms.every(p => formData.permissions.includes(p));
    
    setFormData(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(p => !categoryPerms.includes(p))
        : [...new Set([...prev.permissions, ...categoryPerms])]
    }));
  };

  const getRoleIcon = (role) => {
    switch (role.name) {
      case 'super_admin': return Crown;
      case 'corp_admin': return Building2;
      case 'hr_manager': return Briefcase;
      default: return Shield;
    }
  };

  const filteredRoles = roles.filter(r =>
    r.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2D4F38]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="roles-permissions-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Roles & Permissions</h1>
          <p className="text-stone-500 text-sm mt-1">
            Manage access control and user permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
          {roles.length === 0 && (
            <Button onClick={initializeDefaults} className="bg-amber-500 hover:bg-amber-600">
              <Settings size={16} className="mr-2" />
              Initialize Defaults
            </Button>
          )}
          <Button onClick={() => openDialog('create')} className="bg-[#2D4F38] hover:bg-[#1F3A29]">
            <Plus size={16} className="mr-2" />
            Create Role
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#2D4F38]/10 rounded-lg">
                <Shield size={20} className="text-[#2D4F38]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">{stats.total_roles}</p>
                <p className="text-xs text-stone-500">Total Roles</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Lock size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.system_roles}</p>
                <p className="text-xs text-stone-500">System Roles</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Unlock size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.custom_roles}</p>
                <p className="text-xs text-stone-500">Custom Roles</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <BarChart3 size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{permissions.length}</p>
                <p className="text-xs text-stone-500">Permissions</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-stone-200 pb-2">
        {[
          { id: 'roles', label: 'Roles', icon: Shield },
          { id: 'permissions', label: 'Permission Matrix', icon: Lock },
          { id: 'assignments', label: 'User Assignments', icon: Users }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === tab.id 
                  ? 'bg-[#2D4F38] text-white' 
                  : 'text-stone-600 hover:bg-stone-100'}`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Roles List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roles..."
                className="pl-9"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredRoles.map(role => {
                const Icon = getRoleIcon(role);
                const isSelected = selectedRole?.id === role.id;
                const userCount = stats?.roles?.find(r => r.role_id === role.id)?.user_count || 0;
                
                return (
                  <div
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    className={`
                      p-4 rounded-xl border cursor-pointer transition-all
                      ${isSelected 
                        ? 'border-[#2D4F38] bg-[#2D4F38]/5 shadow-md' 
                        : 'border-stone-200 bg-white hover:border-stone-300'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div 
                          className="p-2 rounded-lg" 
                          style={{ backgroundColor: `${role.color}20` }}
                        >
                          <Icon size={18} style={{ color: role.color }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-stone-900">{role.display_name}</h3>
                          <p className="text-xs text-stone-500 font-mono">{role.name}</p>
                        </div>
                      </div>
                      {role.is_system_role && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          System
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-600 mt-2 line-clamp-2">{role.description}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                      <span className="text-xs text-stone-400">
                        {role.permissions?.length || 0} permissions
                      </span>
                      <span className="text-xs flex items-center gap-1 text-stone-500">
                        <Users size={12} />
                        {userCount} users
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Role Details */}
          <div className="lg:col-span-2">
            {selectedRole ? (
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                {/* Role Header */}
                <div className="p-6 border-b border-stone-100" style={{ backgroundColor: `${selectedRole.color}10` }}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="p-3 rounded-xl" 
                        style={{ backgroundColor: `${selectedRole.color}30` }}
                      >
                        {React.createElement(getRoleIcon(selectedRole), { 
                          size: 24, 
                          style: { color: selectedRole.color } 
                        })}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-stone-900">{selectedRole.display_name}</h2>
                        <p className="text-sm text-stone-500 font-mono">{selectedRole.name}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openDialog('duplicate', selectedRole)}>
                        <Copy size={14} className="mr-1" />
                        Duplicate
                      </Button>
                      {!selectedRole.is_system_role && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => openDialog('edit', selectedRole)}>
                            <Edit2 size={14} className="mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(selectedRole)}>
                            <Trash2 size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-stone-600 mt-3">{selectedRole.description}</p>
                </div>

                {/* Permissions */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-stone-900 mb-4">Permissions ({selectedRole.permissions?.length || 0})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedRole.permissions?.map(permId => {
                      const perm = permissions.find(p => p.id === permId);
                      return (
                        <div key={permId} className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span className="text-sm text-stone-700">{perm?.name || permId}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Users with this role */}
                <div className="p-6 border-t border-stone-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-stone-900">
                      Users ({roleUsers.length})
                    </h3>
                    <Button size="sm" onClick={() => setAssignDialogOpen(true)}>
                      <UserPlus size={14} className="mr-1" />
                      Assign User
                    </Button>
                  </div>
                  
                  {roleUsers.length > 0 ? (
                    <div className="space-y-2">
                      {roleUsers.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#2D4F38] flex items-center justify-center text-white text-sm font-medium">
                              {user.full_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-medium text-stone-900">{user.full_name}</p>
                              <p className="text-xs text-stone-500">{user.email}</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-rose-600 hover:bg-rose-50"
                            onClick={() => removeRoleFromUser(user.id)}
                          >
                            <UserMinus size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-stone-400">
                      <Users size={32} className="mx-auto mb-2 opacity-50" />
                      <p>No users assigned to this role</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
                <Shield size={48} className="mx-auto text-stone-300 mb-4" />
                <h3 className="text-lg font-semibold text-stone-700 mb-2">Select a Role</h3>
                <p className="text-stone-500">Choose a role from the list to view details and manage permissions</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Permissions Matrix Tab */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="text-left p-4 font-semibold text-stone-900 sticky left-0 bg-stone-50 z-10 min-w-[200px]">
                    Permission
                  </th>
                  {roles.map(role => (
                    <th 
                      key={role.id} 
                      className="text-center p-4 min-w-[100px]"
                      style={{ color: role.color }}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold text-xs">{role.display_name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(permissionCategories).map(([category, perms]) => (
                  <React.Fragment key={category}>
                    <tr className="bg-stone-100/50">
                      <td 
                        colSpan={roles.length + 1} 
                        className="p-3 font-semibold text-stone-700 text-sm sticky left-0 bg-stone-100/50"
                      >
                        {category}
                      </td>
                    </tr>
                    {perms.map(perm => (
                      <tr key={perm.id} className="border-b border-stone-100 hover:bg-stone-50">
                        <td className="p-3 sticky left-0 bg-white z-10">
                          <div>
                            <p className="text-sm font-medium text-stone-900">{perm.name}</p>
                            <p className="text-xs text-stone-400">{perm.description}</p>
                          </div>
                        </td>
                        {roles.map(role => (
                          <td key={role.id} className="p-3 text-center">
                            {role.permissions?.includes(perm.id) ? (
                              <Check size={18} className="mx-auto text-emerald-500" />
                            ) : (
                              <X size={18} className="mx-auto text-stone-300" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-semibold text-stone-900">All Users & Their Roles</h3>
            <div className="relative w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <Input placeholder="Search users..." className="pl-9" />
            </div>
          </div>
          <div className="divide-y divide-stone-100">
            {users.map(user => {
              const userRole = roles.find(r => r.name === user.role);
              return (
                <div key={user.id} className="p-4 flex items-center justify-between hover:bg-stone-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2D4F38] flex items-center justify-center text-white font-medium">
                      {user.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-stone-900">{user.full_name}</p>
                      <p className="text-sm text-stone-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{ 
                        backgroundColor: `${userRole?.color || '#64748b'}20`,
                        color: userRole?.color || '#64748b'
                      }}
                    >
                      {userRole?.display_name || user.role}
                    </span>
                    <Select
                      value={user.role}
                      onValueChange={async (newRole) => {
                        const role = roles.find(r => r.name === newRole);
                        if (role) {
                          try {
                            await axios.post(`${API}/api/roles/${role.id}/assign`, { user_id: user.id }, { headers });
                            toast.success('Role updated');
                            fetchData();
                          } catch (error) {
                            toast.error('Failed to update role');
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.id} value={role.name}>
                            {role.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create/Edit Role Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Create New Role' : dialogMode === 'edit' ? 'Edit Role' : 'Duplicate Role'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-stone-700 mb-1.5 block">Role ID *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                  placeholder="e.g., hr_manager"
                  required
                  disabled={dialogMode === 'edit' && editingRole?.is_system_role}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 mb-1.5 block">Display Name *</label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="e.g., HR Manager"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700 mb-1.5 block">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D4F38]/20"
                rows={2}
                placeholder="Brief description of this role"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-stone-700 mb-1.5 block">Hierarchy Level</label>
                <Select
                  value={formData.level.toString()}
                  onValueChange={(val) => setFormData({ ...formData, level: parseInt(val) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - Super Admin</SelectItem>
                    <SelectItem value="1">1 - Corp Admin</SelectItem>
                    <SelectItem value="2">2 - Manager</SelectItem>
                    <SelectItem value="3">3 - Department Head</SelectItem>
                    <SelectItem value="4">4 - Team Lead</SelectItem>
                    <SelectItem value="5">5 - Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 mb-1.5 block">Badge Color</label>
                <div className="flex gap-2">
                  {['#dc2626', '#ea580c', '#2563eb', '#7c3aed', '#0891b2', '#64748b', '#10b981', '#f59e0b'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${formData.color === color ? 'border-stone-900 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div>
              <label className="text-sm font-medium text-stone-700 mb-3 block">
                Permissions ({formData.permissions.length} selected)
              </label>
              <div className="border border-stone-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                {Object.entries(permissionCategories).map(([category, perms]) => {
                  const isExpanded = expandedCategories.includes(category);
                  const categoryPerms = perms.map(p => p.id);
                  const selectedCount = formData.permissions.filter(p => categoryPerms.includes(p)).length;
                  const allSelected = selectedCount === perms.length;
                  
                  return (
                    <div key={category} className="border-b border-stone-100 last:border-0">
                      <div 
                        className="flex items-center justify-between p-3 bg-stone-50 cursor-pointer hover:bg-stone-100"
                        onClick={() => toggleCategory(category)}
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          <span className="font-medium text-stone-900">{category}</span>
                          <span className="text-xs text-stone-500">({selectedCount}/{perms.length})</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); selectAllInCategory(category); }}
                        >
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>
                      {isExpanded && (
                        <div className="p-3 grid grid-cols-2 gap-2">
                          {perms.map(perm => (
                            <label 
                              key={perm.id}
                              className="flex items-start gap-2 p-2 rounded-lg hover:bg-stone-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(perm.id)}
                                onChange={() => togglePermission(perm.id)}
                                className="mt-1 rounded border-stone-300 text-[#2D4F38] focus:ring-[#2D4F38]"
                              />
                              <div>
                                <p className="text-sm font-medium text-stone-900">{perm.name}</p>
                                <p className="text-xs text-stone-500">{perm.description}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#2D4F38] hover:bg-[#1F3A29]">
                {dialogMode === 'create' ? 'Create Role' : dialogMode === 'edit' ? 'Save Changes' : 'Create Copy'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign User Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign User to {selectedRole?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {users
              .filter(u => u.role !== selectedRole?.name)
              .map(user => (
                <div 
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-stone-200 hover:bg-stone-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 text-sm font-medium">
                      {user.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-stone-900">{user.full_name}</p>
                      <p className="text-xs text-stone-500">{user.email}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => {
                      assignRoleToUser(user.id);
                      setAssignDialogOpen(false);
                    }}
                  >
                    Assign
                  </Button>
                </div>
              ))
            }
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RolesPermissions;
