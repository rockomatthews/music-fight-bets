/* eslint-disable @typescript-eslint/no-explicit-any */

const GENRES = [
  "Hip-Hop",
  "Pop",
  "EDM",
  "Rock",
  "Metal",
  "Indie",
  "R&B",
  "Jazz",
  "Funk",
  "Punk",
  "Latin",
  "Reggae",
  "Country",
  "K-Pop",
  "Afrobeats",
];

const ARCHETYPES = [
  "Street Poet",
  "Neon DJ",
  "Arena Rocker",
  "Synth Witch",
  "Drum Titan",
  "Bass Assassin",
  "Vocal Sniper",
  "Riff Monk",
  "Glitch Gremlin",
  "Stage Paladin",
  "Crowd Hypnotist",
  "Tempo Samurai",
  "Harmony Hacker",
  "Hook Bandit",
];

const SILHOUETTES = ["hoodie", "cape", "oversized_jacket", "armor", "kimono", "trench", "spikes", "glow_suit", "robes", "leather"];
const PROPS = ["mic_stand", "keytar", "boombox", "katana_guitar", "laser_mic", "drumsticks", "vinyl_shield", "speaker_hammer", "cable_whip", "neon_mask"];
const STAGE_FX = ["pyro", "lasers", "smoke", "holograms", "strobe", "confetti", "sparks", "rain", "void", "aurora"];

function pick<T>(arr: T[], n: number, rnd: () => number): T[] {
  const a = [...arr];
  const out: T[] = [];
  while (out.length < n && a.length) {
    const i = Math.floor(rnd() * a.length);
    out.push(a.splice(i, 1)[0]);
  }
  return out;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export function generateFighters(count: number, seed = 1337) {
  const rnd = mulberry32(seed);

  const fighters: any[] = [];
  for (let i = 0; i < count; i++) {
    const genre = GENRES[Math.floor(rnd() * GENRES.length)];
    const archetype = ARCHETYPES[Math.floor(rnd() * ARCHETYPES.length)];
    const nameA = ["Aria", "Nova", "Jett", "Kira", "Rex", "Mako", "Luna", "Zed", "Vega", "Echo", "Blaze", "Nyx", "Orion", "Sable", "Rio"][Math.floor(rnd() * 15)];
    const nameB = ["Titan", "Vandal", "Cipher", "Banshee", "Lynx", "Raptor", "Monk", "Warden", "Glitch", "Phantom", "Rogue", "Siren", "Wolf", "Halo", "Riot"][Math.floor(rnd() * 15)];
    const stageName = `${nameA} ${nameB}`;
    const id = `g_${slug(stageName)}_${(i + 1).toString().padStart(3, "0")}`;

    fighters.push({
      id,
      stageName,
      archetype,
      genre,
      palette: [],
      signatureMoves: [],
      promptStyle: `Original character. Musician-coded fighter. Genre: ${genre}. Archetype: ${archetype}. No real people, no public figures, no copyrighted characters.`,
      avatarUrl: null,
      attrs: {
        silhouette: pick(SILHOUETTES, 1, rnd)[0],
        prop: pick(PROPS, 1, rnd)[0],
        stage_fx: pick(STAGE_FX, 1, rnd)[0],
      },
    });
  }

  return fighters;
}
