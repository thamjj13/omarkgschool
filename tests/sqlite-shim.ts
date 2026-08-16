// Test-runner shim: Vite does not know about the `node:sqlite` built-in, so we
// alias it here and load the real module via `createRequire` at runtime.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sqlite = require("node:sqlite") as typeof import("node:sqlite");

export const DatabaseSync = sqlite.DatabaseSync;
export default sqlite;
