import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface VideoPreviewProps {
  videoUrl: string | null;
  frames: ImageData[];
  fps: number;
  isPlaying: boolean;
  currentFrame: number;
  playbackSpeed: number;
  onFrameChange?: (frame: number) => void;
}

export interface VideoPreviewRef {
  getCurrentFrame: () => number;
}

export const VideoPreview = forwardRef<VideoPreviewRef, VideoPreviewProps>(
  ({ videoUrl, frames, fps, isPlaying, currentFrame, playbackSpeed, onFrameChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>();
    const lastTimeRef = useRef<number>(performance.now());
    const currentFrameRef = useRef<number>(currentFrame);

    useImperativeHandle(ref, () => ({
      getCurrentFrame: () => currentFrameRef.current,
    }));

    // Update current frame when prop changes (from external control)
    useEffect(() => {
      currentFrameRef.current = currentFrame;
    }, [currentFrame]);

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

      const renderFrame = (frameIndex: number) => {
        const frame = frames[frameIndex];
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = frame.width;
        tempCanvas.height = frame.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          tempCtx.putImageData(frame, 0, 0);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
        }
      };

      const animate = () => {
        const currentTime = performance.now();
        const deltaTime = currentTime - lastTimeRef.current;
        const adjustedFps = fps * playbackSpeed;

        if (isPlaying && deltaTime >= 1000 / adjustedFps) {
          renderFrame(currentFrameRef.current);
          currentFrameRef.current = (currentFrameRef.current + 1) % frames.length;
          onFrameChange?.(currentFrameRef.current);
          lastTimeRef.current = currentTime;
        } else if (!isPlaying) {
          renderFrame(currentFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animate();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [frames, fps, isPlaying, playbackSpeed, onFrameChange]);

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
  }
);
