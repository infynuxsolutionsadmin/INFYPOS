'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { categoriesService, Category } from '../../services/categories';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  FolderOpen,
  BookOpen,
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

// Schema for category validation
const categorySchema = z.object({
  name: z.string().min(2, { message: 'Category name is required (min 2 chars)' }),
  description: z.string().optional(),
  parentId: z.string().optional().or(z.literal('')),
});

export default function CategoriesPage() {
  const { userRole } = useAuth();
  const queryClient = useQueryClient();

  // Search & Pagination states
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 5;

  // Modals & Target states
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  const isOwner = userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'MANAGER';

  // React Query Fetcher: list of categories
  const { data, isLoading } = useQuery({
    queryKey: ['categories', page, search],
    queryFn: () => categoriesService.getAll({ page, limit, search }),
  });

  // Fetch all parent categories (unpaginated for the dropdown)
  const { data: allParentData } = useQuery({
    queryKey: ['categories-all-parents'],
    queryFn: () => categoriesService.getAll({ limit: 100 }),
  });

  const categoriesList = data?.data ?? [];
  const meta = data?.meta;
  const parentCategories = allParentData?.data ?? [];

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(categorySchema),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => categoriesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories-list-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['categories-all-parents'] });
      toast.success('Category created successfully');
      setModalOpen(false);
      reset();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create category');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      categoriesService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories-list-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['categories-all-parents'] });
      toast.success('Category updated successfully');
      setModalOpen(false);
      setEditCategoryId(null);
      reset();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories-list-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['categories-all-parents'] });
      toast.success('Category deleted successfully');
      setDeleteCategoryId(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete category. Ensure no products are linked.');
    },
  });

  const handleOpenAddModal = () => {
    reset();
    setEditCategoryId(null);
    setValue('parentId', '');
    setModalOpen(true);
  };

  const handleOpenEditModal = (category: Category) => {
    reset();
    setEditCategoryId(category.id);
    setValue('name', category.name);
    setValue('description', category.description ?? '');
    setValue('parentId', category.parentId ?? '');
    setModalOpen(true);
  };

  const handleFormSubmit = (values: any) => {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      parentId: values.parentId || undefined,
    };

    if (editCategoryId) {
      updateMutation.mutate({ id: editCategoryId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Category Management"
        description="Organize your store inventory catalogs with structural hierarchies."
        icon={<FolderOpen className="w-8 h-8 text-primary" />}
        actions={
          isOwner && (
            <Button onClick={handleOpenAddModal} className="flex items-center space-x-1.5">
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </Button>
          )
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border">
        <SearchInput
          placeholder="Search by category name or slug..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Main categories table view */}
      <DataTable>
        <DataTableScroll>
          <table className="w-full text-left text-sm">
            <DataTableHeader>
              <tr>
                <DataTableHead>Category Name</DataTableHead>
                <DataTableHead>Code/Slug</DataTableHead>
                <DataTableHead>Parent Category</DataTableHead>
                <DataTableHead>Description</DataTableHead>
                {isOwner && <DataTableHead className="text-right">Actions</DataTableHead>}
              </tr>
            </DataTableHeader>
            <DataTableBody>
              {isLoading ? (
                Array.from({ length: limit }).map((_, idx) => (
                  <TableRowSkeleton key={idx} cols={isOwner ? 5 : 4} />
                ))
              ) : categoriesList.length === 0 ? (
                <DataTableEmpty colSpan={isOwner ? 5 : 4} message="No categories configured yet." />
              ) : (
                categoriesList.map((cat: Category) => (
                  <DataTableRow key={cat.id}>
                    <DataTableCell className="font-semibold text-foreground" label="Category Name">{cat.name}</DataTableCell>
                    <DataTableCell className="font-mono text-xs" label="Code / Slug">{cat.slug}</DataTableCell>
                    <DataTableCell className="text-muted-foreground" label="Parent Category">{cat.parent?.name ?? '-'}</DataTableCell>
                    <DataTableCell className="text-muted-foreground" label="Description">{cat.description ?? '-'}</DataTableCell>
                    {isOwner && (
                      <DataTableCell className="text-right space-x-2" label="">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditModal(cat)}
                          className="hover:text-primary"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteCategoryId(cat.id)}
                          className="hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </DataTableCell>
                    )}
                  </DataTableRow>
                ))
              )}
            </DataTableBody>
          </table>
        </DataTableScroll>

        {/* Pagination controls */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20 text-xs">
            <span className="text-muted-foreground">
              Page {page} of {meta.totalPages} ({meta.total} total items)
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </DataTable>

      {/* Add / Edit Category Dialog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
              <h3 className="font-bold text-foreground">
                {editCategoryId ? 'Edit Category' : 'Add Category'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition"
                  placeholder="e.g. Beverages"
                />
                {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name.message as string}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Parent Category (Optional)
                </label>
                <select
                  {...register('parentId')}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition"
                >
                  <option value="">-- None / Root Level --</option>
                  {parentCategories
                    .filter((c) => c.id !== editCategoryId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition h-20"
                  placeholder="Details about the category..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editCategoryId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Dialog Modal */}
      {deleteCategoryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-card border border-border rounded-xl shadow-xl p-6 space-y-4"
          >
            <div className="flex items-center space-x-3 text-red-500">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-foreground">Confirm Category Deletion</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete this category? This action is permanent and cannot be undone. Ensure no catalog items or child categories are associated with it.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDeleteCategoryId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate(deleteCategoryId)}
                disabled={deleteMutation.isPending}
              >
                Delete
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
