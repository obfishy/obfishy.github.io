import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import type { QualityPreset } from '@/utils/videoProcessor';

interface VideoConfigPanelProps {
  width: number;
  height: number;
  pixelSize: number;
  fps: number;
  guiName: string;
  quality: QualityPreset;
  loop: boolean;
  maxFrames: number;
  startFrame: number;
  endFrame: number;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onPixelSizeChange: (value: number) => void;
  onFpsChange: (value: number) => void;
  onGuiNameChange: (value: string) => void;
  onQualityChange: (value: QualityPreset) => void;
  onLoopChange: (value: boolean) => void;
  onMaxFramesChange: (value: number) => void;
  onStartFrameChange: (value: number) => void;
  onEndFrameChange: (value: number) => void;
}

export const VideoConfigPanel = ({
  width,
  height,
  pixelSize,
  fps,
  guiName,
  quality,
  loop,
  maxFrames,
  startFrame,
  endFrame,
  onWidthChange,
  onHeightChange,
  onPixelSizeChange,
  onFpsChange,
  onGuiNameChange,
  onQualityChange,
  onLoopChange,
  onMaxFramesChange,
  onStartFrameChange,
  onEndFrameChange,
}: VideoConfigPanelProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="quality-preset">Quality Preset</Label>
        <Select value={quality} onValueChange={(value) => onQualityChange(value as QualityPreset)}>
          <SelectTrigger id="quality-preset">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low (Fast)</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High (Recommended)</SelectItem>
            <SelectItem value="ultra">Ultra (Slow)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="video-width">Width (pixels)</Label>
          <Input
            id="video-width"
            type="number"
            min="16"
            max="854"
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
            max="480"
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

      <div>
        <Label htmlFor="max-frames">Max Frames: {maxFrames}</Label>
        <Slider
          id="max-frames"
          value={[maxFrames]}
          min={10}
          max={300}
          step={10}
          onValueChange={([value]) => onMaxFramesChange(value)}
          className="mt-2"
        />
      </div>

      <div className="space-y-2">
        <Label>Frame Range</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            min="0"
            placeholder="Start frame"
            value={startFrame}
            onChange={(e) => onStartFrameChange(Number(e.target.value) || 0)}
          />
          <Input
            type="number"
            min="0"
            placeholder="End frame"
            value={endFrame}
            onChange={(e) => onEndFrameChange(Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="loop-toggle">Loop Animation</Label>
        <Switch
          id="loop-toggle"
          checked={loop}
          onCheckedChange={onLoopChange}
        />
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
        <p className="font-semibold mb-1">💡 Tips:</p>
        <p>• High quality: Best for detailed videos</p>
        <p>• Up to 854x480 (480p) supported</p>
        <p>• More frames: Smoother animation</p>
        <p>• Frame range: Trim unwanted sections</p>
      </div>
    </div>
  );
};
