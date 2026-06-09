import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import * as crypto from 'crypto';
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
    // Si la ruta es publica permite sin auth
    const isPublic = this.reflector.getAllAndOverride('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();

    // si el header tiene un api key autentica
    if (request.headers['x-api-key']) {
      return this.authenticateWithApiKey(request);
    }

    return (await super.canActivate(context)) as boolean;
  }

  /*
    1. Toma el valor de x-api-key
    2. calcula SHA-256
    3. Busca en tabla ApiKey por keyHash
    4. Si no existe, revocada, o expirada returna false
    5. Si es valida setea el request.user lo cual es clave ya que el resto del pipeline funciona con esto y con el @GetCurrentUser
    6. lastUsedAt se actualiza asincronamente
  */
  private async authenticateWithApiKey(request: any): Promise<boolean> {
    const apiKey = request.headers['x-api-key'];
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
