import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AddMemberForm = ({ workspaceId, onAdded }) => {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email.trim()) {
      setError('Editor email is required');
      return;
    }
    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      const res = await fetch(`${process.env.REACT_APP_API_URL}/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add editor');
      }
      setSuccess('Editor added successfully');
      setEmail('');
      if (onAdded) onAdded();
    } catch (err) {
      setError(err.message || 'Failed to add editor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-member-form compact">
      <form onSubmit={submit} className="add-member-inline-form">
        <div className="form-group-inline">
          <input
            id="member-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Invite editor by email"
            required
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-sm btn-icon">
          {loading ? 'Adding…' : 'Add'}
        </button>
      </form>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  );
};

export default AddMemberForm;