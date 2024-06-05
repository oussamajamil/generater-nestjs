import { CacheModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';

import { join } from 'path';
import { MulterModule } from '@nestjs/platform-express/multer';
import { ServeStaticModule } from '@nestjs/serve-static';
import { PrismaModule } from './prisma.module';
import { AllExceptionsFilter } from './utils/prisma-client-exception-filter';

import { MiddlewareAuth } from './common/middleware/auth.middleware';
import { RolesGuard } from './common/guard/roles.guard';
import redisStore from './redis';

import {UserModule}  from '@/routes/user/user.module';

@Module({
  imports: [
UserModule,
    CacheModule.register(),
    MulterModule.register({
      dest: join(__dirname, '..', '..', 'uploads'),
    }),
    CacheModule.register(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    CacheModule.register({
      isGlobal: true,
      useFactory: async () => ({
        store: redisStore,
        host: 'localhost',
        port: 6379,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    AppService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(MiddlewareAuth)
      .exclude(
        { path: 'auth/signin', method: RequestMethod.POST },
        { path: 'auth/refreshtoken', method: RequestMethod.POST },
        { path: 'auth/forgotpassword', method: RequestMethod.POST },
        { path: 'auth/resetpassword', method: RequestMethod.POST },
        { path: 'uploads/(.+)', method: RequestMethod.GET },
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
