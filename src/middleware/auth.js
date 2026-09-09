const jwt = require('jsonwebtoken');

// Verifies our own signed JWT (issued after AD login) and attaches the
// verified claims to req.user. Never trusts a client-supplied role.
function verifyJwt(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token provided' });

  const token = header.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid or expired token' });
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      department: decoded.department,
      email: decoded.email,
    };
    next();
  });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

module.exports = { verifyJwt, requireRole };
