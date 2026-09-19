import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

/** Reads the userId attached by `JwtAuthGuard` or `OptionalAuthGuard`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<{ userId?: string }>();
    return request.userId;
  },
);
