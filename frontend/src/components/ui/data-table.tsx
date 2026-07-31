import * as React from 'react';
import { cn } from '@/lib/utils';

function DataTable({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'data-table overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

function DataTableScroll({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('data-table-scroll overflow-x-auto', className)} {...props} />
  );
}

interface DataTableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  sticky?: boolean;
}

function DataTableHeader({ className, sticky = true, ...props }: DataTableHeaderProps) {
  return (
    <thead
      className={cn(
        'border-b border-border/60 bg-muted/30 text-muted-foreground',
        sticky && 'sticky top-0 z-10 backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  );
}

function DataTableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider',
        className,
      )}
      {...props}
    />
  );
}

function DataTableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-border/40', className)} {...props} />;
}

function DataTableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'text-sm text-foreground transition-colors hover:bg-muted/20',
        className,
      )}
      {...props}
    />
  );
}

interface DataTableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  label?: string;
}

function DataTableCell({ className, label = '', ...props }: DataTableCellProps) {
  return (
    <td
      data-label={label}
      className={cn('px-4 py-3.5 align-middle', className)}
      {...props}
    />
  );
}

function DataTableEmpty({
  message = 'No records found.',
  colSpan = 1,
}: {
  message?: string;
  colSpan?: number;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-16 text-center text-sm text-muted-foreground"
      >
        {message}
      </td>
    </tr>
  );
}

export {
  DataTable,
  DataTableScroll,
  DataTableHeader,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableCell,
  DataTableEmpty,
};
