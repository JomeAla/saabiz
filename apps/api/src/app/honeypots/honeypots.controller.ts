import { Controller, Get, Post, Patch, Delete, Body, Query, Param, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { HoneypotsService } from './honeypots.service';
import { CreateHoneypotDto, UpdateHoneypotDto } from './dto/honeypot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('honeypots')
@Controller('honeypots')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class HoneypotsController {
  constructor(private readonly honeypotsService: HoneypotsService) {}

  @Get()
  @ApiOperation({ summary: 'List honeypot license keys', description: 'All decoy license keys with hit counts, optionally filtered by product' })
  @ApiResponse({ status: 200, description: 'List of honeypot keys' })
  async findAll(@Query('productId') productId?: string) {
    return this.honeypotsService.findAll(productId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a honeypot license key', description: 'Generate a decoy license key for a product (or supply your own key)' })
  @ApiBody({ type: CreateHoneypotDto })
  @ApiResponse({ status: 201, description: 'Honeypot key created' })
  async create(@Body(new ValidationPipe()) dto: CreateHoneypotDto) {
    return this.honeypotsService.create(dto.productId, dto.label, dto.key);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a honeypot key', description: 'Rename the label or toggle active/inactive' })
  @ApiBody({ type: UpdateHoneypotDto })
  @ApiResponse({ status: 200, description: 'Honeypot key updated' })
  async update(@Param('id') id: string, @Body(new ValidationPipe()) dto: UpdateHoneypotDto) {
    return this.honeypotsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a honeypot key', description: 'Delete a decoy key and all of its hits' })
  @ApiResponse({ status: 200, description: 'Honeypot key deleted' })
  async remove(@Param('id') id: string) {
    return this.honeypotsService.remove(id);
  }

  @Get(':id/hits')
  @ApiOperation({ summary: 'Get hits for a honeypot key', description: 'Every time the decoy key was used: endpoint, machine, domain, IP, user agent' })
  @ApiResponse({ status: 200, description: 'List of hits' })
  async getHits(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.honeypotsService.getHits(id, limit ? parseInt(limit, 10) : 200);
  }

  @Get('bot-submissions')
  @ApiOperation({ summary: 'List bot submissions', description: 'Public form submissions that filled the invisible honeypot field (register/forgot-password)' })
  @ApiResponse({ status: 200, description: 'List of bot submissions' })
  async getBotSubmissions(@Query('limit') limit?: string) {
    return this.honeypotsService.listBotSubmissions(limit ? parseInt(limit, 10) : 100);
  }
}