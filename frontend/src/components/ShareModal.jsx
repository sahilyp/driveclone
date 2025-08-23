import { useState } from 'react';

export default function ShareModal({ open, onClose, onCreateShare, onCreateLink }){
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('viewer');
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-4 rounded w-[420px] space-y-3">
        <h2 className="font-bold text-lg">Share</h2>
        <div className="space-y-2">
          <div className="text-sm font-semibold">Invite user</div>
          <input className="border p-2 rounded w-full" placeholder="Grantee User ID (auth.users.id)" value={userId} onChange={e=>setUserId(e.target.value)} />
          <select className="border p-2 rounded w-full" value={role} onChange={e=>setRole(e.target.value)}>
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
          <button className="border px-3 py-1 rounded" onClick={()=>onCreateShare(userId, role)}>Share</button>
        </div>
        <hr />
        <div className="space-y-2">
          <div className="text-sm font-semibold">Public link</div>
          <input className="border p-2 rounded w-full" placeholder="Password (optional)" value={password} onChange={e=>setPassword(e.target.value)} />
          <input className="border p-2 rounded w-full" placeholder="Expiry ISO (optional)" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)} />
          <button className="border px-3 py-1 rounded" onClick={()=>onCreateLink(password || null, expiresAt || null)}>Create link</button>
        </div>
        <div className="flex justify-end"><button className="px-3 py-1" onClick={onClose}>Close</button></div>
      </div>
    </div>
  )
}
