# Chhaon

**Know where the heat is. Find the nearest shade and water.**

Chhaon is a heat and water access tool for Delhi. It joins satellite images, weather, and population data into one heat map. Then it shows each person the closest cooling point with a walking route. It also gives ward officers a daily ranked list of places to open.

Built for Environmental Hacks 2026, Heat and Water track.

---

## Table of contents

1. [What Chhaon does](#1-what-chhaon-does)
2. [The idea in one picture](#2-the-idea-in-one-picture)
3. [System architecture](#3-system-architecture)
4. [Repository layout](#4-repository-layout)
5. [The four code layers](#5-the-four-code-layers)
6. [Data sources](#6-data-sources)
7. [Stage 1: the baseline job](#7-stage-1-the-baseline-job)
8. [Stage 2: the cooling point job](#8-stage-2-the-cooling-point-job)
9. [Stage 3: the heat score](#9-stage-3-the-heat-score)
10. [Stage 4: the daily plan](#10-stage-4-the-daily-plan)
11. [Stage 5: nearest places and walking routes](#11-stage-5-nearest-places-and-walking-routes)
12. [Community reports](#12-community-reports)
13. [Database](#13-database)
14. [API reference](#14-api-reference)
15. [Frontend](#15-frontend)
16. [AWS deployment](#16-aws-deployment)
17. [Run it on your computer](#17-run-it-on-your-computer)
18. [Deploy a new version](#18-deploy-a-new-version)
19. [Checks and tests](#19-checks-and-tests)
20. [How to grow the project](#20-how-to-grow-the-project)
21. [Credits](#21-credits)

---

## 1. What Chhaon does

| Person                     | Question                                                              | Chhaon answers with                                                                                                        |
| -------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Resident or outdoor worker | "Where can I get shade and water now? How do I walk there?"           | The 3 nearest cooling points, each with distance, walking time, and a route on the map                                     |
| Ward officer or NGO worker | "Which places should we open today to reach the most people at risk?" | A ranked list of 10 places, and the share of high-risk people who can reach a cooling point in 10 minutes before and after |
| Anyone                     | "How hot is it where I am?"                                           | The heat level (low, medium, high) of the 250 m cell that holds their location                                             |
| Demo viewer                | "What did a real hot day look like?"                                  | A date control that replays any past day                                                                                   |

All temperature values in Chhaon are **surface heat from the last clear satellite pass**. They are not air temperature. The interface says this where it shows a heat value.

---

## 2. The idea in one picture

Heat in a city is not even. A dense market with no trees holds heat. A park with trees and water stays cooler. The satellite shows **where** heat stays. The weather shows **how bad** the day is. Population shows **who** is affected. Cooling points show **where relief is**.

```
        WHERE heat stays          HOW BAD is today        WHO lives there
   +-----------------------+   +------------------+   +------------------+
   |  Surface temperature  |   |  Apparent        |   |  People per      |
   |  Buildings  (NDBI)    |   |  temperature     |   |  250 m cell      |
   |  Trees      (NDVI)    |   |  forecast        |   |  (WorldPop)      |
   |  Water      (NDWI)    |   |  (Open-Meteo)    |   |                  |
   +-----------+-----------+   +---------+--------+   +---------+--------+
               |                         |                      |
               v                         v                      |
        baseline heat (0 to 1)    weather index (0 to 1)        |
               |                         |                      |
               +------------+------------+                      |
                            v                                   |
                  heat score (0 to 100)                         |
                  60% baseline + 40% weather                    |
                            |                                   |
                            v                                   v
                    heat level per cell  ---------->  high-risk people
                    low / medium / high                         |
                                                                v
                      cooling points (OpenStreetMap)  --->  access gap
                                                                |
                                                                v
                                              +----------------------------------+
                                              |  Daily plan: pick 10 places      |
                                              |  Nearest: 3 places + walk route  |
                                              +----------------------------------+
```

---

## 3. System architecture

```
                         DATA SOURCES (read once, by jobs)
   +--------------------+  +---------------------+  +-----------------+  +-----------------+
   | Google Earth Engine|  | Earth Search STAC   |  | WorldPop raster |  | OpenStreetMap   |
   | Landsat 8 and 9    |  | Sentinel-2 L2A      |  | people per      |  | Overpass API    |
   | surface temperature|  | (AWS Open Data)     |  | pixel           |  | places          |
   +---------+----------+  +----------+----------+  +--------+--------+  +--------+--------+
             |                        |                      |                    |
             +------------+-----------+----------+-----------+                    |
                          v                                                       v
                +----------------------+                              +----------------------+
                |   build-baseline job |                              | seed-cooling-points  |
                |   (run once)         |                              | job (run once)       |
                +----------+-----------+                              +----------+-----------+
                           |                                                     |
                           v                                                     v
                +------------------------------------------------------------------------+
                |                    Amazon RDS for PostgreSQL                           |
                |  grid_cell   cooling_point   daily_weather   daily_plan   plan_pick    |
                |  cooling_point_report                                                  |
                +----------------------------------+-------------------------------------+
                                                   ^
                                                   | Drizzle queries
                                                   |
  Open-Meteo  --------> weather service (cache) ---+
  forecast + archive                               |
                                                   |
                                 +-----------------+------------------+
                                 |   Amazon EC2 (Docker container)    |
                                 |   Express + tRPC + OpenAPI         |        Amazon Location
                                 |   services: heat, plan, directions |------> Service (walking
                                 |   /api  /trpc  /docs  /health      |        routes)
                                 +-----------------+------------------+
                                                   ^
                                                   | HTTP (same-origin proxy)
                                                   |
                                 +-----------------+------------------+
                                 |   Next.js frontend (apps/web)      |
                                 |   /  /ward  /public                |
                                 +------------------------------------+
                                                   ^
                                                   |
                                          Resident and officer browsers
```

Two kinds of work exist in Chhaon.

1. **Jobs** run one time to fill the database. They read the heavy data sources.
2. **The API** runs all the time. It reads only from the database, from Open-Meteo (cached), and from Amazon Location.

This split keeps every request fast. A user request never reads a satellite image.

---

## 4. Repository layout

The project is a pnpm and Turborepo monorepo. All code is TypeScript.

```
.
├── apps
│   ├── api                         Express server and one-time jobs
│   │   └── src
│   │       ├── index.ts            starts the server
│   │       ├── server.ts           routes, CORS, compression, docs
│   │       ├── env.ts              checks environment values
│   │       └── jobs
│   │           ├── build-baseline.ts        fills grid_cell
│   │           ├── seed-cooling-points.ts   fills cooling_point
│   │           ├── check-data-access.ts     proves each data source works
│   │           ├── check-deployment.ts      load test and spot check
│   │           ├── spot-check-places.ts     20 known places for the spot check
│   │           └── run-job.ts               shared job runner
│   └── web                         Next.js frontend
│       ├── app                     pages: /, /ward, /public
│       ├── components              screens and small parts
│       ├── hooks                   one hook module for each feature
│       ├── lib                     formats, colours, text, content
│       └── trpc                    typed API client
├── packages
│   ├── database                    Drizzle models, migration, queries
│   │   ├── models                  one file for each table
│   │   ├── queries                 one folder for each module
│   │   └── drizzle                 SQL migration
│   ├── services                    all business logic
│   │   ├── config.ts               the one place for every setting
│   │   ├── baseline                satellite and population reading
│   │   ├── heat                    heat score formulas
│   │   ├── weather                 Open-Meteo reading and cache
│   │   ├── plan                    greedy pick and coverage
│   │   ├── cooling-point           OpenStreetMap reading, merge, reports
│   │   ├── directions              nearest places and routes
│   │   ├── clients                 Amazon Location client
│   │   ├── geo                     distance, bearing, study area check
│   │   ├── http                    small fetch helpers
│   │   └── api-response            response and error shapes
│   ├── trpc                        routers, input and output schemas
│   │   └── server/routes           health, heat, cooling-point, plan
│   ├── logger                      shared logger
│   ├── eslint-config               shared lint rules
│   └── typescript-config           shared TypeScript settings
├── turbo.json
├── pnpm-workspace.yaml
├── amplify.yml                     build file for AWS Amplify Hosting
└── setup.sh                        links the root .env into each package
```

---

## 5. The four code layers

Each feature follows the same four layers. A layer calls only the layer directly below it. No layer skips another.

```
   +-------------------------------------------------------------+
   |  4. HOOKS        apps/web/hooks/<module>/index.ts           |
   |     React hooks. One hook for each feature.                 |
   +------------------------------+------------------------------+
                                  | calls
                                  v
   +-------------------------------------------------------------+
   |  3. ROUTES       packages/trpc/server/routes/<module>/      |
   |     models.ts  = zod input and output schemas               |
   |     route.ts   = one service call and one ApiResponse       |
   +------------------------------+------------------------------+
                                  | calls
                                  v
   +-------------------------------------------------------------+
   |  2. SERVICES     packages/services/<module>/index.ts        |
   |     All business logic. Throws ApiError for known failures. |
   +------------------------------+------------------------------+
                                  | calls
                                  v
   +-------------------------------------------------------------+
   |  1. DB QUERIES   packages/database/queries/<module>/        |
   |     Drizzle queries only. No business logic.                |
   +-------------------------------------------------------------+
```

Rules for all code:

- Write no comments in code.
- Follow DRY and KISS. Do not add extra complexity.
- Use full and clear names, for example `peopleNewlyCovered`, not `pnc`.
- Define each formula one time, in `packages/services`.
- Define each setting one time, in `packages/services/config.ts`.
- Write all text for people in Simplified Technical English (ASD-STE100).

---

## 6. Data sources

| Data                    | Source                               | What we read                                                                 | How we read it                                                                               |
| ----------------------- | ------------------------------------ | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Surface temperature     | Landsat 8 and 9 Collection 2 Level 2 | Thermal band `ST_B10`, about 100 m                                           | Google Earth Engine builds a median image. The job downloads it as a GeoTIFF                 |
| Trees, buildings, water | Sentinel-2 L2A on AWS Open Data      | Bands green, red, NIR, SWIR                                                  | The job searches Earth Search STAC. It reads cloud-optimised files over HTTPS with `geotiff` |
| Weather                 | Open-Meteo                           | Daily maximum apparent temperature                                           | Forecast API for today. Archive API for past days                                            |
| Population              | WorldPop Delhi raster                | People in each pixel                                                         | The job reads a local GeoTIFF file                                                           |
| Cooling points          | OpenStreetMap through Overpass       | Drinking water, parks, metro stations, hospitals, schools, places of worship | One Overpass query for the study area                                                        |
| Walking routes          | Amazon Location Service (GeoRoutes)  | Walking path and time                                                        | `CalculateRoutes` with travel mode `Pedestrian`                                              |

**Study area.** One bounding box in `config.ts` sets the area.

```
   north  28.88  +------------------------------+
                 |                              |
                 |     Delhi study area         |
                 |     about 50 km x 53 km      |
                 |     250 m cells              |
                 |     199 columns x 213 rows   |
                 |     = 42,387 cells           |
   south  28.40  +------------------------------+
               west 76.84                   east 77.35
```

**Baseline period.** The satellite baseline uses scenes from 1 April 2026 to 30 June 2026. Only scenes with cloud cover below 20% are used.

---

## 7. Stage 1: the baseline job

Command: `pnpm --filter @repo/api job:build-baseline`

The job turns satellite images into one row for each 250 m cell. It runs one time. It can run again at any time.

```
 buildCellCentres()
   make the grid: 213 rows x 199 columns of 250 m cells
        |
        +--> Sentinel-2 branch
        |      1. Search Earth Search STAC (bbox, dates, cloud < 20%, up to 12 scenes)
        |      2. For each scene read bands: green, red, nir, swir16
        |         - project cell centres into the scene UTM zone (proj4)
        |         - pick the image overview that is near 250 m
        |         - apply scale and offset from the STAC metadata
        |      3. Per scene compute:
        |           NDVI = (nir  - red ) / (nir  + red )     trees
        |           NDBI = (swir - nir ) / (swir + nir )     built-up
        |           NDWI = (green - nir) / (green + nir)     water
        |      4. Take the MEDIAN across scenes (this removes most cloud effects)
        |
        +--> Landsat branch
        |      1. Authenticate to Google Earth Engine with a service account key
        |      2. Merge Landsat 8 and Landsat 9 collections
        |      3. Filter by area, dates, and cloud cover < 20%
        |      4. Convert ST_B10 to degrees Celsius:
        |           celsius = ST_B10 * 0.00341802 + 149 - 273.15
        |      5. Take the median image, export at 100 m as GeoTIFF
        |      6. Sample the GeoTIFF at each cell centre
        |
        +--> Population branch
               1. Open the WorldPop GeoTIFF
               2. Read the window that covers the study area
               3. Add the people of each pixel into the cell that holds it
        |
        v
 buildGridCellRows()
   1. Scale each layer to 0 .. 1 with the 2nd and 98th percentile as limits
   2. Drop a cell if any value is missing
   3. baselineHeat = 0.5 * temperature
                   + 0.3 * built-up
                   + 0.2 * (1 - trees)
                   - 0.1 * water          (never below 0)
        |
        v
 replaceAllGridCells()  +  deleteAllDailyPlans()
```

**Why this formula.** Heat is trapped where the ground is hot, built-up, and has few trees. Heat is released where trees and water exist. The weights are in `baselineHeatWeights` in `config.ts`.

| Layer                    | Weight | Direction |
| ------------------------ | ------ | --------- |
| Surface temperature      | 0.5    | more heat |
| Built-up index (NDBI)    | 0.3    | more heat |
| Tree shortage (1 - NDVI) | 0.2    | more heat |
| Water index (NDWI)       | 0.1    | less heat |

The job also checks the result. It writes a warning to the log if any surface temperature is outside 30 to 60 degrees Celsius. It reports the share of complete cells.

---

## 8. Stage 2: the cooling point job

Command: `pnpm --filter @repo/api job:seed-cooling-points`

```
   Official list (official-points.ts)  ----------------+
                                                       |
   Overpass query for the study area:                  |
     amenity=drinking_water        -> drinking_water   |
     leisure=park                  -> park             |
     station=subway                -> metro_station    |
     amenity=hospital              -> hospital         |      +-----------------+
     amenity=school                -> school           +----> | merge points    |
     amenity=place_of_worship      -> place_of_worship |      | within 20 m     |
        |                                              |      +--------+--------+
        |  up to 6 attempts, rotates 3 Overpass        |               |
        |  servers, waits 5 s between attempts         |               v
        +----------------------------------------------+      replaceAllCoolingPoints()
                                                                       |
                                                                       v
                                                                 cooling_point table
```

**Merge rule.** Two points closer than 20 m count as one place. The job keeps the first one. Official points come first. After that, the order follows the type list. The merge uses a bucket grid, so the job does not compare every pair of points.

**Water confidence.** Each place type has a water confidence. The interface shows it on every place card.

| Place type            | Water confidence | Meaning                            |
| --------------------- | ---------------- | ---------------------------------- |
| Drinking water point  | `listed`         | Map data lists it as a water point |
| Official cooling zone | `listed`         | Listed as a cooling place          |
| Metro station         | `likely`         | Water is probable                  |
| Hospital              | `likely`         | Water is probable                  |
| Place of worship      | `likely`         | Water is probable                  |
| Park                  | `unlikely`       | Shade, but water is not probable   |
| School                | `unlikely`       | Water is not probable              |

**Opening hours.** Each place has `hoursStatus`. Every place starts as `unconfirmed`. The interface shows "Hours not confirmed".

---

## 9. Stage 3: the heat score

The heat score is computed when a request arrives. The baseline is stored. Only the weather changes from day to day.

```
   weather for the date                    stored in grid_cell
   -----------------------                 -----------------------
   apparent temperature max                baselineHeat (0 to 1)
            |                                      |
            v                                      |
   weatherIndex                                    |
   = clamp( (T - 30) / (48 - 30), 0, 1 )           |
            |                                      |
            +------------------+-------------------+
                               v
        heatScore = 100 * ( 0.6 * baselineHeat + 0.4 * weatherIndex )
                               |
                               v
              +----------------+-----------------+
              |                |                 |
          >= 70             40 to 69           < 40
          HIGH              MEDIUM             LOW
```

| Value          | Formula                                                   | Range    |
| -------------- | --------------------------------------------------------- | -------- |
| `weatherIndex` | apparent temperature scaled from 30 to 48 degrees Celsius | 0 to 1   |
| `heatScore`    | `100 * (0.6 * baselineHeat + 0.4 * weatherIndex)`         | 0 to 100 |
| Level          | high at 70 or more, medium at 40 to 69, low below 40      |          |

**Weather cache.** The weather service reads Open-Meteo one time for each date. It stores the result in `daily_weather`. Every later request for that date reads the database.

```
   getDailyWeather(date)
        |
        +--> row in daily_weather? --yes--> return it
        |
        no
        |
        v
   date is today?  --yes--> Open-Meteo forecast API
        |
        no
        v
   Open-Meteo archive API
        |
        v
   compute weatherIndex, store row, return it
```

The weather point is the center of the study area. A date in the future is rejected with a clear error.

**Replay a past day.** Every heat and plan endpoint takes an optional `date`. With no date, Chhaon uses today. With a date, Chhaon uses the weather of that day and the same baseline. The demo day is `2026-05-25`.

---

## 10. Stage 4: the daily plan

The plan answers: "Which 10 places give the most high-risk people a cooling point within a 10-minute walk?"

```
   1. High-risk cells
        cells with people AND heat level = high for the date
                       |
   2. Split the places by water confidence
        active points     = places with water listed       (they cover people today)
        candidate points  = places with water likely       (we may open these)
                       |
   3. Before coverage
        a high-risk cell is covered if an active point is within 800 m
        coverageBefore = covered people / all high-risk people
                       |
   4. Greedy pick, repeat 10 times
        +------------------------------------------------------------+
        | for each candidate:                                        |
        |    count the people in still-uncovered cells within 800 m  |
        | pick the candidate with the highest count                  |
        | mark the cells it covers as covered                        |
        | store (rank, peopleNewlyCovered)                           |
        +------------------------------------------------------------+
                       |
   5. After coverage
        coverageAfter = (covered before + people newly covered by picks) / all high-risk people
                       |
   6. Store in daily_plan and plan_pick
```

**Example.** For 2026-05-25, the share of high-risk people within 800 m of a cooling point rises from **6.4%** to **20.5%** when the 10 picked places open.

**Why 800 m.** 800 m is about a 10-minute walk. The value is `walkingRadiusInMetres` in `config.ts`.

**Why greedy.** Each pick adds the most new people. The first pick has the largest effect. Later picks add less. The list is ranked, so an officer can stop at any rank.

**Cache.** The first request for a date builds and stores the plan. Every later request for that date reads the stored plan. The baseline job and the seed job delete all stored plans, because their data changed.

---

## 11. Stage 5: nearest places and walking routes

```
   Browser                 API                     RDS               Amazon Location
      |  GET /nearest        |                       |                       |
      |  lat, lon            |                       |                       |
      |--------------------->|                       |                       |
      |                      | inside study area?    |                       |
      |                      | no  -> error 400      |                       |
      |                      |                       |                       |
      |                      | 3 nearest points      |                       |
      |                      |---------------------->|                       |
      |                      |<----------------------|                       |
      |                      |                                               |
      |                      | 3 route calls in parallel, 2 s limit each     |
      |                      |---------------------------------------------->|
      |                      |<----------------------------------------------|
      |                      |                                               |
      |                      | for each place add:                           |
      |                      |   distanceInMetres                            |
      |                      |   bearingInDegrees                            |
      |                      |   walkingRoute  (or null if routing failed)   |
      |<---------------------|                                               |
```

**Fallback.** If a route fails or takes more than 2 seconds, that place gets `walkingRoute: null`. The other places keep their routes. The frontend then shows the distance and the compass direction ("to the north-east").

**Speed.** The nearest endpoint answers in less than 3 seconds for all 20 test points.

---

## 12. Community reports

People can report a problem with a place. The API stores the report. A report does not change cooling point data. A person must review it.

| Report type | Needs                      | Used for                      |
| ----------- | -------------------------- | ----------------------------- |
| `closed`    | `coolingPointId`           | "This place is closed"        |
| `hours`     | `coolingPointId`           | "The opening hours are wrong" |
| `new_place` | `latitude` and `longitude` | "A place is missing"          |

Every report has a message of 1 to 500 characters. The server limits the request body to 10 KB.

---

## 13. Database

PostgreSQL on Amazon RDS. Drizzle defines the tables and the migration.

```
   grid_cell                          cooling_point                      daily_weather
   +---------------------------+      +------------------------+         +------------------------------+
   | id                      PK|      | id                   PK|         | weatherDate               PK |
   | centreLatitude            |      | name                   |         | apparentTemperatureMaxCelsius|
   | centreLongitude           |      | type                   |         | weatherIndex                 |
   | surfaceTemperatureCelsius |      | latitude, longitude    |         +------------------------------+
   | ndvi, ndbi, ndwi          |      | source (osm|official)  |
   | baselineHeat              |      | hoursStatus            |
   | population                |      +-----------+------------+
   +---------------------------+                  |
                                                  | 1
                          +-----------------------+-----------------------+
                          | many                                          | many
                          v                                               v
   daily_plan             plan_pick                       cooling_point_report
   +----------------+     +--------------------+          +--------------------------+
   | id           PK|<----| dailyPlanId      FK|          | id                     PK|
   | planDate  UNIQ | 1  m| coolingPointId   FK|          | coolingPointId  FK (null)|
   | coverageBefore |     | rank               |          | reportType               |
   | coverageAfter  |     | peopleNewlyCovered |          | latitude, longitude      |
   | createdAt      |     +--------------------+          | message, createdAt       |
   +----------------+                                     +--------------------------+
```

| Table                     | Written by              | Read by                          |
| ------------------------- | ----------------------- | -------------------------------- |
| `grid_cell`               | baseline job            | heat service, plan service       |
| `cooling_point`           | seed job                | directions service, plan service |
| `daily_weather`           | weather service (cache) | heat service, plan service       |
| `daily_plan`, `plan_pick` | plan service (cache)    | plan service                     |
| `cooling_point_report`    | report endpoint         | reviewers                        |

---

## 14. API reference

Every response has this shape:

```json
{ "success": true, "message": "Nearest cooling points", "data": {} }
```

An error response has `message`, `code`, and `data.httpStatus`.

| Method and path                                        | tRPC procedure                  | Purpose                                                         |
| ------------------------------------------------------ | ------------------------------- | --------------------------------------------------------------- |
| `GET /api/heat?date=YYYY-MM-DD`                        | `heat.getHeatGrid`              | Every cell with score, level, and data date. `date` is optional |
| `GET /api/heat/location?latitude=&longitude=&date=`    | `heat.getHeatAtLocation`        | Heat for one point                                              |
| `GET /api/plan?date=YYYY-MM-DD`                        | `plan.getPlan`                  | The 10 ranked places and the before and after coverage          |
| `GET /api/cooling-points/nearest?latitude=&longitude=` | `coolingPoint.getNearest`       | The 3 nearest places with walking routes                        |
| `POST /api/cooling-points/reports`                     | `coolingPoint.reportCorrection` | Store a user report                                             |
| `GET /health`                                          | `health`                        | Server check                                                    |
| `GET /docs`                                            |                                 | Interactive API docs (Scalar)                                   |
| `GET /openapi.json`                                    |                                 | The OpenAPI file                                                |
| `/trpc`                                                |                                 | Typed tRPC endpoint for the frontend                            |

The API has no sign-in. It is public and read-only. The only write is the report.

**Example: nearest**

```json
{
  "success": true,
  "message": "Nearest cooling points",
  "data": {
    "places": [
      {
        "id": 11065,
        "name": "Park",
        "type": "park",
        "latitude": 28.5960502,
        "longitude": 77.198451,
        "source": "osm",
        "hoursStatus": "unconfirmed",
        "waterConfidence": "unlikely",
        "distanceInMetres": 464.5,
        "bearingInDegrees": 199.0,
        "walkingRoute": {
          "durationInMinutes": 14,
          "path": [
            { "latitude": 28.599983, "longitude": 77.199991 },
            { "latitude": 28.59996, "longitude": 77.20005 }
          ]
        }
      }
    ]
  }
}
```

**Example: report**

```json
POST /api/cooling-points/reports
{ "reportType": "closed", "coolingPointId": 11065, "message": "The gate is locked." }
```

**Server details.** Express serves the API. CORS allows the origin in `CORS_ORIGIN`. Compression is on, so the heat grid (42,387 cells) is about 370 KB on the wire. The REST routes under `/api` come from the tRPC router through `trpc-to-openapi`, so REST, tRPC, and the docs always match.

---

## 15. Frontend

Next.js, React, Tailwind CSS v4, shadcn/ui, Leaflet, and TanStack Query. The tRPC client gives full types from the server to every component.

### Screens and user journey

```
                                 +----------------------+
                                 |   /   Landing        |
                                 |   - what Chhaon does |
                                 |   - 3-step journey   |
                                 |   - what we built    |
                                 |   - how it scores    |
                                 |   - AWS services     |
                                 |   - how it can grow  |
                                 +----+-------------+---+
                                      |             |
                  "See the heat map"  |             |  "Find a cool place near me"
                                      v             v
        +---------------------------------+   +---------------------------------+
        |  /ward   Heat map and plan      |   |  /public   Find a cool place    |
        |                                 |   |                                 |
        |  Date control (hot day default) |   |  1 Where are you?               |
        |  Heat map, 250 m cells          |   |      use location or tap map    |
        |  High / Medium / Low filter     |   |  2 How hot is it here?          |
        |  Stats: places, before, after   |   |      level + advice             |
        |  Ranked list of 10 places       |   |  3 Nearest cooling points       |
        |  Pins linked to the list        |   |      route, time, directions    |
        |                                 |   |      report a problem           |
        +----------------+----------------+   +----------------+----------------+
                         |                                     |
                         +---------- cross links --------------+
```

### Hooks (layer 4)

| Hook module             | Hooks                                            | Wraps                                        |
| ----------------------- | ------------------------------------------------ | -------------------------------------------- |
| `hooks/heat`            | `useHeatGrid`, `useHeatAtLocation`               | `heat.getHeatGrid`, `heat.getHeatAtLocation` |
| `hooks/plan`            | `usePlan`                                        | `plan.getPlan`                               |
| `hooks/cooling-point`   | `useNearestCoolingPoints`, `useReportCorrection` | `coolingPoint.*`                             |
| `hooks/user-location`   | `useUserLocation`                                | Browser geolocation, map tap                 |
| `hooks/leaflet-map`     | `useLeafletMap`                                  | Creates and removes a Leaflet map            |
| `hooks/cycling-message` | `useCyclingMessage`                              | Loading messages                             |
| `hooks/animated-number` | `useAnimatedNumber`                              | Count-up numbers                             |

Pages and components import only hooks. They never call `trpc` directly.

### How the heat map is drawn

The heat grid has 42,387 cells. Drawing 42,387 rectangles is slow. Chhaon draws one image instead.

```
   cells[]  ->  canvas, 1 pixel for each cell  ->  toDataURL()  ->  Leaflet imageOverlay
                  color = heatColourFor(score / 100)
                  skip cells whose level is switched off
```

The colour comes from the **fixed** scale of 0 to 100. A cool day looks green and yellow. A hot day looks orange and red. The same colour always means the same score, on every date.

```
   score:   0 ------ 25 ------ 50 ------ 75 ------ 100
   colour:  green   lime     yellow    orange      red
```

### Design: "Shade first"

The full method is in `apps/web/DESIGN.md`. In short:

| Role      | Colour tokens                                    | Use                                |
| --------- | ------------------------------------------------ | ---------------------------------- |
| Paper     | `page`, `surface`, `line`                        | Backgrounds, cards, rules          |
| Ink       | `ink`, `ink-soft`, `ink-faint`                   | Text                               |
| Action    | `brand`, `brand-deep`, `brand-soft`              | Buttons, links, selected state     |
| Attention | `sun`, `sun-soft`, `sun-deep`                    | Hints, step numbers, planned items |
| Heat      | `heat-low`, `heat-medium`, `heat-high`, the ramp | Heat data only                     |

Type: Schibsted Grotesk for headings and numbers, Mukta for body text (it supports Devanagari), Outfit for the brand mark.

### Microinteractions

Each interaction answers a thing the user will do next.

| When                               | What the user sees                                                                                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| The heat map loads                 | A grid of cells pulses from green to red in a diagonal wave. A message changes every 2 seconds, for example "Asking Landsat how hot the pavement is…" |
| The plan or nearest list loads     | Skeleton cards and a cycling message                                                                                                                  |
| Numbers arrive                     | Coverage, counts, and temperature count up                                                                                                            |
| A new plan arrives                 | The coverage bar grows from the left                                                                                                                  |
| The user taps a map pin            | The matching card scrolls into view                                                                                                                   |
| The user presses "Use my location" | A radar ping on the icon                                                                                                                              |
| The location is set                | The map point pulses                                                                                                                                  |
| Step 1 is not done                 | Steps 2 and 3 show a bouncing arrow and "Set your place in step 1"                                                                                    |
| A report is sent                   | A check mark pops in                                                                                                                                  |
| The user hovers a card or link     | The card lifts and the arrow slides                                                                                                                   |
| The user prefers reduced motion    | All animation becomes almost instant                                                                                                                  |

**Info hints.** A small info button sits next to every term that needs an explanation: the stats, the map title, and the water and hours tags. It opens on tap or click, so it also works on phones.

---

## 16. AWS deployment

```
                                  ap-southeast-2 (Sydney)
   +------------------------------------------------------------------------------+
   |                                                                              |
   |    +-------------+     pull image      +------------------------------+      |
   |    |  Amazon ECR | ------------------> |  Amazon EC2                  |      |
   |    |  chhaon-api |                     |  Docker container, port 8000 |      |
   |    +-------------+                     |  Elastic IP                  |      |
   |                                        |  IAM instance role           |      |
   |                                        +-------+-----------+----------+      |
   |                                                |           |                 |
   |                         SQL (TLS)              |           | CalculateRoutes |
   |                                                v           v                 |
   |                                    +----------------+  +-------------------+ |
   |                                    | Amazon RDS     |  | Amazon Location   | |
   |                                    | PostgreSQL     |  | Service (routes)  | |
   |                                    +----------------+  +-------------------+ |
   |                                                                              |
   +------------------------------------------------------------------------------+

   AWS Open Data registry:  Sentinel-2 images (read by the baseline job)
```

| AWS service               | Role in Chhaon                                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Amazon EC2                | Runs the API container. The security group allows port 8000 from everywhere. SSH is limited to one address |
| Amazon ECR                | Stores the Docker image. EC2 pulls the image from ECR                                                      |
| Amazon RDS for PostgreSQL | Stores grid cells, cooling points, daily weather, daily plans, and reports                                 |
| Amazon Location Service   | Calculates the walking route and time for each of the 3 nearest places                                     |
| AWS IAM                   | The instance role allows `geo-routes:CalculateRoutes` and ECR read. No keys are in the image               |
| AWS Open Data registry    | Hosts the Sentinel-2 data that the baseline job reads through Earth Search                                 |

**Where each data source lives.**

- Sentinel-2 indices: AWS Open Data, through Earth Search.
- Landsat surface temperature: Google Earth Engine.
- Population: a WorldPop file read from local disk by the baseline job.

### Frontend and the API: one origin

The API uses HTTP. A browser blocks an HTTPS page that calls an HTTP API. Chhaon avoids this with a rewrite in `apps/web/next.config.js`.

```
   Browser (HTTPS)                 Frontend host                  EC2 API (HTTP)
        |                         (Next.js server)                      |
        |  GET /trpc/heat...             |                              |
        |------------------------------->|                              |
        |       same origin              |  rewrite to API_ORIGIN       |
        |                                |----------------------------->|
        |                                |<-----------------------------|
        |<-------------------------------|                              |
```

- Leave `NEXT_PUBLIC_API_URL` unset in the deployed frontend. The client then calls `/trpc` on its own origin.
- Set `API_ORIGIN` to the API address, for example `http://<elastic-ip>:8000`. Set it before the build.
- With this design, the browser sees one origin. CORS does not apply.

---

## 17. Run it on your computer

**Needs:** Node.js 18 or newer, pnpm 9, and a PostgreSQL database.

```bash
pnpm install
bash setup.sh
```

`setup.sh` copies `.env.example` to `.env` and links that file into each app and package.

**Environment values**

| Name                    | Used by        | Meaning                                      |
| ----------------------- | -------------- | -------------------------------------------- |
| `DATABASE_URL`          | API, jobs      | PostgreSQL connection string                 |
| `PORT`                  | API            | Server port. Default 8000                    |
| `BASE_URL`              | API            | Public address of the API. Used in the docs  |
| `NODE_ENV`              | API            | `development` or `prod`                      |
| `LOGGER_LEVEL`          | API            | `debug` or `info`                            |
| `CORS_ORIGIN`           | API            | The one origin that may call the API         |
| `AWS_REGION`            | API            | `ap-southeast-2`                             |
| `NEXT_PUBLIC_API_URL`   | Frontend       | Full tRPC URL. Leave unset to use `/trpc`    |
| `API_ORIGIN`            | Frontend build | API address for the rewrite                  |
| `WORLDPOP_FILE_PATH`    | Baseline job   | Path to the WorldPop GeoTIFF                 |
| `EARTH_ENGINE_KEY_FILE` | Baseline job   | Path to the Earth Engine service account key |

**Start**

```bash
pnpm db:migrate
pnpm --filter @repo/api job:seed-cooling-points
pnpm --filter @repo/api job:build-baseline
pnpm dev
```

| Address                        | What         |
| ------------------------------ | ------------ |
| `http://localhost:8000/docs`   | API docs     |
| `http://localhost:8000/health` | Server check |
| `http://localhost:3000`        | Frontend     |

**Fill the data again.** Run the two jobs again at any time. Each job replaces its table and deletes the stored plans. If Overpass is busy, the seed job retries by itself. If it still fails, run it again.

---

## 18. Deploy a new version

**On your computer**

```bash
aws ecr get-login-password --region ap-southeast-2 \
  | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-southeast-2.amazonaws.com
docker build --platform linux/amd64 -t chhaon-api .
docker tag chhaon-api:latest <ACCOUNT_ID>.dkr.ecr.ap-southeast-2.amazonaws.com/chhaon-api:latest
docker push <ACCOUNT_ID>.dkr.ecr.ap-southeast-2.amazonaws.com/chhaon-api:latest
```

**On the EC2 instance**

```bash
sudo docker rm -f chhaon-api
sudo docker image prune -af
aws ecr get-login-password --region ap-southeast-2 \
  | sudo docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-southeast-2.amazonaws.com
sudo docker run -d --restart always --name chhaon-api -p 8000:8000 \
  --env-file ~/chhaon.env \
  <ACCOUNT_ID>.dkr.ecr.ap-southeast-2.amazonaws.com/chhaon-api:latest
```

**Change an environment value.** Edit `~/chhaon.env`. Then remove and start the container again, as in the last step. A plain restart does not read the file again.

**Frontend.** Connect the repository to a host that runs Next.js (Vercel or AWS Amplify Hosting). Set the root to `apps/web`. Set `API_ORIGIN`. Do not set `NEXT_PUBLIC_API_URL`. The file `amplify.yml` holds the Amplify build steps.

---

## 19. Checks and tests

| Check         | Command                                                   | What it proves                                                            |
| ------------- | --------------------------------------------------------- | ------------------------------------------------------------------------- |
| Data access   | `pnpm --filter @repo/api job:check-data-access`           | Every data source returns real data                                       |
| Deployment    | `pnpm --filter @repo/api job:check-deployment <base-url>` | Load test, nearest speed, and spot check                                  |
| Formula tests | in `packages/services/heat`                               | The heat formulas give the expected values for hand-made cells            |
| Plan tests    | in `packages/services/plan`                               | The greedy pick and coverage give the expected values for hand-made cells |

**Results on the live deployment**

| Check                                             | Result                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| Grid cells in the database                        | 42,387                                             |
| Cooling points in the database                    | 8,770                                              |
| Load test: 20 parallel requests for each endpoint | 0 failures                                         |
| Nearest: 20 test points                           | 20 of 20 answer in under 3 seconds                 |
| Spot check: 10 parks and 10 dense markets         | 16 of 20 rank as expected                          |
| Heat grid response                                | about 370 KB compressed, about 1.2 s on the server |
| Plan for 2026-05-25                               | 6.4% before, 20.5% after                           |

**The spot check.** The job takes 20 known places: 10 parks and 10 dense markets. A park should have a lower heat score than a dense market. At least 16 of 20 must match.

---

## 20. How to grow the project

Chhaon was built so that growth needs small changes.

```
   One config file                      One baseline job                 One API
   +---------------------+             +------------------+            +---------------+
   | studyAreaBoundingBox|  --------->  | build-baseline   | -------->  | same routes   |
   | baselineDateRange   |             | seed-cooling-pts |            | same frontend |
   | gridCellSizeInMetres|             +------------------+            +---------------+
   +---------------------+
        change values                      run again                     no code change
```

| To do this                               | Change this                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| Cover more of Delhi NCR, or another city | `studyAreaBoundingBox` in `config.ts`. Run the two jobs again                     |
| Use a newer satellite period             | `baselineDateRange` in `config.ts`. Run the baseline job again                    |
| Use smaller or larger cells              | `gridCellSizeInMetres` in `config.ts`. Run the baseline job again                 |
| Change how many places the plan picks    | `plannedPlaceCount` in `config.ts`                                                |
| Change the walking distance              | `walkingRadiusInMetres` in `config.ts`                                            |
| Change the heat levels                   | `heatLevelMinimumScores` in `config.ts`                                           |
| Change the weights                       | `baselineHeatWeights`, `heatScoreWeights` in `config.ts`                          |
| Add official cooling zones               | `packages/services/cooling-point/official-points.ts`. Run the seed job again      |
| Add a place type                         | Add it to `coolingPointTypes`, the Overpass rules, and the water confidence table |
| Add a new feature                        | Add one module in each of the four layers                                         |
| Use the data in another app              | Use the OpenAPI file at `/openapi.json`                                           |

---

## 21. Credits

- Built from a tRPC monorepo starter template. Add the starter name and link here.
- Satellite data: USGS Landsat and ESA Copernicus Sentinel-2, through Google Earth Engine and AWS Open Data.
- Weather: Open-Meteo.
- Population: WorldPop.
- Map data: OpenStreetMap contributors.
- Walking routes: Amazon Location Service.
