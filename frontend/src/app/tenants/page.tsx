'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { tenantsService } from '../../services/tenants';
import { TenantItem } from '../../types/tenants';
import { Building2, RefreshCw } from 'lucide-react';

export default function TenantsPage() {
  const [tenant, setTenant] = useState<TenantItem | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTenant = async () => {
    setLoading(true);
    try {
      const res = await tenantsService.getCurrent();
      setTenant(res.data);
    } catch {
      toast.error('Failed to load tenant details from /tenants/me');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-orange-400" />
            Current Tenant Organization
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            GET <code className="text-slate-200">http://localhost:3000/api/v1/tenants/me</code>
          </p>
        </div>

        <button
          onClick={fetchTenant}
          disabled={loading}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-md text-xs font-semibold transition flex items-center space-x-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Tenant</span>
        </button>
      </div>

      {tenant && (
        <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl space-y-4 max-w-xl font-mono text-xs">
          <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
            <h3 className="font-bold text-slate-200 text-sm">ORGANIZATION DETAILS</h3>
            <span className="bg-green-950 text-green-300 border border-green-800 text-[10px] font-bold px-2 py-0.5 rounded">
              {tenant.status}
            </span>
          </div>

          <div className="space-y-2 text-slate-300">
            <div>
              <span className="text-slate-500 block">Tenant ID:</span>
              <span className="text-purple-400 font-bold">{tenant.id}</span>
            </div>

            <div>
              <span className="text-slate-500 block">Organization Name:</span>
              <span className="text-slate-100 font-bold text-sm font-sans">{tenant.name}</span>
            </div>

            <div>
              <span className="text-slate-500 block">Tenant Slug:</span>
              <span className="text-blue-400 font-bold">{tenant.slug}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900">
              <div>
                <span className="text-slate-500 block">Subscription Plan:</span>
                <span className="text-yellow-400 font-bold">{tenant.plan || 'ENTERPRISE'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Currency Code:</span>
                <span className="text-green-400 font-bold">{tenant.currency || 'USD'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
