/*
 * middleware/cors.js: lets the front-end on GitHub Pages call this API.
 *
 * Core idea
 *   The page lives on one origin (https://name0x0.github.io) and calls another
 *   (https://m01041307-after-school.onrender.com). Browsers block reading the reply unless
 *   this server says that origin is allowed (CORS headers). A JSON POST or PUT also makes the
 *   browser send a "preflight" OPTIONS request first, asking permission.
 *   CORS is enforced only by browsers: Postman and curl ignore it, so it is not a password.
 */
function cors(req, res, next) {
    // TODO CORS:
    //   1. The allow-list (agreed):
    //          https://name0x0.github.io    GitHub Pages, the deployed front-end
    //          http://127.0.0.1:5500        Live Server while developing
    //          http://localhost:5500
    //   2. If the request's Origin header is in the list:
    //          send it back in the Access-Control-Allow-Origin header, and add Vary: Origin
    //          (so caches keep a separate copy per origin).
    //      If it is not in the list: send no CORS header at all.
    //   3. Also allow the methods GET, POST, PUT, OPTIONS and the header Content-Type.
    //   4. A preflight (method OPTIONS) needs no route: answer it straight away with status 204.
    //      Every other request continues with next().
    next();
}

module.exports = cors;
