import html2canvas from 'html2canvas'

/**
 * Generate a beautiful payment image for Telegram sharing
 * Pre-rendered as actual PNG image
 * 
 * @param {Object} paymentData - Payment information
 * @param {string} paymentData.chatterName - Name of the chatter
 * @param {string} [paymentData.chatterProfilePicture] - URL to chatter's profile picture
 * @param {number} paymentData.chatterMadeTotal - Total amount chatter has made
 * @param {number} paymentData.paymentAmount - Amount of this payment
 * @param {string} [paymentData.currency='CZK'] - Currency code
 * @param {string} paymentData.clientName - Name of the client
 * @param {string} paymentData.clientStatus - 'new' or 'old'
 * @param {string} [paymentData.productDescription] - What was sold (Co se prodalo)
 * @param {number} paymentData.clientSentTotal - Total amount client has sent
 * @param {string} paymentData.clientDay - Client's session info (e.g., "1st day", "2nd session")
 * @param {string} [paymentData.customMessage] - Custom message from the chatter
 * 
 * @returns {Promise<Blob>} - Image blob that can be downloaded or sent to Telegram
 */
export async function generatePaymentImage(paymentData) {
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
  } = paymentData

  if (!chatterName || !paymentAmount || !clientName) {
    throw new Error('Missing required fields: chatterName, paymentAmount, clientName')
  }

  const statusEmoji = clientStatus?.toLowerCase() === 'new' ? '🆕' : '🔄'
  const statusText = clientStatus?.toLowerCase() === 'new' ? 'NEW CLIENT' : 'RETURNING CLIENT'
  const statusGradient = clientStatus?.toLowerCase() === 'new' 
    ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' 
    : 'linear-gradient(135deg, #DA70D6 0%, #BA55D3 100%)'

  // Create temporary container
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-9999px'
  container.style.top = '-9999px'
  container.style.width = '1200px'
  container.style.height = '1400px'
  
  container.innerHTML = `
    <div style="
      width: 1200px;
      height: 1400px;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 25%, #0d0d0d 50%, #1a1a1a 75%, #0a0a0a 100%);
      position: relative;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    ">
      <!-- Animated Background Glow -->
      <div style="
        position: absolute;
        top: -200px;
        left: -200px;
        width: 800px;
        height: 800px;
        background: radial-gradient(circle, rgba(218, 112, 214, 0.15) 0%, transparent 70%);
        filter: blur(80px);
      "></div>
      <div style="
        position: absolute;
        bottom: -200px;
        right: -200px;
        width: 800px;
        height: 800px;
        background: radial-gradient(circle, rgba(220, 20, 60, 0.15) 0%, transparent 70%);
        filter: blur(80px);
      "></div>
      
      <!-- Main Card -->
      <div style="
        position: relative;
        margin: 40px;
        height: 1320px;
        background: linear-gradient(135deg, rgba(30, 30, 32, 0.95) 0%, rgba(20, 20, 22, 0.95) 100%);
        border-radius: 32px;
        border: 2px solid transparent;
        background-clip: padding-box;
        box-shadow: 
          0 0 60px rgba(218, 112, 214, 0.4),
          0 0 120px rgba(220, 20, 60, 0.3),
          inset 0 0 100px rgba(218, 112, 214, 0.05);
        padding: 60px;
        display: flex;
        flex-direction: column;
      ">
        <!-- Glowing Border Effect -->
        <div style="
          position: absolute;
          inset: -2px;
          background: linear-gradient(135deg, #DA70D6 0%, #DC143C 50%, #DA70D6 100%);
          border-radius: 32px;
          z-index: -1;
        "></div>
        
        <!-- Header with Logo -->
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="
            display: inline-block;
            padding: 20px 60px;
            background: linear-gradient(135deg, rgba(218, 112, 214, 0.2) 0%, rgba(220, 20, 60, 0.2) 100%);
            border: 2px solid rgba(218, 112, 214, 0.5);
            border-radius: 24px;
            box-shadow: 0 0 40px rgba(218, 112, 214, 0.3);
          ">
            <div style="
              font-size: 72px;
              font-weight: 900;
              background: linear-gradient(135deg, #DA70D6 0%, #FFD700 50%, #DC143C 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              text-transform: uppercase;
              letter-spacing: 4px;
              filter: drop-shadow(0 0 20px rgba(218, 112, 214, 0.5));
            ">💰 PAYMENT</div>
          </div>
        </div>

        <!-- Chatter Section -->
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 40px;
          padding: 30px;
          background: linear-gradient(135deg, rgba(60, 60, 63, 0.3) 0%, rgba(40, 40, 43, 0.3) 100%);
          border-radius: 20px;
          border: 1px solid rgba(218, 112, 214, 0.2);
        ">
          ${chatterProfilePicture ? `
            <div style="
              width: 120px;
              height: 120px;
              border-radius: 50%;
              border: 4px solid transparent;
              background: linear-gradient(135deg, #DA70D6 0%, #FFD700 100%) border-box;
              padding: 4px;
              margin-right: 30px;
              box-shadow: 0 0 40px rgba(218, 112, 214, 0.5);
            ">
              <img src="${chatterProfilePicture}" style="
                width: 100%;
                height: 100%;
                border-radius: 50%;
                object-fit: cover;
              " />
            </div>
          ` : ''}
          <div>
            <div style="
              font-size: 48px;
              font-weight: bold;
              color: #F8F8FF;
              margin-bottom: 10px;
              text-shadow: 0 0 20px rgba(248, 248, 255, 0.3);
            ">${chatterProfilePicture ? chatterName : '👤 ' + chatterName}</div>
            ${chatterMadeTotal ? `
              <div style="
                font-size: 32px;
                font-weight: bold;
                background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
              ">🏆 Total Made: ${Number(chatterMadeTotal).toLocaleString()} ${currency}</div>
            ` : ''}
          </div>
        </div>

        <!-- Epic Payment Amount -->
        <div style="
          position: relative;
          text-align: center;
          padding: 60px;
          margin: 0 -20px 40px -20px;
          background: linear-gradient(135deg, rgba(218, 112, 214, 0.15) 0%, rgba(220, 20, 60, 0.15) 100%);
          border-top: 3px solid transparent;
          border-bottom: 3px solid transparent;
          border-image: linear-gradient(90deg, transparent, #DA70D6, #DC143C, #DA70D6, transparent) 1;
          overflow: hidden;
        ">
          <div style="
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at center, rgba(218, 112, 214, 0.2) 0%, transparent 70%);
          "></div>
          <div style="position: relative; z-index: 1;">
            <div style="
              font-size: 120px;
              font-weight: 900;
              background: linear-gradient(135deg, #DA70D6 0%, #FFD700 50%, #DC143C 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              line-height: 1;
              filter: drop-shadow(0 0 40px rgba(218, 112, 214, 0.8));
            ">${Number(paymentAmount).toLocaleString()}</div>
            <div style="
              font-size: 56px;
              font-weight: bold;
              color: #FFD700;
              margin-top: 10px;
              text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
            ">${currency}</div>
          </div>
        </div>

        <!-- Client Info -->
        <div style="
          padding: 30px 40px;
          background: ${statusGradient};
          border-radius: 20px;
          margin-bottom: 30px;
          box-shadow: 0 0 40px ${clientStatus?.toLowerCase() === 'new' ? 'rgba(255, 215, 0, 0.4)' : 'rgba(218, 112, 214, 0.4)'};
        ">
          <div style="
            font-size: 48px;
            font-weight: 900;
            color: #FFFFFF;
            text-align: center;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 3px;
            text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
          ">${statusEmoji} ${clientName}</div>
          <div style="
            font-size: 28px;
            font-weight: bold;
            color: rgba(255, 255, 255, 0.9);
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 2px;
          ">${statusText}</div>
        </div>

        <!-- Info Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          ${clientSentTotal ? `
            <div style="
              padding: 25px 30px;
              background: linear-gradient(135deg, rgba(60, 60, 63, 0.6) 0%, rgba(40, 40, 43, 0.6) 100%);
              border: 2px solid rgba(218, 112, 214, 0.3);
              border-radius: 16px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            ">
              <div style="font-size: 24px; color: #DA70D6; margin-bottom: 12px; font-weight: bold;">💳 CLIENT SENT</div>
              <div style="font-size: 36px; font-weight: 900; color: #F8F8FF;">${Number(clientSentTotal).toLocaleString()} ${currency}</div>
            </div>
          ` : ''}
          
          ${clientDay ? `
            <div style="
              padding: 25px 30px;
              background: linear-gradient(135deg, rgba(60, 60, 63, 0.6) 0%, rgba(40, 40, 43, 0.6) 100%);
              border: 2px solid rgba(255, 215, 0, 0.3);
              border-radius: 16px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            ">
              <div style="font-size: 24px; color: #FFD700; margin-bottom: 12px; font-weight: bold;">📅 SESSION</div>
              <div style="font-size: 36px; font-weight: 900; color: #FFD700;">${clientDay}</div>
            </div>
          ` : ''}
        </div>

        ${productDescription ? `
          <div style="
            padding: 25px 30px;
            background: linear-gradient(135deg, rgba(60, 60, 63, 0.6) 0%, rgba(40, 40, 43, 0.6) 100%);
            border: 2px solid rgba(220, 20, 60, 0.3);
            border-radius: 16px;
            margin-bottom: 30px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          ">
            <div style="font-size: 24px; color: #DC143C; margin-bottom: 12px; font-weight: bold;">🛍️ PRODUCT</div>
            <div style="font-size: 32px; font-weight: bold; color: #F8F8FF;">${productDescription}</div>
          </div>
        ` : ''}

        ${customMessage && customMessage.trim() ? `
          <div style="
            padding: 25px 30px;
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.1) 100%);
            border: 3px solid rgba(255, 215, 0, 0.4);
            border-radius: 16px;
            margin-bottom: 30px;
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.2);
          ">
            <div style="font-size: 24px; color: #FFD700; margin-bottom: 12px; font-weight: bold; font-style: italic;">💬 MESSAGE</div>
            <div style="font-size: 28px; color: #F8F8FF; line-height: 1.5;">${customMessage.slice(0, 150)}</div>
          </div>
        ` : ''}

        <!-- Epic Footer -->
        <div style="
          margin-top: auto;
          text-align: center;
          padding-top: 30px;
          border-top: 2px solid rgba(218, 112, 214, 0.2);
        ">
          <div style="
            font-size: 24px;
            background: linear-gradient(135deg, #DA70D6 0%, #DC143C 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: bold;
          ">${new Date().toLocaleString('cs-CZ', { dateStyle: 'medium', timeStyle: 'short' })}</div>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(container)

  try {
    // Generate canvas from HTML
    const canvas = await html2canvas(container, {
      width: 1200,
      height: 1400,
      scale: 2, // Higher quality
      backgroundColor: null,
      logging: false,
      useCORS: true, // For profile pictures from external URLs
    })

    // Convert canvas to blob
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
    
    return blob
  } finally {
    // Clean up
    document.body.removeChild(container)
  }
}

/**
 * Generate and download a payment image
 */
export async function downloadPaymentImage(paymentData, filename) {
  try {
    const blob = await generatePaymentImage(paymentData)
    
    // Create download link
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `payment-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    return true
  } catch (error) {
    console.error('Error downloading payment image:', error)
    throw error
  }
}

/**
 * Generate payment image and get as data URL (for preview)
 */
export async function getPaymentImageDataURL(paymentData) {
  try {
    const blob = await generatePaymentImage(paymentData)
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error getting payment image data URL:', error)
    throw error
  }
}
