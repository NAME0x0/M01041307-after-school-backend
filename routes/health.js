/*
 * routes/health.js: GET /health, render's health check (render.yaml: healthCheckPath).
 *
 * Core idea
 *   render calls this every few seconds. Any 2xx reply within 5 seconds means "healthy";
 *   after 15 seconds of failures render stops sending traffic, after 60 seconds it restarts the service.
 *   Agreed: healthy only if BOTH this server and the database answer.
 *   It must work BEFORE the first deploy, or render keeps restarting the service.
 */
const express = require('express');

const router = express.Router();

router.get('/health', async (req, res) => {
    // TODO Health check:
    //   1. Ask the database to answer a ping (the database's command method, with { ping: 1 }).
    //   2. If it answers: respond 200 with { status: 'ok' }.
    //   3. If it throws (Atlas unreachable): respond 503 with { status: 'unavailable' }.
    res.status(501).json({ error: 'Not implemented yet' });
});

module.exports = router;
