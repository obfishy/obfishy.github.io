import { useCallback } from 'react';
import { Upload, Video } from 'lucide-react';

interface VideoUploaderProps {
  onVideoSelect: (file: File) => void;
  isProcessing: boolean;
}

export const VideoUploader = ({ onVideoSelect, isProcessing }: VideoUploaderProps) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (isProcessing) return;

      const file = e.dataTransfer.files[0];
      if (file && (file.type.startsWith('video/') || file.type === 'image/gif')) {
        onVideoSelect(file);
      }
    },
    [onVideoSelect, isProcessing]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isProcessing) return;
      const file = e.target.files?.[0];
      if (file) {
        onVideoSelect(file);
      }
    },
    [onVideoSelect, isProcessing]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-secondary/20"
    >
      <input
        type="file"
        accept="video/*,image/gif"
        onChange={handleFileInput}
        className="hidden"
        id="video-upload"
        disabled={isProcessing}
      />
      <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center gap-4">
        <div className="p-4 bg-primary/10 rounded-full">
          <Video className="w-8 h-8 text-primary" />
        </div>
        <div>
          <p className="text-lg font-medium mb-1">
            {isProcessing ? 'Processing video...' : 'Drop video here or click to upload'}
          </p>
          <p className="text-sm text-muted-foreground">Supports MP4, WebM, MOV, GIF (up to 300 frames)</p>
        </div>
      </label>
    </div>
  );
};
