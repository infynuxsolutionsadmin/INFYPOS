import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

interface CustomRequest extends Request {
  tenantId?: string;
  user?: {
    tenantId?: string;
    [key: string]: unknown;
  };
}

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<CustomRequest>();
    const tenantId = request.tenantId || request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant context missing');
    }

    if (request.user?.tenantId && request.user.tenantId !== tenantId) {
      throw new ForbiddenException('Cross-tenant access forbidden');
    }

    return true;
  }
}
