'use client';

import React, { memo, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import {
  Menu,
  Bell,
  User,
  ChevronDown,
  RefreshCw,
  LogOut,
  Sliders,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

interface NavbarProps {
  onMenuToggle?: () => void;
}

function NavbarComponent({ onMenuToggle }: NavbarProps) {
  const { profile, logout, refreshProfile } = useAuth();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const breadcrumbs = pathname
    .split('/')
    .filter(Boolean)
    .map((part, index, arr) => ({
      label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
      isLast: index === arr.length - 1,
    }));

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
      toast.success('Profile synced');
    } catch {
      toast.error('Failed to sync profile');
    } finally {
      setRefreshing(false);
    }
  }, [refreshProfile]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <nav aria-label="Breadcrumb" className="hidden min-w-0 sm:flex sm:items-center sm:gap-1.5">
            <Link
              href="/dashboard"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Home
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <span className="text-muted-foreground/40" aria-hidden="true">
                  /
                </span>
                <span
                  className={cn(
                    'truncate text-xs',
                    crumb.isLast
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Badge variant="success" className="hidden md:inline-flex normal-case tracking-normal">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Connected
          </Badge>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Sync profile"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </button>

          <button
            type="button"
            onClick={() => {
              const root = window.document.documentElement;
              const isDark = root.classList.contains('dark');
              if (isDark) {
                root.classList.remove('dark');
                localStorage.setItem('theme', 'light');
                toast('Light mode activated', { icon: '☀️' });
              } else {
                root.classList.add('dark');
                localStorage.setItem('theme', 'dark');
                toast('Dark mode activated', { icon: '🌙' });
              }
            }}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Toggle theme mode"
          >
            {/* Simple CSS-driven icons: visible only in light or dark mode */}
            <span className="dark:hidden">☀️</span>
            <span className="hidden dark:inline">🌙</span>
          </button>

          <button
            type="button"
            onClick={() => toast('No new notifications', { icon: '🔔' })}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>

          <div className="relative ml-1">
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-expanded={dropdownOpen}
              aria-haspopup="menu"
              aria-label="Account menu"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {profile?.firstName?.[0] || 'U'}
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(false)}
                  aria-hidden="true"
                />
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-border/60 bg-card py-1.5 shadow-xl shadow-black/40"
                >
                  <div className="border-b border-border/60 px-4 py-3">
                    <p className="text-sm font-medium text-foreground">
                      {profile?.firstName} {profile?.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    <Sliders className="h-4 w-4 text-muted-foreground" />
                    Settings
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2.5 border-t border-border/60 px-4 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export const Navbar = memo(NavbarComponent);
