import { Module } from '@nestjs/common';
import { GraduationService } from './graduation.service';
import { GraduationController } from './graduation.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { NetworksModule } from '../networks/networks.module';

@Module({
  imports: [PrismaModule, NetworksModule],
  controllers: [GraduationController],
  providers: [GraduationService],
  exports: [GraduationService],
})
export class GraduationModule {}
