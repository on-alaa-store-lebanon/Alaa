export interface Variant {
  id: string;
  combo: Record<string, string>;
  price: number;
  stock: number;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  desc: string;
  imageUrl: string | null;
  imageUrls: string[];
  stock: number; // Single stock value if no variants, or base default stock
  visible: boolean;
  options: ProductOption[];
  variants: Variant[];
  nameAr?: string;
  descAr?: string;
  categoryAr?: string;
  featured?: boolean;
  updatedAt?: string;
}

export interface CartItem {
  productId: string;
  variantId: string; // "base" if no variant
  name: string;
  variantLabel: string; // e.g. "Black / 128GB"
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  customer: string;
  phone: string;
  address: string;
  items: CartItem[];
  total: number;
  date: string;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  paymentMethod?: string;
  paymentStatus?: "Unpaid" | "Paid" | "Authorized";
}

export interface StoreSettings {
  title: string;
  phone: string;
  description: string;
  instagram: string;
  locationUrl: string;
  profilePicUrl: string | null;
  headerVideoUrl: string | null;
  titleAr?: string;
  descriptionAr?: string;
}

export interface Review {
  id: string;
  productId: string;
  name: string;
  rating: number;
  text: string;
  date: string;
}

