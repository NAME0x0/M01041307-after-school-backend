/*
 * routes/health.js: GET /health, render's health check (render.yaml: healthCheckPath).
 *
 * Core idea
 *   Healthy means BOTH this server and the database answer.
 *   Until the database stage is implemented, report unavailable rather than ready.
 */
const express = require('express');

const router = express.Router();

router.get('/health', (req, res) => {
    // TODO Health check:
    //   1. Ask the database to answer a ping (the database's command method, with { ping: 1 }).
    //   2. If it answers: respond 200 with { status: 'ok' }.
    //   3. If it throws (Atlas unreachable): respond 503 with { status: 'unavailable' }.
    res.status(503).json({ status: 'unavailable', error: 'Database health check not implemented yet' });
});

module.exports = router;
