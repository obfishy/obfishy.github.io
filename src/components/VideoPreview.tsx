import { useEffect, useRef } from 'react';

interface VideoPreviewProps {
  videoUrl: string | null;
  frames: ImageData[];
  fps: number;
}

export const VideoPreview = ({ videoUrl, frames, fps }: VideoPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!frames.length || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = frames[0].width * 10;
    canvas.height = frames[0].height * 10;

    let currentFrame = 0;
    const interval = setInterval(() => {
      const frame = frames[currentFrame];
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = frame.width;
      tempCanvas.height = frame.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        tempCtx.putImageData(frame, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
      }

      currentFrame = (currentFrame + 1) % frames.length;
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [frames, fps]);

  if (!videoUrl) {
    return (
      <div className="flex items-center justify-center h-64 bg-secondary/50 rounded-xl border border-border">
        <p className="text-muted-foreground">No video loaded</p>
      </div>
    );
  }

  if (!frames.length) {
    return (
      <div className="flex items-center justify-center h-64 bg-secondary/50 rounded-xl border border-border">
        <p className="text-muted-foreground">Processing video...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center bg-secondary/50 rounded-xl border border-border p-4 overflow-auto">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-96"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};
