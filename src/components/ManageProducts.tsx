import React, { useState } from "react";
import { 
  Eye, 
  EyeOff, 
  Trash2, 
  Package, 
  RefreshCw, 
  Layers,
  Database,
  FileSpreadsheet,
  UploadCloud,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Play
} from "lucide-react";
import { Product } from "../types";

// Firebase/Firestore Imports
import { doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface ManageProductsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  showToast: (msg: string, type?: "success" | "error") => void;
}

// 1. HyperX & Logitech Catalog Recovery Preset (The "HyperX.xlsx" Recovery Pack)
const HYPERX_LOGITECH_PRESET: Product[] = [
  {
    id: "prod-hx-origins",
    name: "HyperX Alloy Origins",
    nameAr: "لوحة مفاتيح هايبر إكس ألوي أوريجينز",
    category: "Keyboards",
    categoryAr: "لوحات المفاتيح",
    basePrice: 109.99,
    desc: "Mechanical gaming keyboard with custom HyperX tactile/linear mechanical switches, full aircraft-grade aluminum body, and radiant RGB backlighting.",
    descAr: "لوحة مفاتيح ميكانيكية متينة للألعاب مع إضاءة آر جي بي وهيكل ألومنيوم مقاوم.",
    imageUrl: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&q=80&w=400"],
    stock: 15,
    visible: true,
    options: [],
    variants: []
  },
  {
    id: "prod-hx-cloud2",
    name: "HyperX Cloud Headset II",
    nameAr: "سماعة هايبر إكس كلاود 2",
    category: "Headsets",
    categoryAr: "سماعات الرأس",
    basePrice: 99.99,
    desc: "Premium gaming headset featuring high-fidelity virtual 7.1 surround sound, supreme memory foam ear cushions, and durable aluminum frame.",
    descAr: "سماعة الألعاب الأسطورية ذات الصوت المحيطي المذهل وراحة متناهية للأذن.",
    imageUrl: "https://images.unsplash.com/photo-1606220532402-13a0022277ee?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1606220532402-13a0022277ee?auto=format&fit=crop&q=80&w=400"],
    stock: 20,
    visible: true,
    options: [],
    variants: []
  },
  {
    id: "prod-logi-gprox",
    name: "Logitech G Pro X Headset",
    nameAr: "سماعة لوجيتك جي برو إكس",
    category: "Headsets",
    categoryAr: "سماعات الرأس",
    basePrice: 129.99,
    desc: "Pro-grade gaming headset featuring Blue VO!CE mic filters, precision 50mm PRO-G drivers, and premium memory foam comfort.",
    descAr: "سماعة رأس احترافية مع فلاتر ميكروفون متقدمة وصوت محيطي عالي الجودة.",
    imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=400"],
    stock: 12,
    visible: true,
    options: [],
    variants: []
  },
  {
    id: "prod-logi-g502",
    name: "Logitech G502 LIGHTSPEED",
    nameAr: "ماوس لوجيتك جي 502 لاسلكي",
    category: "Mouse",
    categoryAr: "فأرة ألعاب",
    basePrice: 149.99,
    desc: "Legendary high-performance wireless gaming mouse with HERO 25K optical sensor, weight customization, and dual-mode scroll wheel.",
    descAr: "فأرة ألعاب لاسلكية فائقة السرعة والاستجابة مع مستشعر هيرو المتطور.",
    imageUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=400"],
    stock: 25,
    visible: true,
    options: [],
    variants: []
  },
  {
    id: "prod-logi-g29",
    name: "Logitech G29 Driving Force",
    nameAr: "مقود ألعاب لوجيتك جي 29",
    category: "Racing Wheel",
    categoryAr: "مقود ألعاب",
    basePrice: 299.99,
    desc: "Dual-motor force feedback racing wheel with hand-stitched leather rim, steel paddle shifters, and adjustable non-slip floor pedals.",
    descAr: "عجلة قيادة محاكاة السباق الواقعية مع دواسات أرضية قابلة للتعديل.",
    imageUrl: "https://images.unsplash.com/photo-1595152230535-09a220952850?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1595152230535-09a220952850?auto=format&fit=crop&q=80&w=400"],
    stock: 8,
    visible: true,
    options: [],
    variants: []
  }
];

// 2. Original June 2026 Catalog Recovery Preset
const ORIGINAL_JUNE_PRESET: Product[] = [
  {
    id: "prod-amazfit-active-edge",
    name: "Amazfit Active Edge",
    nameAr: "ساعة أمازفيت أكتيف إيدج الذكية",
    category: "Watch",
    categoryAr: "ساعات ذكية",
    basePrice: 139.00,
    desc: "Rugged and stylish outdoor smartwatch with multi-GNSS tracking, 10 ATM water-resistance, and 16-day battery life.",
    descAr: "ساعة ذكية رياضية متينة مقاومة للماء والغبار مع تتبع جي بي إس متقدم وبطارية تدوم حتى 16 يوماً.",
    imageUrl: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=400"],
    stock: 15,
    visible: true,
    options: [],
    variants: []
  },
  {
    id: "prod-wiwu-3in1-charger",
    name: "WIWU 3 in 1 wireless charger",
    nameAr: "شاحن لاسلكي 3 في 1 من وي وو",
    category: "Accessories",
    categoryAr: "إكسسوارات",
    basePrice: 45.00,
    desc: "Fast wireless charging station for iPhone, Apple Watch, and AirPods with elegant aluminum body and foldable design.",
    descAr: "منصة شحن لاسلكي سريعة لهواتف آيفون وساعات آبل وسماعات إيربودز بتصميم مدمج وأنيق.",
    imageUrl: "https://images.unsplash.com/photo-1622445262465-2481c857535a?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1622445262465-2481c857535a?auto=format&fit=crop&q=80&w=400"],
    stock: 25,
    visible: true,
    options: [],
    variants: []
  },
  {
    id: "prod-samsung-buds-pro",
    name: "Samsung Galaxy Buds Pro",
    nameAr: "سماعات سامسونج جالاكسي بودز برو",
    category: "Accessories",
    categoryAr: "إكسسوارات",
    basePrice: 119.00,
    desc: "Premium true wireless earbuds with Intelligent Active Noise Cancelling, immersive 360 Audio, and crystal clear calls.",
    descAr: "سماعات لاسلكية ممتازة مع إلغاء ضوضاء نشط ذكي وصوت غامر ثلاثي الأبعاد ومقاومة للماء.",
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=400"],
    stock: 18,
    visible: true,
    options: [],
    variants: []
  },
  {
    id: "prod-samsung-watch-ultra",
    name: "Samsung Galaxy Watch Ultra",
    nameAr: "ساعة سامسونج جالاكسي واتش ألترا",
    category: "Watch",
    categoryAr: "ساعات ذكية",
    basePrice: 649.00,
    desc: "Ultimate outdoor smartwatch with Grade 4 Titanium casing, Dual-frequency GPS, extreme sports features, and long-lasting adventure battery.",
    descAr: "أقوى ساعة ذكية للمغامرات بهيكل تيتانيوم متين وتتبع دقيق للموقع وشاشة فائقة السطوع.",
    imageUrl: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&q=80&w=400"],
    stock: 8,
    visible: true,
    options: [],
    variants: []
  }
];

// 3. Complete 20-Product Catalog Preset (Full Premium Restoration)
const COMPLETE_20_PRODUCT_PRESET: Product[] = [
  // Power banks (3)
  {
    id: "prod-gl-pocket10k",
    name: "Green Lion Pocket 10000mAh",
    nameAr: "شاحن سفري جرين ليون 10000 مللي أمبير",
    category: "Power bank",
    categoryAr: "شواحن سفري",
    basePrice: 20.00,
    desc: "Compact external battery with 22.5W super-fast charging, built-in Lightning & Type-C cables, and LED status display.",
    descAr: "بطارية خارجية مدمجة مع شحن فائق السرعة بقدرة 22.5 واط، كابلات لايتنينج وتايب سي مدمجة، وشاشة عرض حالة LED.",
    imageUrl: "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&q=80&w=400"],
    stock: 12,
    visible: true,
    options: [],
    variants: [],
    featured: true
  },
  {
    id: "prod-gl-transparent20w",
    name: "Green Lion Transparent Pro 20W",
    nameAr: "شاحن سفري جرين ليون الشفاف برو 20 واط",
    category: "Power bank",
    categoryAr: "شواحن سفري",
    basePrice: 28.00,
    desc: "Cyberpunk transparent body design with dual USB-C Power Delivery and real-time charging speed monitoring screen.",
    descAr: "تصميم هيكل شفاف سايبربانك مع منفذين توصيل طاقة USB-C وشاشة مراقبة سرعة الشحن في الوقت الفعلي.",
    imageUrl: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=400"],
    stock: 10,
    visible: true,
    options: [],
    variants: []
  },
  {
    id: "prod-wiwu-magsafe10k",
    name: "WIWU MagSafe Power Bank 10000mAh",
    nameAr: "شاحن وي وو ماغ سيف 10000 مللي أمبير",
    category: "Power bank",
    categoryAr: "شواحن سفري",
    basePrice: 35.00,
    desc: "Magnetic wireless portable charger with foldable stand and fast charging compatibility for MagSafe iPhones.",
    descAr: "شاحن لاسلكي مغناطيسي محمول مع حامل قابل للطي وشحن سريع متوافق مع هواتف آيفون.",
    imageUrl: "https://images.unsplash.com/photo-1622445262465-2481c857535a?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1622445262465-2481c857535a?auto=format&fit=crop&q=80&w=400"],
    stock: 30,
    visible: true,
    options: [],
    variants: []
  },
  // Shaving Machines (2)
  {
    id: "prod-gl-protrim",
    name: "Green Lion Pro Trim Duo Hair Clipper",
    nameAr: "ماكينة حلاقة جرين ليون برو تريم دو",
    category: "Shaving Machine",
    categoryAr: "ماكينات حلاقة",
    basePrice: 45.00,
    desc: "Precision cordless shaving machine with custom ceramic blades, waterproof body, and 120-minute battery life.",
    descAr: "ماكينة حلاقة لاسلكية دقيقة مع شفرات سيراميك مخصصة، هيكل مقاوم للماء، وعمر بطارية يصل إلى 120 دقيقة.",
    imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=400"],
    stock: 15,
    visible: true,
    options: [],
    variants: [],
    featured: true
  },
  {
    id: "prod-gl-ultimate-clipper",
    name: "Green Lion Ultimate Shaving Machine",
    nameAr: "ماكينة حلاقة جرين ليون ألتيميت الاحترافية",
    category: "Shaving Machine",
    categoryAr: "ماكينات حلاقة",
    basePrice: 39.00,
    desc: "High-performance rechargeable professional trimmer with carbon steel blades and multiple guide combs.",
    descAr: "ماكينة حلاقة احترافية عالية الأداء قابلة لإعادة الشحن مع شفرات فولاذية متينة.",
    imageUrl: "https://images.unsplash.com/photo-1621607511816-6abf7fa40d83?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1621607511816-6abf7fa40d83?auto=format&fit=crop&q=80&w=400"],
    stock: 22,
    visible: true,
    options: [],
    variants: []
  },
  // Watches (3)
  {
    id: "prod-amazfit-active-edge",
    name: "Amazfit Active Edge",
    nameAr: "ساعة أمازفيت أكتيف إيدج الذكية",
    category: "Watch",
    categoryAr: "ساعات ذكية",
    basePrice: 139.00,
    desc: "Rugged and stylish outdoor smartwatch with multi-GNSS tracking, 10 ATM water-resistance, and 16-day battery life.",
    descAr: "ساعة ذكية رياضية متينة مقاومة للماء والغبار مع تتبع جي بي إس متقدم وبطارية تدوم حتى 16 يوماً.",
    imageUrl: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=400"],
    stock: 15,
    visible: true,
    options: [],
    variants: [],
    featured: true
  },
  {
    id: "prod-samsung-watch-ultra-bulk",
    name: "Samsung Galaxy Watch Ultra",
    nameAr: "ساعة سامسونج جالاكسي واتش ألترا",
    category: "Watch",
    categoryAr: "ساعات ذكية",
    basePrice: 649.00,
    desc: "Ultimate outdoor smartwatch with Grade 4 Titanium casing, Dual-frequency GPS, extreme sports features, and long-lasting adventure battery.",
    descAr: "أقوى ساعة ذكية للمغامرات بهيكل تيتانيوم متين وتتبع دقيق للموقع وشاشة فائقة السطوع.",
    imageUrl: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&q=80&w=400"],
    stock: 8,
    visible: true,
    options: [],
    variants: [],
    featured: true
  },
  {
    id: "prod-samsung-watch-active2",
    name: "Samsung Galaxy Watch Active 2",
    nameAr: "ساعة سامسونج جالاكسي واتش أكتيف 2",
    category: "Watch",
    categoryAr: "ساعات ذكية",
    basePrice: 179.00,
    desc: "Sleek and lightweight aluminum GPS smartwatch with advanced fitness tracking and customizable style.",
    descAr: "ساعة ذكية خفيفة الوزن من الألومنيوم مع تتبع متقدم للنشاط البدني.",
    imageUrl: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=400"],
    stock: 14,
    visible: true,
    options: [],
    variants: []
  },
  // Accessories & Chargers & Microphones (4)
  {
    id: "prod-gan-65w",
    name: "GaN 65W Fast Charger Duo",
    nameAr: "شاحن سريع GaN بقوة 65 واط ثنائي",
    category: "Accessories",
    categoryAr: "إكسسوارات",
    basePrice: 25.00,
    desc: "Ultra-compact Gallium Nitride high-efficiency wall adapter with dual USB-C and single USB-A ports.",
    descAr: "شاحن جداري عالي الكفاءة من غاليوم نيتريد مدمج للغاية مع منفذين USB-C ومنفذ USB-A واحد.",
    imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&q=80&w=400"],
    stock: 20,
    visible: true,
    options: [],
    variants: []
  },
  {
    id: "prod-wiwu-3in1-charger-bulk",
    name: "WIWU 3 in 1 wireless charger",
    nameAr: "شاحن لاسلكي 3 في 1 من وي وو",
    category: "Accessories",
    categoryAr: "إكسسوارات",
    basePrice: 45.00,
    desc: "Fast wireless charging station for iPhone, Apple Watch, and AirPods with elegant aluminum body and foldable design.",
    descAr: "منصة شحن لاسلكي سريعة لهواتف آيفون وساعات آبل وسماعات إيربودز بتصميم مدمج وأنيق.",
    imageUrl: "https://images.unsplash.com/photo-1622445262465-2481c857535a?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1622445262465-2481c857535a?auto=format&fit=crop&q=80&w=400"],
    stock: 25,
    visible: true,
    options: [],
    variants: [],
    featured: true
  },
  {
    id: "prod-samsung-buds-pro-bulk",
    name: "Samsung Galaxy Buds Pro",
    nameAr: "سماعات سامسونج جالاكسي بودز برو",
    category: "Accessories",
    categoryAr: "إكسسوارات",
    basePrice: 119.00,
    desc: "Premium true wireless earbuds with Intelligent Active Noise Cancelling, immersive 360 Audio, and crystal clear calls.",
    descAr: "سماعات لاسلكية ممتازة مع إلغاء ضوضاء نشط ذكي وصوت غامر ثلاثي الأبعاد ومقاومة للماء.",
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=400"],
    stock: 18,
    visible: true,
    options: [],
    variants: []
  },
  {
    id: "prod-hx-quadcast",
    name: "HyperX QuadCast S",
    nameAr: "ميكروفون هايبر إكس كواد كاست إس",
    category: "Accessories",
    categoryAr: "إكسسوارات",
    basePrice: 159.99,
    desc: "Premium USB condenser microphone with radiant customizable RGB lighting, anti-vibration shock mount, and tap-to-mute sensor.",
    descAr: "ميكروفون احترافي للألعاب وصناع المحتوى مع إضاءة آر جي بي مخصصة وحامل مضاد للاهتزاز.",
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=400"],
    stock: 10,
    visible: true,
    options: [],
    variants: [],
    featured: true
  },
  // Keyboards (1)
  {
    id: "prod-hx-origins-bulk",
    name: "HyperX Alloy Origins",
    nameAr: "لوحة مفاتيح هايبر إكس ألوي أوريجينز",
    category: "Keyboards",
    categoryAr: "لوحات المفاتيح",
    basePrice: 109.99,
    desc: "Mechanical gaming keyboard with custom HyperX tactile/linear mechanical switches, full aircraft-grade aluminum body, and radiant RGB backlighting.",
    descAr: "لوحة مفاتيح ميكانيكية متينة للألعاب مع إضاءة آر جي بي وهيكل ألومنيوم مقاوم.",
    imageUrl: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&q=80&w=400"],
    stock: 15,
    visible: true,
    options: [],
    variants: [],
    featured: true
  },
  // Headsets (2)
  {
    id: "prod-hx-cloud2-bulk",
    name: "HyperX Cloud Headset II",
    nameAr: "سماعة هايبر إكس كلاود 2",
    category: "Headsets",
    categoryAr: "سماعات الرأس",
    basePrice: 99.99,
    desc: "Premium gaming headset featuring high-fidelity virtual 7.1 surround sound, supreme memory foam ear cushions, and durable aluminum frame.",
    descAr: "سماعة الألعاب الأسطورية ذات الصوت المحيطي المذهل وراحة متناهية للأذن.",
    imageUrl: "https://images.unsplash.com/photo-1606220532402-13a0022277ee?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1606220532402-13a0022277ee?auto=format&fit=crop&q=80&w=400"],
    stock: 20,
    visible: true,
    options: [],
    variants: [],
    featured: true
  },
  {
    id: "prod-logi-gprox-bulk",
    name: "Logitech G Pro X Headset",
    nameAr: "سماعة لوجيتك جي برو إكس",
    category: "Headsets",
    categoryAr: "سماعات الرأس",
    basePrice: 129.99,
    desc: "Pro-grade gaming headset featuring Blue VO!CE mic filters, precision 50mm PRO-G drivers, and premium memory foam comfort.",
    descAr: "سماعة رأس احترافية مع فلاتر ميكروفون متقدمة وصوت محيطي عالي الجودة.",
    imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=400"],
    stock: 12,
    visible: true,
    options: [],
    variants: []
  },
  // Mouse (2)
  {
    id: "prod-logi-g502-bulk",
    name: "Logitech G502 LIGHTSPEED",
    nameAr: "ماوس لوجيتك جي 502 لاسلكي",
    category: "Mouse",
    categoryAr: "فأرة ألعاب",
    basePrice: 149.99,
    desc: "Legendary high-performance wireless gaming mouse with HERO 25K optical sensor, weight customization, and dual-mode scroll wheel.",
    descAr: "فأرة ألعاب لاسلكية فائقة السرعة والاستجابة مع مستشعر هيرو المتطور.",
    imageUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=400"],
    stock: 25,
    visible: true,
    options: [],
    variants: []
  },
  {
    id: "prod-hx-haste",
    name: "HyperX Pulsefire Haste",
    nameAr: "ماوس هايبر إكس هاسيت الخفيف",
    category: "Mouse",
    categoryAr: "فأرة ألعاب",
    basePrice: 49.99,
    desc: "Ultra-lightweight honeycomb gaming mouse with custom gold micro switches and hyper-flexible paracord cable.",
    descAr: "ماوس ألعاب خفيف الوزن بتصميم خلايا النحل الفريد لحركة فائقة السرعة.",
    imageUrl: "https://images.unsplash.com/photo-1625842268584-8f329044697c?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1625842268584-8f329044697c?auto=format&fit=crop&q=80&w=400"],
    stock: 40,
    visible: true,
    options: [],
    variants: []
  },
  // Racing Wheel (1)
  {
    id: "prod-logi-g29-bulk",
    name: "Logitech G29 Driving Force",
    nameAr: "مقود ألعاب لوجيتك جي 29",
    category: "Racing Wheel",
    categoryAr: "مقود ألعاب",
    basePrice: 299.99,
    desc: "Dual-motor force feedback racing wheel with hand-stitched leather rim, steel paddle shifters, and adjustable non-slip floor pedals.",
    descAr: "عجلة قيادة محاكاة السباق الواقعية مع دواسات أرضية قابلة للتعديل.",
    imageUrl: "https://images.unsplash.com/photo-1595152230535-09a220952850?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1595152230535-09a220952850?auto=format&fit=crop&q=80&w=400"],
    stock: 8,
    visible: true,
    options: [],
    variants: []
  },
  // Cables (1)
  {
    id: "prod-gl-cable3in1",
    name: "Green Lion 3-in-1 Braided Cable",
    nameAr: "سلك شاحن جرين ليون 3 في 1 مضفر",
    category: "Cables",
    categoryAr: "كابلات",
    basePrice: 15.00,
    desc: "Highly durable multi-charging nylon braided cord with Lightning, Type-C, and Micro USB connectors.",
    descAr: "كابل شحن متعدد الاستخدامات مضفر بالنايلون عالي المتانة مع موصلات لايتنينج وتايب سي وميكرو يو إس بي.",
    imageUrl: "https://images.unsplash.com/photo-1557853197-aefb550b6fdc?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1557853197-aefb550b6fdc?auto=format&fit=crop&q=80&w=400"],
    stock: 50,
    visible: true,
    options: [],
    variants: []
  },
  // Cases (1)
  {
    id: "prod-gl-ruggedcase",
    name: "Green Lion Rugged Armor Case",
    nameAr: "كفر حماية جرين ليون المدرع",
    category: "Cases",
    categoryAr: "كفرات حماية",
    basePrice: 18.00,
    desc: "Extreme drop protection shockproof clear back case with reinforced corners for iPhone models.",
    descAr: "كفر حماية فائق المتانة ومقاوم للصدمات مع زوايا معززة لحماية هواتف آيفون.",
    imageUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=400",
    imageUrls: ["https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=400"],
    stock: 35,
    visible: true,
    options: [],
    variants: []
  }
];

export const ManageProducts: React.FC<ManageProductsProps> = ({
  products,
  setProducts,
  showToast,
}) => {
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  
  // Bulk Recovery Hub UI State
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [pastedCSV, setPastedCSV] = useState("");
  const [isImporting, setIsImporting] = useState(false);

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
          console.error("Error updating visibility:", error);
          setProducts((prev) => prev.map((p) => p.id === id ? { ...p, visible: nextVisible } : p));
          showToast("Offline Fallback: Product updated locally!", "success");
        });
    } catch (e) {
      console.error("Synchronous error during updateDoc:", e);
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, visible: nextVisible } : p));
      showToast("Offline Fallback: Product updated locally!", "success");
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
          console.error("Error deleting product:", error);
          setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
          showToast(`Offline Fallback: Deleted "${deleteTarget.name}" locally!`, "success");
          setDeleteTarget(null);
        });
    } catch (e) {
      console.error("Synchronous error during deleteDoc:", e);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      showToast(`Offline Fallback: Deleted "${deleteTarget.name}" locally!`, "success");
      setDeleteTarget(null);
    }
  };

  // Function to load and write a batch of products to Firestore
  const importBatch = async (batchList: Product[]) => {
    setIsImporting(true);
    let successCount = 0;
    
    for (const prod of batchList) {
      try {
        await setDoc(doc(db, "products", prod.id), prod);
        successCount++;
      } catch (err) {
        console.error(`Failed to seed prod "${prod.name}":`, err);
      }
    }

    // Refresh state list
    setProducts((prev) => {
      // Avoid duplicate IDs in UI cache state
      const filtered = prev.filter(p => !batchList.some(b => b.id === p.id));
      return [...batchList, ...filtered];
    });

    setIsImporting(false);
    showToast(`Successfully imported ${successCount} product records to Firestore!`, "success");
  };

  // CSV Text Parsing Logic
  const handleCSVImport = () => {
    if (!pastedCSV.trim()) {
      showToast("Please paste CSV data first.", "error");
      return;
    }

    try {
      const lines = pastedCSV.split("\n");
      const results: Product[] = [];
      
      // Let's look for headings or assume structure: Name, Category, Stock, Price, Description
      // We skip empty lines
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Skip header lines if user left them in
        if (i === 0 && (line.toLowerCase().includes("name") || line.toLowerCase().includes("product") || line.toLowerCase().includes("اسم"))) {
          continue;
        }

        // Split by comma or tab
        const cols = line.split(/,|\t/).map(c => c.replace(/^["']|["']$/g, "").trim());
        if (cols.length < 2) continue;

        const name = cols[0];
        const category = cols[1] || "Uncategorized";
        const stockStr = cols[2] || "10";
        const priceStr = cols[3] || "49.99";
        const desc = cols[4] || "Imported product entry.";
        
        const price = parseFloat(priceStr.replace(/[^0-9.]/g, "")) || 49.99;
        const stock = parseInt(stockStr.replace(/[^0-9]/g, "")) || 10;
        const cleanId = `prod-${Math.random().toString(36).substring(2, 9)}`;

        results.push({
          id: cleanId,
          name,
          category,
          basePrice: price,
          desc,
          imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=400",
          imageUrls: ["https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=400"],
          stock,
          visible: true,
          options: [],
          variants: []
        });
      }

      if (results.length === 0) {
        showToast("No valid rows could be parsed. Check your format.", "error");
        return;
      }

      importBatch(results);
      setPastedCSV("");
    } catch (err: any) {
      showToast(`Error parsing CSV text: ${err.message}`, "error");
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Interactive Bulk Recovery & Import Hub Card */}
      <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl overflow-hidden shadow-xs transition">
        <button
          type="button"
          onClick={() => setIsHubOpen(!isHubOpen)}
          className="w-full px-4 py-3 bg-slate-100 flex items-center justify-between text-left hover:bg-slate-150 transition"
        >
          <div className="flex items-center gap-2">
            <Database size={15} className="text-[#0F172A]" />
            <div>
              <span className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                Bulk Recovery & CSV Import Hub
              </span>
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                Restore database from Excel, CSV, or custom presets
              </span>
            </div>
          </div>
          {isHubOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {isHubOpen && (
          <div className="p-4 space-y-4 border-t border-slate-200 bg-white animate-fade-in">
            {/* Quick Presets Grid */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                1-Click Catalog Recovery Presets:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* HyperX & Logitech Setup */}
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={() => importBatch(HYPERX_LOGITECH_PRESET)}
                  className="p-3 bg-slate-50 hover:bg-[#F1F5F9] border border-slate-200 hover:border-slate-300 rounded-xl transition text-left flex items-start gap-2.5 group cursor-pointer disabled:opacity-50"
                >
                  <FileSpreadsheet size={16} className="text-blue-600 group-hover:scale-110 transition shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[11px] font-black text-slate-800 uppercase tracking-wider">
                      HyperX & Logitech Preset
                    </span>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                      Loads: Alloy Origins, Cloud Headsets, Logitech G502 & G29
                    </span>
                  </div>
                </button>

                {/* June 2026 Original */}
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={() => importBatch(ORIGINAL_JUNE_PRESET)}
                  className="p-3 bg-slate-50 hover:bg-[#F1F5F9] border border-slate-200 hover:border-slate-300 rounded-xl transition text-left flex items-start gap-2.5 group cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={16} className="text-yellow-600 group-hover:rotate-45 transition shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[11px] font-black text-slate-800 uppercase tracking-wider">
                      June 2026 Original Preset
                    </span>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                      Loads: Amazfit Active Edge, WIWU 3-in-1, Galaxy Buds Pro, Watch Ultra
                    </span>
                  </div>
                </button>

                {/* Full 20-Product Premium Recovery Button */}
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={() => importBatch(COMPLETE_20_PRODUCT_PRESET)}
                  className="p-3 bg-emerald-50/50 hover:bg-emerald-50 border-2 border-emerald-200 hover:border-emerald-300 rounded-xl transition text-left flex items-start gap-2.5 group cursor-pointer disabled:opacity-50 col-span-1 md:col-span-2"
                >
                  <Database size={16} className="text-emerald-600 group-hover:scale-110 transition shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <span className="block text-[11px] font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      1-Click Restore Full 20-Product Premium Catalog
                      <span className="bg-emerald-600 text-white text-[8px] px-1 py-0.2 rounded font-black uppercase tracking-tight">RECOMMENDED</span>
                    </span>
                    <span className="block text-[9px] text-emerald-700/80 font-bold uppercase mt-0.5">
                      Loads all 20 original products categorized by Department with Arabic translations, precise pricing, stock levels, and homepage 'featured' pins.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Direct CSV / Table pasting area */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Paste Tabbed or Comma-Separated Data (CSV / Excel):
                </span>
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-wider">
                  Format: Name, Category, Stock, Price, Description
                </span>
              </div>
              
              <div className="space-y-2">
                <textarea
                  value={pastedCSV}
                  onChange={(e) => setPastedCSV(e.target.value)}
                  placeholder="e.g.&#10;HyperX Alloy Origins,Keyboards,15,109.99,Mechanical keyboard&#10;Logitech G Pro X,Headsets,12,129.99,Professional headset"
                  rows={4}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold font-mono outline-none focus:ring-2 focus:ring-slate-900 transition resize-none"
                />
                
                <div className="flex gap-2 justify-end">
                  {pastedCSV.trim() && (
                    <button
                      type="button"
                      onClick={() => setPastedCSV("")}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-wider transition"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isImporting}
                    onClick={handleCSVImport}
                    className="px-4 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 size={10} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Play size={9} strokeWidth={3} className="text-yellow-400" />
                        <span>Parse & Save directly to Cloud</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 border border-slate-100 rounded-2xl">
          <Package size={36} className="text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-black text-slate-500">Your inventory is currently empty</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Go to 'Add Product' or run a 1-click Recovery preset above.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {products.map((p) => {
            const hasVariants = p.options?.length > 0 && p.variants?.length > 0;
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
