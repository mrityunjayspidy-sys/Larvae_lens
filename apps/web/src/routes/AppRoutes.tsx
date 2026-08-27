import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { CitizenDashboard } from '../pages/CitizenDashboard';
import { FieldWorkerDashboard } from '../pages/FieldWorkerDashboard';
import { AdminDashboard } from '../pages/AdminDashboard';
import { ScanPage } from '../pages/ScanPage';
import { ProcessingPage } from '../pages/ProcessingPage';
import { ResultPage } from '../pages/ResultPage';
import { HistoryPage } from '../pages/HistoryPage';
import { MapPage } from '../pages/MapPage';
import { AdminModelsPage } from '../pages/AdminModelsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { NotFoundPage } from '../pages/NotFoundPage';

// Smart Home Redirection based on role
const HomeOrDashboard: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <LandingPage />;

  switch (user.role) {
    case 'citizen':
      return <CitizenDashboard />;
    case 'field_worker':
      return <FieldWorkerDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <CitizenDashboard />;
  }
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomeOrDashboard />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/map" element={<MapPage />} />
      
      {/* Role-Specific Dashboards */}
      <Route
        path="/dashboard/citizen"
        element={
          <ProtectedRoute allowedRoles={['citizen', 'admin']}>
            <CitizenDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/field-worker"
        element={
          <ProtectedRoute allowedRoles={['field_worker', 'admin']}>
            <FieldWorkerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Authenticated Scan Routes (Citizens & Admins only; Field Workers do not capture scans) */}
      <Route
        path="/scan"
        element={
          <ProtectedRoute allowedRoles={['citizen', 'admin']}>
            <ScanPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/scans/:scanId/processing"
        element={
          <ProtectedRoute>
            <ProcessingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/scans/:scanId"
        element={
          <ProtectedRoute>
            <ResultPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute allowedRoles={['citizen', 'admin']}>
            <HistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Only Route */}
      <Route
        path="/admin/models"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminModelsPage />
          </ProtectedRoute>
        }
      />

      {/* Utility Routes */}
      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
