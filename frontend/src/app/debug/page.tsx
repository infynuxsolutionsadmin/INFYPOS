'use client';

import Link from 'next/link';

export default function DebugOverviewPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-12 px-4 text-white">
      <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-blue-400 mb-2">
          INFEPOS Backend Auth Tester & Debug Panel
        </h1>
        <p className="text-slate-300 text-sm">
          Developer utility designed to test and validate NestJS 11 + Prisma ORM
          authentication endpoints in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/register"
          className="block bg-slate-800/50 hover:bg-slate-800 border border-slate-700 p-4 rounded-lg transition"
        >
          <div className="flex items-center space-x-2 text-blue-400 font-semibold mb-1">
            <span>1. Register Tenant API</span>
          </div>
          <p className="text-xs text-slate-400">
            Submit <code className="text-slate-200">POST /auth/register</code> to create a tenant, store, admin role, and user.
          </p>
        </Link>

        <Link
          href="/login"
          className="block bg-slate-800/50 hover:bg-slate-800 border border-slate-700 p-4 rounded-lg transition"
        >
          <div className="flex items-center space-x-2 text-green-400 font-semibold mb-1">
            <span>2. Login API</span>
          </div>
          <p className="text-xs text-slate-400">
            Submit <code className="text-slate-200">POST /auth/login</code> to acquire Access (24h) & Hashed Refresh tokens (7d).
          </p>
        </Link>

        <Link
          href="/profile"
          className="block bg-slate-800/50 hover:bg-slate-800 border border-slate-700 p-4 rounded-lg transition"
        >
          <div className="flex items-center space-x-2 text-purple-400 font-semibold mb-1">
            <span>3. Authenticated Profile API</span>
          </div>
          <p className="text-xs text-slate-400">
            Fetch <code className="text-slate-200">GET /auth/profile</code> using Bearer token authorization header.
          </p>
        </Link>

        <Link
          href="/refresh"
          className="block bg-slate-800/50 hover:bg-slate-800 border border-slate-700 p-4 rounded-lg transition"
        >
          <div className="flex items-center space-x-2 text-yellow-400 font-semibold mb-1">
            <span>4. Refresh Token API</span>
          </div>
          <p className="text-xs text-slate-400">
            Submit <code className="text-slate-200">POST /auth/refresh</code> to test automatic token rotation & revocation.
          </p>
        </Link>

        <Link
          href="/admin"
          className="block bg-slate-800/50 hover:bg-slate-800 border border-slate-700 p-4 rounded-lg transition md:col-span-2"
        >
          <div className="flex items-center space-x-2 text-red-400 font-semibold mb-1">
            <span>5. Super Admin RBAC API</span>
          </div>
          <p className="text-xs text-slate-400">
            Submit <code className="text-slate-200">GET /admin/dashboard</code> to verify 403 Forbidden enforcement on non-SUPER_ADMIN accounts.
          </p>
        </Link>
      </div>

      <div className="bg-slate-800/40 border border-slate-700 p-4 rounded-lg text-xs space-y-2">
        <h3 className="font-semibold text-slate-200">Developer Testing Tips:</h3>
        <ul className="list-disc list-inside text-slate-400 space-y-1">
          <li>Access JWT claims and session details in the developer drawer.</li>
          <li>Manual token expiry features allow verification of automatic silent 401 refreshes.</li>
        </ul>
      </div>
    </div>
  );
}
