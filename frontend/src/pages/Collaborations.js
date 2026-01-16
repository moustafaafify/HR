import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  MessageSquare, 
  Hash, 
  Lock, 
  Plus, 
  Search, 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical,
  Pin,
  Bookmark,
  Trash2,
  Edit2,
  Reply,
  AtSign,
  File,
  Image,
  FileText,
  Video,
  Music,
  Download,
  X,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Clock,
  Star,
  Folder,
  FolderOpen,
  MessageCircle,
  Bell,
  BellOff,
  Archive,
  UserPlus,
  LogOut,
  RefreshCw,
  Circle,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Vote,
  Zap,
  Filter,
  Calendar,
  User,
  Moon,
  Coffee,
  MinusCircle,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Bold,
  Italic,
  Code,
  Link,
  List,
  ListOrdered,
  Quote,
  Sparkles
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Emoji picker - expanded
const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏', '💯', '✅', '👀', '🚀', '💪', '🙏', '👋'];

// Status options
const STATUS_OPTIONS = [
  { value: 'online', label: 'Online', icon: Circle, color: 'text-green-500 fill-green-500' },
  { value: 'away', label: 'Away', icon: Clock, color: 'text-amber-500 fill-amber-500' },
  { value: 'dnd', label: 'Do Not Disturb', icon: MinusCircle, color: 'text-red-500 fill-red-500' },
  { value: 'offline', label: 'Offline', icon: Circle, color: 'text-slate-400' }
];

// File type icons
const FILE_ICONS = {
  document: FileText,
  image: Image,
  video: Video,
  audio: Music,
  other: File
};

// Format message content with markdown-like syntax
const formatMessageContent = (content) => {
  if (!content) return '';
  
  let formatted = content;
  
  // Bold: **text**
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic: *text* or _text_
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Code: `code`
  formatted = formatted.replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-600 rounded text-sm font-mono">$1</code>');
  
  // Links: [text](url)
  formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-indigo-500 hover:underline">$1</a>');
  
  // Mentions: @username
  formatted = formatted.replace(/@(\w+)/g, '<span class="text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-100 dark:bg-indigo-900/30 px-1 rounded">@$1</span>');
  
  return formatted;
};

const Collaborations = () => {
  const { token, user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [polls, setPolls] = useState([]);
  const [quickReplies, setQuickReplies] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [myMentions, setMyMentions] = useState([]);
  const [userStatuses, setUserStatuses] = useState({});
  const [myStatus, setMyStatus] = useState({ status: 'online', status_text: '', status_emoji: '' });
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // UI State
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [activeView, setActiveView] = useState('channels');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showChannelSettings, setShowChannelSettings] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [showThread, setShowThread] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [showUserList, setShowUserList] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [channelMembers, setChannelMembers] = useState([]);
  const [collapsedCategories, setCollapsedCategories] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  
  // Search filters
  const [searchFilters, setSearchFilters] = useState({
    type: '',
    sender_id: '',
    date_from: '',
    date_to: '',
    has_attachments: false,
    is_pinned: false
  });
  
  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  
  // Form state
  const [channelForm, setChannelForm] = useState({
    name: '',
    description: '',
    type: 'public',
    icon: '#',
    color: '#6366f1',
    category_id: ''
  });
  
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignee_id: '',
    due_date: '',
    priority: 'medium'
  });
  
  const [pollForm, setPollForm] = useState({
    question: '',
    options: ['', ''],
    allow_multiple: false,
    is_anonymous: false
  });

  // Fetch data on mount
  useEffect(() => {
    fetchAll();
    
    // Set up polling
    const interval = setInterval(() => {
      if (selectedChannel) {
        fetchMessages(selectedChannel.id, true);
      }
      fetchUnreadCounts();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch messages when channel changes
  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel.id);
      fetchChannelFiles(selectedChannel.id);
      fetchPolls(selectedChannel.id);
      markChannelRead(selectedChannel.id);
      fetchChannelMembers(selectedChannel.id);
    }
  }, [selectedChannel]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchChannels(),
        fetchCategories(),
        fetchDirectMessages(),
        fetchUsers(),
        fetchDashboard(),
        fetchTasks(),
        fetchSavedItems(),
        fetchQuickReplies(),
        fetchUnreadCounts(),
        fetchMyMentions(),
        fetchMyStatus(),
        fetchAllStatuses()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChannels = async () => {
    try {
      const res = await axios.get(`${API}/collaborations/channels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChannels(res.data.filter(c => c.type !== 'direct'));
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/collaborations/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(res.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchDirectMessages = async () => {
    try {
      const res = await axios.get(`${API}/collaborations/dm`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDirectMessages(res.data);
    } catch (error) {
      console.error('Failed to fetch DMs:', error);
    }
  };

  const fetchMessages = async (channelId, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await axios.get(`${API}/collaborations/channels/${channelId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/collaborations/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`${API}/collaborations/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboard(res.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    }
  };

  const fetchChannelFiles = async (channelId) => {
    try {
      const res = await axios.get(`${API}/collaborations/channels/${channelId}/files`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(res.data);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API}/collaborations/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const fetchSavedItems = async () => {
    try {
      const res = await axios.get(`${API}/collaborations/saved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedItems(res.data);
    } catch (error) {
      console.error('Failed to fetch saved items:', error);
    }
  };

  const fetchPolls = async (channelId) => {
    try {
      const res = await axios.get(`${API}/collaborations/channels/${channelId}/polls`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPolls(res.data);
    } catch (error) {
      console.error('Failed to fetch polls:', error);
    }
  };

  const fetchQuickReplies = async () => {
    try {
      const res = await axios.get(`${API}/collaborations/quick-replies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuickReplies(res.data);
    } catch (error) {
      console.error('Failed to fetch quick replies:', error);
    }
  };

  const fetchUnreadCounts = async () => {
    try {
      const res = await axios.get(`${API}/collaborations/unread`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCounts(res.data);
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  };

  const fetchMyMentions = async () => {
    try {
      const res = await axios.get(`${API}/collaborations/mentions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyMentions(res.data);
    } catch (error) {
      console.error('Failed to fetch mentions:', error);
    }
  };

  const fetchMyStatus = async () => {
    try {
      const res = await axios.get(`${API}/collaborations/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyStatus(res.data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const fetchAllStatuses = async () => {
    try {
      const res = await axios.get(`${API}/collaborations/status/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserStatuses(res.data);
    } catch (error) {
      console.error('Failed to fetch statuses:', error);
    }
  };

  const fetchChannelMembers = async (channelId) => {
    try {
      const res = await axios.get(`${API}/collaborations/channels/${channelId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChannelMembers(res.data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const markChannelRead = async (channelId) => {
    try {
      await axios.post(`${API}/collaborations/channels/${channelId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCounts(prev => ({ ...prev, [channelId]: 0 }));
    } catch (error) {
      console.error('Failed to mark channel read:', error);
    }
  };

  const fetchThread = async (messageId) => {
    try {
      const res = await axios.get(`${API}/collaborations/messages/${messageId}/thread`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setThreadMessages(res.data.replies);
      setShowThread(res.data.parent);
    } catch (error) {
      console.error('Failed to fetch thread:', error);
    }
  };

  const handleCreateChannel = async () => {
    try {
      await axios.post(`${API}/collaborations/channels`, channelForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Channel created!');
      setShowCreateChannel(false);
      setChannelForm({ name: '', description: '', type: 'public', icon: '#', color: '#6366f1', category_id: '' });
      fetchChannels();
    } catch (error) {
      toast.error('Failed to create channel');
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChannel) return;
    
    try {
      setSendingMessage(true);
      
      // Extract mentions from content
      const mentionRegex = /@(\w+)/g;
      const mentionedNames = [];
      let match;
      while ((match = mentionRegex.exec(messageInput)) !== null) {
        mentionedNames.push(match[1]);
      }
      
      // Find user IDs for mentions
      const mentionedIds = users
        .filter(u => mentionedNames.some(name => 
          u.name.toLowerCase().includes(name.toLowerCase())
        ))
        .map(u => u.id);
      
      await axios.post(`${API}/collaborations/channels/${selectedChannel.id}/messages`, {
        content: messageInput,
        content_type: 'text',
        mentions: mentionedIds
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessageInput('');
      fetchMessages(selectedChannel.id);
      fetchDashboard();
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendThreadReply = async (parentId, content) => {
    try {
      await axios.post(`${API}/collaborations/channels/${selectedChannel.id}/messages`, {
        content,
        content_type: 'text',
        parent_id: parentId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchThread(parentId);
      fetchMessages(selectedChannel.id);
    } catch (error) {
      toast.error('Failed to send reply');
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      await axios.post(`${API}/collaborations/messages/${messageId}/reactions`, { emoji }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMessages(selectedChannel.id);
      setShowEmojiPicker(null);
    } catch (error) {
      toast.error('Failed to add reaction');
    }
  };

  const handlePinMessage = async (messageId, isPinned) => {
    try {
      if (isPinned) {
        await axios.delete(`${API}/collaborations/messages/${messageId}/pin`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Message unpinned');
      } else {
        await axios.post(`${API}/collaborations/messages/${messageId}/pin`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Message pinned');
      }
      fetchMessages(selectedChannel.id);
    } catch (error) {
      toast.error('Failed to update pin');
    }
  };

  const handleSaveItem = async (itemType, itemId, channelId) => {
    try {
      await axios.post(`${API}/collaborations/saved`, {
        item_type: itemType,
        item_id: itemId,
        channel_id: channelId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Item saved');
      fetchSavedItems();
    } catch (error) {
      toast.error('Failed to save item');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    
    try {
      await axios.delete(`${API}/collaborations/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMessages(selectedChannel.id);
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChannel) return;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await axios.post(
        `${API}/collaborations/channels/${selectedChannel.id}/files`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Check if it's an image for inline preview
      const isImage = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
      
      await axios.post(`${API}/collaborations/channels/${selectedChannel.id}/messages`, {
        content: isImage ? '' : `📎 Shared a file: ${file.name}`,
        content_type: isImage ? 'image' : 'file',
        attachments: [res.data]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('File uploaded');
      fetchMessages(selectedChannel.id);
      fetchChannelFiles(selectedChannel.id);
    } catch (error) {
      toast.error('Failed to upload file');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    
    try {
      const params = { q: searchQuery, ...searchFilters };
      const res = await axios.get(`${API}/collaborations/search/advanced`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleCreateDM = async (userId) => {
    try {
      const res = await axios.post(`${API}/collaborations/dm`, { user_id: userId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedChannel(res.data);
      setActiveView('dms');
      fetchDirectMessages();
      setShowUserList(false);
    } catch (error) {
      toast.error('Failed to create conversation');
    }
  };

  const handleCreateTask = async () => {
    try {
      await axios.post(`${API}/collaborations/tasks`, {
        ...taskForm,
        channel_id: selectedChannel?.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Task created');
      setShowCreateTask(false);
      setTaskForm({ title: '', description: '', assignee_id: '', due_date: '', priority: 'medium' });
      fetchTasks();
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      await axios.put(`${API}/collaborations/tasks/${taskId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleCreatePoll = async () => {
    if (!pollForm.question || pollForm.options.filter(o => o.trim()).length < 2) {
      toast.error('Please provide a question and at least 2 options');
      return;
    }
    
    try {
      await axios.post(`${API}/collaborations/channels/${selectedChannel.id}/polls`, {
        question: pollForm.question,
        options: pollForm.options.filter(o => o.trim()),
        allow_multiple: pollForm.allow_multiple,
        is_anonymous: pollForm.is_anonymous
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Poll created');
      setShowCreatePoll(false);
      setPollForm({ question: '', options: ['', ''], allow_multiple: false, is_anonymous: false });
      fetchMessages(selectedChannel.id);
      fetchPolls(selectedChannel.id);
    } catch (error) {
      toast.error('Failed to create poll');
    }
  };

  const handleVotePoll = async (pollId, optionId) => {
    try {
      await axios.post(`${API}/collaborations/polls/${pollId}/vote`, {
        option_ids: [optionId]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPolls(selectedChannel.id);
      fetchMessages(selectedChannel.id);
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  const handleUpdateStatus = async (status, statusText = '', statusEmoji = '') => {
    try {
      await axios.put(`${API}/collaborations/status`, {
        status,
        status_text: statusText,
        status_emoji: statusEmoji
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyStatus({ status, status_text: statusText, status_emoji: statusEmoji });
      setShowStatusMenu(false);
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleInsertMention = (userName) => {
    const cursorPos = messageInputRef.current?.selectionStart || messageInput.length;
    const beforeCursor = messageInput.slice(0, cursorPos);
    const afterCursor = messageInput.slice(cursorPos);
    
    // Find where the @ started
    const atIndex = beforeCursor.lastIndexOf('@');
    const newContent = beforeCursor.slice(0, atIndex) + `@${userName} ` + afterCursor;
    
    setMessageInput(newContent);
    setShowMentionPicker(false);
    setMentionSearch('');
    messageInputRef.current?.focus();
  };

  const handleInsertQuickReply = (content) => {
    setMessageInput(content);
    setShowQuickReplies(false);
    messageInputRef.current?.focus();
  };

  const handleCreateQuickReply = async (title, content, shortcut) => {
    try {
      await axios.post(`${API}/collaborations/quick-replies`, {
        title,
        content,
        shortcut
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Quick reply saved');
      fetchQuickReplies();
    } catch (error) {
      toast.error('Failed to save quick reply');
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateGroup = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const getUserName = (userId) => {
    const u = users.find(u => u.id === userId);
    return u?.name || 'Unknown';
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  const getRandomColor = (str) => {
    const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-red-500', 'bg-teal-500'];
    let hash = 0;
    for (let i = 0; i < str?.length || 0; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getStatusIcon = (status) => {
    const opt = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[3];
    const Icon = opt.icon;
    return <Icon size={8} className={opt.color} />;
  };

  const toggleCategory = (categoryId) => {
    setCollapsedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Group channels by category
  const groupedChannels = channels.reduce((acc, channel) => {
    const catId = channel.category_id || 'uncategorized';
    if (!acc[catId]) acc[catId] = [];
    acc[catId].push(channel);
    return acc;
  }, {});

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const dateKey = new Date(msg.created_at).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  // Filter users for mention picker
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(mentionSearch.toLowerCase()) &&
    u.id !== user?.id
  );

  // Check if user is admin
  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  return (
    <div className="h-[calc(100vh-64px)] flex bg-slate-50 dark:bg-slate-900">
      {/* Left Sidebar */}
      <div className="w-72 bg-slate-800 dark:bg-slate-950 text-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="text-indigo-400" size={24} />
            Collaborations
          </h1>
        </div>

        {/* Search */}
        <div className="p-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search..."
              className="pl-9 pr-9 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 h-9"
            />
            <button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-600 rounded"
            >
              <Filter size={14} className="text-slate-400" />
            </button>
          </div>
          
          {/* Advanced Search Filters */}
          {showAdvancedSearch && (
            <div className="bg-slate-700 rounded-lg p-3 space-y-2 text-sm">
              <select
                value={searchFilters.type}
                onChange={(e) => setSearchFilters({ ...searchFilters, type: e.target.value })}
                className="w-full bg-slate-600 border-slate-500 rounded px-2 py-1 text-white"
              >
                <option value="">All types</option>
                <option value="messages">Messages</option>
                <option value="files">Files</option>
                <option value="polls">Polls</option>
              </select>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={searchFilters.date_from}
                  onChange={(e) => setSearchFilters({ ...searchFilters, date_from: e.target.value })}
                  className="flex-1 bg-slate-600 border-slate-500 rounded px-2 py-1 text-white"
                  placeholder="From"
                />
                <input
                  type="date"
                  value={searchFilters.date_to}
                  onChange={(e) => setSearchFilters({ ...searchFilters, date_to: e.target.value })}
                  className="flex-1 bg-slate-600 border-slate-500 rounded px-2 py-1 text-white"
                  placeholder="To"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={searchFilters.has_attachments}
                  onChange={(e) => setSearchFilters({ ...searchFilters, has_attachments: e.target.checked })}
                  className="rounded"
                />
                <span className="text-slate-300">Has attachments</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={searchFilters.is_pinned}
                  onChange={(e) => setSearchFilters({ ...searchFilters, is_pinned: e.target.checked })}
                  className="rounded"
                />
                <span className="text-slate-300">Pinned only</span>
              </label>
              <Button size="sm" onClick={handleSearch} className="w-full bg-indigo-600 hover:bg-indigo-700">
                Search
              </Button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          {/* Quick Links */}
          <div className="px-3 py-2">
            <button
              onClick={() => setActiveView('mentions')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeView === 'mentions' ? 'bg-indigo-600' : 'hover:bg-slate-700'
              }`}
            >
              <AtSign size={16} /> Mentions
              {myMentions.length > 0 && (
                <span className="ml-auto bg-red-500 text-xs px-1.5 rounded-full">{myMentions.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveView('files')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeView === 'files' ? 'bg-indigo-600' : 'hover:bg-slate-700'
              }`}
            >
              <Folder size={16} /> All Files
            </button>
            <button
              onClick={() => setActiveView('tasks')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeView === 'tasks' ? 'bg-indigo-600' : 'hover:bg-slate-700'
              }`}
            >
              <CheckSquare size={16} /> Tasks
              {tasks.filter(t => t.status !== 'done').length > 0 && (
                <span className="ml-auto bg-red-500 text-xs px-1.5 rounded-full">
                  {tasks.filter(t => t.status !== 'done').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveView('saved')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeView === 'saved' ? 'bg-indigo-600' : 'hover:bg-slate-700'
              }`}
            >
              <Bookmark size={16} /> Saved Items
            </button>
          </div>

          {/* Categories & Channels */}
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Channels</span>
              <button 
                onClick={() => setShowCreateChannel(true)}
                className="p-1 hover:bg-slate-700 rounded"
              >
                <Plus size={14} />
              </button>
            </div>
            
            {/* Categorized Channels */}
            {categories.map(category => (
              <div key={category.id} className="mb-2">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  {collapsedCategories.includes(category.id) ? (
                    <ChevronRight size={12} />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                  {category.name}
                </button>
                {!collapsedCategories.includes(category.id) && (
                  <div className="ml-2">
                    {(groupedChannels[category.id] || []).map(channel => (
                      <ChannelButton
                        key={channel.id}
                        channel={channel}
                        isSelected={selectedChannel?.id === channel.id && activeView === 'channels'}
                        unreadCount={unreadCounts[channel.id]}
                        onClick={() => {
                          setSelectedChannel(channel);
                          setActiveView('channels');
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* Uncategorized Channels */}
            {(groupedChannels['uncategorized'] || []).map(channel => (
              <ChannelButton
                key={channel.id}
                channel={channel}
                isSelected={selectedChannel?.id === channel.id && activeView === 'channels'}
                unreadCount={unreadCounts[channel.id]}
                onClick={() => {
                  setSelectedChannel(channel);
                  setActiveView('channels');
                }}
              />
            ))}
            
            {channels.length === 0 && (
              <p className="text-xs text-slate-500 px-3 py-2">No channels yet</p>
            )}
          </div>

          {/* Direct Messages */}
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Direct Messages</span>
              <button 
                onClick={() => setShowUserList(true)}
                className="p-1 hover:bg-slate-700 rounded"
              >
                <Plus size={14} />
              </button>
            </div>
            {directMessages.map(dm => (
              <button
                key={dm.id}
                onClick={() => {
                  setSelectedChannel(dm);
                  setActiveView('dms');
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedChannel?.id === dm.id && activeView === 'dms'
                    ? 'bg-indigo-600' 
                    : 'hover:bg-slate-700 text-slate-300'
                }`}
              >
                <div className="relative">
                  <div className={`w-6 h-6 rounded-full ${getRandomColor(dm.other_user?.name)} flex items-center justify-center text-xs font-medium`}>
                    {getInitials(dm.other_user?.name)}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5">
                    {getStatusIcon(userStatuses[dm.other_user?.id]?.status || 'offline')}
                  </div>
                </div>
                <span className="truncate flex-1">{dm.other_user?.name || 'Unknown'}</span>
                {unreadCounts[dm.id] > 0 && (
                  <span className="bg-red-500 text-xs px-1.5 rounded-full">{unreadCounts[dm.id]}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* User Status */}
        <div className="p-3 border-t border-slate-700">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className="w-full flex items-center gap-3 p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <div className="relative">
              <div className={`w-9 h-9 rounded-full ${getRandomColor(user?.full_name)} flex items-center justify-center text-sm font-medium`}>
                {getInitials(user?.full_name)}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-800">
                {getStatusIcon(myStatus.status)}
              </div>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-xs text-slate-400 truncate">
                {myStatus.status_emoji} {myStatus.status_text || STATUS_OPTIONS.find(s => s.value === myStatus.status)?.label}
              </p>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          
          {/* Status Menu */}
          {showStatusMenu && (
            <div className="absolute bottom-16 left-3 w-64 bg-slate-700 rounded-lg shadow-xl border border-slate-600 p-2 z-50">
              <p className="text-xs text-slate-400 px-2 mb-2">Set your status</p>
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleUpdateStatus(opt.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-slate-600 transition-colors ${
                    myStatus.status === opt.value ? 'bg-slate-600' : ''
                  }`}
                >
                  <opt.icon size={12} className={opt.color} />
                  {opt.label}
                </button>
              ))}
              <hr className="border-slate-600 my-2" />
              <div className="px-2">
                <Input
                  value={myStatus.status_text || ''}
                  onChange={(e) => setMyStatus({ ...myStatus, status_text: e.target.value })}
                  placeholder="What's your status?"
                  className="bg-slate-600 border-slate-500 text-white text-sm h-8"
                />
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(myStatus.status, myStatus.status_text)}
                  className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 h-8"
                >
                  Save Status
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mentions View */}
        {activeView === 'mentions' && !searchResults && (
          <MentionsView 
            mentions={myMentions} 
            formatTime={formatTime}
            onGoToMessage={(msg) => {
              const channel = channels.find(c => c.id === msg.channel_id);
              if (channel) {
                setSelectedChannel(channel);
                setActiveView('channels');
              }
            }}
          />
        )}

        {/* Files View */}
        {activeView === 'files' && !searchResults && (
          <FilesView files={files} formatTime={formatTime} />
        )}

        {/* Tasks View */}
        {activeView === 'tasks' && !searchResults && (
          <TasksView
            tasks={tasks}
            users={users}
            onCreateTask={() => setShowCreateTask(true)}
            onUpdateStatus={handleUpdateTaskStatus}
          />
        )}

        {/* Saved Items View */}
        {activeView === 'saved' && !searchResults && (
          <SavedItemsView savedItems={savedItems} formatTime={formatTime} />
        )}

        {/* Search Results */}
        {searchResults && (
          <SearchResultsView
            results={searchResults}
            query={searchQuery}
            formatTime={formatTime}
            onClear={() => setSearchResults(null)}
            onSelectChannel={(channel) => {
              setSelectedChannel(channel);
              setSearchResults(null);
              setActiveView('channels');
            }}
          />
        )}

        {/* Chat View */}
        {(activeView === 'channels' || activeView === 'dms') && selectedChannel && !searchResults && (
          <>
            {/* Channel Header */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex items-center gap-3">
                {selectedChannel.type === 'direct' ? (
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full ${getRandomColor(selectedChannel.other_user?.name)} flex items-center justify-center font-medium`}>
                      {getInitials(selectedChannel.other_user?.name)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5">
                      {getStatusIcon(userStatuses[selectedChannel.other_user?.id]?.status || 'offline')}
                    </div>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    {selectedChannel.type === 'private' ? (
                      <Lock className="text-indigo-600 dark:text-indigo-400" size={20} />
                    ) : (
                      <Hash className="text-indigo-600 dark:text-indigo-400" size={20} />
                    )}
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-slate-800 dark:text-white">
                    {selectedChannel.type === 'direct' ? selectedChannel.other_user?.name : selectedChannel.name}
                  </h2>
                  {selectedChannel.description && (
                    <p className="text-xs text-slate-500">{selectedChannel.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowMembersPanel(!showMembersPanel)}
                  className="text-slate-500"
                >
                  <Users size={18} />
                  <span className="ml-1 text-xs">{channelMembers.length}</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowCreatePoll(true)}
                  className="text-slate-500"
                  title="Create Poll"
                >
                  <BarChart3 size={18} />
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-500">
                  <Pin size={18} />
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-500">
                  <Settings size={18} />
                </Button>
              </div>
            </div>

            {/* Messages with Members Panel */}
            <div className="flex-1 flex overflow-hidden">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="animate-spin text-indigo-600" size={24} />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
                    <div key={dateKey}>
                      {/* Date Divider */}
                      <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                        <span className="text-xs text-slate-500 font-medium">{formatDateGroup(dateKey)}</span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                      </div>
                      
                      {/* Messages */}
                      {dayMessages.map((msg, index) => (
                        <MessageItem
                          key={msg.id}
                          message={msg}
                          isOwn={msg.sender_id === user?.id}
                          showAvatar={index === 0 || dayMessages[index - 1]?.sender_id !== msg.sender_id}
                          polls={polls}
                          user={user}
                          formatTime={formatTime}
                          getInitials={getInitials}
                          getRandomColor={getRandomColor}
                          onReaction={handleReaction}
                          onPin={handlePinMessage}
                          onSave={handleSaveItem}
                          onDelete={handleDeleteMessage}
                          onThread={fetchThread}
                          onVotePoll={handleVotePoll}
                          showEmojiPicker={showEmojiPicker}
                          setShowEmojiPicker={setShowEmojiPicker}
                          selectedChannelId={selectedChannel.id}
                        />
                      ))}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Members Panel */}
              {showMembersPanel && (
                <div className="w-64 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 overflow-y-auto">
                  <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Members ({channelMembers.length})</h3>
                  <div className="space-y-3">
                    {channelMembers.map(member => (
                      <div key={member.id} className="flex items-center gap-3">
                        <div className="relative">
                          <div className={`w-8 h-8 rounded-full ${getRandomColor(member.name)} flex items-center justify-center text-xs font-medium text-white`}>
                            {getInitials(member.name)}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5">
                            {getStatusIcon(member.status)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{member.name}</p>
                          <p className="text-xs text-slate-500 truncate">{member.status_text || member.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              {/* Formatting Toolbar */}
              <div className="flex items-center gap-1 mb-2">
                <button 
                  onClick={() => setMessageInput(prev => prev + '**bold**')}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500"
                  title="Bold"
                >
                  <Bold size={16} />
                </button>
                <button 
                  onClick={() => setMessageInput(prev => prev + '*italic*')}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500"
                  title="Italic"
                >
                  <Italic size={16} />
                </button>
                <button 
                  onClick={() => setMessageInput(prev => prev + '`code`')}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500"
                  title="Code"
                >
                  <Code size={16} />
                </button>
                <button 
                  onClick={() => setMessageInput(prev => prev + '[text](url)')}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500"
                  title="Link"
                >
                  <Link size={16} />
                </button>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-1" />
                <button 
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500"
                  title="Quick Replies"
                >
                  <Zap size={16} />
                </button>
              </div>
              
              {/* Quick Replies Dropdown */}
              {showQuickReplies && (
                <div className="mb-2 bg-slate-50 dark:bg-slate-700 rounded-lg p-2 max-h-40 overflow-y-auto">
                  {quickReplies.length > 0 ? (
                    quickReplies.map(reply => (
                      <button
                        key={reply.id}
                        onClick={() => handleInsertQuickReply(reply.content)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-sm"
                      >
                        <span className="font-medium text-slate-800 dark:text-white">{reply.title}</span>
                        {reply.shortcut && (
                          <span className="text-slate-400 ml-2">{reply.shortcut}</span>
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-2">No quick replies yet</p>
                  )}
                </div>
              )}
              
              <div className="flex items-end gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <Paperclip size={20} />
                </Button>
                <div className="flex-1 relative">
                  <Textarea
                    ref={messageInputRef}
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      // Check for @ mention trigger
                      const lastChar = e.target.value[e.target.selectionStart - 1];
                      if (lastChar === '@') {
                        setShowMentionPicker(true);
                        setMentionSearch('');
                      } else if (showMentionPicker) {
                        const cursorPos = e.target.selectionStart;
                        const textBefore = e.target.value.slice(0, cursorPos);
                        const atIndex = textBefore.lastIndexOf('@');
                        if (atIndex >= 0) {
                          setMentionSearch(textBefore.slice(atIndex + 1));
                        } else {
                          setShowMentionPicker(false);
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                      if (e.key === 'Escape') {
                        setShowMentionPicker(false);
                      }
                    }}
                    placeholder={`Message ${selectedChannel.type === 'direct' ? selectedChannel.other_user?.name : '#' + selectedChannel.name}. Use @mention, **bold**, *italic*, \`code\``}
                    className="min-h-[44px] max-h-32 resize-none pr-12 dark:bg-slate-700 dark:border-slate-600 text-sm"
                    rows={1}
                  />
                  
                  {/* Mention Picker */}
                  {showMentionPicker && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-slate-700 rounded-lg shadow-xl border border-slate-200 dark:border-slate-600 max-h-48 overflow-y-auto z-50">
                      <p className="text-xs text-slate-500 px-3 py-2 border-b border-slate-200 dark:border-slate-600">
                        Mention someone
                      </p>
                      {filteredUsers.slice(0, 8).map(u => (
                        <button
                          key={u.id}
                          onClick={() => handleInsertMention(u.name.split(' ')[0])}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-600"
                        >
                          <div className={`w-6 h-6 rounded-full ${getRandomColor(u.name)} flex items-center justify-center text-xs font-medium text-white`}>
                            {getInitials(u.name)}
                          </div>
                          <span className="text-sm text-slate-800 dark:text-white">{u.name}</span>
                        </button>
                      ))}
                      {filteredUsers.length === 0 && (
                        <p className="text-sm text-slate-500 text-center py-3">No users found</p>
                      )}
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendingMessage}
                  className="bg-indigo-600 hover:bg-indigo-700 h-11"
                >
                  {sendingMessage ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* No Channel Selected */}
        {!selectedChannel && !searchResults && (activeView === 'channels' || activeView === 'dms') && (
          <WelcomeView
            dashboard={dashboard}
            onCreateChannel={() => setShowCreateChannel(true)}
            onStartDM={() => setShowUserList(true)}
          />
        )}
      </div>

      {/* Thread Panel */}
      {showThread && (
        <ThreadPanel
          thread={showThread}
          replies={threadMessages}
          user={user}
          formatTime={formatTime}
          getInitials={getInitials}
          getRandomColor={getRandomColor}
          onClose={() => setShowThread(null)}
          onSendReply={(content) => handleSendThreadReply(showThread.id, content)}
        />
      )}

      {/* Dialogs */}
      <CreateChannelDialog
        open={showCreateChannel}
        onOpenChange={setShowCreateChannel}
        form={channelForm}
        setForm={setChannelForm}
        categories={categories}
        onSubmit={handleCreateChannel}
      />

      <UserListDialog
        open={showUserList}
        onOpenChange={setShowUserList}
        users={users.filter(u => u.id !== user?.id)}
        userStatuses={userStatuses}
        getInitials={getInitials}
        getRandomColor={getRandomColor}
        getStatusIcon={getStatusIcon}
        onSelectUser={handleCreateDM}
      />

      <CreateTaskDialog
        open={showCreateTask}
        onOpenChange={setShowCreateTask}
        form={taskForm}
        setForm={setTaskForm}
        users={users}
        onSubmit={handleCreateTask}
      />

      <CreatePollDialog
        open={showCreatePoll}
        onOpenChange={setShowCreatePoll}
        form={pollForm}
        setForm={setPollForm}
        onSubmit={handleCreatePoll}
      />
    </div>
  );
};

// ============= SUBCOMPONENTS =============

const ChannelButton = ({ channel, isSelected, unreadCount, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
      isSelected
        ? 'bg-indigo-600 text-white' 
        : 'hover:bg-slate-700 text-slate-300'
    }`}
  >
    {channel.type === 'private' ? <Lock size={14} /> : <Hash size={14} />}
    <span className="truncate flex-1 text-left">{channel.name}</span>
    {unreadCount > 0 && (
      <span className="bg-red-500 text-white text-xs px-1.5 rounded-full">{unreadCount}</span>
    )}
  </button>
);

const MessageItem = ({ 
  message: msg, 
  isOwn, 
  showAvatar, 
  polls, 
  user, 
  formatTime, 
  getInitials, 
  getRandomColor,
  onReaction,
  onPin,
  onSave,
  onDelete,
  onThread,
  onVotePoll,
  showEmojiPicker,
  setShowEmojiPicker,
  selectedChannelId
}) => {
  if (msg.content_type === 'system') {
    return (
      <div className="text-center my-4">
        <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
          {msg.content}
        </span>
      </div>
    );
  }

  // Check if this is a poll message
  const pollAttachment = msg.attachments?.find(a => a.type === 'poll');
  const poll = pollAttachment ? polls.find(p => p.id === pollAttachment.poll_id) : null;

  return (
    <div className={`flex gap-3 group mb-4 ${isOwn ? 'justify-end' : ''}`}>
      {!isOwn && showAvatar && (
        <div className={`w-9 h-9 rounded-full ${getRandomColor(msg.sender_name)} flex items-center justify-center text-xs font-medium text-white flex-shrink-0`}>
          {getInitials(msg.sender_name)}
        </div>
      )}
      {!isOwn && !showAvatar && <div className="w-9" />}
      
      <div className={`max-w-[70%] ${isOwn ? 'order-first' : ''}`}>
        {showAvatar && !isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-slate-800 dark:text-white">{msg.sender_name}</span>
            <span className="text-xs text-slate-400">{formatTime(msg.created_at)}</span>
          </div>
        )}
        
        {/* Poll Content */}
        {poll && (
          <div className="bg-white dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600 mb-2">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="text-indigo-500" size={18} />
              <span className="font-semibold text-slate-800 dark:text-white">{poll.question}</span>
            </div>
            <div className="space-y-2">
              {poll.options.map(opt => {
                const totalVotes = poll.options.reduce((sum, o) => sum + (o.votes?.length || 0), 0);
                const percentage = totalVotes > 0 ? Math.round((opt.votes?.length || 0) / totalVotes * 100) : 0;
                const hasVoted = opt.votes?.includes(user?.id);
                
                return (
                  <button
                    key={opt.id}
                    onClick={() => !poll.is_closed && onVotePoll(poll.id, opt.id)}
                    disabled={poll.is_closed}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      hasVoted 
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' 
                        : 'border-slate-200 dark:border-slate-600 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-800 dark:text-white">{opt.text}</span>
                      <span className="text-xs text-slate-500">{opt.votes?.length || 0} votes</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
            {poll.is_closed && (
              <p className="text-xs text-slate-500 mt-2">Poll closed</p>
            )}
          </div>
        )}
        
        {/* Regular Message or Image */}
        {!poll && (
          <div className={`relative rounded-2xl px-4 py-2 ${
            isOwn 
              ? 'bg-indigo-600 text-white' 
              : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600'
          }`}>
            {msg.is_pinned && (
              <Pin size={12} className={`absolute -top-2 -right-2 ${isOwn ? 'text-amber-300' : 'text-amber-500'}`} />
            )}
            
            {/* Image Attachment */}
            {msg.content_type === 'image' && msg.attachments?.[0] && (
              <img 
                src={`${process.env.REACT_APP_BACKEND_URL}${msg.attachments[0].url}`}
                alt={msg.attachments[0].original_name}
                className="max-w-full rounded-lg mb-2"
              />
            )}
            
            {/* Text Content */}
            {msg.content && (
              <p 
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: formatMessageContent(msg.content) }}
              />
            )}
            
            {/* File Attachments */}
            {msg.content_type === 'file' && msg.attachments?.length > 0 && (
              <div className="mt-2 space-y-1">
                {msg.attachments.map((att, i) => (
                  <a 
                    key={i}
                    href={`${process.env.REACT_APP_BACKEND_URL}${att.url}`}
                    download
                    className={`flex items-center gap-2 text-sm ${isOwn ? 'text-indigo-200 hover:text-white' : 'text-indigo-600 hover:text-indigo-700'}`}
                  >
                    <Paperclip size={14} />
                    {att.original_name}
                  </a>
                ))}
              </div>
            )}
            
            {msg.is_edited && (
              <span className={`text-xs ${isOwn ? 'text-indigo-200' : 'text-slate-400'}`}> (edited)</span>
            )}
          </div>
        )}
        
        {/* Reactions */}
        {Object.keys(msg.reactions || {}).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(msg.reactions).map(([emoji, userIds]) => (
              userIds.length > 0 && (
                <button
                  key={emoji}
                  onClick={() => onReaction(msg.id, emoji)}
                  className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${
                    userIds.includes(user?.id)
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {emoji} {userIds.length}
                </button>
              )
            ))}
          </div>
        )}
        
        {/* Thread indicator */}
        {msg.thread_count > 0 && (
          <button
            onClick={() => onThread(msg.id)}
            className="text-xs text-indigo-600 hover:text-indigo-700 mt-1 flex items-center gap-1"
          >
            <Reply size={12} /> {msg.thread_count} replies
          </button>
        )}
        
        {/* Message Actions */}
        <div className={`flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'justify-end' : ''}`}>
          <button
            onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"
            title="React"
          >
            <Smile size={14} className="text-slate-400" />
          </button>
          <button
            onClick={() => onThread(msg.id)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"
            title="Reply in thread"
          >
            <Reply size={14} className="text-slate-400" />
          </button>
          <button
            onClick={() => onSave('message', msg.id, selectedChannelId)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"
            title="Save"
          >
            <Bookmark size={14} className="text-slate-400" />
          </button>
          <button
            onClick={() => onPin(msg.id, msg.is_pinned)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"
            title={msg.is_pinned ? "Unpin" : "Pin"}
          >
            <Pin size={14} className={msg.is_pinned ? 'text-amber-500' : 'text-slate-400'} />
          </button>
          {isOwn && (
            <button
              onClick={() => onDelete(msg.id)}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
              title="Delete"
            >
              <Trash2 size={14} className="text-red-400" />
            </button>
          )}
        </div>
        
        {/* Emoji Picker */}
        {showEmojiPicker === msg.id && (
          <div className="absolute mt-1 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 p-2 flex flex-wrap gap-1 z-10 max-w-[200px]">
            {EMOJI_LIST.map(emoji => (
              <button
                key={emoji}
                onClick={() => onReaction(msg.id, emoji)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-600 rounded text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ThreadPanel = ({ thread, replies, user, formatTime, getInitials, getRandomColor, onClose, onSendReply }) => {
  const [content, setContent] = useState('');
  
  return (
    <div className="w-96 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col">
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-800 dark:text-white">Thread</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X size={18} />
        </Button>
      </div>
      
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-6 h-6 rounded-full ${getRandomColor(thread.sender_name)} flex items-center justify-center text-xs font-medium text-white`}>
            {getInitials(thread.sender_name)}
          </div>
          <span className="font-medium text-sm text-slate-800 dark:text-white">{thread.sender_name}</span>
          <span className="text-xs text-slate-400">{formatTime(thread.created_at)}</span>
        </div>
        <p 
          className="text-slate-700 dark:text-slate-300"
          dangerouslySetInnerHTML={{ __html: formatMessageContent(thread.content) }}
        />
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {replies.map(reply => (
          <div key={reply.id} className="flex gap-2">
            <div className={`w-6 h-6 rounded-full ${getRandomColor(reply.sender_name)} flex items-center justify-center text-xs font-medium text-white flex-shrink-0`}>
              {getInitials(reply.sender_name)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-medium text-xs text-slate-800 dark:text-white">{reply.sender_name}</span>
                <span className="text-xs text-slate-400">{formatTime(reply.created_at)}</span>
              </div>
              <p 
                className="text-sm text-slate-700 dark:text-slate-300"
                dangerouslySetInnerHTML={{ __html: formatMessageContent(reply.content) }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex gap-2">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && content.trim()) {
                onSendReply(content);
                setContent('');
              }
            }}
            placeholder="Reply..."
            className="dark:bg-slate-700 dark:border-slate-600"
          />
          <Button 
            onClick={() => {
              if (content.trim()) {
                onSendReply(content);
                setContent('');
              }
            }} 
            size="sm" 
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

const WelcomeView = ({ dashboard, onCreateChannel, onStartDM }) => (
  <div className="flex-1 flex items-center justify-center">
    <div className="text-center max-w-2xl">
      <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <MessageSquare className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
        Welcome to Collaborations
      </h2>
      <p className="text-slate-500 mb-6">
        Your central hub for team communication, file sharing, and productivity.
      </p>
      <div className="flex gap-3 justify-center mb-8">
        <Button onClick={onCreateChannel} className="bg-indigo-600 hover:bg-indigo-700">
          <Hash size={16} className="mr-2" /> Create Channel
        </Button>
        <Button variant="outline" onClick={onStartDM}>
          <MessageCircle size={16} className="mr-2" /> Start DM
        </Button>
      </div>
      
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <Hash className="text-indigo-500 mb-2" size={24} />
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{dashboard.total_channels}</p>
            <p className="text-xs text-slate-500">Channels</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <MessageSquare className="text-green-500 mb-2" size={24} />
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{dashboard.messages_today}</p>
            <p className="text-xs text-slate-500">Messages Today</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <File className="text-amber-500 mb-2" size={24} />
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{dashboard.total_files}</p>
            <p className="text-xs text-slate-500">Files Shared</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <Users className="text-purple-500 mb-2" size={24} />
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{dashboard.active_users}</p>
            <p className="text-xs text-slate-500">Active Users</p>
          </div>
        </div>
      )}
    </div>
  </div>
);

const MentionsView = ({ mentions, formatTime, onGoToMessage }) => (
  <div className="flex-1 p-6 overflow-y-auto">
    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
      <AtSign className="text-indigo-500" /> Mentions
    </h2>
    {mentions.length > 0 ? (
      <div className="space-y-3">
        {mentions.map(msg => (
          <div 
            key={msg.id} 
            className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 cursor-pointer transition-colors"
            onClick={() => onGoToMessage(msg)}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-slate-800 dark:text-white">{msg.sender_name}</span>
              <span className="text-xs text-slate-400">{formatTime(msg.created_at)}</span>
            </div>
            <p 
              className="text-slate-600 dark:text-slate-300"
              dangerouslySetInnerHTML={{ __html: formatMessageContent(msg.content) }}
            />
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-12">
        <AtSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">No mentions yet</p>
      </div>
    )}
  </div>
);

const FilesView = ({ files, formatTime }) => (
  <div className="flex-1 p-6 overflow-y-auto">
    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
      <Folder className="text-amber-500" /> All Files
    </h2>
    {files.length > 0 ? (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {files.map(file => {
          const FileIcon = FILE_ICONS[file.file_type] || File;
          const isImage = file.file_type === 'image';
          
          return (
            <div key={file.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
              {isImage ? (
                <img 
                  src={`${process.env.REACT_APP_BACKEND_URL}${file.url}`}
                  alt={file.original_name}
                  className="w-full h-24 object-cover rounded-lg mb-3"
                />
              ) : (
                <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg w-fit mb-3">
                  <FileIcon className="text-indigo-500" size={24} />
                </div>
              )}
              <p className="font-medium text-sm truncate text-slate-800 dark:text-white">{file.original_name}</p>
              <p className="text-xs text-slate-400 mt-1">
                {(file.size / 1024).toFixed(1)} KB • {formatTime(file.created_at)}
              </p>
              <a
                href={`${process.env.REACT_APP_BACKEND_URL}${file.url}`}
                download
                className="mt-3 flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
              >
                <Download size={12} /> Download
              </a>
            </div>
          );
        })}
      </div>
    ) : (
      <div className="text-center py-12">
        <Folder className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">No files shared yet</p>
      </div>
    )}
  </div>
);

const TasksView = ({ tasks, users, onCreateTask, onUpdateStatus }) => (
  <div className="flex-1 p-6 overflow-y-auto">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
        <CheckSquare className="text-green-500" /> Tasks
      </h2>
      <Button onClick={onCreateTask} className="bg-indigo-600 hover:bg-indigo-700">
        <Plus size={16} className="mr-1" /> New Task
      </Button>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* To Do */}
      <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4">
        <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <Circle size={16} className="text-slate-400" /> To Do
        </h3>
        <div className="space-y-2">
          {tasks.filter(t => t.status === 'todo').map(task => (
            <TaskCard key={task.id} task={task} onUpdateStatus={onUpdateStatus} nextStatus="in_progress" nextLabel="Start" />
          ))}
        </div>
      </div>
      
      {/* In Progress */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
        <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
          <Clock size={16} /> In Progress
        </h3>
        <div className="space-y-2">
          {tasks.filter(t => t.status === 'in_progress').map(task => (
            <TaskCard key={task.id} task={task} onUpdateStatus={onUpdateStatus} nextStatus="done" nextLabel="Complete" />
          ))}
        </div>
      </div>
      
      {/* Done */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
        <h3 className="font-semibold text-green-700 dark:text-green-300 mb-3 flex items-center gap-2">
          <CheckCircle2 size={16} /> Done
        </h3>
        <div className="space-y-2">
          {tasks.filter(t => t.status === 'done').slice(0, 5).map(task => (
            <div key={task.id} className="bg-white dark:bg-slate-700 rounded-lg p-3 shadow-sm opacity-75">
              <p className="font-medium text-sm text-slate-800 dark:text-white line-through">{task.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const TaskCard = ({ task, onUpdateStatus, nextStatus, nextLabel }) => (
  <div className="bg-white dark:bg-slate-700 rounded-lg p-3 shadow-sm">
    <p className="font-medium text-sm text-slate-800 dark:text-white">{task.title}</p>
    {task.assignee_name && (
      <p className="text-xs text-slate-500 mt-1">→ {task.assignee_name}</p>
    )}
    {task.due_date && (
      <p className="text-xs text-slate-400 mt-1">Due: {new Date(task.due_date).toLocaleDateString()}</p>
    )}
    <div className="flex items-center gap-2 mt-2">
      <Button 
        size="sm" 
        variant="outline" 
        className="h-7 text-xs"
        onClick={() => onUpdateStatus(task.id, nextStatus)}
      >
        {nextLabel}
      </Button>
    </div>
  </div>
);

const SavedItemsView = ({ savedItems, formatTime }) => (
  <div className="flex-1 p-6 overflow-y-auto">
    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
      <Bookmark className="text-purple-500" /> Saved Items
    </h2>
    {savedItems.length > 0 ? (
      <div className="space-y-3">
        {savedItems.map(item => (
          <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            {item.item_type === 'message' && item.content && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle size={16} className="text-indigo-500" />
                  <span className="font-medium text-slate-800 dark:text-white">{item.content.sender_name}</span>
                  <span className="text-xs text-slate-400">{formatTime(item.content.created_at)}</span>
                </div>
                <p 
                  className="text-slate-600 dark:text-slate-300"
                  dangerouslySetInnerHTML={{ __html: formatMessageContent(item.content.content) }}
                />
              </div>
            )}
            {item.item_type === 'file' && item.content && (
              <div className="flex items-center gap-3">
                <File className="text-indigo-500" size={24} />
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">{item.content.original_name}</p>
                  <p className="text-xs text-slate-400">{(item.content.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-12">
        <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">No saved items yet</p>
      </div>
    )}
  </div>
);

const SearchResultsView = ({ results, query, formatTime, onClear, onSelectChannel }) => (
  <div className="flex-1 p-6 overflow-y-auto">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white">
        Search Results for "{query}"
      </h2>
      <Button variant="outline" size="sm" onClick={onClear}>
        <X size={16} className="mr-1" /> Clear
      </Button>
    </div>
    
    {results.messages?.length > 0 && (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-500 mb-3">Messages ({results.messages.length})</h3>
        <div className="space-y-2">
          {results.messages.map(msg => (
            <div key={msg.id} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-slate-800 dark:text-white">{msg.sender_name}</span>
                <span className="text-xs text-slate-400">{formatTime(msg.created_at)}</span>
              </div>
              <p 
                className="text-slate-600 dark:text-slate-300"
                dangerouslySetInnerHTML={{ __html: formatMessageContent(msg.content) }}
              />
            </div>
          ))}
        </div>
      </div>
    )}
    
    {results.files?.length > 0 && (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-500 mb-3">Files ({results.files.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {results.files.map(file => {
            const FileIcon = FILE_ICONS[file.file_type] || File;
            return (
              <div key={file.id} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <FileIcon className="text-indigo-500 mb-2" size={24} />
                <p className="font-medium text-sm truncate text-slate-800 dark:text-white">{file.original_name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            );
          })}
        </div>
      </div>
    )}
    
    {results.polls?.length > 0 && (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-500 mb-3">Polls ({results.polls.length})</h3>
        <div className="space-y-2">
          {results.polls.map(poll => (
            <div key={poll.id} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <BarChart3 className="text-indigo-500" size={18} />
                <span className="font-medium text-slate-800 dark:text-white">{poll.question}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{poll.options.length} options</p>
            </div>
          ))}
        </div>
      </div>
    )}
    
    {!results.messages?.length && !results.files?.length && !results.polls?.length && (
      <div className="text-center py-12">
        <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">No results found</p>
      </div>
    )}
  </div>
);

// ============= DIALOGS =============

const CreateChannelDialog = ({ open, onOpenChange, form, setForm, categories, onSubmit }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="bg-white dark:bg-slate-800">
      <DialogHeader>
        <DialogTitle className="text-slate-900 dark:text-white">Create Channel</DialogTitle>
        <DialogDescription className="text-slate-500">
          Create a new channel for your team to collaborate
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Channel Name *
          </label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
            placeholder="e.g., general, marketing, engineering"
            className="dark:bg-slate-700 dark:border-slate-600"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Description
          </label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What's this channel about?"
            className="dark:bg-slate-700 dark:border-slate-600"
            rows={2}
          />
        </div>
        
        {categories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            >
              <option value="">No category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Visibility
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setForm({ ...form, type: 'public' })}
              className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                form.type === 'public'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
            >
              <Hash className={form.type === 'public' ? 'text-indigo-600' : 'text-slate-400'} size={20} />
              <p className="font-medium text-sm mt-1 text-slate-800 dark:text-white">Public</p>
              <p className="text-xs text-slate-500">Anyone can join</p>
            </button>
            <button
              onClick={() => setForm({ ...form, type: 'private' })}
              className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                form.type === 'private'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
            >
              <Lock className={form.type === 'private' ? 'text-indigo-600' : 'text-slate-400'} size={20} />
              <p className="font-medium text-sm mt-1 text-slate-800 dark:text-white">Private</p>
              <p className="text-xs text-slate-500">Invite only</p>
            </button>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={onSubmit}
            disabled={!form.name}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Create Channel
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

const UserListDialog = ({ open, onOpenChange, users, userStatuses, getInitials, getRandomColor, getStatusIcon, onSelectUser }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="bg-white dark:bg-slate-800">
      <DialogHeader>
        <DialogTitle className="text-slate-900 dark:text-white">Start Direct Message</DialogTitle>
        <DialogDescription className="text-slate-500">
          Select a team member to start a conversation
        </DialogDescription>
      </DialogHeader>
      
      <div className="mt-4 max-h-96 overflow-y-auto">
        {users.map(u => (
          <button
            key={u.id}
            onClick={() => onSelectUser(u.id)}
            className="w-full flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <div className="relative">
              <div className={`w-10 h-10 rounded-full ${getRandomColor(u.name)} flex items-center justify-center font-medium text-white`}>
                {getInitials(u.name)}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5">
                {getStatusIcon(userStatuses[u.id]?.status || 'offline')}
              </div>
            </div>
            <div className="text-left flex-1">
              <p className="font-medium text-slate-800 dark:text-white">{u.name}</p>
              <p className="text-sm text-slate-500">{u.email}</p>
            </div>
            <span className="text-xs text-slate-400 capitalize">
              {userStatuses[u.id]?.status || 'offline'}
            </span>
          </button>
        ))}
      </div>
    </DialogContent>
  </Dialog>
);

const CreateTaskDialog = ({ open, onOpenChange, form, setForm, users, onSubmit }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="bg-white dark:bg-slate-800">
      <DialogHeader>
        <DialogTitle className="text-slate-900 dark:text-white">Create Task</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Title *
          </label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Task title"
            className="dark:bg-slate-700 dark:border-slate-600"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Description
          </label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Task description"
            className="dark:bg-slate-700 dark:border-slate-600"
            rows={2}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Assignee
            </label>
            <select
              value={form.assignee_id}
              onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Unassigned</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Priority
            </label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Due Date
          </label>
          <Input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            className="dark:bg-slate-700 dark:border-slate-600"
          />
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={onSubmit}
            disabled={!form.title}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Create Task
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

const CreatePollDialog = ({ open, onOpenChange, form, setForm, onSubmit }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="bg-white dark:bg-slate-800">
      <DialogHeader>
        <DialogTitle className="text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="text-indigo-500" /> Create Poll
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Question *
          </label>
          <Input
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            placeholder="What do you want to ask?"
            className="dark:bg-slate-700 dark:border-slate-600"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Options *
          </label>
          {form.options.map((opt, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <Input
                value={opt}
                onChange={(e) => {
                  const newOptions = [...form.options];
                  newOptions[index] = e.target.value;
                  setForm({ ...form, options: newOptions });
                }}
                placeholder={`Option ${index + 1}`}
                className="dark:bg-slate-700 dark:border-slate-600"
              />
              {form.options.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newOptions = form.options.filter((_, i) => i !== index);
                    setForm({ ...form, options: newOptions });
                  }}
                >
                  <X size={16} />
                </Button>
              )}
            </div>
          ))}
          {form.options.length < 6 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setForm({ ...form, options: [...form.options, ''] })}
              className="mt-2"
            >
              <Plus size={14} className="mr-1" /> Add Option
            </Button>
          )}
        </div>
        
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.allow_multiple}
              onChange={(e) => setForm({ ...form, allow_multiple: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">Allow multiple votes</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_anonymous}
              onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">Anonymous voting</span>
          </label>
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={onSubmit}
            disabled={!form.question || form.options.filter(o => o.trim()).length < 2}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Create Poll
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default Collaborations;
