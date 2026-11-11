/*
 * routes/lessons.js: reading and updating lessons (collection: lesson).
 *
 * A lesson document looks like:
 *     { _id, topic, location, country: 'UAE' | 'UK', currency: 'AED' | 'GBP', price, space, image }
 */
const express = require('express');
const validateCountry = require('../middleware/country');

const router = express.Router();

// GET /lessons            -> every lesson (what the marker sends from Postman)
// GET /lessons?country=UK -> only that country's lessons (what the front-end sends)
router.get('/lessons', validateCountry, (req, res) => {
    const filter = {};
    if (req.query.country !== undefined) {
        filter.country = req.query.country;
    }
    // TODO Database: find lessons with filter, await the array, then return JSON.
    //   With NO country, it MUST still return every lesson (the handbook's GET /lessons).
    res.status(501).json({ error: 'Lesson database query not implemented yet' });
});

// PUT /lessons/:id  body: the fields to set, e.g. { "space": 3 } or { "price": 90, "location": "Hendon" }
router.put('/lessons/:id', (req, res) => {
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
    // TODO Database: convert the ID, update the supplied fields, return 404 if not found.
    // Set attributes to their supplied values, not just an increment/decrement (3%).
    res.status(501).json({ error: 'Lesson database update not implemented yet' });
});

module.exports = router;
