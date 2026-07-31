import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateVatRateDto } from './dto/create-vat-rate.dto';
import { UpdateVatRateDto } from './dto/update-vat-rate.dto';

@Injectable()
export class VatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(tenantId: string, userId: string, dto: CreateVatRateDto, ipAddress?: string, userAgent?: string) {
    // 1. Verify parent Tax configuration exists under this tenant
    const tax = await this.prisma.tax.findFirst({
      where: { id: dto.taxId, tenantId, deletedAt: null },
    });
    if (!tax) {
      throw new NotFoundException('Parent tax group not found under this tenant.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 2. If declaring as default rate, remove default flag from others
      if (dto.isDefault) {
        await tx.vatRate.updateMany({
          where: { tenantId, isDefault: true, deletedAt: null },
          data: { isDefault: false },
        });
      }

      const vatRate = await tx.vatRate.create({
        data: {
          tenantId,
          taxId: dto.taxId,
          name: dto.name,
          percentage: new Prisma.Decimal(dto.percentage),
          isDefault: dto.isDefault ?? false,
        },
      });

      await this.auditService.createLog({
        tenantId,
        userId,
        action: 'CREATE',
        table: 'vat_rates',
        recordId: vatRate.id,
        ipAddress,
        userAgent,
        newValue: vatRate,
      });

      return vatRate;
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.vatRate.findMany({
      where: { tenantId, deletedAt: null },
      include: { tax: true },
      orderBy: { percentage: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const vatRate = await this.prisma.vatRate.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { tax: true },
    });
    if (!vatRate) {
      throw new NotFoundException('VAT Rate not found.');
    }
    return vatRate;
  }

  async update(tenantId: string, userId: string, id: string, dto: UpdateVatRateDto, ipAddress?: string, userAgent?: string) {
    const vatRate = await this.findOne(tenantId, id);

    if (dto.taxId && dto.taxId !== vatRate.taxId) {
      const tax = await this.prisma.tax.findFirst({
        where: { id: dto.taxId, tenantId, deletedAt: null },
      });
      if (!tax) {
        throw new NotFoundException('New parent tax group not found under this tenant.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.vatRate.updateMany({
          where: { tenantId, isDefault: true, deletedAt: null, id: { not: id } },
          data: { isDefault: false },
        });
      }

      const updated = await tx.vatRate.update({
        where: { id },
        data: {
          taxId: dto.taxId,
          name: dto.name,
          percentage: dto.percentage !== undefined ? new Prisma.Decimal(dto.percentage) : undefined,
          isDefault: dto.isDefault,
        },
      });

      await this.auditService.createLog({
        tenantId,
        userId,
        action: 'UPDATE',
        table: 'vat_rates',
        recordId: id,
        ipAddress,
        userAgent,
        oldValue: vatRate,
        newValue: updated,
      });

      return updated;
    });
  }

  async remove(tenantId: string, userId: string, id: string, ipAddress?: string, userAgent?: string) {
    const vatRate = await this.findOne(tenantId, id);

    // Safeguard 1: Check if default
    if (vatRate.isDefault) {
      throw new BadRequestException('Cannot delete default VAT rate. Assign another default rate first.');
    }

    // Safeguard 2: Check if active products reference this VAT rate
    const referencingProductsCount = await this.prisma.product.count({
      where: { tenantId, vatRateId: id, deletedAt: null },
    });

    if (referencingProductsCount > 0) {
      throw new BadRequestException(
        `Cannot delete VAT rate because ${referencingProductsCount} product(s) are currently assigned to it. Reassign products first.`
      );
    }

    await this.prisma.vatRate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.createLog({
      tenantId,
      userId,
      action: 'DELETE',
      table: 'vat_rates',
      recordId: id,
      ipAddress,
      userAgent,
      oldValue: vatRate,
    });

    return { success: true, message: 'VAT Rate soft-deleted successfully.' };
  }

  async seedDefaultVatRates(tenantId: string) {
    let tax = await this.prisma.tax.findFirst({
      where: { tenantId, code: 'UK_VAT', deletedAt: null },
    });

    if (!tax) {
      tax = await this.prisma.tax.create({
        data: {
          tenantId,
          name: 'UK VAT',
          code: 'UK_VAT',
          type: 'EXCLUSIVE',
          description: 'UK Value Added Tax',
        },
      });
    }

    const defaultRates = [
      { name: 'Standard VAT', percentage: 20, isDefault: true },
      { name: 'Reduced VAT', percentage: 5, isDefault: false },
      { name: 'Zero Rated', percentage: 0, isDefault: false },
    ];

    for (const rate of defaultRates) {
      const exists = await this.prisma.vatRate.findFirst({
        where: { tenantId, taxId: tax.id, name: rate.name, deletedAt: null },
      });

      if (!exists) {
        await this.prisma.vatRate.create({
          data: {
            tenantId,
            taxId: tax.id,
            name: rate.name,
            percentage: new Prisma.Decimal(rate.percentage),
            isDefault: rate.isDefault,
          },
        });
      }
    }

    return this.findAll(tenantId);
  }
}
