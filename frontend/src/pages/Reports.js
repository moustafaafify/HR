import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  BarChart3,
  Users,
  Ticket,
  Calendar,
  Receipt,
  GraduationCap,
  Target,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Filter,
  PieChart,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Briefcase,
  FileText,
  FileSpreadsheet,
  Printer,
  ChevronDown
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

// Simple chart components (no external library needed)
const BarChartSimple = ({ data, height = 200, color = '#2D4F38' }) => {
  if (!data || data.length === 0) return <div className="text-stone-400 text-center py-8">No data</div>;
  const maxValue = Math.max(...data.map(d => d.value || d.count || 0));
  
  return (
    <div className="flex items-end justify-between gap-2" style={{ height }}>
      {data.map((item, i) => {
        const value = item.value || item.count || 0;
        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
        return (
          <div key={i} className="flex flex-col items-center flex-1">
            <span className="text-xs font-semibold text-stone-700 mb-1">{value}</span>
            <div
              className="w-full rounded-t-lg transition-all duration-500"
              style={{
                height: `${Math.max(percentage, 5)}%`,
                backgroundColor: color,
                minHeight: '8px'
              }}
            />
            <span className="text-xs text-stone-500 mt-2 truncate max-w-full" title={item.name || item.month || item.week}>
              {(item.name || item.month || item.week || '').slice(-5)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const DonutChart = ({ data, size = 160 }) => {
  if (!data || data.length === 0) return <div className="text-stone-400 text-center py-8">No data</div>;
  
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
  const colors = ['#2D4F38', '#4A7C59', '#6B9B7A', '#8CBA9B', '#ADDABC', '#CEF2DD'];
  
  let currentAngle = 0;
  const segments = data.map((d, i) => {
    const percentage = total > 0 ? (d.value / total) * 100 : 0;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return { ...d, percentage, startAngle, angle, color: colors[i % colors.length] };
  });

  const radius = size / 2;
  const innerRadius = radius * 0.6;

  const polarToCartesian = (cx, cy, r, angle) => {
    const rad = (angle - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const createArc = (startAngle, endAngle, r) => {
    const start = polarToCartesian(radius, radius, r, startAngle);
    const end = polarToCartesian(radius, radius, r, endAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size}>
        {segments.map((seg, i) => (
          <path
            key={i}
            d={`${createArc(seg.startAngle, seg.startAngle + seg.angle - 0.5, radius - 5)} 
                L ${polarToCartesian(radius, radius, innerRadius, seg.startAngle + seg.angle - 0.5).x} 
                  ${polarToCartesian(radius, radius, innerRadius, seg.startAngle + seg.angle - 0.5).y}
                ${createArc(seg.startAngle + seg.angle - 0.5, seg.startAngle, innerRadius).replace('M', 'A').split('A')[1]}
                Z`}
            fill={seg.color}
            className="transition-all duration-300 hover:opacity-80"
          />
        ))}
        <text x={radius} y={radius} textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-stone-800">
          {total}
        </text>
      </svg>
      <div className="space-y-1">
        {segments.slice(0, 5).map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-stone-600">{seg.name}</span>
            <span className="text-stone-400">({seg.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'stone' }) => {
  const colorClasses = {
    green: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    stone: 'bg-stone-100 text-stone-600'
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${colorClasses[color]}`}>
          <Icon size={20} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-stone-900">{value}</p>
        <p className="text-sm text-stone-500 mt-1">{title}</p>
        {subtitle && <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};

const Reports = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [leaveData, setLeaveData] = useState(null);
  const [expenseData, setExpenseData] = useState(null);
  const [trainingData, setTrainingData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [overviewRes, employeeRes, ticketRes, leaveRes, expenseRes, trainingRes, performanceRes] = await Promise.all([
        axios.get(`${API}/api/reports/overview`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API}/api/reports/employees`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API}/api/reports/tickets`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API}/api/reports/leaves`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API}/api/reports/expenses`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API}/api/reports/training`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API}/api/reports/performance`, { headers }).catch(() => ({ data: null }))
      ]);

      setOverview(overviewRes.data);
      setEmployeeData(employeeRes.data);
      setTicketData(ticketRes.data);
      setLeaveData(leaveRes.data);
      setExpenseData(expenseRes.data);
      setTrainingData(trainingRes.data);
      setPerformanceData(performanceRes.data);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'leaves', label: 'Leaves', icon: Calendar },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'training', label: 'Training', icon: GraduationCap },
    { id: 'performance', label: 'Performance', icon: Target }
  ];

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate CSV content based on active tab
  const generateCSV = () => {
    let csvContent = '';
    let filename = '';
    const now = new Date().toISOString().split('T')[0];

    switch (activeTab) {
      case 'overview':
        filename = `hr_overview_report_${now}.csv`;
        csvContent = 'Metric,Value,Details\n';
        if (overview) {
          csvContent += `Total Employees,${overview.employees?.total || 0},${overview.employees?.active || 0} active\n`;
          csvContent += `New Hires (30 days),${overview.employees?.new_hires_30d || 0},\n`;
          csvContent += `Open Tickets,${overview.tickets?.open || 0},${overview.tickets?.resolution_rate || 0}% resolution rate\n`;
          csvContent += `Total Tickets,${overview.tickets?.total || 0},\n`;
          csvContent += `Pending Leaves,${overview.leaves?.pending || 0},\n`;
          csvContent += `Approved Leaves,${overview.leaves?.approved || 0},\n`;
          csvContent += `Pending Expenses,${overview.expenses?.pending || 0},\n`;
        }
        break;

      case 'employees':
        filename = `employee_report_${now}.csv`;
        csvContent = 'Category,Item,Count\n';
        if (employeeData) {
          csvContent += `Total,All Employees,${employeeData.total}\n`;
          employeeData.by_department?.forEach(d => {
            csvContent += `Department,${d.name},${d.value}\n`;
          });
          employeeData.by_employment_type?.forEach(d => {
            csvContent += `Employment Type,${d.name},${d.value}\n`;
          });
          employeeData.by_status?.forEach(d => {
            csvContent += `Status,${d.name},${d.value}\n`;
          });
          employeeData.by_gender?.forEach(d => {
            csvContent += `Gender,${d.name},${d.value}\n`;
          });
          employeeData.by_location?.forEach(d => {
            csvContent += `Work Location,${d.name},${d.value}\n`;
          });
          employeeData.tenure_distribution?.forEach(d => {
            csvContent += `Tenure (years),${d.name},${d.value}\n`;
          });
        }
        break;

      case 'tickets':
        filename = `ticket_report_${now}.csv`;
        csvContent = 'Category,Item,Count\n';
        if (ticketData) {
          csvContent += `Total,All Tickets,${ticketData.total}\n`;
          csvContent += `Metric,Average Resolution Time (hours),${ticketData.avg_resolution_hours}\n`;
          ticketData.by_status?.forEach(d => {
            csvContent += `Status,${d.name},${d.value}\n`;
          });
          ticketData.by_category?.forEach(d => {
            csvContent += `Category,${d.name},${d.value}\n`;
          });
          ticketData.by_priority?.forEach(d => {
            csvContent += `Priority,${d.name},${d.value}\n`;
          });
          ticketData.weekly_volume?.forEach(d => {
            csvContent += `Weekly Volume,${d.week},${d.count}\n`;
          });
        }
        break;

      case 'leaves':
        filename = `leave_report_${now}.csv`;
        csvContent = 'Category,Item,Count\n';
        if (leaveData) {
          csvContent += `Total,All Leave Requests,${leaveData.total}\n`;
          leaveData.by_status?.forEach(d => {
            csvContent += `Status,${d.name},${d.value}\n`;
          });
          leaveData.by_type?.forEach(d => {
            csvContent += `Leave Type,${d.name},${d.value}\n`;
          });
          leaveData.days_by_type?.forEach(d => {
            csvContent += `Days Taken,${d.name},${d.value}\n`;
          });
          leaveData.monthly_trend?.forEach(d => {
            csvContent += `Monthly Trend,${d.month},${d.count}\n`;
          });
        }
        break;

      case 'expenses':
        filename = `expense_report_${now}.csv`;
        csvContent = 'Category,Item,Value\n';
        if (expenseData) {
          csvContent += `Total,All Expense Claims,${expenseData.total}\n`;
          csvContent += `Amount,Total Amount,$${expenseData.total_amount}\n`;
          csvContent += `Amount,Approved Amount,$${expenseData.approved_amount}\n`;
          expenseData.by_status?.forEach(d => {
            csvContent += `Status,${d.name},${d.value}\n`;
          });
          expenseData.by_category?.forEach(d => {
            csvContent += `Category (Count),${d.name},${d.value}\n`;
          });
          expenseData.amount_by_category?.forEach(d => {
            csvContent += `Category (Amount),${d.name},$${d.value}\n`;
          });
        }
        break;

      case 'training':
        filename = `training_report_${now}.csv`;
        csvContent = 'Category,Item,Value\n';
        if (trainingData) {
          csvContent += `Total,Total Trainings,${trainingData.total_trainings}\n`;
          csvContent += `Total,Total Enrollments,${trainingData.total_enrollments}\n`;
          csvContent += `Metric,Completion Rate,${trainingData.completion_rate}%\n`;
          trainingData.by_status?.forEach(d => {
            csvContent += `Status,${d.name},${d.value}\n`;
          });
          trainingData.by_training?.forEach(d => {
            csvContent += `Training,${d.name},${d.value}\n`;
          });
        }
        break;

      case 'performance':
        filename = `performance_report_${now}.csv`;
        csvContent = 'Category,Item,Value\n';
        if (performanceData) {
          csvContent += `Total,Total Reviews,${performanceData.total}\n`;
          csvContent += `Metric,Average Rating,${performanceData.average_rating}\n`;
          performanceData.by_status?.forEach(d => {
            csvContent += `Status,${d.name},${d.value}\n`;
          });
          performanceData.rating_distribution?.forEach(d => {
            csvContent += `Rating,${d.rating} Stars,${d.count}\n`;
          });
        }
        break;

      default:
        filename = `report_${now}.csv`;
        csvContent = 'No data available\n';
    }

    return { csvContent, filename };
  };

  // Export to CSV
  const exportToCSV = () => {
    const { csvContent, filename } = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${activeTab} report to CSV`);
    setShowExportMenu(false);
  };

  // Export to PDF (using print dialog with custom styling)
  const exportToPDF = () => {
    const printContent = document.getElementById('report-content');
    if (!printContent) {
      toast.error('Could not find report content');
      return;
    }

    const now = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
    const tabLabel = tabs.find(t => t.id === activeTab)?.label || 'Report';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>HR Platform - ${tabLabel} Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              padding: 40px;
              color: #1c1917;
              line-height: 1.5;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #2D4F38;
            }
            .header h1 { 
              color: #2D4F38; 
              font-size: 28px;
              margin-bottom: 8px;
            }
            .header p { color: #78716c; font-size: 14px; }
            .section { margin-bottom: 30px; }
            .section h2 { 
              font-size: 18px; 
              color: #2D4F38;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 1px solid #e7e5e4;
            }
            .stats-grid { 
              display: grid; 
              grid-template-columns: repeat(4, 1fr); 
              gap: 15px;
              margin-bottom: 20px;
            }
            .stat-card { 
              background: #fafaf9;
              border: 1px solid #e7e5e4;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
            }
            .stat-value { 
              font-size: 24px; 
              font-weight: bold;
              color: #2D4F38;
            }
            .stat-label { font-size: 12px; color: #78716c; margin-top: 4px; }
            table { 
              width: 100%; 
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td { 
              padding: 10px 12px;
              text-align: left;
              border-bottom: 1px solid #e7e5e4;
            }
            th { 
              background: #fafaf9;
              font-weight: 600;
              color: #44403c;
            }
            .footer { 
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #a8a29e;
            }
            @media print {
              body { padding: 20px; }
              .stats-grid { grid-template-columns: repeat(2, 1fr); }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HR Platform - ${tabLabel} Report</h1>
            <p>Generated on ${now}</p>
          </div>
          ${generatePDFContent()}
          <div class="footer">
            <p>This report was automatically generated by HR Platform</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
    toast.success(`Printing ${activeTab} report`);
    setShowExportMenu(false);
  };

  // Generate PDF content based on active tab
  const generatePDFContent = () => {
    switch (activeTab) {
      case 'overview':
        return `
          <div class="section">
            <h2>Overview Summary</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${overview?.employees?.total || 0}</div>
                <div class="stat-label">Total Employees</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${overview?.tickets?.open || 0}</div>
                <div class="stat-label">Open Tickets</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${overview?.leaves?.pending || 0}</div>
                <div class="stat-label">Pending Leaves</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${overview?.expenses?.pending || 0}</div>
                <div class="stat-label">Pending Expenses</div>
              </div>
            </div>
            <table>
              <tr><th>Metric</th><th>Value</th><th>Notes</th></tr>
              <tr><td>Active Employees</td><td>${overview?.employees?.active || 0}</td><td>Currently active</td></tr>
              <tr><td>New Hires (30 days)</td><td>${overview?.employees?.new_hires_30d || 0}</td><td>Last 30 days</td></tr>
              <tr><td>Ticket Resolution Rate</td><td>${overview?.tickets?.resolution_rate || 0}%</td><td></td></tr>
              <tr><td>Approved Leaves</td><td>${overview?.leaves?.approved || 0}</td><td></td></tr>
            </table>
          </div>
        `;

      case 'employees':
        return `
          <div class="section">
            <h2>Employee Statistics</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${employeeData?.total || 0}</div>
                <div class="stat-label">Total Employees</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${employeeData?.by_employment_type?.find(t => t.name === 'Full Time')?.value || 0}</div>
                <div class="stat-label">Full Time</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${employeeData?.by_location?.find(l => l.name === 'Remote')?.value || 0}</div>
                <div class="stat-label">Remote</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${employeeData?.monthly_hires?.[employeeData?.monthly_hires?.length - 1]?.count || 0}</div>
                <div class="stat-label">New This Month</div>
              </div>
            </div>
            <h2>By Department</h2>
            <table>
              <tr><th>Department</th><th>Count</th></tr>
              ${employeeData?.by_department?.map(d => `<tr><td>${d.name}</td><td>${d.value}</td></tr>`).join('') || ''}
            </table>
            <h2>By Employment Type</h2>
            <table>
              <tr><th>Type</th><th>Count</th></tr>
              ${employeeData?.by_employment_type?.map(d => `<tr><td>${d.name}</td><td>${d.value}</td></tr>`).join('') || ''}
            </table>
          </div>
        `;

      case 'tickets':
        return `
          <div class="section">
            <h2>Ticket Statistics</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${ticketData?.total || 0}</div>
                <div class="stat-label">Total Tickets</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${ticketData?.avg_resolution_hours || 0}h</div>
                <div class="stat-label">Avg Resolution</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${ticketData?.by_status?.find(s => s.name === 'Open')?.value || 0}</div>
                <div class="stat-label">Open</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${ticketData?.by_status?.find(s => s.name === 'Resolved')?.value || 0}</div>
                <div class="stat-label">Resolved</div>
              </div>
            </div>
            <h2>By Status</h2>
            <table>
              <tr><th>Status</th><th>Count</th></tr>
              ${ticketData?.by_status?.map(d => `<tr><td>${d.name}</td><td>${d.value}</td></tr>`).join('') || ''}
            </table>
            <h2>By Category</h2>
            <table>
              <tr><th>Category</th><th>Count</th></tr>
              ${ticketData?.by_category?.map(d => `<tr><td>${d.name}</td><td>${d.value}</td></tr>`).join('') || ''}
            </table>
          </div>
        `;

      case 'leaves':
        return `
          <div class="section">
            <h2>Leave Statistics</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${leaveData?.total || 0}</div>
                <div class="stat-label">Total Requests</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${leaveData?.by_status?.find(s => s.name === 'Pending')?.value || 0}</div>
                <div class="stat-label">Pending</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${leaveData?.by_status?.find(s => s.name === 'Approved')?.value || 0}</div>
                <div class="stat-label">Approved</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${leaveData?.by_status?.find(s => s.name === 'Rejected')?.value || 0}</div>
                <div class="stat-label">Rejected</div>
              </div>
            </div>
            <h2>By Type</h2>
            <table>
              <tr><th>Leave Type</th><th>Count</th></tr>
              ${leaveData?.by_type?.map(d => `<tr><td>${d.name}</td><td>${d.value}</td></tr>`).join('') || ''}
            </table>
          </div>
        `;

      case 'expenses':
        return `
          <div class="section">
            <h2>Expense Statistics</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${expenseData?.total || 0}</div>
                <div class="stat-label">Total Claims</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">$${expenseData?.total_amount?.toLocaleString() || 0}</div>
                <div class="stat-label">Total Amount</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">$${expenseData?.approved_amount?.toLocaleString() || 0}</div>
                <div class="stat-label">Approved</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${expenseData?.by_status?.find(s => s.name === 'Pending')?.value || 0}</div>
                <div class="stat-label">Pending</div>
              </div>
            </div>
            <h2>By Category</h2>
            <table>
              <tr><th>Category</th><th>Count</th><th>Amount</th></tr>
              ${expenseData?.by_category?.map((d, i) => `<tr><td>${d.name}</td><td>${d.value}</td><td>$${expenseData?.amount_by_category?.[i]?.value || 0}</td></tr>`).join('') || ''}
            </table>
          </div>
        `;

      case 'training':
        return `
          <div class="section">
            <h2>Training Statistics</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${trainingData?.total_trainings || 0}</div>
                <div class="stat-label">Total Trainings</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${trainingData?.total_enrollments || 0}</div>
                <div class="stat-label">Enrollments</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${trainingData?.completion_rate || 0}%</div>
                <div class="stat-label">Completion Rate</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${trainingData?.by_status?.find(s => s.name === 'In Progress')?.value || 0}</div>
                <div class="stat-label">In Progress</div>
              </div>
            </div>
            <h2>Enrollment Status</h2>
            <table>
              <tr><th>Status</th><th>Count</th></tr>
              ${trainingData?.by_status?.map(d => `<tr><td>${d.name}</td><td>${d.value}</td></tr>`).join('') || ''}
            </table>
          </div>
        `;

      case 'performance':
        return `
          <div class="section">
            <h2>Performance Statistics</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${performanceData?.total || 0}</div>
                <div class="stat-label">Total Reviews</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${performanceData?.average_rating || 'N/A'}</div>
                <div class="stat-label">Avg Rating</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${performanceData?.by_status?.find(s => s.name === 'Completed')?.value || 0}</div>
                <div class="stat-label">Completed</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${performanceData?.by_status?.find(s => s.name === 'Pending')?.value || 0}</div>
                <div class="stat-label">Pending</div>
              </div>
            </div>
            <h2>Rating Distribution</h2>
            <table>
              <tr><th>Rating</th><th>Count</th></tr>
              ${performanceData?.rating_distribution?.map(d => `<tr><td>${d.rating} Stars</td><td>${d.count}</td></tr>`).join('') || ''}
            </table>
          </div>
        `;

      default:
        return '<p>No data available</p>';
    }
  };

  // Export all reports to CSV
  const exportAllToCSV = () => {
    const now = new Date().toISOString().split('T')[0];
    let allContent = 'HR Platform - Complete Report\n';
    allContent += `Generated: ${now}\n\n`;

    // Overview
    allContent += '=== OVERVIEW ===\n';
    allContent += `Total Employees,${overview?.employees?.total || 0}\n`;
    allContent += `Active Employees,${overview?.employees?.active || 0}\n`;
    allContent += `Open Tickets,${overview?.tickets?.open || 0}\n`;
    allContent += `Pending Leaves,${overview?.leaves?.pending || 0}\n\n`;

    // Employees
    allContent += '=== EMPLOYEES BY DEPARTMENT ===\n';
    employeeData?.by_department?.forEach(d => {
      allContent += `${d.name},${d.value}\n`;
    });
    allContent += '\n';

    // Tickets
    allContent += '=== TICKETS BY STATUS ===\n';
    ticketData?.by_status?.forEach(d => {
      allContent += `${d.name},${d.value}\n`;
    });
    allContent += '\n';

    const blob = new Blob([allContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hr_complete_report_${now}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Exported complete report to CSV');
    setShowExportMenu(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2D4F38]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="reports-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Reports & Analytics</h1>
          <p className="text-stone-500 text-sm mt-1">Comprehensive insights into your organization</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
          
          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <Button 
              className="bg-[#2D4F38] hover:bg-[#1F3A29]"
              onClick={() => setShowExportMenu(!showExportMenu)}
              data-testid="export-button"
            >
              <Download size={16} className="mr-2" />
              Export
              <ChevronDown size={14} className="ml-2" />
            </Button>
            
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50">
                <div className="px-3 py-1.5 text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Current View: {tabs.find(t => t.id === activeTab)?.label}
                </div>
                <button
                  onClick={exportToCSV}
                  className="w-full px-4 py-2.5 text-left hover:bg-stone-50 flex items-center gap-3 transition-colors"
                  data-testid="export-csv"
                >
                  <FileSpreadsheet size={18} className="text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-stone-900">Export to CSV</p>
                    <p className="text-xs text-stone-500">Download as spreadsheet</p>
                  </div>
                </button>
                <button
                  onClick={exportToPDF}
                  className="w-full px-4 py-2.5 text-left hover:bg-stone-50 flex items-center gap-3 transition-colors"
                  data-testid="export-pdf"
                >
                  <FileText size={18} className="text-rose-600" />
                  <div>
                    <p className="text-sm font-medium text-stone-900">Export to PDF</p>
                    <p className="text-xs text-stone-500">Print or save as PDF</p>
                  </div>
                </button>
                
                <div className="border-t border-stone-100 my-2"></div>
                <div className="px-3 py-1.5 text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Full Report
                </div>
                <button
                  onClick={exportAllToCSV}
                  className="w-full px-4 py-2.5 text-left hover:bg-stone-50 flex items-center gap-3 transition-colors"
                  data-testid="export-all-csv"
                >
                  <Download size={18} className="text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-stone-900">Export All Data</p>
                    <p className="text-xs text-stone-500">Complete report (CSV)</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === tab.id 
                  ? 'bg-[#2D4F38] text-white' 
                  : 'text-stone-600 hover:bg-stone-100'
                }
              `}
              data-testid={`tab-${tab.id}`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Employees"
              value={overview.employees?.total || 0}
              subtitle={`${overview.employees?.active || 0} active`}
              icon={Users}
              color="green"
              trend="up"
              trendValue={`+${overview.employees?.new_hires_30d || 0} this month`}
            />
            <StatCard
              title="Open Tickets"
              value={overview.tickets?.open || 0}
              subtitle={`${overview.tickets?.resolution_rate || 0}% resolved`}
              icon={Ticket}
              color="blue"
            />
            <StatCard
              title="Pending Leaves"
              value={overview.leaves?.pending || 0}
              subtitle={`${overview.leaves?.approved || 0} approved`}
              icon={Calendar}
              color="purple"
            />
            <StatCard
              title="Pending Expenses"
              value={overview.expenses?.pending || 0}
              icon={Receipt}
              color="amber"
            />
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Employee Distribution */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <Building2 size={18} className="text-[#2D4F38]" />
                Employees by Department
              </h3>
              {employeeData?.by_department && (
                <DonutChart data={employeeData.by_department.slice(0, 6)} />
              )}
            </div>

            {/* Ticket Status */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <Ticket size={18} className="text-[#2D4F38]" />
                Tickets by Status
              </h3>
              {ticketData?.by_status && (
                <DonutChart data={ticketData.by_status} />
              )}
            </div>
          </div>

          {/* Trends */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Monthly Hires */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-[#2D4F38]" />
                Monthly New Hires
              </h3>
              {employeeData?.monthly_hires && (
                <BarChartSimple data={employeeData.monthly_hires} height={180} />
              )}
            </div>

            {/* Weekly Tickets */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <Activity size={18} className="text-[#2D4F38]" />
                Weekly Ticket Volume
              </h3>
              {ticketData?.weekly_volume && (
                <BarChartSimple data={ticketData.weekly_volume} height={180} color="#4A7C59" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && employeeData && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Employees" value={employeeData.total} icon={Users} color="green" />
            <StatCard 
              title="Full Time" 
              value={employeeData.by_employment_type?.find(t => t.name === 'Full Time')?.value || 0} 
              icon={Briefcase} 
              color="blue" 
            />
            <StatCard 
              title="Remote Workers" 
              value={employeeData.by_location?.find(l => l.name === 'Remote')?.value || 0} 
              icon={Building2} 
              color="purple" 
            />
            <StatCard 
              title="New This Month" 
              value={employeeData.monthly_hires?.[employeeData.monthly_hires.length - 1]?.count || 0} 
              icon={TrendingUp} 
              color="amber" 
            />
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">By Department</h3>
              <BarChartSimple data={employeeData.by_department?.slice(0, 8)} height={200} />
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">By Employment Type</h3>
              <DonutChart data={employeeData.by_employment_type} />
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">By Status</h3>
              <DonutChart data={employeeData.by_status} size={140} />
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">By Gender</h3>
              <DonutChart data={employeeData.by_gender} size={140} />
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Tenure Distribution</h3>
              <BarChartSimple data={employeeData.tenure_distribution} height={140} />
            </div>
          </div>
        </div>
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && ticketData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Tickets" value={ticketData.total} icon={Ticket} color="blue" />
            <StatCard 
              title="Avg Resolution" 
              value={`${ticketData.avg_resolution_hours}h`} 
              icon={Clock} 
              color="green" 
            />
            <StatCard 
              title="Open" 
              value={ticketData.by_status?.find(s => s.name === 'Open')?.value || 0} 
              icon={AlertCircle} 
              color="amber" 
            />
            <StatCard 
              title="Resolved" 
              value={ticketData.by_status?.find(s => s.name === 'Resolved')?.value || 0} 
              icon={CheckCircle2} 
              color="purple" 
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">By Status</h3>
              <DonutChart data={ticketData.by_status} />
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">By Category</h3>
              <BarChartSimple data={ticketData.by_category} height={200} />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">By Priority</h3>
              <DonutChart data={ticketData.by_priority} size={140} />
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Weekly Volume</h3>
              <BarChartSimple data={ticketData.weekly_volume} height={140} color="#4A7C59" />
            </div>
          </div>
        </div>
      )}

      {/* Leaves Tab */}
      {activeTab === 'leaves' && leaveData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Requests" value={leaveData.total} icon={Calendar} color="purple" />
            <StatCard 
              title="Pending" 
              value={leaveData.by_status?.find(s => s.name === 'Pending')?.value || 0} 
              icon={Clock} 
              color="amber" 
            />
            <StatCard 
              title="Approved" 
              value={leaveData.by_status?.find(s => s.name === 'Approved')?.value || 0} 
              icon={CheckCircle2} 
              color="green" 
            />
            <StatCard 
              title="Rejected" 
              value={leaveData.by_status?.find(s => s.name === 'Rejected')?.value || 0} 
              icon={AlertCircle} 
              color="rose" 
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">By Type</h3>
              <DonutChart data={leaveData.by_type} />
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Days Taken by Type</h3>
              <BarChartSimple data={leaveData.days_by_type} height={200} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h3 className="text-lg font-semibold text-stone-900 mb-4">Monthly Trend</h3>
            <BarChartSimple data={leaveData.monthly_trend} height={180} color="#8B5CF6" />
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && expenseData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Claims" value={expenseData.total} icon={Receipt} color="amber" />
            <StatCard 
              title="Total Amount" 
              value={`$${expenseData.total_amount?.toLocaleString() || 0}`} 
              icon={TrendingUp} 
              color="green" 
            />
            <StatCard 
              title="Approved Amount" 
              value={`$${expenseData.approved_amount?.toLocaleString() || 0}`} 
              icon={CheckCircle2} 
              color="blue" 
            />
            <StatCard 
              title="Pending" 
              value={expenseData.by_status?.find(s => s.name === 'Pending')?.value || 0} 
              icon={Clock} 
              color="purple" 
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">By Category</h3>
              <DonutChart data={expenseData.by_category} />
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Amount by Category</h3>
              <BarChartSimple data={expenseData.amount_by_category} height={200} color="#F59E0B" />
            </div>
          </div>
        </div>
      )}

      {/* Training Tab */}
      {activeTab === 'training' && trainingData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Trainings" value={trainingData.total_trainings} icon={GraduationCap} color="purple" />
            <StatCard title="Total Enrollments" value={trainingData.total_enrollments} icon={Users} color="blue" />
            <StatCard 
              title="Completion Rate" 
              value={`${trainingData.completion_rate}%`} 
              icon={CheckCircle2} 
              color="green" 
            />
            <StatCard 
              title="In Progress" 
              value={trainingData.by_status?.find(s => s.name === 'In Progress')?.value || 0} 
              icon={Activity} 
              color="amber" 
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Enrollment Status</h3>
              <DonutChart data={trainingData.by_status} />
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Top Trainings</h3>
              <BarChartSimple data={trainingData.by_training?.slice(0, 6)} height={200} color="#8B5CF6" />
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && performanceData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Reviews" value={performanceData.total} icon={Target} color="green" />
            <StatCard 
              title="Average Rating" 
              value={performanceData.average_rating || 'N/A'} 
              subtitle="out of 5"
              icon={TrendingUp} 
              color="amber" 
            />
            <StatCard 
              title="Completed" 
              value={performanceData.by_status?.find(s => s.name === 'Completed')?.value || 0} 
              icon={CheckCircle2} 
              color="blue" 
            />
            <StatCard 
              title="Pending" 
              value={performanceData.by_status?.find(s => s.name === 'Pending')?.value || 0} 
              icon={Clock} 
              color="purple" 
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Review Status</h3>
              <DonutChart data={performanceData.by_status} />
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Rating Distribution</h3>
              <BarChartSimple data={performanceData.rating_distribution} height={200} color="#10B981" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
