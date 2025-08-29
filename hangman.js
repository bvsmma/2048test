// DOM Elements
const hangmanDrawingArea = document.getElementById('hangman-drawing-area');
const wordDisplay = document.getElementById('word-display');
const correctGuessesSpan = document.getElementById('correct-guesses');
const wrongGuessesSpan = document.getElementById('wrong-guesses');
const alphabetButtonsContainer = document.getElementById('alphabet-buttons');
const gameMessage = document.getElementById('game-message');
const gameStatusText = document.getElementById('game-status');
const restartButton = document.getElementById('restart-button');

// Menu Elements (similar to other games)
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
const unlockedIconsList = document.getElementById('unlocked-icons-list'); 

const infoButton = document.getElementById('info-button');
const infoModal = document.getElementById('info-modal');
const closeInfoModalButton = document.getElementById('close-info-modal');
const toggleSoundButton = document.getElementById('toggle-sound-button');
const soundIcon = document = document.getElementById('sound-icon');
const soundText = document.getElementById('sound-text');
const volumeSlider = document.getElementById('volume-slider');
const resetButtonMain = document.getElementById('reset-button-main');

// Game Mode Links (for settings menu)
// Removed references to Tic-Tac-Toe links
const modeHangmanLink = document.getElementById('mode-hangman-link');

// Game State Variables
const wordCategories = {
    'Fruits': ['APPLE', 'BANANA', 'PEAR', 'ORANGE', 'MANGO', 'LEMON'],
    'Animals': ['DOG', 'CAT', 'LION', 'TIGER', 'ELEPHANT', 'PANDA'],
    'Countries': ['RUSSIA', 'USA', 'CHINA', 'INDIA', 'BRAZIL', 'CANADA']
};
let currentCategory = 'Fruits'; // Default category
let selectedWord = '';
let guessedLetters = [];
let wrongGuessesCount = 0;
const maxWrongGuesses = 10; // Corresponds to the number of hangman parts
let gameActive = false;

let soundEnabled = true;
let gameVolume = 1.0;
let profileName = 'Player'; 

// Sound effects (using Tone.js)
let guessCorrectSound = null;
let guessWrongSound = null;
let winSound = null;
let loseSound = null;

// Parts of the hangman drawing (SVG element IDs)
const hangmanParts = [
    'base', 'upright', 'arm', 'rope', 'head', 'body', 'arm-left', 'arm-right', 'leg-left', 'leg-right'
];

// Achievements definition for Hangman
const achievements = {
    'first_hangman_win': { name: 'Freedom!', description: 'Win one Hangman game', unlocked: false, iconClass: 'fas fa-gavel' },
    'win_5_hangman_games': { name: 'Word Master', description: 'Win 5 Hangman games', unlocked: false, counter: 0, iconClass: 'fas fa-book-reader' },
    'guess_all_vowels': { name: 'Vowel Expert', description: 'Guess all vowels (A, E, I, O, U) in one game', unlocked: false, iconClass: 'fas fa-font' },
    'no_wrong_guesses': { name: 'Perfect Guess', description: 'Win a game without any wrong guesses', unlocked: false, iconClass: 'fas fa-star' },
    'sound_toggler_hangman': { name: 'Sound Maestro', description: 'Toggle sound 5 times', unlocked: false, counter: 0, iconClass: 'fas fa-volume-up' }
};

// Initialize Tone.js and game on window load
window.addEventListener('load', () => {
    // Only initialize if Tone is available
    if (typeof Tone !== 'undefined') {
        Tone.Destination.volume.value = Tone.gainToDb(gameVolume); 

        guessCorrectSound = new Tone.Synth({
            oscillator: { type: "sine" },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.05, release: 0.1 }
        }).toDestination();
        guessWrongSound = new Tone.NoiseSynth({
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.0, release: 0.1 }
        }).toDestination();
        winSound = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 0.05, decay: 0.2, sustain: 0.1, release: 0.3 },
            volume: -10 
        }).toDestination();
        loseSound = new Tone.MembraneSynth().toDestination();
    }
    initializeGame(); // Initial game setup
});

// --- Game Core Logic ---

function initializeGame() {
    loadGameState(); // Load sound settings, profile name etc.
    loadAchievements();

    selectedWord = chooseWord();
    guessedLetters = [];
    wrongGuessesCount = 0;
    gameActive = true;
    gameMessage.classList.add('hidden'); // Hide game over message

    renderBoard();
    drawHangman();
    generateAlphabetButtons();
    updateGuessedLettersDisplay();
    updateSoundButtonText(true);
    updateGameModeLinkStyles(); // Highlight current game mode link
    updateProfileView();
    updateAchievementsView();
    saveGameState(); // Save initial game state
}

function chooseWord() {
    const words = wordCategories[currentCategory];
    return words[Math.floor(Math.random() * words.length)];
}

function renderBoard() {
    wordDisplay.textContent = selectedWord.split('').map(letter => {
        return guessedLetters.includes(letter) ? letter : '_';
    }).join(' ');
}

function generateAlphabetButtons() {
    alphabetButtonsContainer.innerHTML = '';
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(''); // English alphabet
    alphabet.forEach(letter => {
        const button = document.createElement('button');
        button.textContent = letter;
        button.classList.add('alphabet-button', 'px-3', 'py-2', 'text-xl', 'font-bold', 'rounded-lg', 'shadow-md', 'bg-indigo-600', 'text-white', 'hover:bg-indigo-700', 'transition-all', 'duration-200');
        button.addEventListener('click', () => handleGuess(letter));
        alphabetButtonsContainer.appendChild(button);
    });
}

function updateGuessedLettersDisplay() {
    const correctUnique = [...new Set(guessedLetters.filter(letter => selectedWord.includes(letter)))].join(', ');
    const wrongUnique = [...new Set(guessedLetters.filter(letter => !selectedWord.includes(letter)))].join(', ');
    
    correctGuessesSpan.textContent = correctUnique || '-';
    wrongGuessesSpan.textContent = wrongUnique || '-';
}

function drawHangman() {
    // Hide all parts first
    hangmanParts.forEach(partId => {
        const part = document.getElementById(partId);
        if (part) part.style.display = 'none';
    });

    // Show parts based on wrongGuessesCount
    for (let i = 0; i < wrongGuessesCount; i++) {
        const part = document.getElementById(hangmanParts[i]);
        if (part) part.style.display = 'block';
    }
}

function handleGuess(letter) {
    if (!gameActive || guessedLetters.includes(letter)) {
        return;
    }

    guessedLetters.push(letter);
    const button = Array.from(alphabetButtonsContainer.children).find(btn => btn.textContent === letter);
    if (button) {
        button.disabled = true;
        button.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
    }

    if (selectedWord.includes(letter)) {
        playSound('correct');
        if (button) button.classList.add('correct');
        renderBoard();
        if (checkWin()) {
            endGame(true);
        }
    } else {
        playSound('wrong');
        wrongGuessesCount++;
        if (button) button.classList.add('wrong');
        drawHangman();
        updateGuessedLettersDisplay();
        if (checkLose()) {
            endGame(false);
        }
    }
    saveGameState(); // Save game state after each guess
}

function checkWin() {
    return selectedWord.split('').every(letter => guessedLetters.includes(letter));
}

function checkLose() {
    return wrongGuessesCount >= maxWrongGuesses;
}

function endGame(win) {
    gameActive = false;
    if (win) {
        gameStatusText.textContent = `Congratulations! You guessed the word "${selectedWord}"!`;
        playSound('win');
        // Achievements
        achievements.first_hangman_win.unlocked = true;
        achievements.win_5_hangman_games.counter = (achievements.win_5_hangman_games.counter || 0) + 1;
        
        // Check for specific achievements
        const vowels = ['A', 'E', 'I', 'O', 'U']; // English vowels
        const allVowelsGuessed = vowels.every(vowel => guessedLetters.includes(vowel));
        if (allVowelsGuessed) {
            achievements.guess_all_vowels.unlocked = true;
        }

        if (wrongGuessesCount === 0) {
            achievements.no_wrong_guesses.unlocked = true;
        }

    } else {
        gameStatusText.textContent = `You lost! The word was "${selectedWord}".`;
        playSound('lose');
    }
    gameMessage.classList.remove('hidden');
    // Disable all alphabet buttons
    Array.from(alphabetButtonsContainer.children).forEach(button => button.disabled = true);
    checkAchievements();
    saveAchievements();
    updateProfileView();
}

// --- Sound Functions ---
function playSound(type) {
    if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
        Tone.start();
    }
    if (!soundEnabled || !Tone) return;

    if (type === 'correct' && guessCorrectSound) {
        guessCorrectSound.triggerAttackRelease('C5', '16n');
    } else if (type === 'wrong' && guessWrongSound) {
        guessWrongSound.triggerAttackRelease('8n');
    } else if (type === 'win' && winSound) {
        winSound.triggerAttackRelease(['C5', 'E5', 'G5'], '4n');
    } else if (type === 'lose' && loseSound) {
        loseSound.triggerAttackRelease('C2', '8n');
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
        achievements.sound_toggler_hangman.counter = (achievements.sound_toggler_hangman.counter || 0) + 1;
        checkAchievements();
    }
}

// --- Local Storage Functions ---
function saveGameState() {
    localStorage.setItem('hangman_selectedWord', selectedWord);
    localStorage.setItem('hangman_guessedLetters', JSON.stringify(guessedLetters));
    localStorage.setItem('hangman_wrongGuessesCount', wrongGuessesCount.toString());
    localStorage.setItem('hangman_gameActive', gameActive.toString());
    localStorage.setItem('hangman_soundEnabled', soundEnabled.toString());
    localStorage.setItem('hangman_gameVolume', gameVolume.toString());
    localStorage.setItem('hangman_profileName', profileName);
}

function loadGameState() {
    selectedWord = localStorage.getItem('hangman_selectedWord') || chooseWord(); // Load or choose new if not saved
    guessedLetters = JSON.parse(localStorage.getItem('hangman_guessedLetters') || '[]');
    wrongGuessesCount = parseInt(localStorage.getItem('hangman_wrongGuessesCount') || '0');
    gameActive = localStorage.getItem('hangman_gameActive') === 'true'; // Default to false if not saved

    soundEnabled = localStorage.getItem('hangman_soundEnabled') === 'true';
    gameVolume = parseFloat(localStorage.getItem('hangman_gameVolume') || '1.0');
    profileName = localStorage.getItem('hangman_playerName') || 'Player';

    volumeSlider.value = gameVolume;
    if (typeof Tone !== 'undefined') {
        Tone.Destination.volume.value = Tone.gainToDb(gameVolume);
    }
}

// --- Achievement Functions ---
function loadAchievements() {
    const savedAchievements = JSON.parse(localStorage.getItem('hangman_achievements') || '{}');
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
    localStorage.setItem('hangman_achievements', JSON.stringify(achievementsToSave));
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
    profileName = localStorage.getItem('hangman_playerName') || 'Player';
}

function saveProfile() {
    localStorage.setItem('hangman_playerName', profileName);
}

function updateProfileView() {
    playerNameInput.value = profileName;
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

// This function highlights the current game mode link
function updateGameModeLinkStyles() {
    // Select all mode links within the settings menu
    const allModeLinks = document.querySelectorAll('.settings-menu .game-mode-selection a');
    allModeLinks.forEach(link => {
        link.classList.remove('bg-indigo-600', 'text-white', 'hover:bg-indigo-700');
        link.classList.add('bg-gray-700', 'text-gray-300', 'hover:bg-gray-600');
    });

    // Highlight the Hangman link specifically for this page
    if (modeHangmanLink) { 
        modeHangmanLink.classList.remove('bg-gray-700', 'text-gray-300', 'hover:bg-gray-600');
        modeHangmanLink.classList.add('bg-indigo-600', 'text-white', 'hover:bg-indigo-700');
    }
}

// --- Event Listeners ---

// Game restart button (on game over message)
restartButton.addEventListener('click', () => initializeGame());

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
    localStorage.setItem('hangman_soundEnabled', soundEnabled.toString());
    updateSoundButtonText();
});

// Volume slider
volumeSlider.addEventListener('input', (event) => {
    if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
        Tone.start();
    }
    gameVolume = parseFloat(event.target.value);
    localStorage.setItem('hangman_gameVolume', gameVolume.toString());
    if (typeof Tone !== 'undefined') {
        Tone.Destination.volume.value = Tone.gainToDb(gameVolume);
    }
});

// Main reset button (in settings)
resetButtonMain.addEventListener('click', () => {
    initializeGame(); 
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
    saveProfile(); // Save immediately on input
});

