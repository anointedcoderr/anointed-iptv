import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_API_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { action, userId, data } = req.body;
    const supabase = getSupabase();
    if (action === 'list') {
      let result = await supabase.from('profiles').select('id, email, username, name, role, created_at').order('created_at', { ascending: false }).limit(500);
      if (result.error) result = await supabase.from('users').select('id, email, username, name, role, created_at').order('created_at', { ascending: false }).limit(500);
      if (result.error) return res.status(500).json({ error: result.error.message });
      return res.json({ users: (result.data || []).map(u => ({ id: u.id, email: u.email || '', username: u.username || u.name || '', role: u.role || 'user', status: 'active', created_at: u.created_at || '' })) });
    }
    if (action === 'update_role' && userId && data?.role) { await supabase.from('profiles').update({ role: data.role }).eq('id', userId); return res.json({ success: true }); }
    if (action === 'remove' && userId) { await supabase.from('profiles').delete().eq('id', userId); return res.json({ success: true }); }
    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) { console.error('Admin error:', error); return res.status(500).json({ error: 'Server error' }); }
}
