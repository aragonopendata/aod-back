'use strict';

const rewriter = require('../ckan-url-rewriter');

describe('ckan-url-rewriter', () => {
    describe('rewrite() - reglas individuales', () => {
        test('regla 1 (download): /ckan/dataset/<id>/resource/<id>/download/ -> /datos/catalogo/...', () => {
            const input = 'https://opendata.aragon.es/ckan/dataset/abc/resource/xyz/download/file.csv';
            const output = rewriter.rewrite(input);
            expect(output).toBe('https://opendata.aragon.es/datos/catalogo/dataset/abc/recurso/xyz/descarga/file.csv');
        });

        test('regla 2 (view): /ckan/dataset/<id>/resource/<id>/view/ -> /datos/catalogo/.../vistaprevia/', () => {
            const input = '"url": "/ckan/dataset/poblacion/resource/abcd-1234/view/v1"';
            const output = rewriter.rewrite(input);
            expect(output).toBe('"url": "/datos/catalogo/dataset/poblacion/recurso/abcd-1234/vistaprevia/v1"');
        });

        test('regla 3 (rdf): /ckan/dataset/<id>.rdf -> /datos/catalogo/dataset/<id>.rdf', () => {
            const input = 'GET /ckan/dataset/poblacion-municipios.rdf HTTP/1.1';
            const output = rewriter.rewrite(input);
            expect(output).toBe('GET /datos/catalogo/dataset/poblacion-municipios.rdf HTTP/1.1');
        });

        test('regla 4 (api): /ckan/api/ -> /aod/api/', () => {
            const input = '"action": "https://opendata.aragon.es/ckan/api/3/action/package_show"';
            const output = rewriter.rewrite(input);
            expect(output).toBe('"action": "https://opendata.aragon.es/aod/api/3/action/package_show"');
        });

        test('regla 5 (uploads): /ckan/uploads/ -> /catalogo/uploads/', () => {
            const input = '"image": "/ckan/uploads/group/2024/logo.png"';
            const output = rewriter.rewrite(input);
            expect(output).toBe('"image": "/catalogo/uploads/group/2024/logo.png"');
        });
    });

    describe('rewrite() - /ckan/webassets/ se preserva', () => {
        test('webassets aislado: pasa intacto', () => {
            const input = '<script src="/ckan/webassets/main.js"></script>';
            const output = rewriter.rewrite(input);
            expect(output).toBe(input);
        });

        test('webassets junto a otras reglas: solo las otras se reescriben', () => {
            const input = [
                '<link href="/ckan/webassets/main.css">',
                '"api": "/ckan/api/3/action/help_show"',
                '"image": "/ckan/uploads/logo.png"',
            ].join('\n');
            const output = rewriter.rewrite(input);
            expect(output).toBe([
                '<link href="/ckan/webassets/main.css">',
                '"api": "/aod/api/3/action/help_show"',
                '"image": "/catalogo/uploads/logo.png"',
            ].join('\n'));
        });
    });

    describe('rewrite() - propiedades transversales', () => {
        test('idempotencia: rewrite(rewrite(x)) === rewrite(x)', () => {
            const input = JSON.stringify({
                api: 'https://x/ckan/api/3/action/package_show',
                download: '/ckan/dataset/d1/resource/r1/download/f.csv',
                view: '/ckan/dataset/d1/resource/r1/view/v1',
                rdf: '/ckan/dataset/d1.rdf',
                uploads: '/ckan/uploads/foo/bar.png',
                webasset: '/ckan/webassets/style.css',
            });
            const once = rewriter.rewrite(input);
            const twice = rewriter.rewrite(once);
            expect(twice).toBe(once);
        });

        test('múltiples ocurrencias de la misma regla en un body', () => {
            const input = '/ckan/api/3/a /ckan/api/3/b /ckan/api/3/c';
            const output = rewriter.rewrite(input);
            expect(output).toBe('/aod/api/3/a /aod/api/3/b /aod/api/3/c');
        });

        test('ids tipo UUID se respetan', () => {
            const uuid = '550e8400-e29b-41d4-a716-446655440000';
            const input = `/ckan/dataset/${uuid}/resource/${uuid}/download/data.csv`;
            const output = rewriter.rewrite(input);
            expect(output).toBe(`/datos/catalogo/dataset/${uuid}/recurso/${uuid}/descarga/data.csv`);
        });

        test('input sin "/ckan" se devuelve tal cual sin invocar onResidual', () => {
            const input = '{"foo": "bar", "url": "https://example.org/something"}';
            const onResidual = jest.fn();
            const output = rewriter.rewrite(input, { onResidual });
            expect(output).toBe(input);
            expect(onResidual).not.toHaveBeenCalled();
        });

        test('input vacío o no string no rompe y se devuelve igual', () => {
            expect(rewriter.rewrite('')).toBe('');
            expect(rewriter.rewrite(null)).toBe(null);
            expect(rewriter.rewrite(undefined)).toBe(undefined);
            expect(rewriter.rewrite(42)).toBe(42);
        });
    });

    describe('rewrite() - detección de residuos', () => {
        test('onResidual se invoca con count y samples cuando quedan /ckan/ no contemplados', () => {
            // Estos paths no encajan en ninguna regla y NO son /ckan/webassets/.
            const input = [
                '{"misc": "/ckan/group/economia"',
                '"misc2": "/ckan/feeds/dataset.atom"',
                '"misc3": "/ckan/group/economia"', // duplicado para verificar dedup en samples
                '"webasset": "/ckan/webassets/main.js"', // este NO debe reportarse
                '"api": "/ckan/api/3/action/x"}', // este se reescribe, NO debe reportarse
            ].join(',');
            const onResidual = jest.fn();

            const output = rewriter.rewrite(input, { onResidual });

            expect(onResidual).toHaveBeenCalledTimes(1);
            const info = onResidual.mock.calls[0][0];
            // count cuenta TODAS las ocurrencias (incluido el duplicado).
            expect(info.count).toBeGreaterThanOrEqual(3);
            // samples está deduplicado.
            expect(new Set(info.samples).size).toBe(info.samples.length);
            // Las URLs reescritas y los webassets no aparecen como residuos.
            expect(info.samples.every((s) => !s.startsWith('/ckan/api/'))).toBe(true);
            expect(info.samples.every((s) => !s.startsWith('/ckan/webassets/'))).toBe(true);
            // Los residuos esperados sí aparecen.
            expect(info.samples).toEqual(expect.arrayContaining(['/ckan/group/economia']));
            // El output preserva los residuos intactos (no los borra).
            expect(output).toContain('/ckan/group/economia');
            // Y restaura webassets.
            expect(output).toContain('/ckan/webassets/main.js');
            // Y aplica la regla del api.
            expect(output).toContain('/aod/api/3/action/x');
        });

        test('onResidual NO se invoca cuando todo se reescribe o se preserva legítimamente', () => {
            const input = [
                '/ckan/webassets/main.js',
                '/ckan/api/3/action/package_show',
                '/ckan/dataset/d1/resource/r1/download/data.csv',
                '/ckan/dataset/d1/resource/r1/view/v1',
                '/ckan/dataset/d1.rdf',
                '/ckan/uploads/group/logo.png',
            ].join(' ');
            const onResidual = jest.fn();

            rewriter.rewrite(input, { onResidual });

            expect(onResidual).not.toHaveBeenCalled();
        });

        test('samples se trunca a RESIDUAL_SAMPLE_LIMIT (5) aunque haya más residuos únicos', () => {
            const residuos = [
                '/ckan/r1', '/ckan/r2', '/ckan/r3', '/ckan/r4',
                '/ckan/r5', '/ckan/r6', '/ckan/r7',
            ].join('","');
            const input = `["${residuos}"]`;
            const onResidual = jest.fn();

            rewriter.rewrite(input, { onResidual });

            expect(onResidual).toHaveBeenCalledTimes(1);
            const info = onResidual.mock.calls[0][0];
            expect(info.samples.length).toBeLessThanOrEqual(5);
            // count refleja TODAS las ocurrencias, no solo las muestreadas.
            expect(info.count).toBe(7);
        });

        test('sin opts.onResidual no se rompe', () => {
            const input = '"misc": "/ckan/feeds/dataset.atom"';
            // No proporcionar opts: no debe lanzar.
            expect(() => rewriter.rewrite(input)).not.toThrow();
            // Tampoco proporcionar opts={} sin onResidual.
            expect(() => rewriter.rewrite(input, {})).not.toThrow();
        });
    });
});
