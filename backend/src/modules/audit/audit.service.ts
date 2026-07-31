import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface CreateAuditLogPayload {
  tenantId?: string;
  userId?: string;
  action: string;
  table: string;
  recordId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class QueryAuditLogParams {
  page?: number;
  limit?: number;
  search?: string;
  table?: string;
  action?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async createLog(payload: CreateAuditLogPayload) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          tenantId: payload.tenantId || null,
          userId: payload.userId || null,
          action: payload.action,
          table: payload.table,
          recordId: payload.recordId || null,
          oldValue: payload.oldValue || null,
          newValue: payload.newValue || null,
          ipAddress: payload.ipAddress || null,
          userAgent: payload.userAgent || null,
        },
      });
    } catch (err) {
      // Fail silently to prevent interrupting core database transactions
      console.error('Failed to write audit log:', err);
    }
  }

  async findAll(tenantId: string, query: QueryAuditLogParams) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
    };

    // Filter by table (module/entityType)
    if (query.table) {
      where.table = query.table;
    }

    // Filter by action
    if (query.action) {
      where.action = query.action;
    }

    // Filter by specific operator userId
    if (query.userId) {
      where.userId = query.userId;
    }

    // Filter by date range (createdAt)
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        where.createdAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.createdAt.lte = new Date(query.dateTo);
      }
    }

    // Full-text keyword search on action, table, recordId, and user names
    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { table: { contains: search, mode: 'insensitive' } },
        { recordId: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.auditLog.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }
}
