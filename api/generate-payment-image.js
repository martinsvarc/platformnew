// Payment Image Generator API for n8n
// Returns HTML that can be screenshot by n8n or other services

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const data = req.body
    
    // Validate required fields
    const {
      chatterName,
      chatterProfilePicture,
      chatterMadeTotal,
      paymentAmount,
      currency = 'CZK',
      clientName,
      clientStatus,
      productDescription,
      clientSentTotal,
      clientDay,
      customMessage = ''
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

    // Generate epic HTML
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1200, height=1400">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px;
      height: 1400px;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 25%, #0d0d0d 50%, #1a1a1a 75%, #0a0a0a 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      position: relative;
      overflow: hidden;
    }
    .glow-bg-1 {
      position: absolute;
      top: -200px;
      left: -200px;
      width: 800px;
      height: 800px;
      background: radial-gradient(circle, rgba(218, 112, 214, 0.15) 0%, transparent 70%);
      filter: blur(80px);
    }
    .glow-bg-2 {
      position: absolute;
      bottom: -200px;
      right: -200px;
      width: 800px;
      height: 800px;
      background: radial-gradient(circle, rgba(220, 20, 60, 0.15) 0%, transparent 70%);
      filter: blur(80px);
    }
    .main-card {
      position: relative;
      margin: 40px;
      height: 1320px;
      background: linear-gradient(135deg, rgba(30, 30, 32, 0.95) 0%, rgba(20, 20, 22, 0.95) 100%);
      border-radius: 32px;
      padding: 60px;
      display: flex;
      flex-direction: column;
      box-shadow: 
        0 0 60px rgba(218, 112, 214, 0.4),
        0 0 120px rgba(220, 20, 60, 0.3),
        inset 0 0 100px rgba(218, 112, 214, 0.05);
    }
    .main-card::before {
      content: '';
      position: absolute;
      inset: -2px;
      background: linear-gradient(135deg, #DA70D6 0%, #DC143C 50%, #DA70D6 100%);
      border-radius: 32px;
      z-index: -1;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .header-box {
      display: inline-block;
      padding: 20px 60px;
      background: linear-gradient(135deg, rgba(218, 112, 214, 0.2) 0%, rgba(220, 20, 60, 0.2) 100%);
      border: 2px solid rgba(218, 112, 214, 0.5);
      border-radius: 24px;
      box-shadow: 0 0 40px rgba(218, 112, 214, 0.3);
    }
    .header-title {
      font-size: 72px;
      font-weight: 900;
      background: linear-gradient(135deg, #DA70D6 0%, #FFD700 50%, #DC143C 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-transform: uppercase;
      letter-spacing: 4px;
      filter: drop-shadow(0 0 20px rgba(218, 112, 214, 0.5));
    }
    .chatter-section {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 40px;
      padding: 30px;
      background: linear-gradient(135deg, rgba(60, 60, 63, 0.3) 0%, rgba(40, 40, 43, 0.3) 100%);
      border-radius: 20px;
      border: 1px solid rgba(218, 112, 214, 0.2);
    }
    .chatter-img-wrapper {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: 4px solid #DA70D6;
      margin-right: 30px;
      box-shadow: 0 0 40px rgba(218, 112, 214, 0.5);
      overflow: hidden;
    }
    .chatter-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .chatter-name {
      font-size: 48px;
      font-weight: bold;
      color: #F8F8FF;
      margin-bottom: 10px;
      text-shadow: 0 0 20px rgba(248, 248, 255, 0.3);
    }
    .chatter-total {
      font-size: 32px;
      font-weight: bold;
      background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .payment-section {
      position: relative;
      text-align: center;
      padding: 60px;
      margin: 0 -20px 40px -20px;
      background: linear-gradient(135deg, rgba(218, 112, 214, 0.15) 0%, rgba(220, 20, 60, 0.15) 100%);
      border-top: 3px solid #DA70D6;
      border-bottom: 3px solid #DC143C;
      overflow: hidden;
    }
    .payment-glow {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, rgba(218, 112, 214, 0.2) 0%, transparent 70%);
    }
    .payment-amount {
      position: relative;
      z-index: 1;
      font-size: 120px;
      font-weight: 900;
      background: linear-gradient(135deg, #DA70D6 0%, #FFD700 50%, #DC143C 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
      filter: drop-shadow(0 0 40px rgba(218, 112, 214, 0.8));
    }
    .payment-currency {
      position: relative;
      z-index: 1;
      font-size: 56px;
      font-weight: bold;
      color: #FFD700;
      margin-top: 10px;
      text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
    }
    .client-badge {
      padding: 30px 40px;
      background: ${statusGradient};
      border-radius: 20px;
      margin-bottom: 30px;
      box-shadow: 0 0 40px ${clientStatus?.toLowerCase() === 'new' ? 'rgba(255, 215, 0, 0.4)' : 'rgba(218, 112, 214, 0.4)'};
    }
    .client-name {
      font-size: 48px;
      font-weight: 900;
      color: #FFFFFF;
      text-align: center;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 3px;
      text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
    }
    .client-status {
      font-size: 28px;
      font-weight: bold;
      color: rgba(255, 255, 255, 0.9);
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    .info-box {
      padding: 25px 30px;
      background: linear-gradient(135deg, rgba(60, 60, 63, 0.6) 0%, rgba(40, 40, 43, 0.6) 100%);
      border: 2px solid rgba(218, 112, 214, 0.3);
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    .info-label {
      font-size: 24px;
      color: #DA70D6;
      margin-bottom: 12px;
      font-weight: bold;
    }
    .info-value {
      font-size: 36px;
      font-weight: 900;
      color: #F8F8FF;
    }
    .info-value-gold {
      color: #FFD700;
    }
    .product-box {
      padding: 25px 30px;
      background: linear-gradient(135deg, rgba(60, 60, 63, 0.6) 0%, rgba(40, 40, 43, 0.6) 100%);
      border: 2px solid rgba(220, 20, 60, 0.3);
      border-radius: 16px;
      margin-bottom: 30px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    .product-label {
      font-size: 24px;
      color: #DC143C;
      margin-bottom: 12px;
      font-weight: bold;
    }
    .product-value {
      font-size: 32px;
      font-weight: bold;
      color: #F8F8FF;
    }
    .message-box {
      padding: 25px 30px;
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.1) 100%);
      border: 3px solid rgba(255, 215, 0, 0.4);
      border-radius: 16px;
      margin-bottom: 30px;
      box-shadow: 0 0 30px rgba(255, 215, 0, 0.2);
    }
    .message-label {
      font-size: 24px;
      color: #FFD700;
      margin-bottom: 12px;
      font-weight: bold;
      font-style: italic;
    }
    .message-text {
      font-size: 28px;
      color: #F8F8FF;
      line-height: 1.5;
    }
    .footer {
      margin-top: auto;
      text-align: center;
      padding-top: 30px;
      border-top: 2px solid rgba(218, 112, 214, 0.2);
    }
    .footer-text {
      font-size: 24px;
      background: linear-gradient(135deg, #DA70D6 0%, #DC143C 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="glow-bg-1"></div>
  <div class="glow-bg-2"></div>
  
  <div class="main-card">
    <div class="header">
      <div class="header-box">
        <div class="header-title">💰 PAYMENT</div>
      </div>
    </div>

    <div class="chatter-section">
      ${chatterProfilePicture ? `
        <div class="chatter-img-wrapper">
          <img src="${chatterProfilePicture}" class="chatter-img" alt="${chatterName}">
        </div>
      ` : ''}
      <div>
        <div class="chatter-name">${chatterProfilePicture ? chatterName : '👤 ' + chatterName}</div>
        ${chatterMadeTotal ? `<div class="chatter-total">🏆 Total Made: ${Number(chatterMadeTotal).toLocaleString()} ${currency}</div>` : ''}
      </div>
    </div>

    <div class="payment-section">
      <div class="payment-glow"></div>
      <div class="payment-amount">${Number(paymentAmount).toLocaleString()}</div>
      <div class="payment-currency">${currency}</div>
    </div>

    <div class="client-badge">
      <div class="client-name">${statusEmoji} ${clientName}</div>
      <div class="client-status">${statusText}</div>
    </div>

    ${clientSentTotal || clientDay ? `
      <div class="info-grid">
        ${clientSentTotal ? `
          <div class="info-box">
            <div class="info-label">💳 CLIENT SENT</div>
            <div class="info-value">${Number(clientSentTotal).toLocaleString()} ${currency}</div>
          </div>
        ` : ''}
        
        ${clientDay ? `
          <div class="info-box" style="border-color: rgba(255, 215, 0, 0.3);">
            <div class="info-label" style="color: #FFD700;">📅 SESSION</div>
            <div class="info-value info-value-gold">${clientDay}</div>
          </div>
        ` : ''}
      </div>
    ` : ''}

    ${productDescription ? `
      <div class="product-box">
        <div class="product-label">🛍️ PRODUCT</div>
        <div class="product-value">${productDescription}</div>
      </div>
    ` : ''}

    ${customMessage && customMessage.trim() ? `
      <div class="message-box">
        <div class="message-label">💬 MESSAGE</div>
        <div class="message-text">${customMessage.slice(0, 150)}</div>
      </div>
    ` : ''}

    <div class="footer">
      <div class="footer-text">${new Date().toLocaleString('cs-CZ', { dateStyle: 'medium', timeStyle: 'short' })}</div>
    </div>
  </div>
</body>
</html>`

    // Return HTML for screenshot services
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.status(200).send(html)
  } catch (error) {
    console.error('Error generating payment image:', error)
    return res.status(500).json({ error: error.message })
  }
}

