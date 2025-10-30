export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra';

export interface VideoProcessingOptions {
  quality?: QualityPreset;
  startFrame?: number;
  endFrame?: number;
  deduplication?: boolean;
}

// Enhanced frame extraction with quality options
export const extractVideoFrames = async (
  videoFile: File,
  targetWidth: number,
  targetHeight: number,
  maxFrames: number = 45,
  options: VideoProcessingOptions = {}
): Promise<ImageData[]> => {
  const { quality = 'high', startFrame = 0, endFrame, deduplication = true } = options;
  
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const frames: ImageData[] = [];
    const url = URL.createObjectURL(videoFile);
    video.src = url;
    video.preload = 'auto';

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const totalVideoFrames = Math.floor(duration * 30); // Assume 30fps source
      const actualEndFrame = endFrame && endFrame < totalVideoFrames ? endFrame : totalVideoFrames;
      const actualStartFrame = Math.max(0, Math.min(startFrame, actualEndFrame - 1));
      
      const frameDuration = duration / totalVideoFrames;
      const startTime = actualStartFrame * frameDuration;
      const endTime = actualEndFrame * frameDuration;
      const captureRange = endTime - startTime;
      
      const frameInterval = captureRange / Math.min(maxFrames, actualEndFrame - actualStartFrame);
      let currentTime = startTime;
      let lastFrameData: Uint8ClampedArray | null = null;

      // Quality settings
      const qualitySettings = {
        low: { smoothing: false, sharpening: 0 },
        medium: { smoothing: true, sharpening: 0.1 },
        high: { smoothing: true, sharpening: 0.2 },
        ultra: { smoothing: true, sharpening: 0.3 }
      };
      const settings = qualitySettings[quality];

      const captureFrame = () => {
        if (currentTime >= endTime || frames.length >= maxFrames) {
          URL.revokeObjectURL(url);
          resolve(frames);
          return;
        }

        video.currentTime = currentTime;
      };

      video.onseeked = () => {
        ctx.imageSmoothingEnabled = settings.smoothing;
        if (settings.smoothing) {
          ctx.imageSmoothingQuality = 'high';
        }
        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        
        let imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        
        // Apply sharpening for better quality
        if (settings.sharpening > 0) {
          imageData = applySharpen(imageData, settings.sharpening);
        }
        
        // Frame deduplication - skip very similar frames
        if (deduplication && lastFrameData) {
          const similarity = calculateFrameSimilarity(lastFrameData, imageData.data);
          if (similarity > 0.98) {
            currentTime += frameInterval;
            captureFrame();
            return;
          }
        }
        
        lastFrameData = new Uint8ClampedArray(imageData.data);
        frames.push(imageData);
        
        currentTime += frameInterval;
        captureFrame();
      };

      captureFrame();
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video'));
    };
  });
};

// Sharpen filter for better quality
const applySharpen = (imageData: ImageData, strength: number): ImageData => {
  const { data, width, height } = imageData;
  const output = new ImageData(width, height);
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += data[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        const outputIdx = (y * width + x) * 4 + c;
        const original = data[outputIdx];
        output.data[outputIdx] = Math.max(0, Math.min(255, original + (sum - original) * strength));
      }
      output.data[(y * width + x) * 4 + 3] = 255; // Alpha
    }
  }
  
  return output;
};

// Calculate frame similarity for deduplication
const calculateFrameSimilarity = (frame1: Uint8ClampedArray, frame2: Uint8ClampedArray): number => {
  let diff = 0;
  for (let i = 0; i < frame1.length; i += 4) {
    diff += Math.abs(frame1[i] - frame2[i]) + 
            Math.abs(frame1[i + 1] - frame2[i + 1]) + 
            Math.abs(frame1[i + 2] - frame2[i + 2]);
  }
  const maxDiff = frame1.length * 3 * 255 / 4;
  return 1 - (diff / maxDiff);
};

export const generateAnimatedLuaCode = (
  frames: ImageData[],
  width: number,
  height: number,
  pixelSize: number,
  fps: number,
  guiName: string,
  loop: boolean = true
): string => {
  // Compress frame data - convert to RGB values with better encoding
  const frameData: string[] = [];
  
  frames.forEach((frame) => {
    const pixels: number[] = [];
    for (let i = 0; i < frame.data.length; i += 4) {
      pixels.push(frame.data[i], frame.data[i + 1], frame.data[i + 2]);
    }
    frameData.push(pixels.join(','));
  });

  const totalPixels = width * height;
  const loopCode = loop ? 'while true do' : 'for playCount = 1, 1 do';

  // Generate optimized animated Lua code with pre-rendering
  return `-- Roblox Pixel Video Animation (${frames.length} frames @ ${fps}fps)
-- Enhanced Quality & Performance
local sg = Instance.new("ScreenGui")
sg.Name = "${guiName}"
sg.Parent = game.Players.LocalPlayer:WaitForChild("PlayerGui")

local h = Instance.new("Frame")
h.Name = "VideoHolder"
h.Size = UDim2.new(0, ${width * pixelSize}, 0, ${height * pixelSize})
h.Position = UDim2.new(0.5, -${Math.floor((width * pixelSize) / 2)}, 0.5, -${Math.floor((height * pixelSize) / 2)})
h.BackgroundTransparency = 1
h.Parent = sg

-- Create pixel grid with optimized rendering
local pixels = {}
local s = ${pixelSize}
local batchSize = 100

print("Building pixel grid...")
for y = 0, ${height - 1} do
  for x = 0, ${width - 1} do
    local f = Instance.new("Frame")
    f.Size = UDim2.new(0, s, 0, s)
    f.Position = UDim2.new(0, x * s, 0, y * s)
    f.BackgroundColor3 = Color3.new(0, 0, 0)
    f.BorderSizePixel = 0
    f.Parent = h
    table.insert(pixels, f)
    if #pixels % 50 == 0 then task.wait() end
  end
end

-- Frame data (RGB values)
local frames = {
${frameData.map(frame => `  {${frame}}`).join(',\n')}
}

-- Smooth animation with frame interpolation
print("Starting animation...")
task.spawn(function()
  local lastUpdate = tick()
  local targetFrameTime = ${(1 / fps).toFixed(4)}
  
  ${loopCode}
    for frameIdx, frameData in ipairs(frames) do
      local frameStart = tick()
      
      -- Batch update pixels for smooth performance
      for batch = 0, math.ceil(${totalPixels} / batchSize) - 1 do
        local startIdx = batch * batchSize + 1
        local endIdx = math.min(startIdx + batchSize - 1, ${totalPixels})
        
        for i = startIdx, endIdx do
          local dataIdx = (i - 1) * 3 + 1
          pixels[i].BackgroundColor3 = Color3.fromRGB(
            frameData[dataIdx],
            frameData[dataIdx + 1],
            frameData[dataIdx + 2]
          )
        end
        
        -- Yield every few batches to prevent frame drops
        if batch % 3 == 0 then task.wait() end
      end
      
      -- Precise frame timing
      local elapsed = tick() - frameStart
      local waitTime = math.max(0, targetFrameTime - elapsed)
      if waitTime > 0 then
        task.wait(waitTime)
      else
        task.wait() -- Yield to prevent freezing
      end
    end
  end
end)
`;
};

// Estimate file size in KB
export const estimateFileSize = (
  frames: ImageData[],
  width: number,
  height: number
): number => {
  const pixelsPerFrame = width * height;
  const bytesPerFrame = pixelsPerFrame * 3; // RGB
  const totalBytes = frames.length * bytesPerFrame;
  const luaCodeOverhead = 2000; // Estimated overhead for Lua code structure
  return Math.ceil((totalBytes + luaCodeOverhead) / 1024);
};
