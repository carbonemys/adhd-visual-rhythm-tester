import { StimulusConfig, Envelope } from "../types";
import { TEST_CONFIG } from "../constants";

export const detectRefreshRate = (): Promise<number> => {
    return new Promise((resolve) => {
        let frameCount = 0;
        const sampleDuration = 1000; // 1 second
        let startTime: number;

        const measure = (timestamp: number) => {
            if (!startTime) {
                startTime = timestamp;
            }
            frameCount++;
            if (timestamp - startTime < sampleDuration) {
                requestAnimationFrame(measure);
            } else {
                const rate = Math.round(frameCount / ((timestamp - startTime) / 1000));
                // Quantize to common refresh rates
                if (rate > 130) resolve(144);
                else if (rate > 90) resolve(120);
                else resolve(60);
            }
        };
        requestAnimationFrame(measure);
    });
};

const zeroMean = (arr: number[]): number[] => {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.map(v => v - mean);
};

const rms = (arr: number[]): number => {
    const sumOfSquares = arr.reduce((sum, val) => sum + val * val, 0);
    return Math.sqrt(sumOfSquares / arr.length);
};

const scaleToRms = (arr: number[], targetRms: number): number[] => {
    const currentRms = rms(arr);
    if (currentRms === 0) return arr;
    const factor = targetRms / currentRms;
    return arr.map(v => v * factor);
}

export const generateEnvelope = (config: StimulusConfig): Envelope => {
    const { durationMs, frequency, refreshRate, noiseLevel, randomizePhase } = config;

    const frameCount = Math.round((durationMs / 1000) * refreshRate);
    const durationSeconds = frameCount / refreshRate;

    let envelopeSignal = new Array(frameCount).fill(0);
    const phase = randomizePhase ? Math.random() * 2 * Math.PI : 0;

    for (let i = 0; i < frameCount; i++) {
        const t = i / refreshRate;
        envelopeSignal[i] = Math.sin(2 * Math.PI * frequency * t + phase);
    }
    
    // --- Normalization ---
    // 1. Make the signal have a mean of zero
    envelopeSignal = zeroMean(envelopeSignal);
    
    // 2. Scale the signal to have a target Root Mean Square (RMS) value (e.g., 1.0)
    // This ensures that every frequency delivers the same "modulation energy"
    const TARGET_RMS = 0.3; // An arbitrary but consistent energy level
    envelopeSignal = scaleToRms(envelopeSignal, TARGET_RMS);

    const envelopeRms = rms(envelopeSignal); // For logging
    
    // --- Mapping to Noise ---
    const maxNoise = noiseLevel;
    const minNoise = maxNoise * maxNoise;
    const noiseRange = maxNoise - minNoise;
    
    const noiseValues = envelopeSignal.map(val => {
        // The normalized signal oscillates around 0. We map it into the noise range.
        // Let's scale it so that the full range of the signal maps to the noise range.
        // A simple approach is to treat the modulation as centered around the average noise level.
        const avgNoise = (minNoise + maxNoise) / 2;
        // The `val` is from the normalized signal. We can treat it as a deviation from the average.
        // A scaling factor might be needed if `val` exceeds +/- noiseRange/2
        // A simpler, robust mapping: map [-1, 1] to [min, max]
        const clarityOscillation = (val / (TARGET_RMS * 3) + 1) / 2; // Heuristically map to ~[0,1]
        
        // This is a clearer mapping: Clarity (0 to 1) maps to Noise (Max to Min)
        // (Math.sin + 1)/2 gives a [0, 1] range. Our normalized signal is different.
        // Let's try a direct modulation approach
        
        let modulatedNoise = avgNoise + val * (noiseRange / (TARGET_RMS * 3));
        return Math.max(TEST_CONFIG.noiseMin, Math.min(TEST_CONFIG.noiseMax, modulatedNoise));
    });

    const envelopeMean = noiseValues.reduce((a, b) => a + b, 0) / noiseValues.length;
    const envelopeIntegral = noiseValues.reduce((a, b) => a + b, 0);

    return {
        values: noiseValues,
        mean: envelopeMean,
        rms: envelopeRms,
        integral: envelopeIntegral,
        phase,
    };
};
