import { sql } from './db'

/**
 * Parse TSV line into payment data
 * Format: 10/6/2025	Luděk Mora	300	no	NATÁLIE
 */
function parseTSVLine(line, lineNumber) {
  const parts = line.split('\t')
  
  if (parts.length !== 5) {
    throw new Error(`Line ${lineNumber}: Expected 5 columns, got ${parts.length}`)
  }

  const [dateStr, clientName, amountStr, isNewStr, modelName] = parts.map(p => p.trim())

  // Parse date (format: 10/6/2025 = month/day/year)
  const dateParts = dateStr.split('/')
  if (dateParts.length !== 3) {
    throw new Error(`Line ${lineNumber}: Invalid date format "${dateStr}". Expected MM/DD/YYYY`)
  }
  
  const month = parseInt(dateParts[0], 10)
  const day = parseInt(dateParts[1], 10)
  const year = parseInt(dateParts[2], 10)
  
  if (isNaN(month) || isNaN(day) || isNaN(year) || month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`Line ${lineNumber}: Invalid date values in "${dateStr}"`)
  }

  // Create date object (in Prague timezone, at end of day to avoid timezone issues)
  const date = new Date(year, month - 1, day, 23, 59, 59)
  
  // Parse amount
  const amount = parseFloat(amountStr)
  if (isNaN(amount) || amount < 0) {
    throw new Error(`Line ${lineNumber}: Invalid amount "${amountStr}"`)
  }

  // Parse isNew
  const isNew = isNewStr.toLowerCase() === 'yes' || isNewStr.toLowerCase() === 'ano'

  if (!clientName || !modelName) {
    throw new Error(`Line ${lineNumber}: Client name and model name are required`)
  }

  return {
    date,
    clientName,
    amount,
    isNew,
    modelName: modelName.toUpperCase(), // Normalize to uppercase
    lineNumber
  }
}

/**
 * Parse entire TSV input
 */
export function parseTSVData(tsvText) {
  const lines = tsvText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)

  const parsed = []
  const errors = []

  lines.forEach((line, idx) => {
    try {
      const data = parseTSVLine(line, idx + 1)
      parsed.push(data)
    } catch (err) {
      errors.push(err.message)
    }
  })

  return { parsed, errors }
}

/**
 * Find or create a client, optionally setting created_at to specific date
 */
async function findOrCreateClient(teamId, clientName, createdAtDate = null) {
  // First try to find existing client by name (case-insensitive)
  const existing = await sql`
    SELECT id, name, created_at
    FROM clients
    WHERE team_id = ${teamId} 
      AND LOWER(name) = LOWER(${clientName})
      AND deleted_at IS NULL
    LIMIT 1
  `

  if (existing.length > 0) {
    return existing[0]
  }

  // Create new client
  const createdAt = createdAtDate || new Date()
  const result = await sql`
    INSERT INTO clients (team_id, name, created_at)
    VALUES (${teamId}, ${clientName}, ${createdAt})
    RETURNING id, name, created_at
  `

  return result[0]
}

/**
 * Map model name to user ID
 */
async function mapModelToUserId(teamId, modelName, userCache) {
  // Check cache first
  const normalizedName = modelName.toUpperCase()
  
  if (userCache[normalizedName]) {
    return userCache[normalizedName]
  }

  // Try to find user by display_name or username (case-insensitive)
  const users = await sql`
    SELECT id, username, display_name
    FROM users
    WHERE team_id = ${teamId}
      AND deleted_at IS NULL
      AND (
        UPPER(display_name) = ${normalizedName}
        OR UPPER(username) = ${normalizedName}
      )
    LIMIT 1
  `

  if (users.length > 0) {
    userCache[normalizedName] = users[0].id
    return users[0].id
  }

  // If not found, return null (will store in model text field only)
  return null
}

/**
 * Bulk import payments from parsed TSV data
 */
export async function bulkImportPayments(teamId, parsedData) {
  const results = {
    successful: 0,
    failed: 0,
    errors: [],
    clientsCreated: 0,
    clientsFound: 0
  }

  // Cache for user lookups
  const userCache = {}
  
  // Cache for client lookups (to avoid re-querying for duplicate names in same import)
  const clientCache = {}

  for (const payment of parsedData) {
    try {
      const { date, clientName, amount, isNew, modelName } = payment

      // Map model name to user ID
      const userId = await mapModelToUserId(teamId, modelName, userCache)

      // Find or create client
      let client
      const clientCacheKey = clientName.toLowerCase()
      
      if (clientCache[clientCacheKey]) {
        client = clientCache[clientCacheKey]
        results.clientsFound++
      } else {
        // If isNew is true, set the client's created_at to the payment date
        const createdAtDate = isNew ? date : null
        client = await findOrCreateClient(teamId, clientName, createdAtDate)
        clientCache[clientCacheKey] = client
        
        // Check if we just created it or found it
        const wasJustCreated = createdAtDate && 
          Math.abs(new Date(client.created_at) - createdAtDate) < 1000
        
        if (wasJustCreated) {
          results.clientsCreated++
        } else {
          results.clientsFound++
        }
      }

      // Create payment
      await sql`
        INSERT INTO payments (
          team_id,
          user_id,
          client_id,
          paid_at,
          amount,
          currency,
          model,
          status
        ) VALUES (
          ${teamId},
          ${userId},
          ${client.id},
          ${date.toISOString()},
          ${amount},
          'CZK',
          ${modelName},
          'completed'
        )
      `

      results.successful++
    } catch (err) {
      results.failed++
      results.errors.push(`Line ${payment.lineNumber}: ${err.message}`)
      console.error('Error importing payment:', err, payment)
    }
  }

  return results
}

/**
 * Preview import without actually creating records
 */
export async function previewImport(teamId, parsedData) {
  const preview = {
    totalPayments: parsedData.length,
    totalAmount: 0,
    dateRange: { min: null, max: null },
    modelBreakdown: {},
    clientBreakdown: {},
    newClients: 0,
    existingClients: 0,
    clientNames: new Set()
  }

  // Cache for checking existing clients
  const existingClientsCache = {}

  for (const payment of parsedData) {
    const { date, clientName, amount, isNew, modelName } = payment

    // Sum amount
    preview.totalAmount += amount

    // Track date range
    if (!preview.dateRange.min || date < preview.dateRange.min) {
      preview.dateRange.min = date
    }
    if (!preview.dateRange.max || date > preview.dateRange.max) {
      preview.dateRange.max = date
    }

    // Track by model
    if (!preview.modelBreakdown[modelName]) {
      preview.modelBreakdown[modelName] = { count: 0, total: 0 }
    }
    preview.modelBreakdown[modelName].count++
    preview.modelBreakdown[modelName].total += amount

    // Track by client
    const clientKey = clientName.toLowerCase()
    if (!preview.clientBreakdown[clientKey]) {
      preview.clientBreakdown[clientKey] = {
        name: clientName, // Keep original case for display
        count: 0,
        total: 0,
        isNew: isNew,
        dates: []
      }
    }
    preview.clientBreakdown[clientKey].count++
    preview.clientBreakdown[clientKey].total += amount
    preview.clientBreakdown[clientKey].dates.push(date)

    // Track unique clients
    if (!preview.clientNames.has(clientKey)) {
      preview.clientNames.add(clientKey)

      // Check if client exists
      if (!existingClientsCache[clientKey]) {
        const existing = await sql`
          SELECT id
          FROM clients
          WHERE team_id = ${teamId}
            AND LOWER(name) = ${clientKey}
            AND deleted_at IS NULL
          LIMIT 1
        `
        existingClientsCache[clientKey] = existing.length > 0
      }

      if (existingClientsCache[clientKey]) {
        preview.existingClients++
      } else {
        preview.newClients++
      }
    }
  }

  return preview
}

