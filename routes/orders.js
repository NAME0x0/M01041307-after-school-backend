/*
 * routes/orders.js: saving orders (collection: order).
 *
 * An order document looks like (agreed shape: one lesson ID per space bought):
 *     { _id, name, phone, lessonIDs: [<mathId>, <mathId>, <englishId>], spaces: 3 }
 * Repeating an ID once per space is what lets GET /enrolment/:lessonid count spaces per lesson.
 */
const express = require('express');

const router = express.Router();

// POST /orders  body: { name, phone, lessonIDs, spaces }
router.post('/orders', async (req, res) => {
    // TODO REST POST (2%):
    //   1. Read name, phone, lessonIDs and spaces from req.body.
    //   2. Check them on the server too (never trust the browser):
    //          name letters only, phone digits only,
    //          lessonIDs a non-empty array, spaces equal to the number of entries in lessonIDs.
    //      If something is wrong: respond 400 with a JSON message saying what.
    //   3. Decide whether lessonIDs are stored as strings or as ObjectIds, and be consistent
    //      (GET /enrolment/:lessonid must look for the same type).
    //   4. insertOne into the 'order' collection.
    //   5. Respond 201 (Created) with the new order's _id.
    res.status(501).json({ error: 'Not implemented yet' });
});

module.exports = router;
