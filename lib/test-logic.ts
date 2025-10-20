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
  isPinned: false,
  pinnedCount: 0,
});

export const updateStaircase = (staircase: Staircase, isCorrect: boolean): Staircase => {
  if (staircase.isComplete) return staircase;

  const newStaircase: Staircase = { ...staircase };
  newStaircase.trialCount++;
  if (isCorrect) {
    newStaircase.correctCount++;
  }

  const direction = isCorrect ? 'up' : 'down'; // up = harder (more noise), down = easier (less noise)
  const noiseChange = (isCorrect ? 1 : -1) * newStaircase.stepSize;
  const oldNoiseLevel = newStaircase.noiseLevel;

  let newNoiseLevel = oldNoiseLevel + noiseChange;
  
  newNoiseLevel = Math.max(
    TEST_CONFIG.noiseMin,
    Math.min(TEST_CONFIG.noiseMax, newNoiseLevel)
  );
  
  // Pinning logic
  if (newNoiseLevel === oldNoiseLevel && (newNoiseLevel === TEST_CONFIG.noiseMin || newNoiseLevel === TEST_CONFIG.noiseMax)) {
      newStaircase.pinnedCount++;
  } else {
      newStaircase.pinnedCount = 0;
  }

  if (newStaircase.pinnedCount >= TEST_CONFIG.pinThreshold) {
      newStaircase.isPinned = true;
      newStaircase.isComplete = true; // Stop this staircase if it's pinned
  }

  newStaircase.noiseLevel = newNoiseLevel;
  newStaircase.noiseHistory.push(newNoiseLevel);

  if (newStaircase.lastDirection && newStaircase.lastDirection !== direction) {
    newStaircase.reversals++;
    newStaircase.reversalValues.push(oldNoiseLevel); 
    
    if (newStaircase.reversals >= TEST_CONFIG.reversalsToReduceStep) {
      newStaircase.stepSize = TEST_CONFIG.noiseStepFine;
    }
  }
  
  newStaircase.lastDirection = direction;

  if (newStaircase.reversals >= TEST_CONFIG.maxReversals) {
    newStaircase.isComplete = true;
  }
  
  return newStaircase;
};

export const calculateThreshold = (staircase: Staircase): number => {
    if (staircase.isPinned) {
      // If pinned at the bottom, threshold is the minimum noise. If at top, max.
      return staircase.noiseLevel;
    }

    const reversals = staircase.reversalValues;
    if (reversals.length === 0) {
      return staircase.noiseLevel; // Best guess if no reversals happened
    }

    // Use a specified number of last reversals, or all if not enough have occurred
    const reversalsToAverageCount = Math.min(reversals.length, TEST_CONFIG.reversalsForThreshold);
    const reversalsToAverage = reversals.slice(-reversalsToAverageCount);
    
    const sum = reversalsToAverage.reduce((a, b) => a + b, 0);
    return sum / reversalsToAverage.length;
}

export const createInterleavedQueue = (frequencies: number[], trialsPerFreq: number): number[] => {
    let queue: number[] = [];
    for (const freq of frequencies) {
        for (let i = 0; i < trialsPerFreq; i++) {
            queue.push(freq);
        }
    }
    return shuffleArray(queue);
}
