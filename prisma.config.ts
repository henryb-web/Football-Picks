import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Read directly from the environment (not prisma's `env()` helper, which
    // throws when unset). `prisma generate` doesn't need a live URL, so this
    // keeps the Vercel build from failing before DATABASE_URL is wired up.
    // migrate/studio still require it to be set in the environment.
    url: process.env.DATABASE_URL ?? "",
  },
});
