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

/**
 * Script to clear old LocalStorage data and preserve only the 14 newest products.
 */
export function clearLocalStorageAndKeepLatestProducts(): void {
  try {
    const rawProducts = safeGetItem("alaa_store_products");
    let latest14: any[] = [];
    if (rawProducts) {
      try {
        const parsed = JSON.parse(rawProducts);
        if (Array.isArray(parsed)) {
          latest14 = parsed.slice(-14);
        }
      } catch (_) {}
    }

    // Clear all LocalStorage items
    localStorage.clear();

    // Re-persist only the 14 newest products
    if (latest14.length > 0) {
      localStorage.setItem("alaa_store_products", JSON.stringify(latest14));
    }
    console.log("[Storage Cleaned] LocalStorage cleared and capped to 14 latest products.");
  } catch (e) {
    console.warn("Failed to execute clearLocalStorageAndKeepLatestProducts:", e);
  }
}

// Expose clearLocalStorageScript on window for developer/console execution
if (typeof window !== "undefined") {
  (window as any).clearLocalStorageScript = clearLocalStorageAndKeepLatestProducts;
}

export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e: any) {
    const isQuotaError =
      e?.name === "QuotaExceededError" ||
      e?.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      e?.code === 22 ||
      (e?.message && e.message.includes("exceeded the quota"));

    if (isQuotaError) {
      console.warn(`LocalStorage quota exceeded writing '${key}'. Running automatic cleanup...`);
      try {
        // Attempt to recover by clearing heavy non-essential caches
        localStorage.removeItem("alaa_store_reviews");
        
        // If writing products, cap to the 14 newest items
        if (key === "alaa_store_products") {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed) && parsed.length > 14) {
              const trimmed = parsed.slice(-14);
              localStorage.setItem(key, JSON.stringify(trimmed));
              console.log("[Quota Recovered] Trimming cached products to 14 latest entries.");
              return;
            }
          } catch (_) {}
        }
        
        // Retry initial setItem after freeing space
        localStorage.setItem(key, value);
        return;
      } catch (retryErr) {
        console.warn(`Retry after quota cleanup failed for key '${key}'. Falling back to in-memory storage.`, retryErr);
      }
    } else {
      console.warn(`Storage write blocked/failed for key: ${key}. Saving in-memory fallback.`, e);
    }
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

