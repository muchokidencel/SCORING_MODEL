import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    // Integration tests round-trip to a real Supabase Postgres instance;
    // the default 5s timeout is too tight for tests that make several
    // sequential requests (e.g. scoring all 7 metrics in one test), and
    // beforeAll hooks that bcrypt-hash + create multiple users are too slow
    // for the default 10s hook timeout under concurrent test-file load.
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
