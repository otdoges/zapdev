import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { enforceRateLimit } from "./rateLimit";

// Helper function to get authenticated user
const getAuthenticatedUser = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("User must be authenticated");
  }
  return identity;
};

// Input sanitization helpers
const sanitizeContent = (content: string): string => {
  if (!content || typeof content !== 'string') {
    throw new Error("Content is required and must be a string");
  }
  
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("Content cannot be empty");
  }
  
  if (trimmed.length > 50000) { // 50KB limit
    throw new Error("Content too long (max 50,000 characters)");
  }
  
  return trimmed;
};

const sanitizeMetadata = (metadata: unknown) => {
  if (!metadata) return undefined;
  
  const meta = metadata as { model?: unknown; tokens?: unknown; cost?: unknown };
  const sanitized: { model?: string; tokens?: number; cost?: number } = {};

  if (typeof meta.model === 'string') {
    sanitized.model = meta.model.trim().substring(0, 100);
  }

  if (typeof meta.tokens === 'number' && meta.tokens >= 0) {
    sanitized.tokens = Math.floor(meta.tokens);
  }

  if (typeof meta.cost === 'number' && meta.cost >= 0) {
    sanitized.cost = Math.round(meta.cost * 100) / 100; // Round to 2 decimal places
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
};

// Rate limiting helper
const checkRateLimit = async (ctx: QueryCtx | MutationCtx, userId: string, action: string) => {
  const oneMinuteAgo = Date.now() - 60000;
  const recentMessages = await ctx.db
    .query("messages")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .filter((q) => q.gt(q.field("createdAt"), oneMinuteAgo))
    .collect();

  if (action === "create" && recentMessages.length >= 30) {
    throw new Error("Rate limit exceeded: Too many messages created recently (max 30 per minute)");
  }
  
  if (action === "update") {
    // For updates, use a more relaxed rate limit (1 per 5 seconds)
    const updateTimeWindow = 5 * 1000; // 5 seconds
    const maxUpdateRequests = 1;
    
    if (recentRequests.length >= maxUpdateRequests) {
      const oldestRequest = recentRequests[0];
      if (now - oldestRequest < updateTimeWindow) {
        throw new ConvexError("Rate limit exceeded. Please wait before updating again.");
      }
    }
  }
};

// Encryption validation helper
const validateEncryptionData = (args: {
  isEncrypted?: boolean;
  encryptedContent?: string;
  encryptionSalt?: string;
  encryptionIv?: string;
  contentChecksum?: string;
}) => {
  if (!args.isEncrypted) {
    return; // No validation needed for non-encrypted messages
  }

  // Check for required encryption fields
  if (!args.encryptedContent || !args.encryptionSalt || !args.encryptionIv || !args.contentChecksum) {
    throw new Error("Missing required encryption fields for encrypted message");
  }
  
  // Validate encrypted content length (reasonable limits)
  if (args.encryptedContent.length > 200000) { // ~150KB base64 encoded limit
    throw new Error("Encrypted content too large");
  }
  
  // Basic validation of base64 encoding
  try {
    atob(args.encryptedContent);
    atob(args.encryptionSalt);
    atob(args.encryptionIv);
  } catch (error) {
    throw new Error("Invalid base64 encoding in encryption fields");
  }
};

// Get all messages for a specific chat (only if owned by authenticated user)
export const getChatMessages = query({
  args: { 
    chatId: v.id("chats"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()), // Use createdAt timestamp as cursor for pagination
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Validate limit
    const limit = Math.min(args.limit || 100, 500); // Max 500 messages at once
    
    // First verify the user has access to this chat
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== identity.subject) {
      throw new Error("Chat not found or access denied");
    }
    
    // Build the base query on the compound index (chatId, createdAt)
    let messagesQuery = ctx.db
      .query("messages")
      .withIndex("by_chat_created", (q) => q.eq("chatId", args.chatId));


    // Add cursor-based pagination if provided
    if (args.cursor) {
      messagesQuery = messagesQuery.filter((q) =>
        q.gt(q.field("createdAt"), args.cursor!)
      );
    }
      export const getCSPConfig = (nonce?: string) => {
        const config: Record<string, string[]> = {
          'default-src': ["'self'"],
          'script-src': [
            "'self'",
            // Use nonce for inline scripts in production
            nonce ? `'nonce-${nonce}'` : "'unsafe-inline'",
            "https://cdn.jsdelivr.net", // For trusted CDNs
          ],
          'style-src': [
            "'self'",
            "'unsafe-inline'", // Often needed for CSS-in-JS
            "https://fonts.googleapis.com",
          ],
          'font-src': [
            "'self'",
            "https://fonts.gstatic.com",
          ],
          'img-src': [
            "'self'",
            "data:",
            "https:",
            "blob:",
          ],
          'connect-src': [
            "'self'",
            // Add your API endpoints here
          ],
          'frame-src': ["'none'"],
          'object-src': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"],
          'frame-ancestors': ["'none'"],
        };
      
        // Add development-specific sources
        if (process.env.NODE_ENV === 'development') {
          config['script-src'].push("'unsafe-eval'"); // For HMR
          config['connect-src'].push("ws://localhost:*", "http://localhost:*");
        }
      
        return config;
      };
      
      /**
       * Generate CSP header string
       */
      export const generateCSPHeader = (nonce?: string): string => {
        const config = getCSPConfig(nonce);
        
        return Object.entries(config)
          .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
          .join('; ');
      };
      
      /**
       * Security headers for production
       */
      export const getSecurityHeaders = (nonce?: string): Record<string, string> => {
        return {
          'Content-Security-Policy': generateCSPHeader(nonce),
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '0', // Disabled in modern browsers, CSP is better
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        };
      };
      
      /**
       * File upload validation
       */
      export const validateFileUpload = (
        file: File,
        options: {
          maxSize?: number;
          allowedTypes?: string[];
          allowedExtensions?: string[];
        } = {}
      ): { valid: boolean; error?: string } => {
        const {
          maxSize = 10 * 1024 * 1024, // 10MB default
          allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            'application/pdf',
            'text/plain',
            'text/csv',
            'application/json',
          ],
          allowedExtensions = [
            '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
            '.pdf', '.txt', '.csv', '.json'
          ]
        } = options;
      
        // Check file size
        if (file.size > maxSize) {
          const sizeMB = (maxSize / (1024 * 1024)).toFixed(0);
          return { valid: false, error: `File size exceeds ${sizeMB}MB limit` };
        }
      
        // Check file type
        if (!allowedTypes.includes(file.type)) {
          return { valid: false, error: 'File type not allowed' };
        }
      
        // Check file extension
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedExtensions.includes(extension)) {
          return { valid: false, error: 'File extension not allowed' };
        }
      
        // Check for double extensions (potential bypass attempt)
        const doubleExtPattern = /\.(jpg|jpeg|png|gif|webp|svg|pdf|txt|csv|json)\.(exe|js|sh|bat|cmd|com|scr)$/i;
        if (doubleExtPattern.test(file.name)) {
          return { valid: false, error: 'Suspicious file name detected' };
        }
      
        return { valid: true };
      };
      
      /**
       * Browser storage utilities (not encrypted, but with JSON handling)
       */
      export const browserStorage = {
        set: (key: string, value: unknown, expiryMs?: number): boolean => {
          try {
            const data = {
              value,
              expiry: expiryMs ? Date.now() + expiryMs : null,
            };
            localStorage.setItem(key, JSON.stringify(data));
            return true;
          } catch (error) {
            console.error('Storage error:', error);
            return false;
          }
        },
      
        get: <T = unknown>(key: string): T | null => {
          try {
            const item = localStorage.getItem(key);
            if (!item) return null;
      
            const data = JSON.parse(item);
            
            // Check expiry
            if (data.expiry && Date.now() > data.expiry) {
              localStorage.removeItem(key);
              return null;
            }
      
            return data.value as T;
          } catch (error) {
            console.error('Storage error:', error);
            return null;
          }
        },
      
        remove: (key: string): void => {
          localStorage.removeItem(key);
        },
      
        clear: (): void => {
          localStorage.clear();
        },
      };
      
      /**
       * Session storage wrapper with same interface
       */
      export const sessionStorage = {
        set: (key: string, value: unknown): boolean => {
          try {
            window.sessionStorage.setItem(key, JSON.stringify(value));
            return true;
          } catch (error) {
            console.error('Session storage error:', error);
            return false;
          }
        },
      
        get: <T = unknown>(key: string): T | null => {
          try {
            const item = window.sessionStorage.getItem(key);
            return item ? JSON.parse(item) as T : null;
          } catch (error) {
            console.error('Session storage error:', error);
            return null;
          }
        },
      
        remove: (key: string): void => {
          window.sessionStorage.removeItem(key);
        },
      
        clear: (): void => {
          window.sessionStorage.clear();
        },
      };
      
      /**
       * CSRF Token management
       */
      export const csrf = {
        generate: async (): Promise<string> => {
          return generateSecureToken(32);
        },
      
        store: (token: string): void => {
          sessionStorage.set('csrf_token', token);
        },
      
        get: (): string | null => {
          return sessionStorage.get<string>('csrf_token');
        },
      
        validate: (token: string): boolean => {
          const stored = csrf.get();
          return !!stored && stored === token;
        },
      };
      
      /**
       * Trusted types policy creation (for browsers that support it)
       */
      export const createTrustedTypesPolicy = () => {
        if (typeof window !== 'undefined' && 'trustedTypes' in window) {
          try {
            return (window as any).trustedTypes.createPolicy('default', {
              createHTML: (input: string) => sanitizeHTML(input),
              createScriptURL: (input: string) => {
                const url = sanitizeUrl(input);
                if (!url) throw new Error('Invalid URL');
                return url;
              },
            });
          } catch (error) {
            console.warn('Trusted Types not available:', error);
          }
        }
        return null;
      };
      
      /**
       * Check if running in secure context (HTTPS)
       */
      export const isSecureContext = (): boolean => {
        return typeof window !== 'undefined' && window.isSecureContext;
      };
      
      /**
       * Detect potential XSS in user input (for logging/monitoring)
       */
      export const detectPotentialXSS = (input: string): boolean => {
        const xssPatterns = [
          /<script/i,
          /<iframe/i,
          /javascript:/i,
          /on\w+\s*=/i,
          /<embed/i,
          /<object/i,
        ];
      
        return xssPatterns.some(pattern => pattern.test(input));
      };
      
      /**
       * Format and validate phone numbers
       */
      export const validatePhoneNumber = (phone: string, countryCode: string = 'US'): boolean => {
        // Basic international phone validation
        const patterns: Record<string, RegExp> = {
          US: /^(\+1)?[-.\s]?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,
          UK: /^(\+44)?[-.\s]?(\(0\))?[-.\s]?(7\d{3}|\d{2,4})[-.\s]?\d{3,4}[-.\s]?\d{3,4}$/,
          // Add more country patterns as needed
        };
      
        const pattern = patterns[countryCode] || /^[\d\s()+-]+$/;
        return pattern.test(phone.replace(/\s/g, ''));
      };
      
      /**
       * Sanitize JSON string to prevent injection
       */
      export const sanitizeJSON = (jsonString: string): string | null => {
        try {
          const parsed = JSON.parse(jsonString);
          // Re-stringify to remove any potential code
          return JSON.stringify(parsed);
        } catch {
          return null;
        }
      };
      
      /**
       * Time-safe string comparison to prevent timing attacks
       */
      export const timingSafeEqual = (a: string, b: string): boolean => {
        if (a.length !== b.length) return false;
        
        let result = 0;
        for (let i = 0; i < a.length; i++) {
          result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        
        return result === 0;
      };
        q.gt(q.field("createdAt"), args.cursor!)
      );
    }

    const messages = await messagesQuery
      .order("asc")
      .take(limit);

    // The next cursor should point to the last message's createdAt timestamp
    const continueCursor = messages.length === limit ? messages[messages.length - 1].createdAt : null;

    return {
      messages,
      continueCursor,
    };
  },
});

// Get a specific message by ID (only if user owns the chat)
export const getMessage = query({
  args: { 
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    const message = await ctx.db.get(args.messageId);
    
    if (!message) {
      throw new Error("Message not found");
    }
    
    // Verify user has access to the chat this message belongs to
    const chat = await ctx.db.get(message.chatId);
    if (!chat || chat.userId !== identity.subject) {
      throw new Error("Access denied");
    }
    
    return message;
  },
});

// Create a new message (only if user owns the chat)
export const createMessage = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    
    // Encryption support
    isEncrypted: v.optional(v.boolean()),
    encryptedContent: v.optional(v.string()),
    encryptionSalt: v.optional(v.string()),
    encryptionIv: v.optional(v.string()),
    contentChecksum: v.optional(v.string()),
    
    metadata: v.optional(v.object({
      model: v.optional(v.string()),
      tokens: v.optional(v.number()),
      cost: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);

    // Verify user has access to this chat
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== identity.subject) {
      throw new Error("Chat not found or access denied");
    }
    
    // Rate limiting
    await enforceRateLimit(ctx, "sendMessage");
    
    // Input validation and sanitization
    const sanitizedContent = sanitizeContent(args.content);
    const sanitizedMetadata = sanitizeMetadata(args.metadata);
    
    // Validate encryption data if provided
    validateEncryptionData(args);
    
    // Additional validation for role-based restrictions
    if (args.role === "system" && identity.subject !== chat.userId) {
      throw new Error("Only chat owners can create system messages");
    }
    
    const now = Date.now();
    
    // Build message data with conditional encryption fields
    const messageData: {
      chatId: Id<"chats">;
      userId: string;
      content: string;
      role: "user" | "assistant" | "system";
      metadata?: { model?: string; tokens?: number; cost?: number };
      createdAt: number;
      isEncrypted?: boolean;
      encryptedContent?: string;
      encryptionSalt?: string;
      encryptionIv?: string;
      contentChecksum?: string;
    } = {
      chatId: args.chatId,
      userId: identity.subject,
      content: sanitizedContent,
      role: args.role,
      metadata: sanitizedMetadata,
      createdAt: now,
    };
    
    // Add encryption fields if message is encrypted
    if (args.isEncrypted) {
      messageData.isEncrypted = true;
      messageData.encryptedContent = args.encryptedContent;
      messageData.encryptionSalt = args.encryptionSalt;
      messageData.encryptionIv = args.encryptionIv;
      messageData.contentChecksum = args.contentChecksum;
    }
    
    const messageId = await ctx.db.insert("messages", messageData);
    
    // Update the chat's updatedAt timestamp
    await ctx.db.patch(args.chatId, {
      updatedAt: now,
    });
    
    return messageId;
  },
});

// Update a message (only if user owns the chat and message)
export const updateMessage = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
    
    // Encryption support for updates
    isEncrypted: v.optional(v.boolean()),
    encryptedContent: v.optional(v.string()),
    encryptionSalt: v.optional(v.string()),
    encryptionIv: v.optional(v.string()),
    contentChecksum: v.optional(v.string()),
    
    metadata: v.optional(v.object({
      model: v.optional(v.string()),
      tokens: v.optional(v.number()),
      cost: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    const message = await ctx.db.get(args.messageId);
    
    if (!message) {
      throw new Error("Message not found");
    }
    
    // Verify user has access to the chat this message belongs to
    const chat = await ctx.db.get(message.chatId);
    if (!chat || chat.userId !== identity.subject) {
      throw new Error("Access denied");
    }
    
    // Additional check: user can only edit their own messages
    if (message.userId !== identity.subject) {
      throw new Error("You can only edit your own messages");
    }
    
    // Rate limiting
    await checkRateLimit(ctx, identity.subject, "update");
    
    // Input validation and sanitization
    const sanitizedContent = sanitizeContent(args.content);
    const sanitizedMetadata = sanitizeMetadata(args.metadata);
    
    // Validate encryption data if provided
    validateEncryptionData(args);
    
    // Prevent editing messages older than 24 hours (configurable business rule)
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    if (message.createdAt < twentyFourHoursAgo) {
      throw new Error("Cannot edit messages older than 24 hours");
    }
    
    // Build update data with conditional encryption fields
    const updateData: {
      content: string;
      metadata?: { model?: string; tokens?: number; cost?: number };
      isEncrypted?: boolean;
      encryptedContent?: string;
      encryptionSalt?: string;
      encryptionIv?: string;
      contentChecksum?: string;
    } = {
      content: sanitizedContent,
      metadata: sanitizedMetadata,
    };
    
    // Add or remove encryption fields based on isEncrypted flag
    if (args.isEncrypted) {
      updateData.isEncrypted = true;
      updateData.encryptedContent = args.encryptedContent;
      updateData.encryptionSalt = args.encryptionSalt;
      updateData.encryptionIv = args.encryptionIv;
      updateData.contentChecksum = args.contentChecksum;
    } else {
      // If switching from encrypted to unencrypted, clear encryption fields
      updateData.isEncrypted = false;
      updateData.encryptedContent = undefined;
      updateData.encryptionSalt = undefined;
      updateData.encryptionIv = undefined;
      updateData.contentChecksum = undefined;
    }
    
    await ctx.db.patch(args.messageId, updateData);
    
    // Update the chat's updatedAt timestamp
    await ctx.db.patch(message.chatId, {
      updatedAt: Date.now(),
    });
    
    return args.messageId;
  },
});

// Delete a message (only if user owns the chat and message)
export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    const message = await ctx.db.get(args.messageId);
    
    if (!message) {
      throw new Error("Message not found");
    }
    
    // Verify user has access to the chat this message belongs to
    const chat = await ctx.db.get(message.chatId);
    if (!chat || chat.userId !== identity.subject) {
      throw new Error("Access denied");
    }
    
    // Additional check: user can only delete their own messages
    if (message.userId !== identity.subject) {
      throw new Error("You can only delete your own messages");
    }
    
    // Prevent deleting messages older than 24 hours (configurable business rule)
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    if (message.createdAt < twentyFourHoursAgo) {
      throw new Error("Cannot delete messages older than 24 hours");
    }
    
    await ctx.db.delete(args.messageId);
    
    // Update the chat's updatedAt timestamp
    await ctx.db.patch(message.chatId, {
      updatedAt: Date.now(),
    });
    
    return args.messageId;
  },
});

// Get latest messages across all user's chats (for overview) - Secured
export const getLatestMessages = query({
  args: { 
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Validate and limit the query size
    const limit = Math.min(args.limit || 50, 200); // Max 200 messages
    
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(limit);
    
    return messages;
  },
});

// Get message count for a chat
export const getChatMessageCount = query({
  args: { 
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Verify user has access to this chat
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== identity.subject) {
      throw new Error("Chat not found or access denied");
    }
    
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .collect();
    
    return messages.length;
  },
});

// Search messages in user's chats
export const searchMessages = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
    chatId: v.optional(v.id("chats")), // Optional: search within specific chat
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Validate search term
    const searchTerm = args.searchTerm.trim();
    if (searchTerm.length < 2) {
      throw new Error("Search term must be at least 2 characters long");
    }
    
    if (searchTerm.length > 100) {
      throw new Error("Search term too long (max 100 characters)");
    }
    
    const limit = Math.min(args.limit || 50, 100);
    
    let messages;
    
    if (args.chatId) {
      // Search within specific chat
      const chat = await ctx.db.get(args.chatId);
      if (!chat || chat.userId !== identity.subject) {
        throw new Error("Chat not found or access denied");
      }
      
      messages = await ctx.db
        .query("messages")
        .withIndex("by_chat_created", (q) => q.eq("chatId", args.chatId!))
        .filter((q) => 
          q.and(
            q.eq(q.field("userId"), identity.subject),
            // Simple text search - in production, consider using a proper search index
            q.or(
              q.gte(q.field("content"), searchTerm),
              q.lte(q.field("content"), searchTerm + "\uffff")
            )
          )
        )
        .take(limit);
    } else {
      // Search across all user's messages
      messages = await ctx.db
        .query("messages")
        .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
        .filter((q) => 
          // Simple text search - in production, consider using a proper search index
          q.or(
            q.gte(q.field("content"), searchTerm),
            q.lte(q.field("content"), searchTerm + "\uffff")
          )
        )
        .take(limit);
    }
    
    return messages;
  },
});

// Bulk delete messages (for cleanup)
export const bulkDeleteMessages = mutation({
  args: {
    messageIds: v.array(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    
    // Limit bulk operations
    if (args.messageIds.length > 50) {
      throw new Error("Cannot delete more than 50 messages at once");
    }
    
    const deletedIds = [];
    const chatIds = new Set<Id<"chats">>();
    
    for (const messageId of args.messageIds) {
      const message = await ctx.db.get(messageId);
      
      if (!message) {
        continue; // Skip non-existent messages
      }
      
      // Verify user has access to the chat this message belongs to
      const chat = await ctx.db.get(message.chatId);
      if (!chat || chat.userId !== identity.subject) {
        throw new Error(`Access denied for message ${messageId}`);
      }
      
      // Additional check: user can only delete their own messages
      if (message.userId !== identity.subject) {
        throw new Error(`You can only delete your own messages (${messageId})`);
      }
      
      await ctx.db.delete(messageId);
      deletedIds.push(messageId);
      chatIds.add(message.chatId);
    }
    
    // Update all affected chats' timestamps
    const now = Date.now();
    for (const chatId of chatIds) {
      await ctx.db.patch(chatId, {
        updatedAt: now,
      });
    }
    
    return { deletedCount: deletedIds.length, deletedIds };
  },
});