(function() {
    // Game constants
    const GAME_STATES = {
        START: 'START',
        CALENDAR: 'CALENDAR',
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

    // Calendar state
    let calendarDate = new Date();
    let selectedDate = null;

    // API endpoints
    const API_BASE = 'https://jservice.dannyeldridge.com';
    const DAILY_CLUES_ENDPOINT = 'https://jservice.dannyeldridge.com/daily-clues';
    const VALIDATE_ENDPOINT = 'https://jservice.dannyeldridge.com/api/validate-jeopardy-answer';
    const AI_VALIDATION_TIMEOUT = 2000; // 2 seconds

    // DOM helpers
    function $(selector) {
        return document.querySelector(selector);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Helper function to format date as YYYY-MM-DD
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Calendar helper functions
    function getMonthName(month) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return months[month];
    }

    function getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    function getFirstDayOfMonth(year, month) {
        return new Date(year, month, 1).getDay();
    }

    function isSameDay(date1, date2) {
        if (!date1 || !date2) return false;
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    function isBeforeToday(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    }

    function isToday(date) {
        const today = new Date();
        return isSameDay(date, today);
    }

    // Game logic
    async function getDailyClues(date = null) {
        try {
            let url;
            if (date) {
                // Use date-specific endpoint for previous rounds
                const dateStr = formatDate(date);
                url = `${API_BASE}/api/clues-by-date?date=${dateStr}`;
            } else {
                // Use daily-clues endpoint for today's round
                url = DAILY_CLUES_ENDPOINT;
            }
            const response = await fetch(url);
            dailyClues = await response.json();
            console.log('Daily clues loaded:', dailyClues);
        } catch (error) {
            console.error('Failed to fetch daily clues:', error);
        }
    }

    // AI-powered answer validation with fallback
    async function validateAnswerWithAI(userAnswer, correctAnswer, question) {
        try {
            // Create a promise that rejects after timeout
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('AI validation timeout')), AI_VALIDATION_TIMEOUT)
            );

            // Create the API call promise to our proxy
            const aiPromise = fetch(VALIDATE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userAnswer,
                    correctAnswer,
                    question
                })
            });

            // Race between API call and timeout
            const response = await Promise.race([aiPromise, timeoutPromise]);
            const data = await response.json();

            console.log('AI validation result:', data.isCorrect);
            return data.isCorrect;
        } catch (error) {
            console.warn('⚠️ AI validation failed, falling back to string comparison:', error.message);
            // Fallback to simple string comparison
            return userAnswer.toLowerCase() === correctAnswer.toLowerCase();
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

    async function handleGuess() {
        gameState = GAME_STATES.GUESSED;
        message = "Checking...";
        render();

        // Use AI validation
        const isCorrect = await validateAnswerWithAI(guess, clue.answer, clue.question);

        if (isCorrect) {
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
        // Always allow override after guessing
        if (cluesAnswered.length > 0 && !cluesAnswered[cluesAnswered.length - 1].isCorrect) {
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

    function handleSkip() {
        gameState = GAME_STATES.GUESSED;
        addClueAnswered(clue.question, clue.answer, clue.category, clue.value, '(skipped)', 'skipped');
        toggleShowAnswer();
        message = "Skipped!";
        render();
    }

    function resetGameState() {
        clueIndex = 0;
        cluesAnswered = [];
        guess = '';
        message = '';
        showConfetti = false;
    }

    async function handleStart() {
        resetGameState();
        await getDailyClues(); // Fetch today's clues
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
                <div class="start-buttons-container">
                    <button class='btn btn-primary btn-lg m-4 play-button'
                        onclick="handleStart()">
                        Play today's round
                    </button>
                    <button class='btn btn-secondary btn-lg m-4 play-button'
                        onclick="showCalendar()">
                        Play previous round
                    </button>
                </div>
            </div>
        `;
    }

    function calendarView() {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const today = new Date();

        const canGoPrev = !(year === 1900 && month === 0);
        const canGoNext = !(year === today.getFullYear() && month === today.getMonth());

        let daysHTML = '';

        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            daysHTML += '<div class="calendar-day empty"></div>';
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isPast = isBeforeToday(date) || isToday(date);
            const isTodayDate = isToday(date);
            const isSelected = selectedDate && isSameDay(date, selectedDate);

            const classes = ['calendar-day'];
            if (!isPast) classes.push('disabled');
            if (isTodayDate) classes.push('today');
            if (isSelected) classes.push('selected');

            daysHTML += `
                <div class="${classes.join(' ')}"
                     ${isPast ? `onclick="selectCalendarDate(${year}, ${month}, ${day})"` : ''}>
                    <span class="day-number">${day}</span>
                    ${isTodayDate ? '<span class="today-marker">TODAY</span>' : ''}
                </div>
            `;
        }

        return `
            <div class="fullscreen-background calendar-bg">
                <div class="calendar-container">
                    <div class="calendar-header">
                        <div class="calendar-decorative-line top"></div>
                        <h2 class="calendar-title">Select a Round</h2>
                        <div class="calendar-decorative-line bottom"></div>
                    </div>

                    <div class="calendar-nav">
                        <button class="calendar-nav-btn ${!canGoPrev ? 'disabled' : ''}"
                                ${canGoPrev ? 'onclick="prevMonth()"' : ''}>
                            <span class="nav-arrow">‹</span>
                        </button>
                        <div class="calendar-month-year">
                            <span class="month-name">${getMonthName(month)}</span>
                            <span class="year-name">${year}</span>
                        </div>
                        <button class="calendar-nav-btn ${!canGoNext ? 'disabled' : ''}"
                                ${canGoNext ? 'onclick="nextMonth()"' : ''}>
                            <span class="nav-arrow">›</span>
                        </button>
                    </div>

                    <div class="calendar-weekdays">
                        <div class="weekday">SUN</div>
                        <div class="weekday">MON</div>
                        <div class="weekday">TUE</div>
                        <div class="weekday">WED</div>
                        <div class="weekday">THU</div>
                        <div class="weekday">FRI</div>
                        <div class="weekday">SAT</div>
                    </div>

                    <div class="calendar-grid">
                        ${daysHTML}
                    </div>

                    <div class="calendar-actions">
                        <button class='calendar-action-btn back' onclick="backToStart()">
                            <span class="btn-icon">←</span>
                            <span class="btn-text">Back</span>
                        </button>
                        <button class='calendar-action-btn play ${!selectedDate ? 'disabled' : ''}'
                                ${selectedDate ? 'onclick="playSelectedDate()"' : ''}>
                            <span class="btn-text">Play Round</span>
                            <span class="btn-icon">→</span>
                        </button>
                    </div>

                    <div class="calendar-corner tl"></div>
                    <div class="calendar-corner tr"></div>
                    <div class="calendar-corner bl"></div>
                    <div class="calendar-corner br"></div>
                </div>
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
            case GAME_STATES.CALENDAR:
                content = calendarView();
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

    window.showCalendar = function() {
        calendarDate = new Date();
        selectedDate = null;
        gameState = GAME_STATES.CALENDAR;
        render();
    };

    window.backToStart = function() {
        gameState = GAME_STATES.START;
        render();
    };

    window.prevMonth = function() {
        calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
        render();
    };

    window.nextMonth = function() {
        calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
        render();
    };

    window.selectCalendarDate = function(year, month, day) {
        selectedDate = new Date(year, month, day);
        render();
    };

    window.playSelectedDate = async function() {
        if (!selectedDate) return;
        resetGameState();
        await getDailyClues(selectedDate);
        gameState = GAME_STATES.QUESTION;
        nextClue();
    };

    window.handleGuessSubmit = async function(event) {
        event.preventDefault();
        await handleGuess();
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