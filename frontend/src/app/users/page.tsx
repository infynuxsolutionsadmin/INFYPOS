'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { usersService } from '../../services/users';
import { rolesService } from '../../services/roles';
import { storesService } from '../../services/stores';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users,
  Plus,
  Mail,
  Phone,
  Shield,
  Store,
  UserCheck,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Lock,
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
  DataTableEmpty,
} from '@/components/ui/data-table';
import { TableRowSkeleton } from '@/components/ui/skeleton';

const userSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  phone: z.string().optional(),
  roleId: z.string().uuid({ message: 'Select a valid role' }),
  storeIds: z.array(z.string().uuid()).default([]),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  phone: z.string().optional(),
  roleId: z.string().uuid({ message: 'Select a valid role' }),
  storeIds: z.array(z.string().uuid()).default([]),
});

type UserFormValues = z.infer<typeof userSchema>;
type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

export default function UsersPage() {
  const { userRole } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const isOwner = userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  // React Query Fetchers
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users', search],
    queryFn: async () => {
      const res = await usersService.getAll();
      const items = res.data ?? [];
      if (search.trim()) {
        const query = search.toLowerCase();
        return items.filter(
          (u) =>
            u.firstName.toLowerCase().includes(query) ||
            u.lastName.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query),
        );
      }
      return items;
    },
  });

  const { data: rolesResponse } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesService.getAll(),
  });
  const roles = rolesResponse?.data ?? [];

  const { data: storesResponse } = useQuery({
    queryKey: ['stores-list-all'],
    queryFn: () => storesService.getAll({ limit: 100 }),
  });
  const stores = storesResponse?.data ?? [];

  // React Hook Form
  const {
    register: regCreate,
    handleSubmit: handleSubCreate,
    reset: resetCreate,
    formState: { errors: errCreate },
  } = useForm<any>({
    resolver: zodResolver(userSchema),
  });

  const {
    register: regEdit,
    handleSubmit: handleSubEdit,
    reset: resetEdit,
    setValue: setEditValue,
    formState: { errors: errEdit },
  } = useForm<any>({
    resolver: zodResolver(updateUserSchema),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => usersService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Staff user created successfully');
      setModalOpen(false);
      resetCreate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserFormValues }) =>
      usersService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Staff user updated successfully');
      setModalOpen(false);
      setEditUserId(null);
      resetEdit();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User soft-deleted successfully');
      setDeleteUserId(null);
    },
  });

  const handleOpenCreate = () => {
    setEditUserId(null);
    resetCreate({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      roleId: '',
      storeIds: [],
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setEditUserId(user.id);
    setEditValue('firstName', user.firstName);
    setEditValue('lastName', user.lastName);
    setEditValue('phone', user.phone || '');
    setEditValue('roleId', user.role?.id || '');
    setEditValue(
      'storeIds',
      user.stores?.map((s: any) => s.id) || [],
    );
    setModalOpen(true);
  };

  const onSubmitCreate = (values: any) => {
    createMutation.mutate(values);
  };

  const onSubmitEdit = (values: any) => {
    if (editUserId) {
      updateMutation.mutate({ id: editUserId, payload: values });
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Users & Staff"
        description="Manage store owners, regional managers, cashiers, and store permissions."
        icon={<Users className="h-5 w-5" />}
        actions={
          isOwner ? (
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" />
              Add user
            </Button>
          ) : undefined
        }
      />

      <SearchInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search staff name or email..."
        aria-label="Search users"
      />

      <DataTable>
        <DataTableScroll>
          <table className="w-full text-left text-sm">
            <DataTableHeader>
              <tr>
                <DataTableHead>Staff Member</DataTableHead>
                <DataTableHead>Email Address</DataTableHead>
                <DataTableHead>Role</DataTableHead>
                <DataTableHead>Assigned Outlets</DataTableHead>
                <DataTableHead>Status</DataTableHead>
                {isOwner && <DataTableHead className="text-right">Actions</DataTableHead>}
              </tr>
            </DataTableHeader>
            <DataTableBody>
              {loadingUsers ? (
                <>
                  <TableRowSkeleton cols={isOwner ? 6 : 5} />
                  <TableRowSkeleton cols={isOwner ? 6 : 5} />
                  <TableRowSkeleton cols={isOwner ? 6 : 5} />
                </>
              ) : users.length === 0 ? (
                <DataTableEmpty colSpan={isOwner ? 6 : 5} message="No active staff users found." />
              ) : (
                users.map((user) => {
                  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
                  const roleName = user.role?.name || 'GUEST';
                  return (
                  <DataTableRow key={user.id}>
                      <td className="p-4 flex items-center space-x-3" data-label="Staff Member">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {initials || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{user.firstName} {user.lastName}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{user.phone || 'No phone'}</p>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-medium text-primary" data-label="Email Address">{user.email}</td>
                      <td className="p-4" data-label="Role">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            roleName === 'OWNER'
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : roleName === 'MANAGER'
                              ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {roleName}
                        </span>
                      </td>
                      <td className="p-4" data-label="Assigned Outlets">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {user.stores && user.stores.length > 0 ? (
                            user.stores.map((s) => (
                              <span
                                key={s.id}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[9px] font-medium border border-border"
                              >
                                <Store className="w-2.5 h-2.5 text-muted-foreground/60" />
                                {s.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">All Stores</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4" data-label="Status">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            user.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-destructive/10 text-destructive border border-destructive/20'
                          }`}
                        >
                          <UserCheck className="w-3 h-3" />
                          {user.status}
                        </span>
                      </td>
                      {isOwner && (
                        <td className="p-4 text-right" data-label="">
                          <div className="inline-flex items-center space-x-1.5">
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition cursor-pointer"
                              title="Edit Staff User"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteUserId(user.id)}
                              className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition cursor-pointer"
                              title="Soft Delete Staff User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </DataTableRow>
                  );
                })
              )}
            </DataTableBody>
          </table>
        </DataTableScroll>
      </DataTable>

      {/* Create / Edit User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-xl relative z-10 space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {editUserId ? 'Edit Staff User Details' : 'Add New Staff User'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded text-muted-foreground hover:bg-accent">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={editUserId ? handleSubEdit(onSubmitEdit) : handleSubCreate(onSubmitCreate)}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold">First Name *</label>
                  <input
                    {...(editUserId ? regEdit('firstName') : regCreate('firstName'))}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    placeholder="Alex"
                  />
                  {(editUserId ? errEdit.firstName : errCreate.firstName) && (
                    <p className="text-destructive text-[11px]">
                      {(editUserId ? errEdit.firstName : errCreate.firstName)?.message as string}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold">Last Name *</label>
                  <input
                    {...(editUserId ? regEdit('lastName') : regCreate('lastName'))}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    placeholder="Smith"
                  />
                  {(editUserId ? errEdit.lastName : errCreate.lastName) && (
                    <p className="text-destructive text-[11px]">
                      {(editUserId ? errEdit.lastName : errCreate.lastName)?.message as string}
                    </p>
                  )}
                </div>
              </div>

              {!editUserId && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-muted-foreground font-semibold">Email Address *</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                      <input
                        type="email"
                        {...regCreate('email')}
                        className="w-full bg-background border border-input rounded-lg pl-9 pr-3 py-2 text-foreground focus:outline-none focus:border-primary"
                        placeholder="staff@company.com"
                      />
                    </div>
                    {errCreate.email && <p className="text-destructive text-[11px]">{errCreate.email.message as string}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-muted-foreground font-semibold">Initial Password *</label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                      <input
                        type="password"
                        {...regCreate('password')}
                        className="w-full bg-background border border-input rounded-lg pl-9 pr-3 py-2 text-foreground focus:outline-none focus:border-primary"
                        placeholder="••••••••"
                      />
                    </div>
                    {errCreate.password && <p className="text-destructive text-[11px]">{errCreate.password.message as string}</p>}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold">Staff Contact Phone</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                    <input
                      {...(editUserId ? regEdit('phone') : regCreate('phone'))}
                      className="w-full bg-background border border-input rounded-lg pl-9 pr-3 py-2 text-foreground focus:outline-none focus:border-primary"
                      placeholder="+919876543210"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold">Select Role *</label>
                  <select
                    {...(editUserId ? regEdit('roleId') : regCreate('roleId'))}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">Select Role...</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.description || 'Custom role'})
                      </option>
                    ))}
                  </select>
                  {(editUserId ? errEdit.roleId : errCreate.roleId) && (
                    <p className="text-destructive text-[11px]">
                      {(editUserId ? errEdit.roleId : errCreate.roleId)?.message as string}
                    </p>
                  )}
                </div>
              </div>

              {/* Store outlets multi-select */}
              <div className="space-y-1">
                <label className="block text-muted-foreground font-semibold">Assigned Outlets</label>
                <div className="max-h-24 overflow-y-auto border border-input rounded-lg p-2.5 space-y-1.5 bg-background">
                  {stores.map((store) => (
                    <div key={store.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={store.id}
                        {...(editUserId ? regEdit('storeIds') : regCreate('storeIds'))}
                        className="w-3.5 h-3.5 accent-primary cursor-pointer"
                      />
                      <label className="text-muted-foreground font-medium cursor-pointer">{store.name} ({store.code})</label>
                    </div>
                  ))}
                  {stores.length === 0 && (
                    <p className="text-muted-foreground italic text-center py-2">No stores available</p>
                  )}
                </div>
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
      {deleteUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setDeleteUserId(null)} />
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-xl relative z-10 space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base">Soft Delete Staff User?</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete this staff user? Access to all POS outlets will be immediately revoked. Their historical registers will be preserved.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteUserId(null)}
                className="bg-accent text-accent-foreground px-3.5 py-1.5 rounded-lg hover:bg-accent/80 text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteUserId)}
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
