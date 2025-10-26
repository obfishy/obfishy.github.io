import { useState, useCallback } from 'react';
import { ImageUploader } from '@/components/ImageUploader';
import { ConfigPanel } from '@/components/ConfigPanel';
import { ImagePreview } from '@/components/ImagePreview';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Zap } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [imageData, setImageData] = useState<string | null>(null);
  const [width, setWidth] = useState(32);
  const [height, setHeight] = useState(32);
  const [frameSize, setFrameSize] = useState(20);
  const [guiName, setGuiName] = useState('PixelArtGUI');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageSelect = useCallback((file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageData(e.target?.result as string);
      setIsProcessing(false);
      toast.success('Image loaded successfully!');
    };
    reader.onerror = () => {
      setIsProcessing(false);
      toast.error('Failed to load image');
    };
    reader.readAsDataURL(file);
  }, []);

  const generateLuaCode = useCallback(async () => {
    if (!imageData) {
      toast.error('Please upload an image first');
      return;
    }

    setIsProcessing(true);

    try {
      const img = new Image();
      img.src = imageData;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, width, height);

      const imageDataObj = ctx.getImageData(0, 0, width, height);
      const pixels = imageDataObj.data;

      let luaCode = `local ScreenGui = Instance.new("ScreenGui")\n`;
      luaCode += `ScreenGui.Name = "${guiName}"\n`;
      luaCode += `ScreenGui.Parent = game.Players.LocalPlayer:WaitForChild("PlayerGui")\n\n`;

      luaCode += `local Holder = Instance.new("Frame")\n`;
      luaCode += `Holder.Name = "PixelArtHolder"\n`;
      luaCode += `Holder.Size = UDim2.new(0, ${width * frameSize}, 0, ${height * frameSize})\n`;
      luaCode += `Holder.Position = UDim2.new(0, 0, 0, 0)\n`;
      luaCode += `Holder.BackgroundTransparency = 1\n`;
      luaCode += `Holder.Parent = ScreenGui\n\n`;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;
          const r = pixels[index];
          const g = pixels[index + 1];
          const b = pixels[index + 2];

          const frameName = `Pixel_${x}_${y}`;
          const posX = x * frameSize;
          const posY = y * frameSize;

          luaCode += `_G["${frameName}"] = Instance.new("Frame")\n`;
          luaCode += `_G["${frameName}"].Name = "${frameName}"\n`;
          luaCode += `_G["${frameName}"].Size = UDim2.new(0, ${frameSize}, 0, ${frameSize})\n`;
          luaCode += `_G["${frameName}"].Position = UDim2.new(0, ${posX}, 0, ${posY})\n`;
          luaCode += `_G["${frameName}"].BackgroundColor3 = Color3.fromRGB(${r},${g},${b})\n`;
          luaCode += `_G["${frameName}"].BorderSizePixel = 0\n`;
          luaCode += `_G["${frameName}"].Parent = Holder\n\n`;
        }
      }

      const blob = new Blob([luaCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${guiName}.lua`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Lua code generated and downloaded!');
    } catch (error) {
      console.error('Error generating Lua code:', error);
      toast.error('Failed to generate Lua code');
    } finally {
      setIsProcessing(false);
    }
  }, [imageData, width, height, frameSize, guiName]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Powered by Web Technology</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Image to Roblox GUI Converter
          </h1>
          <p className="text-xl text-muted-foreground">
            Transform any image into pixel-perfect Roblox GUI code instantly
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-6 bg-card border-border">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Upload Image</h2>
              <ImageUploader onImageSelect={handleImageSelect} isProcessing={isProcessing} />
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Configuration</h2>
              <ConfigPanel
                width={width}
                height={height}
                frameSize={frameSize}
                guiName={guiName}
                onWidthChange={setWidth}
                onHeightChange={setHeight}
                onFrameSizeChange={setFrameSize}
                onGuiNameChange={setGuiName}
              />
            </div>

            <Button
              onClick={generateLuaCode}
              disabled={!imageData || isProcessing}
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              size="lg"
            >
              <Download className="w-5 h-5 mr-2" />
              {isProcessing ? 'Generating...' : 'Generate & Download Lua Code'}
            </Button>
          </Card>

          <Card className="p-6 space-y-4 bg-card border-border">
            <h2 className="text-2xl font-semibold">Preview</h2>
            <ImagePreview imageData={imageData} width={width} height={height} />
            {imageData && (
              <div className="text-sm text-muted-foreground space-y-1 bg-secondary/50 p-4 rounded-lg">
                <p>• Output size: {width}x{height} pixels</p>
                <p>• Total frames: {width * height}</p>
                <p>• GUI dimensions: {width * frameSize}x{height * frameSize}</p>
              </div>
            )}
          </Card>
        </div>

        <Card className="p-6 bg-card/50 border-border">
          <h3 className="text-lg font-semibold mb-3">✨ Features</h3>
          <ul className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>Instant processing with no crashes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>Real-time pixelated preview</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>Drag & drop support</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>Customizable dimensions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>Efficient browser-based processing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>No installation required</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Index;
