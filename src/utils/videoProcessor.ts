export const extractVideoFrames = async (
  videoFile: File,
  targetWidth: number,
  targetHeight: number,
  maxFrames: number = 30 // Limit frames to prevent crashes
): Promise<ImageData[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const frames: ImageData[] = [];
    const url = URL.createObjectURL(videoFile);
    video.src = url;

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const frameInterval = Math.max(duration / maxFrames, 0.1); // Sample frames
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
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        frames.push(ctx.getImageData(0, 0, targetWidth, targetHeight));
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
  // Compress frame data
  const frameData: string[] = [];
  
  frames.forEach((frame) => {
    const pixels: string[] = [];
    for (let i = 0; i < frame.data.length; i += 4) {
      const r = frame.data[i];
      const g = frame.data[i + 1];
      const b = frame.data[i + 2];
      pixels.push(`{${r},${g},${b}}`);
    }
    frameData.push(`{${pixels.join(',')}}`);
  });

  // Generate compact animated Lua code
  return `local sg=Instance.new("ScreenGui")
sg.Name="${guiName}"
sg.Parent=game.Players.LocalPlayer:WaitForChild("PlayerGui")
local h=Instance.new("Frame")
h.Name="VideoHolder"
h.Size=UDim2.new(0,${width * pixelSize},0,${height * pixelSize})
h.Position=UDim2.new(0.5,-${(width * pixelSize) / 2},0.5,-${(height * pixelSize) / 2})
h.BackgroundTransparency=1
h.Parent=sg
local w,ht,s=${width},${height},${pixelSize}
local px={}
for y=0,ht-1 do
for x=0,w-1 do
local f=Instance.new("Frame")
f.Size=UDim2.new(0,s,0,s)
f.Position=UDim2.new(0,x*s,0,y*s)
f.BackgroundColor3=Color3.new(0,0,0)
f.BorderSizePixel=0
f.Parent=h
table.insert(px,f)
if #px%50==0 then task.wait()end
end
end
local fr={${frameData.join(',')}}
task.spawn(function()
while true do
for _,f in ipairs(fr)do
for i,p in ipairs(px)do
local c=f[i]
p.BackgroundColor3=Color3.fromRGB(c[1],c[2],c[3])
end
task.wait(${1 / fps})
end
end
end)
`;
};
