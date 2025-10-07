import { sql } from './db'
import { getTeamBySlug, createDefaultTeam } from './teams'
import CryptoJS from 'crypto-js'

function assertNonEmpty(value, field) {
  if (!value || String(value).trim() === '') {
    throw new Error(`Pole "${field}" je povinné`)
  }
}

export async function login({ username, password }) {
  assertNonEmpty(username, 'uživatelské jméno')
  assertNonEmpty(password, 'heslo')

  // Find user by username across all teams
  const users = await sql`
    select u.id, u.team_id, u.username, u.email, u.display_name, u.avatar_url, u.role, u.password_hash, u.status, t.name as team_name, t.slug as team_slug
    from users u
    join teams t on u.team_id = t.id
    where u.username = ${username}
  `

  if (users.length === 0) {
    throw new Error('Neplatné přihlašovací údaje')
  }

  const user = users[0]

  // Check if user is active
  if (user.status === 'inactive') {
    throw new Error('Účet je deaktivován')
  }

  // Verify password
  try {
    const decryptedHash = CryptoJS.AES.decrypt(user.password_hash, 'platform-secret-key').toString(CryptoJS.enc.Utf8)
    const [salt, hash] = decryptedHash.split('$')
    const passwordHash = CryptoJS.PBKDF2(password, salt, { keySize: 256/32, iterations: 10000 }).toString()
    
    if (passwordHash !== hash) {
      throw new Error('Neplatné přihlašovací údaje')
    }
  } catch (error) {
    throw new Error('Neplatné přihlašovací údaje')
  }

  // Update last login
  await sql`
    update users 
    set last_login_at = now() 
    where id = ${user.id}
  `

  // Return user without password hash
  const { password_hash, ...userWithoutPassword } = user
  return userWithoutPassword
}

export async function getCurrentUser(userId) {
  if (!userId) return null

  const users = await sql`
    select id, team_id, username, email, display_name, avatar_url, role, status, last_login_at, created_at
    from users 
    where id = ${userId}
  `

  return users.length > 0 ? users[0] : null
}

export async function logout() {
  // Clear localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('userId')
    localStorage.removeItem('teamId')
    localStorage.removeItem('teamSlug')
    localStorage.removeItem('teamName')
    localStorage.removeItem('userData')
  }
}

export async function updateUserAvatar(userId, avatarUrl) {
  if (!userId || !avatarUrl) {
    throw new Error('User ID and avatar URL are required')
  }

  await sql`
    update users 
    set avatar_url = ${avatarUrl}
    where id = ${userId}
  `

  // Get updated user data
  const users = await sql`
    select id, team_id, username, email, display_name, avatar_url, role, status, last_login_at, created_at
    from users 
    where id = ${userId}
  `

  return users.length > 0 ? users[0] : null
}
