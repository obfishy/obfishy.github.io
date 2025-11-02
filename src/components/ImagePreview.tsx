import { useEffect, useRef } from 'react';

interface ImagePreviewProps {
  imageData: string | null;
  width: number;
  height: number;
  frames?: ImageData[];
  fps?: number;
  isPlaying?: boolean;
}

export const ImagePreview = ({ imageData, width, height, frames, fps = 10, isPlaying = true }: ImagePreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(performance.now());
  const currentFrameRef = useRef<number>(0);

  // Animated GIF rendering
  useEffect(() => {
    if (!frames || frames.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = 10;
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
      const frameInterval = 1000 / fps;

      renderFrame(currentFrameRef.current);

      if (isPlaying && frames.length > 1 && deltaTime >= frameInterval) {
        currentFrameRef.current = (currentFrameRef.current + 1) % frames.length;
        lastTimeRef.current = currentTime - (deltaTime % frameInterval);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [frames, fps, isPlaying]);

  // Static image rendering
  useEffect(() => {
    if (frames || !imageData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = width;
      canvas.height = height;

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, width, height);

      const displayCanvas = document.createElement('canvas');
      displayCanvas.width = width * 10;
      displayCanvas.height = height * 10;
      const displayCtx = displayCanvas.getContext('2d');
      if (displayCtx) {
        displayCtx.imageSmoothingEnabled = false;
        displayCtx.drawImage(canvas, 0, 0, displayCanvas.width, displayCanvas.height);
        canvas.width = displayCanvas.width;
        canvas.height = displayCanvas.height;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(displayCanvas, 0, 0);
      }
    };
    img.src = imageData;
  }, [imageData, width, height, frames]);

  if (!imageData) {
    return (
      <div className="flex items-center justify-center h-64 bg-secondary/50 rounded-xl border border-border">
        <p className="text-muted-foreground">No image loaded</p>
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
