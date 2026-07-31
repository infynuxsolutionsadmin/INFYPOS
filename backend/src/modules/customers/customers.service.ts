import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // Helper method to generate collision-safe customer numbers sequentially
  private async generateCustomerCode(tx: Prisma.TransactionClient, tenantId: string): Promise<string> {
    const result = await tx.$queryRaw<[{ last_sequence: number }]>`
      INSERT INTO invoice_counters (id, tenant_id, prefix, counter_date, last_sequence, updated_at)
      VALUES (gen_random_uuid(), ${tenantId}::uuid, 'CUST', 'GLOBAL', 1, NOW())
      ON CONFLICT (tenant_id, prefix, counter_date)
      DO UPDATE SET
        last_sequence = invoice_counters.last_sequence + 1,
        updated_at    = NOW()
      RETURNING last_sequence
    `;
    const seq = Number(result[0].last_sequence);
    return `CUST-${String(seq).padStart(6, '0')}`;
  }

  async create(tenantId: string, userId: string, dto: CreateCustomerDto, ipAddress?: string, userAgent?: string) {
    // Prevent duplicate emails within same tenant
    if (dto.email) {
      const existing = await this.prisma.customer.findFirst({
        where: { tenantId, email: dto.email, deletedAt: null },
      });
      if (existing) {
        throw new ConflictException(`Email "${dto.email}" is already registered to a customer.`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const code = await this.generateCustomerCode(tx, tenantId);

      const customer = await tx.customer.create({
        data: {
          tenantId,
          code,
          firstName: dto.firstName,
          lastName: dto.lastName ?? null,
          email: dto.email ?? null,
          phone: dto.phone ?? null,
          address: dto.address ?? null,
          city: dto.city ?? null,
          country: dto.country ?? null,
          metadata: dto.notes ? { notes: dto.notes } : Prisma.JsonNull,
          loyaltyPoints: dto.loyaltyPoints ?? 0,
        },
      });

      await this.auditService.createLog({
        tenantId,
        userId,
        action: 'CREATE',
        table: 'customers',
        recordId: customer.id,
        ipAddress,
        userAgent,
        newValue: customer,
      });

      return customer;
    });
  }

  async findAll(tenantId: string, query: QueryCustomerDto) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.CustomerOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.customer.count({ where }),
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

  async findOne(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!customer) {
      throw new NotFoundException(`Customer details not found.`);
    }
    return customer;
  }

  async update(tenantId: string, userId: string, id: string, dto: UpdateCustomerDto, ipAddress?: string, userAgent?: string) {
    const customer = await this.findOne(tenantId, id);

    if (dto.email && dto.email !== customer.email) {
      const existing = await this.prisma.customer.findFirst({
        where: { tenantId, email: dto.email, deletedAt: null, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException(`Email "${dto.email}" is already in use by another customer.`);
      }
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        metadata: dto.notes ? { notes: dto.notes } : undefined,
        loyaltyPoints: dto.loyaltyPoints,
      },
    });

    await this.auditService.createLog({
      tenantId,
      userId,
      action: 'UPDATE',
      table: 'customers',
      recordId: id,
      ipAddress,
      userAgent,
      oldValue: customer,
      newValue: updated,
    });

    return updated;
  }

  async remove(tenantId: string, userId: string, id: string, ipAddress?: string, userAgent?: string) {
    const customer = await this.findOne(tenantId, id);

    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.createLog({
      tenantId,
      userId,
      action: 'DELETE',
      table: 'customers',
      recordId: id,
      ipAddress,
      userAgent,
      oldValue: customer,
    });

    return { success: true, message: 'Customer soft-deleted successfully' };
  }
}
