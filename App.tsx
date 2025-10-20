import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ExperimentSettings, TrialState, AppMode, TestStatus, TestResult, Staircase, StageAResult, Envelope, TrialLogEntry, StimulusConfig } from './types';
import { WORD_LIST, DEFAULT_SETTINGS, STAGE_A_FREQUENCIES, TEST_CONFIG, DEFAULT_STIMULUS_CONFIG } from './constants';
import { initializeStaircase, updateStaircase, calculateThreshold, createInterleavedQueue } from './lib/test-logic';
import { detectRefreshRate, generateEnvelope } from './lib/stimulus-logic';
import { exportToCsv, exportToJson } from './lib/export-logic';
import ControlsPanel from './components/ControlsPanel';
import ExperimentCanvas from './components/ExperimentCanvas';
import TestPanel from './components/TestPanel';

const App: React.FC = () => {
  const [settings, setSettings] = useState<ExperimentSettings>(DEFAULT_SETTINGS);
  const [trialState, setTrialState] = useState<TrialState>(TrialState.Idle);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [currentWord, setCurrentWord] = useState('');
  const [userGuess, setUserGuess] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; color: string } | null>(null);
  
  const [mode, setMode] = useState<AppMode>('manual');
  const [testStatus, setTestStatus] = useState<TestStatus>(TestStatus.Idle);
  const [testResults, setTestResults] = useState<{ stageA: StageAResult[], stageB: TestResult[] }>({ stageA: [], stageB: [] });
  const [currentTestTrial, setCurrentTestTrial] = useState<{ frequency: number; noiseLevel: number } | null>(null);
  const [testProgress, setTestProgress] = useState<{ current: number, total: number} | null>(null);
  const [stageStats, setStageStats] = useState({ stageA: { correct: 0, total: 0 }, stageB: { correct: 0, total: 0 } });
  const [stageBSelection, setStageBSelection] = useState<number[]>([]);
  const [stageBNoiseLevel, setStageBNoiseLevel] = useState<number | null>(null);

  const [refreshRate, setRefreshRate] = useState(60);
  const [isDebug, setIsDebug] = useState(false);
  const [trialLog, setTrialLog] = useState<TrialLogEntry[]>([]);
  const [currentEnvelope, setCurrentEnvelope] = useState<Envelope | null>(null);

  const trialStartTimeRef = useRef<number | null>(null);
  
  const testController = useRef<{
    trialQueue: number[];
    staircases?: Map<number, Staircase>;
    stageBNoiseLevel?: number;
    accuracyTracker?: Map<number, { correct: number, total: number }>;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const feedbackTimeoutId = useRef<number | null>(null);

  useEffect(() => {
    detectRefreshRate().then(rate => setRefreshRate(rate));
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === 'true') {
      setIsDebug(true);
    }
    return () => { if (feedbackTimeoutId.current) clearTimeout(feedbackTimeoutId.current); };
  }, []);

  const prepareAndRunTrial = useCallback((stimulusConfig: StimulusConfig) => {
    if (trialState !== TrialState.Idle && trialState !== TrialState.Feedback) return;
    if (feedbackTimeoutId.current) clearTimeout(feedbackTimeoutId.current);
    
    setTrialState(TrialState.PreTrial);
    const nextWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    setCurrentWord(nextWord);
    
    const envelope = generateEnvelope(stimulusConfig);
    setCurrentEnvelope(envelope);
    
    setFeedback(null);
    setUserGuess('');
    
    // Short delay to ensure state updates before running
    setTimeout(() => {
      setTrialState(TrialState.Running);
      trialStartTimeRef.current = performance.now();
    }, 50);
  }, [trialState]);


  const onTrialComplete = useCallback(() => {
    setTrialState(TrialState.AwaitingInput);
  }, []);

  useEffect(() => {
    if (trialState === TrialState.AwaitingInput) {
      inputRef.current?.focus();
    }
  }, [trialState]);

  const advanceTest = useCallback(() => {
    if (!testController.current) return;

    const { trialQueue } = testController.current;

    if (trialQueue.length === 0) {
      if (testStatus === TestStatus.StageA) {
        // --- Stage A Complete, Setup Intermission ---
        const staircases = testController.current.staircases!;
        
        const stageAResults: StageAResult[] = STAGE_A_FREQUENCIES.map(freq => {
            const sc = staircases.get(freq)!;
            const threshold = calculateThreshold(sc);
            const noiseMin = sc.noiseHistory.length > 0 ? Math.min(...sc.noiseHistory) : 0;
            const noiseMax = sc.noiseHistory.length > 0 ? Math.max(...sc.noiseHistory) : 0;
            return {
                frequency: freq,
                accuracy: sc.trialCount > 0 ? sc.correctCount / sc.trialCount : 0,
                threshold,
                noiseMin,
                noiseMax,
                wasPinned: sc.isPinned,
            };
        });

        setTestResults({ stageA: stageAResults, stageB: [] });
        
        const validThresholds = stageAResults.filter(r => !r.wasPinned).map(r => r.threshold);
        const totalThreshold = validThresholds.reduce((sum, threshold) => sum + threshold, 0);
        const avgThreshold = validThresholds.length > 0 ? totalThreshold / validThresholds.length : TEST_CONFIG.initialNoise;
        const finalStageBNoiseLevel = Math.max(TEST_CONFIG.noiseMin, Math.min(TEST_CONFIG.noiseMax, avgThreshold));
        
        setStageBNoiseLevel(finalStageBNoiseLevel);
        testController.current.stageBNoiseLevel = finalStageBNoiseLevel;

        const sortedByThreshold = [...stageAResults].sort((a, b) => a.threshold - b.threshold);
        const bestFreq = sortedByThreshold[0].frequency;
        
        const selection = new Set<number>();
        selection.add(bestFreq);
        for(let i = 1; selection.size < 5; i++){
            if(bestFreq - i > 0) selection.add(bestFreq - i);
            if(selection.size < 5 && bestFreq + i <= 30) selection.add(bestFreq + i);
        }

        setStageBSelection(Array.from(selection).sort((a,b) => a - b));
        setTestStatus(TestStatus.Intermission);
        
      } else {
        // --- Stage B Complete, Finalize Test ---
        const stageBResults: TestResult[] = [];
        const accuracyTracker = testController.current.accuracyTracker!;
        accuracyTracker.forEach((stats, freq) => {
            stageBResults.push({
                frequency: freq,
                accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
            });
        });
        setTestResults(prev => ({ ...prev, stageB: stageBResults }));
        setTestStatus(TestStatus.Complete);
      }
      return;
    }
    
    const nextFreq = trialQueue.shift()!;
    let noiseLevel: number;

    if (testStatus === TestStatus.StageA) {
      const staircase = testController.current.staircases!.get(nextFreq);
      if (staircase && staircase.isComplete) {
        advanceTest();
        return;
      }
      noiseLevel = staircase!.noiseLevel;
    } else { // Stage B
      noiseLevel = testController.current.stageBNoiseLevel!;
    }
    
    setTestProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null);

    setCurrentTestTrial({ frequency: nextFreq, noiseLevel });
    prepareAndRunTrial({ ...DEFAULT_STIMULUS_CONFIG, frequency: nextFreq, noiseLevel, refreshRate });

  }, [testStatus, refreshRate, prepareAndRunTrial]);

  useEffect(() => {
    if ((testStatus === TestStatus.StageA || testStatus === TestStatus.StageB) && (trialState === TrialState.Idle || trialState === TrialState.Feedback)) {
        advanceTest();
    }
  }, [testStatus, trialState, advanceTest]);

  const processTestResult = (isCorrect: boolean) => {
    if (!currentTestTrial || !currentEnvelope) return;

    const rt = trialStartTimeRef.current ? performance.now() - trialStartTimeRef.current : null;
    const logEntry: TrialLogEntry = {
        trialNumber: trialLog.length + 1,
        stage: testStatus,
        word: currentWord,
        guess: userGuess.trim().toUpperCase(),
        isCorrect,
        rt,
        frequency: currentTestTrial.frequency,
        phase: currentEnvelope.phase,
        noiseBase: currentTestTrial.noiseLevel,
        envelopeMean: currentEnvelope.mean,
        envelopeRms: currentEnvelope.rms,
        envelopeIntegral: currentEnvelope.integral,
        frameCount: currentEnvelope.values.length,
        detectedRefreshRate: refreshRate,
    };
    setTrialLog(prevLog => [...prevLog, logEntry]);

    const { frequency } = currentTestTrial;
    if (testStatus === TestStatus.StageA) {
        setStageStats(s => ({ ...s, stageA: { correct: s.stageA.correct + (isCorrect ? 1 : 0), total: s.stageA.total + 1 } }));
        const staircase = testController.current?.staircases?.get(frequency);
        if (staircase) {
            const updatedStaircase = updateStaircase(staircase, isCorrect);
            testController.current!.staircases!.set(frequency, updatedStaircase);
        }
    } else if (testStatus === TestStatus.StageB) {
        setStageStats(s => ({ ...s, stageB: { correct: s.stageB.correct + (isCorrect ? 1 : 0), total: s.stageB.total + 1 } }));
        const tracker = testController.current?.accuracyTracker?.get(frequency);
        if (tracker) {
            tracker.correct += isCorrect ? 1 : 0;
            tracker.total += 1;
        }
    }
    setTrialState(TrialState.Feedback);
    feedbackTimeoutId.current = window.setTimeout(() => setTrialState(TrialState.Idle), 500);
  };

  const startTest = (isStageBOnly = false, customConfig: {noise: number, frequencies: number[]} | null = null) => {
    setTestStatus(TestStatus.Idle);
    setTestResults({ stageA: [], stageB: [] });
    setStageStats({ stageA: { correct: 0, total: 0 }, stageB: { correct: 0, total: 0 } });
    setTrialLog([]);

    if (isStageBOnly && customConfig) {
        const { noise, frequencies } = customConfig;
        const newQueue = createInterleavedQueue(frequencies, TEST_CONFIG.trialsPerFreqStageB);
        const accuracyTracker = new Map<number, { correct: number; total: number}>();
        frequencies.forEach(freq => accuracyTracker.set(freq, { correct: 0, total: 0}));

        testController.current = {
            trialQueue: newQueue,
            accuracyTracker,
            stageBNoiseLevel: noise,
        };
        
        setStageBNoiseLevel(noise);
        setTestProgress({ current: 0, total: newQueue.length });
        setTrialState(TrialState.Idle);
        setTestStatus(TestStatus.StageB);
    } else {
        const queue = createInterleavedQueue(STAGE_A_FREQUENCIES, TEST_CONFIG.trialsPerFreqStageA);
        const staircases = new Map<number, Staircase>();
        STAGE_A_FREQUENCIES.forEach(freq => staircases.set(freq, initializeStaircase(freq)));

        testController.current = { staircases, trialQueue: queue };
        setTestProgress({ current: 0, total: queue.length });
        setTrialState(TrialState.Idle);
        setTestStatus(TestStatus.StageA);
    }
  };

  const startStageB = () => {
    if (stageBSelection.length < 5) return;
    
    const newQueue = createInterleavedQueue(stageBSelection, TEST_CONFIG.trialsPerFreqStageB);
    const accuracyTracker = new Map<number, { correct: number; total: number}>();
    stageBSelection.forEach(freq => accuracyTracker.set(freq, { correct: 0, total: 0}));

    testController.current = {
        ...testController.current!,
        trialQueue: newQueue,
        accuracyTracker,
    };
    
    setTestProgress({ current: 0, total: newQueue.length });
    setTrialState(TrialState.Idle);
    setTestStatus(TestStatus.StageB);
  };

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trialState !== TrialState.AwaitingInput) return;

    const isCorrect = userGuess.trim().toUpperCase() === currentWord;
    
    if (mode === 'manual') {
      setScore(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));
      setFeedback({
        message: isCorrect ? 'Correct!' : `The word was: ${currentWord}`,
        color: isCorrect ? 'text-green-400' : 'text-red-400',
      });
      setTrialState(TrialState.Feedback);
      feedbackTimeoutId.current = window.setTimeout(() => setTrialState(TrialState.Idle), 2000);
    } else { // test mode
      setFeedback({ message: isCorrect ? 'Correct!' : 'Incorrect', color: isCorrect ? 'text-green-400' : 'text-red-400' });
      processTestResult(isCorrect);
    }
  };
  
  const handleDontKnow = () => {
    if (trialState !== TrialState.AwaitingInput) return;
    if (mode === 'manual') {
      setScore(prev => ({ correct: prev.correct, total: prev.total + 1 }));
      setFeedback({ message: `The word was: ${currentWord}`, color: 'text-yellow-500' });
      setTrialState(TrialState.Feedback);
      feedbackTimeoutId.current = window.setTimeout(() => setTrialState(TrialState.Idle), 2000);
    } else {
       setFeedback({ message: 'Incorrect', color: 'text-red-400' });
       processTestResult(false);
    }
  };

  const handleDownload = (format: 'csv' | 'json') => {
    if(format === 'csv') exportToCsv(trialLog);
    else exportToJson(trialLog);
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cyan-400 tracking-wider">Visual Rhythm Experiment</h1>
        </header>
        
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg shadow-2xl">
            {mode === 'manual' 
              ? <ControlsPanel settings={settings} onSettingsChange={setSettings} />
              : <TestPanel 
                  status={testStatus} 
                  results={testResults} 
                  onStart={startTest} 
                  progress={testProgress} 
                  stats={stageStats}
                  stageBSelection={stageBSelection}
                  setStageBSelection={setStageBSelection}
                  onStartStageB={startStageB}
                  stageBNoiseLevel={stageBNoiseLevel}
                  onDownload={handleDownload}
                />
            }
          </div>

          <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-2xl flex flex-col items-center justify-center">
             <div className="w-full flex justify-center mb-6">
                <div className="bg-gray-700 p-1 rounded-lg flex space-x-1">
                    <button onClick={() => setMode('manual')} className={`px-4 py-2 text-sm font-semibold rounded-md transition ${mode === 'manual' ? 'bg-cyan-600 text-white' : 'bg-transparent text-gray-300 hover:bg-gray-600'}`}>
                        Manual Mode
                    </button>
                    <button onClick={() => setMode('test')} className={`px-4 py-2 text-sm font-semibold rounded-md transition ${mode === 'test' ? 'bg-cyan-600 text-white' : 'bg-transparent text-gray-300 hover:bg-gray-600'}`}>
                        Take Test
                    </button>
                </div>
            </div>
            <ExperimentCanvas 
              word={currentWord} 
              envelope={currentEnvelope}
              trialState={trialState}
              onComplete={onTrialComplete}
              isDebug={isDebug}
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
                  type="button"
                  onClick={handleDontKnow}
                  disabled={trialState !== TrialState.AwaitingInput}
                  className="w-full px-4 py-2 text-md font-semibold text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  I don't know
                </button>
              </form>
              
              {mode === 'manual' && (
                <>
                <button 
                  onClick={() => prepareAndRunTrial({ ...DEFAULT_STIMULUS_CONFIG, ...settings, refreshRate })}
                  disabled={trialState === TrialState.Running || trialState === TrialState.AwaitingInput || trialState === TrialState.PreTrial}
                  className="w-full mt-4 px-6 py-3 text-lg font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                >
                  {trialState === TrialState.Idle || trialState === TrialState.Feedback ? 'Start Trial' : '...'}
                </button>

                <div className="mt-6 text-2xl font-mono tracking-widest text-gray-300">
                  Score: {score.correct} / {score.total}
                </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
