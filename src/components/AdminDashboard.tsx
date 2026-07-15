import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Upload, 
  AlertCircle, 
  Layers, 
  X, 
  Sparkles, 
  Shield, 
  Check, 
  Loader2, 
  LayoutGrid,
  FileImage,
  RefreshCw
} from "lucide-react";
import { Product } from "../types";
import { sanitizeInput } from "../lib/security";
import { compressImage } from "../lib/storage";

// Firebase/Firestore/Storage imports
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc 
} from "firebase/firestore";
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from "firebase/storage";
import { db, storage } from "../lib/firebase";

import { AdminTable } from "./AdminTable";

interface AdminDashboardProps {
  showToast: (msg: string, type?: "success" | "error") => void;
  // Security Hook: Pass standard auth user object if available
  currentUser?: { username: string; role?: string } | null;
}

const CATEGORY_PRESETS = ["Power bank", "Shaving Machine", "Watch", "Mobile", "Accessories", "Cables", "Cases"];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ showToast, currentUser }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Firestore Products local cache state
  const [products, setProducts] = useState<Product[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  // Core Form State
  const [name, setName] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [category, setCategory] = useState("Power bank");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [desc, setDesc] = useState("");
  const [stock, setStock] = useState("10");

  // Storage Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch current database items on mount
  const fetchProducts = async () => {
    setIsFetching(true);
    setErrorMessage(null);
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const list: Product[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      setProducts(list);
    } catch (error: any) {
      console.error("Firestore fetch error:", error);
      setErrorMessage(`Failed to fetch database products: ${error?.message || error}`);
      showToast("Could not retrieve current catalog from database.", "error");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showToast("Please choose a valid image file", "error");
        return;
      }
      setSelectedFile(file);
      setUploadedUrl(null); // Clear previous URL if selecting new file
      showToast("Image selected successfully. Press submit to upload and save.", "success");
    }
  };

  // Upload file to Firebase Cloud Storage and return download URL
  const uploadImageToStorage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Create a unique file path name in Storage
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const storageRef = ref(storage, `products/${fileName}`);

      // Start upload task
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Monitor upload percentage progress
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Firebase Storage Upload Error:", error);
          reject(new Error(`Storage Upload failed: ${error.message}`));
        },
        async () => {
          // Upload complete, get public download url
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          } catch (urlErr: any) {
            reject(new Error(`Failed to retrieve download URL: ${urlErr.message}`));
          }
        }
      );
    });
  };

  // Form Submit Action (Full Storage -> Firestore write cycle)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic Validations
    if (!name.trim()) {
      setErrorMessage("Product Name is required.");
      return;
    }
    if (!basePrice || parseFloat(basePrice) <= 0) {
      setErrorMessage("Please enter a valid base price greater than 0.");
      return;
    }
    if (parseInt(stock) < 0) {
      setErrorMessage("Stock cannot be negative.");
      return;
    }

    setIsSubmitting(true);
    let finalImageUrl = uploadedUrl;

    try {
      // Step 1: Upload to Cloud Storage if a new file is chosen
      if (selectedFile) {
        showToast("Uploading product image to Firebase Storage...", "success");
        finalImageUrl = await uploadImageToStorage(selectedFile);
        setUploadedUrl(finalImageUrl);
      }

      // Step 2: Sanitize Form Fields for database security (No XSS injection)
      const sanitizedName = sanitizeInput(name);
      const finalCategory = showNewCategoryInput
        ? sanitizeInput(newCategoryName.trim()) || "Uncategorized"
        : sanitizeInput(category);
      const sanitizedDesc = sanitizeInput(desc);

      // Generate a new Firestore Document Reference ID
      const newProductId = `prod-${Math.random().toString(36).substring(2, 9)}`;

      const newProduct: Product = {
        id: newProductId,
        name: sanitizedName,
        category: finalCategory,
        basePrice: parseFloat(basePrice),
        desc: sanitizedDesc,
        imageUrl: finalImageUrl,
        imageUrls: finalImageUrl ? [finalImageUrl] : [],
        stock: parseInt(stock) || 0,
        visible: true,
        options: [],
        variants: [],
      };

      // Step 3: Write Document Object to Firestore 'products' collection
      showToast("Writing document registry to Firestore...", "success");
      await setDoc(doc(db, "products", newProduct.id), newProduct);

      // Success Notification & Reset State
      showToast(`"${sanitizedName}" successfully listed in active catalog!`, "success");
      
      // Step 4: Verification update (Trigger state update immediately below)
      setProducts((prev) => [newProduct, ...prev]);

      // Complete Form Reset
      setName("");
      setBasePrice("");
      setDesc("");
      setStock("10");
      setSelectedFile(null);
      setUploadProgress(null);
      setUploadedUrl(null);
      setNewCategoryName("");
      setShowNewCategoryInput(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

    } catch (err: any) {
      console.error("Firebase transaction cycle error:", err);
      setErrorMessage(err?.message || "An unexpected error occurred while saving the product.");
      showToast("Failed to complete product catalog registration.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Visibility in active storefront directly
  const handleToggleVisibility = async (product: Product) => {
    try {
      const docRef = doc(db, "products", product.id);
      await updateDoc(docRef, { visible: !product.visible });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, visible: !p.visible } : p))
      );
      showToast(`Product visibility toggled.`, "success");
    } catch (error: any) {
      showToast(`Failed to update product visibility: ${error.message}`, "error");
    }
  };

  // Delete product entry from Firestore database
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product from active listing database?")) {
      return;
    }
    try {
      await deleteDoc(doc(db, "products", id));
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast("Product deleted successfully from database.", "success");
    } catch (error: any) {
      showToast(`Failed to delete product: ${error.message}`, "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* RBAC Modular Auth Banner */}
      <div className="bg-[#0F172A] text-white p-4 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between border border-slate-800 shadow-md gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-yellow-400 shrink-0">
            <Shield size={18} strokeWidth={2.5} />
          </div>
          <div>
            <span className="block text-xs font-black uppercase tracking-widest text-slate-200">
              Database Console Workspace
            </span>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Role: {currentUser?.role || "Staff Manager (RBAC Mock/Session Auth)"} {currentUser && `[ID: ${currentUser.username}]`}
            </span>
          </div>
        </div>
        
        <button
          onClick={fetchProducts}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white transition disabled:opacity-50"
        >
          <RefreshCw size={10} className={isFetching ? "animate-spin" : ""} />
          Sync Firestore
        </button>
      </div>

      {/* Main Grid: Form Left, Security Info Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Container */}
        <div className="lg:col-span-2 bg-white border-2 border-slate-100 rounded-[32px] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <LayoutGrid size={16} className="text-yellow-500" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              Add New Cloud Listing
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image File Uploader */}
            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">
                Cloud Storage Image File *
              </label>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  selectedFile 
                    ? "border-green-400 bg-green-50/10" 
                    : "border-slate-300 hover:border-yellow-400 bg-slate-50 hover:bg-slate-50/80"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                {selectedFile ? (
                  <div className="space-y-1 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shadow-sm">
                      <FileImage size={18} />
                    </div>
                    <span className="block text-xs font-black text-slate-800 max-w-[240px] truncate">
                      {selectedFile.name}
                    </span>
                    <span className="block text-[9px] text-slate-400 uppercase font-black">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to Upload
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5 flex flex-col items-center">
                    <Upload size={20} className="text-slate-400" />
                    <span className="block text-xs font-black text-slate-700 uppercase tracking-tight">
                      Choose Image File
                    </span>
                    <span className="block text-[8px] text-slate-400 uppercase font-bold leading-normal">
                      Drag and drop image or click to choose file<br />
                      File is uploaded securely on save to Cloud Storage
                    </span>
                  </div>
                )}
              </div>

              {/* Upload Progress Bar */}
              {uploadProgress !== null && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-wider">
                    <span>Uploading Image File</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Product Name */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 pl-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Green Lion Power Bank 20000mAh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition font-semibold"
                />
              </div>

              {/* Base Price */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 pl-1">
                  Base Price (USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 29.99"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition font-semibold"
                />
              </div>

              {/* Stock */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 pl-1">
                  Inventory Stock *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="e.g. 15"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition font-semibold"
                />
              </div>

              {/* Category Picker */}
              <div className="sm:col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">
                    Catalog Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
                    className="text-[9px] text-yellow-600 font-extrabold tracking-tight hover:underline uppercase"
                  >
                    {showNewCategoryInput ? "Select Existing" : "+ Create Custom"}
                  </button>
                </div>

                {showNewCategoryInput ? (
                  <input
                    type="text"
                    required
                    placeholder="Enter Custom Category Name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition font-semibold animate-fade-in"
                  />
                ) : (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition font-semibold"
                  >
                    {CATEGORY_PRESETS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 pl-1">
                  Product Description
                </label>
                <textarea
                  placeholder="Introduce battery capacities, charge ports, visual options, etc..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition font-semibold resize-none"
                />
              </div>
            </div>

            {/* Error Message Container */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 p-3 rounded-2xl text-[10px] font-black uppercase tracking-wide">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white disabled:bg-slate-300 font-black py-3.5 rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin text-yellow-400" />
                  <span>Processing Cloud Transaction...</span>
                </>
              ) : (
                <>
                  <Plus size={14} strokeWidth={3} className="text-yellow-400" />
                  <span>Upload & Save to Firestore</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Checklist Sidebar */}
        <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Shield size={16} className="text-[#0F172A]" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Firebase Security Checklist
            </h3>
          </div>

          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide leading-relaxed">
            Verify these rules in your Firebase Console to ensure zero permission errors:
          </p>

          <div className="space-y-3.5 pt-1 text-[10px] leading-relaxed">
            {/* Point 1 */}
            <div className="flex gap-2.5">
              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-black text-[9px] flex items-center justify-center shrink-0">1</div>
              <div>
                <span className="block font-black text-slate-700 uppercase tracking-wider">Cloud Storage Rules</span>
                <p className="text-slate-500 font-medium">Verify that the Storage rules allow writes from authenticated users or have proper read/write paths:</p>
                <pre className="mt-1 bg-slate-900 text-yellow-400 text-[8px] p-2 rounded-xl overflow-x-auto font-mono">
{`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}`}
                </pre>
              </div>
            </div>

            {/* Point 2 */}
            <div className="flex gap-2.5">
              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-black text-[9px] flex items-center justify-center shrink-0">2</div>
              <div>
                <span className="block font-black text-slate-700 uppercase tracking-wider">Firestore Rules</span>
                <p className="text-slate-500 font-medium">Ensure your firestore.rules allows staff access to compile products but public to view:</p>
                <pre className="mt-1 bg-slate-900 text-yellow-400 text-[8px] p-2 rounded-xl overflow-x-auto font-mono">
{`match /products/{productId} {
  allow read: if true;
  allow write: if request.auth != null;
}`}
                </pre>
              </div>
            </div>

            {/* Point 3 */}
            <div className="flex gap-2.5">
              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-black text-[9px] flex items-center justify-center shrink-0">3</div>
              <div>
                <span className="block font-black text-slate-700 uppercase tracking-wider">Storage Bucket Config</span>
                <p className="text-slate-500 font-semibold">Confirm Google Cloud Storage CORS policies are loaded correctly if images show broken links across alternate domains.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Data Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-[#0F172A] uppercase tracking-widest flex items-center gap-1">
            <Check size={14} strokeWidth={3} className="text-green-500 animate-pulse" />
            Live Cloud Verification Database
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            Showing {products.length} registered item(s)
          </span>
        </div>
        
        {isFetching ? (
          <div className="border border-slate-200 bg-white rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 size={24} className="text-slate-400 animate-spin" />
            <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Synchronizing with Cloud Firestore...</span>
          </div>
        ) : (
          <AdminTable 
            products={products}
            onToggleVisibility={handleToggleVisibility}
            onDeleteProduct={handleDeleteProduct}
          />
        )}
      </div>
    </div>
  );
};
