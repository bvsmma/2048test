document.addEventListener('DOMContentLoaded', () => {
    // Add fade-in on page load for the game page itself
    document.body.classList.add('fade-in');

    const words = ['JAVASCRIPT', 'PROGRAMMING', 'HANGMAN', 'COMPUTER', 'DEVELOPER', 'CODING', 'INTERFACE'];
    let selectedWord = '';
    let guessedWord = [];
    let wrongGuesses = 0;
    const maxWrongGuesses = 10; // Head, Body, 2 Arms, 2 Legs, Gallow Base, Upright, Arm, Rope
    let correctLettersCount = 0;
    let soundEnabled = true;

    // Sound effects
    const correctGuessSound = new Tone.Synth().toDestination();
    const wrongGuessSound = new Tone.MembraneSynth().toDestination();
    const winSound = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: {
            attack: 0.1,
            decay: 0.5,
            sustain: 0.2,
            release: 0.8,
        }
    }).toDestination();
    const loseSound = new Tone.NoiseSynth({
        envelope: {
            attack: 0.005,
            decay: 0.1,
            sustain: 0,
        }
    }).toDestination();
    const buttonClickSound = new Tone.PolySynth(Tone.Synth, {
        volume: -15,
        oscillator: { type: "sine" },
        envelope: {
            attack: 0.001,
            decay: 0.03,
            sustain: 0.01,
            release: 0.03,
            releaseCurve: "exponential"
        }
    }).toDestination();

    // Helper function to start audio context on user interaction
    const startAudioContext = () => {
        if (Tone.context.state !== 'running') {
            Tone.start().then(() => {
                console.log("Tone.js AudioContext started successfully in Hangman.");
            }).catch(e => console.error("Error starting Tone.js AudioContext in Hangman:", e));
        } else {
            console.log("Tone.js AudioContext already running in Hangman.");
        }
    };

    // Attach to common interaction events
    document.documentElement.addEventListener('click', startAudioContext, { once: true });
    document.documentElement.addEventListener('keydown', startAudioContext, { once: true });


    const hangmanParts = [
        'base', 'upright', 'arm', 'rope', 'head', 'body', 'arm-left', 'arm-right', 'leg-left', 'leg-right'
    ];

    const elements = {
        wordDisplay: document.getElementById('word-display'),
        alphabetButtons: document.getElementById('alphabet-buttons'),
        gameMessage: document.getElementById('game-message'),
        gameStatus: document.getElementById('game-status'),
        restartButton: document.getElementById('restart-button'),
        correctGuessesSpan: document.getElementById('correct-guesses'),
        wrongGuessesSpan: document.getElementById('wrong-guesses'),
        settingsButton: document.getElementById('settings-button'),
        profileButton: document.getElementById('profile-button'),
        achievementsButton: document.getElementById('achievements-button'),
        settingsMenu: document.getElementById('settings-menu'),
        closeSettingsMenuButton: document.getElementById('close-settings-menu-button'),
        profileMenu: document.getElementById('profile-menu'),
        closeProfileMenuButton: document.getElementById('close-profile-menu-button'),
        achievementsMenu: document.getElementById('achievements-menu'),
        closeAchievementsMenuButton: document.getElementById('close-achievements-menu-button'),
        infoButton: document.getElementById('info-button'),
        infoModal: document.getElementById('info-modal'),
        closeInfoModal: document.getElementById('close-info-modal'),
        toggleSoundButton: document.getElementById('toggle-sound-button'),
        soundIcon: document.getElementById('sound-icon'),
        soundText: document.getElementById('sound-text'),
        volumeSlider: document.getElementById('volume-slider'),
        playerNameInput: document.getElementById('player-name-input'),
        achievementsList: document.getElementById('achievements-list'),
        mainRestartButton: document.getElementById('reset-button-main'), // Added for settings menu
    };

    // --- Game Logic ---
    function initializeGame() {
        selectedWord = words[Math.floor(Math.random() * words.length)];
        guessedWord = Array(selectedWord.length).fill('_');
        wrongGuesses = 0;
        correctLettersCount = 0;
        elements.wordDisplay.textContent = guessedWord.join(' ');
        elements.gameMessage.classList.add('hidden');
        elements.correctGuessesSpan.textContent = '0';
        elements.wrongGuessesSpan.textContent = '0';
        resetAlphabetButtons();
        hideHangmanParts();
        Tone.Destination.volume.value = soundEnabled ? Tone.fromDb(20 * Math.log10(parseFloat(elements.volumeSlider.value))) : -Infinity; // Update master volume
    }

    function resetAlphabetButtons() {
        elements.alphabetButtons.innerHTML = '';
        for (let i = 0; i < 26; i++) {
            const char = String.fromCharCode(65 + i);
            const button = document.createElement('button');
            button.textContent = char;
            button.classList.add('px-4', 'py-2', 'bg-indigo-600', 'text-white', 'font-bold', 'rounded-lg', 'shadow-lg', 'hover:bg-indigo-700', 'transition-colors', 'duration-200');
            button.addEventListener('click', () => handleGuess(char, button));
            elements.alphabetButtons.appendChild(button);
        }
    }

    function hideHangmanParts() {
        hangmanParts.forEach(id => {
            const part = document.getElementById(id);
            if (part) { // Check if the part exists
                part.style.display = 'none';
            }
        });
    }

    function showHangmanPart(index) {
        if (index >= 0 && index < hangmanParts.length) {
            const part = document.getElementById(hangmanParts[index]);
            if (part) { // Check if the part exists
                part.style.display = 'block';
            }
        }
    }

    function handleGuess(char, button) {
        if (button.disabled) return;

        button.disabled = true;
        button.classList.remove('hover:bg-indigo-700'); // Remove hover effect once clicked

        if (selectedWord.includes(char)) {
            button.classList.add('correct');
            if (soundEnabled && Tone.context.state === 'running') {
                correctGuessSound.triggerAttackRelease("C5", "8n");
            }
            for (let i = 0; i < selectedWord.length; i++) {
                if (selectedWord[i] === char) {
                    guessedWord[i] = char;
                    correctLettersCount++;
                }
            }
            elements.wordDisplay.textContent = guessedWord.join(' ');
            elements.correctGuessesSpan.textContent = correctLettersCount.toString();
            if (correctLettersCount === selectedWord.length) {
                endGame(true);
            }
        } else {
            button.classList.add('wrong');
            if (soundEnabled && Tone.context.state === 'running') {
                wrongGuessSound.triggerAttackRelease("C2", "8n"); // Lower frequency for wrong guess
            }
            wrongGuesses++;
            elements.wrongGuessesSpan.textContent = wrongGuesses.toString();
            showHangmanPart(wrongGuesses - 1); // Show next hangman part
            if (wrongGuesses >= maxWrongGuesses) {
                endGame(false);
            }
        }
    }

    function endGame(isWin) {
        elements.gameMessage.classList.remove('hidden');
        if (isWin) {
            elements.gameStatus.textContent = 'You Win!';
            if (soundEnabled && Tone.context.state === 'running') {
                winSound.triggerAttackRelease(["C5", "E5", "G5"], "2n");
            }
            // TODO: Add win achievement logic
        } else {
            elements.gameStatus.textContent = `You Lose! The word was "${selectedWord}"`;
            if (soundEnabled && Tone.context.state === 'running') {
                loseSound.triggerAttackRelease("8n");
            }
            // TODO: Add lose achievement logic
        }
        // Disable all alphabet buttons
        Array.from(elements.alphabetButtons.children).forEach(button => {
            button.disabled = true;
            button.classList.remove('hover:bg-indigo-700');
        });
    }

    // --- Menu Logic ---
    function toggleMenu(menuElement) {
        menuElement.classList.toggle('open');
        // Play sound for opening/closing menus
        if (soundEnabled && Tone.context.state === 'running') {
            buttonClickSound.triggerAttackRelease("C5", "32n");
        }
    }

    function populateAchievements() {
        elements.achievementsList.innerHTML = ''; // Clear existing
        const achievements = [
            { name: "First Win", description: "Win your first game of Hangman.", icon: "fas fa-trophy", unlocked: false },
            { name: "Ten Wins", description: "Win 10 games of Hangman.", icon: "fas fa-medal", unlocked: false },
            { name: "Word Master", description: "Guess a word with no wrong letters.", icon: "fas fa-star", unlocked: false }
        ];

        achievements.forEach(ach => {
            const div = document.createElement('div');
            div.classList.add('achievement-item');
            div.classList.toggle('unlocked', ach.unlocked);
            div.classList.toggle('locked', !ach.unlocked);
            div.innerHTML = `
                <i class="${ach.icon}"></i>
                <div>
                    <p class="font-bold">${ach.name}</p>
                    <p class="text-xs text-gray-500">${ach.description}</p>
                </div>
            `;
            elements.achievementsList.appendChild(div);
        });
    }

    // --- Event Listeners ---
    elements.restartButton.addEventListener('click', initializeGame);
    elements.mainRestartButton.addEventListener('click', initializeGame); // For settings menu restart

    elements.settingsButton.addEventListener('click', () => toggleMenu(elements.settingsMenu));
    elements.closeSettingsMenuButton.addEventListener('click', () => toggleMenu(elements.settingsMenu));

    elements.profileButton.addEventListener('click', () => toggleMenu(elements.profileMenu));
    elements.closeProfileMenuButton.addEventListener('click', () => toggleMenu(elements.profileMenu));

    elements.achievementsButton.addEventListener('click', () => {
        toggleMenu(elements.achievementsMenu);
        populateAchievements(); // Populate achievements when menu opens
    });
    elements.closeAchievementsMenuButton.addEventListener('click', () => toggleMenu(elements.achievementsMenu));

    elements.infoButton.addEventListener('click', () => {
        elements.infoModal.classList.remove('hidden');
        if (soundEnabled && Tone.context.state === 'running') {
            buttonClickSound.triggerAttackRelease("C5", "32n");
        }
    });
    elements.closeInfoModal.addEventListener('click', () => {
        elements.infoModal.classList.add('hidden');
        if (soundEnabled && Tone.context.state === 'running') {
            buttonClickSound.triggerAttackRelease("C5", "32n");
        }
    });

    // Close info modal if clicking outside
    elements.infoModal.addEventListener('click', (event) => {
        if (event.target === elements.infoModal) {
            elements.infoModal.classList.add('hidden');
            if (soundEnabled && Tone.context.state === 'running') {
                buttonClickSound.triggerAttackRelease("C5", "32n");
            }
        }
    });

    elements.toggleSoundButton.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        if (soundEnabled) {
            elements.soundIcon.classList.replace('fa-volume-mute', 'fa-volume-up');
            elements.soundText.textContent = 'Sound: On';
            // Restore volume if it was previously muted by toggle
            if (parseFloat(elements.volumeSlider.value) > 0) {
                Tone.Destination.volume.value = Tone.fromDb(20 * Math.log10(parseFloat(elements.volumeSlider.value)));
            } else {
                // If slider is at 0, keep it muted
                Tone.Destination.volume.value = -Infinity;
            }
        } else {
            elements.soundIcon.classList.replace('fa-volume-up', 'fa-volume-mute');
            elements.soundText.textContent = 'Sound: Off';
            Tone.Destination.volume.value = -Infinity; // Mute
        }
    });

    elements.volumeSlider.addEventListener('input', (event) => {
        const volumeValue = parseFloat(event.target.value);
        if (soundEnabled) {
            // Tone.js uses dB scale. Map 0-1 to -60dB to 0dB.
            // If volumeValue is 0, set to -Infinity for true mute, otherwise calculate dB.
            Tone.Destination.volume.value = volumeValue === 0 ? -Infinity : Tone.fromDb(20 * Math.log10(volumeValue));
            elements.soundText.textContent = `Sound: ${Math.round(volumeValue * 100)}%`;
            
            // If the slider is moved from 0 to something, ensure sound is enabled and icon is correct
            if (volumeValue > 0 && elements.soundIcon.classList.contains('fa-volume-mute')) {
                elements.soundIcon.classList.replace('fa-volume-mute', 'fa-volume-up');
                elements.soundText.textContent = `Sound: ${Math.round(volumeValue * 100)}%`;
            } else if (volumeValue === 0 && elements.soundIcon.classList.contains('fa-volume-up')) {
                // If slider is moved to 0, update icon and text
                elements.soundIcon.classList.replace('fa-volume-up', 'fa-volume-mute');
                elements.soundText.textContent = 'Sound: Off';
            }
        } else if (volumeValue > 0) {
            // If sound was globally muted but slider is moved up, re-enable sound and update UI
            soundEnabled = true; // Re-enable sound
            elements.soundIcon.classList.replace('fa-volume-mute', 'fa-volume-up');
            Tone.Destination.volume.value = Tone.fromDb(20 * Math.log10(volumeValue));
            elements.soundText.textContent = `Sound: ${Math.round(volumeValue * 100)}%`;
        }
    });

    // Initialize game on load
    initializeGame();
});

// Handle browser back/forward buttons for game pages
window.addEventListener('pageshow', (event) => {
    if (event.persisted) { // If page is loaded from cache (e.g., via back button)
        console.log("pageshow event (persisted) fired in Hangman. Ensuring fade-in and resetting body classes.");
        document.body.classList.remove('fade-out'); // Remove fade-out class if present
        // Small delay to ensure browser fully renders before fade-in
        setTimeout(() => {
            document.body.classList.add('fade-in'); // Ensure fade-in animation plays
        }, 10); 
    }
});

// Make the "Back to Hub" button in settings always trigger fade-out
document.addEventListener('DOMContentLoaded', () => {
    const backToHubLink = document.querySelector('#settings-menu a[href="index.html"]');
    if (backToHubLink) {
        backToHubLink.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default navigation
            document.body.classList.add('fade-out');
            setTimeout(() => {
                window.location.href = this.href;
            }, 500); // Match CSS transition duration
        });
    }
});
