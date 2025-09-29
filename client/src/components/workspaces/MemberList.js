import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const PublishToggle = ({ workspaceId, member, onChanged }) => {
  const { currentUser } = useAuth();
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    try {
      setSaving(true);
      const token = await currentUser.getIdToken();
      const method = member.canPublish ? 'DELETE' : 'POST';
      const res = await fetch(`${process.env.REACT_APP_API_URL}/workspaces/${workspaceId}/publishers/${member.uid}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to update permission');
      if (onChanged) onChanged();
    } catch (e) {
      alert(e.message || 'Failed to update permission');
    } finally {
      setSaving(false);
    }
  };

  return (
    <button className="btn-sm" onClick={toggle} disabled={saving}>
      {member.canPublish ? 'Revoke Publish' : 'Grant Publish'}
    </button>
  );
};

const MemberList = ({ workspaceId, canManage = false, onChanged }) => {
  const { currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const token = await currentUser.getIdToken();
      const res = await fetch(`${process.env.REACT_APP_API_URL}/workspaces/${workspaceId}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load members');
      const data = await res.json();
      setMembers(data);
    } catch (e) {
      setError(e.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (workspaceId && currentUser) load(); /* eslint-disable-next-line */ }, [workspaceId, currentUser]);

  const removeMember = async (uid) => {
    if (!window.confirm('Remove this member from the workspace?')) return;
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${process.env.REACT_APP_API_URL}/workspaces/${workspaceId}/members/${uid}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to remove member');
      await load();
      if (onChanged) onChanged();
    } catch (e) {
      setError(e.message || 'Failed to remove member');
    }
  };

  if (loading) return <div className="members-loading">Loading members...</div>;

  return (
    <div className="member-list">
      <h3>Members</h3>
      {error && <div className="members-error">{error}</div>}
      {members.length === 0 ? (
        <div>No members yet</div>
      ) : (
        <ul>
          {members.map(m => (
            <li key={m.uid} className="member-item">
              <div className="member-info">
                {m.photoURL ? <img src={m.photoURL} alt={m.displayName || m.email} className="member-avatar" /> : <div className="member-avatar placeholder" />}
                <div className="member-text">
                  <div className="member-name">
                    {m.displayName || m.email || m.uid}
                    {m.isOwner && <span className="owner-badge">Owner</span>}
                    {!m.isOwner && m.canPublish && <span className="owner-badge" style={{ color: '#34d399' }}>Publisher</span>}
                  </div>
                  <div className="member-email">{m.email}</div>
                </div>
              </div>
              {canManage && !m.isOwner && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <PublishToggle workspaceId={workspaceId} member={m} onChanged={async () => { await load(); if (onChanged) onChanged(); }} />
                  <button className="remove-member" onClick={() => removeMember(m.uid)}>Remove</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MemberList;