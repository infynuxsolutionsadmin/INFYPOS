import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { QueryReportDto } from './dto/query-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // Helpers to format SQL query conditions dynamically
  private buildFilters(tenantId: string, query: QueryReportDto) {
    const conditions: Prisma.Sql[] = [Prisma.sql`tenant_id = ${tenantId}::uuid`];

    if (query.storeId) {
      conditions.push(Prisma.sql`store_id = ${query.storeId}::uuid`);
    }
    if (query.cashierId) {
      conditions.push(Prisma.sql`cashier_id = ${query.cashierId}::uuid`);
    }
    if (query.dateFrom) {
      conditions.push(Prisma.sql`created_at >= ${new Date(query.dateFrom)}`);
    }
    if (query.dateTo) {
      conditions.push(Prisma.sql`created_at <= ${new Date(query.dateTo)}`);
    }

    return conditions.length > 0 ? Prisma.join(conditions, ' AND ') : Prisma.sql`1=1`;
  }

  // 30-second in-memory cache for getDashboard
  private dashboardCache = new Map<string, { data: any; expiresAt: number }>();

  // 1. GET /reports/dashboard — Executive Business Intelligence Aggregator
  async getDashboard(tenantId: string, query: QueryReportDto) {
    const cacheKey = `${tenantId}:${query.storeId || ''}:${query.cashierId || ''}:${query.dateFrom || ''}:${query.dateTo || ''}:${query.preset || ''}`;
    const cached = this.dashboardCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    // Process Date Range Presets if provided
    let dateFromFilter = query.dateFrom;
    let dateToFilter = query.dateTo;
    if (query.preset) {
      const now = new Date();
      if (query.preset === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFromFilter = start.toISOString();
      } else if (query.preset === 'yesterday') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        dateFromFilter = start.toISOString();
        dateToFilter = end.toISOString();
      } else if (query.preset === '7days') {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFromFilter = start.toISOString();
      } else if (query.preset === '30days') {
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFromFilter = start.toISOString();
      } else if (query.preset === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFromFilter = start.toISOString();
      } else if (query.preset === 'lastMonth') {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        dateFromFilter = start.toISOString();
        dateToFilter = end.toISOString();
      } else if (query.preset === 'year') {
        const start = new Date(now.getFullYear(), 0, 1);
        dateFromFilter = start.toISOString();
      }
    }

    const storeFilterSql = query.storeId ? Prisma.sql`AND s.store_id = ${query.storeId}::uuid` : Prisma.empty;
    const storeFilterSalesSql = query.storeId ? Prisma.sql`AND store_id = ${query.storeId}::uuid` : Prisma.empty;
    const cashierFilterSql = query.cashierId ? Prisma.sql`AND s.cashier_id = ${query.cashierId}::uuid` : Prisma.empty;
    const cashierFilterSalesSql = query.cashierId ? Prisma.sql`AND cashier_id = ${query.cashierId}::uuid` : Prisma.empty;

    const dateFilterSalesSql = dateFromFilter
      ? dateToFilter
        ? Prisma.sql`AND created_at >= ${new Date(dateFromFilter)} AND created_at <= ${new Date(dateToFilter)}`
        : Prisma.sql`AND created_at >= ${new Date(dateFromFilter)}`
      : Prisma.empty;

    const dateFilterSql = dateFromFilter
      ? dateToFilter
        ? Prisma.sql`AND s.created_at >= ${new Date(dateFromFilter)} AND s.created_at <= ${new Date(dateToFilter)}`
        : Prisma.sql`AND s.created_at >= ${new Date(dateFromFilter)}`
      : Prisma.empty;

    // Parallel database aggregations
    const [
      overallSales,
      todaySales,
      monthRevenueResult,
      grossProfitResult,
      inventoryValuationResult,
      stockCountsResult,
      customerMetricsResult,
      topCustomerResult,
      vatMetricsResult,
      dailyTrendRaw,
      hourlySalesRaw,
      topProductsRaw,
      categoryPerfRaw,
      paymentDistRaw,
      revenueProfitTrendRaw,
      refundedSalesRaw,
      voidedSalesRaw,
      itemMetricsRaw,
      catalogHealthRaw,
      activityFeedRaw,
    ] = await Promise.all([
      // 1. Overall Revenue, Transactions, Avg Basket, VAT
      this.prisma.$queryRaw<any[]>`
        SELECT 
          COALESCE(SUM(total), 0)::numeric as revenue,
          COUNT(id)::bigint as transactions,
          COALESCE(SUM(tax_amount), 0)::numeric as vat_collected,
          COALESCE(SUM(discount_amount), 0)::numeric as total_discount
        FROM sales
        WHERE tenant_id = ${tenantId}::uuid
          AND status = 'COMPLETED'
          ${storeFilterSalesSql}
          ${cashierFilterSalesSql}
          ${dateFilterSalesSql}
      `,

      // 2. Today's Revenue
      this.prisma.$queryRaw<any[]>`
        SELECT COALESCE(SUM(total), 0)::numeric as today_revenue
        FROM sales
        WHERE tenant_id = ${tenantId}::uuid
          AND status = 'COMPLETED'
          AND created_at >= DATE_TRUNC('day', NOW())
          ${storeFilterSalesSql}
          ${cashierFilterSalesSql}
      `,

      // 3. Current Month & Previous Month Revenue
      this.prisma.$queryRaw<any[]>`
        SELECT 
          COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) THEN total END), 0)::numeric as current_month,
          COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month') AND created_at < DATE_TRUNC('month', NOW()) THEN total END), 0)::numeric as previous_month
        FROM sales
        WHERE tenant_id = ${tenantId}::uuid
          AND status = 'COMPLETED'
          ${storeFilterSalesSql}
          ${cashierFilterSalesSql}
      `,

      // 4. Gross Profit (Formula: SUM(si.subtotal - (p.cost_price * si.quantity)))
      this.prisma.$queryRaw<any[]>`
        SELECT COALESCE(SUM(si.subtotal - (p.cost_price * si.quantity)), 0)::numeric as gross_profit
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE s.tenant_id = ${tenantId}::uuid
          AND s.status = 'COMPLETED'
          ${storeFilterSql}
          ${cashierFilterSql}
          ${dateFilterSql}
      `,

      // 5. Inventory Cost Value & Retail Value
      this.prisma.$queryRaw<any[]>`
        SELECT 
          COALESCE(SUM(p.cost_price * i.current_stock), 0)::numeric as cost_value,
          COALESCE(SUM(p.selling_price * i.current_stock), 0)::numeric as retail_value
        FROM inventories i
        JOIN products p ON i.product_id = p.id
        WHERE i.tenant_id = ${tenantId}::uuid
          AND i.deleted_at IS NULL
          AND p.deleted_at IS NULL
          ${query.storeId ? Prisma.sql`AND i.store_id = ${query.storeId}::uuid` : Prisma.empty}
      `,

      // 6. Inventory Status Counts
      this.prisma.$queryRaw<any[]>`
        SELECT 
          COUNT(CASE WHEN i.current_stock > p.reorder_level THEN 1 END)::bigint as in_stock,
          COUNT(CASE WHEN i.current_stock <= p.reorder_level AND i.current_stock > 0 THEN 1 END)::bigint as low_stock,
          COUNT(CASE WHEN i.current_stock <= 0 THEN 1 END)::bigint as out_of_stock
        FROM inventories i
        JOIN products p ON i.product_id = p.id
        WHERE i.tenant_id = ${tenantId}::uuid
          AND i.deleted_at IS NULL
          AND p.deleted_at IS NULL
          ${query.storeId ? Prisma.sql`AND i.store_id = ${query.storeId}::uuid` : Prisma.empty}
      `,

      // 7. Customer Metrics
      this.prisma.$queryRaw<any[]>`
        SELECT 
          COUNT(CASE WHEN created_at >= DATE_TRUNC('day', NOW()) THEN 1 END)::bigint as new_today,
          COUNT(CASE WHEN customer_id IS NULL THEN 1 END)::bigint as guest_checkouts,
          COUNT(DISTINCT customer_id)::bigint as purchasing_customers
        FROM sales
        WHERE tenant_id = ${tenantId}::uuid
          AND status = 'COMPLETED'
          ${storeFilterSalesSql}
          ${cashierFilterSalesSql}
          ${dateFilterSalesSql}
      `,

      // 8. Top Customer
      this.prisma.$queryRaw<any[]>`
        SELECT 
          c.first_name || ' ' || COALESCE(c.last_name, '') as name,
          c.code,
          SUM(s.total)::numeric as total_spend
        FROM sales s
        JOIN customers c ON s.customer_id = c.id
        WHERE s.tenant_id = ${tenantId}::uuid
          AND s.status = 'COMPLETED'
          ${storeFilterSql}
          ${dateFilterSql}
        GROUP BY c.id, c.first_name, c.last_name, c.code
        ORDER BY total_spend DESC
        LIMIT 1
      `,

      // 9. VAT Collected & Breakdown
      this.prisma.$queryRaw<any[]>`
        SELECT 
          COALESCE(si.vat_rate_name, vr.name, 'Standard VAT') as name,
          COALESCE(si.vat_percentage, vr.percentage, 0)::numeric as rate,
          COALESCE(SUM(si.subtotal), 0)::numeric as net_sales,
          COALESCE(SUM(si.tax_amount), 0)::numeric as vat_collected,
          COALESCE(SUM(si.total), 0)::numeric as gross_sales,
          COUNT(DISTINCT s.id)::bigint as transactions
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        LEFT JOIN vat_rates vr ON si.vat_rate_id = vr.id
        WHERE s.tenant_id = ${tenantId}::uuid
          AND s.status = 'COMPLETED'
          ${storeFilterSql}
          ${cashierFilterSql}
          ${dateFilterSql}
        GROUP BY COALESCE(si.vat_rate_name, vr.name, 'Standard VAT'), COALESCE(si.vat_percentage, vr.percentage, 0)
        ORDER BY rate DESC
      `,

      // 10. 30-Day Daily Revenue Trend
      this.prisma.$queryRaw<any[]>`
        WITH dates AS (
          SELECT generate_series(
            CURRENT_DATE - INTERVAL '29 days',
            CURRENT_DATE,
            '1 day'::interval
          )::date AS date
        )
        SELECT 
          d.date::text as date,
          COALESCE(SUM(s.total), 0)::numeric as revenue,
          COUNT(s.id)::bigint as transactions
        FROM dates d
        LEFT JOIN sales s ON DATE_TRUNC('day', s.created_at)::date = d.date
          AND s.tenant_id = ${tenantId}::uuid
          AND s.status = 'COMPLETED'
          ${storeFilterSql}
          ${cashierFilterSql}
        GROUP BY d.date
        ORDER BY d.date ASC
      `,

      // 11. Hourly Sales (24h)
      this.prisma.$queryRaw<any[]>`
        SELECT 
          EXTRACT(HOUR FROM created_at)::int as hour,
          COALESCE(SUM(total), 0)::numeric as revenue,
          COUNT(id)::bigint as transactions
        FROM sales
        WHERE tenant_id = ${tenantId}::uuid
          AND status = 'COMPLETED'
          ${storeFilterSalesSql}
          ${cashierFilterSalesSql}
          ${dateFilterSalesSql}
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour ASC
      `,

      // 12. Top 10 Selling Products
      this.prisma.$queryRaw<any[]>`
        SELECT 
          si.product_name as product,
          si.sku as sku,
          SUM(si.quantity)::numeric as quantity_sold,
          SUM(si.total)::numeric as revenue,
          SUM(si.subtotal - (p.cost_price * si.quantity))::numeric as gross_profit
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE s.tenant_id = ${tenantId}::uuid
          AND s.status = 'COMPLETED'
          ${storeFilterSql}
          ${cashierFilterSql}
          ${dateFilterSql}
        GROUP BY si.product_id, si.product_name, si.sku
        ORDER BY quantity_sold DESC
        LIMIT 10
      `,

      // 13. Category Performance
      this.prisma.$queryRaw<any[]>`
        SELECT 
          COALESCE(c.name, 'Uncategorized') as category,
          SUM(si.total)::numeric as revenue,
          SUM(si.quantity)::numeric as items_sold
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE s.tenant_id = ${tenantId}::uuid
          AND s.status = 'COMPLETED'
          ${storeFilterSql}
          ${cashierFilterSql}
          ${dateFilterSql}
        GROUP BY c.id, c.name
        ORDER BY revenue DESC
      `,

      // 14. Payment Method Distribution
      this.prisma.$queryRaw<any[]>`
        SELECT 
          p.method::text as method,
          SUM(p.amount)::numeric as revenue,
          COUNT(p.id)::bigint as count
        FROM payments p
        JOIN sales s ON p.sale_id = s.id
        WHERE p.tenant_id = ${tenantId}::uuid
          AND p.status = 'COMPLETED'
          AND s.status = 'COMPLETED'
          ${query.storeId ? Prisma.sql`AND s.store_id = ${query.storeId}::uuid` : Prisma.empty}
          ${query.cashierId ? Prisma.sql`AND s.cashier_id = ${query.cashierId}::uuid` : Prisma.empty}
          ${dateFilterSql}
        GROUP BY p.method
        ORDER BY revenue DESC
      `,

      // 15. Revenue & Gross Profit 30-Day Trend (Zero-Filled Timeline)
      this.prisma.$queryRaw<any[]>`
        WITH dates AS (
          SELECT generate_series(
            CURRENT_DATE - INTERVAL '29 days',
            CURRENT_DATE,
            '1 day'::interval
          )::date AS date
        )
        SELECT 
          d.date::text as period,
          COALESCE(SUM(s.total), 0)::numeric as revenue,
          COALESCE(SUM(si.subtotal - (p.cost_price * si.quantity)), 0)::numeric as gross_profit
        FROM dates d
        LEFT JOIN sales s ON DATE_TRUNC('day', s.created_at)::date = d.date
          AND s.tenant_id = ${tenantId}::uuid
          AND s.status = 'COMPLETED'
          ${storeFilterSql}
          ${cashierFilterSql}
        LEFT JOIN sale_items si ON si.sale_id = s.id
        LEFT JOIN products p ON si.product_id = p.id
        GROUP BY d.date
        ORDER BY d.date ASC
      `,

      // 16. Refunded Sales Amount
      this.prisma.$queryRaw<any[]>`
        SELECT COALESCE(SUM(total), 0)::numeric as refund_amount
        FROM sales
        WHERE tenant_id = ${tenantId}::uuid
          AND status = 'REFUNDED'
          ${storeFilterSalesSql}
          ${cashierFilterSalesSql}
          ${dateFilterSalesSql}
      `,

      // 17. Voided Sales Count
      this.prisma.$queryRaw<any[]>`
        SELECT COUNT(id)::bigint as voided_count
        FROM sales
        WHERE tenant_id = ${tenantId}::uuid
          AND status = 'VOIDED'
          ${storeFilterSalesSql}
          ${cashierFilterSalesSql}
          ${dateFilterSalesSql}
      `,

      // 18. Item Sales Metrics (Products Sold)
      this.prisma.$queryRaw<any[]>`
        SELECT COALESCE(SUM(si.quantity), 0)::numeric as products_sold
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE s.tenant_id = ${tenantId}::uuid
          AND s.status = 'COMPLETED'
          ${storeFilterSql}
          ${cashierFilterSql}
          ${dateFilterSql}
      `,

      // 19. Catalog Health Alerts (Missing VAT or Inactive)
      this.prisma.$queryRaw<any[]>`
        SELECT 
          COUNT(CASE WHEN vat_rate_id IS NULL THEN 1 END)::bigint as missing_vat,
          COUNT(CASE WHEN status = 'INACTIVE' THEN 1 END)::bigint as inactive_count
        FROM products
        WHERE tenant_id = ${tenantId}::uuid
          AND deleted_at IS NULL
      `,

      // 20. Live Executive Activity Feed (Recent Sales & Operations)
      this.prisma.$queryRaw<any[]>`
        SELECT 
          s.id::text as id,
          'SALE_COMPLETED' as type,
          'Completed Sale ' || s.invoice_number || ' for £' || TRIM(TO_CHAR(s.total, '9999990.00')) as message,
          u.first_name || ' ' || COALESCE(u.last_name, '') as user,
          st.name as store,
          s.created_at as created_at
        FROM sales s
        LEFT JOIN users u ON s.cashier_id = u.id
        LEFT JOIN stores st ON s.store_id = st.id
        WHERE s.tenant_id = ${tenantId}::uuid
        ORDER BY s.created_at DESC
        LIMIT 10
      `,
    ]);

    // Parse Overall Metrics
    const o = overallSales[0] || {};
    const revenue = Number(o.revenue || 0);
    const transactions = Number(o.transactions || 0);
    const vatCollected = Number(o.vat_collected || 0);
    const totalDiscount = Number(o.total_discount || 0);
    const averageBasket = transactions > 0 ? revenue / transactions : 0;
    const avgDiscount = transactions > 0 ? totalDiscount / transactions : 0;

    const grossProfit = Number(grossProfitResult[0]?.gross_profit || 0);
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    const todayRev = Number(todaySales[0]?.today_revenue || 0);

    const m = monthRevenueResult[0] || {};
    const currentMonthRevenue = Number(m.current_month || 0);
    const previousMonthRevenue = Number(m.previous_month || 0);
    const growthPercentage = previousMonthRevenue > 0
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
      : 0;

    const productsSold = Number(itemMetricsRaw[0]?.products_sold || 0);
    const avgItemsPerBasket = transactions > 0 ? productsSold / transactions : 0;
    const refundAmount = Number(refundedSalesRaw[0]?.refund_amount || 0);
    const voidedCount = Number(voidedSalesRaw[0]?.voided_count || 0);

    // Total Customers Count
    const totalCustomersCount = await this.prisma.customer.count({
      where: { tenantId, deletedAt: null },
    });

    // Parse Inventory Metrics
    const inv = inventoryValuationResult[0] || {};
    const stockCounts = stockCountsResult[0] || {};

    // Parse Customer Metrics
    const cust = customerMetricsResult[0] || {};
    const purchasingCustCount = Number(cust.purchasing_customers || 0);
    const averageSpend = purchasingCustCount > 0 ? revenue / purchasingCustCount : 0;

    // Count returning customers (> 1 completed sale)
    const returningCustRaw = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(customer_id)::bigint as count
      FROM (
        SELECT customer_id FROM sales
        WHERE tenant_id = ${tenantId}::uuid AND status = 'COMPLETED' AND customer_id IS NOT NULL
        GROUP BY customer_id HAVING COUNT(id) > 1
      ) multi_buyers
    `;
    const returningCustomers = Number(returningCustRaw[0]?.count || 0);

    const topCust = topCustomerResult[0] ? {
      name: topCustomerResult[0].name,
      code: topCustomerResult[0].code,
      totalSpend: Number(topCustomerResult[0].total_spend),
    } : null;

    // Format Payment Method Distribution with percentage & top payment method
    const paymentMethods = ['CASH', 'CARD', 'UPI', 'GIFT_CARD', 'STORE_CREDIT', 'BANK_TRANSFER', 'CUSTOM'];
    const totalPaymentAmount = paymentDistRaw.reduce((sum, item) => sum + Number(item.revenue), 0);
    const paymentDistribution = paymentMethods.map((m) => {
      const match = paymentDistRaw.find((row) => row.method === m);
      const rev = match ? Number(match.revenue) : 0;
      const cnt = match ? Number(match.count) : 0;
      return {
        method: m,
        revenue: rev,
        count: cnt,
        percentage: totalPaymentAmount > 0 ? (rev / totalPaymentAmount) * 100 : 0,
      };
    });

    const topPaymentObj = [...paymentDistribution].sort((a, b) => b.revenue - a.revenue)[0];
    const topPaymentMethod = topPaymentObj && topPaymentObj.revenue > 0 ? topPaymentObj.method : 'CASH';

    const vatBreakdownRaw = vatMetricsResult || [];
    const catalogHealth = catalogHealthRaw[0] || {};

    // Build Executive Alerts List
    const alerts: Array<{ id: string; severity: 'high' | 'medium' | 'info'; title: string; message: string; actionUrl: string }> = [];
    if (Number(stockCounts.out_of_stock || 0) > 0) {
      alerts.push({
        id: 'out-of-stock-alert',
        severity: 'high',
        title: 'Out of Stock Items',
        message: `${stockCounts.out_of_stock} items are strictly at zero inventory.`,
        actionUrl: '/products?filter=out_of_stock',
      });
    }
    if (Number(stockCounts.low_stock || 0) > 0) {
      alerts.push({
        id: 'low-stock-alert',
        severity: 'medium',
        title: 'Low Stock Reorder Alert',
        message: `${stockCounts.low_stock} products are below reorder thresholds.`,
        actionUrl: '/products?filter=low_stock',
      });
    }
    if (Number(catalogHealth.missing_vat || 0) > 0) {
      alerts.push({
        id: 'missing-vat-alert',
        severity: 'high',
        title: 'Products Missing VAT',
        message: `${catalogHealth.missing_vat} products do not have a VAT rate assigned.`,
        actionUrl: '/products?filter=missing_vat',
      });
    }

    const responsePayload = {
      summary: {
        revenue,
        grossProfit,
        grossMargin,
        transactions,
        averageBasket,
        todayRevenue: todayRev,
        currentMonthRevenue,
        previousMonthRevenue,
        growthPercentage,
        productsSold,
        avgItemsPerBasket,
        avgDiscount,
        refundAmount,
        voidedCount,
        topPaymentMethod,
      },
      inventory: {
        inventoryCostValue: Number(inv.cost_value || 0),
        inventoryRetailValue: Number(inv.retail_value || 0),
        lowStock: Number(stockCounts.low_stock || 0),
        outOfStock: Number(stockCounts.out_of_stock || 0),
        inactiveProducts: Number(catalogHealth.inactive_count || 0),
        productsMissingVat: Number(catalogHealth.missing_vat || 0),
      },
      customers: {
        totalCustomers: totalCustomersCount,
        newCustomers: Number(cust.new_today || 0),
        returningCustomers,
        guestCheckouts: Number(cust.guest_checkouts || 0),
        averageSpend,
        topCustomer: topCust,
      },
      vat: {
        vatCollected,
        breakdown: vatBreakdownRaw.map((v) => ({
          vatRateName: v.name,
          vatPercentage: Number(v.rate),
          taxableSales: Number(v.net_sales),
          vatCollected: Number(v.vat_collected),
          grossSales: Number(v.gross_sales),
          transactions: Number(v.transactions),
        })),
      },
      alerts,
      activityFeed: activityFeedRaw.map((act) => ({
        id: act.id,
        type: act.type,
        message: act.message,
        user: act.user || 'System',
        store: act.store || 'Main Store',
        createdAt: act.created_at ? new Date(act.created_at).toISOString() : new Date().toISOString(),
      })),
      charts: {
        revenueProfitTrend: revenueProfitTrendRaw.map((row) => {
          const rev = Number(row.revenue || 0);
          const gp = Number(row.gross_profit || 0);
          return {
            period: row.period,
            revenue: rev,
            grossProfit: gp,
            grossMargin: rev > 0 ? (gp / rev) * 100 : 0,
          };
        }),
        dailyRevenue: dailyTrendRaw.map((d) => ({
          date: d.date,
          revenue: Number(d.revenue),
          transactions: Number(d.transactions),
        })),
        hourlySales: Array.from({ length: 24 }, (_, hour) => {
          const match = hourlySalesRaw.find((h) => Number(h.hour) === hour);
          return {
            hour,
            revenue: match ? Number(match.revenue) : 0,
            transactions: match ? Number(match.transactions) : 0,
          };
        }),
        topProducts: topProductsRaw.map((p) => ({
          product: p.product,
          sku: p.sku,
          quantitySold: Number(p.quantity_sold),
          revenue: Number(p.revenue),
          grossProfit: Number(p.gross_profit),
        })),
        categoryPerformance: categoryPerfRaw.map((c) => ({
          category: c.category,
          revenue: Number(c.revenue),
          itemsSold: Number(c.items_sold),
        })),
        paymentDistribution,
        vatBreakdown: vatBreakdownRaw.map((v) => ({
          vatRateName: v.name,
          vatPercentage: Number(v.rate),
          taxableSales: Number(v.net_sales),
          vatCollected: Number(v.vat_collected),
          grossSales: Number(v.gross_sales),
        })),
        inventoryStatus: [
          { status: 'In Stock', count: Number(stockCounts.in_stock || 0) },
          { status: 'Low Stock', count: Number(stockCounts.low_stock || 0) },
          { status: 'Out of Stock', count: Number(stockCounts.out_of_stock || 0) },
        ],
        customerActivity: [
          { type: 'Guest Sales', count: Number(cust.guest_checkouts || 0) },
          { type: 'Returning Customers', count: returningCustomers },
          { type: 'New Customers', count: Number(cust.new_today || 0) },
        ],
      },
    };

    // Store in 30s cache
    this.dashboardCache.set(cacheKey, {
      data: responsePayload,
      expiresAt: Date.now() + 30000,
    });

    return responsePayload;
  }

  // 2. GET /reports/sales/summary
  async getSalesSummary(tenantId: string, query: QueryReportDto) {
    const storeFilterSql = query.storeId ? Prisma.sql`AND store_id = ${query.storeId}::uuid` : Prisma.empty;
    const cashierFilterSql = query.cashierId ? Prisma.sql`AND cashier_id = ${query.cashierId}::uuid` : Prisma.empty;

    // Fetch summaries via direct aggregate SQL mappings
    const rawResult = await this.prisma.$queryRaw<any[]>`
      SELECT 
        COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN total END), 0)::numeric as today_revenue,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN id END)::bigint as today_count,
        COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '2 days' AND created_at < NOW() - INTERVAL '1 day' THEN total END), 0)::numeric as yesterday_revenue,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '2 days' AND created_at < NOW() - INTERVAL '1 day' THEN id END)::bigint as yesterday_count,
        COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN total END), 0)::numeric as week_revenue,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN id END)::bigint as week_count,
        COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN total END), 0)::numeric as month_revenue,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN id END)::bigint as month_count,
        COALESCE(SUM(total), 0)::numeric as year_revenue,
        COUNT(id)::bigint as year_count
      FROM sales
      WHERE tenant_id = ${tenantId}::uuid
        AND status = 'COMPLETED'
        ${storeFilterSql}
        ${cashierFilterSql}
    `;

    const r = rawResult[0] || {};

    const formatData = (revenue: any, count: any) => {
      const rev = Number(revenue || 0);
      const cnt = Number(count || 0);
      return {
        revenue: rev,
        salesCount: cnt,
        averageSale: cnt > 0 ? rev / cnt : 0,
      };
    };

    return {
      today: formatData(r.today_revenue, r.today_count),
      yesterday: formatData(r.yesterday_revenue, r.yesterday_count),
      thisWeek: formatData(r.week_revenue, r.week_count),
      thisMonth: formatData(r.month_revenue, r.month_count),
      thisYear: formatData(r.year_revenue, r.year_count),
    };
  }

  // 3. GET /reports/sales/hourly
  async getSalesHourly(tenantId: string, query: QueryReportDto) {
    const storeFilterSql = query.storeId ? Prisma.sql`AND store_id = ${query.storeId}::uuid` : Prisma.empty;
    const cashierFilterSql = query.cashierId ? Prisma.sql`AND cashier_id = ${query.cashierId}::uuid` : Prisma.empty;
    const dateFromSql = query.dateFrom ? Prisma.sql`AND created_at >= ${new Date(query.dateFrom)}` : Prisma.empty;
    const dateToSql = query.dateTo ? Prisma.sql`AND created_at <= ${new Date(query.dateTo)}` : Prisma.empty;

    const rawHourly = await this.prisma.$queryRaw<any[]>`
      SELECT 
        EXTRACT(HOUR FROM created_at)::int as hour,
        COALESCE(SUM(total), 0)::numeric as revenue,
        COUNT(id)::bigint as transactions
      FROM sales
      WHERE tenant_id = ${tenantId}::uuid
        AND status = 'COMPLETED'
        ${storeFilterSql}
        ${cashierFilterSql}
        ${dateFromSql}
        ${dateToSql}
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour ASC
    `;

    return rawHourly.map((h) => ({
      hour: h.hour,
      revenue: Number(h.revenue),
      transactions: Number(h.transactions),
    }));
  }

  // 4. GET /reports/sales/daily
  async getSalesDaily(tenantId: string, query: QueryReportDto) {
    const storeFilterSql = query.storeId ? Prisma.sql`AND store_id = ${query.storeId}::uuid` : Prisma.empty;
    const cashierFilterSql = query.cashierId ? Prisma.sql`AND cashier_id = ${query.cashierId}::uuid` : Prisma.empty;
    const dateFromSql = query.dateFrom ? Prisma.sql`AND created_at >= ${new Date(query.dateFrom)}` : Prisma.empty;
    const dateToSql = query.dateTo ? Prisma.sql`AND created_at <= ${new Date(query.dateTo)}` : Prisma.empty;

    const rawDaily = await this.prisma.$queryRaw<any[]>`
      SELECT 
        DATE_TRUNC('day', created_at)::date as date,
        COALESCE(SUM(total), 0)::numeric as revenue,
        COUNT(id)::bigint as sales_count
      FROM sales
      WHERE tenant_id = ${tenantId}::uuid
        AND status = 'COMPLETED'
        ${storeFilterSql}
        ${cashierFilterSql}
        ${dateFromSql}
        ${dateToSql}
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date ASC
    `;

    return rawDaily.map((d) => ({
      date: d.date,
      revenue: Number(d.revenue),
      salesCount: Number(d.sales_count),
    }));
  }

  // 5. GET /reports/products/top-selling
  async getTopSellingProducts(tenantId: string, query: QueryReportDto) {
    const storeFilterSql = query.storeId ? Prisma.sql`AND s.store_id = ${query.storeId}::uuid` : Prisma.empty;
    const cashierFilterSql = query.cashierId ? Prisma.sql`AND s.cashier_id = ${query.cashierId}::uuid` : Prisma.empty;
    const dateFromSql = query.dateFrom ? Prisma.sql`AND s.created_at >= ${new Date(query.dateFrom)}` : Prisma.empty;
    const dateToSql = query.dateTo ? Prisma.sql`AND s.created_at <= ${new Date(query.dateTo)}` : Prisma.empty;

    const topProducts = await this.prisma.$queryRaw<any[]>`
      SELECT 
        si.product_name as product,
        si.sku as sku,
        SUM(si.quantity)::numeric as quantity_sold,
        SUM(si.total)::numeric as revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.tenant_id = ${tenantId}::uuid
        AND s.status = 'COMPLETED'
        ${storeFilterSql}
        ${cashierFilterSql}
        ${dateFromSql}
        ${dateToSql}
      GROUP BY si.product_id, si.product_name, si.sku
      ORDER BY quantity_sold DESC
      LIMIT 10
    `;

    return topProducts.map((p) => ({
      product: p.product,
      sku: p.sku,
      quantitySold: Number(p.quantity_sold),
      revenue: Number(p.revenue),
    }));
  }

  // 6. GET /reports/categories
  async getCategoryReports(tenantId: string, query: QueryReportDto) {
    const storeFilterSql = query.storeId ? Prisma.sql`AND s.store_id = ${query.storeId}::uuid` : Prisma.empty;
    const cashierFilterSql = query.cashierId ? Prisma.sql`AND s.cashier_id = ${query.cashierId}::uuid` : Prisma.empty;
    const dateFromSql = query.dateFrom ? Prisma.sql`AND s.created_at >= ${new Date(query.dateFrom)}` : Prisma.empty;
    const dateToSql = query.dateTo ? Prisma.sql`AND s.created_at <= ${new Date(query.dateTo)}` : Prisma.empty;

    const catData = await this.prisma.$queryRaw<any[]>`
      SELECT 
        COALESCE(c.name, 'Uncategorized') as category,
        SUM(si.total)::numeric as revenue,
        SUM(si.quantity)::numeric as items_sold
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE s.tenant_id = ${tenantId}::uuid
        AND s.status = 'COMPLETED'
        ${storeFilterSql}
        ${cashierFilterSql}
        ${dateFromSql}
        ${dateToSql}
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `;

    return catData.map((cd) => ({
      category: cd.category,
      revenue: Number(cd.revenue),
      itemsSold: Number(cd.items_sold),
    }));
  }

  // 7. GET /reports/payments
  async getPaymentsBreakdown(tenantId: string, query: QueryReportDto) {
    const storeFilterSql = query.storeId ? Prisma.sql`AND s.store_id = ${query.storeId}::uuid` : Prisma.empty;
    const cashierFilterSql = query.cashierId ? Prisma.sql`AND s.cashier_id = ${query.cashierId}::uuid` : Prisma.empty;
    const dateFromSql = query.dateFrom ? Prisma.sql`AND p.created_at >= ${new Date(query.dateFrom)}` : Prisma.empty;
    const dateToSql = query.dateTo ? Prisma.sql`AND p.created_at <= ${new Date(query.dateTo)}` : Prisma.empty;

    const pmResult = await this.prisma.$queryRaw<any[]>`
      SELECT 
        p.method::text as method,
        SUM(p.amount)::numeric as amount,
        COUNT(p.id)::bigint as count
      FROM payments p
      JOIN sales s ON p.sale_id = s.id
      WHERE p.tenant_id = ${tenantId}::uuid
        AND p.status = 'COMPLETED'
        AND s.status = 'COMPLETED'
        ${storeFilterSql}
        ${cashierFilterSql}
        ${dateFromSql}
        ${dateToSql}
      GROUP BY p.method
    `;

    const totalAmount = pmResult.reduce((sum, item) => sum + Number(item.amount), 0);

    const methods = ['CASH', 'CARD', 'UPI', 'GIFT_CARD', 'STORE_CREDIT', 'BANK_TRANSFER', 'CUSTOM'];
    const out: Record<string, any> = {};

    methods.forEach((m) => {
      const match = pmResult.find((row) => row.method === m);
      const amt = match ? Number(match.amount) : 0;
      const cnt = match ? Number(match.count) : 0;
      out[m] = {
        amount: amt,
        count: cnt,
        percentage: totalAmount > 0 ? (amt / totalAmount) * 100 : 0,
      };
    });

    return out;
  }

  // 8. GET /reports/vat
  async getVatReports(tenantId: string, query: QueryReportDto) {
    const storeFilterSql = query.storeId ? Prisma.sql`AND s.store_id = ${query.storeId}::uuid` : Prisma.empty;
    const cashierFilterSql = query.cashierId ? Prisma.sql`AND s.cashier_id = ${query.cashierId}::uuid` : Prisma.empty;
    const dateFromSql = query.dateFrom ? Prisma.sql`AND s.created_at >= ${new Date(query.dateFrom)}` : Prisma.empty;
    const dateToSql = query.dateTo ? Prisma.sql`AND s.created_at <= ${new Date(query.dateTo)}` : Prisma.empty;

    const vatData = await this.prisma.$queryRaw<any[]>`
      SELECT 
        COALESCE(si.vat_rate_name, vr.name, 'Standard VAT') as vat_rate_name,
        COALESCE(si.vat_percentage, vr.percentage, 0)::numeric as vat_percentage,
        SUM(si.subtotal)::numeric as net_sales,
        SUM(si.tax_amount)::numeric as vat_collected,
        SUM(si.total)::numeric as gross_sales,
        COUNT(DISTINCT s.id)::bigint as transaction_count,
        SUM(si.quantity)::numeric as item_count
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      LEFT JOIN vat_rates vr ON si.vat_rate_id = vr.id
      WHERE s.tenant_id = ${tenantId}::uuid
        AND s.status = 'COMPLETED'
        ${storeFilterSql}
        ${cashierFilterSql}
        ${dateFromSql}
        ${dateToSql}
      GROUP BY COALESCE(si.vat_rate_name, vr.name, 'Standard VAT'), COALESCE(si.vat_percentage, vr.percentage, 0)
      ORDER BY vat_percentage DESC
    `;

    return vatData.map((v) => ({
      vatRateName: v.vat_rate_name,
      vatPercentage: Number(v.vat_percentage),
      vatRate: `${v.vat_rate_name} (${v.vat_percentage}%)`, // backward compatibility field
      netSales: Number(v.net_sales),
      taxableSales: Number(v.net_sales),                  // backward compatibility field
      vatCollected: Number(v.vat_collected),
      taxCollected: Number(v.vat_collected),              // backward compatibility field
      grossSales: Number(v.gross_sales),
      transactionCount: Number(v.transaction_count),
      itemCount: Number(v.item_count),
    }));
  }

  // 9. GET /reports/inventory
  async getInventoryAnalytics(tenantId: string, query: QueryReportDto) {
    const storeFilter = query.storeId ? { storeId: query.storeId } : {};

    const [totalProducts, outOfStock, lowStockResult, inventoryValAgg] = await Promise.all([
      // Total product catalog items count
      this.prisma.product.count({
        where: { tenantId, deletedAt: null },
      }),
      // Out of stock counts
      this.prisma.inventory.count({
        where: { tenantId, deletedAt: null, currentStock: 0, ...storeFilter },
      }),
      // Low stock count via parameterized query
      this.prisma.$queryRaw<Array<{ count: string | number | bigint }>>`
        SELECT COUNT(*)::bigint as count
        FROM inventories i
        JOIN products p ON i.product_id = p.id
        WHERE i.tenant_id = ${tenantId}::uuid
          AND i.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND i.current_stock <= p.reorder_level
          AND p.reorder_level > 0
          ${query.storeId ? Prisma.sql`AND i.store_id = ${query.storeId}::uuid` : Prisma.empty}
      `,
      // Total assets value calculation
      this.prisma.$queryRaw<Array<{ total_val: string | number | bigint }>>`
        SELECT COALESCE(SUM(i.current_stock * p.cost_price), 0)::numeric as total_val
        FROM inventories i
        JOIN products p ON i.product_id = p.id
        WHERE i.tenant_id = ${tenantId}::uuid
          AND i.deleted_at IS NULL
          AND p.deleted_at IS NULL
          ${query.storeId ? Prisma.sql`AND i.store_id = ${query.storeId}::uuid` : Prisma.empty}
      `,
    ]);

    return {
      totalProducts,
      outOfStock,
      lowStock: Number(lowStockResult[0]?.count ?? 0),
      inventoryValue: Number(inventoryValAgg[0]?.total_val ?? 0),
    };
  }

  // 10. GET /reports/customers
  async getCustomersAnalytics(tenantId: string, query: QueryReportDto) {
    const dateFromSql = query.dateFrom ? Prisma.sql`AND created_at >= ${new Date(query.dateFrom)}` : Prisma.empty;
    const dateToSql = query.dateTo ? Prisma.sql`AND created_at <= ${new Date(query.dateTo)}` : Prisma.empty;

    const [totalSalesCount, guestCount, newCustomers, returningCustomers, topCust] = await Promise.all([
      // Total transactions
      this.prisma.sale.count({
        where: { tenantId, status: 'COMPLETED' },
      }),
      // Guest sales
      this.prisma.sale.count({
        where: { tenantId, status: 'COMPLETED', customerId: null },
      }),
      // New profile additions inside query window
      this.prisma.customer.count({
        where: {
          tenantId,
          deletedAt: null,
          createdAt: {
            gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
            lte: query.dateTo ? new Date(query.dateTo) : undefined,
          },
        },
      }),
      // Customers with > 1 completed sale
      this.prisma.$queryRaw<Array<{ count: string | number | bigint }>>`
        SELECT COUNT(customer_id)::bigint as count
        FROM (
          SELECT customer_id FROM sales 
          WHERE tenant_id = ${tenantId}::uuid AND status = 'COMPLETED' AND customer_id IS NOT NULL
          GROUP BY customer_id HAVING COUNT(id) > 1
        ) as multi_buyers
      `,
      // Highest spending customer profiles
      this.prisma.$queryRaw<any[]>`
        SELECT 
          c.first_name || ' ' || COALESCE(c.last_name, '') as name,
          c.code as code,
          SUM(s.total)::numeric as spend
        FROM sales s
        JOIN customers c ON s.customer_id = c.id
        WHERE s.tenant_id = ${tenantId}::uuid
          AND s.status = 'COMPLETED'
          ${dateFromSql}
          ${dateToSql}
        GROUP BY c.id, c.first_name, c.last_name, c.code
        ORDER BY spend DESC
        LIMIT 5
      `,
    ]);

    const guestPercent = totalSalesCount > 0 ? (guestCount / totalSalesCount) * 100 : 0;

    return {
      newCustomers,
      returningCustomers: Number(returningCustomers[0]?.count ?? 0),
      guestSales: {
        count: guestCount,
        percentage: guestPercent,
      },
      averageSpend: totalSalesCount > 0 ? (guestPercent / totalSalesCount) : 0,
      topCustomers: topCust.map((tc) => ({
        name: tc.name,
        code: tc.code,
        totalSpend: Number(tc.spend),
      })),
    };
  }

  // 11. GET /reports/category-summary
  async getCategorySummary(tenantId: string) {
    const catData = await this.prisma.$queryRaw<any[]>`
      SELECT 
        COALESCE(c.name, 'Uncategorized') as category,
        COUNT(p.id)::int as count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.tenant_id = ${tenantId}::uuid
        AND p.deleted_at IS NULL
      GROUP BY c.id, c.name
      ORDER BY count DESC
    `;
    return catData.map((cd) => ({
      category: cd.category,
      count: Number(cd.count),
    }));
  }

  // 12. GET /reports/inventory-summary
  async getInventorySummary(tenantId: string) {
    const [totalInventory, inStock, lowStock, outOfStock] = await Promise.all([
      this.prisma.product.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.$queryRaw<Array<{ count: string | number | bigint }>>`
        SELECT COUNT(DISTINCT p.id)::bigint as count
        FROM products p
        JOIN inventories i ON i.product_id = p.id
        WHERE p.tenant_id = ${tenantId}::uuid
          AND p.deleted_at IS NULL
          AND i.deleted_at IS NULL
          AND i.current_stock > p.reorder_level
      `,
      this.prisma.$queryRaw<Array<{ count: string | number | bigint }>>`
        SELECT COUNT(DISTINCT p.id)::bigint as count
        FROM products p
        JOIN inventories i ON i.product_id = p.id
        WHERE p.tenant_id = ${tenantId}::uuid
          AND p.deleted_at IS NULL
          AND i.deleted_at IS NULL
          AND i.current_stock <= p.reorder_level
          AND i.current_stock > 0
      `,
      this.prisma.$queryRaw<Array<{ count: string | number | bigint }>>`
        SELECT COUNT(DISTINCT p.id)::bigint as count
        FROM products p
        JOIN inventories i ON i.product_id = p.id
        WHERE p.tenant_id = ${tenantId}::uuid
          AND p.deleted_at IS NULL
          AND i.deleted_at IS NULL
          AND i.current_stock <= 0
      `,
    ]);

    return {
      totalInventory,
      inStock: Number(inStock[0]?.count ?? 0),
      lowStock: Number(lowStock[0]?.count ?? 0),
      outOfStock: Number(outOfStock[0]?.count ?? 0),
    };
  }

  // 13. GET /reports/store-summary
  async getStoreSummary(tenantId: string) {
    const stores = await this.prisma.$queryRaw<any[]>`
      SELECT 
        s.id as store_id,
        s.name as store_name,
        COUNT(DISTINCT i.product_id)::int as products_count,
        COALESCE(SUM(i.current_stock), 0)::numeric as total_stock
      FROM stores s
      LEFT JOIN inventories i ON i.store_id = s.id AND i.deleted_at IS NULL
      WHERE s.tenant_id = ${tenantId}::uuid
        AND s.deleted_at IS NULL
      GROUP BY s.id, s.name
      ORDER BY s.name ASC
    `;
    return stores.map((s) => ({
      storeId: s.store_id,
      storeName: s.store_name,
      productsCount: Number(s.products_count),
      totalStock: Number(s.total_stock),
    }));
  }

  // 14. GET /reports/activity
  async getActivity(tenantId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return logs.map((l) => ({
      id: l.id,
      type: l.action,
      message: `${l.action} on ${l.table} (Record: ${l.recordId})`,
      createdAt: l.createdAt.toISOString(),
    }));
  }
}
