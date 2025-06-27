/**
 * API request validation using Zod schemas
 */

import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { errorLogger, ErrorCategory } from './error-logger';

// Common validation schemas
export const CommonSchemas = {
  // UUID validation
  uuid: z.string().uuid('Invalid UUID format'),

  // Email validation
  email: z.string().email('Invalid email format'),

  // Pagination
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  }),

  // Date range
  dateRange: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }),

  // Sort parameters
  sort: z.object({
    field: z.string(),
    order: z.enum(['asc', 'desc']).default('asc'),
  }),
};

// API-specific validation schemas
export const ApiSchemas = {
  // Chat message creation
  createMessage: z.object({
    chatId: CommonSchemas.uuid,
    content: z.string().min(1).max(10000),
    role: z.enum(['user', 'assistant', 'system']),
    metadata: z.record(z.any()).optional(),
  }),

  // Chat creation
  createChat: z.object({
    title: z.string().min(1).max(200).optional(),
    metadata: z.record(z.any()).optional(),
  }),

  // AI completion request
  aiCompletion: z.object({
    prompt: z.string().min(1).max(10000),
    model: z
      .enum(['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'])
      .optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().min(1).max(4000).optional(),
    stream: z.boolean().optional(),
  }),

  // File upload
  fileUpload: z.object({
    filename: z.string().min(1).max(255),
    mimeType: z.string(),
    size: z
      .number()
      .int()
      .min(1)
      .max(10 * 1024 * 1024), // 10MB max
    content: z.string(), // Base64 encoded
  }),

  // User profile update
  updateProfile: z.object({
    name: z.string().min(1).max(100).optional(),
    email: CommonSchemas.email.optional(),
    avatar: z.string().url().optional(),
    preferences: z.record(z.any()).optional(),
  }),

  // Subscription management
  subscription: z.object({
    planId: z.enum(['free', 'pro', 'enterprise']),
    billingCycle: z.enum(['monthly', 'yearly']).optional(),
  }),
};

// Validation error response
interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Format Zod errors into a consistent structure
 */
function formatZodErrors(error: z.ZodError): ValidationError[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
}

/**
 * Validate request body against a Zod schema
 */
export async function validateBody<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ data: T | null; error: NextResponse | null }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const errors = formatZodErrors(result.error);

      errorLogger.warning(ErrorCategory.API, 'Request validation failed', undefined, {
        endpoint: req.url,
        method: req.method,
        errors,
      });

      return {
        data: null,
        error: NextResponse.json(
          {
            error: 'Validation failed',
            errors,
            message: 'The request body contains invalid data',
          },
          { status: 400 }
        ),
      };
    }

    return { data: result.data, error: null };
  } catch (error) {
    errorLogger.error(ErrorCategory.API, 'Failed to parse request body', error, {
      endpoint: req.url,
      method: req.method,
    });

    return {
      data: null,
      error: NextResponse.json(
        {
          error: 'Invalid request',
          message: 'The request body must be valid JSON',
        },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQuery<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): { data: T | null; error: NextResponse | null } {
  try {
    const { searchParams } = new URL(req.url);
    const params: Record<string, any> = {};

    // Convert URLSearchParams to object
    searchParams.forEach((value, key) => {
      // Handle array parameters (e.g., ?tags=a&tags=b)
      if (params[key]) {
        if (Array.isArray(params[key])) {
          params[key].push(value);
        } else {
          params[key] = [params[key], value];
        }
      } else {
        params[key] = value;
      }
    });

    // Try to parse numeric values
    Object.keys(params).forEach((key) => {
      if (typeof params[key] === 'string' && /^\d+$/.test(params[key])) {
        params[key] = parseInt(params[key], 10);
      }
    });

    const result = schema.safeParse(params);

    if (!result.success) {
      const errors = formatZodErrors(result.error);

      errorLogger.warning(ErrorCategory.API, 'Query validation failed', undefined, {
        endpoint: req.url,
        method: req.method,
        errors,
      });

      return {
        data: null,
        error: NextResponse.json(
          {
            error: 'Validation failed',
            errors,
            message: 'The query parameters contain invalid data',
          },
          { status: 400 }
        ),
      };
    }

    return { data: result.data, error: null };
  } catch (error) {
    errorLogger.error(ErrorCategory.API, 'Failed to parse query parameters', error, {
      endpoint: req.url,
      method: req.method,
    });

    return {
      data: null,
      error: NextResponse.json(
        {
          error: 'Invalid request',
          message: 'Failed to parse query parameters',
        },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate headers against a Zod schema
 */
export function validateHeaders<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): { data: T | null; error: NextResponse | null } {
  try {
    const headers: Record<string, string> = {};

    // Extract relevant headers
    req.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const result = schema.safeParse(headers);

    if (!result.success) {
      const errors = formatZodErrors(result.error);

      errorLogger.warning(ErrorCategory.API, 'Header validation failed', undefined, {
        endpoint: req.url,
        method: req.method,
        errors,
      });

      return {
        data: null,
        error: NextResponse.json(
          {
            error: 'Validation failed',
            errors,
            message: 'The request headers contain invalid data',
          },
          { status: 400 }
        ),
      };
    }

    return { data: result.data, error: null };
  } catch (error) {
    errorLogger.error(ErrorCategory.API, 'Failed to validate headers', error, {
      endpoint: req.url,
      method: req.method,
    });

    return {
      data: null,
      error: NextResponse.json(
        {
          error: 'Invalid request',
          message: 'Failed to validate request headers',
        },
        { status: 400 }
      ),
    };
  }
}

/**
 * Combined validation middleware
 */
export function withValidation<TBody = any, TQuery = any, THeaders = any>(
  handler: (
    req: NextRequest,
    context: {
      body?: TBody;
      query?: TQuery;
      headers?: THeaders;
    }
  ) => Promise<NextResponse>,
  schemas?: {
    body?: z.ZodSchema<TBody>;
    query?: z.ZodSchema<TQuery>;
    headers?: z.ZodSchema<THeaders>;
  }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const context: {
      body?: TBody;
      query?: TQuery;
      headers?: THeaders;
    } = {};

    // Validate body if schema provided
    if (schemas?.body) {
      const { data, error } = await validateBody(req, schemas.body);
      if (error) return error;
      context.body = data!;
    }

    // Validate query if schema provided
    if (schemas?.query) {
      const { data, error } = validateQuery(req, schemas.query);
      if (error) return error;
      context.query = data!;
    }

    // Validate headers if schema provided
    if (schemas?.headers) {
      const { data, error } = validateHeaders(req, schemas.headers);
      if (error) return error;
      context.headers = data!;
    }

    return handler(req, context);
  };
}

// Export Zod for convenience
export { z } from 'zod';
