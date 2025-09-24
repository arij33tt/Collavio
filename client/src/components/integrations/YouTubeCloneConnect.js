import React, { useState } from 'react';
import { ytCloneAuth, ytCloneGoogleProvider } from '../../config/youtubeCloneFirebase';
import { auth as vcAuth } from '../../config/firebase';
import { signInWithPopup, signInWithEmailAndPassword, signOut } from 'firebase/auth';

// Collavio API base (this app's server)
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
// YouTube Clone base (target platform server)
const YTCLONE_BASE = process.env.REACT_APP_YTCLONE_BASE || 'http://localhost:6323';

// headerToken is Collavio user token; body carries ytCloneToken
async function postJSON(url, body, headerToken) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(headerToken ? { Authorization: `Bearer ${headerToken}` } : {})
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Request failed');
  return res.json();
}

export default function YouTubeCloneConnect({ workspaceId, onConnected }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('My Channel');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [ytCloneToken, setYtCloneToken] = useState('');
  // ye hai Alternative linking without YT-Clone login
  const [channelId, setChannelId] = useState('');
  const [channelSecret, setChannelSecret] = useState('');

  const loginEmail = async (e) => {
    e.preventDefault();
    setStatus('Signing in...');
    try {
      const { user } = await signInWithEmailAndPassword(ytCloneAuth, email, password);
      const t = await user.getIdToken();
      setYtCloneToken(t);
      setStatus('Signed in successfully');
    } catch (error) {
      console.error('Login error:', error);
      setStatus('Login failed: Please check your email and password');
    }
  };
  const loginGoogle = async () => {
    setStatus('Signing in with Google...');
    try {
      const { user } = await signInWithPopup(ytCloneAuth, ytCloneGoogleProvider);
      const t = await user.getIdToken();
      setYtCloneToken(t);
      setStatus('Signed in successfully');
    } catch (error) {
      console.error('Google login error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        setStatus('Google sign-in was cancelled');
      } else {
        setStatus('Google sign-in failed: Please try again');
      }
    }
  };
  const logout = async () => {
    try {
      await signOut(ytCloneAuth);
      setYtCloneToken('');
      setStatus('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      setStatus('Logout failed: Please try again');
    }
  };

  const connectChannel = async (e) => {
    e.preventDefault();

    try {
      
      const vcToken = await vcAuth.currentUser?.getIdToken();
      if (!vcToken) { 
        setStatus('Please sign in to Collavio first'); 
        return; 
      }

      setStatus('Connecting channel...');

      const payload = channelId && channelSecret ? {
        workspaceId,
        baseUrl: YTCLONE_BASE,
        channelId,
        channelLinkSecret: channelSecret,
      } : {
        workspaceId,
        baseUrl: YTCLONE_BASE,
        token: ytCloneToken,
        channelName: name,
        channelDescription: description
      };

      if (!payload.token && !(payload.channelId && payload.channelLinkSecret)) {
        setStatus('Provide YT-Clone login or Channel ID + Secret');
        return;
      }

      await postJSON(`${API_BASE}/integrations/youtube-clone/connect`, payload, vcToken);
      setStatus('Channel connected successfully');
      onConnected?.({ name, description });
    } catch (error) {
      console.error('Channel connection error:', error);
      if (error.message.includes('Invalid credentials') || error.message.includes('auth')) {
        setStatus('Connection failed: Invalid credentials. Please check your login details');
      } else if (error.message.includes('Network') || error.message.includes('fetch')) {
        setStatus('Connection failed: Network error. Please check your internet connection');
      } else if (error.message.includes('Channel')) {
        setStatus('Connection failed: Channel setup error. Please try again');
      } else {
        setStatus(`Connection failed: ${error.message || 'Unknown error occurred'}`);
      }
    }
  };

  return (
    <div className="yt-clone-connect">
      
      {!ytCloneToken ? (
        <div>
          <form onSubmit={loginEmail}>
            <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
            <input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
            <button>Sign in</button>
          </form>
          <button onClick={loginGoogle}>Sign in with Google</button>
        </div>
      ) : (
        <div>
          <button onClick={logout}>Sign out</button>
          <form onSubmit={connectChannel}>
            <input placeholder="Channel name" value={name} onChange={e=>setName(e.target.value)} />
            <input placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
            <button>Connect Channel</button>
          </form>
        </div>
      )}

      <div style={{ marginTop: 12, display: "none" }}>
        <strong>Or link by Channel ID + Secret (no YT-Clone login):</strong>
        <div>
          <input placeholder="Channel ID" value={channelId} onChange={e=>setChannelId(e.target.value)} />
        </div>
        <div>
          <input placeholder="Channel Secret" value={channelSecret} onChange={e=>setChannelSecret(e.target.value)} />
        </div>
        <button onClick={connectChannel}>Link With ID + Secret</button>
      </div>

      <div className={`status ${
        status.includes('successfully') || status.includes('connected') || status.includes('Signed in') ? 'status-success' :
        status.includes('failed') || status.includes('error') || status.includes('Invalid') ? 'status-error' :
        status.includes('Signing in') || status.includes('Connecting') ? 'status-loading' :
        'status-default'
      }`}>{status}</div>
    </div>
  );
}