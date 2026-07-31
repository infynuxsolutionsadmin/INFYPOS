import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterTenantDto } from './dto/register.dto';

interface AuthenticatedUser {
  id: string;
  email: string;
  tenantId: string;
  roleId: string;
  roleName?: string;
  permissions?: string[];
}

/**
 * Authentication Controller for Tenant Registration, User Login, Token Refresh, Logout, and User Profile.
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new tenant organization and initial admin user
   */
  @ApiOperation({
    summary: 'Register Tenant & Admin User',
    description:
      'Creates a new tenant, default store, admin role, and admin user, returning access & refresh tokens.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Tenant registered successfully. Returns Access & Refresh tokens.',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed (invalid format or missing fields).',
  })
  @ApiResponse({
    status: 409,
    description: 'Tenant slug is already in use.',
  })
  @Post('register')
  async register(@Body() dto: RegisterTenantDto) {
    return this.authService.registerTenant(dto);
  }

  /**
   * Authenticates user credentials and generates JWT access and refresh tokens
   */
  @ApiOperation({
    summary: 'User Login',
    description:
      'Verifies credentials within tenant context and issues Access & Refresh tokens.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful. Returns Access & Refresh tokens.',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error in request payload.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or inactive user/tenant.',
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Refreshes expired access tokens using a valid refresh token with token rotation
   */
  @ApiOperation({
    summary: 'Refresh Access Token',
    description:
      'Validates refresh token, revokes it, and issues a new Access & Refresh token pair (token rotation).',
  })
  @ApiResponse({
    status: 200,
    description:
      'Token refreshed successfully. Returns new Access & Refresh tokens.',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error in request payload.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid, expired, or revoked refresh token.',
  })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  /**
   * Revokes the active refresh token and terminates session
   */
  @ApiOperation({
    summary: 'User Logout',
    description:
      'Revokes the specified refresh token and invalidates active session.',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access (missing or expired access token).',
  })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@GetUser() user: AuthenticatedUser, @Body() dto: LogoutDto) {
    return this.authService.logout(user.id, user.tenantId, dto);
  }

  /**
   * Retrieves profile details for currently authenticated user
   */
  @ApiOperation({
    summary: 'Get Authenticated User Profile',
    description:
      'Returns account, role, and tenant details for the authenticated JWT session.',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Profile details returned successfully.',
  })
  @ApiResponse({
    status: 401,
    description:
      'Unauthorized access (missing or invalid Bearer access token).',
  })
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@GetUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.id, user.tenantId);
  }
}
