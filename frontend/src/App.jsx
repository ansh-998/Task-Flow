// ============================================================================
// File: frontend/src/App.jsx
// Description: Application routes and authentication wrapper
// ============================================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { useAuth } from './hooks/useAuth.js';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MyTasks from './pages/MyTasks.jsx';
import Engagements from './pages/Engagements.jsx';
import EngagementDetail from './pages/EngagementDetail.jsx';
import Clients from './pages/Clients.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminServiceTypes from './pages/AdminServiceTypes.jsx';
import AdminTemplates from './pages/AdminTemplates.jsx';
import NotFound from './pages/NotFound.jsx';
import Unauthorized from './pages/Unauthorized.jsx';

function LoginWrapper() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginWrapper />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/my-tasks" element={<MyTasks />} />
            <Route path="/engagements" element={<Engagements />} />
            <Route path="/engagements/:id" element={<EngagementDetail />} />
            <Route path="/clients" element={<Clients />} />

            {/* Administrator Only Routes */}
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/services"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminServiceTypes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/templates"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminTemplates />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
