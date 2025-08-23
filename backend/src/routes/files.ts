import { Router } from "express";
import multer from "multer";
import { supabase } from "../supabaseClient.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// --- UPLOAD FILE ---
router.post("/upload", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const user = (req as any).user;
    const file = req.file;
    const folderId = req.body.folderId || null; // optional folder support

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = folderId
      ? `${user.sub}/${folderId}/${Date.now()}_${file.originalname}`
      : `${user.sub}/${Date.now()}_${file.originalname}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Storage upload error:", uploadError);
      return res.status(500).json({ error: uploadError.message });
    }

    // Save metadata in DB
    const { data: dbFile, error: dbError } = await supabase
      .from("files")
      .insert([
        {
          owner_id: user.sub,
          folder_id: folderId, // <-- NEW: link file to folder
          filename: file.originalname,
          size: file.size,
          mime_type: file.mimetype,
          storage_key: filePath,
          file_url: `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/${filePath}`,
        },
      ])
      .select("id, filename, size, mime_type, storage_key, folder_id, created_at")
      .single();

    if (dbError) {
      console.error("❌ DB insert error:", dbError);
      return res.status(500).json({ error: dbError.message });
    }

    res.json({ file: dbFile });
  } catch (err: any) {
    console.error("❌ Unexpected error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// --- LIST FILES ---
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const folderId = req.query.folderId as string | undefined;

    let query = supabase
      .from("files")
      .select("id, filename, storage_key, size, mime_type, created_at, folder_id")
      .eq("owner_id", user.sub)
      .order("created_at", { ascending: false });

    if (folderId) {
      query = query.eq("folder_id", folderId);
    }

    const { data: files, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    const withUrls = await Promise.all(
      files.map(async (f) => {
        const { data: signed } = await supabase.storage
          .from(process.env.SUPABASE_BUCKET!)
          .createSignedUrl(f.storage_key, 60 * 60); // 1 hour
        return { ...f, file_url: signed?.signedUrl || null };
      })
    );

    res.json(withUrls);
  } catch (err: any) {
    console.error("❌ Unexpected error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// --- GET SINGLE FILE SIGNED URL ---
router.get("/:id/signed-url", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const { data: file, error } = await supabase
      .from("files")
      .select("id, filename, storage_key, mime_type, owner_id")
      .eq("id", id)
      .single();

    if (error || !file) return res.status(404).json({ error: "File not found" });
    if (file.owner_id !== user.sub) return res.status(403).json({ error: "Access denied" });

    const { data: signed, error: signedError } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .createSignedUrl(file.storage_key, 60 * 60);

    if (signedError) return res.status(500).json({ error: signedError.message });

    res.json({ url: signed.signedUrl, mime_type: file.mime_type });
  } catch (err: any) {
    console.error("❌ Unexpected error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// --- DELETE FILE ---
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const { data: file, error: getErr } = await supabase
      .from("files")
      .select("*")
      .eq("id", id)
      .single();

    if (getErr || !file) return res.status(404).json({ error: "File not found" });
    if (file.owner_id !== user.sub) return res.status(403).json({ error: "Access denied" });

    const { error: storageErr } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .remove([file.storage_key]);

    if (storageErr) return res.status(500).json({ error: storageErr.message });

    const { error: dbErr } = await supabase.from("files").delete().eq("id", id);
    if (dbErr) return res.status(500).json({ error: dbErr.message });

    res.json({ ok: true });
  } catch (err: any) {
    console.error("❌ Delete file error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

export default router;
