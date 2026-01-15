import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { Building2, GitBranch, FolderTree, Layers, Users, Calendar } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    total_corporations: 0,
    total_branches: 0,
    total_departments: 0,
    total_divisions: 0,
    total_employees: 0,
    pending_leaves: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const statCards = [
    {
      label: t('totalCorporations'),
      value: stats.total_corporations,
      icon: Building2,
      color: 'bg-blue-500',
      testId: 'stat-corporations'
    },
    {
      label: t('totalBranches'),
      value: stats.total_branches,
      icon: GitBranch,
      color: 'bg-green-500',
      testId: 'stat-branches'
    },
    {
      label: t('totalDepartments'),
      value: stats.total_departments,
      icon: FolderTree,
      color: 'bg-purple-500',
      testId: 'stat-departments'
    },
    {
      label: t('totalDivisions'),
      value: stats.total_divisions,
      icon: Layers,
      color: 'bg-indigo-500',
      testId: 'stat-divisions'
    },
    {
      label: t('totalEmployees'),
      value: stats.total_employees,
      icon: Users,
      color: 'bg-orange-500',
      testId: 'stat-employees'
    },
    {
      label: t('pendingLeaves'),
      value: stats.pending_leaves,
      icon: Calendar,
      color: 'bg-red-500',
      testId: 'stat-pending-leaves'
    }
  ];

  return (
    <div data-testid="dashboard-page">
      <h1 className="text-4xl font-black text-slate-900 mb-8" style={{ fontFamily: 'Manrope, sans-serif' }}>
        {t('dashboard')}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              data-testid={stat.testId}
              className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 card-hover"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                  <Icon className={stat.color.replace('bg-', 'text-')} size={24} />
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
