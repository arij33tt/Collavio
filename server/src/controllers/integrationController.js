const axios = require('axios');
const FormData = require('form-data');
const { initializeFirebaseAdmin, admin } = require('../config/firebase');

// Ensure Firebase Admin
const firebase = initializeFirebaseAdmin();
const db = firebase.firestore();

// Save or update workspace's YouTube Clone integration settings
// Option A: connect with user token (existing flow)
// Option B: connect with channelId + channelLinkSecret (new flow)
// Body (A): { workspaceId, baseUrl, token, channelName?, channelDescription? }
// Body (B): { workspaceId, baseUrl, channelId, channelLinkSecret }
exports.connectYTClone = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { workspaceId, baseUrl, token, channelName, channelDescription = '', channelId, channelLinkSecret } = req.body || {};

    if (!workspaceId) return res.status(400).json({ message: 'workspaceId is required' });

    if (!baseUrl) return res.status(400).json({ message: 'baseUrl is required' });

    const base = baseUrl.replace(/\/$/, '');
    let channel = null;

    if (channelId && channelLinkSecret) {
      // Validate secret by calling a safe endpoint (e.g., get channel by id; secret not returned). We'll attempt a minimal action.
      // Try a no-op that requires secret: call upload-by-secret with a tiny placeholder? Instead, verify by attempting a HEAD using a validation endpoint.
      // Implement a light-weight validation endpoint in YT Clone later if needed. For now, we accept and save.
      channel = { id: channelId, name: null };
    } else if (token) {
      // Token-based flow: fetch user's channels; if none, create one
      try {
        const my = await axios.get(`${base}/api/channels/my-channels`, { headers: { Authorization: `Bearer ${token}` } });
        const list = Array.isArray(my.data) ? my.data : [];
        if (list.length > 0) {
          channel = list[0];
        } else if (channelName) {
          const handle = channelName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 20) || `channel-${Date.now()}`;
          const conn = await axios.post(`${base}/api/channels`, { name: channelName, description: channelDescription, handle }, { headers: { Authorization: `Bearer ${token}` } });
          channel = conn.data?.channel || conn.data;
        } else {
          return res.status(400).json({ message: 'No channel found on YouTube Clone. Provide channelName to create one or use channelId+channelLinkSecret.' });
        }
      } catch (e) {
        const msg = e?.response?.data?.error || e?.response?.data?.message || e.message;
        return res.status(400).json({ message: `Failed to connect: ${msg}` });
      }
    } else {
      return res.status(400).json({ message: 'Provide either token or channelId+channelLinkSecret' });
    }

    // Verify user owns the workspace
    const workspaceRef = db.collection('workspaces').doc(workspaceId);
    const workspaceDoc = await workspaceRef.get();
    if (!workspaceDoc.exists) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    const workspaceData = workspaceDoc.data();
    if (workspaceData.owner !== userId) {
      return res.status(403).json({ message: 'Only workspace owner can connect YouTube Clone' });
    }

    // Ensure we have a secret for direct publishing
    let secret = channel?.channelLinkSecret || channelLinkSecret || null;
    try {
      if (!secret && token && (channel?.id || channelId)) {
        const chanId = channel?.id || channelId;
        const regen = await axios.post(`${base}/api/channels/${chanId}/regenerate-secret`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        secret = regen.data?.channelLinkSecret || regen.data?.secret || null;
      }
    } catch (e) {
      // If we can't fetch a secret, token-based publish will still work; continue
    }

    // Store in workspace (not user profile)
    await workspaceRef.set({
      integrations: {
        youtubeClone: {
          baseUrl: base,
          token: token || null,
          channelId: channel?.id || channelId || null,
          channelName: channel?.name || channelName || null,
          channelLinkSecret: secret,
          connectedAt: new Date().toISOString(),
          connectedBy: userId,
        }
      }
    }, { merge: true });

    return res.status(200).json({ ok: true, channel: { id: channel?.id || channelId, name: channel?.name || channelName || null } });
  } catch (error) {
    console.error('YTClone connect failed:', error?.response?.data || error.message);
    return res.status(500).json({ message: 'Failed to connect YouTube Clone', error: error.message });
  }
};

// Get YouTube Clone connection status for a workspace
exports.getYTCloneStatus = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { workspaceId } = req.query;
    
    if (!workspaceId) {
      return res.status(400).json({ message: 'workspaceId is required' });
    }
    
    // Get workspace and verify user has access
    const workspaceRef = db.collection('workspaces').doc(workspaceId);
    const workspaceDoc = await workspaceRef.get();
    
    if (!workspaceDoc.exists) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    const workspaceData = workspaceDoc.data();
    const isOwner = workspaceData.owner === userId;
    const isMember = workspaceData.members && workspaceData.members.includes(userId);
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Access denied to workspace' });
    }
    
    const integration = workspaceData?.integrations?.youtubeClone;
    
    if (!integration || (!integration.token && !integration.channelLinkSecret)) {
      return res.status(200).json({ connected: false, isOwner });
    }
    
    // Check if we have valid connection data
    const connected = !!(integration.baseUrl && (integration.token || (integration.channelId && integration.channelLinkSecret)));
    
    return res.status(200).json({
      connected,
      channelName: integration.channelName || null,
      channelId: integration.channelId || null,
      connectedAt: integration.connectedAt || null,
      connectedBy: integration.connectedBy || null,
      isOwner
    });
  } catch (error) {
    console.error('Failed to get YTClone status:', error.message);
    return res.status(500).json({ message: 'Failed to get connection status', error: error.message });
  }
};

// Publish a video to YouTube Clone
// Params: videoId
// Uses user's saved integration
exports.publishToYTClone = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { videoId } = req.params;
    const { title: publishTitle, description: publishDescription, thumbnailUrl } = req.body || {};

    // Verify user owns the workspace (reuse logic similar to publishVideo)
    const videoRef = db.collection('videos').doc(videoId);
    const videoDoc = await videoRef.get();
    if (!videoDoc.exists) return res.status(404).json({ message: 'Video not found' });
    const video = videoDoc.data();

    const wsRef2 = db.collection('workspaces').doc(video.workspaceId);
    const wsDoc2 = await wsRef2.get();
    if (!wsDoc2.exists) return res.status(404).json({ message: 'Workspace not found' });
    const ws = wsDoc2.data();

    const isOwner = ws.owner === userId;
    const isPublisher = Array.isArray(ws.publishers) && ws.publishers.includes(userId);
    if (!isOwner && !isPublisher) return res.status(403).json({ message: 'Only owner or publisher can publish' });

    // Get workspace integration settings
    const integration = ws?.integrations?.youtubeClone;
    if (!integration) {
      return res.status(400).json({ message: 'YouTube Clone not connected for this workspace' });
    }

    const baseUrl = integration.baseUrl;
    const token = integration.token;
    const channelId = integration.channelId;
    const secret = integration.channelLinkSecret;

    if (!baseUrl || (!token && !secret)) {
      return res.status(400).json({ message: 'YouTube Clone not connected for user or workspace' });
    }

    // Get latest version URL
    const versionsSnap = await videoRef.collection('versions').orderBy('versionNumber', 'desc').limit(1).get();
    let latest = null;
    versionsSnap.forEach((d) => (latest = { id: d.id, ...d.data() }));
    if (!latest?.videoUrl) return res.status(400).json({ message: 'Latest version has no videoUrl' });

    // Stream the video to YouTube Clone upload endpoint
    const videoResponse = await axios.get(latest.videoUrl, { responseType: 'stream' });
    const form = new FormData();
    form.append('video', videoResponse.data, { filename: `${videoId}.mp4`, contentType: 'video/mp4' });
    form.append('title', publishTitle || video.title || `Video ${videoId}`);
    form.append('description', publishDescription || video.description || '');

    // Decide upload path: secret-based when available, else token-based
    let uploadUrl = '';
    let headers = { ...form.getHeaders() };
    if (secret && (channelId)) {
      form.append('channelId', channelId);
      form.append('secret', secret);
      uploadUrl = `${baseUrl}/api/videos/upload-by-secret`;
    } else {
      uploadUrl = `${baseUrl}/api/videos/upload`;
      headers = { Authorization: `Bearer ${token}`, ...headers };
    }

    const resp = await axios.post(uploadUrl, form, {
      headers,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Mark published and store remote info
    const now = admin.firestore.FieldValue.serverTimestamp();
    await videoRef.update({
      published: true,
      status: 'approved',
      updatedAt: now,
      publishMeta: {
        platform: 'youtube-clone',
        channelId: channelId || null,
        remoteVideo: resp.data || null,
      }
    });

    const updated = await videoRef.get();
    return res.status(200).json({ id: updated.id, ...updated.data(), publishedTo: 'youtube-clone' });
  } catch (error) {
    console.error('YTClone publish failed:', error?.response?.data || error.message);
    return res.status(500).json({ message: 'Failed to publish to YouTube Clone', error: error.message });
  }
};