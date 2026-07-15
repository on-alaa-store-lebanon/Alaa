import React from "react";
import { Package, Truck, DollarSign, TrendingUp, Sparkles } from "lucide-react";
import { Product, Order } from "../types";

interface AdminKPIsProps {
  products: Product[];
  orders: Order[];
}

export const AdminKPIs: React.FC<AdminKPIsProps> = ({ products = [], orders = [] }) => {
  const totalCatalogItems = (products || []).length;
  const totalOrders = (orders || []).length;
  const totalSalesValue = (orders || []).reduce((acc, curr) => acc + (curr?.total || 0), 0);

  // Compute stats on active inventory
  const totalStockCount = (products || []).reduce((acc, p) => {
    if (!p) return acc;
    if (p.options?.length > 0 && p.variants?.length > 0) {
      return acc + (p.variants || []).reduce((vs, v) => vs + ((v && v.stock) || 0), 0);
    }
    return acc + (p.stock || 0);
  }, 0);

  return (
    <div className="space-y-4">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* KPI 1: Catalog Items */}
        <div 
          id="kpi-catalog-items"
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-inner"
        >
          <div className="flex items-center gap-1.5 text-amber-400 mb-2">
            <Package size={14} strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase tracking-widest">Catalog</span>
          </div>
          <div>
            <p className="text-xl md:text-2xl font-black text-white tracking-tight leading-none">
              {totalCatalogItems}
            </p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1.5">
              {totalStockCount} Units
            </p>
          </div>
        </div>

        {/* KPI 2: Total Orders */}
        <div 
          id="kpi-total-orders"
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-inner"
        >
          <div className="flex items-center gap-1.5 text-green-400 mb-2">
            <Truck size={14} strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase tracking-widest">Orders</span>
          </div>
          <div>
            <p className="text-xl md:text-2xl font-black text-white tracking-tight leading-none">
              {totalOrders}
            </p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1.5">
              WhatsApp Log
            </p>
          </div>
        </div>

        {/* KPI 3: Total Sales */}
        <div 
          id="kpi-total-sales"
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-inner"
        >
          <div className="flex items-center gap-1.5 text-sky-400 mb-2">
            <TrendingUp size={14} strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase tracking-widest">Sales</span>
          </div>
          <div>
            <p className="text-xl md:text-2xl font-black text-white tracking-tight leading-none">
              ${totalSalesValue.toFixed(2)}
            </p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1.5">
              Gross Value
            </p>
          </div>
        </div>
      </div>

      {/* Admin Action Badge */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-sm shadow-amber-400/20">
            <Sparkles size={16} className="animate-spin-slow" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-white uppercase tracking-wider leading-none">ALAA E-Commerce Engine</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-1.5">Terminal Sync Active (LB)</p>
          </div>
        </div>
        <span className="text-[9px] font-black tracking-widest text-green-400 bg-green-500/10 px-2.5 py-1 rounded-lg uppercase shrink-0 border border-green-500/10">
          Sync Live
        </span>
      </div>
    </div>
  );
};
