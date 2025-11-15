const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  player1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  player2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mode: {
    type: String,
    enum: ['multiplayer', 'singleplayer'],
    required: true
  },
  moves: [{
    player: {
      type: String, // 'player1' or 'player2' or 'computer'
      required: true
    },
    country: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  winner: {
    type: String, // 'player1', 'player2', 'draw', null
    default: null
  },
  reason: {
    type: String, // 'timeout', 'invalid', 'no_moves', 'disconnect'
    default: null
  },
  player1RatingBefore: {
    type: Number,
    default: null
  },
  player1RatingAfter: {
    type: Number,
    default: null
  },
  player2RatingBefore: {
    type: Number,
    default: null
  },
  player2RatingAfter: {
    type: Number,
    default: null
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Game', gameSchema);

