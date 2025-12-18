# CMC Tracker

CMC Tracker is a portfolio management dashboard for tracking crypto, fiat, and gold holdings in Toman, with AI-assisted price refreshes. The app supports user logins with an admin panel for managing users, tracking transactions, and viewing performance summaries.

## Features
- User authentication with persistent storage for transactions.
- Admin panel to manage users and review portfolio activity.
- Live and AI-assisted price updates for crypto, gold, USD, and EUR conversions.
- Portfolio overview with allocation breakdowns and performance metrics.

## Prerequisites
- Node.js 20+
- npm

## Run Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set required environment variables (create a `.env.local` if needed):
   - `VITE_GEMINI_API_KEY` for AI-backed price updates (the value will also be mirrored to `GEMINI_API_KEY`/`API_KEY` inside the container, so you only set it once).
   - Optional overrides: `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `PORT` (default `8080`).
3. Start the development server:
   ```bash
   npm run dev
   ```

## Build for Production
Generate the optimized client bundle:
```bash
npm run build
```

## Docker
Build a production image that serves the built app through the Express server:
```bash
docker build -t cmc-tracker:latest .
```

Run the container (creates a `/app/data` volume for user/price data):
```bash
docker run -p 8080:8080 \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=password \
  -e PORT=8080 \
  -e VITE_GEMINI_API_KEY=your_key \
  -v $(pwd)/data:/app/data \
  cmc-tracker:latest
```

You can also use `docker-compose`:
```bash
docker-compose up --build
```
The app will be available at http://localhost:8080.

## Project Scripts
- `npm run dev` – start Vite dev server.
- `npm run build` – build the client bundle.
- `npm run preview` – preview production build locally.
- `npm start` – run the production Express server (expects `dist` to exist).
