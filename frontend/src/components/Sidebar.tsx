'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Shield,
  Store,
  Package,
  Boxes,
  BarChart3,
  Settings,
  User,
  LogOut,
  ChevronRight,
  FolderOpen,
  Receipt,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

interface SidebarProps {
  onCloseMobile?: () => void;
}

function SidebarComponent({ onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { userRole, profile, logout } = useAuth();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const isOwner = userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  const isManager = userRole === 'MANAGER';

  const roleBadgeVariant = isOwner ? 'owner' : isManager ? 'manager' : 'cashier';

  const navGroups = useMemo(
    () => [
      {
        title: 'Platform',
        items: [
          { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, allowed: true },
          { label: 'Stores', href: '/stores', icon: Store, allowed: true },
          { label: 'Sales History', href: '/sales', icon: Receipt, allowed: true },
          { label: 'Customers', href: '/customers', icon: Users, allowed: true },
          { label: 'Users & Staff', href: '/users', icon: Users, allowed: isOwner || isManager },
          { label: 'Roles & RBAC', href: '/roles', icon: Shield, allowed: isOwner },
        ],
      },
      {
        title: 'Inventory',
        items: [
          { label: 'Products', href: '/products', icon: Package, allowed: true },
          { label: 'Categories', href: '/categories', icon: FolderOpen, allowed: true },
          { label: 'Inventory', href: '/inventory', icon: Boxes, allowed: isOwner || isManager },
        ],
      },
      {
        title: 'Analytics',
        items: [
          { label: 'Reports', href: '/reports', icon: BarChart3, allowed: isOwner || isManager },
          { label: 'Settings', href: '/settings', icon: Settings, allowed: isOwner },
          { label: 'Profile', href: '/profile', icon: User, allowed: true },
        ],
      },
    ],
    [isOwner, isManager],
  );

  return (
    <aside
      className="flex h-full w-[260px] flex-col border-r border-slate-900 bg-slate-950 text-slate-100 dark:bg-card/50 dark:text-foreground"
      aria-label="Main navigation"
    >
      {/* Brand */}
      <div className="border-b border-border/60 px-5 py-5">
        <Link
          href="/dashboard"
          onClick={onCloseMobile}
          className="group flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform duration-150 group-hover:scale-[1.02]">
            <span className="text-sm font-bold tracking-tight">IP</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-foreground">
              INFEPOS
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {profile?.tenant?.name || 'Back Office'}
            </p>
          </div>
        </Link>
      </div>

      {/* Role */}
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
        <span className="text-xs text-muted-foreground">Role</span>
        {isMounted ? (
          <Badge variant={roleBadgeVariant}>{userRole}</Badge>
        ) : (
          <div className="h-5 w-12 animate-pulse bg-muted rounded" />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => item.allowed);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-1">
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {group.title}
              </p>
              {visibleItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                    )}
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="space-y-2 border-t border-border/60 p-3">
        {profile && (
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              {profile.firstName?.[0] || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {profile.firstName} {profile.lastName}
              </p>
              <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex items-center gap-2">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </span>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}

export const Sidebar = memo(SidebarComponent);
