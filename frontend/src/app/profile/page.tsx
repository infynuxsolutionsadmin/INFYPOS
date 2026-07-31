'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../../services/auth';
import { UserProfile } from '../../types/auth';
import { useAuth } from '../../contexts/AuthContext';
import {
  User as UserIcon,
  RefreshCw,
  Shield,
  Store,
  Building2,
  Calendar,
  Phone,
  Mail,
  Loader2,
  Lock,
} from 'lucide-react';

export default function ProfilePage() {
  const { loginState } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await authService.getProfile();
      setProfile(res.data);
    } catch {
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleRefreshSession = async () => {
    setRefreshing(true);
    const refresh = localStorage.getItem('refreshToken');
    if (!refresh) {
      toast.error('No refresh token available');
      setRefreshing(false);
      return;
    }
    try {
      const res = await authService.refresh(refresh);
      if (res.data.accessToken && res.data.refreshToken) {
        loginState(res.data.accessToken, res.data.refreshToken);
        toast.success('User session renewed successfully');
        fetchProfile();
      }
    } catch {
      toast.error('Session refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading user profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 select-none">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <UserIcon className="w-8 h-8 text-primary" />
            Account Details
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your personal profile, credentials, organization membership, and active sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProfile}
            disabled={loading}
            className="bg-secondary hover:bg-secondary/80 text-foreground border border-border/60 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Refetching...' : 'Reload Profile'}
          </button>
          <button
            onClick={handleRefreshSession}
            disabled={refreshing}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Renew Session</span>
          </button>
        </div>
      </div>

      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Area: Profile Card Summary */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-card border border-border/60 rounded-2xl p-6 text-center shadow-sm space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/20 text-3xl font-black text-primary">
                {profile.firstName?.[0] || 'U'}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">
                  {profile.firstName} {profile.lastName}
                </h3>
                <span className="inline-block bg-primary/10 text-primary border border-primary/25 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {profile.role?.name || 'ADMIN'}
                </span>
              </div>

              <div className="border-t border-border/60 pt-4 text-left space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="w-4 h-4 text-muted-foreground/80" />
                  <span className="truncate">{profile.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="w-4 h-4 text-muted-foreground/80" />
                  <span>{profile.phone || 'No phone number'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Area: Detailed Panels */}
          <div className="md:col-span-2 space-y-6">
            {/* Organization Panel */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <Building2 className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base text-foreground">Organization Context</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Workspace Name</span>
                  <p className="font-bold text-foreground">{profile.tenant?.name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organization Slug</span>
                  <p className="font-mono text-purple-400 font-semibold">{profile.tenant?.slug}</p>
                </div>
                <div className="space-y-1 md:col-span-2 pt-2 border-t border-border/40">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Workspace ID</span>
                  <p className="font-mono text-xs text-muted-foreground">{profile.tenantId}</p>
                </div>
              </div>
            </div>

            {/* Assigned Stores Panel */}
            {profile.stores && profile.stores.length > 0 && (
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                  <Store className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-base text-foreground">Assigned Store Access</h3>
                </div>

                <div className="space-y-3">
                  {profile.stores.map((store) => (
                    <div
                      key={store.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20"
                    >
                      <div className="space-y-1">
                        <p className="font-bold text-sm text-foreground">{store.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">Store Code: {store.code}</p>
                      </div>
                      {store.isMain && (
                        <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Diagnostics details */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <Lock className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base text-foreground">Session Statistics</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-muted/30 p-3 rounded-lg border border-border/40">
                  <span className="text-slate-500 block">Created Account:</span>
                  <span className="text-foreground">{new Date(profile.createdAt).toLocaleString()}</span>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg border border-border/40">
                  <span className="text-slate-500 block">Last Active Session:</span>
                  <span className="text-foreground">
                    {profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : 'Just Now'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
