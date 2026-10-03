/*
 * routes/search.js: back-end search (challenge task, 6%).
 *
 * Handbook: the user searches without choosing an attribute; searching "a" returns every lesson
 *   with "a" in its title (topic), location, price or availability (space). It must be done in the
 *   BACK-END and returned via REST; filtering in the front-end only is capped at 3%.
 *   No extra libraries, and you must be able to explain it, or it can score zero.
 */
const express = require('express');

const router = express.Router();

// GET /search?q=term             -> matching lessons from both countries
// GET /search?q=term&country=UAE -> matching lessons from one country
router.get('/search', async (req, res) => {
    // TODO Search (6%):
    //   1. Read q (and the optional country) from req.query. If q is empty, respond with all lessons.
    //   2. Escape q before using it in a regular expression, so characters like . or ( are taken literally.
    //   3. Text fields (topic, location): a case-insensitive regular expression match.
    //   4. Number fields (price, space): they are numbers, so a text regex does not match them directly.
    //      Pick a way and be ready to explain it, e.g. compare them as text inside the query
    //      ($expr with $toString and $regexMatch), or match the exact number when q is numeric.
    //   5. Combine the conditions with $or (any one field matching is enough),
    //      and add { country } with $and when a country was given.
    //   6. Respond with the matching lessons as JSON.
    res.status(501).json({ error: 'Not implemented yet' });
});

module.exports = router;
