import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface ActivityItem {
  id: string;
  type: string;
  message: string;
  createdAt: Date;
}

export interface LowStockItem {
  id: string;
  productName: string;
  sku: string;
  storeName: string;
  currentStock: number;
  reorderLevel: number;
}

export interface SalesPerformancePoint {
  name: string;
  Sales: number;
  Revenue: number;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(tenantId: string) {
    const [totalProducts, totalStores, totalUsers, stockAgg, outOfStockCount, lowStockResult] = await Promise.all([
      // 1. Total Products
      this.prisma.product.count({
        where: { tenantId, deletedAt: null },
      }),
      // 2. Total Stores
      this.prisma.store.count({
        where: { tenantId, deletedAt: null },
      }),
      // 3. Total Users
      this.prisma.user.count({
        where: { tenantId, deletedAt: null },
      }),
      // 4. Total Stock Hand
      this.prisma.inventory.aggregate({
        where: { tenantId, deletedAt: null },
        _sum: {
          currentStock: true,
        },
      }),
      // 5. Out of stock count
      this.prisma.inventory.count({
        where: {
          tenantId,
          deletedAt: null,
          currentStock: 0,
        },
      }),
      // 6. Low stock count raw query
      this.prisma.$queryRaw<Array<{ count: string | number | bigint }>>`
        SELECT COUNT(*)::bigint as count
        FROM inventories i
        JOIN products p ON i.product_id = p.id
        WHERE i.tenant_id = ${tenantId}::uuid
          AND i.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND i.current_stock <= p.reorder_level
          AND p.reorder_level > 0
      `
    ]);

    const lowStockCount = Number(lowStockResult[0]?.count ?? 0);
    const totalInventory = Number(stockAgg._sum?.currentStock ?? 0);

    return {
      totalProducts,
      totalStores,
      totalUsers,
      totalInventory,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
    };
  }

  async getCategoryDistribution(tenantId: string) {
    const categories = await this.prisma.product.groupBy({
      by: ['categoryId'],
      where: { tenantId, deletedAt: null, categoryId: { not: null } },
      _count: {
        id: true,
      },
    });

    const categoryIds = categories.map((c) => c.categoryId).filter(Boolean) as string[];
    const categoryList = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    const categoryMap = new Map(categoryList.map((c) => [c.id, c.name]));

    return categories.map((c) => ({
      category: categoryMap.get(c.categoryId!) || 'Unknown',
      count: c._count.id,
    }));
  }

  async getInventorySummary(tenantId: string) {
    const [outOfStock, lowStockResult, inStockResult] = await Promise.all([
      // Out of stock (currentStock = 0)
      this.prisma.inventory.count({
        where: {
          tenantId,
          deletedAt: null,
          currentStock: 0,
        },
      }),
      // Low stock (currentStock <= reorderLevel and reorderLevel > 0)
      this.prisma.$queryRaw<Array<{ count: string | number | bigint }>>`
        SELECT COUNT(*)::bigint as count
        FROM inventories i
        JOIN products p ON i.product_id = p.id
        WHERE i.tenant_id = ${tenantId}::uuid
          AND i.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND i.current_stock <= p.reorder_level
          AND p.reorder_level > 0
      `,
      // In stock (currentStock > 0 AND (reorderLevel = 0 OR currentStock > reorderLevel))
      this.prisma.$queryRaw<Array<{ count: string | number | bigint }>>`
        SELECT COUNT(*)::bigint as count
        FROM inventories i
        JOIN products p ON i.product_id = p.id
        WHERE i.tenant_id = ${tenantId}::uuid
          AND i.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND i.current_stock > 0
          AND (p.reorder_level = 0 OR i.current_stock > p.reorder_level)
      `
    ]);

    return {
      inStock: Number(inStockResult[0]?.count ?? 0),
      lowStock: Number(lowStockResult[0]?.count ?? 0),
      outOfStock,
    };
  }

  async getRecentActivity(tenantId: string): Promise<ActivityItem[]> {
    const [recentProducts, recentAdjustments, recentUsers] = await Promise.all([
      this.prisma.product.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, name: true, createdAt: true },
      }),
      this.prisma.inventoryMovement.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { product: { select: { name: true } }, user: { select: { firstName: true } } },
      }),
      this.prisma.user.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, firstName: true, lastName: true, createdAt: true },
      }),
    ]);

    const activity: ActivityItem[] = [];

    for (const p of recentProducts) {
      activity.push({
        id: `p-${p.id}`,
        type: 'PRODUCT_CREATED',
        message: `New product added: "${p.name}"`,
        createdAt: p.createdAt,
      });
    }

    for (const m of recentAdjustments) {
      activity.push({
        id: `m-${m.id}`,
        type: 'STOCK_ADJUSTED',
        message: `Stock adjusted for "${m.product.name}" (${Number(m.quantity) >= 0 ? '+' : ''}${Number(m.quantity)}) by ${m.user?.firstName || 'Staff'}`,
        createdAt: m.createdAt,
      });
    }

    for (const u of recentUsers) {
      activity.push({
        id: `u-${u.id}`,
        type: 'USER_CREATED',
        message: `New staff register: "${u.firstName} ${u.lastName}"`,
        createdAt: u.createdAt,
      });
    }

    return activity.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);
  }

  async getLowStock(tenantId: string): Promise<LowStockItem[]> {
    const lowStockItems = await this.prisma.$queryRaw<Array<{
      id: string;
      productName: string;
      sku: string;
      storeName: string;
      currentStock: number;
      reorderLevel: number;
    }>>`
      SELECT 
        i.id,
        p.name as "productName",
        p.sku,
        s.name as "storeName",
        i.current_stock::double precision as "currentStock",
        p.reorder_level::double precision as "reorderLevel"
      FROM inventories i
      JOIN products p ON i.product_id = p.id
      JOIN stores s ON i.store_id = s.id
      WHERE i.tenant_id = ${tenantId}::uuid
        AND i.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND s.deleted_at IS NULL
        AND i.current_stock <= p.reorder_level
        AND p.reorder_level > 0
      LIMIT 5
    `;

    return lowStockItems;
  }

  async getSalesPerformance(tenantId: string): Promise<SalesPerformancePoint[]> {
    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialise all 12 months with zero values
    const monthlyData: SalesPerformancePoint[] = MONTH_NAMES.map((name) => ({
      name,
      Sales: 0,
      Revenue: 0,
    }));

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear + 1, 0, 1);

    const sales = await this.prisma.sale.findMany({
      where: {
        tenantId,
        deletedAt: null,
        createdAt: { gte: yearStart, lt: yearEnd },
      },
      select: { total: true, createdAt: true },
    });

    for (const sale of sales) {
      const monthIndex = new Date(sale.createdAt).getMonth();
      monthlyData[monthIndex].Sales += 1;
      monthlyData[monthIndex].Revenue += Number(sale.total);
    }

    return monthlyData;
  }
}
