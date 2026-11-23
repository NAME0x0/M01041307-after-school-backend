/*
 * server.js: entry point of the Express back-end.
 *
 * Core idea
 *   Middleware runs in registration order, then a router handles the request.
 *   Connect to MongoDB before accepting requests.
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
const { connectToDb, closeDb } = require('./db');

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

// Requiring this file in a test exports the app without starting another server.
if (require.main === module) {
    connectToDb().then(() => {
        const server = app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
        server.on('error', async () => {
            console.error('Unable to start HTTP server');
            await closeDb();
            process.exitCode = 1;
        });
        for (const signal of ['SIGINT', 'SIGTERM']) {
            process.once(signal, () => server.close(async () => {
                await closeDb();
                process.exitCode = 0;
            }));
        }
    }).catch(() => {
        // Driver errors can contain connection details; keep credentials out of logs.
        console.error('Database startup failed. Check MONGODB_URI, DB_NAME and Atlas network access.');
        process.exitCode = 1;
    });
}

module.exports = app;
