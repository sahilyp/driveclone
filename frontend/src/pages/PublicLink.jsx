import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const API = import.meta.env.VITE_API_BASE;

export default function PublicLink(){
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(null);

  async function resolve(){
    const resp = await fetch(`${API}/public/resolve`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token, password }) });
    const js = await resp.json();
    setResult(js);
  }
  useEffect(()=>{ resolve(); },[]);

  if (!result) return <div className="p-6">Loading...</div>;
  if (result.error?.code === 'UNAUTHORIZED') {
    return (
      <div className="p-6 space-y-2">
        <div>This link is password protected.</div>
        <input className="border p-2 rounded" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="border px-3 py-1 rounded" onClick={resolve}>Unlock</button>
      </div>
    );
  }
  if (result.type === 'file') {
    return (
      <div className="p-6 space-y-2">
        <div className="font-bold">{result.name}</div>
        <a className="underline text-blue-600" href={result.url}>Download</a>
      </div>
    );
  }
  if (result.type === 'folder') {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4">Public Folder</h1>
        <ul className="list-disc pl-5">
          {(result.files||[]).map(f=>(<li key={f.id}>{f.name}</li>))}
        </ul>
      </div>
    );
  }
  return <div className="p-6">Invalid link.</div>
}
