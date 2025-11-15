require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');

const User = require('./models/User');
const Game = require('./models/Game');
const { getAvailableCountries, findCountry, getLastCharInitial } = require('./countries');
const { updateRatings } = require('./utils/rating');
const { generateToken, verifyToken, socketAuth } = require('./utils/auth');
const { getTierByRating } = require('./utils/tier');

const app = express();
const server = http.createServer(app);

// Vercel 환경에서는 Socket.IO 설정 조정
const ioOptions = {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
};

// Vercel 환경 감지
if (process.env.VERCEL) {
  ioOptions.allowEIO3 = true;
  ioOptions.pingTimeout = 60000;
  ioOptions.pingInterval = 25000;
}

const io = socketIo(server, ioOptions);

// Socket.IO 인증 미들웨어
io.use(socketAuth);

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/country-word-chain';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'country-word-chain';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB 연결 성공');
}).catch(err => {
  console.error('MongoDB 연결 실패:', err);
});

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 및 뷰 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../src/views'));
app.use(express.static(path.join(__dirname, '../src')));

// 라우트
app.get('/', (req, res) => {
  res.render('index');
});

// 회원가입 API
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '사용자 이름과 비밀번호를 입력해주세요.' });
    }
    
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: '사용자 이름은 3자 이상 20자 이하여야 합니다.' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: '비밀번호는 6자 이상이어야 합니다.' });
    }
    
    // 중복 확인
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: '이미 사용 중인 사용자 이름입니다.' });
    }
    
    // 사용자 생성
    const user = new User({ username, password });
    await user.save();
    
    // 토큰 생성
    const token = generateToken(user._id.toString(), user.username);
    const tier = getTierByRating(user.rating);
    
    res.json({
      success: true,
      token,
      user: {
        userId: user._id.toString(),
        username: user.username,
        rating: user.rating,
        tier: tier.name,
        tierColor: tier.color,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws
      }
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({ error: '회원가입 중 오류가 발생했습니다.' });
  }
});

// 로그인 API
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '사용자 이름과 비밀번호를 입력해주세요.' });
    }
    
    // 사용자 찾기
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: '사용자 이름 또는 비밀번호가 올바르지 않습니다.' });
    }
    
    // 비밀번호 확인
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '사용자 이름 또는 비밀번호가 올바르지 않습니다.' });
    }
    
    // 토큰 생성
    const token = generateToken(user._id.toString(), user.username);
    const tier = getTierByRating(user.rating);
    
    res.json({
      success: true,
      token,
      user: {
        userId: user._id.toString(),
        username: user.username,
        rating: user.rating,
        tier: tier.name,
        tierColor: tier.color,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws
      }
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ error: '로그인 중 오류가 발생했습니다.' });
  }
});

// 랭킹 API - 상위 N명
app.get('/api/ranking', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100; // 기본 100명
    const users = await User.find()
      .sort({ rating: -1 }) // 레이팅 내림차순
      .limit(limit)
      .select('username rating wins losses draws')
      .lean();
    
    // 티어 정보 추가
    const ranking = users.map((user, index) => {
      const tier = getTierByRating(user.rating);
      return {
        rank: index + 1,
        username: user.username,
        rating: user.rating,
        tier: tier.name,
        tierColor: tier.color,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws,
        totalGames: user.wins + user.losses + user.draws
      };
    });
    
    res.json({ success: true, ranking });
  } catch (error) {
    console.error('랭킹 조회 오류:', error);
    res.status(500).json({ error: '랭킹 조회 중 오류가 발생했습니다.' });
  }
});

// 사용자 순위 조회 API
app.get('/api/ranking/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    // 레이팅이 더 높은 사용자 수 계산
    const higherRatingCount = await User.countDocuments({
      rating: { $gt: user.rating }
    });
    
    const rank = higherRatingCount + 1;
    const tier = getTierByRating(user.rating);
    
    res.json({
      success: true,
      rank,
      user: {
        username: user.username,
        rating: user.rating,
        tier: tier.name,
        tierColor: tier.color,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws,
        totalGames: user.wins + user.losses + user.draws
      }
    });
  } catch (error) {
    console.error('사용자 순위 조회 오류:', error);
    res.status(500).json({ error: '순위 조회 중 오류가 발생했습니다.' });
  }
});

// 토큰 검증 API
app.post('/api/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: '토큰이 필요합니다.' });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    const tier = getTierByRating(user.rating);
    
    res.json({
      success: true,
      user: {
        userId: user._id.toString(),
        username: user.username,
        rating: user.rating,
        tier: tier.name,
        tierColor: tier.color,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws
      }
    });
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    res.status(500).json({ error: '토큰 검증 중 오류가 발생했습니다.' });
  }
});

// 게임 방 관리
const gameRooms = new Map(); // roomId -> { players: [], moves: [], lastCountry: null, usedCountries: Set, turn: 'player1'|'player2', mode: 'multiplayer'|'singleplayer' }
const waitingPlayersByTier = new Map(); // 티어별 대기 중인 플레이어 { tierName: [socket1, socket2, ...] }

// 게임 방 생성
function createGameRoom(mode = 'multiplayer') {
  const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return {
    id: roomId,
    players: [],
    moves: [],
    lastCountry: null,
    usedCountries: new Set(),
    turn: 'player1',
    mode: mode,
    started: false,
    player1Time: 30000, // 30초
    player2Time: 30000,
    timer: null
  };
}

// 싱글플레이 AI - 다음 국가 선택
function aiSelectCountry(usedCountries, lastCountry) {
  const available = getAvailableCountries(Array.from(usedCountries), lastCountry);
  if (available.length === 0) return null;
  
  // 랜덤 선택
  return available[Math.floor(Math.random() * available.length)].name;
}

// 게임 종료 처리
async function endGame(room, winner, reason) {
  if (room.timer) {
    clearTimeout(room.timer);
  }
  
  if (room.mode === 'multiplayer' && room.players.length === 2) {
    const [player1Socket, player2Socket] = room.players;
    
    try {
      const player1 = await User.findById(player1Socket.userId);
      const player2 = await User.findById(player2Socket.userId);
      
      if (player1 && player2) {
        let result;
        if (winner === 'player1') {
          result = 'player1';
          player1.wins += 1;
          player2.losses += 1;
        } else if (winner === 'player2') {
          result = 'player2';
          player1.losses += 1;
          player2.wins += 1;
        } else {
          result = 'draw';
          player1.draws += 1;
          player2.draws += 1;
        }
        
        // 레이팅 업데이트
        const ratingUpdate = updateRatings(player1.rating, player2.rating, result);
        player1.rating = ratingUpdate.player1.after;
        player2.rating = ratingUpdate.player2.after;
        
        await player1.save();
        await player2.save();
        
        // 게임 기록 저장
        const game = new Game({
          player1: player1._id,
          player2: player2._id,
          mode: 'multiplayer',
          moves: room.moves.map(m => ({
            player: m.player,
            country: m.country
          })),
          winner: winner,
          reason: reason,
          player1RatingBefore: ratingUpdate.player1.before,
          player1RatingAfter: ratingUpdate.player1.after,
          player2RatingBefore: ratingUpdate.player2.before,
          player2RatingAfter: ratingUpdate.player2.after,
          endedAt: new Date()
        });
        await game.save();
        
        // 결과 전송
        io.to(room.id).emit('gameEnded', {
          winner: winner,
          reason: reason,
          ratingChanges: {
            player1: ratingUpdate.player1,
            player2: ratingUpdate.player2
          }
        });
      }
    } catch (error) {
      console.error('게임 종료 처리 오류:', error);
    }
  }
  
  // 방 정리
  room.players.forEach(socket => {
    socket.leave(room.id);
  });
  gameRooms.delete(room.id);
}

// Socket.IO 연결 처리
io.on('connection', async (socket) => {
  console.log('사용자 연결:', socket.id, socket.username);
  
    // 이미 인증 미들웨어를 통해 인증 완료됨
    // 사용자 정보 전송
    try {
      const user = await User.findById(socket.userId);
      if (user) {
        const tier = getTierByRating(user.rating);
        socket.userRating = user.rating;
        socket.userTier = tier.name;
        
        socket.emit('authenticated', {
          userId: socket.userId,
          username: socket.username,
          rating: user.rating,
          tier: tier.name,
          tierColor: tier.color,
          wins: user.wins,
          losses: user.losses,
          draws: user.draws
        });
      }
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
      socket.emit('error', { message: '사용자 정보를 불러올 수 없습니다.' });
    }
  
  // 싱글플레이 시작
  socket.on('startSinglePlayer', async () => {
    if (!socket.userId) {
      socket.emit('error', { message: '먼저 인증해주세요.' });
      return;
    }
    
    const room = createGameRoom('singleplayer');
    room.players.push(socket);
    room.started = true;
    room.turn = 'player1';
    
    socket.join(room.id);
    gameRooms.set(room.id, room);
    
    socket.emit('gameStarted', {
      roomId: room.id,
      mode: 'singleplayer',
      turn: 'player1',
      lastCountry: null,
      playerRole: 'player1'
    });
    
    // 싱글플레이 첫 번째 플레이어를 위한 타이머 시작 (30초)
    room.timer = setTimeout(() => {
      // 시간 초과 - 플레이어가 시간 초과로 패배
      endGame(room, 'player2', 'timeout');
    }, 30000);
  });
  
  // 멀티플레이 매칭
  socket.on('findMatch', async () => {
    if (!socket.userId) {
      socket.emit('error', { message: '먼저 인증해주세요.' });
      return;
    }
    
    // 사용자 정보 가져오기
    const user = await User.findById(socket.userId);
    if (!user) {
      socket.emit('error', { message: '사용자 정보를 찾을 수 없습니다.' });
      return;
    }
    
    const tier = getTierByRating(user.rating);
    socket.userRating = user.rating;
    socket.userTier = tier.name;
    
    // 같은 티어의 대기열 가져오기
    if (!waitingPlayersByTier.has(tier.name)) {
      waitingPlayersByTier.set(tier.name, []);
    }
    
    const waitingQueue = waitingPlayersByTier.get(tier.name);
    
    // 이미 대기 중이면 제거
    const index = waitingQueue.findIndex(p => p.id === socket.id);
    if (index !== -1) {
      waitingQueue.splice(index, 1);
    }
    
    // 대기열에 추가
    waitingQueue.push(socket);
    socket.emit('matching', { message: `매칭 중... (${tier.name} 티어)` });
    
    // 같은 티어에서 매칭 가능한 플레이어 찾기
    if (waitingQueue.length >= 2) {
      const player1 = waitingQueue.shift();
      const player2 = waitingQueue.shift();
      
      const room = createGameRoom('multiplayer');
      room.players.push(player1, player2);
      room.started = true;
      room.turn = 'player1';
      
      player1.join(room.id);
      player2.join(room.id);
      gameRooms.set(room.id, room);
      
      // 게임 시작 알림 (각 플레이어에게 자신의 역할 전달)
      player1.emit('gameStarted', {
        roomId: room.id,
        mode: 'multiplayer',
        turn: 'player1',
        lastCountry: null,
        playerRole: 'player1'
      });
      
      player2.emit('gameStarted', {
        roomId: room.id,
        mode: 'multiplayer',
        turn: 'player1',
        lastCountry: null,
        playerRole: 'player2'
      });
      
      // 첫 번째 플레이어를 위한 타이머 시작 (30초)
      room.timer = setTimeout(() => {
        // 시간 초과 - player1이 시간 초과로 패배
        endGame(room, 'player2', 'timeout');
      }, 30000);
    }
  });
  
  // 매칭 취소
  socket.on('cancelMatch', async () => {
    if (!socket.userTier) {
      const user = await User.findById(socket.userId);
      if (user) {
        const tier = getTierByRating(user.rating);
        socket.userTier = tier.name;
      } else {
        return;
      }
    }
    
    const waitingQueue = waitingPlayersByTier.get(socket.userTier);
    if (waitingQueue) {
      const index = waitingQueue.findIndex(p => p.id === socket.id);
      if (index !== -1) {
        waitingQueue.splice(index, 1);
        socket.emit('matchCancelled');
      }
    }
  });
  
  // 국가 제시
  socket.on('submitCountry', async (data) => {
    const { country, roomId } = data;
    
    if (!socket.userId) {
      socket.emit('error', { message: '먼저 인증해주세요.' });
      return;
    }
    
    const room = gameRooms.get(roomId);
    if (!room) {
      socket.emit('error', { message: '게임 방을 찾을 수 없습니다.' });
      return;
    }
    
    if (!room.started) {
      socket.emit('error', { message: '게임이 시작되지 않았습니다.' });
      return;
    }
    
    // 턴 확인
    const isPlayer1 = room.players[0].id === socket.id;
    const expectedTurn = isPlayer1 ? 'player1' : 'player2';
    
    if (room.turn !== expectedTurn) {
      socket.emit('error', { message: '당신의 턴이 아닙니다.' });
      return;
    }
    
    // 국가 검증
    const countryData = findCountry(country);
    if (!countryData) {
      socket.emit('error', { message: 'UN 승인국이 아닙니다.' });
      return;
    }
    
    // 이미 사용된 국가인지 확인
    if (room.usedCountries.has(country)) {
      socket.emit('error', { message: '이미 사용된 국가입니다.' });
      return;
    }
    
    // 끝말잇기 규칙 확인
    if (room.lastCountry) {
      const available = getAvailableCountries(Array.from(room.usedCountries), room.lastCountry);
      const isValid = available.some(c => c.name === country);
      
      if (!isValid) {
        socket.emit('error', { message: '끝말잇기 규칙에 맞지 않습니다.' });
        return;
      }
    }
    
    // 유효한 국가 - 게임 진행
    room.usedCountries.add(country);
    room.lastCountry = country;
    const currentPlayer = isPlayer1 ? 'player1' : 'player2';
    room.moves.push({
      player: currentPlayer,
      country: country,
      timestamp: new Date()
    });
    
    // 타이머 리셋
    if (room.timer) {
      clearTimeout(room.timer);
    }
    
    // 다음 턴으로 변경
    if (room.mode === 'singleplayer') {
      room.turn = 'player2'; // AI 턴
      
      // AI가 국가 선택
      setTimeout(() => {
        const aiCountry = aiSelectCountry(Array.from(room.usedCountries), room.lastCountry);
        
        if (!aiCountry) {
          // AI가 더 이상 국가를 제시할 수 없음 - 플레이어 승리
          endGame(room, 'player1', 'no_moves');
          return;
        }
        
        room.usedCountries.add(aiCountry);
        room.lastCountry = aiCountry;
        room.moves.push({
          player: 'computer',
          country: aiCountry,
          timestamp: new Date()
        });
        
        room.turn = 'player1';
        
        socket.emit('aiMove', {
          country: aiCountry,
          lastCountry: aiCountry,
          turn: 'player1'
        });
        
        // 플레이어가 더 이상 국가를 제시할 수 있는지 확인
        const playerAvailable = getAvailableCountries(Array.from(room.usedCountries), room.lastCountry);
        if (playerAvailable.length === 0) {
          // 컴퓨터 기권 (더 이상 제시할 국가가 없음)
          endGame(room, 'player2', 'surrender');
        }
      }, 1000);
    } else {
      // 멀티플레이
      // 다음 턴으로 변경
      room.turn = room.turn === 'player1' ? 'player2' : 'player1';
      
      // 상대방이 더 이상 국가를 제시할 수 있는지 확인
      const available = getAvailableCountries(Array.from(room.usedCountries), room.lastCountry);
      if (available.length === 0) {
        // 현재 플레이어 승리 (상대방이 더 이상 제시할 수 없음)
        endGame(room, currentPlayer, 'no_moves');
        return;
      }
      
      // 타이머 시작 (30초) - 현재 턴의 플레이어를 위한 타이머
      // room.turn은 이미 다음 플레이어로 변경되어 있으므로, 이 플레이어가 시간 초과되면 패배
      const timerTargetPlayer = room.turn; // 시간 초과 대상 플레이어
      room.timer = setTimeout(() => {
        // 시간 초과 - timerTargetPlayer가 시간 초과로 패배, 상대방 승리
        const winner = timerTargetPlayer === 'player1' ? 'player2' : 'player1';
        endGame(room, winner, 'timeout');
      }, 30000);
    }
    
    // 모든 플레이어에게 업데이트 전송
    io.to(room.id).emit('countrySubmitted', {
      player: currentPlayer,
      country: country,
      lastCountry: room.lastCountry,
      turn: room.turn,
      usedCountries: Array.from(room.usedCountries)
    });
  });
  
  // 기권
  socket.on('surrender', async (data) => {
    const { roomId } = data;
    
    if (!socket.userId) {
      socket.emit('error', { message: '먼저 인증해주세요.' });
      return;
    }
    
    const room = gameRooms.get(roomId);
    if (!room) {
      socket.emit('error', { message: '게임 방을 찾을 수 없습니다.' });
      return;
    }
    
    if (!room.started) {
      socket.emit('error', { message: '게임이 시작되지 않았습니다.' });
      return;
    }
    
    // 플레이어 식별
    const isPlayer1 = room.players[0].id === socket.id;
    const surrenderingPlayer = isPlayer1 ? 'player1' : 'player2';
    const winner = isPlayer1 ? 'player2' : 'player1';
    
    // 기권 처리
    endGame(room, winner, 'surrender');
  });
  
  // 연결 해제 처리
  socket.on('disconnect', () => {
    console.log('사용자 연결 해제:', socket.id);
    
    // 대기열에서 제거 (티어별)
    if (socket.userTier) {
      const waitingQueue = waitingPlayersByTier.get(socket.userTier);
      if (waitingQueue) {
        const index = waitingQueue.findIndex(p => p.id === socket.id);
        if (index !== -1) {
          waitingQueue.splice(index, 1);
        }
      }
    } else {
      // 티어 정보가 없으면 모든 티어에서 검색
      for (const [tierName, queue] of waitingPlayersByTier.entries()) {
        const index = queue.findIndex(p => p.id === socket.id);
        if (index !== -1) {
          queue.splice(index, 1);
          break;
        }
      }
    }
    
    // 게임 방에서 제거
    for (const [roomId, room] of gameRooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        // 게임 중이면 상대방 승리 처리
        if (room.started && room.mode === 'multiplayer') {
          const winner = playerIndex === 0 ? 'player2' : 'player1';
          endGame(room, winner, 'disconnect');
        } else {
          // 싱글플레이는 그냥 종료
          if (room.timer) {
            clearTimeout(room.timer);
          }
          gameRooms.delete(roomId);
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3000;

// Vercel이 아닌 환경에서만 서버 시작
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  });
}

// Vercel 배포를 위한 핸들러 export
// Vercel은 서버리스 함수로 작동하므로 app을 export
module.exports = app;

