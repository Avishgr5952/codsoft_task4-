export type Role = 'CUSTOMER' | 'VENDOR' | 'DELIVERY_PARTNER' | 'ADMIN';
export type VendorStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type DeliveryStatus = 'ASSIGNED' | 'ACCEPTED' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED';
export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  vendorProfile?: Vendor;
  deliveryPartner?: DeliveryPartner;
  addresses?: Address[];
}

export interface Vendor {
  id: string;
  userId: string;
  storeName: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  status: VendorStatus;
  commissionRate: number;
  isVerified: boolean;
  createdAt: string;
  user?: Partial<User>;
}

export interface DeliveryPartner {
  id: string;
  userId: string;
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
  status: string;
  user?: Partial<User>;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  parentId?: string | null;
  children?: Category[];
  _count?: {
    products: number;
  };
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  alt?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductSpecification {
  id: string;
  productId: string;
  key: string;
  value: string;
}

export interface Inventory {
  id: string;
  productId: string;
  sku: string;
  availableQuantity: number;
  reservedQuantity: number;
  soldQuantity: number;
  lowStockThreshold: number;
  updatedAt: string;
}

export interface Product {
  id: string;
  vendorId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  discount?: number;
  sku: string;
  isPublished: boolean;
  isFeatured: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  images: ProductImage[];
  specifications?: ProductSpecification[];
  inventory?: Inventory;
  category?: Category;
  vendor?: Vendor;
  reviews?: Review[];
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  discount?: number;
  image: string | null;
  quantity: number;
  availableStock: number;
  isAvailable: boolean;
  totalPrice: number;
}

export interface VendorCartGroup {
  vendorId: string;
  storeName: string;
  slug: string;
  items: CartItem[];
  subtotal: number;
}

export interface CartSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  grandTotal: number;
  totalItems: number;
}

export interface CartData {
  cartId: string;
  itemsCount: number;
  vendorGroups: VendorCartGroup[];
  summary: CartSummary;
}

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface OrderItem {
  id: string;
  orderId: string;
  vendorOrderId?: string;
  productId: string;
  productName: string;
  productSku: string;
  productPrice: number;
  quantity: number;
  totalPrice: number;
  product?: Partial<Product>;
  vendorOrder?: Partial<VendorOrder>;
}

export interface VendorOrder {
  id: string;
  orderId: string;
  vendorId: string;
  subtotal: number;
  commission: number;
  netEarnings: number;
  status: OrderStatus;
  trackingNumber?: string;
  createdAt: string;
  vendor?: Vendor;
  order?: Order;
  orderItems?: OrderItem[];
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  couponCode?: string;
  shippingAddress: any;
  billingAddress?: any;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: Partial<User>;
  orderItems: OrderItem[];
  vendorOrders: VendorOrder[];
  payment?: any;
  deliveries?: any[];
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

export interface Coupon {
  id: string;
  vendorId?: string | null;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}
