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
  'post.approve_deletion': 'post.approve_deletion',
};

export const permissions = {
  [ROLES.SUPER_ADMIN]: [
    PERMISSIONS['user.create'],
    PERMISSIONS['user.read'],
    PERMISSIONS['user.update'],
    PERMISSIONS['user.delete'],
    PERMISSIONS['post.create'],
    PERMISSIONS['post.read'],
    PERMISSIONS['post.update'],
    PERMISSIONS['post.delete'],
    PERMISSIONS['post.hard_delete'],
    PERMISSIONS['post.approve_deletion'],
  ],
  [ROLES.USER_ADMIN]: [
    PERMISSIONS['post.create'],
    PERMISSIONS['post.read'],
    PERMISSIONS['post.update'],
    PERMISSIONS['post.delete'], // Can only soft-delete
  ],
  [ROLES.USER]: [
    PERMISSIONS['post.read'], // Can only read public posts
  ],
};
