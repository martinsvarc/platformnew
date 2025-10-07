import { sql } from './db.js'

/**
 * List all bank accounts for a team
 */
export async function listBankAccounts(teamId) {
  return await sql`
    SELECT id, name, display_order, active, created_at
    FROM bank_accounts
    WHERE team_id = ${teamId} AND active = true
    ORDER BY display_order ASC, name ASC
  `
}

/**
 * Create a new bank account
 */
export async function createBankAccount(teamId, name) {
  const result = await sql`
    INSERT INTO bank_accounts (team_id, name)
    VALUES (${teamId}, ${name})
    RETURNING id, name, display_order, active, created_at
  `
  return result[0]
}

/**
 * Update bank account name
 */
export async function updateBankAccount(bankId, teamId, updates) {
  const allowed = ['name', 'display_order']
  const fields = Object.keys(updates).filter(k => allowed.includes(k))
  if (fields.length === 0) return null
  
  // Build update query dynamically based on provided fields
  if (updates.name && updates.display_order !== undefined) {
    const result = await sql`
      UPDATE bank_accounts
      SET name = ${updates.name}, display_order = ${updates.display_order}
      WHERE id = ${bankId} AND team_id = ${teamId} AND active = true
      RETURNING id, name, display_order, active, created_at
    `
    return result[0]
  } else if (updates.name) {
    const result = await sql`
      UPDATE bank_accounts
      SET name = ${updates.name}
      WHERE id = ${bankId} AND team_id = ${teamId} AND active = true
      RETURNING id, name, display_order, active, created_at
    `
    return result[0]
  } else if (updates.display_order !== undefined) {
    const result = await sql`
      UPDATE bank_accounts
      SET display_order = ${updates.display_order}
      WHERE id = ${bankId} AND team_id = ${teamId} AND active = true
      RETURNING id, name, display_order, active, created_at
    `
    return result[0]
  }
  return null
}

/**
 * Delete (soft delete) a bank account
 */
export async function deleteBankAccount(bankId, teamId) {
  const result = await sql`
    UPDATE bank_accounts
    SET active = false, updated_at = now()
    WHERE id = ${bankId} AND team_id = ${teamId}
    RETURNING id
  `
  return result[0]
}

/**
 * Get bank account statistics (total payments per bank for a period)
 */
export async function getBankAccountStats(teamId, startDate = null, endDate = null) {
  // Handle different filter scenarios
  if (startDate && endDate) {
    return await sql`
      SELECT 
        ba.id,
        ba.name,
        COALESCE(SUM(p.amount), 0) as total
      FROM bank_accounts ba
      LEFT JOIN payments p ON p.banka = ba.name AND p.team_id = ba.team_id AND p.status = 'completed'
        AND p.paid_date >= ${startDate} AND p.paid_date <= ${endDate}
      WHERE ba.team_id = ${teamId} AND ba.active = true
      GROUP BY ba.id, ba.name 
      ORDER BY ba.display_order ASC, ba.name ASC
    `
  } else if (startDate) {
    return await sql`
      SELECT 
        ba.id,
        ba.name,
        COALESCE(SUM(p.amount), 0) as total
      FROM bank_accounts ba
      LEFT JOIN payments p ON p.banka = ba.name AND p.team_id = ba.team_id AND p.status = 'completed'
        AND p.paid_date >= ${startDate}
      WHERE ba.team_id = ${teamId} AND ba.active = true
      GROUP BY ba.id, ba.name 
      ORDER BY ba.display_order ASC, ba.name ASC
    `
  } else if (endDate) {
    return await sql`
      SELECT 
        ba.id,
        ba.name,
        COALESCE(SUM(p.amount), 0) as total
      FROM bank_accounts ba
      LEFT JOIN payments p ON p.banka = ba.name AND p.team_id = ba.team_id AND p.status = 'completed'
        AND p.paid_date <= ${endDate}
      WHERE ba.team_id = ${teamId} AND ba.active = true
      GROUP BY ba.id, ba.name 
      ORDER BY ba.display_order ASC, ba.name ASC
    `
  } else {
    return await sql`
      SELECT 
        ba.id,
        ba.name,
        COALESCE(SUM(p.amount), 0) as total
      FROM bank_accounts ba
      LEFT JOIN payments p ON p.banka = ba.name AND p.team_id = ba.team_id AND p.status = 'completed'
      WHERE ba.team_id = ${teamId} AND ba.active = true
      GROUP BY ba.id, ba.name 
      ORDER BY ba.display_order ASC, ba.name ASC
    `
  }
}

/**
 * Initialize default bank accounts for a team (if none exist)
 */
export async function initializeDefaultBanks(teamId) {
  const existing = await listBankAccounts(teamId)
  if (existing.length > 0) return existing
  
  const defaultBanks = [
    'Raif - Maty',
    'Raif - Tisa',
    'Fio - Martin',
    'Paysafe',
    'Other'
  ]
  
  const created = []
  for (let i = 0; i < defaultBanks.length; i++) {
    const bank = await createBankAccount(teamId, defaultBanks[i])
    await sql`
      UPDATE bank_accounts 
      SET display_order = ${i} 
      WHERE id = ${bank.id}
    `
    created.push({ ...bank, display_order: i })
  }
  
  return created
}

