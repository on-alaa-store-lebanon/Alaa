import { Product, StoreSettings } from "./types";

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Green Lion Pocket 10000mAh",
    category: "Power bank",
    basePrice: 20.00,
    desc: "Compact external battery with 22.5W super-fast charging, built-in Lightning & Type-C cables, and LED status display.",
    nameAr: "شاحن سفري جرين ليون 10000 مللي أمبير",
    descAr: "بطارية خارجية مدمجة مع شحن فائق السرعة بقدرة 22.5 واط، كابلات لايتنينج وتايب سي مدمجة، وشاشة عرض حالة LED.",
    categoryAr: "شواحن سفري",
    imageUrl: "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&q=80&w=400",
    imageUrls: [
      "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1585338111116-20092c2069b2?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1622445262465-2481c857535a?auto=format&fit=crop&q=80&w=400"
    ],
    stock: 12,
    visible: true,
    options: [
      { name: "Color", values: ["Midnight Black", "Arctic White", "Deep Blue"] }
    ],
    variants: [
      { id: "p1-v1", combo: { "Color": "Midnight Black" }, price: 20.00, stock: 5 },
      { id: "p1-v2", combo: { "Color": "Arctic White" }, price: 20.00, stock: 7 },
      { id: "p1-v3", combo: { "Color": "Deep Blue" }, price: 22.00, stock: 0 }
    ]
  },
  {
    id: "p2",
    name: "Green Lion Transparent Pro 20W",
    category: "Power bank",
    basePrice: 28.00,
    desc: "Cyberpunk transparent body design with dual USB-C Power Delivery and real-time charging speed monitoring screen.",
    nameAr: "شاحن سفري جرين ليون الشفاف برو 20 واط",
    descAr: "تصميم هيكل شفاف سايبربانك مع منفذين توصيل طاقة USB-C وشاشة مراقبة سرعة الشحن في الوقت الفعلي.",
    categoryAr: "شواحن سفري",
    imageUrl: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=400",
    imageUrls: [
      "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=400"
    ],
    stock: 0, // SOLD OUT completely to test "Hide out-of-stock items" feature
    visible: true,
    options: [],
    variants: []
  },
  {
    id: "p3",
    name: "Green Lion Pro Trim Duo Hair Clipper",
    category: "Shaving Machine",
    basePrice: 45.00,
    desc: "Precision cordless shaving machine with custom ceramic blades, waterproof body, and 120-minute battery life.",
    nameAr: "ماكينة حلاقة جرين ليون برو تريم دو",
    descAr: "ماكينة حلاقة لاسلكية دقيقة مع شفرات سيراميك مخصصة، هيكل مقاوم للماء، وعمر بطارية يصل إلى 120 دقيقة.",
    categoryAr: "ماكينات حلاقة",
    imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=400",
    imageUrls: [
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1621607511816-6abf7fa40d83?auto=format&fit=crop&q=80&w=400"
    ],
    stock: 15,
    visible: true,
    options: [
      { name: "Edition", values: ["Standard Edition", "Golden Edition"] }
    ],
    variants: [
      { id: "p3-v1", combo: { "Edition": "Standard Edition" }, price: 45.00, stock: 10 },
      { id: "p3-v2", combo: { "Edition": "Golden Edition" }, price: 55.00, stock: 5 }
    ]
  },
  {
    id: "p4",
    name: "GaN 65W Fast Charger Duo",
    category: "Accessories",
    basePrice: 25.00,
    desc: "Ultra-compact Gallium Nitride high-efficiency wall adapter with dual USB-C and single USB-A ports.",
    nameAr: "شاحن سريع GaN بقوة 65 واط ثنائي",
    descAr: "شاحن جداري عالي الكفاءة من غاليوم نيتريد مدمج للغاية مع منفذين USB-C ومنفذ USB-A واحد.",
    categoryAr: "إكسسوارات",
    imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&q=80&w=400",
    imageUrls: [
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&q=80&w=400"
    ],
    stock: 20,
    visible: true,
    options: [],
    variants: []
  }
];

export const DEFAULT_SETTINGS: StoreSettings = {
  title: "ON ALAA STORE",
  phone: "96171135241",
  description: "Premium Mobile Store Lebanon — Your Hub for Power Banks, Grooming Gear, and Authentic Mobile Accessories.",
  instagram: "onlymobilestore.lb",
  locationUrl: "https://maps.google.com/?q=Beirut,Lebanon",
  profilePicUrl: null,
  headerVideoUrl: "https://assets.mixkit.co/videos/preview/mixkit-circuit-board-details-close-up-34289-large.mp4",
  titleAr: "متجر علي الإلكتروني",
  descriptionAr: "متجر الهواتف الأول في لبنان - وجهتك للحصول على الشواحن السفرية، ماكينات الحلاقة، وإكسسوارات الهواتف الأصلية."
};
