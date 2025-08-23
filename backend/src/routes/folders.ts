import { Router } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// CREATE new folder
router.post("/", requireAuth, async (req, res) => {
  // Validate request body
  const body = z.object({
    name: z.string().min(1),
    parentId: z.string().uuid().nullable().optional(),
  }).safeParse(req.body);

  if (!body.success) {
    return res.status(400).json({ error: body.error.message });
  }

  const user = (req as any).user;
  const userId = user.sub; // from auth middleware

  try {
    // Insert folder record in DB
    const { data: folder, error: dbError } = await supabaseAdmin
      .from("folders")
      .insert({
        name: body.data.name,
        user_id: userId,
        parent_id: body.data.parentId || null,
      })
      .select("*")
      .single();

    if (dbError) throw dbError;

    // Create folder in Supabase Storage using a dummy .keep file
    const folderPath = `${userId}/${folder.id}/.keep`;
    const { error: storageError } = await supabaseAdmin.storage
      .from(process.env.SUPABASE_BUCKET!)
      .upload(folderPath, "", { upsert: true, contentType: "text/plain" });

    if (storageError) throw storageError;

    // ✅ Return folder data
    res.json({ folder });
  } catch (err: any) {
    console.error("❌ Folder creation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET all folders for user
router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const userId = user.sub;

  try {
    const { data, error } = await supabaseAdmin
      .from("folders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    console.error("❌ Fetch folders error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
