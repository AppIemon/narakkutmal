let socket = null;
let authToken = null;
let currentScreen = 'loginScreen';
let currentRoomId = null;
let currentMode = null;
let gameTimer = null;
let timeLeft = 30;
let playerRole = null; // 'player1' or 'player2'

// 토큰 저장/불러오기
function saveToken(token) {
    localStorage.setItem('authToken', token);
    authToken = token;
}

function loadToken() {
    authToken = localStorage.getItem('authToken');
    return authToken;
}

function removeToken() {
    localStorage.removeItem('authToken');
    authToken = null;
}

// Socket.IO 연결 (토큰과 함께)
function connectSocket(token) {
    if (socket) {
        socket.disconnect();
    }
    
    socket = io({
        auth: {
            token: token
        }
    });
    
    setupSocketEvents();
}

// Socket.IO 이벤트 설정
function setupSocketEvents() {
    socket.on('connect', () => {
        console.log('Socket 연결됨');
    });
    
    socket.on('connect_error', (error) => {
        console.error('Socket 연결 오류:', error);
        if (error.message.includes('인증') || error.message.includes('토큰')) {
            showNotification('인증이 만료되었습니다. 다시 로그인해주세요.', 'error');
            removeToken();
            showScreen('loginScreen');
        }
    });
    
    socket.on('authenticated', (data) => {
        updateUserInfo(data);
        showScreen('menuScreen');
        showNotification('로그인 성공!', 'success');
    });
    
    socket.on('error', (data) => {
        showNotification(data.message, 'error');
    });
    
    socket.on('matching', (data) => {
        showNotification(data.message, 'info');
    });
    
    socket.on('matchCancelled', () => {
        document.getElementById('matchingStatus').classList.add('hidden');
        showNotification('매칭이 취소되었습니다.', 'info');
    });
    
    socket.on('gameStarted', (data) => {
        currentRoomId = data.roomId;
        currentMode = data.mode;
        playerRole = data.playerRole || 'player1'; // 기본값은 player1
        
        document.getElementById('gameMode').textContent = data.mode === 'singleplayer' ? '싱글플레이' : '멀티플레이';
        document.getElementById('lastCountry').textContent = data.lastCountry || '-';
        document.getElementById('countryList').innerHTML = '';
        
        const countryInput = document.getElementById('countryInput');
        countryInput.value = ''; // 입력 필드 초기화
        
        // 자신의 턴인지 확인
        const isMyTurn = data.turn === playerRole;
        
        if (isMyTurn) {
            document.getElementById('gameTurn').textContent = '당신의 턴';
            countryInput.disabled = false;
            countryInput.focus();
            startTimer();
        } else {
            document.getElementById('gameTurn').textContent = '상대방의 턴';
            countryInput.disabled = true;
        }
        
        showScreen('gameScreen');
        document.getElementById('matchingStatus').classList.add('hidden');
    });
    
    socket.on('countrySubmitted', (data) => {
        updateUsedCountries(data.usedCountries);
        document.getElementById('lastCountry').textContent = data.lastCountry;
        
        const countryInput = document.getElementById('countryInput');
        countryInput.value = ''; // 입력 필드 초기화
        
        // 자신의 턴인지 확인
        const isMyTurn = data.turn === playerRole;
        
        if (isMyTurn) {
            document.getElementById('gameTurn').textContent = '당신의 턴';
            countryInput.disabled = false;
            countryInput.removeAttribute('disabled'); // 확실하게 활성화
            countryInput.focus();
            startTimer();
        } else {
            document.getElementById('gameTurn').textContent = '상대방의 턴';
            countryInput.disabled = true;
            countryInput.setAttribute('disabled', 'disabled'); // 확실하게 비활성화
            if (gameTimer) {
                clearInterval(gameTimer);
            }
        }
        
        // 누가 제시했는지 확인
        if (data.player === playerRole) {
            showNotification(`당신이 "${data.country}"를 제시했습니다.`, 'success');
        } else {
            showNotification(`상대방이 "${data.country}"를 제시했습니다.`, 'info');
        }
    });
    
    socket.on('aiMove', (data) => {
        updateUsedCountries(Array.from(new Set([...Array.from(document.querySelectorAll('.country-tag')).map(el => el.textContent), data.country])));
        document.getElementById('lastCountry').textContent = data.lastCountry;
        
        const countryInput = document.getElementById('countryInput');
        countryInput.value = ''; // 입력 필드 초기화
        
        if (data.turn === 'player1') {
            document.getElementById('gameTurn').textContent = '당신의 턴';
            countryInput.disabled = false;
            countryInput.removeAttribute('disabled'); // 확실하게 활성화
            countryInput.focus();
            startTimer();
        }
        
        showNotification(`컴퓨터가 "${data.country}"를 제시했습니다.`, 'info');
    });
    
    socket.on('gameEnded', (data) => {
        if (gameTimer) {
            clearInterval(gameTimer);
        }
        
        let title = '';
        let message = '';
        
        if (data.winner === 'player1') {
            title = '🎉 승리!';
            message = '축하합니다! 게임에서 승리하셨습니다.';
        } else if (data.winner === 'player2') {
            title = '😢 패배';
            message = '아쉽네요. 다음에는 승리하세요!';
        } else {
            title = '🤝 무승부';
            message = '무승부로 게임이 종료되었습니다.';
        }
        
        if (data.reason === 'timeout') {
            message += ' (시간 초과)';
        } else if (data.reason === 'no_moves') {
            message += ' (더 이상 제시할 국가가 없음)';
        } else if (data.reason === 'disconnect') {
            message += ' (상대방 연결 끊김)';
        } else if (data.reason === 'surrender') {
            if (data.winner === 'player1' && playerRole === 'player1') {
                message = '상대방이 기권했습니다. 승리하셨습니다!';
            } else if (data.winner === 'player2' && playerRole === 'player2') {
                message = '상대방이 기권했습니다. 승리하셨습니다!';
            } else if (data.winner === 'player1' && playerRole === 'player2') {
                message = '컴퓨터가 기권했습니다. 승리하셨습니다!';
            } else {
                message += ' (기권)';
            }
        }
        
        document.getElementById('gameEndTitle').textContent = title;
        document.getElementById('gameEndMessage').textContent = message;
        
        // 레이팅 변화 표시
        if (data.ratingChanges && currentMode === 'multiplayer') {
            const ratingChangesDiv = document.getElementById('ratingChanges');
            const ratingChangeDetails = document.getElementById('ratingChangeDetails');
            
            ratingChangesDiv.classList.remove('hidden');
            ratingChangeDetails.innerHTML = '';
            
            const player1Change = data.ratingChanges.player1;
            const player2Change = data.ratingChanges.player2;
            
            const change1 = document.createElement('div');
            change1.className = 'rating-change-item';
            change1.innerHTML = `
                <span>당신</span>
                <span class="${player1Change.change >= 0 ? 'rating-change-positive' : 'rating-change-negative'}">
                    ${player1Change.before} → ${player1Change.after} (${player1Change.change >= 0 ? '+' : ''}${player1Change.change})
                </span>
            `;
            ratingChangeDetails.appendChild(change1);
            
            const change2 = document.createElement('div');
            change2.className = 'rating-change-item';
            change2.innerHTML = `
                <span>상대방</span>
                <span class="${player2Change.change >= 0 ? 'rating-change-positive' : 'rating-change-negative'}">
                    ${player2Change.before} → ${player2Change.after} (${player2Change.change >= 0 ? '+' : ''}${player2Change.change})
                </span>
            `;
            ratingChangeDetails.appendChild(change2);
            
            // 사용자 정보 업데이트
            verifyTokenAndUpdate();
        } else {
            document.getElementById('ratingChanges').classList.add('hidden');
        }
        
        showScreen('gameEndScreen');
    });
}

// 화면 전환
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
}

// 알림 표시
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// 사용자 정보 업데이트
function updateUserInfo(userData) {
    document.getElementById('displayUsername').textContent = userData.username;
    document.getElementById('userRating').textContent = userData.rating;
    document.getElementById('userWins').textContent = userData.wins;
    document.getElementById('userLosses').textContent = userData.losses;
    document.getElementById('userDraws').textContent = userData.draws;
    
    // 티어 표시
    if (userData.tier) {
        const tierBadge = document.getElementById('tierBadge');
        const tierName = document.getElementById('tierName');
        tierBadge.style.display = 'block';
        tierName.textContent = userData.tier;
        if (userData.tierColor) {
            tierBadge.style.borderColor = userData.tierColor;
            tierBadge.style.color = userData.tierColor;
        }
    }
}

// 타이머 시작
function startTimer(seconds = 30) {
    timeLeft = seconds;
    updateTimerDisplay();
    
    if (gameTimer) {
        clearInterval(gameTimer);
    }
    
    gameTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(gameTimer);
            showNotification('시간 초과!', 'error');
        }
    }, 1000);
}

// 타이머 표시 업데이트
function updateTimerDisplay() {
    const timerEl = document.getElementById('timer');
    if (timerEl) {
        timerEl.textContent = `${timeLeft}초`;
        
        if (timeLeft <= 10) {
            timerEl.style.color = '#dc3545';
        } else {
            timerEl.style.color = '#f5576c';
        }
    }
}

// 사용된 국가 목록 업데이트
function updateUsedCountries(countries) {
    const countryList = document.getElementById('countryList');
    countryList.innerHTML = '';
    
    countries.forEach(country => {
        const tag = document.createElement('span');
        tag.className = 'country-tag';
        tag.textContent = country;
        countryList.appendChild(tag);
    });
}

// 토큰 검증 및 사용자 정보 업데이트
async function verifyTokenAndUpdate() {
    if (!authToken) return;
    
    try {
        const response = await fetch('/api/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: authToken })
        });
        
        const data = await response.json();
        if (data.success) {
            updateUserInfo(data.user);
        } else {
            removeToken();
            showScreen('loginScreen');
        }
    } catch (error) {
        console.error('토큰 검증 오류:', error);
    }
}

// 회원가입
async function register() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    
    if (!username || !password || !passwordConfirm) {
        showNotification('모든 필드를 입력해주세요.', 'error');
        return;
    }
    
    if (username.length < 3 || username.length > 20) {
        showNotification('사용자 이름은 3자 이상 20자 이하여야 합니다.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('비밀번호는 6자 이상이어야 합니다.', 'error');
        return;
    }
    
    if (password !== passwordConfirm) {
        showNotification('비밀번호가 일치하지 않습니다.', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            saveToken(data.token);
            updateUserInfo(data.user);
            connectSocket(data.token);
        } else {
            showNotification(data.error || '회원가입 실패', 'error');
        }
    } catch (error) {
        console.error('회원가입 오류:', error);
        showNotification('회원가입 중 오류가 발생했습니다.', 'error');
    }
}

// 로그인
async function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showNotification('사용자 이름과 비밀번호를 입력해주세요.', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            saveToken(data.token);
            updateUserInfo(data.user);
            connectSocket(data.token);
        } else {
            showNotification(data.error || '로그인 실패', 'error');
        }
    } catch (error) {
        console.error('로그인 오류:', error);
        showNotification('로그인 중 오류가 발생했습니다.', 'error');
    }
}

// 로그아웃
function logout() {
    removeToken();
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    showScreen('loginScreen');
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

// 이벤트 리스너
document.getElementById('loginBtn').addEventListener('click', login);
document.getElementById('registerBtn').addEventListener('click', register);

document.getElementById('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.add('active');
});

document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
});

// Enter 키로 제출
document.getElementById('loginUsername').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('loginPassword').focus();
    }
});

document.getElementById('loginPassword').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        login();
    }
});

document.getElementById('registerUsername').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('registerPassword').focus();
    }
});

document.getElementById('registerPassword').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('registerPasswordConfirm').focus();
    }
});

document.getElementById('registerPasswordConfirm').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        register();
    }
});

document.getElementById('singlePlayerBtn').addEventListener('click', () => {
    if (!socket) {
        showNotification('연결이 끊어졌습니다. 다시 로그인해주세요.', 'error');
        return;
    }
    socket.emit('startSinglePlayer');
    showNotification('싱글플레이 게임을 시작합니다...', 'success');
});

document.getElementById('multiPlayerBtn').addEventListener('click', () => {
    if (!socket) {
        showNotification('연결이 끊어졌습니다. 다시 로그인해주세요.', 'error');
        return;
    }
    socket.emit('findMatch');
    document.getElementById('matchingStatus').classList.remove('hidden');
});

document.getElementById('cancelMatchBtn').addEventListener('click', () => {
    if (socket) {
        socket.emit('cancelMatch');
    }
    document.getElementById('matchingStatus').classList.add('hidden');
});

document.getElementById('submitBtn').addEventListener('click', () => {
    submitCountry();
});

document.getElementById('countryInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitCountry();
    }
});

document.getElementById('backToMenuBtn').addEventListener('click', () => {
    showScreen('menuScreen');
    currentRoomId = null;
    currentMode = null;
    playerRole = null;
    if (gameTimer) {
        clearInterval(gameTimer);
    }
    // input 상태 초기화
    const countryInput = document.getElementById('countryInput');
    if (countryInput) {
        countryInput.disabled = false;
        countryInput.value = '';
    }
});

document.getElementById('backToMenuAfterEndBtn').addEventListener('click', () => {
    showScreen('menuScreen');
    currentRoomId = null;
    currentMode = null;
    playerRole = null;
    if (gameTimer) {
        clearInterval(gameTimer);
    }
    // input 상태 초기화
    const countryInput = document.getElementById('countryInput');
    if (countryInput) {
        countryInput.disabled = false;
        countryInput.value = '';
    }
    verifyTokenAndUpdate();
});

document.getElementById('surrenderBtn').addEventListener('click', () => {
    if (!currentRoomId || !socket) {
        showNotification('게임이 시작되지 않았습니다.', 'error');
        return;
    }
    
    if (confirm('정말 기권하시겠습니까?')) {
        socket.emit('surrender', { roomId: currentRoomId });
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    logout();
});

document.getElementById('rankingBtn').addEventListener('click', () => {
    loadRanking();
    showScreen('rankingScreen');
});

document.getElementById('backToMenuFromRankingBtn').addEventListener('click', () => {
    showScreen('menuScreen');
});

// 국가 제출
function submitCountry() {
    if (!currentRoomId || !socket) {
        showNotification('게임이 시작되지 않았습니다.', 'error');
        return;
    }
    
    const country = document.getElementById('countryInput').value.trim();
    if (!country) {
        showNotification('나라 이름을 입력하세요.', 'error');
        return;
    }
    
    socket.emit('submitCountry', {
        country: country,
        roomId: currentRoomId
    });
    
    document.getElementById('countryInput').value = '';
}

// 랭킹 로드
async function loadRanking() {
    const rankingList = document.getElementById('rankingList');
    rankingList.innerHTML = '<div class="loading">랭킹을 불러오는 중...</div>';
    
    try {
        // 상위 100명 랭킹
        const response = await fetch('/api/ranking?limit=100');
        const data = await response.json();
        
        if (data.success) {
            rankingList.innerHTML = '';
            
            // 사용자 순위 조회
            if (authToken) {
                try {
                    const verifyResponse = await fetch('/api/verify', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ token: authToken })
                    });
                    
                    const verifyData = await verifyResponse.json();
                    if (verifyData.success) {
                        const userRankResponse = await fetch(`/api/ranking/user/${verifyData.user.userId}`);
                        const userRankData = await userRankResponse.json();
                        
                        if (userRankData.success) {
                            const userRankInfo = document.getElementById('userRankInfo');
                            userRankInfo.innerHTML = `
                                <h3>내 순위</h3>
                                <div class="rank-item user-rank">
                                    <span class="rank-number">${userRankData.rank}위</span>
                                    <span class="rank-username">${userRankData.user.username}</span>
                                    <span class="rank-rating">${userRankData.user.rating}</span>
                                    <span class="rank-tier" style="border-color: ${userRankData.user.tierColor}; color: ${userRankData.user.tierColor};">${userRankData.user.tier}</span>
                                </div>
                            `;
                        }
                    }
                } catch (error) {
                    console.error('사용자 순위 조회 오류:', error);
                    document.getElementById('userRankInfo').innerHTML = '';
                }
            } else {
                document.getElementById('userRankInfo').innerHTML = '';
            }
            
            // 랭킹 목록 표시
            data.ranking.forEach((player, index) => {
                const rankItem = document.createElement('div');
                rankItem.className = `rank-item ${index < 3 ? 'top-3' : ''}`;
                
                let medal = '';
                if (index === 0) medal = '🥇';
                else if (index === 1) medal = '🥈';
                else if (index === 2) medal = '🥉';
                
                rankItem.innerHTML = `
                    <span class="rank-number">${medal} ${player.rank}위</span>
                    <span class="rank-username">${player.username}</span>
                    <span class="rank-rating">${player.rating}</span>
                    <span class="rank-tier" style="border-color: ${player.tierColor}; color: ${player.tierColor};">${player.tier}</span>
                `;
                
                rankingList.appendChild(rankItem);
            });
        } else {
            rankingList.innerHTML = '<div class="loading">랭킹을 불러올 수 없습니다.</div>';
        }
    } catch (error) {
        console.error('랭킹 로드 오류:', error);
        rankingList.innerHTML = '<div class="loading">랭킹을 불러오는 중 오류가 발생했습니다.</div>';
    }
}

// 페이지 로드 시 토큰 확인
window.addEventListener('load', async () => {
    const token = loadToken();
    if (token) {
        // 토큰 검증
        try {
            const response = await fetch('/api/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            });
            
            const data = await response.json();
            if (data.success) {
                authToken = token;
                updateUserInfo(data.user);
                connectSocket(token);
                showScreen('menuScreen');
            } else {
                removeToken();
                document.getElementById('loginUsername').focus();
            }
        } catch (error) {
            console.error('토큰 검증 오류:', error);
            removeToken();
            document.getElementById('loginUsername').focus();
        }
    } else {
        document.getElementById('loginUsername').focus();
    }
});
