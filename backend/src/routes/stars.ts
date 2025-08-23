import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../supabase.js';

const router = Router();

router.post('/', async (req, res) => {
  const body = z.object({ resourceType: z.enum(['file','folder']), resourceId: z.string().uuid() }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: body.error.message }});
  // @ts-ignore
  const userId = req.user.id as string;
  const { error } = await supabaseAdmin.from('stars').insert({ user_id: userId, resource_type: body.data.resourceType, resource_id: body.data.resourceId });
  if (error) return res.status(500).json({ error: { code: 'DB_ERROR', message: error.message }});
  res.json({ ok: true });
});

router.delete('/', async (req, res) => {
  const body = z.object({ resourceType: z.enum(['file','folder']), resourceId: z.string().uuid() }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: body.error.message }});
  // @ts-ignore
  const userId = req.user.id as string;
  const { error } = await supabaseAdmin.from('stars').delete().eq('user_id', userId).eq('resource_type', body.data.resourceType).eq('resource_id', body.data.resourceId);
  if (error) return res.status(500).json({ error: { code: 'DB_ERROR', message: error.message }});
  res.json({ ok: true });
});

export default router;
