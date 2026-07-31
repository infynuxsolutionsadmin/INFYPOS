import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SaleStatus, PaymentStatus, InventoryMovementType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySaleDto } from './dto/query-sale.dto';
import { VoidSaleDto } from './dto/void-sale.dto';

// ─── Receipt Content Interface ────────────────────────────────────────────────

interface ReceiptItemContent {
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  subtotal: number;
  total: number;
}

interface ReceiptContent {
  header: {
    storeName: string;
    storeCode: string;
    currency: string;
  };
  cashier: {
    id: string;
    name: string;
  };
  customer: { id: string; name: string; phone: string | null } | null;
  invoice: {
    number: string;
    receiptNumber: string;
    date: string;
  };
  items: ReceiptItemContent[];
  vatAnalysis?: Array<{
    name: string;
    rate: number;
    net: number;
    vat: number;
    gross: number;
  }>;
  totals: {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
  };
  payments: Array<{
    method: string;
    amount: number;
    transactionRef: string | null;
  }>;
  footer: {
    message: string;
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  // Private: Sequential Invoice Number Generator
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Generates a sequential, collision-safe document number using a counter table.
   *
   * Uses PostgreSQL UPSERT with RETURNING to atomically increment the per-tenant,
   * per-prefix, per-date counter — guaranteeing sequential numbering even under
   * high concurrency.
   *
   * Must be called inside an active Prisma transaction.
   *
   * @example "INV-20260730-000001", "RCP-20260730-000002"
   */
  private async generateSequentialNumber(
    tx: Prisma.TransactionClient,
    tenantId: string,
    prefix: 'INV' | 'RCP',
  ): Promise<string> {
    const dateStr = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, ''); // e.g. "20260730"

    const result = await tx.$queryRaw<[{ last_sequence: number }]>`
      INSERT INTO invoice_counters (id, tenant_id, prefix, counter_date, last_sequence, updated_at)
      VALUES (gen_random_uuid(), ${tenantId}::uuid, ${prefix}, ${dateStr}, 1, NOW())
      ON CONFLICT (tenant_id, prefix, counter_date)
      DO UPDATE SET
        last_sequence = invoice_counters.last_sequence + 1,
        updated_at    = NOW()
      RETURNING last_sequence
    `;

    const seq = Number(result[0].last_sequence);
    return `${prefix}-${dateStr}-${String(seq).padStart(6, '0')}`;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // createSale — 12-step atomic transaction
  // ──────────────────────────────────────────────────────────────────────────

  async createSale(
    tenantId: string,
    cashierId: string,
    dto: CreateSaleDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // ── Step 1: Validate Store ────────────────────────────────────────────
      const store = await tx.store.findFirst({
        where: { id: dto.storeId, tenantId, deletedAt: null },
      });
      if (!store) throw new NotFoundException('Store not found in this tenant.');
      if (store.status !== 'ACTIVE') {
        throw new BadRequestException(`Store "${store.name}" is not active.`);
      }

      // ── Step 2: Validate Customer (optional) ─────────────────────────────
      let customer: { id: string; firstName: string; lastName: string | null; phone: string | null } | null = null;
      if (dto.customerId) {
        const found = await tx.customer.findFirst({
          where: { id: dto.customerId, tenantId, deletedAt: null },
          select: { id: true, firstName: true, lastName: true, phone: true },
        });
        if (!found) throw new NotFoundException('Customer not found in this tenant.');
        customer = found;
      }

      // ── Step 3: Validate Discount (optional) ─────────────────────────────
      let saleLevelDiscount = new Prisma.Decimal(0);
      let discountRecord: { id: string; type: string; value: Prisma.Decimal } | null = null;
      if (dto.discountId) {
        const disc = await tx.discount.findFirst({
          where: { id: dto.discountId, tenantId, deletedAt: null, isActive: true },
          select: { id: true, type: true, value: true },
        });
        if (!disc) throw new NotFoundException('Discount not found or inactive.');
        discountRecord = disc;
      }

      // ── Step 4: Load Cashier for receipt/audit ────────────────────────────
      const cashier = await tx.user.findFirst({
        where: { id: cashierId, tenantId },
        select: { id: true, firstName: true, lastName: true },
      });
      if (!cashier) throw new NotFoundException('Cashier user not found.');

      // ── Step 5: Validate Items, Stock, and Calculate Totals ───────────────
      const resolvedItems: Array<{
        productId: string;
        productName: string;
        sku: string;
        quantity: Prisma.Decimal;
        unitPrice: Prisma.Decimal;
        discountAmount: Prisma.Decimal;
        vatRateId: string;
        vatRateName: string;
        vatPercentage: Prisma.Decimal;
        taxAmount: Prisma.Decimal;
        subtotal: Prisma.Decimal;
        total: Prisma.Decimal;
        inventoryId: string;
        currentStock: Prisma.Decimal;
        reservedStock: Prisma.Decimal;
      }> = [];

      for (const item of dto.items) {
        // Load product with authoritative vatRate from DB
        const product = await tx.product.findFirst({
          where: { id: item.productId, tenantId, deletedAt: null },
          include: { vatRate: true },
        });
        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found.`);
        }
        if (product.status !== 'ACTIVE') {
          throw new BadRequestException(`Product "${product.name}" is not active and cannot be sold.`);
        }

        // ENFORCE UK VAT RULE: Every product MUST have a valid VAT rate assigned in the database
        if (!product.vatRateId || !product.vatRate || product.vatRate.deletedAt !== null) {
          throw new BadRequestException(
            `Product "${product.name}" (SKU: ${product.sku}) has no valid VAT rate assigned. Every product must have a VAT category.`,
          );
        }

        // Load inventory
        const inventory = await tx.inventory.findUnique({
          where: { storeId_productId: { storeId: dto.storeId, productId: item.productId } },
        });
        if (!inventory) {
          throw new NotFoundException(
            `No inventory record found for product "${product.name}" in this store. Ensure product is assigned to this store.`,
          );
        }

        // Check available stock
        const availableStock = new Prisma.Decimal(inventory.currentStock).sub(inventory.reservedStock);
        const requestedQty = new Prisma.Decimal(item.quantity);
        if (availableStock.lt(requestedQty)) {
          throw new ConflictException({
            message: `Insufficient stock for product "${product.name}".`,
            productId: item.productId,
            productName: product.name,
            sku: product.sku,
            requested: Number(requestedQty),
            available: Number(availableStock),
          });
        }

        // Authoritative backend pricing & VAT snapshot
        const unitPrice = new Prisma.Decimal(product.sellingPrice).toDecimalPlaces(2);
        const qty = new Prisma.Decimal(item.quantity);
        const itemDiscount = new Prisma.Decimal(item.discountAmount ?? 0).toDecimalPlaces(2);
        
        const lineGross = qty.mul(unitPrice).toDecimalPlaces(2);
        const taxableAmount = Prisma.Decimal.max(new Prisma.Decimal(0), lineGross.sub(itemDiscount)).toDecimalPlaces(2);
        
        const vatRateName = product.vatRate.name;
        const vatPercentage = new Prisma.Decimal(product.vatRate.percentage).toDecimalPlaces(2);
        
        const taxAmount = vatPercentage.gt(0)
          ? taxableAmount.mul(vatPercentage).div(100).toDecimalPlaces(2)
          : new Prisma.Decimal(0);
          
        const total = taxableAmount.add(taxAmount).toDecimalPlaces(2);

        resolvedItems.push({
          productId: item.productId,
          productName: product.name,
          sku: product.sku,
          quantity: qty,
          unitPrice,
          discountAmount: itemDiscount,
          vatRateId: product.vatRate.id,
          vatRateName,
          vatPercentage,
          taxAmount,
          subtotal: taxableAmount,
          total,
          inventoryId: inventory.id,
          currentStock: new Prisma.Decimal(inventory.currentStock),
          reservedStock: new Prisma.Decimal(inventory.reservedStock),
        });
      }

      // ── Step 6: Calculate Sale Totals ─────────────────────────────────────
      const saleSubtotal = resolvedItems.reduce(
        (acc, i) => acc.add(i.subtotal),
        new Prisma.Decimal(0),
      ).toDecimalPlaces(2);

      const saleTaxAmount = resolvedItems.reduce(
        (acc, i) => acc.add(i.taxAmount),
        new Prisma.Decimal(0),
      ).toDecimalPlaces(2);

      // Apply sale-level discount
      if (discountRecord) {
        if (discountRecord.type === 'PERCENTAGE') {
          saleLevelDiscount = saleSubtotal.mul(discountRecord.value).div(100).toDecimalPlaces(2);
        } else {
          // FIXED_AMOUNT
          saleLevelDiscount = new Prisma.Decimal(discountRecord.value).toDecimalPlaces(2);
        }
      }

      const saleTotal = saleSubtotal.add(saleTaxAmount).sub(saleLevelDiscount).toDecimalPlaces(2);

      // ── Step 7: Validate Payment Total ────────────────────────────────────
      const paymentsTotal = dto.payments.reduce(
        (acc, p) => acc.add(new Prisma.Decimal(p.amount)),
        new Prisma.Decimal(0),
      ).toDecimalPlaces(2);
      const tolerance = new Prisma.Decimal('0.01');
      if (paymentsTotal.sub(saleTotal).abs().gt(tolerance)) {
        throw new BadRequestException(
          `Payment total (${paymentsTotal.toFixed(2)}) does not match sale total (${saleTotal.toFixed(2)}).`,
        );
      }

      // ── Step 8: Generate Invoice & Receipt Numbers ─────────────────────────
      const invoiceNumber = await this.generateSequentialNumber(tx, tenantId, 'INV');
      const receiptNumber = await this.generateSequentialNumber(tx, tenantId, 'RCP');

      // ── Step 9: Create Sale ───────────────────────────────────────────────
      const sale = await tx.sale.create({
        data: {
          tenantId,
          storeId: dto.storeId,
          cashierId,
          customerId: dto.customerId ?? null,
          discountId: dto.discountId ?? null,
          invoiceNumber,
          receiptNumber,
          status: SaleStatus.COMPLETED,
          paymentStatus: PaymentStatus.COMPLETED,
          subtotal: saleSubtotal,
          discountAmount: saleLevelDiscount,
          taxAmount: saleTaxAmount,
          total: saleTotal,
          notes: dto.notes ?? null,
        },
      });

      // ── Step 10: Create Sale Items (snapshot pattern) ─────────────────────
      await tx.saleItem.createMany({
        data: resolvedItems.map((item) => ({
          saleId: sale.id,
          productId: item.productId,
          vatRateId: item.vatRateId,
          productName: item.productName,   // snapshot
          sku: item.sku,                   // snapshot
          vatRateName: item.vatRateName,   // snapshot
          vatPercentage: item.vatPercentage, // snapshot
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
          taxAmount: item.taxAmount,
          subtotal: item.subtotal,
          total: item.total,
        })),
      });

      // ── Step 11: Create Payments ──────────────────────────────────────────
      await tx.payment.createMany({
        data: dto.payments.map((p) => ({
          tenantId,
          saleId: sale.id,
          method: p.method,
          amount: new Prisma.Decimal(p.amount),
          transactionRef: p.transactionRef ?? null,
          status: PaymentStatus.COMPLETED,
        })),
      });

      // ── Step 12: Decrease Inventory + Create Movements ────────────────────
      for (const item of resolvedItems) {
        const newStock = item.currentStock.sub(item.quantity);

        await tx.inventory.update({
          where: { id: item.inventoryId },
          data: { currentStock: newStock },
        });

        await tx.inventoryMovement.create({
          data: {
            tenantId,
            storeId: dto.storeId,
            productId: item.productId,
            userId: cashierId,
            type: InventoryMovementType.SALE,
            quantity: item.quantity.negated(), // negative = stock out
            previousStock: item.currentStock,
            newStock,
            reference: invoiceNumber,
            notes: `Sale ${invoiceNumber}`,
          },
        });
      }

      // ── Step 13: Create Receipt JSON ──────────────────────────────────────
      const receiptContent: ReceiptContent = {
        header: {
          storeName: store.name,
          storeCode: store.code,
          currency: 'GBP', // pulled from tenant in production via tenant.currency
        },
        cashier: {
          id: cashier.id,
          name: `${cashier.firstName} ${cashier.lastName}`,
        },
        customer: customer
          ? { id: customer.id, name: `${customer.firstName} ${customer.lastName}`, phone: customer.phone }
          : null,
        invoice: {
          number: invoiceNumber,
          receiptNumber,
          date: new Date().toISOString(),
        },
        items: resolvedItems.map((i) => ({
          name: i.productName,
          sku: i.sku,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          discountAmount: Number(i.discountAmount),
          vatRateName: i.vatRateName,
          vatRate: Number(i.vatPercentage),
          vatAmount: Number(i.taxAmount),
          subtotal: Number(i.subtotal),
          total: Number(i.total),
        })),
        vatAnalysis: (() => {
          const vatMap = new Map<string, { name: string; rate: number; net: number; vat: number; gross: number }>();
          for (const i of resolvedItems) {
            const key = `${i.vatRateName}_${i.vatPercentage}`;
            const cur = vatMap.get(key) || { name: i.vatRateName, rate: Number(i.vatPercentage), net: 0, vat: 0, gross: 0 };
            cur.net = Number((cur.net + Number(i.subtotal)).toFixed(2));
            cur.vat = Number((cur.vat + Number(i.taxAmount)).toFixed(2));
            cur.gross = Number((cur.gross + Number(i.total)).toFixed(2));
            vatMap.set(key, cur);
          }
          return Array.from(vatMap.values());
        })(),
        totals: {
          subtotal: Number(saleSubtotal),
          discountAmount: Number(saleLevelDiscount),
          taxAmount: Number(saleTaxAmount),
          total: Number(saleTotal),
        },
        payments: dto.payments.map((p) => ({
          method: p.method,
          amount: p.amount,
          transactionRef: p.transactionRef ?? null,
        })),
        footer: {
          message: 'Thank you for your purchase!',
        },
      };

      await tx.receipt.create({
        data: {
          tenantId,
          saleId: sale.id,
          receiptNumber,
          content: receiptContent as unknown as Prisma.InputJsonValue,
        },
      });

      // ── Step 14: Audit Log ────────────────────────────────────────────────
      await this.auditService.createLog({
        tenantId,
        userId: cashierId,
        action: 'CREATE',
        table: 'sales',
        recordId: sale.id,
        ipAddress,
        userAgent,
        newValue: {
          invoiceNumber,
          store: { id: store.id, name: store.name },
          cashier: { id: cashierId, name: `${cashier.firstName} ${cashier.lastName}` },
          customer: customer ? { id: customer.id, name: `${customer.firstName} ${customer.lastName}` } : null,
          total: Number(saleTotal),
          paymentMethods: dto.payments.map((p) => p.method),
          itemCount: dto.items.length,
        },
      });

      // ── Return ─────────────────────────────────────────────────────────────
      return {
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        receiptNumber: sale.receiptNumber,
        status: sale.status,
        subtotal: Number(sale.subtotal),
        discountAmount: Number(sale.discountAmount),
        taxAmount: Number(sale.taxAmount),
        total: Number(sale.total),
        itemCount: dto.items.length,
        store: { id: store.id, name: store.name },
        cashier: { id: cashier.id, name: `${cashier.firstName} ${cashier.lastName}` },
        createdAt: sale.createdAt,
      };
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // findAll — paginated, filtered sale list
  // ──────────────────────────────────────────────────────────────────────────

  async findAll(tenantId: string, query: QuerySaleDto) {
    const {
      page = 1,
      limit = 20,
      search,
      storeId,
      cashierId,
      customerId,
      status,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.SaleWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { receiptNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (storeId) where.storeId = storeId;
    if (cashierId) where.cashierId = cashierId;
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const orderBy: Prisma.SaleOrderByWithRelationInput =
      sortBy === 'total' ? { total: sortOrder } : { createdAt: sortOrder };

    const [items, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          store: { select: { id: true, name: true } },
          cashier: { select: { id: true, firstName: true, lastName: true } },
          customer: { select: { id: true, firstName: true, lastName: true } },
          payments: { select: { method: true, amount: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // findOne — full sale detail
  // ──────────────────────────────────────────────────────────────────────────

  async findOne(tenantId: string, id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        store: { select: { id: true, name: true, code: true } },
        cashier: { select: { id: true, firstName: true, lastName: true, email: true } },
        customer: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        items: {
          select: {
            id: true,
            productId: true,
            productName: true,
            sku: true,
            quantity: true,
            unitPrice: true,
            discountAmount: true,
            taxAmount: true,
            subtotal: true,
            total: true,
            vatRate: { select: { id: true, name: true, percentage: true } },
          },
        },
        payments: {
          select: {
            id: true,
            method: true,
            amount: true,
            status: true,
            transactionRef: true,
            createdAt: true,
          },
        },
        receipts: {
          select: { id: true, receiptNumber: true, content: true, printedAt: true },
        },
      },
    });

    if (!sale) throw new NotFoundException('Sale not found in this tenant.');
    return sale;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // getSummary — SQL-aggregated revenue report
  // ──────────────────────────────────────────────────────────────────────────

  async getSummary(tenantId: string, storeId?: string, dateFrom?: string, dateTo?: string) {
    const where: Prisma.SaleWhereInput = {
      tenantId,
      status: SaleStatus.COMPLETED,
      deletedAt: null,
    };

    if (storeId) where.storeId = storeId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalAgg, todayAgg, weekAgg, monthAgg, countAgg, paymentBreakdown] =
      await Promise.all([
        this.prisma.sale.aggregate({
          where,
          _sum: { total: true, taxAmount: true, discountAmount: true },
          _count: { id: true },
        }),
        this.prisma.sale.aggregate({
          where: { ...where, createdAt: { gte: todayStart } },
          _sum: { total: true },
          _count: { id: true },
        }),
        this.prisma.sale.aggregate({
          where: { ...where, createdAt: { gte: weekStart } },
          _sum: { total: true },
          _count: { id: true },
        }),
        this.prisma.sale.aggregate({
          where: { ...where, createdAt: { gte: monthStart } },
          _sum: { total: true },
          _count: { id: true },
        }),
        this.prisma.sale.count({ where }),
        this.prisma.payment.groupBy({
          by: ['method'],
          where: {
            sale: where,
            deletedAt: null,
          },
          _sum: { amount: true },
          _count: { id: true },
        }),
      ]);

    const totalRevenue = Number(totalAgg._sum.total ?? 0);
    const transactionCount = countAgg;
    const avgOrderValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;

    return {
      period: {
        dateFrom: dateFrom ?? null,
        dateTo: dateTo ?? null,
      },
      revenue: {
        total: totalRevenue,
        today: Number(todayAgg._sum.total ?? 0),
        thisWeek: Number(weekAgg._sum.total ?? 0),
        thisMonth: Number(monthAgg._sum.total ?? 0),
        totalTax: Number(totalAgg._sum.taxAmount ?? 0),
        totalDiscount: Number(totalAgg._sum.discountAmount ?? 0),
      },
      transactions: {
        total: transactionCount,
        today: todayAgg._count.id,
        thisWeek: weekAgg._count.id,
        thisMonth: monthAgg._count.id,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      },
      paymentBreakdown: paymentBreakdown.map((p) => ({
        method: p.method,
        amount: Number(p._sum.amount ?? 0),
        count: p._count.id,
      })),
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // voidSale — atomic void with inventory restore
  // ──────────────────────────────────────────────────────────────────────────

  async voidSale(
    tenantId: string,
    userId: string,
    id: string,
    dto: VoidSaleDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Load sale with items
      const sale = await tx.sale.findFirst({
        where: { id, tenantId, deletedAt: null },
        include: {
          items: true,
          store: { select: { id: true, name: true } },
        },
      });

      if (!sale) throw new NotFoundException('Sale not found in this tenant.');
      if (sale.status === SaleStatus.VOIDED || sale.status === SaleStatus.CANCELLED) {
        throw new BadRequestException(
          `Sale "${sale.invoiceNumber}" has already been ${sale.status.toLowerCase()} and cannot be voided again.`,
        );
      }

      // Restore inventory for each item
      for (const item of sale.items) {
        const inventory = await tx.inventory.findUnique({
          where: { storeId_productId: { storeId: sale.storeId, productId: item.productId } },
        });

        if (!inventory) continue; // Inventory row deleted — skip gracefully

        const previousStock = new Prisma.Decimal(inventory.currentStock);
        const restoreQty = new Prisma.Decimal(item.quantity);
        const newStock = previousStock.add(restoreQty);

        await tx.inventory.update({
          where: { id: inventory.id },
          data: { currentStock: newStock },
        });

        await tx.inventoryMovement.create({
          data: {
            tenantId,
            storeId: sale.storeId,
            productId: item.productId,
            userId,
            type: InventoryMovementType.RETURN,
            quantity: restoreQty, // positive = stock in
            previousStock,
            newStock,
            reference: sale.invoiceNumber,
            notes: `Void of ${sale.invoiceNumber}: ${dto.reason}`,
          },
        });
      }

      // Update sale status
      const cancelledAt = new Date();
      await tx.sale.update({
        where: { id: sale.id },
        data: {
          status: SaleStatus.VOIDED,
          cancelledAt,
        },
      });

      // Audit log
      await this.auditService.createLog({
        tenantId,
        userId,
        action: 'VOID',
        table: 'sales',
        recordId: sale.id,
        ipAddress,
        userAgent,
        newValue: {
          invoiceNumber: sale.invoiceNumber,
          reason: dto.reason,
          voidedAt: cancelledAt.toISOString(),
          voidedBy: userId,
          itemsRestored: sale.items.length,
          totalReversed: Number(sale.total),
          store: { id: sale.store.id, name: sale.store.name },
        },
      });

      return {
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        status: SaleStatus.VOIDED,
        voidedAt: cancelledAt,
        reason: dto.reason,
        itemsRestored: sale.items.length,
        totalReversed: Number(sale.total),
      };
    });
  }
}
