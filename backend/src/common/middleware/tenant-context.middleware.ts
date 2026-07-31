import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

export interface TenantRequest extends Request {
  tenantId?: string;
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: TenantRequest, res: Response, next: NextFunction) {
    const tenantIdHeader = req.headers['x-tenant-id'];

    if (tenantIdHeader && typeof tenantIdHeader === 'string') {
      req.tenantId = tenantIdHeader;
    }

    next();
  }
}
