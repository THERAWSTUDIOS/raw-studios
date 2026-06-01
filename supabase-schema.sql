-- ============================================================
-- THE RAW STUDIOS — Supabase Schema
-- Run this entire file in Supabase SQL Editor → Run All
-- Admin login: rounakTRS / Rounak007@123
-- ============================================================

-- ── 1. ADMIN USERS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. COURSES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  instructor  TEXT NOT NULL,
  category    TEXT CHECK (category IN ('music','dance')) NOT NULL,
  icon        TEXT,
  price       TEXT DEFAULT '₹2,499',
  description TEXT,
  image       TEXT,
  sort_order  INT  DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. TEACHERS / INSTRUCTORS ────────────────────────────────
CREATE TABLE IF NOT EXISTS teachers (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  role       TEXT,
  tags       TEXT,
  experience TEXT,
  bio        TEXT,
  image      TEXT,
  sort_order INT DEFAULT 0,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. GALLERY ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gallery (
  id         SERIAL PRIMARY KEY,
  image_url  TEXT NOT NULL,
  caption    TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. LABEL VIDEOS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS label_videos (
  id         SERIAL PRIMARY KEY,
  youtube_id TEXT NOT NULL,
  title      TEXT NOT NULL,
  artist     TEXT,
  type       TEXT CHECK (type IN ('recorded','live')) DEFAULT 'recorded',
  sort_order INT DEFAULT 0,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. REVIEWS (fallback/mock — used when Google API not set) ─
CREATE TABLE IF NOT EXISTS reviews (
  id                      SERIAL PRIMARY KEY,
  author_name             TEXT NOT NULL,
  rating                  INT CHECK (rating BETWEEN 1 AND 5) DEFAULT 5,
  review_text             TEXT NOT NULL,
  profile_photo_url       TEXT,
  relative_time_description TEXT,
  is_active               BOOLEAN DEFAULT TRUE,
  sort_order              INT DEFAULT 0,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. SITE STATS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_stats (
  id        SERIAL PRIMARY KEY,
  label     TEXT NOT NULL,
  value     TEXT NOT NULL,
  icon      TEXT,
  suffix    TEXT DEFAULT '',
  sort_order INT DEFAULT 0
);

-- ── 8. ENQUIRIES (contact form submissions) ───────────────────
CREATE TABLE IF NOT EXISTS enquiries (
  id         SERIAL PRIMARY KEY,
  name       TEXT,
  email      TEXT,
  phone      TEXT,
  message    TEXT,
  course     TEXT,
  is_read    BOOLEAN DEFAULT FALSE,
  is_lead    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: run this if the table already exists without is_lead
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS is_lead BOOLEAN DEFAULT FALSE;

-- ============================================================
-- SEED DATA — mirrors everything on the live website
-- ============================================================

-- ── Admin user (username: rounakTRS | password: Rounak007@123) ─
INSERT INTO admin_users (username, password_hash) VALUES
  ('rounakTRS', '$2b$10$EhBsOkRQOyOEYFN0iCwYNuaPdEp4HXeYU6YX1mIHmStIEW54nI6bq')
ON CONFLICT (username) DO NOTHING;

-- ── Courses (12 courses exactly as on live site) ─────────────
INSERT INTO courses (title, instructor, category, icon, price, description, image, sort_order) VALUES
  ('Singing Classes',  'Rounak Singh', 'music', 'fa-microphone',     '₹2,499', 'Learn classical and modern vocal techniques from expert trainers.',                   '/images/courses/singing.jpg',        1),
  ('Guitar Classes',   'Rounak Singh', 'music', 'fa-guitar',         '₹2,499', 'Master acoustic and electric guitar with structured lessons.',                         '/images/courses/guitar.jpg',         2),
  ('Piano Classes',    'Rounak Singh', 'music', 'fa-music',          '₹2,499', 'Build strong piano skills with classical & modern training.',                          '/images/courses/piano.jpg',          3),
  ('Flute Classes',    'Vedant',       'music', 'fa-wind',           '₹2,499', 'Explore the art of flute with guided professional instruction.',                       '/images/courses/flute.jpg',          4),
  ('Drums',            'Vedant',       'music', 'fa-drum',           '₹2,499', 'Master rhythm and beats with dynamic drum lessons.',                                   '/images/courses/drums.jpg',          5),
  ('Clapbox Classes',  'Vedant',       'music', 'fa-box',            '₹2,499', 'Percussive groove and hand drum techniques.',                                          '/images/courses/clapbox.jpg',        6),
  ('Violin',           'Vedant',       'music', 'fa-sliders',        '₹2,499', 'Master the strings with classical & contemporary violin lessons.',                     '/images/courses/violin.jpg',         7),
  ('Sitar',            'Vedant',       'music', 'fa-circle-nodes',   '₹2,499', 'Explore the depth of Indian classical music through sitar.',                          '/images/courses/sitar.jpg',          8),
  ('Classical Dance',  'Lakshay',      'dance', 'fa-star',           '₹2,499', 'Traditional Indian dance forms and graceful expressions.',                            '/images/courses/classicaldance.jpg', 9),
  ('Bhangra Classes',  'Lakshay',      'dance', 'fa-fire',           '₹2,499', 'High-energy folk dance and rhythmic movements.',                                       '/images/courses/bhangra.jpg',       10),
  ('Western Dance',    'Lakshay',      'dance', 'fa-person-walking', '₹2,499', 'Urban dance styles and creative choreography.',                                        '/images/courses/western-dance.jpg', 11),
  ('Yoga',             'Monika',       'dance', 'fa-spa',            '₹2,499', 'Balance your mind and body through strength and flow.',                               '/images/courses/yoga.jpg',          12)
ON CONFLICT DO NOTHING;

-- ── Teachers / Instructors (4 instructors from live site) ────
INSERT INTO teachers (name, role, tags, experience, bio, image, sort_order) VALUES
  ('Rounak Singh', 'Founder & Lead Instructor', 'Singing,Guitar,Piano',      '12+ Years Experience', 'Classical excellence and contemporary innovation in every lesson. Founder of The Raw Studios and touring musician.',         '/images/bprounak.PNG',    1),
  ('Lakshay',      'Dance Instructor',           'Kathak,Semi-Classical,Bhangra', '8+ Years Experience', 'From traditional Kathak to modern choreography — bringing fire, grace, and discipline to every performance.',          '/images/laksh-sir.jpg',   2),
  ('Vedant',       'Music Instructor',           'Flute,Sitar,Violin,Drums,Clapbox', '7+ Years Experience', 'Master of Indian and Western classical instruments. Brings deep musical knowledge to every guided session.',       '/images/bpvedant.jpeg',   3),
  ('Monika',       'Yoga & Wellness Instructor', 'Yoga,Wellness,Mindfulness', '5+ Years Experience', 'Certified yoga instructor bringing balance, mindfulness, and holistic wellness to students of all levels.',               '/images/monaika-mam.jpg', 4)
ON CONFLICT DO NOTHING;

-- ── Gallery (22 student/performance photos from live site) ───
INSERT INTO gallery (image_url, caption, sort_order) VALUES
  ('/images/col.jpeg',   'Performance at The Raw Studios',  1),
  ('/images/col2.jpeg',  'Student showcase 2024',           2),
  ('/images/col3.jpeg',  'Annual concert rehearsal',        3),
  ('/images/col4.jpeg',  'Music batch — Rounak Sir',        4),
  ('/images/col5.jpeg',  'Dance performance',               5),
  ('/images/col6.jpeg',  'Guitar class',                    6),
  ('/images/col7.jpeg',  'Bhangra practice',                7),
  ('/images/col8.jpeg',  'Singing masterclass',             8),
  ('/images/col9.jpeg',  'Studio session',                  9),
  ('/images/col10.jpeg', 'Classical dance recital',        10),
  ('/images/col11.jpeg', 'Flute class',                    11),
  ('/images/col12.jpeg', 'Yoga session',                   12),
  ('/images/col13.jpeg', 'Annual concert 2024',            13),
  ('/images/col14.jpeg', 'Drums masterclass',              14),
  ('/images/col15.jpeg', 'Piano batch',                    15),
  ('/images/col16.jpeg', 'Violin class',                   16),
  ('/images/col17.jpeg', 'Kathak performance',             17),
  ('/images/col18.jpeg', 'Sitar session',                  18),
  ('/images/col19.jpeg', 'Western dance showcase',         19),
  ('/images/col20.jpeg', 'Clapbox workshop',               20),
  ('/images/col21.jpeg', 'Semi-classical recital',         21),
  ('/images/col22.jpeg', 'TRS family photo',               22)
ON CONFLICT DO NOTHING;

-- ── Label / YouTube videos (3 from live site) ────────────────
INSERT INTO label_videos (youtube_id, title, artist, type, sort_order) VALUES
  ('d2bU-zANIH8', 'Baat Itni Si Hai | Love is Feeling | Official Song | Rounak Singh | Sobia Kaur | Raw Studios', 'Rounak Singh ft. Sobia Kaur', 'recorded', 1),
  ('2VraEY8XMdw', 'Superstar (Full Song) Rounak Singh',                                                           'Rounak Singh',               'recorded', 2),
  ('KnWLEZc0hQc', 'Rounak Singh : Chal Ud Challiye | Lets Fly | Ft Yasmeen | Latest Song | Official Video',       'Rounak Singh ft. Yasmeen',   'recorded', 3)
ON CONFLICT DO NOTHING;

-- ── Reviews (8 mock reviews shown when Google API not set) ───
INSERT INTO reviews (author_name, rating, review_text, profile_photo_url, relative_time_description, sort_order) VALUES
  ('Priya Sharma',    5, 'Joining The Raw Studios was the best decision I made for my daughter. After just 4 months of singing with Rounak sir, she performed solo at her school annual function. The personalized attention and structured curriculum make all the difference!', 'https://ui-avatars.com/api/?name=Priya+Sharma&background=FA8112&color=fff&size=60&rounded=true',    '2 months ago', 1),
  ('Amit Verma',      5, 'Vedant sir''s flute lessons are nothing short of magical. I had zero musical background and within 6 months I can play full ragas. The studio atmosphere is welcoming — best music academy in the tricity area!',                                       'https://ui-avatars.com/api/?name=Amit+Verma&background=222222&color=fff&size=60&rounded=true',      '1 month ago',  2),
  ('Neha Kapoor',     5, 'Lakshay sir transformed my daughter''s posture, grace, and confidence through Kathak. The annual auditorium concert was breathtaking — every student performed with professional-level poise. TRS is truly a gem in Zirakpur.',                       'https://ui-avatars.com/api/?name=Neha+Kapoor&background=FA8112&color=fff&size=60&rounded=true',     '3 weeks ago',  3),
  ('Rajesh Gupta',    5, 'My son started guitar here a year ago and performed at his school''s annual function to a standing ovation. What impresses me most is how TRS builds confidence alongside technical skill. Rounak sir is an incredible mentor!',                       'https://ui-avatars.com/api/?name=Rajesh+Gupta&background=222222&color=fff&size=60&rounded=true',    '5 days ago',   4),
  ('Sunita Mehta',    5, 'The yoga and wellness sessions by Lakshay sir have genuinely changed my quality of life. I battled chronic back pain for years — 3 months into the program I feel like a new person. Peaceful, professional, and inspiring studio.',                  'https://ui-avatars.com/api/?name=Sunita+Mehta&background=FA8112&color=fff&size=60&rounded=true',    '1 week ago',   5),
  ('Arjun Singh',     5, 'Bhangra at TRS is pure energy! Lakshay sir brings expert choreography and infectious enthusiasm to every class. Our batch performed at the Punjab Youth Festival and won second place — couldn''t have done it without this incredible team.',         'https://ui-avatars.com/api/?name=Arjun+Singh&background=222222&color=fff&size=60&rounded=true',     '2 weeks ago',  6),
  ('Kavita Nair',     5, 'I enrolled my twins — one in piano, one in sitar — and both have flourished beyond my expectations. TRS creates such an authentic love for music, not just mechanical skill. Vedant sir and Rounak sir are exceptional educators.',                   'https://ui-avatars.com/api/?name=Kavita+Nair&background=FA8112&color=fff&size=60&rounded=true',     '3 months ago', 7),
  ('Harpreet Sandhu', 5, 'From the very first trial lesson, I knew TRS was different. The faculty listens to what you want to achieve and builds a customized learning path. My drums journey with Vedant sir has been nothing short of exhilarating — 100% recommend!',       'https://ui-avatars.com/api/?name=Harpreet+Sandhu&background=222222&color=fff&size=60&rounded=true', '1 month ago',  8)
ON CONFLICT DO NOTHING;

-- ── Site Stats (About & Home page counters) ───────────────────
INSERT INTO site_stats (label, value, icon, suffix, sort_order) VALUES
  ('Years Experience',      '10',   'fa-calendar-days',       '',  1),
  ('Auditorium Concerts',   '1200', 'fa-microphone-stand',    '+', 2),
  ('Happy Students',        '500',  'fa-users',               '+', 3),
  ('Merits in Music Exams', '95',   'fa-medal',               '%', 4)
ON CONFLICT DO NOTHING;
