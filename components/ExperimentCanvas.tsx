import React, { useRef, useEffect } from 'react';
import { Envelope, TrialState } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

interface ExperimentCanvasProps {
  word: string;
  envelope: Envelope | null;
  trialState: TrialState;
  onComplete: () => void;
  isDebug: boolean;
}

const drawDebugOverlay = (ctx: CanvasRenderingContext2D, envelope: Envelope) => {
    const w = 150;
    const h = 50;
    const x = CANVAS_WIDTH - w - 10;
    const y = 10;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#0ff';
    ctx.strokeRect(x, y, w, h);

    ctx.beginPath();
    ctx.moveTo(x, y + h / 2);

    for(let i = 0; i < envelope.values.length; i++) {
        const val = envelope.values[i];
        // The envelope values are noise levels (e.g., 0.9 to 1.0).
        // Let's re-center and scale them to see the oscillation.
        const mid = (1.0 + 0.9) / 2;
        const amplitude = 0.1 / 2;
        const normalizedVal = (val - mid) / amplitude; // now ~[-1, 1]

        const plotX = x + (i / envelope.values.length) * w;
        const plotY = y + h/2 - (normalizedVal * (h/2 - 5));
        ctx.lineTo(plotX, plotY);
    }
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText(`Frames: ${envelope.values.length}`, x + 5, y + 12);
    ctx.fillText(`RMS: ${envelope.rms.toFixed(3)}`, x + 5, y + 24);
    ctx.fillText(`Mean: ${envelope.mean.toFixed(3)}`, x+5, y+36);
}

const ExperimentCanvas: React.FC<ExperimentCanvasProps> = ({ word, envelope, trialState, onComplete, isDebug }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const frameCounter = useRef(0);

  useEffect(() => {
    // Always ensure canvas is cleared when not running
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

    if (!envelope || envelope.values.length === 0) {
        onComplete();
        return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
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
    frameCounter.current = 0;
    
    const render = () => {
      if (frameCounter.current >= envelope.values.length) {
        onComplete();
        return;
      }
      
      const noiseDensity = envelope.values[frameCounter.current];

      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < noiseDensity) {
          const rand = Math.floor(Math.random() * 255);
          data[i] = rand;
          data[i + 1] = rand;
          data[i + 2] = rand;
          data[i + 3] = 255;
        } else {
          data[i] = wordData[i];
          data[i + 1] = wordData[i + 1];
          data[i + 2] = wordData[i + 2];
          data[i + 3] = wordData[i + 3];
        }
      }

      ctx.putImageData(finalFrame, 0, 0);

      if (isDebug) {
          drawDebugOverlay(ctx, envelope);
      }

      frameCounter.current++;
      animationFrameId.current = requestAnimationFrame(render);
    };

    animationFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [trialState, word, envelope, onComplete, isDebug]);

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
