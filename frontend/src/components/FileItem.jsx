import React from "react";

export default function FileItem({ file, onOpen, onDelete, onStar, onShare }) {
  const isImage = file.mime_type?.startsWith("image/");
  const isVideo = file.mime_type?.startsWith("video/");
  const isAudio = file.mime_type?.startsWith("audio/");
  const isPdf = file.mime_type === "application/pdf";

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition p-3 flex flex-col justify-between group">
      <div className="flex-1 flex justify-center items-center mb-3 overflow-hidden">
        {isImage && (
          <img
            src={file.preview_url}
            alt={file.filename}
            className="max-h-40 rounded-xl object-contain cursor-pointer transition transform group-hover:scale-105"
            onClick={() => onOpen(file)}
          />
        )}
        {isVideo && (
          <video
            controls
            className="max-h-40 rounded-xl w-full object-cover cursor-pointer"
            src={file.preview_url}
          />
        )}
        {isAudio && (
          <audio controls className="w-full">
            <source src={file.preview_url} type={file.mime_type} />
            Your browser does not support audio playback.
          </audio>
        )}
        {isPdf && (
          <iframe
            src={file.preview_url}
            title={file.filename}
            className="w-full h-40 border rounded-xl"
          />
        )}
        {!isImage && !isVideo && !isAudio && !isPdf && (
          <div className="text-gray-400 text-sm text-center break-words">
            {file.filename}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-2">
        <span className="font-semibold text-gray-800 text-sm truncate">
          {file.filename}
        </span>
        <div className="flex gap-2">
          <button
            className="text-blue-500 hover:text-blue-700 text-sm p-1 rounded-md transition hover:bg-blue-50"
            onClick={() => onOpen(file)}
            title="Open"
          >
            Open
          </button>
          <button
            className={`text-sm p-1 rounded-md transition ${
              file.starred
                ? "text-yellow-500 bg-yellow-50"
                : "text-gray-400 hover:text-yellow-700 hover:bg-yellow-50"
            }`}
            onClick={() => onStar(file)}
            title="Star"
          >
            ★
          </button>
          <button
            className="text-red-500 hover:text-red-700 p-1 rounded-md transition hover:bg-red-50"
            onClick={() => onDelete(file)}
            title="Delete"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 011-1h6a1 1 0 011 1v1h5a1 1 0 110 2h-1v12a2 2 0 01-2 2H5a2 2 0 01-2-2V5H2a1 1 0 110-2h5V2zm2 3v9h1V5H8zm3 0v9h1V5h-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            className="text-green-500 hover:text-green-700 text-sm p-1 rounded-md transition hover:bg-green-50"
            onClick={() => onShare(file)}
            title="Share"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
