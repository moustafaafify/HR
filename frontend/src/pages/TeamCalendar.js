import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  Video,
  Link as LinkIcon,
  Edit2,
  Trash2,
  RefreshCw,
  Filter,
  Check,
  X,
  Cake,
  PartyPopper,
  Palmtree,
  Briefcase,
  GraduationCap,
  Flag,
  Circle
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EVENT_TYPES = {
  meeting: { label: 'Meeting', color: '#6366f1', icon: Users },
  holiday: { label: 'Holiday', color: '#10b981', icon: Palmtree },
  leave: { label: 'Leave', color: '#f59e0b', icon: Palmtree },
  birthday: { label: 'Birthday', color: '#ec4899', icon: Cake },
  anniversary: { label: 'Anniversary', color: '#8b5cf6', icon: PartyPopper },
  company_event: { label: 'Company Event', color: '#3b82f6', icon: Flag },
  team_event: { label: 'Team Event', color: '#14b8a6', icon: Users },
  training: { label: 'Training', color: '#f97316', icon: GraduationCap },
  deadline: { label: 'Deadline', color: '#ef4444', icon: Flag },
  other: { label: 'Other', color: '#64748b', icon: Circle },
};

const TeamCalendar = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week
  const [events, setEvents] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Filters
  const [selectedTypes, setSelectedTypes] = useState(['all']);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showLeaves, setShowLeaves] = useState(true);
  const [showBirthdays, setShowBirthdays] = useState(true);
  const [showAnniversaries, setShowAnniversaries] = useState(true);
  
  // Dialogs
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [viewEventOpen, setViewEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Form
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_type: 'meeting',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    all_day: false,
    location: '',
    is_virtual: false,
    meeting_link: '',
    is_public: true,
    is_company_wide: false,
    color: '#6366f1'
  });

  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Previous month days
    const prevMonth = new Date(year, month, 0);
    const prevDays = prevMonth.getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevDays - i),
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const getWeekDays = (date) => {
    const days = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push({ date: day, isCurrentMonth: true });
    }
    
    return days;
  };

  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getStartEndDates = useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    if (view === 'month') {
      const start = new Date(year, month, 1);
      start.setDate(start.getDate() - 7); // Include previous week
      const end = new Date(year, month + 1, 0);
      end.setDate(end.getDate() + 7); // Include next week
      return {
        start: formatDateKey(start),
        end: formatDateKey(end)
      };
    } else {
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - currentDate.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return {
        start: formatDateKey(start),
        end: formatDateKey(end)
      };
    }
  }, [currentDate, view]);

  // Fetch functions
  const fetchDepartments = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/departments`);
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const { start, end } = getStartEndDates();
      const params = new URLSearchParams({
        start_date: start,
        end_date: end,
        include_leaves: showLeaves,
        include_birthdays: showBirthdays,
        include_anniversaries: showAnniversaries
      });
      
      if (selectedDepartment !== 'all') {
        params.append('department_id', selectedDepartment);
      }
      
      const response = await axios.get(`${API}/calendar/events?${params}`);
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  }, [getStartEndDates, showLeaves, showBirthdays, showAnniversaries, selectedDepartment]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchDepartments(), fetchEvents()]);
    } finally {
      setLoading(false);
    }
  }, [fetchDepartments, fetchEvents]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchEvents();
  }, [currentDate, view, showLeaves, showBirthdays, showAnniversaries, selectedDepartment, fetchEvents]);

  // Get events for a specific date
  const getEventsForDate = (date) => {
    const dateKey = formatDateKey(date);
    return events.filter(event => {
      const startDate = event.start_date?.split('T')[0];
      const endDate = event.end_date?.split('T')[0] || startDate;
      return dateKey >= startDate && dateKey <= endDate;
    });
  };

  // Navigation
  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Event handlers
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await axios.put(`${API}/calendar/events/${editingEvent.id}`, eventForm);
        toast.success('Event updated');
      } else {
        await axios.post(`${API}/calendar/events`, eventForm);
        toast.success('Event created');
      }
      fetchEvents();
      setEventDialogOpen(false);
      resetEventForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await axios.delete(`${API}/calendar/events/${eventId}`);
      toast.success('Event deleted');
      fetchEvents();
      setViewEventOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete');
    }
  };

  const handleRespondToEvent = async (eventId, status) => {
    try {
      await axios.post(`${API}/calendar/events/${eventId}/respond`, { status });
      toast.success(`Response: ${status}`);
      fetchEvents();
    } catch (error) {
      toast.error('Failed to respond');
    }
  };

  const openCreateEvent = (date = null) => {
    resetEventForm();
    if (date) {
      const dateStr = formatDateKey(date);
      setEventForm(prev => ({
        ...prev,
        start_date: dateStr,
        end_date: dateStr
      }));
    }
    setSelectedDate(date);
    setEventDialogOpen(true);
  };

  const openEditEvent = (event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title || '',
      description: event.description || '',
      event_type: event.event_type || 'meeting',
      start_date: event.start_date?.split('T')[0] || '',
      end_date: event.end_date?.split('T')[0] || '',
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      all_day: event.all_day || false,
      location: event.location || '',
      is_virtual: event.is_virtual || false,
      meeting_link: event.meeting_link || '',
      is_public: event.is_public ?? true,
      is_company_wide: event.is_company_wide || false,
      color: event.color || '#6366f1'
    });
    setEventDialogOpen(true);
    setViewEventOpen(false);
  };

  const openViewEvent = (event) => {
    setSelectedEvent(event);
    setViewEventOpen(true);
  };

  const resetEventForm = () => {
    setEditingEvent(null);
    setSelectedDate(null);
    setEventForm({
      title: '',
      description: '',
      event_type: 'meeting',
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      all_day: false,
      location: '',
      is_virtual: false,
      meeting_link: '',
      is_public: true,
      is_company_wide: false,
      color: '#6366f1'
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return formatDateKey(date) === formatDateKey(today);
  };

  const canEditEvent = (event) => {
    if (event.id?.startsWith('leave-') || event.id?.startsWith('birthday-') || 
        event.id?.startsWith('anniversary-') || event.id?.startsWith('holiday-')) {
      return false;
    }
    return isAdmin || event.organizer_id === user?.id;
  };

  const days = view === 'month' ? getDaysInMonth(currentDate) : getWeekDays(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4" data-testid="team-calendar-page">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Team Calendar</h1>
          <p className="text-slate-500 mt-1">View team events, leaves, birthdays, and more</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <Button onClick={() => openCreateEvent()} data-testid="create-event-btn">
            <Plus size={18} className="mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={navigatePrev}>
              <ChevronLeft size={20} />
            </Button>
            <h2 className="text-lg font-semibold text-slate-900 min-w-[200px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button variant="ghost" size="sm" onClick={navigateNext}>
              <ChevronRight size={20} />
            </Button>
          </div>
          
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 text-sm font-medium ${view === 'month' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 text-sm font-medium ${view === 'week' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              Week
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-2 text-sm">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showLeaves}
                onChange={(e) => setShowLeaves(e.target.checked)}
                className="rounded"
              />
              <span className="text-slate-600">Leaves</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showBirthdays}
                onChange={(e) => setShowBirthdays(e.target.checked)}
                className="rounded"
              />
              <span className="text-slate-600">Birthdays</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showAnniversaries}
                onChange={(e) => setShowAnniversaries(e.target.checked)}
                className="rounded"
              />
              <span className="text-slate-600">Anniversaries</span>
            </label>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-sm">
        {Object.entries(EVENT_TYPES).map(([key, config]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
            <span className="text-slate-600">{config.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-slate-200">
          {weekDays.map(day => (
            <div key={day} className="py-3 text-center text-sm font-medium text-slate-600 bg-slate-50">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className={`grid grid-cols-7 ${view === 'week' ? 'min-h-[500px]' : ''}`}>
          {days.map((day, index) => {
            const dayEvents = getEventsForDate(day.date);
            const isCurrentDay = isToday(day.date);
            
            return (
              <div
                key={index}
                className={`
                  min-h-[100px] ${view === 'week' ? 'min-h-[500px]' : ''} border-b border-r border-slate-100 p-1
                  ${!day.isCurrentMonth ? 'bg-slate-50' : 'bg-white'}
                  ${isCurrentDay ? 'bg-indigo-50' : ''}
                  cursor-pointer hover:bg-slate-50 transition-colors
                `}
                onClick={() => openCreateEvent(day.date)}
              >
                <div className={`
                  text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full
                  ${!day.isCurrentMonth ? 'text-slate-400' : 'text-slate-700'}
                  ${isCurrentDay ? 'bg-indigo-600 text-white' : ''}
                `}>
                  {day.date.getDate()}
                </div>
                
                <div className="space-y-0.5 overflow-hidden">
                  {dayEvents.slice(0, view === 'week' ? 10 : 3).map((event, i) => {
                    const eventType = EVENT_TYPES[event.event_type] || EVENT_TYPES.other;
                    return (
                      <div
                        key={event.id || i}
                        onClick={(e) => { e.stopPropagation(); openViewEvent(event); }}
                        className="text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ 
                          backgroundColor: `${event.color || eventType.color}20`,
                          color: event.color || eventType.color,
                          borderLeft: `3px solid ${event.color || eventType.color}`
                        }}
                        title={event.title}
                      >
                        {event.all_day ? '' : event.start_time ? `${event.start_time} ` : ''}
                        {event.title}
                      </div>
                    );
                  })}
                  {dayEvents.length > (view === 'week' ? 10 : 3) && (
                    <div className="text-xs text-slate-500 px-1">
                      +{dayEvents.length - (view === 'week' ? 10 : 3)} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create/Edit Event Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Edit Event' : 'Create Event'}
              {selectedDate && !editingEvent && (
                <span className="text-sm font-normal text-slate-500 ml-2">
                  {selectedDate.toLocaleDateString()}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEvent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <Input
                value={eventForm.title}
                onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                placeholder="Event title"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Event Type</label>
              <Select 
                value={eventForm.event_type} 
                onValueChange={(v) => setEventForm({...eventForm, event_type: v, color: EVENT_TYPES[v]?.color || '#6366f1'})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_TYPES).filter(([k]) => !['leave', 'birthday', 'anniversary', 'holiday'].includes(k)).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                <Input
                  type="date"
                  value={eventForm.start_date}
                  onChange={(e) => setEventForm({...eventForm, start_date: e.target.value, end_date: eventForm.end_date || e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
                <Input
                  type="date"
                  value={eventForm.end_date}
                  onChange={(e) => setEventForm({...eventForm, end_date: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="all_day"
                checked={eventForm.all_day}
                onChange={(e) => setEventForm({...eventForm, all_day: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="all_day" className="text-sm text-slate-700">All day event</label>
            </div>
            
            {!eventForm.all_day && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                  <Input
                    type="time"
                    value={eventForm.start_time}
                    onChange={(e) => setEventForm({...eventForm, start_time: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                  <Input
                    type="time"
                    value={eventForm.end_time}
                    onChange={(e) => setEventForm({...eventForm, end_time: e.target.value})}
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <Textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                placeholder="Event description..."
                rows={2}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <Input
                value={eventForm.location}
                onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                placeholder="Room name, address, etc."
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_virtual"
                checked={eventForm.is_virtual}
                onChange={(e) => setEventForm({...eventForm, is_virtual: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="is_virtual" className="text-sm text-slate-700">Virtual/Online meeting</label>
            </div>
            
            {eventForm.is_virtual && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Link</label>
                <Input
                  value={eventForm.meeting_link}
                  onChange={(e) => setEventForm({...eventForm, meeting_link: e.target.value})}
                  placeholder="https://..."
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={eventForm.color}
                  onChange={(e) => setEventForm({...eventForm, color: e.target.value})}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={eventForm.color}
                  onChange={(e) => setEventForm({...eventForm, color: e.target.value})}
                  placeholder="#6366f1"
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={eventForm.is_public}
                  onChange={(e) => setEventForm({...eventForm, is_public: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="is_public" className="text-sm text-slate-700">Visible to all employees</label>
              </div>
              
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_company_wide"
                    checked={eventForm.is_company_wide}
                    onChange={(e) => setEventForm({...eventForm, is_company_wide: e.target.checked})}
                    className="rounded"
                  />
                  <label htmlFor="is_company_wide" className="text-sm text-slate-700">Company-wide event</label>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setEventDialogOpen(false); resetEventForm(); }}>
                Cancel
              </Button>
              <Button type="submit" data-testid="save-event-btn">
                {editingEvent ? 'Update Event' : 'Create Event'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Event Dialog */}
      <Dialog open={viewEventOpen} onOpenChange={setViewEventOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedEvent?.color || EVENT_TYPES[selectedEvent?.event_type]?.color || '#6366f1' }}
              />
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: selectedEvent.color || EVENT_TYPES[selectedEvent.event_type]?.color || '#6366f1' }}
                >
                  {EVENT_TYPES[selectedEvent.event_type]?.label || selectedEvent.event_type}
                </span>
                {selectedEvent.is_company_wide && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    Company-wide
                  </span>
                )}
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <CalendarIcon size={18} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">
                      {new Date(selectedEvent.start_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      {selectedEvent.end_date !== selectedEvent.start_date && (
                        <> - {new Date(selectedEvent.end_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</>
                      )}
                    </p>
                    {!selectedEvent.all_day && selectedEvent.start_time && (
                      <p className="text-slate-500">{selectedEvent.start_time}{selectedEvent.end_time && ` - ${selectedEvent.end_time}`}</p>
                    )}
                    {selectedEvent.all_day && <p className="text-slate-500">All day</p>}
                  </div>
                </div>
                
                {selectedEvent.location && (
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-slate-400 mt-0.5" />
                    <p className="text-slate-700">{selectedEvent.location}</p>
                  </div>
                )}
                
                {selectedEvent.is_virtual && selectedEvent.meeting_link && (
                  <div className="flex items-start gap-3">
                    <Video size={18} className="text-slate-400 mt-0.5" />
                    <a href={selectedEvent.meeting_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                      Join Meeting
                    </a>
                  </div>
                )}
                
                {selectedEvent.organizer_name && (
                  <div className="flex items-start gap-3">
                    <Users size={18} className="text-slate-400 mt-0.5" />
                    <p className="text-slate-700">Organized by {selectedEvent.organizer_name}</p>
                  </div>
                )}
                
                {selectedEvent.description && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-slate-700 whitespace-pre-wrap">{selectedEvent.description}</p>
                  </div>
                )}
              </div>
              
              {/* Attendees */}
              {selectedEvent.attendees?.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-700 mb-2">Attendees ({selectedEvent.attendees.length})</p>
                  <div className="space-y-1">
                    {selectedEvent.attendees.map((att, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${att.status === 'accepted' ? 'bg-green-500' : att.status === 'declined' ? 'bg-red-500' : 'bg-amber-500'}`} />
                        <span className="text-slate-700">{att.name}</span>
                        <span className="text-slate-400 text-xs">({att.status})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex justify-between pt-4 border-t border-slate-100">
                <div className="flex gap-2">
                  {!selectedEvent.id?.startsWith('leave-') && !selectedEvent.id?.startsWith('birthday-') && !selectedEvent.id?.startsWith('anniversary-') && !selectedEvent.id?.startsWith('holiday-') && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleRespondToEvent(selectedEvent.id, 'accepted')}>
                        <Check size={14} className="mr-1" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRespondToEvent(selectedEvent.id, 'declined')}>
                        <X size={14} className="mr-1" /> Decline
                      </Button>
                    </>
                  )}
                </div>
                
                {canEditEvent(selectedEvent) && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditEvent(selectedEvent)}>
                      <Edit2 size={14} className="mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" className="text-rose-600" onClick={() => handleDeleteEvent(selectedEvent.id)}>
                      <Trash2 size={14} className="mr-1" /> Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamCalendar;
