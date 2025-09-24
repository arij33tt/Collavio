import React, { useState } from 'react';
import MemberList from './MemberList';

const MembersDropdown = ({ workspaceId, canManage = false }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="members-dropdown" style={{ position: 'relative' }}>
      <button
        type="button"
        className="members-toggle btn-sm"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {open ? '▼' : '►'} Members
      </button>
      {open && (
        <div
          className="members-panel popover"
          role="dialog"
          aria-label="Workspace Members"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            left: 'auto',
            transform: 'none',
            maxHeight: 'calc(100vh - 24px)',
            overflow: 'auto',
            zIndex: 1000,
          }}
        >
          <MemberList workspaceId={workspaceId} canManage={canManage} />
        </div>
      )}
    </div>
  );
};

export default MembersDropdown;