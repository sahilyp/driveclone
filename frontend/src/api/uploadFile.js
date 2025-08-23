import { supabase } from "../supabaseClient";

export async function uploadFile(file) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("User not logged in");

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${import.meta.env.VITE_API_BASE}/files/upload`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${session.access_token}`,
    "x-user-id": session.user.id,
  },
  body: formData,
});

  return await res.json();
}
