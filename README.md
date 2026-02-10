# ReviewAware

Google Review Request Service — manage and automate review requests with ease.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd reviewaware

# Install dependencies
npm install

# Create your local environment file
cp .env.example .env.local
```

### Running Locally

```bash
# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build
npm start

# Lint
npm run lint
```

### Health Check

Once the app is running you can verify it is healthy:

```bash
curl http://localhost:3000/health
# => { "ok": true, "app": "reviewaware" }
```

## Environment Variables

See [`.env.example`](.env.example) for the full list.

| Variable | Required | Description |
| ----------------------- | -------- | ---------------------------------------- |
| `NEXT_PUBLIC_APP_URL` | Yes | Public URL of the application |
| `DATABASE_URL` | No* | PostgreSQL connection string (future) |
| `NEXTAUTH_SECRET` | No* | NextAuth.js secret (future) |
| `NEXTAUTH_URL` | No* | NextAuth.js callback URL (future) |
| `GOOGLE_CLIENT_ID` | No* | Google OAuth client ID (future) |
| `GOOGLE_CLIENT_SECRET` | No* | Google OAuth client secret (future) |

> \* These variables will be required in later sprints.

## Project Structure

```
src/
├── app/
│   ├── health/         # GET /health — liveness probe
│   │   └── route.ts
│   ├── app/            # /app — protected dashboard area (placeholder)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Public home page
```

## License

Private — all rights reserved.
