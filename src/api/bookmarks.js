import { sql } from './db.js'

// Bookmark Tables
export async function listBookmarkTables(teamId) {
  return await sql`
    SELECT id, name, created_at, updated_at
    FROM bookmark_tables 
    WHERE team_id = ${teamId} 
    ORDER BY created_at DESC
  `
}

export async function createBookmarkTable(teamId, name) {
  const result = await sql`
    INSERT INTO bookmark_tables (team_id, name)
    VALUES (${teamId}, ${name})
    RETURNING id, name, created_at, updated_at
  `
  return result[0]
}

export async function updateBookmarkTable(id, name) {
  const result = await sql`
    UPDATE bookmark_tables 
    SET name = ${name}, updated_at = now()
    WHERE id = ${id}
    RETURNING id, name, created_at, updated_at
  `
  return result[0]
}

export async function deleteBookmarkTable(id) {
  return await sql`
    DELETE FROM bookmark_tables 
    WHERE id = ${id}
  `
}

// Bookmarks
export async function listBookmarks(teamId, bookmarkTableId = null) {
  if (bookmarkTableId) {
    return await sql`
      SELECT b.id, b.name, b.url, b.width, b.height, b.position_x, b.position_y, 
             b.created_at, b.updated_at, bt.name as table_name
      FROM bookmarks b
      JOIN bookmark_tables bt ON b.bookmark_table_id = bt.id
      WHERE b.team_id = ${teamId} AND b.bookmark_table_id = ${bookmarkTableId}
      ORDER BY b.created_at DESC
    `
  } else {
    return await sql`
      SELECT b.id, b.name, b.url, b.width, b.height, b.position_x, b.position_y, 
             b.created_at, b.updated_at, bt.name as table_name
      FROM bookmarks b
      JOIN bookmark_tables bt ON b.bookmark_table_id = bt.id
      WHERE b.team_id = ${teamId}
      ORDER BY b.created_at DESC
    `
  }
}

export async function createBookmark(teamId, bookmarkTableId, name, url, width = 200, height = 150, positionX = 0, positionY = 0) {
  const result = await sql`
    INSERT INTO bookmarks (team_id, bookmark_table_id, name, url, width, height, position_x, position_y)
    VALUES (${teamId}, ${bookmarkTableId}, ${name}, ${url}, ${width}, ${height}, ${positionX}, ${positionY})
    RETURNING id, name, url, width, height, position_x, position_y, created_at, updated_at
  `
  return result[0]
}

export async function updateBookmark(id, name, url, width, height, positionX, positionY) {
  const result = await sql`
    UPDATE bookmarks 
    SET name = ${name}, url = ${url}, width = ${width}, height = ${height}, position_x = ${positionX}, position_y = ${positionY}, updated_at = now()
    WHERE id = ${id}
    RETURNING id, name, url, width, height, position_x, position_y, created_at, updated_at
  `
  return result[0]
}

export async function deleteBookmark(id) {
  return await sql`
    DELETE FROM bookmarks 
    WHERE id = ${id}
  `
}

export async function updateBookmarkPosition(id, positionX, positionY) {
  const result = await sql`
    UPDATE bookmarks 
    SET position_x = ${positionX}, position_y = ${positionY}, updated_at = now()
    WHERE id = ${id}
    RETURNING id, position_x, position_y
  `
  return result[0]
}
