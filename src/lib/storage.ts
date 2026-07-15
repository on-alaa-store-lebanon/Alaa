// Safe storage utility with in-memory fallback for sandbox environments
const inMemoryStorage: Record<string, string> = {};

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`Storage read blocked/failed for key: ${key}. Using in-memory fallback.`, e);
    return inMemoryStorage[key] !== undefined ? inMemoryStorage[key] : null;
  }
}

export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Storage write blocked/failed for key: ${key}. Saving in-memory fallback.`, e);
    inMemoryStorage[key] = value;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn(`Storage delete blocked/failed for key: ${key}. Deleting in-memory fallback.`, e);
    delete inMemoryStorage[key];
  }
}

/**
 * Resizes and compresses an image to JPEG base64 to prevent exceeding Firestore's 1MB document size limit.
 */
export function compressImage(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7
): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Scale down proportionally if the image exceeds the maximum dimensions
          if (width > maxWidth || height > maxHeight) {
            const widthRatio = maxWidth / width;
            const heightRatio = maxHeight / height;
            const bestRatio = Math.min(widthRatio, heightRatio);

            width = Math.round(width * bestRatio);
            height = Math.round(height * bestRatio);
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string || null);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        } catch (e) {
          console.error("Canvas compression failed, falling back:", e);
          resolve(event.target?.result as string || null);
        }
      };
      img.onerror = () => resolve(event.target?.result as string || null);
    };
    reader.onerror = () => resolve(null);
  });
}

