'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card } from './card';
import { KpiSkeleton } from './skeleton';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  footer?: React.ReactNode;
  icon: LucideIcon;
  iconClassName?: string;
  valueClassName?: string;
  loading?: boolean;
}

const KpiCard = React.memo(function KpiCard({
  label,
  value,
  footer,
  icon: Icon,
  iconClassName,
  valueClassName,
  loading,
}: KpiCardProps) {
  if (loading) return <KpiSkeleton />;

  return (
    <Card hover className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              'text-3xl font-semibold tracking-tight text-foreground tabular-nums',
              valueClassName,
            )}
          >
            {value}
          </p>
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
            iconClassName ?? 'bg-primary/10 text-primary',
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      {footer && (
        <div className="mt-4 text-xs text-muted-foreground">{footer}</div>
      )}
    </Card>
  );
});

export { KpiCard };
