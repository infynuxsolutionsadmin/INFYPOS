'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { customersService, CustomerItem } from '@/services/customers';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { Search, ChevronLeft, ChevronRight, Eye, UserPlus, Phone, Mail, Award, X } from 'lucide-react';

export default function CustomersListPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // States
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Authentication gate
  useEffect(() => {
    if (!isMounted) return;
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isMounted, isAuthenticated, router]);

  // Filter conditions
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
  });

  const fetchCustomersData = async () => {
    setIsLoading(true);
    try {
      const res = await customersService.getAll({
        page: filters.page,
        limit: filters.limit,
        search: filters.search || undefined,
      });
      setCustomers(res.items);
      setTotalItems(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      toast.error('Failed to load customer profiles.');
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted && isAuthenticated) {
      fetchCustomersData();
    }
  }, [isMounted, isAuthenticated, filters.page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1 }));
    fetchCustomersData();
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.firstName.trim()) {
      toast.error('First name is required.');
      return;
    }
    setIsCreating(true);
    try {
      await customersService.create({
        firstName: newCustomer.firstName.trim(),
        lastName: newCustomer.lastName.trim() || undefined,
        email: newCustomer.email.trim() || undefined,
        phone: newCustomer.phone.trim() || undefined,
        address: newCustomer.address.trim() || undefined,
        city: newCustomer.city.trim() || undefined,
        country: newCustomer.country.trim() || undefined,
      });
      toast.success('Customer profile created successfully!');
      setShowCreateModal(false);
      setNewCustomer({ firstName: '', lastName: '', email: '', phone: '', address: '', city: '', country: '' });
      fetchCustomersData();
    } catch (err: any) {
      // Error toasts are handled by the global axios interceptor
    } finally {
      setIsCreating(false);
    }
  };

  if (!isMounted || !isAuthenticated) {
    return <div className="p-8 text-center text-slate-400">Loading Directory...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Customer Directory"
          description="View registry profiles, manage loyalty point accounts, and review customer transaction values."
        />
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Search Header */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by first name, last name, phone, email, or customer code..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full bg-background border border-input rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </div>

      {/* Directory Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between gap-4">
                <div className="h-5 w-1/4 bg-muted animate-pulse rounded" />
                <div className="h-5 w-1/6 bg-muted animate-pulse rounded" />
                <div className="h-5 w-1/12 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground space-y-4">
            <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p>No customer profiles registered yet.</p>
            <p className="text-xs">Click &quot;Add Customer&quot; to register your first customer, or select a customer during checkout in the Dev Sales POS.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground text-left font-medium">
                  <th className="p-4">Customer Code</th>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Loyalty Points</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Array.isArray(customers) && customers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 font-mono font-semibold text-slate-200">{c.code || 'N/A'}</td>
                    <td className="p-4 font-semibold">{c.firstName} {c.lastName || ''}</td>
                    <td className="p-4 text-xs font-mono">{c.email || '—'}</td>
                    <td className="p-4 text-xs">{c.phone || '—'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Award className="h-3.5 w-3.5 text-amber-500" />
                        <span className="font-semibold">{c.loyaltyPoints ?? 0}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/customers/${c.id}`}>
                        <Button size="sm" variant="outline" className="text-xs">
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View Profile
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-4 bg-muted/20">
            <span className="text-xs text-muted-foreground">
              Showing page {filters.page} of {totalPages} ({totalItems} profiles)
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={filters.page === 1}
                onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Prev</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={filters.page === totalPages}
                onClick={() => setFilters((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="text-lg font-bold">Register New Customer</h3>
                <p className="text-xs text-muted-foreground mt-1">A unique customer code (CUST-XXXXXX) will be assigned automatically.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newCustomer.firstName}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Last Name</label>
                  <input
                    type="text"
                    value={newCustomer.lastName}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="+44 7700 900000"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Address</label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="123 Market Street"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">City</label>
                  <input
                    type="text"
                    value={newCustomer.city}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="London"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Country</label>
                  <input
                    type="text"
                    value={newCustomer.country}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="UK"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  {isCreating ? 'Creating...' : 'Register Customer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
