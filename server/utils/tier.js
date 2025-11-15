// 티어 시스템
// 레이팅에 따라 티어 결정

const TIERS = [
  { name: '브론즈', minRating: 0, maxRating: 1199, color: '#CD7F32' },
  { name: '실버', minRating: 1200, maxRating: 1499, color: '#C0C0C0' },
  { name: '골드', minRating: 1500, maxRating: 1799, color: '#FFD700' },
  { name: '플래티넘', minRating: 1800, maxRating: 2099, color: '#E5E4E2' },
  { name: '다이아몬드', minRating: 2100, maxRating: 2399, color: '#B9F2FF' },
  { name: '마스터', minRating: 2400, maxRating: 2699, color: '#FF6B9D' },
  { name: '그랜드마스터', minRating: 2700, maxRating: 2999, color: '#C77DFF' },
  { name: '챌린저', minRating: 3000, maxRating: Infinity, color: '#FF0000' }
];

// 레이팅으로 티어 찾기
function getTierByRating(rating) {
  for (const tier of TIERS) {
    if (rating >= tier.minRating && rating <= tier.maxRating) {
      return tier;
    }
  }
  // 기본값 (브론즈)
  return TIERS[0];
}

// 티어 이름으로 티어 찾기
function getTierByName(tierName) {
  return TIERS.find(tier => tier.name === tierName) || TIERS[0];
}

// 티어 목록 반환
function getAllTiers() {
  return TIERS;
}

module.exports = {
  getTierByRating,
  getTierByName,
  getAllTiers,
  TIERS
};

