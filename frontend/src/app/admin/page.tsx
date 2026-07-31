'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { AdminDashboardMetrics } from '../../types/auth';
import { ShieldAlert, Activity, Server, Users, Building2, Lock } from 'lucide-react';

export default function AdminPage() {
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const canAccess = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

  const handleTestAdminApi = async () => {
    setLoading(true);
    setMetrics(null);
    setStatus(null);
    try {
      const res = await authService.getAdminDashboard();
      setMetrics(res.data);
      setStatus('200 OK');
      toast.success('Super Admin Dashboard API accessed!');
    } catch (err: any) {
      console.error(err);
      const code = err.response?.status || 500;
      setStatus(`${code} ${err.response?.statusText || 'Forbidden'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="max-w-md mx-auto my-16 bg-slate-950 border border-red-900/60 rounded-xl p-8 text-center space-y-4">
        <div className="inline-flex p-3 rounded-full bg-red-950 text-red-400 border border-red-800">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-red-400">Access Denied</h2>
        <p className="text-xs text-slate-400">
          The Admin Portal requires the <code className="text-yellow-400 font-bold">ADMIN</code> or{' '}
          <code className="text-yellow-400 font-bold">SUPER_ADMIN</code> role. Your current role is{' '}
          <span className="text-slate-200 font-bold">{userRole}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-red-400 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6" />
            Super Admin Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            GET <code className="text-slate-200">http://localhost:3000/api/v1/admin/dashboard</code>
          </p>
        </div>

        <button
          onClick={handleTestAdminApi}
          disabled={loading}
          className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2.5 rounded-md text-xs transition disabled:opacity-50 flex items-center space-x-2"
        >
          {loading ? (
            <span>Calling Admin API...</span>
          ) : (
            <>
              <Activity className="w-4 h-4" />
              <span>Test Admin API</span>
            </>
          )}
        </button>
      </div>

      {status && (
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-4 font-mono text-xs max-w-2xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-slate-400 font-bold">HTTP Response Status:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded ${
                status.startsWith('200')
                  ? 'bg-green-950 text-green-300 border border-green-800'
                  : 'bg-red-950 text-red-300 border border-red-800'
              }`}
            >
              {status}
            </span>
          </div>

          {metrics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <Building2 className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block">Total Tenants</span>
                  <span className="text-lg font-bold text-slate-100">{metrics.totalTenants}</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <Users className="w-4 h-4 text-green-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block">Active Users</span>
                  <span className="text-lg font-bold text-slate-100">{metrics.activeUsers}</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <Server className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block">Total Stores</span>
                  <span className="text-lg font-bold text-slate-100">{metrics.totalStores}</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <Activity className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block">System Health</span>
                  <span className="text-lg font-bold text-green-400">{metrics.systemHealth}</span>
                </div>
              </div>

              {metrics.recentTenants && metrics.recentTenants.length > 0 && (
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                  <span className="text-slate-300 font-bold block border-b border-slate-800 pb-1">
                    Recently Registered Tenants:
                  </span>
                  <div className="space-y-1">
                    {metrics.recentTenants.map((t) => (
                      <div key={t.id} className="flex justify-between items-center text-[11px]">
                        <div>
                          <strong className="text-slate-200">{t.name}</strong>{' '}
                          <span className="text-purple-400">({t.slug})</span>
                        </div>
                        <span className="text-slate-500">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-red-400 italic">
              Access Restricted. Verify role permissions in the backend.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
