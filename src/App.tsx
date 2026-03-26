/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import StudentList from './pages/StudentList';
import MyRecords from './pages/MyRecords';
import StaffManagement from './pages/StaffManagement';
import PendingApprovals from './pages/PendingApprovals';
import Layout from './components/Layout';

import CampusLife from './pages/CampusLife';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="upload" element={<Upload />} />
        <Route path="students" element={<StudentList />} />
        <Route path="my-records" element={<MyRecords />} />
        <Route path="campus-life" element={<CampusLife />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="approvals" element={<PendingApprovals />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
