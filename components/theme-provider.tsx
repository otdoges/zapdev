'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return children wrapped in a div with the default theme
    // This prevents hydration mismatch by providing consistent server/client rendering
    return <div className="dark">{children}</div>;
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
