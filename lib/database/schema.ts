import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

// Users table - example schema for AI to work with
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  avatar: text('avatar'),
  role: text('role', { enum: ['user', 'admin', 'moderator'] }).default('user'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Posts table - example schema for AI to work with
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  content: text('content'),
  authorId: text('author_id').references(() => users.id),
  status: text('status', { enum: ['draft', 'published', 'archived'] }).default('draft'),
  tags: text('tags'), // JSON string of tags
  viewCount: integer('view_count').default(0),
  likeCount: integer('like_count').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Comments table - example schema for AI to work with  
export const comments = sqliteTable('comments', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  content: text('content').notNull(),
  postId: text('post_id').references(() => posts.id),
  authorId: text('author_id').references(() => users.id),
  parentId: text('parent_id'), // For nested comments
  isApproved: integer('is_approved', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Products table - example e-commerce schema for AI to work with
export const products = sqliteTable('products', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  currency: text('currency').default('USD'),
  sku: text('sku').unique(),
  stock: integer('stock').default(0),
  category: text('category'),
  images: text('images'), // JSON string of image URLs
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Orders table - example e-commerce schema for AI to work with
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id),
  status: text('status', { enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] }).default('pending'),
  totalAmount: real('total_amount').notNull(),
  currency: text('currency').default('USD'),
  shippingAddress: text('shipping_address'), // JSON string
  billingAddress: text('billing_address'), // JSON string
  paymentMethod: text('payment_method'),
  paymentStatus: text('payment_status', { enum: ['pending', 'paid', 'failed', 'refunded'] }).default('pending'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Order items table - example e-commerce schema for AI to work with
export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orderId: text('order_id').references(() => orders.id),
  productId: text('product_id').references(() => products.id),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  totalPrice: real('total_price').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Analytics events table - for tracking user behavior
export const analyticsEvents = sqliteTable('analytics_events', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id),
  eventName: text('event_name').notNull(),
  eventData: text('event_data'), // JSON string
  sessionId: text('session_id'),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  referrer: text('referrer'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Export all schemas for AI to work with
export const schema = {
  users,
  posts,
  comments,
  products,
  orders,
  orderItems,
  analyticsEvents,
};

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;
