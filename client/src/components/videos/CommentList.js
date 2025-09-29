import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/dateUtils';

const CommentList = ({ videoId, currentTime, onSeek, workspaceId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  // Fetch comments for the video
  useEffect(() => {
    const fetchComments = async () => {
      if (!videoId || !currentUser) return;
      
      try {
        setLoading(true);
        const token = await currentUser.getIdToken();
        const response = await fetch(`${process.env.REACT_APP_API_URL}/comments/${videoId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch comments');
        }
        
        const data = await response.json();
        setComments(data);
      } catch (error) {
        console.error('Error fetching comments:', error);
        setError('Failed to load comments');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [videoId, currentUser]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !videoId) return;
    
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/comments/${videoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newComment,
          timestamp: currentTime,
          workspaceId: workspaceId || comments[0]?.workspaceId // Use provided workspaceId or fallback to existing comments
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add comment');
      }
      
      const newCommentData = await response.json();
      
      // Create notification for video owner and workspace members
      await fetch(`${process.env.REACT_APP_API_URL}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          type: 'comment',
          message: `New comment at ${formatTimestamp(currentTime)}`,
          workspaceId: workspaceId || comments[0]?.workspaceId,
          videoId: videoId
        })
      });
      
      setComments([...comments, newCommentData]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment');
    }
  };

  const formatTimestamp = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleTimestampClick = (timestamp) => {
    if (typeof timestamp === 'number' && !Number.isNaN(timestamp)) {
      if (onSeek) onSeek(timestamp);
      else {
        // Fallback: dispatch a window event so VideoPlayer can listen
        const ev = new CustomEvent('vc-seek', { detail: { type: 'seek', seconds: timestamp } });
        window.dispatchEvent(ev);
      }
    }
  };

  if (loading) {
    return <div className="comments-loading">Loading comments...</div>;
  }

  return (
    <div className="comments-container">
      <form onSubmit={handleAddComment} className="comment-form">
        <div className="comment-input-container">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment at current timestamp..."
            className="comment-input"
          />
          <span className="current-timestamp">{formatTimestamp(currentTime || 0)}</span>
        </div>
        <button type="submit" className="comment-submit-btn">Add</button>
      </form>
      
      {error && <div className="comments-error">{error}</div>}
      
      <div className="comments-list-container">
        <div className="comments-list">
          {comments.length === 0 ? (
            <p className="no-comments">No comments yet</p>
          ) : (
            comments
              .filter(comment => comment && comment.id)
              .map((comment, index) => (
                <div key={`${comment.id}-${index}`} className="comment-item">
                  <div className="comment-header">
                    <div className="comment-author">
                      {comment.author?.photoURL && (
                        <img 
                          src={comment.author.photoURL} 
                          alt={comment.author.displayName || 'User'} 
                          className="author-avatar"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      <span className="author-name">{comment.author?.displayName || comment.author?.email || 'Unknown User'}</span>
                    </div>
                    <button 
                      className="timestamp-btn"
                      onClick={() => handleTimestampClick(comment.timestamp)}
                      title={`Jump to ${formatTimestamp(comment.timestamp || 0)}`}
                    >
                      {formatTimestamp(comment.timestamp || 0)}
                    </button>
                  </div>
                  <div className="comment-content">{comment.content || ''}</div>
                  <div className="comment-date">
                    {comment.createdAt ? formatDateTime(comment.createdAt) : 'Unknown date'}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentList;