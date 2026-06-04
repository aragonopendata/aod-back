'use strict';

/**
 * Tests de integración del proxy `/aod/api` con un backend CKAN simulado.
 *
 * Levantamos:
 *   - Un servidor HTTP "upstream" en un puerto efímero que actúa como CKAN.
 *   - Una app Express con el proxy montado en /aod/api.
 *
 * NOTA: el logger del proyecto intenta escribir en /app/logs por defecto;
 * lo redirigimos a un directorio temporal con APP_LOG_PATH antes de
 * require()-ear cualquier módulo de la app.
 */

const path = require('path');
const os = require('os');
const fs = require('fs');
const http = require('http');

const tmpLog = fs.mkdtempSync(path.join(os.tmpdir(), 'aod-back-test-logs-'));
process.env.APP_LOG_PATH = tmpLog;

let upstream;
let upstreamPort;
let upstreamRequests;

beforeAll((done) => {
    upstreamRequests = [];

    upstream = http.createServer((req, res) => {
        upstreamRequests.push({ url: req.url, method: req.method, headers: req.headers });

        // Simulamos varios endpoints según el path.
        if (req.url.startsWith('/ckan/api/3/action/package_show')) {
            res.writeHead(200, { 'content-type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                result: {
                    name: 'demo-dataset',
                    resources: [
                        { url: 'https://opendata.aragon.es/ckan/dataset/demo/resource/r1/download/data.csv' },
                    ],
                    rdf_url: 'https://opendata.aragon.es/ckan/dataset/demo.rdf',
                    image_display_url: 'https://opendata.aragon.es/ckan/uploads/group/logo.png',
                    api: 'https://opendata.aragon.es/ckan/api/3/action/package_show?id=demo',
                    webasset: '/ckan/webassets/main.js',
                },
            }));
            return;
        }
        if (req.url.startsWith('/ckan/api/3/action/status_show')) {
            res.writeHead(200, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ success: true, result: { site_title: 'AOD' } }));
            return;
        }
        if (req.url.startsWith('/ckan/api/3/action/binary_endpoint')) {
            res.writeHead(200, { 'content-type': 'application/octet-stream' });
            res.end(Buffer.from([0x00, 0x01, 0x02, 0x03]));
            return;
        }
        // Default
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'not_found' }));
    });

    upstream.listen(0, '127.0.0.1', () => {
        upstreamPort = upstream.address().port;
        process.env.CKAN_API_PROXY_TARGET = 'http://127.0.0.1:' + upstreamPort;
        process.env.CKAN_API_PROXY_TARGET_PATH = '/ckan/api';
        process.env.CKAN_API_PROXY_LOG_LEVEL = 'silent';
        done();
    });
});

afterAll((done) => {
    if (upstream) {
        upstream.close(done);
    } else {
        done();
    }
    try {
        fs.rmSync(tmpLog, { recursive: true, force: true });
    } catch (_e) { /* noop */ }
});

beforeEach(() => {
    upstreamRequests.length = 0;
    jest.resetModules();
});

/**
 * Crea una app Express limpia con el proxy montado. Se construye dentro
 * de cada test para que tome la última configuración del .env mockeado.
 */
function buildApp() {
    const express = require('express');
    const ckanApiProxy = require('../ckan-api-proxy');
    const app = express();
    app.use('/aod/api', ckanApiProxy);
    return app;
}

describe('ckan-api-proxy (integración)', () => {
    const request = require('supertest');

    test('GET /aod/api/3/action/package_show pasa al upstream y reescribe URLs', async () => {
        const app = buildApp();
        const res = await request(app)
            .get('/aod/api/3/action/package_show?id=demo')
            .expect(200);

        // Verificar que llegó al upstream con el path reescrito
        expect(upstreamRequests).toHaveLength(1);
        expect(upstreamRequests[0].url).toBe('/ckan/api/3/action/package_show?id=demo');

        // El body devuelto debe tener las URLs reescritas
        const body = res.body;
        expect(body.success).toBe(true);
        expect(body.result.resources[0].url).toBe(
            'https://opendata.aragon.es/datos/catalogo/dataset/demo/recurso/r1/descarga/data.csv'
        );
        expect(body.result.rdf_url).toBe(
            'https://opendata.aragon.es/datos/catalogo/dataset/demo.rdf'
        );
        expect(body.result.image_display_url).toBe(
            'https://opendata.aragon.es/catalogo/uploads/group/logo.png'
        );
        expect(body.result.api).toBe(
            'https://opendata.aragon.es/aod/api/3/action/package_show?id=demo'
        );
        // webasset preservado
        expect(body.result.webasset).toBe('/ckan/webassets/main.js');
    });

    test('GET /aod/api/3/action/status_show responde 200 (acción de lectura)', async () => {
        const app = buildApp();
        const res = await request(app).get('/aod/api/3/action/status_show').expect(200);
        expect(res.body.success).toBe(true);
        expect(res.body.result.site_title).toBe('AOD');
    });

    test('POST /aod/api/3/action/package_create responde 403 sin llegar al upstream', async () => {
        const app = buildApp();
        const res = await request(app)
            .post('/aod/api/3/action/package_create')
            .send({ name: 'x' })
            .expect(403);

        expect(upstreamRequests).toHaveLength(0);
        expect(res.body.success).toBe(false);
        expect(res.body.error.__type).toBe('Authorization Error');
    });

    test('GET /aod/api/3/action/user_list responde 403 (blacklist user_*)', async () => {
        const app = buildApp();
        await request(app).get('/aod/api/3/action/user_list').expect(403);
        expect(upstreamRequests).toHaveLength(0);
    });

    test('GET /aod/api/3/action/user_show SÍ se permite (excepción)', async () => {
        // El upstream no tiene mock para user_show, devolverá 404, pero
        // la petición debería atravesar el proxy (no ser bloqueada).
        const app = buildApp();
        await request(app).get('/aod/api/3/action/user_show?id=demo').expect(404);
        expect(upstreamRequests).toHaveLength(1);
        expect(upstreamRequests[0].url).toBe('/ckan/api/3/action/user_show?id=demo');
    });

    test('GET /aod/api/3/action/datastore_search responde 403 (datastore_* bloqueado)', async () => {
        const app = buildApp();
        await request(app).get('/aod/api/3/action/datastore_search?q=foo').expect(403);
        expect(upstreamRequests).toHaveLength(0);
    });

    test('GET /aod/api/3/action/accion_inventada responde 403 (deny-by-default)', async () => {
        const app = buildApp();
        const res = await request(app)
            .get('/aod/api/3/action/accion_inventada')
            .expect(403);

        expect(upstreamRequests).toHaveLength(0);
        expect(res.body.error.message).toMatch(/accion_inventada/);
    });

    test('GET /aod/api/algo-que-no-es-action responde 404 sin llegar al upstream', async () => {
        const app = buildApp();
        await request(app).get('/aod/api/algo-que-no-es-action').expect(404);
        expect(upstreamRequests).toHaveLength(0);
    });

    test('respuestas binarias se devuelven sin reescritura', async () => {
        // binary_endpoint no es una acción de la whitelist; lo añadimos vía
        // EXTRA_ALLOWED_ACTIONS para este caso.
        process.env.CKAN_API_PROXY_EXTRA_ALLOWED_ACTIONS = 'binary_endpoint';
        const app = buildApp();
        const res = await request(app)
            .get('/aod/api/3/action/binary_endpoint')
            .buffer(true)
            .parse((response, cb) => {
                const chunks = [];
                response.on('data', (c) => chunks.push(c));
                response.on('end', () => cb(null, Buffer.concat(chunks)));
            });

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('application/octet-stream');
        expect(Buffer.isBuffer(res.body)).toBe(true);
        expect(res.body.length).toBe(4);
        expect(res.body[0]).toBe(0x00);
        expect(res.body[3]).toBe(0x03);
        delete process.env.CKAN_API_PROXY_EXTRA_ALLOWED_ACTIONS;
    });

    test('cuando CKAN_API_PROXY_TARGET no está configurado, responde 503', async () => {
        const originalTarget = process.env.CKAN_API_PROXY_TARGET;
        delete process.env.CKAN_API_PROXY_TARGET;
        jest.resetModules();

        const express = require('express');
        const ckanApiProxy = require('../ckan-api-proxy');
        const app = express();
        app.use('/aod/api', ckanApiProxy);

        const res = await request(app).get('/aod/api/3/action/package_show').expect(503);
        expect(res.body.error.__type).toBe('Configuration Error');

        process.env.CKAN_API_PROXY_TARGET = originalTarget;
    });
});
