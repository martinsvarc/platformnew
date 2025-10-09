// Payment Image Generator - Returns HTML for client-side conversion
// Client will convert to image using html2canvas

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const data = req.body
    
    // Validate required fields
    const {
      chatterName,
      paymentAmount,
      currency = 'CZK',
      clientName,
      clientStatus,
      chatterMadeTotal,
      chatterTodayAmount = 0,
      teamTodayAmount = 0,
      productDescription,
      clientSentTotal,
      clientDay,
      customMessage = '',
    } = data

    if (!chatterName || !paymentAmount || !clientName) {
      return res.status(400).json({ 
        error: 'Missing required fields: chatterName, paymentAmount, clientName' 
      })
    }

    const statusEmoji = clientStatus?.toLowerCase() === 'new' ? '🆕' : '🔄'
    const statusText = clientStatus?.toLowerCase() === 'new' ? 'NEW CLIENT' : 'RETURNING CLIENT'
    const statusGradient = clientStatus?.toLowerCase() === 'new' 
                          ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
      : 'linear-gradient(135deg, #DA70D6 0%, #BA55D3 100%)'

    // Generate HTML
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            width: 1200px;
            height: 1400px;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            padding: 40px;
          }
          .card {
            background: linear-gradient(135deg, rgba(30, 30, 32, 0.95) 0%, rgba(20, 20, 22, 0.95) 100%);
            border-radius: 32px;
            border: 2px solid #DA70D6;
            padding: 60px;
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          .header {
            font-size: 72px;
            font-weight: 900;
            text-align: center;
            background: linear-gradient(135deg, #DA70D6 0%, #FFD700 50%, #DC143C 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 40px;
          }
          .chatter-name {
            font-size: 48px;
            font-weight: bold;
            color: #F8F8FF;
            text-align: center;
            margin-bottom: 20px;
          }
          .stat {
            text-align: center;
            margin-bottom: 10px;
          }
          .stat-gold { color: #FFD700; font-size: 28px; }
          .stat-purple { color: #DA70D6; font-size: 24px; margin-bottom: 40px; }
          .amount-box {
            padding: 60px;
            margin: 0 0 40px 0;
            background: linear-gradient(135deg, rgba(218, 112, 214, 0.15) 0%, rgba(220, 20, 60, 0.15) 100%);
            border-top: 3px solid #DA70D6;
            border-bottom: 3px solid #DC143C;
            text-align: center;
          }
          .amount {
            font-size: 120px;
            font-weight: 900;
            background: linear-gradient(135deg, #DA70D6 0%, #FFD700 50%, #DC143C 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .currency {
            font-size: 56px;
            font-weight: bold;
            color: #FFD700;
            margin-top: 10px;
          }
          .client-badge {
            padding: 30px 40px;
            background: ${statusGradient};
            border-radius: 20px;
            margin-bottom: 30px;
            text-align: center;
          }
          .client-name {
            font-size: 48px;
            font-weight: 900;
            color: #FFFFFF;
            margin-bottom: 15px;
          }
          .client-status {
            font-size: 28px;
            font-weight: bold;
            color: rgba(255, 255, 255, 0.9);
          }
          .info-grid {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
          }
          .info-card {
            flex: 1;
            padding: 25px 30px;
            background: rgba(60, 60, 63, 0.6);
            border-radius: 16px;
          }
          .info-card.purple { border: 2px solid rgba(218, 112, 214, 0.3); }
          .info-card.gold { border: 2px solid rgba(255, 215, 0, 0.3); }
          .info-label {
            font-size: 24px;
            margin-bottom: 12px;
          }
          .info-label.purple { color: #DA70D6; }
          .info-label.gold { color: #FFD700; }
          .info-value {
            font-size: 36px;
            font-weight: 900;
          }
          .info-value.white { color: #F8F8FF; }
          .info-value.gold { color: #FFD700; }
          .team-box {
            padding: 30px;
            background: linear-gradient(135deg, rgba(220, 20, 60, 0.2) 0%, rgba(218, 112, 214, 0.2) 100%);
            border: 3px solid rgba(220, 20, 60, 0.5);
            border-radius: 20px;
            margin-bottom: 30px;
            text-align: center;
          }
          .team-label {
            font-size: 28px;
            color: #DC143C;
            margin-bottom: 12px;
          }
          .team-value {
            font-size: 48px;
            font-weight: 900;
            color: #F8F8FF;
          }
          .product-box, .message-box {
            padding: 25px 30px;
            border-radius: 16px;
            margin-bottom: 30px;
          }
          .product-box {
            background: rgba(60, 60, 63, 0.6);
            border: 2px solid rgba(220, 20, 60, 0.3);
          }
          .message-box {
            background: rgba(255, 215, 0, 0.1);
            border: 3px solid rgba(255, 215, 0, 0.4);
          }
          .product-label, .message-label {
            font-size: 24px;
            margin-bottom: 12px;
          }
          .product-label { color: #DC143C; }
          .message-label { color: #FFD700; }
          .product-text {
            font-size: 32px;
            font-weight: bold;
            color: #F8F8FF;
          }
          .message-text {
            font-size: 28px;
            color: #F8F8FF;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">💰 PAYMENT</div>
          <div class="chatter-name">👤 ${chatterName}</div>
          ${chatterMadeTotal ? `<div class="stat stat-gold">🏆 Total Made: ${Number(chatterMadeTotal).toLocaleString()} ${currency}</div>` : ''}
          ${chatterTodayAmount > 0 ? `<div class="stat stat-purple">📊 Today: ${Number(chatterTodayAmount).toLocaleString()} ${currency}</div>` : ''}
          
          <div class="amount-box">
            <div class="amount">${Number(paymentAmount).toLocaleString()}</div>
            <div class="currency">${currency}</div>
          </div>
          
          <div class="client-badge">
            <div class="client-name">${statusEmoji} ${clientName}</div>
            <div class="client-status">${statusText}</div>
          </div>
          
          <div class="info-grid">
            ${clientSentTotal ? `
              <div class="info-card purple">
                <div class="info-label purple">💳 CLIENT SENT</div>
                <div class="info-value white">${Number(clientSentTotal).toLocaleString()} ${currency}</div>
              </div>
            ` : ''}
            ${clientDay ? `
              <div class="info-card gold">
                <div class="info-label gold">📅 SESSION</div>
                <div class="info-value gold">${clientDay}</div>
              </div>
            ` : ''}
          </div>
          
          ${teamTodayAmount > 0 ? `
            <div class="team-box">
              <div class="team-label">👥 TEAM TODAY</div>
              <div class="team-value">${Number(teamTodayAmount).toLocaleString()} ${currency}</div>
            </div>
          ` : ''}
          
          ${productDescription ? `
            <div class="product-box">
              <div class="product-label">🛍️ PRODUCT</div>
              <div class="product-text">${productDescription}</div>
            </div>
          ` : ''}
          
          ${customMessage && customMessage.trim() ? `
            <div class="message-box">
              <div class="message-label">💬 MESSAGE</div>
              <div class="message-text">${customMessage.slice(0, 150)}</div>
            </div>
          ` : ''}
        </div>
      </body>
      </html>
    `

    // Return HTML
    res.setHeader('Content-Type', 'text/html')
    return res.status(200).send(html)
  } catch (error) {
    console.error('Error generating payment image:', error)
    return res.status(500).json({ error: error.message })
  }
}
