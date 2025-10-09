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
    select u.id, u.team_id, u.username, u.email, u.display_name, u.avatar_url, u.role, u.password_hash, u.status, u.language, u.two_fa_method, u.two_fa_setup_required, t.name as team_name, t.slug as team_slug
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

  // Check if user is pending confirmation
  if (user.status === 'pending') {
    throw new Error('Váš účet čeká na schválení administrátorem. Počkejte prosím na potvrzení.')
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
    select id, team_id, username, email, display_name, avatar_url, role, status, language, last_login_at, created_at
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
    select id, team_id, username, email, display_name, avatar_url, role, status, language, last_login_at, created_at
    from users 
    where id = ${userId}
  `

  return users.length > 0 ? users[0] : null
}

export async function updateUserLanguage(userId, language) {
  if (!userId || !language) {
    throw new Error('User ID and language are required')
  }

  // Validate language
  if (!['cs', 'en'].includes(language)) {
    throw new Error('Invalid language. Must be "cs" or "en"')
  }

  await sql`
    update users 
    set language = ${language}
    where id = ${userId}
  `

  // Get updated user data
  const users = await sql`
    select id, team_id, username, email, display_name, avatar_url, role, status, language, last_login_at, created_at
    from users 
    where id = ${userId}
  `

  return users.length > 0 ? users[0] : null
}

/**
 * Set up PIN 2FA for a user
 */
export async function setupPIN(userId, pinHash) {
  if (!userId || !pinHash) {
    throw new Error('User ID and PIN hash are required')
  }

  await sql`
    update users 
    set pin_hash = ${pinHash},
        two_fa_method = 'pin',
        two_fa_setup_required = false
    where id = ${userId}
  `

  return { success: true }
}

/**
 * Set up biometric 2FA for a user
 */
export async function setupBiometric(userId) {
  if (!userId) {
    throw new Error('User ID is required')
  }

  await sql`
    update users 
    set two_fa_method = 'biometric',
        two_fa_setup_required = false
    where id = ${userId}
  `

  return { success: true }
}

/**
 * Get user's 2FA settings
 */
export async function get2FASettings(userId) {
  if (!userId) return null

  const users = await sql`
    select two_fa_method, two_fa_setup_required, pin_hash
    from users 
    where id = ${userId}
  `

  return users.length > 0 ? users[0] : null
}

/**
 * Verify PIN for a user
 */
export async function verifyUserPIN(userId, pinHash) {
  if (!userId) {
    throw new Error('User ID is required')
  }

  const users = await sql`
    select pin_hash
    from users 
    where id = ${userId}
  `

  if (users.length === 0 || !users[0].pin_hash) {
    throw new Error('PIN not set up for this user')
  }

  return users[0].pin_hash === pinHash
}
