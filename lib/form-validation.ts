import { z } from 'zod';

// Custom error messages for common validation scenarios
const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.expected === 'string') {
      return { message: 'This field must be text' };
    }
    if (issue.expected === 'number') {
      return { message: 'This field must be a number' };
    }
  }

  if (issue.code === z.ZodIssueCode.too_small) {
    if (issue.type === 'string') {
      return { message: `Must be at least ${issue.minimum} characters` };
    }
    if (issue.type === 'number') {
      return { message: `Must be at least ${issue.minimum}` };
    }
  }

  if (issue.code === z.ZodIssueCode.too_big) {
    if (issue.type === 'string') {
      return { message: `Must be no more than ${issue.maximum} characters` };
    }
    if (issue.type === 'number') {
      return { message: `Must be no more than ${issue.maximum}` };
    }
  }

  if (issue.code === z.ZodIssueCode.invalid_string) {
    if (issue.validation === 'email') {
      return { message: 'Please enter a valid email address' };
    }
    if (issue.validation === 'url') {
      return { message: 'Please enter a valid URL' };
    }
  }

  return { message: ctx.defaultError };
};

// Set global error map
z.setErrorMap(customErrorMap);

// Common validation schemas
export const validators = {
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be no more than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),

  url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),

  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'),

  postalCode: z.string().regex(/^[A-Z0-9]{3,10}$/i, 'Please enter a valid postal code'),
};

// Form schemas for common forms
export const formSchemas = {
  signIn: z.object({
    email: validators.email,
    password: z.string().min(1, 'Password is required'),
  }),

  signUp: z
    .object({
      username: validators.username,
      email: validators.email,
      password: validators.password,
      confirmPassword: z.string().min(1, 'Please confirm your password'),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    }),

  profile: z.object({
    displayName: z.string().min(1, 'Display name is required').max(50),
    bio: z.string().max(500, 'Bio must be no more than 500 characters').optional(),
    website: validators.url,
    location: z.string().max(100).optional(),
  }),

  contact: z.object({
    name: z.string().min(1, 'Name is required'),
    email: validators.email,
    subject: z.string().min(1, 'Subject is required').max(100),
    message: z.string().min(10, 'Message must be at least 10 characters').max(1000),
  }),
};

// Helper function to get field errors
export function getFieldError(errors: z.ZodError | null, field: string): string | undefined {
  if (!errors) return undefined;

  const fieldError = errors.errors.find((err) => err.path.join('.') === field);
  return fieldError?.message;
}

// Helper function to format validation errors for display
export function formatValidationErrors(errors: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};

  errors.errors.forEach((error) => {
    const path = error.path.join('.');
    formatted[path] = error.message;
  });

  return formatted;
}

// React hook for form validation
export function useFormValidation<T extends z.ZodSchema>(
  schema: T,
  data: z.infer<T>
): {
  errors: Record<string, string> | null;
  isValid: boolean;
  validate: () => boolean;
  validateField: (field: keyof z.infer<T>) => string | null;
} {
  const validate = () => {
    try {
      schema.parse(data);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return false;
      }
      throw error;
    }
  };

  const validateField = (field: keyof z.infer<T>) => {
    try {
      // For object schemas, access the shape property
      if ('shape' in schema && typeof schema.shape === 'object') {
        const fieldSchema = (schema as any).shape[field as string];
        if (fieldSchema) {
          fieldSchema.parse(data[field]);
        }
      } else {
        // For non-object schemas, validate the entire value
        schema.parse(data);
      }
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || 'Invalid value';
      }
      return 'Validation error';
    }
  };

  let errors: Record<string, string> | null = null;
  let isValid = true;

  try {
    schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors = formatValidationErrors(error);
      isValid = false;
    }
  }

  return { errors, isValid, validate, validateField };
}
