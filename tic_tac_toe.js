// DOM Elements
const gameContainer = document.getElementById('game-container');
// Score displays removed - no longer needed
const gameMessage = document.getElementById('game-message');
const gameStatusText = document.getElementById('game-status');
const restartButton = document.getElementById('restart-button');

// Menu Elements (similar to 2048)
const settingsButton = document.getElementById('settings-button');
const settingsMenu = document.getElementById('settings-menu');
const closeSettingsMenuButton = document.getElementById('close-settings-menu-button');
const achievementsButton = document.getElementById('achievements-button');
const achievementsMenu = document.getElementById('achievements-menu');
const closeAchievementsMenuButton = document.getElementById('close-achievements-menu-button');
const achievementsList = document.getElementById('achievements-list'); 
const profileButton = document.getElementById('profile-button');
const profileMenu = document.getElementById('profile-menu');
const closeProfileMenuButton = document.getElementById('close-profile-menu-button');
const playerNameInput = document.getElementById('player-name-input');
// Profile score displays removed - no longer needed
const unlockedIconsList = document.getElementById('unlocked-icons-list'); // For "Coming Soon" message

const infoButton = document.getElementById('info-button');
const infoModal = document.getElementById('info-modal');
const closeInfoModalButton = document.getElementById('close-info-modal');
const toggleSoundButton = document.getElementById('toggle-sound-button');
const soundIcon = document.getElementById('sound-icon');
const soundText = document.getElementById('sound-text');
const volumeSlider = document.getElementById('volume-slider');
const resetButtonMain = document.getElementById('reset-button-main');

// Game Mode Links (now links instead of buttons)
const modeFriendLink = document.getElementById('mode-friend-link');
const modeBotLink = document.getElementById('mode-bot-link');

// New AI mode specific elements (will be null on friend page, handled)
const aiModeStartGameSection = document.getElementById('ai-mode-start-game-section');
const playAsXButton = document.getElementById('play-as-x-button');
const playAsOButton = document.getElementById('play-as-o-button');
const startGameButton = document.getElementById('start-game-button');
const playerXLabel = document.getElementById('player-x-label'); // For You/AI label, not score
const playerOLabel = document.getElementById('player-o-label'); // For You/AI label, not score
const aiIconIndicator = document.getElementById('ai-icon-indicator'); // New AI icon element


// Game State Variables
let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = false; // Changed to false by default for AI mode to show start screen
                        // For friend mode, it will be set to true later in initializeGame

// Score counters removed, no longer needed

// Determine gameMode from a global variable set in the HTML (tic_tac_toe.html or tic_tac_toe_ai.html)
let gameMode = window.TIC_TAC_TOE_GAME_MODE || 'friend'; // Default to 'friend' if not set
let humanPlayerSymbol = 'X'; // Default human player symbol in AI mode

let soundEnabled = true;
let gameVolume = 1.0;
let profileName = 'Player'; 

// Sound effects (using Tone.js)
let moveSound = null;
let winSound = null;
let drawSound = null;

// Achievements definition (simplified for Tic-Tac-Toe)
const achievements = {
    'first_win_x': { name: 'X Factor', description: 'Win a game as X', unlocked: false, iconClass: 'fas fa-times' },
    'first_win_o': { name: 'O-mazing Victory', description: 'Win a game as O', unlocked: false, iconClass: 'fas fa-circle' },
    'first_ai_win': { name: 'Bot Slayer', description: 'Win a game against the AI', unlocked: false, iconClass: 'fas fa-robot' },
    'sound_toggler': { name: 'Sound Master', description: 'Toggle sound 5 times', unlocked: false, counter: 0, iconClass: 'fas fa-volume-up' }
};

// Winning conditions for Tic-Tac-Toe
const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

// Initialize Tone.js and game on window load
window.addEventListener('load', () => {
    // Only initialize if Tone is available
    if (typeof Tone !== 'undefined') {
        Tone.Destination.volume.value = Tone.gainToDb(gameVolume); 

        moveSound = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sine" },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.05, release: 0.1 }
        }).toDestination();
        winSound = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 0.05, decay: 0.2, sustain: 0.1, release: 0.3 },
            volume: -10 
        }).toDestination();
        drawSound = new Tone.NoiseSynth({
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.0, release: 0.1 }
        }).toDestination();
    }
    initializeGame(); // Initial game setup, no resetScores parameter needed now
});

// --- Game Core Logic ---

// Initializes or resets the game
function initializeGame() { // Removed resetScores parameter
    loadGameState(); // This loads saved gameActive state, humanPlayerSymbol, etc.

    board = ['', '', '', '', '', '', '', '', '']; // Always clear board for a new game logic
    currentPlayer = 'X'; // Always starts as X
    gameMessage.classList.add('hidden'); // Always hide game message

    renderBoard(); 
    updateProfileView();
    updateAchievementsView();
    updateSoundButtonText(true); 
    // highlightCurrentPlayer(); // Removed functionality as score displays are gone
    updateGameModeLinkStyles(); 

    if (gameMode === 'ai') {
        if (aiIconIndicator) aiIconIndicator.classList.remove('hidden'); // Ensure AI icon is shown
        
        // For AI mode, always display the symbol selection screen initially,
        // unless a game was actively loaded (gameActive from localStorage is true)
        if (aiModeStartGameSection) { // Ensure element exists
            // Always show the start menu on initial load or New Game click
            gameActive = false; // Force game to be inactive to show start menu
            aiModeStartGameSection.classList.remove('hidden');
            gameContainer.parentElement.classList.add('hidden'); // Hide game board

            // Load humanPlayerSymbol from storage if available, otherwise default to 'X'
            humanPlayerSymbol = localStorage.getItem('tictactoe_humanPlayerSymbol') || 'X'; 
            updateSymbolChoiceButtons(); // Set button styles based on loaded/default symbol
            updateScoreDisplays(); // Update 'You' / 'AI' labels
        }
    } else { // Friend mode
        if (aiModeStartGameSection) aiModeStartGameSection.classList.add('hidden'); // Hide AI specific UI
        if (aiIconIndicator) aiIconIndicator.classList.add('hidden'); // Hide AI icon
        gameContainer.parentElement.classList.remove('hidden'); // Show game board
        gameActive = true; // For friend mode, game is active immediately
        updateScoreDisplays(); // Update labels (Player X/O - static in HTML)
    }
    saveGameState(); // Save the new gameActive state (false for AI, true for Friend)
}

// Renders the Tic-Tac-Toe board cells
function renderBoard() {
    gameContainer.innerHTML = ''; 
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell', 'rounded-lg', 'shadow-md', 'flex', 'items-center', 'justify-center');
        cell.dataset.index = i;
        cell.addEventListener('click', handleCellClick);
        gameContainer.appendChild(cell);
        
        // Update cell content if board has saved state
        if (board[i] !== '') {
            cell.textContent = board[i];
            cell.classList.add(board[i].toLowerCase(), 'occupied');
        }
    }
}

// Handles a click on a cell
function handleCellClick(event) {
    const clickedCell = event.target;
    const clickedCellIndex = parseInt(clickedCell.dataset.index);

    if (board[clickedCellIndex] !== '' || !gameActive) {
        return; 
    }

    // Prevent human player from making a move if it's AI's turn
    const aiSymbol = (humanPlayerSymbol === 'X') ? 'O' : 'X';
    if (gameMode === 'ai' && currentPlayer === aiSymbol) {
        return; // It's AI's turn, human cannot click
    }

    makeMove(clickedCell, clickedCellIndex, currentPlayer);
    
    // If game is still active and it's AI mode, and it's AI's turn, make AI move
    if (gameActive && gameMode === 'ai' && currentPlayer === aiSymbol) {
        setTimeout(aiMove, 500); 
    }
}

// Makes a move on the board
function makeMove(cellElement, index, player) {
    board[index] = player;
    cellElement.textContent = player;
    cellElement.classList.add(player.toLowerCase(), 'occupied');
    playSound('move');

    if (checkWin()) {
        endGame(player);
        return;
    }
    if (checkDraw()) {
        endGame('draw');
        return;
    }

    // Switch player
    currentPlayer = (currentPlayer === 'X') ? 'O' : 'X';
    // highlightCurrentPlayer(); // Removed functionality
    saveGameState(); 
}

// Checks for a win condition
function checkWin() {
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return true;
        }
    }
    return false;
}

// Checks for a draw condition
function checkDraw() {
    return !board.includes('');
}

// Ends the game and displays the result
function endGame(result) {
    gameActive = false;
    if (result === 'draw') {
        gameStatusText.textContent = "It's a Draw!";
        playSound('draw');
    } else {
        // Determine if human or AI won
        const winnerSymbol = result;

        let winnerText = `Player ${winnerSymbol} Wins!`;
        if (gameMode === 'ai') {
            if (winnerSymbol === humanPlayerSymbol) {
                winnerText = `You Win! (${winnerSymbol})`;
            } else {
                winnerText = `AI Wins! (${winnerSymbol})`;
            }
        }
        gameStatusText.textContent = winnerText;
        playSound('win');

        // Update achievements (score-related achievements removed)
        if (gameMode === 'ai' && winnerSymbol === humanPlayerSymbol) {
            achievements.first_ai_win.unlocked = true; 
        }
        
        if (winnerSymbol === 'X') {
            achievements.first_win_x.unlocked = true; 
        } else { // winnerSymbol === 'O'
            achievements.first_win_o.unlocked = true; 
        }
    }
    gameMessage.classList.remove('hidden');
    checkAchievements(); 
    saveGameState(); 
    saveAchievements();
    updateProfileView(); 
}

// Updates the score displays on the UI
function updateScoreDisplays() {
    // Update labels dynamically for AI mode if elements exist
    if (gameMode === 'ai') {
        if (playerXLabel) playerXLabel.textContent = (humanPlayerSymbol === 'X') ? 'You' : 'AI';
        if (playerOLabel) playerOLabel.textContent = (humanPlayerSymbol === 'O') ? 'You' : 'AI';
    } else { // Friend mode
        // For friend mode, the labels are static in HTML, no need to update dynamically from JS
        // The HTML already contains "Player X" and "Player O" labels for friend mode.
    }
}

// Highlights the current player (functionality removed as score displays are gone)
function highlightCurrentPlayer() {
    // No action needed as score display elements are removed
}

// --- AI Logic (Simple Random Move) ---
function aiMove() {
    if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
        Tone.start();
    }
    const emptyCells = [];
    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
            emptyCells.push(i);
        }
    }

    if (emptyCells.length > 0) {
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const cellIndexToPlay = emptyCells[randomIndex];
        const cellElement = gameContainer.children[cellIndexToPlay];
        const aiSymbol = (humanPlayerSymbol === 'X') ? 'O' : 'X';
        makeMove(cellElement, cellIndexToPlay, aiSymbol); // AI always plays the opposite symbol
    } else {
        if (gameActive && !checkWin()) { 
             endGame('draw');
        }
    }
}

// --- Sound Functions ---
function playSound(type) {
    if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
        Tone.start();
    }
    if (!soundEnabled || !Tone) return;

    if (type === 'move' && moveSound) {
        moveSound.triggerAttackRelease('C4', '16n');
    } else if (type === 'win' && winSound) {
        winSound.triggerAttackRelease(['C5', 'E5', 'G5'], '4n');
    } else if (type === 'draw' && drawSound) {
        drawSound.triggerAttackRelease('8n');
    }
}

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
    if (!isInitializing) {
        achievements.sound_toggler.counter = (achievements.sound_toggler.counter || 0) + 1;
        checkAchievements();
    }
}

// Helper function to update symbol choice button styles
function updateSymbolChoiceButtons() {
    if (playAsXButton && playAsOButton) {
        // Reset styles for both buttons first
        playAsXButton.classList.remove('bg-blue-600', 'text-white', 'hover:bg-blue-700', 'bg-gray-400', 'text-gray-800', 'hover:bg-gray-500');
        playAsOButton.classList.remove('bg-blue-600', 'text-white', 'hover:bg-blue-700', 'bg-gray-400', 'text-gray-800', 'hover:bg-gray-500');

        if (humanPlayerSymbol === 'X') {
            playAsXButton.classList.add('bg-blue-600', 'text-white', 'hover:bg-blue-700');
            playAsOButton.classList.add('bg-gray-400', 'text-gray-800', 'hover:bg-gray-500');
        } else {
            playAsOButton.classList.add('bg-blue-600', 'text-white', 'hover:bg-blue-700');
            playAsXButton.classList.add('bg-gray-400', 'text-gray-800', 'hover:bg-gray-500');
        }
    }
}

// --- Local Storage Functions ---
function saveGameState() {
    localStorage.setItem('tictactoe_board', JSON.stringify(board));
    localStorage.setItem('tictactoe_currentPlayer', currentPlayer);
    localStorage.setItem('tictactoe_gameActive', gameActive.toString()); // Save gameActive state
    localStorage.setItem('tictactoe_gameMode', gameMode); 
    localStorage.setItem('tictactoe_soundEnabled', soundEnabled.toString());
    localStorage.setItem('tictactoe_gameVolume', gameVolume.toString());
    localStorage.setItem('tictactoe_humanPlayerSymbol', humanPlayerSymbol); // Save human symbol
}

function loadGameState() {
    const savedBoard = localStorage.getItem('tictactoe_board');
    const savedCurrentPlayer = localStorage.getItem('tictactoe_currentPlayer');
    const savedGameActive = localStorage.getItem('tictactoe_gameActive'); // Load gameActive state
    const savedSoundEnabled = localStorage.getItem('tictactoe_soundEnabled');
    const savedGameVolume = localStorage.getItem('tictactoe_gameVolume');
    const savedHumanPlayerSymbol = localStorage.getItem('tictactoe_humanPlayerSymbol');

    if (savedBoard) board = JSON.parse(savedBoard);
    if (savedCurrentPlayer) currentPlayer = savedCurrentPlayer;
    if (savedGameActive !== null) gameActive = savedGameActive === 'true'; // Set gameActive from loaded state
    if (savedSoundEnabled !== null) soundEnabled = savedSoundEnabled === 'true';
    if (savedGameVolume) gameVolume = parseFloat(savedGameVolume);
    if (savedHumanPlayerSymbol) humanPlayerSymbol = savedHumanPlayerSymbol; // Load human symbol

    volumeSlider.value = gameVolume;
    if (typeof Tone !== 'undefined') {
        Tone.Destination.volume.value = Tone.gainToDb(gameVolume);
    }
}

// --- Achievement Functions ---
function loadAchievements() {
    const savedAchievements = JSON.parse(localStorage.getItem('tictactoe_achievements') || '{}');
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
            counter: achievements[key].counter 
        };
    }
    localStorage.setItem('tictactoe_achievements', JSON.stringify(achievementsToSave));
}

function checkAchievements() {
    saveAchievements();
    updateAchievementsView(); 
}

function updateAchievementsView() {
    achievementsList.innerHTML = ''; 

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

    unlocked.sort((a, b) => a.name.localeCompare(b.name));
    locked.sort((a, b) => a.name.localeCompare(b.name));

    unlocked.forEach(achievement => {
        const achievementElement = document.createElement('div');
        achievementElement.classList.add('achievement-item', 'unlocked', 'flex', 'items-center', 'gap-2');
        achievementElement.innerHTML = `<i class="fas fa-trophy"></i> <span>${achievement.name}: ${achievement.description}</span>`;
        achievementsList.appendChild(achievementElement);
    });

    locked.forEach(achievement => {
        const achievementElement = document.createElement('div');
        achievementElement.classList.add('achievement-item', 'locked', 'flex', 'items-center', 'gap-2');
        achievementElement.innerHTML = `<i class="fas fa-lock"></i> <span>${achievement.name}: ${achievement.description}</span>`;
        achievementsList.appendChild(achievementElement);
    });
}

// --- Profile Functions ---
function loadProfile() {
    profileName = localStorage.getItem('tictactoe_playerName') || 'Player';
}

function saveProfile() {
    localStorage.setItem('tictactoe_playerName', profileName);
}

function updateProfileView() {
    playerNameInput.value = profileName;
    // Profile score displays removed - no longer needed
    
    unlockedIconsList.innerHTML = '<p class="text-gray-400 text-center col-span-3">Coming Soon...</p>';
}

// --- Menu Helper Functions ---
function hideMainMenuButtons() {
    settingsButton.classList.add('button-hidden');
    achievementsButton.classList.add('button-hidden');
    profileButton.classList.add('button-hidden');
}

function showMainMenuButtons() {
    settingsButton.classList.remove('button-hidden');
    achievementsButton.classList.remove('button-hidden');
    profileButton.classList.remove('button-hidden');
}

// This function now highlights the correct link based on the current page's gameMode
function updateGameModeLinkStyles() {
    // Ensure links exist before trying to manipulate their classes
    if (modeFriendLink) {
        modeFriendLink.classList.remove('bg-indigo-600', 'text-white', 'bg-gray-700', 'text-gray-300', 'hover:bg-gray-600', 'hover:bg-indigo-700');
        modeFriendLink.classList.add('bg-gray-700', 'text-gray-300', 'hover:bg-gray-600');
    }
    if (modeBotLink) {
        modeBotLink.classList.remove('bg-indigo-600', 'text-white', 'bg-gray-700', 'text-gray-300', 'hover:bg-gray-600', 'hover:bg-indigo-700');
        modeBotLink.classList.add('bg-gray-700', 'text-gray-300', 'hover:bg-gray-600');
    }

    // Determine the current page's mode and apply active styles
    const currentPageMode = window.TIC_TAC_TOE_GAME_MODE; 
    if (currentPageMode === 'friend' && modeFriendLink) {
        modeFriendLink.classList.remove('bg-gray-700', 'text-gray-300', 'hover:bg-gray-600');
        modeFriendLink.classList.add('bg-indigo-600', 'text-white', 'hover:bg-indigo-700');
    } else if (currentPageMode === 'ai' && modeBotLink) { 
        modeBotLink.classList.remove('bg-gray-700', 'text-gray-300', 'hover:bg-gray-600');
        modeBotLink.classList.add('bg-indigo-600', 'text-white', 'hover:bg-indigo-700');
    }
}

// --- Event Listeners ---

// Game restart button (on game over message)
restartButton.addEventListener('click', () => initializeGame()); // Removed parameter

// Settings menu
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

// Information modal
infoButton.addEventListener('click', () => { 
    if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
        Tone.start();
    }
    infoModal.classList.remove('hidden'); 
});
closeInfoModalButton.addEventListener('click', () => { infoModal.classList.add('hidden'); });
window.addEventListener('click', (event) => {
    if (event.target === infoModal) {
        infoModal.classList.add('hidden');
    }
});

// Sound toggle
toggleSoundButton.addEventListener('click', () => {
    if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
        Tone.start();
    }
    soundEnabled = !soundEnabled;
    localStorage.setItem('tictactoe_soundEnabled', soundEnabled.toString());
    updateSoundButtonText();
});

// Volume slider
volumeSlider.addEventListener('input', (event) => {
    if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
        Tone.start();
    }
    gameVolume = parseFloat(event.target.value);
    localStorage.setItem('tictactoe_gameVolume', gameVolume.toString());
    if (typeof Tone !== 'undefined') {
        Tone.Destination.volume.value = Tone.gainToDb(gameVolume);
    }
});

// Main reset button (in settings)
resetButtonMain.addEventListener('click', (event) => { // Pass event to initializeGame
    initializeGame(event); 
    settingsMenu.classList.remove('open'); 
    achievementsMenu.classList.remove('open');
    profileMenu.classList.remove('open');
    showMainMenuButtons();
});

// Achievements menu
achievementsButton.addEventListener('click', () => {
    if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
        Tone.start();
    }
    achievementsMenu.classList.toggle('open');
    if (achievementsMenu.classList.contains('open')) {
        hideMainMenuButtons();
        updateAchievementsView();
    } else {
        showMainMenuButtons();
    }
});
closeAchievementsMenuButton.addEventListener('click', () => {
    achievementsMenu.classList.remove('open');
    showMainMenuButtons();
});

// Profile menu
profileButton.addEventListener('click', () => {
    if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
        Tone.start();
    }
    profileMenu.classList.toggle('open');
    if (profileMenu.classList.contains('open')) {
        hideMainMenuButtons();
        updateProfileView();
    } else {
        showMainMenuButtons();
    }
});
closeProfileMenuButton.addEventListener('click', () => {
    profileMenu.classList.remove('open');
    showMainMenuButtons();
    saveProfile(); // Save profile name on close
});

playerNameInput.addEventListener('input', (event) => {
    profileName = event.target.value;
});

// --- AI Mode specific Event Listeners ---
// Only attach these listeners if the elements exist (i.e., we are on the AI page)
if (aiModeStartGameSection) {
    playAsXButton.addEventListener('click', () => {
        humanPlayerSymbol = 'X';
        updateSymbolChoiceButtons(); // Use helper function
        updateScoreDisplays(); 
        saveGameState(); // Save selected symbol
    });

    playAsOButton.addEventListener('click', () => {
        humanPlayerSymbol = 'O';
        updateSymbolChoiceButtons(); // Use helper function
        updateScoreDisplays(); 
        saveGameState(); // Save selected symbol
    });

    startGameButton.addEventListener('click', () => {
        if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
            Tone.start();
        }
        aiModeStartGameSection.classList.add('hidden');
        gameContainer.parentElement.classList.remove('hidden'); // Show game board
        gameActive = true; // Game is now active
        board = ['', '', '', '', '', '', '', '', '']; // Clear board
        renderBoard();

        // Determine who starts based on chosen symbol
        // The player who chose 'X' always makes the first move.
        if (humanPlayerSymbol === 'X') {
            currentPlayer = 'X'; // Human (X) starts
        } else { // humanPlayerSymbol === 'O'
            currentPlayer = 'X'; // AI (as X) starts, human (O) is second
            setTimeout(aiMove, 500); // AI makes the first move
        }
        // highlightCurrentPlayer(); // Removed functionality
        saveGameState(); // Save initial game state after start
    });
}
