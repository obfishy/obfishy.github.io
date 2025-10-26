import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VideoConfigPanelProps {
  width: number;
  height: number;
  pixelSize: number;
  fps: number;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onPixelSizeChange: (value: number) => void;
  onFpsChange: (value: number) => void;
}

export const VideoConfigPanel = ({
  width,
  height,
  pixelSize,
  fps,
  onWidthChange,
  onHeightChange,
  onPixelSizeChange,
  onFpsChange,
}: VideoConfigPanelProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="video-width">Frame Width</Label>
        <Input
          id="video-width"
          type="number"
          min="1"
          max="200"
          value={width}
          onChange={(e) => onWidthChange(parseInt(e.target.value) || 32)}
          className="bg-secondary border-border"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="video-height">Frame Height</Label>
        <Input
          id="video-height"
          type="number"
          min="1"
          max="200"
          value={height}
          onChange={(e) => onHeightChange(parseInt(e.target.value) || 32)}
          className="bg-secondary border-border"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pixel-size">Pixel Size</Label>
        <Input
          id="pixel-size"
          type="number"
          min="1"
          max="100"
          value={pixelSize}
          onChange={(e) => onPixelSizeChange(parseInt(e.target.value) || 10)}
          className="bg-secondary border-border"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="fps">FPS</Label>
        <Input
          id="fps"
          type="number"
          min="1"
          max="120"
          value={fps}
          onChange={(e) => onFpsChange(parseInt(e.target.value) || 60)}
          className="bg-secondary border-border"
        />
      </div>
    </div>
  );
};
