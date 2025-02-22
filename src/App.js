import React, { useState, useEffect } from 'react';
import './App.css';
import Confetti from 'react-confetti';
import greg from './img/greg.png';

function getDailyClues() {
  const endpoint = process.env.REACT_APP_API_ENDPOINT;
  return fetch(endpoint).then(response => response.json());
}

function JeopardyCard(props) {
  const {
    category,
    question,
    answer,
    value,
    airDate,
    showAnswer
  } = props;

  return (
    <div>
      <div className="Jeopardy-box flex-box-column" style={{"height": "7em"}}>
        <div id='category' style={{"font-size": "2em", "text-shadow": "2px 2px 0px black", "font-weight": "bold"}}>{category.toUpperCase()} ({value})</div>
        <div id='year' style={{"font-size": "1em", "text-shadow": "2px 2px 0px black", "font-style": "italic"}}>{`AIRED IN ${airDate}`}</div>
      </div>
      <div className="Jeopardy-box flex-box-column" style={{"min-height": "18em", "overflow-y": "auto"}}>
        {question === "" ? (
          <div className="score-display">${value}</div>
        ) : (
          <div style={{"font-size": "2em", "padding": "0.5em"}}>{showAnswer ? answer : question}</div>
        )}
      </div>
    </div>
  )
}


function App() {
  const START = 0;
  const QUESTION = 1;
  const GUESSED = 2;
  const SUMMARY = 3;

  const [dailyClues, setDailyClues] = useState([]);
  const [clueIndex, setClueIndex] = useState(0);

  useEffect(() => {
    getDailyClues().then((clues) => {
      setDailyClues(clues);
    });
  }, []);

  const [clue, setClue] = useState({
    question: "...",
    answer: "...",
    category: "...",
    value: "",
    showAnswer: false,
    airDate: "..."
  });

  const [guess, setGuess] = useState('');
  const [message, setMessage] = useState('');
  const [gameState, setGameState] = useState(START);
  const [cluesAnswered, setCluesAnswered] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const addClueAnswered = (question, answer, category, value, userAnswer, isCorrect) => {
    setCluesAnswered([...cluesAnswered, {
      question,
      answer,
      category,
      value,
      userAnswer,
      isCorrect
    }]);
  }

  const setLastClueAnsweredCorrectly = () => {
    const newCluesAnswered = cluesAnswered;
    newCluesAnswered[cluesAnswered.length - 1]['isCorrect'] = true;
    setCluesAnswered(newCluesAnswered);
  }

  const currentScore = () => {
    return cluesAnswered.reduce((total, clueAnswered) => (clueAnswered.isCorrect ? total + clueAnswered.value : total - clueAnswered.value), 0);
  }

  const finalScore = () => {
    return Math.max(0, currentScore());
  }

  const nextClue = () => {
    setGuess("");
    if (cluesAnswered.length === 6) {
      setGameState(SUMMARY);
      return;
    }

    setGameState(QUESTION);
    const currentClue = dailyClues[clueIndex];
    console.log(currentClue);

    setClue({
      question: currentClue.question,
      answer: currentClue.answer,
      category: currentClue.category.title,
      value: Math.min(currentClue.value || 0, 2000),
      showAnswer: false,
      airDate: new Date(currentClue.airdate).getFullYear()
    });

    setClueIndex(clueIndex + 1);
    setMessage("");
    setShowConfetti(false);
  }

  const initializeClue = () => {
    nextClue();
  }

  const handleGuess = () => {
    setGameState(GUESSED);
    if (isAnswerCorrect()) {
      // soundBoard.playSound('right');
      addClueAnswered(clue.question, clue.answer, clue.category, clue.value, guess, true);
      toggleShowAnswer();
      setMessage("Right!")
      setShowConfetti(true);
    } else {
      // soundBoard.playSound('wrong');
      addClueAnswered(clue.question, clue.answer, clue.category, clue.value, guess, false);
      toggleShowAnswer();
      setMessage("Wrong!")
    }
  }

  const handleCorrectOverride = () => {
    if (!isAnswerCorrect()) {
      // soundBoard.playSound('right');
      setMessage(`My bad, you were right... $${clue.value} added to your score!`)
      setLastClueAnsweredCorrectly();
      setShowConfetti(true);
    }
  }


  const toggleShowAnswer = () => {
    setClue({...clue, showAnswer: !clue.showAnswer})
  }

  const isAnswerCorrect = () => {
    return guess.toLowerCase() === clue.answer.toLowerCase();
  }


  const gameView = () => {
    return (
        <div className="flex-box-column">
          <div>
            <JeopardyCard value={clue.value} category={clue.category} question={clue.question} answer={clue.answer} airDate={clue.airDate} showAnswer={clue.showAnswer}/>
          </div>
          <div className='form-group form-inline mt-4' autocomplete="off">
            <form onSubmit={e => e.preventDefault()}>
              <input autocomplete="off" disabled={gameState === GUESSED} className='form-control' value={guess} onChange={(event) => {setGuess(event.target.value)}} type="text" />
              <button disabled={gameState === GUESSED} className='btn btn-primary mx-2' onClick={handleGuess}>Guess</button>
              {
                gameState === GUESSED &&
                <button className='btn btn-success' type="button" onClick={nextClue}>Next Clue</button>
              }
            </form>
          </div>
          <div>
            {
              gameState === GUESSED &&
              <button className='btn btn-outline-danger btn-sm mr-2' type="button" onClick={toggleShowAnswer}>
                {
                  !clue.showAnswer ? "Show Answer" : "Show Question"
                }
              </button>
            }
            <span>
              {gameState !== QUESTION &&
                <button onClick={handleCorrectOverride} className='btn btn-outline-secondary btn-sm' >I was right!</button>
              }
            </span>
          </div>
          <div>
            <p className='mt-4 h4'>{message}</p>
          </div>
          <div>
            <p className='mt-4 h4'>
              { cluesAnswered.length === 0 ? 'Good luck!' : `Your score: $${currentScore()}`}
              <br />
              { cluesAnswered.filter((clueAnswered) => clueAnswered.isCorrect).length }
              { ' right out of ' }
              { cluesAnswered.length }
              { ' answered' }
            </p>
          </div>
          { showConfetti && <Confetti 
            width={window.innerWidth}
            height={window.innerHeight}
          /> }
        </div>
    );
  }

  const summaryView = () => {
    return (
      <div class="container flex-box-column">
        <p>Summary:</p>
        <p>
          { 'You answered '}
          { cluesAnswered.filter((cluesAnswered) => cluesAnswered.isCorrect).length }
          { ' correctly, out of today\'s ' }
          { cluesAnswered.length }
        </p>
        { cluesAnswered.filter((cluesAnswered) => cluesAnswered.isCorrect).length === 6 &&
        <p>
          <img src={greg} alt="greg" className="greg-image" />
          <p>Greg says: "You did it! You won Jeopardy!"</p>
        </p>
        }
        <p>
          { 'Today you won $' }
          { finalScore() }
        </p>
        <table class="table-dark table-bordered table-hover">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Question</th>
              <th scope="col">Answer</th>
              <th scope="col"></th>
              <th scope="col">Clue Value</th>
            </tr>
          </thead>
          <tbody>
          {cluesAnswered.map((clueAnswered, index) => (
            <tr>
              <th scope="row">{index + 1}</th>
              <td>{clueAnswered.question}</td>
              <td>{clueAnswered.answer}</td>
              <td>{clueAnswered.isCorrect ? "✓" : "✗"}</td>
              <td>{clueAnswered.value}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    )
  }

  const startView = () => {
    const start = () => {
      setGameState(QUESTION);
      initializeClue();
    }

    return(
      <div className="fullscreen-background">
        <button className='btn btn-primary btn-lg m-4' style={{ fontSize: '1.45em', padding: '0.875em 2em' }} onClick={start}>Play</button>
      </div>
    )
  }

  const routeView = (state) => {
    if (state === START) {
      return startView();
    } else if (state === SUMMARY) {
      return summaryView();
    } else {
      return gameView();
    }
  }

  return (
    <div className="App flex-box-column" style={{"background-color": "#00003A", "minHeight": "100%"}}>
      { routeView(gameState) }
    </div>
  );
}

export default App;
