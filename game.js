// --- DOM ELEMENTS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const homeScreen = document.getElementById('homeScreen');
const scanScreen = document.getElementById('scanScreen');
const welcomeScreen = document.getElementById('welcomeScreen');
const gameOverScreen = document.getElementById('gameOverScreen');

const startButton = document.getElementById('startButton');
const submitNameButton = document.getElementById('submitNameButton');
const homeButton = document.getElementById('homeButton');
const playerNameInput = document.getElementById('playerNameInput');
const cameraFeed = document.getElementById('cameraFeed');
const welcomeMessage = document.getElementById('welcomeMessage');
const countdownDisplay = document.getElementById('countdown');
const leaderboardList = document.getElementById('leaderboardList');
const finalScoreDisplay = document.getElementById('finalScore');
const playerRankDisplay = document.getElementById('playerRank');

// --- GAME STATE ---
let gameState = 'HOME'; // HOME, SCAN, WELCOME, PLAYING, GAMEOVER
let gameActive = false;
let currentPlayer = '';
let countdownValue = 5;
let countdownInterval;
let cameraStream;

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

// --- ASSET LOADING ---
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
starAudios.forEach(starAudio => { starAudio.audio.volume = starAudio.volume; });


// --- SCREEN & STATE MANAGEMENT ---

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
    switchScreen('HOME');
    displayLeaderboard();
}

function showScanScreen() {
    gameState = 'SCAN';
    switchScreen('SCAN');
    playerNameInput.value = '';
    // Start camera
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                cameraStream = stream;
                cameraFeed.srcObject = stream;
            })
            .catch(err => {
                console.error("Error accessing camera: ", err);
                // Hide camera if access is denied
                cameraFeed.style.display = 'none';
            });
    }
}

function showWelcomeScreen() {
    if(cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
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

// --- LEADERBOARD LOGIC ---

function getLeaderboard() {
    const board = JSON.parse(localStorage.getItem('matarikiLeaderboard')) || [];
    return board.sort((a, b) => b.score - a.score);
}

function saveScoreAndGetRank(name, score) {
    const board = getLeaderboard();
    board.push({ name, score });
    const sortedBoard = board.sort((a, b) => b.score - a.score);
    // Keep only top 5
    const finalBoard = sortedBoard.slice(0, 5);
    localStorage.setItem('matarikiLeaderboard', JSON.stringify(finalBoard));

    // Find player's rank
    const playerIndex = finalBoard.findIndex(p => p.name === name && p.score === score);
    return playerIndex !== -1 ? playerIndex + 1 : "N/A";
}

function displayLeaderboard() {
    const board = getLeaderboard();
    leaderboardList.innerHTML = '';
    if (board.length === 0) {
        leaderboardList.innerHTML = '<li>No scores yet!</li>';
    } else {
        board.forEach((player, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${index + 1}. ${player.name}</span><span>${player.score}</span>`;
            leaderboardList.appendChild(li);
        });
    }
}

// --- EVENT LISTENERS ---
startButton.addEventListener('click', showScanScreen);

submitNameButton.addEventListener('click', () => {
    const name = playerNameInput.value.trim();
    if (name) {
        currentPlayer = name;
        showWelcomeScreen();
    } else {
        alert("Please enter a name!");
    }
});

homeButton.addEventListener('click', showHomeScreen);

document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' && gameState === 'PLAYING') {
        birdSpeed = -4;
    }
});

// --- GAME LOGIC ---

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 2;
        this.speedX = (Math.random() * 2 - 1) * 2;
        this.speedY = (Math.random() * 2 - 1) * 2;
        this.color = 'rgba(255, 255, 255, 0.8)';
        this.life = Math.random() * 50 + 50;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life--;
        if (this.life < 0 && this.size > 0) this.size -= 0.1;
    }
    draw() {
        if (this.size > 0) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

let fgX = 0;
const fgSpeed = 2;

function resetGame() {
    birdY = canvas.height / 2;
    birdSpeed = 0;
    score = 0;
    stars = [];
    obstacles = [];
    particles = [];
    starSpeed = 2;
    obstacleSpeed = 2;
    currentStarName = '';
}

function gameLoop() {
    if (gameState === 'PLAYING') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // --- DRAWING ---
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(foregroundImg, fgX, 0, canvas.width, canvas.height);
        ctx.drawImage(foregroundImg, fgX + canvas.width, 0, canvas.width, canvas.height);
        fgX = (fgX - fgSpeed) % canvas.width;

        let birdWidth = 50, birdHeight = 50;
        ctx.drawImage(birdImg, 50, birdY, birdWidth, birdHeight);

        particles = particles.filter(p => p.size > 0);
        particles.forEach(p => { p.update(); p.draw(); });

        // --- PHYSICS & UPDATES ---
        birdSpeed += gravity;
        birdY += birdSpeed;

        // --- GENERATE & MOVE OBJECTS ---
        if (Math.random() < 0.02) {
            const starData = starAudios[Math.floor(Math.random() * starAudios.length)];
            const starImg = new Image();
            starImg.src = starData.src;
            starImg.onload = () => stars.push({ x: canvas.width, y: Math.random() * canvas.height, image: starImg, audio: starData.audio, name: starData.name });
        }
        if (Math.random() < 0.01) {
            const obstacleImg = new Image();
            obstacleImg.src = 'glowing_ball.png';
            obstacleImg.onload = () => obstacles.push({ x: canvas.width, y: Math.random() * canvas.height, image: obstacleImg });
        }

        stars.forEach(star => { star.x -= starSpeed; ctx.drawImage(star.image, star.x, star.y, 20, 20); });
        stars = stars.filter(star => star.x > -20);

        obstacles.forEach(obs => { obs.x -= obstacleSpeed; ctx.drawImage(obs.image, obs.x, obs.y, 30, 30); });
        obstacles = obstacles.filter(obs => obs.x > -30);

        // --- COLLISIONS & BOUNDARIES ---
        stars.forEach(star => {
            if (Math.abs(star.x - 50) < 20 && Math.abs(star.y - birdY) < 20) {
                for (let i = 0; i < 10; i++) particles.push(new Particle(star.x, star.y));
                score += (star.name === 'Matariki') ? 2 : 1;
                star.audio.play();
                star.x = -20;
                currentStarName = star.name;
                if (score > 0 && score % 10 === 0) { starSpeed += 0.5; obstacleSpeed += 0.5; }
            }
        });

        obstacles.forEach(obstacle => {
            if (Math.abs(obstacle.x - 50) < 20 && Math.abs(obstacle.y - birdY) < 20) {
                showGameOverScreen();
            }
        });

        if (birdY > canvas.height || birdY < 0) {
            showGameOverScreen();
        }

        // --- UI (SCORE, ETC.) ---
        if (currentStarName) {
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Fredoka One", cursive';
            ctx.textAlign = 'center';
            ctx.fillText(currentStarName, canvas.width / 2, 100);
        }
        ctx.fillStyle = '#fff';
        ctx.font = '24px "Fredoka One", cursive';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${score}`, 10, 30);

    }
    requestAnimationFrame(gameLoop);
}

// Bird animation loop (runs independently)
let lastFrameTime = 0;
function updateBirdAnimation(timestamp) {
    if (timestamp - lastFrameTime > 200) {
        birdFrameIndex = (birdFrameIndex + 1) % birdFrames.length;
        birdImg.src = birdFrames[birdFrameIndex];
        lastFrameTime = timestamp;
    }
    requestAnimationFrame(updateBirdAnimation);
}

// --- INITIALIZE ---
showHomeScreen();
requestAnimationFrame(gameLoop);
requestAnimationFrame(updateBirdAnimation);
