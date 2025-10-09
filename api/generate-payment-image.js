// Payment Image Generator - Returns PNG
// Uses @vercel/og for Vercel deployment compatibility

import { ImageResponse } from '@vercel/og'

export const config = {
  runtime: 'edge',
}

export default async function handler(req) {
  try {
    const data = await req.json()
    
    // Validate required fields
    const {
      chatterName,
      chatterProfilePicture,
      chatterMadeTotal,
      chatterTodayAmount = 0,
      teamTodayAmount = 0,
      paymentAmount,
      currency = 'CZK',
      clientName,
      clientStatus,
      productDescription,
      clientSentTotal,
      clientDay,
      customMessage = '',
    } = data

    if (!chatterName || !paymentAmount || !clientName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: chatterName, paymentAmount, clientName' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const statusEmoji = clientStatus?.toLowerCase() === 'new' ? '🆕' : '🔄'
    const statusText = clientStatus?.toLowerCase() === 'new' ? 'NEW CLIENT' : 'RETURNING CLIENT'

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
            padding: '40px',
          }}
        >
          {/* Main Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(135deg, rgba(30, 30, 32, 0.95) 0%, rgba(20, 20, 22, 0.95) 100%)',
              borderRadius: '32px',
              border: '2px solid #DA70D6',
              padding: '60px',
              flex: 1,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
              <div
                style={{
                  fontSize: '72px',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #DA70D6 0%, #FFD700 50%, #DC143C 100%)',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                💰 PAYMENT
              </div>
            </div>

            {/* Chatter Name */}
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#F8F8FF',
                textAlign: 'center',
                marginBottom: '20px',
              }}
            >
              {chatterProfilePicture ? chatterName : `👤 ${chatterName}`}
            </div>

            {/* Chatter Stats */}
            {chatterMadeTotal && (
              <div
                style={{
                  fontSize: '28px',
                  color: '#FFD700',
                  textAlign: 'center',
                  marginBottom: '10px',
                }}
              >
                🏆 Total Made: {Number(chatterMadeTotal).toLocaleString()} {currency}
              </div>
            )}

            {/* Chatter Today */}
            {chatterTodayAmount > 0 && (
              <div
                style={{
                  fontSize: '24px',
                  color: '#DA70D6',
                  textAlign: 'center',
                  marginBottom: '40px',
                }}
              >
                📊 Today: {Number(chatterTodayAmount).toLocaleString()} {currency}
              </div>
            )}

            {/* Payment Amount - EPIC */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px',
                margin: '0 0 40px 0',
                background: 'linear-gradient(135deg, rgba(218, 112, 214, 0.15) 0%, rgba(220, 20, 60, 0.15) 100%)',
                borderTop: '3px solid #DA70D6',
                borderBottom: '3px solid #DC143C',
              }}
            >
              <div
                style={{
                  fontSize: '120px',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #DA70D6 0%, #FFD700 50%, #DC143C 100%)',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                {Number(paymentAmount).toLocaleString()}
              </div>
              <div
                style={{
                  fontSize: '56px',
                  fontWeight: 'bold',
                  color: '#FFD700',
                  marginTop: '10px',
                }}
              >
                {currency}
              </div>
            </div>

            {/* Client Badge */}
            <div
              style={{
                padding: '30px 40px',
                background:
                  clientStatus?.toLowerCase() === 'new'
                    ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                    : 'linear-gradient(135deg, #DA70D6 0%, #BA55D3 100%)',
                borderRadius: '20px',
                marginBottom: '30px',
              }}
            >
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  textAlign: 'center',
                  marginBottom: '15px',
                }}
              >
                {statusEmoji} {clientName}
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: 'rgba(255, 255, 255, 0.9)',
                  textAlign: 'center',
                }}
              >
                {statusText}
              </div>
            </div>

            {/* Info Grid */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
              {clientSentTotal && (
                <div
                  style={{
                    flex: 1,
                    padding: '25px 30px',
                    background: 'rgba(60, 60, 63, 0.6)',
                    border: '2px solid rgba(218, 112, 214, 0.3)',
                    borderRadius: '16px',
                  }}
                >
                  <div style={{ fontSize: '24px', color: '#DA70D6', marginBottom: '12px' }}>
                    💳 CLIENT SENT
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: 900, color: '#F8F8FF' }}>
                    {Number(clientSentTotal).toLocaleString()} {currency}
                  </div>
                </div>
              )}
              {clientDay && (
                <div
                  style={{
                    flex: 1,
                    padding: '25px 30px',
                    background: 'rgba(60, 60, 63, 0.6)',
                    border: '2px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '16px',
                  }}
                >
                  <div style={{ fontSize: '24px', color: '#FFD700', marginBottom: '12px' }}>
                    📅 SESSION
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: 900, color: '#FFD700' }}>
                    {clientDay}
                  </div>
                </div>
              )}
            </div>

            {/* Team Today Amount */}
            {teamTodayAmount > 0 && (
              <div
                style={{
                  padding: '30px',
                  background:
                    'linear-gradient(135deg, rgba(220, 20, 60, 0.2) 0%, rgba(218, 112, 214, 0.2) 100%)',
                  border: '3px solid rgba(220, 20, 60, 0.5)',
                  borderRadius: '20px',
                  marginBottom: '30px',
                }}
              >
                <div
                  style={{
                    fontSize: '28px',
                    color: '#DC143C',
                    marginBottom: '12px',
                    textAlign: 'center',
                  }}
                >
                  👥 TEAM TODAY
                </div>
                <div
                  style={{
                    fontSize: '48px',
                    fontWeight: 900,
                    color: '#F8F8FF',
                    textAlign: 'center',
                  }}
                >
                  {Number(teamTodayAmount).toLocaleString()} {currency}
                </div>
              </div>
            )}

            {/* Product */}
            {productDescription && (
              <div
                style={{
                  padding: '25px 30px',
                  background: 'rgba(60, 60, 63, 0.6)',
                  border: '2px solid rgba(220, 20, 60, 0.3)',
                  borderRadius: '16px',
                  marginBottom: '30px',
                }}
              >
                <div style={{ fontSize: '24px', color: '#DC143C', marginBottom: '12px' }}>
                  🛍️ PRODUCT
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#F8F8FF' }}>
                  {productDescription}
                </div>
              </div>
            )}

            {/* Custom Message */}
            {customMessage && customMessage.trim() && (
              <div
                style={{
                  padding: '25px 30px',
                  background: 'rgba(255, 215, 0, 0.1)',
                  border: '3px solid rgba(255, 215, 0, 0.4)',
                  borderRadius: '16px',
                }}
              >
                <div style={{ fontSize: '24px', color: '#FFD700', marginBottom: '12px' }}>
                  💬 MESSAGE
                </div>
                <div style={{ fontSize: '28px', color: '#F8F8FF' }}>
                  {customMessage.slice(0, 150)}
                </div>
              </div>
            )}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 1400,
      }
    )
  } catch (error) {
    console.error('Error generating payment image:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
