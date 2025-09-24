import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationCenter from '../notifications/NotificationCenter';

const Navigation = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  // Don't show navigation on login or signup pages
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/dashboard">Collavio</Link>
        </div>
        
        {currentUser && (
          <div className="nav-links">
            <Link 
              to="/dashboard" 
              className={location.pathname === '/dashboard' ? 'active' : ''}
            >
              Dashboard
            </Link>
            <Link 
              to="/profile" 
              className={location.pathname === '/profile' ? 'active' : ''}
            >
              Profile
            </Link>
            <NotificationCenter />
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;