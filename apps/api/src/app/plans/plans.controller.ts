import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @Roles(Role.SELLER)
  create(@Request() req: any, @Body(new ValidationPipe()) createPlanDto: CreatePlanDto) {
    return this.plansService.create(req.user.userId, createPlanDto);
  }

  @Get('product/:productId')
  @Roles(Role.SELLER)
  findAllForProduct(@Request() req: any, @Param('productId') productId: string) {
    return this.plansService.findAllForProduct(req.user.userId, productId);
  }

  @Get(':id')
  @Roles(Role.SELLER)
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.plansService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  @Roles(Role.SELLER)
  update(@Request() req: any, @Param('id') id: string, @Body(new ValidationPipe()) updatePlanDto: UpdatePlanDto) {
    return this.plansService.update(req.user.userId, id, updatePlanDto);
  }

  @Delete(':id')
  @Roles(Role.SELLER)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.plansService.remove(req.user.userId, id);
  }
}
