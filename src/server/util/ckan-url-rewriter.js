'use strict';

/**
 * Reescribe URLs `/ckan/...` en respuestas (JSON, HTML o texto plano) que
 * `aod-back` recibe del backend CKAN, sustituyéndolas por sus equivalentes
 * públicos servidos por aod-front + Apache.
 *
 * Diseñado para ejecutarse desde `routes/proxy/ckan-api-proxy.js` sobre el
 * cuerpo de la respuesta antes de devolverla al cliente.
 *
 * Reglas (orden estricto, las más específicas primero):
 *   1. /ckan/webassets/                          → PRESERVADO (no se reescribe).
 *   2. /ckan/dataset/<id>/resource/<id>/download → /datos/catalogo/dataset/<id>/recurso/<id>/descarga
 *   3. /ckan/dataset/<id>/resource/<id>/view     → /datos/catalogo/dataset/<id>/recurso/<id>/vistaprevia
 *   4. /ckan/dataset/<id>.rdf                    → /datos/catalogo/dataset/<id>.rdf
 *   5. /ckan/api/                                → /aod/api/
 *   6. /ckan/uploads/                            → /catalogo/uploads/
 *
 * Cualquier `/ckan/<algo>` que sobreviva a las reglas 2-6 se considera RESIDUAL
 * y, si se proporciona `opts.onResidual`, se invoca con `{ count, samples }`
 * para que el caller lo registre en logs. Los residuos NO se modifican
 * (se devuelven tal cual) para no romper consumidores hasta que se cataloguen.
 *
 * Mapeo confirmado con producto el 29/05/2026.
 */

/**
 * Placeholder usado para "esconder" /ckan/webassets/ mientras se aplican
 * las reglas 2-6 y luego restaurarlo intacto.
 *
 * Usamos caracteres de control U+0001 (Start Of Heading): no aparecen
 * literalmente en JSON ni HTML válidos (van escapados como `\u0001`),
 * por lo que es imposible que un body legítimo contenga este placeholder
 * ni colisione con otra regla.
 */
const WEBASSETS_PLACEHOLDER = '\u0001\u0001AOD_CKAN_WEBASSETS\u0001\u0001';

/**
 * Reglas de reescritura. El orden importa: las más específicas
 * (download/view/rdf) deben ejecutarse antes que las genéricas.
 */
const REWRITE_RULES = Object.freeze([
    Object.freeze({
        name: 'download',
        pattern: /\/ckan\/dataset\/([^/]+)\/resource\/([^/]+)\/download\//g,
        replacement: '/datos/catalogo/dataset/$1/recurso/$2/descarga/',
    }),
    Object.freeze({
        name: 'view',
        pattern: /\/ckan\/dataset\/([^/]+)\/resource\/([^/]+)\/view\//g,
        replacement: '/datos/catalogo/dataset/$1/recurso/$2/vistaprevia/',
    }),
    Object.freeze({
        name: 'rdf',
        pattern: /\/ckan\/dataset\/([^/]+)\.rdf/g,
        replacement: '/datos/catalogo/dataset/$1.rdf',
    }),
    Object.freeze({
        name: 'api',
        pattern: /\/ckan\/api\//g,
        replacement: '/aod/api/',
    }),
    Object.freeze({
        name: 'uploads',
        pattern: /\/ckan\/uploads\//g,
        replacement: '/catalogo/uploads/',
    }),
]);

/** Pattern para localizar /ckan/webassets/ y reservarlo con un placeholder. */
const WEBASSETS_PATTERN = /\/ckan\/webassets\//g;

/**
 * Pattern para detectar residuos `/ckan/<algo>` después de aplicar las
 * reglas. Acota el match hasta el siguiente delimitador típico en JSON
 * (`"`, espacio, coma, paréntesis, llave/corchete de cierre, fin de línea).
 */
const RESIDUAL_PATTERN = /\/ckan\/[^"'\s,)\]}<>]+/g;

/** Cuántas muestras únicas de residuos se reportan al callback. */
const RESIDUAL_SAMPLE_LIMIT = 5;

/**
 * Aplica las reglas de reescritura sobre `input`.
 *
 * @param {string} input Cuerpo de respuesta (típicamente JSON serializado).
 * @param {object} [opts]
 * @param {(info: { count: number, samples: string[] }) => void} [opts.onResidual]
 *   Callback opcional invocado si tras aplicar las reglas siguen apareciendo
 *   ocurrencias de `/ckan/...` no contempladas.
 * @returns {string} Body con las URLs reescritas. Si `input` no es string
 *   o no contiene la cadena `/ckan`, se devuelve tal cual sin coste extra.
 */
function rewrite(input, opts) {
    if (typeof input !== 'string' || input.length === 0) {
        return input;
    }
    // Cortocircuito: si el body no contiene siquiera la subcadena '/ckan',
    // no hace falta correr las regex.
    if (input.indexOf('/ckan') === -1) {
        return input;
    }

    // 1. Reservamos /ckan/webassets/ para que las reglas 2-6 no lo toquen
    //    y el detector de residuos no lo señale.
    let out = input.replace(WEBASSETS_PATTERN, WEBASSETS_PLACEHOLDER);

    // 2. Aplicamos las 5 reglas en el orden definido.
    for (const rule of REWRITE_RULES) {
        out = out.replace(rule.pattern, rule.replacement);
    }

    // 3. Detectamos residuos *antes* de restaurar webassets (para que el
    //    placeholder no se mezcle con el match).
    if (opts && typeof opts.onResidual === 'function') {
        const matches = out.match(RESIDUAL_PATTERN);
        if (matches && matches.length > 0) {
            const seen = new Set();
            const samples = [];
            for (const m of matches) {
                if (seen.has(m)) {
                    continue;
                }
                seen.add(m);
                samples.push(m);
                if (samples.length >= RESIDUAL_SAMPLE_LIMIT) {
                    break;
                }
            }
            opts.onResidual({ count: matches.length, samples: samples });
        }
    }

    // 4. Restauramos /ckan/webassets/ desde el placeholder.
    if (out.indexOf(WEBASSETS_PLACEHOLDER) !== -1) {
        out = out.split(WEBASSETS_PLACEHOLDER).join('/ckan/webassets/');
    }

    return out;
}

module.exports = {
    rewrite,
    REWRITE_RULES,
    WEBASSETS_PLACEHOLDER,
};
