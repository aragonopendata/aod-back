'use strict';

/**
 * Blocklist de acciones de la API CKAN expuestas a través del proxy /aod/api.
 *
 * Política: allow-by-default.
 * Los patrones de bloqueo se configuran mediante la variable de entorno
 * CKAN_API_PROXY_BLOCKED_PATTERNS (patrones separados por comas).
 * Si la variable está vacía o no se define, la blocklist queda vacía
 * y todas las peticiones pasan al proxy sin restricción.
 *
 * Ejemplo de valor en .env:
 *   CKAN_API_PROXY_BLOCKED_PATTERNS='^.*_create$,^.*_delete$,^.*_update$'
 */

const constants = require('./constants');

/** Caché de los patrones compilados */
let _cache = null;

/**
 * Parsea CKAN_API_PROXY_BLOCKED_PATTERNS (patrones separados por comas) y devuelve un array de RegExp.
 * Entradas vacías o inválidas se ignoran con un aviso en stderr.
 */
function getBlockedPatterns() {
    if (_cache) return _cache;
    const raw = constants.CKAN_API_PROXY_BLOCKED_PATTERNS || '';
    _cache = raw.split(',').flatMap((s) => {
        s = s.trim();
        if (!s) return [];
        try { return [new RegExp(s)]; }
        catch (e) { process.stderr.write('ckan-api-whitelist: patrón inválido ignorado: ' + s + '\n'); return []; }
    });
    return _cache;
}

/**
 * Permite resetear la caché (útil tras un reload o en tests).
 */
function resetCache() {
    _cache = null;
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
    for (const re of getBlockedPatterns()) {
        if (re.test(action)) {
            return { allowed: false, reason: 'blocked_pattern:' + re.toString() };
        }
    }
    return { allowed: true, reason: 'allow_by_default' };
}

module.exports = {
    getBlockedPatterns,
    resetCache,
    isAllowed,
};
