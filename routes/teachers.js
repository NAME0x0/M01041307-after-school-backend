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
const validateCountry = require('../middleware/country');
const db = require('../db');
const { ObjectId } = require('mongodb');

const router = express.Router();

// GET /teachers               -> every teacher
// GET /teachers?country=UAE   -> one country's teachers (fills the front-end's picker)
router.get('/teachers', validateCountry, async (req, res) => {
    const filter = req.query.country === undefined ? {} : { country: req.query.country };
    res.json(await db.getDb().collection('teacher').find(filter).toArray());
});

// GET /teachers/:id/lessons -> the lessons that one teacher teaches
router.get('/teachers/:id/lessons', async (req, res) => {
    if (!/^[a-f0-9]{24}$/i.test(req.params.id)) {
        return res.status(400).json({ error: 'Teacher ID must contain 24 hexadecimal characters' });
    }
    const database = db.getDb();
    const teacher = await database.collection('teacher').findOne({ _id: new ObjectId(req.params.id) });
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    res.json(await database.collection('lesson').find({ _id: { $in: teacher.lessonIDs || [] } }).toArray());
});

module.exports = router;
