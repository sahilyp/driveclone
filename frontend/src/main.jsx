import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import Login from "./pages/Login.jsx";
import Drive from "./pages/Drive.jsx";
import PublicLink from "./pages/PublicLink.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx"; // 👈 import

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/drive"
          element={
            <ProtectedRoute>
              <Drive />
            </ProtectedRoute>
          }
        />
        <Route path="/l/:token" element={<PublicLink />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
