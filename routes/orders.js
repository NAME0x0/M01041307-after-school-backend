/*
 * routes/orders.js: saving orders (collection: order).
 *
 * An order document looks like (agreed shape: one lesson ID per space bought):
 *     { _id, name, phone, lessonIDs: [<mathId>, <mathId>, <englishId>], spaces: 3 }
 * Repeating an ID once per space is what lets GET /enrolment/:lessonid count spaces per lesson.
 */
const express = require('express');

const router = express.Router();

// POST /orders  body: { name, phone, lessonIDs, spaces, checkoutId?, email? }
router.post('/orders', (req, res) => {
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
    // TODO Database: validate that the lessons exist, agree on the stored ID type,
    // save only the supported order fields, then return 201 with the inserted ID.
    // Store optional email when supplied; it is format validation, not email authentication.
    // TODO Database: handle checkoutId retries without inserting the same order twice.
    res.status(501).json({ error: 'Order database insert not implemented yet' });
});

module.exports = router;
