const express  = require('express');
const bcrypt   = require('bcryptjs');
const multer   = require('multer');
const router   = express.Router();
const { requireAdmin, signToken } = require('../lib/auth');
const { getSupabase } = require('../lib/supabase');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ── Image uploads → Supabase Storage ─────────────────────────
async function uploadToStorage(bucket, file) {
  const ext  = file.originalname.split('.').pop().toLowerCase();
  const name = `${bucket}-${Date.now()}.${ext}`;
  const sb   = getSupabase();
  const { error } = await sb.storage.from(bucket).upload(name, file.buffer, {
    contentType: file.mimetype, upsert: true
  });
  if (error) throw error;
  return sb.storage.from(bucket).getPublicUrl(name).data.publicUrl;
}

router.post('/admin/upload/teacher-image', requireAdmin, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  try {
    const url = await uploadToStorage('teacher-images', req.file);
    res.json({ url });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/admin/upload/gallery-image', requireAdmin, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  try {
    // ensure gallery bucket exists
    const sb = getSupabase();
    await sb.storage.createBucket('gallery-images', { public: true, fileSizeLimit: 10485760 }).catch(() => {});
    const url = await uploadToStorage('gallery-images', req.file);
    res.json({ url });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Login page ────────────────────────────────────────────────
router.get('/trstestrounak', (req, res) => {
  const error = req.query.error || null;
  res.render('admin/login', { title: 'Admin Login — TRS', error });
});

router.post('/trstestrounak', async (req, res) => {
  const { username, password } = req.body;
  try {
    const sb = getSupabase();
    const { data: user, error } = await sb
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return res.render('admin/login', { title: 'Admin Login — TRS', error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.render('admin/login', { title: 'Admin Login — TRS', error: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id, username: user.username });
    res.cookie('trs_admin', token, { httpOnly: true, maxAge: 8 * 60 * 60 * 1000, sameSite: 'strict' });
    res.redirect('/admin');
  } catch (err) {
    res.render('admin/login', { title: 'Admin Login — TRS', error: 'Server error — ' + err.message });
  }
});

router.get('/admin/logout', (req, res) => {
  res.clearCookie('trs_admin');
  res.redirect('/trstestrounak');
});

// ── Dashboard ─────────────────────────────────────────────────
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const sb = getSupabase();
    const [{ count: courses }, { count: teachers }, { count: gallery }, { count: enquiries }] = await Promise.all([
      sb.from('courses').select('*', { count: 'exact', head: true }),
      sb.from('teachers').select('*', { count: 'exact', head: true }),
      sb.from('gallery').select('*', { count: 'exact', head: true }),
      sb.from('enquiries').select('*', { count: 'exact', head: true }).eq('is_read', false),
    ]);
    let leads = 0;
    try {
      const { count } = await sb.from('enquiries').select('*', { count: 'exact', head: true }).eq('is_lead', true).eq('is_read', false);
      leads = count || 0;
    } catch {}
    res.render('admin/dashboard', { title: 'Admin Dashboard — TRS', admin: req.admin, courses, teachers, gallery, enquiries, leads });
  } catch (err) {
    res.render('admin/dashboard', { title: 'Admin Dashboard — TRS', admin: req.admin, courses: 0, teachers: 0, gallery: 0, enquiries: 0, leads: 0 });
  }
});

// ── Courses CRUD ──────────────────────────────────────────────
router.get('/admin/courses', requireAdmin, async (req, res) => {
  const sb = getSupabase();
  const { data: courses } = await sb.from('courses').select('*').order('id');
  res.render('admin/courses', { title: 'Manage Courses — TRS', admin: req.admin, courses: courses || [] });
});

router.post('/admin/courses', requireAdmin, async (req, res) => {
  const { title, instructor, category, icon, price, description, image } = req.body;
  const sb = getSupabase();
  await sb.from('courses').insert([{ title, instructor, category, icon, price, description, image }]);
  res.redirect('/admin/courses');
});

router.post('/admin/courses/:id/update', requireAdmin, async (req, res) => {
  const { title, instructor, category, icon, price, description, image } = req.body;
  const sb = getSupabase();
  await sb.from('courses').update({ title, instructor, category, icon, price, description, image }).eq('id', req.params.id);
  res.redirect('/admin/courses');
});

router.post('/admin/courses/:id/delete', requireAdmin, async (req, res) => {
  const sb = getSupabase();
  await sb.from('courses').delete().eq('id', req.params.id);
  res.redirect('/admin/courses');
});

// ── Teachers CRUD ─────────────────────────────────────────────
router.get('/admin/teachers', requireAdmin, async (req, res) => {
  const sb = getSupabase();
  const { data: teachers } = await sb.from('teachers').select('*').order('id');
  res.render('admin/teachers', { title: 'Manage Teachers — TRS', admin: req.admin, teachers: teachers || [] });
});

router.post('/admin/teachers', requireAdmin, async (req, res) => {
  const { name, role, tags, experience, bio, image } = req.body;
  const sb = getSupabase();
  await sb.from('teachers').insert([{ name, role, tags, experience, bio, image }]);
  res.redirect('/admin/teachers');
});

router.post('/admin/teachers/:id/update', requireAdmin, async (req, res) => {
  const { name, role, tags, experience, bio, image } = req.body;
  const sb = getSupabase();
  await sb.from('teachers').update({ name, role, tags, experience, bio, image }).eq('id', req.params.id);
  res.redirect('/admin/teachers');
});

router.post('/admin/teachers/:id/delete', requireAdmin, async (req, res) => {
  const sb = getSupabase();
  await sb.from('teachers').delete().eq('id', req.params.id);
  res.redirect('/admin/teachers');
});

// ── Gallery CRUD ──────────────────────────────────────────────
router.get('/admin/gallery', requireAdmin, async (req, res) => {
  const sb = getSupabase();
  const { data: gallery } = await sb.from('gallery').select('*').order('id', { ascending: false });
  res.render('admin/gallery', { title: 'Manage Gallery — TRS', admin: req.admin, gallery: gallery || [] });
});

router.post('/admin/gallery', requireAdmin, async (req, res) => {
  const { image_url } = req.body;
  const sb = getSupabase();
  await sb.from('gallery').insert([{ image_url }]);
  res.redirect('/admin/gallery');
});

router.post('/admin/gallery/:id/delete', requireAdmin, async (req, res) => {
  const sb = getSupabase();
  await sb.from('gallery').delete().eq('id', req.params.id);
  res.redirect('/admin/gallery');
});

// ── Enquiries ─────────────────────────────────────────────────
router.get('/admin/enquiries', requireAdmin, async (req, res) => {
  const sb = getSupabase();
  const { data: enquiries } = await sb.from('enquiries').select('*').order('created_at', { ascending: false });
  const unread = (enquiries || []).filter(e => !e.is_read).length;
  res.render('admin/enquiries', { title: 'Enquiries — TRS', admin: req.admin, enquiries: enquiries || [], unread });
});

router.post('/admin/enquiries/:id/read', requireAdmin, async (req, res) => {
  const sb = getSupabase();
  await sb.from('enquiries').update({ is_read: true }).eq('id', req.params.id);
  res.redirect('/admin/enquiries');
});

router.post('/admin/enquiries/:id/delete', requireAdmin, async (req, res) => {
  const sb = getSupabase();
  await sb.from('enquiries').delete().eq('id', req.params.id);
  res.redirect('/admin/enquiries');
});

module.exports = router;
