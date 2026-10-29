declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    WHATSAPP_INGEST_SECRET?: string;
    VERCEL_BRIDGE_SECRET?: string;
    VERCEL_TEST_USER_EMAIL?: string;
  }
}
