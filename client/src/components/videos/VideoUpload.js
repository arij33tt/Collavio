import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const VideoUpload = ({ workspaceId, onUploaded }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState(null);
  const [version, setVersion] = useState('1.0');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check file type
      const fileType = selectedFile.type;
      if (!fileType.includes('video/')) {
        setError('Please select a video file');
        return;
      }
      
      // Check file size (50MB limit)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('File size exceeds 50MB limit');
        return;
      }
      
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a video file');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('video', file);
      if (thumbnail) formData.append('thumbnail', thumbnail);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('workspaceId', workspaceId);
      formData.append('version', version);

      const token = await currentUser.getIdToken();

      const response = await fetch(`${process.env.REACT_APP_API_URL}/videos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload video');
      }

      const data = await response.json();

      // Create notification for workspace members (fire and forget)
      fetch(`${process.env.REACT_APP_API_URL}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          type: 'upload',
          message: `New video \"${title}\" uploaded to workspace`,
          workspaceId: workspaceId,
          videoId: data.video.id
        })
      }).catch(() => {});

      // Notify parent (WorkspaceDetail) to refresh and preselect the new video
      if (typeof onUploaded === 'function') {
        onUploaded(data.video.id);
      } else {
        // Fallback: navigate if parent didn’t pass a callback
        navigate(`/workspace/${workspaceId}`, { replace: true, state: { videoId: data.video.id } });
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      setError(error.message || 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="video-upload-container">
      <h2>Upload New Video</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="video">Select Video</label>
          <input 
            type="file" 
            id="video" 
            accept="video/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {file && (
            <div className="file-info">
              <p>Selected file: {file.name}</p>
              <p>Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="thumbnail">Thumbnail (optional)</label>
          <input
            type="file"
            id="thumbnail"
            accept="image/*"
            onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
            disabled={uploading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={uploading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description (optional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={uploading}
            rows="4"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="version">Version</label>
          <input
            type="text"
            id="version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            disabled={uploading}
          />
        </div>
        
        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Video'}
        </button>
        
        {uploading && (
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ width: `${progress}%` }}
            />
            <span>{progress}%</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default VideoUpload;