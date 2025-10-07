import { sql } from './db.js'

export async function initBookmarkTables() {
  try {
    // Create bookmark_tables table
    await sql`
      CREATE TABLE IF NOT EXISTS bookmark_tables (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        name text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `

    // Create bookmarks table
    await sql`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        bookmark_table_id uuid NOT NULL REFERENCES bookmark_tables(id) ON DELETE CASCADE,
        name text NOT NULL,
        url text NOT NULL,
        width integer NOT NULL DEFAULT 200 CHECK (width >= 100 AND width <= 800),
        height integer NOT NULL DEFAULT 150 CHECK (height >= 100 AND height <= 600),
        position_x integer NOT NULL DEFAULT 0,
        position_y integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS bookmark_tables_team_id_idx ON bookmark_tables(team_id)
    `
    
    await sql`
      CREATE INDEX IF NOT EXISTS bookmarks_team_id_idx ON bookmarks(team_id)
    `
    
    await sql`
      CREATE INDEX IF NOT EXISTS bookmarks_table_id_idx ON bookmarks(bookmark_table_id)
    `

    // Create triggers
    await sql`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `

    await sql`
      DROP TRIGGER IF EXISTS set_bookmark_tables_updated_at ON bookmark_tables
    `
    
    await sql`
      CREATE TRIGGER set_bookmark_tables_updated_at 
      BEFORE UPDATE ON bookmark_tables 
      FOR EACH ROW EXECUTE PROCEDURE set_updated_at()
    `

    await sql`
      DROP TRIGGER IF EXISTS set_bookmarks_updated_at ON bookmarks
    `
    
    await sql`
      CREATE TRIGGER set_bookmarks_updated_at 
      BEFORE UPDATE ON bookmarks 
      FOR EACH ROW EXECUTE PROCEDURE set_updated_at()
    `

    console.log('Bookmark tables initialized successfully')
    return true
  } catch (error) {
    console.error('Error initializing bookmark tables:', error)
    return false
  }
}
