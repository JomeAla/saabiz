import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(Role.SELLER)
  create(@Request() req: any, @Body(new ValidationPipe()) createProductDto: CreateProductDto) {
    return this.productsService.create(req.user.userId, createProductDto);
  }

  @Get()
  @Roles(Role.SELLER)
  findAll(@Request() req: any) {
    return this.productsService.findAll(req.user.userId);
  }

  @Get(':id')
  @Roles(Role.SELLER)
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.productsService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  @Roles(Role.SELLER)
  update(@Request() req: any, @Param('id') id: string, @Body(new ValidationPipe()) updateProductDto: UpdateProductDto) {
    return this.productsService.update(req.user.userId, id, updateProductDto);
  }

  @Delete(':id')
  @Roles(Role.SELLER)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.productsService.remove(req.user.userId, id);
  }
}
