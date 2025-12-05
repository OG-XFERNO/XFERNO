import { Controller, Get, Post, Put, Body, Param, Query, Headers } from '@nestjs/common';
import { LaunchService, CreateTokenDto, ListTokensDto } from './launch.service';

@Controller('launch')
export class LaunchController {
  constructor(private readonly launchService: LaunchService) {}

  @Post()
  async create(
    @Headers('x-user-id') userId: string,
    @Body() body: CreateTokenDto,
  ) {
    // In production, get userId from JWT token
    const creatorId = userId || 'anonymous';
    return this.launchService.createToken(creatorId, body);
  }

  @Get()
  async list(@Query() query: ListTokensDto) {
    return this.launchService.listTokens(query);
  }

  @Get('active')
  async getActivePresales() {
    return this.launchService.getActivePresales();
  }

  @Get('graduated')
  async getGraduatedTokens(@Query('limit') limit?: string) {
    return this.launchService.getGraduatedTokens(limit ? parseInt(limit) : 10);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.launchService.getToken(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Body() body: Partial<CreateTokenDto>,
  ) {
    const creatorId = userId || 'anonymous';
    return this.launchService.updateToken(id, creatorId, body);
  }

  @Post(':id/presale')
  async startPresale(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    const creatorId = userId || 'anonymous';
    return this.launchService.startPresale(id, creatorId);
  }

  @Get('creator/:creatorId')
  async getByCreator(@Param('creatorId') creatorId: string) {
    return this.launchService.getTokensByCreator(creatorId);
  }
}
