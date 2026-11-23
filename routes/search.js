/*
 * routes/search.js: back-end search (challenge task, 6%).
 *
 * Handbook: the user searches without choosing an attribute; searching "a" returns every lesson
 *   with "a" in its title (topic), location, price or availability (space). It must be done in the
 *   BACK-END and returned via REST; filtering in the front-end only is capped at 3%.
 *   No extra libraries, and you must be able to explain it, or it can score zero.
 */
const express = require('express');
const validateCountry = require('../middleware/country');
const db = require('../db');

const router = express.Router();

// GET /search?q=term             -> matching lessons from both countries
// GET /search?q=term&country=UAE -> matching lessons from one country
router.get('/search', validateCountry, async (req, res) => {
    if (req.query.q !== undefined && typeof req.query.q !== 'string') {
        return res.status(400).json({ error: 'q must be a single search string' });
    }
    const query = (req.query.q || '').trim();
    const filter = {};
    if (req.query.country !== undefined) filter.country = req.query.country;
    if (query) {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.$or = [
            { topic: { $regex: escaped, $options: 'i' } },
            { location: { $regex: escaped, $options: 'i' } },
            ...['price', 'space'].map(field => ({
                $expr: { $regexMatch: {
                    input: { $convert: { input: '$' + field, to: 'string', onError: '', onNull: '' } },
                    regex: escaped, options: 'i'
                } }
            }))
        ];
    }
    res.json(await db.getDb().collection('lesson').find(filter).toArray());
});

module.exports = router;
