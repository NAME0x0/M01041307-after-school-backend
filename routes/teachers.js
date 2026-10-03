/*
 * routes/teachers.js: teachers and their lessons (challenge task, 8%; collection: teacher).
 *
 * Handbook: the database stores teachers (first name, last name, and the lessons they teach);
 *   the user chooses a teacher and sees all the lessons taught by that teacher.
 *   No extra libraries, and you must be able to explain it, or it can score zero.
 *
 * A teacher document looks like:
 *     { _id, firstName, lastName, country: 'UAE' | 'UK', lessonIDs: [<ObjectId>, ...] }
 */
const express = require('express');

const router = express.Router();

// GET /teachers               -> every teacher
// GET /teachers?country=UAE   -> one country's teachers (fills the front-end's picker)
router.get('/teachers', async (req, res) => {
    // TODO Teachers (8%), part 1:
    //   1. Build a filter: empty, or { country } when req.query.country is given.
    //   2. Find the matching teachers in the 'teacher' collection and respond with them as JSON.
    res.status(501).json({ error: 'Not implemented yet' });
});

// GET /teachers/:id/lessons -> the lessons that one teacher teaches
router.get('/teachers/:id/lessons', async (req, res) => {
    // TODO Teachers (8%), part 2:
    //   1. Turn req.params.id into an ObjectId (respond 400 if it is not valid).
    //   2. Find that teacher. If there is none, respond 404.
    //   3. Find the lessons whose _id is in the teacher's lessonIDs (the $in operator).
    //   4. Respond with those lessons as JSON.
    res.status(501).json({ error: 'Not implemented yet' });
});

module.exports = router;
