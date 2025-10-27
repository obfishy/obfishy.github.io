import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VideoConfigPanelProps {
  width: number;
  height: number;
  pixelSize: number;
  fps: number;
  guiName: string;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onPixelSizeChange: (value: number) => void;
  onFpsChange: (value: number) => void;
  onGuiNameChange: (value: string) => void;
}

export const VideoConfigPanel = ({
  width,
  height,
  pixelSize,
  fps,
  guiName,
  onWidthChange,
  onHeightChange,
  onPixelSizeChange,
  onFpsChange,
  onGuiNameChange,
}: VideoConfigPanelProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="video-width">Width (pixels)</Label>
          <Input
            id="video-width"
            type="number"
            min="16"
            max="96"
            value={width}
            onChange={(e) => onWidthChange(parseInt(e.target.value) || 48)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="video-height">Height (pixels)</Label>
          <Input
            id="video-height"
            type="number"
            min="16"
            max="96"
            value={height}
            onChange={(e) => onHeightChange(parseInt(e.target.value) || 48)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pixel-size">Pixel Size</Label>
          <Input
            id="pixel-size"
            type="number"
            min="5"
            max="50"
            value={pixelSize}
            onChange={(e) => onPixelSizeChange(parseInt(e.target.value) || 10)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fps">FPS</Label>
          <Input
            id="fps"
            type="number"
            min="10"
            max="60"
            value={fps}
            onChange={(e) => onFpsChange(parseInt(e.target.value) || 30)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="video-gui-name">GUI Name</Label>
        <Input
          id="video-gui-name"
          type="text"
          value={guiName}
          onChange={(e) => onGuiNameChange(e.target.value)}
        />
      </div>
      
      <div className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded-lg">
        <p className="font-semibold mb-1">⚡ Optimized Settings:</p>
        <p>• 48x48 default for better quality</p>
        <p>• 24 FPS smooth cinematic playback</p>
        <p>• 45 frames max with batch rendering</p>
        <p>• Up to 96x96 supported!</p>
      </div>
    </div>
  );
};
