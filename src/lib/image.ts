export const readImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      reject(new Error("Failed to load map image"));
    };
    image.src = src;
  });
};

export const createObjectUrl = (blob: Blob): string => {
  return URL.createObjectURL(blob);
};

export const revokeObjectUrl = (url: string) => {
  URL.revokeObjectURL(url);
};
