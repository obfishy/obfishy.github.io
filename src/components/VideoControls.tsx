import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface VideoControlsProps {
  isPlaying: boolean;
  currentFrame: number;
  totalFrames: number;
  speed: number;
  onPlayPause: () => void;
  onReset: () => void;
  onFrameChange: (frame: number) => void;
  onSpeedChange: (speed: number) => void;
}

export const VideoControls = ({
  isPlaying,
  currentFrame,
  totalFrames,
  speed,
  onPlayPause,
  onReset,
  onFrameChange,
  onSpeedChange,
}: VideoControlsProps) => {
  if (totalFrames === 0) return null;

  return (
    <div className="space-y-4 bg-secondary/30 p-4 rounded-lg border border-border">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onPlayPause}
          className="w-20"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 mr-1" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-1" />
              Play
            </>
          )}
        </Button>
        <Button size="sm" variant="outline" onClick={onReset}>
          <RotateCcw className="w-4 h-4" />
        </Button>
        <div className="flex-1 text-center text-sm text-muted-foreground">
          Frame {currentFrame + 1} / {totalFrames}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Scrub Frame</label>
        <Slider
          value={[currentFrame]}
          min={0}
          max={totalFrames - 1}
          step={1}
          onValueChange={([value]) => onFrameChange(value)}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Playback Speed: {speed.toFixed(1)}x
        </label>
        <Slider
          value={[speed]}
          min={0.25}
          max={2}
          step={0.25}
          onValueChange={([value]) => onSpeedChange(value)}
          className="w-full"
        />
      </div>
    </div>
  );
};
