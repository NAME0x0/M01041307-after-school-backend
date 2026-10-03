/*
 * routes/lessons.js: reading and updating lessons (collection: lesson).
 *
 * A lesson document looks like:
 *     { _id, topic, location, country: 'UAE' | 'UK', currency: 'AED' | 'GBP', price, space, image }
 */
const express = require('express');

const router = express.Router();

// GET /lessons            -> every lesson (what the marker sends from Postman)
// GET /lessons?country=UK -> only that country's lessons (what the front-end sends)
router.get('/lessons', async (req, res) => {
    // TODO REST GET (2%):
    //   1. Start with an empty filter (it matches every lesson).
    //   2. If req.query.country is present, add { country: <that value> } to the filter.
    //   3. Find the lessons in the 'lesson' collection with that filter, turned into an array.
    //   4. Respond with the array as JSON.
    //   5. If anything throws: respond 500 with a JSON error message.
    //   With NO country, it MUST still return every lesson (the handbook's GET /lessons).
    res.status(501).json({ error: 'Not implemented yet' });
});

// PUT /lessons/:id  body: the fields to set, e.g. { "space": 3 } or { "price": 90, "location": "Hendon" }
router.put('/lessons/:id', async (req, res) => {
    // TODO REST PUT (3%: full marks only if ANY attribute can be set to ANY value;
    //   a route that only adds or subtracts 1 gets 1%):
    //   1. Turn req.params.id into an ObjectId. If it is not a valid ID, respond 400.
    //   2. Respond 400 if the body is empty (nothing to update).
    //   3. updateOne on the 'lesson' collection: find by _id, and $set every field in the body.
    //   4. If no lesson matched: respond 404. Otherwise respond 200 with what changed.
    //   (Think about whether the body may change _id, and be ready to explain your answer.)
    res.status(501).json({ error: 'Not implemented yet' });
});

module.exports = router;
