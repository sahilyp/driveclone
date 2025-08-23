import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import NewFolderButton from "../components/NewFolderButton";

type Folder = {
  id: string;
  name: string;
  created_at: string;
};

type File = {
  id: string;
  filename: string;
  created_at: string;
};

export default function Dashboard() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // 🔹 Fetch all folders + files
  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data: folderData, error: folderError } = await supabase
        .from("folders")
        .select("*")
        .order("created_at", { ascending: false });

      if (folderError) throw folderError;

      const { data: fileData, error: fileError } = await supabase
        .from("files")
        .select("*")
        .order("created_at", { ascending: false });

      if (fileError) throw fileError;

      setFolders(folderData || []);
      setFiles(fileData || []);
    } catch (err) {
      console.error("fetchAll error", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Create new folder
  const handleNewFolder = async () => {
    const name = prompt("Enter folder name:");
    if (!name) return;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("You must be logged in!");
      return;
    }

    const { data, error } = await supabase
      .from("folders")
      .insert([{ name, user_id: user.id }])
      .select()
      .single();

    if (error) {
      console.error("Error creating folder:", error.message);
      alert("Error creating folder!");
      return;
    }

    // ✅ Add new folder instantly to UI
    setFolders((prev) => [data, ...prev]);
  };

  // 🔹 Search both folders + files
  const searchBackend = async (q: string) => {
    if (!q.trim()) {
      fetchAll();
      return;
    }

    setLoading(true);
    try {
      const { data: folderData, error: folderError } = await supabase
        .from("folders")
        .select("*")
        .ilike("name", `%${q}%`)
        .order("created_at", { ascending: false });

      if (folderError) throw folderError;

      const { data: fileData, error: fileError } = await supabase
        .from("files")
        .select("*")
        .ilike("filename", `%${q}%`)
        .order("created_at", { ascending: false });

      if (fileError) throw fileError;

      setFolders(folderData || []);
      setFiles(fileData || []);
    } catch (err) {
      console.error("searchBackend error", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Initial load
  useEffect(() => {
    fetchAll();
  }, []);

  // 🔹 Debounced search
  useEffect(() => {
    const q = searchTerm.trim();
    const timer = setTimeout(() => {
      searchBackend(q);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">My Drive</h1>

      {/* 🔎 Search + New Folder */}
      <div className="flex items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="🔍 Search files or folders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-3 py-2 rounded w-full max-w-lg"
        />
        <button
          onClick={handleNewFolder}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          + New Folder
        </button>
      </div>

      {loading && <p className="text-sm text-gray-500 mb-2">Loading…</p>}

      {/* 📂 Folders */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold">📂 Folders</h2>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {folders.length > 0 ? (
            folders.map((f) => (
              <div key={f.id} className="p-3 border rounded hover:shadow">
                <div className="text-3xl">📁</div>
                <div className="mt-2 font-medium truncate">{f.name}</div>
              </div>
            ))
          ) : (
            <div className="text-gray-500">No folders found</div>
          )}
        </div>
      </section>

      {/* 📄 Files */}
      <section>
        <h2 className="text-lg font-semibold">📄 Files</h2>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.length > 0 ? (
            files.map((file) => (
              <div key={file.id} className="p-3 border rounded hover:shadow">
                <div className="text-2xl">📄</div>
                <div className="mt-2 font-medium truncate">{file.filename}</div>
              </div>
            ))
          ) : (
            <div className="text-gray-500">No files found</div>
          )}
        </div>
      </section>
    </div>
  );
}
