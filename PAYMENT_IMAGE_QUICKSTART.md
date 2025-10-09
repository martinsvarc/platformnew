# 📸 Payment Image Generator - Quick Reference

## 🚀 Quick Start (3 Steps)

### 1. Install
```bash
npm install
```

### 2. Test
```bash
netlify dev
# Visit: http://localhost:8888/payment-image-test
```

### 3. Use
```javascript
import PaymentImageGenerator from './components/PaymentImageGenerator';

// Show after payment
setShowImageGen(true);

<PaymentImageGenerator
  paymentData={{
    chatterName: "Anna K.",
    paymentAmount: 5000,
    clientName: "Client#123"
  }}
  isOpen={showImageGen}
  onClose={() => setShowImageGen(false)}
/>
```

---

## 📝 Required Data Format

```javascript
{
  // Required
  chatterName: "string",
  paymentAmount: number,
  clientName: "string",
  
  // Optional
  chatterProfilePicture: "url",
  chatterMadeTotal: number,
  currency: "CZK",
  clientStatus: "new" | "old",
  productDescription: "string",
  clientSentTotal: number,
  clientDay: "string",
  customMessage: "string"
}
```

---

## 🎯 Common Use Cases

### Download Immediately
```javascript
import { downloadPaymentImage } from './api/paymentImage';
await downloadPaymentImage(paymentData);
```

### Get as Blob
```javascript
import { generatePaymentImage } from './api/paymentImage';
const blob = await generatePaymentImage(paymentData);
```

### Show Modal
```javascript
<PaymentImageGenerator
  paymentData={data}
  isOpen={true}
  onClose={handleClose}
/>
```

---

## 🔗 API Endpoint

```bash
POST /.netlify/functions/generate-payment-image
Content-Type: application/json

{
  "chatterName": "Anna K.",
  "paymentAmount": 5000,
  "clientName": "Client#123"
}

→ Returns: PNG image (1200x1400px)
```

---

## 📱 Telegram Sharing

1. **Copy & Paste**: Click "Copy" → Paste in Telegram
2. **Download**: Click "Download" → Upload to Telegram
3. **Bot API**: See INTEGRATION_EXAMPLE.md

---

## 📁 Files Created

- `/netlify/functions/generate-payment-image.js` - API
- `/src/api/paymentImage.js` - Helpers
- `/src/components/PaymentImageGenerator.jsx` - UI
- `/src/pages/PaymentImageTest.jsx` - Test page

---

## 📚 Full Docs

- `PAYMENT_IMAGE_SUMMARY.md` - Complete overview
- `PAYMENT_IMAGE_GENERATOR.md` - Detailed docs
- `INTEGRATION_EXAMPLE.md` - Integration guide
- `PAYMENT_IMAGE_SETUP.md` - Setup guide

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Canvas won't install | Install build tools (see SETUP.md) |
| Function 404 | Use `netlify dev` not `npm run dev` |
| Profile pic missing | Check URL accessibility |
| Text cut off | Keep messages < 150 chars |

---

## ✨ Features

✅ Beautiful design with platform colors
✅ Profile pictures with glow effects
✅ Auto text wrapping
✅ Download & copy to clipboard
✅ Preview before sharing
✅ Mobile responsive
✅ Error handling

---

**Need more help?** See the full documentation files or visit `/payment-image-test`

