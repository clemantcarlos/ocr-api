import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
// dto
import { AuthDto } from './dto/auth.dto';
import { CreateUserDto } from 'src/modules/user/dto/user.dto';
// TYPES
import type { User, ApiKey } from '@prisma/client';
// interfaces
import { Prisma } from '@prisma/client';
import { Tokens } from './types/tokens.type';
import { UserWithTokens } from './types/userWithTokens';
import { ResponseDto } from '@/interfaces/getResponse';
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signupLocal(user: CreateUserDto): Promise<ResponseDto<UserWithTokens>> {
    const { password, ...userWithoutPassword } = user;
    const hash = await bcrypt.hash(password, 10);

    let newUser: User | null = null;

    try {
      newUser = await this.prisma.user.create({
        data: { password: hash, ...userWithoutPassword },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new BadRequestException(
            `User already exists, try with another ${String(e.meta?.target)}`,
          );
        }
      }
      throw new BadRequestException(e);
    }

    if (!newUser) throw new InternalServerErrorException('Signup failed');

    const tokens = await this.getTokens(newUser.id, newUser.email);
    await this.updateRtHash(newUser.id, tokens.refresh_token);

    const userPublicInfo = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    };

    return {
      success: true,
      data: {
        tokens,
        user: userPublicInfo,
      },
    };
  }
  async signinLocal(dto: AuthDto): Promise<ResponseDto<UserWithTokens>> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });

    if (!user) throw new UnauthorizedException('User or password incorrect');

    const { password, ...rest } = user;

    const passwordMatches = await bcrypt.compare(dto.password, password);
    if (!passwordMatches)
      throw new UnauthorizedException('User or password incorrect');

    const tokens = await this.getTokens(rest.id, rest.email);

    await this.updateRtHash(rest.id, tokens.refresh_token);

    return {
      success: true,
      data: {
        tokens,
        user: rest,
      },
    };
  }
  async logout(userId: string): Promise<{ message: string }> {
    const unloggedUser = await this.prisma.user.updateMany({
      where: {
        id: userId,
        hashedRt: {
          not: null,
        },
      },
      data: {
        hashedRt: null,
      },
    });
    if (unloggedUser.count === 0)
      throw new NotFoundException('User not logged');
    return { message: 'User logged out' };
  }
  async refreshTokens(
    userId: string,
    rt: string,
  ): Promise<ResponseDto<Tokens>> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const rtMatches = await bcrypt.compare(rt, user?.hashedRt ?? '');

    if (!rtMatches) throw new ForbiddenException('Access denied');

    const tokens = await this.getTokens(user.id, user.email);

    await this.updateRtHash(user.id, tokens.refresh_token);

    return { success: true, data: tokens };
  }
  // API KEYS
  async createApiKey(
    userId: string,
    name: string,
    expiresAt?: string,
  ): Promise<{ rawKey: string; apiKey: Omit<ApiKey, 'keyHash'> }> {
    // genera una raw key ej: "ali_7f3a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0"
    const rawKey = `ali_${crypto.randomBytes(32).toString('hex')}`;
    // se calcula el key has que se guardara en db ya que el raw key no se guarda en db
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    // generamos el prefix (para mostrar en listados)
    const prefix = rawKey.substring(0, 12);

    // guardamos en db
    const apiKey = await this.prisma.apiKey.create({
      data: {
        name,
        keyHash,
        prefix,
        userId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    const { keyHash: _, ...safeKey } = apiKey;

    // el rawkey lo retornamos para que se muestre una sola vez
    return { rawKey, apiKey: { ...safeKey } as Omit<ApiKey, 'keyHash'> };
  }

  /*
    Buscamos todas las apis del usuario ordenadas por fecha de creacion descendendte, 
    devolviendo solo el "id, name, prefix, lastUsedAt, expiresAt, isRevoked, createdAt, updatedAt"
    (NUNCA el keyhash ni el rawkey)
  */
  async getApiKeys(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        prefix: true,
        lastUsedAt: true,
        expiresAt: true,
        isRevoked: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  /*
    Busca la key que pertenezca al usuario y tenga ese id. Si no existe, lanza un error.
    Si existem le setea el isRevoked: true (para hacer un soft delete)
  */
  async revokeApiKey(userId: string, keyId: string) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id: keyId, userId },
    });
    if (!apiKey) throw new NotFoundException('API key not found');

    return this.prisma.apiKey.update({
      where: { id: keyId },
      data: { isRevoked: true },
      select: {
        id: true,
        name: true,
        prefix: true,
        isRevoked: true,
        updatedAt: true,
      },
    });
  }
  /*
    ESTE ES EL METODO QUE USA EL GUARD PARA AUTENTICAR
    1. Toma el raw key del header "x-api-key"
    2. Calcula SHA-256
    3. Si no existe retorna null
    4. Si isRevoked retorna null
    5. Si expiresAt < now retorna null
    6. Si todo esta bien actualiza el lastUsedAt y devuelve el user
    */
  async validateApiKey(key: string): Promise<User | null> {
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: true },
    });

    if (!apiKey || apiKey.isRevoked) return null;
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

    this.prisma.apiKey
      .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    return apiKey.user;
  }

  // UTILS FUNCTIONS
  async updateRtHash(userId: string, rt: string): Promise<User> {
    const hash = this.hashData(rt);
    return await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        hashedRt: hash,
      },
    });
  }
  hashData(data: string) {
    const saltOrRounds = 10;
    return bcrypt.hashSync(data, saltOrRounds);
  }
  async getTokens(userId: string, email: string): Promise<Tokens> {
    // TODO: PONER EL SECRET EN UNA VARIABLE DE ENVIORNMENT
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: '1234secret',
          expiresIn: 60 * 15,
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: 'secret1234',
          expiresIn: 60 * 60 * 24 * 7,
        },
      ),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }
}
