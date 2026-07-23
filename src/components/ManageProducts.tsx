import React, { useState } from "react";
import { 
  Eye, 
  EyeOff, 
  Trash2, 
  Package, 
  RefreshCw, 
  Loader2,
  Sparkles,
  Database,
  Plus
} from "lucide-react";
import { Product } from "../types";
import { INITIAL_PRODUCTS } from "../data";
import { safeSetItem, safeRemoveItem } from "../lib/storage";

// Firebase/Firestore Imports
import { doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";

interface ManageProductsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  showToast: (msg: string, type?: "success" | "error") => void;
}

export const ManageProducts: React.FC<ManageProductsProps> = ({
  products,
  setProducts,
  showToast,
}) => {
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [isPopulating14, setIsPopulating14] = useState(false);

  const handleToggleVisibility = (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    const nextVisible = product.visible === false;
    try {
      updateDoc(doc(db, "products", id), { visible: nextVisible })
        .then(() => {
          showToast("Product visibility updated!");
          setProducts((prev) => prev.map((p) => p.id === id ? { ...p, visible: nextVisible } : p));
        })
        .catch((error) => {
          handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
        });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `products/${id}`);
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    try {
      deleteDoc(doc(db, "products", deleteTarget.id))
        .then(() => {
          showToast(`Deleted "${deleteTarget.name}" successfully!`, "success");
          setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
          setDeleteTarget(null);
        })
        .catch((error) => {
          handleFirestoreError(error, OperationType.DELETE, `products/${deleteTarget.id}`);
        });
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `products/${deleteTarget.id}`);
    }
  };

  // Function to purge all products from Firestore and local cache
  const handleClearAllProducts = async () => {
    setIsClearingAll(true);
    let deletedCount = 0;
    try {
      for (const prod of products) {
        try {
          await deleteDoc(doc(db, "products", prod.id));
          deletedCount++;
        } catch (e) {
          console.error(`Error deleting ${prod.id}:`, e);
        }
      }
      setProducts([]);
      safeRemoveItem("alaa_store_products");
      showToast(`Successfully purged ${deletedCount} products from database!`, "success");
    } catch (err: any) {
      showToast(`Error clearing catalog: ${err.message}`, "error");
    } finally {
      setIsClearingAll(false);
      setConfirmClearAll(false);
    }
  };

  // Function to populate the new list of 14 items into Firestore
  const handlePopulate14Products = async () => {
    setIsPopulating14(true);
    let successCount = 0;
    try {
      for (const prod of INITIAL_PRODUCTS) {
        try {
          await setDoc(doc(db, "products", prod.id), prod);
          successCount++;
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `products/${prod.id}`);
        }
      }
      setProducts(INITIAL_PRODUCTS);
      safeSetItem("alaa_store_products", JSON.stringify(INITIAL_PRODUCTS));
      showToast(`Successfully loaded all 14 new CAMERA products to database!`, "success");
    } catch (err: any) {
      showToast(`Error populating products: ${err.message}`, "error");
    } finally {
      setIsPopulating14(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Catalog Management Actions Panel */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-[#0F172A]" />
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Catalog Management & Database Actions
              </h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                Direct Cloud Firestore synchronization controls
              </p>
            </div>
          </div>
          <span className="bg-slate-100 text-slate-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase">
            {products.length} Listed Items
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* Populate 14 Products Button */}
          <button
            type="button"
            disabled={isPopulating14 || isClearingAll}
            onClick={handlePopulate14Products}
            className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-xl transition text-left flex items-center justify-between group cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                {isPopulating14 ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              </div>
              <div>
                <span className="block text-[11px] font-black uppercase tracking-wider">
                  Populate 14 New Products
                </span>
                <span className="block text-[9px] font-bold text-emerald-700/80 uppercase mt-0.5">
                  Loads: Smart Doorbells & Pagers (Range 1-14)
                </span>
              </div>
            </div>
            <Plus size={16} className="text-emerald-700 group-hover:scale-110 transition shrink-0" />
          </button>

          {/* Clear All Products Danger Button */}
          <button
            type="button"
            disabled={isClearingAll || isPopulating14 || products.length === 0}
            onClick={() => setConfirmClearAll(true)}
            className="p-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-900 rounded-xl transition text-left flex items-center justify-between group cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                {isClearingAll ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              </div>
              <div>
                <span className="block text-[11px] font-black uppercase tracking-wider">
                  Clear All Products
                </span>
                <span className="block text-[9px] font-bold text-red-700/80 uppercase mt-0.5">
                  Purges active Firestore product collection
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
          <Package size={36} className="text-slate-300 mx-auto" />
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Your inventory is currently empty</p>
            <p className="text-[10px] text-slate-400 mt-0.5 uppercase">Click 'Populate 14 New Products' above to load the smart doorbell collection.</p>
          </div>
          <button
            type="button"
            disabled={isPopulating14}
            onClick={handlePopulate14Products}
            className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isPopulating14 ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span>Uploading Products...</span>
              </>
            ) : (
              <>
                <Sparkles size={12} className="text-emerald-400" />
                <span>Load 14 Smart Products Now</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {products.map((p) => {
            const hasVariants = p.options && p.options.length > 0 && p.variants && p.variants.length > 0;
            const totalStock = hasVariants
              ? p.variants.reduce((acc, curr) => acc + (curr.stock || 0), 0)
              : (p.stock ?? 0);

            const prices = hasVariants ? p.variants.map((v) => v.price) : [p.basePrice];
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const priceDisplay = minPrice === maxPrice 
              ? `$${minPrice.toFixed(2)}` 
              : `$${minPrice.toFixed(2)}-$${maxPrice.toFixed(2)}`;

            const isOos = totalStock <= 0;
            const isLow = !isOos && totalStock <= 3;

            return (
              <div
                key={p.id}
                id={`manage-item-${p.id}`}
                className="bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-3 shadow-sm hover:border-slate-200 transition"
              >
                {/* Product mini avatar */}
                <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-100 shrink-0 overflow-hidden flex items-center justify-center">
                  {p.imageUrls && p.imageUrls.length > 0 ? (
                    <img
                      src={p.imageUrls[0]}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Package size={18} className="text-slate-300" />
                  )}
                </div>

                {/* Details info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-slate-800 truncate leading-tight">
                    {p.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight bg-slate-50 px-1.5 py-0.25 rounded border border-slate-100">
                      {p.category}
                    </span>
                    <span className="text-[9px] text-slate-500 font-extrabold">{priceDisplay}</span>
                    <span className="text-[9px] text-slate-300">•</span>
                    {isOos ? (
                      <span className="text-[9px] font-bold text-red-600">OOS</span>
                    ) : isLow ? (
                      <span className="text-[9px] font-bold text-amber-600">{totalStock} Left</span>
                    ) : (
                      <span className="text-[9px] font-bold text-green-600">{totalStock} Units</span>
                    )}
                  </div>
                </div>

                {/* Quick Toggle Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    id={`toggle-vis-${p.id}`}
                    type="button"
                    onClick={() => handleToggleVisibility(p.id)}
                    className={`p-1.5 rounded-lg border transition ${
                      p.visible !== false
                        ? "border-green-100 text-green-600 bg-green-50"
                        : "border-slate-200 text-slate-400 bg-slate-50"
                    }`}
                  >
                    {p.visible !== false ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button
                    id={`delete-prod-${p.id}`}
                    type="button"
                    onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
                    className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Confirm Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border-3 border-[#0F172A] rounded-3xl p-6 max-w-sm w-full shadow-[8px_8px_0px_#000] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            
            <div className="text-center space-y-1.5">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Confirm Product Deletion
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed text-center">
                Are you sure you want to permanently delete <strong className="text-slate-800">"{deleteTarget.name}"</strong>? This action cannot be undone and will instantly remove it from the storefront catalog.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 active:scale-98 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-[3px_3px_0px_#000] border border-slate-900"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Clear All Modal */}
      {confirmClearAll && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border-3 border-[#0F172A] rounded-3xl p-6 max-w-sm w-full shadow-[8px_8px_0px_#000] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            
            <div className="text-center space-y-1.5">
              <h3 className="text-sm font-black text-red-600 uppercase tracking-wider">
                WIPE ENTIRE DATABASE?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed text-center">
                Are you absolutely sure you want to delete <strong className="text-red-600 font-extrabold">ALL {products.length} products</strong> from Firestore? This is a permanent action that will completely empty your active store catalog.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isClearingAll}
                onClick={() => setConfirmClearAll(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearingAll}
                onClick={handleClearAllProducts}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 active:scale-98 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-[3px_3px_0px_#000] border border-slate-900 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isClearingAll ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <span>Wipe All</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync footer block */}
      <button
        id="sync-sheets-btn"
        type="button"
        onClick={() => showToast("Google Sheets Sync requires OAuth Setup", "error")}
        className="w-full mt-2.5 border-2 border-dashed border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-500 rounded-xl py-3 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 bg-slate-50/50 hover:bg-slate-50 transition"
      >
        <RefreshCw size={12} /> Sync Database to Google Sheets
      </button>
    </div>
  );
};
