import { Polar } from '@polar-sh/sdk';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

const accessToken = process.env.POLAR_ACCESS_TOKEN;
const server = (process.env.POLAR_SERVER as 'sandbox' | 'production') || 'sandbox';

if (!accessToken) {
  errorLogger.warning(
    ErrorCategory.GENERAL,
    'POLAR_ACCESS_TOKEN is not set. Polar operations will not work.'
  );
}

const polar = accessToken
  ? new Polar({
      accessToken,
      server,
    })
  : null;

// Log initialization status
if (polar) {
  errorLogger.info(ErrorCategory.GENERAL, `Polar SDK initialized in ${server} mode`);
} else {
  errorLogger.warning(ErrorCategory.GENERAL, 'Polar SDK not initialized - missing access token');
}

export default polar;

// Helper function to check if Polar is configured
export function isPolarConfigured(): boolean {
  return polar !== null;
}

// Helper function to get configuration status
export function getPolarConfig() {
  return {
    isConfigured: isPolarConfigured(),
    server,
    hasAccessToken: !!accessToken,
  };
}
