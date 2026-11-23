/*
 * db.js: the single connection to MongoDB Atlas, shared by every route.
 *
 * Core idea
 *   Connect ONCE when the server starts (connecting on every request is slow and runs out
 *   of connections), keep hold of the database, and hand it to any route that asks.
 *   Uses the native MongoDB Node.js driver only (handbook: no Mongoose).
 *
 *   Database: afterschool    Collections: lesson, order, teacher
 */

// Credentials come from the environment; one client serves every route.
const { MongoClient } = require('mongodb');
const dns = require('node:dns');
let client;
let database;

async function connectToDb() {
    if (database) return database;
    const uri = process.env.MONGODB_URI;
    const name = process.env.DB_NAME || 'afterschool';
    if (!uri) throw new Error('MONGODB_URI is required');
    if (process.env.DNS_SERVERS) {
        dns.setServers(process.env.DNS_SERVERS.split(',').map(value => value.trim()));
    }
    const connection = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
    try {
        await connection.connect();
        const db = connection.db(name);
        await db.command({ ping: 1 });
        await db.collection('order').createIndex({ checkoutId: 1 }, {
            unique: true, partialFilterExpression: { checkoutId: { $type: 'string' } }
        });
        client = connection;
        database = db;
        return database;
    } catch (error) {
        await connection.close();
        throw error;
    }
}

// Fail clearly if a caller tries to query before startup completes.
function getDb() {
    if (!database) throw new Error('Database is not connected');
    return database;
}

async function closeDb() {
    database = undefined;
    if (client) await client.close();
    client = undefined;
}

module.exports = { connectToDb, getDb, closeDb };
