import { sql } from './db'

export async function getTeamTotals(teamId) {
  const rows = await sql`
    select
      coalesce(sum(case when ((paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date = ((now() AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date then (amount - COALESCE(fee_amount, 0)) else 0 end), 0)::float as daily,
      coalesce(sum(case when ((paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date >= date_trunc('week', ((now() AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date) 
                        and ((paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date < date_trunc('week', ((now() AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date) + interval '7 days'
                        then (amount - COALESCE(fee_amount, 0)) else 0 end), 0)::float as weekly,
      coalesce(sum(case when ((paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date >= date_trunc('month', ((now() AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date) 
                        and ((paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date < date_trunc('month', ((now() AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date) + interval '1 month'
                        then (amount - COALESCE(fee_amount, 0)) else 0 end), 0)::float as monthly
    from payments
    where team_id = ${teamId}
  `
  return rows[0] || { daily: 0, weekly: 0, monthly: 0 }
}

export async function getActiveGoals(teamId) {
  try {
    const rows = await sql`
      select id, name, period, metric, target_value::float as target_value, start_date, end_date, description_text, media_url, active
      from goals
      where team_id = ${teamId} and start_date <= current_date and end_date >= current_date
      order by start_date asc
    `
    return rows
  } catch (error) {
    console.error('Error fetching goals:', error)
    // Return empty array if goals table doesn't exist or has issues
    return []
  }
}

export async function upsertSimpleGoals(teamId, { daily, weekly, monthly, dailyDescription, weeklyDescription, monthlyDescription, dailyMedia, weeklyMedia, monthlyMedia, dailyActive = true, weeklyActive = true, monthlyActive = true }) {
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

  console.log('Upserting goals:', { teamId, daily, weekly, monthly, monthStart, monthEnd, weekStart, weekEnd, dayStr })

  try {
    // Monthly goal
    if (typeof monthly === 'number' && monthly > 0) {
      const existing = await sql`
        select id from goals 
        where team_id = ${teamId} and period = 'monthly' and start_date = ${monthStart} and end_date = ${monthEnd}
      `
      if (existing.length > 0) {
        await sql`update goals set target_value = ${monthly}, description_text = ${monthlyDescription || null}, media_url = ${monthlyMedia || null}, active = ${monthlyActive} where id = ${existing[0].id}`
      } else {
        await sql`
          insert into goals (team_id, name, period, metric, target_value, start_date, end_date, description_text, media_url, active)
          values (${teamId}, 'Měsíční cíl', 'monthly', 'amount', ${monthly}, ${monthStart}, ${monthEnd}, ${monthlyDescription || null}, ${monthlyMedia || null}, ${monthlyActive})
        `
      }
    }
    
    // Weekly goal
    if (typeof weekly === 'number' && weekly > 0) {
      const existing = await sql`
        select id from goals 
        where team_id = ${teamId} and period = 'weekly' and start_date = ${weekStart} and end_date = ${weekEnd}
      `
      if (existing.length > 0) {
        await sql`update goals set target_value = ${weekly}, description_text = ${weeklyDescription || null}, media_url = ${weeklyMedia || null}, active = ${weeklyActive} where id = ${existing[0].id}`
      } else {
        await sql`
          insert into goals (team_id, name, period, metric, target_value, start_date, end_date, description_text, media_url, active)
          values (${teamId}, 'Týdenní cíl', 'weekly', 'amount', ${weekly}, ${weekStart}, ${weekEnd}, ${weeklyDescription || null}, ${weeklyMedia || null}, ${weeklyActive})
        `
      }
    }
    
    // Daily goal
    if (typeof daily === 'number' && daily > 0) {
      const existing = await sql`
        select id from goals 
        where team_id = ${teamId} and period = 'daily' and start_date = ${dayStr} and end_date = ${dayStr}
      `
      if (existing.length > 0) {
        await sql`update goals set target_value = ${daily}, description_text = ${dailyDescription || null}, media_url = ${dailyMedia || null}, active = ${dailyActive} where id = ${existing[0].id}`
      } else {
        await sql`
          insert into goals (team_id, name, period, metric, target_value, start_date, end_date, description_text, media_url, active)
          values (${teamId}, 'Denní cíl', 'daily', 'amount', ${daily}, ${dayStr}, ${dayStr}, ${dailyDescription || null}, ${dailyMedia || null}, ${dailyActive})
        `
      }
    }
    
    console.log('Goals upserted successfully')
    return { ok: true }
  } catch (error) {
    console.error('Error in upsertSimpleGoals:', error)
    throw error
  }
}

export async function getUserTotals(teamId, userId, { from = null, to = null } = {}) {
  console.log('getUserTotals called with:', { teamId, userId, from, to })
  
  const rows = await sql`
    select
      coalesce(sum(amount - fee_amount),0)::float as total,
      coalesce(sum(case when ((paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date = ((now() AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date then amount - fee_amount else 0 end),0)::float as today,
      coalesce(sum(case when paid_at >= now() - interval '60 minutes' then amount - fee_amount else 0 end),0)::float as last_hour
    from payments
    where team_id = ${teamId}
      ${userId ? sql`and user_id = ${userId}` : sql``}
      ${from ? sql`and paid_at::date >= ${from}` : sql``}
      ${to ? sql`and paid_at::date <= ${to}` : sql``}
  `
  
  console.log('getUserTotals result:', rows[0])
  return rows[0]
}

// Helper function to remove diacritics
function removeDiacritics(str) {
  if (!str) return ''
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export async function listClients(teamId, { search = '' } = {}) {
  console.log('listClients called with teamId:', teamId)
  
  // First, let's debug what payments we have
  const debugPayments = await sql`
    select p.id, p.paid_at, p.paid_date, (p.amount - COALESCE(p.fee_amount, 0)), p.client_id, c.name as client_name
    from payments p
    left join clients c on c.id = p.client_id
    where p.team_id = ${teamId}
    order by p.paid_at desc
    limit 5
  `
  console.log('Recent payments for debugging:', debugPayments)
  
  // Debug specific client-payment relationships
  const debugClientPayments = await sql`
    select c.id as client_id, c.name as client_name, 
           count(p.id) as payment_count,
           array_agg(p.id) as payment_ids,
           array_agg((p.amount - COALESCE(p.fee_amount, 0))) as amounts
    from clients c
    left join payments p on p.client_id = c.id
    where c.team_id = ${teamId} and c.name = 'Petr'
    group by c.id, c.name
  `
  console.log('Petr client-payment debug:', debugClientPayments)
  
  // Debug all clients and their payment counts
  const debugAllClients = await sql`
    select c.id, c.name, 
           count(p.id) as payment_count,
           sum((p.amount - COALESCE(p.fee_amount, 0))) as total_amount
    from clients c
    left join payments p on p.client_id = c.id
    where c.team_id = ${teamId}
    group by c.id, c.name
    order by payment_count desc
  `
  console.log('All clients payment debug:', debugAllClients)
  
  // Debug the actual statistics calculation for Petr
  const debugPetrStats = await sql`
    with p as (
      select c.id as client_id,
             max(((p.paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date) as last_sent,
             sum(case when ((p.paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date >= (((now() AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date - interval '29 days') then (p.amount - COALESCE(p.fee_amount, 0)) else 0 end)::float as last_month,
             sum((p.amount - COALESCE(p.fee_amount, 0)))::float as total
      from clients c
      left join payments p on p.client_id = c.id
      where c.team_id = ${teamId} and c.deleted_at is null and c.name = 'Petr'
      group by c.id
    )
    select c.id, c.name,
           p.last_sent, coalesce(p.last_month,0) as last_month, coalesce(p.total,0) as total
    from clients c
    left join p on p.client_id = c.id
    where c.team_id = ${teamId} and c.name = 'Petr'
  `
  console.log('Petr statistics debug:', debugPetrStats)
  
  // Debug if payments have client_id
  const debugPaymentClientIds = await sql`
    select id, paid_at, amount, client_id, 
           (select name from clients where id = payments.client_id) as client_name
    from payments 
    where team_id = ${teamId}
    order by paid_at desc
    limit 10
  `
  console.log('Payment client_id debug:', debugPaymentClientIds)
  
  // Debug if payments exist for this specific client
  const debugClientSpecific = await sql`
    select c.id as client_id, c.name as client_name,
           p.id as payment_id, p.amount, (p.amount - COALESCE(p.fee_amount, 0)), p.paid_at
    from clients c
    left join payments p on p.client_id = c.id
    where c.team_id = ${teamId} and c.name = 'johny'
    order by p.paid_at desc
  `
  console.log('Client "johny" specific debug:', debugClientSpecific)
  
  // Simple test without date filtering
  const simpleTest = await sql`
    select c.id, c.name, 
           sum((p.amount - COALESCE(p.fee_amount, 0))) as total_without_date_filter,
           count(p.id) as payment_count
    from clients c
    left join payments p on p.client_id = c.id
    where c.team_id = ${teamId} and c.name = 'johny'
    group by c.id, c.name
  `
  console.log('Simple test for johny (no date filter):', simpleTest)
  
  const rows = await sql`
    with p as (
      select c.id as client_id,
             max(((p.paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date) as last_sent,
             sum(case when ((p.paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date >= (((now() AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date - interval '29 days') then (p.amount - COALESCE(p.fee_amount, 0)) else 0 end)::float as last_month,
             sum((p.amount - COALESCE(p.fee_amount, 0)))::float as total,
             (select u.display_name 
              from payments p2 
              left join users u on u.id = p2.user_id
              where p2.client_id = c.id 
              order by p2.paid_at desc 
              limit 1) as last_chatter
      from clients c
      left join payments p on p.client_id = c.id
      where c.team_id = ${teamId} and c.deleted_at is null
      group by c.id
    )
    select c.id, c.name, c.email, c.phone, c.vyplata, c.notes,
           p.last_sent, coalesce(p.last_month,0) as last_month, coalesce(p.total,0) as total,
           p.last_chatter
    from clients c
    left join p on p.client_id = c.id
    where c.team_id = ${teamId}
      and c.deleted_at is null
    order by c.name asc
  `
  
  console.log('Raw client data from database:', rows)
  
  // Filter results in JavaScript to handle diacritics
  if (search && search.trim()) {
    const searchTerm = removeDiacritics(search.toLowerCase().trim())
    return rows.filter(client => {
      const name = removeDiacritics(client.name?.toLowerCase() || '')
      const email = removeDiacritics(client.email?.toLowerCase() || '')
      const phone = removeDiacritics(client.phone?.toLowerCase() || '')
      
      return name.includes(searchTerm) || 
             email.includes(searchTerm) || 
             phone.includes(searchTerm)
    })
  }
  
  return rows
}

export async function updateClient(teamId, clientId, fields) {
  const updates = []
  if (Object.prototype.hasOwnProperty.call(fields, 'email')) {
    updates.push(sql`email = ${fields.email || null}`)
  }
  if (Object.prototype.hasOwnProperty.call(fields, 'phone')) {
    updates.push(sql`phone = ${fields.phone || null}`)
  }
  if (Object.prototype.hasOwnProperty.call(fields, 'vyplata')) {
    updates.push(sql`vyplata = ${fields.vyplata || null}`)
  }
  if (Object.prototype.hasOwnProperty.call(fields, 'notes')) {
    updates.push(sql`notes = ${fields.notes || null}`)
  }
  if (updates.length === 0) return null
  
  // Handle each update separately since sql.join is not available
  let result = null
  for (const update of updates) {
    const rows = await sql`
      update clients set ${update} where id = ${clientId} and team_id = ${teamId} returning *
    `
    if (rows.length > 0) result = rows[0]
  }
  
  return result
}

export async function listPayments(teamId, { from = null, to = null, platform = null, userId = null } = {}) {
  const rows = await sql`
    select p.id, p.paid_at, p.paid_date, p.amount::float as amount, (p.amount - COALESCE(p.fee_amount, 0))::float as net_amount,
           p.currency, p.prodano, p.platforma, p.model, p.banka, p.status,
           c.name as client_name, u.display_name as chatter
    from payments p
    left join clients c on c.id = p.client_id
    left join users u on u.id = p.user_id
    where p.team_id = ${teamId}
      ${from ? sql`and p.paid_date >= ${from}` : sql``}
      ${to ? sql`and p.paid_date <= ${to}` : sql``}
      ${platform && platform !== 'all' ? sql`and p.platforma = ${platform}` : sql``}
      ${userId && userId !== 'all' ? sql`and p.user_id = ${userId}` : sql``}
    order by p.paid_at desc
    limit 500
  `
  return rows
}

export async function getClientPayments(teamId, clientName) {
  const rows = await sql`
    select p.id, p.paid_at, p.paid_date, p.amount::float as amount, (p.amount - COALESCE(p.fee_amount, 0))::float as net_amount,
           p.currency, p.prodano, p.platforma, p.model, p.banka, p.status,
           c.name as client_name, u.display_name as chatter
    from payments p
    left join clients c on c.id = p.client_id
    left join users u on u.id = p.user_id
    where p.team_id = ${teamId}
      and c.name = ${clientName}
    order by p.paid_at desc
  `
  return rows
}

export async function getTeamUsers(teamId) {
  const rows = await sql`
    select id, username, display_name, email, role, status, avatar_url
    from users
    where team_id = ${teamId} and deleted_at is null
    order by display_name, username
  `
  return rows
}

export async function updateUser(userId, teamId, fields) {
  // Update user fields (currently supporting display_name)
  const updates = []
  if (Object.prototype.hasOwnProperty.call(fields, 'display_name')) {
    updates.push(sql`display_name = ${fields.display_name || null}`)
  }
  
  if (updates.length === 0) return null
  
  const result = await sql`
    update users
    set ${updates[0]}
    where id = ${userId} and team_id = ${teamId}
    returning id, username, display_name, email, role, status, avatar_url
  `
  return result[0]
}

export async function deleteUser(userId, teamId) {
  // Soft delete: set deleted_at timestamp
  const result = await sql`
    update users
    set deleted_at = now()
    where id = ${userId} and team_id = ${teamId}
    returning id
  `
  return result[0]
}

export async function getPaymentsCount(teamId) {
  const rows = await sql`
    select count(*) as count, sum(amount - fee_amount) as total_amount
    from payments
    where team_id = ${teamId}
  `
  return rows[0]
}

export async function getDailyPaymentTimeline(teamId, userId = null) {
  console.log('getDailyPaymentTimeline called with:', { teamId, userId })
  
  const rows = await sql`
    select 
      paid_at,
      amount - fee_amount as net_amount,
      extract(hour from paid_at AT TIME ZONE 'Europe/Prague') as hour,
      extract(minute from paid_at AT TIME ZONE 'Europe/Prague') as minute
    from payments
    where team_id = ${teamId}
      and ((paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date = ((now() AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date
      ${userId ? sql`and user_id = ${userId}` : sql``}
    order by paid_at asc
  `
  
  // Create cumulative timeline data
  let cumulative = 0
  const timelineData = rows.map(row => {
    cumulative += Number(row.net_amount)
    return {
      time: row.paid_at,
      amount: Number(row.net_amount),
      cumulative: cumulative,
      hour: Number(row.hour),
      minute: Number(row.minute)
    }
  })
  
  console.log('Daily payment timeline:', timelineData)
  return timelineData
}

export async function getLeagueData(teamId, userId = null) {
  console.log('getLeagueData called with:', { teamId, userId })
  
  if (!teamId) {
    console.log('No teamId provided')
    return []
  }
  
  try {
    // Get daily and monthly points for team users (Prague timezone with 2 AM reset) - exclude admins
    // Monthly points calculation:
    // - Regular payments = 1x points
    // - New client payments (first payment ever on that day) = 2x points for that day
    const rows = await sql`
      with client_first_payment as (
        -- Get the first payment date for each client (with 2 AM reset)
        select 
          client_id,
          min(((paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date) as first_payment_date
        from payments
        where team_id = ${teamId}
        group by client_id
      ),
      user_monthly_points as (
        -- Calculate monthly points with new client bonus (with 2 AM reset)
        select 
          p.user_id,
          sum(
            case 
              -- If this payment is from a new client on their first day, count 2x
              when cfp.first_payment_date = ((p.paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date 
              then (p.amount - p.fee_amount) * 2
              -- Otherwise count 1x
              else (p.amount - p.fee_amount)
            end
          ) as monthly_points
        from payments p
        left join client_first_payment cfp on cfp.client_id = p.client_id
        where p.team_id = ${teamId}
          and ((p.paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date >= date_trunc('month', ((now() AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date)
          and ((p.paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date < date_trunc('month', ((now() AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date) + interval '1 month'
        group by p.user_id
      )
      select 
        u.id,
        u.display_name,
        u.username,
        u.avatar_url,
        coalesce(sum(case when ((p.paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date = ((now() AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date then p.amount - p.fee_amount else 0 end), 0)::float as daily,
        coalesce(ump.monthly_points, 0)::float as monthly_points,
        coalesce(sum(case when p.paid_at >= now() - interval '60 minutes' then p.amount - p.fee_amount else 0 end), 0)::float as last_hour
      from users u
      left join payments p on p.user_id = u.id and p.team_id = ${teamId}
      left join user_monthly_points ump on ump.user_id = u.id
      where u.team_id = ${teamId} and u.deleted_at is null and u.role != 'admin'
        ${userId ? sql`and u.id = ${userId}` : sql``}
      group by u.id, u.display_name, u.username, u.avatar_url, ump.monthly_points
      order by u.display_name
    `
    
    console.log('Raw league data from database:', rows)
    
    // Format league data with monthly points instead of average
    const leagueData = rows.map(user => {
      return {
        id: user.id,
        name: user.display_name || user.username,
        avatar_url: user.avatar_url,
        daily: Number(user.daily),
        monthly: Number(user.monthly_points), // Now showing points instead of average
        monthly_points: Number(user.monthly_points),
        trend: Number(user.last_hour)
      }
    })
    
    // Note: Sorting is handled in the League component based on active tab
    // Default sort by daily performance for initial load
    if (!userId) {
      leagueData.sort((a, b) => b.daily - a.daily)
    }
    // If filtering by specific user, we only have that user, so no need to sort
    
    console.log('Processed league data:', leagueData)
    return leagueData
  } catch (error) {
    console.error('Error in getLeagueData:', error)
    throw error
  }
}

export async function getClientStats(teamId, userId = null) {
  console.log('getClientStats called with:', { teamId, userId })
  
  if (!teamId) {
    console.log('No teamId provided')
    return { newClients: 0, totalClients: 0, avgClient: 0 }
  }
  
  try {
    // Get client statistics for today (Prague timezone, with 2 AM reset)
    const rows = await sql`
      with today_payments as (
        select 
          p.client_id,
          p.user_id,
          sum(p.amount - p.fee_amount) as daily_amount
        from payments p
        where p.team_id = ${teamId}
          and ((p.paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date = ((now() AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date
          ${userId ? sql`and p.user_id = ${userId}` : sql``}
        group by p.client_id, p.user_id
      ),
      client_first_payment as (
        select 
          p.client_id,
          min(((p.paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date) as first_payment_date
        from payments p
        where p.team_id = ${teamId}
          ${userId ? sql`and p.user_id = ${userId}` : sql``}
        group by p.client_id
      )
      select 
        -- Count of new clients (clients whose first payment was today)
        count(case when cfp.first_payment_date = ((now() AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date then 1 end) as new_clients,
        -- Total number of unique clients who made payments today
        count(distinct tp.client_id) as total_clients,
        -- Average amount per client today
        case 
          when count(distinct tp.client_id) > 0 
          then sum(tp.daily_amount) / count(distinct tp.client_id)
          else 0 
        end as avg_client
      from today_payments tp
      left join client_first_payment cfp on cfp.client_id = tp.client_id
    `
    
    const result = rows[0] || { new_clients: 0, total_clients: 0, avg_client: 0 }
    
    console.log('Client stats result:', result)
    
    return {
      newClients: Number(result.new_clients) || 0,
      totalClients: Number(result.total_clients) || 0,
      avgClient: Number(result.avg_client) || 0
    }
  } catch (error) {
    console.error('Error in getClientStats:', error)
    return { newClients: 0, totalClients: 0, avgClient: 0 }
  }
}

// Debug function to check recent payments
export async function debugRecentPayments(teamId) {
  console.log('Debugging recent payments for team:', teamId)
  const rows = await sql`
    select p.id, p.paid_at, p.paid_date, p.amount, p.model, p.banka, p.user_id,
           c.name as client_name, u.display_name as chatter
    from payments p
    left join clients c on c.id = p.client_id
    left join users u on u.id = p.user_id
    where p.team_id = ${teamId}
    order by p.paid_at desc
    limit 10
  `
  console.log('Recent payments:', rows)
  return rows
}

// Debug function to check client-payment relationships
export async function debugClientPaymentStats(teamId) {
  console.log('Debugging client-payment relationships for team:', teamId)
  const rows = await sql`
    select 
      c.id as client_id,
      c.name as client_name,
      count(p.id) as payment_count,
      sum((p.amount - COALESCE(p.fee_amount, 0))) as total_amount,
      sum(case when ((p.paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date >= (((now() AT TIME ZONE 'Europe/Prague') - interval '2 hours')::date - interval '29 days') then (p.amount - COALESCE(p.fee_amount, 0)) else 0 end) as last_30_days
    from clients c
    left join payments p on p.client_id = c.id
    where c.team_id = ${teamId}
    group by c.id, c.name
    order by total_amount desc
  `
  console.log('Client payment stats:', rows)
  return rows
}

// Get recent payments for notifications
export async function getRecentPayments(teamId, since) {
  console.log('getRecentPayments called with:', { teamId, since })
  
  if (!teamId || !since) {
    return []
  }
  
  try {
    const rows = await sql`
      select 
        p.id,
        p.paid_at,
        p.amount::float as amount,
        p.currency,
        p.prodano,
        p.model,
        p.message,
        p.user_id,
        u.display_name,
        u.username,
        u.avatar_url,
        c.name as client_name,
        c.created_at as client_created_at,
        -- Check if this is a new client (first payment within last 24 hours of client creation)
        case 
          when c.created_at >= (now() - interval '24 hours') then true
          else false
        end as is_new_client
      from payments p
      left join users u on u.id = p.user_id
      left join clients c on c.id = p.client_id
      where p.team_id = ${teamId}
        and p.created_at > ${since}
      order by p.created_at desc
      limit 20
    `
    
    console.log('Recent payments found:', rows.length)
    return rows
  } catch (error) {
    console.error('Error in getRecentPayments:', error)
    return []
  }
}

// Best Chatter Challenge functions
export async function getBestChatterChallenge(teamId) {
  try {
    const rows = await sql`
      select id, description_text, media_url, end_time, start_time, active
      from best_chatter_challenge
      where team_id = ${teamId}
      order by created_at desc
      limit 1
    `
    return rows[0] || null
  } catch (error) {
    console.error('Error fetching best chatter challenge:', error)
    return null
  }
}

export async function upsertBestChatterChallenge(teamId, { descriptionText, mediaUrl, endTime, active }) {
  try {
    const existing = await sql`
      select id from best_chatter_challenge
      where team_id = ${teamId}
      order by created_at desc
      limit 1
    `
    
    if (existing.length > 0) {
      await sql`
        update best_chatter_challenge
        set description_text = ${descriptionText || null},
            media_url = ${mediaUrl || null},
            end_time = ${endTime},
            active = ${active}
        where id = ${existing[0].id}
      `
    } else {
      await sql`
        insert into best_chatter_challenge (team_id, description_text, media_url, end_time, active)
        values (${teamId}, ${descriptionText || null}, ${mediaUrl || null}, ${endTime}, ${active})
      `
    }
    
    return { ok: true }
  } catch (error) {
    console.error('Error upserting best chatter challenge:', error)
    throw error
  }
}

export async function getTopChatters(teamId, startTime) {
  try {
    const rows = await sql`
      select 
        u.id,
        u.display_name,
        u.username,
        u.avatar_url,
        coalesce(sum(p.amount - p.fee_amount), 0)::float as total
      from users u
      left join payments p on p.user_id = u.id 
        and p.team_id = ${teamId}
        and p.paid_at >= ${startTime}
      where u.team_id = ${teamId} and u.deleted_at is null and u.role != 'admin'
      group by u.id, u.display_name, u.username, u.avatar_url
      order by total desc
      limit 10
    `
    return rows
  } catch (error) {
    console.error('Error fetching top chatters:', error)
    return []
  }
}

