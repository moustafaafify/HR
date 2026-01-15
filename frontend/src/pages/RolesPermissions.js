import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Shield, CheckCircle2, Circle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RolesPermissions = () => {
  const { t } = useLanguage();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    permissions: []
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API}/roles`);
      setRoles(response.data);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await axios.get(`${API}/permissions`);
      setPermissions(response.data);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await axios.put(`${API}/roles/${editingRole.id}`, formData);
        toast.success('Role updated successfully');
      } else {
        await axios.post(`${API}/roles`, formData);
        toast.success('Role created successfully');
      }
      setDialogOpen(false);
      setEditingRole(null);
      setFormData({ name: '', display_name: '', description: '', permissions: [] });
      fetchRoles();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save role');
    }
  };

  const handleDelete = async (roleId, roleName) => {
    if (window.confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      try {
        await axios.delete(`${API}/roles/${roleId}`);
        toast.success('Role deleted successfully');
        fetchRoles();
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to delete role');
      }
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      await axios.post(`${API}/roles/initialize-defaults`);
      toast.success('Default roles initialized successfully');
      fetchRoles();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to initialize roles');
    }
  };

  const openDialog = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        display_name: role.display_name,
        description: role.description || '',
        permissions: role.permissions || []
      });
    } else {
      setEditingRole(null);
      setFormData({ name: '', display_name: '', description: '', permissions: [] });
    }
    setDialogOpen(true);
  };

  const togglePermission = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {});

  return (
    <div data-testid="roles-permissions-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Roles & Permissions
          </h1>
          <p className="text-slate-600 mt-2">Manage user roles and their access permissions</p>
        </div>
        <div className="flex gap-3">
          {roles.length === 0 && (
            <Button 
              onClick={handleInitializeDefaults}
              data-testid="initialize-roles-button"
              className="rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Initialize Default Roles
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => openDialog()} 
                data-testid="add-role-button"
                className="rounded-full bg-indigo-950 text-white hover:bg-indigo-900 shadow-lg hover:shadow-xl"
              >
                <Plus size={20} className="me-2" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRole ? 'Edit' : 'Create'} Role</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} data-testid="role-form" className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Role Name (ID) *</label>
                    <input
                      type="text"
                      data-testid="role-name-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      placeholder="e.g., hr_manager"
                      required
                      disabled={editingRole?.is_system_role}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Display Name *</label>
                    <input
                      type="text"
                      data-testid="role-display-name-input"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                      placeholder="e.g., HR Manager"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
                  <textarea
                    data-testid="role-description-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none"
                    rows={2}
                    placeholder="Brief description of this role"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-3 block">Permissions</label>
                  <div className="space-y-4">
                    {Object.entries(groupedPermissions).map(([category, perms]) => (
                      <div key={category} className="border border-slate-200 rounded-lg p-4">
                        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                          <Shield size={18} className="text-indigo-600" />
                          {category}
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {perms.map((perm) => (
                            <label
                              key={perm.id}
                              className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(perm.id)}
                                onChange={() => togglePermission(perm.id)}
                                className="mt-1 w-4 h-4 text-indigo-950 rounded focus:ring-indigo-500"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-slate-900 text-sm">{perm.name}</div>
                                <div className="text-xs text-slate-500">{perm.description}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    type="submit" 
                    data-testid="role-submit-button" 
                    className="rounded-full bg-indigo-950 hover:bg-indigo-900"
                  >
                    {editingRole ? 'Update' : 'Create'} Role
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setDialogOpen(false)} 
                    variant="outline" 
                    className="rounded-full"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Roles List */}
      <div className="grid gap-6">
        {roles.map((role) => (
          <div
            key={role.id}
            data-testid={`role-card-${role.id}`}
            className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-slate-900">{role.display_name}</h3>
                  {role.is_system_role && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      System Role
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1">ID: {role.name}</p>
                {role.description && (
                  <p className="text-slate-600 mt-2">{role.description}</p>
                )}
              </div>
              {!role.is_system_role && (
                <div className="flex gap-2">
                  <button
                    onClick={() => openDialog(role)}
                    data-testid={`edit-role-${role.id}`}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(role.id, role.display_name)}
                    data-testid={`delete-role-${role.id}`}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700 mb-3">
                Permissions ({role.permissions?.length || 0})
              </p>
              <div className="flex flex-wrap gap-2">
                {role.permissions?.map((permId) => {
                  const perm = permissions.find(p => p.id === permId);
                  return perm ? (
                    <span
                      key={permId}
                      className="px-3 py-1 bg-indigo-50 text-indigo-900 text-xs font-medium rounded-full flex items-center gap-1"
                    >
                      <CheckCircle2 size={12} />
                      {perm.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {roles.length === 0 && (
        <div className="text-center py-12">
          <Shield size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Roles Defined</h3>
          <p className="text-slate-600 mb-4">
            Initialize default roles or create your first custom role
          </p>
        </div>
      )}
    </div>
  );
};

export default RolesPermissions;
