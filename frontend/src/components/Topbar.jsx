import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Topbar({ onNewFolder, onUpload, onSearch, query }) {
  const nav = useNavigate();

  return (
    <div className="flex items-center justify-between gap-2 p-3 border-b bg-gray-100">
      <div className="flex gap-2">
        <button className="border px-3 py-1 rounded bg-white" onClick={onNewFolder}>
          New Folder
        </button>
        <button className="border px-3 py-1 rounded bg-white" onClick={onUpload}>
          Upload
        </button>
      </div>

      <input
        className="border px-3 py-1 rounded w-full max-w-md"
        placeholder="Search files..."
        value={query}
        onChange={(e) => onSearch(e.target.value)}
      />

      <button
        className="border px-3 py-1 rounded bg-white"
        onClick={async () => {
          await supabase.auth.signOut();
          nav("/login");
        }}
      >
        Sign out
      </button>
    </div>
  );
}
