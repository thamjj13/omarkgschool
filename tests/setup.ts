import os from "node:os";
import path from "node:path";

// Run before every test file: point the app at a throwaway database and a
// fixed secret so the suite never touches real data.
(process.env as Record<string, string | undefined>).NODE_ENV = "test";
process.env.AUTH_SECRET = "test-secret-not-for-production";
process.env.DATABASE_PATH = path.join(
  os.tmpdir(),
  `mba-test-${process.pid}-${Date.now()}.db`
);
