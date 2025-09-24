import React from 'react';
import CommentList from './CommentList';

// Lightweight wrapper to render comments in the right toolbar
export default function VideoCommentsProxy({ videoId, workspaceId, currentTime = 0, onSeek }) {
  return (
    <div className="comments-toolbar-inner">
      <CommentList 
        videoId={videoId} 
        workspaceId={workspaceId}
        currentTime={currentTime}
        onSeek={onSeek}
      />
    </div>
  );
}