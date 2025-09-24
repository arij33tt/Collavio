import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

const WorkspaceForm = ({ editMode = false, workspace = null }) => {
  const { workspaceId } = useParams();
  const [name, setName] = useState(editMode ? workspace?.name : '');
  const [description, setDescription] = useState(editMode ? workspace?.description : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadedWs, setLoadedWs] = useState(workspace);
  const [ytBaseUrl, setYtBaseUrl] = useState('');
  const [ytChannelId, setYtChannelId] = useState('');
  const [ytSecret, setYtSecret] = useState('');
  const [savingIntegration, setSavingIntegration] = useState(false);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // In edit mode, fetch workspace if not provided
  useEffect(() => {
    const fetchWs = async () => {
      if (!editMode || !workspaceId || !currentUser) return;
      try {
        const token = await currentUser.getIdToken();
        const res = await fetch(`${process.env.REACT_APP_API_URL}/workspaces/${workspaceId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLoadedWs(data);
          setName(data.name || '');
          setDescription(data.description || '');
          // preload integration values if exist
          const yt = data?.integration?.youtubeClone;
          if (yt) {
            setYtBaseUrl(yt.baseUrl || '');
            setYtChannelId(yt.channelId || '');
            setYtSecret(yt.channelLinkSecret || '');
          }
        }
      } catch (e) {
        console.error('Failed to load workspace', e);
      }
    };
    fetchWs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, workspaceId, currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Workspace name is required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = await currentUser.getIdToken();
      
      const targetId = editMode ? (workspace?.id || loadedWs?.id || workspaceId) : null;
      const url = editMode 
        ? `${process.env.REACT_APP_API_URL}/workspaces/${targetId}`
        : `${process.env.REACT_APP_API_URL}/workspaces`;
      
      const method = editMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${editMode ? 'update' : 'create'} workspace`);
      }
      
      const data = await response.json();
      
      if (editMode) {
        navigate(`/workspace/${targetId}`);
      } else {
        navigate(`/workspace/${data.id}`);
      }
    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'creating'} workspace:`, error);
      setError(error.message || `Failed to ${editMode ? 'update' : 'create'} workspace`);
    } finally {
      setLoading(false);
    }
  };

  const saveIntegration = async (e) => {
    e.preventDefault();
    if (!editMode) return; // integration saved only when editing existing workspace
    const targetId = workspace?.id || loadedWs?.id || workspaceId;
    if (!targetId) return;
    try {
      setSavingIntegration(true);
      const token = await currentUser.getIdToken();
      const res = await fetch(`${process.env.REACT_APP_API_URL}/workspaces/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          integration: {
            youtubeClone: {
              baseUrl: ytBaseUrl?.trim() || '',
              channelId: ytChannelId?.trim() || '',
              channelLinkSecret: ytSecret?.trim() || '',
            }
          }
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to save integration');
      setLoadedWs(data);
    } catch (e) {
      setError(e.message || 'Failed to save integration');
    } finally {
      setSavingIntegration(false);
    }
  };

  return (
    <div className="workspace-form-container">
      <h2>{editMode ? 'Edit Workspace' : 'Create New Workspace'}</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Workspace Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description (optional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows="4"
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading 
            ? (editMode ? 'Updating...' : 'Creating...') 
            : (editMode ? 'Update Workspace' : 'Create Workspace')
          }
        </button>
      </form>

      {editMode && (
        <div className="workspace-integration" style={{ marginTop: 24 }}>
          <h3>Connect Workspace to YouTube Clone Channel</h3>
          <p className="h-subtitle">Owner can link a channel here so authorized editors can publish.</p>
          <form onSubmit={saveIntegration}>
            <div className="form-group">
              <label htmlFor="ytBaseUrl">YT Clone Base URL</label>
              <input id="ytBaseUrl" type="url" placeholder="http://localhost:6323" value={ytBaseUrl} onChange={(e)=>setYtBaseUrl(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="ytChannelId">Channel ID</label>
              <input id="ytChannelId" value={ytChannelId} onChange={(e)=>setYtChannelId(e.target.value)} placeholder="e.g. ch_123" />
            </div>
            <div className="form-group">
              <label htmlFor="ytSecret">Channel Secret</label>
              <input id="ytSecret" type="password" value={ytSecret} onChange={(e)=>setYtSecret(e.target.value)} placeholder="Secret from channel settings" />
            </div>
            <button type="submit" disabled={savingIntegration}>{savingIntegration ? 'Saving...' : 'Save Integration'}</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default WorkspaceForm;