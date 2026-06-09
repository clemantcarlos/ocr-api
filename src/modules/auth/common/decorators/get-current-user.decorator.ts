import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface RequestWithUser {
  user: Record<string, unknown>;
}

export const GetCurrentUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (!data) return request.user;
    return request.user[data];
  },
);
