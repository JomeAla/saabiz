import { Module } from '@nestjs/common';
import { LicensesService } from './licenses.service';
import { LicensesController } from './licenses.controller';
import { Otacontroller } from './ota.controller';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [LicensesService, PrismaService],
  controllers: [LicensesController, Otacontroller],
  exports: [LicensesService],
})
export class LicensesModule {}
