import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const data = await req.json();
    
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
    } = data;

    if (!chatterName || !paymentAmount || !clientName) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: chatterName, paymentAmount, clientName' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const statusEmoji = clientStatus?.toLowerCase() === 'new' ? '🆕' : '🔄';
    const statusText = clientStatus?.toLowerCase() === 'new' ? 'NEW CLIENT' : 'RETURNING CLIENT';
    const statusColor = clientStatus?.toLowerCase() === 'new' ? '#FFD700' : '#DA70D6';

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '1400px',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #121212 0%, #1e1e20 50%, #121212 100%)',
            position: 'relative',
          }}
        >
          {/* Main Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              margin: '40px',
              padding: '60px',
              background: 'rgba(30, 30, 32, 0.85)',
              borderRadius: '24px',
              border: '3px solid rgba(218, 112, 214, 0.5)',
              boxShadow: '0 20px 60px rgba(218, 112, 214, 0.3)',
              flex: 1,
            }}
          >
            {/* Title */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: '40px',
              }}
            >
              <h1
                style={{
                  fontSize: '56px',
                  fontWeight: 'bold',
                  color: '#F8F8FF',
                  margin: 0,
                  marginBottom: '20px',
                }}
              >
                💰 NEW PAYMENT
              </h1>
              <div
                style={{
                  width: '800px',
                  height: '2px',
                  background: 'rgba(218, 112, 214, 0.5)',
                }}
              />
            </div>

            {/* Chatter Info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '40px',
              }}
            >
              {chatterProfilePicture && (
                <img
                  src={chatterProfilePicture}
                  width={120}
                  height={120}
                  style={{
                    borderRadius: '50%',
                    border: '4px solid #DA70D6',
                    marginRight: '40px',
                  }}
                />
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    fontSize: '42px',
                    fontWeight: 'bold',
                    color: '#F8F8FF',
                    marginBottom: '10px',
                  }}
                >
                  {chatterProfilePicture ? chatterName : `👤 ${chatterName}`}
                </div>
                {chatterMadeTotal && (
                  <div
                    style={{
                      fontSize: '32px',
                      color: '#FFD700',
                    }}
                  >
                    Total Made: {chatterMadeTotal} {currency}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Amount Box */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px',
                marginBottom: '40px',
                background: 'rgba(218, 112, 214, 0.15)',
                border: '3px solid #DA70D6',
                borderRadius: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '70px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #DA70D6 0%, #FFD700 100%)',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                {paymentAmount} {currency}
              </div>
            </div>

            {/* Client Info */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginBottom: '30px',
              }}
            >
              <div
                style={{
                  fontSize: '38px',
                  fontWeight: 'bold',
                  color: '#F8F8FF',
                  marginBottom: '15px',
                }}
              >
                {statusEmoji} {clientName}
              </div>
              <div
                style={{
                  fontSize: '28px',
                  color: statusColor,
                }}
              >
                {statusText}
              </div>
            </div>

            {/* Info Boxes */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              {clientSentTotal && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '20px 30px',
                    background: 'rgba(60, 60, 63, 0.4)',
                    border: '1px solid rgba(218, 112, 214, 0.2)',
                    borderRadius: '12px',
                  }}
                >
                  <div style={{ fontSize: '26px', color: '#3C3C3F', marginBottom: '8px' }}>
                    💳 Client Sent Total
                  </div>
                  <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#F8F8FF' }}>
                    {clientSentTotal} {currency}
                  </div>
                </div>
              )}

              {clientDay && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '20px 30px',
                    background: 'rgba(60, 60, 63, 0.4)',
                    border: '1px solid rgba(218, 112, 214, 0.2)',
                    borderRadius: '12px',
                  }}
                >
                  <div style={{ fontSize: '26px', color: '#3C3C3F', marginBottom: '8px' }}>
                    📅 Client Session
                  </div>
                  <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#FFD700' }}>
                    {clientDay}
                  </div>
                </div>
              )}

              {productDescription && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '20px 30px',
                    background: 'rgba(60, 60, 63, 0.4)',
                    border: '1px solid rgba(218, 112, 214, 0.2)',
                    borderRadius: '12px',
                  }}
                >
                  <div style={{ fontSize: '26px', color: '#3C3C3F', marginBottom: '8px' }}>
                    🛍️ Product
                  </div>
                  <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#F8F8FF' }}>
                    {productDescription}
                  </div>
                </div>
              )}
            </div>

            {/* Custom Message */}
            {customMessage && customMessage.trim() && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '20px 30px',
                  marginTop: '30px',
                  background: 'rgba(255, 215, 0, 0.1)',
                  border: '2px solid rgba(255, 215, 0, 0.6)',
                  borderRadius: '12px',
                }}
              >
                <div style={{ fontSize: '24px', fontStyle: 'italic', color: '#3C3C3F', marginBottom: '10px' }}>
                  💬 Message
                </div>
                <div style={{ fontSize: '28px', color: '#F8F8FF', lineHeight: 1.4 }}>
                  {customMessage.slice(0, 150)}
                </div>
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: 'auto',
                paddingTop: '40px',
              }}
            >
              <div style={{ fontSize: '24px', color: '#3C3C3F' }}>
                Generated: {new Date().toLocaleString('cs-CZ', { 
                  dateStyle: 'medium', 
                  timeStyle: 'short' 
                })}
              </div>
            </div>
          </div>

          {/* Corner Accents */}
          <div style={{ position: 'absolute', top: '60px', left: '60px', display: 'flex' }}>
            <div style={{ width: '40px', height: '4px', background: '#FFD700' }} />
            <div style={{ position: 'absolute', width: '4px', height: '40px', background: '#FFD700' }} />
          </div>
          <div style={{ position: 'absolute', top: '60px', right: '60px', display: 'flex' }}>
            <div style={{ position: 'absolute', right: 0, width: '40px', height: '4px', background: '#FFD700' }} />
            <div style={{ position: 'absolute', right: 0, width: '4px', height: '40px', background: '#FFD700' }} />
          </div>
          <div style={{ position: 'absolute', bottom: '60px', left: '60px', display: 'flex' }}>
            <div style={{ position: 'absolute', bottom: 0, width: '40px', height: '4px', background: '#FFD700' }} />
            <div style={{ position: 'absolute', bottom: 0, width: '4px', height: '40px', background: '#FFD700' }} />
          </div>
          <div style={{ position: 'absolute', bottom: '60px', right: '60px', display: 'flex' }}>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '40px', height: '4px', background: '#FFD700' }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '4px', height: '40px', background: '#FFD700' }} />
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 1400,
      }
    );
  } catch (error) {
    console.error('Error generating payment image:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

