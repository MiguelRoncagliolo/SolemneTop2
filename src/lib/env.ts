import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  YOUTUBE_API_KEY: z.string().min(1),
  STARTER_STORY_HANDLE: z.string().default("@starterstory"),
  SCRAPER_DEFAULT_MAX_VIDEOS: z.coerce.number().int().min(1).max(200).default(30),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Invalid environment variables: ${message}`);
  }

  cachedEnv = result.data;
  return cachedEnv;
}
