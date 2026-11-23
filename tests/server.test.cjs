const assert = require('node:assert/strict');
const { before, after, test, mock } = require('node:test');
const { once } = require('node:events');
const { readFile } = require('node:fs/promises');
const { spawn } = require('node:child_process');
const path = require('node:path');
const app = require('../server');
const db = require('../db');
const { ObjectId } = require('mongodb');

let server;
let baseUrl;
const lessonId = 'a'.repeat(24);
const teacherId = 'b'.repeat(24);
const order = {
    name: 'Test Parent', phone: '971501234567',
    lessonIDs: [lessonId, lessonId], spaces: 2
};

const storedLesson = { _id: new ObjectId(lessonId), topic: 'Piano', country: 'UK', price: 22, space: 5 };
const storedTeacher = { _id: new ObjectId(teacherId), lessonIDs: [storedLesson._id] };
const insertedId = new ObjectId('c'.repeat(24));
const database = {
    command: async () => ({ ok: 1 }),
    collection(name) {
        return {
            find: () => ({ toArray: async () => name === 'teacher' ? [storedTeacher] : [storedLesson] }),
            findOne: async () => name === 'order' ? null : name === 'teacher' ? storedTeacher : storedLesson,
            updateOne: async () => ({ matchedCount: 1, modifiedCount: 1 }),
            insertOne: async () => ({ insertedId }),
            aggregate: () => ({ toArray: async () => [{ enrolled: 2 }] })
        };
    }
};

before(async () => {
    mock.method(db, 'getDb', () => database);
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

test('allowed frontend origins receive CORS headers', async () => {
    for (const origin of ['https://name0x0.github.io', 'http://127.0.0.1:5500', 'http://localhost:5500']) {
        const { response } = await request('/lessons', { headers: { Origin: origin } });
        assert.equal(response.status, 200);
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

test('data routes return database results', async () => {
    for (const url of [
        '/lessons', '/lessons?country=UAE', '/lessons?country=UK',
        '/search?q=piano&country=UAE', '/search?q=', '/search',
        '/teachers', '/teachers?country=UK',
        '/teachers/' + teacherId + '/lessons', '/enrolment/' + lessonId
    ]) {
        const { response, body } = await request(url);
        assert.equal(response.status, 200, url);
        assert.ok(Array.isArray(body) || body.enrolled === 2);
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

test('PUT saves multiple supplied attributes', async () => {
    const { response, body } = await request('/lessons/' + lessonId,
        jsonRequest('PUT', { price: 90, location: 'Hendon', space: 3 }));
    assert.equal(response.status, 200);
    assert.deepEqual(body, { matchedCount: 1, modifiedCount: 1 });
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
        assert.equal(response.status, 201);
        assert.equal(body.insertedId, String(insertedId));
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

test('health confirms database connectivity', async () => {
    const { response, body } = await request('/health');
    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
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
    assert.match(lines[4], /health 200 \d+ms$/);
});

test('entrypoint fails without database configuration before opening a port', { timeout: 5000 }, async t => {
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
    let output = '';
    let errors = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { errors += chunk; });
    const [code] = await closed;
    assert.equal(code, 1);
    assert.match(errors, /Database startup failed/);
    assert.doesNotMatch(output, /Server listening/);
});

test('database failure exits even when the HTTP port is occupied', { timeout: 5000 }, async t => {
    // Reserve the same default listening address used by the entrypoint.
    // A server bound only to 127.0.0.1 need not occupy the IPv6 listening address.
    const occupied = app.listen(0);
    await once(occupied, 'listening');
    t.after(() => new Promise((resolve, reject) => {
        occupied.close(error => error ? reject(error) : resolve());
    }));
    const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
        env: { ...process.env, PORT: String(occupied.address().port), MONGODB_URI: '' },
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
    assert.match(errors, /Database startup failed/);
    assert.doesNotMatch(output, /Server listening/);
});

test('queries preserve country filters and teacher ObjectId relationships', async t => {
    const calls = [];
    t.mock.method(database, 'collection', name => ({
        findOne: async filter => { calls.push([name, filter]); return storedTeacher; },
        find: filter => {
            calls.push([name, filter]);
            return { toArray: async () => [] };
        }
    }));
    await request('/lessons?country=UK');
    await request('/teachers?country=UAE');
    await request('/teachers/' + teacherId + '/lessons');
    assert.deepEqual(calls[0], ['lesson', { country: 'UK' }]);
    assert.deepEqual(calls[1], ['teacher', { country: 'UAE' }]);
    assert.deepEqual(calls[2], ['teacher', { _id: new ObjectId(teacherId) }]);
    assert.deepEqual(calls[3], ['lesson', { _id: { $in: storedTeacher.lessonIDs } }]);
});

test('search escapes literal input and includes numeric substring matching', async t => {
    let filter;
    t.mock.method(database, 'collection', () => ({ find: value => {
        filter = value;
        return { toArray: async () => [] };
    } }));
    await request('/search?q=' + encodeURIComponent('1.(') + '&country=UK');
    assert.equal(filter.country, 'UK');
    assert.equal(filter.$or[0].topic.$regex, '1\\.\\(');
    assert.equal(filter.$or[1].location.$options, 'i');
    assert.equal(filter.$or[2].$expr.$regexMatch.input.$convert.input, '$price');
    assert.equal(filter.$or[3].$expr.$regexMatch.input.$convert.input, '$space');
    await request('/search?q=');
    assert.deepEqual(filter, {});
});

test('PUT sets supplied values and reports missing records and invalid values', async t => {
    let update;
    t.mock.method(database, 'collection', () => ({ updateOne: async (filter, changes) => {
        assert.deepEqual(filter, { _id: storedLesson._id });
        update = changes;
        return { matchedCount: 0 };
    } }));
    const { response } = await request('/lessons/' + lessonId, jsonRequest('PUT', { space: 3, price: 90 }));
    assert.equal(response.status, 404);
    assert.deepEqual(update, { $set: { space: 3, price: 90 } });
    for (const body of [{ space: -1 }, { space: 1.5 }, { price: '90' }, { topic: '' }]) {
        assert.equal((await request('/lessons/' + lessonId, jsonRequest('PUT', body))).response.status, 400);
    }
});

test('orders store repeated ObjectIds and only supported customer fields', async t => {
    let saved;
    t.mock.method(database, 'collection', name => name === 'lesson'
        ? { find: filter => {
            assert.equal(filter._id.$in.length, 1);
            return { toArray: async () => [storedLesson] };
        } }
        : { insertOne: async document => { saved = document; return { insertedId }; } });
    const { response } = await request('/orders', jsonRequest('POST', { ...order, admin: true }));
    assert.equal(response.status, 201);
    assert.deepEqual(saved.lessonIDs, [storedLesson._id, storedLesson._id]);
    assert.equal(saved.admin, undefined);
});

test('checkout retries return the original ID and reject different contents', async t => {
    t.mock.method(database, 'collection', () => ({ findOne: async () => ({
        ...order, _id: insertedId, lessonIDs: [storedLesson._id, storedLesson._id]
    }) }));
    const retry = await request('/orders', jsonRequest('POST', { ...order, checkoutId: 'retry-1' }));
    assert.equal(retry.response.status, 200);
    assert.equal(retry.body.insertedId, String(insertedId));
    const conflict = await request('/orders', jsonRequest('POST', { ...order, name: 'Someone Else', checkoutId: 'retry-1' }));
    assert.equal(conflict.response.status, 409);
});

test('concurrent checkout duplicate uses the unique-index winner', async t => {
    let reads = 0;
    t.mock.method(database, 'collection', name => name === 'lesson'
        ? { find: () => ({ toArray: async () => [storedLesson] }) }
        : {
            findOne: async () => ++reads === 1 ? null : {
                ...order, _id: insertedId, lessonIDs: [storedLesson._id, storedLesson._id]
            },
            insertOne: async () => { throw Object.assign(new Error('Duplicate'), { code: 11000 }); }
        });
    const { response, body } = await request('/orders', jsonRequest('POST', { ...order, checkoutId: 'retry-1' }));
    assert.equal(response.status, 200);
    assert.equal(body.insertedId, String(insertedId));
});

test('missing order lessons and teachers return 404 without writes', async t => {
    t.mock.method(database, 'collection', () => ({
        find: () => ({ toArray: async () => [] }), findOne: async () => null
    }));
    assert.equal((await request('/orders', jsonRequest('POST', order))).response.status, 404);
    assert.equal((await request('/teachers/' + teacherId + '/lessons')).response.status, 404);
    assert.equal((await request('/enrolment/' + lessonId)).response.status, 404);
});

test('enrolment counts purchased slots and returns zero for no orders', async t => {
    let pipeline;
    t.mock.method(database, 'collection', () => ({
        findOne: async () => storedLesson,
        aggregate: stages => { pipeline = stages; return { toArray: async () => [] }; }
    }));
    const { body } = await request('/enrolment/' + lessonId);
    assert.equal(body.enrolled, 0);
    assert.deepEqual(pipeline, [
        { $match: { lessonIDs: storedLesson._id } }, { $unwind: '$lessonIDs' },
        { $match: { lessonIDs: storedLesson._id } }, { $count: 'enrolled' }
    ]);
});

test('database errors return safe JSON and health reports unavailable', async t => {
    t.mock.method(console, 'error', () => {});
    t.mock.method(db, 'getDb', () => { throw new Error('Database unavailable'); });
    const failure = await request('/lessons', { headers: { Origin: 'https://name0x0.github.io' } });
    assert.equal(failure.response.status, 500);
    assert.equal(failure.body.error, 'Internal server error');
    assert.equal(failure.response.headers.get('access-control-allow-origin'), 'https://name0x0.github.io');
    assert.equal((await request('/health')).response.status, 503);
});
