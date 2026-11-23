# After-School Lessons: Back-End (Express + MongoDB)

> **© 2026 Muhammad Afsah Mumtaz (NAME0x0). All rights reserved. View only.**
> This repository is public only because the CST3144 coursework requires it. You may view it on GitHub. You may **not** copy, clone, run, modify, redistribute, submit, or give it to AI tools or agents without my prior **written** permission. See [LICENSE](LICENSE). Copying coursework is also academic misconduct.

CST3144 Coursework 1 (Middlesex University Dubai, 2026/27). The REST API behind the after-school lessons shop: Node.js + Express, the native MongoDB driver, data in MongoDB Atlas, hosted on **render.com**. The front-end is a separate repository.

## Current implementation stage (2026-11-23)

The HTTP layer and MongoDB operations are implemented. The server connects to Atlas, pings the database and creates a unique partial checkout-ID index before listening. Render deployment is pending. Local startup, database health and live lesson/teacher reads have been verified; live writes and the full frontend checkout still need verification.

- Implemented: request logging, CORS/preflight, JSON parsing, static images, errors and request validation.
- Implemented: lesson reads/updates, order creation, database search, teacher queries and enrolment counting.
- Successful reads/updates return **200**; new orders return **201** with `insertedId`. An identical checkout retry returns **200** with the original ID; different contents with the same checkout ID return **409**.
- `/health` returns **200** when the database answers its ping, **503** otherwise.

`db.js` shares one connection across routes. Missing credentials or a failed connection prevent HTTP startup. Tests use stubbed database calls and a temporary local HTTP server; they do not modify Atlas.

## Relationship to the saved lectures

The implementation follows the lecture stack and request flow. It is an application of the examples to this project's lesson/order data, not a literal copy of the demonstration applications.

| Lecture | Matching implementation |
|---|---|
| Week 5, slides 17 and 26 | CommonJS `require` and `module.exports` split the backend into modules |
| Week 7, slides 4–8 and 18–19 | Express routers, ordered middleware, request logging, static files and missing-file responses |
| Week 8, slides 6, 9, 19 and 21–23 | JSON responses, input checks, HTTP methods, native MongoDB driver and Atlas |
| Week 10, slides 3–5 and 8 | Separate frontend/API/database, `npm start`, environment-based URI/port and connection before listening |

The following are project-specific additions, not techniques demonstrated in those slides:

- Country filters and the lesson/order/teacher schemas implement this project's data model.
- Search uses `$regex`, `$expr`, `$convert` and `$regexMatch`; teacher lookup uses `$in`; enrolment uses an aggregation pipeline with `$unwind` and `$count`. These extend the basic MongoDB material for the existing challenge routes.
- Optional checkout IDs and a unique partial index protect order retries. This extends the existing checkout contract; it is not a lecture requirement.
- CORS, additional validation, database health checks, connection cleanup and automated tests support running and checking the app.
- `DNS_SERVERS` is an optional local connectivity workaround, not a course requirement.

The static-file middleware uses `express.static` instead of the Week 7 manual `fs.stat`/`sendFile` example. It preserves the logger → file sender → missing-file response sequence and confines files to the images directory. No additional runtime packages were introduced: dependencies remain `express` and `mongodb`.

The lecture PDFs alone do not establish the exact coursework marking requirements. Existing references to handbook marks elsewhere in this repository have not been verified against the handbook during this review.

## Links

| | |
|---|---|
| This repository | https://github.com/NAME0x0/M01041307-after-school-backend |
| Front-end repository | https://github.com/NAME0x0/M01041307-after-school-frontend |
| Live front-end | https://name0x0.github.io/M01041307-after-school-frontend/ |
| Planned API (not deployed) | https://m01041307-after-school.onrender.com (the address **must** contain the student number) |
| Planned lessons URL | https://m01041307-after-school.onrender.com/lessons |

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
| Database | MongoDB Atlas via the `mongodb` driver 7.7.0; database `afterschool` on a free M0 cluster, AWS Stockholm (eu-north-1) |
| Hosting | render.com free web service, region Frankfurt, created from `render.yaml` |
| Dev tooling | Node built-ins only: `--watch` (restart on save) and `--env-file` (load `.env`) |

## Structure

```
server.js              database startup, middleware, routers, errors and shutdown
db.js                  shared MongoDB connection and checkout-ID index
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

The routes below use MongoDB. Database errors return JSON errors through the Express error handler.

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

Starting data for `lesson` and `teacher` is in `seed/` (see `seed/README.md`). Startup creates the order collection's checkout-ID index. Orders store optional `email` and `checkoutId`, and use ObjectIds for `lessonIDs`, one entry per purchased space. The unique partial index prevents duplicate checkout IDs while allowing orders without one. Order creation does not change lesson availability: the client must use `PUT /lessons/:id` separately. These two requests are not an atomic booking transaction.

## Environment

Copy `.env.example` to `.env` (git-ignored) and fill it in. On render, `MONGODB_URI` is entered once when the Blueprint is created; `DB_NAME` comes from `render.yaml`; render supplies `PORT` itself.

If local Atlas DNS resolution fails, set `DNS_SERVERS=1.1.1.1,8.8.8.8` in `.env`. The backend applies this optional override to Node's DNS resolver before connecting; it does not change Windows settings. Leave it unset on Render unless needed there. Local startup and the live `/health`, `/lessons` (30 records) and `/teachers` (10 records) reads were verified with this override on 2026-11-23.

Sources for this workaround: Stack Overflow questions [79873598](https://stackoverflow.com/questions/79873598/mongodb-atlas-srv-connection-fails-with-querysrv-econnrefused-after-switching-no) and [79877046](https://stackoverflow.com/questions/79877046/mongodb-atlas-connection-fails-with-querysrv-econnrefused-from-node-js), Node.js issue [#64428](https://github.com/nodejs/node/issues/64428), and the [`dns.setServers()` documentation](https://nodejs.org/api/dns.html#dnssetserversservers).

## Run locally

```
npm install
npm start          # requires MONGODB_URI in the process environment
node --env-file=.env server.js  # start locally using .env
npm run dev        # node --watch --env-file=.env server.js  (restarts on save)
npm test           # built-in Node tests; temporary local server closes afterward
```

`npm run dev` requires a local `.env` file. `npm start` uses environment variables supplied by the host, as on Render. No additional runtime or test libraries were added.

For local frontend access, use `http://127.0.0.1:5500` or `http://localhost:5500`. The other allowed origin is `https://name0x0.github.io`. CORS grants browser access to those exact origins, allows GET/POST/PUT/OPTIONS and Content-Type, and answers preflight with 204. CORS is not authentication and does not block direct non-browser requests.

HTTP examples for this stage:

| Request | Expected result |
|---|---|
| `GET /images/piano.webp` | 200, actual image |
| `GET /images/missing.webp` | 404, JSON image error |
| `GET /lessons?country=UAE` | 200, lesson array |
| `GET /lessons?country=France` | 400, unsupported country |
| `POST /orders` with valid JSON order | 201 with inserted ID, or 404 for missing lessons |
| `PUT /lessons/<24-hex-id>` with a non-empty JSON object | 200 with matched/modified counts, or 404 |
| `GET /health` | 200 for a successful database ping, otherwise 503 |

PUT rejects unsafe field names and invalid values for known lesson fields, then sets supplied attributes with `$set`. POST validates customer details and verifies referenced lessons exist. Search matches topic/location without case sensitivity and price/space as text, escaping regex characters. Teacher lessons use `$in`; enrolment uses `$unwind` and `$count`. No DELETE endpoint is exposed. Email validation checks format only.

The middleware uses Express's built-in facilities: [middleware guide](https://expressjs.com/en/guide/using-middleware/) and [static-file guide](https://expressjs.com/en/starter/static-files/).

## MongoDB Atlas setup (in your Atlas account)

All five steps were done on 2026-11-11.

1. **Cluster**: the free (M0) cluster `CST3144-Fullstack-CW1` on **AWS, Stockholm (eu-north-1)**. The plan was Frankfurt, the same region as render. The cluster created earlier was kept instead, because an Atlas project holds only one free cluster.
2. **Database Access**: the user `afterschool-api`, with **readWrite on `afterschool` only** and a 40-character generated password.
3. **Network Access**: `0.0.0.0/0`. render's free tier has no fixed outbound IP, so the dedicated user and its password are what protect the data.
4. **Connection string**: in `.env` as `MONGODB_URI` (git-ignored). Never put it in the repository.
5. **Seed data**: `seed/lesson.json` imported into `afterschool.lesson` (30 lessons) and `seed/teacher.json` into `afterschool.teacher` (10 teachers) with Compass. Every `_id` and teacher `lessonIDs` entry is an ObjectId. To start over, follow [seed/README.md](seed/README.md).

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

**GenAI acknowledgement:** - n/a

## Licence

Proprietary, all rights reserved, view only. See [LICENSE](LICENSE).
