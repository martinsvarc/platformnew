import { neon } from '@neondatabase/serverless'
import CryptoJS from 'crypto-js'

const sql = neon(process.env.VITE_DATABASE_URL)

function assertNonEmpty(value, field) {
  if (!value || String(value).trim() === '') {
    throw new Error(`Pole "${field}" je povinné`)
  }
}

async function login({ username, password }) {
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

  await sql`
    update users 
    set pin_hash = ${pinHash},
        two_fa_method = 'pin',
        two_fa_setup_required = false
    where id = ${userId}
  `

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
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error('Auth error:', error)
    return res.status(400).json({ error: error.message })
  }
}

