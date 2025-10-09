import { sql } from './db'

async function resolveOrCreateClient(sql, teamId, client) {
  console.log('resolveOrCreateClient called with:', { teamId, client })
  
  if (!client) {
    console.log('No client provided, returning null')
    return null
  }
  if (client.id) {
    console.log('Client has ID, returning:', client.id)
    return client.id
  }

  const name = client.name?.trim()
  const email = client.email?.trim() || null
  const phone = client.phone?.trim() || null
  const vyplata = client.vyplata?.trim() || null
  const notes = client.notes?.trim() || null
  const ownerUserId = client.ownerUserId || null

  console.log('Client details:', { name, email, phone, vyplata, notes, ownerUserId })

  if (!name || name.length === 0) {
    console.log('Client name is required, returning null')
    return null
  }

  if (email) {
    console.log('Checking for existing client by email:', email)
    const byEmail = await sql`select id from clients where team_id = ${teamId} and email = ${email}`
    if (byEmail.length) {
      console.log('Found existing client by email:', byEmail[0].id)
      return byEmail[0].id
    }
  }
  if (phone) {
    console.log('Checking for existing client by phone:', phone)
    const byPhone = await sql`select id from clients where team_id = ${teamId} and phone = ${phone}`
    if (byPhone.length) {
      console.log('Found existing client by phone:', byPhone[0].id)
      return byPhone[0].id
    }
  }

  console.log('Creating new client with data:', {
    teamId, name, email, phone, vyplata, notes, ownerUserId
  })
  
  try {
    const inserted = await sql`
      insert into clients (team_id, name, email, phone, vyplata, notes, owner_user_id)
      values (${teamId}, ${name}, ${email}, ${phone}, ${vyplata}, ${notes}, ${ownerUserId})
      returning id, name, email, phone
    `
    console.log('New client created successfully:', inserted[0])
    return inserted[0].id
  } catch (error) {
    console.error('Failed to create client:', error)
    throw error
  }
}

export async function createPayment({
  teamId,
  userId,
  client,
  paidAt,
  amount,
  currency = 'CZK',
  prodano,
  platforma,
  model,
  banka,
  method = null,
  reference = null,
  feeAmount = 0,
  notes = null,
  message = null
}) {
  try {
    console.log('=== PAYMENT CREATION START ===')
    console.log('createPayment called with:', {
      teamId, userId, client, paidAt, amount, currency, prodano, platforma, model, banka
    })
    console.log('paidAt value:', paidAt, 'type:', typeof paidAt, 'is falsy:', !paidAt)
    
    if (!teamId) throw new Error('teamId je povinné')
    
    // If no paidAt provided, use current Prague timezone
    let finalPaidAt = paidAt
    if (!finalPaidAt || finalPaidAt === '' || finalPaidAt === null || finalPaidAt === undefined) {
      // Use current time in Prague timezone - let the database handle timezone conversion
      const now = new Date()
      finalPaidAt = now.toISOString()
      console.log('Auto-setting paidAt to current time (will be converted to Prague in DB):', finalPaidAt)
    } else {
      console.log('Using provided paidAt:', finalPaidAt)
    }
    
    const amountNum = Number(amount)
    if (!Number.isFinite(amountNum) || amountNum < 0) throw new Error('Neplatná částka')

    // Resolve or create client first
    console.log('Resolving client...')
    const clientId = await resolveOrCreateClient(sql, teamId, client)
    console.log('Client ID resolved:', clientId)
    
    // Create payment
    console.log('Creating payment with finalPaidAt:', finalPaidAt)
    console.log('Client ID:', clientId)
    const inserted = await sql`
      insert into payments (
        team_id, user_id, client_id, paid_at, amount, currency,
        prodano, platforma, model, banka, status, method, reference, fee_amount, notes, message
      ) values (
        ${teamId}, ${userId || null}, ${clientId || null}, ${finalPaidAt}, ${amountNum}, ${currency},
        ${prodano || null}, ${platforma || null}, ${model || null}, ${banka || null}, 'completed', ${method}, ${reference}, ${feeAmount || 0}, ${notes}, ${message}
      )
      returning id, amount, fee_amount, (amount - fee_amount) as net_amount, paid_at, paid_at::date as paid_date
    `
    
    console.log('Payment created successfully:', inserted[0])
    console.log('Payment date details:', {
      originalPaidAt: paidAt,
      finalPaidAt: finalPaidAt,
      storedPaidAt: inserted[0].paid_at,
      storedPaidDate: inserted[0].paid_date,
      storedPaidAtType: typeof inserted[0].paid_at,
      storedPaidDateType: typeof inserted[0].paid_date
    })
    
    // Verify the payment was actually inserted with correct data
    if (inserted.length === 0) {
      console.error('No payment was inserted!')
      throw new Error('Payment creation failed - no data returned')
    }
    
    if (!inserted[0].paid_at) {
      console.error('Payment created but paid_at is null/undefined!')
    }
    
    console.log('=== PAYMENT CREATION SUCCESS ===')
    const res = inserted[0]
    return res
  } catch (error) {
    console.error('=== PAYMENT CREATION ERROR ===')
    console.error('Error in createPayment:', error)
    throw error
  }
}

export async function updatePayment(paymentId, teamId, updates) {
  try {
    console.log('=== PAYMENT UPDATE START ===')
    console.log('updatePayment called with:', { paymentId, teamId, updates })
    
    if (!paymentId || !teamId) throw new Error('paymentId and teamId are required')
    
    // Get current payment data
    const current = await sql`
      select * from payments where id = ${paymentId} and team_id = ${teamId}
    `
    
    if (current.length === 0) {
      throw new Error('Payment not found')
    }
    
    const payment = current[0]
    
    // Resolve or create client if provided
    let clientId = payment.client_id
    if (updates.client !== undefined) {
      clientId = await resolveOrCreateClient(sql, teamId, updates.client)
    }
    
    // Convert amount if provided
    let amountNum = payment.amount
    if (updates.amount !== undefined) {
      amountNum = Number(updates.amount)
      if (!Number.isFinite(amountNum) || amountNum < 0) throw new Error('Invalid amount')
    }
    
    // Get values (use update value if provided, otherwise keep existing)
    const userId = updates.userId !== undefined ? (updates.userId || null) : payment.user_id
    const paidAt = updates.paidAt !== undefined ? updates.paidAt : payment.paid_at
    const currency = updates.currency !== undefined ? updates.currency : payment.currency
    const prodano = updates.prodano !== undefined ? (updates.prodano || null) : payment.prodano
    const platforma = updates.platforma !== undefined ? (updates.platforma || null) : payment.platforma
    const model = updates.model !== undefined ? (updates.model || null) : payment.model
    const banka = updates.banka !== undefined ? (updates.banka || null) : payment.banka
    const method = updates.method !== undefined ? (updates.method || null) : payment.method
    const reference = updates.reference !== undefined ? (updates.reference || null) : payment.reference
    const feeAmount = updates.feeAmount !== undefined ? (updates.feeAmount || 0) : (payment.fee_amount || 0)
    const notes = updates.notes !== undefined ? (updates.notes || null) : payment.notes
    const message = updates.message !== undefined ? (updates.message || null) : payment.message
    
    // Perform update
    const result = await sql`
      update payments
      set 
        user_id = ${userId},
        client_id = ${clientId},
        paid_at = ${paidAt},
        amount = ${amountNum},
        currency = ${currency},
        prodano = ${prodano},
        platforma = ${platforma},
        model = ${model},
        banka = ${banka},
        method = ${method},
        reference = ${reference},
        fee_amount = ${feeAmount},
        notes = ${notes},
        message = ${message}
      where id = ${paymentId} and team_id = ${teamId}
      returning id, amount, fee_amount, (amount - fee_amount) as net_amount, paid_at, paid_at::date as paid_date,
                user_id, client_id, currency, prodano, platforma, model, banka
    `
    
    if (result.length === 0) {
      throw new Error('Payment update failed')
    }
    
    console.log('Payment updated successfully:', result[0])
    console.log('=== PAYMENT UPDATE SUCCESS ===')
    return result[0]
  } catch (error) {
    console.error('=== PAYMENT UPDATE ERROR ===')
    console.error('Error in updatePayment:', error)
    throw error
  }
}

export async function deletePayment(paymentId, teamId) {
  try {
    console.log('=== PAYMENT DELETE START ===')
    console.log('deletePayment called with:', { paymentId, teamId })
    
    if (!paymentId || !teamId) throw new Error('paymentId and teamId are required')
    
    const result = await sql`
      delete from payments
      where id = ${paymentId} and team_id = ${teamId}
      returning id
    `
    
    if (result.length === 0) {
      throw new Error('Payment not found or delete failed')
    }
    
    console.log('Payment deleted successfully:', result[0])
    console.log('=== PAYMENT DELETE SUCCESS ===')
    return result[0]
  } catch (error) {
    console.error('=== PAYMENT DELETE ERROR ===')
    console.error('Error in deletePayment:', error)
    throw error
  }
}


