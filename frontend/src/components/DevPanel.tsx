'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Terminal, X, Copy, Trash2, RefreshCw, LogOut, Code, AlertTriangle } from 'lucide-react';
import { decodeJwt, formatExpiry, isTokenExpired } from '../utils/jwt';
import { DecodedJwt } from '../types/auth';
import { apiLogs, subscribeApiLogs, ApiLogEntry } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export function DevPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { logout, loginState } = useAuth();

  const [accessToken, setAccessToken] = useState<string>('');
  const [refreshToken, setRefreshToken] = useState<string>('');
  const [decoded, setDecoded] = useState<DecodedJwt | null>(null);
  const [logs, setLogs] = useState<ApiLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'tokens' | 'logs'>('tokens');

  const loadTokens = () => {
    if (typeof window !== 'undefined') {
      const access = localStorage.getItem('accessToken') || '';
      const refresh = localStorage.getItem('refreshToken') || '';
      setAccessToken(access);
      setRefreshToken(refresh);
      if (access) {
        setDecoded(decodeJwt(access));
      } else {
        setDecoded(null);
      }
    }
  };

  useEffect(() => {
    loadTokens();
    setLogs([...apiLogs]);
    const unsubscribe = subscribeApiLogs(() => {
      setLogs([...apiLogs]);
    });
    const interval = setInterval(loadTokens, 1500);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleCopy = (text: string, label: string) => {
    if (!text) {
      toast.error(`No ${label} to copy!`);
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
  };

  const handleClearStorage = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    loadTokens();
    toast.success('Local Storage cleared!');
  };

  const handleExpireSession = () => {
    localStorage.removeItem('accessToken');
    loadTokens();
    toast.success('Access Token removed! (Session Expired)');
  };

  const isExpired = decoded?.exp ? isTokenExpired(decoded.exp) : false;

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-50 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center space-x-2 text-xs border border-blue-400 transition transform hover:scale-105"
      >
        <Terminal className="w-4 h-4" />
        <span>Developer Tools</span>
      </button>

      {/* Slide-Over Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] bg-slate-950 text-slate-200 border-l border-slate-800 shadow-2xl flex flex-col font-mono text-xs animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
            <div className="flex items-center space-x-2">
              <Code className="w-4 h-4 text-yellow-400" />
              <h3 className="font-bold text-slate-100 text-sm">
                INTERNAL DEVELOPER PANEL
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub Nav Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/50">
            <button
              onClick={() => setActiveTab('tokens')}
              className={`flex-1 py-2 text-center text-xs font-semibold ${
                activeTab === 'tokens'
                  ? 'border-b-2 border-blue-500 text-blue-400 bg-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tokens & Claims
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 py-2 text-center text-xs font-semibold ${
                activeTab === 'logs'
                  ? 'border-b-2 border-blue-500 text-blue-400 bg-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              API Logs ({logs.length})
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {activeTab === 'tokens' ? (
              <>
                {/* Access Token */}
                <div className="bg-slate-900 border border-slate-800 rounded p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-300">Access Token:</span>
                    {accessToken ? (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isExpired
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : 'bg-green-950 text-green-300 border border-green-800'
                        }`}
                      >
                        {isExpired ? 'EXPIRED' : 'VALID'}
                      </span>
                    ) : (
                      <span className="text-slate-500">MISSING</span>
                    )}
                  </div>
                  <p className="break-all text-[10px] text-slate-400 bg-slate-950 p-2 rounded max-h-20 overflow-y-auto border border-slate-900">
                    {accessToken || 'None'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(accessToken, 'Access Token')}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 py-1 rounded flex items-center justify-center space-x-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Token</span>
                    </button>
                    <button
                      onClick={handleExpireSession}
                      className="flex-1 bg-red-950 hover:bg-red-900 text-red-300 py-1 rounded flex items-center justify-center space-x-1"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>Expire Session</span>
                    </button>
                  </div>
                </div>

                {/* Refresh Token */}
                <div className="bg-slate-900 border border-slate-800 rounded p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-300">Refresh Token:</span>
                    {refreshToken ? (
                      <span className="bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        PRESENT
                      </span>
                    ) : (
                      <span className="text-slate-500">MISSING</span>
                    )}
                  </div>
                  <p className="break-all text-[10px] text-slate-400 bg-slate-950 p-2 rounded max-h-20 overflow-y-auto border border-slate-900">
                    {refreshToken || 'None'}
                  </p>
                  <button
                    onClick={() => handleCopy(refreshToken, 'Refresh Token')}
                    className="w-full bg-slate-800 hover:bg-slate-700 py-1 rounded flex items-center justify-center space-x-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Refresh Token</span>
                  </button>
                </div>

                {/* Decoded JWT Claims */}
                <div className="bg-slate-900 border border-slate-800 rounded p-3 space-y-2">
                  <span className="font-bold text-slate-300 block border-b border-slate-800 pb-1">
                    Decoded JWT Claims:
                  </span>
                  {decoded ? (
                    <div className="space-y-1.5 text-[11px] text-slate-400">
                      <div>
                        <strong className="text-slate-200">User ID (sub):</strong>{' '}
                        <span className="text-green-400">{decoded.sub}</span>
                      </div>
                      <div>
                        <strong className="text-slate-200">Email:</strong>{' '}
                        <span className="text-blue-400">{decoded.email}</span>
                      </div>
                      <div>
                        <strong className="text-slate-200">Tenant ID:</strong>{' '}
                        <span className="text-purple-400">{decoded.tenantId}</span>
                      </div>
                      <div>
                        <strong className="text-slate-200">Role ID:</strong>{' '}
                        <span className="text-yellow-400">{decoded.roleId}</span>
                      </div>
                      <div>
                        <strong className="text-slate-200">Expires At:</strong>{' '}
                        <span className="text-orange-400">
                          {formatExpiry(decoded.exp)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic text-[11px]">
                      No decoded token available.
                    </p>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="bg-slate-900 border border-slate-800 rounded p-3 space-y-2">
                  <span className="font-bold text-slate-300 block">
                    Developer Quick Actions:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleClearStorage}
                      className="bg-slate-800 hover:bg-slate-700 py-1.5 rounded flex items-center justify-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear Storage</span>
                    </button>
                    <button
                      onClick={() => logout()}
                      className="bg-red-900 hover:bg-red-800 text-white font-semibold py-1.5 rounded flex items-center justify-center space-x-1"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>API Logout</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* API Logs Tab */
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-300">
                    Real-time API Request Log ({logs.length})
                  </span>
                  <button
                    onClick={() => {
                      apiLogs.length = 0;
                      setLogs([]);
                    }}
                    className="text-[10px] text-slate-400 hover:text-white underline"
                  >
                    Clear Logs
                  </button>
                </div>

                {logs.length === 0 ? (
                  <p className="text-slate-500 italic p-4 text-center">
                    No API requests captured yet.
                  </p>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-slate-900 border border-slate-800 rounded p-2.5 space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-blue-400">
                            {log.method}
                          </span>
                          <span className="text-slate-300 truncate max-w-[180px]">
                            {log.url}
                          </span>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            !log.status
                              ? 'bg-slate-800 text-slate-400'
                              : log.status < 400
                              ? 'bg-green-950 text-green-300'
                              : 'bg-red-950 text-red-300'
                          }`}
                        >
                          {log.status || 'PENDING'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {log.timestamp}
                      </div>

                      {log.error && (
                        <div className="text-red-400 bg-red-950/40 p-1.5 rounded mt-1 text-[10px]">
                          Error: {log.error}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
