'use strict';

/**
 * Whitelist y blacklist de acciones de la API CKAN expuestas a través
 * del proxy /aod/api.
 *
 * Política: deny-by-default.
 * Una acción se permite si y solo si:
 *   - Está en READ_ACTIONS o en EXTRA_ALLOWED_ACTIONS (configurable por .env)
 *   - Y NO coincide con ninguno de los patrones de BLOCKED_ACTIONS_PATTERNS.
 *
 * Las acciones de escritura (create/update/delete/purge) se mantienen
 * accesibles SOLO desde las rutas internas /aod/services/admin/* con
 * verifyToken; no deben estar en esta whitelist pública.
 */

const constants = require('./constants');

/**
 * Acciones de lectura permitidas. Confirmadas con el inventario de Fase 1
 * (`eliminar-endpoints/aod-back/inventario-ckan.md`) como las que aod-back
 * y los consumidores externos del portal usan habitualmente.
 */
const READ_ACTIONS = Object.freeze([
    // Datasets / paquetes
    'package_search',
    'package_show',
    'package_list',
    'package_autocomplete',
    'current_package_list_with_resources',

    // Recursos
    'resource_search',
    'resource_show',
    'resource_view_list',
    'resource_view_show',

    // Organizaciones
    'organization_show',
    'organization_list',
    'organization_list_for_user',
    'organization_show_packages',

    // Grupos / topics
    'group_show',
    'group_list',
    'group_show_packages',

    // Tags
    'tag_show',
    'tag_list',
    'tag_autocomplete',

    // Usuarios — solo show (los demás user_* se bloquean abajo)
    'user_show',

    // Sistema y ayuda
    'license_list',
    'status_show',
    'site_read',
    'help_show',
    'action_list',
]);

/**
 * Patrones de acciones explícitamente bloqueadas. Cualquier coincidencia
 * devuelve 403 incluso si por error se hubiera añadido a READ_ACTIONS o a
 * EXTRA_ALLOWED_ACTIONS por configuración.
 */
const BLOCKED_ACTIONS_PATTERNS = Object.freeze([
    /^.*_create$/,
    /^.*_update$/,
    /^.*_delete$/,
    /^.*_patch$/,
    /^.*_purge$/,
    /^.*_revert$/,
    /^follow_.*$/,
    /^unfollow_.*$/,
    // user_* completo excepto user_show (gestionado en isAllowed por orden)
    /^user_(?!show$).*$/,
    /^api_token_.*$/,
    /^config_option_.*$/,
    /^dashboard_.*$/,
    /^job_.*$/,
    /^datastore_.*$/,
]);

/** Caché del CSV parseado de EXTRA_ALLOWED_ACTIONS */
let extraAllowedCache = null;

function getExtraAllowedActions() {
    if (extraAllowedCache !== null) {
        return extraAllowedCache;
    }
    const csv = constants.CKAN_API_PROXY_EXTRA_ALLOWED_ACTIONS || '';
    extraAllowedCache = csv
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    return extraAllowedCache;
}

/**
 * Devuelve { allowed: boolean, reason: string } indicando si la acción
 * puede atravesar el proxy.
 *
 * @param {string} action Nombre de la acción CKAN, sin prefijo (e.g. 'package_show').
 */
function isAllowed(action) {
    if (typeof action !== 'string' || action.length === 0) {
        return { allowed: false, reason: 'empty_action' };
    }
    // 1. Bloqueo explícito por patrón
    for (const re of BLOCKED_ACTIONS_PATTERNS) {
        if (re.test(action)) {
            return { allowed: false, reason: 'blocked_pattern:' + re.toString() };
        }
    }
    // 2. Whitelist principal
    if (READ_ACTIONS.includes(action)) {
        return { allowed: true, reason: 'read_actions' };
    }
    // 3. Whitelist extra desde .env
    const extra = getExtraAllowedActions();
    if (extra.includes(action)) {
        return { allowed: true, reason: 'extra_allowed' };
    }
    // 4. Deny-by-default
    return { allowed: false, reason: 'not_in_whitelist' };
}

/**
 * Permite resetear la caché de extras (útil en tests o tras un reload).
 */
function resetCache() {
    extraAllowedCache = null;
}

module.exports = {
    READ_ACTIONS,
    BLOCKED_ACTIONS_PATTERNS,
    isAllowed,
    getExtraAllowedActions,
    resetCache,
};
