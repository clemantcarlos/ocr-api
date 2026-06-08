import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../common/types/payload';

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  // TODO: PASAR EL SECRET A UN ENV
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'secret1234',
      passReqToCallback: true,
    });
  }
  validate(
    req: Request,
    payload: JwtPayload,
  ): JwtPayload & { refreshToken: string } {
    const refreshToken = req
      .get('authorization')
      ?.replace('Bearer ', '')
      .trim();
    return {
      ...payload,
      refreshToken: refreshToken ?? '',
    };
  }
}
