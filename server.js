/*
 * server.js: entry point of the Express back-end.
 *
 * Core idea
 *   Create the Express app and start listening for HTTP requests on the port
 *   render gives us (or 3000 on this computer).
 */
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
