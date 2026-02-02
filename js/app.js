/**
 * Main Application Logic
 * Integrates State, Engine, UI, and GitHub Data Loading.
 */

import { initSession, saveProgress } from './state.js';
import { fetchData } from './data-loader.js';
import { initExercise } from './engine.js';
import { generateStageMenu, updateTranslationButton } from './ui.js';

// Global App State
let manifest = null;
let userState = null;

async function initApp() {
    const gameContainer = document.getElementById('game-container');
    try {
        userState = initSession();

        // 1. Fetch your manifest from GitHub
        // The data-loader.js adds the GITHUB_RAW_BASE automatically
        manifest = await fetchData('manifest.json');

        renderRoute();
    } catch (e) {
        console.error("App Init Failed:", e);
        gameContainer.innerHTML = `
            <div class="card text-center">
                <p>⚠️ Error connecting to GitHub</p>
                <p><small>${e.message}</small></p>
                <button onclick="window.location.reload()">Retry Connection</button>
            </div>`;
    }
}

function renderRoute() {
    const gameContainer = document.getElementById('game-container');
    gameContainer.innerHTML = ''; // Clear for menu

    // 2. Show the Menu using the stages array from manifest
    generateStageMenu(manifest, userState, gameContainer, (fileName) => {
        loadStage(fileName);
    });
}

async function loadStage(fileName) {
    const gameContainer = document.getElementById('game-container');
    gameContainer.innerHTML = '<div class="loader">Loading Lessons...</div>';

    try {
        // 3. Fetch the specific stage JSON (e.g., 'en_stage1.json')
        const stageData = await fetchData(fileName);

        // 4. Start the exercise loop
        runExercise(stageData, 0);

    } catch (e) {
        console.error(e);
        gameContainer.innerHTML = `
            <p>Failed to load lesson: ${fileName}</p>
            <button onclick="renderRoute()">Back to Menu</button>`;
    }
}

function runExercise(stageData, index) {
    const gameContainer = document.getElementById('game-container');
    const exercises = stageData.exercises;

    // 5. Check if Stage is finished
    if (index >= exercises.length) {
        gameContainer.innerHTML = `
            <div class="card text-center">
                <h2>Stage Complete! 🎉</h2>
                <p>You've mastered these English phrases.</p>
                <button id="home-btn" class="primary-btn" style="margin-top:20px;">Back to Menu</button>
            </div>
        `;
        document.getElementById('home-btn').onclick = () => renderRoute();

        // Save progress to localStorage (from state.js)
        saveProgress(stageData.id);
        return;
    }

    const exercise = exercises[index];

    // UI: Update the Translation Button (if using one)
    const translateBtn = document.getElementById('translate-btn');
    if (translateBtn) {
        updateTranslationButton(exercise.id, 'en', translateBtn);
    }

    // 6. Launch the Exercise Renderer (from engine.js)
    initExercise(exercise, gameContainer, (isCorrect) => {
        if (isCorrect) {
            showFeedback(true);
            setTimeout(() => {
                runExercise(stageData, index + 1);
            }, 1000);
        } else {
            showFeedback(false);
            // Engine allows user to try again automatically
        }
    });
}

function showFeedback(isCorrect) {
    const overlay = document.getElementById('feedback-overlay');
    if (!overlay) return; // Guard if overlay doesn't exist in HTML

    const icon = overlay.querySelector('.feedback-icon');
    const text = overlay.querySelector('h3');

    overlay.className = `feedback-overlay active ${isCorrect ? 'correct' : 'incorrect'}`;
    icon.textContent = isCorrect ? '✔️' : '❌';
    text.textContent = isCorrect ? 'Correct!' : 'Try Again';

    setTimeout(() => {
        overlay.classList.remove('active', 'correct', 'incorrect');
    }, 900);
}

// Initialize the app
initApp();