/**
 * Visitor Management Components
 * Extracted from VisitorManagement.js for better maintainability
 */
import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  User, Users, Mail, Phone, Calendar, Clock, Briefcase, MapPin,
  Building2, LogIn, LogOut, Printer, Eye, Edit2, BadgeCheck,
  AlertCircle, FileSignature, Laptop, Camera, Package
} from 'lucide-react';

// ============= VISITOR CARD =============
export const VisitorCard = ({ 
  visitor, 
  showActions = true, 
  onView, 
  onCheckIn, 
  onCheckOut, 
  onEdit, 
  onPrintBadge,
  getVisitTypeIcon,
  getStatusColor,
  formatTime 
}) => {
  const VisitIcon = getVisitTypeIcon(visitor.visit_type);
  
  return (
    <div 
      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl" 
      data-testid={`visitor-card-${visitor.id}`}
    >
      <div className="flex items-center gap-4 cursor-pointer" onClick={() => onView?.(visitor)}>
        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <VisitIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <p className="font-medium text-slate-900 dark:text-white">
            {visitor.first_name} {visitor.last_name}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {visitor.company || 'No company'} • Host: {visitor.host_name || 'N/A'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {formatTime(visitor.expected_time)} • {visitor.visit_type}
            {visitor.badge_number && ` • Badge: ${visitor.badge_number}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(visitor.status)}`}>
          {visitor.status?.replace('_', ' ')}
        </span>
        {showActions && (
          <>
            <Button size="sm" variant="ghost" onClick={() => onView?.(visitor)} data-testid={`view-visitor-${visitor.id}`}>
              <Eye className="w-4 h-4" />
            </Button>
            {visitor.status === 'pre_registered' && (
              <Button size="sm" onClick={() => onCheckIn?.(visitor)} data-testid={`checkin-visitor-${visitor.id}`}>
                <LogIn className="w-4 h-4 mr-1" /> Check In
              </Button>
            )}
            {visitor.status === 'checked_in' && (
              <>
                <Button size="sm" variant="outline" onClick={() => onPrintBadge?.(visitor.id)} data-testid={`print-badge-${visitor.id}`}>
                  <Printer className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => onCheckOut?.(visitor.id)} data-testid={`checkout-visitor-${visitor.id}`}>
                  <LogOut className="w-4 h-4 mr-1" /> Out
                </Button>
              </>
            )}
            {visitor.status === 'pre_registered' && (
              <Button size="sm" variant="ghost" onClick={() => onEdit?.(visitor)} data-testid={`edit-visitor-${visitor.id}`}>
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ============= VISITOR STATS CARD =============
export const VisitorStatsCard = ({ icon: Icon, label, value, color = "indigo" }) => {
  const colorClasses = {
    indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
    emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
};

// ============= PRE-REGISTER VISITOR DIALOG =============
export const PreRegisterVisitorDialog = ({
  open,
  onOpenChange,
  form,
  setForm,
  employees,
  onSubmit,
  isEditing = false
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <DialogHeader>
        <DialogTitle className="text-slate-900 dark:text-white">
          {isEditing ? 'Edit Visitor' : 'Pre-register Visitor'}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">First Name *</label>
            <Input
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              required
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Last Name *</label>
            <Input
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              required
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Phone</label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Company</label>
          <Input
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Visit Type</label>
            <Select value={form.visit_type} onValueChange={(v) => setForm({ ...form, visit_type: v })}>
              <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="contractor">Contractor</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Host</label>
            <Select value={form.host_employee_id} onValueChange={(v) => setForm({ ...form, host_employee_id: v })}>
              <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                <SelectValue placeholder="Select host" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Purpose</label>
          <Input
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            placeholder="Purpose of visit"
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Date *</label>
            <Input
              type="date"
              value={form.expected_date}
              onChange={(e) => setForm({ ...form, expected_date: e.target.value })}
              required
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Time</label>
            <Input
              type="time"
              value={form.expected_time}
              onChange={(e) => setForm({ ...form, expected_time: e.target.value })}
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Duration (min)</label>
            <Input
              type="number"
              value={form.expected_duration_minutes}
              onChange={(e) => setForm({ ...form, expected_duration_minutes: parseInt(e.target.value) || 60 })}
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Building</label>
            <Input
              value={form.building}
              onChange={(e) => setForm({ ...form, building: e.target.value })}
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Meeting Room</label>
            <Input
              value={form.meeting_room}
              onChange={(e) => setForm({ ...form, meeting_room: e.target.value })}
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Special Instructions</label>
          <Textarea
            value={form.special_instructions}
            onChange={(e) => setForm({ ...form, special_instructions: e.target.value })}
            rows={2}
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="dark:border-slate-600 dark:text-slate-200">
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Update Visitor' : 'Pre-register Visitor'}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
);

// ============= CHECK-IN DIALOG =============
export const CheckInDialog = ({
  open,
  onOpenChange,
  visitor,
  form,
  setForm,
  onSubmit
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <DialogHeader>
        <DialogTitle className="text-slate-900 dark:text-white">Check In Visitor</DialogTitle>
      </DialogHeader>
      {visitor && (
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <p className="font-medium text-slate-900 dark:text-white">{visitor.first_name} {visitor.last_name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {visitor.company || 'No company'} • Host: {visitor.host_name}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{visitor.purpose}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">ID Type</label>
            <Select value={form.id_type} onValueChange={(v) => setForm({ ...form, id_type: v })}>
              <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="drivers_license">Driver's License</SelectItem>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="national_id">National ID</SelectItem>
                <SelectItem value="employee_id">Employee ID</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">ID Number</label>
            <Input
              value={form.id_number}
              onChange={(e) => setForm({ ...form, id_number: e.target.value })}
              placeholder="Enter ID number"
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.has_laptop}
                onChange={(e) => setForm({ ...form, has_laptop: e.target.checked })}
                className="rounded border-slate-300 dark:border-slate-600"
              />
              <Laptop className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-700 dark:text-slate-200">Laptop</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.has_camera}
                onChange={(e) => setForm({ ...form, has_camera: e.target.checked })}
                className="rounded border-slate-300 dark:border-slate-600"
              />
              <Camera className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-700 dark:text-slate-200">Camera</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.nda_signed}
                onChange={(e) => setForm({ ...form, nda_signed: e.target.checked })}
                className="rounded border-slate-300 dark:border-slate-600"
              />
              <FileSignature className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-700 dark:text-slate-200">NDA Signed</span>
            </label>
          </div>
          
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Other Items</label>
            <Input
              value={form.other_items}
              onChange={(e) => setForm({ ...form, other_items: e.target.value })}
              placeholder="List other items"
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="dark:border-slate-600 dark:text-slate-200">
              Cancel
            </Button>
            <Button type="submit">
              <LogIn className="w-4 h-4 mr-2" /> Check In
            </Button>
          </div>
        </form>
      )}
    </DialogContent>
  </Dialog>
);

// ============= VIEW VISITOR DIALOG =============
export const ViewVisitorDialog = ({
  open,
  onOpenChange,
  visitor,
  onEdit,
  onCheckIn,
  onCheckOut,
  onPrintBadge,
  getStatusColor,
  formatDate,
  formatTime
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <DialogHeader>
        <DialogTitle className="text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-5 h-5" />
          Visitor Details
        </DialogTitle>
      </DialogHeader>
      {visitor && (
        <div className="mt-4 space-y-6">
          {/* Visitor Info Header */}
          <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <div className="w-16 h-16 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <User className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {visitor.first_name} {visitor.last_name}
              </h3>
              <p className="text-slate-500 dark:text-slate-400">{visitor.company || 'No company'}</p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(visitor.status)}`}>
                {visitor.status?.replace('_', ' ')}
              </span>
            </div>
            {visitor.badge_number && (
              <div className="text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">Badge</p>
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{visitor.badge_number}</p>
              </div>
            )}
          </div>
          
          {/* Contact & Host Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" /> Contact Information
              </h4>
              <div className="space-y-2 text-sm">
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="text-slate-500">Email:</span> {visitor.email || 'N/A'}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="text-slate-500">Phone:</span> {visitor.phone || 'N/A'}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" /> Host Information
              </h4>
              <div className="space-y-2 text-sm">
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="text-slate-500">Host:</span> {visitor.host_name || 'N/A'}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="text-slate-500">Department:</span> {visitor.host_department || 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Visit Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" /> Visit Schedule
              </h4>
              <div className="space-y-2 text-sm">
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="text-slate-500">Date:</span> {formatDate(visitor.expected_date)}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="text-slate-500">Expected Time:</span> {formatTime(visitor.expected_time)}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="text-slate-500">Duration:</span> {visitor.expected_duration_minutes || 60} min
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-slate-400" /> Visit Purpose
              </h4>
              <div className="space-y-2 text-sm">
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="text-slate-500">Type:</span> {visitor.visit_type}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="text-slate-500">Purpose:</span> {visitor.purpose || 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Location */}
          {(visitor.building || visitor.meeting_room) && (
            <div className="space-y-3">
              <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" /> Location
              </h4>
              <div className="flex gap-4 text-sm">
                {visitor.building && (
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="text-slate-500">Building:</span> {visitor.building}
                  </p>
                )}
                {visitor.meeting_room && (
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="text-slate-500">Meeting Room:</span> {visitor.meeting_room}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Check-in/out Times */}
          {(visitor.check_in_time || visitor.check_out_time) && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <h4 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Visit Timeline
              </h4>
              <div className="flex gap-8 text-sm">
                {visitor.check_in_time && (
                  <div>
                    <p className="text-emerald-600 dark:text-emerald-400 font-medium">Checked In</p>
                    <p className="text-emerald-700 dark:text-emerald-300">{formatTime(visitor.check_in_time)}</p>
                  </div>
                )}
                {visitor.check_out_time && (
                  <div>
                    <p className="text-emerald-600 dark:text-emerald-400 font-medium">Checked Out</p>
                    <p className="text-emerald-700 dark:text-emerald-300">{formatTime(visitor.check_out_time)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Items & Security */}
          {(visitor.has_laptop || visitor.has_camera || visitor.other_items || visitor.nda_signed) && (
            <div className="space-y-3">
              <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-400" /> Items & Security
              </h4>
              <div className="flex flex-wrap gap-3">
                {visitor.has_laptop && (
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Laptop className="w-4 h-4" /> Laptop
                  </span>
                )}
                {visitor.has_camera && (
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Camera className="w-4 h-4" /> Camera
                  </span>
                )}
                {visitor.nda_signed && (
                  <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <FileSignature className="w-4 h-4" /> NDA Signed
                  </span>
                )}
                {visitor.other_items && (
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-sm text-slate-700 dark:text-slate-300">
                    {visitor.other_items}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Notes */}
          {(visitor.notes || visitor.special_instructions) && (
            <div className="space-y-3">
              <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-400" /> Notes & Instructions
              </h4>
              {visitor.notes && (
                <p className="text-sm text-slate-600 dark:text-slate-400 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  {visitor.notes}
                </p>
              )}
              {visitor.special_instructions && (
                <p className="text-sm text-amber-600 dark:text-amber-400 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <strong>Special Instructions:</strong> {visitor.special_instructions}
                </p>
              )}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="dark:border-slate-600 dark:text-slate-200">
              Close
            </Button>
            {visitor.status === 'pre_registered' && (
              <>
                <Button variant="outline" onClick={() => { onOpenChange(false); onEdit?.(visitor); }}>
                  <Edit2 className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button onClick={() => { onOpenChange(false); onCheckIn?.(visitor); }}>
                  <LogIn className="w-4 h-4 mr-2" /> Check In
                </Button>
              </>
            )}
            {visitor.status === 'checked_in' && (
              <>
                <Button variant="outline" onClick={() => onPrintBadge?.(visitor.id)}>
                  <Printer className="w-4 h-4 mr-2" /> Print Badge
                </Button>
                <Button onClick={() => { onOpenChange(false); onCheckOut?.(visitor.id); }}>
                  <LogOut className="w-4 h-4 mr-2" /> Check Out
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>
);

// ============= BADGE PREVIEW DIALOG =============
export const BadgePreviewDialog = ({
  open,
  onOpenChange,
  badgeData,
  badgeRef,
  onPrint
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <DialogHeader>
        <DialogTitle className="text-slate-900 dark:text-white">Visitor Badge</DialogTitle>
      </DialogHeader>
      {badgeData && (
        <div>
          <div ref={badgeRef} className="p-6 bg-white border-2 border-slate-200 rounded-xl">
            <div className="text-center mb-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Visitor</p>
              <p className="text-2xl font-bold text-indigo-600">{badgeData.badge_data?.badge_number}</p>
            </div>
            <div className="space-y-2 text-center">
              <p className="text-xl font-bold text-slate-900">{badgeData.badge_data?.visitor_name}</p>
              <p className="text-slate-600">{badgeData.badge_data?.company || 'Guest'}</p>
              <div className="pt-2 border-t border-slate-200">
                <p className="text-sm text-slate-500">Visiting</p>
                <p className="font-medium text-slate-700">{badgeData.badge_data?.host_name}</p>
              </div>
              <div className="pt-2">
                <p className="text-sm text-slate-500">Date</p>
                <p className="font-medium text-slate-700">{badgeData.badge_data?.visit_date}</p>
              </div>
              <div className="pt-4 flex justify-center">
                <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-slate-400">QR Code</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="dark:border-slate-600 dark:text-slate-200">
              Close
            </Button>
            <Button onClick={onPrint}>
              <Printer className="w-4 h-4 mr-2" /> Print Badge
            </Button>
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>
);

// ============= WALK-IN DIALOG =============
export const WalkInDialog = ({
  open,
  onOpenChange,
  form,
  setForm,
  employees,
  onSubmit
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <DialogHeader>
        <DialogTitle className="text-slate-900 dark:text-white">Walk-in Visitor</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">First Name *</label>
            <Input
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              required
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Last Name *</label>
            <Input
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              required
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Company</label>
          <Input
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Visit Type</label>
          <Select value={form.visit_type} onValueChange={(v) => setForm({ ...form, visit_type: v })}>
            <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="contractor">Contractor</SelectItem>
              <SelectItem value="vendor">Vendor</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Host</label>
          <Select value={form.host_employee_id} onValueChange={(v) => setForm({ ...form, host_employee_id: v })}>
            <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
              <SelectValue placeholder="Select host" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Purpose *</label>
          <Input
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            required
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="dark:border-slate-600 dark:text-slate-200">
            Cancel
          </Button>
          <Button type="submit">
            <LogIn className="w-4 h-4 mr-2" /> Register & Check In
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
);
