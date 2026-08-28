import { Global, Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantsController } from './tenants.controller';
import { PrismaService } from '../prisma.service';

@Global()
@Module({
  controllers: [TenantsController],
  providers: [TenantService, PrismaService],
  exports: [TenantService],
})
export class TenancyModule {}