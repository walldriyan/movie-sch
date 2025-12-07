import { ROLES, PERMISSIONS, permissions, hasPermission, MovieStatus } from '../lib/permissions';

describe('Permissions Module', () => {
    describe('ROLES', () => {
        it('should define all required roles', () => {
            expect(ROLES.SUPER_ADMIN).toBe('SUPER_ADMIN');
            expect(ROLES.USER_ADMIN).toBe('USER_ADMIN');
            expect(ROLES.USER).toBe('USER');
        });
    });

    describe('PERMISSIONS', () => {
        it('should define post-related permissions', () => {
            expect(PERMISSIONS['post.create']).toBe('post.create');
            expect(PERMISSIONS['post.update']).toBe('post.update');
            expect(PERMISSIONS['post.delete']).toBe('post.delete');
            expect(PERMISSIONS['post.change_status']).toBe('post.change_status');
        });

        it('should define user-related permissions', () => {
            expect(PERMISSIONS['user.create']).toBe('user.create');
            expect(PERMISSIONS['user.read']).toBe('user.read');
            expect(PERMISSIONS['user.update']).toBe('user.update');
            expect(PERMISSIONS['user.delete']).toBe('user.delete');
        });
    });

    describe('Role Permissions', () => {
        it('SUPER_ADMIN should have all permissions', () => {
            const superAdminPerms = permissions[ROLES.SUPER_ADMIN];
            expect(superAdminPerms).toContain(PERMISSIONS['post.create']);
            expect(superAdminPerms).toContain(PERMISSIONS['post.change_status']);
            expect(superAdminPerms).toContain(PERMISSIONS['user.create']);
            expect(superAdminPerms).toContain(PERMISSIONS['post.hard_delete']);
        });

        it('USER_ADMIN should have post management permissions', () => {
            const userAdminPerms = permissions[ROLES.USER_ADMIN];
            expect(userAdminPerms).toContain(PERMISSIONS['post.create']);
            expect(userAdminPerms).toContain(PERMISSIONS['post.change_status']);
            expect(userAdminPerms).not.toContain(PERMISSIONS['user.create']);
        });

        it('USER should have limited permissions', () => {
            const userPerms = permissions[ROLES.USER];
            expect(userPerms).toContain(PERMISSIONS['post.read']);
            expect(userPerms).not.toContain(PERMISSIONS['post.create']);
            expect(userPerms).not.toContain(PERMISSIONS['post.change_status']);
        });
    });

    describe('hasPermission', () => {
        it('should return true when user has permission', () => {
            expect(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS['post.change_status'])).toBe(true);
        });

        it('should return false when user lacks permission', () => {
            expect(hasPermission(ROLES.USER, PERMISSIONS['post.change_status'])).toBe(false);
        });

        it('should return false for undefined role', () => {
            expect(hasPermission(undefined as unknown as string, PERMISSIONS['post.create'])).toBe(false);
        });
    });

    describe('MovieStatus', () => {
        it('should define all movie statuses', () => {
            expect(MovieStatus.DRAFT).toBe('DRAFT');
            expect(MovieStatus.PENDING_APPROVAL).toBe('PENDING_APPROVAL');
            expect(MovieStatus.PUBLISHED).toBe('PUBLISHED');
            expect(MovieStatus.PENDING_DELETION).toBe('PENDING_DELETION');
        });
    });
});
