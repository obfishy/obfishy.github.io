import { useCallback } from 'react';
import { Video } from 'lucide-react';

interface VideoUploaderProps {
  onVideoSelect: (file: File) => void;
  isProcessing: boolean;
}

export const VideoUploader = ({ onVideoSelect, isProcessing }: VideoUploaderProps) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('video/')) {
        onVideoSelect(file);
      }
    },
    [onVideoSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onVideoSelect(file);
      }
    },
    [onVideoSelect]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="relative border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary transition-all cursor-pointer group bg-card/50 backdrop-blur-sm"
    >
      <input
        type="file"
        accept="video/mp4,video/webm,video/*"
        onChange={handleFileInput}
        disabled={isProcessing}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
      <h3 className="text-xl font-semibold mb-2 text-foreground">
        {isProcessing ? 'Processing...' : 'Drop your video here'}
      </h3>
      <p className="text-muted-foreground">or click to browse</p>
      <p className="text-sm text-muted-foreground mt-2">Supports MP4, WebM</p>
    </div>
  );
};
