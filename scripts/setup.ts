import { getDb, closeDb } from "../src/lib/db/client";

getDb();
closeDb();

// Seed runs migrations automatically too, then populates demo data.
import("./seed").catch((e) => {
  console.error(e);
  process.exit(1);
});
