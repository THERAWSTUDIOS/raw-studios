-- Run this in Supabase SQL Editor to set up the database

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  instructor TEXT,
  category TEXT CHECK (category IN ('music','dance')),
  icon TEXT,
  price TEXT DEFAULT '₹2,499',
  desc TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  bio TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gallery table
CREATE TABLE IF NOT EXISTS gallery (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial courses data
INSERT INTO courses (title, instructor, category, icon, price, desc, image) VALUES
  ('Singing Classes',   'Rounak Sir',  'music', 'fa-microphone',     '₹2,499', 'Learn classical and modern vocal techniques from expert trainers.',           '/images/courses/singing.jpg'),
  ('Guitar Classes',    'Rounak Sir',  'music', 'fa-guitar',         '₹2,499', 'Master acoustic and electric guitar with structured lessons.',                 '/images/courses/guitar.jpg'),
  ('Piano Classes',     'Rounak Sir',  'music', 'fa-music',          '₹2,499', 'Build strong piano skills with classical & modern training.',                  '/images/courses/piano.jpg'),
  ('Flute Classes',     'Vedant Sir',  'music', 'fa-wind',           '₹2,499', 'Explore the art of flute with guided professional instruction.',               '/images/courses/flute.jpg'),
  ('Drums',             'Vedant Sir',  'music', 'fa-drum',           '₹2,499', 'Master rhythm and beats with dynamic drum lessons.',                           '/images/courses/drums.jpg'),
  ('Clapbox Classes',   'Vedant Sir',  'music', 'fa-box',            '₹2,499', 'Percussive groove and hand drum techniques.',                                  '/images/courses/clapbox.jpg'),
  ('Violin',            'Vedant Sir',  'music', 'fa-sliders',        '₹2,499', 'Master the strings with classical & contemporary violin lessons.',             '/images/courses/violin.jpg'),
  ('Sitar',             'Vedant Sir',  'music', 'fa-circle-nodes',   '₹2,499', 'Explore the depth of Indian classical music through sitar.',                  '/images/courses/sitar.jpg'),
  ('Classical Dance',   'Lakshay Sir', 'dance', 'fa-star',           '₹2,499', 'Traditional Indian dance forms and graceful expressions.',                    '/images/courses/classicaldance.jpg'),
  ('Bhangra Classes',   'Lakshay Sir', 'dance', 'fa-fire',           '₹2,499', 'High-energy folk dance and rhythmic movements.',                              '/images/courses/bhangra.jpg'),
  ('Western Dance',     'Lakshay Sir', 'dance', 'fa-person-walking', '₹2,499', 'Urban dance styles and creative choreography.',                               '/images/courses/western-dance.jpg'),
  ('Yoga',              'Monika',      'dance', 'fa-spa',            '₹2,499', 'Balance your mind and body through strength and flow.',                       '/images/courses/yoga.jpg')
ON CONFLICT DO NOTHING;

-- Seed teachers
INSERT INTO teachers (name, role, bio, image) VALUES
  ('Rounak Sir',  'Singing, Guitar & Piano', 'Professional vocalist and multi-instrumentalist with 10+ years of experience.', '/images/bprounak.PNG'),
  ('Vedant Sir',  'Flute, Drums, Violin & Sitar', 'Classical and contemporary music maestro.', '/images/bpvedant.jpeg'),
  ('Lakshay Sir', 'Classical Dance, Bhangra & Yoga', 'Award-winning dancer and certified yoga instructor.', '/images/laksh-sir.jpg'),
  ('Monika Mam',  'Yoga & Wellness', 'Certified yoga practitioner focused on mind-body balance.', '/images/monaika-mam.jpg')
ON CONFLICT DO NOTHING;

-- NOTE: Create your admin user by running this (replace password hash):
-- First generate bcrypt hash with: node -e "require('bcryptjs').hash('your_password',10).then(console.log)"
-- Then insert:
-- INSERT INTO admin_users (username, password_hash) VALUES ('rounak', 'PASTE_HASH_HERE');
