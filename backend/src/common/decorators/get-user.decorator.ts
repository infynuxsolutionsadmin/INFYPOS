import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../../modules/auth/strategies/jwt.strategy';

interface CustomRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * @GetUser() — extracts the full authenticated user object from req.user.
 * @GetUser('tenantId') — extracts a specific field (e.g. 'tenantId', 'id', 'roleRank').
 *
 * Populated by JwtStrategy.validate() on every authenticated request.
 *
 * Available fields: id, email, tenantId, roleId, roleRank, roleName, permissions[]
 */
export const GetUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<CustomRequest>();
    const user = request.user;

    if (!user) return null;
    return data ? user[data] : user;
  },
);
