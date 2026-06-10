'use strict';

/**
 * Blocklist de acciones de la API CKAN expuestas a través del proxy /aod/api.
 *
 * Política: allow-by-default.
 * Una acción se permite si NO coincide con ninguno de los patrones de
 * BLOCKED_ACTIONS_PATTERNS. No hay whitelist: cualquier acción de lectura
 * de CKAN pasa automáticamente sin necesidad de declararla.
 *
 * Las acciones de escritura (create/update/delete/purge) se mantienen
 * accesibles SOLO desde las rutas internas /aod/services/admin/* con
 * verifyToken; están cubiertas por los patrones de bloqueo.
 */

/**
 * Patrones de acciones explícitamente bloqueadas. Cualquier coincidencia
 * devuelve 403. El resto de acciones pasan (allow-by-default).
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
    // 2. Allow-by-default
    return { allowed: true, reason: 'allow_by_default' };
}

module.exports = {
    BLOCKED_ACTIONS_PATTERNS,
    isAllowed,
};
