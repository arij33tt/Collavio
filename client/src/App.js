import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './theme.css';

// Auth Components
import Login from './components/auth/Login';
import SignUp from './components/auth/SignUp';
import PrivateRoute from './components/auth/PrivateRoute';
import Navigation from './components/layout/Navigation';

// Context
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import WorkspaceDetail from './pages/WorkspaceDetail';
import WorkspaceForm from './components/workspaces/WorkspaceForm';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <div className="App">
            <Navigation />
            <div className="app-content">
              <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              
              {/* Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/workspace/create" element={<WorkspaceForm />} />
                <Route path="/workspace/:workspaceId" element={<WorkspaceDetail />} />
                <Route path="/workspace/:workspaceId/edit" element={<WorkspaceForm editMode={true} />} />
              </Route>
              
              {/* Redirect to home if no route matches */}
              <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </div>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
