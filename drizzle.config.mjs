import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL || '';

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: DATABASE_URL,
    ssl: true
  }
};
