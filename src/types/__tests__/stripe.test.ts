/**
 * Comprehensive tests for Stripe type utilities
 * Testing type guards, utility functions, and data extraction
 */

import {
  isStripeSubscription,
  isStripeCustomer,
  isStripeInvoice,
  getSubscriptionPeriod,
  getCustomerEmail,
  getCustomerMetadata,
  getInvoiceSubscriptionId
} from '../stripe';

describe('Stripe Type Utilities', () => {
  describe('Type Guards', () => {
    describe('isStripeSubscription', () => {
      it('should identify valid Stripe subscriptions', () => {
        const validSubscription = {
          id: 'sub_123',
          object: 'subscription',
          status: 'active' as const,
          current_period_start: 1640995200,
          current_period_end: 1643673600,
          cancel_at_period_end: false,
          customer: 'cus_123',
          items: { data: [] },
          created: 1640995200
        };

        expect(isStripeSubscription(validSubscription)).toBe(true);
      });

      it('should reject invalid subscriptions', () => {
        expect(isStripeSubscription(null)).toBe(false);
        expect(isStripeSubscription(undefined)).toBe(false);
        expect(isStripeSubscription({})).toBe(false);
        expect(isStripeSubscription({ id: 'sub_123' })).toBe(false);
        expect(isStripeSubscription({ object: 'subscription' })).toBe(false);
        expect(isStripeSubscription({ id: 'sub_123', object: 'customer' })).toBe(false);
      });
    });

    describe('isStripeCustomer', () => {
      it('should identify valid Stripe customers', () => {
        const validCustomer = {
          id: 'cus_123',
          object: 'customer',
          created: 1640995200,
          email: 'test@example.com',
          name: 'John Doe',
          metadata: {}
        };

        expect(isStripeCustomer(validCustomer)).toBe(true);
      });

      it('should reject invalid customers', () => {
        expect(isStripeCustomer(null)).toBe(false);
        expect(isStripeCustomer({})).toBe(false);
        expect(isStripeCustomer({ id: 'cus_123' })).toBe(false);
        expect(isStripeCustomer({ object: 'customer' })).toBe(false);
        expect(isStripeCustomer({ id: 'cus_123', object: 'subscription' })).toBe(false);
      });
    });

    describe('isStripeInvoice', () => {
      it('should identify valid Stripe invoices', () => {
        const validInvoice = {
          id: 'in_123',
          object: 'invoice',
          amount_due: 2000,
          amount_paid: 2000,
          amount_remaining: 0,
          currency: 'usd',
          customer: 'cus_123',
          status: 'paid' as const,
          created: 1640995200
        };

        expect(isStripeInvoice(validInvoice)).toBe(true);
      });

      it('should reject invalid invoices', () => {
        expect(isStripeInvoice(null)).toBe(false);
        expect(isStripeInvoice({})).toBe(false);
        expect(isStripeInvoice({ id: 'in_123' })).toBe(false);
        expect(isStripeInvoice({ object: 'invoice' })).toBe(false);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('getSubscriptionPeriod', () => {
      it('should extract subscription period correctly', () => {
        const subscription = {
          id: 'sub_123',
          object: 'subscription' as const,
          status: 'active' as const,
          current_period_start: 1640995200, // Jan 1, 2022
          current_period_end: 1643673600,   // Feb 1, 2022
          cancel_at_period_end: false,
          customer: 'cus_123',
          items: { data: [] },
          created: 1640995200
        };

        const result = getSubscriptionPeriod(subscription);
        
        expect(result).not.toBeNull();
        expect(result?.currentPeriodStart).toBe(1640995200000); // Converted to milliseconds
        expect(result?.currentPeriodEnd).toBe(1643673600000);   // Converted to milliseconds
      });

      it('should return null for invalid subscriptions', () => {
        expect(getSubscriptionPeriod(null)).toBeNull();
        expect(getSubscriptionPeriod({})).toBeNull();
        expect(getSubscriptionPeriod({ id: 'sub_123' })).toBeNull();
      });

      it('should handle edge cases', () => {
        const subscriptionWithZero = {
          id: 'sub_123',
          object: 'subscription' as const,
          status: 'active' as const,
          current_period_start: 0,
          current_period_end: 0,
          cancel_at_period_end: false,
          customer: 'cus_123',
          items: { data: [] },
          created: 1640995200
        };

        const result = getSubscriptionPeriod(subscriptionWithZero);
        expect(result?.currentPeriodStart).toBe(0);
        expect(result?.currentPeriodEnd).toBe(0);
      });
    });

    describe('getCustomerEmail', () => {
      it('should extract customer email correctly', () => {
        const customer = {
          id: 'cus_123',
          object: 'customer' as const,
          created: 1640995200,
          email: 'test@example.com',
          name: 'John Doe',
          metadata: {}
        };

        expect(getCustomerEmail(customer)).toBe('test@example.com');
      });

      it('should handle null email', () => {
        const customer = {
          id: 'cus_123',
          object: 'customer' as const,
          created: 1640995200,
          email: null,
          name: 'John Doe',
          metadata: {}
        };

        expect(getCustomerEmail(customer)).toBe('');
      });

      it('should handle deleted customers', () => {
        const deletedCustomer = {
          id: 'cus_123',
          object: 'customer' as const,
          created: 1640995200,
          email: 'test@example.com',
          name: 'John Doe',
          metadata: {},
          deleted: true
        };

        expect(getCustomerEmail(deletedCustomer)).toBe('');
      });

      it('should return empty string for invalid customers', () => {
        expect(getCustomerEmail(null)).toBe('');
        expect(getCustomerEmail({})).toBe('');
        expect(getCustomerEmail({ id: 'cus_123' })).toBe('');
      });
    });

    describe('getCustomerMetadata', () => {
      it('should extract customer metadata correctly', () => {
        const customer = {
          id: 'cus_123',
          object: 'customer' as const,
          created: 1640995200,
          email: 'test@example.com',
          name: 'John Doe',
          metadata: { userId: '12345', source: 'web' }
        };

        const metadata = getCustomerMetadata(customer);
        expect(metadata).toEqual({ userId: '12345', source: 'web' });
      });

      it('should handle empty metadata', () => {
        const customer = {
          id: 'cus_123',
          object: 'customer' as const,
          created: 1640995200,
          email: 'test@example.com',
          name: 'John Doe',
          metadata: {}
        };

        expect(getCustomerMetadata(customer)).toEqual({});
      });

      it('should handle deleted customers', () => {
        const deletedCustomer = {
          id: 'cus_123',
          object: 'customer' as const,
          created: 1640995200,
          email: 'test@example.com',
          name: 'John Doe',
          metadata: { userId: '12345' },
          deleted: true
        };

        expect(getCustomerMetadata(deletedCustomer)).toEqual({});
      });

      it('should return empty object for invalid customers', () => {
        expect(getCustomerMetadata(null)).toEqual({});
        expect(getCustomerMetadata({})).toEqual({});
      });
    });

    describe('getInvoiceSubscriptionId', () => {
      it('should extract subscription ID from invoice', () => {
        const invoice = {
          id: 'in_123',
          object: 'invoice' as const,
          amount_due: 2000,
          amount_paid: 2000,
          amount_remaining: 0,
          currency: 'usd',
          customer: 'cus_123',
          subscription: 'sub_456',
          status: 'paid' as const,
          created: 1640995200
        };

        expect(getInvoiceSubscriptionId(invoice)).toBe('sub_456');
      });

      it('should return null when no subscription', () => {
        const invoice = {
          id: 'in_123',
          object: 'invoice' as const,
          amount_due: 2000,
          amount_paid: 2000,
          amount_remaining: 0,
          currency: 'usd',
          customer: 'cus_123',
          status: 'paid' as const,
          created: 1640995200
        };

        expect(getInvoiceSubscriptionId(invoice)).toBeNull();
      });

      it('should return null for invalid invoices', () => {
        expect(getInvoiceSubscriptionId(null)).toBeNull();
        expect(getInvoiceSubscriptionId({})).toBeNull();
      });

      it('should handle subscription as object (not string)', () => {
        const invoice = {
          id: 'in_123',
          object: 'invoice' as const,
          amount_due: 2000,
          amount_paid: 2000,
          amount_remaining: 0,
          currency: 'usd',
          customer: 'cus_123',
          subscription: { id: 'sub_456' }, // Object instead of string
          status: 'paid' as const,
          created: 1640995200
        };

        expect(getInvoiceSubscriptionId(invoice)).toBeNull();
      });
    });
  });

  describe('Data Integrity', () => {
    it('should handle malformed Stripe objects gracefully', () => {
      const malformedObjects = [
        { id: null, object: 'subscription' },
        { id: 'sub_123', object: null },
        { id: '', object: 'subscription' },
        { id: 'sub_123', object: '' },
        { object: 'subscription' }, // Missing id
        { id: 'sub_123' } // Missing object
      ];

      malformedObjects.forEach(obj => {
        expect(isStripeSubscription(obj)).toBe(false);
        expect(getSubscriptionPeriod(obj)).toBeNull();
      });
    });

    it('should handle numeric fields correctly', () => {
      const subscription = {
        id: 'sub_123',
        object: 'subscription' as const,
        status: 'active' as const,
        current_period_start: '1640995200', // String instead of number
        current_period_end: '1643673600',   // String instead of number
        cancel_at_period_end: false,
        customer: 'cus_123',
        items: { data: [] },
        created: 1640995200
      };

      // Should still work with string timestamps (JavaScript coercion)
      const result = getSubscriptionPeriod(subscription);
      expect(result).not.toBeNull();
    });
  });
});