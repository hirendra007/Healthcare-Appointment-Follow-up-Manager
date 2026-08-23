import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  datasource: {
    // Point this to your direct database URL for CLI operations
    url: env("DIRECT_URL"), 
  },
});
