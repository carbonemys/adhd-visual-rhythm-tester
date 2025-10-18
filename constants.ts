import { ExperimentSettings } from './types';

export const WORD_LIST: string[] = [
  'BRAIN', 'PULSE', 'FOCUS', 'QUICK', 'VISON', 'IMAGE', 'FRAME', 'NOISE', 
  'ALPHA', 'THETA', 'WAVES', 'STUDY', 'GRAPH', 'MODEL', 'REACT', 'CYCLE', 
  'SPEED', 'DEPTH', 'SENSE', 'INPUT', 'TIMER', 'PIXEL', 'FLASH', 'CLOCK',
  'LIGHT', 'SOUND', 'COLOR', 'BLOCK', 'CHART', 'FIELD', 'GUARD', 'HEART',
  'INDEX', 'JOINT', 'KNOCK', 'LAYER', 'MAJOR', 'NIGHT', 'ORDER', 'PANEL',
  'QUERY', 'ROUTE', 'SCALE', 'TABLE', 'UNITY', 'VALUE', 'WHITE', 'YIELD',
  'ZEBRA'
];

export const DEFAULT_SETTINGS: ExperimentSettings = {
  duration: 200, // ms
  noiseLevel: 0.97, // Default noise in the difficult range
  frequency: 10, // 10 Hz
};

export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 200;