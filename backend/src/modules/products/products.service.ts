import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { ProductStatus } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateProductDto) {
    // Check if SKU already exists for this tenant
    const existing = await this.prisma.product.findFirst({
      where: { tenantId, sku: dto.sku, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('Product SKU already exists in this tenant.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Validate VAT Rate exists and is active
      const vatRate = await tx.vatRate.findFirst({
        where: { id: dto.vatRateId, tenantId, deletedAt: null },
      });
      if (!vatRate) {
        throw new BadRequestException('VAT Rate not found or inactive. Every product must have a valid VAT category.');
      }

      // 2. Fetch active stores for the tenant
      const activeStores = await tx.store.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true },
      });

      if (activeStores.length === 0) {
        throw new BadRequestException('No active store found for this tenant. Please create a store first.');
      }

      // 3. Create the product
      const product = await tx.product.create({
        data: {
          tenantId,
          categoryId: dto.categoryId || null,
          vatRateId: dto.vatRateId,
          sku: dto.sku,
          barcode: dto.barcode || null,
          name: dto.name,
          description: dto.description || null,
          brand: dto.brand || null,
          unit: dto.unit || 'PCS',
          costPrice: dto.costPrice,
          sellingPrice: dto.sellingPrice,
          status: dto.status || ProductStatus.ACTIVE,
          trackInventory: dto.trackInventory ?? true,
          minimumStock: dto.minimumStock ?? 0,
          reorderLevel: dto.reorderLevel ?? 0,
        },
      });

      // 3. Create ProductBarcode if primary barcode is provided
      if (dto.barcode) {
        await tx.productBarcode.create({
          data: {
            productId: product.id,
            barcode: dto.barcode,
            isPrimary: true,
          },
        });
      }

      // 4. Automatically initialize Inventory stock balances for all active stores of the tenant
      for (const store of activeStores) {
        // Enforce duplicate safety check
        const exists = await tx.inventory.findUnique({
          where: {
            storeId_productId: {
              storeId: store.id,
              productId: product.id,
            },
          },
        });

        if (!exists) {
          await tx.inventory.create({
            data: {
              tenantId,
              storeId: store.id,
              productId: product.id,
              openingStock: 0,
              currentStock: 0,
              reservedStock: 0,
              damagedStock: 0,
            },
          });
        }
      }

      return product;
    });
  }

  async findAll(tenantId: string, query: QueryProductDto) {
    const { page = 1, limit = 10, search, categoryId, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status as ProductStatus;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Determine orderBy structure
    let orderBy: any = {};
    if (sortBy === 'price') {
      orderBy.sellingPrice = sortOrder;
    } else if (sortBy === 'stock') {
      orderBy.minimumStock = sortOrder;
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { category: true, vatRate: true, barcodes: true, images: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      success: true,
      statusCode: 200,
      message: 'Products retrieved successfully',
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { category: true, vatRate: true, barcodes: true, images: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found in this tenant.');
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Product retrieved successfully',
      data: product,
    };
  }

  async update(tenantId: string, id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('Product not found in this tenant.');
    }

    if (dto.sku && dto.sku !== product.sku) {
      const existing = await this.prisma.product.findFirst({
        where: { tenantId, sku: dto.sku, deletedAt: null },
      });
      if (existing) {
        throw new ConflictException('Product SKU already exists in this tenant.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Validate VAT Rate if being updated
      if (dto.vatRateId !== undefined) {
        const vatRate = await tx.vatRate.findFirst({
          where: { id: dto.vatRateId, tenantId, deletedAt: null },
        });
        if (!vatRate) {
          throw new BadRequestException('VAT Rate not found or inactive. Every product must have a valid VAT category.');
        }
      }

      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          categoryId: dto.categoryId !== undefined ? dto.categoryId : undefined,
          vatRateId: dto.vatRateId !== undefined ? dto.vatRateId : undefined,
          sku: dto.sku !== undefined ? dto.sku : undefined,
          barcode: dto.barcode !== undefined ? dto.barcode : undefined,
          name: dto.name !== undefined ? dto.name : undefined,
          description: dto.description !== undefined ? dto.description : undefined,
          brand: dto.brand !== undefined ? dto.brand : undefined,
          unit: dto.unit !== undefined ? dto.unit : undefined,
          costPrice: dto.costPrice !== undefined ? dto.costPrice : undefined,
          sellingPrice: dto.sellingPrice !== undefined ? dto.sellingPrice : undefined,
          status: dto.status !== undefined ? dto.status : undefined,
          trackInventory: dto.trackInventory !== undefined ? dto.trackInventory : undefined,
          minimumStock: dto.minimumStock !== undefined ? dto.minimumStock : undefined,
          reorderLevel: dto.reorderLevel !== undefined ? dto.reorderLevel : undefined,
        },
      });

      // Sync primary barcode if changed
      if (dto.barcode !== undefined) {
        // Delete old primary barcodes
        await tx.productBarcode.deleteMany({
          where: { productId: id, isPrimary: true },
        });

        if (dto.barcode) {
          await tx.productBarcode.create({
            data: {
              productId: id,
              barcode: dto.barcode,
              isPrimary: true,
            },
          });
        }
      }

      return {
        success: true,
        statusCode: 200,
        message: 'Product updated successfully',
        data: updatedProduct,
      };
    });
  }

  async softDelete(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('Product not found in this tenant.');
    }

    await this.prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: ProductStatus.DELETED,
      },
    });

    return {
      success: true,
      statusCode: 200,
      message: 'Product deleted successfully',
      data: { success: true },
    };
  }
}
