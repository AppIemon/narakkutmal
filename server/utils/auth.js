const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// JWT 토큰 생성
function generateToken(userId, username) {
  return jwt.sign(
    { userId, username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// JWT 토큰 검증
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Socket.IO 미들웨어 - 토큰 인증
function socketAuth(socket, next) {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('인증 토큰이 필요합니다.'));
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return next(new Error('유효하지 않은 토큰입니다.'));
  }
  
  socket.userId = decoded.userId;
  socket.username = decoded.username;
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  socketAuth
};

