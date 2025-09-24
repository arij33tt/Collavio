import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import CommentList from './CommentList';
import VersionUpload from './VersionUpload';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/dateUtils';

const VideoPlayer = ({ video, workspaceId, onTimeUpdate }) => {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoData, setVideoData] = useState(video);
  const [workspace, setWorkspace] = useState(null);
  const [error, setError] = useState('');
  const [showPublish, setShowPublish] = useState(false);
  const [publishTitle, setPublishTitle] = useState('');
  const [publishDesc, setPublishDesc] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const playerRef = useRef(null);
  const { currentUser } = useAuth();

  useEffect(() => { 
    setVideoData(video); 
    setUseFallback(false); 
    setPlaying(false); 
    setShowSuccess(false); // Clear success message when video changes
    setError(''); // Clear error message when video changes
  }, [video]);

  // If no playable URL provideld, fetch detailed video 
  useEffect(() => {
    const loadDetails = async () => {
      if (!videoData || videoData.url) return;
      if (!currentUser || !video?.id) return;
      try {
        const token = await currentUser.getIdToken();
        const res = await fetch(`${process.env.REACT_APP_API_URL}/videos/${video.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setVideoData(data);
        }
      } catch (e) {
        console.error('Failed to load video details', e);
      }
    };
    loadDetails();
    
  }, [videoData?.url, video?.id, currentUser]);

  // Fetch workspace to detect owner for review actions
  useEffect(() => {
    const loadWs = async () => {
      if (!workspaceId || !currentUser) return;
      try {
        const token = await currentUser.getIdToken();
        const res = await fetch(`${process.env.REACT_APP_API_URL}/workspaces/${workspaceId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setWorkspace(data);
        }
      } catch (e) {
        console.error('Failed to load workspace', e);
      }
    };
    loadWs();
  }, [workspaceId, currentUser]);

  const isOwner = workspace && workspace.owner === currentUser?.uid;
  const isPublisher = workspace && Array.isArray(workspace.publishers) && workspace.publishers.includes(currentUser?.uid);
  const canPublish = isOwner || isPublisher;

  const handleProgress = (state) => {
    setCurrentTime(state.playedSeconds);
  };

  const handleDuration = (duration) => {
    setDuration(duration);
  };

  // Update current time from native video element
  const handleTimeUpdate = (e) => {
    if (e.target && typeof e.target.currentTime === 'number') {
      const time = e.target.currentTime;
      setCurrentTime(time);
      // Notify parent component about time update
      if (onTimeUpdate) {
        onTimeUpdate(time);
      }
    }
  };

  const handleSeek = (timestamp) => {
    // Seek the native <video> element
    const videoEl = playerRef.current?.getInternalPlayer ? playerRef.current.getInternalPlayer() : null;
    const domVideo = document.querySelector('.video-player video');
    const target = domVideo || videoEl;
    if (target && typeof target.currentTime === 'number') {
      try { target.currentTime = Math.max(0, Number(timestamp) || 0); } catch {}
      setPlaying(true);
    }
  };

  const refresh = async () => {
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${process.env.REACT_APP_API_URL}/videos/${video.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVideoData(data);
      }
    } catch (e) {
      console.error('Failed to refresh video', e);
    }
  };

  // expose seek handler to comments sidebar via window event (simpler wiring between siblings)
  useEffect(() => {
    const handler = (ev) => {
      if (ev?.detail?.type === 'seek' && typeof ev.detail.seconds === 'number') {
        handleSeek(ev.detail.seconds);
      }
    };
    window.addEventListener('vc-seek', handler);
    return () => window.removeEventListener('vc-seek', handler);
  }, []);

  const publish = async () => {
    setError('');
    setPublishing(true);
    try {
      const token = await currentUser.getIdToken();
      const body = {
        title: publishTitle || videoData.title,
        description: publishDesc || videoData.description,
        thumbnailUrl: videoData.latestVersion?.thumbnailUrl || null
      };
      const res = await fetch(`${process.env.REACT_APP_API_URL}/integrations/youtube-clone/publish/${videoData.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to publish');
      }
      await refresh();
      setShowPublish(false);
      setError(''); // Clear any previous errors
      setShowSuccess(true);
      // Auto-dismiss success notification after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  if (!videoData) {
    return <div className="loading">No video selected</div>;
  }

  return (
    <div className="video-player-container">
      <div className="video-player compact">
        {/* Prefer native video for Firebase signed URLs */}
        <video
          src={videoData.url || videoData.latestVersion?.videoUrl}
          controls
          className="video-el"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onError={(e) => console.error('Native video error', e?.currentTarget?.error)}
        />
      </div>
      
      <div className="video-info">
        <h2>{videoData.title}</h2>
        <p className="video-description">{videoData.description}</p>
        <div className="video-meta">
          <span>Version: {videoData.version || videoData.currentVersion || 1}</span>
          <span> • </span>
          <span>Uploaded: {formatDate(videoData.createdAt)}</span>
          <span> • </span>
          <span>Status: {videoData.status || 'unknown'}</span>
          {videoData.published && <span> • Published</span>}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {showSuccess && (
        <div className="success-message">
          <span>✅</span>
          <span>Published successfully!</span>
        </div>
      )}

      {isOwner && (
        <div className="review-actions">
          <h3>Publish Actions</h3>
          <div className="buttons">
            <button onClick={() => setShowPublish((v) => !v)}>{showPublish ? 'Cancel' : 'Publish'}</button>
          </div>
          {showPublish && (
            <div className="publish-form">
              <div className="form-group">
                <label htmlFor="pub-title">Title</label>
                <input id="pub-title" type="text" value={publishTitle} onChange={(e) => setPublishTitle(e.target.value)} placeholder={videoData.title} />
              </div>
              <div className="form-group">
                <label htmlFor="pub-desc">Description</label>
                <textarea id="pub-desc" rows={3} value={publishDesc} onChange={(e) => setPublishDesc(e.target.value)} placeholder={videoData.description} />
              </div>
              <div className="form-group">
                <small>Using latest version thumbnail if available.</small>
              </div>
              <button onClick={publish} disabled={publishing}>{publishing ? 'Publishing...' : 'Publish Now'}</button>
            </div>
          )}
        </div>
      )}

      {isPublisher && !isOwner && (
        <div className="review-actions">
          <h3>Publish Actions</h3>
          <div className="buttons">
            <button onClick={() => setShowPublish((v) => !v)}>{showPublish ? 'Cancel' : 'Publish'}</button>
          </div>
          {showPublish && (
            <div className="publish-form">
              <div className="form-group">
                <label htmlFor="pub-title">Title</label>
                <input id="pub-title" type="text" value={publishTitle} onChange={(e) => setPublishTitle(e.target.value)} placeholder={videoData.title} />
              </div>
              <div className="form-group">
                <label htmlFor="pub-desc">Description</label>
                <textarea id="pub-desc" rows={3} value={publishDesc} onChange={(e) => setPublishDesc(e.target.value)} placeholder={videoData.description} />
              </div>
              <div className="form-group">
                <small>Using latest version thumbnail if available.</small>
              </div>
              <button onClick={publish} disabled={publishing}>{publishing ? 'Publishing...' : 'Publish Now'}</button>
            </div>
          )}
        </div>
      )}

      <div className="version-actions" style={{ marginTop: '2rem' }}>
        <h3>Override This Video</h3>
        <VersionUpload videoId={videoData.id} onUploaded={refresh} />
      </div>
    </div>
  );
};

export default VideoPlayer;