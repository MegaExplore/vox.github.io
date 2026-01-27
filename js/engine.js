/**
 * Core Engine Module
 * Handles answer validation, access control, and exercise lifecycle.
 */

import { saveProgress, unlockStage } from './state.js';
import * as Renderers from './renderers.js';

/**
 * Normalizes and compares input against the solution.
 * @param {string|Array} input - User input.
 * @param {string|Array} solution - Correct answer.
 * @returns {boolean} True if correct.
 */
export function checkAnswer(input, solution) {
    const normalize = (val) => {
        if (typeof val !== 'string') return '';
        return val
            .toLowerCase()
            .trim()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // Remove punctuation
            .replace(/\s{2,}/g, ' '); // Collapse whitespace
    };

    if (Array.isArray(solution)) {
        // For ordering/matching, we might expect an array. 
        // Simple array equality check for now (order matters for sentence ordering).
        if (!Array.isArray(input)) return false;
        if (input.length !== solution.length) return false;
        return input.every((val, index) => normalize(val) === normalize(solution[index]));
    }

    return normalize(input) === normalize(solution);
}

/**
 * Determines if a stage is accessible based on the rule: 
 * Stage 1 is free; Stages 2-4 are locked per language.
 * Unlocking one language does not unlock others.
 * @param {number} stage - Stage number (1-4).
 * @param {string} lang - Target language code.
 * @param {Object} exercise - Exercise object (checked for specific locks if needed, though rule is general).
 * @returns {boolean} True if accessible.
 */
export function isStageAccessible(stage, lang, exercise) {
    // Stage 1 is always free
    if (stage === 1) return true;

    // If exercise explicitly defines lockedLanguages, check that too (though the general rule is per stage)
    // The requirement says: "Stages 2–4 locked per language via lockedLanguages"
    // This implies if the USER has unlocked the language, they can access stages 2-4.
    // BUT the prompt also says "Unlocking one language does not unlock others".
    // And "Stage 2–4 locked per language".
    // Let's assume we check the 'unlockedLanguages' from the State (passed in or global).
    // Ideally, this function should take the `userState` as an argument to be pure, 
    // but for simplicity we'll assume we check the exercise's intrinsic lock properties 
    // OR we rely on the state passed from the UI.

    // Actually, the prompt example was: 
    // function isStageAccessible(stage, lang, exercise) { return stage === 1 || !exercise.lockedLanguages.includes(lang); }
    // This logic implies if 'lang' is in 'lockedLanguages', it's locked. 
    // This seems to refer to a "hard lock" configuration in JSON, or maybe "is it locked for this user?".
    // Given the requirement "Supports per-language purchase unlocks", we usually remove the lang from lockedLanguages upon purchase.
    // OR we keep lockedLanguages static and check against a "purchasedLanguages" list.

    // Let's stick strictly to the prompt's example logic for now as a baseline, 
    // but we know we will likely need to check user state usually. 
    // However, the prompt provided this exact snippet:
    if (exercise && exercise.lockedLanguages) {
        return stage === 1 || !exercise.lockedLanguages.includes(lang);
    }
    return stage === 1;
}

/**
 * Current active cleanup function.
 */
let currentCleanup = null;

/**
 * Initializes and renders an exercise into the container.
 * @param {Object} exercise - The exercise data.
 * @param {HTMLElement} container - The DOM element to render into.
 * @param {Function} onComplete - Callback when exercise is finished (correctly).
 */
export function initExercise(exercise, container, onComplete) {
    // Cleanup previous listeners
    if (currentCleanup) {
        currentCleanup();
        currentCleanup = null;
    }

    container.innerHTML = '';

    const renderer = Renderers.rendererMap[exercise.type];
    if (!renderer) {
        container.innerHTML = `<p>Error: Unknown exercise type '${exercise.type}'</p>`;
        return;
    }

    // Render returns a cleanup function
    currentCleanup = renderer(exercise, container, (result) => {
        // Handle answer submission handling internally in renderer or here?
        // Usually renderer handles interaction, calls back with user input/success.
        // Let's assume callback tells us if it was correct or passes the input for us to check.
        // For this engine design, let's say renderer calls onAnswer(input).

        // Check answer
        const isCorrect = checkAnswer(result, exercise.answer);

        // Feedback logic (can be expanded)
        if (isCorrect) {
            // visual feedback handled by renderer or here?
            // Let's simply proceed for now.
            onComplete(true);
        } else {
            // invalid
            onComplete(false);
        }
    });
}
