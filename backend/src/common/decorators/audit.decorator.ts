import { SetMetadata } from '@nestjs/common';

export interface AuditMetadata {
  action: string;
  table: string;
}

export const AUDIT_METADATA_KEY = 'audit_metadata';

export const Audit = (action: string, table: string) =>
  SetMetadata(AUDIT_METADATA_KEY, { action, table });
