import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
// services
import { AuthService } from './auth.service';
// dto
import { AuthDto } from './dto/auth.dto';
import { CreateUserDto } from 'src/modules/user/dto/user.dto';
// guards
import { RtGuard } from './common/guards/rt.guard';
// decorators
import { GetCurrentUser } from './common/decorators/get-current-user.decorator';
import { Public } from './common/decorators/public.decorator';
// types
import { UserWithTokens } from './types/userWithTokens';
import { Tokens } from './types/tokens.type';
import { ResponseDto } from '@/interfaces/getResponse';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('local/signup')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe())
  signupLocal(
    @Body() user: CreateUserDto,
  ): Promise<ResponseDto<UserWithTokens>> {
    return this.authService.signupLocal(user);
  }

  @Public()
  @Post('local/signin')
  @HttpCode(HttpStatus.OK)
  signinLocal(@Body() dto: AuthDto): Promise<ResponseDto<UserWithTokens>> {
    return this.authService.signinLocal(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@GetCurrentUser('sub') userId: string) {
    return this.authService.logout(userId);
  }

  @Public()
  @UseGuards(RtGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @GetCurrentUser('sub') userId: string,
    @GetCurrentUser('refreshToken') rt: string,
  ): Promise<ResponseDto<Tokens>> {
    return this.authService.refreshTokens(userId, rt);
  }
}
