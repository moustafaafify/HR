import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { 
  Book, 
  Search, 
  ChevronRight, 
  ChevronDown,
  ChevronLeft,
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  Receipt,
  GraduationCap,
  FileCheck,
  Wallet,
  Package,
  Shield,
  UserCheck,
  CalendarClock,
  BarChart3,
  Settings,
  Workflow,
  Network,
  Target,
  Plane,
  Award,
  Megaphone,
  AlertOctagon,
  Gavel,
  Heart,
  Ticket,
  Building2,
  GitBranch,
  FolderTree,
  Layers,
  UserPlus,
  UserMinus,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Circle,
  Zap,
  Info,
  BookOpen,
  Play,
  ExternalLink,
  MessageSquare,
  Hash,
  AtSign,
  Smile,
  Paperclip,
  Pin,
  Bookmark,
  Send,
  Bell,
  BellOff,
  Filter,
  Reply,
  Trash2,
  Edit2,
  Copy,
  Download,
  Upload,
  File,
  Image,
  Video,
  Music,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  Minus,
  X,
  Check,
  AlertTriangle,
  HelpCircle,
  Lightbulb,
  Star,
  ThumbsUp,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  Globe,
  Link,
  Code,
  Database,
  Server,
  Monitor,
  Smartphone,
  Printer,
  Camera,
  Mic,
  Volume2,
  Wifi,
  Battery,
  Power,
  Home,
  Menu,
  MoreHorizontal,
  MoreVertical,
  Maximize,
  Minimize,
  Grid,
  List,
  Table,
  PieChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  ShoppingCart,
  Gift,
  Tag,
  Percent,
  Calculator,
  FileText,
  Folder,
  FolderOpen,
  Save,
  Undo,
  Redo,
  Scissors,
  Clipboard,
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  LogIn,
  LogOut,
  Key,
  Unlock,
  UserCog,
  UserX,
  Users2,
  Briefcase,
  Building,
  Factory,
  Landmark,
  Map,
  Navigation,
  Compass,
  Flag,
  Bookmark as BookmarkIcon,
  Heart as HeartIcon,
  Share2,
  Share,
  Inbox,
  Archive,
  Trash,
  RotateCcw,
  History,
  Activity,
  Cpu,
  HardDrive,
  Cloud,
  CloudOff,
  Loader,
  CheckSquare,
  Square,
  MinusSquare,
  PlusSquare,
  XSquare,
  AlertCircle,
  XCircle,
  StopCircle,
  PlayCircle,
  PauseCircle,
  SkipBack,
  SkipForward,
  FastForward,
  Rewind,
  Shuffle,
  Repeat,
  Volume1,
  VolumeX,
  Headphones,
  Radio,
  Tv,
  Film,
  Aperture,
  Sun,
  Moon,
  CloudRain,
  Umbrella,
  Wind,
  Thermometer,
  Droplet,
  Flame,
  Snowflake,
  Zap as ZapIcon,
  Feather,
  Leaf,
  TreePine,
  Mountain,
  Waves,
  Anchor,
  Compass as CompassIcon,
  Truck,
  Car,
  Bus,
  Train,
  Ship,
  Rocket,
  Satellite,
  Globe2,
  Languages,
  Hash as HashIcon,
  AtSign as AtSignIcon,
  Asterisk,
  Slash,
  Percent as PercentIcon,
  Equal,
  PlusCircle,
  MinusCircle,
  Divide,
  Infinity,
  Pi,
  Sigma,
  Omega
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}`;

// ============= COMPREHENSIVE MODULE DATA =============
const WIKI_MODULES = {
  // ==================== GETTING STARTED ====================
  'getting-started': {
    id: 'getting-started',
    name: 'Getting Started Guide',
    icon: BookOpen,
    category: 'Getting Started',
    shortDescription: 'Learn how to navigate and use the HR Platform effectively',
    sections: [
      {
        title: 'Welcome to Lojyn HR Platform',
        content: `
          <p class="text-lg mb-4">Welcome to <strong>Lojyn HR</strong>, your comprehensive Human Resource Management System designed to streamline every aspect of HR operations. This guide will help you understand the platform's capabilities and how to make the most of its features.</p>
          
          <div class="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6 mb-6">
            <h4 class="font-semibold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              What is Lojyn HR?
            </h4>
            <p class="text-indigo-700 dark:text-indigo-300">Lojyn HR is an enterprise-grade HRMS that helps organizations manage employees, track attendance, process payroll, handle leave requests, conduct performance reviews, and much more—all from a single, unified platform.</p>
          </div>
        `
      },
      {
        title: 'System Requirements',
        content: `
          <div class="grid md:grid-cols-2 gap-4 mb-6">
            <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <h4 class="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                Desktop Browser
              </h4>
              <ul class="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>• Chrome 90+ (Recommended)</li>
                <li>• Firefox 88+</li>
                <li>• Safari 14+</li>
                <li>• Edge 90+</li>
                <li>• Screen resolution: 1280x720 minimum</li>
              </ul>
            </div>
            <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <h4 class="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                Mobile Device
              </h4>
              <ul class="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>• iOS 14+ (iPhone, iPad)</li>
                <li>• Android 10+</li>
                <li>• PWA supported for offline access</li>
                <li>• Push notifications enabled</li>
              </ul>
            </div>
          </div>
        `
      },
      {
        title: 'Logging In',
        type: 'steps',
        steps: [
          {
            number: 1,
            title: 'Navigate to Login Page',
            description: 'Open your browser and go to the HR platform URL provided by your administrator. You will see the login screen.',
            tip: 'Bookmark the URL for quick access'
          },
          {
            number: 2,
            title: 'Enter Your Credentials',
            description: 'Enter your company email address and password. These credentials are provided by your HR administrator.',
            tip: 'Check your email for welcome credentials if you are a new user'
          },
          {
            number: 3,
            title: 'Click Sign In',
            description: 'Click the "Sign In" button to access your dashboard. If successful, you will be redirected to the main dashboard.',
            tip: 'If you forgot your password, click "Forgot Password" to reset it'
          },
          {
            number: 4,
            title: 'Two-Factor Authentication (if enabled)',
            description: 'If 2FA is enabled for your account, enter the verification code sent to your phone or email.',
            tip: 'Keep your authentication app handy for quick verification'
          }
        ]
      },
      {
        title: 'Understanding the Interface',
        content: `
          <div class="space-y-6">
            <div class="bg-slate-100 dark:bg-slate-800 rounded-xl p-6">
              <h4 class="font-semibold text-slate-800 dark:text-white mb-4">Navigation Sidebar</h4>
              <p class="text-slate-600 dark:text-slate-400 mb-4">The left sidebar contains all the main navigation items, organized into logical groups:</p>
              <div class="grid md:grid-cols-2 gap-4">
                <div class="bg-white dark:bg-slate-700 rounded-lg p-4">
                  <h5 class="font-medium text-slate-800 dark:text-white mb-2">Core</h5>
                  <p class="text-sm text-slate-500 dark:text-slate-400">Dashboard, Collaborations, Notifications, Reports, Analytics, Scheduled Reports, Calendar, Communications, Documents</p>
                </div>
                <div class="bg-white dark:bg-slate-700 rounded-lg p-4">
                  <h5 class="font-medium text-slate-800 dark:text-white mb-2">People</h5>
                  <p class="text-sm text-slate-500 dark:text-slate-400">Employees, Onboarding, Offboarding, Visitors, Organization Charts</p>
                </div>
                <div class="bg-white dark:bg-slate-700 rounded-lg p-4">
                  <h5 class="font-medium text-slate-800 dark:text-white mb-2">Work</h5>
                  <p class="text-sm text-slate-500 dark:text-slate-400">Leaves, Attendance, Shifts, Travel, Disciplinary Actions</p>
                </div>
                <div class="bg-white dark:bg-slate-700 rounded-lg p-4">
                  <h5 class="font-medium text-slate-800 dark:text-white mb-2">Finance</h5>
                  <p class="text-sm text-slate-500 dark:text-slate-400">Payroll, Expenses, Assets, Benefits</p>
                </div>
              </div>
            </div>
          </div>
        `
      },
      {
        title: 'User Roles & Permissions',
        content: `
          <p class="mb-4">The platform supports different user roles, each with specific permissions:</p>
          <div class="space-y-4">
            <div class="flex items-start gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <div class="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <div>
                <h4 class="font-semibold text-purple-800 dark:text-purple-300">Super Administrator</h4>
                <p class="text-sm text-purple-700 dark:text-purple-400">Full access to all modules, settings, and configurations. Can manage all corporations, branches, and users.</p>
              </div>
            </div>
            <div class="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              </div>
              <div>
                <h4 class="font-semibold text-blue-800 dark:text-blue-300">Corporation Administrator</h4>
                <p class="text-sm text-blue-700 dark:text-blue-400">Access to manage their assigned corporation. Can manage employees, branches, departments within their corporation.</p>
              </div>
            </div>
            <div class="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div class="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <div>
                <h4 class="font-semibold text-green-800 dark:text-green-300">Employee</h4>
                <p class="text-sm text-green-700 dark:text-green-400">Access to personal profile, leave requests, attendance, payslips, and self-service features.</p>
              </div>
            </div>
          </div>
        `
      }
    ]
  },

  // ==================== COLLABORATIONS ====================
  'collaborations': {
    id: 'collaborations',
    name: 'Collaborations Hub',
    icon: MessageSquare,
    category: 'Core',
    shortDescription: 'Central hub for team communication, file sharing, and productivity',
    screenshot: '/uploads/wiki/collaborations.png',
    sections: [
      {
        title: 'Overview',
        content: `
          <p class="text-lg mb-4">The <strong>Collaborations Hub</strong> is your central workspace for team communication—think of it as an internal Slack or Microsoft Teams. It brings conversations, files, tasks, and tools together in one searchable, secure place.</p>
          
          <div class="grid md:grid-cols-4 gap-4 my-6">
            <div class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white text-center">
              <div class="text-3xl font-bold">Real-time</div>
              <div class="text-sm opacity-90">Message Refresh</div>
            </div>
            <div class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white text-center">
              <div class="text-3xl font-bold">Secure</div>
              <div class="text-sm opacity-90">Private Channels</div>
            </div>
            <div class="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white text-center">
              <div class="text-3xl font-bold">Organized</div>
              <div class="text-sm opacity-90">By Channels</div>
            </div>
            <div class="bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl p-4 text-white text-center">
              <div class="text-3xl font-bold">Productive</div>
              <div class="text-sm opacity-90">Built-in Tasks</div>
            </div>
          </div>
        `
      },
      {
        title: 'Accessing Collaborations',
        type: 'steps',
        steps: [
          {
            number: 1,
            title: 'Navigate to Collaborations',
            description: 'Click on "Collaborations" in the left sidebar under the Core section. You can also use the keyboard shortcut Ctrl+K and search for "Collaborations".',
            tip: 'The Collaborations icon shows a notification badge when you have unread messages'
          },
          {
            number: 2,
            title: 'Explore the Interface',
            description: 'The Collaborations page has a dark sidebar on the left showing Channels, Direct Messages, and quick access links (Mentions, Files, Tasks, Saved Items). The main area shows the welcome screen or active conversation.',
            tip: 'Collapse the sidebar by clicking the arrow icon for more space'
          }
        ]
      },
      {
        title: 'Understanding the Sidebar',
        content: `
          <div class="space-y-4">
            <div class="bg-slate-800 rounded-xl p-5 text-white">
              <h4 class="font-semibold mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                Search Bar
              </h4>
              <p class="text-slate-300 text-sm mb-3">Search for messages, files, channels, and polls across all your conversations.</p>
              <div class="bg-slate-700 rounded-lg p-3 flex items-center gap-2">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <span class="text-slate-400">Search...</span>
                <svg class="w-4 h-4 text-slate-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
              </div>
              <p class="text-slate-400 text-xs mt-2">Click the filter icon for advanced search options</p>
            </div>
            
            <div class="grid md:grid-cols-2 gap-4">
              <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <h4 class="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <span class="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">@</span>
                  Mentions
                </h4>
                <p class="text-sm text-slate-600 dark:text-slate-400">View all messages where you've been @mentioned. Never miss an important notification directed at you.</p>
              </div>
              <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <h4 class="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <span class="w-6 h-6 rounded bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">📁</span>
                  All Files
                </h4>
                <p class="text-sm text-slate-600 dark:text-slate-400">Browse all files shared across channels. Filter by file type, search by name, and download with one click.</p>
              </div>
              <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <h4 class="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <span class="w-6 h-6 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center">✓</span>
                  Tasks
                </h4>
                <p class="text-sm text-slate-600 dark:text-slate-400">Kanban-style task board with To Do, In Progress, and Done columns. Create, assign, and track tasks visually.</p>
              </div>
              <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <h4 class="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <span class="w-6 h-6 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">🔖</span>
                  Saved Items
                </h4>
                <p class="text-sm text-slate-600 dark:text-slate-400">Your bookmarked messages and files. Save important information for quick access later.</p>
              </div>
            </div>
          </div>
        `
      },
      {
        title: 'Creating a Channel',
        type: 'steps',
        steps: [
          {
            number: 1,
            title: 'Click the + Button',
            description: 'Next to the "CHANNELS" header in the sidebar, click the + (plus) icon to open the Create Channel dialog.',
            tip: 'You can create channels for teams, projects, topics, or any grouping that makes sense'
          },
          {
            number: 2,
            title: 'Enter Channel Details',
            description: 'Fill in the channel name (use lowercase with hyphens, e.g., "marketing-team"). Add an optional description to help others understand the channel\'s purpose.',
            tip: 'Good channel names: #general, #engineering, #sales-leads, #project-alpha'
          },
          {
            number: 3,
            title: 'Choose Visibility',
            description: 'Select "Public" if anyone can join, or "Private" if only invited members can see and join the channel.',
            tip: 'Private channels are shown with a lock icon 🔒'
          },
          {
            number: 4,
            title: 'Select Category (Optional)',
            description: 'If channel categories have been set up, you can organize your channel under a specific category for better organization.',
            tip: 'Categories help group related channels together'
          },
          {
            number: 5,
            title: 'Create the Channel',
            description: 'Click "Create Channel" to finalize. You will be automatically redirected to your new channel.',
            tip: 'A system message will announce that you created the channel'
          }
        ]
      },
      {
        title: 'Sending Messages',
        content: `
          <div class="space-y-6">
            <div class="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <h4 class="font-semibold text-slate-800 dark:text-white mb-4">Message Input Area</h4>
              <p class="text-slate-600 dark:text-slate-400 mb-4">The message input is located at the bottom of the chat area. It includes:</p>
              
              <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-4">
                <div class="flex items-center gap-2 mb-3 pb-3 border-b border-slate-200 dark:border-slate-600">
                  <button class="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"><strong>B</strong></button>
                  <button class="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"><em>I</em></button>
                  <button class="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded font-mono text-sm">&lt;/&gt;</button>
                  <button class="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded">🔗</button>
                  <div class="w-px h-4 bg-slate-300 dark:bg-slate-500 mx-1"></div>
                  <button class="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded">⚡</button>
                </div>
                <div class="flex items-center gap-2">
                  <button class="p-2 text-slate-400">📎</button>
                  <div class="flex-1 bg-white dark:bg-slate-600 rounded-lg px-3 py-2 text-slate-400 text-sm">
                    Message #general. Use @mention, **bold**, *italic*, \`code\`
                  </div>
                  <button class="p-2 bg-indigo-600 text-white rounded-lg">➤</button>
                </div>
              </div>
              
              <h5 class="font-medium text-slate-800 dark:text-white mb-2">Formatting Toolbar</h5>
              <ul class="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><strong>B (Bold)</strong> - Wraps selected text with **asterisks** for bold formatting</li>
                <li><strong>I (Italic)</strong> - Wraps selected text with *asterisks* for italic formatting</li>
                <li><strong>&lt;/&gt; (Code)</strong> - Wraps text with \`backticks\` for inline code</li>
                <li><strong>🔗 (Link)</strong> - Inserts [text](url) format for clickable links</li>
                <li><strong>⚡ (Quick Replies)</strong> - Access saved message templates</li>
              </ul>
            </div>
            
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
              <h4 class="font-semibold text-blue-800 dark:text-blue-300 mb-3">Message Formatting Examples</h4>
              <div class="space-y-3 text-sm">
                <div class="flex gap-4">
                  <code class="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">**bold text**</code>
                  <span class="text-slate-600 dark:text-slate-400">→</span>
                  <span><strong>bold text</strong></span>
                </div>
                <div class="flex gap-4">
                  <code class="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">*italic text*</code>
                  <span class="text-slate-600 dark:text-slate-400">→</span>
                  <span><em>italic text</em></span>
                </div>
                <div class="flex gap-4">
                  <code class="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">\`code snippet\`</code>
                  <span class="text-slate-600 dark:text-slate-400">→</span>
                  <code class="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-sm">code snippet</code>
                </div>
                <div class="flex gap-4">
                  <code class="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">@John</code>
                  <span class="text-slate-600 dark:text-slate-400">→</span>
                  <span class="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 px-1 rounded">@John</span>
                </div>
                <div class="flex gap-4">
                  <code class="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">[Click here](https://...)</code>
                  <span class="text-slate-600 dark:text-slate-400">→</span>
                  <a class="text-indigo-600 hover:underline">Click here</a>
                </div>
              </div>
            </div>
          </div>
        `
      },
      {
        title: 'Using @Mentions',
        type: 'steps',
        steps: [
          {
            number: 1,
            title: 'Type @ Symbol',
            description: 'In the message input, type the @ symbol. A dropdown menu will appear showing available users to mention.',
            tip: 'The dropdown filters as you type more characters after @'
          },
          {
            number: 2,
            title: 'Select a User',
            description: 'Click on a user\'s name from the dropdown, or continue typing to filter the list. Press Enter or Tab to select the highlighted user.',
            tip: 'Mentioned users will receive a notification and see it in their Mentions view'
          },
          {
            number: 3,
            title: 'Send the Message',
            description: 'Complete your message and press Enter or click the Send button. The mention will be highlighted in the sent message.',
            tip: 'You can mention multiple users in a single message'
          }
        ]
      },
      {
        title: 'Creating Polls',
        type: 'steps',
        steps: [
          {
            number: 1,
            title: 'Open Poll Creator',
            description: 'In a channel, click the chart/poll icon (📊) in the channel header toolbar. This opens the Create Poll dialog.',
            tip: 'Polls are great for quick team decisions and gathering feedback'
          },
          {
            number: 2,
            title: 'Enter Poll Question',
            description: 'Type your question in the "Question" field. Make it clear and specific.',
            tip: 'Example: "What time should we have our weekly standup?"'
          },
          {
            number: 3,
            title: 'Add Options',
            description: 'Enter at least 2 options for voters to choose from. Click "Add Option" to add more (up to 6 options).',
            tip: 'Keep options concise and mutually exclusive'
          },
          {
            number: 4,
            title: 'Configure Settings',
            description: 'Choose whether to allow multiple votes (checkbox) or keep voting anonymous.',
            tip: 'Anonymous polls encourage honest feedback'
          },
          {
            number: 5,
            title: 'Create Poll',
            description: 'Click "Create Poll" to post it to the channel. Team members can vote by clicking on options.',
            tip: 'Poll results update in real-time as votes come in'
          }
        ]
      },
      {
        title: 'Setting Your Status',
        content: `
          <p class="mb-4">Let your team know your availability by setting a status. Your status appears next to your name and avatar throughout the platform.</p>
          
          <div class="space-y-3 mb-6">
            <div class="flex items-center gap-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div class="w-3 h-3 rounded-full bg-green-500"></div>
              <div>
                <span class="font-medium text-green-800 dark:text-green-300">Online</span>
                <span class="text-sm text-green-600 dark:text-green-400 ml-2">- You are active and available</span>
              </div>
            </div>
            <div class="flex items-center gap-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div class="w-3 h-3 rounded-full bg-amber-500"></div>
              <div>
                <span class="font-medium text-amber-800 dark:text-amber-300">Away</span>
                <span class="text-sm text-amber-600 dark:text-amber-400 ml-2">- You're temporarily away from your desk</span>
              </div>
            </div>
            <div class="flex items-center gap-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div class="w-3 h-3 rounded-full bg-red-500"></div>
              <div>
                <span class="font-medium text-red-800 dark:text-red-300">Do Not Disturb</span>
                <span class="text-sm text-red-600 dark:text-red-400 ml-2">- You're focusing and don't want interruptions</span>
              </div>
            </div>
            <div class="flex items-center gap-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div class="w-3 h-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-600"></div>
              <div>
                <span class="font-medium text-slate-800 dark:text-slate-300">Offline</span>
                <span class="text-sm text-slate-600 dark:text-slate-400 ml-2">- You're not currently using the platform</span>
              </div>
            </div>
          </div>
          
          <div class="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-5">
            <h4 class="font-semibold text-indigo-800 dark:text-indigo-300 mb-2">Custom Status Text</h4>
            <p class="text-sm text-indigo-700 dark:text-indigo-400">You can also set a custom status message like "In a meeting until 3pm" or "Working from home today" to give more context to your availability.</p>
          </div>
        `
      },
      {
        title: 'Message Actions',
        content: `
          <p class="mb-4">Hover over any message to reveal action buttons. These let you interact with the message in various ways:</p>
          
          <div class="grid md:grid-cols-2 gap-4">
            <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <span class="text-xl">😊</span>
                </div>
                <div>
                  <h4 class="font-semibold text-slate-800 dark:text-white">React</h4>
                  <p class="text-xs text-slate-500">Add emoji reaction</p>
                </div>
              </div>
              <p class="text-sm text-slate-600 dark:text-slate-400">Express yourself with emoji reactions. Choose from 15 emojis including 👍 ❤️ 😂 🎉 🔥 and more.</p>
            </div>
            
            <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                </div>
                <div>
                  <h4 class="font-semibold text-slate-800 dark:text-white">Reply in Thread</h4>
                  <p class="text-xs text-slate-500">Start a conversation thread</p>
                </div>
              </div>
              <p class="text-sm text-slate-600 dark:text-slate-400">Keep related discussions organized by replying in a thread. Threads appear in a side panel without cluttering the main channel.</p>
            </div>
            
            <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                </div>
                <div>
                  <h4 class="font-semibold text-slate-800 dark:text-white">Save</h4>
                  <p class="text-xs text-slate-500">Bookmark for later</p>
                </div>
              </div>
              <p class="text-sm text-slate-600 dark:text-slate-400">Save important messages for quick access later. Find all saved items in the Saved Items section of the sidebar.</p>
            </div>
            
            <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <svg class="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5v16l7-3.5L19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2z"></path></svg>
                </div>
                <div>
                  <h4 class="font-semibold text-slate-800 dark:text-white">Pin</h4>
                  <p class="text-xs text-slate-500">Pin to channel</p>
                </div>
              </div>
              <p class="text-sm text-slate-600 dark:text-slate-400">Pin important messages so everyone can easily find them. Pinned messages are highlighted with a pin icon.</p>
            </div>
          </div>
        `
      },
      {
        title: 'Direct Messages (DMs)',
        type: 'steps',
        steps: [
          {
            number: 1,
            title: 'Start a DM',
            description: 'Click the + button next to "DIRECT MESSAGES" in the sidebar, or click "Start DM" on the welcome screen.',
            tip: 'DMs are private conversations between you and another person'
          },
          {
            number: 2,
            title: 'Select a Colleague',
            description: 'Browse the list of team members or search by name. Each user shows their current status (Online, Away, etc.).',
            tip: 'Look for the green dot for users who are currently online'
          },
          {
            number: 3,
            title: 'Start Chatting',
            description: 'Click on a user to open (or create) a DM conversation. The chat interface works the same as channels.',
            tip: 'Your DM history is preserved and searchable'
          }
        ]
      },
      {
        title: 'Task Management',
        content: `
          <p class="mb-4">The built-in task board helps you track work items without leaving the collaboration hub.</p>
          
          <div class="bg-slate-100 dark:bg-slate-800 rounded-xl p-6 mb-6">
            <h4 class="font-semibold text-slate-800 dark:text-white mb-4">Kanban Board Layout</h4>
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-white dark:bg-slate-700 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-3 h-3 rounded-full bg-slate-400"></div>
                  <span class="font-medium text-slate-800 dark:text-white">To Do</span>
                </div>
                <div class="space-y-2">
                  <div class="bg-slate-50 dark:bg-slate-600 rounded p-2 text-sm">Task cards appear here</div>
                </div>
              </div>
              <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span class="font-medium text-blue-800 dark:text-blue-300">In Progress</span>
                </div>
                <div class="space-y-2">
                  <div class="bg-white dark:bg-slate-700 rounded p-2 text-sm">Active work goes here</div>
                </div>
              </div>
              <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-3 h-3 rounded-full bg-green-500"></div>
                  <span class="font-medium text-green-800 dark:text-green-300">Done</span>
                </div>
                <div class="space-y-2">
                  <div class="bg-white dark:bg-slate-700 rounded p-2 text-sm opacity-75 line-through">Completed tasks</div>
                </div>
              </div>
            </div>
          </div>
          
          <h4 class="font-semibold text-slate-800 dark:text-white mb-3">Creating a Task</h4>
          <ol class="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-400">
            <li>Click "Tasks" in the sidebar to open the task board</li>
            <li>Click the "New Task" button in the top right</li>
            <li>Enter a title and optional description</li>
            <li>Select an assignee from your team (or leave unassigned)</li>
            <li>Set priority level (Low, Medium, High, Urgent)</li>
            <li>Optionally set a due date</li>
            <li>Click "Create Task" to add it to the To Do column</li>
          </ol>
        `
      },
      {
        title: 'File Sharing',
        content: `
          <p class="mb-4">Share documents, images, videos, and other files directly in your conversations.</p>
          
          <div class="space-y-4">
            <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <h4 class="font-semibold text-slate-800 dark:text-white mb-3">How to Share a File</h4>
              <ol class="list-decimal list-inside space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>Click the 📎 paperclip icon in the message input area</li>
                <li>Select a file from your computer</li>
                <li>The file will upload and automatically create a message</li>
                <li>Images will show inline previews in the chat</li>
              </ol>
            </div>
            
            <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <h4 class="font-semibold text-slate-800 dark:text-white mb-3">Supported File Types</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div class="text-center">
                  <div class="w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-2">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  </div>
                  <span class="text-xs text-slate-600 dark:text-slate-400">Documents<br/>PDF, DOC, XLS</span>
                </div>
                <div class="text-center">
                  <div class="w-12 h-12 mx-auto bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-2">
                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </div>
                  <span class="text-xs text-slate-600 dark:text-slate-400">Images<br/>PNG, JPG, GIF</span>
                </div>
                <div class="text-center">
                  <div class="w-12 h-12 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-2">
                    <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  </div>
                  <span class="text-xs text-slate-600 dark:text-slate-400">Videos<br/>MP4, MOV, AVI</span>
                </div>
                <div class="text-center">
                  <div class="w-12 h-12 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center mb-2">
                    <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
                  </div>
                  <span class="text-xs text-slate-600 dark:text-slate-400">Audio<br/>MP3, WAV, OGG</span>
                </div>
              </div>
            </div>
          </div>
        `
      },
      {
        title: 'Quick Replies / Templates',
        content: `
          <p class="mb-4">Save time by creating reusable message templates for common responses.</p>
          
          <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 mb-6">
            <h4 class="font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              Why Use Quick Replies?
            </h4>
            <ul class="space-y-2 text-sm text-amber-700 dark:text-amber-400">
              <li>• Save frequently used responses</li>
              <li>• Maintain consistent messaging</li>
              <li>• Speed up your workflow</li>
              <li>• Reduce typing for common phrases</li>
            </ul>
          </div>
          
          <h4 class="font-semibold text-slate-800 dark:text-white mb-3">Using Quick Replies</h4>
          <ol class="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-400 mb-6">
            <li>Click the ⚡ (lightning) icon in the formatting toolbar</li>
            <li>Your saved templates will appear in a dropdown</li>
            <li>Click on a template to insert its content into the message field</li>
            <li>Edit the content if needed, then send</li>
          </ol>
          
          <div class="bg-slate-100 dark:bg-slate-800 rounded-xl p-5">
            <h4 class="font-semibold text-slate-800 dark:text-white mb-3">Example Templates</h4>
            <div class="space-y-3">
              <div class="bg-white dark:bg-slate-700 rounded-lg p-3">
                <span class="font-medium text-sm text-slate-800 dark:text-white">Thank You</span>
                <span class="text-xs text-slate-500 ml-2">/thanks</span>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">"Thank you for your message! I will get back to you soon."</p>
              </div>
              <div class="bg-white dark:bg-slate-700 rounded-lg p-3">
                <span class="font-medium text-sm text-slate-800 dark:text-white">Meeting Request</span>
                <span class="text-xs text-slate-500 ml-2">/meet</span>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">"Would you be available for a quick call? Please let me know your availability."</p>
              </div>
            </div>
          </div>
        `
      },
      {
        title: 'Advanced Search',
        content: `
          <p class="mb-4">Find anything in your collaboration history with powerful search filters.</p>
          
          <div class="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h4 class="font-semibold text-slate-800 dark:text-white mb-4">Search Filters</h4>
            
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                </div>
                <div>
                  <h5 class="font-medium text-slate-800 dark:text-white">Filter by Type</h5>
                  <p class="text-sm text-slate-600 dark:text-slate-400">Search only messages, files, or polls</p>
                </div>
              </div>
              
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <div>
                  <h5 class="font-medium text-slate-800 dark:text-white">Date Range</h5>
                  <p class="text-sm text-slate-600 dark:text-slate-400">Narrow results to a specific time period</p>
                </div>
              </div>
              
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                </div>
                <div>
                  <h5 class="font-medium text-slate-800 dark:text-white">Has Attachments</h5>
                  <p class="text-sm text-slate-600 dark:text-slate-400">Find messages that include files</p>
                </div>
              </div>
              
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                </div>
                <div>
                  <h5 class="font-medium text-slate-800 dark:text-white">Pinned Only</h5>
                  <p class="text-sm text-slate-600 dark:text-slate-400">Show only pinned/important messages</p>
                </div>
              </div>
            </div>
          </div>
        `
      },
      {
        title: 'Tips & Best Practices',
        content: `
          <div class="grid md:grid-cols-2 gap-4">
            <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
              <h4 class="font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Do's
              </h4>
              <ul class="space-y-2 text-sm text-green-700 dark:text-green-400">
                <li>✓ Use channels for team-wide discussions</li>
                <li>✓ Use DMs for private 1-on-1 conversations</li>
                <li>✓ Use threads to keep conversations organized</li>
                <li>✓ Pin important announcements</li>
                <li>✓ Set your status to let others know your availability</li>
                <li>✓ Use @mentions sparingly and appropriately</li>
              </ul>
            </div>
            
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
              <h4 class="font-semibold text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Don'ts
              </h4>
              <ul class="space-y-2 text-sm text-red-700 dark:text-red-400">
                <li>✗ Don't overuse @mentions or @channel</li>
                <li>✗ Don't share sensitive information in public channels</li>
                <li>✗ Don't have long conversations in main channels (use threads)</li>
                <li>✗ Don't upload very large files (compress first)</li>
                <li>✗ Don't delete messages others might need</li>
              </ul>
            </div>
          </div>
        `
      }
    ]
  },

  // ==================== SCHEDULED REPORTS ====================
  'scheduled-reports': {
    id: 'scheduled-reports',
    name: 'Scheduled Reports',
    icon: CalendarClock,
    category: 'Core',
    shortDescription: 'Automate report delivery to stakeholders on a schedule',
    screenshot: '/uploads/wiki/scheduled_reports.png',
    sections: [
      {
        title: 'Overview',
        content: `
          <p class="text-lg mb-4">The <strong>Scheduled Reports</strong> module allows you to automate the generation and delivery of HR reports. Instead of manually creating and sending reports, you can configure them once and have them delivered automatically on a daily, weekly, or monthly basis.</p>
          
          <div class="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6 mb-6">
            <h4 class="font-semibold text-indigo-800 dark:text-indigo-300 mb-2">Key Benefits</h4>
            <ul class="space-y-2 text-indigo-700 dark:text-indigo-400">
              <li>• <strong>Save Time</strong> - No more manual report generation</li>
              <li>• <strong>Consistency</strong> - Reports are delivered on schedule, every time</li>
              <li>• <strong>Stakeholder Visibility</strong> - Keep leadership informed automatically</li>
              <li>• <strong>Multiple Formats</strong> - PDF and CSV export options</li>
            </ul>
          </div>
        `
      },
      {
        title: 'Available Report Types',
        content: `
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <div class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-3">
                <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              </div>
              <h4 class="font-semibold text-slate-800 dark:text-white mb-2">HR Analytics</h4>
              <p class="text-sm text-slate-600 dark:text-slate-400">Headcount, turnover rates, department distribution, hiring metrics</p>
            </div>
            
            <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <h4 class="font-semibold text-slate-800 dark:text-white mb-2">Leave Report</h4>
              <p class="text-sm text-slate-600 dark:text-slate-400">Leave requests, balances, approvals, and utilization</p>
            </div>
            
            <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <div class="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
                <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h4 class="font-semibold text-slate-800 dark:text-white mb-2">Attendance Report</h4>
              <p class="text-sm text-slate-600 dark:text-slate-400">Clock-in/out times, working hours, late arrivals</p>
            </div>
            
            <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <h4 class="font-semibold text-slate-800 dark:text-white mb-2">Compliance Report</h4>
              <p class="text-sm text-slate-600 dark:text-slate-400">Policy acknowledgments, trainings, certifications</p>
            </div>
            
            <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
              <h4 class="font-semibold text-slate-800 dark:text-white mb-2">Workforce Report</h4>
              <p class="text-sm text-slate-600 dark:text-slate-400">Headcount plans, allocations, skills gaps</p>
            </div>
            
            <div class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <div class="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-3">
                <svg class="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <h4 class="font-semibold text-slate-800 dark:text-white mb-2">Employee Directory</h4>
              <p class="text-sm text-slate-600 dark:text-slate-400">Employee list, departments, contact info</p>
            </div>
          </div>
        `
      },
      {
        title: 'Creating a Scheduled Report',
        type: 'steps',
        steps: [
          {
            number: 1,
            title: 'Navigate to Scheduled Reports',
            description: 'Click on "Scheduled Reports" in the left sidebar under Core. You\'ll see the dashboard with existing schedules and statistics.',
            tip: 'Only administrators can create and manage scheduled reports'
          },
          {
            number: 2,
            title: 'Click Create Schedule',
            description: 'Click the "Create Schedule" button in the top right corner to open the configuration dialog.',
            tip: 'You can also duplicate an existing schedule by clicking edit and modifying it'
          },
          {
            number: 3,
            title: 'Enter Report Details',
            description: 'Fill in the report name (e.g., "Weekly HR Summary") and an optional description. Choose the report type from the dropdown.',
            tip: 'Use descriptive names that include the frequency (Weekly, Monthly, etc.)'
          },
          {
            number: 4,
            title: 'Configure Schedule',
            description: 'Choose the frequency (Daily, Weekly, or Monthly). For weekly reports, select the day of the week. For monthly, select the day of the month. Set the time for delivery.',
            tip: 'Consider your stakeholders\' time zones when setting the delivery time'
          },
          {
            number: 5,
            title: 'Add Recipients',
            description: 'Enter email addresses of recipients, separated by commas. Optionally add CC recipients for additional visibility.',
            tip: 'You can include external email addresses (e.g., board members)'
          },
          {
            number: 6,
            title: 'Choose Format & Options',
            description: 'Select the output format (PDF, CSV, or both). Choose the date range for data. Optionally include charts and visualizations.',
            tip: 'PDF is best for presentations, CSV for further analysis in Excel'
          },
          {
            number: 7,
            title: 'Create the Schedule',
            description: 'Click "Create Schedule" to save. The report will be generated and sent according to your schedule.',
            tip: 'You can run the report immediately using the "Run Now" button'
          }
        ]
      },
      {
        title: 'Managing Schedules',
        content: `
          <p class="mb-4">Once created, you can manage your scheduled reports from the main dashboard.</p>
          
          <div class="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h4 class="font-semibold text-slate-800 dark:text-white mb-4">Available Actions</h4>
            
            <div class="grid md:grid-cols-2 gap-4">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <div>
                  <h5 class="font-medium text-slate-800 dark:text-white">Run Now</h5>
                  <p class="text-sm text-slate-600 dark:text-slate-400">Generate and send the report immediately, outside of the regular schedule.</p>
                </div>
              </div>
              
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <h5 class="font-medium text-slate-800 dark:text-white">Pause / Resume</h5>
                  <p class="text-sm text-slate-600 dark:text-slate-400">Temporarily stop a schedule without deleting it. Resume when ready.</p>
                </div>
              </div>
              
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <h5 class="font-medium text-slate-800 dark:text-white">View History</h5>
                  <p class="text-sm text-slate-600 dark:text-slate-400">See all past runs, including status (success/failed) and timestamps.</p>
                </div>
              </div>
              
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </div>
                <div>
                  <h5 class="font-medium text-slate-800 dark:text-white">Edit</h5>
                  <p class="text-sm text-slate-600 dark:text-slate-400">Modify any aspect of the schedule: name, frequency, recipients, format.</p>
                </div>
              </div>
            </div>
          </div>
        `
      }
    ]
  }
};

// ============= WIKI COMPONENT =============
const Wiki = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('getting-started');
  const [activeSection, setActiveSection] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Get current module
  const currentModule = WIKI_MODULES[selectedModule];

  // Get all modules as array
  const moduleList = Object.values(WIKI_MODULES);

  // Group by category
  const categories = moduleList.reduce((acc, mod) => {
    if (!acc[mod.category]) acc[mod.category] = [];
    acc[mod.category].push(mod);
    return acc;
  }, {});

  // Filter modules based on search
  const filteredModules = moduleList.filter(mod =>
    mod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mod.shortDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if admin
  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-2xl mx-auto text-center py-16">
          <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Access Restricted</h2>
          <p className="text-slate-500 dark:text-slate-400">Only administrators can access the documentation wiki.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                  <BookOpen className="text-indigo-600 dark:text-indigo-400" size={22} />
                </div>
                <div>
                  <h1 className="font-bold text-slate-800 dark:text-white">HR Wiki</h1>
                  <p className="text-xs text-slate-500">Complete Documentation</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
        </div>

        {/* Search */}
        {!sidebarCollapsed && (
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search documentation..."
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {searchTerm ? (
            <div className="space-y-1">
              <p className="text-xs text-slate-500 mb-2">{filteredModules.length} results</p>
              {filteredModules.map(mod => {
                const Icon = mod.icon;
                return (
                  <button
                    key={mod.id}
                    onClick={() => {
                      setSelectedModule(mod.id);
                      setActiveSection(0);
                      setSearchTerm('');
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      selectedModule === mod.id
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon size={18} />
                    {!sidebarCollapsed && <span className="text-sm">{mod.name}</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(categories).map(([category, mods]) => (
                <div key={category}>
                  {!sidebarCollapsed && (
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
                      {category}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {mods.map(mod => {
                      const Icon = mod.icon;
                      return (
                        <button
                          key={mod.id}
                          onClick={() => {
                            setSelectedModule(mod.id);
                            setActiveSection(0);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                            selectedModule === mod.id
                              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                          title={mod.name}
                        >
                          <Icon size={18} className="flex-shrink-0" />
                          {!sidebarCollapsed && (
                            <span className="text-sm truncate">{mod.name}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {currentModule && (
          <div className="max-w-5xl mx-auto p-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
              <BookOpen size={16} />
              <span>Wiki</span>
              <ChevronRight size={14} />
              <span>{currentModule.category}</span>
              <ChevronRight size={14} />
              <span className="text-slate-800 dark:text-white font-medium">{currentModule.name}</span>
            </div>

            {/* Module Header */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 mb-8 text-white">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <currentModule.icon size={32} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{currentModule.name}</h1>
                  <p className="text-lg opacity-90">{currentModule.shortDescription}</p>
                </div>
              </div>
            </div>

            {/* Screenshot if available */}
            {currentModule.screenshot && (
              <div className="mb-8">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                  <img 
                    src={`${API}${currentModule.screenshot}`}
                    alt={`${currentModule.name} Screenshot`}
                    className="w-full rounded-lg shadow-lg"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                </div>
              </div>
            )}

            {/* Section Navigation */}
            {currentModule.sections && currentModule.sections.length > 1 && (
              <div className="mb-8 overflow-x-auto">
                <div className="flex gap-2 min-w-max pb-2">
                  {currentModule.sections.map((section, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveSection(index)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        activeSection === index
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active Section Content */}
            {currentModule.sections && currentModule.sections[activeSection] && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
                  {currentModule.sections[activeSection].title}
                </h2>
                
                {/* Render content based on type */}
                {currentModule.sections[activeSection].type === 'steps' ? (
                  <div className="space-y-6">
                    {currentModule.sections[activeSection].steps.map((step, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                            {step.number}
                          </div>
                          {index < currentModule.sections[activeSection].steps.length - 1 && (
                            <div className="w-0.5 h-full bg-indigo-200 dark:bg-indigo-800 mx-auto mt-2" style={{ minHeight: '40px' }} />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <h4 className="font-semibold text-lg text-slate-800 dark:text-white mb-2">{step.title}</h4>
                          <p className="text-slate-600 dark:text-slate-400 mb-3">{step.description}</p>
                          {step.tip && (
                            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                              <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-amber-700 dark:text-amber-400"><strong>Tip:</strong> {step.tip}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div 
                    className="prose prose-slate dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: currentModule.sections[activeSection].content }}
                  />
                )}
              </div>
            )}

            {/* Navigation Footer */}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                disabled={activeSection === 0}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <ChevronLeft size={18} />
                Previous
              </button>
              <button
                onClick={() => setActiveSection(Math.min(currentModule.sections.length - 1, activeSection + 1))}
                disabled={activeSection === currentModule.sections.length - 1}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700"
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wiki;
