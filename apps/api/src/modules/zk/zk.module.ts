import { Module } from '@nestjs/common';
import { ZKService } from './zk.service';
import { ZKController } from './zk.controller';

@Module({
  controllers: [ZKController],
  providers: [ZKService],
  exports: [ZKService],
})
export class ZKModule {}
