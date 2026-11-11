const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const { once } = require('node:events');
const { readFile } = require('node:fs/promises');
const { spawn } = require('node:child_process');
const path = require('node:path');
const app = require('../server');

let server;
let baseUrl;
const lessonId = 'a'.repeat(24);
const teacherId = 'b'.repeat(24);
const order = {
    name: 'Test Parent', phone: '971501234567',
    lessonIDs: [lessonId, lessonId], spaces: 2
};

before(async () => {
    // A temporary local port: no mock API, Atlas connection or seed import.
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    baseUrl = 'http://127.0.0.1:' + server.address().port;
});

after(async () => {
    if (server) {
        await new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
        });
    }
});

async function request(url, options = {}) {
    const response = await fetch(baseUrl + url, options);
    return { response, body: await response.json() };
}

function jsonRequest(method, body) {
    return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

test('allowed frontend origins receive CORS headers even on error responses', async () => {
    for (const origin of ['https://name0x0.github.io', 'http://127.0.0.1:5500', 'http://localhost:5500']) {
        const { response } = await request('/lessons', { headers: { Origin: origin } });
        assert.equal(response.status, 501);
        assert.equal(response.headers.get('access-control-allow-origin'), origin);
        assert.match(response.headers.get('vary'), /\bOrigin\b/i);
    }
});

test('untrusted and absent origins are not granted CORS access', async () => {
    for (const origin of ['https://example.com', 'https://name0x0.github.io.example.com', 'null', undefined]) {
        const { response } = await request('/lessons', { headers: origin ? { Origin: origin } : {} });
        assert.equal(response.headers.get('access-control-allow-origin'), null);
        assert.match(response.headers.get('vary'), /\bOrigin\b/i);
    }
});

test('JSON PUT preflight finishes before routing', async () => {
    const response = await fetch(baseUrl + '/lessons/' + lessonId, {
        method: 'OPTIONS', headers: {
            Origin: 'http://127.0.0.1:5500',
            'Access-Control-Request-Method': 'PUT',
            'Access-Control-Request-Headers': 'content-type'
        }
    });
    assert.equal(response.status, 204);
    assert.equal(await response.text(), '');
    assert.equal(response.headers.get('access-control-allow-methods'), 'GET, POST, PUT, OPTIONS');
    assert.equal(response.headers.get('access-control-allow-headers'), 'Content-Type');
    const denied = await fetch(baseUrl + '/orders', {
        method: 'OPTIONS', headers: { Origin: 'https://example.com' }
    });
    assert.equal(denied.status, 204);
    assert.equal(denied.headers.get('access-control-allow-origin'), null);
});

test('image middleware returns the actual WebP file', async () => {
    const response = await fetch(baseUrl + '/images/piano.webp');
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /^image\/webp/);
    const expected = await readFile(path.join(__dirname, '..', 'images', 'piano.webp'));
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), expected);
});

test('missing images, dotfiles and encoded traversal do not expose other files', async () => {
    for (const url of [
        '/images/missing.webp', '/images/.gitkeep', '/images/',
        '/images/..%2fserver.js', '/images/..%5cserver.js', '/images/%2e%2e%2f.env'
    ]) {
        const { response, body } = await request(url);
        assert.equal(response.status, 404);
        assert.equal(body.error, 'Image not found');
    }
});

test('all planned data routes are mounted without pretending to access a database', async () => {
    for (const url of [
        '/lessons', '/lessons?country=UAE', '/lessons?country=UK',
        '/search?q=piano&country=UAE', '/search?q=', '/search',
        '/teachers', '/teachers?country=UK',
        '/teachers/' + teacherId + '/lessons', '/enrolment/' + lessonId
    ]) {
        const { response, body } = await request(url);
        assert.equal(response.status, 501, url);
        assert.match(body.error, /not implemented yet/i);
    }
});

test('country validation rejects unsupported, empty and repeated values', async () => {
    for (const route of ['/lessons', '/search', '/teachers']) {
        for (const query of ['country=France', 'country=', 'country=UAE&country=UK']) {
            const { response, body } = await request(route + '?' + query);
            assert.equal(response.status, 400);
            assert.equal(body.error, 'country must be UAE or UK');
        }
    }
});

test('search rejects repeated q parameters', async () => {
    const { response } = await request('/search?q=piano&q=football');
    assert.equal(response.status, 400);
});

test('ID routes reject malformed identifiers', async () => {
    for (const url of ['/lessons/bad-id', '/teachers/bad-id/lessons', '/enrolment/bad-id']) {
        const { response } = await request(url, url.startsWith('/lessons/')
            ? jsonRequest('PUT', { space: 3 }) : {});
        assert.equal(response.status, 400);
    }
});

test('PUT accepts multiple attributes but does not claim to save them', async () => {
    const { response, body } = await request('/lessons/' + lessonId,
        jsonRequest('PUT', { price: 90, location: 'Hendon', space: 3 }));
    assert.equal(response.status, 501);
    assert.match(body.error, /database update not implemented/i);
});

test('PUT rejects empty, array, immutable-ID and operator-style changes', async () => {
    for (const changes of [{}, [], { _id: lessonId }, { $set: { space: 1 } }, { 'nested.space': 1 }]) {
        const { response } = await request('/lessons/' + lessonId, jsonRequest('PUT', changes));
        assert.equal(response.status, 400);
    }
});

test('POST accepts the frontend order shape, repeated IDs and optional email', async () => {
    for (const extra of [{}, { email: '' }, { email: 'parent@example.com', checkoutId: 'test-checkout' }]) {
        const { response, body } = await request('/orders', jsonRequest('POST', { ...order, ...extra }));
        assert.equal(response.status, 501);
        assert.match(body.error, /database insert not implemented/i);
    }
});

test('POST rejects invalid customer details, IDs and space counts', async () => {
    for (const invalid of [
        [], {}, { ...order, name: 'Parent2' }, { ...order, name: null },
        { ...order, phone: '+971 501234567' }, { ...order, phone: 971501234567 },
        { ...order, phone: '0' }, { ...order, phone: '1'.repeat(16) },
        { ...order, lessonIDs: [] }, { ...order, lessonIDs: ['bad-id'] },
        { ...order, spaces: 1 }, { ...order, spaces: '2' },
        { ...order, email: 'parent@example' }, { ...order, email: 'parent.example.com' },
        { ...order, email: 42 }, { ...order, checkoutId: '' }, { ...order, checkoutId: 42 }
    ]) {
        const { response } = await request('/orders', jsonRequest('POST', invalid));
        assert.equal(response.status, 400);
    }
});

test('POST and PUT require JSON content type', async () => {
    for (const [url, method] of [['/orders', 'POST'], ['/lessons/' + lessonId, 'PUT']]) {
        const { response } = await request(url, { method, body: 'not JSON' });
        assert.equal(response.status, 415);
    }
});

test('malformed JSON returns JSON 400 with CORS headers', async () => {
    const { response, body } = await request('/orders', {
        method: 'POST', headers: {
            'Content-Type': 'application/json', Origin: 'https://name0x0.github.io'
        }, body: '{"name":'
    });
    assert.equal(response.status, 400);
    assert.equal(body.error, 'Request body must contain valid JSON');
    assert.equal(response.headers.get('access-control-allow-origin'), 'https://name0x0.github.io');
});

test('oversized JSON retains its 413 response', async () => {
    const { response } = await request('/orders', jsonRequest('POST', { name: 'a'.repeat(110000) }));
    assert.equal(response.status, 413);
});

test('health reports unavailable until database health is implemented', async () => {
    const { response, body } = await request('/health');
    assert.equal(response.status, 503);
    assert.equal(body.status, 'unavailable');
});

test('unmatched routes return JSON 404', async () => {
    const { response, body } = await request('/not-a-route');
    assert.equal(response.status, 404);
    assert.equal(body.error, 'Route not found');
});

test('logger records images, preflight, parser errors, 404s and health', async t => {
    const lines = [];
    t.mock.method(console, 'log', line => lines.push(line));
    await (await fetch(baseUrl + '/images/piano.webp')).arrayBuffer();
    await fetch(baseUrl + '/orders', { method: 'OPTIONS' });
    await request('/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{'
    });
    await request('/missing');
    await request('/health');
    assert.equal(lines.length, 5);
    assert.match(lines[0], /GET\s+\/images\/piano\.webp\s+200\s+\d+ms$/);
    assert.match(lines[1], /OPTIONS\s+\/orders\s+204\s+\d+ms$/);
    assert.match(lines[2], /POST\s+\/orders\s+400\s+\d+ms$/);
    assert.match(lines[3], /GET\s+\/missing\s+404\s+\d+ms$/);
    assert.match(lines[4], /health 503 \d+ms$/);
});

test('entrypoint starts without database configuration', { timeout: 5000 }, async t => {
    const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
        env: { ...process.env, PORT: '0', MONGODB_URI: '', DB_NAME: '' },
        stdio: ['ignore', 'pipe', 'pipe']
    });
    const closed = once(child, 'close');
    t.after(async () => {
        if (child.exitCode === null && child.signalCode === null) {
            child.kill();
        }
        await closed;
    });
    const [output] = await once(child.stdout, 'data');
    assert.match(output.toString(), /Server listening on port 0 \(database operations not implemented\)/);
});

test('occupied port exits with an error and no false startup message', { timeout: 5000 }, async t => {
    // Reserve the same default listening address used by the entrypoint.
    // A server bound only to 127.0.0.1 need not occupy the IPv6 listening address.
    const occupied = app.listen(0);
    await once(occupied, 'listening');
    t.after(() => new Promise((resolve, reject) => {
        occupied.close(error => error ? reject(error) : resolve());
    }));
    const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
        env: { ...process.env, PORT: String(occupied.address().port) },
        stdio: ['ignore', 'pipe', 'pipe']
    });
    const closed = once(child, 'close');
    t.after(async () => {
        if (child.exitCode === null && child.signalCode === null) {
            child.kill();
        }
        await closed;
    });
    let output = '';
    let errors = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { errors += chunk; });
    const [exitCode] = await closed;
    assert.equal(exitCode, 1);
    assert.match(errors, /EADDRINUSE/);
    assert.doesNotMatch(output, /Server listening/);
});
