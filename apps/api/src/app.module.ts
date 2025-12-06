import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { ServeStaticModule } from '@nestjs/serve-static';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { join } from 'path';

// Core modules
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';

// Feature modules
import { EmailModule } from './modules/email/email.module';
import { AuthModule } from './modules/auth/auth.module';
import { KycModule } from './modules/kyc/kyc.module';
import { LaunchModule } from './modules/launch/launch.module';
import { TradingModule } from './modules/trading/trading.module';
import { GraduationModule } from './modules/graduation/graduation.module';
import { BridgeModule } from './modules/bridge/bridge.module';
import { AdminModule } from './modules/admin/admin.module';
import { ZKModule } from './modules/zk/zk.module';
import { IndexerModule } from './modules/indexer/indexer.module';
import { SocialModule } from './modules/social/social.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Static files (favicon)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/',
      serveStaticOptions: {
        index: false,
      },
    }),

    // GraphQL
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      introspection: process.env.NODE_ENV !== 'production',
      context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Caching
    CacheModule.register({
      isGlobal: true,
      ttl: 60000, // 1 minute default
    }),

    // Event Emitter for real-time updates
    EventEmitterModule.forRoot(),

    // Core
    PrismaModule,
    HealthModule,

    // Features
    EmailModule, // Global - must be before AuthModule
    AuthModule,
    KycModule,
    LaunchModule,
    TradingModule,
    GraduationModule,
    BridgeModule,
    AdminModule,
    ZKModule,
    IndexerModule,
    SocialModule,
  ],
})
export class AppModule {}
