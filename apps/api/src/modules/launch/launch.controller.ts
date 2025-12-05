import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { LaunchService } from './launch.service';

@Controller('launch')
export class LaunchController {
  constructor(private readonly launchService: LaunchService) {}

  @Post()
  async create(@Body() body: any) {
    return this.launchService.createToken(body);
  }

  @Get()
  async list(@Query() query: any) {
    return this.launchService.listTokens(query);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.launchService.getToken(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.launchService.updateToken(id, body);
  }

  @Post(':id/presale')
  async startPresale(@Param('id') id: string) {
    return this.launchService.startPresale(id);
  }
}
