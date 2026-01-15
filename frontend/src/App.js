import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { Toaster } from './components/ui/sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Corporations from './pages/Corporations';
import Branches from './pages/Branches';
import Departments from './pages/Departments';
import Divisions from './pages/Divisions';
import Employees from './pages/EmployeesNew';
import Leaves from './pages/Leaves';
import Attendance from './pages/Attendance';
import Performance from './pages/Performance';
import Settings from './pages/Settings';
import RolesPermissions from './pages/RolesPermissions';
import Workflows from './pages/Workflows';
import Recruitment from './pages/Recruitment';
import Onboarding from './pages/Onboarding';
import Offboarding from './pages/Offboarding';
import Expenses from './pages/Expenses';
import Training from './pages/Training';
import Documents from './pages/Documents';
import Appraisals from './pages/Appraisals';
import OrgChart from './pages/OrgChart';
import Payroll from './pages/Payroll';
import Assets from './pages/Assets';
import Communications from './pages/Communications';
import Complaints from './pages/Complaints';
import Disciplinary from './pages/Disciplinary';
import Layout from './components/Layout';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-950"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="corporations" element={<Corporations />} />
        <Route path="branches" element={<Branches />} />
        <Route path="departments" element={<Departments />} />
        <Route path="divisions" element={<Divisions />} />
        <Route path="employees" element={<Employees />} />
        <Route path="leaves" element={<Leaves />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="performance" element={<Performance />} />
        <Route path="recruitment" element={<Recruitment />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="offboarding" element={<Offboarding />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="training" element={<Training />} />
        <Route path="documents" element={<Documents />} />
        <Route path="appraisals" element={<Appraisals />} />
        <Route path="org-chart" element={<OrgChart />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="assets" element={<Assets />} />
        <Route path="communications" element={<Communications />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="settings" element={<Settings />} />
        <Route path="settings/roles" element={<RolesPermissions />} />
        <Route path="settings/workflows" element={<Workflows />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <CurrencyProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster position="top-right" />
          </BrowserRouter>
        </CurrencyProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
