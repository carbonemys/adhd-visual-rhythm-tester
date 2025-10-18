import React, { useRef, useEffect } from 'react';
import { ExperimentSettings, TrialState } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

interface ExperimentCanvasProps {
  word: string;
  settings: ExperimentSettings;
  trialState: TrialState;
  onComplete: () => void;
}

const ExperimentCanvas: React.FC<ExperimentCanvasProps> = ({ word, settings, trialState, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (trialState !== TrialState.Running) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use an off-screen canvas to render the "clean" word image once per trial.
    // This allows us to access its pixel data for compositing.
    const wordCanvas = document.createElement('canvas');
    wordCanvas.width = CANVAS_WIDTH;
    wordCanvas.height = CANVAS_HEIGHT;
    const wordCtx = wordCanvas.getContext('2d');
    if (!wordCtx) return;

    wordCtx.fillStyle = 'black';
    wordCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    wordCtx.fillStyle = 'white';
    wordCtx.font = 'bold 72px monospace';
    wordCtx.textAlign = 'center';
    wordCtx.textBaseline = 'middle';
    wordCtx.fillText(word, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    const wordImageData = wordCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const wordData = wordImageData.data;

    const finalFrame = ctx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);
    const data = finalFrame.data;
    let startTime: number | null = null;
    
    const render = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsedTime = timestamp - startTime;

      if (elapsedTime > settings.duration) {
        onComplete();
        return;
      }
      
      const timeInSeconds = elapsedTime / 1000;
      const radians = timeInSeconds * settings.frequency * 2 * Math.PI;

      // New non-linear noise logic:
      const maxNoise = settings.noiseLevel;
      // The minimum noise is the square of the max noise.
      // This makes the 'clear' phase of the rhythm much noisier at high settings.
      // At noiseLevel=1.0, minNoise=1.0, so noise is 100% for the whole duration.
      const minNoise = maxNoise * maxNoise;
      const noiseRange = maxNoise - minNoise;

      // clarityOscillation ranges from 0 (peak noise) to 1 (peak clarity)
      const clarityOscillation = (Math.sin(radians) + 1) / 2;

      // We map this so that at peak clarity we have minNoise, and at peak noise we have maxNoise.
      const noiseDensity = maxNoise - (clarityOscillation * noiseRange);

      // Manually composite the word and the noise for each pixel
      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < noiseDensity) {
          const rand = Math.floor(Math.random() * 255);
          data[i] = rand;     // R
          data[i + 1] = rand; // G
          data[i + 2] = rand; // B
          data[i + 3] = 255;  // A (Opaque)
        } else {
          // Copy the pixel from the pre-rendered word canvas
          data[i] = wordData[i];
          data[i + 1] = wordData[i + 1];
          data[i + 2] = wordData[i + 2];
          data[i + 3] = wordData[i + 3];
        }
      }

      ctx.putImageData(finalFrame, 0, 0);

      animationFrameId.current = requestAnimationFrame(render);
    };

    animationFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [trialState, word, settings, onComplete]);

  return (
    <div className="bg-black border-2 border-gray-600 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="block"
      />
    </div>
  );
};

export default ExperimentCanvas;