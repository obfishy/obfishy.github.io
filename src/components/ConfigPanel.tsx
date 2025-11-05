import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Monitor } from 'lucide-react';

interface ConfigPanelProps {
  width: number;
  height: number;
  frameSize: number;
  guiName: string;
  useViewportSize: boolean;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onFrameSizeChange: (value: number) => void;
  onGuiNameChange: (value: string) => void;
  onUseViewportSizeChange: (value: boolean) => void;
}

export const ConfigPanel = ({
  width,
  height,
  frameSize,
  guiName,
  useViewportSize,
  onWidthChange,
  onHeightChange,
  onFrameSizeChange,
  onGuiNameChange,
  onUseViewportSizeChange,
}: ConfigPanelProps) => {
  return (
    <div className="space-y-4">
      <Button
        onClick={() => onUseViewportSizeChange(!useViewportSize)}
        variant={useViewportSize ? "default" : "outline"}
        className="w-full"
      >
        <Monitor className="mr-2 h-4 w-4" />
        {useViewportSize ? "Using Viewport Size" : "Scale to Viewport Size"}
      </Button>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
        <Label htmlFor="width">Width (pixels)</Label>
        <Input
          id="width"
          type="number"
          min="1"
          max="854"
          value={width}
          onChange={(e) => onWidthChange(parseInt(e.target.value) || 32)}
          className="bg-secondary border-border"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="height">Height (pixels)</Label>
        <Input
          id="height"
          type="number"
          min="1"
          max="480"
          value={height}
          onChange={(e) => onHeightChange(parseInt(e.target.value) || 32)}
          className="bg-secondary border-border"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="frameSize">Frame Size</Label>
        <Input
          id="frameSize"
          type="number"
          min="1"
          max="100"
          value={frameSize}
          onChange={(e) => onFrameSizeChange(parseInt(e.target.value) || 20)}
          className="bg-secondary border-border"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="guiName">ScreenGui Name</Label>
        <Input
          id="guiName"
          type="text"
          value={guiName}
          onChange={(e) => onGuiNameChange(e.target.value)}
          className="bg-secondary border-border"
        />
      </div>
      </div>
    </div>
  );
};
