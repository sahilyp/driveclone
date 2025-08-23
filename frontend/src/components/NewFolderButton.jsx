// src/components/NewFolderButton.jsx
import React, { useState } from "react";

function NewFolderButton({ onFolderCreated }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    const folderName = prompt("📂 Enter new folder name:");
    if (!folderName) return; // user canceled or empty name

    try {
      setLoading(true);

      const res = await fetch("http://localhost:4000/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // add Authorization if your API requires auth
        },
        body: JSON.stringify({ name: folderName }),
      });

      if (!res.ok) {
        throw new Error("Failed to create folder");
      }

      const newFolder = await res.json();

      // ✅ Immediately update UI
      if (onFolderCreated) {
        onFolderCreated(newFolder);
      }

      alert(`✅ Folder "${folderName}" created!`);
    } catch (err) {
      console.error("Error creating folder:", err);
      alert("❌ Could not create folder. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? "Creating..." : "➕ New Folder"}
    </button>
  );
}

export default NewFolderButton;
