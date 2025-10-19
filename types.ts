export interface ExperimentSettings {
  duration: number; // in milliseconds
  noiseLevel: number; // 0 to 1
  frequency: number; // in Hz
}

export enum TrialState {
  Idle = 'idle',
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
}

export interface TestResult {
  frequency: number;
  accuracy: number; 
}