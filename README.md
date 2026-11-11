# After-School Lessons: Back-End (Express + MongoDB)

> **© 2026 Muhammad Afsah Mumtaz (NAME0x0). All rights reserved. View only.**
> This repository is public only because the CST3144 coursework requires it. You may view it on GitHub. You may **not** copy, clone, run, modify, redistribute, submit, or give it to AI tools or agents without my prior **written** permission. See [LICENSE](LICENSE). Copying coursework is also academic misconduct.

CST3144 Coursework 1 (Middlesex University Dubai, 2026/27). The REST API behind the after-school lessons shop: Node.js + Express, the native MongoDB driver, data in MongoDB Atlas, hosted on **render.com**. The front-end is a separate repository.

## Current implementation stage (2026-11-10)

The HTTP layer is implemented using the material saved for Weeks 5, 7 and 8. Week 6 has no saved teaching material. **MongoDB connection and database operations are still TODOs**, by the student's choice; no Atlas or Compass setup has been performed by this change.

- Working: middleware registration, request logging, CORS/preflight, JSON parsing, static lesson images, missing-file/route errors, routers, and request validation.
- Incomplete: persistent lesson reads/updates, order creation, database search, teacher queries, enrolment counting, database health check and connecting before listening.
- Valid requests to data routes return **501** with a specific unfinished-operation message. Invalid requests return **400** or **415**. No request pretends to save an order or update a lesson.
- `/health` returns **503** until the database check is written. This is a local learning stage, **not ready for the Render health check**.

`db.js` is unchanged. The server currently starts without it so the HTTP layer can be tested independently. At the database stage, connect successfully before calling `app.listen`. The existing test-only mock API remains separate; do not run it and this server on port 3000 at the same time. The frontend still needs that mock to display lessons until the real database routes are finished.

## Links

| | |
|---|---|
| This repository | https://github.com/NAME0x0/M01041307-after-school-backend |
| Front-end repository | https://github.com/NAME0x0/M01041307-after-school-frontend |
| Live front-end | https://name0x0.github.io/M01041307-after-school-frontend/ |
| Hosted API | https://m01041307-after-school.onrender.com (the address **must** contain the student number) |
| Route returning all lessons | https://m01041307-after-school.onrender.com/lessons |

## Rules from the Dubai handbook (breaking one can mean a zero)

- Server is **Node.js**; REST API is **Express.js**.
- MongoDB access uses the **native Node.js driver only**. No Mongoose.
- Data is stored in **MongoDB Atlas** and read through this app. No local database.
- Hosted on **render.com** only, with the student number in the address.
- **At least 10 commits** in this repository.
- Challenge tasks use no extra libraries, and must be explainable, or they can score zero.

## Stack

| Part | Choice |
|---|---|
| Runtime | Node.js 24 (pinned in `.node-version`) |
| Framework | Express 5.2.1, CommonJS (`require`) |
| Database | MongoDB Atlas via the `mongodb` driver 7.7.0; database `afterschool` |
| Hosting | render.com free web service, region Frankfurt, created from `render.yaml` |
| Dev tooling | Node built-ins only: `--watch` (restart on save) and `--env-file` (load `.env`) |

## Structure

```
server.js              middleware, routers, errors and listen; DB startup still TODO
db.js                  shared MongoDB connection TODO
middleware/logger.js   prints every request (render shows it as the log)
middleware/cors.js     lets the GitHub Pages front-end call this API
middleware/country.js  validates the optional UAE/UK query parameter
middleware/images.js   serves /images/<file>, or a "not found" message
routes/health.js       GET /health  (render's health check)
routes/lessons.js      GET /lessons, PUT /lessons/:id
routes/orders.js       POST /orders
routes/search.js       GET /search
routes/teachers.js     GET /teachers, GET /teachers/:id/lessons
routes/enrolment.js    GET /enrolment/:lessonid
images/                lesson images (one per topic, .webp)
seed/                  starting data to import into Atlas with Compass
render.yaml            render Blueprint
tests/server.test.cjs   HTTP-layer checks; no Atlas or mock API required
```

## API

This table describes the intended final API. At this stage the data operations below are TODOs (501); images work, and database health reports unavailable (503).

| Method & path | Purpose | Marks |
|---|---|---|
| `GET /lessons` | All lessons as JSON. Optional `?country=UAE` or `?country=UK` filters | 2% |
| `PUT /lessons/:id` | Set **any** attributes of one lesson to any values (body: the fields to set) | 3% |
| `POST /orders` | Save a new order in the `order` collection | 2% |
| `GET /search?q=term` | Back-end search across all lesson attributes. Optional `&country=` | 6% (challenge) |
| `GET /teachers` | All teachers. Optional `?country=` | 8% (challenge, with the next row) |
| `GET /teachers/:id/lessons` | The lessons one teacher teaches | |
| `GET /enrolment/:lessonid` | How many spaces of that lesson have been bought | 6% (challenge) |
| `GET /images/<file>` | A lesson image, or a JSON "not found" error | 4% (middleware) |
| `GET /health` | 200 when the server and Atlas both answer, 503 otherwise | render health check |

Every request is printed by the logger middleware (4%); you must be able to explain the log in the demo.

## Data model (database `afterschool`)

| Collection | Fields |
|---|---|
| `lesson` | `topic`, `location`, `country` (`UAE` / `UK`), `currency` (`AED` / `GBP`), `price`, `space`, `image` |
| `order` | `name`, `phone`, `lessonIDs` (one entry per space bought), `spaces` |
| `teacher` | `firstName`, `lastName`, `country`, `lessonIDs` |

Starting data for `lesson` and `teacher` is in `seed/` (see `seed/README.md`). Once database operations are implemented, the first checkout creates `order`. The current frontend also supplies an optional `email` and a `checkoutId` for retry handling. These have request validation; saving them and preventing duplicate orders remain database-stage TODOs.

## Environment

Copy `.env.example` to `.env` (git-ignored) and fill it in. On render, `MONGODB_URI` is entered once when the Blueprint is created; `DB_NAME` comes from `render.yaml`; render supplies `PORT` itself.

## Run locally

```
npm install
npm start          # HTTP-only stage: no .env or database connection needed
npm run dev        # node --watch --env-file=.env server.js  (restarts on save)
npm test           # built-in Node tests; temporary local server closes afterward
```

`npm run dev` requires a local `.env` file. `npm start` can be used without one while the database is unfinished. No additional runtime or test libraries were added.

For local frontend access, use `http://127.0.0.1:5500` or `http://localhost:5500`. The other allowed origin is `https://name0x0.github.io`. CORS grants browser access to those exact origins, allows GET/POST/PUT/OPTIONS and Content-Type, and answers preflight with 204. CORS is not authentication and does not block direct non-browser requests.

HTTP examples for this stage:

| Request | Expected result |
|---|---|
| `GET /images/piano.webp` | 200, actual image |
| `GET /images/missing.webp` | 404, JSON image error |
| `GET /lessons?country=UAE` | 501, database query TODO |
| `GET /lessons?country=France` | 400, unsupported country |
| `POST /orders` with valid JSON order | 501, database insert TODO |
| `PUT /lessons/<24-hex-id>` with a non-empty JSON object | 501, database update TODO |
| `GET /health` | 503, database check TODO |

PUT checks object shape and field names; data-type/value rules and record existence must be completed with the database stage. POST checks the current frontend's name, digits-only international phone, lesson IDs, space count, optional email format and optional checkout ID. Email format validation does not verify ownership of the address. Search, teacher and enrolment algorithms remain TODOs; no DELETE endpoint was added because the coursework API does not require one.

The middleware uses Express's built-in facilities: [middleware guide](https://expressjs.com/en/guide/using-middleware/) and [static-file guide](https://expressjs.com/en/starter/static-files/).

## MongoDB Atlas setup (in your Atlas account)

1. Create a free (M0) cluster on **AWS, Frankfurt (eu-central-1)**, the same region as render. Check that M0 is offered there when you create it.
2. **Database Access**: add a user with **readWrite on `afterschool` only** and a long generated password.
3. **Network Access**: allow `0.0.0.0/0`. render's free tier has no fixed outbound IP, so the dedicated user and its password are what protect the data.
4. Copy the connection string into `.env` as `MONGODB_URI`.
5. In Compass, import `seed/lesson.json` into `afterschool.lesson` and `seed/teacher.json` into `afterschool.teacher`.

## Deploy on render (in your render account)

1. render dashboard → **New** → **Blueprint** → connect this repository.
2. render reads `render.yaml` and asks for `MONGODB_URI`: paste the Atlas connection string there (never into the repository).
3. Confirm the service address contains **M01041307**. If render had to change the name, update the READMEs and the front-end's `API_URL`.
4. `GET /health` must answer 2xx before the first deploy succeeds, or render keeps restarting the service.
5. Free services sleep after 15 minutes without traffic and take about a minute to wake: open `/lessons` a few minutes before the demo.

## Credits & third-party notices

| Component | Version | Licence | Source |
|---|---|---|---|
| Node.js | 24 | MIT | https://nodejs.org |
| Express | 5.2.1 | MIT | https://expressjs.com |
| MongoDB Node.js driver | 7.7.0 | Apache-2.0 | https://github.com/mongodb/node-mongodb-native |
| MongoDB Atlas | n/a | Hosted database service | https://www.mongodb.com/atlas |
| render.com | n/a | Hosting service | https://render.com |
| Lesson images | n/a | AI-generated for this project; tool and prompts recorded in the coursework GenAI log | n/a |

**GenAI acknowledgement:** parts of this project's setup were produced with AI assistance and are declared in the coursework's GenAI log, as the module's AMBER rule requires. All application logic is written by the author.

## Licence

Proprietary, all rights reserved, view only. See [LICENSE](LICENSE).
