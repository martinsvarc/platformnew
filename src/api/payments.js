import { sql } from './db'

// Webhook URLs for n8n automation
const WEBHOOK_URL = 'https://n8n.automatedsolarbiz.com/webhook/d804aab4-f396-4abb-86b1-3b0945448f6c'
const IMAGE_WEBHOOK_URL = 'https://n8n.automatedsolarbiz.com/webhook/ef05d1f1-3fe3-4828-aacd-5cebaf54827c'

/**
 * Send payment data to webhook with auto-generated image
 */
async function sendPaymentWebhook(paymentData) {
  try {
    console.log('Sending payment webhook notification...', paymentData)
    
    // Calculate today's totals
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    
    // Get chatter's today amount
    let chatterTodayAmount = 0
    if (paymentData.user_id) {
      try {
        const chatterToday = await sql`
          select coalesce(sum(amount - coalesce(fee_amount, 0)), 0) as total
          from payments
          where user_id = ${paymentData.user_id}
            and date(paid_at) = ${today}::date
        `
        chatterTodayAmount = Number(chatterToday[0]?.total || 0)
      } catch (err) {
        console.error('Error calculating chatter today amount:', err)
      }
    }
    
    // Get team's today amount
    let teamTodayAmount = 0
    if (paymentData.team_id) {
      try {
        const teamToday = await sql`
          select coalesce(sum(amount - coalesce(fee_amount, 0)), 0) as total
          from payments
          where team_id = ${paymentData.team_id}
            and date(paid_at) = ${today}::date
        `
        teamTodayAmount = Number(teamToday[0]?.total || 0)
      } catch (err) {
        console.error('Error calculating team today amount:', err)
      }
    }
    
    // Get chatter's total made
    let chatterMadeTotal = 0
    if (paymentData.user_id) {
      try {
        const chatterTotal = await sql`
          select coalesce(sum(amount - coalesce(fee_amount, 0)), 0) as total
          from payments
          where user_id = ${paymentData.user_id}
        `
        chatterMadeTotal = Number(chatterTotal[0]?.total || 0)
      } catch (err) {
        console.error('Error calculating chatter total:', err)
      }
    }
    
    // Get client's total sent
    let clientSentTotal = 0
    let clientDay = null
    if (paymentData.client_id) {
      try {
        const clientStats = await sql`
          select 
            coalesce(sum(amount), 0) as total,
            count(*) as payment_count
          from payments
          where client_id = ${paymentData.client_id}
        `
        clientSentTotal = Number(clientStats[0]?.total || 0)
        const paymentCount = Number(clientStats[0]?.payment_count || 0)
        
        if (paymentCount === 1) {
          clientDay = '1st day'
        } else if (paymentCount > 1) {
          clientDay = `${paymentCount}${getOrdinalSuffix(paymentCount)} session`
        }
      } catch (err) {
        console.error('Error calculating client stats:', err)
      }
    }
    
    // Check if client is new (first payment)
    let isNewClient = false
    if (paymentData.client_id) {
      try {
        const clientPaymentCount = await sql`
          select count(*) as count
          from payments
          where client_id = ${paymentData.client_id}
        `
        isNewClient = Number(clientPaymentCount[0]?.count || 0) === 1
      } catch (err) {
        console.error('Error checking if client is new:', err)
      }
    }
    
    // Generate payment image
    const imageData = {
      chatterName: paymentData.user_display_name || paymentData.user_username || 'Unknown',
      chatterProfilePicture: paymentData.user_avatar_url || null,
      chatterMadeTotal: chatterMadeTotal,
      chatterTodayAmount: chatterTodayAmount,
      teamTodayAmount: teamTodayAmount,
      paymentAmount: paymentData.amount,
      currency: paymentData.currency || 'CZK',
      clientName: paymentData.client_name || 'Unknown Client',
      clientStatus: isNewClient ? 'new' : 'old',
      productDescription: paymentData.prodano || null,
      clientSentTotal: clientSentTotal,
      clientDay: clientDay,
      customMessage: paymentData.message || null,
    }
    
    console.log('Generating payment image with data:', imageData)
    
    // Call image generation API (use absolute URL for production)
    const apiUrl = window.location.origin + '/api/generate-payment-image'
    
    try {
      const imageResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(imageData),
      })
      
      if (imageResponse.ok) {
        // Get HTML and convert to image using html2canvas
        const html = await imageResponse.text()
        
        // Create temporary iframe to render HTML
        const iframe = document.createElement('iframe')
        iframe.style.position = 'absolute'
        iframe.style.left = '-9999px'
        iframe.style.width = '1200px'
        iframe.style.height = '1400px'
        document.body.appendChild(iframe)
        
        // Write HTML to iframe
        iframe.contentDocument.open()
        iframe.contentDocument.write(html)
        iframe.contentDocument.close()
        
        // Wait for iframe to load
        await new Promise(resolve => {
          iframe.onload = resolve
          setTimeout(resolve, 100) // Fallback
        })
        
        // Convert to canvas using html2canvas
        const html2canvas = (await import('html2canvas')).default
        const canvas = await html2canvas(iframe.contentDocument.body, {
          width: 1200,
          height: 1400,
          scale: 1,
          logging: false,
        })
        
        // Convert canvas to base64
        const imageBase64 = canvas.toDataURL('image/png').split(',')[1]
        
        // Clean up
        document.body.removeChild(iframe)
        
        // Send to image webhook with all data + image
        await fetch(IMAGE_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...paymentData,
            ...imageData,
            imageBase64: imageBase64,
            timestamp: new Date().toISOString(),
          }),
        })
        
        console.log('Payment image sent to webhook successfully')
      } else {
        console.error('Image generation failed:', imageResponse.status)
      }
    } catch (imageError) {
      console.error('Error generating/sending image:', imageError)
    }
    
    // Also send to original webhook
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...paymentData,
        chatterTodayAmount,
        teamTodayAmount,
      })
    })
    
    if (!response.ok) {
      console.error('Webhook notification failed:', response.status, response.statusText)
    } else {
      console.log('Webhook notification sent successfully')
    }
  } catch (error) {
    // Don't throw error - webhook failure shouldn't break payment creation
    console.error('Error sending webhook notification:', error)
  }
}

// Helper function for ordinal suffixes
function getOrdinalSuffix(num) {
  const j = num % 10
  const k = num % 100
  if (j === 1 && k !== 11) return 'st'
  if (j === 2 && k !== 12) return 'nd'
  if (j === 3 && k !== 13) return 'rd'
  return 'th'
}

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
    
    // Fetch complete payment data with user and client details for webhook
    try {
      const completePaymentData = await sql`
        select 
          p.id,
          p.amount,
          p.fee_amount,
          (p.amount - p.fee_amount) as net_amount,
          p.paid_at,
          p.currency,
          p.prodano,
          p.platforma,
          p.model,
          p.banka,
          p.status,
          p.method,
          p.reference,
          p.notes,
          p.message,
          p.created_at,
          u.id as user_id,
          u.username as user_username,
          u.display_name as user_display_name,
          u.email as user_email,
          u.role as user_role,
          c.id as client_id,
          c.name as client_name,
          c.email as client_email,
          c.phone as client_phone,
          c.vyplata as client_vyplata,
          c.notes as client_notes,
          t.id as team_id,
          t.name as team_name,
          t.slug as team_slug
        from payments p
        left join users u on p.user_id = u.id
        left join clients c on p.client_id = c.id
        left join teams t on p.team_id = t.id
        where p.id = ${res.id}
      `
      
      if (completePaymentData.length > 0) {
        // Send webhook notification with all payment details
        sendPaymentWebhook(completePaymentData[0])
      }
    } catch (webhookError) {
      console.error('Error fetching complete payment data for webhook:', webhookError)
    }
    
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


