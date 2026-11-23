/*
 * routes/lessons.js: reading and updating lessons (collection: lesson).
 *
 * A lesson document looks like:
 *     { _id, topic, location, country: 'UAE' | 'UK', currency: 'AED' | 'GBP', price, space, image }
 */
const express = require('express');
const validateCountry = require('../middleware/country');
const db = require('../db');
const { ObjectId } = require('mongodb');

const router = express.Router();

// GET /lessons            -> every lesson (what the marker sends from Postman)
// GET /lessons?country=UK -> only that country's lessons (what the front-end sends)
router.get('/lessons', validateCountry, async (req, res) => {
    const filter = {};
    if (req.query.country !== undefined) {
        filter.country = req.query.country;
    }
    res.json(await db.getDb().collection('lesson').find(filter).toArray());
});

// PUT /lessons/:id  body: the fields to set, e.g. { "space": 3 } or { "price": 90, "location": "Hendon" }
router.put('/lessons/:id', async (req, res) => {
    if (!/^[a-f0-9]{24}$/i.test(req.params.id)) {
        return res.status(400).json({ error: 'Lesson ID must contain 24 hexadecimal characters' });
    }
    if (!req.is('application/json')) {
        return res.status(415).json({ error: 'Send the lesson changes as application/json' });
    }
    const changes = req.body;
    if (!changes || typeof changes !== 'object' || Array.isArray(changes)
        || Object.keys(changes).length === 0) {
        return res.status(400).json({ error: 'Provide a non-empty object of lesson changes' });
    }
    if (Object.keys(changes).some(key => key === '_id' || key.startsWith('$') || key.includes('.'))) {
        return res.status(400).json({ error: 'Use simple field names; _id cannot be changed' });
    }
    if (['topic', 'location', 'image'].some(key => key in changes
            && (typeof changes[key] !== 'string' || !changes[key].trim()))
        || ('price' in changes && (!Number.isFinite(changes.price) || changes.price < 0))
        || ('space' in changes && (!Number.isSafeInteger(changes.space) || changes.space < 0))
        || ('country' in changes && !['UAE', 'UK'].includes(changes.country))
        || ('currency' in changes && !['AED', 'GBP'].includes(changes.currency))) {
        return res.status(400).json({ error: 'Provide supported lesson fields with valid values' });
    }
    const result = await db.getDb().collection('lesson').updateOne(
        { _id: new ObjectId(req.params.id) }, { $set: changes }
    );
    if (!result.matchedCount) return res.status(404).json({ error: 'Lesson not found' });
    res.json({ matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
});

module.exports = router;
