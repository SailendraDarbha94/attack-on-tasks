export const ROLES = ['customer', 'store', 'admin'] as const;
export type Role = (typeof ROLES)[number];

/** Roles that have a home in the mobile app. Admin lives on the website. */
export const APP_ROLES = ['customer', 'store'] as const satisfies readonly Role[];
export type AppRole = (typeof APP_ROLES)[number];

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === 'string' && (APP_ROLES as readonly string[]).includes(value);
}
