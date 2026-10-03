/*
 * routes/enrolment.js: how many spaces of one lesson have been bought (challenge task, 6%).
 *
 * Handbook: "Implement a GET route /enrolment/:lessonid which takes as input the id of a lesson,
 *   and returns the enrolment number for that lesson, i.e. the number of slots that have already
 *   been purchased." No extra libraries, and you must be able to explain it, or it can score zero.
 *
 * Because each order repeats a lesson's ID once per space bought (orders.js), the enrolment
 * number is simply how many times this lesson's ID appears across all orders' lessonIDs.
 */
const express = require('express');

const router = express.Router();

// GET /enrolment/:lessonid
router.get('/enrolment/:lessonid', async (req, res) => {
    // TODO Enrolment (6%):
    //   1. Read the lesson ID from req.params.lessonid (as the same type orders.js stores: string or ObjectId).
    //   2. Count its appearances across every order's lessonIDs. One way, with an aggregation pipeline:
    //          $unwind lessonIDs   (one row per ID in each order)
    //          $match  that ID
    //          $count  the rows
    //   3. Respond with { lessonID: <the id>, enrolled: <the count> } (0 when nobody has bought it yet).
    res.status(501).json({ error: 'Not implemented yet' });
});

module.exports = router;
