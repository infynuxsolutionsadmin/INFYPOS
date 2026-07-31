'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditService } from '../../services/audit';
import {
  ShieldAlert,
  Search,
  Eye,
  Calendar,
  Layers,
  Activity,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';

export default function AuditPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const limit = 10;

  // 1. Fetch paginated audit logs list
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['audit', page, search, selectedTable, selectedAction],
    queryFn: () =>
      auditService.getLogs({
        page,
        limit,
        search,
        table: selectedTable || undefined,
        action: selectedAction || undefined,
      }),
  });

  // 2. Fetch detailed log for modal preview
  const { data: detailData, isLoading: loadingDetail } = useQuery({
    queryKey: ['audit-detail', selectedLogId],
    queryFn: () => auditService.getLog(selectedLogId!),
    enabled: !!selectedLogId,
  });

  const logs = logsData?.data ?? [];
  const meta = logsData?.meta;

  const handlePageChange = (newPage: number) => {
    if (meta && newPage >= 1 && newPage <= meta.totalPages) {
      setPage(newPage);
    }
  };

  const getActionBadgeClass = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'UPDATE':
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      case 'DELETE':
        return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
      case 'LOGIN':
        return 'bg-purple-500/10 text-purple-500 border border-purple-500/20';
      case 'LOGOUT':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      default:
        return 'bg-muted/40 text-muted-foreground border border-border';
    }
  };

  return (
    <div className="space-y-8 select-none">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-primary" />
            Security & Audit Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track user activities, mutations, and authentication logins across your tenant organization.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-background border border-input rounded-xl pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            placeholder="Search by action, table, record ID or staff email..."
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Module/Table filter */}
          <select
            value={selectedTable}
            onChange={(e) => {
              setSelectedTable(e.target.value);
              setPage(1);
            }}
            className="bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
          >
            <option value="">All Modules</option>
            <option value="auth">Authentication</option>
            <option value="users">Users</option>
            <option value="stores">Stores</option>
            <option value="products">Products</option>
            <option value="inventory">Inventory</option>
          </select>

          {/* Action filter */}
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setPage(1);
            }}
            className="bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
          </select>
        </div>
      </div>

      {/* Table view */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-muted-foreground font-bold">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Operator Staff</th>
                <th className="p-4">Action</th>
                <th className="p-4">Module</th>
                <th className="p-4">Target Record ID</th>
                <th className="p-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground italic">
                    Loading security logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground italic">
                    No security events found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/10 transition">
                    <td className="p-4 font-mono text-[11px] text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      {log.user ? (
                        <div>
                          <p className="font-semibold text-foreground">
                            {log.user.firstName} {log.user.lastName}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">System Operator</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 capitalize font-semibold">{log.table}</td>
                    <td className="p-4 font-mono text-[10px] text-muted-foreground">
                      {log.recordId ? log.recordId.substring(0, 8) + '...' : <span className="italic">N/A</span>}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedLogId(log.id)}
                        className="p-1 rounded-lg border border-border bg-accent text-accent-foreground hover:bg-accent/80 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {meta && meta.totalPages > 1 && (
          <div className="flex justify-between items-center p-4 border-t border-border bg-muted/20">
            <span className="text-xs text-muted-foreground">
              Showing page {meta.page} of {meta.totalPages} ({meta.total} total logs)
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handlePageChange(meta.page - 1)}
                disabled={meta.page === 1}
                className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent disabled:opacity-50 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(meta.page + 1)}
                disabled={meta.page === meta.totalPages}
                className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent disabled:opacity-50 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Log details Modal */}
      {selectedLogId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-text">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Audit Log Details
              </h3>
              <button
                onClick={() => setSelectedLogId(null)}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {loadingDetail ? (
                <p className="text-muted-foreground italic text-center py-12">Fetching complete history details...</p>
              ) : !detailData?.data ? (
                <p className="text-destructive font-semibold text-center py-12">Failed to load details.</p>
              ) : (
                <div className="space-y-4">
                  {/* Operator Info */}
                  <div className="grid grid-cols-2 gap-4 border-b border-border/50 pb-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        Operator User
                      </span>
                      <p className="font-semibold text-foreground mt-0.5">
                        {detailData.data.user
                          ? `${detailData.data.user.firstName} ${detailData.data.user.lastName}`
                          : 'System Operator'}
                      </p>
                      {detailData.data.user && (
                        <p className="text-[10px] text-muted-foreground">{detailData.data.user.email}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        IP & User Agent
                      </span>
                      <p className="font-semibold text-foreground mt-0.5">
                        {detailData.data.ipAddress || 'Unknown IP'}
                      </p>
                      <p className="text-[9px] text-muted-foreground truncate w-full" title={detailData.data.userAgent || ''}>
                        {detailData.data.userAgent || 'Unknown User-Agent'}
                      </p>
                    </div>
                  </div>

                  {/* Operation Info */}
                  <div className="grid grid-cols-3 gap-4 border-b border-border/50 pb-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        Action Code
                      </span>
                      <p className="mt-0.5">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${getActionBadgeClass(detailData.data.action)}`}>
                          {detailData.data.action}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        Target Module
                      </span>
                      <p className="font-semibold text-foreground mt-0.5 capitalize">
                        {detailData.data.table}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        Target ID
                      </span>
                      <p className="font-mono text-foreground mt-0.5 select-all">
                        {detailData.data.recordId || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Changes Metadata */}
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Payload Mutation Details (newValue)
                    </span>
                    <pre className="p-4 bg-muted/40 rounded-xl font-mono text-[10px] overflow-x-auto text-foreground max-h-60 border border-border/40 select-all">
                      {detailData.data.newValue
                        ? JSON.stringify(detailData.data.newValue, null, 2)
                        : JSON.stringify({ message: "No data changes captured for this action type." }, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
