import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from './schema';

// Configure neon to use WebSocket for serverless env
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create the connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create the database instance
export const db = drizzle(pool, { schema });

// Export the schema for use in other files
export * from './schema';