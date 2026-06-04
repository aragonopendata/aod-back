'use strict';

/**
 * Middleware que sanea las URLs `/ckan/...` en las respuestas que `aod-back`
 * devuelve a sus clientes.
 *
 * Contexto: los endpoints de aod-back (`/aod/services/web/*` y
 * `/aod/services/admin/*`) llaman internamente a CKAN **a nivel de máquina**
 * (no salen a internet) y reenvían el cuerpo al cliente con `res.json(body)`.
 * Ese cuerpo puede contener URLs `/ckan/...` (recursos, descargas, RDF,
 * uploads, etc.) que NO deben exponerse públicamente. Este middleware
 * envuelve `res.json` y pasa el cuerpo por `util/ckan-url-rewriter` antes de
 * enviarlo.
 *
 * Notas:
 * - No se modifican las llamadas internas a CKAN (siguen yendo a la URL
 *   interna); solo se sanea lo que sale hacia el cliente.
 * - El rewriter cortocircuita si el cuerpo no contiene `/ckan`, así que el
 *   coste para respuestas que no son de CKAN es un único `indexOf`.
 * - `/ckan/webassets/` se preserva (regla del rewriter).
 * - Todos los endpoints CKAN de aod-back reenvían con `res.json(body)`
 *   (incluido `getDatasetRDF`, que pasa el XML como string), por lo que
 *   envolver `res.json` cubre el 100% de los casos sin tocar controllers.
 *
 * Se monta ANTES de los routers para que estos hereden el `res.json` envuelto.
 */

const rewriter = require('../util/ckan-url-rewriter');
const logger = require('../conf/logger');

/**
 * Construye las opciones del rewriter para una petición concreta, con un
 * callback que registra (a nivel debug) las URLs `/ckan/...` residuales que
 * no encajan en ninguna regla de reescritura.
 */
function buildResidualOpts(req) {
    return {
        onResidual: function (info) {
            logger.debug(
                'ckan-response-rewriter: residual /ckan/ en respuesta. ' +
                'path=' + (req.originalUrl || '?') +
                ' count=' + info.count +
                ' samples=' + JSON.stringify(info.samples)
            );
        },
    };
}

function ckanResponseRewriter(req, res, next) {
    const originalJson = res.json.bind(res);

    res.json = function (payload) {
        try {
            // Caso 1: cuerpo string (respuesta cruda de CKAN reenviada).
            if (typeof payload === 'string') {
                const out = rewriter.rewrite(payload, buildResidualOpts(req));
                return originalJson(out);
            }

            // Caso 2: objeto plano. Solo trabajamos si su serialización
            // contiene `/ckan` (evita coste en respuestas propias de aod-back).
            if (payload && typeof payload === 'object') {
                const serialized = JSON.stringify(payload);
                if (typeof serialized === 'string' && serialized.indexOf('/ckan') !== -1) {
                    const out = rewriter.rewrite(serialized, buildResidualOpts(req));
                    if (out !== serialized) {
                        return originalJson(JSON.parse(out));
                    }
                }
            }

            return originalJson(payload);
        } catch (e) {
            // Ante cualquier fallo, devolvemos el payload original sin reescribir
            // para no romper la respuesta al cliente.
            logger.error(
                'ckan-response-rewriter: error reescribiendo respuesta. ' +
                'path=' + (req.originalUrl || '?') +
                ' error=' + (e && e.message ? e.message : String(e))
            );
            return originalJson(payload);
        }
    };

    next();
}

module.exports = ckanResponseRewriter;
