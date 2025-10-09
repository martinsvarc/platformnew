/**
 * Generate a beautiful payment image for Telegram sharing
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

    // Get the image blob
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Error generating payment image:', error);
    throw error;
  }
}

/**
 * Generate and download a payment image
 * 
 * @param {Object} paymentData - Payment information (see generatePaymentImage for structure)
 * @param {string} [filename] - Optional custom filename
 */
export async function downloadPaymentImage(paymentData, filename) {
  try {
    const blob = await generatePaymentImage(paymentData);
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `payment-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error downloading payment image:', error);
    throw error;
  }
}

/**
 * Generate payment image and get as data URL (for preview)
 * 
 * @param {Object} paymentData - Payment information (see generatePaymentImage for structure)
 * @returns {Promise<string>} - Data URL of the image
 */
export async function getPaymentImageDataURL(paymentData) {
  try {
    const blob = await generatePaymentImage(paymentData);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
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

