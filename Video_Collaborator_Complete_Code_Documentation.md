# Video Collaborator - Complete Code Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Authentication System](#authentication-system)
4. [Workspace Management](#workspace-management)
5. [Member Management](#member-management)
6. [Video Upload & Management](#video-upload--management)
7. [Comment System with Timestamps](#comment-system-with-timestamps)
8. [YouTube Clone Integration](#youtube-clone-integration)
9. [Publishing System](#publishing-system)
10. [Notification System](#notification-system)
11. [Frontend Components](#frontend-components)
12. [Backend Controllers](#backend-controllers)
13. [Database Schema](#database-schema)
14. [File Structure](#file-structure)
15. [API Endpoints](#api-endpoints)

---

## System Overview

The Video Collaborator is a full-stack web application that enables content creators and editors to collaborate on video projects. It provides workspace management, video versioning, timestamped comments, and integration with YouTube Clone for publishing.

### Key Features:
- **User Authentication** with Firebase Auth
- **Workspace Creation & Management**
- **Member Addition & Role Management**
- **Video Upload with Multiple Versions**
- **Timestamped Comment System**
- **YouTube Clone Integration**
- **Publishing Workflow**
- **Real-time Notifications**

### Technology Stack:
- **Frontend**: React.js, React Router, Context API
- **Backend**: Node.js, Express.js
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage / Local Storage
- **Authentication**: Firebase Authentication
- **File Upload**: Multer
- **Styling**: CSS with custom themes

---

## Architecture

### System Architecture Diagram:
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express Server │    │ Firebase/Storage│
│                 │    │                 │    │                 │
│ - Components    │◄──►│ - Controllers   │◄──►│ - Firestore DB  │
│ - Context API   │    │ - Routes        │    │ - Auth Service  │
│ - State Mgmt    │    │ - Middleware    │    │ - File Storage  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ YouTube Clone   │
                    │ Integration     │
                    │ (External API)  │
                    └─────────────────┘
```

### Data Flow:
1. **User Authentication**: Firebase Auth handles login/signup
2. **API Requests**: React → Express → Firebase
3. **File Uploads**: Multer → Firebase Storage/Local
4. **Real-time Updates**: Firestore listeners
5. **External Integration**: YouTube Clone API calls

---

## Authentication System

### Implementation Details:

#### Frontend (AuthContext.js):
```javascript
// Location: client/src/contexts/AuthContext.js

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [userChannels, setUserChannels] = useState([]);

  // Authentication Methods:
  const register = async (email, password, displayName) => {
    // Creates user with Firebase Auth
    // Updates display name
    // Returns user object
  };

  const login = async (email, password) => {
    // Signs in user with Firebase Auth
    // Returns user credential
  };

  const logout = async () => {
    // Signs out user
    // Clears user profile state
  };
```

#### Backend (authController.js):
```javascript
// Location: server/src/controllers/authController.js

// Middleware for token verification
exports.verifyToken = async (req, res, next) => {
  // Extracts Bearer token from Authorization header
  // Verifies token with Firebase Admin
  // Attaches user to request object
  // Calls next() or returns 401/403
};

// User profile management
exports.getProfile = async (req, res) => {
  // Fetches user profile from Firestore
  // Returns user data
};

exports.updateProfile = async (req, res) => {
  // Updates user profile in Firestore
  // Syncs with Firebase Auth profile
};
```

### Authentication Flow:
1. **Registration**: User provides email/password → Firebase Auth creates account → Profile stored in Firestore
2. **Login**: Credentials verified → JWT token issued → User state updated
3. **Protected Routes**: Token verified on each request → User attached to request
4. **Logout**: Token invalidated → User state cleared

---

## Workspace Management

### Workspace Creation Process:

#### Frontend (WorkspaceForm.js):
```javascript
// Location: client/src/components/workspaces/WorkspaceForm.js

const WorkspaceForm = ({ editMode = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const token = await currentUser.getIdToken();
    const url = editMode 
      ? `${API_URL}/workspaces/${workspaceId}`
      : `${API_URL}/workspaces`;
    
    const method = editMode ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    
    // Handle response and navigation
  };
```

#### Backend (workspaceController.js):
```javascript
// Location: server/src/controllers/workspaceController.js

exports.createWorkspace = async (req, res) => {
  try {
    const { name, description = '' } = req.body;
    const userId = req.user.uid;

    // Validation
    if (!name) return res.status(400).json({ message: 'Name is required' });

    // Create workspace document
    const wsRef = db.collection('workspaces').doc();
    const workspaceId = wsRef.id;
    
    const data = {
      id: workspaceId,
      name,
      description,
      owner: userId,
      members: [userId],           // Owner is first member
      publishers: [],              // Members allowed to publish
      videos: [],                  // Array of video IDs
      integration: { youtubeClone: null },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await wsRef.set(data);

    // Add workspace reference to user document
    await userRef.update({
      workspaces: admin.firestore.FieldValue.arrayUnion(workspaceId),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json(data);
  } catch (error) {
    console.error('Error creating workspace:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
```

### Workspace Data Structure:
```javascript
{
  id: "workspace_id",
  name: "My Video Project",
  description: "Project description",
  owner: "user_uid",
  members: ["user_uid_1", "user_uid_2"],
  publishers: ["user_uid_1"],  // Subset of members who can publish
  videos: ["video_id_1", "video_id_2"],
  integration: {
    youtubeClone: {
      baseUrl: "https://youtube-clone.com",
      token: "auth_token",
      channelId: "channel_id",
      channelName: "Channel Name",
      channelLinkSecret: "secret_key"
    }
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## Member Management

### Adding Members Process:

#### Frontend (AddMemberForm.js):
```javascript
// Location: client/src/components/workspaces/AddMemberForm.js

const AddMemberForm = ({ workspaceId, onAdded }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${API_URL}/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        setEmail('');
        onAdded?.();
        // Show success message
      } else {
        // Handle error
      }
    } catch (error) {
      console.error('Error adding member:', error);
    } finally {
      setLoading(false);
    }
  };
```

#### Backend Member Management:
```javascript
// Add member to workspace
exports.addMember = async (req, res) => {
  try {
    const { id } = req.params; // workspace id
    const { email } = req.body;
    const requesterId = req.user.uid;

    // Validation
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Verify workspace exists and requester is owner
    const wsRef = db.collection('workspaces').doc(id);
    const wsDoc = await wsRef.get();
    if (!wsDoc.exists) return res.status(404).json({ message: 'Workspace not found' });

    const ws = wsDoc.data();
    if (ws.owner !== requesterId) {
      return res.status(403).json({ message: 'Not authorized to add members' });
    }

    // Find user by email
    const userSnap = await db.collection('users').where('email', '==', email).limit(1).get();
    if (userSnap.empty) {
      return res.status(404).json({ message: 'User with that email not found' });
    }
    
    const userToAddDoc = userSnap.docs[0];
    const userToAdd = { uid: userToAddDoc.id, ...userToAddDoc.data() };

    // Check if already a member
    if (Array.isArray(ws.members) && ws.members.includes(userToAdd.uid)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    // Add to workspace members
    await wsRef.update({
      members: admin.firestore.FieldValue.arrayUnion(userToAdd.uid),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Add workspace to user's workspaces
    await db.collection('users').doc(userToAdd.uid).update({
      workspaces: admin.firestore.FieldValue.arrayUnion(id),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Error adding member:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Remove member from workspace
exports.removeMember = async (req, res) => {
  // Similar process but removes from arrays
  // Updates both workspace and user documents
};

// Grant/Revoke publisher permissions
exports.grantPublisher = async (req, res) => {
  // Adds user to publishers array
  // Only workspace owner can grant permissions
};

exports.revokePublisher = async (req, res) => {
  // Removes user from publishers array
  // Only workspace owner can revoke permissions
};
```

### Member Roles:
1. **Owner**: Full control, can add/remove members, delete workspace
2. **Publisher**: Can upload videos and publish to YouTube Clone
3. **Member**: Can view videos, add comments, upload videos (if permitted)

---

## Video Upload & Management

### Video Upload Process:

#### Frontend (VideoUpload.js):
```javascript
// Location: client/src/components/videos/VideoUpload.js

const VideoUpload = ({ workspaceId, onUploaded }) => {
  const [file, setFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('video', file);
    if (thumbnail) formData.append('thumbnail', thumbnail);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('workspaceId', workspaceId);

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${API_URL}/videos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        onUploaded?.(result.video.id);
        // Reset form
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };
```

#### Backend Video Upload:
```javascript
// Location: server/src/controllers/videoController.js

exports.uploadVideo = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { title, description = '', workspaceId } = req.body;
    const videoFile = req.files?.video?.[0];
    const thumbFile = req.files?.thumbnail?.[0];

    // Validation
    if (!videoFile) return res.status(400).json({ message: 'No video file uploaded' });
    if (!title || !workspaceId) {
      return res.status(400).json({ message: 'Title and workspaceId are required' });
    }

    // Verify workspace access
    const access = await ensureWorkspaceAccess(workspaceId, userId);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    // Create video document
    const videoRef = db.collection('videos').doc();
    const videoId = videoRef.id;

    await videoRef.set({
      id: videoId,
      title,
      description,
      workspaceId,
      owner: userId,
      status: 'in_review',
      currentVersion: 1,
      published: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Upload to storage (Firebase Storage or Local)
    let videoUrl = null;
    let thumbnailUrl = null;

    const storageMode = (process.env.STORAGE_PROVIDER || 'firebase').toLowerCase();

    if (storageMode === 'firebase') {
      // Firebase Storage upload
      const storageBucket = admin.storage().bucket();
      const videoPath = `videos/${workspaceId}/${videoId}/${Date.now()}-${videoFile.originalname}`;
      const videoObj = storageBucket.file(videoPath);
      
      await new Promise((resolve, reject) => {
        const stream = videoObj.createWriteStream({
          metadata: { contentType: videoFile.mimetype }
        });
        stream.on('error', reject);
        stream.on('finish', resolve);
        stream.end(videoFile.buffer);
      });

      const [signedVideoUrl] = await videoObj.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      videoUrl = signedVideoUrl;
    } else {
      // Local storage upload
      const baseDir = path.join(__dirname, '..', 'uploads');
      const videoDir = path.join(baseDir, 'videos', workspaceId, videoId);
      await fsp.mkdir(videoDir, { recursive: true });

      const videoFilename = `${Date.now()}-${videoFile.originalname}`;
      const videoFsPath = path.join(videoDir, videoFilename);
      await fsp.writeFile(videoFsPath, videoFile.buffer);
      
      videoUrl = `${req.protocol}://${req.get('host')}/uploads/videos/${workspaceId}/${videoId}/${videoFilename}`;
    }

    // Create first version in subcollection
    const versionsRef = videoRef.collection('versions');
    const versionRef = versionsRef.doc();
    await versionRef.set({
      id: versionRef.id,
      versionNumber: 1,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      fileSize: videoFile.size,
      uploadedBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      qualities: [{ quality: 'source', url: videoUrl }],
    });

    return res.status(201).json({
      video: { id: videoId, workspaceId },
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
```

### Video Data Structure:
```javascript
// Main video document
{
  id: "video_id",
  title: "Video Title",
  description: "Video description",
  workspaceId: "workspace_id",
  owner: "user_uid",
  status: "in_review" | "approved" | "rejected",
  currentVersion: 1,
  published: false,
  publishMeta: {
    platform: "youtube-clone",
    channelId: "channel_id",
    remoteVideo: { /* YouTube Clone response */ }
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}

// Version subcollection: videos/{videoId}/versions/{versionId}
{
  id: "version_id",
  versionNumber: 1,
  title: "Version Title",
  description: "Version description",
  videoUrl: "https://storage.url/video.mp4",
  thumbnailUrl: "https://storage.url/thumb.jpg",
  fileSize: 1024000,
  uploadedBy: "user_uid",
  qualities: [
    { quality: "source", url: "https://storage.url/video.mp4" },
    { quality: "720p", url: "https://storage.url/video_720p.mp4" }
  ],
  createdAt: Timestamp
}
```

---

## Comment System with Timestamps

### Comment Implementation:

#### Frontend (CommentList.js):
```javascript
// Location: client/src/components/videos/CommentList.js

const CommentList = ({ videoId, workspaceId, currentTime }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${API_URL}/comments/${videoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newComment,
          timestamp: currentTime, // Current video playback time
          workspaceId
        })
      });

      if (response.ok) {
        const comment = await response.json();
        setComments(prev => [...prev, comment]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const formatTimestamp = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="comment-list">
      {comments.map(comment => (
        <div key={comment.id} className="comment-item">
          <div className="comment-header">
            <span className="author">{comment.author.displayName}</span>
            <span className="timestamp" onClick={() => seekToTime(comment.timestamp)}>
              {formatTimestamp(comment.timestamp)}
            </span>
          </div>
          <div className="comment-content">{comment.content}</div>
        </div>
      ))}
      
      <div className="add-comment">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={`Add comment at ${formatTimestamp(currentTime)}`}
        />
        <button onClick={addComment}>Add Comment</button>
      </div>
    </div>
  );
};
```

#### Backend Comment System:
```javascript
// Location: server/src/controllers/commentController.js

const addComment = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { content, timestamp, workspaceId } = req.body;
    const userId = req.user.uid;

    // Validation
    if (!content || timestamp === undefined || !workspaceId) {
      return res.status(400).json({ 
        message: 'Content, timestamp, and workspaceId are required' 
      });
    }

    // Verify video exists
    const videoRef = db.collection('videos').doc(videoId);
    const videoDoc = await videoRef.get();
    if (!videoDoc.exists) return res.status(404).json({ message: 'Video not found' });

    // Verify workspace access
    const workspaceRef = db.collection('workspaces').doc(workspaceId);
    const workspaceDoc = await workspaceRef.get();
    if (!workspaceDoc.exists) return res.status(404).json({ message: 'Workspace not found' });

    const ws = workspaceDoc.data();
    const isMember = ws.owner === userId || (Array.isArray(ws.members) && ws.members.includes(userId));
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    // Get user data for author info
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
    const userData = userDoc.data();

    // Create comment
    const commentRef = db.collection('comments').doc();
    const commentData = {
      id: commentRef.id,
      content,
      timestamp, // Video playback time in seconds
      videoId,
      workspaceId,
      author: {
        uid: userId,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await commentRef.set(commentData);

    res.status(201).json({
      ...commentData,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getVideoComments = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.uid;

    // Verify access through video -> workspace
    const videoRef = db.collection('videos').doc(videoId);
    const videoDoc = await videoRef.get();
    if (!videoDoc.exists) return res.status(404).json({ message: 'Video not found' });
    
    const videoData = videoDoc.data();
    // ... workspace access verification ...

    // Get comments ordered by timestamp
    const commentsQuery = await db
      .collection('comments')
      .where('videoId', '==', videoId)
      .orderBy('timestamp', 'asc') // Order by video timestamp
      .get();

    const comments = [];
    commentsQuery.forEach((doc) => comments.push({ id: doc.id, ...doc.data() }));
    
    return res.status(200).json(comments);
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
```

### Comment Data Structure:
```javascript
{
  id: "comment_id",
  content: "This needs to be fixed",
  timestamp: 125.5, // Video time in seconds (2:05.5)
  videoId: "video_id",
  workspaceId: "workspace_id",
  author: {
    uid: "user_uid",
    displayName: "John Doe",
    photoURL: "https://avatar.url"
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Timestamp Features:
1. **Time-based Comments**: Comments linked to specific video timestamps
2. **Click to Seek**: Clicking timestamp seeks video to that time
3. **Visual Timeline**: Comments displayed on video timeline
4. **Sorted Display**: Comments ordered by video timestamp

---

## YouTube Clone Integration

### Integration Setup Process:

#### Frontend (YouTubeCloneConnect.js):
```javascript
// Location: client/src/components/integrations/YouTubeCloneConnect.js

const YouTubeCloneConnect = ({ workspaceId, onConnected }) => {
  const [baseUrl, setBaseUrl] = useState('');
  const [token, setToken] = useState('');
  const [channelName, setChannelName] = useState('');
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async (e) => {
    e.preventDefault();
    setConnecting(true);

    try {
      const userToken = await currentUser.getIdToken();
      const response = await fetch(`${API_URL}/integrations/youtube-clone/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          workspaceId,
          baseUrl,
          token,
          channelName
        })
      });

      if (response.ok) {
        const result = await response.json();
        onConnected?.(result);
        // Show success message
      } else {
        const error = await response.json();
        // Show error message
      }
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <form onSubmit={handleConnect} className="youtube-clone-connect">
      <div className="form-group">
        <label>YouTube Clone Base URL:</label>
        <input
          type="url"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://your-youtube-clone.com"
          required
        />
      </div>
      
      <div className="form-group">
        <label>Authentication Token:</label>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Your YouTube Clone auth token"
          required
        />
      </div>
      
      <div className="form-group">
        <label>Channel Name (if creating new):</label>
        <input
          type="text"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          placeholder="My Channel"
        />
      </div>
      
      <button type="submit" disabled={connecting}>
        {connecting ? 'Connecting...' : 'Connect YouTube Clone'}
      </button>
    </form>
  );
};
```

#### Backend Integration Controller:
```javascript
// Location: server/src/controllers/integrationController.js

exports.connectYTClone = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { workspaceId, baseUrl, token, channelName, channelDescription = '' } = req.body;

    // Validation
    if (!workspaceId || !baseUrl) {
      return res.status(400).json({ message: 'workspaceId and baseUrl are required' });
    }

    // Verify workspace ownership
    const workspaceRef = db.collection('workspaces').doc(workspaceId);
    const workspaceDoc = await workspaceRef.get();
    if (!workspaceDoc.exists) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    const workspaceData = workspaceDoc.data();
    if (workspaceData.owner !== userId) {
      return res.status(403).json({ message: 'Only workspace owner can connect YouTube Clone' });
    }

    const base = baseUrl.replace(/\/$/, '');
    let channel = null;

    if (token) {
      try {
        // Fetch user's channels from YouTube Clone
        const channelsResponse = await axios.get(`${base}/api/channels/my-channels`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const channels = Array.isArray(channelsResponse.data) ? channelsResponse.data : [];
        
        if (channels.length > 0) {
          channel = channels[0]; // Use first channel
        } else if (channelName) {
          // Create new channel
          const handle = channelName.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 20) || `channel-${Date.now()}`;
            
          const createResponse = await axios.post(`${base}/api/channels`, {
            name: channelName,
            description: channelDescription,
            handle
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          channel = createResponse.data?.channel || createResponse.data;
        } else {
          return res.status(400).json({ 
            message: 'No channel found. Provide channelName to create one.' 
          });
        }
      } catch (e) {
        const msg = e?.response?.data?.error || e?.response?.data?.message || e.message;
        return res.status(400).json({ message: `Failed to connect: ${msg}` });
      }
    }

    // Get channel link secret for direct publishing
    let secret = null;
    try {
      if (token && channel?.id) {
        const secretResponse = await axios.post(`${base}/api/channels/${channel.id}/regenerate-secret`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        secret = secretResponse.data?.channelLinkSecret || secretResponse.data?.secret;
      }
    } catch (e) {
      // Secret is optional, continue without it
    }

    // Store integration in workspace
    await workspaceRef.set({
      integrations: {
        youtubeClone: {
          baseUrl: base,
          token: token || null,
          channelId: channel?.id || null,
          channelName: channel?.name || channelName || null,
          channelLinkSecret: secret,
          connectedAt: new Date().toISOString(),
          connectedBy: userId,
        }
      }
    }, { merge: true });

    return res.status(200).json({ 
      ok: true, 
      channel: { 
        id: channel?.id, 
        name: channel?.name || channelName 
      } 
    });
  } catch (error) {
    console.error('YTClone connect failed:', error);
    return res.status(500).json({ message: 'Failed to connect YouTube Clone' });
  }
};

exports.getYTCloneStatus = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { workspaceId } = req.query;
    
    // Get workspace and verify access
    const workspaceRef = db.collection('workspaces').doc(workspaceId);
    const workspaceDoc = await workspaceRef.get();
    
    if (!workspaceDoc.exists) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    const workspaceData = workspaceDoc.data();
    const isOwner = workspaceData.owner === userId;
    const isMember = workspaceData.members && workspaceData.members.includes(userId);
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const integration = workspaceData?.integrations?.youtubeClone;
    
    if (!integration || (!integration.token && !integration.channelLinkSecret)) {
      return res.status(200).json({ connected: false, isOwner });
    }
    
    const connected = !!(integration.baseUrl && 
      (integration.token || (integration.channelId && integration.channelLinkSecret)));
    
    return res.status(200).json({
      connected,
      channelName: integration.channelName || null,
      channelId: integration.channelId || null,
      connectedAt: integration.connectedAt || null,
      isOwner
    });
  } catch (error) {
    console.error('Failed to get YTClone status:', error);
    return res.status(500).json({ message: 'Failed to get connection status' });
  }
};
```

### Integration Data Structure:
```javascript
// Stored in workspace.integrations.youtubeClone
{
  baseUrl: "https://youtube-clone.com",
  token: "auth_token_from_youtube_clone",
  channelId: "channel_id_on_youtube_clone",
  channelName: "My Channel Name",
  channelLinkSecret: "secret_for_direct_publishing",
  connectedAt: "2024-01-01T00:00:00.000Z",
  connectedBy: "user_uid_who_connected"
}
```

---

## Publishing System

### Publishing Workflow:

#### Frontend Publishing:
```javascript
// Location: client/src/components/videos/VideoPlayer.js (publish button)

const publishToYouTubeClone = async () => {
  if (!video?.id) return;
  
  setPublishing(true);
  try {
    const token = await currentUser.getIdToken();
    const response = await fetch(`${API_URL}/integrations/youtube-clone/publish/${video.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl
      })
    });

    if (response.ok) {
      const result = await response.json();
      // Update video state to show published status
      setVideo(prev => ({ ...prev, published: true, publishMeta: result.publishMeta }));
      // Show success notification
    } else {
      const error = await response.json();
      // Show error message
    }
  } catch (error) {
    console.error('Publishing error:', error);
  } finally {
    setPublishing(false);
  }
};
```

#### Backend Publishing:
```javascript
// Location: server/src/controllers/integrationController.js

exports.publishToYTClone = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { videoId } = req.params;
    const { title: publishTitle, description: publishDescription } = req.body || {};

    // Get video and verify access
    const videoRef = db.collection('videos').doc(videoId);
    const videoDoc = await videoRef.get();
    if (!videoDoc.exists) return res.status(404).json({ message: 'Video not found' });
    const video = videoDoc.data();

    // Verify workspace access and publishing permissions
    const wsRef = db.collection('workspaces').doc(video.workspaceId);
    const wsDoc = await wsRef.get();
    if (!wsDoc.exists) return res.status(404).json({ message: 'Workspace not found' });
    const ws = wsDoc.data();

    const isOwner = ws.owner === userId;
    const isPublisher = Array.isArray(ws.publishers) && ws.publishers.includes(userId);
    if (!isOwner && !isPublisher) {
      return res.status(403).json({ message: 'Only owner or publisher can publish' });
    }

    // Get integration settings
    const integration = ws?.integrations?.youtubeClone;
    if (!integration) {
      return res.status(400).json({ message: 'YouTube Clone not connected' });
    }

    const baseUrl = integration.baseUrl;
    const token = integration.token;
    const channelId = integration.channelId;
    const secret = integration.channelLinkSecret;

    if (!baseUrl || (!token && !secret)) {
      return res.status(400).json({ message: 'YouTube Clone not properly configured' });
    }

    // Get latest video version
    const versionsSnap = await videoRef.collection('versions')
      .orderBy('versionNumber', 'desc')
      .limit(1)
      .get();
    
    let latest = null;
    versionsSnap.forEach((d) => (latest = { id: d.id, ...d.data() }));
    
    if (!latest?.videoUrl) {
      return res.status(400).json({ message: 'No video file found' });
    }

    // Stream video to YouTube Clone
    const videoResponse = await axios.get(latest.videoUrl, { responseType: 'stream' });
    const form = new FormData();
    form.append('video', videoResponse.data, { 
      filename: `${videoId}.mp4`, 
      contentType: 'video/mp4' 
    });
    form.append('title', publishTitle || video.title || `Video ${videoId}`);
    form.append('description', publishDescription || video.description || '');

    // Choose upload method: secret-based or token-based
    let uploadUrl = '';
    let headers = { ...form.getHeaders() };
    
    if (secret && channelId) {
      // Direct upload with secret (no auth required)
      form.append('channelId', channelId);
      form.append('secret', secret);
      uploadUrl = `${baseUrl}/api/videos/upload-by-secret`;
    } else {
      // Token-based upload
      uploadUrl = `${baseUrl}/api/videos/upload`;
      headers = { Authorization: `Bearer ${token}`, ...headers };
    }

    // Upload to YouTube Clone
    const uploadResponse = await axios.post(uploadUrl, form, {
      headers,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Update video as published
    const now = admin.firestore.FieldValue.serverTimestamp();
    await videoRef.update({
      published: true,
      status: 'approved',
      updatedAt: now,
      publishMeta: {
        platform: 'youtube-clone',
        channelId: channelId || null,
        remoteVideo: uploadResponse.data || null,
      }
    });

    const updated = await videoRef.get();
    return res.status(200).json({ 
      id: updated.id, 
      ...updated.data(), 
      publishedTo: 'youtube-clone' 
    });
  } catch (error) {
    console.error('Publishing failed:', error);
    return res.status(500).json({ message: 'Failed to publish to YouTube Clone' });
  }
};
```

### Publishing Flow:
1. **Permission Check**: Verify user is owner or has publisher role
2. **Integration Check**: Ensure YouTube Clone is connected
3. **Video Preparation**: Get latest version and metadata
4. **Upload Process**: Stream video file to YouTube Clone API
5. **Status Update**: Mark video as published in database
6. **Notification**: Inform user of successful publication

---

## Notification System

### Notification Implementation:

#### Frontend (NotificationContext.js):
```javascript
// Location: client/src/contexts/NotificationContext.js

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  // Real-time notification listener
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = db.collection('notifications')
      .where('userId', '==', currentUser.uid)
      .where('read', '==', false)
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        const newNotifications = [];
        snapshot.forEach((doc) => {
          newNotifications.push({ id: doc.id, ...doc.data() });
        });
        setNotifications(newNotifications);
        setUnreadCount(newNotifications.length);
      });

    return unsubscribe;
  }, [currentUser]);

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
```

#### Backend Notification System:
```javascript
// Location: server/src/controllers/notificationController.js

const createNotification = async (userId, type, data) => {
  try {
    const notificationRef = db.collection('notifications').doc();
    const notification = {
      id: notificationRef.id,
      userId,
      type, // 'member_added', 'video_uploaded', 'comment_added', 'video_published'
      data,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await notificationRef.set(notification);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Trigger notifications for various events
const notifyMemberAdded = async (workspaceId, newMemberUid, addedByUid) => {
  // Notify workspace owner and existing members
  const workspace = await getWorkspaceData(workspaceId);
  const notifyUsers = [workspace.owner, ...workspace.members].filter(uid => uid !== newMemberUid);
  
  for (const userId of notifyUsers) {
    await createNotification(userId, 'member_added', {
      workspaceId,
      workspaceName: workspace.name,
      newMemberUid,
      addedByUid
    });
  }
};

const notifyVideoUploaded = async (videoId, workspaceId, uploadedByUid) => {
  const workspace = await getWorkspaceData(workspaceId);
  const notifyUsers = [workspace.owner, ...workspace.members].filter(uid => uid !== uploadedByUid);
  
  for (const userId of notifyUsers) {
    await createNotification(userId, 'video_uploaded', {
      videoId,
      workspaceId,
      workspaceName: workspace.name,
      uploadedByUid
    });
  }
};

const notifyCommentAdded = async (commentId, videoId, workspaceId, authorUid) => {
  const workspace = await getWorkspaceData(workspaceId);
  const video = await getVideoData(videoId);
  const notifyUsers = [workspace.owner, video.owner, ...workspace.members]
    .filter(uid => uid !== authorUid);
  
  for (const userId of notifyUsers) {
    await createNotification(userId, 'comment_added', {
      commentId,
      videoId,
      videoTitle: video.title,
      workspaceId,
      workspaceName: workspace.name,
      authorUid
    });
  }
};
```

### Notification Types:
1. **Member Added**: When new member joins workspace
2. **Video Uploaded**: When new video is uploaded
3. **Comment Added**: When comment is added to video
4. **Video Published**: When video is published to YouTube Clone
5. **Permission Changed**: When publisher permissions are granted/revoked

---

## Frontend Components

### Key Component Structure:

#### App.js - Main Application:
```javascript
// Location: client/src/App.js
function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <div className="App">
            <Navigation />
            <div className="app-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route element={<PrivateRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/workspace/create" element={<WorkspaceForm />} />
                  <Route path="/workspace/:workspaceId" element={<WorkspaceDetail />} />
                  <Route path="/workspace/:workspaceId/edit" element={<WorkspaceForm editMode={true} />} />
                </Route>
              </Routes>
            </div>
          </div>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}
```

#### WorkspaceDetail.js - Main Workspace View:
```javascript
// Location: client/src/pages/WorkspaceDetail.js
const WorkspaceDetail = () => {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Three-column layout:
  return (
    <div className="workspace-detail-container">
      <div className="workspace-header">
        {/* Workspace info and actions */}
      </div>
      
      <div className="workspace-content layout-3col">
        <div className="sidebar">
          {/* Video list */}
        </div>
        
        <div className="main-content">
          {/* Video player and upload form */}
        </div>

        <div className="comments-toolbar">
          {/* Comments panel */}
        </div>
      </div>
    </div>
  );
};
```

#### VideoPlayer.js - Video Playback:
```javascript
// Location: client/src/components/videos/VideoPlayer.js
const VideoPlayer = ({ video, workspaceId, onTimeUpdate }) => {
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  };

  const seekToTime = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  return (
    <div className="video-player">
      <video
        ref={videoRef}
        src={video.url}
        controls
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current.duration)}
      />
      <div className="video-info">
        <h3>{video.title}</h3>
        <p>{video.description}</p>
        <div className="video-actions">
          <button onClick={publishToYouTubeClone}>
            Publish to YouTube Clone
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## Backend Controllers

### Controller Structure:

#### authController.js:
- `verifyToken`: Middleware for JWT verification
- `getProfile`: Get user profile
- `updateProfile`: Update user profile

#### workspaceController.js:
- `createWorkspace`: Create new workspace
- `getUserWorkspaces`: Get user's workspaces
- `getWorkspaceById`: Get specific workspace
- `updateWorkspace`: Update workspace details
- `addMember`: Add member to workspace
- `removeMember`: Remove member from workspace
- `listMembers`: List workspace members
- `grantPublisher`: Grant publish permissions
- `revokePublisher`: Revoke publish permissions
- `deleteWorkspace`: Delete workspace

#### videoController.js:
- `uploadVideo`: Upload new video
- `getWorkspaceVideos`: Get videos for workspace
- `getVideoById`: Get specific video
- `uploadVersion`: Upload new version
- `publishVideo`: Publish video (internal)
- `deleteVideo`: Delete video

#### commentController.js:
- `addComment`: Add timestamped comment
- `getVideoComments`: Get comments for video

#### integrationController.js:
- `connectYTClone`: Connect YouTube Clone
- `getYTCloneStatus`: Get connection status
- `publishToYTClone`: Publish to YouTube Clone

#### notificationController.js:
- `getNotifications`: Get user notifications
- `markAsRead`: Mark notification as read
- `markAllAsRead`: Mark all as read

---

## Database Schema

### Firestore Collections:

#### users
```javascript
{
  uid: "user_uid", // Document ID
  email: "user@example.com",
  displayName: "John Doe",
  photoURL: "https://avatar.url",
  role: "creator", // creator, editor, admin
  workspaces: ["workspace_id_1", "workspace_id_2"],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### workspaces
```javascript
{
  id: "workspace_id", // Document ID
  name: "My Video Project",
  description: "Project description",
  owner: "user_uid",
  members: ["user_uid_1", "user_uid_2"],
  publishers: ["user_uid_1"], // Subset of members
  videos: ["video_id_1", "video_id_2"],
  integrations: {
    youtubeClone: {
      baseUrl: "https://youtube-clone.com",
      token: "auth_token",
      channelId: "channel_id",
      channelName: "Channel Name",
      channelLinkSecret: "secret"
    }
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### videos
```javascript
{
  id: "video_id", // Document ID
  title: "Video Title",
  description: "Video description",
  workspaceId: "workspace_id",
  owner: "user_uid",
  status: "in_review", // in_review, approved, rejected
  currentVersion: 1,
  published: false,
  publishMeta: {
    platform: "youtube-clone",
    channelId: "channel_id",
    remoteVideo: { /* YouTube Clone response */ }
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### videos/{videoId}/versions (Subcollection)
```javascript
{
  id: "version_id", // Document ID
  versionNumber: 1,
  title: "Version Title",
  description: "Version description",
  videoUrl: "https://storage.url/video.mp4",
  thumbnailUrl: "https://storage.url/thumb.jpg",
  fileSize: 1024000,
  uploadedBy: "user_uid",
  qualities: [
    { quality: "source", url: "https://storage.url/video.mp4" }
  ],
  createdAt: Timestamp
}
```

#### comments
```javascript
{
  id: "comment_id", // Document ID
  content: "This needs to be fixed",
  timestamp: 125.5, // Video time in seconds
  videoId: "video_id",
  workspaceId: "workspace_id",
  author: {
    uid: "user_uid",
    displayName: "John Doe",
    photoURL: "https://avatar.url"
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### notifications
```javascript
{
  id: "notification_id", // Document ID
  userId: "user_uid",
  type: "member_added", // member_added, video_uploaded, comment_added, video_published
  data: {
    workspaceId: "workspace_id",
    workspaceName: "Workspace Name",
    // Type-specific data
  },
  read: false,
  createdAt: Timestamp
}
```

---

## File Structure

```
Video Collaborator/
├── client/                          # React Frontend
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── Login.js
│   │   │   │   ├── SignUp.js
│   │   │   │   └── PrivateRoute.js
│   │   │   ├── integrations/
│   │   │   │   └── YouTubeCloneConnect.js
│   │   │   ├── layout/
│   │   │   │   └── Navigation.js
│   │   │   ├── notifications/
│   │   │   │   └── NotificationCenter.js
│   │   │   ├── videos/
│   │   │   │   ├── CommentList.js
│   │   │   │   ├── VideoCommentsProxy.js
│   │   │   │   ├── VideoPlayer.js
│   │   │   │   ├── VideoUpload.js
│   │   │   │   └── VersionUpload.js
│   │   │   └── workspaces/
│   │   │       ├── AddMemberForm.js
│   │   │       ├── MemberList.js
│   │   │       ├── MembersDropdown.js
│   │   │       └── WorkspaceForm.js
│   │   ├── contexts/
│   │   │   ├── AuthContext.js
│   │   │   └── NotificationContext.js
│   │   ├── pages/
│   │   │   ├── Dashboard.js
│   │   │   ├── Home.js
│   │   │   ├── Profile.js
│   │   │   └── WorkspaceDetail.js
│   │   ├── config/
│   │   │   └── firebase.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   └── dateUtils.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── theme.css
│   │   └── index.js
│   ├── package.json
│   └── .env
├── server/                          # Express Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── firebase.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── commentController.js
│   │   │   ├── integrationController.js
│   │   │   ├── notificationController.js
│   │   │   ├── userController.js
│   │   │   ├── videoController.js
│   │   │   └── workspaceController.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── commentRoutes.js
│   │   │   ├── integrationRoutes.js
│   │   │   ├── notificationRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── videoRoutes.js
│   │   │   └── workspaceRoutes.js
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   └── index.js
│   ├── uploads/                     # Local file storage (if used)
│   │   ├── videos/
│   │   └── thumbnails/
│   ├── package.json
│   └── .env
├── README.md
├── DEPLOYMENT.md
└── package.json
```

---

## API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /logout` - Logout user
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile

### Workspace Routes (`/api/workspaces`)
- `POST /` - Create workspace
- `GET /` - Get user workspaces
- `GET /:id` - Get workspace by ID
- `PUT /:id` - Update workspace
- `DELETE /:id` - Delete workspace
- `POST /:id/members` - Add member
- `DELETE /:id/members/:userId` - Remove member
- `GET /:id/members` - List members
- `POST /:id/publishers/:userId` - Grant publisher
- `DELETE /:id/publishers/:userId` - Revoke publisher

### Video Routes (`/api/videos`)
- `POST /upload` - Upload new video
- `GET /workspace/:workspaceId` - Get workspace videos
- `GET /:videoId` - Get video by ID
- `POST /:videoId/versions` - Upload new version
- `PUT /:videoId/publish` - Publish video
- `DELETE /:videoId` - Delete video

### Comment Routes (`/api/comments`)
- `POST /:videoId` - Add comment
- `GET /:videoId` - Get video comments

### Integration Routes (`/api/integrations`)
- `POST /youtube-clone/connect` - Connect YouTube Clone
- `GET /youtube-clone/status` - Get connection status
- `POST /youtube-clone/publish/:videoId` - Publish to YouTube Clone

### Notification Routes (`/api/notifications`)
- `GET /` - Get user notifications
- `PUT /:id/read` - Mark as read
- `PUT /read-all` - Mark all as read

---

## Conclusion

This Video Collaborator application provides a comprehensive platform for video collaboration with the following key workflows:

1. **User Registration & Authentication** → Firebase Auth integration
2. **Workspace Creation** → Collaborative environment setup
3. **Member Management** → Role-based access control
4. **Video Upload & Versioning** → Multi-version video management
5. **Timestamped Comments** → Precise feedback system
6. **YouTube Clone Integration** → External platform publishing
7. **Real-time Notifications** → User engagement and updates

The system is built with modern web technologies, follows RESTful API principles, and provides a scalable architecture for video collaboration workflows.

### Key Technical Features:
- **Real-time Updates**: Firestore listeners for live data
- **File Management**: Firebase Storage or local storage options
- **Security**: JWT-based authentication with role permissions
- **Scalability**: Modular component architecture
- **Integration**: External API connectivity for publishing
- **User Experience**: Responsive design with modern UI/UX

This documentation covers the complete codebase structure, implementation details, and workflow processes for the Video Collaborator application.