'use strict';

/**
 * Tests del endpoint GET /aod/services/web/datasets/countVisits (ODA-1942).
 *
 * El pool de la BD de CKAN se sustituye por un mock: cada test define qué
 * devuelve `query`. El controlador guarda el total en una caché a nivel de
 * módulo, así que se recarga el módulo en cada test (jest.isolateModules).
 *
 * NOTA: el logger del proyecto intenta escribir en /app/logs por defecto;
 * lo redirigimos a un directorio temporal con APP_LOG_PATH antes de
 * require()-ear cualquier módulo de la app.
 */

const path = require('path');
const os = require('os');
const fs = require('fs');
const express = require('express');
const request = require('supertest');

const tmpLog = fs.mkdtempSync(path.join(os.tmpdir(), 'aod-back-test-logs-'));
process.env.APP_LOG_PATH = tmpLog;
process.env.DATASETS_VISITS_CACHE_TTL = '60';

const BASE_URL = '/aod/services/web';
const VISITS_URL = BASE_URL + '/datasets/countVisits';

let query;
let app;

const buildApp = () => {
    query = jest.fn();
    jest.isolateModules(() => {
        jest.doMock('../../../db/db-connection', () => ({
            getPool: () => ({ query: jest.fn() }),
            getCkanPool: () => ({ query: query }),
        }));
        const router = require('../../../routes/web/datasets');
        app = express();
        app.use(BASE_URL, router);
    });
};

const totalRow = (count) => ({ rows: [{ count: String(count) }] });
const datasetRow = (name, count) => ({ rows: [{ name: name, count: String(count) }] });

beforeEach(() => {
    jest.useRealTimers();
    buildApp();
});

afterAll(() => {
    fs.rmSync(tmpLog, { recursive: true, force: true });
});

describe('GET countVisits (total)', () => {
    test('devuelve el total con formato CKAN y count numérico', async () => {
        query.mockResolvedValueOnce(totalRow(1234567));

        const res = await request(app).get(VISITS_URL);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, result: { count: 1234567 } });
        expect(typeof res.body.result.count).toBe('number');
        expect(query).toHaveBeenCalledTimes(1);
        expect(query.mock.calls[0][0]).toMatch(/SUM\(ts\.count\)/);
        expect(query.mock.calls[0][0]).not.toMatch(/running_total/);
    });

    test('la caché evita una segunda consulta dentro del TTL', async () => {
        query.mockResolvedValueOnce(totalRow(10));

        await request(app).get(VISITS_URL);
        const res = await request(app).get(VISITS_URL);

        expect(res.body.result.count).toBe(10);
        expect(query).toHaveBeenCalledTimes(1);
    });

    test('vuelve a consultar cuando caduca el TTL', async () => {
        jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
        query.mockResolvedValueOnce(totalRow(10)).mockResolvedValueOnce(totalRow(11));

        await request(app).get(VISITS_URL);
        jest.advanceTimersByTime(61 * 1000);
        const res = await request(app).get(VISITS_URL);

        expect(res.body.result.count).toBe(11);
        expect(query).toHaveBeenCalledTimes(2);
    });

    test('peticiones concurrentes comparten una única consulta', async () => {
        let resolveQuery;
        query.mockReturnValueOnce(new Promise((resolve) => { resolveQuery = resolve; }));

        const pending = [1, 2, 3].map(() => request(app).get(VISITS_URL).then((r) => r));
        await new Promise((resolve) => setTimeout(resolve, 50));
        resolveQuery(totalRow(42));
        const responses = await Promise.all(pending);

        responses.forEach((res) => expect(res.body).toEqual({ success: true, result: { count: 42 } }));
        expect(query).toHaveBeenCalledTimes(1);
    });

    test('si la BD falla devuelve el último valor cacheado', async () => {
        jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
        query.mockResolvedValueOnce(totalRow(10)).mockRejectedValueOnce(new Error('db down'));

        await request(app).get(VISITS_URL);
        jest.advanceTimersByTime(61 * 1000);
        const res = await request(app).get(VISITS_URL);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, result: { count: 10 } });
        expect(query).toHaveBeenCalledTimes(2);
    });

    test('si la BD falla y no hay caché devuelve 500', async () => {
        query.mockRejectedValueOnce(new Error('db down'));

        const res = await request(app).get(VISITS_URL);

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
    });

    test('tras un error se reintenta la consulta en la siguiente petición', async () => {
        query.mockRejectedValueOnce(new Error('db down')).mockResolvedValueOnce(totalRow(5));

        await request(app).get(VISITS_URL);
        const res = await request(app).get(VISITS_URL);

        expect(res.body).toEqual({ success: true, result: { count: 5 } });
        expect(query).toHaveBeenCalledTimes(2);
    });
});

describe('GET countVisits?dataset=', () => {
    test('devuelve las visitas del dataset buscando por nombre o id', async () => {
        query.mockResolvedValueOnce(datasetRow('mi-dataset', 321));

        const res = await request(app).get(VISITS_URL).query({ dataset: 'mi-dataset' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, result: { dataset: 'mi-dataset', count: 321 } });
        expect(query.mock.calls[0][0]).toMatch(/p\.name = \$1 OR p\.id = \$1/);
        expect(query.mock.calls[0][1]).toEqual(['mi-dataset']);
    });

    test('dataset existente sin visitas devuelve 0', async () => {
        query.mockResolvedValueOnce(datasetRow('sin-visitas', 0));

        const res = await request(app).get(VISITS_URL).query({ dataset: 'sin-visitas' });

        expect(res.status).toBe(200);
        expect(res.body.result.count).toBe(0);
    });

    test('las consultas por dataset no se cachean', async () => {
        query.mockResolvedValueOnce(datasetRow('a', 1)).mockResolvedValueOnce(datasetRow('a', 2));

        await request(app).get(VISITS_URL).query({ dataset: 'a' });
        const res = await request(app).get(VISITS_URL).query({ dataset: 'a' });

        expect(res.body.result.count).toBe(2);
        expect(query).toHaveBeenCalledTimes(2);
    });

    test('dataset inexistente, privado o borrado devuelve 404', async () => {
        query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).get(VISITS_URL).query({ dataset: 'no-existe' });

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });

    test.each([
        ['vacío', VISITS_URL + '?dataset='],
        ['solo espacios', VISITS_URL + '?dataset=%20%20'],
        ['demasiado largo', VISITS_URL + '?dataset=' + 'a'.repeat(101)],
        ['repetido', VISITS_URL + '?dataset=a&dataset=b'],
    ])('parámetro dataset no válido (%s) devuelve 400 sin consultar la BD', async (_desc, url) => {
        const res = await request(app).get(url);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(query).not.toHaveBeenCalled();
    });

    test('si la BD falla devuelve 500', async () => {
        query.mockRejectedValueOnce(new Error('db down'));

        const res = await request(app).get(VISITS_URL).query({ dataset: 'a' });

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
    });
});
