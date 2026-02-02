/**
 * Main Application Logic
 * Integrates State, Engine, UI, and Data Loading.
 */

import { initSession, saveProgress, unlockStage } from './state.js';
import { fetchData } from './data-loader.js';
import { initExercise, isStageAccessible } from './engine.js';
import { generateStageMenu, updateTranslationButton } from './ui.js';

// Global App State
let manifest = null;
let userState = null;
const container = document.getElementById('app-container');
const menuContainer = document.getElementById('game-container'); // Reusing container for simplicity or swapping views
// Ideally index.html has #game-container inside #app-container or similar.
// Let's assume #game-container is the main render area.

async function initApp() {
    try {
        userState = initSession();

        // Load Manifest (assuming it's at a known path or CID, here local for dev)
        manifest = await fetchData('./schemas/manifest.example.json');

        // Initial Routing
        renderRoute();
    } catch (e) {
        console.error("App Init Failed:", e);
        document.getElementById('game-container').innerHTML = `<p>Error loading content: ${e.message}</p>`;
    }
}

function renderRoute() {
    const gameContainer = document.getElementById('game-container');

    // Simple state-based routing
    // If we have an active exercise/stage in progress? 
    // For this prototype, we always start at the menu, or resume if we implemented "continue learning".
    // Requirements say: "Resume last session automatically".

    // Check if state indicates an active session we should jump back to?
    // The state.js stores level/stage/exerciseIndex.
    // However, we don't store the *manifest data* in state, so we need to navigation back to that point.
    // For "Resume", we'd check if userState has a current stage defined.

    // For now, let's render the Stage Menu.
    // If the user selects a stage, we load it.

    // Show Menu
    generateStageMenu(manifest, userState, gameContainer, (stageCid) => {
        loadStage(stageCid);
    });
}

async function loadStage(cid) {
    const gameContainer = document.getElementById('game-container');
    gameContainer.innerHTML = '<p class="text-center">Loading Stage...</p>';

    try {
        // Fetch Stage Data
        // In real app: cid would be an IPFS hash. 
        // For local prototype: we might map 'cid1' to './schemas/primary.example.json' for testing.
        // Let's implement a simple mock resolver for the prototype if the CID isn't a real path.
        let fetchUrl = cid;
        if (cid === 'QmHash1...' || cid === 'cid1') fetchUrl = './schemas/primary.example.json';

        const stageData = await fetchData(fetchUrl);

        // Start Exercises
        let currentIndex = 0;

        // Resume logic could go here: if userState.stage === stageData.stage, currentIndex = userState.exerciseIndex

        runExercise(stageData, currentIndex);

    } catch (e) {
        console.error(e);
        gameContainer.innerHTML = '<p>Failed to load stage.</p><button onclick="window.location.reload()">Retry</button>';
    }
}

function runExercise(stageData, index) {
    const gameContainer = document.getElementById('game-container');
    const exercises = stageData.exercises;

    if (index >= exercises.length) {
        // Stage Complete
        gameContainer.innerHTML = `
            <div class="card text-center">
                <h2>Stage Complete! 🎉</h2>
                <p>You've finished this set.</p>
                <button id="home-btn" style="margin-top:20px; padding:12px 24px; background:var(--primary); color:white; border-radius:8px;">Back to Menu</button>
            </div>
        `;
        document.getElementById('home-btn').onclick = () => renderRoute(); // Back to menu

        // Unlock next stage logic (simplified)
        // saveProgress(...)
        return;
    }

    const exercise = exercises[index];

    // Check if skipped/locked? Engine handles specific logic, but here we drive the loop.

    // Update Translation Button
    const translateBtn = document.getElementById('translate-btn');
    // We assume translationLang is set or default
    updateTranslationButton(exercise.id, userState.translationLanguage || 'es', translateBtn);

    initExercise(exercise, gameContainer, (isCorrect) => {
        if (isCorrect) {
            // Show Feedback Overlay
            showFeedback(true);
            setTimeout(() => {
                // Next Exercise
                runExercise(stageData, index + 1);
            }, 1000); // 1s delay
        } else {
            showFeedback(false);
            // Allow retry? Or move on?
            // Requirement doesn't specify penalty. Let's allow retry or simple feedback logic.
            // "Correct/incorrect feedback displayed".
            // Typically we wait for user to try again or show answer.
        }
    });
}

function showFeedback(isCorrect) {
    const overlay = document.getElementById('feedback-overlay');
    const icon = overlay.querySelector('.feedback-icon');
    const text = overlay.querySelector('h3');

    overlay.className = `feedback-overlay active ${isCorrect ? 'correct' : 'incorrect'}`;
    icon.textContent = isCorrect ? '✔️' : '❌';
    text.textContent = isCorrect ? 'Correct!' : 'Try Again';

    setTimeout(() => {
        overlay.classList.remove('active', 'correct', 'incorrect');
    }, 900);
}

// Start
initApp();
