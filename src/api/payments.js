import { sql } from './db'

async function resolveOrCreateClient(tx, teamId, client) {
  if (!client) return null
  if (client.id) return client.id

  const name = client.name?.trim()
  const email = client.email?.trim() || null
  const phone = client.phone?.trim() || null
  const vyplata = client.vyplata?.trim() || null
  const notes = client.notes?.trim() || null
  const ownerUserId = client.ownerUserId || null

  if (!name && !email && !phone) return null

  if (email) {
    const byEmail = await tx`select id from clients where team_id = ${teamId} and email = ${email}`
    if (byEmail.length) return byEmail[0].id
  }
  if (phone) {
    const byPhone = await tx`select id from clients where team_id = ${teamId} and phone = ${phone}`
    if (byPhone.length) return byPhone[0].id
  }

  const inserted = await tx`
    insert into clients (team_id, name, email, phone, vyplata, notes, owner_user_id)
    values (${teamId}, ${name || 'Neznámý klient'}, ${email}, ${phone}, ${vyplata}, ${notes}, ${ownerUserId})
    returning id
  `
  return inserted[0].id
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
  notes = null
}) {
  if (!teamId) throw new Error('teamId je povinné')
  if (!paidAt) throw new Error('paidAt je povinné')
  const amountNum = Number(amount)
  if (!Number.isFinite(amountNum) || amountNum < 0) throw new Error('Neplatná částka')

  const res = await sql.begin(async (tx) => {
    const clientId = await resolveOrCreateClient(tx, teamId, client)
    const inserted = await tx`
      insert into payments (
        team_id, user_id, client_id, paid_at, amount, currency,
        prodano, platforma, model, banka, status, method, reference, fee_amount, notes
      ) values (
        ${teamId}, ${userId || null}, ${clientId || null}, ${paidAt}, ${amountNum}, ${currency},
        ${prodano || null}, ${platforma || null}, ${model || null}, ${banka || null}, 'completed', ${method}, ${reference}, ${feeAmount || 0}, ${notes}
      )
      returning id
    `
    return inserted[0]
  })

  return res
}


