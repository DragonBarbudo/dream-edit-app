export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  timestamp: number;
}

const STORAGE_KEY = 'generated-images';

export const saveImage = (image: Omit<GeneratedImage, 'id' | 'timestamp'>): void => {
  const images = getImages();
  const newImage: GeneratedImage = {
    ...image,
    id: Date.now().toString(),
    timestamp: Date.now(),
  };
  images.unshift(newImage);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
};

export const getImages = (): GeneratedImage[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const deleteImage = (id: string): void => {
  const images = getImages().filter(img => img.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
};

export const clearImages = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
