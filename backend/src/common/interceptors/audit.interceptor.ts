import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AUDIT_METADATA_KEY, AuditMetadata } from '../decorators/audit.decorator';
import { AuditService } from '../../modules/audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const meta = this.reflector.getAllAndOverride<AuditMetadata>(AUDIT_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!meta) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ipAddress = request.ip || request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap({
        next: (response) => {
          // Determine record ID from response payload (typically response.id or response.data.id)
          let recordId = null;
          let newValue = null;

          if (response) {
            recordId = response.id || (response.data && response.data.id);
            newValue = response.data || response;
          }

          const tenantId = user?.tenantId;
          const userId = user?.id;

          if (tenantId && userId) {
            this.auditService.createLog({
              tenantId,
              userId,
              action: meta.action,
              table: meta.table,
              recordId: recordId ? String(recordId) : undefined,
              newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : undefined,
              ipAddress: ipAddress ? String(ipAddress) : undefined,
              userAgent: userAgent ? String(userAgent) : undefined,
            });
          }
        },
      }),
    );
  }
}
