import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  // @ts-ignore
  const userId = req.user.id as string;
  const { data: files } = await supabaseAdmin.from('files').select('*').eq('owner_id', userId).eq('is_deleted', true);
  const { data: folders } = await supabaseAdmin.from('folders').select('*').eq('owner_id', userId).eq('is_deleted', true);
  res.json({ files: files || [], folders: folders || [] });
});

router.post('/restore', async (req, res) => {
  const body = z.object({ resourceType: z.enum(['file','folder']), resourceId: z.string().uuid() }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: body.error.message }});
  const table = body.data.resourceType === 'file' ? 'files' : 'folders';
  const { error } = await supabaseAdmin.from(table).update({ is_deleted: false }).eq('id', body.data.resourceId);
  if (error) return res.status(500).json({ error: { code: 'DB_ERROR', message: error.message }});
  res.json({ ok: true });
});

export default router;
