export interface ExperimentSettings {
  duration: number; // in milliseconds
  noiseLevel: number; // 0 to 1
  frequency: number; // in Hz
}

export enum TrialState {
  Idle = 'idle',
  PreTrial = 'pretrial', // New state for pre-calculating stimulus
  Running = 'running',
  AwaitingInput = 'awaiting_input',
  Feedback = 'feedback',
}

export type AppMode = 'manual' | 'test';

export enum TestStatus {
  Idle = 'idle',
  StageA = 'stage_a',
  Intermission = 'intermission',
  StageB = 'stage_b',
  Complete = 'complete',
}

export interface Staircase {
  frequency: number;
  noiseLevel: number;
  stepSize: number;
  reversals: number;
  reversalValues: number[];
  trialCount: number;
  correctCount: number;
  lastDirection: 'up' | 'down' | null;
  isComplete: boolean;
  noiseHistory: number[];
  isPinned: boolean;
  pinnedCount: number;
}

export interface TestResult {
  frequency: number;
  accuracy: number; 
}

export interface StageAResult {
  frequency: number;
  accuracy: number;
  threshold: number;
  noiseMin: number;
  noiseMax: number;
  wasPinned: boolean;
}

export interface Envelope {
  values: number[]; // pre-computed noise values per frame
  mean: number;
  rms: number;
  integral: number;
  phase: number;
}

export interface StimulusConfig {
  durationMs: number;
  frequency: number;
  refreshRate: number;
  noiseLevel: number;
  stimulusMode: 'singleSine' | 'multiSine';
  randomizePhase: boolean;
}

export interface TrialLogEntry {
  trialNumber: number;
  stage: TestStatus;
  word: string;
  guess: string;
  isCorrect: boolean;
  rt: number | null;
  // Stimulus params
  frequency: number;
  phase: number;
  noiseBase: number;
  envelopeMean: number;
  envelopeRms: number;
  envelopeIntegral: number;
  frameCount: number;
  detectedRefreshRate: number;
}
