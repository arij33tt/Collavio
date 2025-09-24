import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const Dashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (!currentUser) return;
      
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(`${process.env.REACT_APP_API_URL}/workspaces/user`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch workspaces');
        }
        
        const data = await response.json();
        setWorkspaces(data);
      } catch (error) {
        console.error('Error fetching workspaces:', error);
        setError('Failed to load workspaces. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, [currentUser]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <h1 className="h-title float-in">Your Workspaces</h1>
      <p className="h-subtitle">Collaborate with your team in futuristic style.</p>
      <hr className="neon-sep" />

      {error && <div className="error-message">{error}</div>}
      
      <div className="workspaces-section">
        <div className="section-header">
          <h2>Your Workspaces</h2>
          <Link to="/workspace/create" className="create-button">Create Workspace</Link>
        </div>
        
        {workspaces.length === 0 ? (
          <div className="empty-state">
            <p>You don't have any workspaces yet. Create your first workspace to get started!</p>
          </div>
        ) : (
          <div className="workspaces-grid">
            {workspaces.map(workspace => (
              <div key={workspace.id} className="workspace-card">
                <div className="workspace-card-header">
                  <div className="workspace-avatar">{workspace.name?.[0]?.toUpperCase() || 'W'}</div>
                  <div className="workspace-titleblock">
                    <h3 className="workspace-title">{workspace.name}</h3>
                    <p className="workspace-subtitle">{workspace.description}</p>
                  </div>
                  <div className="workspace-card-actions">
                    <Link to={`/workspace/${workspace.id}`} className="open-button btn-sm">Open</Link>
                  </div>
                </div>
                <div className="workspace-meta">
                  <span>{workspace.videos?.length || 0} videos</span>
                  <span>{workspace.members?.length || 0} members</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;