import { Staircase } from '../types';
import { TEST_CONFIG } from '../constants';

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const initializeStaircase = (frequency: number): Staircase => ({
  frequency,
  noiseLevel: TEST_CONFIG.initialNoise,
  stepSize: TEST_CONFIG.noiseStepInitial,
  reversals: 0,
  reversalValues: [],
  trialCount: 0,
  correctCount: 0,
  lastDirection: null,
  isComplete: false,
  noiseHistory: [TEST_CONFIG.initialNoise],
});

export const updateStaircase = (staircase: Staircase, isCorrect: boolean): Staircase => {
  const newStaircase = { ...staircase };
  newStaircase.trialCount++;
  if (isCorrect) {
    newStaircase.correctCount++;
  }

  const direction = isCorrect ? 'up' : 'down';
  const noiseChange = (isCorrect ? 1 : -1) * newStaircase.stepSize;
  const oldNoiseLevel = newStaircase.noiseLevel;

  let newNoiseLevel = oldNoiseLevel + noiseChange;
  
  // Clamp the noise level to the defined bounds
  newNoiseLevel = Math.max(
    TEST_CONFIG.noiseMin,
    Math.min(TEST_CONFIG.noiseMax, newNoiseLevel)
  );

  newStaircase.noiseLevel = newNoiseLevel;
  newStaircase.noiseHistory.push(newNoiseLevel);

  // Check for reversal only if the direction actually changed and we are not at the boundaries
  if (newStaircase.lastDirection && newStaircase.lastDirection !== direction) {
    newStaircase.reversals++;
    // Use the noise level *before* the reversal-causing step as the reversal point
    newStaircase.reversalValues.push(oldNoiseLevel); 
    
    if (newStaircase.reversals >= TEST_CONFIG.reversalsToReduceStep) {
      newStaircase.stepSize = TEST_CONFIG.noiseStepFine;
    }
  }
  
  newStaircase.lastDirection = direction;

  if (newStaircase.reversals >= TEST_CONFIG.maxReversals) {
    newStaircase.isComplete = true;
  }
  
  if (newStaircase.trialCount >= TEST_CONFIG.trialsPerFreq) {
    newStaircase.isComplete = true;
  }

  return newStaircase;
};

export const calculateThreshold = (staircase: Staircase): number => {
    const reversals = staircase.reversalValues;
    if (reversals.length < TEST_CONFIG.reversalsForThreshold) {
      if (reversals.length > 0) {
        const sum = reversals.reduce((a, b) => a + b, 0);
        return sum / reversals.length;
      }
      return staircase.noiseLevel;
    }

    const reversalsToAverage = reversals.slice(-TEST_CONFIG.reversalsForThreshold);
    const sum = reversalsToAverage.reduce((a, b) => a + b, 0);
    return sum / reversalsToAverage.length;
}

export const createInterleavedQueue = (frequencies: number[]): number[] => {
    let queue: number[] = [];
    for (let i = 0; i < TEST_CONFIG.trialsPerFreq; i++) {
        queue.push(...shuffleArray(frequencies));
    }
    return shuffleArray(queue); // Shuffle the entire interleaved queue one last time
}