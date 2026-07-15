import React, { useState, useRef } from "react";
import { Plus, Trash2, Upload, AlertCircle, Sparkles, Layers, X } from "lucide-react";
import { Product, ProductOption, Variant } from "../types";
import { sanitizeInput } from "../lib/security";
import { compressImage } from "../lib/storage";

// Firebase/Firestore Imports
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface ProductFormProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  showToast: (msg: string, type?: "success" | "error") => void;
  onSuccess: () => void;
}

const PRESETS = ["Power bank", "Shaving Machine", "Watch", "Mobile", "Accessories", "Cables", "Cases"];

export const ProductForm: React.FC<ProductFormProps> = ({
  products,
  setProducts,
  showToast,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core Form State
  const [name, setName] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [category, setCategory] = useState("Power bank");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [desc, setDesc] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [baseStock, setBaseStock] = useState("10"); // Standard single-product stock quantity
  const [isVariable, setIsVariable] = useState(false);

  // Dynamic Options (for variants)
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [variantPriceOverrides, setVariantPriceOverrides] = useState<Record<string, string>>({});
  const [variantStockOverrides, setVariantStockOverrides] = useState<Record<string, string>>({});

  // File Upload Handler for multiple images with client-side compression
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);
    const loadPromises = fileList.map((file: File) => {
      return compressImage(file, 800, 800, 0.7);
    });

    Promise.all(loadPromises).then((results) => {
      const validImages = results.filter((img): img is string => img !== null);
      if (validImages.length > 0) {
        setImageUrls((prev) => [...prev, ...validImages]);
        showToast(`${validImages.length} image(s) loaded and compressed successfully!`, "success");
      }
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    showToast("Image removed", "success");
  };

  // Option Handling
  const handleAddOption = () => {
    if (options.length >= 2) {
      showToast("Maximum of 2 option categories (e.g. Size & Color) for mobile layouts", "error");
      return;
    }
    setOptions([...options, { name: "", values: [""] }]);
    setIsVariable(true);
  };

  const handleRemoveOption = (index: number) => {
    const updated = options.filter((_, idx) => idx !== index);
    setOptions(updated);
    if (updated.length === 0) {
      setIsVariable(false);
    }
  };

  const handleOptionNameChange = (index: number, nameValue: string) => {
    setOptions((prev) =>
      prev.map((opt, idx) => (idx === index ? { ...opt, name: nameValue } : opt))
    );
  };

  const handleOptionValuesChange = (index: number, valuesString: string) => {
    const splitVals = valuesString
      .split(",")
      .map((s) => s.trim())
      .filter((v) => v.length > 0);
    setOptions((prev) =>
      prev.map((opt, idx) => (idx === index ? { ...opt, values: splitVals } : opt))
    );
  };

  // Cartesian combinations calculation
  const generateCombinations = (): Array<Record<string, string>> => {
    const validOpts = options.filter((o) => o.name.trim() && o.values.length > 0);
    if (validOpts.length === 0) return [];

    const recurse = (
      index: number,
      current: Record<string, string>
    ): Array<Record<string, string>> => {
      if (index === validOpts.length) {
        return [current];
      }
      const opt = validOpts[index];
      let results: Array<Record<string, string>> = [];
      opt.values.forEach((val) => {
        results = results.concat(recurse(index + 1, { ...current, [opt.name]: val }));
      });
      return results;
    };

    return recurse(0, {});
  };

  const combinations = generateCombinations();

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast("Product Name is required", "error");
      return;
    }
    if (!basePrice || parseFloat(basePrice) <= 0) {
      showToast("Valid Base Price is required", "error");
      return;
    }

    const finalCategory = showNewCategoryInput
      ? newCategoryName.trim() || "Uncategorized"
      : category;

    const finalBasePrice = parseFloat(basePrice);
    const finalBaseStock = parseInt(baseStock) || 0;

    let finalVariants: Variant[] = [];

    if (isVariable && combinations.length > 0) {
      finalVariants = combinations.map((combo, idx) => {
        const comboKey = Object.values(combo).join(" / ");
        const overridePrice = variantPriceOverrides[comboKey];
        const overrideStock = variantStockOverrides[comboKey];

        return {
          id: `var-${Math.random().toString(36).substring(2, 9)}-${idx}`,
          combo,
          price: overridePrice ? parseFloat(overridePrice) : finalBasePrice,
          stock: overrideStock ? parseInt(overrideStock) : 5, // Default stock of 5 for variants if not set
        };
      });
    }

    const sanitizedName = sanitizeInput(name);
    const sanitizedCategory = sanitizeInput(finalCategory);
    const sanitizedDesc = sanitizeInput(desc);

    const sanitizedOptions = isVariable 
      ? options
          .filter((o) => o.name.trim() && o.values.length > 0)
          .map((o) => ({
            name: sanitizeInput(o.name),
            values: o.values.map((v) => sanitizeInput(v))
          }))
      : [];

    const newProduct: Product = {
      id: `prod-${Math.random().toString(36).substring(2, 9)}`,
      name: sanitizedName,
      category: sanitizedCategory,
      basePrice: finalBasePrice,
      desc: sanitizedDesc,
      imageUrl: imageUrls[0] || null,
      imageUrls: imageUrls,
      stock: isVariable ? 0 : finalBaseStock,
      visible: true,
      options: sanitizedOptions,
      variants: finalVariants,
    };

    // Write product data directly to Firestore 'products' collection
    setDoc(doc(db, "products", newProduct.id), newProduct)
      .then(() => {
        showToast(`"${sanitizedName}" successfully saved to cloud database!`, "success");
      })
      .catch((error) => {
        console.error("Error writing document to Firestore: ", error);
        // Fallback: update local products array directly
        setProducts((prev) => [...prev, newProduct]);
        showToast(`Offline Mode: "${sanitizedName}" saved locally!`, "success");
      });

    // Reset Form Fields
    setName("");
    setBasePrice("");
    setDesc("");
    setImageUrls([]);
    setBaseStock("10");
    setOptions([]);
    setIsVariable(false);
    setVariantPriceOverrides({});
    setVariantStockOverrides({});
    setNewCategoryName("");
    setShowNewCategoryInput(false);

    onSuccess(); // Switch back to 'Manage' tab
  };

  // Get distinct list of existing categories for dropdown list
  const existingCategories = Array.from(new Set(products.map((p) => p.category)));
  const allCategories = Array.from(new Set([...PRESETS, ...existingCategories]));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Visual Header / Prompt */}
      <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
        <Layers size={14} className="text-yellow-500" />
        <span>Create New Listing</span>
      </div>

      {/* Image Uploader */}
      <div className="space-y-2">
        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
          Product Images (Multi-Image Supported) *
        </label>
        
        <div 
          className="grid grid-cols-4 gap-2.5"
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add("border-yellow-400", "bg-yellow-50/10");
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("border-yellow-400", "bg-yellow-50/10");
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("border-yellow-400", "bg-yellow-50/10");
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
              const fileList: File[] = (Array.from(files) as File[]).filter((f: File) => f.type.startsWith("image/"));
              if (fileList.length > 0) {
                const loadPromises = fileList.map((file: File) => {
                  return compressImage(file, 800, 800, 0.7);
                });
                Promise.all(loadPromises).then((results) => {
                  const validImages = results.filter((img): img is string => img !== null);
                  if (validImages.length > 0) {
                    setImageUrls((prev) => [...prev, ...validImages]);
                    showToast(`Dropped ${validImages.length} image(s) and compressed successfully!`, "success");
                  }
                });
              } else {
                showToast("Please drop valid image files.", "error");
              }
            }
          }}
        >
          {imageUrls.map((url, idx) => (
            <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 group shadow-sm">
              <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(idx);
                }}
                className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center shadow transition-all active:scale-90"
                title="Remove image"
              >
                <X size={10} strokeWidth={3} />
              </button>
              <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider text-white">
                Img {idx + 1}
              </div>
            </div>
          ))}
          
          <div
            id="multi-image-dropzone"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-slate-300 hover:border-yellow-400 rounded-2xl flex flex-col items-center justify-center bg-slate-50 hover:bg-yellow-50/20 cursor-pointer transition-all p-2 group text-center"
          >
            <Upload size={16} className="text-slate-400 group-hover:text-yellow-600 mb-1 transition active:scale-95" />
            <span className="text-[9px] font-black text-slate-700 uppercase tracking-tight">Add Photo</span>
            <span className="text-[7px] text-slate-400 mt-0.5 uppercase font-bold">Max 4MB</span>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageChange}
        />
        <p className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider leading-relaxed">
          Drag & drop files or click to add multiple product photos. Replaces the single image upload.
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-3">
        <div>
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
            Product Name *
          </label>
          <input
            id="new-product-name"
            type="text"
            required
            placeholder="e.g. Green Lion Pocket 10000mAh"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition font-semibold"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
              Base Price (USD) *
            </label>
            <input
              id="new-product-price"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="e.g. 20.00"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition font-semibold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex justify-between items-center">
              <span>Category</span>
              <button
                id="toggle-new-category-btn"
                type="button"
                onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
                className="text-[9px] text-yellow-500 font-extrabold tracking-tight hover:underline focus:outline-none uppercase"
              >
                {showNewCategoryInput ? "Select List" : "+ New"}
              </button>
            </label>

            {showNewCategoryInput ? (
              <input
                id="new-category-input"
                type="text"
                required
                placeholder="New Category Name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition font-semibold"
              />
            ) : (
              <select
                id="select-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition font-semibold"
              >
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Quick presets selectors */}
        <div>
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
            Category Presets
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setCategory(preset);
                  setShowNewCategoryInput(false);
                }}
                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                  category === preset && !showNewCategoryInput
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
            Description
          </label>
          <textarea
            id="new-product-desc"
            placeholder="Introduce details, capacity, charging speeds..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={2}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition font-semibold resize-none"
          />
        </div>

        {/* Variable Switch */}
        <div className="flex items-center justify-between border border-slate-100 rounded-xl p-3 bg-slate-50/50">
          <div>
            <span className="text-xs font-black text-slate-800 block">Has Variants / Options?</span>
            <span className="text-[10px] text-slate-400 font-semibold block">Enable for colors, sizes, or capacity.</span>
          </div>
          <button
            id="toggle-variable-btn"
            type="button"
            onClick={() => setIsVariable(!isVariable)}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              isVariable ? "bg-yellow-400" : "bg-slate-200"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                isVariable ? "translate-x-5.5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Dynamic Options Fields */}
        {isVariable ? (
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-slate-800">Custom Variants</span>
              <button
                id="add-option-row-btn"
                type="button"
                onClick={handleAddOption}
                className="text-[10px] font-black bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
              >
                <Plus size={12} /> Add Option
              </button>
            </div>

            {options.length === 0 && (
              <p className="text-[10px] text-slate-400 italic font-semibold">
                Tap "Add Option" above to establish variable properties (e.g. Color, Size).
              </p>
            )}

            {options.map((opt, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 relative shadow-sm">
                <button
                  id={`remove-option-${index}`}
                  type="button"
                  onClick={() => handleRemoveOption(index)}
                  className="absolute right-3 top-3 text-slate-300 hover:text-red-500 transition"
                >
                  <Trash2 size={13} />
                </button>

                <div className="grid grid-cols-2 gap-2 pr-6">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                      Option Type
                    </label>
                    <input
                      id={`option-name-input-${index}`}
                      type="text"
                      required
                      placeholder="e.g. Color"
                      value={opt.name}
                      onChange={(e) => handleOptionNameChange(index, e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-yellow-400 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                      Values (Comma split)
                    </label>
                    <input
                      id={`option-values-input-${index}`}
                      type="text"
                      required
                      placeholder="e.g. Black, White, Blue"
                      value={opt.values.join(", ")}
                      onChange={(e) => handleOptionValuesChange(index, e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-yellow-400 font-semibold"
                    />
                  </div>
                </div>
              </div>
            ))}

            {combinations.length > 0 && (
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={11} className="text-yellow-500" />
                  Variant Pricing & Stock overrides
                </p>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {combinations.map((combo, idx) => {
                    const label = Object.values(combo).join(" / ");
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl p-2 shadow-sm"
                      >
                        <span className="text-[10px] font-black text-slate-700 flex-1 truncate">
                          {label}
                        </span>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Price"
                            value={variantPriceOverrides[label] ?? ""}
                            onChange={(e) =>
                              setVariantPriceOverrides((prev) => ({
                                ...prev,
                                [label]: e.target.value,
                              }))
                            }
                            className="w-18 p-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-center outline-none focus:ring-1 focus:ring-yellow-400"
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="Stock"
                            value={variantStockOverrides[label] ?? ""}
                            onChange={(e) =>
                              setVariantStockOverrides((prev) => ({
                                ...prev,
                                [label]: e.target.value,
                              }))
                            }
                            className="w-16 p-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-center outline-none focus:ring-1 focus:ring-yellow-400"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Standard Stock Quantity input */
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
              Stock Quantity *
            </label>
            <input
              id="new-product-stock"
              type="number"
              min="0"
              required
              placeholder="e.g. 10"
              value={baseStock}
              onChange={(e) => setBaseStock(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition font-semibold"
            />
          </div>
        )}
      </div>

      {/* Warning regarding real-time persistency */}
      <div className="flex gap-2 bg-yellow-50 border border-yellow-100 text-yellow-800 p-2.5 rounded-xl">
        <AlertCircle size={15} className="shrink-0 mt-0.5" />
        <p className="text-[10px] font-medium leading-relaxed">
          Adding products updates local RAM. In a production build, link to Cloud SQL or Firestore for permanent synchronization.
        </p>
      </div>

      <button
        id="submit-product-btn"
        type="submit"
        className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black py-3.5 rounded-xl transition shadow-md shadow-yellow-400/10 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
      >
        <Plus size={15} /> Add Product to Catalog
      </button>
    </form>
  );
};
