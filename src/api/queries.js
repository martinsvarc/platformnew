import { sql } from './db'

export async function getTeamTotals(teamId) {
  const rows = await sql`
    with r as (
      select
        sum(case when paid_date = current_date then net_amount else 0 end) as daily,
        sum(case when paid_date >= current_date - interval '6 days' then net_amount else 0 end) as weekly,
        sum(case when date_trunc('month', paid_date) = date_trunc('month', current_date) then net_amount else 0 end) as monthly
      from payments
      where team_id = ${teamId}
    )
    select coalesce(daily,0)::float as daily, coalesce(weekly,0)::float as weekly, coalesce(monthly,0)::float as monthly from r
  `
  return rows[0] || { daily: 0, weekly: 0, monthly: 0 }
}

export async function getActiveGoals(teamId) {
  const rows = await sql`
    select id, name, period, metric, target_value::float as target_value, start_date, end_date
    from goals
    where team_id = ${teamId} and active = true and start_date <= current_date and end_date >= current_date
    order by start_date asc
  `
  return rows
}

export async function upsertSimpleGoals(teamId, { daily, weekly, monthly }) {
  // create/update three goals for the current month/week/day windows
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = today.getMonth()
  const monthStart = new Date(yyyy, mm, 1).toISOString().slice(0, 10)
  const monthEnd = new Date(yyyy, mm + 1, 0).toISOString().slice(0, 10)

  const weekDay = today.getDay() || 7
  const weekStartDate = new Date(today)
  weekStartDate.setDate(today.getDate() - (weekDay - 1))
  const weekEndDate = new Date(weekStartDate)
  weekEndDate.setDate(weekStartDate.getDate() + 6)
  const weekStart = weekStartDate.toISOString().slice(0, 10)
  const weekEnd = weekEndDate.toISOString().slice(0, 10)

  const dayStr = today.toISOString().slice(0, 10)

  await sql.begin(async (tx) => {
    if (typeof monthly === 'number') {
      await tx`
        insert into goals (team_id, name, period, metric, target_value, start_date, end_date)
        values (${teamId}, 'Měsíční cíl', 'monthly', 'amount', ${monthly}, ${monthStart}, ${monthEnd})
        on conflict do nothing
      `
      await tx`update goals set target_value = ${monthly}, active = true where team_id = ${teamId} and period = 'monthly' and start_date = ${monthStart} and end_date = ${monthEnd}`
    }
    if (typeof weekly === 'number') {
      await tx`
        insert into goals (team_id, name, period, metric, target_value, start_date, end_date)
        values (${teamId}, 'Týdenní cíl', 'weekly', 'amount', ${weekly}, ${weekStart}, ${weekEnd})
        on conflict do nothing
      `
      await tx`update goals set target_value = ${weekly}, active = true where team_id = ${teamId} and period = 'weekly' and start_date = ${weekStart} and end_date = ${weekEnd}`
    }
    if (typeof daily === 'number') {
      await tx`
        insert into goals (team_id, name, period, metric, target_value, start_date, end_date)
        values (${teamId}, 'Denní cíl', 'daily', 'amount', ${daily}, ${dayStr}, ${dayStr})
        on conflict do nothing
      `
      await tx`update goals set target_value = ${daily}, active = true where team_id = ${teamId} and period = 'daily' and start_date = ${dayStr} and end_date = ${dayStr}`
    }
  })
  return { ok: true }
}

export async function getUserTotals(teamId, userId, { from = null, to = null } = {}) {
  const where = [sql`team_id = ${teamId}`]
  if (userId) where.push(sql`user_id = ${userId}`)
  if (from) where.push(sql`paid_date >= ${from}`)
  if (to) where.push(sql`paid_date <= ${to}`)
  const rows = await sql`
    select
      coalesce(sum(net_amount),0)::float as total,
      coalesce(sum(case when paid_date = current_date then net_amount else 0 end),0)::float as today
    from payments
    where ${sql.join(where, sql` and `)}
  `
  return rows[0]
}

export async function listClients(teamId, { search = '' } = {}) {
  const s = `%${(search || '').toLowerCase()}%`
  const rows = await sql`
    with p as (
      select c.id as client_id,
             max(p.paid_date) as last_sent,
             sum(case when p.paid_date >= current_date - interval '29 days' then p.net_amount else 0 end)::float as last_month,
             sum(p.net_amount)::float as total
      from clients c
      left join payments p on p.client_id = c.id
      where c.team_id = ${teamId}
      group by c.id
    )
    select c.id, c.name, c.email, c.phone, c.vyplata, c.notes,
           p.last_sent, coalesce(p.last_month,0) as last_month, coalesce(p.total,0) as total
    from clients c
    left join p on p.client_id = c.id
    where c.team_id = ${teamId}
      and (lower(c.name) like ${s} or lower(coalesce(c.email,'')) like ${s} or lower(coalesce(c.phone,'')) like ${s})
    order by c.name asc
  `
  return rows
}

export async function updateClient(teamId, clientId, fields) {
  const sets = []
  const values = []
  if (Object.prototype.hasOwnProperty.call(fields, 'email')) {
    sets.push(sql`email = ${fields.email || null}`)
  }
  if (Object.prototype.hasOwnProperty.call(fields, 'phone')) {
    sets.push(sql`phone = ${fields.phone || null}`)
  }
  if (Object.prototype.hasOwnProperty.call(fields, 'vyplata')) {
    sets.push(sql`vyplata = ${fields.vyplata || null}`)
  }
  if (Object.prototype.hasOwnProperty.call(fields, 'notes')) {
    sets.push(sql`notes = ${fields.notes || null}`)
  }
  if (sets.length === 0) return null
  const rows = await sql`
    update clients set ${sql.join(sets, sql`, `)} where id = ${clientId} and team_id = ${teamId} returning *
  `
  return rows[0] || null
}

export async function listPayments(teamId, { from = null, to = null, platform = null, userId = null } = {}) {
  const where = [sql`p.team_id = ${teamId}`]
  if (from) where.push(sql`p.paid_date >= ${from}`)
  if (to) where.push(sql`p.paid_date <= ${to}`)
  if (platform && platform !== 'all') where.push(sql`p.platforma = ${platform}`)
  if (userId && userId !== 'all') where.push(sql`p.user_id = ${userId}`)
  const rows = await sql`
    select p.id, p.paid_at, p.paid_date, p.amount::float as amount, p.net_amount::float as net_amount,
           p.currency, p.prodano, p.platforma, p.model, p.banka, p.status,
           c.name as client_name
    from payments p
    left join clients c on c.id = p.client_id
    where ${sql.join(where, sql` and `)}
    order by p.paid_at desc
    limit 500
  `
  return rows
}


