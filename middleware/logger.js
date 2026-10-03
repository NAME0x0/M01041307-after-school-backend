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
    // TODO Logger (4%):
    //   1. Note the time the request arrived.
    //   2. Wait until the response has finished (listen for the response's 'finish' event),
    //      because only then are the status code and the duration known.
    //   3. If the path is /health: print the short line (status code and duration).
    //      Otherwise: print the time, method, URL, status code and duration.
    //   4. Call next() straight away (NOT inside the 'finish' listener), or the request stops here.
    next();
}

module.exports = logger;
