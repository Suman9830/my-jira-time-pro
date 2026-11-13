/** Read an env var at call time (never at import time, so builds work without secrets). */
export function env(name: string, optional = false): string {
  const v = process.env[name];
  if (!v && !optional) {
    throw new Error(`Missing environment variable ${name}. See .env.example`);
  }
  return v ?? "";
}

export const appUrl = () => env("APP_URL").replace(/\/$/, "");
