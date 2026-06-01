const express  = require('express');
const bcrypt   = require('bcryptjs');
const multer   = require('multer');
const router   = express.Router();
const { requireAdmin, signToken } = require('../lib/auth');
const { getSupabase } = require('../lib/supabase');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ── Image upload → Supabase Storage ──────────────────────────
router.post('/admin/upload/teacher-image', requireAdmin, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  const ext  = req.file.originalname.split('.').pop().toLowerCase();
  const name = `teacher-${Date.now()}.${ext}`;
  const sb   = getSupabase();
  const { error } = await sb.storage.from('teacher-images').upload(name, req.file.buffer, {
    contentType: req.file.mimetype, upsert: true
  });
  if (error) return res.status(500).json({ error: error.message });
  const { data } = sb.storage.from('teacher-images').getPublicUrl(name);
  res.json({ url: data.publicUrl });
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
    const [{ count: courses }, { count: teachers }, { count: gallery }] = await Promise.all([
      sb.from('courses').select('*', { count: 'exact', head: true }),
      sb.from('teachers').select('*', { count: 'exact', head: true }),
      sb.from('gallery').select('*', { count: 'exact', head: true }),
    ]);
    res.render('admin/dashboard', { title: 'Admin Dashboard — TRS', admin: req.admin, courses, teachers, gallery });
  } catch (err) {
    res.render('admin/dashboard', { title: 'Admin Dashboard — TRS', admin: req.admin, courses: 0, teachers: 0, gallery: 0 });
  }
});

// ── Courses CRUD ──────────────────────────────────────────────
router.get('/admin/courses', requireAdmin, async (req, res) => {
  const sb = getSupabase();
  const { data: courses } = await sb.from('courses').select('*').order('id');
  res.render('admin/courses', { title: 'Manage Courses — TRS', admin: req.admin, courses: courses || [] });
});

router.post('/admin/courses', requireAdmin, async (req, res) => {
  const { title, instructor, category, icon, price, desc, image } = req.body;
  const sb = getSupabase();
  await sb.from('courses').insert([{ title, instructor, category, icon, price, desc, image }]);
  res.redirect('/admin/courses');
});

router.post('/admin/courses/:id/update', requireAdmin, async (req, res) => {
  const { title, instructor, category, icon, price, desc, image } = req.body;
  const sb = getSupabase();
  await sb.from('courses').update({ title, instructor, category, icon, price, desc, image }).eq('id', req.params.id);
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
  const { image_url, caption } = req.body;
  const sb = getSupabase();
  await sb.from('gallery').insert([{ image_url, caption }]);
  res.redirect('/admin/gallery');
});

router.post('/admin/gallery/:id/delete', requireAdmin, async (req, res) => {
  const sb = getSupabase();
  await sb.from('gallery').delete().eq('id', req.params.id);
  res.redirect('/admin/gallery');
});

module.exports = router;
