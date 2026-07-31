import { SetMetadata } from '@nestjs/common';

/** Metadata key used by PermissionsGuard to read required permissions */
export const PERMISSIONS_KEY = 'permissions';

/**
 * @Permissions decorator — clean syntax for specifying required permission codes.
 * Works in conjunction with PermissionsGuard.
 *
 * Example:
 *   @Permissions('users:create', 'users:read')
 *
 * Multiple permissions = all must be present (AND logic).
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * @RequirePermissions — alias of @Permissions for backward compatibility.
 * Existing usages of RequirePermissions continue working unchanged.
 */
export const RequirePermissions = Permissions;
