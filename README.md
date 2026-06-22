# MarketLens

MarketLens is a residential listing intelligence dashboard for exploring location-based property listings, comparing asking prices against similar homes, and generating AI-assisted due-diligence summaries.

Live Demo: `https://marketlens-smoky.vercel.app/`
GitHub: `https://github.com/cwru-yash/marketlens/tree/main`

## Overview

MarketLens helps users quickly understand how a listing is positioned relative to comparable properties. Instead of only showing property cards, the app combines:

* Map-based listing exploration
* Search, suggestions, filters, and sorting
* Comparable-listing analytics
* Price-per-square-foot analysis
* Market-position labels
* Methodology and confidence indicators
* AI-generated due-diligence summaries

The current dataset is a demo residential listing dataset. The app is designed so the data source can be replaced by a listing provider, MLS/IDX integration, or a production Supabase/Postgres database workflow.

## Key Features

### Interactive Listing Dashboard

Users can search, filter, and sort listings by address, neighbourhood, ZIP code, property type, and market-position signal.

The dashboard uses a split layout:

* Listings/results on the left
* Sticky map and listing intelligence panel on the right
* Click a listing to highlight it and focus the map
* Click a map marker to update the selected listing

### Comparable-Listing Analytics

Each listing is enriched with analytics including:

* Price per square foot
* Comparable median price per square foot
* Percentage delta from comparable median
* Market-position label
* Comparable count
* Low-confidence/fallback methodology flags
* Human-readable explanation text

Market-position labels include:

* `potential_opportunity`
* `within_range`
* `above_range`
* `low_confidence`

### Supabase-Backed Data Provider

MarketLens supports a Supabase/Postgres-backed listing provider with a local fixture fallback.

If Supabase environment variables are present and the query succeeds, listings are read from Supabase. If environment variables are missing, the query fails, or the table has no rows, the app falls back to the local demo dataset.

This keeps the demo reliable while still showing a production-style data boundary.

### API Routes

The app exposes backend API routes:

```text
GET /api/listings
```

Returns the enriched listing collection used by the dashboard.

```text
GET /api/listings/[id]
```

Returns one selected listing, its comparable listings, and methodology metadata.

```text
POST /api/ai/insight
```

Generates an AI-assisted due-diligence summary for a selected listing.

### AI Due-Diligence Summary

The AI feature summarizes existing analytics and comparable data for a selected listing. It returns:

* Summary
* Risk flags
* Questions to ask
* Suggested next steps

The AI does not make investment recommendations. It acts as a due-diligence assistant over deterministic analytics produced by the app.

## Tech Stack

* Next.js App Router
* TypeScript
* React
* Tailwind CSS
* React Leaflet / Leaflet
* Supabase/Postgres
* Gemini API
* Vercel

## Architecture

```text
Supabase/Postgres or local fixture data
        ↓
listing-provider.ts
        ↓
analytics engine
        ↓
/api/listings and /api/listings/[id]
        ↓
React dashboard
        ↓
map, listing cards, filters, detail panel
        ↓
AI due-diligence summary
```

## Data Flow

1. Listings are loaded through `getListings()`.
2. The listing provider attempts to read from Supabase.
3. If Supabase is unavailable, the provider falls back to local demo data.
4. Listings are enriched through the analytics layer.
5. The dashboard receives enriched listings.
6. The user interacts with search, suggestions, filters, sorting, listing selection, and map selection.
7. The selected listing can be sent to `/api/ai/insight` for a due-diligence summary.

## Analytics Methodology

MarketLens compares each listing against similar listings using criteria such as:

* Neighbourhood
* Property type
* Bedrooms
* Bathrooms
* Square footage range

If too few strict comparables are found, the system uses fallback comparable logic and marks the methodology with lower confidence.

The analytics are intended for prioritization and due diligence only. They are not appraisals, investment recommendations, or financial advice.

## Supabase Setup

Create a Supabase project and add the following environment variables:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

The database schema is available in:

```text
docs/supabase-schema.sql
```

Seed data is available in:

```text
docs/supabase-seed.sql
```

Run both files in the Supabase SQL Editor.

## AI Setup

Add the following environment variables:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

The Gemini API key is used only from the server-side API route. It is not exposed to the browser.

## Local Development

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Add Supabase and Gemini environment variables if available.

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Useful Test Commands

Test the listing collection endpoint:

```bash
curl -s http://localhost:3000/api/listings | python3 -m json.tool | head -60
```

Test the listing detail endpoint:

```bash
curl -s http://localhost:3000/api/listings/listing-001 | python3 -m json.tool | head -80
```

Test the AI insight endpoint:

```bash
curl -s -X POST http://localhost:3000/api/ai/insight \
  -H "Content-Type: application/json" \
  -d '{"listingId":"listing-001"}' | python3 -m json.tool
```

## Production Deployment

The app is deployed on Vercel.

Required production environment variables:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

After changing environment variables in Vercel, redeploy the project so the new values are available to the production deployment.

## Current Limitations

* The current listings are demo listings, not live MLS data.
* The app does not scrape listing platforms.
* AI summaries are grounded in the provided listing/comparable data and should not be treated as financial advice.
* Auth, saved listings, and user notes are planned production extensions.

## Future Work

Possible production extensions:

* Supabase Auth for user identity
* Saved listings
* User notes and due-diligence checklists
* Watchlists and alerts
* Real listing-provider integration
* More advanced comparable-selection logic
* Rental income and cap-rate analysis
* Admin dashboard for listing ingestion
* More robust AI analysis with stricter source grounding
