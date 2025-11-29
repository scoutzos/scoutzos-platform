'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, Search, Bell, ChevronDown, LogOut } from 'lucide-react';
import { SIDEBAR_SECTIONS, filterNavSectionsForUser, type NavSection, type NavItem } from '@/config/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthProvider';
import { Logo } from '@/components/branding/Logo';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { session, signOut } = useAuth();

  // TODO: Get real user context from auth
  const userContext = { roles: ['admin'], permissions: [] };
  const filteredSections = filterNavSectionsForUser(SIDEBAR_SECTIONS, userContext);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-brand-primary-deep transition-transform duration-200 ease-out lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo className="text-white" />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 h-[calc(100vh-8rem)]">
          {filteredSections.map((section) => (
            <SidebarSection
              key={section.id}
              section={section}
              currentPath={pathname}
              onNavigate={() => setSidebarOpen(false)}
            />
          ))}
        </nav>

        {/* User section at bottom */}
        <div className="border-t border-white/10 p-4">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 w-full hover:bg-white/5 rounded-md p-2 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-brand-primary flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-medium">
                  {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-white truncate">
                  {session?.user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate">Admin</p>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 text-gray-400 transition-transform",
                userMenuOpen && "rotate-180"
              )} />
            </button>

            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    signOut();
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 lg:px-6">
          {/* Left: hamburger + search */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Search */}
            <div className="hidden sm:flex items-center gap-2 rounded-md bg-gray-100 dark:bg-gray-800 px-3 py-2 w-64">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none w-full"
              />
              <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-1.5 text-xs text-gray-400">
                /
              </kbd>
            </div>
          </div>

          {/* Right: status + notifications */}
          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-xs text-gray-500 dark:text-gray-400">
              Updated just now
            </span>

            {/* Notification Bell - placeholder for now */}
            <button className="relative text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-error text-[10px] font-medium text-white flex items-center justify-center">
                3
              </span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

// Sidebar section component
function SidebarSection({
  section,
  currentPath,
  onNavigate
}: {
  section: NavSection;
  currentPath: string;
  onNavigate: () => void;
}) {
  return (
    <div className="mb-6">
      <h3 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
        {section.label}
      </h3>
      <ul className="space-y-1">
        {section.items.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            isActive={currentPath === item.href || currentPath.startsWith(item.href + '/')}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </div>
  );
}

// Sidebar item component
function SidebarItem({
  item,
  isActive,
  onNavigate
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;

  if (item.disabled) {
    return (
      <li>
        <span
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-500 cursor-not-allowed opacity-50'
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <span className="rounded-full bg-gray-600 px-2 py-0.5 text-[10px] font-medium text-gray-300">
              {item.badge}
            </span>
          )}
        </span>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
          isActive
            ? 'bg-brand-primary/20 text-white'
            : 'text-gray-300 hover:bg-white/5 hover:text-white'
        )}
      >
        <Icon className={cn('h-4 w-4', isActive ? 'text-brand-primary-soft' : 'text-gray-400')} />
        <span className="flex-1">{item.label}</span>
        {item.badge && (
          <span className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-medium',
            item.badge === 'Beta' ? 'bg-brand-ai/20 text-brand-ai' : 'bg-gray-600 text-gray-300'
          )}>
            {item.badge}
          </span>
        )}
      </Link>
    </li>
  );
}

export default AppShell;
