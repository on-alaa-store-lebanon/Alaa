import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  LayoutDashboard,
  Search,
  ShoppingCart,
  Phone,
  Instagram,
  MapPin,
  X,
  Package,
  Layers,
  Truck,
  Settings,
  ChevronRight,
  Sparkles,
  Users,
  Heart,
  QrCode,
  Copy,
  Check,
  ArrowUpDown,
  Share2,
  Printer,
  Download,
} from "lucide-react";

// Firebase/Firestore Imports
import { collection, onSnapshot, query, doc, setDoc, getDoc } from "firebase/firestore";
import { db, isQuotaError } from "./lib/firebase";
import { safeGetItem, safeSetItem, safeRemoveItem } from "./lib/storage";

// Types & Initial Data
import { Product, CartItem, Order, StoreSettings, Review } from "./types";
import { INITIAL_PRODUCTS, DEFAULT_SETTINGS } from "./data";

// Localization Helpers
import { Language, translations, getTranslation, getProductField, getStoreField } from "./lib/translations";

// Role-Based Auth Helpers
import { User, checkPermission, ROLE_LABELS } from "./lib/auth";
import { addSecurityLog } from "./lib/security";

// Shared SVG WhatsApp Icon
import { WAIcon } from "./components/WAIcon";

// Modular Components
import { PasswordModal } from "./components/PasswordModal";
import { ProductCard } from "./components/ProductCard";
import { ProductModal } from "./components/ProductModal";
import { CheckoutModal } from "./components/CheckoutModal";
import { AdminKPIs } from "./components/AdminKPIs";
import { ProductForm } from "./components/ProductForm";
import { ManageProducts } from "./components/ManageProducts";
import { OrdersTab } from "./components/OrdersTab";
import { SettingsTab } from "./components/SettingsTab";
import { UsersTab } from "./components/UsersTab";

export default function App() {
  // Core application states with localStorage persistence
  const lang = "en" as Language;

  useEffect(() => {
    document.documentElement.dir = "ltr";
    document.documentElement.lang = "en";
  }, []);

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const stored = safeGetItem("alaa_store_products");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, 14);
        }
      }
      return INITIAL_PRODUCTS.slice(0, 14);
    } catch (e) {
      console.error("Error parsing alaa_store_products from localStorage:", e);
      return INITIAL_PRODUCTS.slice(0, 14);
    }
  });

  // Synchronize products with Firebase Firestore in real-time
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const q = query(collection(db, "products"));
      unsubscribe = onSnapshot(q, async (snapshot) => {
        try {
          if (snapshot.empty) {
            console.log("Firestore products collection is empty. Falling back to local catalog...");
            setProducts(INITIAL_PRODUCTS.slice(0, 14));
            return;
          }

          const fetchedProducts: Product[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data) {
              fetchedProducts.push({
                id: docSnap.id,
                name: data.name || "",
                category: data.category || "",
                basePrice: typeof data.basePrice === "number" ? data.basePrice : Number(data.basePrice || 0),
                desc: data.desc || "",
                stock: typeof data.stock === "number" ? data.stock : Number(data.stock || 0),
                visible: data.visible !== false,
                imageUrl: data.imageUrl || null,
                imageUrls: data.imageUrls || [],
                options: data.options || [],
                variants: data.variants || [],
                nameAr: data.nameAr || "",
                descAr: data.descAr || "",
                categoryAr: data.categoryAr || "",
                featured: data.featured === true,
                updatedAt: data.updatedAt || "",
              });
            }
          });
          
          // Sort products so the newest uploaded/updated items come first
          fetchedProducts.sort((a, b) => {
            if (a.updatedAt && b.updatedAt) {
              return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            }
            return (b.id || "").localeCompare(a.id || "");
          });
          
          // Filter to strictly sync the 14 newest entries to keep memory and storage footprint light
          const latest14Products = fetchedProducts.slice(0, 14);
          setProducts(latest14Products);
        } catch (innerError) {
          console.error("Error processing Firestore snapshot:", innerError);
        }
      }, (error) => {
        const errMsg = error?.message || "";
        const errCode = error?.code || "";
        const isUnavailable = errCode === "unavailable" || errMsg.toLowerCase().includes("unavailable") || errMsg.toLowerCase().includes("could not reach");

        if (isQuotaError(error)) {
          console.warn("Firestore Quota exceeded - running smoothly in offline fallback mode:", error.message || error);
          setIsDbQuotaExceeded(true);
          try {
            safeSetItem("alaa_store_quota_exceeded", "true");
          } catch (e) {}
        } else if (isUnavailable) {
          console.warn("Firestore is temporarily offline or unreachable - running smoothly in local fallback mode:", error.message || error);
        } else {
          console.error("Firestore onSnapshot error:", error);
        }
      });
    } catch (e) {
      console.error("Synchronous error establishing Firestore onSnapshot listener:", e);
    }

    return () => unsubscribe();
  }, []);

  // Synchronize reviews with Firebase Firestore in real-time
  const [reviews, setReviews] = useState<Review[]>(() => {
    try {
      const stored = safeGetItem("alaa_store_reviews");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error parsing alaa_store_reviews from localStorage:", e);
    }
    return [
      {
        id: "r1",
        productId: "p1",
        name: "Ali M.",
        rating: 5,
        text: "Excellent charging speed! Built-in cables are super convenient.",
        date: "2026-07-01"
      },
      {
        id: "r2",
        productId: "p1",
        name: "Charbel S.",
        rating: 4,
        text: "Very durable build. Highly recommended for daily use.",
        date: "2026-07-03"
      },
      {
        id: "r3",
        productId: "p2",
        name: "Rania K.",
        rating: 5,
        text: "Absolutely love the transparent cyberpunk design! The speed screen is very cool.",
        date: "2026-07-02"
      },
      {
        id: "r4",
        productId: "p2",
        name: "Michel H.",
        rating: 5,
        text: "Great product, fast charging, beautiful visual.",
        date: "2026-07-04"
      },
      {
        id: "r5",
        productId: "p3",
        name: "Jad T.",
        rating: 5,
        text: "Best shaving machine I've ever owned. Very smooth cut and long battery life.",
        date: "2026-07-01"
      },
      {
        id: "r6",
        productId: "p3",
        name: "Hassan B.",
        rating: 4,
        text: "100% waterproof and solid grip. Excellent value.",
        date: "2026-07-03"
      },
      {
        id: "r7",
        productId: "p4",
        name: "Nour S.",
        rating: 5,
        text: "Compact and super fast charging. It can charge my laptop and phone at the same time.",
        date: "2026-07-02"
      },
      {
        id: "r8",
        productId: "p4",
        name: "Zeina A.",
        rating: 4,
        text: "Good premium wall charger, space saving.",
        date: "2026-07-04"
      }
    ];
  });

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const q = query(collection(db, "reviews"));
      unsubscribe = onSnapshot(q, async (snapshot) => {
        try {
          if (snapshot.empty) {
            console.log("Firestore reviews collection is empty. Falling back to default reviews...");
            const INITIAL_REVIEWS: Review[] = [
              {
                id: "r1",
                productId: "p1",
                name: "Ali M.",
                rating: 5,
                text: "Excellent charging speed! Built-in cables are super convenient.",
                date: "2026-07-01"
              },
              {
                id: "r2",
                productId: "p1",
                name: "Charbel S.",
                rating: 4,
                text: "Very durable build. Highly recommended for daily use.",
                date: "2026-07-03"
              },
              {
                id: "r3",
                productId: "p2",
                name: "Rania K.",
                rating: 5,
                text: "Absolutely love the transparent cyberpunk design! The speed screen is very cool.",
                date: "2026-07-02"
              },
              {
                id: "r4",
                productId: "p2",
                name: "Michel H.",
                rating: 5,
                text: "Great product, fast charging, beautiful visual.",
                date: "2026-07-04"
              },
              {
                id: "r5",
                productId: "p3",
                name: "Jad T.",
                rating: 5,
                text: "Best shaving machine I've ever owned. Very smooth cut and long battery life.",
                date: "2026-07-01"
              },
              {
                id: "r6",
                productId: "p3",
                name: "Hassan B.",
                rating: 4,
                text: "100% waterproof and solid grip. Excellent value.",
                date: "2026-07-03"
              },
              {
                id: "r7",
                productId: "p4",
                name: "Nour S.",
                rating: 5,
                text: "Compact and super fast charging. It can charge my laptop and phone at the same time.",
                date: "2026-07-02"
              },
              {
                id: "r8",
                productId: "p4",
                name: "Zeina A.",
                rating: 4,
                text: "Good premium wall charger, space saving.",
                date: "2026-07-04"
              }
            ];
            setReviews(INITIAL_REVIEWS);
            return;
          }

          const fetchedReviews: Review[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data) {
              fetchedReviews.push({
                id: docSnap.id,
                productId: data.productId || "",
                name: data.name || "",
                rating: typeof data.rating === "number" ? data.rating : Number(data.rating || 5),
                text: data.text || "",
                date: data.date || "",
              });
            }
          });
          setReviews(fetchedReviews);
          try {
            safeSetItem("alaa_store_reviews", JSON.stringify(fetchedReviews));
          } catch (e) {}
        } catch (innerError) {
          console.error("Error processing Firestore reviews snapshot:", innerError);
        }
      }, (error) => {
        const errMsg = error?.message || "";
        const errCode = error?.code || "";
        const isUnavailable = errCode === "unavailable" || errMsg.toLowerCase().includes("unavailable") || errMsg.toLowerCase().includes("could not reach");

        if (isQuotaError(error)) {
          console.warn("Firestore reviews Quota exceeded - running smoothly in offline fallback mode:", error.message || error);
          setIsDbQuotaExceeded(true);
          try {
            safeSetItem("alaa_store_quota_exceeded", "true");
          } catch (e) {}
        } else if (isUnavailable) {
          console.warn("Firestore reviews is temporarily offline or unreachable - running smoothly in local fallback mode:", error.message || error);
        } else {
          console.error("Firestore reviews onSnapshot error:", error);
        }
      });
    } catch (e) {
      console.error("Synchronous error establishing Firestore reviews listener:", e);
    }
    return () => unsubscribe();
  }, []);

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const stored = safeGetItem("alaa_store_orders");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return [];
    } catch (e) {
      console.error("Error parsing alaa_store_orders from localStorage:", e);
      return [];
    }
  });
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    try {
      const stored = safeGetItem("alaa_store_settings");
      return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    } catch (e) {
      console.error("Error parsing alaa_store_settings from localStorage:", e);
      return DEFAULT_SETTINGS;
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const stored = safeGetItem("alaa_store_wishlist");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return [];
    } catch (e) {
      console.error("Error parsing alaa_store_wishlist from localStorage:", e);
      return [];
    }
  });

  const [isWishlistSynced, setIsWishlistSynced] = useState(false);
  const [isDbQuotaExceeded, setIsDbQuotaExceeded] = useState(() => {
    // Check if we previously set a quota exceeded flag in this session
    try {
      return safeGetItem("alaa_store_quota_exceeded") === "true";
    } catch (e) {
      return false;
    }
  });

  const [floatingHearts, setFloatingHearts] = useState<{ id: string; x: number; y: number }[]>([]);

  // Navigation states & RBAC
  const [currentView, setCurrentView] = useState<"storefront" | "admin">("storefront");
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = safeGetItem("alaa_store_current_user");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error("Error parsing alaa_store_current_user from localStorage:", e);
      return null;
    }
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState<"products" | "orders" | "settings" | "users">("products");

  const isAdminAuthenticated = currentUser !== null;

  // Persistence side-effects
  useEffect(() => {
    // Only cache the 14 latest products to strictly remain within LocalStorage quotas
    safeSetItem("alaa_store_products", JSON.stringify(products.slice(0, 14)));
  }, [products]);

  useEffect(() => {
    safeSetItem("alaa_store_orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    safeSetItem("alaa_store_settings", JSON.stringify(storeSettings));
  }, [storeSettings]);

  useEffect(() => {
    if (currentUser) {
      safeSetItem("alaa_store_current_user", JSON.stringify(currentUser));
    } else {
      safeRemoveItem("alaa_store_current_user");
    }
  }, [currentUser]);

  // Secure Route Guard: Protect Admin view from unauthorized direct entry
  useEffect(() => {
    if (currentView === "admin" && !currentUser) {
      setCurrentView("storefront");
      showToast("Access denied. Admin session required.", "error");
    }
  }, [currentView, currentUser]);

  // Wishlist Firebase Real-Time/Session Sync
  useEffect(() => {
    // 1. Keep client-side localStorage in perfect harmony
    safeSetItem("alaa_store_wishlist", JSON.stringify(wishlist));

    // 2. If logged in, synchronize wishlist with Firestore
    if (currentUser) {
      if (!isWishlistSynced) {
        // Initial load of logged-in user's wishlist from cloud
        const fetchWishlist = async () => {
          try {
            const docRef = doc(db, "wishlists", currentUser.username);
            const docSnap = await getDoc(docRef);
            let cloudWishlist: string[] = [];
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data && Array.isArray(data.items)) {
                cloudWishlist = data.items;
              }
            }
            
            // Merge any local items added during guest session with cloud items
            const merged = Array.from(new Set([...wishlist, ...cloudWishlist]));
            setWishlist(merged);
            setIsWishlistSynced(true);
            
            // Immediately sync back to the cloud database if there are newly merged guest items
            if (merged.length !== cloudWishlist.length) {
              await setDoc(docRef, {
                items: merged,
                updatedAt: new Date().toISOString()
              });
            }
          } catch (e) {
            if (isQuotaError(e)) {
              console.warn("Firestore wishlist sync Quota exceeded - running smoothly in offline fallback mode:", e?.message || e);
              setIsDbQuotaExceeded(true);
              try {
                safeSetItem("alaa_store_quota_exceeded", "true");
              } catch (storageErr) {}
            } else {
              console.error("Error syncing wishlist from Firestore:", e);
            }
          }
        };
        fetchWishlist();
      } else {
        // Subsequent additions/removals update cloud in real-time
        const saveWishlist = async () => {
          try {
            const docRef = doc(db, "wishlists", currentUser.username);
            await setDoc(docRef, {
              items: wishlist,
              updatedAt: new Date().toISOString()
            });
          } catch (e) {
            if (isQuotaError(e)) {
              console.warn("Firestore wishlist save Quota exceeded - running smoothly in offline fallback mode:", e?.message || e);
              setIsDbQuotaExceeded(true);
              try {
                safeSetItem("alaa_store_quota_exceeded", "true");
              } catch (storageErr) {}
            } else {
              console.error("Error saving wishlist to Firestore:", e);
            }
          }
        };
        saveWishlist();
      }
    } else {
      // Reset sync status on logout to be ready for next user login session
      setIsWishlistSynced(false);
    }
  }, [wishlist, currentUser, isWishlistSynced]);

  // High-Security: Session Inactivity Handler (Auto-logout after 10 minutes)
  useEffect(() => {
    if (!currentUser) return;

    let lastActiveTime = Date.now();
    const TIMEOUT_DURATION = 10 * 60 * 1000; // 10 minutes of complete inactivity

    const handleActivity = () => {
      lastActiveTime = Date.now();
    };

    // User activity events to monitor
    const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    const intervalId = setInterval(() => {
      const inactiveTime = Date.now() - lastActiveTime;
      if (inactiveTime >= TIMEOUT_DURATION) {
        addSecurityLog(
          "SESSION_TIMEOUT",
          currentUser.username,
          `Session terminated automatically after ${TIMEOUT_DURATION / (60 * 1000)} minutes of inactivity`
        );
        setCurrentUser(null);
        setCurrentView("storefront");
        showToast("Admin session expired due to inactivity.", "error");
      }
    }, 10000); // Poll every 10 seconds

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(intervalId);
    };
  }, [currentUser]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [hideOutOfStock, setHideOutOfStock] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc" | "popularity">("default");

  // Active modal/popup states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [storeUrl, setStoreUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setStoreUrl(window.location.href);
    }
  }, []);

  // Web Share API handler
  const handleShareStore = async () => {
    const title = getStoreField(lang, storeSettings, "title") || "ON ALAA STORE";
    const text = getStoreField(lang, storeSettings, "description") || (lang === "ar" ? "تفقد متجرنا المذهل وجديد منتجاتنا!" : "Check out our amazing products and new arrivals!");
    const targetUrl = storeUrl || (typeof window !== "undefined" ? window.location.href : "https://on-alaa-store.web.app");

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: targetUrl,
        });
        showToast(lang === "ar" ? "تمت المشاركة بنجاح!" : "Shared successfully!", "success");
      } catch (err: any) {
        if (err.name !== "AbortError") {
          showToast(lang === "ar" ? "فشلت المشاركة" : `Share failed: ${err.message}`, "error");
        }
      }
    } else {
      // Fallback copy
      try {
        await navigator.clipboard.writeText(targetUrl);
        setIsCopied(true);
        showToast(
          lang === "ar" ? "المشاركة غير مدعومة. تم نسخ رابط المتجر!" : "Direct sharing not supported. Link copied!",
          "success"
        );
        setTimeout(() => setIsCopied(false), 2000);
      } catch (e) {
        showToast(lang === "ar" ? "فشل نسخ الرابط" : "Failed to copy link", "error");
      }
    }
  };

  // Download QR Code Image as PNG file
  const handleDownloadQr = async () => {
    const targetUrl = storeUrl || (typeof window !== "undefined" ? window.location.href : "https://on-alaa-store.web.app");
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(targetUrl)}`;
    
    try {
      const response = await fetch(qrApiUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `ON-ALAA-Store-QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      showToast(
        lang === "ar" ? "تم تحميل رمز الـ QR بنجاح!" : "QR code downloaded successfully!",
        "success"
      );
    } catch (err) {
      console.error("Failed to fetch blob for QR code download:", err);
      // Fallback direct link
      const link = document.createElement("a");
      link.href = qrApiUrl;
      link.download = `ON-ALAA-Store-QR.png`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(
        lang === "ar" ? "جاري فتح صورة الرمز للتحميل..." : "Opening QR image for download...",
        "success"
      );
    }
  };

  // Print QR Code display area specifically via dedicated printable view
  const handlePrintQr = () => {
    const targetUrl = storeUrl || (typeof window !== "undefined" ? window.location.href : "https://on-alaa-store.web.app");
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(targetUrl)}`;
    const storeTitle = getStoreField(lang, storeSettings, "title") || "ON ALAA STORE";
    const storeDesc = getStoreField(lang, storeSettings, "description") || (lang === "ar" ? "امسح رمز الـ QR لزيارة المتجر" : "Scan QR code to visit storefront");

    // Create an invisible iframe for printing specifically the QR code display area
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code - ${storeTitle}</title>
          <style>
            @page {
              size: auto;
              margin: 10mm;
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              margin: 0;
              padding: 20px;
              background: #ffffff;
              color: #0f172a;
              text-align: center;
            }
            .qr-card {
              border: 2px solid #0f172a;
              border-radius: 24px;
              padding: 32px 24px;
              max-width: 340px;
              width: 100%;
              box-shadow: 0 10px 30px rgba(0,0,0,0.08);
              box-sizing: border-box;
            }
            .store-name {
              font-size: 20px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin: 0 0 6px 0;
            }
            .store-desc {
              font-size: 11px;
              color: #64748b;
              font-weight: 700;
              margin: 0 0 24px 0;
              line-height: 1.4;
            }
            .qr-wrapper {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 16px;
              display: inline-block;
              margin-bottom: 20px;
            }
            .qr-img {
              width: 220px;
              height: 220px;
              object-fit: contain;
              display: block;
              margin: 0 auto;
              border-radius: 8px;
            }
            .url-box {
              background: #f1f5f9;
              border: 1px solid #cbd5e1;
              border-radius: 10px;
              padding: 10px 14px;
              font-family: monospace;
              font-size: 10px;
              color: #334155;
              word-break: break-all;
            }
            @media print {
              body {
                min-height: auto;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-card">
            <div class="store-name">${storeTitle}</div>
            <div class="store-desc">${storeDesc}</div>
            <div class="qr-wrapper">
              <img src="${qrApiUrl}" alt="Store QR Code" id="printable-qr-img" />
            </div>
            <div class="url-box">${targetUrl}</div>
          </div>
          <script>
            const img = document.getElementById('printable-qr-img');
            const doPrint = () => {
              window.focus();
              window.print();
            };
            if (img && img.complete) {
              setTimeout(doPrint, 250);
            } else if (img) {
              img.onload = () => setTimeout(doPrint, 250);
              img.onerror = () => setTimeout(doPrint, 250);
            } else {
              setTimeout(doPrint, 250);
            }
          </script>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 60000);
  };

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [toastTimer, setToastTimer] = useState<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    if (toastTimer) clearTimeout(toastTimer);
    setToast({ message, type });
    const timer = setTimeout(() => setToast(null), 3000);
    setToastTimer(timer);
  };

  const toggleWishlist = (productId: string, e?: React.MouseEvent) => {
    const isSaved = wishlist.includes(productId);
    const updated = isSaved
      ? wishlist.filter((id) => id !== productId)
      : [...wishlist, productId];
      
    setWishlist(updated);
    safeSetItem("alaa_store_wishlist", JSON.stringify(updated));
    
    const prod = products.find((p) => p.id === productId);
    const prodName = prod ? (lang === "ar" ? getProductField(lang, prod, "name") : prod.name) : "Product";

    if (!isSaved) {
      // Subtle in-app flying heart particle animation
      const heartX = e ? e.clientX : window.innerWidth / 2;
      const heartY = e ? e.clientY : window.innerHeight / 2;
      
      const newHearts = Array.from({ length: 6 }).map((_, idx) => ({
        id: `heart-${Date.now()}-${idx}-${Math.random()}`,
        x: heartX + (Math.random() * 30 - 15),
        y: heartY + (Math.random() * 30 - 15),
      }));
      
      setFloatingHearts((prev) => [...prev, ...newHearts]);
      
      setTimeout(() => {
        setFloatingHearts((prev) => prev.filter(h => !newHearts.some(nh => nh.id === h.id)));
      }, 1500);

      // Native browser notification with proper permission request & fallback
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "default") {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              try {
                new Notification(lang === "ar" ? "تمت الإضافة للمفضلة!" : "Added to Wishlist!", {
                  body: lang === "ar" ? `تم حفظ "${prodName}" بنجاح.` : `"${prodName}" has been successfully saved.`,
                  icon: "/favicon.ico"
                });
              } catch (err) {
                console.error("Failed to trigger native notification after permission grant:", err);
              }
            }
          });
        } else if (Notification.permission === "granted") {
          try {
            new Notification(lang === "ar" ? "تمت الإضافة للمفضلة!" : "Added to Wishlist!", {
              body: lang === "ar" ? `تم حفظ "${prodName}" بنجاح.` : `"${prodName}" has been successfully saved.`,
              icon: "/favicon.ico"
            });
          } catch (err) {
            console.error("Failed to trigger native notification:", err);
          }
        }
      }
    }

    showToast(!isSaved 
      ? (lang === "ar" ? `تم حفظ "${prodName}" في المفضلة` : `"${prodName}" saved to wishlist!`) 
      : (lang === "ar" ? `تمت إزالة "${prodName}" من المفضلة` : `"${prodName}" removed from wishlist!`), 
      "success"
    );
  };

  // Switch View Trigger with Authentication Lock
  const handleViewSwitch = (view: "storefront" | "admin") => {
    if (view === "admin") {
      if (isAdminAuthenticated) {
        setCurrentView("admin");
      } else {
        setShowPasswordModal(true);
      }
    } else {
      setCurrentView("storefront");
    }
  };

  // High-Security Account Deletion Trigger
  const handleDeleteStoreAccount = () => {
    // 1. Permanently remove account profile from registered users in localStorage
    if (currentUser) {
      const storedUsers = safeGetItem("alaa_store_users");
      if (storedUsers) {
        try {
          const parsedUsers = JSON.parse(storedUsers);
          const filteredUsers = parsedUsers.filter((u: any) => u.id !== currentUser.id);
          safeSetItem("alaa_store_users", JSON.stringify(filteredUsers));
        } catch (e) {
          console.error("Error filtering users:", e);
        }
      }
    }

    // 2. Remove all local storage variables associated with the store
    safeRemoveItem("alaa_store_products");
    safeRemoveItem("alaa_store_orders");
    safeRemoveItem("alaa_store_settings");
    safeRemoveItem("alaa_store_current_user");

    // 3. Reset states to initial blank or default values
    setProducts([]);
    setOrders([]);
    setStoreSettings(DEFAULT_SETTINGS);
    setCart({});

    // 4. Redirect to secure logged out storefront state
    setCurrentUser(null);
    setCurrentView("storefront");
    setActiveAdminTab("products");

    showToast("Store account permanently deleted. All databases wiped.", "success");
  };

  // Add Item to Shopping Cart
  const handleAddToCart = (productId: string, variantId: string, name: string, variantLabel: string, price: number, qty: number) => {
    const cartKey = `${productId}::${variantId}`;
    setCart((prev) => {
      const existing = prev[cartKey];
      if (existing) {
        return {
          ...prev,
          [cartKey]: {
            ...existing,
            qty: existing.qty + qty,
          },
        };
      } else {
        return {
          ...prev,
          [cartKey]: {
            productId,
            variantId,
            name,
            variantLabel,
            price,
            qty,
          },
        };
      }
    });
  };

  // Calculate cart metrics
  const cartKeys = Object.keys(cart);
  const cartItemCount = cartKeys.reduce((sum, k) => sum + cart[k].qty, 0);
  const cartSubtotal = cartKeys.reduce((sum, k) => sum + cart[k].qty * cart[k].price, 0);

  // Filter products for storefront
  const getFilteredProducts = () => {
    const filtered = products.filter((p) => {
      // Visibility guard
      if (p.visible === false) return false;

      // Category filter
      if (selectedCategory !== "All Categories" && p.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (
        searchQuery.trim() &&
        !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.category.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Out of Stock filter
      if (hideOutOfStock) {
        const hasVariants = p.options?.length > 0 && p.variants?.length > 0;
        const totalStock = hasVariants
          ? p.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
          : (p.stock ?? 0);
        if (totalStock <= 0) return false;
      }

      return true;
    });

    // Apply sorting
    if (sortBy === "price-asc") {
      filtered.sort((a, b) => a.basePrice - b.basePrice);
    } else if (sortBy === "price-desc") {
      filtered.sort((a, b) => b.basePrice - a.basePrice);
    } else if (sortBy === "popularity") {
      filtered.sort((a, b) => {
        // Popularity score calculation: orders count + reviews count + featured status bonus
        const countOrdersA = orders.reduce((sum, order) => {
          return sum + (order.items?.filter((item) => item.productId === a.id).reduce((s, item) => s + (item.qty || 1), 0) || 0);
        }, 0);
        const countOrdersB = orders.reduce((sum, order) => {
          return sum + (order.items?.filter((item) => item.productId === b.id).reduce((s, item) => s + (item.qty || 1), 0) || 0);
        }, 0);

        const countReviewsA = reviews.filter((r) => r.productId === a.id).length;
        const countReviewsB = reviews.filter((r) => r.productId === b.id).length;

        const bonusA = a.featured ? 5 : 0;
        const bonusB = b.featured ? 5 : 0;

        const scoreA = countOrdersA + countReviewsA + bonusA;
        const scoreB = countOrdersB + countReviewsB + bonusB;

        return scoreB - scoreA; // descending order of popularity
      });
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  // Distinct list of categories for storefront horizontal filter
  const storefrontCategories: string[] = ["All Categories", ...Array.from(new Set<string>(products.filter(p => p.visible !== false).map((p) => p.category)))];

  return (
    <div className="min-h-screen bg-[#F3F4F6] md:py-8 flex items-start justify-center font-sans antialiased text-[#111827]">
      {/* Centered Mobile Browser Simulator Frame */}
      <div 
        id="app-simulator-container"
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="w-full max-w-md bg-white shadow-2xl min-h-screen md:min-h-[820px] md:rounded-[32px] overflow-hidden relative border border-gray-200 flex flex-col justify-between"
      >
        {isDbQuotaExceeded && (
          <div className="bg-amber-500 text-slate-900 px-3 py-1.5 text-[10px] font-bold leading-tight flex items-center justify-between gap-1.5 shrink-0 border-b border-amber-600/20 z-50 animate-fade-in">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="shrink-0 text-xs">⚠️</span>
              <p className="truncate">
                Firestore Quota Exceeded. Local offline mode active.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 text-[9px]">
              <a 
                href="https://console.firebase.google.com/project/ageless-indexer-7n50x/firestore/databases/ai-studio-remixremixremixo-5e03205b-e7a3-4cc5-8cf9-0b10aea969d5/data?openUpgradeDialog=true"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-black hover:text-black shrink-0 uppercase tracking-wider"
              >
                Upgrade Link
              </a>
              <button 
                type="button" 
                onClick={() => setIsDbQuotaExceeded(false)}
                className="hover:text-black font-black px-1 text-xs leading-none"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        {/* Core Header (Dark Theme Header as requested) */}
        <header 
          id="main-app-header"
          className="bg-[#0F172A] text-white py-4 px-4 sticky top-0 z-40 border-b border-white/10 shadow-md shrink-0 animate-fade-in"
        >
          {/* Top Brand & View Toggle Switch */}
          <div className="flex justify-between items-center gap-3">
            {/* Store Branding Logo */}
            <div className="flex items-center gap-2.5 min-w-0">
              {storeSettings.profilePicUrl ? (
                <img
                  src={storeSettings.profilePicUrl}
                  alt={getStoreField(lang, storeSettings, "title")}
                  className="w-8 h-8 rounded-xl object-cover border-2 border-white/20 shadow-md"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="bg-white text-[#0F172A] font-black text-xs px-2.5 py-1.5 rounded-xl shrink-0 flex items-center justify-center leading-none tracking-tighter shadow-md border border-white/20">
                  ON
                </div>
              )}
              <h2 className="text-sm font-black tracking-tighter truncate uppercase text-white">
                {getStoreField(lang, storeSettings, "title")}
              </h2>
              <button
                id="header-qrcode-trigger"
                type="button"
                onClick={() => {
                  setShowQrModal(true);
                  setIsCopied(false);
                }}
                className="text-white/75 hover:text-white hover:bg-white/15 p-1 rounded-lg transition-all cursor-pointer shrink-0 flex items-center justify-center border border-white/10 active:scale-90 shadow-sm"
                title={lang === "ar" ? "رمز الاستجابة السريعة للمتجر" : "Store QR Code"}
              >
                <QrCode size={13} strokeWidth={2.5} />
              </button>
            </div>

            {/* Split Mode Toggle Switch */}
            <div className="flex items-center gap-2 shrink-0">
              <div 
                id="navigation-mode-toggle"
                className="bg-white/10 p-1 rounded-full flex items-center border border-white/10 shadow-inner"
              >
                <button
                  id="toggle-view-storefront"
                  type="button"
                  onClick={() => handleViewSwitch("storefront")}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                    currentView === "storefront"
                      ? "bg-white text-[#0F172A] shadow-md font-black"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  <ShoppingBag size={9} strokeWidth={2.5} />
                  <span>{getTranslation(lang, "store")}</span>
                </button>
                <button
                  id="toggle-view-admin"
                  type="button"
                  onClick={() => handleViewSwitch("admin")}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                    currentView === "admin"
                      ? "bg-white text-[#0F172A] shadow-md font-black"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  <LayoutDashboard size={9} strokeWidth={2.5} />
                  <span>{getTranslation(lang, "admin")}</span>
                </button>
              </div>

              {/* Elegant Persistent Shopping Cart icon button */}
              {currentView === "storefront" && (
                <button
                  id="header-cart-btn"
                  type="button"
                  onClick={() => setIsCheckoutOpen(true)}
                  className="bg-white/10 hover:bg-white/15 p-2 rounded-full border border-white/10 active:scale-95 transition-all text-white relative flex items-center justify-center cursor-pointer shadow-sm animate-fade-in"
                  title={lang === "ar" ? "حقيبة التسوق" : "Shopping Cart"}
                >
                  <ShoppingCart size={13} strokeWidth={2.5} />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Inner Workspace Content */}
        <main className="flex-1 overflow-y-auto bg-[#F3F4F6]/60">
          <AnimatePresence mode="wait">
            {currentView === "storefront" ? (
              <motion.div
                key="storefront-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 pb-24"
              >
                {/* 1. Header Branding & Banner */}
                <div 
                  id="storefront-banner"
                  className="bg-[#0F172A] text-white px-5 pb-6 pt-4 rounded-b-3xl shadow-lg relative overflow-hidden min-h-[140px] flex flex-col justify-end"
                >
                  {storeSettings.headerVideoUrl && (
                    <>
                      <video
                        src={storeSettings.headerVideoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover z-0"
                      />
                      <div className="absolute inset-0 bg-black/60 z-10" />
                    </>
                  )}

                  <div className="space-y-2.5 relative z-20">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/90">
                        {lang === "ar" ? "المتجر المباشر" : "Live Storefront"}
                      </span>
                    </div>
                    
                    <h1 className="text-xl font-black uppercase tracking-tighter text-white flex items-center gap-2 drop-shadow-md">
                      {getStoreField(lang, storeSettings, "title")}
                      <Sparkles size={16} className="text-amber-400 animate-pulse animate-fade-in" />
                    </h1>
                    <p className="text-xs text-slate-100 leading-relaxed font-bold uppercase tracking-wide drop-shadow-sm">
                      {getStoreField(lang, storeSettings, "description")}
                    </p>
                  </div>

                  {/* Aesthetic Background Grid Accents */}
                  {!storeSettings.headerVideoUrl && (
                    <div className="absolute right-0 bottom-0 top-0 w-32 opacity-10 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />
                  )}
                </div>

                {/* 2. Connect in Bio actionable links */}
                <div 
                  id="connect-in-bio-container"
                  className="px-4"
                >
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2.5">
                    {lang === "ar" ? "روابط سريعة" : "Connect In Bio"}
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Link 1: WhatsApp Chat */}
                    <a
                      id="bio-link-whatsapp"
                      href={`https://wa.me/${storeSettings.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-green-50/70 hover:bg-green-100/80 border border-green-200/80 rounded-2xl p-3 flex items-center gap-3 transition group shadow-sm active:scale-95"
                    >
                      <div className="w-8 h-8 rounded-xl bg-green-500 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                        <WAIcon size={14} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black text-green-950 block leading-tight uppercase tracking-tight">
                          {lang === "ar" ? "تواصل مباشر" : "Chat 24/7"}
                        </span>
                        <span className="text-[8px] text-green-600 font-extrabold block mt-0.5 uppercase tracking-widest">WhatsApp</span>
                      </div>
                    </a>

                    {/* Link 2: Instagram */}
                    <a
                      id="bio-link-instagram"
                      href={`https://instagram.com/${storeSettings.instagram}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200/80 rounded-2xl p-3 flex items-center gap-3 transition group shadow-sm active:scale-95"
                    >
                      <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                        <Instagram size={14} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black text-indigo-950 block leading-tight uppercase tracking-tight truncate">
                          {lang === "ar" ? "انستغرام" : "Instagram"}
                        </span>
                        <span className="text-[8px] text-indigo-600 font-extrabold block mt-0.5 uppercase tracking-widest">@{storeSettings.instagram}</span>
                      </div>
                    </a>

                    {/* Link 3: Google Maps Location */}
                    <a
                      id="bio-link-location"
                      href={storeSettings.locationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-red-50/70 hover:bg-red-100/80 border border-red-200/80 rounded-2xl p-3 flex items-center gap-3 transition group shadow-sm active:scale-95"
                    >
                      <div className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                        <MapPin size={14} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black text-red-950 block leading-tight uppercase tracking-tight">
                          {lang === "ar" ? "موقعنا" : "Find Us"}
                        </span>
                        <span className="text-[8px] text-red-600 font-extrabold block mt-0.5 uppercase tracking-widest">Google Maps</span>
                      </div>
                    </a>

                    {/* Link 4: Call Direct Dial */}
                    <a
                      id="bio-link-call"
                      href={`tel:+${storeSettings.phone}`}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-2xl p-3 flex items-center gap-3 transition group shadow-sm active:scale-95"
                    >
                      <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                        <Phone size={14} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black text-slate-950 block leading-tight uppercase tracking-tight">
                          {lang === "ar" ? "اتصال هاتفي" : "Call Now"}
                        </span>
                        <span className="text-[8px] text-slate-500 font-extrabold block mt-0.5 uppercase tracking-widest">Hotline LB</span>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Wishlist Section */}
                <div id="wishlist-section" className="px-4 space-y-2 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <Heart size={12} className={`text-red-500 ${wishlist.length > 0 ? "fill-red-500 animate-pulse" : ""}`} />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                        {lang === "ar" ? `المنتجات المحفوظة (${wishlist.length})` : `Saved Items (${wishlist.length})`}
                      </span>
                    </div>
                    {wishlist.length > 0 && (
                      <button
                        id="clear-wishlist-btn"
                        onClick={() => {
                          setWishlist([]);
                          safeSetItem("alaa_store_wishlist", JSON.stringify([]));
                          showToast(lang === "ar" ? "تم مسح قائمة المفضلة" : "Wishlist cleared!", "success");
                        }}
                        className="text-[8px] font-black text-gray-400 hover:text-red-500 uppercase tracking-wider cursor-pointer"
                      >
                        {lang === "ar" ? "مسح الكل" : "Clear All"}
                      </button>
                    )}
                  </div>
                  
                  {wishlist.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-2.5 scrollbar-thin scrollbar-thumb-gray-200">
                      {products.filter(p => wishlist.includes(p.id)).map(prod => {
                        const prices = prod.options?.length > 0 && prod.variants?.length > 0
                          ? prod.variants.map((v) => v.price)
                          : [prod.basePrice];
                        const minPrice = Math.min(...prices);
                        const maxPrice = Math.max(...prices);
                        const priceDisplay = minPrice === maxPrice 
                          ? `$${minPrice.toFixed(2)}` 
                          : `$${minPrice.toFixed(2)}+`;
                          
                        return (
                          <div
                            key={`wishlist-${prod.id}`}
                            id={`wishlist-item-${prod.id}`}
                            onClick={() => setSelectedProduct(prod)}
                            className="w-32 bg-white border border-gray-200/80 rounded-2xl p-2.5 shrink-0 hover:shadow-sm transition cursor-pointer relative group flex flex-col justify-between"
                          >
                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWishlist(prod.id);
                              }}
                              className="absolute top-1.5 right-1.5 bg-white/95 border border-gray-100 hover:bg-gray-50 text-red-500 hover:scale-105 rounded-full p-1 shadow-sm z-10 transition duration-150 cursor-pointer flex items-center justify-center"
                            >
                              <Heart size={10} className="fill-red-500 text-red-500" />
                            </button>

                            {/* Product image */}
                            <div className="bg-gray-50 rounded-xl h-16 flex items-center justify-center mb-2 overflow-hidden border border-gray-100">
                              {prod.imageUrls && prod.imageUrls.length > 0 ? (
                                <img
                                  src={prod.imageUrls[0]}
                                  alt={getProductField(lang, prod, "name")}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : prod.imageUrl ? (
                                <img
                                  src={prod.imageUrl}
                                  alt={getProductField(lang, prod, "name")}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <Package size={16} className="text-gray-300" />
                              )}
                            </div>

                            {/* Product details */}
                            <div className="space-y-1">
                              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-tight line-clamp-1">
                                {getProductField(lang, prod, "name")}
                              </h4>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-900">{priceDisplay}</span>
                                <span className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest hover:text-slate-800">
                                  {lang === "ar" ? "عرض" : "View"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200/60 rounded-2xl p-4 text-center">
                      <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">
                        {lang === "ar" 
                          ? "قائمة المفضلة فارغة. اضغط على أيقونة القلب على المنتجات لحفظها!" 
                          : "Your wishlist is empty. Tap the heart on products to save them!"}
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. Search and filter checkboxes */}
                <div 
                  id="search-filter-panel"
                  className="px-4 space-y-3"
                >
                  {/* Premium Products Search Bar */}
                  <div className="relative">
                    <input
                      id="store-search-bar"
                      type="text"
                      placeholder={lang === "ar" ? "ابحث عن منتجاتنا المميزة..." : "SEARCH PREMIUM PRODUCTS..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border-2 border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-black text-slate-900 placeholder-slate-400/80 shadow-sm focus:outline-none focus:ring-0 focus:border-[#0F172A] transition"
                    />
                    <Search size={14} strokeWidth={3} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    {searchQuery && (
                      <button
                        id="clear-search"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={12} strokeWidth={3} />
                      </button>
                    )}
                  </div>

                  {/* Hide out of stock checkbox & sorting dropdown */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                    <label 
                      htmlFor="hide-oos-checkbox"
                      className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest cursor-pointer select-none"
                    >
                      <input
                        id="hide-oos-checkbox"
                        type="checkbox"
                        checked={hideOutOfStock}
                        onChange={(e) => setHideOutOfStock(e.target.checked)}
                        className="rounded border-gray-300 text-[#0F172A] focus:ring-[#0F172A] w-4 h-4 cursor-pointer"
                      />
                      <span>{lang === "ar" ? "إخفاء المنتهية" : "Hide out-of-stock"}</span>
                    </label>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <ArrowUpDown size={11} strokeWidth={2.5} />
                        {lang === "ar" ? "ترتيب:" : "Sort:"}
                      </span>
                      <select
                        id="store-sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-white border-2 border-gray-200 text-[10px] font-black text-[#0F172A] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#0F172A] cursor-pointer transition uppercase tracking-wider"
                      >
                        <option value="default">{lang === "ar" ? "الافتراضي" : "Default"}</option>
                        <option value="price-asc">{lang === "ar" ? "السعر: الأقل للأعلى" : "Price: Low to High"}</option>
                        <option value="price-desc">{lang === "ar" ? "السعر: الأعلى للأقل" : "Price: High to Low"}</option>
                        <option value="popularity">{lang === "ar" ? "الأكثر شعبية" : "Popularity"}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 4. Categorization horizontal pills */}
                <div 
                  id="storefront-categories-pills"
                  className="px-4 space-y-2"
                >
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    {lang === "ar" ? "أقسام المتجر" : "Product Categories"}
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                    {storefrontCategories.map((cat) => (
                      <button
                        key={cat}
                        id={`cat-pill-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`whitespace-nowrap text-[10px] font-black uppercase tracking-widest px-4.5 py-2.5 rounded-full border transition-all shadow-sm active:scale-95 ${
                          selectedCategory === cat
                            ? "bg-[#0F172A] border-[#0F172A] text-white font-black"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 font-bold"
                        }`}
                      >
                        {cat === "All Categories" ? (lang === "ar" ? "جميع الفئات" : "All Categories") : (lang === "ar" ? (cat === "Power bank" ? "شواحن سفري" : cat === "Shaving Machine" ? "ماكينات حلاقة" : cat === "Accessories" ? "إكسسوارات" : cat) : cat)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Product Grid Cards */}
                <div className="px-4">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
                      <Package size={36} className="text-gray-300 mx-auto mb-3 opacity-50" />
                      <p className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        {lang === "ar" ? "لم يتم العثور على منتجات مطابقة" : "No matching products found"}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-1.5">
                        {lang === "ar" ? "يرجى تعديل خيارات البحث أو التصفية للقسم." : "Try adjusting your filters or search query."}
                      </p>
                    </div>
                  ) : (
                    <div 
                      id="products-grid-catalog"
                      className="grid grid-cols-2 gap-3.5"
                    >
                      {filteredProducts.map((prod) => (
                        <ProductCard
                          key={prod.id}
                          product={prod}
                          lang={lang}
                          searchQuery={searchQuery}
                          isFavorite={wishlist.includes(prod.id)}
                          onToggleFavorite={(e) => toggleWishlist(prod.id, e)}
                          onOpen={() => setSelectedProduct(prod)}
                          reviews={reviews.filter((r) => r.productId === prod.id)}
                          onFastAdd={() => {
                            if (prod.options?.length > 0) {
                              setSelectedProduct(prod);
                            } else {
                              handleAddToCart(prod.id, "base", prod.name, "", prod.basePrice, 1);
                              showToast(lang === "ar" ? `تمت إضافة "${getProductField(lang, prod, "name")}" إلى السلة` : `"${prod.name}" added to cart!`, "success");
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              /* ADMIN DASHBOARD (Restricted route) */
              <motion.div
                key="admin-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="pb-24"
              >
                {/* Visual stats and widgets inside dark container */}
                <div className="bg-[#0F172A] text-white px-4 py-5 rounded-b-3xl space-y-4 shadow-lg">
                  <div className="flex justify-between items-start px-1 gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm font-black uppercase tracking-tight text-white">
                          {currentUser?.fullName}
                        </h2>
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-white/10 border border-white/10 text-slate-300 rounded-full tracking-wider shrink-0">
                          {currentUser?.role ? ROLE_LABELS[currentUser.role] : "Staff"}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                        Active Session: {currentUser?.username}
                      </p>
                    </div>
                    <button
                      id="admin-logout"
                      type="button"
                      onClick={() => {
                        setCurrentUser(null);
                        setCurrentView("storefront");
                        showToast("Admin session disconnected");
                      }}
                      className="text-[9px] font-black uppercase tracking-widest text-white/80 hover:text-white bg-white/10 border border-white/15 px-3 py-1 rounded-xl transition active:scale-95 shadow-sm cursor-pointer shrink-0"
                    >
                      Log Out
                    </button>
                  </div>

                  {/* 1. KPIs real-time stats overview */}
                  <AdminKPIs products={products} orders={orders} />
                </div>

                {/* Admin Tab select navigation */}
                <div 
                  id="admin-tabs-nav"
                  className="px-4 mt-4"
                >
                  <div className="bg-white border-2 border-gray-200 p-1 rounded-2xl flex flex-wrap items-center shadow-sm gap-1">
                    {currentUser && checkPermission(currentUser, "manage_products") && (
                      <button
                        id="admin-tab-products"
                        type="button"
                        onClick={() => setActiveAdminTab("products")}
                        className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                          activeAdminTab === "products"
                            ? "bg-[#0F172A] text-white shadow-md font-black"
                            : "text-slate-400 hover:text-slate-800"
                        }`}
                      >
                        <Package size={11} strokeWidth={2.5} />
                        <span>Products</span>
                      </button>
                    )}
                    {currentUser && checkPermission(currentUser, "manage_orders") && (
                      <button
                        id="admin-tab-orders"
                        type="button"
                        onClick={() => setActiveAdminTab("orders")}
                        className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 relative ${
                          activeAdminTab === "orders"
                            ? "bg-[#0F172A] text-white shadow-md font-black"
                            : "text-slate-400 hover:text-slate-800"
                        }`}
                      >
                        <Truck size={11} strokeWidth={2.5} />
                        <span>Orders</span>
                        {orders.filter((o) => o.status === "Pending").length > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[8px] font-black shadow-sm animate-pulse">
                            {orders.filter((o) => o.status === "Pending").length}
                          </span>
                        )}
                      </button>
                    )}
                    {currentUser && checkPermission(currentUser, "manage_settings") && (
                      <button
                        id="admin-tab-settings"
                        type="button"
                        onClick={() => setActiveAdminTab("settings")}
                        className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                          activeAdminTab === "settings"
                            ? "bg-[#0F172A] text-white shadow-md font-black"
                            : "text-slate-400 hover:text-slate-800"
                        }`}
                      >
                        <Settings size={11} strokeWidth={2.5} />
                        <span>Customizer</span>
                      </button>
                    )}
                    {currentUser && checkPermission(currentUser, "manage_users") && (
                      <button
                        id="admin-tab-users"
                        type="button"
                        onClick={() => setActiveAdminTab("users")}
                        className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                          activeAdminTab === "users"
                            ? "bg-[#0F172A] text-white shadow-md font-black"
                            : "text-slate-400 hover:text-slate-800"
                        }`}
                      >
                        <Users size={11} strokeWidth={2.5} />
                        <span>Team</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Inner Tab contents */}
                <div className="p-4 space-y-4">
                  {activeAdminTab === "products" && currentUser && checkPermission(currentUser, "manage_products") && (
                    <div className="space-y-4">
                      {/* Products form and inventory list */}
                      <div className="bg-white border-2 border-gray-100 rounded-3xl p-4 shadow-sm">
                        <ProductForm
                          products={products}
                          setProducts={setProducts}
                          showToast={showToast}
                          onSuccess={() => {}}
                        />
                      </div>

                      <div className="bg-white border-2 border-gray-100 rounded-3xl p-4 shadow-sm space-y-4">
                        <span className="text-xs font-black text-[#0F172A] uppercase tracking-widest block">
                          Current Catalog Listings
                        </span>
                        <ManageProducts
                          products={products}
                          setProducts={setProducts}
                          showToast={showToast}
                        />
                      </div>
                    </div>
                  )}

                  {activeAdminTab === "orders" && currentUser && checkPermission(currentUser, "manage_orders") && (
                    <div className="bg-white border-2 border-gray-100 rounded-3xl p-4 shadow-sm">
                      <OrdersTab orders={orders} setOrders={setOrders} lang={lang} />
                    </div>
                  )}

                  {activeAdminTab === "settings" && currentUser && checkPermission(currentUser, "manage_settings") && (
                    <div className="bg-white border-2 border-gray-100 rounded-3xl p-4 shadow-sm">
                      <SettingsTab
                        settings={storeSettings}
                        setSettings={setStoreSettings}
                        showToast={showToast}
                        onDeleteAccount={handleDeleteStoreAccount}
                        currentUser={currentUser}
                        products={products}
                        setProducts={setProducts}
                        orders={orders}
                      />
                    </div>
                  )}

                  {activeAdminTab === "users" && currentUser && checkPermission(currentUser, "manage_users") && (
                    <div className="bg-white border-2 border-gray-100 rounded-3xl p-4 shadow-sm">
                      <UsersTab currentUser={currentUser} showToast={showToast} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Dynamic Floating Cart Sticky bar for storefront users */}
        {currentView === "storefront" && cartItemCount > 0 && (
          <div 
            id="floating-checkout-indicator"
            className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200/80 shadow-[0_-8px_30px_rgb(0,0,0,0.08)] z-30 md:rounded-b-[32px]"
          >
            <button
              id="checkout-trigger-btn"
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-black py-3.5 px-4 rounded-2xl flex items-center justify-between shadow-lg active:scale-[0.98] transition-all uppercase tracking-wider"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-lg bg-white text-[#0F172A] flex items-center justify-center text-[10px] font-black animate-pulse">
                  {cartItemCount}
                </div>
                <span className="text-[11px] font-black">
                  {lang === "ar" ? "معاينة السلة والطلب" : "Review Cart & Order"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-black text-xs">
                <span>
                  {lang === "ar" ? "المجموع:" : "Subtotal:"} ${cartSubtotal.toFixed(2)}
                </span>
                <ChevronRight size={14} className="stroke-3" />
              </div>
            </button>
          </div>
        )}

        {/* Footer copyright block */}
        <footer 
          id="global-branding-footer"
          className="bg-[#0F172A] border-t border-white/5 py-4.5 px-4 text-center shrink-0 z-10"
        >
          <p className="text-[9px] text-white/40 font-black uppercase tracking-widest leading-none">
            © 2026 ON ALAA STORE. {lang === "ar" ? "جميع الحقوق محفوظة." : "All rights reserved."}
          </p>
          <p className="text-[8px] text-white/20 font-black uppercase tracking-widest mt-1.5">
            {lang === "ar" ? "مشغل بواسطة محرك علاء التجاري" : "Powered by ALAA E-Commerce Engine"}
          </p>
        </footer>

        {/* 1. Modal overlay: Password authentication Gate */}
        {showPasswordModal && (
          <PasswordModal
            onClose={() => {
              setShowPasswordModal(false);
              showToast("Authentication cancelled", "error");
            }}
            onSuccess={(user) => {
              setCurrentUser(user);
              setShowPasswordModal(false);
              setCurrentView("admin");
              
              // Set the default tab according to user permissions
              if (user.role === "dispatcher") {
                setActiveAdminTab("orders");
              } else {
                setActiveAdminTab("products");
              }
              
              showToast(`Access granted: ${user.fullName}`, "success");
            }}
          />
        )}

        {/* 2. Modal overlay: Product details selector */}
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            lang={lang}
            searchQuery={searchQuery}
            reviews={reviews.filter((r) => r.productId === selectedProduct.id)}
            onClose={() => setSelectedProduct(null)}
            onAdd={(vId, vLabel, price, qty) => {
              handleAddToCart(
                selectedProduct.id,
                vId,
                selectedProduct.name,
                vLabel,
                price,
                qty
              );
              showToast(lang === "ar" ? `تمت إضافة "${getProductField(lang, selectedProduct, "name")}" إلى السلة` : `"${selectedProduct.name}" added to cart!`, "success");
              setSelectedProduct(null);
            }}
            onAddReview={(newReview) => {
              setReviews((prev) => {
                const updated = [newReview, ...prev];
                try {
                  safeSetItem("alaa_store_reviews", JSON.stringify(updated));
                } catch (e) {}
                return updated;
              });
            }}
          />
        )}

        {/* 3. Modal overlay: Final Checkout form */}
        {isCheckoutOpen && (
          <CheckoutModal
            cart={cart}
            setCart={setCart}
            products={products}
            onClose={() => setIsCheckoutOpen(false)}
            onOrder={(order) => {
              setOrders((prev) => [order, ...prev]);
            }}
            showToast={showToast}
            storeSettings={storeSettings}
            lang={lang}
          />
        )}

        {/* 4. Modal overlay: Dynamic QR Code Generator */}
        {showQrModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQrModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white w-full max-w-xs rounded-[28px] border border-slate-200 shadow-2xl overflow-hidden flex flex-col z-10 p-5 relative text-slate-800"
              id="qr-code-share-modal"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1 rounded-full transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              {/* Header */}
              <div className="text-center space-y-1 mt-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  {lang === "ar" ? "مشاركة المتجر" : "Share Store"}
                </h3>
                <p className="text-[10px] text-slate-500 font-extrabold leading-tight">
                  {lang === "ar" ? "امسح رمز الـ QR لزيارة المتجر" : "Scan QR code to visit the storefront"}
                </p>
              </div>

              {/* Dynamic QR Code Display Area */}
              <div id="qr-code-display-area" className="flex flex-col items-center justify-center my-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(storeUrl || "https://on-alaa-store.web.app")}`}
                  alt="Store QR Code"
                  className="w-36 h-36 object-contain rounded-lg border-2 border-white shadow bg-white"
                />

                {/* QR Quick Actions: Download & Print */}
                <div className="flex items-center gap-2 mt-3 w-full justify-center">
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="flex-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-[9px] font-black uppercase tracking-wider py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer shadow-2xs hover:border-slate-300 active:scale-95"
                    id="download-qr-btn"
                    title="Download QR Code PNG"
                  >
                    <Download size={12} className="text-slate-600 shrink-0" />
                    <span>{lang === "ar" ? "تنزيل الرمز" : "Download QR"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintQr}
                    className="flex-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-[9px] font-black uppercase tracking-wider py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer shadow-2xs hover:border-slate-300 active:scale-95"
                    id="print-qr-btn"
                    title="Print QR Code Area"
                  >
                    <Printer size={12} className="text-slate-600 shrink-0" />
                    <span>{lang === "ar" ? "طباعة الرمز" : "Print QR"}</span>
                  </button>
                </div>
              </div>

              {/* Copy & Share Action Panel */}
              <div className="space-y-1.5 text-left animate-fade-in" dir="ltr">
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block px-1">
                  {lang === "ar" ? "رابط المتجر المستهدف" : "Target Store URL"}
                </span>
                
                <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-sm focus-within:border-slate-800 transition-all">
                  <input
                    type="url"
                    value={storeUrl}
                    onChange={(e) => setStoreUrl(e.target.value)}
                    placeholder="https://on-alaa-store.com"
                    className="flex-1 bg-transparent text-[10px] font-mono text-slate-700 focus:outline-none px-2 select-all overflow-ellipsis"
                  />
                  
                  {/* Reset Origin shortcut */}
                  {storeUrl !== (typeof window !== "undefined" ? window.location.href : "") && (
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          setStoreUrl(window.location.href);
                          showToast(lang === "ar" ? "تمت إعادة التعيين للرابط الحالي" : "Reset to current location URL", "success");
                        }
                      }}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[8px] font-black uppercase tracking-wider px-1.5 py-1 rounded-md transition-all cursor-pointer active:scale-95"
                      title="Reset URL"
                    >
                      {lang === "ar" ? "إعادة" : "Reset"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(storeUrl || window.location.href);
                      setIsCopied(true);
                      showToast(
                        lang === "ar" ? "تم نسخ الرابط بنجاح!" : "Store link copied to clipboard!",
                        "success"
                      );
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0 shadow-sm"
                    title="Copy Link"
                  >
                    {isCopied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                  </button>
                </div>

                {/* Share Store button with Web Share API / Copy Fallback */}
                <button
                  type="button"
                  onClick={handleShareStore}
                  className="w-full bg-[#0F172A] hover:bg-slate-800 active:scale-98 text-white text-[10px] font-black uppercase tracking-widest py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-150 cursor-pointer shadow-[3px_3px_0px_#000] border border-slate-900 mt-2.5"
                  id="native-share-store-btn"
                >
                  <Share2 size={12} strokeWidth={2.5} />
                  <span>{lang === "ar" ? "مشاركة المتجر" : "Share Store"}</span>
                </button>
              </div>

              {/* Arabic instruction helper */}
              <p className="text-[9px] text-slate-400 text-center mt-4.5 leading-normal font-semibold">
                {lang === "ar" 
                  ? "وجه كاميرا الهاتف نحو الرمز لفتح المتجر مباشرة"
                  : "Point your phone camera to open the store instantly"
                }
              </p>
            </motion.div>
          </div>
        )}
      </div>

      {/* Instant visual toast notify rendering */}
      {toast && (
        <div 
          id="global-toast-notification"
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[150] px-4 py-3 rounded-xl shadow-xl text-xs font-bold tracking-wide flex items-center gap-2 border animate-slide-down ${
            toast.type === "error"
              ? "bg-red-900 border-red-800 text-red-200"
              : "bg-slate-900 border-slate-800 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Floating Hearts Animation Particles */}
      <div className="fixed inset-0 pointer-events-none z-[200]">
        <AnimatePresence>
          {floatingHearts.map((heart) => (
            <motion.div
              key={heart.id}
              initial={{ opacity: 1, scale: 0.4, x: heart.x - 8, y: heart.y - 8 }}
              animate={{ 
                opacity: [1, 0.9, 0], 
                scale: [0.4, 1.3, 0.7], 
                x: [heart.x - 8, heart.x - 8 + (Math.random() * 80 - 40), heart.x - 8 + (Math.random() * 120 - 60)], 
                y: [heart.y - 8, heart.y - 80, heart.y - 200] 
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute text-red-500 text-base select-none pointer-events-none filter drop-shadow-sm"
            >
              ❤️
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
