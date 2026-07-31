import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, InventoryMovementType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { QueryInventoryDto, QueryMovementsDto } from './dto/query-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  // findAll — paginated stock list with low/out-of-stock flags
  // ──────────────────────────────────────────────────────────────────────────

  async findAll(tenantId: string, query: QueryInventoryDto) {
    const { page = 1, limit = 20, storeId, productId, search, lowStock, outOfStock } = query;
    const skip = (page - 1) * limit;

    // Build the inventory where clause
    const where: Prisma.InventoryWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (storeId) where.storeId = storeId;
    if (productId) where.productId = productId;

    if (outOfStock) {
      where.currentStock = new Prisma.Decimal(0);
    }

    if (search) {
      where.product = {
        deletedAt: null,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } },
        ],
      };
    } else {
      // Always filter out deleted products
      where.product = { deletedAt: null };
    }

    const [items, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { product: { name: 'asc' } },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              barcode: true,
              unit: true,
              minimumStock: true,
              reorderLevel: true,
              status: true,
              category: { select: { id: true, name: true } },
            },
          },
          store: { select: { id: true, name: true, code: true } },
        },
      }),
      this.prisma.inventory.count({ where }),
    ]);

    // Post-process: add computed flags and filter lowStock if requested
    let enriched = items.map((inv) => ({
      ...inv,
      currentStock: Number(inv.currentStock),
      reservedStock: Number(inv.reservedStock),
      damagedStock: Number(inv.damagedStock),
      availableStock: Number(inv.currentStock) - Number(inv.reservedStock),
      isLowStock:
        Number(inv.product.reorderLevel) > 0 &&
        Number(inv.currentStock) <= Number(inv.product.reorderLevel),
      isOutOfStock: Number(inv.currentStock) === 0,
    }));

    if (lowStock) {
      enriched = enriched.filter((i) => i.isLowStock);
    }

    return {
      data: enriched,
      meta: {
        page,
        limit,
        total: lowStock ? enriched.length : total,
        totalPages: Math.ceil((lowStock ? enriched.length : total) / limit),
      },
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // findOne — single inventory record
  // ──────────────────────────────────────────────────────────────────────────

  async findOne(tenantId: string, id: string) {
    const inv = await this.prisma.inventory.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            unit: true,
            sellingPrice: true,
            costPrice: true,
            minimumStock: true,
            reorderLevel: true,
            status: true,
            category: { select: { id: true, name: true } },
          },
        },
        store: { select: { id: true, name: true, code: true } },
      },
    });

    if (!inv) throw new NotFoundException('Inventory record not found in this tenant.');

    return {
      ...inv,
      currentStock: Number(inv.currentStock),
      reservedStock: Number(inv.reservedStock),
      damagedStock: Number(inv.damagedStock),
      availableStock: Number(inv.currentStock) - Number(inv.reservedStock),
      isLowStock:
        Number(inv.product.reorderLevel) > 0 &&
        Number(inv.currentStock) <= Number(inv.product.reorderLevel),
      isOutOfStock: Number(inv.currentStock) === 0,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // adjustStock — manual stock adjustment with movement record
  // ──────────────────────────────────────────────────────────────────────────

  async adjustStock(tenantId: string, userId: string, dto: AdjustStockDto) {
    // Validate product belongs to tenant
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, tenantId, deletedAt: null },
      select: { id: true, name: true, sku: true },
    });
    if (!product) throw new NotFoundException('Product not found in this tenant.');

    // Validate store belongs to tenant
    const store = await this.prisma.store.findFirst({
      where: { id: dto.storeId, tenantId, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!store) throw new NotFoundException('Store not found in this tenant.');

    return this.prisma.$transaction(async (tx) => {
      // Load inventory row with lock
      const inventory = await tx.inventory.findUnique({
        where: { storeId_productId: { storeId: dto.storeId, productId: dto.productId } },
      });

      if (!inventory) {
        throw new NotFoundException(
          `No inventory record for product "${product.name}" in store "${store.name}". Ensure product is assigned to this store.`,
        );
      }

      const previousStock = new Prisma.Decimal(inventory.currentStock);
      const adjustQty = new Prisma.Decimal(dto.quantity);
      const newStock = previousStock.add(adjustQty);

      // Prevent negative stock unless type is DAMAGE (write-off)
      if (newStock.lt(0) && dto.type !== InventoryMovementType.DAMAGE) {
        throw new ConflictException({
          message: `Adjustment would result in negative stock for "${product.name}".`,
          currentStock: Number(previousStock),
          adjustment: Number(adjustQty),
          wouldBe: Number(newStock),
        });
      }

      // Update stock
      const updated = await tx.inventory.update({
        where: { id: inventory.id },
        data: { currentStock: newStock.lt(0) ? new Prisma.Decimal(0) : newStock },
      });

      // Create movement record
      const movement = await tx.inventoryMovement.create({
        data: {
          tenantId,
          storeId: dto.storeId,
          productId: dto.productId,
          userId,
          type: dto.type,
          quantity: adjustQty,
          previousStock,
          newStock: updated.currentStock,
          reference: dto.reference ?? null,
          notes: dto.notes ?? null,
        },
      });

      // Audit log
      await this.auditService.createLog({
        tenantId,
        userId,
        action: 'ADJUST',
        table: 'inventories',
        recordId: inventory.id,
        newValue: {
          product: { id: product.id, name: product.name },
          store: { id: store.id, name: store.name },
          type: dto.type,
          adjustment: Number(adjustQty),
          previousStock: Number(previousStock),
          newStock: Number(updated.currentStock),
          reference: dto.reference,
          notes: dto.notes,
        },
      });

      return {
        inventoryId: inventory.id,
        product: { id: product.id, name: product.name, sku: product.sku },
        store: { id: store.id, name: store.name },
        previousStock: Number(previousStock),
        adjustment: Number(adjustQty),
        newStock: Number(updated.currentStock),
        movementId: movement.id,
        type: dto.type,
      };
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // getMovements — paginated movement log
  // ──────────────────────────────────────────────────────────────────────────

  async getMovements(tenantId: string, query: QueryMovementsDto) {
    const { page = 1, limit = 20, storeId, productId, type, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryMovementWhereInput = { tenantId };

    if (storeId) where.storeId = storeId;
    if (productId) where.productId = productId;
    if (type) where.type = type;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          store: { select: { id: true, name: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    return {
      data: items.map((m) => ({
        ...m,
        quantity: Number(m.quantity),
        previousStock: Number(m.previousStock),
        newStock: Number(m.newStock),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
