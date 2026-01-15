import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Network, 
  Users, 
  Building2, 
  Search,
  ChevronDown,
  ChevronRight,
  User,
  Mail,
  Briefcase,
  MapPin,
  Calendar,
  RefreshCw,
  Eye,
  GitBranch,
  Layers,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  UserCircle,
  ArrowUp,
  ArrowDown,
  MoreHorizontal
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OrgChart = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState(null);
  const [activeTab, setActiveTab] = useState('tree');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeePosition, setEmployeePosition] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [zoom, setZoom] = useState(100);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  const fetchOrgChart = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/org-chart`);
      setOrgData(response.data);
      
      // Auto-expand first level
      const rootIds = response.data.tree?.map(n => n.id) || [];
      setExpandedNodes(new Set(rootIds));
    } catch (error) {
      console.error('Failed to fetch org chart:', error);
      toast.error('Failed to load organization chart');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrgChart();
  }, [fetchOrgChart]);

  const fetchEmployeePosition = async (employeeId) => {
    try {
      const response = await axios.get(`${API}/org-chart/employee/${employeeId}`);
      setEmployeePosition(response.data);
    } catch (error) {
      console.error('Failed to fetch employee position:', error);
    }
  };

  const handleViewEmployee = async (employee) => {
    setSelectedEmployee(employee);
    await fetchEmployeePosition(employee.id);
    setViewDialogOpen(true);
  };

  const toggleExpand = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    if (!orgData?.nodes) return;
    setExpandedNodes(new Set(orgData.nodes.map(n => n.id)));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Filter nodes based on search and department
  const filteredNodes = orgData?.nodes?.filter(node => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = node.name?.toLowerCase().includes(query);
      const emailMatch = node.email?.toLowerCase().includes(query);
      const titleMatch = node.job_title?.toLowerCase().includes(query);
      const deptMatch = node.department?.toLowerCase().includes(query);
      if (!nameMatch && !emailMatch && !titleMatch && !deptMatch) return false;
    }
    if (departmentFilter !== 'all' && node.department_id !== departmentFilter) return false;
    return true;
  }) || [];

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get color based on job title or department
  const getNodeColor = (node) => {
    const title = (node.job_title || '').toLowerCase();
    if (title.includes('ceo') || title.includes('director') || title.includes('head')) {
      return 'from-indigo-500 to-indigo-600';
    }
    if (title.includes('manager') || title.includes('lead')) {
      return 'from-purple-500 to-purple-600';
    }
    if (title.includes('senior')) {
      return 'from-blue-500 to-blue-600';
    }
    return 'from-slate-500 to-slate-600';
  };

  // Render tree node
  const TreeNode = ({ node, level = 0 }) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const nodeColor = getNodeColor(node);

    return (
      <div className={`${level > 0 ? 'ml-8 border-l-2 border-slate-200 pl-4' : ''}`}>
        <div 
          className={`
            flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer
            hover:bg-slate-50 group
            ${selectedEmployee?.id === node.id ? 'bg-indigo-50 ring-2 ring-indigo-500' : ''}
          `}
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'left center' }}
        >
          {hasChildren && (
            <button 
              onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
              className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}
          
          <div 
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${nodeColor} text-white flex items-center justify-center font-bold text-sm shadow-lg`}
          >
            {node.profile_picture ? (
              <img src={node.profile_picture} alt={node.name} className="w-full h-full rounded-xl object-cover" />
            ) : (
              getInitials(node.name)
            )}
          </div>
          
          <div className="flex-1 min-w-0" onClick={() => handleViewEmployee(node)}>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900 truncate">{node.name}</h4>
              {node.direct_reports_count > 0 && (
                <span className="px-1.5 py-0.5 rounded text-xs bg-indigo-100 text-indigo-700 font-medium">
                  {node.direct_reports_count} reports
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 truncate">{node.job_title}</p>
            {node.department && (
              <p className="text-xs text-slate-400 truncate">{node.department}</p>
            )}
          </div>
          
          <Button 
            size="sm" 
            variant="ghost" 
            className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
            onClick={(e) => { e.stopPropagation(); handleViewEmployee(node); }}
          >
            <Eye size={16} />
          </Button>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="mt-1">
            {node.children.map(child => (
              <TreeNode key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render card for grid view
  const EmployeeCard = ({ employee }) => {
    const nodeColor = getNodeColor(employee);
    
    return (
      <div 
        className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-lg transition-all cursor-pointer group"
        onClick={() => handleViewEmployee(employee)}
      >
        <div className="flex items-start gap-3">
          <div 
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${nodeColor} text-white flex items-center justify-center font-bold shadow-lg flex-shrink-0`}
          >
            {employee.profile_picture ? (
              <img src={employee.profile_picture} alt={employee.name} className="w-full h-full rounded-xl object-cover" />
            ) : (
              getInitials(employee.name)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 truncate">{employee.name}</h4>
            <p className="text-sm text-slate-600 truncate">{employee.job_title}</p>
            <p className="text-xs text-slate-400 truncate">{employee.email}</p>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
          {employee.department && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Layers size={12} />
              <span className="truncate">{employee.department}</span>
            </div>
          )}
          {employee.branch && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Building2 size={12} />
              <span className="truncate">{employee.branch}</span>
            </div>
          )}
          {employee.manager_name && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ArrowUp size={12} />
              <span className="truncate">Reports to {employee.manager_name}</span>
            </div>
          )}
          {employee.direct_reports_count > 0 && (
            <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
              <ArrowDown size={12} />
              <span>{employee.direct_reports_count} direct reports</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="org-chart-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Organization Chart
          </h1>
          <p className="text-slate-500 mt-1">
            View the organizational hierarchy and team structure
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchOrgChart}
            variant="outline"
            className="rounded-xl"
          >
            <RefreshCw size={18} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm">Total Employees</p>
              <p className="text-2xl font-bold">{orgData?.stats?.total_employees || 0}</p>
            </div>
            <Users size={24} className="text-indigo-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Departments</p>
              <p className="text-2xl font-bold">{orgData?.stats?.departments_count || 0}</p>
            </div>
            <Layers size={24} className="text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Branches</p>
              <p className="text-2xl font-bold">{orgData?.stats?.branches_count || 0}</p>
            </div>
            <Building2 size={24} className="text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Hierarchy Levels</p>
              <p className="text-2xl font-bold">{orgData?.tree?.length || 0}</p>
            </div>
            <Network size={24} className="text-emerald-200" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            <TabsTrigger value="tree" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <GitBranch size={16} className="mr-2" />
              Tree View
            </TabsTrigger>
            <TabsTrigger value="grid" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <Users size={16} className="mr-2" />
              Grid View
            </TabsTrigger>
            <TabsTrigger value="list" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <MoreHorizontal size={16} className="mr-2" />
              List View
            </TabsTrigger>
          </TabsList>
          
          {/* Zoom controls for tree view */}
          {activeTab === 'tree' && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-lg"
                onClick={() => setZoom(Math.max(50, zoom - 10))}
              >
                <ZoomOut size={16} />
              </Button>
              <span className="text-sm text-slate-600 w-12 text-center">{zoom}%</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-lg"
                onClick={() => setZoom(Math.min(150, zoom + 10))}
              >
                <ZoomIn size={16} />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-lg"
                onClick={() => setZoom(100)}
              >
                <Maximize2 size={16} />
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mt-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name, email, title, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-56 rounded-xl">
                <Filter size={16} className="mr-2" />
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {orgData?.departments?.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeTab === 'tree' && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-xl" onClick={expandAll}>
                  Expand All
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={collapseAll}>
                  Collapse All
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tree View */}
        <TabsContent value="tree" className="mt-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-x-auto">
            {orgData?.tree?.length === 0 || filteredNodes.length === 0 ? (
              <div className="p-12 text-center">
                <Network size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">
                  {searchQuery || departmentFilter !== 'all' 
                    ? 'No employees match your filters' 
                    : 'No organizational structure found'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchQuery || departmentFilter !== 'all' ? (
                  // Show filtered results as flat list
                  filteredNodes.map(node => (
                    <TreeNode key={node.id} node={node} level={0} />
                  ))
                ) : (
                  // Show full tree
                  orgData?.tree?.map(rootNode => (
                    <TreeNode key={rootNode.id} node={rootNode} level={0} />
                  ))
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Grid View */}
        <TabsContent value="grid" className="mt-4">
          {filteredNodes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Users size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No employees match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredNodes.map(employee => (
                <EmployeeCard key={employee.id} employee={employee} />
              ))}
            </div>
          )}
          {filteredNodes.length > 0 && (
            <p className="text-sm text-slate-500 mt-4">
              Showing {filteredNodes.length} of {orgData?.nodes?.length || 0} employees
            </p>
          )}
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="mt-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {filteredNodes.length === 0 ? (
              <div className="p-12 text-center">
                <Users size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No employees match your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 text-left text-sm text-slate-600">
                      <th className="px-4 py-3 font-medium">Employee</th>
                      <th className="px-4 py-3 font-medium">Job Title</th>
                      <th className="px-4 py-3 font-medium">Department</th>
                      <th className="px-4 py-3 font-medium">Reports To</th>
                      <th className="px-4 py-3 font-medium text-center">Direct Reports</th>
                      <th className="px-4 py-3 font-medium text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredNodes.map(employee => (
                      <tr key={employee.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getNodeColor(employee)} text-white flex items-center justify-center font-bold text-xs`}>
                              {employee.profile_picture ? (
                                <img src={employee.profile_picture} alt={employee.name} className="w-full h-full rounded-lg object-cover" />
                              ) : (
                                getInitials(employee.name)
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{employee.name}</p>
                              <p className="text-xs text-slate-400">{employee.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{employee.job_title || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{employee.department || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{employee.manager_name || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          {employee.direct_reports_count > 0 ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700 font-medium">
                              {employee.direct_reports_count}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="rounded-lg"
                            onClick={() => handleViewEmployee(employee)}
                          >
                            <Eye size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {filteredNodes.length > 0 && (
            <p className="text-sm text-slate-500 mt-4">
              Showing {filteredNodes.length} of {orgData?.nodes?.length || 0} employees
            </p>
          )}
        </TabsContent>
      </Tabs>

      {/* Employee Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <UserCircle className="text-indigo-600" size={24} />
              Employee Details
            </DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-6 mt-4">
              {/* Employee Header */}
              <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getNodeColor(selectedEmployee)} text-white flex items-center justify-center font-bold text-xl shadow-lg`}>
                  {selectedEmployee.profile_picture ? (
                    <img src={selectedEmployee.profile_picture} alt={selectedEmployee.name} className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    getInitials(selectedEmployee.name)
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900">{selectedEmployee.name}</h3>
                  <p className="text-slate-600 font-medium">{selectedEmployee.job_title}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                    <Mail size={14} />
                    <span>{selectedEmployee.email}</span>
                  </div>
                  {selectedEmployee.department && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                      <Layers size={14} />
                      <span>{selectedEmployee.department}</span>
                    </div>
                  )}
                  {selectedEmployee.branch && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                      <Building2 size={14} />
                      <span>{selectedEmployee.branch}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Manager Chain */}
              {employeePosition?.manager_chain?.length > 0 && (
                <div className="p-4 border border-indigo-200 rounded-xl bg-indigo-50/50">
                  <h4 className="font-bold text-indigo-900 flex items-center gap-2 mb-3">
                    <ArrowUp size={18} />
                    Reporting Chain
                  </h4>
                  <div className="space-y-2">
                    {employeePosition.manager_chain.map((manager, idx) => (
                      <div 
                        key={manager.id} 
                        className="flex items-center gap-3 p-2 bg-white rounded-lg"
                        style={{ marginLeft: `${idx * 16}px` }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {getInitials(manager.name)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{manager.name}</p>
                          <p className="text-xs text-slate-500">{manager.job_title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct Reports */}
              {employeePosition?.direct_reports?.length > 0 && (
                <div className="p-4 border border-emerald-200 rounded-xl bg-emerald-50/50">
                  <h4 className="font-bold text-emerald-900 flex items-center gap-2 mb-3">
                    <ArrowDown size={18} />
                    Direct Reports ({employeePosition.direct_reports.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {employeePosition.direct_reports.map((report) => (
                      <div key={report.id} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                          {getInitials(report.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate">{report.name}</p>
                          <p className="text-xs text-slate-500 truncate">{report.job_title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Peers */}
              {employeePosition?.peers?.length > 0 && (
                <div className="p-4 border border-purple-200 rounded-xl bg-purple-50/50">
                  <h4 className="font-bold text-purple-900 flex items-center gap-2 mb-3">
                    <Users size={18} />
                    Peers ({employeePosition.peers.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {employeePosition.peers.map((peer) => (
                      <div key={peer.id} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                          {getInitials(peer.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate">{peer.name}</p>
                          <p className="text-xs text-slate-500 truncate">{peer.job_title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No relationships message */}
              {!employeePosition?.manager_chain?.length && 
               !employeePosition?.direct_reports?.length && 
               !employeePosition?.peers?.length && (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-500">
                  <User size={24} className="mx-auto mb-2 opacity-50" />
                  <p>No organizational relationships found</p>
                </div>
              )}

              {/* Additional Info */}
              {selectedEmployee.hire_date && (
                <div className="flex items-center gap-2 text-sm text-slate-500 px-4">
                  <Calendar size={14} />
                  <span>Joined: {new Date(selectedEmployee.hire_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgChart;
