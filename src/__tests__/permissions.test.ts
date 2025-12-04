import { ROLES, PERMISSIONS, permissions, hasPermission, MovieStatus } from '../lib/permissions';

describe('Permissions Module', () => {
    describe('ROLES', () => {
        it('should define all required roles', () => {
            expect(ROLES.SUPER_ADMIN).toBe('SUPER_ADMIN');
            expect(ROLES.USER_ADMIN).toBe('USER_ADMIN');
            expect(ROLES.USER).toBe('USER');
            expect(ROLES.GUEST).toBe('GUEST');
        });
    });

    describe('PERMISSIONS', () => {
        it('should define post-related permissions', () => {
            expect(PERMISSIONS['post.create']).toBe('post.create');
            expect(PERMISSIONS['post.edit']).toBe('post.edit');
            expect(PERMISSIONS['post.delete']).toBe('post.delete');
            expect(PERMISSIONS['post.approve']).toBe('post.approve');
        });

        it('should define user-related permissions', () => {
            expect(PERMISSIONS['user.view_all']).toBe('user.view_all');
            expect(PERMISSIONS['user.edit']).toBe('user.edit');
        });
    });

    describe('Role Permissions', () => {
        it('SUPER_ADMIN should have all permissions', () => {
            const superAdminPerms = permissions[ROLES.SUPER_ADMIN];
            expect(superAdminPerms).toContain(PERMISSIONS['post.create']);
            expect(superAdminPerms).toContain(PERMISSIONS['post.approve']);
            expect(superAdminPerms).toContain(PERMISSIONS['user.view_all']);
        });

        it('USER should have limited permissions', () => {
            const userPerms = permissions[ROLES.USER];
            expect(userPerms).toContain(PERMISSIONS['post.create']);
            expect(userPerms).not.toContain(PERMISSIONS['post.approve']);
            expect(userPerms).not.toContain(PERMISSIONS['user.view_all']);
        });

        it('GUEST should have minimal permissions', () => {
            const guestPerms = permissions[ROLES.GUEST];
            expect(guestPerms).not.toContain(PERMISSIONS['post.create']);
            expect(guestPerms).not.toContain(PERMISSIONS['post.approve']);
        });
    });

    describe('hasPermission', () => {
        it('should return true when user has permission', () => {
            expect(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS['post.approve'])).toBe(true);
        });

        it('should return false when user lacks permission', () => {
            expect(hasPermission(ROLES.USER, PERMISSIONS['post.approve'])).toBe(false);
        });

        it('should return false for undefined role', () => {
            expect(hasPermission(undefined as any, PERMISSIONS['post.create'])).toBe(false);
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
