import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * NestJS Guard for protecting endpoints with Passport JWT strategy
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  /**
   * Handles request post-Passport strategy verification.
   * Throws UnauthorizedException if user authentication fails or token is missing/invalid.
   */
  override handleRequest<TUser = unknown>(err: unknown, user: TUser): TUser {
    if (err || !user) {
      throw (
        (err as Error) ||
        new UnauthorizedException(
          'Access denied. Valid JWT Bearer token required.',
        )
      );
    }
    return user;
  }
}
