import React, { useState, useEffect } from "react";
import { X, Minus, Plus, ShoppingCart, ShieldCheck, Star, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Product, Variant, Review } from "../types";
import { Language, getProductField, getTranslation } from "../lib/translations";
import { HighlightText } from "./HighlightText";
import { safeGetItem, safeSetItem } from "../lib/storage";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

const DEFAULT_REVIEWS = {
  "p1": {
    en: [
      { name: "Ali M.", text: "Excellent charging speed! Built-in cables are super convenient." },
      { name: "Charbel S.", text: "Very durable build. Highly recommended for daily use." }
    ],
    ar: [
      { name: "علي م.", text: "سرعة شحن ممتازة! الكابلات المدمجة مريحة وعملية للغاية." },
      { name: "شربل س.", text: "تصنيع متين وقوي. أنصح به بشدة للاستخدام اليومي." }
    ]
  },
  "p2": {
    en: [
      { name: "Rania K.", text: "Absolutely love the transparent cyberpunk design! The speed screen is very cool." },
      { name: "Michel H.", text: "Great product, fast charging, beautiful visual." }
    ],
    ar: [
      { name: "رانيا ك.", text: "أحببت التصميم الشفاف للغاية! شاشة مراقبة السرعة رائعة وجذابة." },
      { name: "ميشيل ح.", text: "منتج رائع، شحن سريع وشكل خارجي جميل جداً." }
    ]
  },
  "p3": {
    en: [
      { name: "Jad T.", text: "Best shaving machine I've ever owned. Very smooth cut and long battery life." },
      { name: "Hassan B.", text: "100% waterproof and solid grip. Excellent value." }
    ],
    ar: [
      { name: "جاد ت.", text: "أفضل ماكينة حلاقة جربتها على الإطلاق. حلاقة ناعمة جداً وعمر بطارية طويل." },
      { name: "حسن ب.", text: "مقاومة للماء بنسبة 100٪ وقبضة محكمة. قيمة ممتازة مقابل السعر." }
    ]
  },
  "p4": {
    en: [
      { name: "Nour S.", text: "Compact and super fast charging. It can charge my laptop and phone at the same time." },
      { name: "Zeina A.", text: "Good premium wall charger, space saving." }
    ],
    ar: [
      { name: "نور س.", text: "شاحن سريع ومدمج. يمكنه شحن اللابتوب والهاتف في نفس الوقت بكفاءة." },
      { name: "زينة أ.", text: "شاحن جداري ممتاز وجودة عالية، يوفر مساحة كبيرة." }
    ]
  }
};

const genericReviews = {
  en: [
    { name: "Joseph G.", text: "Highly recommended product, top-tier quality!" }
  ],
  ar: [
    { name: "جوزيف غ.", text: "منتج موصى به للغاية، جودة ممتازة وخامات رائعة!" }
  ]
};

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  onAdd: (variantId: string, variantLabel: string, price: number, qty: number) => void;
  lang: Language;
  searchQuery?: string;
  reviews?: Review[];
  onAddReview?: (review: Review) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onAdd, lang, searchQuery = "", reviews = [], onAddReview }) => {
  const hasVariants = product.options?.length > 0 && product.variants?.length > 0;

  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const images = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls 
    : (product.imageUrl ? [product.imageUrl] : []);

  const hasMultipleImages = images.length > 1;

  // Initialize selected options to the first available variant combinations
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (hasVariants) {
      product.options.forEach((opt) => {
        // Find first value that has active stock or default to first value
        const valWithStock = opt.values.find((val) => {
          const matchingVar = product.variants.find(
            (v) => v.combo[opt.name] === val && v.stock > 0
          );
          return !!matchingVar;
        });
        initial[opt.name] = valWithStock || opt.values[0];
      });
    }
    return initial;
  });

  const [qty, setQty] = useState(1);

  // Reviews and Ratings States
  const [localReviews, setLocalReviews] = useState<Review[]>(reviews);

  useEffect(() => {
    if (reviews.length > 0) {
      setLocalReviews(reviews);
    } else {
      const stored = safeGetItem(`alaa_store_reviews_${product.id}`);
      if (stored) {
        try {
          setLocalReviews(JSON.parse(stored));
          return;
        } catch (e) {
          console.error(e);
        }
      }
      
      const prodIdStr = String(product.id);
      const reviewsData = (DEFAULT_REVIEWS as any)[prodIdStr] || genericReviews;
      
      const seeded: Review[] = [
        {
          id: `seed-1-${product.id}`,
          productId: product.id,
          name: lang === "ar" ? reviewsData.ar[0].name : reviewsData.en[0].name,
          rating: 5,
          text: lang === "ar" ? reviewsData.ar[0].text : reviewsData.en[0].text,
          date: "2026-07-01"
        }
      ];
      if (reviewsData.en[1] || reviewsData.ar[1]) {
        seeded.push({
          id: `seed-2-${product.id}`,
          productId: product.id,
          name: lang === "ar" ? reviewsData.ar[1].name : reviewsData.en[1].name,
          rating: 4,
          text: lang === "ar" ? reviewsData.ar[1].text : reviewsData.en[1].text,
          date: "2026-07-03"
        });
      }
      setLocalReviews(seeded);
    }
  }, [reviews, product.id, lang]);

  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>("");
  const [reviewerName, setReviewerName] = useState<string>("");
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      setSubmitError(lang === "ar" ? "يرجى كتابة نص التقييم أولاً." : "Please enter a review text.");
      return;
    }
    
    const nameToUse = reviewerName.trim() || (lang === "ar" ? "عميل مجهول" : "Anonymous Customer");
    const newReviewObj: Review = {
      id: `review-${Date.now()}`,
      productId: product.id,
      name: nameToUse,
      rating: newRating,
      text: newComment.trim(),
      date: new Date().toISOString().split("T")[0]
    };

    const updatedReviews = [newReviewObj, ...localReviews];
    setLocalReviews(updatedReviews);
    safeSetItem(`alaa_store_reviews_${product.id}`, JSON.stringify(updatedReviews));

    if (onAddReview) {
      onAddReview(newReviewObj);
    }

    try {
      const docRef = doc(db, "reviews", newReviewObj.id);
      await setDoc(docRef, newReviewObj);
    } catch (err) {
      console.error("Error saving review to Firestore:", err);
    }

    setNewComment("");
    setReviewerName("");
    setNewRating(5);
    setSubmitSuccess(true);
    setSubmitError("");

    setTimeout(() => {
      setSubmitSuccess(false);
    }, 3000);
  };

  // Lightbox & Image Zoom States
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxScale, setLightboxScale] = useState(1);
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset scale and position when opening/closing or changing images
  useEffect(() => {
    setLightboxScale(1);
    setLightboxPan({ x: 0, y: 0 });
  }, [isLightboxOpen, activeImageIdx]);

  const handleZoomToggle = () => {
    if (lightboxScale > 1) {
      setLightboxScale(1);
      setLightboxPan({ x: 0, y: 0 });
    } else {
      setLightboxScale(2.5);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (lightboxScale <= 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - lightboxPan.x,
      y: e.clientY - lightboxPan.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || lightboxScale <= 1) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Boundary constraints based on zoom scale (approximate visual boundaries)
    const maxBound = (lightboxScale - 1) * 200;
    const constrainedX = Math.max(-maxBound, Math.min(maxBound, newX));
    const constrainedY = Math.max(-maxBound, Math.min(maxBound, newY));

    setLightboxPan({ x: constrainedX, y: constrainedY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (lightboxScale <= 1 || e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({
      x: touch.clientX - lightboxPan.x,
      y: touch.clientY - lightboxPan.y
    });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || lightboxScale <= 1 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;

    const maxBound = (lightboxScale - 1) * 200;
    const constrainedX = Math.max(-maxBound, Math.min(maxBound, newX));
    const constrainedY = Math.max(-maxBound, Math.min(maxBound, newY));

    setLightboxPan({ x: constrainedX, y: constrainedY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Find active variant matching selected options
  const [activeVariant, setActiveVariant] = useState<Variant | null>(null);

  useEffect(() => {
    if (hasVariants) {
      const match = product.variants.find((v) =>
        product.options.every((opt) => v.combo[opt.name] === selectedOptions[opt.name])
      );
      setActiveVariant(match || null);
    }
  }, [selectedOptions, product, hasVariants]);

  // Determine current pricing and stock
  const currentPrice = hasVariants && activeVariant ? activeVariant.price : product.basePrice;
  const currentStock = hasVariants && activeVariant ? activeVariant.stock : (product.stock ?? 0);
  const isSoldOut = currentStock <= 0;

  // SEO Optimization & Rich Snippet (JSON-LD Schema Markup) Injection
  useEffect(() => {
    // Preserve initial page title and description
    const originalTitle = document.title;
    const metaDescEl = document.querySelector('meta[name="description"]');
    const originalDesc = metaDescEl ? metaDescEl.getAttribute("content") : "";

    // Set SEO-optimized title containing keywords for mobile accessories & tech gadgets
    document.title = `${product.name} - Buy Premium ${product.category} | ON ALAA STORE`;
    
    // Set descriptive Meta Description
    const descriptiveText = product.desc 
      ? `${product.desc.substring(0, 150)}... Get the best deal on premium mobile accessories & tech gadgets at ON ALAA STORE with fast delivery.`
      : `Shop for premium ${product.name} (${product.category}) at ON ALAA STORE. Top quality mobile accessories and gadgets with super fast delivery in Lebanon.`;
    
    if (metaDescEl) {
      metaDescEl.setAttribute("content", descriptiveText);
    } else {
      const newMeta = document.createElement("meta");
      newMeta.setAttribute("name", "description");
      newMeta.setAttribute("content", descriptiveText);
      document.head.appendChild(newMeta);
    }

    // Dynamic JSON-LD Structured Data for Google Rich Search Results
    const schemaMarkup = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": images,
      "description": product.desc || `Premium ${product.name} mobile accessory and tech gadget from ON ALAA STORE.`,
      "sku": product.id,
      "brand": {
        "@type": "Brand",
        "name": "ON ALAA STORE"
      },
      "offers": {
        "@type": "Offer",
        "url": window.location.href,
        "priceCurrency": "USD",
        "price": currentPrice,
        "priceValidUntil": "2030-12-31",
        "itemCondition": "https://schema.org/NewCondition",
        "availability": isSoldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        "seller": {
          "@type": "Store",
          "name": "ON ALAA STORE"
        }
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "bestRating": "5",
        "worstRating": "1",
        "ratingCount": "24"
      }
    };

    const scriptEl = document.createElement("script");
    scriptEl.type = "application/ld+json";
    scriptEl.id = "product-jsonld-schema";
    scriptEl.innerHTML = JSON.stringify(schemaMarkup);
    document.head.appendChild(scriptEl);

    // Clean up title, meta description, and schema markup upon modal closing
    return () => {
      document.title = originalTitle;
      const cleanMetaDesc = document.querySelector('meta[name="description"]');
      if (cleanMetaDesc && originalDesc) {
        cleanMetaDesc.setAttribute("content", originalDesc);
      }
      const existingScript = document.getElementById("product-jsonld-schema");
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [product, currentPrice, isSoldOut, images]);

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
    setQty(1); // Reset qty to 1 when changing variants
  };

  const handleAddToCart = () => {
    if (isSoldOut) return;
    const variantId = hasVariants && activeVariant ? activeVariant.id : "base";
    const variantLabel = hasVariants
      ? product.options.map((opt) => selectedOptions[opt.name]).join(" / ")
      : "";
    onAdd(variantId, variantLabel, currentPrice, qty);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
      <div 
        id="product-detail-modal"
        className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 space-y-4 max-h-[90vh] overflow-y-auto relative border-2 border-gray-200 shadow-2xl animate-slide-up"
      >
        {/* Close Button */}
        <button
          id="close-product-modal"
          onClick={onClose}
          className="absolute right-5 top-5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full w-8 h-8 flex items-center justify-center transition-colors font-bold shadow-sm z-10"
        >
          <X size={16} strokeWidth={3} />
        </button>

        {/* Product Image Gallery / Carousel */}
        <div className="space-y-2">
          <div 
            id="product-modal-img-container"
            onClick={() => setIsLightboxOpen(true)}
            className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl h-56 flex items-center justify-center overflow-hidden border-2 border-slate-100 shadow-sm relative group cursor-zoom-in"
          >
            {images.length > 0 ? (
              <>
                <img
                  src={images[activeImageIdx]}
                  alt={`${product.name} - Slide ${activeImageIdx + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-all duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />

                {/* Lightbox Trigger Visual Indicator Overlay */}
                <div className="absolute top-3.5 right-3.5 bg-black/60 hover:bg-black/80 text-white rounded-xl p-2 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 backdrop-blur-sm shadow z-10 pointer-events-none scale-90 group-hover:scale-100">
                  <Maximize2 size={13} className="stroke-[2.5]" />
                </div>

                {/* Left/Right Navigation Buttons */}
                {hasMultipleImages && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIdx((p) => (p === 0 ? images.length - 1 : p - 1));
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition shadow backdrop-blur-sm z-10 active:scale-90 text-sm font-black"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIdx((p) => (p === images.length - 1 ? 0 : p + 1));
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition shadow backdrop-blur-sm z-10 active:scale-90 text-sm font-black"
                    >
                      ›
                    </button>

                    {/* Instagram-style Dot Indicators overlay */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
                      {images.map((_, dotIdx) => (
                        <div
                          key={dotIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIdx(dotIdx);
                          }}
                          className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                            dotIdx === activeImageIdx ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-slate-300 flex flex-col items-center">
                <Plus size={48} className="stroke-1" />
                <span className="text-xs font-semibold mt-1">No Image Available</span>
              </div>
            )}
          </div>

          {/* Horizontal scrollable gallery of thumbnails */}
          {hasMultipleImages && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
              {images.map((img, thumbIdx) => {
                const isActive = thumbIdx === activeImageIdx;
                return (
                  <button
                    key={thumbIdx}
                    type="button"
                    onClick={() => setActiveImageIdx(thumbIdx)}
                    className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      isActive 
                        ? "border-[#0F172A] scale-[0.98] shadow-sm" 
                        : "border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-400"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${thumbIdx + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Meta & Info */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-100/80 rounded-full px-3.5 py-1 inline-block">
            {getProductField(lang, product, "category")}
          </span>
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-snug pt-1">
            <HighlightText text={getProductField(lang, product, "name")} query={searchQuery} />
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed font-bold">
            <HighlightText 
              text={getProductField(lang, product, "desc") || (lang === "ar" ? "لا يوجد وصف متوفر لهذا المنتج." : "No custom product description available.")} 
              query={searchQuery} 
            />
          </p>
        </div>

        {/* Pricing & Stock Details */}
        <div className="flex items-center justify-between py-2 border-y-2 border-slate-50">
          <div>
            <span className="text-[10px] text-slate-400 block font-black uppercase tracking-widest">
              {lang === "ar" ? "السعر" : "Price"}
            </span>
            <span className="text-2xl font-black text-[#0F172A] tracking-tighter">${currentPrice.toFixed(2)}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-black uppercase tracking-widest mb-1">
              {lang === "ar" ? "التوفر" : "Availability"}
            </span>
            {isSoldOut ? (
              <span className="text-[10px] font-black text-red-600 bg-red-50 border-2 border-red-200 rounded-full px-3 py-1 inline-block uppercase tracking-wider animate-fade-in">
                {getTranslation(lang, "sold_out")}
              </span>
            ) : (
              <span className="text-[10px] font-black text-green-700 bg-green-50 border-2 border-green-200 rounded-full px-3 py-1 inline-block uppercase tracking-wider animate-fade-in">
                {lang === "ar" ? `متوفر ${currentStock} في المخزن` : `${currentStock} in stock`}
              </span>
            )}
          </div>
        </div>

        {/* Variant Selectors */}
        {hasVariants && (
          <div className="space-y-3.5 pt-1">
            {product.options.map((opt) => (
              <div key={opt.name} className="space-y-1.5">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                  {lang === "ar" ? `اختر ${opt.name}` : `Select ${opt.name}`}
                </span>
                <div className="flex flex-wrap gap-2">
                  {opt.values.map((val) => {
                    const isSelected = selectedOptions[opt.name] === val;
                    // Check if this specific option combination is active
                    const tempCombo = { ...selectedOptions, [opt.name]: val };
                    const matchingVar = product.variants.find((v) =>
                      product.options.every((o) => v.combo[o.name] === tempCombo[o.name])
                    );
                    const optOos = !matchingVar || matchingVar.stock <= 0;

                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleOptionChange(opt.name, val)}
                        className={`px-4 py-2 rounded-full border-2 text-[11px] font-black tracking-widest transition-all uppercase ${
                          isSelected
                            ? "bg-[#0F172A] border-[#0F172A] text-white shadow-sm"
                            : optOos
                            ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed line-through"
                            : "bg-white border-gray-200 text-gray-700 hover:border-gray-900 hover:text-gray-900"
                        }`}
                      >
                        {val} {optOos && (lang === "ar" ? "(نفذ)" : "(OOS)")}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Cart Action row */}
        <div className="flex items-center gap-3 pt-3 border-t-2 border-slate-50">
          <div className="flex items-center border-2 border-gray-200 rounded-2xl bg-slate-50">
            <button
              type="button"
              disabled={qty <= 1 || isSoldOut}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="px-4 py-3 hover:bg-slate-100 rounded-l-xl text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition"
            >
              <Minus size={14} strokeWidth={3} />
            </button>
            <span className="px-3 font-black text-slate-900 text-sm w-8 text-center">
              {qty}
            </span>
            <button
              type="button"
              disabled={qty >= currentStock || isSoldOut}
              onClick={() => setQty((q) => q + 1)}
              className="px-4 py-3 hover:bg-slate-100 rounded-r-xl text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition"
            >
              <Plus size={14} strokeWidth={3} />
            </button>
          </div>

          <button
            id="add-to-cart-action"
            type="button"
            disabled={isSoldOut}
            onClick={handleAddToCart}
            className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] cursor-pointer ${
              isSoldOut
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-slate-100"
                : "bg-[#0F172A] hover:bg-slate-800 text-white"
            }`}
          >
            <ShoppingCart size={15} strokeWidth={2.5} />
            {isSoldOut ? getTranslation(lang, "sold_out") : (lang === "ar" ? `أضف إلى السلة - $${(currentPrice * qty).toFixed(2)}` : `Add to Cart - $${(currentPrice * qty).toFixed(2)}`)}
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400 text-center font-black uppercase tracking-wider pt-2.5">
          <ShieldCheck size={12} strokeWidth={2.5} className="text-green-500 shrink-0" />
          <span>{lang === "ar" ? "طلب آمن ومؤكد مباشرة عبر واتساب" : "Secured Checkout via WhatsApp"}</span>
        </div>

        {/* Ratings and Reviews Section */}
        <div className="border-t-2 border-slate-100 pt-4.5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              {lang === "ar" ? "آراء وتقييمات العملاء" : "Ratings & Reviews"}
            </h4>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-slate-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg">
                {localReviews.length > 0 
                  ? (localReviews.reduce((acc, r) => acc + r.rating, 0) / localReviews.length).toFixed(1)
                  : "0.0"}
              </span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => {
                  const avg = localReviews.length > 0 
                    ? (localReviews.reduce((acc, r) => acc + r.rating, 0) / localReviews.length)
                    : 0;
                  return (
                    <Star
                      key={s}
                      size={11}
                      className={`${
                        s <= Math.round(avg)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200 fill-slate-100"
                      }`}
                    />
                  );
                })}
              </div>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">
                ({localReviews.length})
              </span>
            </div>
          </div>

          {/* Review List */}
          <div className="space-y-3 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
            {localReviews.length === 0 ? (
              <p className="text-[10px] text-slate-400 font-bold text-center py-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                {lang === "ar" ? "لا توجد تقييمات بعد. كن أول من يقيم هذا المنتج!" : "No reviews yet. Be the first to review this product!"}
              </p>
            ) : (
              localReviews.map((rev) => (
                <div key={rev.id} className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 space-y-1.5 animate-fade-in">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">
                      {rev.name}
                    </span>
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest shrink-0">
                      {rev.date}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={9}
                          className={`${
                            s <= rev.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200 fill-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                    {rev.text}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Submit a Review Form */}
          <form onSubmit={handleSubmitReview} className="bg-slate-50/50 rounded-[24px] p-4 border border-slate-200/80 space-y-3.5">
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest block">
              {lang === "ar" ? "أضف تقييمك للمنتج" : "Write a review"}
            </span>

            {/* Interactive Stars */}
            <div className="space-y-1">
              <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest">
                {lang === "ar" ? "التقييم بالنجوم" : "Your Rating"}
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNewRating(s)}
                    className="transition active:scale-90 cursor-pointer"
                  >
                    <Star
                      size={18}
                      className={`${
                        s <= newRating
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300 fill-slate-200 hover:text-amber-400"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-2">
              <div>
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  {lang === "ar" ? "اسمك الكامل (اختياري)" : "Your Name (Optional)"}
                </label>
                <input
                  type="text"
                  placeholder={lang === "ar" ? "مثال: علاء خالد" : "e.g. John Doe"}
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0F172A] transition"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  {lang === "ar" ? "نص التقييم" : "Review details"}
                </label>
                <textarea
                  rows={2}
                  placeholder={lang === "ar" ? "شاركنا رأيك الصريح حول جودة المنتج..." : "Share details of your experience with this product..."}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0F172A] transition resize-none"
                />
              </div>
            </div>

            {submitError && (
              <p className="text-[10px] text-red-500 font-black uppercase tracking-wider">
                {submitError}
              </p>
            )}

            {submitSuccess && (
              <p className="text-[10px] text-green-600 font-black uppercase tracking-wider bg-green-50 border border-green-200 rounded-xl px-3 py-2 animate-fade-in">
                {lang === "ar" ? "شكراً لك! تم نشر تقييمك بنجاح." : "Thank you! Your review has been submitted."}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-black py-2.5 px-4 rounded-xl transition text-[9px] uppercase tracking-widest active:scale-[0.98] cursor-pointer"
            >
              {lang === "ar" ? "إرسال التقييم" : "Submit Review"}
            </button>
          </form>
        </div>
      </div>

      {/* Fullscreen Interactive Zoomable Lightbox Overlay */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 bg-black/95 z-[100] flex flex-col justify-between p-4 md:p-6 backdrop-blur-md select-none animate-fade-in outline-none"
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsLightboxOpen(false);
            if (e.key === "ArrowLeft") setActiveImageIdx((p) => (p === 0 ? images.length - 1 : p - 1));
            if (e.key === "ArrowRight") setActiveImageIdx((p) => (p === images.length - 1 ? 0 : p + 1));
          }}
          tabIndex={0}
          ref={(el) => el && el.focus()}
        >
          {/* Top Toolbar */}
          <div className="w-full max-w-4xl mx-auto flex items-center justify-between z-10 pt-2">
            <span className="text-[10px] text-white/60 font-black uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
              {lang === "ar" ? "عرض التفاصيل" : "Detail Zoom"} • {activeImageIdx + 1} / {images.length}
            </span>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleZoomToggle}
                className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest backdrop-blur-sm transition-all active:scale-95 cursor-pointer"
                title="Toggle Zoom"
              >
                {lightboxScale > 1 ? (
                  <>
                    <ZoomOut size={13} strokeWidth={2.5} />
                    <span>{lang === "ar" ? "تصغير" : "Out"}</span>
                  </>
                ) : (
                  <>
                    <ZoomIn size={13} strokeWidth={2.5} />
                    <span>{lang === "ar" ? "تكبير" : "In"}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl p-1.5 flex items-center justify-center backdrop-blur-sm transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* Main Interactive Zoom Stage */}
          <div 
            className="flex-1 w-full max-w-4xl mx-auto flex items-center justify-center relative overflow-hidden my-4"
            onWheel={(e) => {
              e.preventDefault();
              const zoomFactor = 0.25;
              let newScale = lightboxScale;
              if (e.deltaY < 0) {
                newScale = Math.min(4, lightboxScale + zoomFactor);
              } else {
                newScale = Math.max(1, lightboxScale - zoomFactor);
              }
              setLightboxScale(newScale);
              if (newScale === 1) {
                setLightboxPan({ x: 0, y: 0 });
              }
            }}
          >
            {/* Previous Button */}
            {hasMultipleImages && (
              <button
                type="button"
                onClick={() => setActiveImageIdx((p) => (p === 0 ? images.length - 1 : p - 1))}
                className="absolute left-2 md:left-4 bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all backdrop-blur-md z-10 active:scale-90 text-lg font-black cursor-pointer border border-white/5 shadow-lg"
              >
                ‹
              </button>
            )}

            {/* Zoomable Image Container */}
            <div
              className={`relative overflow-hidden w-full h-full flex items-center justify-center ${
                lightboxScale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDoubleClick={handleZoomToggle}
            >
              <img
                src={images[activeImageIdx]}
                alt="Zoomed Detail"
                draggable={false}
                style={{
                  transform: `translate(${lightboxPan.x}px, ${lightboxPan.y}px) scale(${lightboxScale})`,
                  transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
                }}
                className="max-h-[70vh] max-w-full object-contain pointer-events-none rounded-xl shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Next Button */}
            {hasMultipleImages && (
              <button
                type="button"
                onClick={() => setActiveImageIdx((p) => (p === images.length - 1 ? 0 : p + 1))}
                className="absolute right-2 md:right-4 bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all backdrop-blur-md z-10 active:scale-90 text-lg font-black cursor-pointer border border-white/5 shadow-lg"
              >
                ›
              </button>
            )}
          </div>

          {/* Bottom Panel */}
          <div className="w-full max-w-4xl mx-auto space-y-4 text-center z-10 pb-2">
            {/* Instructional Guidelines */}
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest leading-relaxed">
              {lang === "ar" 
                ? "انقر مرتين للتبديل للتكبير 2.5x • اسحب للتحريك • حرك عجلة الفأرة للتكبير والتصغير"
                : "Double click to toggle 2.5x • Drag or swipe to pan • Scroll wheel to zoom smoothly"
              }
            </p>

            {/* Thumbnails list inside Lightbox */}
            {hasMultipleImages && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1 scrollbar-thin max-w-xs mx-auto">
                {images.map((img, idx) => {
                  const isActive = idx === activeImageIdx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className={`relative w-11 h-11 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                        isActive 
                          ? "border-white scale-105 shadow-md" 
                          : "border-white/20 opacity-50 hover:opacity-100 hover:border-white/50"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
