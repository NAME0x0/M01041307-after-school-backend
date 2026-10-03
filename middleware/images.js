/*
 * middleware/images.js: serves lesson images from the images/ folder at /images/<file>.
 *
 * Handbook (Middleware, 4%): "a static file middleware that returns lesson images, or an error
 *   message if the image file does not exist; the student needs to be able to test and
 *   demonstrate these aspects". Demo both: one image that exists, and one name that does not.
 *
 * Images are one per topic, .webp (e.g. math.webp); each lesson's "image" field holds the file name.
 */
function images(req, res, next) {
    // TODO Static images (4%) (mounted in server.js on '/images', so req.path is just '/<file>'):
    //   1. Build the full path from the images folder and the requested file name,
    //      with the path module, so it works on Windows (here) and Linux (render).
    //   2. Make sure the result is still INSIDE the images folder:
    //      a request like /images/../server.js must not escape and send your code.
    //   3. If the file exists: send it (Express sets the right Content-Type, e.g. image/webp).
    //   4. If it does not: respond 404 with a clear JSON error, e.g. { error: 'Image not found: <name>' }.
    //   (An alternative to steps 1-3 is express.static on the images folder, followed by your own
    //    404 middleware for step 4. Either way, be ready to explain which one you chose and why.)
    next();
}

module.exports = images;
