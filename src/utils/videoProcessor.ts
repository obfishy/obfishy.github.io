export const extractVideoFrames = async (
  videoFile: File,
  width: number,
  height: number,
  maxFrames: number = 300
): Promise<ImageData[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const frames: ImageData[] = [];
    const videoUrl = URL.createObjectURL(videoFile);

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const fps = 30; // Sample at 30fps
      const totalFrames = Math.min(Math.floor(duration * fps), maxFrames);
      const frameInterval = duration / totalFrames;

      let currentFrame = 0;

      const captureFrame = () => {
        if (currentFrame >= totalFrames) {
          URL.revokeObjectURL(videoUrl);
          resolve(frames);
          return;
        }

        video.currentTime = currentFrame * frameInterval;
      };

      video.onseeked = () => {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(video, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        frames.push(imageData);
        currentFrame++;
        captureFrame();
      };

      video.onerror = () => {
        URL.revokeObjectURL(videoUrl);
        reject(new Error('Error loading video'));
      };

      captureFrame();
    };

    video.src = videoUrl;
  });
};

export const generateAnimatedLuaCode = (
  frames: ImageData[],
  width: number,
  height: number,
  pixelSize: number,
  fps: number
): string => {
  let luaCode = `-- Pixel Video Animation for Roblox\n\n`;
  luaCode += `local ScreenGui = Instance.new("ScreenGui")\n`;
  luaCode += `ScreenGui.Name = "PixelVideo"\n`;
  luaCode += `ScreenGui.Parent = game.Players.LocalPlayer:WaitForChild("PlayerGui")\n\n`;

  luaCode += `local Holder = Instance.new("Frame")\n`;
  luaCode += `Holder.Name = "PixelArtHolder"\n`;
  luaCode += `Holder.Size = UDim2.new(0, ${width * pixelSize}, 0, ${height * pixelSize})\n`;
  luaCode += `Holder.Position = UDim2.new(0.5, ${-(width * pixelSize) / 2}, 0.5, ${-(height * pixelSize) / 2})\n`;
  luaCode += `Holder.AnchorPoint = Vector2.new(0.5, 0.5)\n`;
  luaCode += `Holder.BackgroundTransparency = 1\n`;
  luaCode += `Holder.Parent = ScreenGui\n\n`;

  luaCode += `local FRAME_WIDTH = ${width}\n`;
  luaCode += `local FRAME_HEIGHT = ${height}\n`;
  luaCode += `local PIXEL_SIZE = ${pixelSize}\n`;
  luaCode += `local FPS = ${fps}\n\n`;

  // Generate frame data
  luaCode += `local frames = {\n`;
  frames.forEach((frame, frameIndex) => {
    luaCode += `  {`;
    const pixels = frame.data;
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i] / 255;
      const g = pixels[i + 1] / 255;
      const b = pixels[i + 2] / 255;
      luaCode += `{${r.toFixed(3)},${g.toFixed(3)},${b.toFixed(3)}}`;
      if (i < pixels.length - 4) luaCode += ',';
    }
    luaCode += `}`;
    if (frameIndex < frames.length - 1) luaCode += ',';
    luaCode += `\n`;
  });
  luaCode += `}\n\n`;

  // Create pixel grid
  luaCode += `local pixels = {}\n`;
  luaCode += `for y = 0, FRAME_HEIGHT - 1 do\n`;
  luaCode += `  pixels[y] = {}\n`;
  luaCode += `  for x = 0, FRAME_WIDTH - 1 do\n`;
  luaCode += `    local px = Instance.new("Frame")\n`;
  luaCode += `    px.Name = "Pixel_" .. x .. "_" .. y\n`;
  luaCode += `    px.Size = UDim2.new(0, PIXEL_SIZE, 0, PIXEL_SIZE)\n`;
  luaCode += `    px.Position = UDim2.new(0, x * PIXEL_SIZE, 0, y * PIXEL_SIZE)\n`;
  luaCode += `    px.BackgroundColor3 = Color3.new(0, 0, 0)\n`;
  luaCode += `    px.BorderSizePixel = 0\n`;
  luaCode += `    px.Parent = Holder\n`;
  luaCode += `    pixels[y][x] = px\n`;
  luaCode += `  end\n`;
  luaCode += `end\n\n`;

  // Animation loop
  luaCode += `-- Animation loop\n`;
  luaCode += `task.spawn(function()\n`;
  luaCode += `  while true do\n`;
  luaCode += `    for _, frame in ipairs(frames) do\n`;
  luaCode += `      for y = 0, FRAME_HEIGHT - 1 do\n`;
  luaCode += `        for x = 0, FRAME_WIDTH - 1 do\n`;
  luaCode += `          local px = pixels[y][x]\n`;
  luaCode += `          local colorIndex = y * FRAME_WIDTH + x + 1\n`;
  luaCode += `          local c = frame[colorIndex]\n`;
  luaCode += `          px.BackgroundColor3 = Color3.new(c[1], c[2], c[3])\n`;
  luaCode += `        end\n`;
  luaCode += `      end\n`;
  luaCode += `      task.wait(1 / FPS)\n`;
  luaCode += `    end\n`;
  luaCode += `  end\n`;
  luaCode += `end)\n`;

  return luaCode;
};
