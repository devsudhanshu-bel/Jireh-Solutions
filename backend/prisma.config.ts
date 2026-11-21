import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Migrations use DIRECT_URL (Neon's non-pooled host) when set, otherwise DATABASE_URL.
// Self-hosted PostgreSQL only needs DATABASE_URL.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DIRECT_URL || process.env.DATABASE_URL || '' },
})
