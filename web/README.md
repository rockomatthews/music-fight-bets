# Music Fight Bets (web)

Next.js + Material UI (dark + vibrant).

## Local dev
```bash
npm i
npm run dev
```

## Deploy (Vercel)
- Framework preset: Next.js
- Root directory: `web/`
- Env vars (later, when wiring Supabase/wallet/VRF):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_CHAIN_ID` (Base = 8453)
  - `NEXT_PUBLIC_USDC_ADDRESS` (Base USDC)

