import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import VideoUpload from '../components/videos/VideoUpload';
import VideoPlayer from '../components/videos/VideoPlayer';
import VideoCommentsProxy from '../components/videos/VideoCommentsProxy';
import AddMemberForm from '../components/workspaces/AddMemberForm';
import MembersDropdown from '../components/workspaces/MembersDropdown';
import YouTubeCloneConnect from '../components/integrations/YouTubeCloneConnect';
import { formatDate } from '../utils/dateUtils';

const WorkspaceDetail = () => {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [ytCloneStatus, setYtCloneStatus] = useState({ connected: false, loading: true });
  const [mobileCommentsOpen, setMobileCommentsOpen] = useState(false);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state || null;

  const isOwner = workspace && currentUser && workspace.owner === currentUser.uid;

  // Fetch workspace details
  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!workspaceId || !currentUser) return;
      
      try {
        setLoading(true);
        const token = await currentUser.getIdToken();
        const response = await fetch(`${process.env.REACT_APP_API_URL}/workspaces/${workspaceId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch workspace');
        }
        
        const data = await response.json();
        setWorkspace(data);
      } catch (error) {
        console.error('Error fetching workspace:', error);
        setError('Failed to load workspace details');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, [workspaceId, currentUser]);

  // Fetch videos for this workspace
  useEffect(() => {
    const fetchVideos = async () => {
      if (!workspaceId || !currentUser) return;
      
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(`${process.env.REACT_APP_API_URL}/videos/workspace/${workspaceId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch videos');
        }
        
        const data = await response.json();
        setVideos(data);
        
        // If a videoId was passed via navigation after upload, preselect it
        const targetId = locationState?.videoId;
        if (targetId) {
          const match = data.find(v => v.id === targetId);
          if (match) setSelectedVideo(match);
          else if (data.length > 0 && !selectedVideo) setSelectedVideo(data[0]);
          // Clear location state so subsequent navigations don’t depend on it
          if (locationState) navigate(location.pathname, { replace: true });
        } else if (data.length > 0 && !selectedVideo) {
          setSelectedVideo(data[0]);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
        setError('Failed to load videos');
      }
    };

    fetchVideos();
  }, [workspaceId, currentUser, refreshKey]);

  // Fetch YouTube Clone connection status
  useEffect(() => {
    const fetchYTCloneStatus = async () => {
      if (!currentUser) return;
      
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(`${process.env.REACT_APP_API_URL}/integrations/youtube-clone/status?workspaceId=${workspaceId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setYtCloneStatus({ ...data, loading: false });
        } else {
          setYtCloneStatus({ connected: false, loading: false });
        }
      } catch (error) {
        console.error('Error fetching YouTube Clone status:', error);
        setYtCloneStatus({ connected: false, loading: false });
      }
    };

    fetchYTCloneStatus();
  }, [currentUser, workspaceId]);

  const handleDeleteWorkspace = async () => {
    if (!window.confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/workspaces/${workspaceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete workspace');
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting workspace:', error);
      setError('Failed to delete workspace');
    }
  };

  if (loading) {
    return <div className="loading">Loading workspace...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (!workspace) {
    return <div className="not-found">Workspace not found</div>;
  }

  return (
    <div className="workspace-detail-container">
      <div className="workspace-header">
        <div className="workspace-info">
          <h1 className="h-title float-in">{workspace.name}</h1>
          <p className="workspace-description h-subtitle">{workspace.description}</p>
          <hr className="neon-sep" />
        </div>
        
        <div className="workspace-actions">
          <Link to={`/workspace/${workspaceId}/edit`} className="edit-button btn-sm">
            Edit
          </Link>
          {isOwner && (
            <div className="add-member-inline">
              <AddMemberForm workspaceId={workspaceId} onAdded={() => { /* could refresh workspace if needed */ }} />
            </div>
          )}
          {isOwner && (
            <button onClick={handleDeleteWorkspace} className="delete-button btn-sm btn-danger">
              Delete
            </button>
          )}
          <MembersDropdown workspaceId={workspaceId} canManage={isOwner} />
        </div>
      </div>
      
      <div className="workspace-content layout-3col">
        <div className="sidebar">
          <div className="videos-header">
            <h2 className="h-title">Videos</h2>
          </div>
          
          <div className="videos-list">
            {videos.length === 0 ? (
              <div className="empty-videos-state float-in">
                <div className="holo-icon">▦</div>
                <h3 className="h-title">No videos yet</h3>
                <p className="h-subtitle">Upload your first version to get started.</p>
              </div>
            ) : (
              videos.map(video => (
                <div 
                  key={video.id} 
                  className={`video-item glow-hover ${selectedVideo?.id === video.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedVideo(video);
                    setCurrentVideoTime(0); // Reset time when switching videos
                  }}
                >
                  <div className="video-item-title">{video.title}</div>
                  <div className="video-item-meta">
                    <span>v{video.version || video.currentVersion || 1}</span>
                    <span>{formatDate(video.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="main-content">
          <div className="main-toolbar">
            <button 
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="upload-button btn-icon"
            >
              <span>{showUploadForm ? '✕' : '📤'}</span>
              {showUploadForm ? 'Cancel Upload' : 'Upload Video'}
            </button>
            <button
              onClick={() => {
                if (!ytCloneStatus.connected && ytCloneStatus.isOwner) {
                  const modal = document.getElementById('yt-clone-modal');
                  if (modal) modal.style.display = 'block';
                }
              }}
              className={`youtube-clone-btn ${
                ytCloneStatus.loading ? 'loading' : 
                ytCloneStatus.connected ? 'connected' : 
                ytCloneStatus.isOwner ? 'default' : 'disabled'
              }`}
              disabled={ytCloneStatus.loading || (!ytCloneStatus.isOwner && !ytCloneStatus.connected)}
            >
              {ytCloneStatus.loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Checking...
                </>
              ) : ytCloneStatus.connected ? (
                <>
                  <span className="status-icon">✓</span>
                  Connected
                  {ytCloneStatus.channelName && (
                    <span className="channel-name">({ytCloneStatus.channelName})</span>
                  )}
                </>
              ) : ytCloneStatus.isOwner ? (
                <>
                  <span className="status-icon">🔗</span>
                  Connect YouTube Clone
                </>
              ) : (
                <>
                  <span className="status-icon">🔒</span>
                  Not Connected (Owner Only)
                </>
              )}
            </button>
          </div>

          {showUploadForm && (
            <VideoUpload 
              workspaceId={workspaceId} 
              onUploaded={(newVideoId) => {
                setShowUploadForm(false);
                setRefreshKey(k => k + 1);
                // Preselect the newly uploaded video after refresh
                setTimeout(() => {
                  setSelectedVideo(prev => prev && prev.id === newVideoId ? prev : null);
                }, 0);
                navigate(`/workspace/${workspaceId}`, { replace: true, state: { videoId: newVideoId } });
              }}
            />
          )}

          {selectedVideo ? (
            <VideoPlayer 
              video={selectedVideo} 
              workspaceId={workspaceId} 
              onTimeUpdate={setCurrentVideoTime}
            />
          ) : (
            videos.length > 0 ? (
              <div className="no-video-selected empty-main float-in">
                <div className="holo-icon">▶</div>
                <h3 className="h-title">No video selected</h3>
                <p className="h-subtitle">Choose one from the left or upload a new file.</p>
              </div>
            ) : null
          )}
        </div>

        {/* Right-side comments toolbar */}
        <div className={`comments-toolbar ${mobileCommentsOpen ? 'mobile-open' : ''}`}>
          <div className="comments-toolbar-header">
            <h3>Comments</h3>
            <button 
              className="comments-close-btn"
              onClick={() => setMobileCommentsOpen(false)}
            >
              ✕
            </button>
          </div>
          {selectedVideo ? (
            <VideoCommentsProxy 
              videoId={selectedVideo.id} 
              workspaceId={workspaceId} 
              currentTime={currentVideoTime}
            />
          ) : (
            <div className="comments-empty">Select a video to view comments</div>
          )}
        </div>
      </div>

      {/* Mobile comments toggle button */}
      {selectedVideo && (
        <button 
          className="mobile-comments-toggle"
          onClick={() => setMobileCommentsOpen(true)}
        >
          💬
        </button>
      )}

      {/* Simple modal for YouTube Clone connect */}
      <div id="yt-clone-modal" style={{ display: 'none', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={(e)=>{ if(e.target.id==='yt-clone-modal'){ e.currentTarget.style.display='none'; } }}>
        <div style={{ background: '#111', padding: 16, maxWidth: 520, margin: '10% auto', borderRadius: 8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3>Connect YouTube Clone</h3>
            <button onClick={() => { const m=document.getElementById('yt-clone-modal'); if(m) m.style.display='none'; }}>X</button>
          </div>
          <YouTubeCloneConnect workspaceId={workspaceId} onConnected={async () => { 
            const m=document.getElementById('yt-clone-modal'); 
            if(m) m.style.display='none'; 
            // Refresh the connection status
            try {
              const token = await currentUser.getIdToken();
              const response = await fetch(`${process.env.REACT_APP_API_URL}/integrations/youtube-clone/status?workspaceId=${workspaceId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (response.ok) {
                const data = await response.json();
                setYtCloneStatus({ ...data, loading: false });
              }
            } catch (error) {
              console.error('Error refreshing YouTube Clone status:', error);
            }
          }} />
        </div>
      </div>
    </div>
  );
};

export default WorkspaceDetail;