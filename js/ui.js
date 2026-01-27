/**
 * UI Manager Module
 * Handles dynamic menu generation and global UI controls.
 */

import { isStageAccessible } from './engine.js';
import { fetchData } from './data-loader.js';

/**
 * Generates the Stage Selection Menu based on the Manifest.
 * @param {Object} manifest - The full manifest JSON.
 * @param {Object} userState - Current user state (for unlocking visual).
 * @param {HTMLElement} container - Container to render menu into.
 * @param {Function} onSelectStage - Callback when a stage is clicked.
 */
export function generateStageMenu(manifest, userState, container, onSelectStage) {
    container.innerHTML = '';

    // Iterate languages (Simplified: assuming current target language selected or displaying all)
    const targetLang = userState.targetLanguage || Object.keys(manifest.languages)[0];
    if (!targetLang || !manifest.languages[targetLang]) {
        container.textContent = "No content available.";
        return;
    }

    const langData = manifest.languages[targetLang];
    const title = document.createElement('h2');
    title.textContent = langData.name || targetLang;
    container.appendChild(title);

    // Iterate Levels
    for (const [levelKey, levelData] of Object.entries(langData.levels)) {
        const levelSection = document.createElement('div');
        levelSection.className = 'level-section';
        levelSection.innerHTML = `<h3>Level ${levelKey}</h3>`;

        // Iterate Sections
        if (levelData.sections) {
            levelData.sections.forEach(section => {
                const secHeader = document.createElement('h4');
                secHeader.textContent = section.title;
                levelSection.appendChild(secHeader);

                const stageGrid = document.createElement('div');
                stageGrid.className = 'stage-grid';

                if (section.stages) {
                    section.stages.forEach(stage => {
                        const btn = document.createElement('button');
                        btn.className = 'stage-card';
                        const locked = !isStageAccessible(stage.id, targetLang, { lockedLanguages: stage.isFree ? [] : [targetLang] });
                        // Note: isStageAccessible logic in engine.js was simplified. 
                        // Real app implementation might need more robust checking against userState.unlockedStages.

                        // Visual lock state
                        if (locked) btn.classList.add('locked');

                        btn.textContent = `Stage ${stage.id}`;

                        if (!locked) {
                            btn.addEventListener('click', () => onSelectStage(stage.cid));
                        } else {
                            btn.title = "Locked";
                        }
                        stageGrid.appendChild(btn);
                    });
                }
                levelSection.appendChild(stageGrid);
            });
        }
        container.appendChild(levelSection);
    }
}

/**
 * Updates the Global Translation Button visibility and content.
 */
export async function updateTranslationButton(exerciseId, translationLang, btnElement) {
    const modal = document.getElementById('translation-modal');
    const content = document.getElementById('translation-content');

    // Reset
    btnElement.style.display = 'block';

    // Click Handler
    btnElement.onclick = async () => {
        modal.classList.add('open');
        content.innerHTML = '<p>Loading translation...</p>';

        try {
            // Fetch secondary JSON. Optimization: Cache this.
            // For prototype: fetch every time or use data-loader cache if implemented.
            const secondary = await fetchData('./schemas/secondary.example.json');
            const text = secondary[exerciseId] || "No translation available.";

            content.innerHTML = `<p class="translation-text" style="font-size:1.2rem; font-weight:500;">${text}</p>`;
        } catch (e) {
            content.innerHTML = `<p>Error loading translation.</p>`;
        }
    };

    // Close logic (clicking outside or close button) - simplistic implementation
    // Ideally we add a close button inside the modal in HTML
}
