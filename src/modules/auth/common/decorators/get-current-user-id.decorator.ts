import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetCurrentUserId = createParamDecorator(
  (context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest();
    return request.user['sub'];
  },
);
