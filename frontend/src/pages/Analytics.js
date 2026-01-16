import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Users, TrendingUp, TrendingDown, DollarSign, UserPlus, UserMinus, 
  Briefcase, Target, ArrowUpRight, ArrowDownRight, Calendar, 
  PieChart as PieChartIcon, BarChart2, Activity
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const API = process.env.REACT_APP_BACKEND_URL;

const COLORS = ['#2D4F38', '#4A7C59', '#6B9B7A', '#8DBF9D', '#B0E0BE', '#D4F1DD'];
const CHART_COLORS = {
  primary: '#2D4F38',
  secondary: '#4A7C59',
  accent: '#6B9B7A',
  muted: '#94a3b8',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444'
};

const Analytics = () => {
  const { token } = useAuth();
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [turnover, setTurnover] = useState(null);
  const [hiring, setHiring] = useState(null);
  const [salary, setSalary] = useState(null);
  const [forecast, setForecast] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  const fetchAnalytics = async () => {
    if (!token) return;
    setLoading(true);
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [overviewRes, turnoverRes, hiringRes, salaryRes, forecastRes] = await Promise.all([
        axios.get(`${API}/api/analytics/overview`, { headers }),
        axios.get(`${API}/api/analytics/turnover`, { headers }),
        axios.get(`${API}/api/analytics/hiring`, { headers }),
        axios.get(`${API}/api/analytics/salary`, { headers }),
        axios.get(`${API}/api/analytics/forecast`, { headers })
      ]);
      
      setOverview(overviewRes.data);
      setTurnover(turnoverRes.data);
      setHiring(hiringRes.data);
      setSalary(salaryRes.data);
      setForecast(forecastRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'primary' }) => (
    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${
          color === 'primary' ? 'bg-emerald-100' : 
          color === 'warning' ? 'bg-amber-100' : 
          color === 'danger' ? 'bg-red-100' : 'bg-blue-100'
        }`}>
          <Icon className={`${
            color === 'primary' ? 'text-emerald-600' : 
            color === 'warning' ? 'text-amber-600' : 
            color === 'danger' ? 'text-red-600' : 'text-blue-600'
          }`} size={22} />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-3 text-sm ${
          trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-slate-500'
        }`}>
          {trend === 'up' ? <ArrowUpRight size={16} /> : trend === 'down' ? <ArrowDownRight size={16} /> : null}
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-medium text-slate-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' && entry.value > 1000 
                ? formatCurrency(entry.value) 
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="analytics-dashboard">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">HR Analytics</h1>
          <p className="text-slate-500 mt-1">Insights into your workforce metrics and trends</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <Activity size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: PieChartIcon },
          { id: 'turnover', label: 'Turnover', icon: TrendingDown },
          { id: 'hiring', label: 'Hiring', icon: UserPlus },
          { id: 'salary', label: 'Salary', icon: DollarSign },
          { id: 'forecast', label: 'Forecast', icon: Target }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            data-testid={`tab-${tab.id}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              title="Total Headcount" 
              value={overview.summary.total_headcount}
              icon={Users}
              color="primary"
            />
            <StatCard 
              title="New Hires (This Month)" 
              value={overview.summary.new_hires_this_month}
              icon={UserPlus}
              color="blue"
            />
            <StatCard 
              title="Terminations (This Month)" 
              value={overview.summary.terminations_this_month}
              icon={UserMinus}
              color="danger"
            />
            <StatCard 
              title="Turnover Rate (YTD)" 
              value={`${overview.summary.turnover_rate}%`}
              icon={TrendingDown}
              color="warning"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard 
              title="Open Positions" 
              value={overview.summary.open_positions}
              icon={Briefcase}
              color="blue"
            />
            <StatCard 
              title="Pending Candidates" 
              value={overview.summary.pending_candidates}
              icon={Target}
              color="warning"
            />
            <StatCard 
              title="Average Salary" 
              value={formatCurrency(overview.summary.avg_salary)}
              icon={DollarSign}
              color="primary"
            />
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Headcount Trend */}
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Headcount Trend</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={overview.headcount_trend}>
                  <defs>
                    <linearGradient id="headcountGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="headcount" 
                    stroke={CHART_COLORS.primary} 
                    fill="url(#headcountGradient)"
                    strokeWidth={2}
                    name="Headcount"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Department Distribution */}
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Headcount by Department</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={overview.department_distribution}
                    dataKey="count"
                    nameKey="department"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ department, count }) => `${department}: ${count}`}
                    labelLine={false}
                  >
                    {overview.department_distribution.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Salary Benchmarks */}
          {overview.salary_benchmarks.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Salary by Department</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={overview.salary_benchmarks} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `${v/1000}k`} />
                  <YAxis type="category" dataKey="department" tick={{ fontSize: 12 }} stroke="#94a3b8" width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="average" fill={CHART_COLORS.primary} name="Average Salary" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Turnover Tab */}
      {activeTab === 'turnover' && turnover && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Monthly Turnover */}
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Terminations</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={turnover.monthly_turnover}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="terminations" fill={CHART_COLORS.danger} name="Terminations" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Turnover by Tenure */}
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Turnover by Tenure</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={turnover.by_tenure}
                    dataKey="count"
                    nameKey="tenure"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {turnover.by_tenure.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Turnover by Department */}
          {turnover.by_department.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Turnover by Department</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={turnover.by_department}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="department" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill={CHART_COLORS.warning} name="Terminations" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Hiring Tab */}
      {activeTab === 'hiring' && hiring && (
        <div className="space-y-6">
          {/* Hiring Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              title="Total Candidates" 
              value={hiring.total_candidates}
              icon={Users}
              color="blue"
            />
            <StatCard 
              title="Open Positions" 
              value={hiring.total_open_positions}
              icon={Briefcase}
              color="warning"
            />
            <StatCard 
              title="Avg Time to Hire" 
              value={`${hiring.avg_time_to_hire} days`}
              icon={Calendar}
              color="primary"
            />
            <StatCard 
              title="Hired This Year" 
              value={hiring.funnel.hired}
              icon={UserPlus}
              color="primary"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Hiring Funnel */}
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Hiring Funnel</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart 
                  data={[
                    { stage: 'Applied', count: hiring.funnel.applied },
                    { stage: 'Screening', count: hiring.funnel.screening },
                    { stage: 'Interview', count: hiring.funnel.interview },
                    { stage: 'Offer', count: hiring.funnel.offer },
                    { stage: 'Hired', count: hiring.funnel.hired }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="stage" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Candidates" radius={[4, 4, 0, 0]}>
                    {[0, 1, 2, 3, 4].map((index) => (
                      <Cell key={index} fill={COLORS[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Hires */}
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Hires</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={hiring.monthly_hires}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="hires" 
                    stroke={CHART_COLORS.primary} 
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.primary }}
                    name="Hires"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hires by Source */}
          {hiring.by_source.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Hires by Source</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={hiring.by_source}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {hiring.by_source.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Salary Tab */}
      {activeTab === 'salary' && salary && (
        <div className="space-y-6">
          {/* Salary Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard 
              title="Total Payroll" 
              value={formatCurrency(salary.overall.total_payroll)}
              icon={DollarSign}
              color="primary"
            />
            <StatCard 
              title="Average Salary" 
              value={formatCurrency(salary.overall.average)}
              icon={TrendingUp}
              color="blue"
            />
            <StatCard 
              title="Median Salary" 
              value={formatCurrency(salary.overall.median)}
              icon={BarChart2}
              color="primary"
            />
            <StatCard 
              title="Min Salary" 
              value={formatCurrency(salary.overall.min)}
              icon={TrendingDown}
              color="warning"
            />
            <StatCard 
              title="Max Salary" 
              value={formatCurrency(salary.overall.max)}
              icon={TrendingUp}
              color="primary"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Salary Distribution */}
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Salary Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={salary.distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="range" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill={CHART_COLORS.primary} name="Employees" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Salary by Department */}
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Average Salary by Department</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={salary.by_department} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `${v/1000}k`} />
                  <YAxis type="category" dataKey="department" tick={{ fontSize: 12 }} stroke="#94a3b8" width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="average" fill={CHART_COLORS.secondary} name="Avg Salary" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Salary by Position */}
          {salary.by_position.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Salaries by Position</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Position</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">Avg Salary</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">Employees</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salary.by_position.map((pos, index) => (
                      <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm text-slate-900">{pos.position}</td>
                        <td className="py-3 px-4 text-sm text-slate-900 text-right font-medium">{formatCurrency(pos.average)}</td>
                        <td className="py-3 px-4 text-sm text-slate-500 text-right">{pos.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Forecast Tab */}
      {activeTab === 'forecast' && forecast && (
        <div className="space-y-6">
          {/* Forecast Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              title="Current Headcount" 
              value={forecast.current_headcount}
              icon={Users}
              color="primary"
            />
            <StatCard 
              title="Avg Monthly Hires" 
              value={forecast.trends.avg_monthly_hires}
              icon={UserPlus}
              color="blue"
            />
            <StatCard 
              title="Avg Monthly Terminations" 
              value={forecast.trends.avg_monthly_terminations}
              icon={UserMinus}
              color="warning"
            />
            <StatCard 
              title="Projected Year-End" 
              value={forecast.trends.projected_year_end_headcount}
              icon={Target}
              color="primary"
            />
          </div>

          {/* Historical + Forecast Chart */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Headcount Forecast (6 Months)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={[...forecast.historical.map(h => ({...h, type: 'historical'})), ...forecast.forecast.map(f => ({...f, type: 'forecast', month: f.month, hires: f.projected_hires, terminations: f.projected_terminations}))]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="hires" 
                  stroke={CHART_COLORS.success} 
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS.success }}
                  name="Hires"
                />
                <Line 
                  type="monotone" 
                  dataKey="terminations" 
                  stroke={CHART_COLORS.danger} 
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS.danger }}
                  name="Terminations"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                <span className="text-slate-500">Historical</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-300 border-2 border-dashed border-slate-400"></div>
                <span className="text-slate-500">Forecast</span>
              </div>
            </div>
          </div>

          {/* Projected Headcount */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Projected Monthly Headcount</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Month</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">Projected Headcount</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">Est. Hires</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">Est. Terminations</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.forecast.map((f, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-900 font-medium">{f.month}</td>
                      <td className="py-3 px-4 text-sm text-slate-900 text-right">{f.projected_headcount}</td>
                      <td className="py-3 px-4 text-sm text-emerald-600 text-right">+{f.projected_hires}</td>
                      <td className="py-3 px-4 text-sm text-red-500 text-right">-{f.projected_terminations}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
