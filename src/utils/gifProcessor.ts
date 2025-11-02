// Utility to extract frames from animated GIFs
export const extractGifFrames = async (file: File): Promise<ImageData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const blob = new Blob([arrayBuffer]);
      const url = URL.createObjectURL(blob);
      
      const img = new Image();
      img.onload = async () => {
        try {
          const frames: ImageData[] = [];
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          
          // For now, just capture the first frame
          // Full GIF parsing would require a library like gif.js
          ctx.drawImage(img, 0, 0);
          frames.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
          
          URL.revokeObjectURL(url);
          resolve(frames);
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load GIF'));
      };
      
      img.src = url;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

export const isGif = (file: File): boolean => {
  return file.type === 'image/gif';
};
