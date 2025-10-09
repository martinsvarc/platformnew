import { sql } from './db'

// Get client analytics for the given time period
export async function getClientAnalytics(teamId, { from = null, to = null } = {}) {
  try {
    const rows = await sql`
      with payment_data as (
        select 
          p.client_id,
          p.user_id,
          p.model,
          p.paid_at,
          p.paid_date,
          (p.amount - COALESCE(p.fee_amount, 0)) as net_amount
        from payments p
        where p.team_id = ${teamId}
          ${from ? sql`and p.paid_date >= ${from}` : sql``}
          ${to ? sql`and p.paid_date <= ${to}` : sql``}
      ),
      client_totals as (
        select 
          client_id,
          sum(net_amount) as total_amount,
          count(*) as transaction_count
        from payment_data
        where client_id is not null
        group by client_id
      ),
      new_clients as (
        select 
          c.id,
          c.created_at
        from clients c
        where c.team_id = ${teamId}
          and c.deleted_at is null
          ${from ? sql`and c.created_at::date >= ${from}` : sql``}
          ${to ? sql`and c.created_at::date <= ${to}` : sql``}
      )
      select 
        -- Average value per client
        coalesce(avg(ct.total_amount), 0)::float as avg_client_value,
        -- Total number of clients
        coalesce(count(distinct ct.client_id), 0)::int as total_clients,
        -- Average transactions per client
        coalesce(avg(ct.transaction_count), 0)::float as avg_transactions_per_client,
        -- Number of new clients
        coalesce(count(distinct nc.id), 0)::int as new_clients_count,
        -- Total payment amount
        coalesce(sum(ct.total_amount), 0)::float as total_amount
      from client_totals ct
      full outer join new_clients nc on false
    `
    
    const result = rows[0] || {
      avg_client_value: 0,
      total_clients: 0,
      avg_transactions_per_client: 0,
      new_clients_count: 0,
      total_amount: 0
    }
    
    return {
      avgClientValue: Number(result.avg_client_value) || 0,
      totalClients: Number(result.total_clients) || 0,
      avgTransactionsPerClient: Number(result.avg_transactions_per_client) || 0,
      newClientsCount: Number(result.new_clients_count) || 0,
      totalAmount: Number(result.total_amount) || 0
    }
  } catch (error) {
    console.error('Error in getClientAnalytics:', error)
    throw error
  }
}

// Get average lifespan of clients on models
export async function getClientLifespan(teamId, { from = null, to = null } = {}) {
  try {
    const rows = await sql`
      with client_model_payments as (
        select 
          p.client_id,
          p.model,
          min(p.paid_at) as first_payment,
          max(p.paid_at) as last_payment
        from payments p
        where p.team_id = ${teamId}
          and p.client_id is not null
          and p.model is not null
          ${from ? sql`and p.paid_date >= ${from}` : sql``}
          ${to ? sql`and p.paid_date <= ${to}` : sql``}
        group by p.client_id, p.model
        having count(*) > 1  -- Only clients with more than one payment
      )
      select 
        coalesce(avg(extract(epoch from (last_payment - first_payment)) / 86400), 0)::float as avg_lifespan_days
      from client_model_payments
    `
    
    return Number(rows[0]?.avg_lifespan_days) || 0
  } catch (error) {
    console.error('Error in getClientLifespan:', error)
    throw error
  }
}

// Get clients grouped by their total value for bar chart
export async function getClientValueDistribution(teamId, { from = null, to = null } = {}) {
  try {
    const rows = await sql`
      with client_totals as (
        select 
          p.client_id,
          c.name as client_name,
          sum(p.amount - COALESCE(p.fee_amount, 0)) as total_amount
        from payments p
        left join clients c on c.id = p.client_id
        where p.team_id = ${teamId}
          and p.client_id is not null
          ${from ? sql`and p.paid_date >= ${from}` : sql``}
          ${to ? sql`and p.paid_date <= ${to}` : sql``}
        group by p.client_id, c.name
      )
      select 
        client_id,
        client_name,
        total_amount::float
      from client_totals
      order by total_amount desc
      limit 50
    `
    
    return rows.map(row => ({
      clientId: row.client_id,
      clientName: row.client_name || 'Unknown',
      totalAmount: Number(row.total_amount)
    }))
  } catch (error) {
    console.error('Error in getClientValueDistribution:', error)
    throw error
  }
}

// Get average payment amounts by sequence (1st, 2nd, 3rd payment, etc.)
export async function getSequentialPaymentAverages(teamId, { from = null, to = null } = {}) {
  try {
    const rows = await sql`
      with ranked_payments as (
        select 
          p.client_id,
          p.amount - COALESCE(p.fee_amount, 0) as net_amount,
          row_number() over (partition by p.client_id order by p.paid_at asc) as payment_sequence
        from payments p
        where p.team_id = ${teamId}
          and p.client_id is not null
          ${from ? sql`and p.paid_date >= ${from}` : sql``}
          ${to ? sql`and p.paid_date <= ${to}` : sql``}
      )
      select 
        payment_sequence,
        avg(net_amount)::float as avg_amount,
        count(*)::int as payment_count
      from ranked_payments
      where payment_sequence <= 10  -- Only show first 10 payments
      group by payment_sequence
      order by payment_sequence asc
    `
    
    return rows.map(row => ({
      sequence: Number(row.payment_sequence),
      avgAmount: Number(row.avg_amount),
      count: Number(row.payment_count)
    }))
  } catch (error) {
    console.error('Error in getSequentialPaymentAverages:', error)
    throw error
  }
}

// Get heat map data for days of the week (with 2 AM Czech time reset)
export async function getDayOfWeekHeatmap(teamId, { from = null, to = null } = {}) {
  try {
    const rows = await sql`
      select 
        extract(dow from ((paid_at AT TIME ZONE 'Europe/Prague') - interval '2 hours')::timestamp) as day_of_week,
        sum(amount - COALESCE(fee_amount, 0))::float as total_amount,
        count(*)::int as payment_count
      from payments
      where team_id = ${teamId}
        ${from ? sql`and paid_date >= ${from}` : sql``}
        ${to ? sql`and paid_date <= ${to}` : sql``}
      group by day_of_week
      order by day_of_week
    `
    
    // Map to day names (0 = Sunday, 1 = Monday, etc.)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayNamesCzech = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota']
    
    // Create a map for all days with 0 as default
    const dayMap = {}
    for (let i = 0; i < 7; i++) {
      dayMap[i] = { totalAmount: 0, count: 0 }
    }
    
    // Fill in actual data
    rows.forEach(row => {
      const dow = Number(row.day_of_week)
      dayMap[dow] = {
        totalAmount: Number(row.total_amount),
        count: Number(row.payment_count)
      }
    })
    
    // Convert to array with day names
    return Object.keys(dayMap).map(dow => ({
      dayOfWeek: Number(dow),
      dayName: dayNames[dow],
      dayNameCzech: dayNamesCzech[dow],
      totalAmount: dayMap[dow].totalAmount,
      count: dayMap[dow].count
    }))
  } catch (error) {
    console.error('Error in getDayOfWeekHeatmap:', error)
    throw error
  }
}

// Get chatter analytics
export async function getChatterAnalytics(teamId, { from = null, to = null } = {}) {
  try {
    const rows = await sql`
      with payment_data as (
        select 
          p.user_id,
          p.client_id,
          p.paid_at,
          p.paid_date,
          (p.amount - COALESCE(p.fee_amount, 0)) as net_amount
        from payments p
        where p.team_id = ${teamId}
          and p.user_id is not null
          ${from ? sql`and p.paid_date >= ${from}` : sql``}
          ${to ? sql`and p.paid_date <= ${to}` : sql``}
      ),
      chatter_stats as (
        select 
          u.id,
          u.display_name,
          u.username,
          u.avatar_url,
          coalesce(sum(pd.net_amount), 0)::float as total_revenue,
          coalesce(count(distinct pd.client_id), 0)::int as unique_clients,
          coalesce(count(*), 0)::int as total_transactions,
          coalesce(avg(pd.net_amount), 0)::float as avg_transaction_value
        from users u
        left join payment_data pd on pd.user_id = u.id
        where u.team_id = ${teamId}
          and u.deleted_at is null
          and u.role != 'admin'
        group by u.id, u.display_name, u.username, u.avatar_url
      )
      select 
        id,
        display_name,
        username,
        avatar_url,
        total_revenue,
        unique_clients,
        total_transactions,
        avg_transaction_value
      from chatter_stats
      order by total_revenue desc
    `
    
    return rows.map(row => ({
      id: row.id,
      displayName: row.display_name || row.username,
      username: row.username,
      avatarUrl: row.avatar_url,
      totalRevenue: Number(row.total_revenue),
      uniqueClients: Number(row.unique_clients),
      totalTransactions: Number(row.total_transactions),
      avgTransactionValue: Number(row.avg_transaction_value)
    }))
  } catch (error) {
    console.error('Error in getChatterAnalytics:', error)
    throw error
  }
}

// Get client retention by days active (how many clients send across multiple days)
export async function getClientDayRetention(teamId, { from = null, to = null } = {}) {
  try {
    const rows = await sql`
      with client_active_days as (
        select 
          p.client_id,
          count(distinct p.paid_date) as days_active
        from payments p
        where p.team_id = ${teamId}
          and p.client_id is not null
          and p.paid_date is not null
          ${from ? sql`and p.paid_date >= ${from}` : sql``}
          ${to ? sql`and p.paid_date <= ${to}` : sql``}
        group by p.client_id
      ),
      day_distribution as (
        select 
          days_active,
          count(*) as client_count
        from client_active_days
        group by days_active
        order by days_active asc
      ),
      total_clients as (
        select count(*) as total from client_active_days
      )
      select 
        dd.days_active,
        dd.client_count,
        tc.total as total_clients,
        (dd.client_count::float / nullif(tc.total, 0) * 100)::float as percentage
      from day_distribution dd
      cross join total_clients tc
      order by dd.days_active asc
    `
    
    return rows.map(row => ({
      daysActive: Number(row.days_active),
      clientCount: Number(row.client_count),
      totalClients: Number(row.total_clients),
      percentage: Number(row.percentage) || 0
    }))
  } catch (error) {
    console.error('Error in getClientDayRetention:', error)
    throw error
  }
}

// Get payment sequence retention (how many clients reach 2nd, 3rd, 4th payment)
export async function getPaymentSequenceRetention(teamId, { from = null, to = null } = {}) {
  try {
    const rows = await sql`
      with client_payment_counts as (
        select 
          p.client_id,
          count(*) as total_payments
        from payments p
        where p.team_id = ${teamId}
          and p.client_id is not null
          ${from ? sql`and p.paid_date >= ${from}` : sql``}
          ${to ? sql`and p.paid_date <= ${to}` : sql``}
        group by p.client_id
      ),
      max_sequence as (
        select coalesce(max(total_payments), 0) as max_val from client_payment_counts
      ),
      sequences as (
        select generate_series(1, least((select max_val from max_sequence), 20)) as sequence
      ),
      total_clients as (
        select count(*) as total from client_payment_counts
      )
      select 
        s.sequence,
        count(cpc.client_id) as clients_reached,
        tc.total as total_clients,
        (count(cpc.client_id)::float / nullif(tc.total, 0) * 100)::float as percentage
      from sequences s
      cross join total_clients tc
      left join client_payment_counts cpc on cpc.total_payments >= s.sequence
      group by s.sequence, tc.total
      order by s.sequence asc
    `
    
    return rows.map(row => ({
      sequence: Number(row.sequence),
      clientsReached: Number(row.clients_reached),
      totalClients: Number(row.total_clients),
      percentage: Number(row.percentage) || 0
    }))
  } catch (error) {
    console.error('Error in getPaymentSequenceRetention:', error)
    throw error
  }
}

