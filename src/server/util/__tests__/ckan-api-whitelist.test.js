'use strict';

const whitelist = require('../ckan-api-whitelist');

describe('ckan-api-whitelist', () => {
    describe('isAllowed', () => {
        test('permite acciones de lectura comunes (allow-by-default)', () => {
            const reads = [
                'package_search',
                'package_show',
                'package_autocomplete',
                'organization_show',
                'organization_list',
                'group_list',
                'group_show',
                'tag_list',
                'tag_show',
                'resource_show',
                'user_show',
                'help_show',
                'status_show',
                'site_read',
                'action_list',
            ];
            for (const action of reads) {
                const v = whitelist.isAllowed(action);
                expect(v).toEqual({ allowed: true, reason: 'allow_by_default' });
            }
        });

        test('deniega acciones de escritura aunque tengan estructura razonable', () => {
            const writes = [
                'package_create',
                'package_update',
                'package_delete',
                'package_patch',
                'dataset_purge',
                'resource_create',
                'resource_update',
                'resource_delete',
                'organization_create',
                'organization_update',
                'organization_purge',
                'organization_member_create',
                'organization_member_delete',
                'group_member_create',
                'user_create',
                'user_update',
                'user_delete',
                'api_token_create',
                'api_token_revoke',
                'config_option_update',
                'package_revert',
                'follow_user',
            ];
            for (const action of writes) {
                const v = whitelist.isAllowed(action);
                expect(v.allowed).toBe(false);
                expect(v.reason).toMatch(/^blocked_pattern:/);
            }
        });

        test('permite acciones desconocidas (allow-by-default)', () => {
            const v = whitelist.isAllowed('something_invented_that_does_not_exist');
            expect(v).toEqual({ allowed: true, reason: 'allow_by_default' });
        });

        test('deniega cadena vacía o no string', () => {
            expect(whitelist.isAllowed('').allowed).toBe(false);
            expect(whitelist.isAllowed(null).allowed).toBe(false);
            expect(whitelist.isAllowed(undefined).allowed).toBe(false);
            expect(whitelist.isAllowed(42).allowed).toBe(false);
        });

        test('user_show está permitido pero el resto de user_* no', () => {
            expect(whitelist.isAllowed('user_show').allowed).toBe(true);
            expect(whitelist.isAllowed('user_list').allowed).toBe(false);
            expect(whitelist.isAllowed('user_create').allowed).toBe(false);
            expect(whitelist.isAllowed('user_update').allowed).toBe(false);
            expect(whitelist.isAllowed('user_delete').allowed).toBe(false);
        });

    });
});
