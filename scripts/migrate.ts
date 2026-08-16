import { getDb, closeDb } from "../src/lib/db/client";

// Opening the database applies any pending migrations.
getDb();
console.log("Migrations are up to date ✔");
closeDb();
