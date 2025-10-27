export const extractVideoFrames = async (
  videoFile: File,
  targetWidth: number,
  targetHeight: number,
  maxFrames: number = 45 // Increased for better quality
): Promise<ImageData[]> => {
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
      const frameInterval = duration / maxFrames;
      let currentTime = 0;

      const captureFrame = () => {
        if (currentTime >= duration || frames.length >= maxFrames) {
          URL.revokeObjectURL(url);
          resolve(frames);
          return;
        }

        video.currentTime = currentTime;
      };

      video.onseeked = () => {
        // Use Lanczos-like resampling for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        
        // Apply slight sharpening for pixel art
        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
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

export const generateAnimatedLuaCode = (
  frames: ImageData[],
  width: number,
  height: number,
  pixelSize: number,
  fps: number,
  guiName: string
): string => {
  // Compress frame data - convert to RGB values
  const frameData: string[] = [];
  
  frames.forEach((frame) => {
    const pixels: number[] = [];
    for (let i = 0; i < frame.data.length; i += 4) {
      pixels.push(frame.data[i], frame.data[i + 1], frame.data[i + 2]);
    }
    // Create flat array of RGB values
    frameData.push(pixels.join(','));
  });

  const totalPixels = width * height;

  // Generate optimized animated Lua code
  return `-- Roblox Pixel Video Animation
local sg = Instance.new("ScreenGui")
sg.Name = "${guiName}"
sg.Parent = game.Players.LocalPlayer:WaitForChild("PlayerGui")

local h = Instance.new("Frame")
h.Name = "VideoHolder"
h.Size = UDim2.new(0, ${width * pixelSize}, 0, ${height * pixelSize})
h.Position = UDim2.new(0.5, -${Math.floor((width * pixelSize) / 2)}, 0.5, -${Math.floor((height * pixelSize) / 2)})
h.BackgroundTransparency = 1
h.Parent = sg

-- Create pixel grid
local pixels = {}
local s = ${pixelSize}

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

-- Animate with batch updates
task.spawn(function()
  while true do
    for _, frameData in ipairs(frames) do
      -- Update in batches to reduce lag
      for batch = 0, math.ceil(${totalPixels} / 100) - 1 do
        local startIdx = batch * 100 + 1
        local endIdx = math.min(startIdx + 99, ${totalPixels})
        
        for i = startIdx, endIdx do
          local idx = (i - 1) * 3 + 1
          pixels[i].BackgroundColor3 = Color3.fromRGB(
            frameData[idx],
            frameData[idx + 1],
            frameData[idx + 2]
          )
        end
        
        if batch % 5 == 0 then task.wait() end
      end
      task.wait(${(1 / fps).toFixed(3)})
    end
  end
end)
`;
};
