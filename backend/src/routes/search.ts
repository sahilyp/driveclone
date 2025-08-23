import { Router } from "express";
import { supabaseAdmin } from "../supabaseAdmin.js"; // use admin client for full read access

const router = Router();

router.get('/', async (req, res) => {
  try {
    const user = req.user; 
    if (!user?.id) return res.status(401).json({ error: "Not authenticated" });

    const { data, error } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ files: data || [] });
  } catch (err: any) {
    console.error("Search error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
