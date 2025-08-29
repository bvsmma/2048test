const gameContainer = document.getElementById('game-container');
const scoreDisplay = document.getElementById('score');
const bestScoreDisplay = document.getElementById('best-score');
const gameMessage = document.getElementById('game-message');
const gameStatus = document.getElementById('game-status');
const restartButton = document.getElementById('restart-button'); // Restart button in Game Over/Win message
const infoButton = document.getElementById('info-button');
const infoModal = document.getElementById('info-modal');
const closeInfoModalButton = document.getElementById('close-info-modal');
const undoButton = document.getElementById('undo-button');
const toggleSoundButton = document.getElementById('toggle-sound-button');
const volumeSlider = document.getElementById('volume-slider');
const resetButtonMain = document.getElementById('reset-button-main'); // New Game button in settings menu

// Elements for settings menu
const settingsButton = document.getElementById('settings-button');
const settingsMenu = document.getElementById('settings-menu');
const closeSettingsMenuButton = document.getElementById('close-settings-menu-button');
const soundIcon = document.getElementById('sound-icon'); // <i> element for sound icon
const soundText = document.getElementById('sound-text'); // <span> element for 'Sound: On/Off' text

// Elements for achievements menu
const achievementsButton = document.getElementById('achievements-button'); // New achievements button
const achievementsMenu = document.getElementById('achievements-menu'); // New achievements menu
const closeAchievementsMenuButton = document.getElementById('close-achievements-menu-button'); // New close button for achievements
const achievementsList = document.getElementById('achievements-list'); // Achievements list container

// Elements for profile menu (NEW)
const profileButton = document.getElementById('profile-button'); // New profile button
const profileMenu = document.getElementById('profile-menu'); // New profile menu
const closeProfileMenuButton = document.getElementById('close-profile-menu-button'); // New close button for profile
const playerNameInput = document.getElementById('player-name-input'); // Player name input
const profileScoreDisplay = document.getElementById('profile-score'); // Score in profile
const profileBestScoreDisplay = document.getElementById('profile-best-score'); // Best score in profile
const unlockedIconsList = document.getElementById('unlocked-icons-list'); // Container for unlocked icons

const gridSize = 4; // Fixed grid size to 4
let board = [];
let score = 0;
let bestScore = 0;
let gameOver = false;
let gameWon = false;
let history = []; // Stores previous board states and scores for undo
let soundEnabled = true;
let gameVolume = 1.0;

// Profile data (NEW)
const profile = {
    playerName: 'Player',
    unlockedIcons: [] // No longer used for display, but kept for potential future use
};

// Sound effects (using Tone.js for simplicity and no external URLs)
let moveSound = null;
let mergeSound = null;

// Achievements definition (All English, with iconClass for profile)
const achievements = {
    'tile_128': { name: 'First 128', description: 'Reach a tile of 128', unlocked: false, iconClass: 'fas fa-medal' },
    'tile_512': { name: 'Path to 2048', description: 'Reach a tile of 512', unlocked: false, iconClass: 'fas fa-gem' },
    'tile_2048': { name: 'The Master', description: 'Reach the 2048 tile!', unlocked: false, iconClass: 'fas fa-crown' },
    'score_1000': { name: 'Scoring King', description: 'Achieve a score of 1000', unlocked: false, iconClass: 'fas fa-star' },
    'score_5000': { name: 'High Roller', description: 'Achieve a score of 5000', unlocked: false, iconClass: 'fas fa-coins' },
    'first_win': { name: 'Victory!', description: 'Win your first game', unlocked: false, iconClass: 'fas fa-trophy' },
    'sound_enthusiast': { name: 'Sound Enthusiast', description: 'Toggle sound on/off 10 times', unlocked: false, counter: 0, iconClass: 'fas fa-volume-up' }
};

// Helper to get tile position (in pixels)
function getTilePosition(r, c) {
    const allCells = gameContainer.querySelectorAll('.grid-cell');
    const index = r * gridSize + c;

    if (allCells && allCells.length > index) {
        const cellElement = allCells[index];
        const position = {
            left: cellElement.offsetLeft,
            top: cellElement.offsetTop
        };
        return position;
    }

    console.error(`Grid cell element not found for position (${r}, ${c}). This should not happen.`);
    return { left: 0, top: 0 }; // Default return
}


// Global map to hold current tile DOM elements keyed by their position "r-c"
let tileDOMelements = new Map(); // Key: "r-c", Value: {element: DOM_NODE, value: number}

// Initialize Tone.js for sound effects
window.addEventListener('load', () => {
    // Only initialize if Tone is available
    if (typeof Tone !== 'undefined') {
        Tone.Destination.volume.value = Tone.gainToDb(gameVolume); 

        moveSound = new Tone.MembraneSynth({
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.05, release: 0.1 }
        }).toDestination();
        mergeSound = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "square" },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.05, release: 0.2 }
        }).toDestination();
    }
    initializeGame(false); // Always start a new game on initial load/reload
});


// Initialize game
function initializeGame(loadSavedGame = false) { 
    // Load best score from localStorage
    bestScore = parseInt(localStorage.getItem('bestScore') || '0');
    bestScoreDisplay.textContent = bestScore;

    // Load sound preference, defaulting to 'on'
    soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    updateSoundButtonText(true); // Update text and icon on initialization without counting for achievement

    // Load volume preference
    gameVolume = parseFloat(localStorage.getItem('gameVolume') || '1.0');
    volumeSlider.value = gameVolume;
    if (typeof Tone !== 'undefined') {
        Tone.Destination.volume.value = Tone.gainToDb(gameVolume);
    }

    // Load profile (NEW)
    loadProfile(); 
    updateProfileView();

    // Load achievements state
    loadAchievements();
    updateAchievementsView(); // Render achievements in the menu

    history = []; // Clear history for new game
    
    // Clear all existing tiles from the DOM
    tileDOMelements.forEach(tileInfo => tileInfo.element.remove());
    tileDOMelements.clear();
    
    // Ensure gameMessage is hidden at the start of a new game
    gameMessage.style.display = 'none';

    // Always start a new game state and add two '2' tiles
    board = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
    score = 0;
    gameOver = false;
    gameWon = false;
    scoreDisplay.textContent = score;

    addNewTile(2); // Add first '2' tile
    addNewTile(2); // Add second '2' tile
    
    requestAnimationFrame(() => {
        updateBoardView();
    });

    saveGameState(); // Save initial state of new game
    saveHistory(); // Save initial state to history
}

// Save current game state to localStorage
function saveGameState() {
    localStorage.setItem('2048_board', JSON.stringify(board));
    localStorage.setItem('2048_score', score.toString());

    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('bestScore', bestScore.toString());
        bestScoreDisplay.textContent = bestScore;
    }
    saveAchievements(); // Save achievements state
    saveProfile(); // Save profile data (NEW)
}

// Save current board state and score to history for undo
function saveHistory() {
    history.push({
        board: JSON.parse(JSON.stringify(board)), // Deep copy of board
        score: score
    });
    // Limit history size to prevent excessive memory usage
    if (history.length > 20) {
        history.shift(); // Remove oldest entry
    }
    // Enable undo button if history is not empty (and more than initial state)
    undoButton.disabled = history.length <= 1;
}

// Undo last move
function undoLastMove() {
    if (history.length > 1) { // Need at least two states to undo (current and previous)
        history.pop(); // Remove current state
        const previousState = history[history.length - 1]; // Get the state before current
        board = JSON.parse(JSON.stringify(previousState.board));
        score = previousState.score;
        gameOver = false; // Reset game over status
        gameWon = false; // Reset game won status
        gameMessage.style.display = 'none'; // Hide game over message if shown
        updateBoardView();
        saveGameState(); // Save current (restored) state
        // Disable undo button if only initial state left
        undoButton.disabled = history.length <= 1;
    } 
}

// Play a sound effect
function playSound(type) {
    if (!soundEnabled || !Tone || Tone.context.state !== 'running') return;

    if (type === 'move' && moveSound) {
        moveSound.triggerAttackRelease('C4', '8n');
    } else if (type === 'merge' && mergeSound) {
        // Play a chord for merge for a more distinct sound
        mergeSound.triggerAttackRelease(['C4', 'E4', 'G4'], '8n');
    }
}

// Update sound button text and icon based on soundEnabled state
function updateSoundButtonText(isInitializing = false) {
    if (soundEnabled) {
        soundText.textContent = 'Sound: On';
        soundIcon.classList.remove('fa-volume-mute');
        soundIcon.classList.add('fa-volume-up');
    } else {
        soundText.textContent = 'Sound: Off';
        soundIcon.classList.remove('fa-volume-up');
        soundIcon.classList.add('fa-volume-mute');
    }
    // Only increment counter for achievement on user click, not on initial load
    if (!isInitializing) {
        achievements.sound_enthusiast.counter = (achievements.sound_enthusiast.counter || 0) + 1;
        checkAchievements();
    }
}

// Add a new tile (2 or 4) to a random empty cell
function addNewTile(specificValue = null) { // Modified to accept a specific value
    if (isBoardFull()) {
        return;
    }
    let row, col;
    do {
        row = Math.floor(Math.random() * gridSize);
        col = Math.floor(Math.random() * gridSize);
    } while (board[row][col] !== 0);

    const value = specificValue !== null ? specificValue : (Math.random() < 0.9 ? 2 : 4); // Use specific value or random 2/4
    board[row][col] = value;
}

// Update the visual representation of the board with animations
function updateBoardView() {
    // Create a new map to store DOM elements for the *next* render cycle.
    const newTileDOMelements = new Map();

    // Iterate through the current board state
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const value = board[r][c];
            const currentPositionKey = `${r}-${c}`;
            const position = getTilePosition(r, c);

            let tileElement = tileDOMelements.get(currentPositionKey)?.element; // Try to find existing element at this position

            if (value !== 0) { // If there should be a tile here
                if (tileElement) {
                    // Tile exists at this position from previous render
                    const oldValue = tileDOMelements.get(currentPositionKey).value;

                    // If value changed, it's a merge animation
                    if (oldValue !== value) {
                        tileElement.textContent = value;
                        tileElement.className = `tile tile-${value}`; // Update class for color
                        
                        // Animate the merge
                        const currentTransform = tileElement.style.transform;
                            tileElement.animate([
                                { transform: `${currentTransform} scale(1)` },
                                { transform: `${currentTransform} scale(1.2)` },
                                { transform: `${currentTransform} scale(1)` }
                            ], {
                                duration: 200,
                                easing: 'ease-out'
                            });
                    }
                    // Ensure position is correct (will animate if it moved)
                    tileElement.style.transform = `translate(${position.left}px, ${position.top}px)`;
                    
                } else {
                    // This is a new tile
                    tileElement = document.createElement('div');
                    tileElement.classList.add('tile', `tile-${value}`, 'new-tile');
                    tileElement.textContent = value;
                    tileElement.style.zIndex = '2';
                    
                    // Set its final position immediately
                    tileElement.style.transform = `translate(${position.left}px, ${position.top}px)`;
                    
                    gameContainer.appendChild(tileElement); 
                }
                newTileDOMelements.set(currentPositionKey, { element: tileElement, value: value });
            }
        }
    }

    // Remove old tiles that are no longer present in the `newTileDOMelements` map
    for (const [key, tileInfo] of tileDOMelements) {
        if (!newTileDOMelements.has(key)) {
            const oldElement = tileInfo.element;
            oldElement.style.opacity = '0';
            oldElement.style.transform += ' scale(0.1)';
            oldElement.style.zIndex = '1';
            setTimeout(() => oldElement.remove(), 150);
        }
    }

    // Update the global map with the new set of DOM elements
    tileDOMelements = newTileDOMelements;
    scoreDisplay.textContent = score;
    checkAchievements(); // Check achievements after board update
    updateProfileView(); // Update profile view to reflect new score/best score (NEW)
}


// Handle key presses for sliding tiles
document.addEventListener('keydown', handleKeyPress);
document.addEventListener('touchstart', handleTouchStart, false);
document.addEventListener('touchmove', handleTouchMove, false);
document.addEventListener('touchend', handleTouchEnd, false);


let xDown = null;
let yDown = null;

function getTouches(evt) {
    return evt.touches ||              // browser API
           evt.originalEvent.touches; // jQuery
}

function handleTouchStart(evt) {
    const firstTouch = getTouches(evt)[0];
    xDown = firstTouch.clientX;
    yDown = firstTouch.clientY;
    // Ensure Tone context is started on first user interaction
    if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
        Tone.start();
    }
}

function handleTouchMove(evt) {
    if (!xDown || !yDown) {
        return;
    }

    const xUp = evt.touches[0].clientX;
    const yUp = evt.touches[0].clientY;

    const xDiff = xDown - xUp;
    const yDiff = yDown - yUp;

    // Ensure Tone context is started on user interaction
    if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
        Tone.start();
    }
    
    let direction = null;
    if (Math.abs(xDiff) > Math.abs(yDiff)) { /* Most significant drag */
        if (xDiff > 0) {
            direction = 'left';
        } else {
            direction = 'right';
        }
    } else {
        if (yDiff > 0) {
            direction = 'up';
        } else {
            direction = 'down';
        }
    }

    if (direction) {
        handleMove(direction);
    }

    /* Reset values */
    xDown = null;
    yDown = null;
    evt.preventDefault(); // Prevent scrolling on touch devices
}

function handleTouchEnd() {
    xDown = null;
    yDown = null;
}

function handleKeyPress(event) {
    if (gameOver || gameWon) return;

    // Ensure Tone context is started on user interaction
    if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
        Tone.start();
    }

    let direction = null;
    switch (event.key) {
        case 'ArrowUp': direction = 'up'; break;
        case 'ArrowDown': direction = 'down'; break;
        case 'ArrowLeft': direction = 'left'; break;
        case 'ArrowRight': direction = 'right'; break;
    }
    
    if (direction) {
        handleMove(direction);
    }
}

function handleMove(direction) {
    const oldBoard = JSON.stringify(board);
    let moved = move(direction);

    if (moved) {
        const newBoard = JSON.stringify(board);
        let merged = false;
        // A simple check for merge sound: if score increased, a merge happened.
        if (score > (history.length > 0 ? history[history.length - 1].score : 0)) {
            merged = true;
        }

        if (merged) {
            playSound('merge');
        } else {
            playSound('move');
        }

        addNewTile();
        updateBoardView();
        checkGameState();
        saveGameState();
        saveHistory();
    }
}


// Core movement logic
function move(direction) {
    let moved = false;
    let originalBoard = JSON.parse(JSON.stringify(board)); // Deep copy

    for (let i = 0; i < gridSize; i++) {
        let line = [];
        if (direction === 'up') line = getColumn(i);
        else if (direction === 'down') line = getColumn(i).reverse();
        else if (direction === 'left') line = getRow(i);
        else if (direction === 'right') line = getRow(i).reverse();

        let newLine = slideAndCombine(line);

        if (direction === 'up') setColumn(i, newLine);
        else if (direction === 'down') setColumn(i, newLine.reverse());
        else if (direction === 'left') setRow(i, newLine);
        else if (direction === 'right') setRow(i, newLine.reverse());
    }

    // Check if any tile actually moved or combined
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (originalBoard[r][c] !== board[r][c]) {
                moved = true;
                break;
            }
        }
        if (moved) break;
    }
    return moved;
}

// slideAndCombine function
function slideAndCombine(line) {
    let filteredLine = line.filter(val => val !== 0);
    let newLine = [];

    // Combine tiles
    for (let i = 0; i < filteredLine.length; i++) {
        if (i < filteredLine.length - 1 && filteredLine[i] === filteredLine[i + 1]) {
            const mergedValue = filteredLine[i] * 2;
            newLine.push(mergedValue);
            score += mergedValue;
            i++; // Skip next tile as it's already merged
        } else {
            newLine.push(filteredLine[i]);
        }
    }

    // Fill the rest with zeros
    while (newLine.length < gridSize) {
        newLine.push(0);
    }
    
    return newLine;
}

// Helper functions
function getRow(rowNum) { return board[rowNum]; }
function setRow(rowNum, newRow) { board[rowNum] = newRow; }
function getColumn(colNum) { return Array.from({ length: gridSize }, (_, r) => board[r][colNum]); }
function setColumn(colNum, newCol) {
    for (let r = 0; r < gridSize; r++) {
        board[r][colNum] = newCol[r];
    }
}

// Check if the board is full
function isBoardFull() {
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (board[r][c] === 0) {
                return false;
            }
        }
    }
    return true;
}

// Check if there are any possible moves left
function hasPossibleMoves() {
    if (!isBoardFull()) {
        return true;
    }
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const value = board[r][c];
            if (c < gridSize - 1 && value === board[r][c + 1]) return true;
            if (r < gridSize - 1 && value === board[r + 1][c]) return true;
        }
    }
    return false;
}

// Check for win/loss conditions
function checkGameState() {
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (board[r][c] === 2048 && !gameWon) { // Check !gameWon to only trigger once
                gameWon = true;
                gameOver = true;
                displayGameMessage('You Win!');
                checkAchievements(); // Check achievements on win
                saveGameState(); // Save state on win
                return;
            }
        }
    }

    if (isBoardFull() && !hasPossibleMoves()) {
        gameOver = true;
        displayGameMessage('Game Over!');
        saveGameState(); // Save state on game over
    }
}

function displayGameMessage(message) {
    gameStatus.textContent = message;
    gameMessage.style.display = 'flex';
}

// --- Achievement Functions ---
function loadAchievements() {
    const savedAchievements = JSON.parse(localStorage.getItem('2048_achievements') || '{}');
    for (const key in achievements) {
        if (savedAchievements[key]) {
            achievements[key].unlocked = savedAchievements[key].unlocked;
            if (achievements[key].counter !== undefined) {
                achievements[key].counter = savedAchievements[key].counter;
            }
        }
    }
}

function saveAchievements() {
    const achievementsToSave = {};
    for (const key in achievements) {
        achievementsToSave[key] = {
            unlocked: achievements[key].unlocked,
            counter: achievements[key].counter // Save counter if it exists
        };
    }
    localStorage.setItem('2048_achievements', JSON.stringify(achievementsToSave));
}

function checkAchievements() {
    let newAchievementUnlocked = false;

    // Check for tile achievements
    let maxTile = 0;
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (board[r][c] > maxTile) {
                maxTile = board[r][c];
            }
        }
    }

    // Check and unlock achievements
    for (const key in achievements) {
        const achievement = achievements[key];
        let conditionMet = false;

        if (key.startsWith('tile_') && maxTile >= parseInt(key.split('_')[1])) {
            conditionMet = true;
        } else if (key.startsWith('score_') && score >= parseInt(key.split('_')[1])) {
            conditionMet = true;
        } else if (key === 'first_win' && gameWon) {
            conditionMet = true;
        } else if (key === 'sound_enthusiast' && achievement.counter >= 10) {
            conditionMet = true;
        }

        if (conditionMet && !achievement.unlocked) {
            achievement.unlocked = true;
            newAchievementUnlocked = true;
            
            // Removed: Unlocking corresponding profile icon
            // if (achievement.iconClass && !profile.unlockedIcons.includes(achievement.iconClass)) {
            //     profile.unlockedIcons.push(achievement.iconClass);
            //     saveProfile(); // Save profile when a new icon is unlocked
            //     updateProfileView();
            // }
        }
    }

    if (newAchievementUnlocked) {
        saveAchievements(); 
        updateAchievementsView();
    }
}

function updateAchievementsView() {
    achievementsList.innerHTML = ''; // Clear current list

    // Separate unlocked and locked achievements
    const unlocked = [];
    const locked = [];
    for (const key in achievements) {
        const achievement = achievements[key];
        if (achievement.unlocked) {
            unlocked.push(achievement);
        } else {
            locked.push(achievement);
        }
    }

    // Sort unlocked achievements alphabetically
    unlocked.sort((a, b) => a.name.localeCompare(b.name));
    // Sort locked achievements alphabetically
    locked.sort((a, b) => a.name.localeCompare(b.name));

    // Append unlocked achievements first
    unlocked.forEach(achievement => {
        const achievementElement = document.createElement('div');
        achievementElement.classList.add('achievement-item', 'unlocked', 'flex', 'items-center', 'gap-2');
        achievementElement.innerHTML = `<i class="fas fa-trophy"></i> <span>${achievement.name}: ${achievement.description}</span>`;
        achievementsList.appendChild(achievementElement);
    });

    // Append locked achievements next
    locked.forEach(achievement => {
        const achievementElement = document.createElement('div');
        achievementElement.classList.add('achievement-item', 'locked', 'flex', 'items-center', 'gap-2');
        achievementElement.innerHTML = `<i class="fas fa-lock"></i> <span>${achievement.name}: ${achievement.description}</span>`;
        achievementsList.appendChild(achievementElement);
    });
}
// --- End Achievement Functions ---


// --- Profile Functions (NEW) ---
function loadProfile() {
    const savedProfile = JSON.parse(localStorage.getItem('2048_profile') || '{}');
    profile.playerName = savedProfile.playerName || 'Player';
    profile.unlockedIcons = savedProfile.unlockedIcons || [];

    // Ensure no duplicate icons if old achievements had icons and new ones do
    profile.unlockedIcons = [...new Set(profile.unlockedIcons)];
}

function saveProfile() {
    localStorage.setItem('2048_profile', JSON.stringify(profile));
}

function updateProfileView() {
    playerNameInput.value = profile.playerName;
    profileScoreDisplay.textContent = score;
    profileBestScoreDisplay.textContent = bestScore;
    
    unlockedIconsList.innerHTML = ''; // Clear current list

    // Changed: always show "Coming Soon" message
    unlockedIconsList.innerHTML = '<p class="text-gray-400 text-center col-span-3">Coming Soon...</p>';
}
// --- End Profile Functions ---


// Function to hide all main menu buttons
function hideMainMenuButtons() {
    settingsButton.classList.add('button-hidden');
    achievementsButton.classList.add('button-hidden');
    profileButton.classList.add('button-hidden');
}

// Function to show all main menu buttons
function showMainMenuButtons() {
    settingsButton.classList.remove('button-hidden');
    achievementsButton.classList.remove('button-hidden');
    profileButton.classList.remove('button-hidden');
}


// Event listeners
restartButton.addEventListener('click', () => initializeGame(false));
infoButton.addEventListener('click', () => { infoModal.classList.remove('hidden'); });
closeInfoModalButton.addEventListener('click', () => { infoModal.classList.add('hidden'); });
window.addEventListener('click', (event) => {
    if (event.target === infoModal) {
        infoModal.classList.add('hidden');
    }
});
undoButton.addEventListener('click', () => {
    undoLastMove();
    settingsMenu.classList.remove('open'); // Close settings menu after undo
    showMainMenuButtons(); // Show all buttons after closing menu
});
toggleSoundButton.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem('soundEnabled', soundEnabled.toString());
    updateSoundButtonText();
});
// Volume slider event listener
volumeSlider.addEventListener('input', (event) => {
    gameVolume = parseFloat(event.target.value);
    localStorage.setItem('gameVolume', gameVolume.toString());
    if (typeof Tone !== 'undefined') {
        Tone.Destination.volume.value = Tone.gainToDb(gameVolume);
    }
});

// Event handlers for settings menu
settingsButton.addEventListener('click', () => {
    settingsMenu.classList.toggle('open'); 
    if (settingsMenu.classList.contains('open')) {
        hideMainMenuButtons();
    } else {
        showMainMenuButtons();
    }
});

closeSettingsMenuButton.addEventListener('click', () => {
    settingsMenu.classList.remove('open');
    showMainMenuButtons();
});

// Event handlers for achievements menu
achievementsButton.addEventListener('click', () => {
    achievementsMenu.classList.toggle('open');
    if (achievementsMenu.classList.contains('open')) {
        hideMainMenuButtons();
        updateAchievementsView(); // Update achievements when opening the achievements menu
    } else {
        showMainMenuButtons();
    }
});

closeAchievementsMenuButton.addEventListener('click', () => {
    achievementsMenu.classList.remove('open');
    showMainMenuButtons();
});

// Event handlers for profile menu (NEW)
profileButton.addEventListener('click', () => {
    profileMenu.classList.toggle('open');
    if (profileMenu.classList.contains('open')) {
        hideMainMenuButtons();
        updateProfileView(); // Update profile view when opening
    } else {
        showMainMenuButtons();
    }
});

closeProfileMenuButton.addEventListener('click', () => {
    profileMenu.classList.remove('open');
    showMainMenuButtons();
    saveProfile(); // Save profile name on close
});

playerNameInput.addEventListener('input', () => {
    profile.playerName = playerNameInput.value;
    // No need to saveProfile here, it's saved on menu close for performance.
});

// Handler for the "New Game" button
resetButtonMain.addEventListener('click', () => {
    initializeGame(false); // Start a new game
    settingsMenu.classList.remove('open'); // Close menus after reset
    achievementsMenu.classList.remove('open');
    profileMenu.classList.remove('open'); // NEW
    showMainMenuButtons(); // Show all buttons
});
