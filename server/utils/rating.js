// ELO 레이팅 시스템 구현
// 상대방의 레이팅도 고려하여 레이팅 변화 계산

function calculateExpectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function calculateRatingChange(rating, expectedScore, actualScore, kFactor = 32) {
  return Math.round(kFactor * (actualScore - expectedScore));
}

function updateRatings(player1Rating, player2Rating, result) {
  // result: 'player1' (player1 승리), 'player2' (player2 승리), 'draw' (무승부)
  
  const expectedScore1 = calculateExpectedScore(player1Rating, player2Rating);
  const expectedScore2 = calculateExpectedScore(player2Rating, player1Rating);
  
  let actualScore1, actualScore2;
  
  if (result === 'player1') {
    actualScore1 = 1;
    actualScore2 = 0;
  } else if (result === 'player2') {
    actualScore1 = 0;
    actualScore2 = 1;
  } else { // draw
    actualScore1 = 0.5;
    actualScore2 = 0.5;
  }
  
  const ratingChange1 = calculateRatingChange(player1Rating, expectedScore1, actualScore1);
  const ratingChange2 = calculateRatingChange(player2Rating, expectedScore2, actualScore2);
  
  const newRating1 = player1Rating + ratingChange1;
  const newRating2 = player2Rating + ratingChange2;
  
  return {
    player1: {
      before: player1Rating,
      after: Math.max(0, newRating1), // 레이팅은 0 이상
      change: ratingChange1
    },
    player2: {
      before: player2Rating,
      after: Math.max(0, newRating2),
      change: ratingChange2
    }
  };
}

module.exports = {
  updateRatings,
  calculateExpectedScore,
  calculateRatingChange
};

