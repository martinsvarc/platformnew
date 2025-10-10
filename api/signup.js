import { neon } from '@neondatabase/serverless'
import CryptoJS from 'crypto-js'

const sql = neon(process.env.DATABASE_URL)

function assertNonEmpty(value, field) {
  if (!value || String(value).trim() === '') {
    throw new Error(`Pole "${field}" je povinné`)
  }
}

async function signup({ teamSlug, username, email, displayName, password, avatarUrl, role = 'member' }) {
  assertNonEmpty(teamSlug, 'team')
  assertNonEmpty(username, 'uživatelské jméno')
  assertNonEmpty(email, 'email')
  assertNonEmpty(displayName, 'zobrazované jméno')
  assertNonEmpty(password, 'heslo')

  // Find team by slug
  const teams = await sql`
    select id, name, slug
    from teams
    where slug = ${teamSlug}
  `

  if (teams.length === 0) {
    throw new Error('Tým nenalezen')
  }

  const team = teams[0]

  // Check if username already exists IN THIS TEAM
  const existingUsers = await sql`
    select id
    from users
    where username = ${username} and team_id = ${team.id} and deleted_at is null
  `

  if (existingUsers.length > 0) {
    throw new Error('Uživatelské jméno již existuje v tomto týmu')
  }

  // Check if email already exists in this team
  const existingEmails = await sql`
    select id
    from users
    where email = ${email} and team_id = ${team.id} and deleted_at is null
  `

  if (existingEmails.length > 0) {
    throw new Error('Email již existuje v tomto týmu')
  }

  // Hash password (same as login)
  const salt = CryptoJS.lib.WordArray.random(128/8).toString()
  const hash = CryptoJS.PBKDF2(password, salt, { keySize: 256/32, iterations: 10000 }).toString()
  const encryptedPassword = CryptoJS.AES.encrypt(`${salt}$${hash}`, 'platform-secret-key').toString()

  // If email already exists in another team, use same password and 2FA settings
  let finalPasswordHash = encryptedPassword
  const existingUserWithEmail = await sql`
    select password_hash, pin_hash, two_fa_method, two_fa_setup_required
    from users
    where email = ${email} and deleted_at is null
    limit 1
  `

  if (existingUserWithEmail.length > 0) {
    finalPasswordHash = existingUserWithEmail[0].password_hash
    console.log('Creating multi-team account for existing email:', email)
  }

  // Set status based on role
  // Admin registrations are auto-approved, members need approval
  const status = role === 'admin' ? 'active' : 'pending'

  // Create user
  const [newUser] = await sql`
    insert into users (team_id, username, email, display_name, password_hash, avatar_url, role, status, two_fa_setup_required)
    values (${team.id}, ${username}, ${email}, ${displayName}, ${finalPasswordHash}, ${avatarUrl || null}, ${role}, ${status}, true)
    returning id, team_id, username, email, display_name, avatar_url, role, status, two_fa_setup_required
  `

  return {
    ...newUser,
    team_name: team.name,
    team_slug: team.slug
  }
}

async function signupAdmin({ teamSlug, username, email, displayName, password, avatarUrl }) {
  return signup({ teamSlug, username, email, displayName, password, avatarUrl, role: 'admin' })
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
      case 'signup':
        result = await signup(params)
        break

      case 'signupAdmin':
        result = await signupAdmin(params)
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error('Signup error:', error)
    return res.status(400).json({ error: error.message })
  }
}

