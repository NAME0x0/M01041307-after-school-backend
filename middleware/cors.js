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
const allowedOrigins = [
    'https://name0x0.github.io',
    'http://127.0.0.1:5500',
    'http://localhost:5500'
];

function cors(req, res, next) {
    // Vary also belongs on replies without an allowed origin, for correct caching.
    res.vary('Origin');
    const origin = req.get('Origin');
    if (allowedOrigins.includes(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    next();
}

module.exports = cors;
