import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../database/prisma.service';

/**
 * Decoded JWT payload claims — shape is UNCHANGED for backward compatibility.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  roleId: string;
}

/**
 * Enriched user context attached to req.user after strategy validation.
 * Available to all guards and controllers via @GetUser() decorator.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  tenantId: string;
  roleId: string;
  roleRank: number;
  roleName: string;
  permissions: string[];
}

/**
 * Passport JWT Authentication Strategy.
 * Validates Bearer tokens, loads live user context from DB on every request.
 * Attaches enriched AuthenticatedUser to req.user.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'infypos-super-secret-key',
    });
  }

  /**
   * Invoked automatically by Passport after successful token signature verification.
   * Fetches active user + role + permissions from the database.
   * Returns the object attached to req.user.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        tenantId: payload.tenantId,
        deletedAt: null,
        status: 'ACTIVE',
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid token or inactive user context');
    }

    // Strip the tenant-namespaced prefix (e.g. "<tenantId>:users:create" → "users:create")
    // so that @Permissions('users:create') works cleanly without knowing the tenantId
    const permissions =
      user.role?.rolePermissions.map((rp) =>
        rp.permission.code.replace(`${user.tenantId}:`, ''),
      ) ?? [];

    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roleId: user.roleId,
      roleRank: user.role?.rank ?? 0,
      roleName: user.role?.name ?? '',
      permissions,
    };
  }
}
