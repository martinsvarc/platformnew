import { createCanvas, loadImage } from 'canvas';

// Platform colors
const COLORS = {
  neonOrchid: 'rgb(218, 112, 214)',
  neonOrchidRgba: 'rgba(218, 112, 214, 0.5)',
  neonOrchidLight: 'rgba(218, 112, 214, 0.3)',
  sunsetGold: 'rgb(255, 215, 0)',
  sunsetGoldRgba: 'rgba(255, 215, 0, 0.6)',
  obsidian: 'rgb(18, 18, 18)',
  charcoal: 'rgb(30, 30, 32)',
  pearl: 'rgb(248, 248, 255)',
  crimson: 'rgb(220, 38, 127)',
  smoke: 'rgb(60, 60, 63)',
};

// Helper function to draw rounded rectangle with glow
function drawRoundedRect(ctx, x, y, width, height, radius, fillColor, strokeColor, glowColor) {
  ctx.save();
  
  // Add glow effect
  if (glowColor) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
  
  // Draw rounded rectangle
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  
  // Fill
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  
  // Stroke
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  
  ctx.restore();
}

// Helper function to draw gradient text
function drawGradientText(ctx, text, x, y, size, bold = false) {
  ctx.save();
  ctx.font = `${bold ? 'bold ' : ''}${size}px Arial, sans-serif`;
  
  const gradient = ctx.createLinearGradient(x, y - size, x + ctx.measureText(text).width, y);
  gradient.addColorStop(0, COLORS.neonOrchid);
  gradient.addColorStop(1, COLORS.sunsetGold);
  
  ctx.fillStyle = gradient;
  ctx.fillText(text, x, y);
  
  // Add glow
  ctx.shadowColor = COLORS.neonOrchidRgba;
  ctx.shadowBlur = 15;
  ctx.fillText(text, x, y);
  
  ctx.restore();
}

// Helper function to wrap text
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

export default async function handler(req, res) {
  // CORS headers for n8n
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;
    
    // Validate required fields
    const {
      chatterName,
      chatterProfilePicture,
      chatterMadeTotal,
      paymentAmount,
      currency = 'CZK',
      clientName,
      clientStatus, // 'old' or 'new'
      productDescription, // Co se prodalo
      clientSentTotal,
      clientDay, // 1st day, 2nd session, etc.
      customMessage = ''
    } = data;

    if (!chatterName || !paymentAmount || !clientName) {
      return res.status(400).json({ 
        error: 'Missing required fields: chatterName, paymentAmount, clientName' 
      });
    }

    // Canvas dimensions
    const width = 1200;
    const height = 1400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background with gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, COLORS.obsidian);
    bgGradient.addColorStop(0.5, COLORS.charcoal);
    bgGradient.addColorStop(1, COLORS.obsidian);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle pattern/noise overlay
    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = `rgba(218, 112, 214, ${Math.random() * 0.02})`;
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.fillRect(x, y, 2, 2);
    }

    // Main card container
    const cardPadding = 40;
    const cardX = cardPadding;
    const cardY = cardPadding;
    const cardWidth = width - (cardPadding * 2);
    const cardHeight = height - (cardPadding * 2);

    // Draw main card with frosted glass effect
    drawRoundedRect(
      ctx,
      cardX,
      cardY,
      cardWidth,
      cardHeight,
      24,
      'rgba(30, 30, 32, 0.85)',
      COLORS.neonOrchidRgba,
      COLORS.neonOrchidLight
    );

    // Header section
    let currentY = cardY + 60;

    // Title
    ctx.font = 'bold 56px Arial, sans-serif';
    ctx.fillStyle = COLORS.pearl;
    ctx.textAlign = 'center';
    ctx.fillText('💰 NEW PAYMENT', width / 2, currentY);
    
    currentY += 40;
    
    // Draw decorative line
    ctx.strokeStyle = COLORS.neonOrchidRgba;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cardX + 100, currentY);
    ctx.lineTo(width - cardX - 100, currentY);
    ctx.stroke();

    currentY += 60;

    // Chatter section
    ctx.textAlign = 'left';
    const leftMargin = cardX + 60;
    const contentWidth = cardWidth - 120;

    // Load and draw profile picture if provided
    if (chatterProfilePicture) {
      try {
        const profileImg = await loadImage(chatterProfilePicture);
        const imgSize = 120;
        const imgX = leftMargin;
        const imgY = currentY;
        
        // Draw circular profile with glow
        ctx.save();
        ctx.shadowColor = COLORS.neonOrchidRgba;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(imgX + imgSize/2, imgY + imgSize/2, imgSize/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(profileImg, imgX, imgY, imgSize, imgSize);
        ctx.restore();
        
        // Border around profile
        ctx.strokeStyle = COLORS.neonOrchid;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(imgX + imgSize/2, imgY + imgSize/2, imgSize/2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Chatter info next to profile
        const textX = imgX + imgSize + 40;
        ctx.font = 'bold 42px Arial, sans-serif';
        ctx.fillStyle = COLORS.pearl;
        ctx.fillText(chatterName, textX, imgY + 40);
        
        if (chatterMadeTotal) {
          ctx.font = '32px Arial, sans-serif';
          ctx.fillStyle = COLORS.sunsetGold;
          ctx.fillText(`Total Made: ${chatterMadeTotal} ${currency}`, textX, imgY + 85);
        }
        
        currentY += imgSize + 50;
      } catch (error) {
        console.error('Error loading profile picture:', error);
        // Continue without profile picture
      }
    }
    
    // If no profile picture or failed to load
    if (!chatterProfilePicture || currentY === cardY + 60 + 40 + 60) {
      ctx.font = 'bold 42px Arial, sans-serif';
      ctx.fillStyle = COLORS.pearl;
      ctx.fillText(`👤 ${chatterName}`, leftMargin, currentY);
      
      currentY += 50;
      
      if (chatterMadeTotal) {
        ctx.font = '32px Arial, sans-serif';
        ctx.fillStyle = COLORS.sunsetGold;
        ctx.fillText(`Total Made: ${chatterMadeTotal} ${currency}`, leftMargin, currentY);
      }
      
      currentY += 60;
    }

    // Payment amount section (highlighted)
    const paymentBoxY = currentY;
    const paymentBoxHeight = 140;
    drawRoundedRect(
      ctx,
      leftMargin - 20,
      paymentBoxY,
      contentWidth + 40,
      paymentBoxHeight,
      16,
      'rgba(218, 112, 214, 0.15)',
      COLORS.neonOrchid,
      COLORS.neonOrchidRgba
    );

    ctx.font = 'bold 70px Arial, sans-serif';
    ctx.textAlign = 'center';
    drawGradientText(ctx, `${paymentAmount} ${currency}`, width / 2, paymentBoxY + 90, 70, true);
    
    currentY += paymentBoxHeight + 50;

    // Client information section
    ctx.textAlign = 'left';
    
    // Client name and status
    ctx.font = 'bold 38px Arial, sans-serif';
    ctx.fillStyle = COLORS.pearl;
    const clientStatusEmoji = clientStatus?.toLowerCase() === 'new' ? '🆕' : '🔄';
    const clientStatusText = clientStatus?.toLowerCase() === 'new' ? 'NEW CLIENT' : 'RETURNING CLIENT';
    ctx.fillText(`${clientStatusEmoji} ${clientName}`, leftMargin, currentY);
    
    currentY += 48;
    
    ctx.font = '28px Arial, sans-serif';
    ctx.fillStyle = clientStatus?.toLowerCase() === 'new' ? COLORS.sunsetGold : COLORS.neonOrchid;
    ctx.fillText(clientStatusText, leftMargin, currentY);
    
    currentY += 60;

    // Info grid
    const infoItems = [];
    
    if (clientSentTotal) {
      infoItems.push({ 
        label: '💳 Client Sent Total', 
        value: `${clientSentTotal} ${currency}`, 
        color: COLORS.pearl 
      });
    }
    
    if (clientDay) {
      infoItems.push({ 
        label: '📅 Client Session', 
        value: clientDay, 
        color: COLORS.sunsetGold 
      });
    }
    
    if (productDescription) {
      infoItems.push({ 
        label: '🛍️ Product', 
        value: productDescription, 
        color: COLORS.pearl 
      });
    }

    infoItems.forEach(item => {
      // Draw info box
      drawRoundedRect(
        ctx,
        leftMargin - 15,
        currentY - 40,
        contentWidth + 30,
        80,
        12,
        'rgba(60, 60, 63, 0.4)',
        'rgba(218, 112, 214, 0.2)',
        null
      );

      ctx.font = '26px Arial, sans-serif';
      ctx.fillStyle = COLORS.smoke;
      ctx.fillText(item.label, leftMargin, currentY);
      
      ctx.font = 'bold 30px Arial, sans-serif';
      ctx.fillStyle = item.color;
      ctx.fillText(item.value, leftMargin, currentY + 35);
      
      currentY += 100;
    });

    // Custom message section
    if (customMessage && customMessage.trim()) {
      currentY += 20;
      
      // Message box
      const messageBoxHeight = 150;
      drawRoundedRect(
        ctx,
        leftMargin - 15,
        currentY - 20,
        contentWidth + 30,
        messageBoxHeight,
        12,
        'rgba(255, 215, 0, 0.1)',
        COLORS.sunsetGoldRgba,
        null
      );

      ctx.font = 'italic 24px Arial, sans-serif';
      ctx.fillStyle = COLORS.smoke;
      ctx.fillText('💬 Message', leftMargin, currentY + 15);
      
      ctx.font = '28px Arial, sans-serif';
      ctx.fillStyle = COLORS.pearl;
      
      // Word wrap the message
      const lines = wrapText(ctx, customMessage, contentWidth - 20);
      lines.forEach((line, index) => {
        if (index < 3) { // Limit to 3 lines
          ctx.fillText(line, leftMargin, currentY + 60 + (index * 35));
        }
      });
      
      currentY += messageBoxHeight + 20;
    }

    // Footer
    currentY = cardY + cardHeight - 80;
    ctx.font = '24px Arial, sans-serif';
    ctx.fillStyle = COLORS.smoke;
    ctx.textAlign = 'center';
    const timestamp = new Date().toLocaleString('cs-CZ', { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    });
    ctx.fillText(`Generated: ${timestamp}`, width / 2, currentY);

    // Add decorative corner accents
    const accentSize = 40;
    ctx.strokeStyle = COLORS.sunsetGold;
    ctx.lineWidth = 4;
    
    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(cardX + 20, cardY + accentSize + 20);
    ctx.lineTo(cardX + 20, cardY + 20);
    ctx.lineTo(cardX + accentSize + 20, cardY + 20);
    ctx.stroke();
    
    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(cardX + cardWidth - 20, cardY + accentSize + 20);
    ctx.lineTo(cardX + cardWidth - 20, cardY + 20);
    ctx.lineTo(cardX + cardWidth - accentSize - 20, cardY + 20);
    ctx.stroke();
    
    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(cardX + 20, cardY + cardHeight - accentSize - 20);
    ctx.lineTo(cardX + 20, cardY + cardHeight - 20);
    ctx.lineTo(cardX + accentSize + 20, cardY + cardHeight - 20);
    ctx.stroke();
    
    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(cardX + cardWidth - 20, cardY + cardHeight - accentSize - 20);
    ctx.lineTo(cardX + cardWidth - 20, cardY + cardHeight - 20);
    ctx.lineTo(cardX + cardWidth - accentSize - 20, cardY + cardHeight - 20);
    ctx.stroke();

    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');

    // Return the image
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).send(buffer);

  } catch (error) {
    console.error('Error generating payment image:', error);
    res.status(500).json({ error: error.message });
  }
}

