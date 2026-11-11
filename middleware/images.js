/*
 * middleware/images.js: serves lesson images from the images/ folder at /images/<file>.
 *
 * Handbook (Middleware, 4%): "a static file middleware that returns lesson images, or an error
 *   message if the image file does not exist; the student needs to be able to test and
 *   demonstrate these aspects". Demo both: one image that exists, and one name that does not.
 *
 * Images are one per topic, .webp (e.g. football.webp); each lesson's "image" field holds the file name.
 */
const express = require('express');
const path = require('path');

const images = express.Router();

// An absolute root works regardless of the directory used to launch Node.
// express.static confines requests to this folder and ignores dotfiles by default.
images.use(express.static(path.join(__dirname, '..', 'images'), {
    index: false,
    redirect: false
}));

// Missing files fall through from express.static to this response.
images.use((req, res) => {
    res.status(404).json({ error: 'Image not found' });
});

module.exports = images;
