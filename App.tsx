import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ExperimentSettings, TrialState } from './types';
import { WORD_LIST, DEFAULT_SETTINGS } from './constants';
import ControlsPanel from './components/ControlsPanel';
import ExperimentCanvas from './components/ExperimentCanvas';

const App: React.FC = () => {
  const [settings, setSettings] = useState<ExperimentSettings>(DEFAULT_SETTINGS);
  const [trialState, setTrialState] = useState<TrialState>(TrialState.Idle);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [currentWord, setCurrentWord] = useState('');
  const [userGuess, setUserGuess] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; color: string } | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const feedbackTimeoutId = useRef<number | null>(null);

  // Cleanup effect to clear timeout on component unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeoutId.current) {
        clearTimeout(feedbackTimeoutId.current);
      }
    };
  }, []);

  const startTrial = useCallback(() => {
    if (trialState === TrialState.Running) return;
    
    // Clear any pending feedback timeout from the previous trial
    if (feedbackTimeoutId.current) {
      clearTimeout(feedbackTimeoutId.current);
      feedbackTimeoutId.current = null;
    }

    const nextWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    setCurrentWord(nextWord);
    setTrialState(TrialState.Running);
    setFeedback(null);
    setUserGuess('');
  }, [trialState]);

  const onTrialComplete = useCallback(() => {
    setTrialState(TrialState.AwaitingInput);
  }, []);

  useEffect(() => {
    if (trialState === TrialState.AwaitingInput) {
      inputRef.current?.focus();
    }
  }, [trialState]);

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trialState !== TrialState.AwaitingInput) return;

    const isCorrect = userGuess.trim().toUpperCase() === currentWord;
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    setFeedback({
      message: isCorrect ? 'Correct!' : `The word was: ${currentWord}`,
      color: isCorrect ? 'text-green-400' : 'text-red-400',
    });

    setTrialState(TrialState.Feedback);
    
    feedbackTimeoutId.current = window.setTimeout(() => {
      setTrialState(TrialState.Idle);
      feedbackTimeoutId.current = null;
    }, 2000);
  };
  
  const handleDontKnow = () => {
    if (trialState !== TrialState.AwaitingInput) return;

    // This counts as a trial attempt, but not a correct one.
    setScore(prev => ({
      correct: prev.correct,
      total: prev.total + 1,
    }));

    setFeedback({
      message: `The word was: ${currentWord}`,
      color: 'text-yellow-500', // A neutral/informative color
    });

    setTrialState(TrialState.Feedback);

    feedbackTimeoutId.current = window.setTimeout(() => {
      setTrialState(TrialState.Idle);
      feedbackTimeoutId.current = null;
    }, 2000);
  };


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cyan-400 tracking-wider">Visual Rhythm Experiment</h1>
        </header>
        
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg shadow-2xl">
            <ControlsPanel settings={settings} onSettingsChange={setSettings} />
          </div>

          <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-2xl flex flex-col items-center justify-center">
            <ExperimentCanvas 
              word={currentWord} 
              settings={settings} 
              trialState={trialState}
              onComplete={onTrialComplete}
            />
            
            <div className="w-full max-w-md mt-6 text-center">
               <div className="h-10 text-xl font-semibold mb-4">
                {feedback && <p className={feedback.color}>{feedback.message}</p>}
              </div>

              <form onSubmit={handleGuessSubmit} className="space-y-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={userGuess}
                  onChange={(e) => setUserGuess(e.target.value)}
                  placeholder="Type the word and press Enter"
                  disabled={trialState !== TrialState.AwaitingInput}
                  className="w-full px-4 py-2 text-lg text-center bg-gray-700 border-2 border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition duration-200 disabled:opacity-50"
                  maxLength={5}
                  autoCapitalize="off"
                  autoComplete="off"
                />
                 <button
                  type="button" // Important to prevent form submission
                  onClick={handleDontKnow}
                  disabled={trialState !== TrialState.AwaitingInput}
                  className="w-full px-4 py-2 text-md font-semibold text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  I don't know
                </button>
              </form>
              
              <button 
                onClick={startTrial} 
                disabled={trialState === TrialState.Running || trialState === TrialState.AwaitingInput}
                className="w-full mt-4 px-6 py-3 text-lg font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                {trialState === TrialState.Idle || trialState === TrialState.Feedback ? 'Start Trial' : '...'}
              </button>

              <div className="mt-6 text-2xl font-mono tracking-widest text-gray-300">
                Score: {score.correct} / {score.total}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;