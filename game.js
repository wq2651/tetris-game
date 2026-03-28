// ==================== 音效系统 ====================
class SoundManager {
    constructor() {
        this.enabled = true;
        this.audioContext = null;
        this.gameOverInterval = null;
        this.gameOverOscillators = [];
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
            this.enabled = false;
        }
    }

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    play(type) {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const sounds = {
            move: () => this.playTone(200, 0.05, 'square', 0.1),
            rotate: () => this.playTone(400, 0.08, 'square', 0.15),
            drop: () => this.playTone(150, 0.1, 'square', 0.2),
            clear: () => this.playClear(),
            levelUp: () => this.playLevelUp(),
            gameOver: () => this.startGameOverLoop()
        };

        if (sounds[type]) sounds[type]();
    }

    playTone(freq, duration, type, volume) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = volume;
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start();
        osc.stop(this.audioContext.currentTime + duration);
    }

    playClear() {
        const frequencies = [523, 659, 784, 1047];
        frequencies.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'square', 0.2), i * 80);
        });
    }

    playLevelUp() {
        const frequencies = [392, 523, 659, 784];
        frequencies.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.25), i * 100);
        });
    }

    startGameOverLoop() {
        this.stopGameOverLoop();
        
        const melody = [
            { freq: 392, dur: 0.15 },
            { freq: 349, dur: 0.15 },
            { freq: 330, dur: 0.15 },
            { freq: 294, dur: 0.2 },
            { freq: 262, dur: 0.3 },
            { freq: 0, dur: 0.1 },
            { freq: 294, dur: 0.15 },
            { freq: 330, dur: 0.15 },
            { freq: 262, dur: 0.2 },
            { freq: 247, dur: 0.3 },
            { freq: 0, dur: 0.1 },
            { freq: 220, dur: 0.15 },
            { freq: 247, dur: 0.15 },
            { freq: 196, dur: 0.2 },
            { freq: 175, dur: 0.3 },
            { freq: 0, dur: 0.15 }
        ];
        
        let noteIndex = 0;
        const playNote = () => {
            if (!this.enabled) return;
            const note = melody[noteIndex];
            if (note.freq > 0) {
                this.playTone(note.freq, note.dur, 'triangle', 0.3);
            }
            noteIndex = (noteIndex + 1) % melody.length;
        };
        
        playNote();
        this.gameOverInterval = setInterval(playNote, 500);
    }

    stopGameOverLoop() {
        if (this.gameOverInterval) {
            clearInterval(this.gameOverInterval);
            this.gameOverInterval = null;
        }
    }

    toggle(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopGameOverLoop();
        }
    }
}

// ==================== 游戏常量 ====================
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 20;

const TETROMINOS = {
    I: { shape: [[1,1,1,1]], color: '#00d4ff' },
    O: { shape: [[1,1],[1,1]], color: '#ffd93d' },
    T: { shape: [[0,1,0],[1,1,1]], color: '#9b59b6' },
    S: { shape: [[0,1,1],[1,1,0]], color: '#2ecc71' },
    Z: { shape: [[1,1,0],[0,1,1]], color: '#e74c3c' },
    J: { shape: [[1,0,0],[1,1,1]], color: '#3498db' },
    L: { shape: [[0,0,1],[1,1,1]], color: '#e67e22' }
};

const TETROMINO_NAMES = Object.keys(TETROMINOS);

// ==================== 游戏类 ====================
class TetrisGame {
    constructor(canvasId, nextCanvasId, playerNum, soundManager) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById(nextCanvasId);
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.playerNum = playerNum;
        this.sound = soundManager;
        
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.paused = false;
        this.dropInterval = null;
        this.lastDropTime = 0;
        
        this.init();
    }

    init() {
        this.board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.paused = false;
        
        this.currentPiece = this.createPiece();
        this.nextPiece = this.createPiece();
        this.updateDisplay();
        this.draw();
    }

    createPiece() {
        const name = TETROMINO_NAMES[Math.floor(Math.random() * TETROMINO_NAMES.length)];
        const piece = TETROMINOS[name];
        const shape = piece.shape.map(row => [...row]);
        return {
            shape: shape,
            color: piece.color,
            name: name,
            x: Math.floor(COLS / 2) - Math.ceil(shape[0].length / 2),
            y: 0
        };
    }

    validMove(piece, offsetX, offsetY, newShape) {
        const shape = newShape || piece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const newX = piece.x + x + offsetX;
                    const newY = piece.y + y + offsetY;
                    if (newX < 0 || newX >= COLS || newY >= ROWS) return false;
                    if (newY >= 0 && this.board[newY][newX]) return false;
                }
            }
        }
        return true;
    }

    move(dx, dy) {
        if (this.gameOver || this.paused) return false;
        if (this.validMove(this.currentPiece, dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            if (dx !== 0) this.sound.play('move');
            this.draw();
            return true;
        }
        return false;
    }

    rotate() {
        if (this.gameOver || this.paused) return;
        
        const piece = this.currentPiece;
        
        // O方块不需要旋转（2x2方块旋转后形状一样）
        if (piece.name === 'O') return;
        
        const shape = piece.shape;
        const rows = shape.length;
        const cols = shape[0].length;
        
        // 创建旋转后的矩阵（列数变行数）
        const rotated = [];
        for (let x = 0; x < cols; x++) {
            rotated[x] = [];
            for (let y = rows - 1; y >= 0; y--) {
                rotated[x].push(shape[y][x]);
            }
        }

        // 尝试旋转，失败则尝试墙踢
        const kicks = [[0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0]];
        for (const [dx, dy] of kicks) {
            if (this.validMove(piece, dx, dy, rotated)) {
                piece.shape = rotated;
                piece.x += dx;
                piece.y += dy;
                this.sound.play('rotate');
                this.draw();
                return;
            }
        }
    }

    hardDrop() {
        if (this.gameOver || this.paused) return;
        while (this.move(0, 1)) {}
        this.lockPiece();
        this.sound.play('drop');
    }

    lockPiece() {
        const shape = this.currentPiece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    if (this.currentPiece.y + y < 0) {
                        this.gameOver = true;
                        return;
                    }
                    this.board[this.currentPiece.y + y][this.currentPiece.x + x] = this.currentPiece.color;
                }
            }
        }
        this.clearLines();
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createPiece();
        
        if (!this.validMove(this.currentPiece, 0, 0)) {
            this.gameOver = true;
        }
        this.updateDisplay();
        this.draw();
    }

    clearLines() {
        let linesCleared = 0;
        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(COLS).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            const points = [0, 100, 300, 500, 800];
            this.score += points[linesCleared] * this.level;
            this.lines += linesCleared;
            this.level = Math.floor(this.lines / 10) + 1;
            
            this.sound.play('clear');
            if (linesCleared >= 2) {
                setTimeout(() => this.sound.play('levelUp'), 300);
            }
            
            this.updateDisplay();
        }
    }

    start() {
        if (this.gameOver) {
            this.init();
        }
        this.sound.init();
        this.sound.resume();
        this.lastDropTime = performance.now();
        this.drop();
    }

    drop() {
        if (this.gameOver || this.paused) return;
        
        const now = performance.now();
        const dropSpeed = Math.max(100, 1000 - (this.level - 1) * 100);
        
        if (now - this.lastDropTime > dropSpeed) {
            if (!this.move(0, 1)) {
                this.lockPiece();
            }
            this.lastDropTime = now;
        }
        
        this.animationId = requestAnimationFrame(() => this.drop());
    }

    pause() {
        this.paused = !this.paused;
        if (!this.paused) {
            this.lastDropTime = performance.now();
            this.drop();
        }
    }

    updateDisplay() {
        document.getElementById(`score${this.playerNum}`).textContent = this.score;
        document.getElementById(`level${this.playerNum}`).textContent = this.level;
        document.getElementById(`lines${this.playerNum}`).textContent = this.lines;
        this.drawNextPiece();
    }

    draw() {
        const ctx = this.ctx;
        ctx.fillStyle = '#0a0a15';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= COLS; x++) {
            ctx.beginPath();
            ctx.moveTo(x * BLOCK_SIZE, 0);
            ctx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
            ctx.stroke();
        }
        for (let y = 0; y <= ROWS; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * BLOCK_SIZE);
            ctx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
            ctx.stroke();
        }

        // 绘制已固定的方块
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(ctx, x, y, this.board[y][x]);
                }
            }
        }

        // 绘制当前方块
        if (this.currentPiece && !this.gameOver) {
            const shape = this.currentPiece.shape;
            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) {
                        this.drawBlock(ctx, this.currentPiece.x + x, this.currentPiece.y + y, this.currentPiece.color);
                    }
                }
            }
        }
    }

    drawBlock(ctx, x, y, color) {
        const size = BLOCK_SIZE;
        const px = x * size;
        const py = y * size;

        // 主体
        ctx.fillStyle = color;
        ctx.fillRect(px + 1, py + 1, size - 2, size - 2);

        // 高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(px + 1, py + 1, size - 2, 4);
        ctx.fillRect(px + 1, py + 1, 4, size - 2);

        // 阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(px + size - 5, py + 1, 4, size - 2);
        ctx.fillRect(px + 1, py + size - 5, size - 2, 4);
    }

    drawNextPiece() {
        const ctx = this.nextCtx;
        ctx.fillStyle = '#0a0a15';
        ctx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        if (!this.nextPiece) return;

        const shape = this.nextPiece.shape;
        const blockSize = 18;
        const offsetX = (this.nextCanvas.width - shape[0].length * blockSize) / 2;
        const offsetY = (this.nextCanvas.height - shape.length * blockSize) / 2;

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const px = offsetX + x * blockSize;
                    const py = offsetY + y * blockSize;
                    ctx.fillStyle = this.nextPiece.color;
                    ctx.fillRect(px + 1, py + 1, blockSize - 2, blockSize - 2);
                    
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.fillRect(px + 1, py + 1, blockSize - 2, 3);
                    ctx.fillRect(px + 1, py + 1, 3, blockSize - 2);
                }
            }
        }
    }

    isGameOver() {
        return this.gameOver;
    }
}

// ==================== 主程序 ====================
let game1, game2;
let soundManager;

document.addEventListener('DOMContentLoaded', () => {
    soundManager = new SoundManager();

    game1 = new TetrisGame('game1', 'next1', 1, soundManager);
    game2 = new TetrisGame('game2', 'next2', 2, soundManager);

    // 音效开关
    document.getElementById('soundToggle').addEventListener('change', (e) => {
        soundManager.toggle(e.target.checked);
    });

    // 开始按钮
    document.getElementById('startBtn').addEventListener('click', () => {
        soundManager.init();
        soundManager.resume();
        game1.start();
        game2.start();
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('restartBtn').disabled = false;
        
        checkGameOver();
    });

    // 暂停按钮
    document.getElementById('pauseBtn').addEventListener('click', () => {
        game1.pause();
        game2.pause();
        const btn = document.getElementById('pauseBtn');
        btn.textContent = game1.paused ? '继续' : '暂停';
    });

    // 重新开始
    document.getElementById('restartBtn').addEventListener('click', () => {
        game1.init();
        game2.init();
        game1.start();
        game2.start();
        hideGameOver();
    });

    // 再来一局
    document.getElementById('playAgainBtn').addEventListener('click', () => {
        game1.init();
        game2.init();
        game1.start();
        game2.start();
        hideGameOver();
    });

    // 键盘控制
    document.addEventListener('keydown', (e) => {
        if (game1.gameOver && game2.gameOver) return;

        switch (e.code) {
            // 玩家1: WASD + 空格
            case 'KeyW': game1.rotate(); break;
            case 'KeyA': game1.move(-1, 0); break;
            case 'KeyD': game1.move(1, 0); break;
            case 'KeyS': game1.move(0, 1); break;
            case 'Space': game1.hardDrop(); e.preventDefault(); break;

            // 玩家2: 方向键 + Enter
            case 'ArrowUp': game2.rotate(); break;
            case 'ArrowLeft': game2.move(-1, 0); break;
            case 'ArrowRight': game2.move(1, 0); break;
            case 'ArrowDown': game2.move(0, 1); break;
            case 'Enter': game2.hardDrop(); break;
        }
    });

    // 定期检查游戏结束
    setInterval(checkGameOver, 100);
});

function checkGameOver() {
    if (game1.isGameOver() || game2.isGameOver()) {
        soundManager.play('gameOver');
        
        let winner = '';
        if (game1.isGameOver() && game2.isGameOver()) {
            winner = '平局！';
        } else if (game1.isGameOver()) {
            winner = '玩家 2 获胜！';
        } else {
            winner = '玩家 1 获胜！';
        }
        
        showGameOver(winner, Math.max(game1.score, game2.score));
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
    }
}

function showGameOver(winner, score) {
    document.getElementById('winnerText').textContent = winner;
    document.getElementById('finalScore').textContent = `最终分数: ${score}`;
    document.getElementById('gameOverOverlay').classList.add('show');
}

function hideGameOver() {
    document.getElementById('gameOverOverlay').classList.remove('show');
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
}
