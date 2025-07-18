import { Polar, models } from '@polar-sh/sdk';

// Configuration for Polar API client
export const polarApi = new Polar({
  accessToken: import.meta.env.VITE_POLAR_ACCESS_TOKEN,
});

// Re-exporting SDK types for application use
export type PolarProduct = models.Product;
export type PolarPrice = models.Price;
export type PolarSubscription = models.Subscription;
export type Meter = models.Meter;

export interface UsageEvent {
  name: string;
  customer_id?: string;
  external_customer_id?: string;
  metadata: Record<string, string | number | boolean>;
  timestamp?: string;
}

// Product management functions
export const createProduct = async (
  productData: models.ProductCreate
): Promise<PolarProduct> => {
  try {
    const response = await polarApi.products.create(productData);
    return response;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const listProducts = async (): Promise<PolarProduct[]> => {
  try {
    const response = await polarApi.products.list({
      organizationId: import.meta.env.VITE_POLAR_ORGANIZATION_ID,
    });
    return response.items;
  } catch (error) {
    console.error('Error listing products:', error);
    throw error;
  }
};

export const getProduct = async (productId: string): Promise<PolarProduct> => {
  try {
    const response = await polarApi.products.get({ id: productId });
    return response;
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
};

// Usage tracking functions
export const ingestUsageEvent = async (event: UsageEvent): Promise<void> => {
  try {
    await polarApi.events.ingest({
      name: event.name,
      customerId: event.customer_id,
      externalCustomerId: event.external_customer_id,
      properties: event.metadata,
      timestamp: event.timestamp,
    });
  } catch (error) {
    console.error('Error ingesting usage event:', error);
    throw error;
  }
};

// Meter management functions
export const createMeter = async (
  meterData: models.MeterCreate
): Promise<Meter> => {
  try {
    const response = await polarApi.meters.create(meterData);
    return response;
  } catch (error) {
    console.error('Error creating meter:', error);
    throw error;
  }
};

export const listMeters = async (): Promise<Meter[]> => {
  try {
    const response = await polarApi.meters.list({
      organizationId: import.meta.env.VITE_POLAR_ORGANIZATION_ID,
    });
    return response.items;
  } catch (error) {
    console.error('Error listing meters:', error);
    throw error;
  }
};

// Checkout functions
export const createCheckoutSession = async (
  priceId: string,
  customerId?: string
): Promise<{ url: string }> => {
  try {
    const response = await polarApi.checkouts.create({
      priceId: priceId,
      customerId: customerId,
      successUrl: `${
        import.meta.env.VITE_APP_URL || 'http://localhost:5173'
      }/checkout/success`,
      cancelUrl: `${
        import.meta.env.VITE_APP_URL || 'http://localhost:5173'
      }/pricing`,
    });
    return { url: response.url };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

// Subscription management functions
export const listSubscriptions = async (
  customerId?: string
): Promise<PolarSubscription[]> => {
  try {
    const response = await polarApi.subscriptions.list({
      customerId: customerId,
      organizationId: import.meta.env.VITE_POLAR_ORGANIZATION_ID,
    });
    return response.items;
  } catch (error) {
    console.error('Error listing subscriptions:', error);
    throw error;
  }
};

export const cancelSubscription = async (subscriptionId: string): Promise<void> => {
  try {
    await polarApi.subscriptions.cancel({ id: subscriptionId });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};

// Customer management functions
export const createCustomer = async (
  customerData: models.CustomerCreate
): Promise<models.Customer> => {
  try {
    const response = await polarApi.customers.create(customerData);
    return response;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
};

export const getCustomerByExternalId = async (
  externalId: string
): Promise<models.Customer | null> => {
  try {
    const response = await polarApi.customers.list({
      externalId: externalId,
      organizationId: import.meta.env.VITE_POLAR_ORGANIZATION_ID,
    });
    return response.items[0] || null;
  } catch (error) {
    console.error('Error getting customer by external ID:', error);
    throw error;
  }
}; 