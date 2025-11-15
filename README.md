# 나라 이름 끝말잇기 게임

UN 승인국으로 끝말잇기를 즐기는 멀티플레이 게임입니다.

## 기능

- 🎮 싱글플레이 (컴퓨터와 대전)
- 🌐 멀티플레이 (실시간 매칭)
- 🏆 티어 시스템 (브론즈 ~ 챌린저)
- 📊 레이팅 시스템 (ELO)
- 🎯 랭킹 시스템
- 🔐 로그인/회원가입

## 로컬 개발

### 필요 사항

- Node.js 14 이상
- MongoDB

### 설치

```bash
npm install
```

### 환경 변수 설정

`.env` 파일을 생성하고 다음 변수를 설정하세요:

```
MONGODB_URI=mongodb://localhost:27017/country-word-chain
MONGODB_DB_NAME=country-word-chain
JWT_SECRET=your-secret-key-change-in-production
PORT=3000
```

### 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## Vercel 배포

### 1. Vercel CLI 설치

```bash
npm i -g vercel
```

### 2. 배포

```bash
vercel --prod
```

### 3. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

- `MONGODB_URI`: MongoDB 연결 URI
- `MONGODB_DB_NAME`: 데이터베이스 이름
- `JWT_SECRET`: JWT 토큰 시크릿 키

### 주의사항

- Socket.IO는 Vercel의 서버리스 환경에서 제한적으로 작동할 수 있습니다.
- 프로덕션 환경에서는 MongoDB Atlas와 같은 클라우드 MongoDB 서비스를 사용하는 것을 권장합니다.

## 티어 시스템

- 브론즈: 0-1199
- 실버: 1200-1499
- 골드: 1500-1799
- 플래티넘: 1800-2099
- 다이아몬드: 2100-2399
- 마스터: 2400-2699
- 그랜드마스터: 2700-2999
- 챌린저: 3000+

## 게임 규칙

1. UN 승인국만 사용 가능
2. 자음으로 이어야 함 (예: 가나 → 니제르, ㄴ을 이음)
3. 받침이 있으면 받침 사용, 없으면 마지막 글자의 초성 사용
4. 30초 내에 국가를 제시해야 함
5. 이미 사용된 국가는 사용 불가

## 기술 스택

- Node.js
- Express
- Socket.IO
- MongoDB (Mongoose)
- EJS
- JWT
- bcryptjs

