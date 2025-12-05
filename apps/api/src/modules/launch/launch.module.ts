import { Module } from '@nestjs/common';
import { LaunchService } from './launch.service';
import { LaunchController } from './launch.controller';
import { LaunchResolver } from './launch.resolver';

@Module({
  controllers: [LaunchController],
  providers: [LaunchService, LaunchResolver],
  exports: [LaunchService],
})
export class LaunchModule {}
