// Script to generate a new password hash for database update
// Run with: node reset-password.js

import CryptoJS from 'crypto-js'
import { randomBytes } from 'crypto'

// Get password from command line argument
const newPassword = process.argv[2]

if (!newPassword) {
  console.error('\n❌ Error: Please provide a new password')
  console.log('Usage: node reset-password.js "your-new-password"\n')
  process.exit(1)
}

// Generate salt
const salt = randomBytes(16).toString('hex')

// Hash password with PBKDF2 (same as signup process)
const hash = CryptoJS.PBKDF2(newPassword, salt, { 
  keySize: 256/32, 
  iterations: 10000 
}).toString()

// Combine salt and hash
const combined = `${salt}$${hash}`

// Encrypt with AES (same as signup process)
const encryptedHash = CryptoJS.AES.encrypt(combined, 'platform-secret-key').toString()

console.log('\n✅ New password hash generated!\n')
console.log('Password:', newPassword)
console.log('\n📋 Copy this encrypted hash:\n')
console.log(encryptedHash)
console.log('\n💾 SQL to update your password:\n')
console.log(`UPDATE users SET password_hash = '${encryptedHash}' WHERE username = 'YOUR_USERNAME';\n`)
console.log('Replace YOUR_USERNAME with your actual username.\n')

