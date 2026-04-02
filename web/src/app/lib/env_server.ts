import { z } from "zod";

const EnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  MFB_ADMIN_SECRET: z.string().min(12),
});

export function envServer() {
  const parsed = EnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    MFB_ADMIN_SECRET: process.env.MFB_ADMIN_SECRET,
  });
  if (!parsed.success) {
    throw new Error("Missing server env. Set SUPABASE_SERVICE_ROLE_KEY and MFB_ADMIN_SECRET.");
  }
  return parsed.data;
}
