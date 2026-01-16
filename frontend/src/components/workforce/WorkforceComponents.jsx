/**
 * Workforce Planning Components
 * Extracted from WorkforcePlanning.js for better maintainability
 */
import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import {
  Users, TrendingUp, Target, PieChart, Calendar, Plus, Edit2, Trash2,
  Eye, Clock, Briefcase, UserPlus, UserMinus, ArrowUpRight, ArrowDownRight,
  Layers, Zap, Building2, Award, CheckCircle2, AlertTriangle
} from 'lucide-react';

// ============= STATS CARD =============
export const WorkforceStatsCard = ({ icon: Icon, label, value, color = "indigo", trend, trendValue }) => {
  const colorClasses = {
    indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
    emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          </div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
};

// ============= HEADCOUNT PLAN CARD =============
export const HeadcountPlanCard = ({ plan, onView, onEdit, onDelete, getStatusColor }) => (
  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl" data-testid={`headcount-plan-${plan.id}`}>
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h4 className="font-medium text-slate-900 dark:text-white">{plan.name}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {plan.department_name || 'All Departments'} • FY {plan.fiscal_year}
            {plan.quarter && ` ${plan.quarter}`}
          </p>
        </div>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
        {plan.status}
      </span>
    </div>
    
    <div className="mt-4 grid grid-cols-4 gap-4 text-center">
      <div>
        <p className="text-lg font-bold text-slate-900 dark:text-white">{plan.current_headcount}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Current</p>
      </div>
      <div>
        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+{plan.planned_hires}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Hires</p>
      </div>
      <div>
        <p className="text-lg font-bold text-red-600 dark:text-red-400">-{plan.planned_departures}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Departures</p>
      </div>
      <div>
        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{plan.target_headcount}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Target</p>
      </div>
    </div>
    
    {plan.budget_allocated > 0 && (
      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">Budget</span>
          <span className="text-slate-700 dark:text-slate-300">
            ${plan.budget_used?.toLocaleString()} / ${plan.budget_allocated?.toLocaleString()}
          </span>
        </div>
        <Progress value={(plan.budget_used / plan.budget_allocated) * 100} className="h-2 mt-1" />
      </div>
    )}
    
    <div className="mt-3 flex justify-end gap-1">
      <Button size="sm" variant="ghost" onClick={() => onView(plan)}>
        <Eye className="w-4 h-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onEdit(plan)}>
        <Edit2 className="w-4 h-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onDelete(plan.id)} className="text-red-500 hover:text-red-600">
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  </div>
);

// ============= ALLOCATION CARD =============
export const AllocationCard = ({ allocation, onEdit, onDelete, getStatusColor }) => (
  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl" data-testid={`allocation-${allocation.id}`}>
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h4 className="font-medium text-slate-900 dark:text-white">{allocation.employee_name}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {allocation.project_name || allocation.team_name || 'Unassigned'}
            {allocation.role_in_project && ` • ${allocation.role_in_project}`}
          </p>
        </div>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(allocation.status)}`}>
        {allocation.status}
      </span>
    </div>
    
    <div className="mt-3 flex items-center justify-between">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <Target className="w-4 h-4 text-slate-400" />
          <span className="text-slate-700 dark:text-slate-300">{allocation.allocation_percentage}%</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <Calendar className="w-4 h-4" />
          {allocation.start_date} - {allocation.end_date || 'Ongoing'}
        </div>
        {allocation.billable && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
            Billable
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={() => onEdit(allocation)}>
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(allocation.id)} className="text-red-500 hover:text-red-600">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </div>
);

// ============= SCENARIO CARD =============
export const ScenarioCard = ({ scenario, onView, onEdit, onDelete, getStatusColor, getScenarioTypeColor }) => (
  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl" data-testid={`scenario-${scenario.id}`}>
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${getScenarioTypeColor(scenario.scenario_type)} flex items-center justify-center`}>
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-medium text-slate-900 dark:text-white">{scenario.name}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {scenario.scenario_type?.charAt(0).toUpperCase() + scenario.scenario_type?.slice(1)} • {scenario.implementation_months} months
          </p>
        </div>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(scenario.status)}`}>
        {scenario.status?.replace('_', ' ')}
      </span>
    </div>
    
    {scenario.description && (
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{scenario.description}</p>
    )}
    
    <div className="mt-3 grid grid-cols-3 gap-4 text-center">
      <div>
        <p className="text-lg font-bold text-slate-900 dark:text-white">{scenario.base_headcount}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Base HC</p>
      </div>
      <div>
        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{scenario.projected_headcount}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Projected</p>
      </div>
      <div>
        <p className={`text-lg font-bold ${scenario.cost_savings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {scenario.cost_savings >= 0 ? '+' : ''}{scenario.cost_savings?.toLocaleString()}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Cost Impact</p>
      </div>
    </div>
    
    <div className="mt-3 flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs">
        <span className={`px-2 py-0.5 rounded-full ${scenario.productivity_impact === 'positive' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : scenario.productivity_impact === 'negative' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300'}`}>
          Productivity: {scenario.productivity_impact}
        </span>
        <span className={`px-2 py-0.5 rounded-full ${scenario.morale_impact === 'positive' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : scenario.morale_impact === 'negative' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300'}`}>
          Morale: {scenario.morale_impact}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={() => onView(scenario)}>
          <Eye className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onEdit(scenario)}>
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(scenario.id)} className="text-red-500 hover:text-red-600">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </div>
);

// ============= MY ALLOCATION CARD (Employee) =============
export const MyAllocationCard = ({ allocation, getStatusColor }) => (
  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h4 className="font-medium text-slate-900 dark:text-white">
            {allocation.project_name || allocation.team_name || 'General Assignment'}
          </h4>
          {allocation.role_in_project && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{allocation.role_in_project}</p>
          )}
        </div>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(allocation.status)}`}>
        {allocation.status}
      </span>
    </div>
    
    <div className="mt-3 flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1">
        <Target className="w-4 h-4 text-slate-400" />
        <span className="text-slate-700 dark:text-slate-300">{allocation.allocation_percentage}% allocation</span>
      </div>
      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
        <Calendar className="w-4 h-4" />
        {allocation.start_date} - {allocation.end_date || 'Ongoing'}
      </div>
    </div>
  </div>
);

// ============= HEADCOUNT PLAN DIALOG =============
export const HeadcountPlanDialog = ({
  open,
  onOpenChange,
  form,
  setForm,
  departments,
  onSubmit,
  isEditing = false
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <DialogHeader>
        <DialogTitle className="text-slate-900 dark:text-white">
          {isEditing ? 'Edit Headcount Plan' : 'Create Headcount Plan'}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4 mt-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Plan Name *</label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="e.g., Engineering Expansion Q1 2025"
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Department</label>
            <Select value={form.department_id || ''} onValueChange={(v) => setForm({ ...form, department_id: v })}>
              <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Fiscal Year *</label>
            <Input
              value={form.fiscal_year}
              onChange={(e) => setForm({ ...form, fiscal_year: e.target.value })}
              required
              placeholder="2025"
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Quarter</label>
            <Select value={form.quarter || ''} onValueChange={(v) => setForm({ ...form, quarter: v })}>
              <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                <SelectValue placeholder="Full Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Full Year</SelectItem>
                <SelectItem value="Q1">Q1</SelectItem>
                <SelectItem value="Q2">Q2</SelectItem>
                <SelectItem value="Q3">Q3</SelectItem>
                <SelectItem value="Q4">Q4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Current Headcount</label>
            <Input
              type="number"
              value={form.current_headcount}
              onChange={(e) => setForm({ ...form, current_headcount: parseInt(e.target.value) || 0 })}
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Target Headcount</label>
            <Input
              type="number"
              value={form.target_headcount}
              onChange={(e) => setForm({ ...form, target_headcount: parseInt(e.target.value) || 0 })}
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Planned Hires</label>
            <Input
              type="number"
              value={form.planned_hires}
              onChange={(e) => setForm({ ...form, planned_hires: parseInt(e.target.value) || 0 })}
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Planned Departures</label>
            <Input
              type="number"
              value={form.planned_departures}
              onChange={(e) => setForm({ ...form, planned_departures: parseInt(e.target.value) || 0 })}
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Budget Allocated ($)</label>
          <Input
            type="number"
            value={form.budget_allocated}
            onChange={(e) => setForm({ ...form, budget_allocated: parseFloat(e.target.value) || 0 })}
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Notes</label>
          <Textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="dark:border-slate-600 dark:text-slate-200">
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Update Plan' : 'Create Plan'}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
);

// ============= ALLOCATION DIALOG =============
export const AllocationDialog = ({
  open,
  onOpenChange,
  form,
  setForm,
  employees,
  projects,
  onSubmit,
  isEditing = false
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <DialogHeader>
        <DialogTitle className="text-slate-900 dark:text-white">
          {isEditing ? 'Edit Allocation' : 'Create Allocation'}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4 mt-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Employee *</label>
          <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
            <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Project</label>
          <Select value={form.project_id || ''} onValueChange={(v) => setForm({ ...form, project_id: v })}>
            <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((proj) => (
                <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Or Enter Project/Team Name</label>
          <Input
            value={form.project_name}
            onChange={(e) => setForm({ ...form, project_name: e.target.value })}
            placeholder="Project or team name"
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Role in Project</label>
          <Input
            value={form.role_in_project}
            onChange={(e) => setForm({ ...form, role_in_project: e.target.value })}
            placeholder="e.g., Lead Developer, Designer"
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Allocation Percentage</label>
          <Input
            type="number"
            min="0"
            max="100"
            value={form.allocation_percentage}
            onChange={(e) => setForm({ ...form, allocation_percentage: parseInt(e.target.value) || 100 })}
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Start Date *</label>
            <Input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              required
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">End Date</label>
            <Input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
        </div>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.billable}
            onChange={(e) => setForm({ ...form, billable: e.target.checked })}
            className="rounded border-slate-300 dark:border-slate-600"
          />
          <span className="text-sm text-slate-700 dark:text-slate-200">Billable</span>
        </label>
        
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Notes</label>
          <Textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="dark:border-slate-600 dark:text-slate-200">
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Update Allocation' : 'Create Allocation'}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
);

// ============= SCENARIO DIALOG =============
export const ScenarioDialog = ({
  open,
  onOpenChange,
  form,
  setForm,
  onSubmit,
  isEditing = false
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <DialogHeader>
        <DialogTitle className="text-slate-900 dark:text-white">
          {isEditing ? 'Edit Scenario' : 'Create Scenario'}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4 mt-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Scenario Name *</label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="e.g., Growth Scenario 2025"
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Scenario Type</label>
            <Select value={form.scenario_type} onValueChange={(v) => setForm({ ...form, scenario_type: v })}>
              <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="growth">Growth</SelectItem>
                <SelectItem value="reduction">Reduction</SelectItem>
                <SelectItem value="restructure">Restructure</SelectItem>
                <SelectItem value="merger">Merger</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Implementation (months)</label>
            <Input
              type="number"
              value={form.implementation_months}
              onChange={(e) => setForm({ ...form, implementation_months: parseInt(e.target.value) || 6 })}
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Description</label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Base Headcount</label>
            <Input
              type="number"
              value={form.base_headcount}
              onChange={(e) => setForm({ ...form, base_headcount: parseInt(e.target.value) || 0 })}
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Projected Headcount</label>
            <Input
              type="number"
              value={form.projected_headcount}
              onChange={(e) => setForm({ ...form, projected_headcount: parseInt(e.target.value) || 0 })}
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Base Cost ($)</label>
            <Input
              type="number"
              value={form.base_cost}
              onChange={(e) => setForm({ ...form, base_cost: parseFloat(e.target.value) || 0 })}
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Cost Savings/Impact ($)</label>
            <Input
              type="number"
              value={form.cost_savings}
              onChange={(e) => setForm({ ...form, cost_savings: parseFloat(e.target.value) || 0 })}
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Productivity Impact</label>
            <Select value={form.productivity_impact} onValueChange={(v) => setForm({ ...form, productivity_impact: v })}>
              <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="negative">Negative</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Morale Impact</label>
            <Select value={form.morale_impact} onValueChange={(v) => setForm({ ...form, morale_impact: v })}>
              <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="negative">Negative</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Risk Assessment</label>
          <Textarea
            value={form.risk_assessment}
            onChange={(e) => setForm({ ...form, risk_assessment: e.target.value })}
            rows={2}
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="dark:border-slate-600 dark:text-slate-200">
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Update Scenario' : 'Create Scenario'}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
);

// ============= PREFERENCES DIALOG (Employee) =============
export const PreferencesDialog = ({
  open,
  onOpenChange,
  preferences,
  setPreferences,
  projects,
  onSubmit
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <DialogHeader>
        <DialogTitle className="text-slate-900 dark:text-white">Work Preferences</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4 mt-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Preferred Projects</label>
          <Input
            value={preferences.preferred_projects?.join(', ') || ''}
            onChange={(e) => setPreferences({ ...preferences, preferred_projects: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            placeholder="Enter project names (comma-separated)"
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Interested Roles</label>
          <Input
            value={preferences.interested_roles?.join(', ') || ''}
            onChange={(e) => setPreferences({ ...preferences, interested_roles: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            placeholder="e.g., Tech Lead, Architect (comma-separated)"
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="dark:border-slate-600 dark:text-slate-200">
            Cancel
          </Button>
          <Button type="submit">Save Preferences</Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
);
