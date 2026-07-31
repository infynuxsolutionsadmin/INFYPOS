'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rolesService } from '../../services/roles';
import {
  Shield,
  Key,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export default function RolesPage() {
  const [activeTab, setActiveTab] = useState<'roles' | 'matrix'>('matrix');

  // React Query Fetchers
  const { data: rolesResponse, isLoading: loadingRoles } = useQuery({
    queryKey: ['rbac-roles-list'],
    queryFn: () => rolesService.getAll(),
  });
  const roles = rolesResponse?.data ?? [];

  const { data: permissionsResponse, isLoading: loadingPermissions } = useQuery({
    queryKey: ['rbac-permissions-list'],
    queryFn: () => rolesService.getPermissions(),
  });
  const permissions = permissionsResponse?.data ?? [];

  // Group permission codes to display the matrix by module
  const permissionsByModule = permissions.reduce((acc: Record<string, typeof permissions>, curr) => {
    const mod = curr.module;
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(curr);
    return acc;
  }, {});

  return (
    <div className="space-y-8 select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            Roles & RBAC Control
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Audit system roles, hierarchy ranks, and verify fine-grained API permission matrices.
          </p>
        </div>

        {/* Tab selector */}
        <div className="inline-flex bg-muted p-1 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-lg font-semibold transition cursor-pointer ${
              activeTab === 'matrix' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Permission Matrix
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 rounded-lg font-semibold transition cursor-pointer ${
              activeTab === 'roles' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Role Ranks
          </button>
        </div>
      </div>

      {/* Tab 1: Permission Matrix */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 text-foreground">
              <Key className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-base">Platform Access Matrix</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Verify which roles hold authorization key-codes. Custom changes are read-only for system default roles (`isSystem = true`) to protect platform stability.
            </p>
          </div>

          {/* Matrix Grid */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {loadingRoles || loadingPermissions ? (
              <div className="p-8 text-center text-muted-foreground italic text-xs font-semibold">
                Loading permission matrix data...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                      <th className="p-4 w-1/3">Permission Rule / Code</th>
                      {roles.map((role) => (
                        <th key={role.id} className="p-4 text-center">
                          <div className="space-y-1">
                            <p className="text-foreground font-black">{role.name}</p>
                            <span className="inline-block px-1.5 py-0.2 bg-primary/10 text-primary rounded font-mono text-[8px] font-bold">
                              RANK {role.rank}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-muted-foreground">
                    {Object.entries(permissionsByModule).map(([moduleName, permList]) => (
                      <React.Fragment key={moduleName}>
                        {/* Section Header */}
                        <tr className="bg-muted/25 font-bold">
                          <td colSpan={roles.length + 1} className="p-3 text-[10px] text-foreground uppercase tracking-wider pl-4">
                            {moduleName} Module
                          </td>
                        </tr>
                        {permList.map((perm) => (
                          <tr key={perm.id} className="hover:bg-muted/10 transition text-foreground">
                            <td className="p-4 pl-6">
                              <div>
                                <p className="font-bold text-foreground">
                                  {perm.code}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {perm.description || 'No description provided'}
                                </p>
                              </div>
                            </td>
                            {roles.map((role) => {
                              // Verify if role permissions array matches this code
                              // Our backend strips namespaced prefix, so match code directly or endsWith
                              const hasPerm = role.rolePermissions?.some((rp) => {
                                const cleanCode = rp.permission.code.replace(/^[a-f\d-]{36}:/, '');
                                return cleanCode === perm.code;
                              });

                              return (
                                <td key={role.id} className="p-4 text-center">
                                  {hasPerm ? (
                                    <div className="inline-flex text-emerald-500 justify-center">
                                      <CheckCircle2 className="w-5 h-5 fill-emerald-500/10" />
                                    </div>
                                  ) : (
                                    <div className="inline-flex text-muted-foreground/45 justify-center">
                                      <XCircle className="w-5 h-5" />
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Role Ranks List */}
      {activeTab === 'roles' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="p-4">Role Designation</th>
                  <th className="p-4">Authority Rank</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted-foreground">
                {loadingRoles ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground font-medium italic">
                      Loading roles catalog...
                    </td>
                  </tr>
                ) : (
                  roles.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30 transition text-foreground">
                      <td className="p-4 font-bold text-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        {r.name}
                      </td>
                      <td className="p-4 font-mono font-bold text-primary">{r.rank} / 100</td>
                      <td className="p-4">
                        {r.isSystem ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider">
                            System Default
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] font-bold uppercase tracking-wider">
                            Custom Role
                          </span>
                        )}
                      </td>
                      <td className="p-4 max-w-[300px] truncate">{r.description || 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
