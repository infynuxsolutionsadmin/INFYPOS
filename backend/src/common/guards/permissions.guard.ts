import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

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
 * PermissionsGuard — enforces fine-grained permission checks on endpoints.
 *
 * Works in conjunction with @Permissions() / @RequirePermissions() decorators.
 * Must run AFTER JwtAuthGuard so req.user is populated.
 *
 * Logic: ALL required permissions must be present in user.permissions[] (AND semantics).
 * If no permissions are specified on the endpoint, the guard passes.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @Permissions decorator — allow through
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<CustomRequest>();
    const user = request.user;

    if (!user || !Array.isArray(user.permissions)) {
      throw new ForbiddenException(
        'Access denied. Permission context is missing from token.',
      );
    }

    const missingPermissions = requiredPermissions.filter(
      (perm) => !user.permissions.includes(perm),
    );

    if (missingPermissions.length > 0) {
      throw new ForbiddenException(
        `Access denied. Missing required permission(s): [${missingPermissions.join(', ')}].`,
      );
    }

    return true;
  }
}
