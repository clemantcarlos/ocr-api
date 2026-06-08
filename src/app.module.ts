import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '@/prisma/prisma.module';
import { join } from 'path';
// GUARDS
import { AtGuard } from '@/modules/auth/common/guards/at.guard';
//MODULES
import { AuthModule } from '@/modules/auth/auth.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { OcrModule } from './modules/ocr/ocr.module';
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    OcrModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public',
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AtGuard,
    },
  ],
})
export class AppModule {}
