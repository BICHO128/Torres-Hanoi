document.addEventListener('DOMContentLoaded', function () {
    // Variables del juego
    let towers = [[], [], []];
    let selectedTower = null;
    let moveCount = 0;
    const diskColors = [
        { color: '#FF6B6B', light: '#FF8E8E' },
        { color: '#4ECDC4', light: '#7EDDD6' },
        { color: '#45B7D1', light: '#78CAE0' },
        { color: '#96CEB4', light: '#B8D8C8' },
        { color: '#FFEAA7', light: '#FFF2CC' },
        { color: '#DDA0DD', light: '#E8B8E8' },
        { color: '#FFB347', light: '#FFC673' },
        { color: '#98D8C8', light: '#B8E6DB' }
    ];

    let solving = false;
    let moveInterval;
    let timerInterval;
    let timeLeft = 100;
    let gameStarted = false;
    let gamePaused = false;

    // Variables de audio
    let ambientMusicEnabled = true;
    let effectsEnabled = true;
    const ambientMusic = document.getElementById('ambientMusic');
    const gameMusic = document.getElementById('gameMusic');
    const moveSound = document.getElementById('moveSound');
    const winSound = document.getElementById('winSound');
    const loseSound = document.getElementById('loseSound');

    const diskCountInput = document.getElementById('disk-count');

    // Inicializar elementos de audio
    initAudioElements();

    // Inicializar partículas de fondo
    createBackgroundParticles();

    // Inicializar música ambiental
    startAmbientMusic();

    // Event listeners principales
    document.getElementById('playButton').addEventListener('click', startGame);
    document.getElementById('ambientToggle').addEventListener('click', toggleAmbientMusic);
    document.getElementById('effectsToggle').addEventListener('click', toggleEffects);
    document.getElementById('solve-btn').addEventListener('click', solveGame);
    document.getElementById('reset-btn').addEventListener('click', resetGame);
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('change-disks').addEventListener('click', changeDiskCount);
    document.getElementById('playAgainBtn').addEventListener('click', playAgain);

    // Event listeners para torres
    document.querySelectorAll('.tower').forEach(tower => {
        tower.addEventListener('click', handleTowerClick);
    });

    function getDifficultySettings(diskCount) {
        const settings = {
            3: { minMoves: 7, timeLimit: 30 },
            4: { minMoves: 15, timeLimit: 60 },
            5: { minMoves: 31, timeLimit: 120 },
            6: { minMoves: 63, timeLimit: 180 },
            7: { minMoves: 127, timeLimit: 300 },
            8: { minMoves: 255, timeLimit: 420 }
        };
        return settings[diskCount] || settings[3];
    }

    // Funciones de audio
    function initAudioElements() {
        if (ambientMusic) {
            ambientMusic.volume = 0.5;
            ambientMusic.loop = true;
        }
        if (gameMusic) {
            gameMusic.volume = 0.4;
            gameMusic.loop = true;
        }
        if (moveSound) {
            moveSound.volume = 0.5;
        }
        if (winSound) {
            winSound.volume = 0.2;
        }
        if (loseSound) {
            loseSound.volume = 0.7;
        }

        [ambientMusic, gameMusic, moveSound, winSound, loseSound].forEach(audio => {
            if (audio) {
                audio.addEventListener('error', function () {
                    console.warn('No se pudo cargar el archivo de audio');
                });
            }
        });
    }

    function startAmbientMusic() {
        if (ambientMusicEnabled && ambientMusic && !gameStarted) {
            ambientMusic.play().catch(e => console.log('Error playing ambient music:', e));
        }
    }

    function stopAmbientMusic() {
        if (ambientMusic) {
            ambientMusic.pause();
            ambientMusic.currentTime = 0;
        }
    }

    function startGameMusic() {
        stopAmbientMusic();
        if (ambientMusicEnabled && gameMusic) {
            gameMusic.currentTime = 0;
            gameMusic.play().catch(e => {
                console.log('Error playing game music:', e);
                setTimeout(() => gameMusic.play(), 500);
            });
        }
    }

    function stopGameMusic() {
        if (gameMusic) {
            gameMusic.pause();
            gameMusic.currentTime = 0;
        }
    }

    function playMoveSound() {
        if (effectsEnabled && moveSound) {
            moveSound.currentTime = 0;
            moveSound.play().catch(e => console.log('Error playing move sound:', e));
        }
    }

    function playWinSound() {
        stopGameMusic();
        if (effectsEnabled && winSound) {
            winSound.play().catch(e => console.log('Error playing win sound:', e));
        }
    }

    function playLoseSound() {
        stopGameMusic();
        if (effectsEnabled && loseSound) {
            loseSound.currentTime = 0;
            loseSound.play().catch(e => console.log('Error playing lose sound:', e));
        }
    }

    function toggleAmbientMusic() {
        ambientMusicEnabled = !ambientMusicEnabled;
        const btn = document.getElementById('ambientToggle');

        if (ambientMusicEnabled) {
            btn.classList.remove('muted');
            btn.innerHTML = '<i class="fas fa-music"></i>';
            if (!gameStarted) {
                startAmbientMusic();
            } else {
                startGameMusic();
            }
        } else {
            btn.classList.add('muted');
            btn.innerHTML = '<i class="fas fa-music-slash"></i>';
            stopAmbientMusic();
            stopGameMusic();
        }
    }

    function toggleEffects() {
        effectsEnabled = !effectsEnabled;
        const btn = document.getElementById('effectsToggle');

        if (effectsEnabled) {
            btn.classList.remove('muted');
            btn.innerHTML = '<i class="fas fa-volume-up"></i>';
        } else {
            btn.classList.add('muted');
            btn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        }
    }

    // Funciones de partículas
    function createBackgroundParticles() {
        const container = document.getElementById('particles');
        const particleCount = 50;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.width = (Math.random() * 4 + 1) + 'px';
            particle.style.height = particle.style.width;
            particle.style.animationDelay = Math.random() * 6 + 's';
            particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
            container.appendChild(particle);
        }
    }

    // Funciones del juego
    function startGame() {
        const startScreen = document.getElementById('startScreen');
        const gameWrapper = document.getElementById('gameWrapper');

        startScreen.classList.add('hidden');
        gameWrapper.classList.add('active');

        gameStarted = true;
        startGameMusic();

        setTimeout(() => {
            initGame(parseInt(diskCountInput.value));
        }, 800);
    }

    function togglePause() {
        if (!gameStarted || solving) return;

        const btn = document.getElementById('pause-btn');
        gamePaused = !gamePaused;

        if (gamePaused) {
            clearInterval(timerInterval);
            stopGameMusic();
            btn.innerHTML = '<i class="fas fa-play"></i> Reanudar';
            btn.classList.add('primary');
        } else {
            startTimer();
            startGameMusic();
            btn.innerHTML = '<i class="fas fa-pause"></i> Pausar';
            btn.classList.remove('primary');
        }
    }

    class HanoiSolutionNode {
        constructor(move, state) {
            this.move = move;
            this.state = state;
            this.left = null;
            this.right = null;
        }
    }

    function buildHanoiSolutionTree(n, from, to, aux, currentState) {
        if (n === 1) {
            const newState = cloneState(currentState);
            const disk = newState[from].pop();
            newState[to].push(disk);
            return new HanoiSolutionNode([from, to], newState);
        }

        const node = new HanoiSolutionNode(null, cloneState(currentState));
        node.left = buildHanoiSolutionTree(n - 1, from, aux, to, currentState);

        const intermediateState = cloneState(node.left.state);
        const disk = intermediateState[from].pop();
        intermediateState[to].push(disk);
        node.move = [from, to];
        node.state = intermediateState;

        node.right = buildHanoiSolutionTree(n - 1, aux, to, from, intermediateState);

        return node;
    }

    function cloneState(state) {
        return [state[0].slice(), state[1].slice(), state[2].slice()];
    }

    function inOrderTraversal(node, moves) {
        if (node) {
            if (node.left) inOrderTraversal(node.left, moves);
            if (node.move) moves.push(node.move);
            if (node.right) inOrderTraversal(node.right, moves);
        }
    }

    function solveGame() {
        if (solving) {
            stopSolving();
            return;
        }

        solving = true;
        updateSolveButton();
        clearInterval(timerInterval);

        const currentState = cloneState(towers);
        const totalDisks = currentState[0].length + currentState[1].length + currentState[2].length;

        let fromTower = 0;
        let toTower = 2;

        if (currentState[2].length > 0) {
            toTower = 1;
        } else if (currentState[1].length > 0) {
            fromTower = 1;
        }

        const moves = [];
        calculateHanoiMoves(totalDisks, fromTower, toTower, 3 - fromTower - toTower, moves);

        executeMoves(moves);
    }

    function calculateHanoiMoves(n, from, to, aux, moves) {
        if (n === 0) return;

        calculateHanoiMoves(n - 1, from, aux, to, moves);
        moves.push([from, to]);
        calculateHanoiMoves(n - 1, aux, to, from, moves);
    }

    function stopSolving() {
        if (moveInterval) {
            clearInterval(moveInterval);
        }
        solving = false;
        updateSolveButton();

        if (!checkWin()) {
            startTimer();
        }
    }

    function getMaxAllowedMoves(diskCount) {
        const minMoves = Math.pow(2, diskCount) - 1;
        return Math.floor(minMoves * 1.5);
    }

    function updateSolveButton() {
        const btn = document.getElementById('solve-btn');
        const btnText = document.getElementById('solve-btn-text');
        const icon = btn.querySelector('i');

        if (solving) {
            btnText.textContent = ' Detener';
            icon.className = 'fas fa-stop';
            btn.classList.add('danger');
            btn.classList.remove('primary');
        } else {
            btnText.textContent = ' Resolver Automáticamente';
            icon.className = 'fas fa-magic';
            btn.classList.add('primary');
            btn.classList.remove('danger');
        }
    }

    function executeMoves(moves) {
        let moveIndex = 0;

        moveInterval = setInterval(() => {
            if (!solving || gamePaused) return;

            if (moveIndex >= moves.length) {
                clearInterval(moveInterval);
                solving = false;
                updateSolveButton();

                if (checkWin()) {
                    gameOver(true);
                } else {
                    startTimer();
                }
                return;
            }

            const [from, to] = moves[moveIndex];
            if (isValidMove(from, to)) {
                moveDisk(from, to, true);
                moveIndex++;
            } else {
                clearInterval(moveInterval);
                solving = false;
                updateSolveButton();
                startTimer();

                setTimeout(() => solveGame(), 300);
            }
        }, 800);
    }

    // Temporizador
    function startTimer() {
        if (gamePaused) return;

        clearInterval(timerInterval);

        timerInterval = setInterval(() => {
            if (gamePaused) return;

            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                gameOver(false, 'tiempo');
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timerElement = document.getElementById('timer');
        timerElement.textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (timeLeft <= 30) {
            timerElement.classList.add('timer-warning');
        } else {
            timerElement.classList.remove('timer-warning');
        }
    }

    function updateMinMovesDisplay(numDisks) {
        const difficulty = getDifficultySettings(numDisks);
        const minMoves = difficulty.minMoves;
        const maxAllowed = Math.floor(minMoves * 1.5);

        document.getElementById('min-moves').innerHTML = `
        <span>Mínimo: ${minMoves}</span><br>
        <span style="font-size: 0.8em;">Límite: ${maxAllowed}</span>
    `;
    }

    // Funciones principales del juego
    function initGame(numDisks) {
        clearInterval(moveInterval);
        clearInterval(timerInterval);

        towers = [[], [], []];
        document.querySelectorAll('.tower').forEach(tower => {
            tower.innerHTML = '';
        });

        moveCount = 0;
        const difficulty = getDifficultySettings(numDisks);
        timeLeft = difficulty.timeLimit;

        gamePaused = false;
        updateMoveCounter();
        updateTimerDisplay();
        updateMinMovesDisplay(numDisks);
        selectedTower = null;
        solving = false;

        const pauseBtn = document.getElementById('pause-btn');
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pausar';
        pauseBtn.classList.remove('primary');

        for (let i = numDisks; i > 0; i--) {
            towers[0].push(i);
            createDisk(i, 0);
        }

        startTimer();
    }

    function createDisk(size, towerIndex) {
        const tower = document.getElementById(`tower${towerIndex + 1}`);
        const disk = document.createElement('div');
        disk.className = 'disk';
        disk.dataset.size = size;

        const width = size * 30 + 80;
        disk.style.width = `${width}px`;
        disk.style.setProperty('--disk-color', diskColors[(size - 1) % diskColors.length].color);
        disk.style.setProperty('--disk-color-light', diskColors[(size - 1) % diskColors.length].light);
        disk.textContent = size;

        tower.appendChild(disk);
    }

    function handleTowerClick(event) {
        if (solving || gamePaused) return;

        const towerIndex = parseInt(event.currentTarget.dataset.tower) - 1;

        if (selectedTower === null) {
            if (towers[towerIndex].length > 0) {
                selectedTower = towerIndex;
                highlightTower(towerIndex, true);
            }
        } else {
            if (isValidMove(selectedTower, towerIndex)) {
                moveDisk(selectedTower, towerIndex);
            }
            highlightTower(selectedTower, false);
            selectedTower = null;

            if (checkWin()) {
                gameOver(true);
            }
        }
    }

    function isValidMove(fromTower, toTower) {
        if (towers[fromTower].length === 0) return false;
        if (towers[toTower].length === 0) return true;
        return towers[toTower][towers[toTower].length - 1] > towers[fromTower][towers[fromTower].length - 1];
    }

    function moveDisk(fromTower, toTower, isAutomatic = false) {
        const disk = towers[fromTower].pop();
        towers[toTower].push(disk);
        moveCount++;
        updateMoveCounter();

        if (!isAutomatic) {
            playMoveSound();
        }

        const diskElement = document.querySelector(`#tower${fromTower + 1} .disk:last-child`);
        diskElement.style.transform = `translateY(-200px) translateX(${(toTower - fromTower) * 270}px)`;

        setTimeout(() => {
            diskElement.style.transform = '';
            document.getElementById(`tower${toTower + 1}`).appendChild(diskElement);

            const diskCount = parseInt(diskCountInput.value);
            const maxMoves = getMaxAllowedMoves(diskCount);

            if (checkWin()) {
                gameOver(true);
            } else if (moveCount > maxMoves && !isAutomatic) {
                gameOver(false, 'movimientos');
            }
        }, 300);
    }

    function highlightTower(towerIndex, highlight) {
        const tower = document.getElementById(`tower${towerIndex + 1}`);
        if (highlight) {
            tower.classList.add('selected');
        } else {
            tower.classList.remove('selected');
        }
    }

    function updateMoveCounter() {
        const diskCount = parseInt(diskCountInput.value);
        const minMoves = Math.pow(2, diskCount) - 1;
        const maxAllowed = getMaxAllowedMoves(diskCount);

        document.getElementById('moves-counter').textContent = moveCount;
        document.getElementById('min-moves').textContent = `${minMoves} (Límite: ${maxAllowed})`;

        const movesElement = document.getElementById('moves-counter');
        if (moveCount > minMoves) {
            movesElement.classList.add('timer-warning');
        } else {
            movesElement.classList.remove('timer-warning');
        }
    }

    function checkWin() {
        const currentDiskCount = towers[0].length + towers[1].length + towers[2].length;
        return towers[1].length === currentDiskCount || towers[2].length === currentDiskCount;
    }

    function gameOver(won, reason = '') {
        clearInterval(timerInterval);
        clearInterval(moveInterval);

        if (won) {
            if (solving) {
                solving = false;
                updateSolveButton();
            }

            playWinSound();
            showVictoryModal();
        } else {
            playLoseSound();
            let message = '¡Game Over!';
            let details = '';
            const diskCount = parseInt(diskCountInput.value);
            const difficulty = getDifficultySettings(diskCount);

            if (reason === 'tiempo') {
                message = '¡Tiempo agotado!';
                details = `Con ${diskCount} discos tenías ${difficulty.timeLimit} segundos.`;
            } else if (reason === 'movimientos') {
                message = '¡Excediste el límite de movimientos!';
                details = `Con ${diskCount} discos el mínimo es ${difficulty.minMoves} movimientos.`;
            }

            showGameOverModal(message, details);
        }
    }

    function showGameOverModal(message = '¡Game Over!', details = '') {
        const existingModal = document.getElementById('gameOverModal');
        if (existingModal) {
            document.body.removeChild(existingModal);
        }

        const modal = document.createElement('div');
        modal.id = 'gameOverModal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '2000';
        modal.style.color = 'white';
        modal.style.fontFamily = '"Orbitron", sans-serif';
        modal.style.textAlign = 'center';
        modal.style.flexDirection = 'column';

        const diskCount = parseInt(diskCountInput.value);
        const minMoves = Math.pow(2, diskCount) - 1;

        modal.innerHTML = `
            <div style="background: linear-gradient(135deg, #ff416c, #ff4b2b); padding: 3rem; border-radius: 25px; max-width: 500px; text-align: center;">
                <div style="font-size: 4rem; margin-bottom: 1rem; color: white;">
                    <i class="fas fa-skull"></i>
                </div>
                <h2 style="font-size: 2rem; margin-bottom: 1rem; color: white;">${message}</h2>
                <p style="margin-bottom: 1.5rem; font-size: 1.1rem; color: rgba(255,255,255,0.9);">
                    ${details || `Con ${diskCount} discos, el mínimo es ${minMoves} movimientos.`}
                </p>
                <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem;">
                    <p style="margin: 0.5rem 0; color: white;"><strong>Movimientos:</strong> ${moveCount}</p>
                    <p style="margin: 0.5rem 0; color: white;"><strong>Discos:</strong> ${diskCount}</p>
                </div>
                <button class="control-btn primary" id="retryBtn" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i> Volver a intentar
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('retryBtn').addEventListener('click', function () {
            document.body.removeChild(modal);
            resetGame();
        });
    }

    function showVictoryModal() {
        const modal = document.getElementById('victoryModal');
        const statsElement = document.getElementById('victoryStats');
        const timeUsed = getDifficultySettings(parseInt(diskCountInput.value)).timeLimit - timeLeft;
        const minMoves = Math.pow(2, parseInt(diskCountInput.value)) - 1;

        statsElement.innerHTML = `
            <strong>Movimientos:</strong> ${moveCount} (Mínimo: ${minMoves})<br>
            <strong>Tiempo:</strong> ${formatTime(timeUsed)}<br>
            <strong>Eficiencia:</strong> ${Math.round((minMoves / moveCount) * 100)}%
        `;

        modal.classList.add('show');
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    }

    function playAgain() {
        const modal = document.getElementById('victoryModal');
        modal.classList.remove('show');
        resetGame();
    }

    function resetGame() {
        clearInterval(moveInterval);
        clearInterval(timerInterval);

        solving = false;
        gamePaused = false;
        gameStarted = true;

        updateSolveButton();

        const victoryModal = document.getElementById('victoryModal');
        if (victoryModal) victoryModal.classList.remove('show');

        const gameOverModal = document.getElementById('gameOverModal');
        if (gameOverModal) document.body.removeChild(gameOverModal);

        stopAmbientMusic();
        stopGameMusic();
        if (winSound) winSound.pause();
        if (loseSound) loseSound.pause();

        if (ambientMusicEnabled) {
            startGameMusic();
        }

        timeLeft = getDifficultySettings(parseInt(diskCountInput.value)).timeLimit;

        initGame(parseInt(diskCountInput.value));
    }

    function changeDiskCount() {
        const newCount = parseInt(diskCountInput.value);
        if (newCount >= 3 && newCount <= 8) {
            const difficulty = getDifficultySettings(newCount);
            timeLeft = difficulty.timeLimit;
            resetGame();
            updateTimerDisplay();
            updateMinMovesDisplay(newCount);
        } else {
            alert('Por favor, ingresa un número entre 3 y 8');
            diskCountInput.value = 3;
        }
    }
});