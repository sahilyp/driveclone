import { Router } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../supabase.js";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const router = Router();

// CREATE link
router.post("/", async (req, res) => {
  const body = z.object({
    resourceType: z.enum(["file", "folder"]),
    resourceId: z.string().uuid(),
    expiresAt: z.string().datetime().nullable().optional(),
    password: z.string().min(4).max(128).nullable().optional()
  }).safeParse(req.body);

  if (!body.success) return res.status(400).json({ error: body.error.message });
  // @ts-ignore
  const userId = req.user.id as string;
  const token = randomBytes(24).toString("hex");
  const password_hash = body.data.password ? await bcrypt.hash(body.data.password, 10) : null;

  const { data, error } = await supabaseAdmin.from("link_shares").insert({
    resource_type: body.data.resourceType,
    resource_id: body.data.resourceId,
    token,
    password_hash,
    expires_at: body.data.expiresAt ? new Date(body.data.expiresAt).toISOString() : null,
    created_by: userId
  }).select("id, token, expires_at").single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ link: { id: data.id, token: data.token, expiresAt: data.expires_at } });
});

// DELETE link
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin.from("link_shares").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

export default router;
