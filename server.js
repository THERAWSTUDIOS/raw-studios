require('dotenv').config();
const express      = require('express');
const path         = require('path');
const axios        = require('axios');
const fs           = require('fs');
const cookieParser = require('cookie-parser');
const adminRoutes  = require('./routes/admin');
const { getSupabase } = require('./lib/supabase');

const app  = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Admin routes (/trstestrounak, /admin/*) ─────────────────
app.use(adminRoutes);

// ─── Supabase data fetchers ───────────────────────────────────
async function getCourses() {
  try {
    const { data } = await getSupabase()
      .from('courses').select('*').eq('is_active', true).order('sort_order');
    return (data || []).map(c => ({ ...c, desc: c.description }));
  } catch { return []; }
}

async function getTeachers() {
  try {
    const { data } = await getSupabase()
      .from('teachers').select('*').eq('is_active', true).order('sort_order');
    return (data || []).map(t => ({
      ...t,
      tagsArray: (t.tags || '').split(',').map(s => s.trim()).filter(Boolean)
    }));
  } catch { return []; }
}

async function getGallery() {
  try {
    const { data } = await getSupabase()
      .from('gallery').select('*').order('sort_order');
    return data || [];
  } catch { return []; }
}

async function getLabelVideos() {
  try {
    const { data } = await getSupabase()
      .from('label_videos').select('*').eq('is_active', true).order('sort_order');
    return (data || []).map(v => ({ id: v.youtube_id, title: v.title, artist: v.artist, type: v.type }));
  } catch { return []; }
}

// ─── Reviews cache (5-min TTL) ──────────────────────────────
let reviewsCache   = null;
let reviewsCacheAt = 0;
const CACHE_TTL    = 5 * 60 * 1000;

// ─── Mock fallback ───────────────────────────────────────────
function getMockReviews() {
  return [
    {
      author_name: 'Priya Sharma',
      rating: 5,
      text: 'Joining The Raw Studios was the best decision I made for my daughter. After just 4 months of singing with Rounak sir, she performed solo at her school annual function. The personalized attention and structured curriculum make all the difference!',
      profile_photo_url: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=FA8112&color=fff&size=60&rounded=true',
      relative_time_description: '2 months ago'
    },
    {
      author_name: 'Amit Verma',
      rating: 5,
      text: "Vedant sir's flute lessons are nothing short of magical. I had zero musical background and within 6 months I can play full ragas. The studio atmosphere is welcoming — best music academy in the tricity area!",
      profile_photo_url: 'https://ui-avatars.com/api/?name=Amit+Verma&background=222222&color=fff&size=60&rounded=true',
      relative_time_description: '1 month ago'
    },
    {
      author_name: 'Neha Kapoor',
      rating: 5,
      text: "Lakshay sir transformed my daughter's posture, grace, and confidence through Kathak. The annual auditorium concert was breathtaking — every student performed with professional-level poise. TRS is truly a gem in Zirakpur.",
      profile_photo_url: 'https://ui-avatars.com/api/?name=Neha+Kapoor&background=FA8112&color=fff&size=60&rounded=true',
      relative_time_description: '3 weeks ago'
    },
    {
      author_name: 'Rajesh Gupta',
      rating: 5,
      text: "My son started guitar here a year ago and performed at his school's annual function to a standing ovation. What impresses me most is how TRS builds confidence alongside technical skill. Rounak sir is an incredible mentor!",
      profile_photo_url: 'https://ui-avatars.com/api/?name=Rajesh+Gupta&background=222222&color=fff&size=60&rounded=true',
      relative_time_description: '5 days ago'
    },
    {
      author_name: 'Sunita Mehta',
      rating: 5,
      text: 'The yoga and wellness sessions by Lakshay sir have genuinely changed my quality of life. I battled chronic back pain for years — 3 months into the program I feel like a new person. Peaceful, professional, and inspiring studio.',
      profile_photo_url: 'https://ui-avatars.com/api/?name=Sunita+Mehta&background=FA8112&color=fff&size=60&rounded=true',
      relative_time_description: '1 week ago'
    },
    {
      author_name: 'Arjun Singh',
      rating: 5,
      text: "Bhangra at TRS is pure energy! Lakshay sir brings expert choreography and infectious enthusiasm to every class. Our batch performed at the Punjab Youth Festival and won second place — couldn't have done it without this incredible team.",
      profile_photo_url: 'https://ui-avatars.com/api/?name=Arjun+Singh&background=222222&color=fff&size=60&rounded=true',
      relative_time_description: '2 weeks ago'
    },
    {
      author_name: 'Kavita Nair',
      rating: 5,
      text: 'I enrolled my twins — one in piano, one in sitar — and both have flourished beyond my expectations. TRS creates such an authentic love for music, not just mechanical skill. Vedant sir and Rounak sir are exceptional educators.',
      profile_photo_url: 'https://ui-avatars.com/api/?name=Kavita+Nair&background=FA8112&color=fff&size=60&rounded=true',
      relative_time_description: '3 months ago'
    },
    {
      author_name: 'Harpreet Sandhu',
      rating: 5,
      text: 'From the very first trial lesson, I knew TRS was different. The faculty listens to what you want to achieve and builds a customized learning path. My drums journey with Vedant sir has been nothing short of exhilarating — 100% recommend!',
      profile_photo_url: 'https://ui-avatars.com/api/?name=Harpreet+Sandhu&background=222222&color=fff&size=60&rounded=true',
      relative_time_description: '1 month ago'
    }
  ];
}

// ─── Live Google Places fetch ────────────────────────────────
// To enable live reviews:
//   1. Create a Google Cloud project & enable Places API
//   2. Set GOOGLE_API_KEY in .env
//   3. Find your Place ID: https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder
//   4. Set GOOGLE_PLACE_ID in .env  (looks like: ChIJN1t_tDeuEmsRUsoyG83frY4)
async function fetchGoogleReviews() {
  const apiKey  = process.env.GOOGLE_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  // Return cache if fresh
  if (reviewsCache && Date.now() - reviewsCacheAt < CACHE_TTL) {
    console.log('📦 Reviews served from cache');
    return reviewsCache;
  }

  if (!apiKey || !placeId ||
      apiKey  === 'your_google_places_api_key' ||
      placeId === 'your_google_place_id') {
    console.log('ℹ️  No Google API keys — using demo reviews. Set GOOGLE_API_KEY + GOOGLE_PLACE_ID in .env for live data.');
    return getMockReviews();
  }

  try {
    console.log('🌐 Fetching live Google reviews...');
    const { data } = await axios.get(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          place_id: placeId,
          fields:   'reviews,rating,user_ratings_total,name',
          key:      apiKey,
          reviews_sort: 'newest'
        },
        timeout: 8000
      }
    );

    if (data.status !== 'OK') {
      console.warn(`⚠️  Places API returned status: ${data.status}. Using demo reviews.`);
      return getMockReviews();
    }

    const raw      = data.result?.reviews || [];
    const filtered = raw.filter(r => r.rating >= 4);
    const reviews  = filtered.length >= 3 ? filtered : getMockReviews();

    // Cache
    reviewsCache   = reviews;
    reviewsCacheAt = Date.now();
    console.log(`✅ Fetched ${reviews.length} live reviews from Google`);
    return reviews;

  } catch (err) {
    console.warn(`⚠️  Google Places API error: ${err.message}. Using demo reviews.`);
    return getMockReviews();
  }
}

// ─── Routes ───────────────────────────────────────────────────
function isLive() {
  const key = process.env.GOOGLE_API_KEY;
  const pid = process.env.GOOGLE_PLACE_ID;
  return !!(key && pid && key !== 'your_google_places_api_key' && pid !== 'your_google_place_id');
}

app.get('/', async (req, res) => {
  const [reviews, courses, teachers, gallery] = await Promise.all([
    fetchGoogleReviews(), getCourses(), getTeachers(), getGallery()
  ]);
  res.render('index', { title:'The Raw Studios — Music & Dance Academy', reviews, courses: courses.slice(0,4), teachers, gallery, live: isLive() });
});

app.get('/courses', async (req, res) => {
  const courses = await getCourses();
  res.render('courses', { title:'Our Courses — The Raw Studios', courses });
});

app.get('/label', async (req, res) => {
  const videos = await getLabelVideos();
  res.render('label', {
    title: 'Label & Performances — The Raw Studios',
    liveVideos:     videos.filter(v => v.type === 'live'),
    recordedVideos: videos.filter(v => v.type === 'recorded'),
  });
});

app.get('/about', async (req, res) => {
  const [reviews, teachers] = await Promise.all([fetchGoogleReviews(), getTeachers()]);
  res.render('about', { title:'About Us — The Raw Studios', reviews, teachers, live: isLive() });
});

app.get('/contact', (req, res) => {
  res.render('contact', { title:'Contact Us — The Raw Studios', success:null, error:null });
});

// ─── API: list image files in public/images/ ─────────────────
app.get('/api/images', (req, res) => {
  try {
    const imagesDir = path.join(__dirname, 'public', 'images');
    const files = fs.readdirSync(imagesDir).filter(f => /\.(jpe?g|png|gif|webp|svg|avif)$/i.test(f));
    res.json({ count: files.length, images: files });
  } catch (err) {
    res.json({ count: 0, images: [], error: err.message });
  }
});

// Debug endpoint — hit /api/reviews to check what's returning
app.get('/api/reviews', async (req, res) => {
  const reviews = await fetchGoogleReviews();
  res.json({ count: reviews.length, live: isLive(), reviews });
});

app.post('/contact', async (req, res) => {
  const { name, email, phone, message, course } = req.body;
  try {
    await getSupabase().from('enquiries').insert([{ name, email, phone, message, course }]);
  } catch {}
  res.render('contact', { title:'Contact Us — The Raw Studios', success:"We received your enquiry! Our team will reach out to you on WhatsApp shortly.", error:null });
});

app.listen(PORT, () => console.log(`🎵 The Raw Studios → http://localhost:${PORT}`));
