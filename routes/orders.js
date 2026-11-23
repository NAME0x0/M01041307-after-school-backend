/*
 * routes/orders.js: saving orders (collection: order).
 *
 * An order document looks like (agreed shape: one lesson ID per space bought):
 *     { _id, name, phone, lessonIDs: [<mathId>, <mathId>, <englishId>], spaces: 3 }
 * Repeating an ID once per space is what lets GET /enrolment/:lessonid count spaces per lesson.
 */
const express = require('express');
const db = require('../db');
const { ObjectId } = require('mongodb');

const router = express.Router();

// POST /orders  body: { name, phone, lessonIDs, spaces, checkoutId?, email? }
router.post('/orders', async (req, res) => {
    if (!req.is('application/json')) {
        return res.status(415).json({ error: 'Send the order as application/json' });
    }
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        return res.status(400).json({ error: 'Provide an order object' });
    }
    const { name, phone, lessonIDs, spaces, email, checkoutId } = req.body;
    if (typeof name !== 'string' || !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(name.trim())) {
        return res.status(400).json({ error: 'Name must contain letters separated by single spaces' });
    }
    if (typeof phone !== 'string' || !/^[0-9]{1,15}$/.test(phone) || !/[1-9]/.test(phone)) {
        return res.status(400).json({ error: 'Phone must be a string of up to 15 digits' });
    }
    if (!Array.isArray(lessonIDs) || lessonIDs.length === 0
        || lessonIDs.some(id => typeof id !== 'string' || !/^[a-f0-9]{24}$/i.test(id))) {
        return res.status(400).json({ error: 'Provide a non-empty array of lesson IDs' });
    }
    if (!Number.isInteger(spaces) || spaces !== lessonIDs.length) {
        return res.status(400).json({ error: 'spaces must equal the number of entries in lessonIDs' });
    }
    if (email !== undefined && (typeof email !== 'string'
        || (email.trim() !== '' && !/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(email.trim())))) {
        return res.status(400).json({ error: 'Provide a valid email address or leave it empty' });
    }
    if (checkoutId !== undefined && (typeof checkoutId !== 'string' || !checkoutId.trim())) {
        return res.status(400).json({ error: 'checkoutId must be a non-empty string when provided' });
    }
    const database = db.getDb();
    const orders = database.collection('order');
    const document = {
        name: name.trim(), phone, lessonIDs: lessonIDs.map(id => new ObjectId(id)), spaces
    };
    if (email !== undefined) document.email = email.trim();
    if (checkoutId !== undefined) document.checkoutId = checkoutId.trim();

    function replay(existing) {
        const same = existing.name === document.name && existing.phone === document.phone
            && existing.spaces === spaces && (existing.email || '') === (document.email || '')
            && JSON.stringify(existing.lessonIDs.map(String).sort())
                === JSON.stringify(document.lessonIDs.map(String).sort());
        if (!same) return res.status(409).json({ error: 'checkoutId already belongs to a different order' });
        return res.json({ insertedId: existing._id });
    }

    if (document.checkoutId) {
        const existing = await orders.findOne({ checkoutId: document.checkoutId });
        if (existing) return replay(existing);
    }
    const uniqueIds = [...new Set(document.lessonIDs.map(String))].map(id => new ObjectId(id));
    const lessons = await database.collection('lesson').find({ _id: { $in: uniqueIds } }).toArray();
    if (lessons.length !== uniqueIds.length) {
        return res.status(404).json({ error: 'One or more lessons do not exist' });
    }
    try {
        const result = await orders.insertOne(document);
        res.status(201).json({ insertedId: result.insertedId });
    } catch (error) {
        // The unique index also protects simultaneous retries from duplicate inserts.
        if (error.code !== 11000 || !document.checkoutId) throw error;
        const existing = await orders.findOne({ checkoutId: document.checkoutId });
        if (!existing) throw error;
        return replay(existing);
    }
});

module.exports = router;
