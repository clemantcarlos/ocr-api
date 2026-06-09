import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface RequestWithUser {
  user: { sub: string };
}

export const GetCurrentUserId = createParamDecorator(
  (context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    return request.user.sub;
  },
);
