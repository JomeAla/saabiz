import { Module } from '@nestjs/common';
import { LicensesService } from './licenses.service';
import { LicensesController } from './licenses.controller';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [LicensesService, PrismaService],
  controllers: [LicensesController],
  exports: [LicensesService],
})
export class LicensesModule {}
