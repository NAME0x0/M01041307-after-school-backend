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
const db = require('../db');
const { ObjectId } = require('mongodb');

const router = express.Router();

// GET /enrolment/:lessonid
router.get('/enrolment/:lessonid', async (req, res) => {
    if (!/^[a-f0-9]{24}$/i.test(req.params.lessonid)) {
        return res.status(400).json({ error: 'Lesson ID must contain 24 hexadecimal characters' });
    }
    const id = new ObjectId(req.params.lessonid);
    const database = db.getDb();
    if (!await database.collection('lesson').findOne({ _id: id })) {
        return res.status(404).json({ error: 'Lesson not found' });
    }
    const counts = await database.collection('order').aggregate([
        { $match: { lessonIDs: id } },
        { $unwind: '$lessonIDs' },
        { $match: { lessonIDs: id } },
        { $count: 'enrolled' }
    ]).toArray();
    res.json({ lessonID: id.toHexString(), enrolled: counts[0]?.enrolled || 0 });
});

module.exports = router;
