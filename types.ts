
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
