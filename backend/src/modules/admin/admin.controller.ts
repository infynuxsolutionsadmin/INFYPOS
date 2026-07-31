import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminService } from './admin.service';

/**
 * Super Admin Controller exposing system-wide administrative metrics and tenant management
 */
@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({
    summary: 'Super Admin Dashboard',
    description:
      'Protected endpoint accessible exclusively to users with SUPER_ADMIN role.',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Super Admin Dashboard metrics returned successfully.',
  })
  @ApiResponse({
    status: 401,
    description:
      'Unauthorized access (missing or invalid Bearer access token).',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden access (requires SUPER_ADMIN role).',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboardMetrics();
  }
}
