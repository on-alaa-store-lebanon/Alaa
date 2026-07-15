import React from "react";
import { Plus, Package, Heart, Star } from "lucide-react";
import { Product, Review } from "../types";
import { Language, getProductField, getTranslation } from "../lib/translations";
import { HighlightText } from "./HighlightText";

interface ProductCardProps {
  product: Product;
  onOpen: () => void;
  onFastAdd: () => void;
  lang: Language;
  searchQuery?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  reviews?: Review[];
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onOpen, 
  onFastAdd, 
  lang, 
  searchQuery = "",
  isFavorite = false,
  onToggleFavorite,
  reviews = []
}) => {
  const hasVariants = product.options?.length > 0 && product.variants?.length > 0;
  
  // Calculate average rating and total reviews
  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1)
    : "0.0";
  
  // Calculate total stock and price ranges
  const totalStock = hasVariants
    ? product.variants.reduce((acc, curr) => acc + (curr.stock || 0), 0)
    : (product.stock ?? 0);
    
  const isSoldOut = totalStock <= 0;
  const isLowStock = !isSoldOut && totalStock <= 3;

  const prices = hasVariants ? product.variants.map((v) => v.price) : [product.basePrice];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  const priceDisplay = minPrice === maxPrice 
    ? `$${minPrice.toFixed(2)}` 
    : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={onOpen}
      tabIndex={0}
      role="button"
      aria-label={`${getProductField(lang, product, "name")}, price: ${priceDisplay}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`glass-card depth-3d-card hover:depth-3d-card-hover focus-ring-accessible rounded-3xl p-4 flex flex-col justify-between cursor-pointer relative group overflow-hidden ${isSoldOut ? "opacity-75 grayscale-20" : ""}`}
    >
      {/* Badges */}
      {isSoldOut ? (
        <div 
          id={`sold-out-badge-${product.id}`}
          className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-black tracking-widest px-2.5 py-1 rounded-lg uppercase z-10 shadow-sm animate-fade-in"
        >
          {getTranslation(lang, "sold_out")}
        </div>
      ) : isLowStock ? (
        <div 
          id={`low-stock-badge-${product.id}`}
          className="absolute top-3 left-3 bg-amber-500 text-white text-[9px] font-black tracking-widest px-2.5 py-1 rounded-lg uppercase z-10 shadow-sm animate-pulse"
        >
          {lang === "ar" ? "كمية محدودة" : "LOW STOCK"}
        </div>
      ) : product.featured ? (
        <div 
          id={`featured-badge-${product.id}`}
          className="absolute top-3 left-3 bg-emerald-600 text-white text-[8px] font-black tracking-widest px-2 py-0.5 rounded-lg uppercase z-10 shadow-sm flex items-center gap-1 animate-pulse"
        >
          <span>⭐</span>
          <span>{lang === "ar" ? "مميز" : "PINNED"}</span>
        </div>
      ) : null}

      {/* Favorite Button */}
      <button
        id={`fav-btn-${product.id}`}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (onToggleFavorite) onToggleFavorite(e);
        }}
        className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-400 hover:text-red-500 rounded-full p-2 bg-opacity-95 shadow-sm hover:shadow z-20 transition-all duration-200 active:scale-90 border border-gray-100 flex items-center justify-center cursor-pointer"
      >
        <Heart
          size={14}
          strokeWidth={2.5}
          className={`${isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"}`}
        />
      </button>

      {/* Image container */}
      <div 
        id={`product-img-container-${product.id}`}
        className="bg-gray-50 rounded-2xl h-36 flex items-center justify-center mb-4 overflow-hidden border border-gray-100 relative"
      >
        {product.imageUrls && product.imageUrls.length > 0 ? (
          <img
            src={product.imageUrls[0]}
            alt={getProductField(lang, product, "name")}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            referrerPolicy="no-referrer"
          />
        ) : product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={getProductField(lang, product, "name")}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Package size={32} className="text-gray-300" />
        )}
      </div>

      {/* Product Information */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <span 
            id={`product-category-${product.id}`}
            className="text-[10px] uppercase tracking-widest font-black text-gray-400 block mb-1"
          >
            {getProductField(lang, product, "category")}
          </span>
          <h3 
            id={`product-name-${product.id}`}
            className="text-sm font-black text-[#0F172A] leading-snug line-clamp-2 uppercase tracking-tight group-hover:text-black transition"
          >
            <HighlightText text={getProductField(lang, product, "name")} query={searchQuery} />
          </h3>

          {/* Customer Reviews Summary */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-1 mt-1.5" id={`product-reviews-summary-${product.id}`}>
              <div className="flex items-center text-amber-400">
                <Star size={11} className="fill-amber-400 text-amber-400" />
              </div>
              <span className="text-[10.5px] font-black text-slate-700 leading-none">{averageRating}</span>
              <span className="text-[9.5px] font-bold text-gray-400 leading-none">({reviewCount})</span>
            </div>
          )}

          {hasVariants && (
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-1 block">
              {lang === "ar" ? `متوفر ${product.variants.length} خيارات` : `${product.variants.length} Options Available`}
            </span>
          )}
        </div>

        {/* Footer info & Fast Add */}
        <div className="flex justify-between items-end mt-4 pt-3 border-t border-gray-100">
          <div>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block leading-none">
              {lang === "ar" ? "السعر" : "Price"}
            </span>
            <span 
              id={`product-price-${product.id}`}
              className="text-base font-black text-[#0F172A] mt-1 block"
            >
              {priceDisplay}
            </span>
          </div>

          <button
            id={`fast-add-btn-${product.id}`}
            type="button"
            disabled={isSoldOut}
            onClick={(e) => {
              e.stopPropagation();
              if (!isSoldOut) onFastAdd();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
              isSoldOut
                ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                : "bg-[#0F172A] hover:bg-slate-800 text-white active:scale-95 shadow-sm"
            }`}
          >
            <Plus size={12} strokeWidth={3} />
            <span>{lang === "ar" ? "أضف" : "Add"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
