'use client';

import { useState, useEffect, ReactNode } from 'react';
import { FlintSplashScreen } from '@/components/branding/FlintLoadingScreen';

/**
 * AppInitializer Component
 *
 * Wraps the application and shows a beautiful Flint splash screen
 * on initial page load/refresh.
 *
 * Features:
 * - Shows splash screen for 2 seconds on mount
 * - Smooth fade-out transition
 * - Only shows once per page load
 */

interface AppInitializerProps {
  children: ReactNode;
}

export function AppInitializer({ children }: AppInitializerProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show splash screen for 2 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <FlintSplashScreen message="Igniting the spark..." />;
  }

  return <>{children}</>;
}
