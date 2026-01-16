import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Book, 
  Search, 
  ChevronRight, 
  ChevronDown,
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
  ExternalLink
} from 'lucide-react';
import { Input } from '../components/ui/input';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Module definitions with comprehensive documentation
const MODULES = [
  {
    id: 'overview',
    name: 'Platform Overview',
    icon: Book,
    category: 'Getting Started',
    description: 'Introduction to the HR Platform and its capabilities',
    content: {
      intro: `The HR Platform is a comprehensive, enterprise-grade Human Resource Management System (HRMS) designed to streamline and automate all aspects of human resource operations. Built with modern technologies and best practices, it provides a unified solution for managing your organization's most valuable asset—its people.`,
      features: [
        'Multi-corporation and multi-branch support',
        'Role-based access control with granular permissions',
        'Real-time analytics and reporting',
        'Mobile-responsive Progressive Web App (PWA)',
        'Multi-language and multi-currency support',
        'Automated workflows and approvals',
        'Push notifications and email alerts',
        'Comprehensive audit trails'
      ],
      keyMetrics: [
        { label: '35+ Modules', description: 'Comprehensive HR coverage' },
        { label: 'Real-time', description: 'Live data synchronization' },
        { label: 'Secure', description: 'Enterprise-grade security' },
        { label: 'Scalable', description: 'Grows with your organization' }
      ]
    }
  },
  {
    id: 'employees',
    name: 'Employee Management',
    icon: Users,
    category: 'Core HR',
    description: 'Central hub for managing employee data, profiles, and records',
    content: {
      intro: `The Employee Management module serves as the central repository for all employee-related information. It provides a 360-degree view of each employee, from personal details to employment history, making it the foundation of your HR operations.`,
      features: [
        'Comprehensive employee profiles with 50+ data fields',
        'Document storage and management',
        'Employment history tracking',
        'Emergency contact management',
        'Skills and certifications tracking',
        'Profile picture upload',
        'Custom fields support',
        'Bulk import/export capabilities'
      ],
      workflow: {
        title: 'Employee Lifecycle',
        steps: [
          { name: 'Recruitment', description: 'Candidate sourcing and selection' },
          { name: 'Onboarding', description: 'New hire orientation and setup' },
          { name: 'Active Employment', description: 'Day-to-day HR operations' },
          { name: 'Development', description: 'Training and career growth' },
          { name: 'Offboarding', description: 'Exit process and knowledge transfer' }
        ]
      },
      bestPractices: [
        'Keep employee profiles updated regularly',
        'Ensure emergency contacts are always current',
        'Upload and organize important documents',
        'Track certifications and their expiry dates'
      ]
    }
  },
  {
    id: 'leaves',
    name: 'Leave Management',
    icon: Calendar,
    category: 'Core HR',
    description: 'Streamlined leave requests, approvals, and balance tracking',
    content: {
      intro: `The Leave Management module automates the entire leave request process, from submission to approval. It maintains accurate leave balances, prevents scheduling conflicts, and provides managers with clear visibility into team availability.`,
      features: [
        'Multiple leave types (Annual, Sick, Personal, Maternity, etc.)',
        'Half-day leave support',
        'Leave balance tracking and carryover',
        'Multi-level approval workflows',
        'Team calendar integration',
        'Leave policy configuration',
        'Holiday calendar management',
        'Automatic balance calculations'
      ],
      workflow: {
        title: 'Leave Request Flow',
        steps: [
          { name: 'Request', description: 'Employee submits leave request' },
          { name: 'Review', description: 'Manager reviews team calendar' },
          { name: 'Approve/Reject', description: 'Decision with optional comments' },
          { name: 'Notification', description: 'Employee notified of decision' },
          { name: 'Update', description: 'Balance automatically adjusted' }
        ]
      },
      leaveTypes: [
        { type: 'Annual Leave', default: '20 days', description: 'Paid vacation time' },
        { type: 'Sick Leave', default: '10 days', description: 'Medical absences' },
        { type: 'Personal Leave', default: '5 days', description: 'Personal matters' },
        { type: 'Maternity Leave', default: '90 days', description: 'New mothers' },
        { type: 'Paternity Leave', default: '14 days', description: 'New fathers' },
        { type: 'Bereavement', default: '5 days', description: 'Family loss' }
      ]
    }
  },
  {
    id: 'attendance',
    name: 'Attendance & Time',
    icon: Clock,
    category: 'Core HR',
    description: 'Time tracking, attendance monitoring, and shift management',
    content: {
      intro: `The Attendance module provides comprehensive time tracking capabilities, enabling organizations to monitor work hours, manage shifts, and ensure compliance with labor regulations. It integrates seamlessly with payroll for accurate compensation calculations.`,
      features: [
        'Clock-in/Clock-out functionality',
        'Geolocation tracking (optional)',
        'Shift scheduling and management',
        'Overtime calculation',
        'Late arrival tracking',
        'Early departure monitoring',
        'Timesheet management',
        'Integration with payroll'
      ],
      workflow: {
        title: 'Daily Attendance Flow',
        steps: [
          { name: 'Clock In', description: 'Employee marks arrival' },
          { name: 'Work Period', description: 'Time tracked automatically' },
          { name: 'Breaks', description: 'Optional break tracking' },
          { name: 'Clock Out', description: 'Employee marks departure' },
          { name: 'Review', description: 'Manager reviews timesheets' }
        ]
      }
    }
  },
  {
    id: 'payroll',
    name: 'Payroll Management',
    icon: Wallet,
    category: 'Finance',
    description: 'Salary processing, payslips, and compensation management',
    content: {
      intro: `The Payroll module handles all aspects of employee compensation, from salary structure definition to payslip generation. It automates calculations for allowances, deductions, taxes, and ensures timely and accurate salary disbursement.`,
      features: [
        'Salary structure configuration',
        'Multiple allowance types',
        'Tax calculation and compliance',
        'Payslip generation and distribution',
        'Payroll run management',
        'Bank transfer integration',
        'Year-end tax reports',
        'Multi-currency support'
      ],
      workflow: {
        title: 'Payroll Processing',
        steps: [
          { name: 'Configure', description: 'Set up salary structures' },
          { name: 'Calculate', description: 'Process earnings and deductions' },
          { name: 'Review', description: 'Verify calculations' },
          { name: 'Approve', description: 'Management approval' },
          { name: 'Disburse', description: 'Process payments' },
          { name: 'Distribute', description: 'Send payslips to employees' }
        ]
      },
      components: [
        { name: 'Basic Salary', type: 'Earning', description: 'Base compensation' },
        { name: 'Housing Allowance', type: 'Earning', description: 'Housing support' },
        { name: 'Transport Allowance', type: 'Earning', description: 'Travel support' },
        { name: 'Tax', type: 'Deduction', description: 'Income tax' },
        { name: 'Social Security', type: 'Deduction', description: 'Government contribution' },
        { name: 'Health Insurance', type: 'Deduction', description: 'Medical coverage' }
      ]
    }
  },
  {
    id: 'expenses',
    name: 'Expense Management',
    icon: Receipt,
    category: 'Finance',
    description: 'Expense claims, reimbursements, and budget tracking',
    content: {
      intro: `The Expense Management module streamlines the process of submitting, approving, and reimbursing employee expenses. It provides visibility into spending patterns and helps enforce expense policies across the organization.`,
      features: [
        'Digital receipt upload',
        'Category-based expense tracking',
        'Multi-level approval workflows',
        'Budget monitoring',
        'Reimbursement processing',
        'Expense reports and analytics',
        'Policy compliance checks',
        'Integration with accounting'
      ],
      workflow: {
        title: 'Expense Claim Process',
        steps: [
          { name: 'Submit', description: 'Employee submits expense with receipt' },
          { name: 'Categorize', description: 'Assign expense category' },
          { name: 'Review', description: 'Manager reviews claim' },
          { name: 'Approve', description: 'Approval or rejection' },
          { name: 'Reimburse', description: 'Process reimbursement' }
        ]
      },
      categories: [
        'Travel & Transportation',
        'Meals & Entertainment',
        'Office Supplies',
        'Equipment & Technology',
        'Training & Education',
        'Communication',
        'Accommodation'
      ]
    }
  },
  {
    id: 'recruitment',
    name: 'Recruitment',
    icon: UserPlus,
    category: 'Talent',
    description: 'Job postings, applicant tracking, and hiring workflows',
    content: {
      intro: `The Recruitment module provides end-to-end hiring management, from job posting to offer letter generation. It helps HR teams attract, evaluate, and onboard top talent efficiently while maintaining a positive candidate experience.`,
      features: [
        'Job posting management',
        'Applicant tracking system (ATS)',
        'Resume parsing and storage',
        'Interview scheduling',
        'Candidate evaluation scorecards',
        'Offer letter generation',
        'Hiring pipeline visualization',
        'Recruitment analytics'
      ],
      workflow: {
        title: 'Hiring Pipeline',
        steps: [
          { name: 'Job Posting', description: 'Create and publish job openings' },
          { name: 'Applications', description: 'Receive and screen candidates' },
          { name: 'Screening', description: 'Initial qualification review' },
          { name: 'Interviews', description: 'Conduct interview rounds' },
          { name: 'Evaluation', description: 'Assess and compare candidates' },
          { name: 'Offer', description: 'Extend offer to selected candidate' },
          { name: 'Onboarding', description: 'Begin employee onboarding' }
        ]
      }
    }
  },
  {
    id: 'training',
    name: 'Training & Development',
    icon: GraduationCap,
    category: 'Talent',
    description: 'Learning management, course tracking, and skill development',
    content: {
      intro: `The Training module enables organizations to create, deliver, and track employee learning programs. It supports various training formats and provides insights into skill development across the workforce.`,
      features: [
        'Course catalog management',
        'Video and document-based learning',
        'Training assignments and tracking',
        'Progress monitoring',
        'Certification management',
        'Training request workflows',
        'Skill gap analysis',
        'Learning path creation'
      ],
      workflow: {
        title: 'Training Lifecycle',
        steps: [
          { name: 'Identify', description: 'Identify training needs' },
          { name: 'Assign', description: 'Assign courses to employees' },
          { name: 'Learn', description: 'Employee completes training' },
          { name: 'Assess', description: 'Evaluate learning outcomes' },
          { name: 'Certify', description: 'Issue completion certificates' }
        ]
      }
    }
  },
  {
    id: 'performance',
    name: 'Performance Management',
    icon: Target,
    category: 'Talent',
    description: 'Goal setting, reviews, and performance tracking',
    content: {
      intro: `The Performance Management module facilitates continuous performance evaluation through goal setting, regular feedback, and structured reviews. It helps align individual performance with organizational objectives.`,
      features: [
        'Goal setting and tracking (OKRs/KPIs)',
        'Self-assessment capabilities',
        'Manager evaluations',
        '360-degree feedback',
        'Performance review cycles',
        'Rating scales and competencies',
        'Performance improvement plans',
        'Historical performance data'
      ],
      workflow: {
        title: 'Performance Review Cycle',
        steps: [
          { name: 'Goal Setting', description: 'Define objectives and KPIs' },
          { name: 'Ongoing Feedback', description: 'Regular check-ins and feedback' },
          { name: 'Self-Assessment', description: 'Employee self-evaluation' },
          { name: 'Manager Review', description: 'Manager assessment and rating' },
          { name: 'Calibration', description: 'Cross-team alignment' },
          { name: 'Feedback Session', description: 'Review discussion' }
        ]
      }
    }
  },
  {
    id: 'appraisals',
    name: 'Appraisals',
    icon: Award,
    category: 'Talent',
    description: 'Formal appraisal cycles and employee evaluations',
    content: {
      intro: `The Appraisals module manages formal evaluation cycles, enabling organizations to conduct structured assessments of employee performance. It supports various appraisal methodologies and provides comprehensive evaluation frameworks.`,
      features: [
        'Appraisal cycle management',
        'Customizable evaluation forms',
        'Multiple rating scales',
        'Competency-based assessments',
        'Goal achievement tracking',
        'Peer feedback integration',
        'Appraisal history',
        'Compensation recommendations'
      ],
      workflow: {
        title: 'Appraisal Process',
        steps: [
          { name: 'Create Cycle', description: 'Define appraisal period and criteria' },
          { name: 'Self-Assessment', description: 'Employees complete self-review' },
          { name: 'Manager Review', description: 'Managers evaluate team members' },
          { name: 'Calibration', description: 'Ensure rating consistency' },
          { name: 'Finalize', description: 'Complete and acknowledge' }
        ]
      }
    }
  },
  {
    id: 'compliance',
    name: 'Compliance & Legal',
    icon: Shield,
    category: 'Operations',
    description: 'Policy management, compliance tracking, and legal documentation',
    content: {
      intro: `The Compliance & Legal module ensures your organization maintains regulatory compliance and manages legal documentation effectively. It tracks policy acknowledgments, compliance training, and incidents.`,
      features: [
        'Policy creation and versioning',
        'Employee acknowledgment tracking',
        'Compliance training management',
        'Legal document management',
        'Digital signature collection',
        'Incident reporting',
        'Certification tracking',
        'Audit trail maintenance'
      ],
      workflow: {
        title: 'Policy Compliance Flow',
        steps: [
          { name: 'Create Policy', description: 'Draft and review policy' },
          { name: 'Publish', description: 'Make policy active' },
          { name: 'Distribute', description: 'Notify affected employees' },
          { name: 'Acknowledge', description: 'Collect acknowledgments' },
          { name: 'Monitor', description: 'Track compliance status' }
        ]
      }
    }
  },
  {
    id: 'visitors',
    name: 'Visitor Management',
    icon: UserCheck,
    category: 'Operations',
    description: 'Guest registration, check-in/out, and badge printing',
    content: {
      intro: `The Visitor Management module provides a professional system for managing guests and visitors to your facilities. It enhances security, creates a welcoming experience, and maintains visitor records for compliance.`,
      features: [
        'Pre-registration of visitors',
        'Walk-in registration',
        'Digital check-in/check-out',
        'ID verification',
        'Badge printing',
        'Host notifications',
        'NDA signing',
        'Visitor history and reports'
      ],
      workflow: {
        title: 'Visitor Check-in Process',
        steps: [
          { name: 'Pre-register', description: 'Host registers expected visitor' },
          { name: 'Arrival', description: 'Visitor arrives at reception' },
          { name: 'Verify', description: 'ID verification and NDA' },
          { name: 'Badge', description: 'Print visitor badge' },
          { name: 'Notify', description: 'Alert host of arrival' },
          { name: 'Check-out', description: 'Record departure time' }
        ]
      }
    }
  },
  {
    id: 'workforce',
    name: 'Workforce Planning',
    icon: Users,
    category: 'Operations',
    description: 'Headcount planning, resource allocation, and capacity management',
    content: {
      intro: `The Workforce Planning module helps organizations optimize their human capital by providing tools for headcount planning, skills gap analysis, and resource allocation. It enables data-driven decisions about workforce composition.`,
      features: [
        'Headcount planning by department',
        'Budget allocation tracking',
        'Skills gap analysis',
        'Resource allocation to projects',
        'Scenario modeling',
        'Utilization tracking',
        'Capacity planning',
        'Workforce forecasting'
      ],
      workflow: {
        title: 'Workforce Planning Cycle',
        steps: [
          { name: 'Analyze', description: 'Assess current workforce' },
          { name: 'Forecast', description: 'Project future needs' },
          { name: 'Plan', description: 'Create headcount plans' },
          { name: 'Allocate', description: 'Assign resources' },
          { name: 'Monitor', description: 'Track utilization' }
        ]
      }
    }
  },
  {
    id: 'scheduled-reports',
    name: 'Scheduled Reports',
    icon: CalendarClock,
    category: 'Analytics',
    description: 'Automated report delivery and scheduling',
    content: {
      intro: `The Scheduled Reports module automates the delivery of HR reports to stakeholders. Configure reports to be generated and emailed on a regular schedule, ensuring decision-makers always have access to up-to-date information.`,
      features: [
        'Multiple report types (Analytics, Leave, Attendance, etc.)',
        'Flexible scheduling (Daily, Weekly, Monthly)',
        'Multiple recipients support',
        'PDF and CSV formats',
        'Date range customization',
        'On-demand report generation',
        'Run history tracking',
        'Report preview capability'
      ],
      workflow: {
        title: 'Report Scheduling Flow',
        steps: [
          { name: 'Configure', description: 'Set up report parameters' },
          { name: 'Schedule', description: 'Define frequency and time' },
          { name: 'Generate', description: 'System generates report' },
          { name: 'Deliver', description: 'Email sent to recipients' },
          { name: 'Track', description: 'Monitor delivery status' }
        ]
      },
      reportTypes: [
        { name: 'HR Analytics', description: 'Headcount, turnover, department stats' },
        { name: 'Leave Report', description: 'Leave requests and balances' },
        { name: 'Attendance Report', description: 'Clock-in/out and working hours' },
        { name: 'Compliance Report', description: 'Policies, trainings, incidents' },
        { name: 'Workforce Planning', description: 'Headcount plans and allocations' },
        { name: 'Visitor Report', description: 'Visitor logs and check-ins' },
        { name: 'Employee Directory', description: 'Employee list and departments' }
      ]
    }
  },
  {
    id: 'analytics',
    name: 'HR Analytics',
    icon: BarChart3,
    category: 'Analytics',
    description: 'Comprehensive HR metrics, dashboards, and insights',
    content: {
      intro: `The HR Analytics module provides deep insights into your workforce through interactive dashboards and reports. It transforms HR data into actionable intelligence, enabling data-driven decision making.`,
      features: [
        'Real-time dashboards',
        'Headcount and turnover analysis',
        'Hiring funnel metrics',
        'Salary benchmarking',
        'Workforce forecasting',
        'Department comparisons',
        'Trend analysis',
        'Custom report builder'
      ],
      metrics: [
        { name: 'Headcount', description: 'Total active employees' },
        { name: 'Turnover Rate', description: 'Annual employee turnover percentage' },
        { name: 'Time to Hire', description: 'Average days to fill positions' },
        { name: 'Cost per Hire', description: 'Average recruitment cost' },
        { name: 'Employee Satisfaction', description: 'Survey-based satisfaction score' },
        { name: 'Training Hours', description: 'Average training hours per employee' }
      ]
    }
  },
  {
    id: 'assets',
    name: 'Asset Management',
    icon: Package,
    category: 'Operations',
    description: 'Company equipment and asset tracking',
    content: {
      intro: `The Asset Management module tracks company equipment assigned to employees. It maintains a complete inventory of assets, their condition, and assignment history, ensuring accountability and efficient resource utilization.`,
      features: [
        'Asset inventory management',
        'Assignment tracking',
        'Condition monitoring',
        'Maintenance scheduling',
        'Depreciation tracking',
        'Asset categories',
        'Barcode/QR code support',
        'Return and disposal workflows'
      ],
      workflow: {
        title: 'Asset Lifecycle',
        steps: [
          { name: 'Procure', description: 'Add asset to inventory' },
          { name: 'Assign', description: 'Allocate to employee' },
          { name: 'Track', description: 'Monitor condition and usage' },
          { name: 'Maintain', description: 'Schedule maintenance' },
          { name: 'Return', description: 'Collect on termination' },
          { name: 'Dispose', description: 'Retire or sell asset' }
        ]
      }
    }
  },
  {
    id: 'documents',
    name: 'Document Management',
    icon: FileCheck,
    category: 'Operations',
    description: 'Document storage, approvals, and version control',
    content: {
      intro: `The Document Management module provides a centralized repository for HR-related documents. It supports document approvals, version control, and ensures secure access to sensitive information.`,
      features: [
        'Secure document storage',
        'Version control',
        'Document categorization',
        'Approval workflows',
        'Digital signatures',
        'Access control',
        'Document templates',
        'Expiry tracking'
      ],
      categories: [
        'Employment Contracts',
        'Policy Documents',
        'Training Certificates',
        'Performance Reviews',
        'Legal Agreements',
        'ID Documents',
        'Tax Forms'
      ]
    }
  },
  {
    id: 'tickets',
    name: 'Help Desk / Tickets',
    icon: Ticket,
    category: 'Support',
    description: 'Internal support tickets and issue tracking',
    content: {
      intro: `The Tickets module provides an internal help desk system for employees to raise HR-related queries and issues. It ensures timely resolution and maintains a knowledge base of common questions.`,
      features: [
        'Ticket submission',
        'Category-based routing',
        'Priority levels',
        'Assignment and escalation',
        'Status tracking',
        'SLA monitoring',
        'Ticket history',
        'Resolution analytics'
      ],
      workflow: {
        title: 'Ticket Resolution Flow',
        steps: [
          { name: 'Submit', description: 'Employee raises ticket' },
          { name: 'Categorize', description: 'Auto or manual categorization' },
          { name: 'Assign', description: 'Route to appropriate team' },
          { name: 'Resolve', description: 'Address the issue' },
          { name: 'Close', description: 'Confirm resolution' }
        ]
      }
    }
  },
  {
    id: 'communications',
    name: 'Communications',
    icon: Megaphone,
    category: 'Support',
    description: 'Company announcements and internal communications',
    content: {
      intro: `The Communications module facilitates internal communication through announcements, newsletters, and targeted messages. It ensures important information reaches the right employees at the right time.`,
      features: [
        'Company-wide announcements',
        'Targeted communications',
        'Rich text formatting',
        'Attachment support',
        'Read receipts',
        'Scheduled publishing',
        'Communication history',
        'Push notifications'
      ]
    }
  },
  {
    id: 'org-structure',
    name: 'Organization Structure',
    icon: Network,
    category: 'Administration',
    description: 'Corporations, branches, departments, and divisions',
    content: {
      intro: `The Organization Structure module defines your company's hierarchy. It supports multi-corporation setups with branches, departments, and divisions, providing the foundation for role-based access and reporting.`,
      features: [
        'Multi-corporation support',
        'Branch management',
        'Department configuration',
        'Division setup',
        'Reporting relationships',
        'Organization chart',
        'Cost center mapping',
        'Location management'
      ],
      hierarchy: [
        { level: 1, name: 'Corporation', description: 'Top-level legal entity' },
        { level: 2, name: 'Branch', description: 'Physical or logical business unit' },
        { level: 3, name: 'Department', description: 'Functional area (HR, Finance, etc.)' },
        { level: 4, name: 'Division', description: 'Sub-unit within department' }
      ]
    }
  },
  {
    id: 'settings',
    name: 'System Settings',
    icon: Settings,
    category: 'Administration',
    description: 'Global configuration, integrations, and preferences',
    content: {
      intro: `The Settings module provides centralized configuration for the entire platform. It includes branding, language settings, email configuration, and various integrations.`,
      features: [
        'Language configuration',
        'Currency settings',
        'Exchange rates',
        'Branding customization',
        'Theme settings (Light/Dark mode)',
        'Email (SMTP) configuration',
        'SMS provider setup',
        'Push notification settings'
      ],
      sections: [
        { name: 'General', description: 'Language, currency, timezone' },
        { name: 'Branding', description: 'Logo, colors, app name' },
        { name: 'Email', description: 'SMTP server configuration' },
        { name: 'Notifications', description: 'Push notification triggers' },
        { name: 'Integrations', description: 'Third-party connections' }
      ]
    }
  }
];

// Category colors
const CATEGORY_COLORS = {
  'Getting Started': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  'Core HR': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  'Finance': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
  'Talent': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  'Operations': { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
  'Analytics': { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
  'Support': { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
  'Administration': { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-600' }
};

// Flowchart component
const WorkflowDiagram = ({ workflow }) => {
  if (!workflow) return null;
  
  return (
    <div className="my-6">
      <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <Workflow size={20} className="text-indigo-600" />
        {workflow.title}
      </h4>
      <div className="relative">
        {/* Desktop horizontal flow */}
        <div className="hidden md:flex items-center justify-between gap-2 overflow-x-auto pb-4">
          {workflow.steps.map((step, index) => (
            <React.Fragment key={index}>
              <div className="flex-shrink-0 w-36">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl p-4 text-center shadow-lg">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                    {index + 1}
                  </div>
                  <p className="font-semibold text-sm">{step.name}</p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2 px-1">
                  {step.description}
                </p>
              </div>
              {index < workflow.steps.length - 1 && (
                <ArrowRight className="flex-shrink-0 text-indigo-400" size={24} />
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Mobile vertical flow */}
        <div className="md:hidden space-y-3">
          {workflow.steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {index + 1}
                </div>
                {index < workflow.steps.length - 1 && (
                  <div className="w-0.5 h-8 bg-indigo-200 dark:bg-indigo-800 mt-2" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <p className="font-semibold text-slate-800 dark:text-white">{step.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Feature list component
const FeatureList = ({ features }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
    {features.map((feature, index) => (
      <div key={index} className="flex items-start gap-2">
        <CheckCircle2 className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
        <span className="text-slate-700 dark:text-slate-300 text-sm">{feature}</span>
      </div>
    ))}
  </div>
);

// Info card component
const InfoCard = ({ title, items, type = 'default' }) => {
  const colors = {
    default: 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
  };
  
  return (
    <div className={`rounded-xl border p-4 my-4 ${colors[type]}`}>
      {title && (
        <h5 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
          <Info size={16} className="text-blue-500" />
          {title}
        </h5>
      )}
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
            <Circle size={6} className="text-slate-400 mt-1.5 flex-shrink-0" />
            {typeof item === 'string' ? item : (
              <span><strong>{item.name || item.type || item.label}:</strong> {item.description || item.default}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const Wiki = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('overview');
  const [expandedCategories, setExpandedCategories] = useState(['Getting Started', 'Core HR']);

  // Group modules by category
  const groupedModules = MODULES.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {});

  // Filter modules based on search
  const filteredModules = MODULES.filter(module =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get current module
  const currentModule = MODULES.find(m => m.id === selectedModule) || MODULES[0];

  // Toggle category expansion
  const toggleCategory = (category) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Check if user is admin
  const isAdmin = user?.role === 'super_admin' || user?.role === 'corp_admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-2xl mx-auto text-center py-16">
          <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Access Restricted</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Only administrators can access the documentation wiki.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 min-h-screen sticky top-0 overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <BookOpen className="text-indigo-600 dark:text-indigo-400" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">HR Wiki</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Documentation & Guides</p>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search modules..."
                className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4">
            {searchTerm ? (
              // Search results
              <div className="space-y-1">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 px-2">
                  {filteredModules.length} result{filteredModules.length !== 1 ? 's' : ''}
                </p>
                {filteredModules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <button
                      key={module.id}
                      onClick={() => {
                        setSelectedModule(module.id);
                        setSearchTerm('');
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        selectedModule === module.id
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-sm font-medium">{module.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              // Category navigation
              <div className="space-y-2">
                {Object.entries(groupedModules).map(([category, modules]) => (
                  <div key={category}>
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <span className={`text-sm font-semibold ${CATEGORY_COLORS[category]?.text || 'text-slate-700 dark:text-slate-300'}`}>
                        {category}
                      </span>
                      {expandedCategories.includes(category) ? (
                        <ChevronDown size={16} className="text-slate-400" />
                      ) : (
                        <ChevronRight size={16} className="text-slate-400" />
                      )}
                    </button>
                    
                    {expandedCategories.includes(category) && (
                      <div className="ml-2 mt-1 space-y-0.5">
                        {modules.map((module) => {
                          const Icon = module.icon;
                          return (
                            <button
                              key={module.id}
                              onClick={() => setSelectedModule(module.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                                selectedModule === module.id
                                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              <Icon size={16} />
                              <span className="text-sm">{module.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 max-w-5xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
            <BookOpen size={16} />
            <span>Wiki</span>
            <ChevronRight size={14} />
            <span>{currentModule.category}</span>
            <ChevronRight size={14} />
            <span className="text-slate-800 dark:text-white font-medium">{currentModule.name}</span>
          </div>

          {/* Module Header */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className={`p-4 rounded-2xl ${CATEGORY_COLORS[currentModule.category]?.bg}`}>
                <currentModule.icon className={CATEGORY_COLORS[currentModule.category]?.text} size={32} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                    {currentModule.name}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[currentModule.category]?.bg} ${CATEGORY_COLORS[currentModule.category]?.text}`}>
                    {currentModule.category}
                  </span>
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  {currentModule.description}
                </p>
              </div>
            </div>
          </div>

          {/* Introduction */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Info className="text-indigo-600" size={22} />
              Overview
            </h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
              {currentModule.content.intro}
            </p>
            
            {/* Key Metrics for Overview */}
            {currentModule.content.keyMetrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {currentModule.content.keyMetrics.map((metric, index) => (
                  <div key={index} className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white text-center">
                    <p className="text-2xl font-bold">{metric.label}</p>
                    <p className="text-sm opacity-90">{metric.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Features */}
          {currentModule.content.features && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Zap className="text-amber-500" size={22} />
                Key Features
              </h3>
              <FeatureList features={currentModule.content.features} />
            </div>
          )}

          {/* Workflow Diagram */}
          {currentModule.content.workflow && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
              <WorkflowDiagram workflow={currentModule.content.workflow} />
            </div>
          )}

          {/* Leave Types (for Leave module) */}
          {currentModule.content.leaveTypes && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="text-blue-500" size={22} />
                Leave Types
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentModule.content.leaveTypes.map((leave, index) => (
                  <div key={index} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                    <p className="font-semibold text-slate-800 dark:text-white">{leave.type}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{leave.description}</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">Default: {leave.default}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payroll Components */}
          {currentModule.content.components && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Wallet className="text-green-500" size={22} />
                Salary Components
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentModule.content.components.map((comp, index) => (
                  <div key={index} className={`rounded-xl p-4 border ${
                    comp.type === 'Earning' 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-slate-800 dark:text-white">{comp.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        comp.type === 'Earning' 
                          ? 'bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-300' 
                          : 'bg-red-200 text-red-700 dark:bg-red-800 dark:text-red-300'
                      }`}>
                        {comp.type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{comp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report Types (for Scheduled Reports) */}
          {currentModule.content.reportTypes && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <FileCheck className="text-indigo-500" size={22} />
                Available Report Types
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentModule.content.reportTypes.map((report, index) => (
                  <div key={index} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600 flex items-start gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <BarChart3 className="text-indigo-600 dark:text-indigo-400" size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">{report.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{report.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Metrics */}
          {currentModule.content.metrics && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="text-indigo-500" size={22} />
                Key Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentModule.content.metrics.map((metric, index) => (
                  <div key={index} className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                    <p className="font-semibold text-slate-800 dark:text-white">{metric.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{metric.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Organization Hierarchy */}
          {currentModule.content.hierarchy && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Network className="text-purple-500" size={22} />
                Organization Hierarchy
              </h3>
              <div className="space-y-3">
                {currentModule.content.hierarchy.map((level, index) => (
                  <div key={index} className="flex items-center gap-4" style={{ marginLeft: `${(level.level - 1) * 24}px` }}>
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                      {level.level}
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                      <p className="font-semibold text-slate-800 dark:text-white">{level.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{level.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories (for various modules) */}
          {currentModule.content.categories && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <FolderTree className="text-amber-500" size={22} />
                Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {currentModule.content.categories.map((category, index) => (
                  <span key={index} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium">
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Settings Sections */}
          {currentModule.content.sections && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Settings className="text-slate-500" size={22} />
                Configuration Sections
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentModule.content.sections.map((section, index) => (
                  <div key={index} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                    <p className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                      <ChevronRight size={16} className="text-indigo-500" />
                      {section.name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 ml-6">{section.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best Practices */}
          {currentModule.content.bestPractices && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-8 mb-8">
              <h3 className="text-xl font-bold text-green-800 dark:text-green-300 mb-4 flex items-center gap-2">
                <CheckCircle2 className="text-green-600" size={22} />
                Best Practices
              </h3>
              <ul className="space-y-3">
                {currentModule.content.bestPractices.map((practice, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 size={14} className="text-green-700 dark:text-green-300" />
                    </div>
                    <span className="text-green-800 dark:text-green-200">{practice}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Play className="text-indigo-600" size={22} />
              Quick Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              {currentModule.id !== 'overview' && (
                <a
                  href={`/${currentModule.id === 'org-structure' ? 'corporations' : currentModule.id === 'scheduled-reports' ? 'scheduled-reports' : currentModule.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  <ExternalLink size={16} />
                  Go to {currentModule.name}
                </a>
              )}
              <button
                onClick={() => setSelectedModule('overview')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
              >
                <BookOpen size={16} />
                Back to Overview
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wiki;
