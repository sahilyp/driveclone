import { Router } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../supabase.js";

const router = Router();

// CREATE share
router.post("/", async (req, res) => {
  const body = z.object({
    resourceType: z.enum(["file", "folder"]),
    resourceId: z.string().uuid(),
    granteeUserId: z.string().uuid(),
    role: z.enum(["viewer", "editor"]),
  }).safeParse(req.body);

  if (!body.success) return res.status(400).json({ error: body.error.message });

  // @ts-ignore
  const userId = req.user.id as string;

  const { data, error } = await supabaseAdmin.from("shares").insert({
    resource_type: body.data.resourceType,
    resource_id: body.data.resourceId,
    grantee_user_id: body.data.granteeUserId,
    role: body.data.role,
    created_by: userId,
  }).select("*").single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ share: data });
});

// GET shares for a resource
router.get("/:type/:id", async (req, res) => {
  const { type, id } = req.params;
  const { data, error } = await supabaseAdmin.from("shares")
    .select("*")
    .eq("resource_type", type)
    .eq("resource_id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ shares: data });
});

// DELETE share
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin.from("shares").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

export default router;
