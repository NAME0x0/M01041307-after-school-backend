const assert = require('node:assert/strict');
const { test } = require('node:test');
const { MongoClient } = require('mongodb');
const db = require('../db');

function configure(t) {
    const original = { uri: process.env.MONGODB_URI, name: process.env.DB_NAME };
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017';
    process.env.DB_NAME = 'afterschool-test';
    t.after(async () => {
        await db.closeDb();
        if (original.uri === undefined) delete process.env.MONGODB_URI;
        else process.env.MONGODB_URI = original.uri;
        if (original.name === undefined) delete process.env.DB_NAME;
        else process.env.DB_NAME = original.name;
    });
}

test('connection pings and establishes retry uniqueness before publishing the database', async t => {
    configure(t);
    const events = [];
    const database = {
        command: async command => { assert.deepEqual(command, { ping: 1 }); events.push('ping'); },
        collection: name => {
            assert.equal(name, 'order');
            return { createIndex: async (keys, options) => {
                assert.throws(() => db.getDb(), /not connected/);
                assert.deepEqual(keys, { checkoutId: 1 });
                assert.deepEqual(options, {
                    unique: true, partialFilterExpression: { checkoutId: { $type: 'string' } }
                });
                events.push('index');
            } };
        }
    };
    t.mock.method(MongoClient.prototype, 'connect', async () => { events.push('connect'); });
    t.mock.method(MongoClient.prototype, 'db', name => {
        assert.equal(name, 'afterschool-test');
        return database;
    });
    t.mock.method(MongoClient.prototype, 'close', async () => { events.push('close'); });
    assert.equal(await db.connectToDb(), database);
    assert.equal(await db.connectToDb(), database);
    assert.equal(db.getDb(), database);
    assert.deepEqual(events, ['connect', 'ping', 'index']);
    await db.closeDb();
    assert.deepEqual(events, ['connect', 'ping', 'index', 'close']);
    assert.throws(() => db.getDb(), /not connected/);
});

test('failed database initialization closes its client and leaves no usable database', async t => {
    configure(t);
    let closed = false;
    t.mock.method(MongoClient.prototype, 'connect', async () => {});
    t.mock.method(MongoClient.prototype, 'db', () => ({ command: async () => { throw new Error('offline'); } }));
    t.mock.method(MongoClient.prototype, 'close', async () => { closed = true; });
    await assert.rejects(db.connectToDb(), /offline/);
    assert.equal(closed, true);
    assert.throws(() => db.getDb(), /not connected/);
});

test('missing database configuration fails before constructing a connection', async t => {
    configure(t);
    delete process.env.MONGODB_URI;
    await assert.rejects(db.connectToDb(), /MONGODB_URI is required/);
});
