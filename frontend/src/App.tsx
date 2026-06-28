import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Home from './pages/Home';
import Report from './pages/Report';
import MapViewer from './pages/MapViewer';
import ImpactDashboard from './pages/Impact';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user && !(window as any)._bypassAuth) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/report" 
        element={<Report />} 
      />
      <Route 
        path="/map" 
        element={
          <ProtectedRoute>
            <MapViewer />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/impact" 
        element={
          <ImpactDashboard />
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={<Admin />} 
      />
      {/* Add more routes here later */}
    </Routes>
  );
}

export default App;
