# 📸 Payment Image Generator for Telegram

A beautiful image generation system that creates styled payment announcements for your Telegram group. The images use your platform's signature colors (Neon Orchid purple, Sunset Gold, and dark elegant backgrounds) to create professional-looking payment announcements.

## 🎨 Features

- **Beautiful Design**: Uses your platform's color scheme (Neon Orchid, Sunset Gold, Pearl white on dark backgrounds)
- **Frosted Glass Effects**: Modern UI with glowing borders and gradient text
- **Profile Pictures**: Displays chatter profile pictures with glowing circular borders
- **Comprehensive Info**: Shows all payment details in an organized, visually appealing layout
- **Custom Messages**: Supports custom messages from chatters
- **Easy Sharing**: One-click copy to clipboard for Telegram
- **Download Option**: Can download images for manual sharing

## 🚀 Installation

The required package has been added to `package.json`. Install it with:

```bash
npm install
```

This will install the `canvas` package needed for server-side image generation.

## 📡 API Endpoint

### Endpoint URL
```
POST /.netlify/functions/generate-payment-image
```

### Request Body

```json
{
  "chatterName": "Anna K.",
  "chatterProfilePicture": "https://example.com/profile.jpg",
  "chatterMadeTotal": 125000,
  "paymentAmount": 5000,
  "currency": "CZK",
  "clientName": "Client#12345",
  "clientStatus": "new",
  "productDescription": "Premium content package",
  "clientSentTotal": 5000,
  "clientDay": "1st day",
  "customMessage": "Great first session! Looking forward to more 🎉"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `chatterName` | string | ✅ Yes | Name of the chatter |
| `chatterProfilePicture` | string | ❌ No | URL to chatter's profile picture |
| `chatterMadeTotal` | number | ❌ No | Total amount chatter has made |
| `paymentAmount` | number | ✅ Yes | Amount of this payment |
| `currency` | string | ❌ No | Currency code (default: "CZK") |
| `clientName` | string | ✅ Yes | Name/ID of the client |
| `clientStatus` | string | ❌ No | "new" or "old" (returning) |
| `productDescription` | string | ❌ No | What was sold (Co se prodalo) |
| `clientSentTotal` | number | ❌ No | Total amount client has sent |
| `clientDay` | string | ❌ No | Client's session info (e.g., "1st day", "2nd session") |
| `customMessage` | string | ❌ No | Custom message from the chatter |

### Response

Returns a PNG image with `Content-Type: image/png`

## 💻 Usage Examples

### 1. Using the Helper API Functions

```javascript
import { 
  generatePaymentImage, 
  downloadPaymentImage, 
  getPaymentImageDataURL 
} from './api/paymentImage';

// Example payment data
const paymentData = {
  chatterName: "Anna K.",
  chatterProfilePicture: "https://example.com/profile.jpg",
  chatterMadeTotal: 125000,
  paymentAmount: 5000,
  currency: "CZK",
  clientName: "Client#12345",
  clientStatus: "new",
  productDescription: "Premium content package",
  clientSentTotal: 5000,
  clientDay: "1st day",
  customMessage: "Great first session! Looking forward to more 🎉"
};

// Option 1: Generate and download
await downloadPaymentImage(paymentData);

// Option 2: Get as blob for Telegram API
const imageBlob = await generatePaymentImage(paymentData);
// Send imageBlob to Telegram...

// Option 3: Get as data URL for preview
const dataUrl = await getPaymentImageDataURL(paymentData);
```

### 2. Using the React Component

```javascript
import { useState } from 'react';
import PaymentImageGenerator from './components/PaymentImageGenerator';

function YourPaymentComponent() {
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  const handlePaymentSuccess = (payment) => {
    // Map your payment data to the required format
    setPaymentData({
      chatterName: payment.chatterName,
      chatterProfilePicture: payment.chatterProfileUrl,
      chatterMadeTotal: payment.chatterTotal,
      paymentAmount: payment.amount,
      currency: payment.currency || 'CZK',
      clientName: payment.clientName,
      clientStatus: payment.isNewClient ? 'new' : 'old',
      productDescription: payment.notes,
      clientSentTotal: payment.clientTotal,
      clientDay: payment.clientSession,
      customMessage: payment.message
    });
    setShowImageGenerator(true);
  };

  return (
    <>
      {/* Your payment form/list here */}
      <button onClick={handlePaymentSuccess}>
        Generate Telegram Image
      </button>

      <PaymentImageGenerator
        paymentData={paymentData}
        isOpen={showImageGenerator}
        onClose={() => setShowImageGenerator(false)}
      />
    </>
  );
}
```

### 3. Direct API Call (Fetch)

```javascript
async function generateImage(paymentData) {
  const response = await fetch('/.netlify/functions/generate-payment-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(paymentData)
  });

  if (!response.ok) {
    throw new Error('Failed to generate image');
  }

  const blob = await response.blob();
  
  // Download the image
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `payment-${Date.now()}.png`;
  a.click();
  window.URL.revokeObjectURL(url);
}
```

### 4. cURL Example (for testing)

```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/generate-payment-image \
  -H "Content-Type: application/json" \
  -d '{
    "chatterName": "Anna K.",
    "chatterProfilePicture": "https://example.com/profile.jpg",
    "chatterMadeTotal": 125000,
    "paymentAmount": 5000,
    "currency": "CZK",
    "clientName": "Client#12345",
    "clientStatus": "new",
    "productDescription": "Premium content package",
    "clientSentTotal": 5000,
    "clientDay": "1st day",
    "customMessage": "Great first session!"
  }' \
  --output payment.png
```

## 🎨 Design Details

The generated image features:

- **Dimensions**: 1200x1400 pixels (perfect for Telegram)
- **Background**: Dark gradient (Obsidian to Charcoal) with subtle purple noise
- **Main Card**: Frosted glass effect with glowing purple border
- **Profile Picture**: Circular with neon orchid glow (120x120px)
- **Payment Amount**: Large, bold gradient text (purple to gold)
- **Info Sections**: Organized boxes with labels and values
- **Custom Message**: Dedicated section with word wrapping
- **Decorative Elements**: Gold corner accents and divider lines
- **Footer**: Timestamp of generation

## 🔧 Integration Points

### 1. After Payment Submission
Show the image generator modal after a payment is successfully created:

```javascript
// In your payment form submission handler
const handleSubmit = async (paymentData) => {
  // ... save payment to database
  
  // Show image generator
  setShowImageGenerator(true);
};
```

### 2. Payment List Actions
Add a "Share to Telegram" button in your payment list:

```javascript
<button 
  onClick={() => openImageGenerator(payment)}
  className="btn-primary"
>
  📸 Generate Telegram Image
</button>
```

### 3. Admin Dashboard
Create a bulk action to generate images for multiple payments:

```javascript
const generateBulkImages = async (selectedPayments) => {
  for (const payment of selectedPayments) {
    const imageBlob = await generatePaymentImage(payment);
    // Download or process each image
  }
};
```

## 📱 Telegram Integration

### Manual Sharing
1. Click "Copy" button in the modal
2. Open Telegram
3. Paste (Ctrl+V / Cmd+V) in your group chat
4. Send!

### Automated Telegram Bot (Optional Future Enhancement)

If you want to automate posting to Telegram, you can use the Telegram Bot API:

```javascript
async function sendToTelegram(imageBlob, chatId, botToken) {
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('photo', imageBlob, 'payment.png');
  
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendPhoto`,
    {
      method: 'POST',
      body: formData
    }
  );
  
  return response.json();
}
```

## 🐛 Troubleshooting

### Issue: Canvas package not installing
**Solution**: Make sure you have build tools installed:
- **Mac**: `xcode-select --install`
- **Linux**: `sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`
- **Windows**: Install windows-build-tools

### Issue: Profile picture not loading
**Solution**: 
- Ensure the profile picture URL is publicly accessible
- Check CORS settings if images are from external domains
- The function will gracefully handle missing images and continue without them

### Issue: Text overlapping or cut off
**Solution**: The function automatically wraps text, but very long text might need adjustment. Consider truncating extremely long messages before passing to the API.

## 🎯 Best Practices

1. **Profile Pictures**: Use square images (recommended 300x300px or larger) for best results
2. **Custom Messages**: Keep messages under 150 characters for optimal display
3. **Client Names**: Use anonymous identifiers (e.g., "Client#12345") for privacy
4. **Caching**: Consider caching generated images if you need to regenerate the same payment image multiple times
5. **Error Handling**: Always wrap API calls in try-catch blocks

## 📊 Performance

- Image generation time: ~500-1000ms (depending on server load)
- Image size: Approximately 200-400KB
- Recommended use: On-demand generation (not bulk pre-generation)

## 🔐 Security Considerations

- The endpoint is public but doesn't store any data
- Consider adding authentication if needed
- Client information should be anonymized before generating images
- Profile picture URLs should be from trusted sources

## 🚀 Future Enhancements

Potential improvements you could add:

1. **Multiple Templates**: Different designs for different payment types
2. **Animated GIFs**: Celebration animations for big payments
3. **Watermarks**: Add your agency logo
4. **Stats Summary**: Weekly/monthly payment summary images
5. **Leaderboard Images**: Team performance visualizations
6. **Direct Telegram Bot Integration**: Automatic posting to Telegram groups

## 📝 File Structure

```
platformnew/
├── netlify/
│   └── functions/
│       └── generate-payment-image.js    # API endpoint
├── src/
│   ├── api/
│   │   └── paymentImage.js              # Helper functions
│   └── components/
│       └── PaymentImageGenerator.jsx    # React component
└── PAYMENT_IMAGE_GENERATOR.md          # This file
```

## 🤝 Support

If you encounter any issues or have questions:
1. Check the browser console for error messages
2. Verify all required fields are provided
3. Test with the example data provided above
4. Check Netlify function logs for server-side errors

---

**Enjoy creating beautiful payment announcements! 🎉**

