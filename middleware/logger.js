/*
 * middleware/logger.js: prints every request to the console (render shows this as the service log).
 *
 * Handbook (Middleware, 4%): "a 'logger' middleware that outputs all requests to the server console;
 *   the student needs to be able to inspect and explain the log". In the demo (3%) you show the
 *   render log and explain each part of a line.
 *
 * Agreed format: API requests get a full line; render's health checks (/health) get a short line,
 * so EVERY request is still printed, but the API lines stand out:
 *
 *     2026-12-14T10:01:02Z  GET  /lessons      200  38ms
 *       · health 200 1ms
 */
function logger(req, res, next) {
    const startedAt = Date.now();
    const timestamp = new Date().toISOString();
    res.on('finish', () => {
        const duration = Date.now() - startedAt;
        if (req.path === '/health') {
            console.log(`  · health ${res.statusCode} ${duration}ms`);
        } else {
            console.log(`${timestamp}  ${req.method}  ${req.originalUrl}  ${res.statusCode}  ${duration}ms`);
        }
    });
    // Do not wait for 'finish': the next handler must produce the response first.
    next();
}

module.exports = logger;
