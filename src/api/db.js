import { neon, neonConfig } from '@neondatabase/serverless'

neonConfig.fetchConnectionCache = true

const connectionString = import.meta.env.VITE_DATABASE_URL

if (!connectionString) {
  // eslint-disable-next-line no-console
  console.warn('[DB] Chybí VITE_DATABASE_URL v .env. Přidejte Neon connection string.')
}

export const sql = neon(connectionString || '')

export async function withTransaction(callback) {
  return sql.begin(async (tx) => {
    return callback(tx)
  })
}


