/*
 * routes/health.js: GET /health, render's health check (render.yaml: healthCheckPath).
 *
 * Core idea
 *   Healthy means BOTH this server and the database answer.
 *   A failed database ping reports unavailable.
 */
const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/health', async (req, res) => {
    try {
        await db.getDb().command({ ping: 1 });
        res.json({ status: 'ok' });
    } catch {
        res.status(503).json({ status: 'unavailable' });
    }
});

module.exports = router;
