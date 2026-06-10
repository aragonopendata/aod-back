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
 * Extrae todos los segmentos del path que tengan forma de nombre de acción
 * CKAN (sólo letras minúsculas y guiones bajos, e.g. 'package_create').
 * Se comprueban todos los segmentos para cubrir tanto /action/<accion>
 * como cualquier otra forma en que CKAN pueda recibir el nombre de acción.
 *
 * @param {string} reqPath req.path tal cual lo da Express tras el mount.
 * @returns {string[]} Lista de segmentos que parecen nombres de acción.
 */
function extractActionSegments(reqPath) {
    if (typeof reqPath !== 'string') {
        return [];
    }
    return reqPath.split('/').filter((s) => /^[a-z][a-z0-9_]+$/.test(s));
}

/**
 * Middleware de seguridad.
 * Comprueba todos los segmentos del path contra la blocklist.
 * Si alguno coincide con una acción bloqueada, devuelve 403.
 * Cualquier path que no contenga segmentos bloqueados pasa al proxy.
 */
function actionGuard(req, res, next) {
    const segments = extractActionSegments(req.path);

    for (const segment of segments) {
        const verdict = whitelist.isAllowed(segment);
        if (!verdict.allowed) {
            logger.warning(
                'ckan-api-proxy: acción denegada. action=' + segment +
                ' reason=' + verdict.reason +
                ' method=' + req.method +
                ' ip=' + (req.ip || 'unknown')
            );
            return res.status(403).json({
                success: false,
                error: {
                    __type: 'Authorization Error',
                    message: 'La acción "' + segment + '" no está expuesta a través de /aod/api',
                },
            });
        }
    }

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
                'ckan-api-proxy: -> upstream.' +
                ' method=' + req.method +
                ' path=' + req.originalUrl
            );
        },
        onProxyRes: responseInterceptor(async function (responseBuffer, proxyRes, req, res) {
            const elapsed = Date.now() - (req._proxyStartTs || Date.now());
            const contentType = proxyRes.headers['content-type'] || '';
            const path = req.originalUrl || '?';

            // Solo reescribimos cuerpos textuales (JSON/HTML/text). Para
            // binarios devolvemos el buffer tal cual.
            const isTextual =
                contentType.includes('json') ||
                contentType.includes('text') ||
                contentType.includes('xml');

            if (!isTextual) {
                logger.info(
                    'ckan-api-proxy: <- upstream.' +
                    ' path=' + path +
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
                        'path=' + path +
                        ' count=' + info.count +
                        ' samples=' + JSON.stringify(info.samples)
                    );
                },
            });

            logger.info(
                'ckan-api-proxy: <- upstream.' +
                ' path=' + path +
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
                'path=' + (req.originalUrl || '?') +
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
