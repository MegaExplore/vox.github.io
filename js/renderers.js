/**
 * Exercise Renderers Module
 * Generates HTML and handles interaction for specific exercise types.
 */

import { startListening } from './speech.js';
import { initSession } from './state.js';

/**
 * Renders a Multiple Choice exercise.
 */
function renderMultipleChoice(exercise, container, onAnswer) {
    const wrapper = document.createElement('div');
    wrapper.className = 'exercise-multiple-choice';

    const questionEl = document.createElement('h3');
    questionEl.textContent = exercise.question;
    wrapper.appendChild(questionEl);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'options-grid';

    const listeners = [];

    exercise.options.forEach(option => {
        const btn = document.createElement('button');
        btn.textContent = option;
        btn.className = 'option-btn';

        const handler = () => onAnswer(option);
        btn.addEventListener('click', handler);
        listeners.push({ element: btn, type: 'click', handler });

        optionsContainer.appendChild(btn);
    });

    wrapper.appendChild(optionsContainer);
    container.appendChild(wrapper);

    return () => {
        listeners.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
        });
    };
}

/**
 * Renders a Tap-Fill (Fill in the blank by tapping options) exercise.
 */
function renderTapFill(exercise, container, onAnswer) {
    const wrapper = document.createElement('div');
    wrapper.className = 'exercise-tap-fill';

    // "I have a ___" -> "I have a <span id='slot'></span>"
    const parts = exercise.question.split('___');
    const questionEl = document.createElement('h3');

    if (parts.length > 1) {
        questionEl.innerHTML = `${parts[0]}<span class="slot">______</span>${parts[1] || ''}`;
    } else {
        questionEl.textContent = exercise.question;
    }
    wrapper.appendChild(questionEl);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'options-row';

    const listeners = [];

    exercise.options.forEach(option => {
        const btn = document.createElement('button');
        btn.textContent = option;
        btn.className = 'option-pill';

        const handler = () => {
            // Update slot visually
            const slot = wrapper.querySelector('.slot');
            if (slot) slot.textContent = option;
            onAnswer(option);
        };

        btn.addEventListener('click', handler);
        listeners.push({ element: btn, type: 'click', handler });
        optionsContainer.appendChild(btn);
    });

    wrapper.appendChild(optionsContainer);
    container.appendChild(wrapper);

    return () => {
        listeners.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
        });
    };
}

/**
 * Renders a Pronunciation exercise.
 */
/**
 * Renders a Pronunciation exercise.
 */
function renderPronunciation(exercise, container, onAnswer) {
    const wrapper = document.createElement('div');
    wrapper.className = 'exercise-pronunciation';

    const questionEl = document.createElement('h3');
    questionEl.textContent = `Speak: "${exercise.question}"`;
    wrapper.appendChild(questionEl);

    const micBtn = document.createElement('button');
    micBtn.textContent = '🎤 Tap to Speak';
    micBtn.className = 'mic-btn';

    const statusEl = document.createElement('p');
    statusEl.className = 'status-text';

    const listeners = [];

    const handler = async () => {
        micBtn.disabled = true;
        micBtn.textContent = 'Listening...';
        try {
            // Resolve language: Exercise override > Global Target > Fallback
            const session = initSession();
            const lang = exercise.voiceLang || session.targetLanguage || 'en-US';

            const transcript = await startListening(lang);
            statusEl.textContent = `You said: "${transcript}"`;
            onAnswer(transcript); // Let engine validate
        } catch (err) {
            statusEl.textContent = 'Could not hear you. Try again.';
            console.error(err);
        } finally {
            micBtn.disabled = false;
            micBtn.textContent = '🎤 Tap to Speak';
        }
    };

    micBtn.addEventListener('click', handler);
    listeners.push({ element: micBtn, type: 'click', handler });

    wrapper.appendChild(micBtn);
    wrapper.appendChild(statusEl);
    container.appendChild(wrapper);

    return () => {
        listeners.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
        });
    };
}

/**
 * Renders a Flashcard exercise.
 */
function renderFlashcard(exercise, container, onAnswer) {
    const wrapper = document.createElement('div');
    wrapper.className = 'exercise-flashcard';

    const card = document.createElement('div');
    card.className = 'flashcard';

    const front = document.createElement('div');
    front.className = 'card-face card-front';
    front.textContent = exercise.question;
    // Optional: Image
    if (exercise.media && exercise.media.image) {
        const img = document.createElement('img');
        // Img src should be resolved via IPFS gateway in real app, simplistic here
        img.src = exercise.media.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
        front.prepend(img);
    }

    const back = document.createElement('div');
    back.className = 'card-face card-back';
    back.textContent = exercise.answer; // Or hint/translation

    card.appendChild(front);
    card.appendChild(back);

    const listeners = [];

    const flipHandler = () => {
        card.classList.toggle('flipped');
    };

    card.addEventListener('click', flipHandler);
    listeners.push({ element: card, type: 'click', handler: flipHandler });

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Got it';
    nextBtn.className = 'next-btn';
    const nextHandler = () => onAnswer(true); // Always correct for flashcards upon user confirmation
    nextBtn.addEventListener('click', nextHandler);
    listeners.push({ element: nextBtn, type: 'click', handler: nextHandler });

    wrapper.appendChild(card);
    wrapper.appendChild(nextBtn);
    container.appendChild(wrapper);

    return () => {
        listeners.forEach(l => l.element.removeEventListener(l.type, l.handler));
    };
}


// matching, sentence_ordering, input_typing... (omitted for brevity but pattern is identical)

export const rendererMap = {
    'multiple_choice': renderMultipleChoice,
    'tap_fill': renderTapFill,
    'pronunciation': renderPronunciation,
    'flashcard': renderFlashcard
    // Add others as needed
};
