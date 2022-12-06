import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AccessTokenStrategy, RefreshTokenFromBearerStrategy, RefreshTokenFromCookieStrategy } from './strategies';
import { APP_GUARD } from '@nestjs/core';
import { AccessTokenGuard } from 'src/common/guards';

@Module({
  imports: [JwtModule.register({}), PrismaModule],
  providers: [AuthService,
  AccessTokenStrategy,
  RefreshTokenFromBearerStrategy,
  RefreshTokenFromCookieStrategy,
{
  provide: APP_GUARD,
  useClass: AccessTokenGuard
}],
  controllers: [AuthController]
})
export class AuthModule {}
