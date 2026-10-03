/*
 * server.js: entry point of the Express back-end.
 *
 * Core idea
 *   Create the Express app, plug in the middleware in the right order, mount one router
 *   per feature, connect to MongoDB Atlas once, and only then start listening on the port
 *   render gives us (or 3000 on this computer).
 *
 * How to read the TODOs
 *   Each TODO names what it is for (and the handbook marks, where it has some).
 *   The indented lines under it are the steps, in order. The code is yours to write.
 */
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// TODO Middleware, in THIS order (Express runs them top to bottom for every request):
//
//     1. logger          middleware/logger.js   must see EVERY request, so it goes first (4%)
//     2. CORS            middleware/cors.js     answers the browser's preflight (OPTIONS) before any route
//     3. express.json()                         turns a JSON request body into req.body (POST and PUT need it)
//     4. lesson images   middleware/images.js   mounted on '/images' (4%)
//
//   For each one: require the file at the top of this file, then app.use(...) it here.

// TODO Routers (one file per feature), mounted after the middleware:
//
//     routes/health.js      GET /health
//     routes/lessons.js     GET /lessons, PUT /lessons/:id
//     routes/orders.js      POST /orders
//     routes/search.js      GET /search
//     routes/teachers.js    GET /teachers, GET /teachers/:id/lessons
//     routes/enrolment.js   GET /enrolment/:lessonid
//
//   Then a last app.use(...) that answers any other URL with 404 and a JSON error message.

// TODO Start-up order:
//   1. Connect to the database first (connectToDb from db.js).
//   2. Only when that has worked, call app.listen below, so no request arrives before the database is ready.
//   3. If the connection fails: log the error and stop the process (render will show it in the log).
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
