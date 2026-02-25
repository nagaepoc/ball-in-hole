// Ball in a Hole Maze - Main Game Logic

import { initPhysics, createBall, createHole, createWalls, updatePhysics, checkHoleCollision } from './physics.js';
import { initControls, getGravityVector } from './controls.js';
import { levels, getCurrentLevel, nextLevel, resetLevel } from './levels.js';
import { initPWA } from './pwa.js';

class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.5;
        this.init();
    }
    
    init() {
        this.loadSound('roll', 'assets/sounds/roll.mp3', { loop: true, volume: 0.3 });
        this.loadSound('win', 'assets/sounds/win.mp3', { volume: 0.7 });
        this.loadSound('bump', 'assets/sounds/bump.mp3', { volume: 0.4 });
    }
    
    loadSound(name, url, options = {}) {
        try {
            const audio = new Audio(url);
            audio.preload = 'auto';
            audio.volume = options.volume || this.volume;
            audio.loop = options.loop || false;
            
            audio.addEventListener('error', () => {
                console.warn(`Failed to load sound: ${name}`);
                this.sounds[name] = null;
            });
            
            this.sounds[name] = audio;
        } catch (error) {
            console.warn(`Could not create audio for ${name}:`, error);
            this.sounds[name] = null;
        }
    }
    
    play(name) {
        if (!this.enabled || !this.sounds[name]) return;
        
        try {
            const sound = this.sounds[name];
            sound.currentTime = 0;
            sound.play().catch(e => console.warn(`Could not play sound ${name}:`, e));
        } catch (error) {
            console.warn(`Error playing sound ${name}:`, error);
        }
    }
    
    stop(name) {
        if (!this.sounds[name]) return;
        
        try {
            const sound = this.sounds[name];
            sound.pause();
            sound.currentTime = 0;
        } catch (error) {
            console.warn(`Error stopping sound ${name}:`, error);
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.volume = this.volume;
            }
        });
    }
    
    toggle(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopAll();
        }
    }
    
    stopAll() {
        Object.keys(this.sounds).forEach(name => this.stop(name));
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.engine = null;
        this.ball = null;
        this.hole = null;
        this.walls = [];
        
        this.soundManager = new SoundManager();
        this.lastBallPosition = { x: 0, y: 0 };
        this.isBallMoving = false;
        this.lastCollisionTime = 0;
        this.gameScale = 1;
        this.isMobile = false;
        
        this.currentLevel = 1;
        this.moves = 0;
        this.startTime = null;
        this.gameTime = 0;
        this.timerInterval = null;
        this.gameRunning = false;
        
        this.init();
    }
    
    init() {
        this.detectIOS();
        this.setupCanvas();
        this.setupEventListeners();
        this.startGame();
        initPWA();
    }
    
    detectIOS() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           window.navigator.standalone;
        
        if (isIOS) {
            document.body.classList.add('ios');
            
            if (isStandalone) {
                document.body.style.paddingTop = 'env(safe-area-inset-top)';
                document.body.style.paddingBottom = 'env(safe-area-inset-bottom)';
            }
        }
    }
    
    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        this.isMobile = window.innerWidth <= 768;
        
        if (this.isMobile) {
            const targetWidth = containerRect.width * 0.95;
            const targetHeight = containerRect.height * 0.7;
            
            const width = Math.min(targetWidth, 800);
            const height = Math.min(targetHeight, 600);
            
            this.canvas.width = width * dpr;
            this.canvas.height = height * dpr;
            
            this.ctx.scale(dpr, dpr);
            this.canvas.style.width = `${width}px`;
            this.canvas.style.height = `${height}px`;
            
            this.gameScale = Math.min(width / 800, height / 600);
        } else {
            const maxWidth = Math.min(containerRect.width, 800);
            const maxHeight = Math.min(containerRect.height, 600);
            
            const scale = Math.min(maxWidth / 800, maxHeight / 600);
            const width = 800 * scale;
            const height = 600 * scale;
            
            this.canvas.width = width * dpr;
            this.canvas.height = height * dpr;
            
            this.ctx.scale(dpr, dpr);
            this.canvas.style.width = `${width}px`;
            this.canvas.style.height = `${height}px`;
            
            this.gameScale = scale;
        }
        
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }
    
    setupEventListeners() {
        document.getElementById('reset-btn').addEventListener('click', () => this.resetBall());
        document.getElementById('level-btn').addEventListener('click', () => this.loadNextLevel());
        document.getElementById('permission-btn').addEventListener('click', () => this.requestOrientationPermission());
        document.getElementById('sound-btn').addEventListener('click', () => this.toggleSound());
        
        window.addEventListener('resize', () => this.setupCanvas());
        window.addEventListener('orientationchange', () => setTimeout(() => this.setupCanvas(), 100));
        
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => this.handleViewportResize());
        }
        
        this.preventMobileScrolling();
        this.preventContextMenu();
        this.lockOrientation();
    }
    
    handleViewportResize() {
        if (window.visualViewport) {
            const viewport = window.visualViewport;
            document.body.style.height = `${viewport.height}px`;
            this.setupCanvas();
        }
    }
    
    lockOrientation() {
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('portrait').catch(() => {
            });
        } else if (screen.lockOrientation) {
            screen.lockOrientation('portrait');
        } else if (screen.mozLockOrientation) {
            screen.mozLockOrientation('portrait');
        } else if (screen.msLockOrientation) {
            screen.msLockOrientation('portrait');
        }
    }
    
    preventMobileScrolling() {
        document.addEventListener('touchmove', (e) => {
            if (e.target.tagName === 'CANVAS' || e.target.closest('.canvas-container')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        document.addEventListener('touchstart', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
                return;
            }
            e.preventDefault();
        }, { passive: false });
        
        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        });
        
        document.addEventListener('dblclick', (e) => {
            e.preventDefault();
        });
    }
    
    preventContextMenu() {
        document.addEventListener('contextmenu', (e) => {
            if (e.target.tagName === 'CANVAS') {
                e.preventDefault();
            }
        });
    }
    
    toggleSound() {
        const soundBtn = document.getElementById('sound-btn');
        const isEnabled = !this.soundManager.enabled;
        
        this.soundManager.toggle(isEnabled);
        
        if (isEnabled) {
            soundBtn.textContent = '🔊 Sound On';
            soundBtn.classList.remove('sound-off');
            soundBtn.classList.add('sound-on');
        } else {
            soundBtn.textContent = '🔇 Sound Off';
            soundBtn.classList.remove('sound-on');
            soundBtn.classList.add('sound-off');
        }
    }
    
    startGame() {
        this.engine = initPhysics(this.canvas, this.isMobile);
        initControls(this.handleOrientation.bind(this), this.isMobile);
        this.loadLevel(this.currentLevel);
        this.startTimer();
        this.gameRunning = true;
        this.gameLoop();
    }
    
    loadLevel(levelNumber) {
        const level = getCurrentLevel();
        this.currentLevel = levelNumber;
        
        document.getElementById('level').textContent = levelNumber;
        document.getElementById('moves').textContent = '0';
        this.moves = 0;
        
        this.resetPhysics();
        this.createLevelObjects(level);
        this.updateUI();
    }
    
    createLevelObjects(level) {
        const ballX = level.ballStart.x * this.gameScale;
        const ballY = level.ballStart.y * this.gameScale;
        const holeX = level.holePosition.x * this.gameScale;
        const holeY = level.holePosition.y * this.gameScale;
        
        this.ball = createBall(ballX, ballY, this.isMobile);
        this.hole = createHole(holeX, holeY, level.holePosition.radius, this.isMobile);
        this.walls = createWalls(level.maze, this.isMobile, this.gameScale);
        
        this.drawStaticElements();
    }
    
    drawStaticElements() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#34495e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.walls.forEach(wall => {
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.fillRect(wall.position.x - wall.width / 2, wall.position.y - wall.height / 2, wall.width, wall.height);
            
            this.ctx.strokeStyle = '#1a252f';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(wall.position.x - wall.width / 2, wall.position.y - wall.height / 2, wall.width, wall.height);
        });
        
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(this.hole.position.x, this.hole.position.y, this.hole.circleRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    handleOrientation(gravity) {
        if (this.engine && this.gameRunning) {
            this.engine.world.gravity.x = gravity.x;
            this.engine.world.gravity.y = gravity.y;
            this.moves++;
            document.getElementById('moves').textContent = this.moves;
        }
    }
    
    requestOrientationPermission() {
        const permissionPrompt = document.getElementById('orientation-permission');
        if (permissionPrompt) {
            permissionPrompt.style.display = 'none';
        }
        
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        initControls(this.handleOrientation.bind(this));
                    }
                })
                .catch(console.error);
        }
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        this.update();
        this.render();
        
        if (this.ball && this.hole && checkHoleCollision(this.ball, this.hole)) {
            this.levelComplete();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.engine) {
            updatePhysics(this.engine);
            this.checkBallMovement();
            this.checkCollisions();
        }
    }
    
    checkBallMovement() {
        if (!this.ball) return;
        
        const currentPos = { x: this.ball.position.x, y: this.ball.position.y };
        const velocity = Math.sqrt(this.ball.velocity.x ** 2 + this.ball.velocity.y ** 2);
        
        const distance = Math.sqrt(
            (currentPos.x - this.lastBallPosition.x) ** 2 + 
            (currentPos.y - this.lastBallPosition.y) ** 2
        );
        
        const isMoving = velocity > 0.1 || distance > 0.5;
        
        if (isMoving && !this.isBallMoving) {
            this.soundManager.play('roll');
            this.isBallMoving = true;
        } else if (!isMoving && this.isBallMoving) {
            this.soundManager.stop('roll');
            this.isBallMoving = false;
        }
        
        this.lastBallPosition = currentPos;
    }
    
    checkCollisions() {
        if (!this.ball || !this.engine) return;
        
        const currentTime = Date.now();
        const velocity = Math.sqrt(this.ball.velocity.x ** 2 + this.ball.velocity.y ** 2);
        
        if (velocity > 2 && currentTime - this.lastCollisionTime > 200) {
            this.soundManager.play('bump');
            this.lastCollisionTime = currentTime;
        }
    }
    
    render() {
        this.drawStaticElements();
        
        if (this.ball) {
            this.ctx.fillStyle = '#3498db';
            this.ctx.beginPath();
            this.ctx.arc(this.ball.position.x, this.ball.position.y, this.ball.circleRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#2980b9';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(this.ball.position.x - 5, this.ball.position.y - 5, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    levelComplete() {
        this.gameRunning = false;
        clearInterval(this.timerInterval);
        
        this.soundManager.stop('roll');
        this.soundManager.play('win');
        
        const time = this.gameTime;
        const level = getCurrentLevel();
        
        this.showSuccessMessage(`Level ${this.currentLevel} Complete!`, `Time: ${this.formatTime(time)} | Moves: ${this.moves} | Par: ${level.parMoves}`);
        
        setTimeout(() => {
            this.loadNextLevel();
        }, 3000);
    }
    
    showSuccessMessage(title, message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <h2>${title}</h2>
            <p>${message}</p>
        `;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            document.body.removeChild(successDiv);
        }, 2500);
    }
    
    resetBall() {
        const level = getCurrentLevel();
        if (this.ball) {
            Matter.Body.setPosition(this.ball, { x: level.ballStart.x, y: level.ballStart.y });
            Matter.Body.setVelocity(this.ball, { x: 0, y: 0 });
            Matter.Body.setAngularVelocity(this.ball, 0);
            this.moves = 0;
            document.getElementById('moves').textContent = '0';
            
            this.soundManager.stop('roll');
            this.isBallMoving = false;
        }
    }
    
    loadNextLevel() {
        const next = nextLevel();
        if (next) {
            this.currentLevel++;
            this.loadLevel(this.currentLevel);
            this.startTimer();
            this.gameRunning = true;
            this.isBallMoving = false;
            this.soundManager.stop('roll');
        } else {
            this.showSuccessMessage('Game Complete!', 'You finished all levels!');
            this.soundManager.stop('roll');
        }
    }
    
    resetPhysics() {
        if (this.engine) {
            Matter.World.clear(this.engine.world);
            Matter.Engine.clear(this.engine);
        }
        
        this.engine = initPhysics(this.canvas);
        this.ball = null;
        this.hole = null;
        this.walls = [];
    }
    
    startTimer() {
        clearInterval(this.timerInterval);
        this.startTime = Date.now();
        this.gameTime = 0;
        
        this.timerInterval = setInterval(() => {
            this.gameTime = Math.floor((Date.now() - this.startTime) / 1000);
            document.getElementById('timer').textContent = this.formatTime(this.gameTime);
        }, 1000);
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    updateUI() {
        const canvasContainer = document.querySelector('.canvas-container');
        canvasContainer.classList.add('level-complete');
        
        setTimeout(() => {
            canvasContainer.classList.remove('level-complete');
        }, 1500);
    }
}

let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});

export { Game };