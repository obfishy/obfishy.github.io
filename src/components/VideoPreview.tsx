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

    // Dynamic scaling based on frame size
    const baseSize = frames[0].width;
    const scale = baseSize <= 32 ? 10 : baseSize <= 64 ? 6 : 4;
    
    canvas.width = frames[0].width * scale;
    canvas.height = frames[0].height * scale;

    let currentFrame = 0;
    let animationFrame: number;
    let lastTime = performance.now();

    const animate = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;

      if (deltaTime >= 1000 / fps) {
        const frame = frames[currentFrame];
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = frame.width;
        tempCanvas.height = frame.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
          // Clear canvas first to prevent double rendering
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          tempCtx.putImageData(frame, 0, 0);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
        }

        currentFrame = (currentFrame + 1) % frames.length;
        lastTime = currentTime;
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
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
    <div className="flex items-center justify-center bg-secondary/50 rounded-xl border border-border p-4">
      <div className="flex items-center justify-center w-full h-96">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  );
};
