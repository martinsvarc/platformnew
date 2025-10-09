import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.VITE_DATABASE_URL)

// Get business context
async function getBusinessContext(teamId) {
  try {
    const [overallMetrics] = await sql`
      SELECT 
        COUNT(DISTINCT p.client_id) as total_clients,
        COUNT(*) as total_payments,
        SUM(p.amount - COALESCE(p.fee_amount, 0)) as total_revenue,
        AVG(p.amount - COALESCE(p.fee_amount, 0)) as avg_payment,
        MIN(p.paid_date) as first_payment_date,
        MAX(p.paid_date) as last_payment_date
      FROM payments p
      WHERE p.team_id = ${teamId}
    `

    const retentionData = await sql`
      WITH client_payment_counts AS (
        SELECT 
          client_id,
          COUNT(*) as payment_count,
          COUNT(DISTINCT paid_date) as active_days
        FROM payments
        WHERE team_id = ${teamId} AND client_id IS NOT NULL
        GROUP BY client_id
      )
      SELECT 
        COUNT(CASE WHEN payment_count >= 1 THEN 1 END) as clients_with_1_payment,
        COUNT(CASE WHEN payment_count >= 2 THEN 1 END) as clients_with_2_payments,
        COUNT(CASE WHEN payment_count >= 3 THEN 1 END) as clients_with_3_payments,
        COUNT(CASE WHEN payment_count >= 4 THEN 1 END) as clients_with_4_payments,
        AVG(payment_count) as avg_payments_per_client,
        AVG(active_days) as avg_active_days
      FROM client_payment_counts
    `

    const topPerformers = await sql`
      SELECT 
        ROW_NUMBER() OVER (ORDER BY SUM(p.amount - COALESCE(p.fee_amount, 0)) DESC) as rank,
        COUNT(*) as payment_count,
        SUM(p.amount - COALESCE(p.fee_amount, 0)) as total_revenue,
        COUNT(DISTINCT p.client_id) as unique_clients
      FROM payments p
      WHERE p.team_id = ${teamId} AND p.user_id IS NOT NULL
      GROUP BY p.user_id
      ORDER BY total_revenue DESC
      LIMIT 5
    `

    const growthData = await sql`
      WITH date_ranges AS (
        SELECT 
          CASE 
            WHEN paid_date >= CURRENT_DATE - INTERVAL '30 days' THEN 'recent'
            WHEN paid_date >= CURRENT_DATE - INTERVAL '60 days' THEN 'previous'
          END as period,
          COUNT(*) as payment_count,
          SUM(amount - COALESCE(fee_amount, 0)) as revenue
        FROM payments
        WHERE team_id = ${teamId}
          AND paid_date >= CURRENT_DATE - INTERVAL '60 days'
        GROUP BY period
      )
      SELECT * FROM date_ranges
    `

    return {
      overall: overallMetrics,
      retention: retentionData[0] || {},
      topPerformers,
      growth: growthData
    }
  } catch (error) {
    console.error('Error getting business context:', error)
    throw error
  }
}

export async function handler(event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { teamId, question } = JSON.parse(event.body)

    if (!teamId || !question) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing teamId or question' })
      }
    }

    // Get business context
    const context = await getBusinessContext(teamId)

    // Format context
    const contextText = `
You are a business analytics AI assistant for an OnlyFans agency management platform.

IMPORTANT: All data is anonymized. You have access to aggregate metrics only.

Current Business Metrics:
- Total Clients: ${context.overall.total_clients || 0}
- Total Payments: ${context.overall.total_payments || 0}
- Total Revenue: ${Number(context.overall.total_revenue || 0).toFixed(0)} CZK
- Average Payment: ${Number(context.overall.avg_payment || 0).toFixed(0)} CZK
- Date Range: ${context.overall.first_payment_date || 'N/A'} to ${context.overall.last_payment_date || 'N/A'}

Retention Metrics:
- Clients with 1+ payments: ${context.retention.clients_with_1_payment || 0}
- Clients with 2+ payments: ${context.retention.clients_with_2_payments || 0}
- Clients with 3+ payments: ${context.retention.clients_with_3_payments || 0}
- Clients with 4+ payments: ${context.retention.clients_with_4_payments || 0}
- Avg payments per client: ${Number(context.retention.avg_payments_per_client || 0).toFixed(2)}
- Avg active days per client: ${Number(context.retention.avg_active_days || 0).toFixed(1)}

Team Performance (Anonymized):
${context.topPerformers.map((c) => `Performer #${c.rank}: ${Number(c.total_revenue).toFixed(0)} CZK (${c.payment_count} payments, ${c.unique_clients} clients)`).join('\n')}

Recent Growth (Last 30 days vs Previous 30 days):
${context.growth.map(g => `${g.period}: ${g.payment_count} payments, ${Number(g.revenue).toFixed(0)} CZK`).join('\n')}

User's Question: ${question}

Provide a clear, data-driven answer with specific calculations. For "what-if" scenarios:
1. Use the current metrics as baseline
2. Apply the requested changes
3. Calculate new projections
4. Show the difference

Be specific with numbers and percentages. Format currency amounts with CZK.
`

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY

    let answer = ''

    if (ANTHROPIC_API_KEY) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [{ role: 'user', content: contextText }]
        })
      })

      const data = await response.json()
      answer = data.content[0]?.text || 'No response'
    } else if (OPENAI_API_KEY) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are an expert business analytics assistant.' },
            { role: 'user', content: contextText }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      })

      const data = await response.json()
      answer = data.choices[0]?.message?.content || 'No response'
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'AI service not configured' })
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer, context })
    }
  } catch (error) {
    console.error('Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}

