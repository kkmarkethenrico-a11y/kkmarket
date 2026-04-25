export type UserRole = 'client' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'banned';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  status: UserStatus;
  is_vip: boolean;
  ban_reason: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export type AnnouncementModel = 'normal' | 'dynamic';
export type AnnouncementPlan = 'silver' | 'gold' | 'diamond';
export type AnnouncementStatus = 'pending' | 'active' | 'paused' | 'rejected' | 'sold_out' | 'deleted';

export interface Announcement {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  slug: string;
  description: string;
  model: AnnouncementModel;
  plan: AnnouncementPlan;
  unit_price: number | null;
  stock_quantity: number | null;
  has_auto_delivery: boolean;
  is_vip: boolean;
  filters_data: Record<string, any> | null;
  sale_count: number;
  view_count: number;
  status: AnnouncementStatus;
  rejection_reason: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  sort_order: number;
  is_featured: boolean;
  show_in_menu: boolean;
  balance_release_days: number;
  seo_title: string | null;
  seo_description: string | null;
  custom_filters: Record<string, any> | null;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'pending_payment' | 'paid' | 'in_delivery' | 'delivered' | 'disputed' | 'refunded' | 'cancelled' | 'completed';
export type PaymentMethod = 'pix' | 'credit_card' | 'boleto' | 'wallet_balance' | 'points';

export interface Order {
  id: string;
  announcement_id: string;
  announcement_item_id: string | null;
  buyer_id: string;
  seller_id: string;
  status: OrderStatus;
  amount: number;
  platform_fee: number;
  seller_amount: number;
  payment_method: PaymentMethod | null;
  pagarme_order_id: string | null;
  pagarme_charge_id: string | null;
  escrow_release_at: string | null;
  accelerated_release: boolean;
  buyer_confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'order_payment' | 'order_revenue' | 'withdrawal' | 'refund' | 'bonus' | 'fee';

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  balance_after: number;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

// ─── Announcement listing with eager joins ────────────────────────────────────
export interface AnnouncementImage {
  url: string;
  is_cover: boolean;
  sort_order: number;
}

export interface AnnouncementSeller {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  last_seen_at: string | null;
}

export interface AnnouncementStats {
  avg_response_time_minutes: number | null;
  reviews_positive: number;
  reviews_neutral: number;
  reviews_negative: number;
}

export interface AnnouncementWithRelations extends Announcement {
  profiles: AnnouncementSeller;
  user_stats: AnnouncementStats | null;
  announcement_images: AnnouncementImage[];
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
export type ReviewType = 'positive' | 'neutral' | 'negative';
export type ReviewRole = 'buyer' | 'seller';

export interface OrderReview {
  id: string;
  order_id: string;
  reviewer_id: string;
  reviewed_id: string;
  role: ReviewRole;
  type: ReviewType;
  message: string | null;
  created_at: string;
}

export interface OrderReviewWithProfile extends OrderReview {
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

