import { sql } from './db'
import { getTeamBySlug, createDefaultTeam } from './teams'
import CryptoJS from 'crypto-js'

function assertNonEmpty(value, field) {
  if (!value || String(value).trim() === '') {
    throw new Error(`Pole "${field}" je povinné`)
  }
}

export async function signup({ teamSlug, username, email, displayName, password, avatarUrl, role = 'member' }) {
  assertNonEmpty(teamSlug, 'teamSlug')
  assertNonEmpty(username, 'uživatelské jméno')
  assertNonEmpty(password, 'heslo')

  // Get team by slug, or create it if it doesn't exist
  let team = await getTeamBySlug(teamSlug)
  if (!team) {
    // Create new team with the provided slug
    const result = await sql`
      insert into teams (name, slug)
      values (${teamSlug}, ${teamSlug})
      returning id, name, slug
    `
    team = result[0]
  }

  // Generate salt and hash password
  const salt = CryptoJS.lib.WordArray.random(16).toString()
  const passwordHash = CryptoJS.PBKDF2(password, salt, { keySize: 256/32, iterations: 10000 }).toString()
  const encryptedHash = CryptoJS.AES.encrypt(`${salt}$${passwordHash}`, 'platform-secret-key').toString()

  // Check if user already exists
  const exists = await sql`select 1 from users where team_id = ${team.id} and username = ${username}`
  if (exists.length > 0) throw new Error('Uživatel s tímto jménem v týmu již existuje')

  // Create user with specified role - set status to 'pending' for regular members, 'active' for admins
  const status = role === 'admin' ? 'active' : 'pending'
  const inserted = await sql`
    insert into users (team_id, username, email, display_name, avatar_url, password_hash, role, status)
    values (${team.id}, ${username}, ${email || null}, ${displayName || null}, ${avatarUrl || null}, ${encryptedHash}, ${role}::user_role, ${status})
    returning id, team_id, username, email, display_name, role, status, created_at
  `
  
  const result = inserted[0]

  return result
}

export async function signupAdmin({ teamSlug, username, email, displayName, password, avatarUrl }) {
  return signup({ teamSlug, username, email, displayName, password, avatarUrl, role: 'admin' })
}


