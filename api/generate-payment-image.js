// Payment Image Generator - Returns PNG
// Uses satori + resvg to generate images server-side

import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

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
      chatterTodayAmount = 0,  // NEW FIELD
      teamTodayAmount = 0,      // NEW FIELD
      paymentAmount,
      currency = 'CZK',
      clientName,
      clientStatus,
      productDescription,
      clientSentTotal,
      clientDay,
      customMessage = '',
      sendToWebhook = false,    // Whether to auto-send to n8n
    } = data

    if (!chatterName || !paymentAmount || !clientName) {
      return res.status(400).json({ 
        error: 'Missing required fields: chatterName, paymentAmount, clientName' 
      })
    }

    const statusEmoji = clientStatus?.toLowerCase() === 'new' ? '🆕' : '🔄'
    const statusText = clientStatus?.toLowerCase() === 'new' ? 'NEW CLIENT' : 'RETURNING CLIENT'

    // Create SVG using Satori
    const svg = await satori(
      {
        type: 'div',
        props: {
          style: {
            width: '1200px',
            height: '1400px',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
            padding: '40px',
            position: 'relative',
          },
          children: [
            // Main Card
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'linear-gradient(135deg, rgba(30, 30, 32, 0.95) 0%, rgba(20, 20, 22, 0.95) 100%)',
                  borderRadius: '32px',
                  border: '2px solid #DA70D6',
                  padding: '60px',
                  flex: 1,
                },
                children: [
                  // Header
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '40px',
                      },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: {
                              fontSize: '72px',
                              fontWeight: 900,
                              background: 'linear-gradient(135deg, #DA70D6 0%, #FFD700 50%, #DC143C 100%)',
                              backgroundClip: 'text',
                              color: 'transparent',
                            },
                            children: '💰 PAYMENT',
                          },
                        },
                      ],
                    },
                  },

                  // Chatter Name
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '48px',
                        fontWeight: 'bold',
                        color: '#F8F8FF',
                        textAlign: 'center',
                        marginBottom: '20px',
                      },
                      children: chatterProfilePicture ? chatterName : `👤 ${chatterName}`,
                    },
                  },

                  // Chatter Stats
                  chatterMadeTotal ? {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '28px',
                        color: '#FFD700',
                        textAlign: 'center',
                        marginBottom: '10px',
                      },
                      children: `🏆 Total Made: ${Number(chatterMadeTotal).toLocaleString()} ${currency}`,
                    },
                  } : null,

                  // NEW: Chatter Today
                  chatterTodayAmount ? {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '24px',
                        color: '#DA70D6',
                        textAlign: 'center',
                        marginBottom: '40px',
                      },
                      children: `📊 Today: ${Number(chatterTodayAmount).toLocaleString()} ${currency}`,
                    },
                  } : null,

                  // Payment Amount - EPIC
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '60px',
                        margin: '0 0 40px 0',
                        background: 'linear-gradient(135deg, rgba(218, 112, 214, 0.15) 0%, rgba(220, 20, 60, 0.15) 100%)',
                        borderTop: '3px solid #DA70D6',
                        borderBottom: '3px solid #DC143C',
                      },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: {
                              fontSize: '120px',
                              fontWeight: 900,
                              background: 'linear-gradient(135deg, #DA70D6 0%, #FFD700 50%, #DC143C 100%)',
                              backgroundClip: 'text',
                              color: 'transparent',
                            },
                            children: Number(paymentAmount).toLocaleString(),
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: {
                              fontSize: '56px',
                              fontWeight: 'bold',
                              color: '#FFD700',
                              marginTop: '10px',
                            },
                            children: currency,
                          },
                        },
                      ],
                    },
                  },

                  // Client Badge
                  {
                    type: 'div',
                    props: {
                      style: {
                        padding: '30px 40px',
                        background: clientStatus?.toLowerCase() === 'new' 
                          ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                          : 'linear-gradient(135deg, #DA70D6 0%, #BA55D3 100%)',
                        borderRadius: '20px',
                        marginBottom: '30px',
                      },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: {
                              fontSize: '48px',
                              fontWeight: 900,
                              color: '#FFFFFF',
                              textAlign: 'center',
                              marginBottom: '15px',
                            },
                            children: `${statusEmoji} ${clientName}`,
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: {
                              fontSize: '28px',
                              fontWeight: 'bold',
                              color: 'rgba(255, 255, 255, 0.9)',
                              textAlign: 'center',
                            },
                            children: statusText,
                          },
                        },
                      ],
                    },
                  },

                  // Info Grid
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        gap: '20px',
                        marginBottom: '30px',
                      },
                      children: [
                        clientSentTotal ? {
                          type: 'div',
                          props: {
                            style: {
                              flex: 1,
                              padding: '25px 30px',
                              background: 'rgba(60, 60, 63, 0.6)',
                              border: '2px solid rgba(218, 112, 214, 0.3)',
                              borderRadius: '16px',
                            },
                            children: [
                              {
                                type: 'div',
                                props: {
                                  style: { fontSize: '24px', color: '#DA70D6', marginBottom: '12px' },
                                  children: '💳 CLIENT SENT',
                                },
                              },
                              {
                                type: 'div',
                                props: {
                                  style: { fontSize: '36px', fontWeight: 900, color: '#F8F8FF' },
                                  children: `${Number(clientSentTotal).toLocaleString()} ${currency}`,
                                },
                              },
                            ],
                          },
                        } : null,
                        clientDay ? {
                          type: 'div',
                          props: {
                            style: {
                              flex: 1,
                              padding: '25px 30px',
                              background: 'rgba(60, 60, 63, 0.6)',
                              border: '2px solid rgba(255, 215, 0, 0.3)',
                              borderRadius: '16px',
                            },
                            children: [
                              {
                                type: 'div',
                                props: {
                                  style: { fontSize: '24px', color: '#FFD700', marginBottom: '12px' },
                                  children: '📅 SESSION',
                                },
                              },
                              {
                                type: 'div',
                                props: {
                                  style: { fontSize: '36px', fontWeight: 900, color: '#FFD700' },
                                  children: clientDay,
                                },
                              },
                            ],
                          },
                        } : null,
                      ].filter(Boolean),
                    },
                  },

                  // NEW: Team Today Amount
                  teamTodayAmount ? {
                    type: 'div',
                    props: {
                      style: {
                        padding: '30px',
                        background: 'linear-gradient(135deg, rgba(220, 20, 60, 0.2) 0%, rgba(218, 112, 214, 0.2) 100%)',
                        border: '3px solid rgba(220, 20, 60, 0.5)',
                        borderRadius: '20px',
                        marginBottom: '30px',
                      },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: { fontSize: '28px', color: '#DC143C', marginBottom: '12px', textAlign: 'center' },
                            children: '👥 TEAM TODAY',
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: { fontSize: '48px', fontWeight: 900, color: '#F8F8FF', textAlign: 'center' },
                            children: `${Number(teamTodayAmount).toLocaleString()} ${currency}`,
                          },
                        },
                      ],
                    },
                  } : null,

                  // Product
                  productDescription ? {
                    type: 'div',
                    props: {
                      style: {
                        padding: '25px 30px',
                        background: 'rgba(60, 60, 63, 0.6)',
                        border: '2px solid rgba(220, 20, 60, 0.3)',
                        borderRadius: '16px',
                        marginBottom: '30px',
                      },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: { fontSize: '24px', color: '#DC143C', marginBottom: '12px' },
                            children: '🛍️ PRODUCT',
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: { fontSize: '32px', fontWeight: 'bold', color: '#F8F8FF' },
                            children: productDescription,
                          },
                        },
                      ],
                    },
                  } : null,

                  // Custom Message
                  customMessage && customMessage.trim() ? {
                    type: 'div',
                    props: {
                      style: {
                        padding: '25px 30px',
                        background: 'rgba(255, 215, 0, 0.1)',
                        border: '3px solid rgba(255, 215, 0, 0.4)',
                        borderRadius: '16px',
                      },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: { fontSize: '24px', color: '#FFD700', marginBottom: '12px' },
                            children: '💬 MESSAGE',
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: { fontSize: '28px', color: '#F8F8FF' },
                            children: customMessage.slice(0, 150),
                          },
                        },
                      ],
                    },
                  } : null,
                ].filter(Boolean),
              },
            },
          ],
        },
      },
      {
        width: 1200,
        height: 1400,
        fonts: [],
      }
    )

    // Convert SVG to PNG using resvg
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: 1200,
      },
    })

    const pngData = resvg.render()
    const pngBuffer = pngData.asPng()

    // If sendToWebhook is true, send to n8n
    if (sendToWebhook) {
      try {
        await fetch('https://n8n.automatedsolarbiz.com/webhook/ef05d1f1-3fe3-4828-aacd-5cebaf54827c', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            imageBase64: pngBuffer.toString('base64'),
            timestamp: new Date().toISOString(),
          }),
        })
      } catch (webhookError) {
        console.error('Failed to send to webhook:', webhookError)
        // Continue anyway and return the image
      }
    }

    // Return PNG image
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Content-Length', pngBuffer.length)
    return res.status(200).send(pngBuffer)
  } catch (error) {
    console.error('Error generating payment image:', error)
    return res.status(500).json({ error: error.message })
  }
}
