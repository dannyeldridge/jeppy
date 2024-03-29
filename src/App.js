import React, { useState, useEffect } from 'react';
import './App.css';
// import SoundBoard from './helpers/SoundBoard';

function getDailyClues() {
  return fetch('https://jserviceflask.onrender.com/daily-clues').then(response => response.json());
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
        <div style={{"font-size": "2em", "text-shadow": "2px 2px 0px black", "font-weight": "bold"}}>{category.toUpperCase()} ({value})</div>
        <div style={{"font-size": "1em", "text-shadow": "2px 2px 0px black", "font-style": "italic"}}>{`AIRED IN ${airDate}`}</div>
      </div>
      <div className="Jeopardy-box flex-box-column" style={{"height": "18em", "overflow-y": "auto"}}>
        <div style={{"font-size": "2em", "padding": "0.5em"}}>{showAnswer ? answer : question}</div>
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
  const [message, setMessage] = useState('Welcome to Jeopardy! Here are your clues for today...');
  const [gameState, setGameState] = useState(START);
  const [cluesAnswered, setCluesAnswered] = useState([]);

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
      value: currentClue.value || 0,
      showAnswer: false,
      airDate: new Date(currentClue.airdate).getFullYear()
    });

    setClueIndex(clueIndex + 1);

    console.log(`${clue.category.title} for ${clue.value}. ${clue.question}`);
    setMessage(`"${clue.category.title}" for ${clue.value}...`)
  }

  const initializeClue = () => {
    nextClue();
  }

  const handleGuess = () => {
    setGameState(GUESSED);
    if (isAnswerCorrect()) {
      // soundBoard.playSound('right');
      addClueAnswered(clue.question, clue.answer, clue.category, clue.value, guess, true);
      setMessage("Right!")
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
      setMessage("Incorrectly marked as wrong... points added back to your score!")
      setLastClueAnsweredCorrectly();
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
            <button className='btn btn-outline-danger btn-sm mr-2' type="button" onClick={toggleShowAnswer}>
              {
                !clue.showAnswer ? "Show Answer" : "Show Question"
              }
            </button>
            <span>
              {gameState === QUESTION
                ? <button className='btn btn-outline-warning btn-sm' type="button" onClick={nextClue}>Skip Clue</button>
                : <button onClick={handleCorrectOverride} className='btn btn-outline-secondary btn-sm' >I was right!</button>
              }
            </span>
          </div>
          <div>
            <p className='mt-4 h4'>{message}</p>
          </div>
          <div>
            <p className='mt-4 h4'>
              { 'You have: ' }
              { cluesAnswered.filter((clueAnswered) => clueAnswered.isCorrect).length }
              { ' right, out of ' }
              { cluesAnswered.length }
              { ' answered.' }
            </p>
          </div>
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
          { ' clues' }
        </p>
        <p>
          { 'On the show you would have made $' }
          { cluesAnswered.reduce((total, clueAnswered) => (clueAnswered.isCorrect ? total + clueAnswered.value : total - clueAnswered.value), 0) }
        </p>
        <table class="table-dark table-bordered table-hover">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Question</th>
              <th scope="col">Answer</th>
              <th scope="col">Clue Value</th>
            </tr>
          </thead>
          <tbody>
          {cluesAnswered.map((clueAnswered, index) => (
            <tr>
              <th scope="row">{index + 1}</th>
              <td>{clueAnswered.question}</td>
              <td>{clueAnswered.answer}</td>
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
      <div class="container flex-box-column">
        <button className='btn btn-primary btn-lg m-4' onClick={start}>Play</button>
      </div>
    )
  }

  const routeView = (state) => {
    if (state == START) {
      return startView();
    } else if (state == SUMMARY) {
      return summaryView();
    } else {
      return gameView();
    }
  }

  return (
    <div className="App flex-box-column" style={{"background-color": "#00003A", "minHeight": "100%"}}>
      <div className="Jeopardy-title">
        Jeopardy
      </div>
      { routeView(gameState) }
    </div>
  );
}

export default App;
