import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import * as crypto from 'crypto';
import type { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AtGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();

    if (request.headers['x-api-key']) {
      return this.authenticateWithApiKey(request);
    }

    return (await super.canActivate(context)) as boolean;
  }

  private async authenticateWithApiKey(request: Request): Promise<boolean> {
    const apiKey = request.headers['x-api-key'] as string;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const record = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: true },
    });

    if (!record || record.isRevoked) return false;
    if (record.expiresAt && record.expiresAt < new Date()) return false;

    request.user = { sub: record.user.id, email: record.user.email };

    this.prisma.apiKey
      .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    return true;
  }
}
