(function() {
    // Game constants
    const GAME_STATES = {
        START: 'START',
        QUESTION: 'QUESTION',
        GUESSED: 'GUESSED',
        SUMMARY: 'SUMMARY'
    };

    // Game state
    let dailyClues = [];
    let clueIndex = 0;
    let clue = {
        question: "...",
        answer: "...",
        category: "...",
        value: "",
        showAnswer: false,
        airDate: "..."
    };
    let guess = '';
    let message = '';
    let gameState = GAME_STATES.START;
    let cluesAnswered = [];
    let showConfetti = false;

    // API endpoint
    const API_ENDPOINT = 'https://jservice.dannyeldridge.com/daily-clues';

    // DOM helpers
    function $(selector) {
        return document.querySelector(selector);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Game logic
    async function getDailyClues() {
        try {
            const response = await fetch(API_ENDPOINT);
            dailyClues = await response.json();
            console.log('Daily clues loaded:', dailyClues);
        } catch (error) {
            console.error('Failed to fetch daily clues:', error);
        }
    }

    function addClueAnswered(question, answer, category, value, userAnswer, isCorrect) {
        cluesAnswered.push({
            question,
            answer,
            category,
            value,
            userAnswer,
            isCorrect
        });
    }

    function setLastClueAnsweredCorrectly() {
        if (cluesAnswered.length > 0) {
            cluesAnswered[cluesAnswered.length - 1].isCorrect = true;
        }
    }

    function currentScore() {
        return cluesAnswered.reduce((total, clueAnswered) => {
            if (clueAnswered.isCorrect === 'skipped') {
                return total; // Skipped clues don't affect score
            }
            return clueAnswered.isCorrect ? total + clueAnswered.value : total - clueAnswered.value;
        }, 0);
    }

    function finalScore() {
        return currentScore();
    }

    function nextClue() {
        guess = "";
        if (cluesAnswered.length === 6) {
            gameState = GAME_STATES.SUMMARY;
            render();
            return;
        }

        gameState = GAME_STATES.QUESTION;
        const currentClue = dailyClues[clueIndex];
        console.log(currentClue);

        clue = {
            question: currentClue.question,
            answer: currentClue.answer,
            category: currentClue.category.title,
            value: Math.min(currentClue.value || 0, 2000),
            showAnswer: false,
            airDate: new Date(currentClue.airdate).getFullYear()
        };

        clueIndex++;
        message = "";
        showConfetti = false;
        render();
    }

    function handleGuess() {
        gameState = GAME_STATES.GUESSED;
        if (isAnswerCorrect()) {
            addClueAnswered(clue.question, clue.answer, clue.category, clue.value, guess, true);
            toggleShowAnswer();
            message = "Right!";
            showConfetti = true;
        } else {
            addClueAnswered(clue.question, clue.answer, clue.category, clue.value, guess, false);
            toggleShowAnswer();
            message = "Wrong!";
        }
        render();
    }

    function handleCorrectOverride() {
        if (!isAnswerCorrect()) {
            message = `My bad, you were right... $${clue.value} added to your score!`;
            setLastClueAnsweredCorrectly();
            showConfetti = true;
            render();
        }
    }

    function toggleShowAnswer() {
        clue.showAnswer = !clue.showAnswer;
        render();
    }

    function isAnswerCorrect() {
        return guess.toLowerCase() === clue.answer.toLowerCase();
    }

    function handleSkip() {
        gameState = GAME_STATES.GUESSED;
        addClueAnswered(clue.question, clue.answer, clue.category, clue.value, '(skipped)', 'skipped');
        toggleShowAnswer();
        message = "Skipped!";
        render();
    }

    function handleStart() {
        gameState = GAME_STATES.QUESTION;
        nextClue();
    }

    // Confetti animation
    function createConfetti() {
        const confettiContainer = document.createElement('div');
        confettiContainer.style.position = 'fixed';
        confettiContainer.style.top = '0';
        confettiContainer.style.left = '0';
        confettiContainer.style.width = '100%';
        confettiContainer.style.height = '100%';
        confettiContainer.style.pointerEvents = 'none';
        confettiContainer.style.zIndex = '1000';

        const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', 
                       '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', 
                       '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800'];
        
        const particles = [];
        
        for (let i = 0; i < 150; i++) {
            const particle = document.createElement('div');
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 10 + 5;
            
            particle.style.position = 'absolute';
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.backgroundColor = color;
            
            const particleData = {
                element: particle,
                x: Math.random() * window.innerWidth,
                y: -20,
                vx: Math.random() * 6 - 3,
                vy: Math.random() * 3 + 2,
                angle: Math.random() * 360,
                angularVelocity: Math.random() * 6 - 3,
                opacity: 1
            };
            
            particle.style.left = particleData.x + 'px';
            particle.style.top = particleData.y + 'px';
            
            particles.push(particleData);
            confettiContainer.appendChild(particle);
        }

        document.body.appendChild(confettiContainer);

        function animateFrame() {
            let activeParticles = false;
            
            particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.1; // gravity
                particle.angle += particle.angularVelocity;
                
                if (particle.y > window.innerHeight - 50) {
                    particle.opacity -= 0.02;
                }
                
                if (particle.opacity > 0) {
                    activeParticles = true;
                    particle.element.style.left = particle.x + 'px';
                    particle.element.style.top = particle.y + 'px';
                    particle.element.style.transform = `rotate(${particle.angle}deg)`;
                    particle.element.style.opacity = particle.opacity;
                }
            });
            
            if (activeParticles) {
                requestAnimationFrame(animateFrame);
            } else {
                confettiContainer.remove();
            }
        }
        
        requestAnimationFrame(animateFrame);
    }

    // Views
    function startView() {
        return `
            <div class="fullscreen-background">
                <button class='btn btn-primary btn-lg m-4 play-button' 
                    onclick="handleStart()">
                    Play
                </button>
            </div>
        `;
    }

    function jeopardyCard() {
        return `
            <div>
                <div class="Jeopardy-box flex-box-column jeopardy-card-header">
                    <div class="jeopardy-category">
                        ${escapeHtml(clue.category.toUpperCase())} (${escapeHtml(clue.value)})
                    </div>
                    <div class="jeopardy-year">
                        AIRED IN ${escapeHtml(clue.airDate)}
                    </div>
                </div>
                <div class="Jeopardy-box flex-box-column jeopardy-card-content">
                    ${clue.question === "" ? 
                        `<div class="score-display">$${escapeHtml(clue.value)}</div>` : 
                        `<div class="jeopardy-question-text">${escapeHtml(clue.showAnswer ? clue.answer : clue.question)}</div>`
                    }
                </div>
            </div>
        `;
    }

    function gameView() {
        const correctAnswers = cluesAnswered.filter(ca => ca.isCorrect === true).length;
        
        return `
            <div class="flex-box-column">
                <div>
                    ${jeopardyCard()}
                </div>
                <div class='form-group form-inline mt-4 game-form'>
                    <form onsubmit="handleGuessSubmit(event)">
                        <input 
                            autocomplete="off" 
                            ${gameState === GAME_STATES.GUESSED ? 'disabled' : ''} 
                            class='form-control' 
                            value="${escapeHtml(guess)}" 
                            type="text" 
                            id="guess-input"
                            oninput="handleGuessInput(event)" />
                        <button 
                            ${gameState === GAME_STATES.GUESSED ? 'disabled' : ''} 
                            class='btn btn-primary mx-2' 
                            type="submit">
                            Guess
                        </button>
                        ${gameState === GAME_STATES.QUESTION ? 
                            `<button class='btn btn-secondary mx-2' type="button" onclick="handleSkip()">Skip</button>` : 
                            ''
                        }
                        ${gameState === GAME_STATES.GUESSED ? 
                            `<button class='btn btn-success' type="button" onclick="nextClue()">Next Clue</button>` : 
                            ''
                        }
                    </form>
                </div>
                <div>
                    ${gameState === GAME_STATES.GUESSED ? `
                        <button class='btn btn-outline-danger btn-sm mr-2' type="button" onclick="toggleShowAnswer()">
                            ${!clue.showAnswer ? "Show Answer" : "Show Question"}
                        </button>
                    ` : ''}
                    <span>
                        ${gameState !== GAME_STATES.QUESTION && message !== "Skipped!" ? 
                            `<button onclick="handleCorrectOverride()" class='btn btn-outline-secondary btn-sm'>I was right!</button>` : 
                            ''
                        }
                    </span>
                </div>
                <div class="game-message">
                    <p class='mt-4 h4'>${escapeHtml(message)}</p>
                </div>
                <div class="game-score">
                    <p class='mt-4 h4'>
                        ${cluesAnswered.length === 0 ? 'Good luck!' : `Your score: $${currentScore()}`}
                        <br />
                        ${correctAnswers} right out of ${cluesAnswered.length} answered
                    </p>
                </div>
            </div>
        `;
    }

    function summaryView() {
        const correctAnswers = cluesAnswered.filter(ca => ca.isCorrect === true).length;
        
        return `
            <div class="container flex-box-column">
                <p>Summary:</p>
                <p>
                    You answered ${correctAnswers} correctly, out of today's ${cluesAnswered.length}
                </p>
                ${correctAnswers === 6 ? `
                    <p>
                        <img src="img/greg.png" alt="greg" class="greg-image" />
                        <p>Greg says: "You did it! You won Jeopardy!"</p>
                    </p>
                ` : ''}
                <p>
                    Today you won $${finalScore()}
                </p>
                <table class="table table-dark table-bordered table-hover">
                    <thead>
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">Question</th>
                            <th scope="col">Answer</th>
                            <th scope="col">Your Answer</th>
                            <th scope="col">Result</th>
                            <th scope="col">Clue Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cluesAnswered.map((clueAnswered, index) => `
                            <tr>
                                <th scope="row">${index + 1}</th>
                                <td>${escapeHtml(clueAnswered.question)}</td>
                                <td>${escapeHtml(clueAnswered.answer)}</td>
                                <td>${escapeHtml(clueAnswered.userAnswer)}</td>
                                <td>${clueAnswered.isCorrect === true ? "✓" : (clueAnswered.isCorrect === 'skipped' ? "−" : "✗")}</td>
                                <td>${clueAnswered.value}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function render() {
        const app = $('#app');
        let content = '';

        switch(gameState) {
            case GAME_STATES.START:
                content = startView();
                break;
            case GAME_STATES.SUMMARY:
                content = summaryView();
                break;
            default:
                content = gameView();
        }

        app.innerHTML = `
            <div class="App flex-box-column">
                ${content}
            </div>
        `;

        if (showConfetti) {
            createConfetti();
        }

        // Auto-focus the input when in question mode
        if (gameState === GAME_STATES.QUESTION) {
            setTimeout(() => {
                const input = $('#guess-input');
                if (input) input.focus();
            }, 100);
        }
    }

    // Event handlers (need to be global for onclick)
    window.handleStart = handleStart;
    window.nextClue = nextClue;
    window.toggleShowAnswer = toggleShowAnswer;
    window.handleCorrectOverride = handleCorrectOverride;
    window.handleSkip = handleSkip;
    
    window.handleGuessSubmit = function(event) {
        event.preventDefault();
        handleGuess();
    };

    window.handleGuessInput = function(event) {
        guess = event.target.value;
    };

    // Initialize
    async function init() {
        await getDailyClues();
        render();
    }

    // Start the app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();