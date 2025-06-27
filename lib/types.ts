import { Message } from 'ai';

export type ChatHistory = Message[];

export interface Product {
  id: string;
  active?: boolean;
  name?: string;
  description?: string;
  image?: string;
  metadata?: Record<string, any>;
}

export interface Price {
  id: string;
  product_id?: string;
  active?: boolean;
  description?: string;
  unit_amount?: number;
  currency?: string;
  type?: string;
  interval?: string;
  interval_count?: number;
  trial_period_days?: number | null;
  metadata?: Record<string, any>;
}

export interface ProductWithPrices extends Product {
  prices: Price[];
}
