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
    let selectedOption = null;

    const checkBtn = document.createElement('button');
    checkBtn.textContent = 'Check Answer';
    checkBtn.className = 'check-btn';
    checkBtn.disabled = true;

    exercise.options.forEach(option => {
        const btn = document.createElement('button');
        btn.textContent = option;
        btn.className = 'option-pill';

        const handler = () => {
            // Update slot visually
            const slot = wrapper.querySelector('.slot');
            if (slot) {
                slot.textContent = option;
                slot.classList.add('filled');
            }
            selectedOption = option;
            checkBtn.disabled = false;
        };

        btn.addEventListener('click', handler);
        listeners.push({ element: btn, type: 'click', handler });
        optionsContainer.appendChild(btn);
    });

    const checkHandler = () => {
        if (selectedOption) {
            onAnswer(selectedOption);
        }
    };
    checkBtn.addEventListener('click', checkHandler);
    listeners.push({ element: checkBtn, type: 'click', handler: checkHandler });

    wrapper.appendChild(optionsContainer);
    wrapper.appendChild(checkBtn);
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

/**
 * Renders a Sentence Ordering exercise.
 */
function renderSentenceOrder(exercise, container, onAnswer) {
    const wrapper = document.createElement('div');
    wrapper.className = 'exercise-sentence-order';

    const questionEl = document.createElement('h3');
    questionEl.textContent = "Arrange the words:";
    wrapper.appendChild(questionEl);

    const resultArea = document.createElement('div');
    resultArea.className = 'sentence-result-area';
    wrapper.appendChild(resultArea);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'word-bank';
    wrapper.appendChild(optionsContainer);

    const listeners = [];
    let currentSentence = [];

    // Helper to render words in result area
    const renderResult = () => {
        resultArea.innerHTML = '';
        currentSentence.forEach((word, index) => {
            const span = document.createElement('span');
            span.textContent = word;
            span.className = 'result-word';
            resultArea.appendChild(span);
        });
        checkBtn.disabled = currentSentence.length === 0;
    };

    // Initialize word bank
    exercise.options.forEach((word, index) => {
        const btn = document.createElement('button');
        btn.textContent = word;
        btn.className = 'word-btn';

        const handler = () => {
            currentSentence.push(word);
            renderResult();
            btn.classList.add('used');
            btn.disabled = true;
        };

        btn.addEventListener('click', handler);
        listeners.push({ element: btn, type: 'click', handler });
        optionsContainer.appendChild(btn);
    });

    // Controls
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'controls-row';

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset';
    resetBtn.className = 'secondary-btn';

    const resetHandler = () => {
        currentSentence = [];
        renderResult();
        // Reset all word buttons
        Array.from(optionsContainer.children).forEach(btn => {
            btn.classList.remove('used');
            btn.disabled = false;
        });
    };
    resetBtn.addEventListener('click', resetHandler);
    listeners.push({ element: resetBtn, type: 'click', handler: resetHandler });

    const checkBtn = document.createElement('button');
    checkBtn.textContent = 'Check';
    checkBtn.className = 'check-btn';
    checkBtn.disabled = true;

    const checkHandler = () => {
        onAnswer(currentSentence.join(' '));
    };
    checkBtn.addEventListener('click', checkHandler);
    listeners.push({ element: checkBtn, type: 'click', handler: checkHandler });

    controlsDiv.appendChild(resetBtn);
    controlsDiv.appendChild(checkBtn);
    wrapper.appendChild(controlsDiv);

    container.appendChild(wrapper);

    return () => {
        listeners.forEach(l => l.element.removeEventListener(l.type, l.handler));
    };
}

/**
 * Renders a Matching Pairs exercise.
 */
function renderMatching(exercise, container, onAnswer) {
    const wrapper = document.createElement('div');
    wrapper.className = 'exercise-matching';

    const questionEl = document.createElement('h3');
    questionEl.textContent = "Match the pairs:";
    wrapper.appendChild(questionEl);

    const grid = document.createElement('div');
    grid.className = 'matching-grid';

    const pairs = exercise.pairs; // Assumes object or array of objects
    // Normalize to array of {id, content, type}
    // Type: 'left' or 'right'

    let items = [];
    if (Array.isArray(pairs)) {
        // Assuming [{left: 'a', right: 'b'}]
        pairs.forEach((p, i) => {
            items.push({ id: i, content: p.left, type: 'left', matched: false });
            items.push({ id: i, content: p.right, type: 'right', matched: false });
        });
    } else {
        // Assuming {'a': 'b'}
        Object.entries(pairs).forEach(([k, v], i) => {
            items.push({ id: i, content: k, type: 'left', matched: false });
            items.push({ id: i, content: v, type: 'right', matched: false });
        });
    }

    // Shuffle items to randomize positions
    items = items.sort(() => Math.random() - 0.5);

    const listeners = [];
    let selectedLeft = null;
    let selectedRight = null;
    let matchedCount = 0;
    const totalPairs = items.length / 2;

    const itemElements = new Map(); // Store elements to update state

    items.forEach(item => {
        const btn = document.createElement('button');
        btn.textContent = item.content;
        btn.className = `match-card ${item.type}`;

        const handler = () => {
            if (item.matched || btn.classList.contains('selected')) return;

            // Handle selection
            if (item.type === 'left') {
                if (selectedLeft) selectedLeft.el.classList.remove('selected');
                selectedLeft = { item, el: btn };
            } else {
                if (selectedRight) selectedRight.el.classList.remove('selected');
                selectedRight = { item, el: btn };
            }
            btn.classList.add('selected');

            // Check match if both selected
            if (selectedLeft && selectedRight) {
                if (selectedLeft.item.id === selectedRight.item.id) {
                    // Match found
                    selectedLeft.el.classList.add('matched');
                    selectedRight.el.classList.add('matched');
                    selectedLeft.el.classList.remove('selected');
                    selectedRight.el.classList.remove('selected');

                    selectedLeft.item.matched = true;
                    selectedRight.item.matched = true;

                    selectedLeft = null;
                    selectedRight = null;
                    matchedCount++;

                    if (matchedCount === totalPairs) {
                        setTimeout(() => onAnswer(true), 500);
                    }
                } else {
                    // Mismatch
                    setTimeout(() => {
                        if (selectedLeft) selectedLeft.el.classList.remove('selected');
                        if (selectedRight) selectedRight.el.classList.remove('selected');
                        selectedLeft = null;
                        selectedRight = null;
                    }, 500);
                }
            }
        };

        btn.addEventListener('click', handler);
        listeners.push({ element: btn, type: 'click', handler });
        grid.appendChild(btn);
        itemElements.set(item, btn);
    });

    wrapper.appendChild(grid);
    container.appendChild(wrapper);

    return () => {
        listeners.forEach(l => l.element.removeEventListener(l.type, l.handler));
    };
}

/**
 * Renders a Listening exercise.
 */
function renderListening(exercise, container, onAnswer) {
    const wrapper = document.createElement('div');
    wrapper.className = 'exercise-listening';

    const questionEl = document.createElement('h3');
    questionEl.textContent = "Listen and choose:";
    wrapper.appendChild(questionEl);

    // Audio Control
    const audioBtn = document.createElement('button');
    audioBtn.textContent = '🔊 Play Audio';
    audioBtn.className = 'audio-play-btn';

    // Resolve IPFS if needed
    const audioSrc = exercise.audioSrc.startsWith('ipfs://')
        ? exercise.audioSrc.replace('ipfs://', 'https://ipfs.io/ipfs/')
        : exercise.audioSrc;

    const audio = new Audio(audioSrc);

    const listeners = [];

    const playHandler = () => {
        audio.play().catch(e => {
            console.error("Audio play failed", e);
            audioBtn.textContent = '❌ Error playing audio';
        });
    };
    audioBtn.addEventListener('click', playHandler);
    listeners.push({ element: audioBtn, type: 'click', handler: playHandler });

    wrapper.appendChild(audioBtn);

    // Options (Multiple Choice style)
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'options-grid';

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
        listeners.forEach(l => l.element.removeEventListener(l.type, l.handler));
        audio.pause();
    };
}

export const rendererMap = {
    'multiple_choice': renderMultipleChoice,
    'tap_fill': renderTapFill,
    'pronunciation': renderPronunciation,
    'flashcard': renderFlashcard,
    'sentence_order': renderSentenceOrder,
    'matching': renderMatching,
    'listening': renderListening
};
