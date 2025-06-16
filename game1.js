const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Variables
let birdY = canvas.height / 2;
let birdSpeed = 0;
const gravity = 0.1;
let gameActive = false;
let score = 0;
let stars = [];
let obstacles = [];
let particles = [];
let starSpeed = 2;
let obstacleSpeed = 2;
let currentStarName = '';  // Variable to store the current star name

// Load Bird Frames for Animation
const birdFrames = [
    'owl_frame1.png',
    'owl_frame2.png',
    'owl_frame3.png',
    'owl_frame4.png'
];
let birdFrameIndex = 0;
let birdImg = new Image();
birdImg.src = birdFrames[birdFrameIndex];

// Load Background and Foreground Images
const backgroundImg = new Image();
backgroundImg.src = 'background1b.png';

const foregroundImg = new Image();
foregroundImg.src = 'background1a.png';

// Load Obstacle Image
const obstacleImg = new Image();
obstacleImg.src = 'glowing_ball.png';  // Make sure this image file exists in the directory

// Load and reference Background Music
const backgroundMusic = document.getElementById('backgroundMusic');
backgroundMusic.volume = 0.03;

// Load Star Sounds and Set Volume
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

// Set volumes for star audios
starAudios.forEach(starAudio => {
    starAudio.audio.volume = starAudio.volume;
});

// Particle Class
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
        if (this.life < 0 && this.size > 0) {
            this.size -= 0.1;
        }
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

// Event Listener for Space Key
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        if (!gameActive) {
            backgroundMusic.play(); // Play the background music on the first interaction
        }
        if (gameActive) {
            birdSpeed = -4; // Adjust this value for bird's upward movement
        } else {
            gameActive = true;
            score = 0;
            stars = [];
            obstacles = [];
            particles = [];
            birdY = canvas.height / 2;
            birdSpeed = 0;
            starSpeed = 2;
            obstacleSpeed = 2;
            currentStarName = ''; // Reset the star name
        }
        console.log("Space pressed, gameActive:", gameActive);
    }
});

// Foreground animation variables
let fgX = 0;
const fgSpeed = 2; // Speed of the foreground animation

// Timer for Bird Animation
let lastFrameTime = 0;
function updateBirdAnimation(timestamp) {
    if (timestamp - lastFrameTime > 200) { // Change frame every 200 ms
        birdFrameIndex = (birdFrameIndex + 1) % birdFrames.length;
        birdImg.src = birdFrames[birdFrameIndex];
        lastFrameTime = timestamp;
    }
    requestAnimationFrame(updateBirdAnimation);
}

// Start Bird Animation Loop
requestAnimationFrame(updateBirdAnimation);

// Game Loop
function gameLoop(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Background
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

    // Draw Foreground
    ctx.drawImage(foregroundImg, fgX, 0, canvas.width, canvas.height);
    ctx.drawImage(foregroundImg, fgX + canvas.width, 0, canvas.width, canvas.height);

    // Move Foreground
    fgX -= fgSpeed;
    if (fgX <= -canvas.width) {
        fgX = 0;
    }

    // Draw Bird
    let birdWidth = 50; // Adjust the width for scaling
    let birdHeight = 50; // Adjust the height for scaling
    ctx.drawImage(birdImg, 50, birdY, birdWidth, birdHeight);

    // Update and Draw Particles
    particles = particles.filter(particle => particle.size > 0);
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    // Bird Physics
    if (gameActive) {
        birdSpeed += gravity;
        birdY += birdSpeed;
        console.log("Bird position:", birdY);

        // Add Stars and Obstacles
        if (Math.random() < 0.02) {
            const star = starAudios[Math.floor(Math.random() * starAudios.length)];
            const starImg = new Image();
            starImg.src = star.src;
            starImg.onload = () => {
                stars.push({ x: canvas.width, y: Math.random() * canvas.height, image: starImg, audio: star.audio, name: star.name });
            };
        }
        if (Math.random() < 0.01) {
            const obstacleImg = new Image();
            obstacleImg.src = 'glowing_ball.png';
            obstacleImg.onload = () => {
                obstacles.push({ x: canvas.width, y: Math.random() * canvas.height, image: obstacleImg });
            };
        }
        console.log("Stars count:", stars.length, "Obstacles count:", obstacles.length);

        // Move Stars
        stars = stars.filter(star => {
            star.x -= starSpeed;
            ctx.drawImage(star.image, star.x, star.y, 20, 20);
            return star.x > -20;
        });

        // Move Obstacles
        obstacles = obstacles.filter(obstacle => {
            obstacle.x -= obstacleSpeed;
            ctx.drawImage(obstacle.image, obstacle.x, obstacle.y, 30, 30);
            return obstacle.x > -30;
        });

        // Check Collisions
        stars.forEach(star => {
            if (Math.abs(star.x - 50) < 20 && Math.abs(star.y - birdY) < 20) {
                // Add particles on collision
                for (let i = 0; i < 10; i++) {
                    particles.push(new Particle(star.x, star.y));
                }

                if (star.name === 'Matariki') {
                    score += 2; // Increase score by 2 for Matariki star
                } else {
                    score += 1;
                }
                star.audio.play();
                star.x = -20; // Remove star
                currentStarName = star.name;  // Update the current star name
                console.log("Star collected:", star.name, "Score:", score);
                if (score % 10 === 0) {
                    starSpeed += 0.5;
                    obstacleSpeed += 0.5;
                    console.log("Speed increased: starSpeed =", starSpeed, "obstacleSpeed =", obstacleSpeed);
                }
            }
        });

        obstacles.forEach(obstacle => {
            if (Math.abs(obstacle.x - 50) < 20 && Math.abs(obstacle.y - birdY) < 20) {
                gameActive = false; // End game
                console.log("Game over - hit obstacle");
            }
        });

        // Check Boundaries
        if (birdY > canvas.height || birdY < 0) {
            gameActive = false; // End game
            console.log("Game over - out of bounds");
        }
    } else {
        ctx.fillStyle = '#fff';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Hopukina ngā Whetū', canvas.width / 2, canvas.height / 2 - 80);
        ctx.fillText('o Matariki', canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = '20px Arial';
        ctx.fillText('Help Ruru catch the stars of Matariki', canvas.width / 2, canvas.height / 2);
        ctx.fillText('and avoid the glowing spheres', canvas.width / 2, canvas.height / 2 + 30);
        ctx.font = '24px Arial';
        ctx.fillText('Press Space to Start', canvas.width / 2, canvas.height / 2 + 80);
    }

    // Display Current Star Name
    if (currentStarName) {
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(currentStarName, canvas.width / 2, 100);
    }

    // Display Score
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);

    requestAnimationFrame(gameLoop);
}

// Start Game Loop
requestAnimationFrame(gameLoop);
