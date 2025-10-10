import { sql } from './db'
import { getTeamBySlug, createDefaultTeam } from './teams'
import CryptoJS from 'crypto-js'

function assertNonEmpty(value, field) {
  if (!value || String(value).trim() === '') {
    throw new Error(`Pole "${field}" je povinné`)
  }
}

export async function login({ username, password, teamId = null }) {
  assertNonEmpty(username, 'uživatelské jméno')
  assertNonEmpty(password, 'heslo')

  // Find all users with this username across all teams
  const users = await sql`
    select u.id, u.team_id, u.username, u.email, u.display_name, u.avatar_url, u.role, u.password_hash, u.status, u.language, u.two_fa_method, u.two_fa_setup_required, u.pin_hash, t.name as team_name, t.slug as team_slug
    from users u
    join teams t on u.team_id = t.id
    where u.username = ${username}
      and u.deleted_at is null
    order by u.last_login_at desc nulls last
  `

  if (users.length === 0) {
    throw new Error('Neplatné přihlašovací údaje')
  }

  // Verify password using the first user (all profiles share the same password)
  const firstUser = users[0]
  try {
    const decryptedHash = CryptoJS.AES.decrypt(firstUser.password_hash, 'platform-secret-key').toString(CryptoJS.enc.Utf8)
    const [salt, hash] = decryptedHash.split('$')
    const passwordHash = CryptoJS.PBKDF2(password, salt, { keySize: 256/32, iterations: 10000 }).toString()
    
    if (passwordHash !== hash) {
      throw new Error('Neplatné přihlašovací údaje')
    }
  } catch (error) {
    throw new Error('Neplatné přihlašovací údaje')
  }

  // Filter active/pending users
  const activeUsers = users.filter(u => u.status === 'active' || u.status === 'pending')
  
  if (activeUsers.length === 0) {
    throw new Error('Účet je deaktivován')
  }

  // If teamId is specified, use that specific team profile
  let selectedUser
  if (teamId) {
    selectedUser = activeUsers.find(u => u.team_id === teamId)
    if (!selectedUser) {
      throw new Error('Team profile not found')
    }
  } else {
    selectedUser = activeUsers[0]
  }

  // Check if user is pending confirmation
  if (selectedUser.status === 'pending') {
    throw new Error('Váš účet čeká na schválení administrátorem. Počkejte prosím na potvrzení.')
  }

  // Update last login for the selected profile
  await sql`
    update users 
    set last_login_at = now() 
    where id = ${selectedUser.id}
  `

  // Return user without password hash and available teams
  const { password_hash, pin_hash, ...userWithoutPassword } = selectedUser
  
  // If multiple teams exist, include them in the response
  if (activeUsers.length > 1) {
    const availableTeams = activeUsers
      .filter(u => u.status === 'active')
      .map(u => ({
        user_id: u.id,
        team_id: u.team_id,
        team_name: u.team_name,
        team_slug: u.team_slug,
        role: u.role,
        avatar_url: u.avatar_url
      }))
    return {
      ...userWithoutPassword,
      has_multiple_teams: true,
      available_teams: availableTeams
    }
  }

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
 * Syncs the PIN across all profiles with the same email
 */
export async function setupPIN(userId, pinHash) {
  if (!userId || !pinHash) {
    throw new Error('User ID and PIN hash are required')
  }

  // Get the user's email
  const users = await sql`
    select email, username
    from users
    where id = ${userId}
  `

  if (users.length === 0) {
    throw new Error('User not found')
  }

  const { email, username } = users[0]

  // Update PIN for all profiles with the same email OR same username
  // This ensures all team profiles share the same PIN
  if (email) {
    await sql`
      update users 
      set pin_hash = ${pinHash},
          two_fa_method = 'pin',
          two_fa_setup_required = false
      where email = ${email}
        and deleted_at is null
    `
  } else {
    // If no email, just update this specific user
    await sql`
      update users 
      set pin_hash = ${pinHash},
          two_fa_method = 'pin',
          two_fa_setup_required = false
      where id = ${userId}
    `
  }

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

/**
 * Get all team profiles for a username
 */
export async function getUserTeams(username) {
  if (!username) {
    throw new Error('Username is required')
  }

  const users = await sql`
    select u.id as user_id, u.team_id, u.username, u.email, u.display_name, u.avatar_url, u.role, u.status, u.last_login_at,
           t.name as team_name, t.slug as team_slug
    from users u
    join teams t on u.team_id = t.id
    where u.username = ${username}
      and u.deleted_at is null
      and u.status in ('active', 'pending')
    order by u.last_login_at desc nulls last
  `

  return users
}

/**
 * Get all team profiles for an email
 */
export async function getUserTeamsByEmail(email) {
  if (!email) {
    throw new Error('Email is required')
  }

  const users = await sql`
    select u.id as user_id, u.team_id, u.username, u.email, u.display_name, u.avatar_url, u.role, u.status, u.last_login_at,
           t.name as team_name, t.slug as team_slug
    from users u
    join teams t on u.team_id = t.id
    where u.email = ${email}
      and u.deleted_at is null
      and u.status = 'active'
    order by u.last_login_at desc nulls last
  `

  return users
}

/**
 * Switch to a different team (for multi-team users)
 */
export async function switchTeam({ username, teamId }) {
  if (!username || !teamId) {
    throw new Error('Username and team ID are required')
  }

  const users = await sql`
    select u.id, u.team_id, u.username, u.email, u.display_name, u.avatar_url, u.role, u.status, u.language, u.two_fa_method, u.two_fa_setup_required,
           t.name as team_name, t.slug as team_slug
    from users u
    join teams t on u.team_id = t.id
    where u.username = ${username}
      and u.team_id = ${teamId}
      and u.deleted_at is null
  `

  if (users.length === 0) {
    throw new Error('Team profile not found')
  }

  const user = users[0]

  if (user.status !== 'active') {
    throw new Error('This team profile is not active')
  }

  // Update last login for the selected profile
  await sql`
    update users 
    set last_login_at = now() 
    where id = ${user.id}
  `

  return user
}
