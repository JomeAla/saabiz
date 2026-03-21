import { Module } from '@nestjs/common';
import { LicensesService } from './licenses.service';
import { LicensesController } from './licenses.controller';
import { Otacontroller } from './ota.controller';
import { ActivationsController } from './activations.controller';
import { ActivationsService } from './activations.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [LicensesService, ActivationsService, PrismaService],
  controllers: [LicensesController, Otacontroller, ActivationsController],
  exports: [LicensesService, ActivationsService],
})
export class LicensesModule {}
