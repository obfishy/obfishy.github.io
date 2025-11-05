export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra';

export interface VideoProcessingOptions {
  quality?: QualityPreset;
  startFrame?: number;
  endFrame?: number;
  deduplication?: boolean;
  interpolation?: number; // Multiplier for frame interpolation (1 = none, 2 = double frames, etc.)
}

// Enhanced frame extraction with quality options
export const extractVideoFrames = async (
  videoFile: File,
  targetWidth: number,
  targetHeight: number,
  maxFrames: number = 45,
  options: VideoProcessingOptions = {}
): Promise<ImageData[]> => {
  const { quality = 'high', startFrame = 0, endFrame, deduplication = true, interpolation = 1 } = options;
  
  const frames = await new Promise<ImageData[]>((resolve, reject) => {
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
  
  // Apply frame interpolation if requested
  if (interpolation > 1) {
    return interpolateFrames(frames, interpolation);
  }
  
  return frames;
};

// Interpolate between frames for smoother animation
const interpolateFrames = (frames: ImageData[], multiplier: number): ImageData[] => {
  if (frames.length < 2 || multiplier <= 1) {
    return frames;
  }

  const interpolated: ImageData[] = [];
  
  for (let i = 0; i < frames.length - 1; i++) {
    const frame1 = frames[i];
    const frame2 = frames[i + 1];
    
    // Add the original frame
    interpolated.push(frame1);
    
    // Generate interpolated frames between frame1 and frame2
    for (let step = 1; step < multiplier; step++) {
      const t = step / multiplier; // Interpolation factor (0 to 1)
      const newFrame = new ImageData(frame1.width, frame1.height);
      
      // Interpolate each pixel
      for (let j = 0; j < frame1.data.length; j += 4) {
        newFrame.data[j] = Math.round(frame1.data[j] * (1 - t) + frame2.data[j] * t); // R
        newFrame.data[j + 1] = Math.round(frame1.data[j + 1] * (1 - t) + frame2.data[j + 1] * t); // G
        newFrame.data[j + 2] = Math.round(frame1.data[j + 2] * (1 - t) + frame2.data[j + 2] * t); // B
        newFrame.data[j + 3] = 255; // A
      }
      
      interpolated.push(newFrame);
    }
  }
  
  // Add the last frame
  interpolated.push(frames[frames.length - 1]);
  
  return interpolated;
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
  loop: boolean = true,
  useViewportSize: boolean = false
): string => {
  // Generate optimized Lua code with instant pixel updates
  const frameDataStrings = frames.map(frame => {
    const pixels: string[] = [];
    for (let i = 0; i < frame.data.length; i += 4) {
      pixels.push(`{${frame.data[i]},${frame.data[i + 1]},${frame.data[i + 2]}}`);
    }
    return `  {${pixels.join(',')}}`;
  });

  let luaCode = '';
  
  if (useViewportSize) {
    // Generate code that scales to viewport
    luaCode = `-- Pixel Animation by Image to GUI Converter (Viewport Scaled)
local sg = Instance.new("ScreenGui")
sg.Name = "${guiName}"
sg.Parent = game.Players.LocalPlayer:WaitForChild("PlayerGui")
local cam = workspace.CurrentCamera
local vp = cam.ViewportSize
local w, h = ${width}, ${height}
local s = math.min(vp.X / w, vp.Y / h)
local totalW, totalH = w * s, h * s
local holder = Instance.new("Frame")
holder.Name = "Holder"
holder.Size = UDim2.new(0, totalW, 0, totalH)
holder.Position = UDim2.new(0.5, -totalW / 2, 0.5, -totalH / 2)
holder.BackgroundTransparency = 1
holder.Parent = sg

-- Pre-create all pixel frames
local pixels = {}
for y = 0, h - 1 do
  for x = 0, w - 1 do
    local f = Instance.new("Frame")
    f.Size = UDim2.new(0, s, 0, s)
    f.Position = UDim2.new(0, x * s, 0, y * s)
    f.BorderSizePixel = 0
    f.Parent = holder
    table.insert(pixels, f)
  end
end

-- Animation data
local frames = {
${frameDataStrings.join(',\n')}
}

-- Animation loop with instant frame updates
local currentFrame = 1
task.spawn(function()
  while ${loop ? 'true' : 'currentFrame <= #frames'} do
    local frameData = frames[currentFrame]
    -- Update all pixels at once for smooth animation
    for i, p in ipairs(frameData) do
      pixels[i].BackgroundColor3 = Color3.fromRGB(p[1], p[2], p[3])
    end
    currentFrame = currentFrame % #frames + 1
    task.wait(${1 / fps})
  end
end)
`;
  } else {
    // Generate code with fixed pixel size
    luaCode = `-- Pixel Animation by Image to GUI Converter
local sg = Instance.new("ScreenGui")
sg.Name = "${guiName}"
sg.Parent = game.Players.LocalPlayer:WaitForChild("PlayerGui")
local h = Instance.new("Frame")
h.Name = "Holder"
h.Size = UDim2.new(0, ${width * pixelSize}, 0, ${height * pixelSize})
h.Position = UDim2.new(0.5, -${(width * pixelSize) / 2}, 0.5, -${(height * pixelSize) / 2})
h.BackgroundTransparency = 1
h.Parent = sg

-- Pre-create all pixel frames
local pixels = {}
for y = 0, ${height - 1} do
  for x = 0, ${width - 1} do
    local f = Instance.new("Frame")
    f.Size = UDim2.new(0, ${pixelSize}, 0, ${pixelSize})
    f.Position = UDim2.new(0, x * ${pixelSize}, 0, y * ${pixelSize})
    f.BorderSizePixel = 0
    f.Parent = h
    table.insert(pixels, f)
  end
end

-- Animation data
local frames = {
${frameDataStrings.join(',\n')}
}

-- Animation loop with instant frame updates
local currentFrame = 1
task.spawn(function()
  while ${loop ? 'true' : 'currentFrame <= #frames'} do
    local frameData = frames[currentFrame]
    -- Update all pixels at once for smooth animation
    for i, p in ipairs(frameData) do
      pixels[i].BackgroundColor3 = Color3.fromRGB(p[1], p[2], p[3])
    end
    currentFrame = currentFrame % #frames + 1
    task.wait(${1 / fps})
  end
end)
`;
  }
  
  return luaCode;
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
