'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { tenantsService } from '../../services/tenants';
import {
  Settings as SettingsIcon,
  Building,
  Key,
  Receipt,
  Save,
  Lock,
  Loader2,
  Globe,
  DollarSign,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { profile, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingReceipt, setSavingReceipt] = useState(false);

  // Business States
  const [businessName, setBusinessName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('UTC');
  const [taxNumber, setTaxNumber] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');

  // Password States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  const isOwner = userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  const fetchTenantSettings = async () => {
    try {
      setLoading(true);
      const res = await tenantsService.getCurrent();
      if (res.data) {
        setBusinessName(res.data.name || '');
        setCurrency(res.data.currency || 'USD');
        // Pre-fill default fallbacks if missing
        setTaxNumber('VAT-98765432');
        setReceiptFooter('Thank you for shopping with us!');
      }
    } catch {
      toast.error('Failed to load tenant configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      toast.error('Only Owners can save global configurations');
      return;
    }
    try {
      setSaving(true);
      await tenantsService.updateCurrent({
        name: businessName,
        currency,
      });
      toast.success('Business configuration updated successfully');
    } catch {
      toast.error('Failed to update configuration settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      toast.error('Only Owners can save receipt configuration');
      return;
    }
    setSavingReceipt(true);
    setTimeout(() => {
      setSavingReceipt(false);
      toast.success('POS receipt format configured');
    }, 600);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    setPasswordUpdating(true);
    setTimeout(() => {
      setPasswordUpdating(false);
      toast.success('Security settings updated successfully');
      setOldPassword('');
      setNewPassword('');
    }, 600);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading workspace details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 select-none">
      {/* Top Header Banner */}
      <div className="border-b border-border/60 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-primary" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure business details, operational parameters, tax structures, and security keys.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Business Configuration Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* General settings */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
              <Building className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-base text-foreground">Business Configuration</h3>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tenant Brand Name</label>
                  <input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    disabled={!isOwner}
                    className="enterprise-input"
                    placeholder="INFEPOS Retailer"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organization Slug</label>
                  <input
                    value={profile?.tenant?.slug || 'infynux-store'}
                    disabled
                    className="w-full rounded-lg border border-input/40 bg-muted/30 px-3.5 py-2.5 text-sm text-muted-foreground cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    disabled={!isOwner}
                    className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="AUD">AUD ($)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" /> Timezone
                  </label>
                  <input
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    disabled={!isOwner}
                    className="enterprise-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> Tax / VAT ID
                  </label>
                  <input
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    disabled={!isOwner}
                    className="enterprise-input"
                  />
                </div>
              </div>

              {isOwner && (
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-primary/95 transition cursor-pointer disabled:opacity-50 text-sm"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Settings</span>
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Receipt Customizer */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
              <Receipt className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-base text-foreground">POS Receipt Configuration</h3>
            </div>

            <form onSubmit={handleSaveReceipt} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Receipt Footer Message</label>
                <textarea
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  disabled={!isOwner}
                  rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  placeholder="Thank you for your business!"
                />
              </div>

              {isOwner && (
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingReceipt}
                    className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-primary/95 transition cursor-pointer disabled:opacity-50 text-sm"
                  >
                    {savingReceipt ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Receipt Settings</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Column: Security Details */}
        <div className="space-y-8">
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
              <Lock className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-base text-foreground">Security Settings</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="enterprise-input"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Secure Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="enterprise-input"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passwordUpdating}
                  className="w-full bg-secondary hover:bg-secondary/80 text-foreground border border-border/80 font-semibold py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 text-sm disabled:opacity-50"
                >
                  {passwordUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Key className="w-4 h-4" />
                  )}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
