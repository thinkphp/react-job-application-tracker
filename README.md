# Nextstep

Nextstep is a job application tracker with individual user accounts. User
accounts and applications are stored in MongoDB; the browser does not store
application data or authentication tokens in `localStorage`.

## Features

- Sign up, sign in, and sign out.
- Store passwords as bcrypt hashes and keep the signed session in an HTTP-only
  cookie.
- Keep each user's applications private with owner-scoped API queries.
- Add applications with a company, role, location, date, and status.
- Search and filter applications, update status, and delete entries.
- Review totals for applications, active processes, interviews, and offers.

## Requirements

- Node.js 20.19+ or 22.12+ (required by Vite 8).
- MongoDB locally or a MongoDB Atlas connection string.

## Getting started

Install dependencies and create your local environment file:

```bash
npm install
cp .env.example .env
```

Set `MONGODB_URI` to your MongoDB connection string and replace `JWT_SECRET`
with a random secret of at least 32 characters. Keep `.env` private and out of
version control.

Start the API and Vite frontend in separate terminals:

```bash
npm run server
```

```bash
npm run dev
```

Open the local URL printed by Vite. The Vite development server proxies `/api`
requests to the API on port 3001. Make sure MongoDB is running/reachable before
starting the API.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run server` | Connect to MongoDB and start the Express API on port 3001. |
| `npm run build` | Create a production build in `dist/`. |
| `npm run preview` | Preview the production build locally. |

For production, serve the frontend and `/api` from the same site (or configure
an HTTPS reverse proxy). The session cookie is marked `Secure` in production.
