// Simple payment image generator that returns HTML preview instead of PNG
// This avoids the @vercel/og dependency which requires specific Vercel plans

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
    const statusColor = clientStatus?.toLowerCase() === 'new' ? '#FFD700' : '#DA70D6'

    // Generate HTML that can be screenshot by the client
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      width: 1200px;
      height: 1400px;
      background: linear-gradient(135deg, #121212 0%, #1e1e20 50%, #121212 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .card {
      width: 1120px;
      background: rgba(30, 30, 32, 0.85);
      border-radius: 24px;
      border: 3px solid rgba(218, 112, 214, 0.5);
      box-shadow: 0 20px 60px rgba(218, 112, 214, 0.3);
      padding: 60px;
    }
    .title {
      text-align: center;
      font-size: 56px;
      font-weight: bold;
      color: #F8F8FF;
      margin-bottom: 20px;
    }
    .divider {
      width: 100%;
      height: 2px;
      background: rgba(218, 112, 214, 0.5);
      margin-bottom: 40px;
    }
    .chatter-info {
      display: flex;
      align-items: center;
      margin-bottom: 40px;
    }
    .chatter-img {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: 4px solid #DA70D6;
      margin-right: 40px;
      object-fit: cover;
    }
    .chatter-name {
      font-size: 42px;
      font-weight: bold;
      color: #F8F8FF;
      margin-bottom: 10px;
    }
    .chatter-total {
      font-size: 32px;
      color: #FFD700;
    }
    .payment-box {
      text-align: center;
      padding: 40px;
      margin-bottom: 40px;
      background: rgba(218, 112, 214, 0.15);
      border: 3px solid #DA70D6;
      border-radius: 16px;
    }
    .payment-amount {
      font-size: 70px;
      font-weight: bold;
      background: linear-gradient(135deg, #DA70D6 0%, #FFD700 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .client-name {
      font-size: 38px;
      font-weight: bold;
      color: #F8F8FF;
      margin-bottom: 15px;
    }
    .client-status {
      font-size: 28px;
      color: ${statusColor};
      margin-bottom: 30px;
    }
    .info-box {
      padding: 20px 30px;
      background: rgba(60, 60, 63, 0.4);
      border: 1px solid rgba(218, 112, 214, 0.2);
      border-radius: 12px;
      margin-bottom: 20px;
    }
    .info-label {
      font-size: 26px;
      color: #B0B0B0;
      margin-bottom: 8px;
    }
    .info-value {
      font-size: 30px;
      font-weight: bold;
      color: #F8F8FF;
    }
    .info-value-gold {
      color: #FFD700;
    }
    .message-box {
      padding: 20px 30px;
      margin-top: 30px;
      background: rgba(255, 215, 0, 0.1);
      border: 2px solid rgba(255, 215, 0, 0.6);
      border-radius: 12px;
    }
    .message-label {
      font-size: 24px;
      font-style: italic;
      color: #B0B0B0;
      margin-bottom: 10px;
    }
    .message-text {
      font-size: 28px;
      color: #F8F8FF;
      line-height: 1.4;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      font-size: 24px;
      color: #B0B0B0;
    }
    .corner {
      position: absolute;
      width: 40px;
      height: 40px;
    }
    .corner::before, .corner::after {
      content: '';
      position: absolute;
      background: #FFD700;
    }
    .corner::before { width: 40px; height: 4px; }
    .corner::after { width: 4px; height: 40px; }
    .corner-tl { top: 40px; left: 40px; }
    .corner-tr { top: 40px; right: 40px; }
    .corner-tr::before { right: 0; }
    .corner-tr::after { right: 0; }
    .corner-bl { bottom: 40px; left: 40px; }
    .corner-bl::before { bottom: 0; }
    .corner-bl::after { bottom: 0; }
    .corner-br { bottom: 40px; right: 40px; }
    .corner-br::before { bottom: 0; right: 0; }
    .corner-br::after { bottom: 0; right: 0; }
  </style>
</head>
<body>
  <div class="corner corner-tl"></div>
  <div class="corner corner-tr"></div>
  <div class="corner corner-bl"></div>
  <div class="corner corner-br"></div>
  
  <div class="card">
    <div class="title">💰 NEW PAYMENT</div>
    <div class="divider"></div>
    
    <div class="chatter-info">
      ${chatterProfilePicture ? 
        `<img src="${chatterProfilePicture}" class="chatter-img" alt="${chatterName}">` : 
        ''}
      <div>
        <div class="chatter-name">${chatterProfilePicture ? chatterName : '👤 ' + chatterName}</div>
        ${chatterMadeTotal ? `<div class="chatter-total">Total Made: ${chatterMadeTotal} ${currency}</div>` : ''}
      </div>
    </div>
    
    <div class="payment-box">
      <div class="payment-amount">${paymentAmount} ${currency}</div>
    </div>
    
    <div class="client-name">${statusEmoji} ${clientName}</div>
    <div class="client-status">${statusText}</div>
    
    ${clientSentTotal ? `
      <div class="info-box">
        <div class="info-label">💳 Client Sent Total</div>
        <div class="info-value">${clientSentTotal} ${currency}</div>
      </div>
    ` : ''}
    
    ${clientDay ? `
      <div class="info-box">
        <div class="info-label">📅 Client Session</div>
        <div class="info-value info-value-gold">${clientDay}</div>
      </div>
    ` : ''}
    
    ${productDescription ? `
      <div class="info-box">
        <div class="info-label">🛍️ Product</div>
        <div class="info-value">${productDescription}</div>
      </div>
    ` : ''}
    
    ${customMessage && customMessage.trim() ? `
      <div class="message-box">
        <div class="message-label">💬 Message</div>
        <div class="message-text">${customMessage.slice(0, 150)}</div>
      </div>
    ` : ''}
    
    <div class="footer">
      Generated: ${new Date().toLocaleString('cs-CZ', { 
        dateStyle: 'medium', 
        timeStyle: 'short' 
      })}
    </div>
  </div>
</body>
</html>
    `

    // Return HTML that can be rendered and screenshot by the client
    res.setHeader('Content-Type', 'text/html')
    return res.status(200).send(html)
  } catch (error) {
    console.error('Error generating payment image:', error)
    return res.status(500).json({ error: error.message })
  }
}
