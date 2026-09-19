import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (authHeader) {
      const [scheme, token] = authHeader.split(' ');
      if (scheme === 'Bearer' && token) {
        try {
          request.userId = this.authService.verifyToken(token);
        } catch {
          // Ignore invalid optional auth
        }
      }
    }

    return true;
  }
}
