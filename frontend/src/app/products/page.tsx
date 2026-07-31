'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { productsService } from '../../services/products';
import { categoriesService } from '../../services/categories';
import { vatService } from '../../services/vat';
import { useAuth } from '../../contexts/AuthContext';
import {
  Package,
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Boxes,
  Percent,
} from 'lucide-react';
import { ProductStatus } from '../../types/products';
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

const productSchema = z.object({
  name: z.string().min(2, { message: 'Product name is required' }),
  sku: z.string().min(2, { message: 'SKU code is required' }),
  barcode: z.string().optional(),
  categoryId: z.string().optional().or(z.literal('')),
  vatRateId: z.string().min(1, { message: 'VAT Category is required' }),
  description: z.string().optional(),
  brand: z.string().optional(),
  unit: z.string().default('PCS'),
  costPrice: z.preprocess(
    (val) => Number(val),
    z.number().min(0, { message: 'Cost price must be positive' }),
  ),
  sellingPrice: z.preprocess(
    (val) => Number(val),
    z.number().min(0, { message: 'Selling price must be positive' }),
  ),
  trackInventory: z.boolean().default(true),
  minimumStock: z.preprocess(
    (val) => Number(val),
    z.number().min(0).default(0),
  ),
  reorderLevel: z.preprocess(
    (val) => Number(val),
    z.number().min(0).default(0),
  ),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED', 'DELETED']).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function ProductsPage() {
  const { userRole } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 5;

  const [modalOpen, setModalOpen] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

  // Sub-modal states for inline Category creation
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const isOwner = userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  // React Query Fetchers
  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search],
    queryFn: () => productsService.getAll({ page, limit, search }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories-list-dropdown'],
    queryFn: () => categoriesService.getAll({ limit: 100 }),
  });

  const { data: vatRatesData } = useQuery({
    queryKey: ['vat-rates-dropdown'],
    queryFn: () => vatService.getVatRates(),
  });

  const products = data?.data ?? [];
  const meta = data?.meta;
  const categoriesList = categoriesData?.data ?? [];
  const vatRatesList = vatRatesData ?? [];

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(productSchema),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => productsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product added to catalog');
      setModalOpen(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      productsService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product configuration updated');
      setModalOpen(false);
      setEditProductId(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted from catalog');
      setDeleteProductId(null);
    },
  });

  const handleQuickCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const response = await categoriesService.create({ name: newCatName });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['categories-list-dropdown'] });
      toast.success('Category created');
      setSubModalOpen(false);
      setNewCatName('');
      if (response.data && response.data.id) {
        setValue('categoryId', response.data.id);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create category');
    }
  };

  const handleOpenCreate = () => {
    setEditProductId(null);
    const defaultVat = vatRatesList.find((v: any) => v.isDefault) || vatRatesList[0];
    reset({
      name: '',
      sku: '',
      barcode: '',
      categoryId: '',
      vatRateId: defaultVat?.id || '',
      description: '',
      brand: '',
      unit: 'PCS',
      costPrice: 0,
      sellingPrice: 0,
      trackInventory: true,
      minimumStock: 0,
      reorderLevel: 0,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setEditProductId(product.id);
    setValue('name', product.name);
    setValue('sku', product.sku);
    setValue('barcode', product.barcode || '');
    setValue('categoryId', product.categoryId || '');
    setValue('vatRateId', product.vatRateId || '');
    setValue('description', product.description || '');
    setValue('brand', product.brand || '');
    setValue('unit', product.unit);
    setValue('costPrice', Number(product.costPrice));
    setValue('sellingPrice', Number(product.sellingPrice));
    setValue('trackInventory', product.trackInventory);
    setValue('minimumStock', Number(product.minimumStock));
    setValue('reorderLevel', Number(product.reorderLevel));
    setValue('status', product.status);
    setModalOpen(true);
  };

  const onSubmit = (values: any) => {
    const payload = {
      ...values,
      categoryId: values.categoryId || null,
    };
    if (editProductId) {
      updateMutation.mutate({ id: editProductId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Products"
        description="Manage barcodes, stock counts, cost metrics, and pricing."
        icon={<Package className="h-5 w-5" />}
        actions={
          isOwner ? (
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" />
              Create product
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
        placeholder="Search SKU, product name, barcode..."
        aria-label="Search products"
      />

      <DataTable>
        <DataTableScroll>
          <table className="w-full text-left text-sm">
            <DataTableHeader>
              <tr>
                <DataTableHead>Item Details</DataTableHead>
                <DataTableHead>SKU / Barcode</DataTableHead>
                <DataTableHead>Category</DataTableHead>
                <DataTableHead>VAT Rate</DataTableHead>
                <DataTableHead>Sales Price</DataTableHead>
                <DataTableHead>Cost Price</DataTableHead>
                <DataTableHead>Stock Level</DataTableHead>
                <DataTableHead>Status</DataTableHead>
                {isOwner && <DataTableHead className="text-right">Actions</DataTableHead>}
              </tr>
            </DataTableHeader>
            <DataTableBody>
              {isLoading ? (
                <>
                  <TableRowSkeleton cols={isOwner ? 9 : 8} />
                  <TableRowSkeleton cols={isOwner ? 9 : 8} />
                  <TableRowSkeleton cols={isOwner ? 9 : 8} />
                </>
              ) : products.length === 0 ? (
                <DataTableEmpty colSpan={isOwner ? 9 : 8} message="No products found in this catalog." />
              ) : (
                products.map((product) => (
                  <DataTableRow key={product.id}>
                    <td className="p-4" data-label="Item Details">
                      <div>
                        <p className="font-bold text-foreground">{product.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                          {product.description || 'No description'}
                        </p>
                      </div>
                    </td>
                    <td className="p-4" data-label="SKU / Barcode">
                      <div className="space-y-0.5 font-mono text-[10px]">
                        <p className="font-bold text-primary">{product.sku}</p>
                        <p className="text-muted-foreground">UPC: {product.barcode || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="p-4" data-label="Category">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground text-[10px] font-medium">
                        {product.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="p-4" data-label="VAT Rate">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold">
                        {product.vatRate ? `${product.vatRate.name} (${Number(product.vatRate.percentage)}%)` : 'Not Set'}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-foreground" data-label="Sales Price">
                      £{Number(product.sellingPrice).toFixed(2)}
                    </td>
                    <td className="p-4 text-muted-foreground" data-label="Cost Price">
                      £{Number(product.costPrice).toFixed(2)}
                    </td>
                    <td className="p-4" data-label="Stock Level">
                      <div className="flex items-center gap-2">
                        <Boxes className="w-4 h-4 text-muted-foreground/60" />
                        <span className="font-mono font-bold">{Number(product.minimumStock)} PCS</span>
                      </div>
                    </td>
                    <td className="p-4" data-label="Status">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          product.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : product.status === 'DRAFT'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-muted text-muted-foreground border border-border'
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    {isOwner && (
                      <td className="p-4 text-right" data-label="">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteProductId(product.id)}
                            className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition cursor-pointer"
                            title="Delete Product"
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

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-3.5 text-xs">
            <span className="text-muted-foreground">
              Page {meta.page} of {meta.totalPages}
            </span>
            <div className="inline-flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} aria-label="Next page">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DataTable>

      {/* Create / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-xl relative z-10 space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                {editProductId ? 'Edit Product Details' : 'Create New Product'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded text-muted-foreground hover:bg-accent">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold">Product Name *</label>
                  <input
                    {...register('name')}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    placeholder="Premium T-Shirt"
                  />
                  {errors.name && <p className="text-destructive text-[11px]">{errors.name.message as string}</p>}
                </div>
                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold">SKU Code *</label>
                  <input
                    {...register('sku')}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    placeholder="TSHIRT-BLU-L"
                  />
                  {errors.sku && <p className="text-destructive text-[11px]">{errors.sku.message as string}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold">Cost Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('costPrice')}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    placeholder="12.50"
                  />
                  {errors.costPrice && <p className="text-destructive text-[11px]">{errors.costPrice.message as string}</p>}
                </div>
                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold">Selling Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('sellingPrice')}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    placeholder="25.00"
                  />
                  {errors.sellingPrice && <p className="text-destructive text-[11px]">{errors.sellingPrice.message as string}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold">Barcode / UPC</label>
                  <input
                    {...register('barcode')}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    placeholder="1234567890"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold">Inventory Min Stock</label>
                  <input
                    type="number"
                    {...register('minimumStock')}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    placeholder="10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold">Reorder level</label>
                  <input
                    type="number"
                    {...register('reorderLevel')}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold flex items-center justify-between">
                    <span>Category</span>
                    <button
                      type="button"
                      onClick={() => setSubModalOpen(true)}
                      className="text-primary hover:underline text-[10px] font-bold"
                    >
                      + Add Category
                    </button>
                  </label>
                  <select
                    {...register('categoryId')}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">-- Uncategorized --</option>
                    {categoriesList.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold">VAT Category *</label>
                  <select
                    {...register('vatRateId')}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">-- Select VAT Category --</option>
                    {vatRatesList.map((v: any) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({Number(v.percentage)}%)
                      </option>
                    ))}
                  </select>
                  {errors.vatRateId && <p className="text-destructive text-[11px]">{errors.vatRateId.message as string}</p>}
                </div>
              </div>

              {editProductId && (
                <div className="space-y-1">
                  <label className="block text-muted-foreground font-semibold">Product Status</label>
                  <select
                    {...register('status')}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              )}

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
      {deleteProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setDeleteProductId(null)} />
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-xl relative z-10 space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base">Delete Product from Catalog?</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete this product? All active inventory lines and sales logs scoped to this barcode item will be affected.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteProductId(null)}
                className="bg-accent text-accent-foreground px-3.5 py-1.5 rounded-lg hover:bg-accent/80 text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteProductId)}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground font-semibold px-3.5 py-1.5 rounded-lg hover:bg-destructive/95 text-xs transition cursor-pointer"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Category Creation sub-modal */}
      {subModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-background/85 backdrop-blur-xs z-10" onClick={() => setSubModalOpen(false)} />
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-xl relative z-20 space-y-4 text-xs">
            <h4 className="font-bold text-sm text-foreground">Create New Category</h4>
            <div>
              <label className="block text-muted-foreground font-semibold mb-1">Category Name</label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Beverages"
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSubModalOpen(false)}
                className="bg-accent text-accent-foreground px-4 py-2 rounded-xl hover:bg-accent/80 transition cursor-pointer font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickCreateCategory}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/95 transition cursor-pointer font-bold"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
