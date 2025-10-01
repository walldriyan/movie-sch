export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  USER_ADMIN: 'USER_ADMIN',
  USER: 'USER',
};

export const PERMISSIONS = {
  // User permissions
  'user.create': 'user.create',
  'user.read': 'user.read',
  'user.update': 'user.update',
  'user.delete': 'user.delete',

  // Post (Movie) permissions
  'post.create': 'post.create',
  'post.read': 'post.read',
  'post.update': 'post.update',
  'post.delete': 'post.delete', // Soft delete for admins
  'post.hard_delete': 'post.hard_delete', // Permanent delete for super admins
  'post.approve_deletion': 'post.approve_deletion', // View posts pending deletion
};

export const permissions: Record<string, string[]> = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS), // Super admin gets all permissions
  [ROLES.USER_ADMIN]: [
    PERMISSIONS['post.create'],
    PERMISSIONS['post.read'],
    PERMISSIONS['post.update'],
    PERMISSIONS['post.delete'], // Can only soft-delete
    PERMISSIONS['post.approve_deletion'],
  ],
  [ROLES.USER]: [
    PERMISSIONS['post.read'], // Can only read public posts
  ],
};
