import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const VersionUpload = ({ videoId, onUploaded }) => {
  const [file, setFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a video file');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('video', file);
      if (thumbnail) formData.append('thumbnail', thumbnail);

      const token = await currentUser.getIdToken();
      const res = await fetch(`${process.env.REACT_APP_API_URL}/videos/${videoId}/versions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to upload version');
      }
      if (onUploaded) onUploaded();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to upload version');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="version-upload-form">
      {error && <div className="error-message">{error}</div>}
      <div className="form-group">
        <label htmlFor="version-video">Replace Video File</label>
        <input id="version-video" type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={uploading} />
      </div>
      <div className="form-group">
        <label htmlFor="version-thumb">Thumbnail (optional)</label>
        <input id="version-thumb" type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} disabled={uploading} />
      </div>
      <button type="submit" disabled={uploading}>{uploading ? 'Overriding...' : 'Override Video'}</button>
    </form>
  );
};

export default VersionUpload;