'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../../services/auth.service';
import { decodeJwt, formatExpiry } from '../../utils/jwt';

export default function RefreshPage() {
  const [loading, setLoading] = useState(false);
  const [oldExpiry, setOldExpiry] = useState<string | null>(null);
  const [newExpiry, setNewExpiry] = useState<string | null>(null);

  const handleManualRefresh = async () => {
    setLoading(true);
    setOldExpiry(null);
    setNewExpiry(null);

    const currentAccess = localStorage.getItem('accessToken');
    const currentRefresh = localStorage.getItem('refreshToken');

    if (!currentRefresh) {
      toast.error('No refresh token found in LocalStorage!');
      setLoading(false);
      return;
    }

    if (currentAccess) {
      const decodedOld = decodeJwt(currentAccess);
      setOldExpiry(formatExpiry(decodedOld?.exp));
    }

    try {
      const res = await authService.refresh(currentRefresh);
      toast.success('Tokens rotated and refreshed successfully!');

      if (res.data?.accessToken && res.data?.refreshToken) {
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);

        const decodedNew = decodeJwt(res.data.accessToken);
        setNewExpiry(formatExpiry(decodedNew?.exp));
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-xl font-bold text-yellow-400">
          4. Refresh Token API (Token Rotation)
        </h2>
        <p className="text-xs text-slate-400">
          POST <code className="text-slate-200">http://localhost:3000/api/v1/auth/refresh</code>
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-xs text-slate-300">
          Executes refresh token rotation. The server revokes the old refresh token,
          issues a new pair of Access (24h) and Refresh (7d) tokens, and returns them.
        </p>

        <button
          onClick={handleManualRefresh}
          disabled={loading}
          className="bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold px-4 py-2 rounded transition disabled:opacity-50 text-sm"
        >
          {loading ? 'Rotating Tokens...' : 'POST /auth/refresh'}
        </button>
      </div>

      {(oldExpiry || newExpiry) && (
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg space-y-3 font-mono text-xs">
          <h4 className="font-bold text-yellow-400 border-b border-slate-800 pb-1">
            TOKEN EXPIRATION COMPARISON:
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 p-3 rounded border border-slate-800">
              <span className="text-slate-400 block">Previous Access Expiry:</span>
              <span className="text-red-400 font-bold">{oldExpiry || 'N/A'}</span>
            </div>
            <div className="bg-slate-900 p-3 rounded border border-slate-800">
              <span className="text-slate-400 block">New Access Expiry:</span>
              <span className="text-green-400 font-bold">{newExpiry || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
