'use client';

import { usePathname } from 'next/navigation';
import { AppShell } from './AppShell';

// Routes that should NOT use the AppShell (auth pages, landing pages, etc.)
const NO_SHELL_ROUTES = ['/login', '/signup', '/auth'];

interface ConditionalAppShellProps {
  children: React.ReactNode;
}

export function ConditionalAppShell({ children }: ConditionalAppShellProps) {
  const pathname = usePathname();

  // Check if current path should skip the AppShell
  const shouldSkipShell = NO_SHELL_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  if (shouldSkipShell) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
