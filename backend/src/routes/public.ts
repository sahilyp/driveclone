import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import bcrypt from 'bcryptjs';

const router = Router();

// Resolve a public link. POST { token, password? } -> returns signed URL if file
router.post('/resolve', async (req, res) => {
  const { token, password } = req.body || {};
  if (!token) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'token required' }});
  const { data: link } = await supabaseAdmin.from('link_shares').select('*').eq('token', token).maybeSingle();
  if (!link) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Link not found' }});
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return res.status(410).json({ error: { code: 'EXPIRED', message: 'Link expired' }});
  }
  if (link.password_hash) {
    const ok = await bcrypt.compare(password || '', link.password_hash);
    if (!ok) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Wrong password' }});
  }
  if (link.resource_type === 'file') {
    const { data: file } = await supabaseAdmin.from('files').select('*').eq('id', link.resource_id).maybeSingle();
    if (!file) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'File not found' }});
    const { data: signed, error } = await supabaseAdmin.storage.from(process.env.SUPABASE_BUCKET || 'file').createSignedUrl(file.storage_key, 60);
    if (error) return res.status(500).json({ error: { code: 'STORAGE', message: error.message }});
    return res.json({ type: 'file', url: signed.signedUrl, name: file.name, sizeBytes: file.size_bytes, mimeType: file.mime_type });
  }
  // For folders, just list its contents
  if (link.resource_type === 'folder') {
    const folderId = link.resource_id;
    const { data: files } = await supabaseAdmin.from('files').select('*').eq('folder_id', folderId).eq('is_deleted', false);
    return res.json({ type: 'folder', files: files || [] });
  }
});

export default router;
