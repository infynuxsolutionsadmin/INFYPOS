import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Typed user context attached to req.user by JwtStrategy.validate()
 */
interface AuthenticatedUser {
  id: string;
  email: string;
  tenantId: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}

interface CustomRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * RolesGuard — enforces high-level role-name checks on controller/handler level.
 *
 * Works in conjunction with @Roles() decorator.
 * Must run AFTER JwtAuthGuard so req.user.roleName is populated.
 *
 * If no @Roles() decorator is present, guard passes through.
 * Roles are matched by name (string) — not rank — at the guard level.
 * Fine-grained hierarchy (rank comparison) is enforced in service layer.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @Roles decorator — allow through
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<CustomRequest>();
    const user = request.user;

    if (!user || !user.roleName) {
      throw new ForbiddenException(
        'Access denied. Role context is missing from token.',
      );
    }

    const hasRole = requiredRoles.includes(user.roleName);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required role(s): [${requiredRoles.join(', ')}]. Your role: '${user.roleName}'.`,
      );
    }

    return true;
  }
}
