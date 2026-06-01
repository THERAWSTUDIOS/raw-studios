const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'trs-dev-secret-change-in-prod';

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '8h' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

function requireAdmin(req, res, next) {
  const token = req.cookies?.trs_admin;
  const decoded = verifyToken(token);
  if (!decoded) return res.redirect('/trstestrounak?error=unauthorized');
  req.admin = decoded;
  next();
}

module.exports = { signToken, verifyToken, requireAdmin };
