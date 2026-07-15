import React, { useState } from "react";
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  ShieldCheck, 
  CreditCard, 
  Plus, 
  Minus, 
  Lock, 
  Loader2, 
  CheckCircle,
  Truck
} from "lucide-react";
import { CartItem, Order, StoreSettings, Product } from "../types";
import { WAIcon } from "./WAIcon";
import { Language, getTranslation } from "../lib/translations";

interface CheckoutModalProps {
  cart: Record<string, CartItem>;
  setCart: React.Dispatch<React.SetStateAction<Record<string, CartItem>>>;
  products?: Product[];
  onClose: () => void;
  onOrder: (order: Order) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
  storeSettings: StoreSettings;
  lang: Language;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  cart,
  setCart,
  products = [],
  onClose,
  onOrder,
  showToast,
  storeSettings,
  lang,
}) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"standard" | "express">("standard");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "card">("cod");

  // Gateway form states
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Gateway processing states
  const [gatewayStatus, setGatewayStatus] = useState<"idle" | "connecting" | "validating" | "authorizing" | "success">("idle");
  const [successReceipt, setSuccessReceipt] = useState<Order | null>(null);

  const cartKeys = Object.keys(cart);
  const itemsSubtotal = cartKeys.reduce((acc, key) => acc + cart[key].qty * cart[key].price, 0);
  
  // Custom delivery charge: standard ($3.00) or express ($8.00)
  const deliveryCharge = itemsSubtotal > 0 ? (deliveryMethod === "standard" ? 3.00 : 8.00) : 0;
  const grandTotal = itemsSubtotal + deliveryCharge;

  // Handle removing a single item
  const handleRemoveItem = (key: string) => {
    setCart((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    showToast(lang === "ar" ? "تمت إزالة المنتج من السلة" : "Item removed from cart");
  };

  // Get max stock constraint for a cart item
  const getItemMaxStock = (productId: string, variantId: string): number => {
    const product = products.find((p) => p.id === productId);
    if (!product) return 99;
    if (variantId === "base") {
      return product.stock ?? 99;
    } else {
      const matchingVar = product.variants?.find((v) => v.id === variantId);
      return matchingVar ? matchingVar.stock : 99;
    }
  };

  // Handle quantity adjustment in checkout
  const handleUpdateQty = (key: string, delta: number) => {
    setCart((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      
      const newQty = existing.qty + delta;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }

      // Check stock limits
      const maxStock = getItemMaxStock(existing.productId, existing.variantId);
      if (delta > 0 && existing.qty >= maxStock) {
        showToast(
          lang === "ar" 
            ? `عذراً، هذا هو الحد الأقصى المتوفر في المخزن (${maxStock})` 
            : `Sorry, this is the maximum stock available (${maxStock})`,
          "error"
        );
        return prev;
      }

      return {
        ...prev,
        [key]: {
          ...existing,
          qty: newQty,
        },
      };
    });
  };

  // Format Card Number (with spaces)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").substring(0, 16);
    const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "").substring(0, 4);
    if (value.length > 2) {
      value = `${value.substring(0, 2)}/${value.substring(2)}`;
    }
    setCardExpiry(value);
  };

  // Format CVV (3 or 4 digits)
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").substring(0, 4);
    setCardCvv(value);
  };

  // Detect card brand based on starting digit
  const getCardBrand = () => {
    const cleanNum = cardNumber.replace(/\s/g, "");
    if (cleanNum.startsWith("4")) return "Visa";
    if (/^5[1-5]/.test(cleanNum)) return "Mastercard";
    if (cleanNum.startsWith("3")) return "Amex";
    return "Credit Card";
  };

  // Form Submission
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartKeys.length === 0) {
      showToast(lang === "ar" ? "سلة التسوق فارغة!" : "Your cart is empty!", "error");
      return;
    }
    if (!name.trim() || !phone.trim() || !address.trim()) {
      showToast(lang === "ar" ? "يرجى ملء جميع التفاصيل المطلوبة" : "Please fill in all details", "error");
      return;
    }

    const orderId = `ord-${Math.random().toString(36).substring(2, 9)}`;
    const newOrder: Order = {
      id: orderId,
      customer: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      items: Object.values(cart),
      total: grandTotal,
      date: new Date().toLocaleString(),
      status: paymentMethod === "card" ? "Processing" : "Pending",
      paymentMethod: paymentMethod === "card" ? "Secure Card Gateway" : "Cash on Delivery",
      paymentStatus: paymentMethod === "card" ? "Paid" : "Unpaid",
    };

    // If Online Card Payment, initiate animated gateway processing sequence
    if (paymentMethod === "card") {
      if (!cardName.trim() || cardNumber.length < 19 || cardExpiry.length < 5 || cardCvv.length < 3) {
        showToast(
          lang === "ar" 
            ? "يرجى إدخال بيانات بطاقة دفع صالحة" 
            : "Please enter valid card gateway credentials", 
          "error"
        );
        return;
      }

      // Step-by-step gateway processing simulation
      setGatewayStatus("connecting");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setGatewayStatus("validating");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setGatewayStatus("authorizing");
      await new Promise((resolve) => setTimeout(resolve, 1200));
      
      setGatewayStatus("success");
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Order created in ERP
      onOrder(newOrder);
      setSuccessReceipt(newOrder);
      setCart({}); // Empty the cart upon success
      showToast(
        lang === "ar" 
          ? "تم الدفع وتأكيد طلبك بنجاح!" 
          : "Payment Authorized! Order generated in dashboard.", 
        "success"
      );
    } else {
      // Cash on Delivery - opens WhatsApp & logs in ERP directly
      // 1. Build beautiful WhatsApp order message
      let waMessage = `🛍️ *NEW ORDER - ${storeSettings.title.toUpperCase()}*\n`;
      waMessage += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
      waMessage += `👤 *Customer Details:*\n`;
      waMessage += `• *Name:* ${name.trim()}\n`;
      waMessage += `• *Phone:* ${phone.trim()}\n`;
      waMessage += `• *Delivery Address:* ${address.trim()}\n`;
      waMessage += `• *Delivery Speed:* ${deliveryMethod === "standard" ? "Standard (3-5 Days)" : "Express (24 Hours)"}\n`;
      waMessage += `• *Payment:* Cash on Delivery (COD)\n\n`;
      waMessage += `📦 *Ordered Items:*\n`;

      cartKeys.forEach((key, index) => {
        const item = cart[key];
        const variantDetails = item.variantLabel ? ` (${item.variantLabel})` : "";
        waMessage += `${index + 1}. *${item.name}${variantDetails}*\n`;
        waMessage += `   _Qty:_ ${item.qty}  ×  _Price:_ $${item.price.toFixed(2)}  ➔  *$${(
          item.qty * item.price
        ).toFixed(2)}*\n`;
      });

      waMessage += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
      waMessage += `🚚 *Delivery Cost:* $${deliveryCharge.toFixed(2)}\n`;
      waMessage += `💵 *GRAND TOTAL:* *$${grandTotal.toFixed(2)}*\n`;
      waMessage += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
      waMessage += `⚡ _Sent via ON ALAA STORE E-Commerce Engine_`;

      // 2. Open WhatsApp URL safely
      const cleanStorePhone = storeSettings.phone.replace(/\D/g, ""); // strip anything non-digit
      const waUrl = `https://wa.me/${cleanStorePhone}?text=${encodeURIComponent(waMessage)}`;
      try {
        window.open(waUrl, "_blank");
      } catch (e) {
        console.error("Popup blocked or iframe sandbox restriction: ", e);
      }

      // 3. Log order in local ERP state
      onOrder(newOrder);
      setCart({}); // Empty cart upon checkout
      onClose();
      showToast(
        lang === "ar" 
          ? "تم تجميع الطلب! جاري فتح واتساب لتأكيد الشحن..." 
          : "Order compiled! Opening WhatsApp to complete...", 
        "success"
      );
    }
  };

  // Helper to trigger backup WhatsApp for paid card orders
  const handleSendPaidWhatsApp = () => {
    if (!successReceipt) return;
    
    let waMessage = `💳 *PAID ORDER - ${storeSettings.title.toUpperCase()}*\n`;
    waMessage += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    waMessage += `👤 *Customer Details:*\n`;
    waMessage += `• *Name:* ${successReceipt.customer}\n`;
    waMessage += `• *Phone:* ${successReceipt.phone}\n`;
    waMessage += `• *Delivery Address:* ${successReceipt.address}\n`;
    waMessage += `• *Payment Method:* Online Credit Card (PAID via Secure Gateway)\n`;
    waMessage += `• *Gateway Transaction:* APPROVED\n\n`;
    waMessage += `📦 *Ordered Items:*\n`;

    successReceipt.items.forEach((item, index) => {
      const variantDetails = item.variantLabel ? ` (${item.variantLabel})` : "";
      waMessage += `${index + 1}. *${item.name}${variantDetails}*\n`;
      waMessage += `   _Qty:_ ${item.qty}  ×  _Price:_ $${item.price.toFixed(2)}  ➔  *$${(
        item.qty * item.price
      ).toFixed(2)}*\n`;
    });

    waMessage += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    waMessage += `🚚 *Delivery:* $${deliveryCharge.toFixed(2)}\n`;
    waMessage += `💵 *GRAND TOTAL (PAID):* *$${successReceipt.total.toFixed(2)}*\n`;
    waMessage += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    waMessage += `⚡ _Sent via ON ALAA STORE E-Commerce Engine_`;

    const cleanStorePhone = storeSettings.phone.replace(/\D/g, "");
    const waUrl = `https://wa.me/${cleanStorePhone}?text=${encodeURIComponent(waMessage)}`;
    try {
      window.open(waUrl, "_blank");
    } catch (e) {
      console.error("Popup blocked or iframe sandbox restriction: ", e);
    }
  };

  // REDIRECT TO GLORIOUS RECEIPT SCREEN UPON SECURE CARD PAYMENT SUCCESS
  if (successReceipt) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="bg-white w-full max-w-sm rounded-[32px] p-6 relative border-2 border-green-400 shadow-[0_15px_50px_rgba(34,197,94,0.15)] flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-4 border-2 border-green-100 shadow-md">
            <CheckCircle size={32} className="stroke-[2.5]" />
          </div>

          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
            {lang === "ar" ? "تم دفع طلبيتك بنجاح!" : "Payment Approved!"}
          </h3>
          <p className="text-[10px] text-green-600 font-extrabold uppercase tracking-widest mt-1">
            {lang === "ar" ? "رقم الطلبية:" : "Order reference:"} #{successReceipt.id.replace("ord-", "")}
          </p>

          <p className="text-xs text-slate-500 mt-3 font-semibold leading-relaxed">
            {lang === "ar"
              ? "لقد تم استلام دفعتك بأمان وتأكيد طلبيتك بالكامل. لقد تم تسجيل تفاصيل الطلبية وتمريرها فوراً لقسم الشحن والتوزيع لدينا لتجهيزها."
              : "Your payment of credit/debit card was authorized and captured securely. The order has been submitted directly to the Admin Dispatchers."}
          </p>

          {/* Itemized Receipt Details */}
          <div className="w-full bg-slate-50 rounded-2xl p-4 my-4.5 border border-slate-200 text-left">
            <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-2 border-b border-slate-200 pb-1.5 flex justify-between">
              <span>{lang === "ar" ? "تفاصيل الفاتورة" : "RECEIPT DETAILS"}</span>
              <span className="text-green-600">PAID ONLINE</span>
            </div>
            
            <div className="space-y-1.5 max-h-24 overflow-y-auto">
              {successReceipt.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-[10px] font-bold text-slate-700">
                  <span className="truncate flex-1 pr-2">• {it.name} {it.variantLabel && `(${it.variantLabel})`} <span className="text-slate-400 font-black">x{it.qty}</span></span>
                  <span className="font-black text-slate-950">${(it.qty * it.price).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-200 pt-2.5 mt-2 text-[10px] font-black text-slate-900 flex justify-between">
              <span>{lang === "ar" ? "المجموع النهائي:" : "GRAND TOTAL:"}</span>
              <span className="text-sm font-black text-[#0F172A]">${successReceipt.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="w-full space-y-2">
            <button
              onClick={handleSendPaidWhatsApp}
              className="w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider transition-all shadow"
            >
              <WAIcon size={14} />
              {lang === "ar" ? "إرسال نسخة الفاتورة عبر واتساب" : "Send Invoice to WhatsApp"}
            </button>

            <button
              onClick={onClose}
              className="w-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black py-3 rounded-2xl text-[10px] uppercase tracking-wider transition-all shadow"
            >
              {lang === "ar" ? "العودة للتسوق" : "Return to Store"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // REDIRECT TO GATEWAY ANIMATED LOADER SCREEN DURING PAYMENT AUTHORIZATION
  if (gatewayStatus !== "idle" && gatewayStatus !== "success") {
    return (
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="bg-white w-full max-w-xs rounded-3xl p-8 border-2 border-slate-200 shadow-2xl flex flex-col items-center text-center space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-slate-900 animate-spin" />
            <Lock size={20} className="absolute text-slate-800" />
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#0F172A]">
              Secure Gateway
            </h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              3D-Secure 2.0 Encryption
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full">
            <span className="text-[10px] font-black text-slate-800 block uppercase tracking-wider animate-pulse">
              {gatewayStatus === "connecting" && (lang === "ar" ? "جاري إنشاء اتصال آمن..." : "Securing gateway server...")}
              {gatewayStatus === "validating" && (lang === "ar" ? "جاري التحقق من تفاصيل البطاقة..." : "Verifying card details...")}
              {gatewayStatus === "authorizing" && (lang === "ar" ? "جاري تفويض شحن الحساب..." : "Authorizing transaction...")}
            </span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">
              Please do not refresh or close
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div 
        id="checkout-modal-dialog"
        className="bg-white w-full max-w-sm rounded-[32px] p-6 relative border-2 border-gray-200 shadow-2xl max-h-[92vh] flex flex-col"
      >
        {/* Close Button */}
        <button
          id="close-checkout"
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-900 transition-colors z-10"
        >
          <X size={18} strokeWidth={3} />
        </button>

        <div className="flex items-center gap-2.5 mb-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-[#0F172A] flex items-center justify-center shrink-0 shadow-sm">
            <ShoppingBag size={16} strokeWidth={2.5} />
          </div>
          <h3 className="text-base font-black text-[#0F172A] uppercase tracking-tighter">
            {lang === "ar" ? "حقيبة التسوق الخاصة بك" : "Your Shopping Cart"}
          </h3>
        </div>

        {/* Cart Item list with quantity adjust controls */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 max-h-40 border-b border-slate-100 pb-2">
          {cartKeys.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <ShoppingBag size={28} strokeWidth={1.5} className="mx-auto mb-1 opacity-35" />
              <p className="text-xs font-semibold">{lang === "ar" ? "سلتك فارغة حالياً." : "Your cart is empty."}</p>
            </div>
          ) : (
            cartKeys.map((key) => {
              const item = cart[key];
              return (
                <div
                  key={key}
                  id={`cart-item-${key}`}
                  className="flex justify-between items-center gap-2 border-b border-slate-50 pb-2 animate-fade-in"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-900 truncate">
                      {item.name}
                    </p>
                    {item.variantLabel && (
                      <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mt-0.5 inline-block uppercase tracking-wider">
                        {item.variantLabel}
                      </span>
                    )}
                    <span className="text-[9px] text-slate-400 block mt-0.5 font-bold uppercase tracking-wider">
                      ${item.price.toFixed(2)} {lang === "ar" ? "لكل قطعة" : "each"}
                    </span>
                  </div>

                  {/* High fidelity quantity adjustment controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5 shadow-sm">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(key, -1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-500 hover:bg-slate-200 rounded-lg text-xs font-black transition-colors"
                        title="Decrease Qty"
                      >
                        <Minus size={9} strokeWidth={3} />
                      </button>
                      <span className="text-[10px] font-black text-slate-800 min-w-[14px] text-center">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(key, 1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-500 hover:bg-slate-200 rounded-lg text-xs font-black transition-colors"
                        title="Increase Qty"
                      >
                        <Plus size={9} strokeWidth={3} />
                      </button>
                    </div>

                    <span className="text-xs font-black text-slate-950 min-w-[45px] text-right">
                      ${(item.qty * item.price).toFixed(2)}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(key)}
                      className="text-slate-300 hover:text-red-600 p-1.5 rounded transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 size={13} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmitOrder} className="flex-1 flex flex-col justify-between overflow-y-auto max-h-[50vh] pr-1 space-y-3">
          {/* Delivery Method Option Pills */}
          <div className="space-y-1.5">
            <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">
              {lang === "ar" ? "طريقة التوصيل" : "Delivery Method"}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeliveryMethod("standard")}
                className={`py-2 px-3 rounded-2xl text-[9px] font-black uppercase tracking-wider text-center border-2 transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                  deliveryMethod === "standard"
                    ? "bg-[#0F172A] border-[#0F172A] text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Truck size={10} />
                <span>{lang === "ar" ? "شحن عادي ($3)" : "Standard ($3)"}</span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod("express")}
                className={`py-2 px-3 rounded-2xl text-[9px] font-black uppercase tracking-wider text-center border-2 transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                  deliveryMethod === "express"
                    ? "bg-[#0F172A] border-[#0F172A] text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Truck size={10} className="text-amber-500 animate-pulse" />
                <span>{lang === "ar" ? "شحن سريع ($8)" : "Express ($8)"}</span>
              </button>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">
              {lang === "ar" ? "طريقة الدفع" : "Payment Method"}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("cod")}
                className={`py-2 px-3 rounded-2xl text-[9px] font-black uppercase tracking-wider text-center border-2 transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                  paymentMethod === "cod"
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <span>💵</span>
                <span>{lang === "ar" ? "الدفع عند الاستلام" : "Cash on Delivery (COD)"}</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`py-2 px-3 rounded-2xl text-[9px] font-black uppercase tracking-wider text-center border-2 transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                  paymentMethod === "card"
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <CreditCard size={11} />
                <span>{lang === "ar" ? "بطاقة دفع إلكترونية" : "Online Credit Card"}</span>
              </button>
            </div>
          </div>

          {/* Subtotal & delivery details receipt block */}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
              <span>{lang === "ar" ? "المجموع الفرعي:" : "Subtotal:"}</span>
              <span>${itemsSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 pb-1.5 border-b border-dashed border-slate-200">
              <span>{lang === "ar" ? "تكلفة التوصيل:" : "Shipping Delivery:"}</span>
              <span>${deliveryCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-1.5">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{lang === "ar" ? "المجموع النهائي:" : "Grand Total:"}</span>
              <span className="text-sm font-black text-[#0F172A]">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout delivery details fields */}
          <div className="space-y-2.5">
            <div>
              <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">
                {lang === "ar" ? "الاسم الكامل" : "Full Name"}
              </label>
              <input
                id="checkout-name"
                type="text"
                required
                placeholder={lang === "ar" ? "مثال: علاء خالد" : "e.g. Alaa Khaled"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 border-2 border-gray-200 rounded-2xl text-[11px] font-bold outline-none focus:ring-0 focus:border-[#0F172A] transition placeholder-slate-400/80"
              />
            </div>

            <div>
              <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">
                {lang === "ar" ? "رقم الهاتف" : "Phone Number"}
              </label>
              <input
                id="checkout-phone"
                type="tel"
                required
                placeholder={lang === "ar" ? "مثال: +961 71 135 241" : "e.g. +961 71 135 241"}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 border-2 border-gray-200 rounded-2xl text-[11px] font-bold outline-none focus:ring-0 focus:border-[#0F172A] transition placeholder-slate-400/80"
              />
            </div>

            <div>
              <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">
                {lang === "ar" ? "عنوان التوصيل / المدينة" : "Delivery Address / City"}
              </label>
              <input
                id="checkout-address"
                type="text"
                required
                placeholder={lang === "ar" ? "مثال: شارع الحمرا، بيروت" : "e.g. Hamra Street, Beirut"}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 border-2 border-gray-200 rounded-2xl text-[11px] font-bold outline-none focus:ring-0 focus:border-[#0F172A] transition placeholder-slate-400/80"
              />
            </div>
          </div>

          {/* ONLINE CARD PAYMENT FORM */}
          {paymentMethod === "card" && (
            <div className="bg-slate-50 border border-slate-200 rounded-[24px] p-4 space-y-3 animate-slide-up">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Lock size={12} className="text-green-600" />
                  <span>{lang === "ar" ? "بوابة دفع آمنة 256 بت" : "Secure 256-Bit Gateway"}</span>
                </span>
                <span className="text-[8px] bg-green-50 text-green-700 font-bold border border-green-200 rounded-full px-2 py-0.5">
                  SANDBOX ACTIVE
                </span>
              </div>

              {/* Sleek Credit Card Visualization */}
              <div className="relative h-28 w-full bg-gradient-to-tr from-slate-900 to-indigo-950 rounded-xl p-3.5 text-white overflow-hidden shadow-md flex flex-col justify-between">
                {/* Chip and card brand */}
                <div className="flex justify-between items-start">
                  <div className="w-7 h-5 bg-amber-200/85 rounded-md border border-amber-300" />
                  <span className="text-[10px] font-black tracking-widest uppercase italic bg-white/10 px-2 py-0.5 rounded-md">
                    {getCardBrand()}
                  </span>
                </div>

                {/* Card Number display */}
                <div className="text-sm font-mono tracking-widest text-center py-1">
                  {cardNumber || "•••• •••• •••• ••••"}
                </div>

                {/* Name and Expiry row */}
                <div className="flex justify-between items-end text-[9px] font-semibold text-slate-300">
                  <div className="truncate max-w-[150px]">
                    <span className="text-[7px] text-slate-400 uppercase tracking-wider block leading-none">CARDHOLDER</span>
                    <span className="font-bold block tracking-wide truncate">{cardName.toUpperCase() || "NAME SURNAME"}</span>
                  </div>
                  <div>
                    <span className="text-[7px] text-slate-400 uppercase tracking-wider block leading-none">EXPIRES</span>
                    <span className="font-mono font-bold block">{cardExpiry || "MM/YY"}</span>
                  </div>
                </div>

                {/* Background circuit glow effect */}
                <div className="absolute right-0 bottom-0 top-0 w-24 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none" />
              </div>

              {/* Gateway Inputs */}
              <div className="space-y-2.5 pt-1.5">
                <div>
                  <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    {lang === "ar" ? "الاسم المكتوب على البطاقة" : "Cardholder Name"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ALAA KHALED"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:border-slate-800 transition"
                  />
                </div>

                <div>
                  <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    {lang === "ar" ? "رقم البطاقة" : "Card Number"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="4000 1234 5678 9010"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-mono font-bold outline-none focus:border-slate-800 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      {lang === "ar" ? "تاريخ الانتهاء" : "Expiry Date"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-mono font-bold outline-none focus:border-slate-800 transition text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      {lang === "ar" ? "رمز الأمان CVV" : "CVV / CVC"}
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="•••"
                      value={cardCvv}
                      onChange={handleCvvChange}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-mono font-bold outline-none focus:border-slate-800 transition text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Final Purchase Button */}
          <button
            id="submit-order-whatsapp"
            type="submit"
            disabled={cartKeys.length === 0}
            className={`w-full text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
              paymentMethod === "card"
                ? "bg-slate-900 hover:bg-slate-800 active:scale-95"
                : "bg-green-500 hover:bg-green-600 active:scale-95"
            }`}
          >
            {paymentMethod === "card" ? (
              <>
                <Lock size={12} strokeWidth={2.5} />
                <span>{lang === "ar" ? `دفع وإرسال الطلب - $${grandTotal.toFixed(2)}` : `Pay & Submit Order - $${grandTotal.toFixed(2)}`}</span>
              </>
            ) : (
              <>
                <WAIcon size={14} />
                <span>{lang === "ar" ? "إرسال وتأكيد الطلب عبر واتساب" : "Place Order via WhatsApp"}</span>
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 text-[8px] text-slate-400 text-center font-black uppercase tracking-wider mt-2.5 shrink-0">
          <ShieldCheck size={11} strokeWidth={2.5} className="text-green-500 shrink-0" />
          <span>ON ALAA SECURE CHECKOUT</span>
        </div>
      </div>
    </div>
  );
};
