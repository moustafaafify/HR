/**
 * Compliance & Legal Components
 * Extracted from ComplianceLegal.js for better maintainability
 */
import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import {
  Shield, FileText, BookOpen, AlertTriangle, Award, CheckCircle2, Clock,
  Plus, Edit2, Trash2, Eye, Users, Calendar, FileSignature, AlertCircle,
  CheckSquare, XCircle, Lock, Flag
} from 'lucide-react';

// ============= STATS CARD =============
export const ComplianceStatsCard = ({ icon: Icon, label, value, color = "indigo", subtext }) => {
  const colorClasses = {
    indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
    emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
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
          {subtext && <p className="text-xs text-slate-400 dark:text-slate-500">{subtext}</p>}
        </div>
      </div>
    </div>
  );
};

// ============= POLICY CARD =============
export const PolicyCard = ({ policy, onView, onEdit, onDelete, onAcknowledge, isAdmin, getStatusColor, getCategoryColor }) => (
  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl" data-testid={`policy-card-${policy.id}`}>
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${getCategoryColor(policy.category)} flex items-center justify-center`}>
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-medium text-slate-900 dark:text-white">{policy.title}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">{policy.category} • v{policy.version}</p>
        </div>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(policy.status)}`}>
        {policy.status}
      </span>
    </div>
    {policy.description && (
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{policy.description}</p>
    )}
    <div className="mt-3 flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        {policy.effective_date && <span>Effective: {policy.effective_date}</span>}
        {policy.requires_acknowledgement && (
          <span className="flex items-center gap-1">
            <CheckSquare className="w-3 h-3" /> Required
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={() => onView(policy)}>
          <Eye className="w-4 h-4" />
        </Button>
        {isAdmin ? (
          <>
            <Button size="sm" variant="ghost" onClick={() => onEdit(policy)}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(policy.id)} className="text-red-500 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        ) : (
          policy.requires_acknowledgement && (
            <Button size="sm" onClick={() => onAcknowledge(policy.id)}>
              <CheckCircle2 className="w-4 h-4 mr-1" /> Acknowledge
            </Button>
          )
        )}
      </div>
    </div>
  </div>
);

// ============= TRAINING CARD =============
export const TrainingCard = ({ training, onView, onEdit, onDelete, onAssign, isAdmin, getStatusColor, getCategoryColor }) => (
  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl" data-testid={`training-card-${training.id}`}>
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${getCategoryColor(training.category)} flex items-center justify-center`}>
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-medium text-slate-900 dark:text-white">{training.title}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {training.category} • {training.duration_minutes} min
            {training.is_mandatory && <span className="ml-2 text-red-500">Mandatory</span>}
          </p>
        </div>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(training.status)}`}>
        {training.status}
      </span>
    </div>
    {training.description && (
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{training.description}</p>
    )}
    <div className="mt-3 flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Pass: {training.passing_score}%</span>
        <span>Valid: {training.certification_validity_months} months</span>
      </div>
      <div className="flex items-center gap-1">
        {isAdmin && (
          <>
            <Button size="sm" variant="outline" onClick={() => onAssign(training)}>
              <Users className="w-4 h-4 mr-1" /> Assign
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onEdit(training)}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(training.id)} className="text-red-500 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  </div>
);

// ============= MY TRAINING CARD (Employee) =============
export const MyTrainingCard = ({ completion, onStart, onContinue, getStatusColor }) => (
  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
    <div className="flex items-start justify-between">
      <div>
        <h4 className="font-medium text-slate-900 dark:text-white">{completion.training_title}</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Assigned: {new Date(completion.assigned_at).toLocaleDateString()}
        </p>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(completion.status)}`}>
        {completion.status?.replace('_', ' ')}
      </span>
    </div>
    <div className="mt-3">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-slate-500 dark:text-slate-400">Progress</span>
        <span className="text-slate-700 dark:text-slate-300">{completion.progress_percentage}%</span>
      </div>
      <Progress value={completion.progress_percentage} className="h-2" />
    </div>
    {completion.score !== null && completion.score !== undefined && (
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Score: <span className="font-medium">{completion.score}%</span> (Attempts: {completion.attempts})
      </p>
    )}
    <div className="mt-3 flex justify-end">
      {completion.status === 'assigned' && (
        <Button size="sm" onClick={() => onStart(completion)}>
          Start Training
        </Button>
      )}
      {completion.status === 'in_progress' && (
        <Button size="sm" onClick={() => onContinue(completion)}>
          Continue
        </Button>
      )}
      {completion.status === 'completed' && (
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm">
          <CheckCircle2 className="w-4 h-4" /> Completed
        </span>
      )}
    </div>
  </div>
);

// ============= INCIDENT CARD =============
export const IncidentCard = ({ incident, onView, onEdit, isAdmin, getSeverityColor, getStatusColor }) => (
  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl" data-testid={`incident-card-${incident.id}`}>
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${getSeverityColor(incident.severity)} flex items-center justify-center`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-medium text-slate-900 dark:text-white">{incident.title}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {incident.incident_type?.replace('_', ' ')} • {incident.incident_date}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
          {incident.severity}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
          {incident.status?.replace('_', ' ')}
        </span>
      </div>
    </div>
    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{incident.description}</p>
    {incident.is_confidential && (
      <div className="mt-2 flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs">
        <Lock className="w-3 h-3" /> Confidential
      </div>
    )}
    <div className="mt-3 flex justify-end gap-1">
      <Button size="sm" variant="ghost" onClick={() => onView(incident)}>
        <Eye className="w-4 h-4" />
      </Button>
      {isAdmin && (
        <Button size="sm" variant="ghost" onClick={() => onEdit(incident)}>
          <Edit2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  </div>
);

// ============= CERTIFICATION CARD =============
export const CertificationCard = ({ cert, onEdit, onDelete, isAdmin, getStatusColor }) => {
  const isExpiringSoon = cert.expiry_date && new Date(cert.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl" data-testid={`cert-card-${cert.id}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h4 className="font-medium text-slate-900 dark:text-white">{cert.certification_name}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {cert.issuing_authority || 'Internal'} • {cert.certification_type}
            </p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cert.status)}`}>
          {cert.status}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <p>Issued: {cert.issued_date}</p>
          {cert.expiry_date && (
            <p className={isExpiringSoon ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>
              Expires: {cert.expiry_date}
              {isExpiringSoon && ' (Expiring soon!)'}
            </p>
          )}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => onEdit(cert)}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(cert.id)} className="text-red-500 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============= DOCUMENT CARD =============
export const LegalDocumentCard = ({ doc, onView, onEdit, onDelete, onSign, isAdmin, isOwner, getStatusColor }) => (
  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl" data-testid={`doc-card-${doc.id}`}>
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <FileSignature className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h4 className="font-medium text-slate-900 dark:text-white">{doc.title}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {doc.document_type?.replace('_', ' ')}
            {doc.employee_name && ` • ${doc.employee_name}`}
          </p>
        </div>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
        {doc.status?.replace('_', ' ')}
      </span>
    </div>
    <div className="mt-3 flex items-center justify-between">
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {doc.effective_date && <p>Effective: {doc.effective_date}</p>}
        {doc.expiry_date && <p>Expires: {doc.expiry_date}</p>}
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={() => onView(doc)}>
          <Eye className="w-4 h-4" />
        </Button>
        {isAdmin ? (
          <>
            <Button size="sm" variant="ghost" onClick={() => onEdit(doc)}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(doc.id)} className="text-red-500 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        ) : (
          isOwner && doc.status === 'pending_signature' && !doc.employee_signed_at && (
            <Button size="sm" onClick={() => onSign(doc.id)}>
              <FileSignature className="w-4 h-4 mr-1" /> Sign
            </Button>
          )
        )}
      </div>
    </div>
  </div>
);

// ============= POLICY DIALOG =============
export const PolicyDialog = ({
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
          {isEditing ? 'Edit Policy' : 'Create Policy'}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4 mt-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Title *</label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Category</label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="data_privacy">Data Privacy</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="ethics">Ethics</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Status</label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
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
        
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Content</label>
          <Textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={6}
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Version</label>
            <Input
              value={form.version}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Effective Date</label>
            <Input
              type="date"
              value={form.effective_date}
              onChange={(e) => setForm({ ...form, effective_date: e.target.value })}
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.requires_acknowledgement}
              onChange={(e) => setForm({ ...form, requires_acknowledgement: e.target.checked })}
              className="rounded border-slate-300 dark:border-slate-600"
            />
            <span className="text-sm text-slate-700 dark:text-slate-200">Requires Acknowledgement</span>
          </label>
          {form.requires_acknowledgement && (
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Frequency</label>
              <Select value={form.acknowledgement_frequency} onValueChange={(v) => setForm({ ...form, acknowledgement_frequency: v })}>
                <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Once</SelectItem>
                  <SelectItem value="annual">Annually</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="dark:border-slate-600 dark:text-slate-200">
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Update Policy' : 'Create Policy'}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
);

// ============= TRAINING DIALOG =============
export const TrainingDialog = ({
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
          {isEditing ? 'Edit Training' : 'Create Training'}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4 mt-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Title *</label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Category</label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="harassment">Harassment</SelectItem>
                <SelectItem value="ethics">Ethics</SelectItem>
                <SelectItem value="data_privacy">Data Privacy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Content Type</label>
            <Select value={form.content_type} onValueChange={(v) => setForm({ ...form, content_type: v })}>
              <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="external_link">External Link</SelectItem>
              </SelectContent>
            </Select>
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
        
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Content URL</label>
          <Input
            value={form.content_url}
            onChange={(e) => setForm({ ...form, content_url: e.target.value })}
            placeholder="https://..."
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Duration (min)</label>
            <Input
              type="number"
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 30 })}
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Passing Score %</label>
            <Input
              type="number"
              value={form.passing_score}
              onChange={(e) => setForm({ ...form, passing_score: parseInt(e.target.value) || 80 })}
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Validity (months)</label>
            <Input
              type="number"
              value={form.certification_validity_months}
              onChange={(e) => setForm({ ...form, certification_validity_months: parseInt(e.target.value) || 12 })}
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
        </div>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_mandatory}
            onChange={(e) => setForm({ ...form, is_mandatory: e.target.checked })}
            className="rounded border-slate-300 dark:border-slate-600"
          />
          <span className="text-sm text-slate-700 dark:text-slate-200">Mandatory Training</span>
        </label>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="dark:border-slate-600 dark:text-slate-200">
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Update Training' : 'Create Training'}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
);

// ============= INCIDENT DIALOG =============
export const IncidentDialog = ({
  open,
  onOpenChange,
  form,
  setForm,
  employees,
  onSubmit,
  isEditing = false,
  isAdmin = false
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <DialogHeader>
        <DialogTitle className="text-slate-900 dark:text-white">
          {isEditing ? 'Update Incident' : 'Report Incident'}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4 mt-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Title *</label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Type</label>
            <Select value={form.incident_type} onValueChange={(v) => setForm({ ...form, incident_type: v })}>
              <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="policy_violation">Policy Violation</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="harassment">Harassment</SelectItem>
                <SelectItem value="data_breach">Data Breach</SelectItem>
                <SelectItem value="ethics">Ethics</SelectItem>
                <SelectItem value="fraud">Fraud</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Severity</label>
            <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
              <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Description *</label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            required
            className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Incident Date</label>
            <Input
              type="date"
              value={form.incident_date}
              onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
              className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
          </div>
          {isAdmin && employees && (
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Employee Involved</label>
              <Select value={form.employee_involved || ''} onValueChange={(v) => setForm({ ...form, employee_involved: v })}>
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
          )}
        </div>
        
        {isAdmin && isEditing && (
          <>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reported">Reported</SelectItem>
                  <SelectItem value="under_investigation">Under Investigation</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Investigation Notes</label>
              <Textarea
                value={form.investigation_notes || ''}
                onChange={(e) => setForm({ ...form, investigation_notes: e.target.value })}
                rows={3}
                className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 block">Resolution</label>
              <Textarea
                value={form.resolution || ''}
                onChange={(e) => setForm({ ...form, resolution: e.target.value })}
                rows={2}
                className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              />
            </div>
          </>
        )}
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_confidential}
            onChange={(e) => setForm({ ...form, is_confidential: e.target.checked })}
            className="rounded border-slate-300 dark:border-slate-600"
          />
          <Lock className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-700 dark:text-slate-200">Mark as Confidential</span>
        </label>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="dark:border-slate-600 dark:text-slate-200">
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Update Incident' : 'Report Incident'}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
);
