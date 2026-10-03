/*
 * db.js: the single connection to MongoDB Atlas, shared by every route.
 *
 * Core idea
 *   Connect ONCE when the server starts (connecting on every request is slow and runs out
 *   of connections), keep hold of the database, and hand it to any route that asks.
 *   Uses the native MongoDB Node.js driver only (handbook: no Mongoose).
 *
 *   Database: afterschool    Collections: lesson, order, teacher
 */

// TODO connectToDb():
//   1. Read MONGODB_URI and DB_NAME from process.env.
//      Never write the URI in code: it contains the database password.
//   2. Create a MongoClient with the URI and wait for it to connect.
//   3. Keep client.db(DB_NAME) in a variable at the top of this file.
async function connectToDb() {}

// TODO getDb():
//   Return the database kept by connectToDb().
//   If connectToDb() has not run yet, throw an error that says so (easier to debug than "undefined").
function getDb() {}

module.exports = { connectToDb, getDb };
