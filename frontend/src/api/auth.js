// src/api/auth.js
export async function loginUser(email, password) {
  const res = await fetch(
    "https://qaibnaklvrsyxxdowegr.supabase.co/auth/v1/token?grant_type=password",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, // from .env
      },
      body: JSON.stringify({ email, password }),
    }
  );

  if (!res.ok) {
    throw new Error("Login failed");
  }

  const data = await res.json();

  // Save tokens in localStorage
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  localStorage.setItem("user", JSON.stringify(data.user));

  return data;
}
