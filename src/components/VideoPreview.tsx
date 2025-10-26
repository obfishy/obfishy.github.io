import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoPreviewProps {
  videoUrl: string | null;
  frames: ImageData[];
  width: number;
  height: number;
  fps: number;
}

export const VideoPreview = ({ videoUrl, frames, width, height, fps }: VideoPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!canvasRef.current || frames.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width * 10;
    canvas.height = height * 10;

    const frameData = frames[currentFrame];
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(frameData, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
    }
  }, [frames, currentFrame, width, height]);

  useEffect(() => {
    if (!isPlaying || frames.length === 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const frameDelay = 1000 / fps;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - lastTime;

      if (elapsed >= frameDelay) {
        setCurrentFrame((prev) => (prev + 1) % frames.length);
        lastTime = currentTime;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, frames.length, fps]);

  if (!videoUrl || frames.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-secondary/50 rounded-xl border border-border">
        <p className="text-muted-foreground">No video loaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center bg-secondary/50 rounded-xl border border-border p-4 overflow-auto">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-96"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
      <div className="flex items-center justify-center gap-4">
        <Button
          onClick={() => setIsPlaying(!isPlaying)}
          variant="secondary"
          size="sm"
        >
          {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <span className="text-sm text-muted-foreground">
          Frame {currentFrame + 1} / {frames.length}
        </span>
      </div>
    </div>
  );
};
