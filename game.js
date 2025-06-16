// --- DOM ELEMENTS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const homeScreen = document.getElementById('homeScreen');
const scanScreen = document.getElementById('scanScreen');
const welcomeScreen = document.getElementById('welcomeScreen');
const gameOverScreen = document.getElementById('gameOverScreen');

const startButton = document.getElementById('startButton');
const retryButton = document.getElementById('retryButton');
const returnHomeButton = document.getElementById('returnHomeButton');
const homeButton = document.getElementById('homeButton');

const cameraFeed = document.getElementById('cameraFeed');
const scanStatus = document.getElementById('scanStatus');
const welcomeMessage = document.getElementById('welcomeMessage');
const countdownDisplay = document.getElementById('countdown');
const leaderboardList = document.getElementById('leaderboardList');
const finalScoreDisplay = document.getElementById('finalScore');
const playerRankDisplay = document.getElementById('playerRank');

// --- GAME STATE ---
let gameState = 'HOME';
let gameActive = false;
let currentPlayer = '';
let countdownValue = 5;
let countdownInterval;
let cameraStream;
let ocrTimeout;

// --- GAME VARIABLES ---
let birdY = canvas.height / 2;
let birdSpeed = 0;
const gravity = 0.1;
let score = 0;
let stars = [];
let obstacles = [];
let particles = [];
let starSpeed = 2;
let obstacleSpeed = 2;
let currentStarName = '';

// --- ASSETS ---
const birdFrames = ['owl_frame1.png', 'owl_frame2.png', 'owl_frame3.png', 'owl_frame4.png'];
let birdFrameIndex = 0;
let birdImg = new Image();
birdImg.src = birdFrames[birdFrameIndex];

const backgroundImg = new Image();
backgroundImg.src = 'background1b.png';
const foregroundImg = new Image();
foregroundImg.src = 'background1a.png';

const backgroundMusic = document.getElementById('backgroundMusic');
backgroundMusic.volume = 0.03;

const starAudios = [
  { audio: document.getElementById('tipuanukuAudio'), name: 'Tipuanuku', src: 'Tupuānuku.png', volume: 0.8 },
  { audio: document.getElementById('hiwaiterangiAudio'), name: 'Hiwaiterangi', src: 'Hiwa-i-te-rangi.png', volume: 0.8 },
  { audio: document.getElementById('matarikiAudio'), name: 'Matariki', src: 'Matariki.png', volume: 0.8 },
  { audio: document.getElementById('pohutukawaAudio'), name: 'Pohutukawa', src: 'Pōhutukawa.png', volume: 0.8 },
  { audio: document.getElementById('tipuarangiAudio'), name: 'Tipuarangi', src: 'Tupuārangi.png', volume: 0.8 },
  { audio: document.getElementById('ururangiAudio'), name: 'Ururangi', src: 'Ururangi.png', volume: 0.8 },
  { audio: document.getElementById('waipunarangiAudio'), name: 'Waipunarangi', src: 'Waipunarangi.png', volume: 0.8 },
  { audio: document.getElementById('waitaAudio'), name: 'Waita', src: 'Waitā.png', volume: 0.8 },
  { audio: document.getElementById('waitiAudio'), name: 'Waiti', src: 'Waitī.png', volume: 0.8 }
];

starAudios.forEach(s => s.audio.volume = s.volume);

// --- SCREENS ---
function switchScreen(screenName) {
  document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
  canvas.style.display = 'none';

  if (screenName === 'HOME') homeScreen.style.display = 'flex';
  else if (screenName === 'SCAN') scanScreen.style.display = 'flex';
  else if (screenName === 'WELCOME') welcomeScreen.style.display = 'flex';
  else if (screenName === 'GAMEOVER') gameOverScreen.style.display = 'flex';
  else if (screenName === 'PLAYING') canvas.style.display = 'block';
}

function showHomeScreen() {
  gameState = 'HOME';
  gameActive = false;
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  clearInterval(countdownInterval);
  clearTimeout(ocrTimeout);
  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;
  switchScreen('HOME');
  displayLeaderboard();
}

function showScanScreen() {
  gameState = 'SCAN';
  switchScreen('SCAN');
  scanStatus.textContent = 'Scanning for student name...';
  retryButton.classList.add('hidden');
  returnHomeButton.classList.add('hidden');

  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      cameraStream = stream;
      cameraFeed.srcObject = stream;

      ocrTimeout = setTimeout(() => {
        captureAndScan();
      }, 1000);
    })
    .catch(() => {
      scanStatus.textContent = 'Camera access denied.';
    });
}

function captureAndScan() {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = cameraFeed.videoWidth;
  tempCanvas.height = cameraFeed.videoHeight;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(cameraFeed, 0, 0);

  Tesseract.recognize(tempCanvas, 'eng')
    .then(({ data: { text } }) => {
      const nameMatch = text.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)?/);
      if (nameMatch) {
        currentPlayer = nameMatch[0];
        showWelcomeScreen();
      } else {
        scanStatus.textContent = 'No name detected. Try again.';
        retryButton.classList.remove('hidden');
        returnHomeButton.classList.remove('hidden');
      }
    })
    .catch(() => {
      scanStatus.textContent = 'OCR failed. Try again.';
      retryButton.classList.remove('hidden');
      returnHomeButton.classList.remove('hidden');
    });
}

function showWelcomeScreen() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  gameState = 'WELCOME';
  switchScreen('WELCOME');
  welcomeMessage.textContent = `Welcome, ${currentPlayer}!`;
  countdownValue = 5;
  countdownDisplay.textContent = countdownValue;
  countdownInterval = setInterval(() => {
    countdownValue--;
    countdownDisplay.textContent = countdownValue;
    if (countdownValue <= 0) {
      clearInterval(countdownInterval);
      startGame();
    }
  }, 1000);
}

function startGame() {
  gameState = 'PLAYING';
  gameActive = true;
  switchScreen('PLAYING');
  resetGame();
  backgroundMusic.currentTime = 0;
  backgroundMusic.play();
}

function showGameOverScreen() {
  gameState = 'GAMEOVER';
  gameActive = false;
  backgroundMusic.pause();
  switchScreen('GAMEOVER');

  const rank = saveScoreAndGetRank(currentPlayer, score);
  finalScoreDisplay.textContent = `Your Score: ${score}`;
  playerRankDisplay.textContent = `Your Rank: #${rank}`;
}

// --- EVENT LISTENERS ---
startButton.addEventListener('click', showScanScreen);
retryButton.addEventListener('click', showScanScreen);
returnHomeButton.addEventListener('click', showHomeScreen);
homeButton.addEventListener('click', showHomeScreen);

document.addEventListener('keydown', function (event) {
  if (event.code === 'Space' && gameState === 'PLAYING') {
    birdSpeed = -4;
  }
});

// --- GAME LOGIC OMITTED BELOW (unchanged from your file) ---
