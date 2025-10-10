import { neon } from '@neondatabase/serverless'
import CryptoJS from 'crypto-js'

const sql = neon(process.env.DATABASE_URL)

function assertNonEmpty(value, field) {
  if (!value || String(value).trim() === '') {
    throw new Error(`Pole "${field}" je povinné`)
  }
}

async function login({ username, password, teamId = null }) {
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

async function getCurrentUser(userId) {
  if (!userId) return null

  const users = await sql`
    select id, team_id, username, email, display_name, avatar_url, role, status, language, last_login_at, created_at
    from users 
    where id = ${userId}
  `

  return users.length > 0 ? users[0] : null
}

async function updateUserAvatar(userId, avatarUrl) {
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

async function updateUserLanguage(userId, language) {
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

async function setupPIN(userId, pinHash) {
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

  // Update PIN for all profiles with the same email
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


async function get2FASettings(userId) {
  if (!userId) return null

  const users = await sql`
    select two_fa_method, two_fa_setup_required, pin_hash
    from users 
    where id = ${userId}
  `

  return users.length > 0 ? users[0] : null
}

async function verifyUserPIN(userId, pinHash) {
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

async function changeUserPassword(userId, teamId, newPassword) {
  if (!userId || !teamId) {
    throw new Error('User ID and Team ID are required')
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error('Heslo musí mít alespoň 6 znaků')
  }

  // Verify user belongs to team
  const users = await sql`
    select id from users 
    where id = ${userId} and team_id = ${teamId}
  `

  if (users.length === 0) {
    throw new Error('User not found in team')
  }

  // Generate salt for password
  const salt = CryptoJS.lib.WordArray.random(128/8).toString()

  // Hash password with PBKDF2
  const hash = CryptoJS.PBKDF2(newPassword, salt, { 
    keySize: 256/32, 
    iterations: 10000 
  }).toString()

  // Combine salt and hash
  const combined = `${salt}$${hash}`

  // Encrypt with AES
  const encryptedPassword = CryptoJS.AES.encrypt(combined, 'platform-secret-key').toString()

  // Update user password
  await sql`
    update users 
    set password_hash = ${encryptedPassword}
    where id = ${userId} and team_id = ${teamId}
  `

  return { success: true }
}

async function getUserTeams(username) {
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

async function getUserTeamsByEmail(email) {
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

async function switchTeam({ username, teamId }) {
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

// Vercel serverless function handler
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { action, ...params } = req.body

    let result
    
    switch (action) {
      case 'login':
        result = await login(params)
        break
      
      case 'getCurrentUser':
        result = await getCurrentUser(params.userId)
        break
      
      case 'updateUserAvatar':
        result = await updateUserAvatar(params.userId, params.avatarUrl)
        break
      
      case 'updateUserLanguage':
        result = await updateUserLanguage(params.userId, params.language)
        break
      
      case 'setupPIN':
        result = await setupPIN(params.userId, params.pinHash)
        break
      
      case 'get2FASettings':
        result = await get2FASettings(params.userId)
        break
      
      case 'verifyUserPIN':
        result = await verifyUserPIN(params.userId, params.pinHash)
        break
      
      case 'changeUserPassword':
        result = await changeUserPassword(params.userId, params.teamId, params.newPassword)
        break
      
      case 'getUserTeams':
        result = await getUserTeams(params.username)
        break
      
      case 'getUserTeamsByEmail':
        result = await getUserTeamsByEmail(params.email)
        break
      
      case 'switchTeam':
        result = await switchTeam(params)
        break
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error('Auth error:', error)
    return res.status(400).json({ error: error.message })
  }
}

