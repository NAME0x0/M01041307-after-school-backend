/*
 * server.js: entry point of the Express back-end.
 *
 * Core idea
 *   Middleware runs in registration order, then a router handles the request.
 *   This stage covers the HTTP layer only: database operations remain TODOs.
 */
const express = require('express');
const logger = require('./middleware/logger');
const cors = require('./middleware/cors');
const images = require('./middleware/images');
const health = require('./routes/health');
const lessons = require('./routes/lessons');
const orders = require('./routes/orders');
const search = require('./routes/search');
const teachers = require('./routes/teachers');
const enrolment = require('./routes/enrolment');

const app = express();
const PORT = process.env.PORT || 3000;

// The logger sees preflights, parser errors, missing files and API requests.
app.use(logger);
app.use(cors);
app.use(express.json());
app.use('/images', images);

app.use(health);
app.use(lessons);
app.use(orders);
app.use(search);
app.use(teachers);
app.use(enrolment);

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Express recognises error middleware by its four parameters.
app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }
    const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
        ? error.status : 500;
    let message = status === 500 ? 'Internal server error' : error.message;
    if (error.type === 'entity.parse.failed') {
        message = 'Request body must contain valid JSON';
    }
    if (status === 500) {
        console.error(error.message);
    }
    res.status(status).json({ error: message });
});

// TODO Database stage: connectToDb() BEFORE listening; stop if the connection fails.
// Requiring this file in a test exports the app without starting another server.
if (require.main === module) {
    app.listen(PORT, error => {
        if (error) {
            console.error(error.message);
            process.exitCode = 1;
            return;
        }
        console.log(`Server listening on port ${PORT} (database operations not implemented)`);
    });
}

module.exports = app;
