import React from "react";
import { Product } from "../types";
import { Image, Layers, DollarSign, Package, Eye, EyeOff } from "lucide-react";

interface AdminTableProps {
  products: Product[];
  onToggleVisibility?: (product: Product) => void;
  onDeleteProduct?: (id: string) => void;
}

export const AdminTable: React.FC<AdminTableProps> = ({
  products,
  onToggleVisibility,
  onDeleteProduct,
}) => {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Product Info</th>
            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Category</th>
            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Price</th>
            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Stock Status</th>
            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Status</th>
            {(onToggleVisibility || onDeleteProduct) && (
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400 font-medium">
                No products found in Firestore. Add a product above to get started.
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50/50 transition">
                {/* Product Info */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Image size={16} className="text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 max-w-[200px]">
                      <span className="block text-xs font-black text-slate-800 truncate" title={product.name}>
                        {product.name}
                      </span>
                      <span className="block text-[10px] text-slate-400 truncate font-semibold" title={product.desc}>
                        {product.desc || "No description provided."}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-[10px] font-black bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200 uppercase tracking-wider">
                    <Layers size={10} />
                    {product.category}
                  </span>
                </td>

                {/* Price */}
                <td className="px-4 py-3">
                  <span className="text-xs font-black text-slate-800 flex items-center">
                    <DollarSign size={11} className="text-slate-400 -mr-0.5" />
                    {product.basePrice.toFixed(2)}
                  </span>
                </td>

                {/* Stock */}
                <td className="px-4 py-3">
                  {product.variants && product.variants.length > 0 ? (
                    <span className="text-[10px] font-black text-yellow-600 bg-yellow-50 border border-yellow-100 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                      {product.variants.length} Variants
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                      product.stock > 0 
                        ? "bg-green-50 border-green-100 text-green-700" 
                        : "bg-red-50 border-red-100 text-red-700"
                    }`}>
                      <Package size={10} />
                      {product.stock > 0 ? `${product.stock} Units` : "Out of Stock"}
                    </span>
                  )}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider ${
                    product.visible ? "text-green-600" : "text-slate-400"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      product.visible ? "bg-green-500 animate-pulse" : "bg-slate-300"
                    }`} />
                    {product.visible ? "Listed" : "Hidden"}
                  </span>
                </td>

                {/* Actions */}
                {(onToggleVisibility || onDeleteProduct) && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {onToggleVisibility && (
                        <button
                          onClick={() => onToggleVisibility(product)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-95 transition"
                          title={product.visible ? "Hide from Store" : "Show on Store"}
                        >
                          {product.visible ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      )}
                      {onDeleteProduct && (
                        <button
                          onClick={() => onDeleteProduct(product.id)}
                          className="p-1.5 rounded-lg border border-red-100 text-red-500 hover:text-red-700 hover:bg-red-50 active:scale-95 transition font-black text-[10px] uppercase tracking-wider"
                          title="Delete Product"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
