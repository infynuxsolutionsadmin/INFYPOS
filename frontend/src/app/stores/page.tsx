'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { storesService } from '../../services/stores';
import { useAuth } from '../../contexts/AuthContext';
import {
  Store,
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  Globe,
  DollarSign,
  AlertTriangle,
  Building,
  Mail,
  Phone,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import {
  DataTable,
  DataTableScroll,
  DataTableHeader,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableCell,
  DataTableEmpty,
} from '@/components/ui/data-table';
import { TableRowSkeleton } from '@/components/ui/skeleton';


// Schema for store create/edit validation
const storeSchema = z.object({
  name: z.string().min(2, { message: 'Store name is required' }),
  code: z.string().optional(),
  email: z.string().email({ message: 'Invalid email format' }).or(z.literal('')),
  phone: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  timezone: z.string().default('UTC'),
  currency: z.string().min(3).max(3).default('USD'),
  isMain: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DELETED']).optional(),
});

export default function StoresPage() {
  const { userRole } = useAuth();
  const queryClient = useQueryClient();

  // Search & Pagination states
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 5;

  // Modals & Target states
  const [modalOpen, setModalOpen] = useState(false);
  const [editStoreId, setEditStoreId] = useState<string | null>(null);
  const [deleteStoreId, setDeleteStoreId] = useState<string | null>(null);

  const isOwner = userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  // React Query: Get all stores scoped to tenant and user permissions
  const { data, isLoading } = useQuery({
    queryKey: ['stores', page, search],
    queryFn: () => storesService.getAll({ page, limit, search }),
  });

  const stores = data?.data ?? [];
  const meta = data?.meta;

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(storeSchema),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => storesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast.success('Store created successfully');
      setModalOpen(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      storesService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast.success('Store updated successfully');
      setModalOpen(false);
      setEditStoreId(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => storesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast.success('Store soft-deleted successfully');
      setDeleteStoreId(null);
    },
  });

  const handleOpenCreate = () => {
    if (!isOwner) {
      toast.error('Only Owners can create stores.');
      return;
    }
    setEditStoreId(null);
    reset({
      name: '',
      code: '',
      email: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      timezone: 'UTC',
      currency: 'USD',
      isMain: false,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (store: any) => {
    if (!isOwner) {
      toast.error('Only Owners can edit stores.');
      return;
    }
    setEditStoreId(store.id);
    setValue('name', store.name);
    setValue('code', store.code);
    setValue('email', store.email || '');
    setValue('phone', store.phone || '');
    setValue('addressLine1', store.addressLine1 || '');
    setValue('addressLine2', store.addressLine2 || '');
    setValue('city', store.city || '');
    setValue('state', store.state || '');
    setValue('country', store.country || '');
    setValue('postalCode', store.postalCode || '');
    setValue('timezone', store.timezone);
    setValue('currency', store.currency);
    setValue('isMain', store.isMain);
    setValue('status', store.status);
    setModalOpen(true);
  };

  const onSubmit = (values: any) => {
    // If email is empty string, make it undefined so it passes validation or server constraints
    const payload = { ...values };
    if (payload.email === '') {
      payload.email = undefined;
    }
    if (editStoreId) {
      updateMutation.mutate({ id: editStoreId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Stores"
        description="Configure retail branches, warehouses, currencies, and timezones."
        icon={<Store className="h-5 w-5" />}
        actions={
          isOwner ? (
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" />
              Create store
            </Button>
          ) : undefined
        }
      />

      <SearchInput
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder="Search store name, code, city..."
        aria-label="Search stores"
      />

      <DataTable>
        <DataTableScroll>
          <table className="w-full text-left text-sm">
            <DataTableHeader>
              <tr>
                <DataTableHead>Store Name</DataTableHead>
                <DataTableHead>Store Code</DataTableHead>
                <DataTableHead>Type</DataTableHead>
                <DataTableHead>Location</DataTableHead>
                <DataTableHead>System Contact</DataTableHead>
                <DataTableHead>Settings</DataTableHead>
                {isOwner && <DataTableHead className="text-right">Actions</DataTableHead>}
              </tr>
            </DataTableHeader>
            <DataTableBody>
              {isLoading ? (
                <>
                  <TableRowSkeleton cols={isOwner ? 7 : 6} />
                  <TableRowSkeleton cols={isOwner ? 7 : 6} />
                  <TableRowSkeleton cols={isOwner ? 7 : 6} />
                </>
              ) : stores.length === 0 ? (
                <DataTableEmpty colSpan={isOwner ? 7 : 6} message="No active stores found for this organization." />
              ) : (
                stores.map((store) => (
                  <DataTableRow key={store.id}>
                    <td className="p-4 font-bold text-foreground" data-label="Store Name">{store.name}</td>
                    <td className="p-4 font-mono font-semibold text-primary" data-label="Store Code">{store.code}</td>
                    <td className="p-4" data-label="Type">
                      {store.isMain ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                          Main Branch
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider">
                          Store Outlet
                        </span>
                      )}
                    </td>
                    <td className="p-4 truncate max-w-[160px]" data-label="Location">{store.city || 'N/A'}, {store.country || 'N/A'}</td>
                    <td className="p-4" data-label="System Contact">
                      <div className="space-y-0.5 text-[10px] text-muted-foreground">
                        {store.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <span>{store.email}</span>
                          </div>
                        )}
                        {store.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            <span>{store.phone}</span>
                          </div>
                        )}
                        {!store.email && !store.phone && <span>N/A</span>}
                      </div>
                    </td>
                    <td className="p-4" data-label="Settings">
                      <div className="space-y-0.5 text-[10px] text-muted-foreground font-mono">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-muted-foreground" />
                          <span>{store.timezone}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-muted-foreground" />
                          <span>{store.currency}</span>
                        </div>
                      </div>
                    </td>
                    {isOwner && (
                      <td className="p-4 text-right" data-label="">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(store)}
                            className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition cursor-pointer"
                            title="Edit Store"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteStoreId(store.id)}
                            className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition cursor-pointer"
                            title="Delete Store"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </DataTableRow>
                ))
              )}
            </DataTableBody>
          </table>
        </DataTableScroll>

        {/* Pagination controls */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-3.5 text-xs">
            <span className="text-muted-foreground">
              Page {meta.page} of {meta.totalPages}
            </span>
            <div className="inline-flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DataTable>

      {/* Create / Edit Store Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-xl relative z-10 space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                {editStoreId ? 'Edit Store Details' : 'Create New Store'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded text-muted-foreground hover:bg-accent">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold">Store Name *</label>
                  <input
                    {...register('name')}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    placeholder="Chennai regional hub"
                  />
                  {errors.name && <p className="text-destructive text-[11px]">{errors.name.message as string}</p>}
                </div>
                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold">Store Code</label>
                  <input
                    {...register('code')}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    placeholder="e.g. STORE-002"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold">Contact Email</label>
                  <input
                    {...register('email')}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    placeholder="contact@company.com"
                  />
                  {errors.email && <p className="text-destructive text-[11px]">{errors.email.message as string}</p>}
                </div>
                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold">Contact Phone</label>
                  <input
                    {...register('phone')}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    placeholder="+919876543210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold">Address Line 1</label>
                  <input
                    {...register('addressLine1')}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    placeholder="Anna Salai 123"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold">City</label>
                  <input
                    {...register('city')}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    placeholder="Chennai"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold">Country</label>
                  <input
                    {...register('country')}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    placeholder="India"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold">Timezone</label>
                  <input
                    {...register('timezone')}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    placeholder="Asia/Kolkata"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold">Currency</label>
                  <input
                    {...register('currency')}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    placeholder="INR"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 py-2">
                <input type="checkbox" {...register('isMain')} className="w-4 h-4 accent-primary cursor-pointer" />
                <label className="text-muted-foreground font-semibold cursor-pointer">Mark as Main Store Branch</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-accent text-accent-foreground px-4 py-2 rounded-xl hover:bg-accent/80 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl hover:bg-primary/95 transition cursor-pointer"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteStoreId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setDeleteStoreId(null)} />
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-xl relative z-10 space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base">Soft Delete Store?</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete this store branch? Live POS connections and shifts for this outlet will be suspended. You can recover it later.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteStoreId(null)}
                className="bg-accent text-accent-foreground px-3.5 py-1.5 rounded-lg hover:bg-accent/80 text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteStoreId)}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground font-semibold px-3.5 py-1.5 rounded-lg hover:bg-destructive/95 text-xs transition cursor-pointer"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
