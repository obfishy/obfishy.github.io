import { useEffect, useRef } from 'react';

interface ImagePreviewProps {
  imageData: string | null;
  width: number;
  height: number;
}

export const ImagePreview = ({ imageData, width, height }: ImagePreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!imageData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = width;
      canvas.height = height;

      // Draw image resized
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, width, height);

      // Scale up for display
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
  }, [imageData, width, height]);

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
