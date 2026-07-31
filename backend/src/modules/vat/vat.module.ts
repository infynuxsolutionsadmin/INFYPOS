import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { VatController } from './vat.controller';
import { VatService } from './vat.service';

@Module({
  controllers: [VatController],
  providers: [VatService, PrismaService, AuditService],
  exports: [VatService],
})
export class VatModule {}
