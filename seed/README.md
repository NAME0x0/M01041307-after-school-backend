# Seed data

Starting data for the `afterschool` database, in MongoDB's Extended JSON (`{"$oid": ...}` marks an ObjectId). Review and edit it before importing; it is a draft.

| File | Collection | Contents |
|---|---|---|
| `lesson.json` | `lesson` | 30 lessons: 15 in the UAE (AED, Dubai areas), 15 in the UK (GBP, north London areas), 5 spaces each, 15 different topics per country (22 overall), each priced per session from real providers' prices |
| `teacher.json` | `teacher` | 10 teachers: 5 per country, 2 to 4 related lessons each (e.g. one teaches the team sports); between them they teach every lesson exactly once |

The `order` collection is not seeded: the first checkout creates it.

## Why the `_id`s are fixed

A teacher's `lessonIDs` must point at real lesson `_id`s. Fixing the IDs in the files (lessons `66f0…`, teachers `66f1…`) keeps the two files in step after import. The last four hex digits are the country (`01` UAE, `02` UK) and the item number.

## Import with MongoDB Compass

1. Connect Compass to the Atlas cluster.
2. Create the database `afterschool` with the collection `lesson`.
3. Open `lesson` → **Add Data** → **Import JSON or CSV file** → choose `lesson.json` → **Import**.
4. Create the collection `teacher` and import `teacher.json` the same way.
5. Check the counts: 30 lessons, 10 teachers. The `_id`s should show as `ObjectId(...)`, not as text.

To start over, drop the collection and import again.

## Images

Each lesson's `image` is its topic in lower case, with hyphens for spaces, `plus` for `+` and `and` for `&`: e.g. `football.webp`, `maths-tuition.webp`, `11-plus-exam-prep.webp`, `arts-and-crafts.webp`. A topic taught in both countries shares one image, so there are 22 files. Put them in `../images/` (they are AI-generated later; record the tool and prompts in the GenAI log).

## Before submission

Export **every** collection (`lesson`, `order`, `teacher`) from Atlas with Compass (**Export Data** → JSON). Those exports, not these seed files, go in the submission zip.
