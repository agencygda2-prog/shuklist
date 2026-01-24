// Database Types for ShukList

export interface User {
  id: string;
  email: string;
  name: string;
  town: string;
  role: 'admin' | 'user';
  notification_towns: string[]; // Towns user wants notifications from
  notification_preferences: NotificationPreferences;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  new_promotions: boolean;
  price_drops: boolean;
  new_products: boolean;
  promotion_ending_soon: boolean;
}

export interface Store {
  id: string;
  name: string;
  town: string;
  address?: string;
  created_at: string;
  created_by?: string;
}

export interface Product {
  id: string;
  name: string;
  brand?: string;
  category: string;
  barcode?: string;
  default_unit: string;
  image_url?: string;
  created_by: string;
  created_at: string;
}

export interface Price {
  id: string;
  product_id: string;
  store_id: string;
  price: number;
  unit: string;
  is_promotion: boolean;
  promotion_end_date?: string;
  date_recorded: string;
  photo_url?: string;
  notes?: string;
  created_by: string;
  verified_by: string[]; // Array of user IDs who verified this price
  created_at: string;
  updated_at: string;
  // Joined data
  product?: Product;
  store?: Store;
  created_by_user?: Partial<User>;
}

export interface ShoppingList {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItem {
  id: string;
  list_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  // Joined data
  product?: Product;
  current_prices?: Price[];
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'new_promotion' | 'price_drop' | 'new_product' | 'promotion_ending';
  title: string;
  message: string;
  related_product_id?: string;
  related_store_id?: string;
  read: boolean;
  created_at: string;
  // Joined data
  product?: Product;
  store?: Store;
}

export interface PriceFlag {
  id: string;
  price_id: string;
  flagged_by: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  // Joined data
  price?: Price;
  flagged_by_user?: Partial<User>;
}

// Categories (predefined list)
export const PRODUCT_CATEGORIES = [
  'Pasta & Rice',
  'Bread & Bakery',
  'Dairy & Eggs',
  'Meat & Fish',
  'Fruits & Vegetables',
  'Frozen Foods',
  'Pantry & Sauces',
  'Oils & Condiments',
  'Snacks & Sweets',
  'Beverages',
  'Coffee & Tea',
  'Household & Cleaning',
  'Personal Care',
  'Baby Products',
  'Pet Food',
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

// Default towns in the area (can be extended by users)
export const DEFAULT_TOWNS = [
  'Grottaminarda',
  'Villanova del Battista',
  'Ariano Irpino',
  'Flumeri',
] as const;

// Open Food Facts API Response
export interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  brands?: string;
  categories?: string;
  quantity?: string;
  image_url?: string;
  image_small_url?: string;
}

export interface OpenFoodFactsResponse {
  status: number;
  status_verbose: string;
  product?: OpenFoodFactsProduct;
}

// Shopping Comparison Results
export interface StoreComparison {
  store: Store;
  total_price: number;
  items_available: number;
  items_missing: number;
  savings_vs_most_expensive: number;
}

export interface SplitShoppingOption {
  stores: {
    store: Store;
    items: ShoppingListItem[];
    subtotal: number;
  }[];
  total_price: number;
  savings_vs_single_store: number;
}
