import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Truck, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  ExternalLink, 
  Calendar, 
  DollarSign, 
  ClipboardList, 
  Filter, 
  User, 
  MapPin, 
  PhoneCall,
  X,
  Printer,
  Clock,
  CheckCircle,
  CreditCard,
  ChevronRight,
  AlertCircle,
  Copy,
  Check
} from "lucide-react";
import { Order } from "../types";
import { WAIcon } from "./WAIcon";

interface OrdersTabProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  lang?: "en" | "ar";
}

const STATUS_OPTIONS: Order["status"][] = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

const STATUS_STYLING: Record<Order["status"], string> = {
  Pending: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  Processing: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  Shipped: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
  Delivered: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
  Cancelled: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
};

const STEPPER_STATUSES: Order["status"][] = ["Pending", "Processing", "Shipped", "Delivered"];

const LOCAL_TRANSLATIONS = {
  en: {
    orders_db: "Active Orders Database",
    total_logged: "Total Logged",
    search_placeholder: "Search by customer name, order ID, or address...",
    all: "All",
    info: "Info",
    order_id: "Order ID",
    customer: "Customer",
    date: "Date",
    total_amount: "Total Amount",
    status: "Status",
    actions: "Actions",
    no_orders: "No matching orders found",
    no_orders_sub: "Try adjusting your search query or status filters.",
    details: "Details",
    placed_on: "Placed On",
    payment: "Payment",
    customer_profile: "Customer Profile",
    delivery_logistics: "Delivery Logistics",
    contact_phone: "Contact Phone",
    payment_status: "Payment Status",
    billing_method: "Billing Method",
    contact_client: "Contact Client",
    direct_call: "Direct Call",
    locate_on_map: "Locate on Map",
    itemized_breakdown: "Itemized Receipt Breakdown",
    item_details: "Item Details",
    qty: "Qty",
    unit_price: "Unit Price",
    total: "Total",
    invoice_subtotal: "Invoice Subtotal",
    shipping_fee: "Standard / Express Shipping",
    grand_total: "Grand Total",
    amount_charged: "Amount Charged",
    fulfillment_roadmap: "Fulfillment Roadmap",
    current_status: "Current",
    cancel_order: "Cancel Order",
    reopen_order: "Reopen Order",
    reopen_reactivate: "Reopen / Reactivate",
    start_processing: "Start Processing",
    dispatch_ship: "Dispatch & Ship",
    mark_delivered: "Mark Delivered",
    complete: "Complete",
    invoice_no: "Invoice No",
    print_invoice: "Print Invoice",
    close_details: "Close Details",
    toggle: "Toggle",
    whatsapp_status: "WhatsApp Status",
    order_cancelled_title: "Order Cancelled",
    order_cancelled_desc: "No further fulfillment steps are required for this order.",
    thank_you: "Thank you for shopping at ON ALAA STORE!",
    support_line: "For any support queries, contact us on +961 71 135 241 or email support@alaastore.com",
    copied: "Copied!",
    copy_field: "Copy"
  },
  ar: {
    orders_db: "قاعدة بيانات الطلبات النشطة",
    total_logged: "إجمالي الطلبات المسجلة",
    search_placeholder: "ابحث باسم العميل أو رقم الطلب أو العنوان...",
    all: "الكل",
    info: "التفاصيل",
    order_id: "رقم الطلب",
    customer: "العميل",
    date: "التاريخ",
    total_amount: "المبلغ الإجمالي",
    status: "الحالة",
    actions: "الإجراءات",
    no_orders: "لم يتم العثور على طلبات مطابقة",
    no_orders_sub: "حاول تغيير نص البحث أو تصفية الحالات.",
    details: "التفاصيل",
    placed_on: "تاريخ الطلب",
    payment: "الدفع",
    customer_profile: "ملف العميل",
    delivery_logistics: "لوجستيات التوصيل",
    contact_phone: "هاتف الاتصال",
    payment_status: "حالة الدفع",
    billing_method: "طريقة الدفع",
    contact_client: "التواصل مع العميل",
    direct_call: "اتصال مباشر",
    locate_on_map: "تحديد الموقع على الخريطة",
    itemized_breakdown: "تفصيل إيصال المواد",
    item_details: "تفاصيل المنتج",
    qty: "الكمية",
    unit_price: "سعر الوحدة",
    total: "المجموع",
    invoice_subtotal: "المجموع الفرعي للفاتورة",
    shipping_fee: "الشحن العادي / السريع",
    grand_total: "المجموع الكلي",
    amount_charged: "المبلغ المطلوب دفعه",
    fulfillment_roadmap: "مسار التجهيز والشحن",
    current_status: "الحالة الحالية",
    cancel_order: "إلغاء الطلب",
    reopen_order: "إعادة فتح الطلب",
    reopen_reactivate: "إعادة تنشيط الطلب",
    start_processing: "بدء التجهيز",
    dispatch_ship: "شحن وإرسال",
    mark_delivered: "تم التوصيل بنجاح",
    complete: "مكتمل",
    invoice_no: "رقم الفاتورة",
    print_invoice: "طباعة الفاتورة",
    close_details: "إغلاق التفاصيل",
    toggle: "تبديل",
    whatsapp_status: "حالة واتساب",
    order_cancelled_title: "تم إلغاء الطلبية",
    order_cancelled_desc: "لا توجد خطوات تلبية إضافية مطلوبة لهذا الطلب.",
    thank_you: "شكرًا لتسوقكم في متجر علاء!",
    support_line: "لأية استفسارات أو دعم، اتصل بنا على +961 71 135 241 أو البريد الإلكتروني support@alaastore.com",
    copied: "تم النسخ!",
    copy_field: "نسخ"
  }
};

const getStatusLabel = (status: Order["status"], l: "en" | "ar") => {
  if (l === "ar") {
    switch (status) {
      case "Pending": return "قيد الانتظار";
      case "Processing": return "قيد التجهيز";
      case "Shipped": return "تم الشحن";
      case "Delivered": return "تم التوصيل";
      case "Cancelled": return "ملغي";
      default: return status;
    }
  }
  return status;
};

const getPaymentStatusLabel = (pStatus: string | undefined, l: "en" | "ar") => {
  const status = pStatus || "Unpaid";
  if (l === "ar") {
    switch (status) {
      case "Paid": return "مدفوع";
      case "Unpaid": return "غير مدفوع";
      case "Authorized": return "مصرح به";
      default: return status;
    }
  }
  return status;
};

const getPaymentMethodLabel = (pm: string | undefined, l: "en" | "ar") => {
  const method = pm || "COD";
  if (l === "ar") {
    if (method.toLowerCase() === "card" || method.toLowerCase() === "credit card") {
      return "بطاقة ائتمان";
    }
    return "الدفع عند الاستلام";
  }
  return method.toUpperCase();
};

export const OrdersTab: React.FC<OrdersTabProps> = ({ orders, setOrders, lang }) => {
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const l = lang || "en";
  const t = LOCAL_TRANSLATIONS[l];

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleUpdateStatus = (id: string, newStatus: Order["status"]) => {
    setOrders((prev) => 
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
    if (selectedOrderDetail && selectedOrderDetail.id === id) {
      setSelectedOrderDetail((prev) => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleUpdatePaymentStatus = (id: string, newPaymentStatus: Order["paymentStatus"]) => {
    setOrders((prev) => 
      prev.map((o) => (o.id === id ? { ...o, paymentStatus: newPaymentStatus } : o))
    );
    if (selectedOrderDetail && selectedOrderDetail.id === id) {
      setSelectedOrderDetail((prev) => prev ? { ...prev, paymentStatus: newPaymentStatus } : null);
    }
  };

  // Filter & Search Logic
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "All" || o.status === statusFilter;
    const customerName = o.customer || "";
    const orderId = o.id || "";
    const orderAddress = o.address || "";
    const query = searchQuery.trim().toLowerCase();
    
    const matchesSearch = 
      customerName.toLowerCase().includes(query) ||
      orderId.toLowerCase().includes(query) ||
      orderAddress.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  // Calculate order metrics
  const getSubtotal = (order: Order) => {
    return order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  };

  const getShippingFee = (order: Order) => {
    const subtotal = getSubtotal(order);
    return Math.max(0, order.total - subtotal);
  };

  const getWhatsAppMessageLink = (order: Order) => {
    const cleanPhone = (order.phone || "").replace(/\D/g, "");
    const orderRef = (order.id || "").replace("ord-", "").toUpperCase();
    let message = `مرحباً ${order.customer || ""}،\n`;
    message += `نود إعلامكم بأن حالة طلبكم رقم #${orderRef} هي الآن: *${getStatusLabel(order.status, "ar")}* 🚀\n\n`;
    message += `📋 *تفاصيل الفاتورة:*\n`;
    order.items.forEach(it => {
      const variantDesc = it.variantLabel ? ` (${it.variantLabel})` : "";
      message += `• ${it.name}${variantDesc} x${it.qty} ➔ $${(it.qty * it.price).toFixed(2)}\n`;
    });
    message += `\n💵 *المجموع النهائي:* $${order.total.toFixed(2)}\n`;
    message += `طريقة الدفع: ${getPaymentMethodLabel(order.paymentMethod, "ar")}\n\n`;
    message += `شكراً لاختياركم متجرنا! ✨`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const currentStatusIndex = (status: Order["status"]) => {
    return STEPPER_STATUSES.indexOf(status);
  };

  return (
    <div className="space-y-4" dir={l === "ar" ? "rtl" : "ltr"}>
      {/* Tab Header and Status Counter Badge */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
        <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <ClipboardList size={14} className="text-yellow-500" />
          <span>{t.orders_db}</span>
        </span>
        <span className="text-[10px] text-slate-500 font-extrabold bg-slate-50 border border-slate-200 rounded-full px-3 py-1 uppercase tracking-wider">
          {t.total_logged}: {orders.length}
        </span>
      </div>

      {/* Control Panel: Filters and Search */}
      <div className="space-y-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/60 print:hidden">
        {/* Search */}
        <div className="relative">
          <input
            id="orders-search-input"
            type="text"
            placeholder={t.search_placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-[11px] font-bold placeholder-slate-400 focus:outline-none focus:border-slate-800 transition uppercase tracking-wider"
          />
          <Search size={12} strokeWidth={2.5} className={`absolute ${l === "ar" ? "right-3.5" : "left-3.5"} top-1/2 -translate-y-1/2 text-slate-400`} />
          {searchQuery && (
            <button
              id="clear-order-search-btn"
              type="button"
              onClick={() => setSearchQuery("")}
              className={`absolute ${l === "ar" ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition cursor-pointer`}
              title="Clear Search"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Status Filters horizontal list */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <Filter size={11} strokeWidth={2.5} className="text-slate-400 shrink-0 mx-1" />
          <button
            type="button"
            onClick={() => setStatusFilter("All")}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
              statusFilter === "All"
                ? "bg-slate-900 border-slate-900 text-white"
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
            }`}
          >
            {t.all}
          </button>
          {STATUS_OPTIONS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                statusFilter === st
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {getStatusLabel(st, l)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table View */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-slate-50/50 border border-slate-100 rounded-2xl print:hidden">
          <Truck size={36} className="text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-black text-slate-500 uppercase">{t.no_orders}</p>
          <p className="text-[9px] text-slate-400 mt-1 uppercase max-w-[200px] mx-auto font-bold tracking-wide">
            {t.no_orders_sub}
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm print:hidden">
          {/* Scrollable Table viewport */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" dir={l === "ar" ? "rtl" : "ltr"}>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-500">
                  <th className="py-3 px-3.5 w-12 text-center">{t.info}</th>
                  <th className="py-3 px-3">{t.order_id}</th>
                  <th className="py-3 px-3">{t.customer}</th>
                  <th className="py-3 px-3">{t.date}</th>
                  <th className="py-3 px-3">{t.total_amount}</th>
                  <th className="py-3 px-3.5 text-center">{t.status}</th>
                  <th className="py-3 px-3 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px] font-bold text-slate-700">
                {filteredOrders.map((o) => {
                  const isExpanded = !!expandedOrders[o.id];
                  return (
                    <React.Fragment key={o.id}>
                      {/* Normal Table Row */}
                      <tr 
                        className={`hover:bg-slate-50/70 transition duration-150 cursor-pointer ${
                          isExpanded ? "bg-slate-50/40" : ""
                        }`}
                        onClick={() => toggleExpand(o.id)}
                      >
                        {/* Expand toggle trigger */}
                        <td className="py-3.5 px-3.5 text-center">
                          <button
                            type="button"
                            className="text-slate-400 hover:text-slate-700 focus:outline-none transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={14} strokeWidth={3} /> : <ChevronDown size={14} strokeWidth={3} />}
                          </button>
                        </td>

                        {/* Order ID column */}
                        <td className="py-3.5 px-3 font-mono text-[10px] text-slate-500 uppercase tracking-tighter">
                          #{((o && o.id) || "").replace("ord-", "").toUpperCase()}
                        </td>

                        {/* Customer Name column */}
                        <td className="py-3.5 px-3 font-black text-slate-900 truncate max-w-[100px]">
                          {o.customer}
                        </td>

                        {/* Date column */}
                        <td className="py-3.5 px-3 whitespace-nowrap text-slate-400 text-[10px]">
                          {o.date.split(",")[0]}
                        </td>

                        {/* Total column */}
                        <td className="py-3.5 px-3 font-black text-slate-950">
                          ${o.total.toFixed(2)}
                        </td>

                        {/* Status dropdown selector column */}
                        <td className="py-3.5 px-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateStatus(o.id, e.target.value as Order["status"])}
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full border cursor-pointer focus:outline-none transition-colors ${
                              STATUS_STYLING[o.status]
                            }`}
                          >
                            {STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st} className="bg-white text-slate-800 font-bold uppercase">
                                {getStatusLabel(st, l)}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Detailed View Action Column */}
                        <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedOrderDetail(o)}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1 mx-auto"
                          >
                            <span>{t.details}</span>
                            <ChevronRight size={10} strokeWidth={2.5} className={l === "ar" ? "rotate-180" : ""} />
                          </button>
                        </td>
                      </tr>

                      {/* Expandable row: Order details & actions */}
                      {isExpanded && (
                        <tr className={`bg-slate-50/60 ${l === "ar" ? "border-r-4" : "border-l-4"} border-[#0F172A]`}>
                          <td colSpan={7} className="p-4 bg-slate-50/40 border-b border-slate-200">
                            <div className="space-y-3.5 max-w-md mx-auto">
                              {/* Order Metadata section */}
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Calendar size={11} /> {t.placed_on}: {o.date}
                                </span>
                                <span className="flex items-center gap-1 text-[#0F172A] font-black">
                                  <DollarSign size={11} /> {getPaymentMethodLabel(o.paymentMethod, l)} ({getPaymentStatusLabel(o.paymentStatus, l)})
                                </span>
                              </div>

                              {/* Customer Profile & Address Info */}
                              <div className="grid grid-cols-2 gap-3.5 text-slate-600">
                                <div className="space-y-1">
                                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                    <User size={9} /> {t.customer}
                                  </span>
                                  <span className="text-[11px] font-black text-slate-900 block leading-tight">
                                    {o.customer}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                    <MapPin size={9} /> {t.delivery_logistics}
                                  </span>
                                  <span className="text-[11px] font-black text-slate-900 block leading-tight">
                                    {o.address}
                                  </span>
                                </div>
                              </div>

                              {/* Order Items List */}
                              <div className="space-y-1.5">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                  {t.itemized_breakdown}
                                </span>
                                <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 shadow-inner">
                                  {o.items.map((it, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-[11px] font-medium text-slate-700">
                                      <div className="truncate flex-1 pr-4">
                                        <span className="font-black text-slate-900">• {it.name}</span>
                                        {it.variantLabel && (
                                          <span className="text-[9px] text-slate-400 font-black uppercase ml-1.5">
                                            ({it.variantLabel})
                                          </span>
                                        )}
                                        <span className="text-slate-400 font-extrabold ml-1.5">×{it.qty}</span>
                                      </div>
                                      <span className="font-black text-slate-950 shrink-0">
                                        ${(it.qty * it.price).toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                  
                                  <div className="border-t border-dashed border-slate-200 pt-2 flex justify-between items-center text-xs font-black text-[#0F172A] mt-2">
                                    <span className="uppercase tracking-widest text-[9px] text-slate-400">{t.grand_total}</span>
                                    <span>${o.total.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Quick Contact Buttons & Link to details */}
                              <div className="flex flex-col gap-2">
                                <div className="flex gap-2.5 pt-1.5">
                                  <a
                                    href={`https://wa.me/${(o.phone || "").replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 text-[10px] font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition uppercase tracking-widest shadow-sm active:scale-95"
                                  >
                                    <WAIcon size={12} /> {t.contact_client}
                                  </a>
                                  <a
                                    href={`tel:${o.phone}`}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-[10px] font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition uppercase tracking-widest shadow-sm active:scale-95"
                                  >
                                    <PhoneCall size={11} strokeWidth={2.5} /> {t.direct_call}
                                  </a>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderDetail(o)}
                                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition uppercase tracking-widest shadow-md active:scale-95 mt-1 cursor-pointer"
                                >
                                  <span>{t.details}</span>
                                  <ChevronRight size={11} strokeWidth={3} className={l === "ar" ? "rotate-180" : ""} />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PORTAL-STYLE DETAILED VIEW MODAL OVERLAY */}
      <AnimatePresence>
        {selectedOrderDetail && (
          <div className="print-receipt-overlay fixed inset-0 z-50 flex items-center justify-center p-4" dir={l === "ar" ? "rtl" : "ltr"}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrderDetail(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm print:hidden"
            />

            {/* Modal Content Card */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="print-receipt-modal bg-white w-full max-w-2xl rounded-[28px] border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 print:static print:inset-auto print:max-h-none print:w-full print:max-w-none print:shadow-none print:border-none print:rounded-none print:p-0"
              id="print-receipt-modal"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between shrink-0 print:bg-white print:text-black print:px-0 print:py-3 print:border-b-2 print:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold bg-white/20 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider print:bg-slate-200 print:text-black">
                      {t.invoice_no}
                    </span>
                    <h3 className="text-sm font-mono font-black uppercase tracking-tight">
                      #{((selectedOrderDetail && selectedOrderDetail.id) || "").replace("ord-", "").toUpperCase()}
                    </h3>
                  </div>
                  <p className="text-[9px] text-slate-300 font-semibold flex items-center gap-1 print:text-slate-500">
                    <Calendar size={10} /> {t.placed_on}: {selectedOrderDetail.date}
                  </p>
                </div>

                {/* Header Action Row */}
                <div className="flex items-center gap-2.5 print:hidden">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                    title={t.print_invoice}
                  >
                    <Printer size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedOrderDetail(null)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                    title={t.close_details}
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Modal Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 print:overflow-visible print:p-0">
                {/* Print-Only Invoice/Packing Slip Header Banner */}
                <div className="hidden print:flex flex-col items-center text-center w-full pb-4 border-b-2 border-slate-800 mb-6 space-y-1">
                  <h1 className="text-xl font-black tracking-widest text-slate-900 uppercase">
                    {lang === "ar" ? "متجر علاء" : "ON ALAA Store"}
                  </h1>
                  <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    {lang === "ar" ? "جدرا، الشوف | هاتف: 71135241" : "Jadra, Chouf | Tel: +961 71 135 241"}
                  </p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pt-1">
                    {lang === "ar" ? "إيصال التعبئة والطلب" : "Packing List & Order Receipt"}
                  </p>
                </div>
                
                {/* Visual Status Tracker Stepper */}
                {selectedOrderDetail.status === "Cancelled" ? (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4.5 flex items-center gap-3.5 text-red-800 print:bg-white print:border-red-400">
                    <AlertCircle size={20} className="stroke-[2.5] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-black uppercase tracking-wider">{t.order_cancelled_title}</h4>
                      <p className="text-[9px] font-semibold text-red-600 uppercase tracking-wide mt-0.5">
                        {t.order_cancelled_desc}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrderDetail.id, "Pending")}
                      className="bg-red-100 hover:bg-red-200 active:scale-95 text-red-800 text-[8px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border border-red-300 transition-all print:hidden"
                    >
                      {t.reopen_order}
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 space-y-4 print:hidden">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Clock size={11} /> {t.fulfillment_roadmap}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border bg-white shadow-sm border-slate-200">
                        {t.current_status}: <span className="font-black text-indigo-600">{getStatusLabel(selectedOrderDetail.status, l)}</span>
                      </span>
                    </div>

                    {/* Progress Track line and nodes */}
                    <div className="relative pt-3 pb-2 px-1">
                      {/* Grey horizontal pipeline */}
                      <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200/80 -translate-y-1/2 rounded-full" />
                      
                      {/* Active green pipeline overlay */}
                      <div 
                        className={`absolute top-1/2 ${l === "ar" ? "right-0" : "left-0"} h-1 bg-green-500 -translate-y-1/2 rounded-full transition-all duration-500`} 
                        style={{ 
                          width: `${(currentStatusIndex(selectedOrderDetail.status) / (STEPPER_STATUSES.length - 1)) * 100}%` 
                        }}
                      />

                      {/* Timeline status nodes */}
                      <div className="relative flex justify-between">
                        {STEPPER_STATUSES.map((st, index) => {
                          const isCompleted = currentStatusIndex(selectedOrderDetail.status) >= index;
                          const isActive = selectedOrderDetail.status === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleUpdateStatus(selectedOrderDetail.id, st)}
                              className="group flex flex-col items-center gap-2 relative z-10 focus:outline-none cursor-pointer"
                              title={`Set status to ${st}`}
                            >
                              {/* Pulse effect if active */}
                              <div className="relative">
                                {isActive && (
                                  <span className="absolute -inset-1.5 rounded-full bg-green-400/30 animate-ping" />
                                )}
                                <div 
                                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all shadow-md ${
                                    isActive
                                      ? "bg-slate-900 border-slate-900 text-white"
                                      : isCompleted
                                        ? "bg-green-500 border-green-500 text-white"
                                        : "bg-white border-slate-300 text-slate-400 group-hover:border-slate-500"
                                  }`}
                                >
                                  {isCompleted ? (
                                    <CheckCircle size={13} strokeWidth={3} />
                                  ) : (
                                    <span className="text-[10px] font-black">{index + 1}</span>
                                  )}
                                </div>
                              </div>
                              <span 
                                className={`text-[8px] font-black uppercase tracking-widest ${
                                  isActive 
                                    ? "text-slate-900 font-extrabold" 
                                    : isCompleted 
                                      ? "text-green-600" 
                                      : "text-slate-400"
                                }`}
                              >
                                {getStatusLabel(st, l)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Information Cards Row (Customer Info & Delivery Destination) */}
                <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4">
                  {/* Card 1: Customer Profile Details */}
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4.5 space-y-4 print:bg-white print:border-none print:p-0">
                    <div className="flex items-center gap-3">
                      {/* Avatar initial circular chip */}
                      <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-sm font-black uppercase tracking-tight shadow print:border print:border-slate-300 print:text-black print:bg-slate-100">
                        {selectedOrderDetail.customer.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">
                          {t.customer_profile}
                        </span>
                        <h4 className="text-xs font-black text-slate-900 uppercase truncate">
                          {selectedOrderDetail.customer}
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-1 border-t border-slate-200/80 print:border-slate-300">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          <PhoneCall size={10} /> {t.contact_phone}:
                        </span>
                        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                          <span>{selectedOrderDetail.phone}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(selectedOrderDetail.phone, "phone")}
                            className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition cursor-pointer print:hidden"
                            title={t.copy_field}
                          >
                            {copiedField === "phone" ? <CheckCircle size={10} className="text-green-600" /> : <Copy size={10} />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          <DollarSign size={10} /> {t.payment_status}:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                            selectedOrderDetail.paymentStatus === "Paid"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}>
                            {getPaymentStatusLabel(selectedOrderDetail.paymentStatus, l)}
                          </span>
                          
                          {/* Quick payment status toggler */}
                          <button
                            type="button"
                            onClick={() => handleUpdatePaymentStatus(
                              selectedOrderDetail.id, 
                              selectedOrderDetail.paymentStatus === "Paid" ? "Unpaid" : "Paid"
                            )}
                            className="text-[8px] font-bold text-slate-500 hover:text-slate-900 underline uppercase tracking-wider focus:outline-none print:hidden cursor-pointer"
                          >
                            {t.toggle}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          <CreditCard size={10} /> {t.billing_method}:
                        </span>
                        <span className="font-extrabold text-slate-900 uppercase tracking-wide text-[9px]">
                          {getPaymentMethodLabel(selectedOrderDetail.paymentMethod, l)}
                        </span>
                      </div>
                    </div>

                    {/* Contact channels buttons row */}
                    <div className="flex gap-2 pt-2 border-t border-slate-200/60 print:hidden">
                      <a
                        href={getWhatsAppMessageLink(selectedOrderDetail)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 text-[9px] font-black py-2 rounded-xl flex items-center justify-center gap-1.5 transition uppercase tracking-widest shadow-sm active:scale-95"
                      >
                        <WAIcon size={12} /> {t.whatsapp_status}
                      </a>
                      <a
                        href={`tel:${selectedOrderDetail.phone}`}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-[9px] font-black py-2 rounded-xl flex items-center justify-center gap-1.5 transition uppercase tracking-widest shadow-sm active:scale-95"
                      >
                        <PhoneCall size={10} strokeWidth={2.5} /> {t.direct_call}
                      </a>
                    </div>
                  </div>

                  {/* Card 2: Shipping Destination */}
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4.5 space-y-4 print:bg-white print:border-none print:p-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-black shadow border border-indigo-100 print:bg-slate-100 print:border-slate-300 print:text-black">
                        <MapPin size={18} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">
                          {t.delivery_logistics}
                        </span>
                        <h4 className="text-xs font-black text-slate-900 uppercase">
                          {t.delivery_logistics}
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-3 pt-1 border-t border-slate-200/80 print:border-slate-300">
                      <div className="p-3 bg-white rounded-xl border border-slate-200 min-h-[50px] flex items-start gap-2 relative print:border-slate-300">
                        <MapPin size={12} className="text-red-500 shrink-0 mt-0.5" />
                        <span className="text-[11px] font-bold text-slate-800 leading-normal flex-1 pr-6">
                          {selectedOrderDetail.address}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedOrderDetail.address, "address")}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded transition cursor-pointer print:hidden"
                          title={t.copy_field}
                        >
                          {copiedField === "address" ? <CheckCircle size={10} className="text-green-600" /> : <Copy size={10} />}
                        </button>
                      </div>

                      {/* Google Maps Lookup external anchor */}
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(selectedOrderDetail.address)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-[9px] font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition uppercase tracking-widest shadow-sm active:scale-95 print:hidden"
                      >
                        <ExternalLink size={11} strokeWidth={2.5} /> {t.locate_on_map}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Order Itemized Invoice Details */}
                <div className="space-y-2">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block print:text-black">
                    {t.itemized_breakdown}
                  </span>
                  
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm print:border-slate-300 print:shadow-none">
                    <table className="w-full text-left border-collapse" dir={l === "ar" ? "rtl" : "ltr"}>
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-500 print:bg-slate-100 print:border-b-2 print:border-slate-800 print:text-black">
                          <th className="py-2.5 px-4">{t.item_details}</th>
                          <th className="py-2.5 px-3 text-center">{t.qty}</th>
                          <th className={`py-2.5 px-3 ${l === "ar" ? "text-left" : "text-right"}`}>{t.unit_price}</th>
                          <th className={`py-2.5 px-4 ${l === "ar" ? "text-left" : "text-right"}`}>{t.total}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-[11px] font-bold text-slate-700 print:divide-slate-300">
                        {selectedOrderDetail.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/40">
                            <td className="py-3 px-4">
                              <span className="font-black text-slate-900 block">{it.name}</span>
                              {it.variantLabel && (
                                <span className="text-[8px] bg-slate-100 border border-slate-200 font-black text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block print:border-slate-300 print:bg-slate-100">
                                  {it.variantLabel}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center font-black text-slate-950">
                              x{it.qty}
                            </td>
                            <td className={`py-3 px-3 ${l === "ar" ? "text-left" : "text-right"} font-mono text-slate-500`}>
                              ${it.price.toFixed(2)}
                            </td>
                            <td className={`py-3 px-4 ${l === "ar" ? "text-left" : "text-right"} font-black text-slate-950`}>
                              ${(it.qty * it.price).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Totals Summary Footer */}
                    <div className="bg-slate-50/50 p-4 border-t border-slate-200 space-y-1.5 text-slate-600 print:bg-white print:border-t-2 print:border-slate-800">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span>{t.invoice_subtotal}:</span>
                        <span className="font-mono text-slate-950">${getSubtotal(selectedOrderDetail).toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] font-bold pb-2 border-b border-dashed border-slate-200 print:border-slate-300">
                        <span>{t.shipping_fee}:</span>
                        <span className="font-mono text-slate-950">${getShippingFee(selectedOrderDetail).toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center pt-1.5">
                        <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider">
                          {t.amount_charged}:
                        </span>
                        <span className="text-sm font-black text-[#0F172A] font-mono">
                          ${selectedOrderDetail.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Printable footer disclaimer for invoice printouts */}
                <div className="hidden print:block text-center pt-8 border-t border-dashed border-slate-300 mt-8 space-y-1 text-slate-500">
                  <p className="text-[9px] font-black uppercase tracking-widest">
                    {t.thank_you}
                  </p>
                  <p className="text-[8px] font-bold">
                    {t.support_line}
                  </p>
                </div>

              </div>

              {/* Modal Actions Footer Panel */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap gap-2 justify-between items-center shrink-0 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">
                    {t.actions}:
                  </span>
                  
                  {/* Cancel toggle button */}
                  {selectedOrderDetail.status !== "Cancelled" ? (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrderDetail.id, "Cancelled")}
                      className="bg-red-50 hover:bg-red-100 active:scale-95 text-red-700 text-[9px] font-black uppercase tracking-wider px-3 py-2 rounded-xl border border-red-200 transition-all cursor-pointer"
                    >
                      {t.cancel_order}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrderDetail.id, "Pending")}
                      className="bg-slate-200 hover:bg-slate-100 active:scale-95 text-slate-800 text-[9px] font-black uppercase tracking-wider px-3 py-2 rounded-xl border border-slate-300 transition-all cursor-pointer"
                    >
                      {t.reopen_reactivate}
                    </button>
                  )}

                  {/* Print Packing List / Invoice Button */}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-[9px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl border border-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer size={12} />
                    <span>{t.print_invoice}</span>
                  </button>
                </div>

                {/* Next Step Shortcut Button */}
                <div className="flex items-center gap-2">
                  {selectedOrderDetail.status === "Pending" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrderDetail.id, "Processing")}
                      className="bg-[#0F172A] hover:bg-slate-800 active:scale-95 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{t.start_processing}</span>
                      <ChevronRight size={11} strokeWidth={3} className={l === "ar" ? "rotate-180" : ""} />
                    </button>
                  )}
                  {selectedOrderDetail.status === "Processing" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrderDetail.id, "Shipped")}
                      className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{t.dispatch_ship}</span>
                      <Truck size={11} strokeWidth={2.5} />
                    </button>
                  )}
                  {selectedOrderDetail.status === "Shipped" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrderDetail.id, "Delivered")}
                      className="bg-green-600 hover:bg-green-700 active:scale-95 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{t.mark_delivered}</span>
                      <CheckCircle size={11} strokeWidth={2.5} />
                    </button>
                  )}
                  {selectedOrderDetail.status === "Delivered" && (
                    <span className="text-[9px] text-green-700 bg-green-50 border border-green-200 font-black uppercase tracking-widest px-3 py-2 rounded-xl flex items-center gap-1">
                      <CheckCircle size={12} strokeWidth={3} /> {t.complete}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
