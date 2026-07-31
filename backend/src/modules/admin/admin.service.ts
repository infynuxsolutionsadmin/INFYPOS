import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface AdminDashboardMetrics {
  message: string;
  systemHealth: string;
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  activeUsers: number;
  totalStores: number;
  recentTenants: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: Date;
  }>;
  timestamp: string;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves real-time enterprise system metrics for Super Admin Dashboard
   */
  async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      activeUsers,
      totalStores,
      recentTenants,
    ] = await Promise.all([
      this.prisma.tenant.count({ where: { deletedAt: null } }),
      this.prisma.tenant.count({
        where: { status: 'ACTIVE', deletedAt: null },
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({
        where: { status: 'ACTIVE', deletedAt: null },
      }),
      this.prisma.store.count({ where: { deletedAt: null } }),
      this.prisma.tenant.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      message: 'Super Admin Dashboard Access Granted',
      systemHealth: 'OK',
      totalTenants,
      activeTenants,
      totalUsers,
      activeUsers,
      totalStores,
      recentTenants,
      timestamp: new Date().toISOString(),
    };
  }
}
