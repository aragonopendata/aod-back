'use strict';

const ckanResponseRewriter = require('../ckan-response-rewriter');

/**
 * Crea un par req/res mínimo. El `res.json` "original" guarda lo enviado en
 * `res.sent` para poder inspeccionarlo tras la reescritura.
 */
function makeReqRes() {
    const req = { originalUrl: '/aod/services/web/datasets/foo' };
    const res = {
        sent: undefined,
        json: function (payload) {
            res.sent = payload;
            return res;
        },
    };
    return { req, res };
}

/** Aplica el middleware y devuelve { req, res, nextCalled }. */
function applyMiddleware() {
    const { req, res } = makeReqRes();
    let nextCalled = false;
    ckanResponseRewriter(req, res, function () {
        nextCalled = true;
    });
    return { req, res, nextCalled };
}

describe('ckan-response-rewriter middleware', () => {
    test('llama a next() y envuelve res.json', () => {
        const { res, nextCalled } = applyMiddleware();
        expect(nextCalled).toBe(true);
        expect(typeof res.json).toBe('function');
    });

    test('reescribe URLs /ckan/... en un cuerpo string (respuesta cruda de CKAN)', () => {
        const { res } = applyMiddleware();
        const body = JSON.stringify({
            success: true,
            result: {
                resources: [
                    { url: 'https://opendata.aragon.es/ckan/dataset/d1/resource/r1/download/data.csv' },
                ],
                image_display_url: 'https://opendata.aragon.es/ckan/uploads/group/logo.png',
            },
        });
        res.json(body);
        expect(res.sent).toContain('/datos/catalogo/dataset/d1/recurso/r1/descarga/data.csv');
        expect(res.sent).toContain('/catalogo/uploads/group/logo.png');
        expect(res.sent).not.toContain('/ckan/dataset/');
        expect(res.sent).not.toContain('/ckan/uploads/');
    });

    test('reescribe la API: /ckan/api/ -> /aod/api/ en string', () => {
        const { res } = applyMiddleware();
        res.json('{"help":"https://opendata.aragon.es/ckan/api/3/action/help_show"}');
        expect(res.sent).toBe('{"help":"https://opendata.aragon.es/aod/api/3/action/help_show"}');
    });

    test('preserva /ckan/webassets/ en string', () => {
        const { res } = applyMiddleware();
        const body = '{"asset":"/ckan/webassets/main.js","api":"/ckan/api/3/action/x"}';
        res.json(body);
        expect(res.sent).toContain('/ckan/webassets/main.js');
        expect(res.sent).toContain('/aod/api/3/action/x');
    });

    test('cuerpo string sin /ckan se devuelve intacto', () => {
        const { res } = applyMiddleware();
        const body = '{"success":true,"result":{"name":"sin-urls"}}';
        res.json(body);
        expect(res.sent).toBe(body);
    });

    test('reescribe URLs /ckan/... en un objeto plano', () => {
        const { res } = applyMiddleware();
        res.json({
            status: 200,
            rdf: '/ckan/dataset/poblacion.rdf',
            api: '/ckan/api/3/action/package_show',
        });
        expect(typeof res.sent).toBe('object');
        expect(res.sent.rdf).toBe('/datos/catalogo/dataset/poblacion.rdf');
        expect(res.sent.api).toBe('/aod/api/3/action/package_show');
    });

    test('objeto plano sin /ckan se devuelve por la misma referencia', () => {
        const { res } = applyMiddleware();
        const payload = { status: 403, error: 'API KEY incorrecta' };
        res.json(payload);
        expect(res.sent).toBe(payload);
    });

    test('reescribe el RDF (XML como string), incluido el caso .rdf', () => {
        const { res } = applyMiddleware();
        const rdf = [
            '<?xml version="1.0"?>',
            '<rdf:RDF>',
            '  <dcat:Dataset rdf:about="https://opendata.aragon.es/ckan/dataset/poblacion.rdf">',
            '    <dcat:downloadURL rdf:resource="https://opendata.aragon.es/ckan/dataset/poblacion/resource/r1/download/data.csv"/>',
            '  </dcat:Dataset>',
            '</rdf:RDF>',
        ].join('\n');
        res.json(rdf);
        expect(res.sent).toContain('/datos/catalogo/dataset/poblacion.rdf');
        expect(res.sent).toContain('/datos/catalogo/dataset/poblacion/recurso/r1/descarga/data.csv');
        expect(res.sent).not.toContain('/ckan/dataset/');
    });

    test('valores no string/no objeto (null, número) se devuelven tal cual', () => {
        const { res } = applyMiddleware();
        res.json(null);
        expect(res.sent).toBeNull();
        res.json(42);
        expect(res.sent).toBe(42);
    });
});
