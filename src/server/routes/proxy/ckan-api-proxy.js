'use strict';

/**
 * Reverse-proxy `/aod/api/*` -> `<CKAN backend>/ckan/api/*`.
 *
 * - Filtra peticiones según blocklist (ver `util/ckan-api-whitelist`, política allow-by-default).
 * - Reescribe las URLs `/ckan/...` que aparezcan en las respuestas JSON
 *   (ver `util/ckan-url-rewriter`) salvo `/ckan/webassets/`.
 * - Loguea cada petición con su veredicto y las URLs residuales con `/ckan/`
 *   no contempladas.
 *
 * Configuración via .env:
 *   CKAN_API_PROXY_TARGET            scheme + host[:port] del CKAN backend
 *   CKAN_API_PROXY_TARGET_PATH       prefijo a aplicar en target (default /ckan/api)
 *   CKAN_API_PROXY_LOG_LEVEL         silent|error|warn|info|debug (default info)
 */

const express = require('express');
const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');

const constants = require('../../util/constants');
const whitelist = require('../../util/ckan-api-whitelist');
const rewriter = require('../../util/ckan-url-rewriter');
const logger = require('../../conf/logger');

const router = express.Router();

/**
 * Extrae el nombre de la acción CKAN a partir del path de la petición
 * tras el montaje en `/aod/api`.
 *
 * Se aceptan dos formas de URL equivalentes:
 *   - /aod/api/3/action/<accion>   (con versión explícita, forma canónica CKAN)
 *   - /aod/api/action/<accion>     (sin versión, forma abreviada)
 *
 * Ejemplos:
 *   /3/action/package_show           -> 'package_show'
 *   /3/action/package_show?id=foo    -> 'package_show'
 *   /action/package_show             -> 'package_show'
 *   /action/package_show?id=foo      -> 'package_show'
 *   /3/action/                       -> ''
 *   /action/                         -> ''
 *   /                                -> ''
 *
 * @param {string} reqPath req.path tal cual lo da Express tras el mount.
 * @returns {string} Nombre de la acción o cadena vacía si no se reconoce.
 */
function extractAction(reqPath) {
    if (typeof reqPath !== 'string') {
        return '';
    }
    const m = reqPath.match(/^\/?(?:\d+\/)?action\/([^/?#]+)/);
    return m ? m[1] : '';
}

/**
 * Middleware de seguridad. Comprueba la whitelist antes de pasar al proxy.
 * Si la acción no está permitida, devuelve 403 sin contactar con CKAN.
 */
function actionGuard(req, res, next) {
    const action = extractAction(req.path);
    if (action.length === 0) {
        // No reconocemos la acción. Solo dejamos pasar peticiones a `/3/action/`
        // sin nombre cuando son la propia URL de descubrimiento (action_list/help_show)
        // — si alguien las invoca con nombre, se resolverán con allow-by-default. Aquí
        // denegamos por seguridad.
        logger.warning(
            'ckan-api-proxy: petición rechazada por path no reconocido. ' +
            'method=' + req.method + ' path=' + req.originalUrl + ' ip=' + (req.ip || 'unknown')
        );
        return res.status(404).json({
            success: false,
            error: { __type: 'Not Found Error', message: 'Endpoint no reconocido bajo /aod/api' },
        });
    }

    const verdict = whitelist.isAllowed(action);
    if (!verdict.allowed) {
        logger.warning(
            'ckan-api-proxy: acción denegada. action=' + action +
            ' reason=' + verdict.reason +
            ' method=' + req.method +
            ' ip=' + (req.ip || 'unknown')
        );
        return res.status(403).json({
            success: false,
            error: {
                __type: 'Authorization Error',
                message: 'La acción "' + action + '" no está expuesta a través de /aod/api',
            },
        });
    }

    // Marcamos la acción en req para los hooks del proxy.
    req.ckanAction = action;
    return next();
}

/**
 * Construye el middleware de proxy reusando la config global.
 * Se construye una sola vez al cargar el módulo.
 */
function buildProxy() {
    const target = constants.CKAN_API_PROXY_TARGET;
    if (!target) {
        // Fallback "loud": el proxy no debe quedarse silenciosamente sin target.
        logger.error(
            'ckan-api-proxy: CKAN_API_PROXY_TARGET no configurado. ' +
            'El proxy /aod/api responderá 503 hasta que se configure el .env.'
        );
        return function unconfigured(req, res) {
            return res.status(503).json({
                success: false,
                error: {
                    __type: 'Configuration Error',
                    message: 'CKAN_API_PROXY_TARGET no configurado en el servidor',
                },
            });
        };
    }

    const targetPath = (constants.CKAN_API_PROXY_TARGET_PATH || '/ckan/api').replace(/\/+$/, '');
    const mountPath = (constants.CKAN_API_PROXY_MOUNT_PATH || '/aod/api').replace(/\/+$/, '');

    // Reescribimos /aod/api/<rest> -> <targetPath>/<rest>. http-proxy-middleware
    // recibe en `path` la URL completa (incluyendo el prefijo de montaje), así
    // que stripeamos `mountPath` antes de prefijar `targetPath`.
    const pathRewriteRules = {};
    pathRewriteRules['^' + mountPath] = targetPath;

    return createProxyMiddleware({
        target: target,
        changeOrigin: true,
        pathRewrite: pathRewriteRules,
        // Necesario para que onProxyRes pueda leer el body completo y reescribirlo.
        selfHandleResponse: true,
        onProxyReq: function (proxyReq, req) {
            const start = Date.now();
            req._proxyStartTs = start;
            logger.debug(
                'ckan-api-proxy: -> upstream. action=' + (req.ckanAction || '?') +
                ' method=' + req.method +
                ' path=' + req.originalUrl
            );
        },
        onProxyRes: responseInterceptor(async function (responseBuffer, proxyRes, req, res) {
            const elapsed = Date.now() - (req._proxyStartTs || Date.now());
            const contentType = proxyRes.headers['content-type'] || '';
            const action = req.ckanAction || extractAction(req.path) || '?';

            // Solo reescribimos cuerpos textuales (JSON/HTML/text). Para
            // binarios devolvemos el buffer tal cual.
            const isTextual =
                contentType.includes('json') ||
                contentType.includes('text') ||
                contentType.includes('xml');

            if (!isTextual) {
                logger.info(
                    'ckan-api-proxy: <- upstream. action=' + action +
                    ' status=' + proxyRes.statusCode +
                    ' bytes=' + responseBuffer.length +
                    ' ms=' + elapsed +
                    ' content-type=' + contentType +
                    ' rewritten=no'
                );
                return responseBuffer;
            }

            const original = responseBuffer.toString('utf8');
            const rewritten = rewriter.rewrite(original, {
                onResidual: function (info) {
                    logger.warning(
                        'ckan-api-proxy: residual /ckan/ detectado en respuesta. ' +
                        'action=' + action +
                        ' count=' + info.count +
                        ' samples=' + JSON.stringify(info.samples)
                    );
                },
            });

            logger.info(
                'ckan-api-proxy: <- upstream. action=' + action +
                ' status=' + proxyRes.statusCode +
                ' bytes=' + responseBuffer.length +
                ' ms=' + elapsed +
                ' rewritten=' + (rewritten === original ? 'no' : 'yes')
            );

            return rewritten;
        }),
        onError: function (err, req, res) {
            logger.error(
                'ckan-api-proxy: error de conexión con upstream. ' +
                'action=' + (req.ckanAction || '?') +
                ' message=' + (err && err.message ? err.message : String(err))
            );
            if (!res.headersSent) {
                res.status(502).json({
                    success: false,
                    error: { __type: 'Bad Gateway', message: 'No se pudo contactar con el backend CKAN' },
                });
            }
        },
        // Alineamos el log del proxy con LOG_LEVEL del proyecto, mapeando
        // los niveles de http-proxy-middleware (silent|error|warn|info|debug).
        logLevel: constants.CKAN_API_PROXY_LOG_LEVEL || 'info',
    });
}

const proxy = buildProxy();

router.use(actionGuard, proxy);

module.exports = router;
