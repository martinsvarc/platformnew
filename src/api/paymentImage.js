/**
 * Generate a beautiful payment image for Telegram sharing
 * Returns HTML that can be rendered and screenshot
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
 * @returns {Promise<string>} - HTML string that can be rendered
 */
export async function generatePaymentImage(paymentData) {
  try {
    const response = await fetch('/api/generate-payment-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      // Try to get error message from response
      const text = await response.text();
      let errorMessage = 'Failed to generate payment image';
      try {
        const error = text ? JSON.parse(text) : {};
        errorMessage = error.error || errorMessage;
      } catch (e) {
        // Response wasn't JSON, use text or default message
        errorMessage = text || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // Get the HTML
    const html = await response.text();
    return html;
  } catch (error) {
    console.error('Error generating payment image:', error);
    throw error;
  }
}

/**
 * Open payment image in new window for screenshot
 * 
 * @param {Object} paymentData - Payment information (see generatePaymentImage for structure)
 */
export async function downloadPaymentImage(paymentData, filename) {
  try {
    const html = await generatePaymentImage(paymentData);
    
    // Open in new window
    const newWindow = window.open('', '_blank', 'width=1200,height=1400');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
      
      // Add instructions
      setTimeout(() => {
        alert('To save the payment image:\n\n1. Right-click on the image\n2. Select "Save as..." or take a screenshot\n3. Or use Cmd+Shift+4 (Mac) / Windows+Shift+S (Windows) to screenshot');
      }, 500);
    }
    
    return true;
  } catch (error) {
    console.error('Error downloading payment image:', error);
    throw error;
  }
}

/**
 * Generate payment image HTML (for preview in iframe)
 * 
 * @param {Object} paymentData - Payment information (see generatePaymentImage for structure)
 * @returns {Promise<string>} - HTML string
 */
export async function getPaymentImageDataURL(paymentData) {
  try {
    const html = await generatePaymentImage(paymentData);
    // Return as data URL for iframe src
    return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  } catch (error) {
    console.error('Error getting payment image data URL:', error);
    throw error;
  }
}

/**
 * Example usage:
 * 
 * const paymentData = {
 *   chatterName: "Anna K.",
 *   chatterProfilePicture: "https://example.com/profile.jpg",
 *   chatterMadeTotal: 125000,
 *   paymentAmount: 5000,
 *   currency: "CZK",
 *   clientName: "Client#12345",
 *   clientStatus: "new",
 *   productDescription: "Premium content package",
 *   clientSentTotal: 5000,
 *   clientDay: "1st day",
 *   customMessage: "Great first session! Looking forward to more 🎉"
 * };
 * 
 * // Generate and download
 * await downloadPaymentImage(paymentData);
 * 
 * // Or get as blob for Telegram API
 * const imageBlob = await generatePaymentImage(paymentData);
 * // Send imageBlob to Telegram...
 */

