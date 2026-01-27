/**
 * State Management Module
 * Handles session persistence and progress tracking.
 */

const STORAGE_KEY = 'vox_user_progress';

const defaultState = {
  targetLanguage: null,
  translationLanguage: null,
  level: null,
  section: null,
  stage: null, // 1, 2, 3, 4
  exerciseIndex: 0,
  unlockedLanguages: [], // ['es', 'fr']
  unlockedStages: {} // { 'targetLang': { 'level': { 'section': [1, 2] } } }
};

/**
 * Loads the user state from localStorage or returns default.
 * @returns {Object} The user state object.
 */
export function initSession() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultState, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load session:', e);
  }
  return { ...defaultState };
}

/**
 * Saves the current user state to localStorage.
 * @param {Object} state - The state object to save.
 */
export function saveProgress(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

/**
 * Updates the unlock status processing.
 * @param {Object} state - Current state.
 * @param {string} lang - Target language.
 * @param {string} level - CEFR Level.
 * @param {string} section - Section ID.
 * @param {number} stage - Stage number completed.
 * @returns {Object} Updated state.
 */
export function unlockStage(state, lang, level, section, stage) {
  const newState = { ...state };
  if (!newState.unlockedStages[lang]) newState.unlockedStages[lang] = {};
  if (!newState.unlockedStages[lang][level]) newState.unlockedStages[lang][level] = {};
  if (!newState.unlockedStages[lang][level][section]) newState.unlockedStages[lang][level][section] = [];
  
  if (!newState.unlockedStages[lang][level][section].includes(stage)) {
    newState.unlockedStages[lang][level][section].push(stage);
  }
  
  return newState;
}

export function resetSession() {
    localStorage.removeItem(STORAGE_KEY);
}
