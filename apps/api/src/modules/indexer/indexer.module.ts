import { Module } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import { IndexerController } from './indexer.controller';
import { IndexerGateway } from './indexer.gateway';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IndexerController],
  providers: [IndexerService, IndexerGateway],
  exports: [IndexerService],
})
export class IndexerModule {}
