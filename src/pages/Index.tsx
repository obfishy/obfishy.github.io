import { useState, useCallback, useRef } from 'react';
import { ImageUploader } from '@/components/ImageUploader';
import { VideoUploader } from '@/components/VideoUploader';
import { ConfigPanel } from '@/components/ConfigPanel';
import { VideoConfigPanel } from '@/components/VideoConfigPanel';
import { ImagePreview } from '@/components/ImagePreview';
import { VideoPreview } from '@/components/VideoPreview';
import { VideoControls } from '@/components/VideoControls';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Zap, Image as ImageIcon, Video, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { extractVideoFrames, generateAnimatedLuaCode, estimateFileSize, type QualityPreset } from '@/utils/videoProcessor';

const Index = () => {
  const [imageData, setImageData] = useState<string | null>(null);
  const [width, setWidth] = useState(32);
  const [height, setHeight] = useState(32);
  const [frameSize, setFrameSize] = useState(20);
  const [guiName, setGuiName] = useState('PixelArtGUI');
  const [isProcessing, setIsProcessing] = useState(false);

  // Video states
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFrames, setVideoFrames] = useState<ImageData[]>([]);
  const [videoWidth, setVideoWidth] = useState(48);
  const [videoHeight, setVideoHeight] = useState(48);
  const [pixelSize, setPixelSize] = useState(8);
  const [fps, setFps] = useState(24);
  const [videoGuiName, setVideoGuiName] = useState('PixelVideo');
  const [quality, setQuality] = useState<QualityPreset>('high');
  const [loop, setLoop] = useState(true);
  const [maxFrames, setMaxFrames] = useState(45);
  const [startFrame, setStartFrame] = useState(0);
  const [endFrame, setEndFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const videoPreviewRef = useRef<any>(null);

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

  const handleVideoSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    setIsPlaying(false);
    try {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      
      toast.info(`Extracting frames with ${quality} quality...`);
      const frames = await extractVideoFrames(file, videoWidth, videoHeight, maxFrames, {
        quality,
        startFrame,
        endFrame: endFrame > 0 ? endFrame : undefined,
        deduplication: true,
      });
      setVideoFrames(frames);
      setCurrentFrame(0);
      
      const fileSizeKB = estimateFileSize(frames, videoWidth, videoHeight);
      
      setIsProcessing(false);
      toast.success(`Video loaded! ${frames.length} frames extracted (~${fileSizeKB}KB)`);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error processing video:', error);
      setIsProcessing(false);
      toast.error('Failed to process video');
    }
  }, [videoWidth, videoHeight, maxFrames, quality, startFrame, endFrame]);

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

      // Generate compact pixel data array
      const pixelData: string[] = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;
          const r = pixels[index];
          const g = pixels[index + 1];
          const b = pixels[index + 2];
          pixelData.push(`{${x},${y},${r},${g},${b}}`);
        }
      }

      // Generate optimized Lua code that builds gradually
      let luaCode = `local sg=Instance.new("ScreenGui")
sg.Name="${guiName}"
sg.Parent=game.Players.LocalPlayer:WaitForChild("PlayerGui")
local h=Instance.new("Frame")
h.Name="Holder"
h.Size=UDim2.new(0,${width * frameSize},0,${height * frameSize})
h.Position=UDim2.new(0.5,-${(width * frameSize) / 2},0.5,-${(height * frameSize) / 2})
h.BackgroundTransparency=1
h.Parent=sg
local d={${pixelData.join(',')}}
local s=${frameSize}
task.spawn(function()
for i,p in ipairs(d)do
local f=Instance.new("Frame")
f.Size=UDim2.new(0,s,0,s)
f.Position=UDim2.new(0,p[1]*s,0,p[2]*s)
f.BackgroundColor3=Color3.fromRGB(p[3],p[4],p[5])
f.BorderSizePixel=0
f.Parent=h
if i%50==0 then task.wait()end
end
end)
`;

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

  const generateVideoLuaCode = useCallback(() => {
    if (!videoFrames.length) {
      toast.error('Please upload a video first');
      return;
    }

    try {
      const luaCode = generateAnimatedLuaCode(
        videoFrames,
        videoWidth,
        videoHeight,
        pixelSize,
        fps,
        videoGuiName,
        loop
      );

      const blob = new Blob([luaCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${videoGuiName}.lua`;
      a.click();
      URL.revokeObjectURL(url);

      const fileSizeKB = estimateFileSize(videoFrames, videoWidth, videoHeight);
      toast.success(`Video Lua code generated! (~${fileSizeKB}KB)`);
    } catch (error) {
      console.error('Error generating video Lua code:', error);
      toast.error('Failed to generate video Lua code');
    }
  }, [videoFrames, videoWidth, videoHeight, pixelSize, fps, videoGuiName, loop]);

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

        <Tabs defaultValue="image" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
            <TabsTrigger value="image" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Image to GUI
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Video to GUI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image">
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
                  {isProcessing ? 'Generating...' : 'Generate Lua Code'}
                </Button>
              </Card>

              <Card className="p-6 space-y-4 bg-card border-border">
                <h2 className="text-2xl font-semibold">Preview</h2>
                <ImagePreview imageData={imageData} width={width} height={height} />
                {imageData && (
                  <div className="text-sm text-muted-foreground space-y-1 bg-secondary/50 p-4 rounded-lg">
                    <p>• Output: {width}x{height} pixels</p>
                    <p>• Frames: {width * height}</p>
                    <p>• Size: {width * frameSize}x{height * frameSize}</p>
                    <p className="text-accent">• Builds gradually to prevent lag</p>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="video">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 space-y-6 bg-card border-border">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Upload Video</h2>
                  <VideoUploader onVideoSelect={handleVideoSelect} isProcessing={isProcessing} />
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4">Configuration</h2>
                  <VideoConfigPanel
                    width={videoWidth}
                    height={videoHeight}
                    pixelSize={pixelSize}
                    fps={fps}
                    guiName={videoGuiName}
                    quality={quality}
                    loop={loop}
                    maxFrames={maxFrames}
                    startFrame={startFrame}
                    endFrame={endFrame}
                    onWidthChange={setVideoWidth}
                    onHeightChange={setVideoHeight}
                    onPixelSizeChange={setPixelSize}
                    onFpsChange={setFps}
                    onGuiNameChange={setVideoGuiName}
                    onQualityChange={setQuality}
                    onLoopChange={setLoop}
                    onMaxFramesChange={setMaxFrames}
                    onStartFrameChange={setStartFrame}
                    onEndFrameChange={setEndFrame}
                  />
                </div>

                <Button
                  onClick={generateVideoLuaCode}
                  disabled={!videoFrames.length || isProcessing}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Generate Video Lua Code
                </Button>
              </Card>

              <Card className="p-6 space-y-4 bg-card border-border">
                <h2 className="text-2xl font-semibold">Preview</h2>
                <VideoPreview 
                  ref={videoPreviewRef}
                  videoUrl={videoUrl} 
                  frames={videoFrames} 
                  fps={fps}
                  isPlaying={isPlaying}
                  currentFrame={currentFrame}
                  playbackSpeed={playbackSpeed}
                  onFrameChange={setCurrentFrame}
                />
                {videoFrames.length > 0 && (
                  <>
                    <VideoControls
                      isPlaying={isPlaying}
                      currentFrame={currentFrame}
                      totalFrames={videoFrames.length}
                      speed={playbackSpeed}
                      onPlayPause={() => setIsPlaying(!isPlaying)}
                      onReset={() => setCurrentFrame(0)}
                      onFrameChange={setCurrentFrame}
                      onSpeedChange={setPlaybackSpeed}
                    />
                    <div className="text-sm text-muted-foreground space-y-1 bg-secondary/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-accent" />
                        <span className="font-medium text-foreground">Output Info</span>
                      </div>
                      <p>• Resolution: {videoWidth}x{videoHeight} ({videoWidth * videoHeight} pixels)</p>
                      <p>• Frames: {videoFrames.length} @ {fps} FPS</p>
                      <p>• Quality: {quality.charAt(0).toUpperCase() + quality.slice(1)}</p>
                      <p>• File size: ~{estimateFileSize(videoFrames, videoWidth, videoHeight)}KB</p>
                      <p className="text-accent">• {loop ? 'Loops continuously' : 'Plays once'}</p>
                    </div>
                  </>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Card className="p-6 bg-card/50 border-border">
          <h3 className="text-lg font-semibold mb-3">✨ Features</h3>
          <ul className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>Gradual building prevents Roblox lag</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>Compact code reduces file size</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>Quality presets (Low to Ultra)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>Frame deduplication & sharpening</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>Video trimming & frame range</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>Playback controls with speed adjust</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>Real-time preview with scrubbing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>Loop control & file size estimates</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Index;
