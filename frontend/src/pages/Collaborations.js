import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
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
  CheckSquare,
  Clock,
  Star,
  Folder,
  MessageCircle,
  Bell,
  Archive,
  UserPlus,
  LogOut,
  RefreshCw,
  Circle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Emoji picker (simplified)
const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏', '💯', '✅'];

// File type icons
const FILE_ICONS = {
  document: FileText,
  image: Image,
  video: Video,
  audio: Music,
  other: File
};

const Collaborations = () => {
  const { token, user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // UI State
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [activeView, setActiveView] = useState('channels'); // channels, dms, files, tasks, saved
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showChannelSettings, setShowChannelSettings] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null); // message id or 'input'
  const [showThread, setShowThread] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [showUserList, setShowUserList] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  
  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Form state
  const [channelForm, setChannelForm] = useState({
    name: '',
    description: '',
    type: 'public',
    icon: '#',
    color: '#6366f1'
  });
  
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignee_id: '',
    due_date: '',
    priority: 'medium'
  });

  // Fetch data on mount
  useEffect(() => {
    fetchChannels();
    fetchDirectMessages();
    fetchUsers();
    fetchDashboard();
    fetchTasks();
    fetchSavedItems();
  }, []);

  // Fetch messages when channel changes
  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel.id);
      fetchChannelFiles(selectedChannel.id);
    }
  }, [selectedChannel]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-refresh messages every 5 seconds
  useEffect(() => {
    if (!selectedChannel) return;
    
    const interval = setInterval(() => {
      fetchMessages(selectedChannel.id, true);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [selectedChannel]);

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
      setChannelForm({ name: '', description: '', type: 'public', icon: '#', color: '#6366f1' });
      fetchChannels();
    } catch (error) {
      toast.error('Failed to create channel');
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChannel) return;
    
    try {
      setSendingMessage(true);
      await axios.post(`${API}/collaborations/channels/${selectedChannel.id}/messages`, {
        content: messageInput,
        content_type: 'text'
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
      
      // Send message with file attachment
      await axios.post(`${API}/collaborations/channels/${selectedChannel.id}/messages`, {
        content: `Shared a file: ${file.name}`,
        content_type: 'file',
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
      const res = await axios.get(`${API}/collaborations/search`, {
        params: { q: searchQuery },
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

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  return (
    <div className="h-[calc(100vh-64px)] flex bg-slate-50 dark:bg-slate-900">
      {/* Left Sidebar - Channels & DMs */}
      <div className="w-64 bg-slate-800 dark:bg-slate-950 text-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="text-indigo-400" size={24} />
            Collaborations
          </h1>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search..."
              className="pl-9 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 h-9"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          {/* Quick Links */}
          <div className="px-3 py-2">
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

          {/* Channels */}
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
            {channels.map(channel => (
              <button
                key={channel.id}
                onClick={() => {
                  setSelectedChannel(channel);
                  setActiveView('channels');
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedChannel?.id === channel.id && activeView === 'channels'
                    ? 'bg-indigo-600' 
                    : 'hover:bg-slate-700 text-slate-300'
                }`}
              >
                {channel.type === 'private' ? <Lock size={14} /> : <Hash size={14} />}
                <span className="truncate">{channel.name}</span>
              </button>
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
                <div className={`w-6 h-6 rounded-full ${getRandomColor(dm.other_user?.name)} flex items-center justify-center text-xs font-medium`}>
                  {getInitials(dm.other_user?.name)}
                </div>
                <span className="truncate">{dm.other_user?.name || 'Unknown'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User Info */}
        <div className="p-3 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full ${getRandomColor(user?.full_name)} flex items-center justify-center text-sm font-medium`}>
              {getInitials(user?.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Circle size={8} className="text-green-500 fill-green-500" /> Online
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Search Results */}
        {searchResults && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                Search Results for "{searchQuery}"
              </h2>
              <Button variant="outline" size="sm" onClick={() => setSearchResults(null)}>
                <X size={16} className="mr-1" /> Clear
              </Button>
            </div>
            
            {/* Messages */}
            {searchResults.messages.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-500 mb-3">Messages ({searchResults.messages.length})</h3>
                <div className="space-y-2">
                  {searchResults.messages.map(msg => (
                    <div key={msg.id} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-slate-800 dark:text-white">{msg.sender_name}</span>
                        <span className="text-xs text-slate-400">{formatTime(msg.created_at)}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Files */}
            {searchResults.files.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-500 mb-3">Files ({searchResults.files.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {searchResults.files.map(file => {
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
            
            {/* Channels */}
            {searchResults.channels.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 mb-3">Channels ({searchResults.channels.length})</h3>
                <div className="space-y-2">
                  {searchResults.channels.map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => {
                        setSelectedChannel(channel);
                        setSearchResults(null);
                        setActiveView('channels');
                      }}
                      className="w-full bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 text-left hover:border-indigo-500 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Hash className="text-slate-400" size={18} />
                        <span className="font-medium text-slate-800 dark:text-white">{channel.name}</span>
                      </div>
                      {channel.description && (
                        <p className="text-sm text-slate-500 mt-1">{channel.description}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {searchResults.messages.length === 0 && searchResults.files.length === 0 && searchResults.channels.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No results found</p>
              </div>
            )}
          </div>
        )}

        {/* Files View */}
        {activeView === 'files' && !searchResults && (
          <div className="flex-1 p-6 overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">All Files</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {files.map(file => {
                const FileIcon = FILE_ICONS[file.file_type] || File;
                return (
                  <div key={file.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg w-fit mb-3">
                      <FileIcon className="text-indigo-500" size={24} />
                    </div>
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
              {files.length === 0 && (
                <div className="col-span-4 text-center py-12">
                  <Folder className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No files shared yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tasks View */}
        {activeView === 'tasks' && !searchResults && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Tasks</h2>
              <Button onClick={() => setShowCreateTask(true)} className="bg-indigo-600 hover:bg-indigo-700">
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
                    <div key={task.id} className="bg-white dark:bg-slate-700 rounded-lg p-3 shadow-sm">
                      <p className="font-medium text-sm text-slate-800 dark:text-white">{task.title}</p>
                      {task.assignee_name && (
                        <p className="text-xs text-slate-500 mt-1">Assigned to: {task.assignee_name}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-xs"
                          onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                        >
                          Start
                        </Button>
                      </div>
                    </div>
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
                    <div key={task.id} className="bg-white dark:bg-slate-700 rounded-lg p-3 shadow-sm">
                      <p className="font-medium text-sm text-slate-800 dark:text-white">{task.title}</p>
                      {task.assignee_name && (
                        <p className="text-xs text-slate-500 mt-1">Assigned to: {task.assignee_name}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-xs text-green-600 border-green-200"
                          onClick={() => handleUpdateTaskStatus(task.id, 'done')}
                        >
                          Complete
                        </Button>
                      </div>
                    </div>
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
        )}

        {/* Saved Items View */}
        {activeView === 'saved' && !searchResults && (
          <div className="flex-1 p-6 overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Saved Items</h2>
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
                      <p className="text-slate-600 dark:text-slate-300">{item.content.content}</p>
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
              {savedItems.length === 0 && (
                <div className="text-center py-12">
                  <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No saved items yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat View */}
        {(activeView === 'channels' || activeView === 'dms') && selectedChannel && !searchResults && (
          <>
            {/* Channel Header */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex items-center gap-3">
                {selectedChannel.type === 'direct' ? (
                  <div className={`w-10 h-10 rounded-full ${getRandomColor(selectedChannel.other_user?.name)} flex items-center justify-center font-medium`}>
                    {getInitials(selectedChannel.other_user?.name)}
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
                <Button variant="ghost" size="sm" onClick={() => setShowChannelSettings(true)}>
                  <Users size={18} />
                </Button>
                <Button variant="ghost" size="sm">
                  <Pin size={18} />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                messages.map((msg, index) => {
                  const isOwn = msg.sender_id === user?.id;
                  const showAvatar = index === 0 || messages[index - 1]?.sender_id !== msg.sender_id;
                  
                  if (msg.content_type === 'system') {
                    return (
                      <div key={msg.id} className="text-center">
                        <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                          {msg.content}
                        </span>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={msg.id} className={`flex gap-3 group ${isOwn ? 'justify-end' : ''}`}>
                      {!isOwn && showAvatar && (
                        <div className={`w-8 h-8 rounded-full ${getRandomColor(msg.sender_name)} flex items-center justify-center text-xs font-medium text-white flex-shrink-0`}>
                          {getInitials(msg.sender_name)}
                        </div>
                      )}
                      {!isOwn && !showAvatar && <div className="w-8" />}
                      
                      <div className={`max-w-[70%] ${isOwn ? 'order-first' : ''}`}>
                        {showAvatar && !isOwn && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-slate-800 dark:text-white">{msg.sender_name}</span>
                            <span className="text-xs text-slate-400">{formatTime(msg.created_at)}</span>
                          </div>
                        )}
                        
                        <div className={`relative rounded-2xl px-4 py-2 ${
                          isOwn 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600'
                        }`}>
                          {msg.is_pinned && (
                            <Pin size={12} className={`absolute -top-2 -right-2 ${isOwn ? 'text-amber-300' : 'text-amber-500'}`} />
                          )}
                          
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          
                          {/* Attachments */}
                          {msg.attachments?.length > 0 && (
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
                        
                        {/* Reactions */}
                        {Object.keys(msg.reactions || {}).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                              userIds.length > 0 && (
                                <button
                                  key={emoji}
                                  onClick={() => handleReaction(msg.id, emoji)}
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
                            onClick={() => fetchThread(msg.id)}
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
                            onClick={() => fetchThread(msg.id)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"
                            title="Reply in thread"
                          >
                            <Reply size={14} className="text-slate-400" />
                          </button>
                          <button
                            onClick={() => handleSaveItem('message', msg.id, selectedChannel.id)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"
                            title="Save"
                          >
                            <Bookmark size={14} className="text-slate-400" />
                          </button>
                          <button
                            onClick={() => handlePinMessage(msg.id, msg.is_pinned)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"
                            title={msg.is_pinned ? "Unpin" : "Pin"}
                          >
                            <Pin size={14} className={msg.is_pinned ? 'text-amber-500' : 'text-slate-400'} />
                          </button>
                          {isOwn && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                              title="Delete"
                            >
                              <Trash2 size={14} className="text-red-400" />
                            </button>
                          )}
                        </div>
                        
                        {/* Emoji Picker */}
                        {showEmojiPicker === msg.id && (
                          <div className="absolute mt-1 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 p-2 flex gap-1 z-10">
                            {EMOJI_LIST.map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(msg.id, emoji)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded text-lg"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
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
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Message ${selectedChannel.type === 'direct' ? selectedChannel.other_user?.name : '#' + selectedChannel.name}`}
                    className="min-h-[44px] max-h-32 resize-none pr-12 dark:bg-slate-700 dark:border-slate-600"
                    rows={1}
                  />
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
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Welcome to Collaborations
              </h3>
              <p className="text-slate-500 mb-4">
                Select a channel or start a direct message to begin collaborating
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setShowCreateChannel(true)} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus size={16} className="mr-1" /> Create Channel
                </Button>
                <Button variant="outline" onClick={() => setShowUserList(true)}>
                  <MessageCircle size={16} className="mr-1" /> Start DM
                </Button>
              </div>
              
              {/* Dashboard Stats */}
              {dashboard && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 max-w-2xl">
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
        )}
      </div>

      {/* Thread Panel */}
      {showThread && (
        <div className="w-96 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col">
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-white">Thread</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowThread(null)}>
              <X size={18} />
            </Button>
          </div>
          
          {/* Parent Message */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-6 h-6 rounded-full ${getRandomColor(showThread.sender_name)} flex items-center justify-center text-xs font-medium text-white`}>
                {getInitials(showThread.sender_name)}
              </div>
              <span className="font-medium text-sm text-slate-800 dark:text-white">{showThread.sender_name}</span>
              <span className="text-xs text-slate-400">{formatTime(showThread.created_at)}</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300">{showThread.content}</p>
          </div>
          
          {/* Thread Replies */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {threadMessages.map(reply => (
              <div key={reply.id} className="flex gap-2">
                <div className={`w-6 h-6 rounded-full ${getRandomColor(reply.sender_name)} flex items-center justify-center text-xs font-medium text-white flex-shrink-0`}>
                  {getInitials(reply.sender_name)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-xs text-slate-800 dark:text-white">{reply.sender_name}</span>
                    <span className="text-xs text-slate-400">{formatTime(reply.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Thread Reply Input */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <ThreadReplyInput onSend={(content) => handleSendThreadReply(showThread.id, content)} />
          </div>
        </div>
      )}

      {/* Create Channel Dialog */}
      <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
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
                value={channelForm.name}
                onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                placeholder="e.g., general, marketing, engineering"
                className="dark:bg-slate-700 dark:border-slate-600"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Description
              </label>
              <Textarea
                value={channelForm.description}
                onChange={(e) => setChannelForm({ ...channelForm, description: e.target.value })}
                placeholder="What's this channel about?"
                className="dark:bg-slate-700 dark:border-slate-600"
                rows={2}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Visibility
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setChannelForm({ ...channelForm, type: 'public' })}
                  className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                    channelForm.type === 'public'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                      : 'border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <Hash className={channelForm.type === 'public' ? 'text-indigo-600' : 'text-slate-400'} size={20} />
                  <p className="font-medium text-sm mt-1 text-slate-800 dark:text-white">Public</p>
                  <p className="text-xs text-slate-500">Anyone can join</p>
                </button>
                <button
                  onClick={() => setChannelForm({ ...channelForm, type: 'private' })}
                  className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                    channelForm.type === 'private'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                      : 'border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <Lock className={channelForm.type === 'private' ? 'text-indigo-600' : 'text-slate-400'} size={20} />
                  <p className="font-medium text-sm mt-1 text-slate-800 dark:text-white">Private</p>
                  <p className="text-xs text-slate-500">Invite only</p>
                </button>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateChannel(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateChannel}
                disabled={!channelForm.name}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Create Channel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User List Dialog (for DMs) */}
      <Dialog open={showUserList} onOpenChange={setShowUserList}>
        <DialogContent className="bg-white dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">Start Direct Message</DialogTitle>
            <DialogDescription className="text-slate-500">
              Select a team member to start a conversation
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 max-h-96 overflow-y-auto">
            {users.filter(u => u.id !== user?.id).map(u => (
              <button
                key={u.id}
                onClick={() => handleCreateDM(u.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <div className={`w-10 h-10 rounded-full ${getRandomColor(u.name)} flex items-center justify-center font-medium text-white`}>
                  {getInitials(u.name)}
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-800 dark:text-white">{u.name}</p>
                  <p className="text-sm text-slate-500">{u.email}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
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
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="Task title"
                className="dark:bg-slate-700 dark:border-slate-600"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Description
              </label>
              <Textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
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
                  value={taskForm.assignee_id}
                  onChange={(e) => setTaskForm({ ...taskForm, assignee_id: e.target.value })}
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
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
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
                value={taskForm.due_date}
                onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                className="dark:bg-slate-700 dark:border-slate-600"
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateTask(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTask}
                disabled={!taskForm.title}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Create Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Thread Reply Input Component
const ThreadReplyInput = ({ onSend }) => {
  const [content, setContent] = useState('');
  
  const handleSend = () => {
    if (!content.trim()) return;
    onSend(content);
    setContent('');
  };
  
  return (
    <div className="flex gap-2">
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        placeholder="Reply..."
        className="dark:bg-slate-700 dark:border-slate-600"
      />
      <Button onClick={handleSend} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
        <Send size={16} />
      </Button>
    </div>
  );
};

export default Collaborations;
