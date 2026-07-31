import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

interface CustomRequest extends Request {
  tenantId?: string;
  tenant?: Record<string, unknown>;
  user?: {
    tenantId?: string;
    [key: string]: unknown;
  };
}

export const GetTenant = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<CustomRequest>();
    const tenantId = request.tenantId || request.user?.tenantId;

    if (!tenantId) return null;
    return data ? request.tenant?.[data] : tenantId;
  },
);
