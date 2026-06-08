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
// dto
import { AuthDto } from './dto/auth.dto';
import { CreateUserDto } from 'src/modules/user/dto/user.dto';
// TYPES
import type { User } from '@prisma/client';
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
