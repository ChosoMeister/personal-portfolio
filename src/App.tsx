import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './components/LoginPage'; // We can refactor this later or use existing one
import { ToastProvider } from './components/Toast';

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <LoginPage />;  // LoginPage uses AuthContext internally for login/register
  // Ideally, LoginPage shouldn't need props if it uses AuthContext.
  // For now, let's keep it as is, but we need to ensure it triggers AuthContext update.
  // Actually, AuthContext.login updates user. 
  // If LoginPage uses API.login directly (which it does), AuthContext might not know unless we wrap it or refactor LoginPage.

  // Refactor plan: Update LoginPage to use useAuth().login
  return <>{children}</>;
};

const AppContent = () => {
  const { user } = useAuth();
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        {/* Add more routes if we split DashboardPage into sub-routes */}
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

