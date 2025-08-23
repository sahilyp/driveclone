// src/api/client.js
export async function apiRequest(url, options = {}) {
  const token = localStorage.getItem("access_token");

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const res = await fetch(`http://localhost:4000${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) throw new Error("API error");

  return res.json();
}
