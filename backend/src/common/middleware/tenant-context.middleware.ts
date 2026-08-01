import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface TenantRequest extends Request {
  tenantId?: string;
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: any, res: Response, next: NextFunction) {
    const tenantIdHeader = req.headers?.['x-tenant-id'];

    if (tenantIdHeader && typeof tenantIdHeader === 'string') {
      req.tenantId = tenantIdHeader;
    }

    next();
  }
}
