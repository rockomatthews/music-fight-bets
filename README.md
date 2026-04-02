# Music Fight Bets (concept → build)

A provably-fair (onchain) USDC betting game with **original, music-legend-inspired archetype fighters** (parody aesthetic, *no real people / no likeness*), plus Sora-generated highlight reels.

## North Star
- **Chain decides outcome** (verifiable randomness) → users can trust payouts.
- **Sora renders the show** → highlight video illustrates the already-final result.

## Safety / policy (important)
- Fighters must be **original** (no real names, no public figure likeness).
- Prompts should use **genre/era vibes** only.

## MVP modules
1. Fighters roster + canon (seeded JSON)
2. Supabase schema for fighters/matches/bets/renders
3. USDC parimutuel pool contract scaffold
4. Next.js app (later): match pages + bet UI + feed

## Defaults
- Base + USDC
- Parimutuel payouts (winners split losing pool minus fee)

