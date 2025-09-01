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

// Categories table - for organizing content
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  color: text('color').default('#3B82F6'), // Hex color for UI
  icon: text('icon'), // Icon identifier
  parentId: text('parent_id').references(() => categories.id), // For nested categories
  sortOrder: integer('sort_order').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Files/Media table - for file uploads and management
export const files = sqliteTable('files', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  fileName: text('file_name').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(), // in bytes
  filePath: text('file_path').notNull(), // storage path
  fileUrl: text('file_url'), // public URL
  uploadedById: text('uploaded_by_id').references(() => users.id),
  alt: text('alt'), // Alt text for accessibility
  caption: text('caption'),
  metadata: text('metadata'), // JSON string for EXIF, dimensions, etc.
  isPublic: integer('is_public', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Tags table - for flexible content tagging
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  color: text('color').default('#6B7280'), // Hex color for UI
  usage_count: integer('usage_count').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Post-Tag junction table (many-to-many)
export const postTags = sqliteTable('post_tags', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  postId: text('post_id').references(() => posts.id),
  tagId: text('tag_id').references(() => tags.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// User sessions table - for authentication and activity tracking
export const userSessions = sqliteTable('user_sessions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id),
  sessionToken: text('session_token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  location: text('location'), // Geographic location
  device: text('device'), // Device information
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  lastActivityAt: integer('last_activity_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
});

// Settings table - for application settings
export const settings = sqliteTable('settings', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  key: text('key').notNull().unique(),
  value: text('value'), // JSON string for complex values
  type: text('type', { enum: ['string', 'number', 'boolean', 'json'] }).default('string'),
  description: text('description'),
  category: text('category').default('general'),
  isPublic: integer('is_public', { mode: 'boolean' }).default(false),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Notifications table - for user notifications
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type', { enum: ['info', 'success', 'warning', 'error'] }).default('info'),
  actionUrl: text('action_url'), // Optional URL for notification action
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Events table - for calendar/scheduling functionality
export const events = sqliteTable('events', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  description: text('description'),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }),
  isAllDay: integer('is_all_day', { mode: 'boolean' }).default(false),
  location: text('location'),
  organizerId: text('organizer_id').references(() => users.id),
  attendees: text('attendees'), // JSON array of user IDs
  status: text('status', { enum: ['draft', 'published', 'cancelled'] }).default('draft'),
  color: text('color').default('#3B82F6'),
  metadata: text('metadata'), // JSON for additional data
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
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
  categories,
  files,
  tags,
  postTags,
  userSessions,
  settings,
  notifications,
  events,
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
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type PostTag = typeof postTags.$inferSelect;
export type NewPostTag = typeof postTags.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
