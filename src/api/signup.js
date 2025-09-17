import { sql, withTransaction } from './db'
import { hash, argon2id } from 'argon2-browser'

function assertNonEmpty(value, field) {
  if (!value || String(value).trim() === '') {
    throw new Error(`Pole "${field}" je povinné`)
  }
}

export async function signup({ teamId, username, email, displayName, password, avatarUrl }) {
  assertNonEmpty(teamId, 'teamId')
  assertNonEmpty(username, 'uživatelské jméno')
  assertNonEmpty(password, 'heslo')

  const teamRows = await sql`select id from teams where id = ${teamId}`
  if (teamRows.length === 0) throw new Error('Neplatné team_id')

  const { encoded: passwordHash } = await hash({
    pass: password,
    salt: crypto.getRandomValues(new Uint8Array(16)),
    type: argon2id,
    time: 3,
    mem: 65536,
    hashLen: 32,
    parallelism: 1
  })

  const result = await withTransaction(async (tx) => {
    // Unikátní kombinace (team_id, username)
    const exists = await tx`select 1 from users where team_id = ${teamId} and username = ${username}`
    if (exists.length > 0) throw new Error('Uživatel s tímto jménem v týmu již existuje')

    const inserted = await tx`
      insert into users (team_id, username, email, display_name, avatar_url, password_hash)
      values (${teamId}, ${username}, ${email || null}, ${displayName || null}, ${avatarUrl || null}, ${passwordHash})
      returning id, team_id, username, email, display_name, role, created_at
    `
    return inserted[0]
  })

  return result
}


