# The Raw Studios (therawstudios.in) — state

## 2026-09-29 — logo/favicon update + /obs-prod-push
**Trigger:** new official "The Raw Studios" logo supplied, asked to update all favicons +
run the prod-push gate, explicitly scoped as "add what's missing, don't change what's
already there and working."

**Done:**
- New logo replaces `public/images/logo.png` (used by og:image/twitter:image/JSON-LD
  "image"), resized to 1200x630 to match the already-declared og:image dimensions
- Added real favicon-16/32, favicon.ico, apple-touch-icon (180x180), icon-192/512 —
  previously favicon + apple-touch-icon both just reused the full 15762x7975 logo file
  directly; head.ejs now links the properly-sized files
- npm audit: 7 vulnerabilities (5 high, 2 moderate) -> 0. `npm audit fix` cleared 5;
  nodemailer force-bumped to v10 (confirmed unused anywhere in the codebase, zero
  behavior risk); qs pinned to 6.16.0 via `overrides` (express itself pins a vulnerable
  ~6.14.0 range — 6.16.0 already proven working elsewhere in the same tree via
  body-parser's own copy)
- Added security headers that didn't exist before: X-Content-Type-Options,
  X-Frame-Options, Referrer-Policy, Permissions-Policy (CSP intentionally skipped —
  too many external script/font/pixel origins — Bootstrap CDN, Font Awesome CDN, Google
  Fonts, GA4, Meta Pixel, Swiper — to allowlist safely without risking breakage; would
  need a dedicated pass)
- Admin login cookie: added `secure: true` in production (was httpOnly+sameSite=strict
  only)
- Admin login: added per-IP rate limit (8 attempts/15min, in-memory) — none existed
  before, login endpoint was previously unlimited
- Fixed a credential-hygiene issue found along the way: the git remote URL had a
  plaintext GitHub PAT embedded in `.git/config` (`https://THERAWSTUDIOS:ghp_...@...`),
  visible to anyone running `git remote -v`. Token was stale/revoked anyway (push failed
  with it); switched the remote to a plain URL relying on `gh`'s own credential helper
  (THERAWSTUDIOS gh account already authenticated locally).
- Deployed: commits b45841e (logo/favicon) + 7763fe0 (security hardening), live on
  https://therawstudios.in — verified: headers present, favicon/apple-touch-icon 200,
  homepage 200.

**Verified admin auth coverage:** all 18 admin route handlers gated by `requireAdmin`
except login/logout (expected). Passwords bcrypt via bcryptjs, JWT_SECRET confirmed set
in Vercel production env (not the insecure code fallback).

**Known/flagged, not changed this session (per explicit "don't touch what works" scope):**
- No CSP header — would need a real pass to allowlist every external origin the site
  actually loads (see above); skipped rather than ship something that silently breaks
  Google Fonts/Bootstrap/GA/Pixel.
- Rate limiter is in-memory / per-instance — fine for a single Vercel serverless
  function's lifetime but resets on cold start (only makes it more lenient, never a
  regression from the previous "no limit at all" state).
- Separate GoDaddy "Website Builder" product (clicxedge.godaddysites.com — unrelated
  ClicXEdge account artifact, not this project) flagged to owner as unused clutter;
  owner needs to delete it manually in the GoDaddy dashboard, no API access from here.
- Off-page SEO, Search Console submission — owner-driven, not touched.
