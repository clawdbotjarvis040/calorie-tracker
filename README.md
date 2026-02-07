# Calorie Tracker (Next.js + Supabase) — Mobile-first PWA

Features:
- Manual add/edit/delete food entries
- Daily total vs goal (default **2000 kcal**)
- Barcode scan + lookup via **Open Food Facts**
- Nutrition label photo upload endpoint **stub** (`/api/label/parse`) ready for OpenAI Vision wiring
- PWA-ready (manifest + icons + iOS meta)

## 1) Supabase setup

1. Create a Supabase project.
2. In **SQL Editor**, run: `supabase/schema.sql`.
3. In **Authentication → URL Configuration**:
   - **Site URL**
     - Local dev: `http://localhost:3000`
     - Production: `https://YOUR-VERCEL-DOMAIN.vercel.app`
   - Add any additional redirect URLs you need (e.g. preview deployments).

The app uses Supabase **email + password** auth (with an optional email-confirm step depending on your Supabase settings).

Recommended Supabase Auth setting for a smooth first run:
- Authentication → Providers → Email → **Confirm email: OFF** (you can turn this on later)

## 2) Environment variables

Copy `.env.example` → `.env.local` and fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# optional (only if you wire up label parsing)
OPENAI_API_KEY=...
```

## 3) Run locally

```bash
npm run dev
```

Open http://localhost:3000

## 4) Deploy to Vercel

1. Push this repo to GitHub.
2. Import in Vercel.
3. Add environment variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - (optional) `OPENAI_API_KEY`
4. Deploy.
5. Update Supabase **Site URL** + redirect URLs to match your Vercel domain.

## 5) iPhone PWA install instructions

1. Open the deployed site in **Safari**.
2. Tap **Share** (square with arrow).
3. Tap **Add to Home Screen**.
4. Launch from the Home Screen icon for full-screen standalone mode.

Notes:
- Camera barcode scanning requires HTTPS (works on Vercel) and Safari permission.
- If barcode scanning is unreliable on iOS, use manual barcode entry + Lookup.

## 6) iPhone Shortcuts ideas

### Quick add calories (manual)
Create a Shortcut:
1. **Ask for Input** (Number) → “Calories?”
2. **Ask for Input** (Text) → “Food name?”
3. **Get Contents of URL**
   - URL: `https://YOUR-DOMAIN.vercel.app/api/shortcut/add`
   - Method: POST
   - Request Body: JSON

> This repo does not include the `/api/shortcut/add` endpoint by default. If you want it, implement an authenticated endpoint using a Supabase service key or a user session token.

### Open today
Add a Shortcut action:
- **Open URL** → `https://YOUR-DOMAIN.vercel.app/?date={{Current Date}}`

(Or just open the PWA icon.)

## OpenAI Vision wiring (optional)

`POST /api/label/parse` currently returns a stub response.

To implement real nutrition-label parsing:
- Accept the uploaded image
- Send it to an OpenAI vision-capable model
- Return structured fields like:
  - serving size
  - calories per serving
  - servings per container

Keep secrets server-side; never expose `OPENAI_API_KEY` to the browser.

## Open Food Facts

The barcode lookup endpoint is:
- `GET /api/food/barcode/:barcode`

It calls `https://world.openfoodfacts.org/api/v2/product/:barcode.json` and returns best-effort `name` + `calories`.
