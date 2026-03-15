import { Module } from '@nestjs/common';
import { LicensesService } from './licenses.service';
import { LicensesController } from './licenses.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LicensesService],
  controllers: [LicensesController],
  exports: [LicensesService],
})
export class LicensesModule {}
