import { ExperimentSettings, StimulusConfig } from './types';

export const WORD_LIST: string[] = [
  'BRAIN', 'PULSE', 'FOCUS', 'QUICK', 'VISON', 'IMAGE', 'FRAME', 'NOISE', 
  'ALPHA', 'THETA', 'WAVES', 'STUDY', 'GRAPH', 'MODEL', 'REACT', 'CYCLE', 
  'SPEED', 'DEPTH', 'SENSE', 'INPUT', 'TIMER', 'PIXEL', 'FLASH', 'CLOCK',
  'LIGHT', 'SOUND', 'COLOR', 'BLOCK', 'CHART', 'FIELD', 'GUARD', 'HEART',
  'INDEX', 'JOINT', 'KNOCK', 'LAYER', 'MAJOR', 'NIGHT', 'ORDER', 'PANEL',
  'QUERY', 'ROUTE', 'SCALE', 'TABLE', 'UNITY', 'VALUE', 'WHITE', 'YIELD',
  'ZEBRA', 'ABOUT', 'ABOVE', 'ADMIT', 'ADULT', 'AFTER', 'AGAIN', 'AGENT',
  'AGREE', 'AHEAD', 'ALARM', 'ALBUM', 'ALERT', 'ALIKE', 'ALIVE', 'ALLOW',
  'ALONE', 'ALONG', 'ALTER', 'AMONG', 'ANGER', 'ANGLE', 'APART', 'APPLE',
  'APPLY', 'ARENA', 'ARGUE', 'ARISE', 'ARMOR', 'ASIDE', 'ASSET', 'AUDIO',
  'AUDIT', 'AVOID', 'AWARD', 'AWARE', 'BADLY', 'BAKER', 'BASIC', 'BEACH',
  'BEGIN', 'BELOW', 'BENCH', 'BIBLE', 'BIRTH', 'BLADE', 'BLAME', 'BLIND',
  'BLOOD', 'BOARD', 'BOOST', 'BOUND', 'BRAND', 'BREAD', 'BREAK', 'BRICK',
  'BRIEF', 'BRING', 'BROAD', 'BROWN', 'BUILD', 'BUNCH', 'BUYER', 'CABIN',
  'CABLE', 'CARRY', 'CATCH', 'CAUSE', 'CHAIN', 'CHAIR', 'CHARM', 'CHASE',
  'CHEAP', 'CHECK', 'CHEST', 'CHIEF', 'CHILD', 'CHOIR', 'CLEAN', 'CLEAR',
  'CLIMB', 'CLOSE', 'COACH', 'COAST', 'COUNT', 'COURT', 'COVER', 'CRACK',
  'CRAFT', 'CRASH', 'CREAM', 'CRIME', 'CROSS', 'CROWD', 'CROWN', 'CURVE',
  'DAILY', 'DANCE', 'DEATH', 'DELAY', 'DEVIL', 'DIARY', 'DIRTY', 'DOUBT',
  'DOZEN', 'DRAFT', 'DRAMA', 'DRAWN', 'DREAM', 'DRESS', 'DRINK', 'DRIVE',
  'EARLY', 'EARTH', 'EIGHT', 'ELITE', 'EMPTY', 'ENEMY', 'ENJOY', 'ENTER',
  'EQUAL', 'ERROR', 'ESSAY', 'EVENT', 'EVERY', 'EXACT', 'EXIST', 'EXTRA',
  'FAITH', 'FALSE', 'FANCY', 'FAULT', 'FIBER', 'FIGHT', 'FINAL', 'FIRST',
  'FLOOR', 'FLUID', 'FORCE', 'FORTH', 'FORTY', 'FORUM', 'FOUND', 'FRESH',
  'FRONT', 'FRUIT', 'FULLY', 'FUNNY', 'GIANT', 'GIVEN', 'GLASS', 'GLOBE',
  'GRACE', 'GRADE', 'GRAND', 'GRANT', 'GRASS', 'GREAT', 'GREEN', 'GROUP',
  'GUIDE', 'HAPPY', 'HEAVY', 'HENCE', 'HORSE', 'HOTEL', 'HOUSE', 'HUMAN',
  'IDEAL', 'IMPLY', 'ISSUE', 'JUDGE', 'KNOWN', 'LARGE'
];


export const DEFAULT_SETTINGS: ExperimentSettings = {
  duration: 200, // ms
  noiseLevel: 0.97, // Default noise in the difficult range
  frequency: 10, // 10 Hz
};

export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 200;

// Dropped <5 Hz as they are unreliable within a 200ms window
export const STAGE_A_FREQUENCIES = [5, 7, 10, 12, 15, 20];

export const TEST_CONFIG = {
  duration: 200,
  initialNoise: 0.96,
  noiseStepInitial: 0.02,
  noiseStepFine: 0.01,
  noiseMin: 0.90,
  noiseMax: 1.00,
  reversalsToReduceStep: 2,
  maxReversals: 8,
  trialsPerFreqStageA: 15,
  trialsPerFreqStageB: 20,
  stageBPoints: 2, // Test peak ± this many points
  reversalsForThreshold: 6, // Average the last N reversals
  pinThreshold: 8, // consecutive trials at a boundary to be considered "pinned"
};

export const DEFAULT_STIMULUS_CONFIG: StimulusConfig = {
    durationMs: TEST_CONFIG.duration,
    frequency: 10,
    refreshRate: 60, // Default, will be updated by detection
    noiseLevel: TEST_CONFIG.initialNoise,
    stimulusMode: 'singleSine',
    randomizePhase: true,
};
