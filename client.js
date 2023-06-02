const io = require('socket.io-client')
const serverUrl = "http://192.168.1.104:4000"
const socket = io(serverUrl)

function generateMove(board, playerTurnID) {
  const maxDepth = 6;
  const availableMoves = getAvailableMoves(board);
  const scores = [];

  for (let move of availableMoves) {
    const newBoard = makeMove(board, move, playerTurnID);
    const score = minimax(newBoard, maxDepth, -Infinity, Infinity, false, playerTurnID);
    scores.push(score);
  }

  const maxScore = Math.max(...scores);
  const bestMoves = availableMoves.filter((_, index) => scores[index] === maxScore);
  const randomIndex = Math.floor(Math.random() * bestMoves.length);
  const columnIndex = bestMoves[randomIndex];

  return columnIndex;
}

function evaluateBoard(board, playerTurnID) {
  const opponentTurnID = playerTurnID === 1 ? 2 : 1;
  let score = 0;

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      const window = [];

      // Filas
      if (col + 3 < 7) {
        window.push(board[row][col], board[row][col + 1], board[row][col + 2], board[row][col + 3]);
        score += evaluateWindow(window, playerTurnID, opponentTurnID);
      }

      // Columnas
      if (row + 3 < 6) {
        window.push(board[row][col], board[row + 1][col], board[row + 2][col], board[row + 3][col]);
        score += evaluateWindow(window, playerTurnID, opponentTurnID);
      }

      // Diagonal ascendente
      if (row + 3 < 6 && col + 3 < 7) {
        window.push(board[row][col], board[row + 1][col + 1], board[row + 2][col + 2], board[row + 3][col + 3]);
        score += evaluateWindow(window, playerTurnID, opponentTurnID);
      }

      // Diagonal descendente
      if (row - 3 >= 0 && col + 3 < 7) {
        window.push(board[row][col], board[row - 1][col + 1], board[row - 2][col + 2], board[row - 3][col + 3]);
        score += evaluateWindow(window, playerTurnID, opponentTurnID);
      }
    }
  }

  return score;
}

function evaluateWindow(window, playerTurnID, opponentTurnID) {
  let score = 0;
  const playerPieces = window.filter((piece) => piece === playerTurnID).length;
  const opponentPieces = window.filter((piece) => piece === opponentTurnID).length;
  const emptySpaces = window.filter((piece) => piece === 0).length;

  if (playerPieces === 4) {
    score += 1000;
  } else if (playerPieces === 3 && emptySpaces === 1) {
    score += 100;
  } else if (playerPieces === 2 && emptySpaces === 2) {
    score += 10;
  }

  if (opponentPieces === 3 && emptySpaces === 1) {
    score -= 80;
  } else if (opponentPieces === 2 && emptySpaces === 2) {
    score -= 20;
  }

  return score;
}

function minimax(board, depth, alpha, beta, maximizingPlayer, playerTurnID) {
  const availableMoves = getAvailableMoves(board);

  if (depth === 0 || availableMoves.length === 0) {
    return evaluateBoard(board, playerTurnID);
  }

  if (maximizingPlayer) {
    let maxScore = -Infinity;

    for (let move of availableMoves) {
      const newBoard = makeMove(board, move, playerTurnID);
      const score = minimax(newBoard, depth - 1, alpha, beta, false, playerTurnID);
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (alpha >= beta) break;
    }

    return maxScore;
  } else {
    let minScore = Infinity;

    for (let move of availableMoves) {
      const newBoard = makeMove(board, move, playerTurnID === 1 ? 2 : 1);
      const score = minimax(newBoard, depth - 1, alpha, beta, true, playerTurnID);
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }

    return minScore;
  }
}

function getAvailableMoves(board) {
  const availableMoves = [];

  for (let col = 0; col < 7; col++) {
    if (board[0][col] === 0) {
      availableMoves.push(col);
    }
  }

  return availableMoves;
}

function makeMove(board, columnIndex, playerTurnID) {
  const newBoard = [...board.map((row) => [...row])];

  for (let row = 5; row >= 0; row--) {
    if (newBoard[row][columnIndex] === 0) {
      newBoard[row][columnIndex] = playerTurnID;
      break;
    }
  }

  return newBoard;
}




socket.on('connect', () => {
    console.log("Connected to server")

    socket.emit('signin', {
        user_name: "Zyzz",
        tournament_id:142857,
        user_role: 'player'
    })
})

socket.on('ok_signin', () => {
    console.log("Login")
})

socket.on('finish', function(data){
    var gameID = data.game_id;
    var playerTurnID = data.player_turn_id;
    var winnerTurnID = data.winner_turn_id;
    var board = data.board;
  });


socket.on('ready', function(data){
var gameID = data.game_id;
var playerTurnID = data.player_turn_id;
var board = data.board;
console.log("soy el jugador", playerTurnID)
console.log(board)

// TODO: Your logic / user input here
const move = generateMove(board, playerTurnID);

console.log("tiro realizado en ", move)
socket.emit('play', {
    tournament_id: 142857,
    player_turn_id: playerTurnID,
    game_id: gameID,
    movement: move
    });
});

socket.on('finish', function(data){
    var gameID = data.game_id;
    var playerTurnID = data.player_turn_id;
    var winnerTurnID = data.winner_turn_id;
    var board = data.board;
    
    // TODO: Your cleaning board logic here
    
    console.log("el ganador es", winnerTurnID)
    console.log(board)
    socket.emit('player_ready', {
      tournament_id: 142857,
      player_turn_id: playerTurnID,
      game_id: gameID
    });
  });