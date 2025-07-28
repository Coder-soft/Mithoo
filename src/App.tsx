"use client";

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider, useSession } from './contexts/SessionContext';
import IndexPage from './pages/Index';
import LoginPage from './pages/Login';
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <SessionProvider>
      <Router>
        <AppRoutes />
      </Router>
      <Toaster />
    </SessionProvider>
  );
}

function AppRoutes() {
  const { session, loading } = useSession();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/" 
        element={session ? <IndexPage /> : <Navigate to="/login" replace />} 
      />
    </Routes>
  );
}

export default App;