import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";
import FileItem from "../components/FileItem";

const API = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function Drive() {
  const [session, setSession] = useState(null);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [stars, setStars] = useState([]); // ⭐ starred items
  const [searchTerm, setSearchTerm] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(null);

  const nav = useNavigate();

  // 🔹 Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) nav("/login");
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) nav("/login");
    });

    return () => sub.subscription.unsubscribe();
  }, [nav]);

  // 🔹 Fetch folders
  const fetchFolders = async () => {
    if (!session) return;
    try {
      const resp = await fetch(`${API}/folders`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setFolders(data || []);
    } catch (err) {
      console.error("❌ Failed to fetch folders:", err);
      setFolders([]);
    }
  };

  // 🔹 Fetch files (optionally by folder)
  const fetchFiles = async (folderId = null) => {
    if (!session) return;
    setLoading(true);
    try {
      const url = folderId ? `${API}/files?folderId=${folderId}` : `${API}/files`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setFiles(
        (data || []).map((f) => ({
          ...f,
          preview_url: f.signed_url || f.file_url,
        }))
      );
    } catch (err) {
      console.error("❌ Failed to fetch files:", err);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch starred items
  const fetchStars = async () => {
    if (!session) return;
    try {
      const resp = await fetch(`${API}/stars`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setStars(data.stars || []);
    } catch (err) {
      console.error("❌ Failed to fetch stars:", err);
      setStars([]);
    }
  };

  // 🔹 Initial fetch
  useEffect(() => {
    if (session) {
      fetchFolders();
      fetchFiles();
      fetchStars();
    }
  }, [session]);

  // 🔹 Reorder starred items
  const reorder = (items, type = "file") => {
    return [...items].sort((a, b) => {
      const aStar = stars.some((s) => s.resource_id === a.id && s.resource_type === type);
      const bStar = stars.some((s) => s.resource_id === b.id && s.resource_type === type);
      return bStar - aStar; // starred first
    });
  };

  // 🔹 Filter files/folders by search
  const filteredFiles = reorder(
    files.filter((f) => f.filename?.toLowerCase().includes(searchTerm.toLowerCase())),
    "file"
  );
  const filteredFolders = reorder(
    folders.filter((f) => f.name?.toLowerCase().includes(searchTerm.toLowerCase())),
    "folder"
  );

  // 🔹 Create new folder
  const onNewFolder = async () => {
    if (!session) return;
    const name = prompt("Enter folder name:");
    if (!name) return;

    try {
      const resp = await fetch(`${API}/folders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      await resp.json();
      setMessage("✅ Folder created");
      await fetchFolders();
    } catch (err) {
      console.error("❌ Folder creation failed:", err);
      alert("Failed to create folder");
    }
  };

  // 🔹 Upload file
  const onUpload = async () => {
    if (!session) return;
    const inp = document.createElement("input");
    inp.type = "file";
    inp.onchange = async () => {
      const f = inp.files?.[0];
      if (!f) return;
      setUploading(true);
      setMessage("");
      try {
        setFiles((prev) => [
          { id: "temp-" + Date.now(), filename: f.name, preview_url: URL.createObjectURL(f) },
          ...prev,
        ]);

        const formData = new FormData();
        formData.append("file", f);
        if (currentFolder) formData.append("folderId", currentFolder);

        const resp = await fetch(`${API}/files/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        setMessage("✅ File uploaded");
        await fetchFiles(currentFolder);
      } catch (err) {
        console.error("❌ Upload failed:", err);
        setMessage("❌ Upload failed: " + err.message);
      } finally {
        setUploading(false);
      }
    };
    inp.click();
  };

  // 🔹 Open file
  const onOpen = async (file) => {
    try {
      let url = file.preview_url;
      let mimeType = file.mime_type;

      if (!url) {
        const resp = await fetch(`${API}/files/${file.id}/signed-url`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        url = data.url;
        mimeType = data.mime_type;
      }

      if (!url) return alert("Cannot open file");

      if (mimeType.startsWith("image/") || mimeType === "application/pdf") {
        window.open(url, "_blank");
      } else if (mimeType.startsWith("audio/")) {
        new Audio(url).play();
      } else if (mimeType.startsWith("video/")) {
        const videoWindow = window.open("", "_blank");
        videoWindow.document.write(`
          <video controls autoplay style="width:100%;height:100%">
            <source src="${url}" type="${mimeType}" />
          </video>
        `);
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = file.filename;
        link.click();
      }
    } catch (err) {
      console.error("❌ Open failed:", err);
      alert("Failed to open file");
    }
  };

  // 🔹 Delete file
  const onDelete = async (file) => {
    if (!confirm(`Delete "${file.filename}"?`)) return;
    try {
      const resp = await fetch(`${API}/files/${file.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (err) {
      console.error("❌ Delete failed:", err);
      alert("Failed to delete file");
    }
  };

  // 🔹 Star / Unstar file or folder
  const toggleStar = async (resource) => {
    if (!session) return;
    const isFile = !!resource.filename;
    const existing = stars.find(
      (s) => s.resource_id === resource.id && s.resource_type === (isFile ? "file" : "folder")
    );

    try {
      if (existing) {
        await fetch(`${API}/stars`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            resourceType: isFile ? "file" : "folder",
            resourceId: resource.id,
          }),
        });
      } else {
        await fetch(`${API}/stars`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            resourceType: isFile ? "file" : "folder",
            resourceId: resource.id,
          }),
        });
      }
      await fetchStars(); // refresh stars from server
    } catch (err) {
      console.error("❌ Star toggle failed:", err);
    }
  };

  // 🔹 Share file or folder
  const onShare = async (resource) => {
    const grantee = prompt("Enter the user ID to share with (UUID):");
    if (!grantee) return;
    try {
      await fetch(`${API}/shares`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          resourceType: resource.filename ? "file" : "folder",
          resourceId: resource.id,
          granteeUserId: grantee,
          role: "viewer",
        }),
      });
      alert("✅ Resource shared successfully");
    } catch (err) {
      console.error("❌ Share failed:", err);
      alert("Failed to share resource");
    }
  };

  // 🔹 Enter folder
  const onFolderClick = (folder) => {
    setCurrentFolder(folder.id);
    fetchFiles(folder.id);
  };

  // 🔹 Back to all files
  const onBack = () => {
    setCurrentFolder(null);
    fetchFiles();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 p-4">
      <Topbar
        onNewFolder={onNewFolder}
        onUpload={onUpload}
        onSearch={setSearchTerm}
        query={searchTerm}
      />

      {uploading && <p className="text-blue-500 my-2">Uploading...</p>}
      {message && <p className="my-2">{message}</p>}
      {loading && <p className="text-gray-500 my-2">Loading...</p>}

      {/* Folders */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold">📂 Folders</h2>
        {currentFolder && (
          <button
            className="mb-2 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            onClick={onBack}
          >
            ← Back to All Files
          </button>
        )}
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFolders.length > 0 ? (
            filteredFolders.map((f) => (
              <div
                key={f.id}
                className="p-3 border rounded hover:shadow cursor-pointer flex flex-col justify-between"
              >
                <div onClick={() => onFolderClick(f)} className="cursor-pointer">
                  <div className="text-3xl">📁</div>
                  <div className="mt-2 font-medium truncate">{f.name}</div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    className={`p-1 rounded-md transition ${
                      stars.some((s) => s.resource_id === f.id && s.resource_type === "folder")
                        ? "text-yellow-500 bg-yellow-50"
                        : "text-gray-400 hover:text-yellow-700 hover:bg-yellow-50"
                    }`}
                    onClick={() => toggleStar(f)}
                    title="Star"
                  >
                    ★
                  </button>
                  <button
                    className="text-green-500 hover:text-green-700 p-1 rounded-md transition hover:bg-green-50"
                    onClick={() => onShare(f)}
                    title="Share"
                  >
                    Share
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500">No folders found</div>
          )}
        </div>
      </section>

      {/* Files */}
      <section>
        <h2 className="text-lg font-semibold">
          📄 Files {currentFolder && `in "${folders.find((f) => f.id === currentFolder)?.name}"`}
        </h2>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((f) => (
              <FileItem
                key={f.id}
                file={{
                  ...f,
                  starred: stars.some((s) => s.resource_id === f.id && s.resource_type === "file"),
                }}
                onOpen={() => onOpen(f)}
                onDelete={() => onDelete(f)}
                onStar={() => toggleStar(f)}
                onShare={() => onShare(f)}
              />
            ))
          ) : (
            <div className="text-gray-500">No files found</div>
          )}
        </div>
      </section>
    </div>
  );
}
