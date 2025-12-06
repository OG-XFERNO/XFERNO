import { Module } from '@nestjs/common';
import { NetworksService } from './networks.service';
import { NetworksController } from './networks.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NetworksController],
  providers: [NetworksService],
  exports: [NetworksService],
})
export class NetworksModule {}
