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
import Layout from './components/Layout';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
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
        <Route path="settings" element={<Settings />} />
        <Route path="settings/roles" element={<RolesPermissions />} />
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
