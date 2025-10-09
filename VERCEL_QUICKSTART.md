# 🚀 Payment Image Generator - Vercel & n8n Quick Start

## ✅ Your API Endpoint

```
POST https://your-domain.vercel.app/api/generate-payment-image
```

---

## 📦 Installation (2 Steps)

### 1. Install Canvas Package
```bash
npm install
```

### 2. Deploy to Vercel
```bash
vercel --prod
```

Or push to Git (if auto-deploy is enabled).

---

## 🔗 For n8n - HTTP Request Node

### Configuration:

**URL:**
```
https://your-domain.vercel.app/api/generate-payment-image
```

**Method:** `POST`

**Body (JSON):**
```json
{
  "chatterName": "Anna K.",
  "paymentAmount": 5000,
  "clientName": "Client#123"
}
```

**Response Format:** `File` ✅

**Binary Property:** `data` ✅

---

## 📋 All Fields (Most Are Optional!)

### Required (Only 3!)
```json
{
  "chatterName": "string",      ✅ REQUIRED
  "paymentAmount": 5000,         ✅ REQUIRED
  "clientName": "string"         ✅ REQUIRED
}
```

### Optional (All of these!)
```json
{
  "chatterProfilePicture": "url",
  "chatterMadeTotal": 125000,
  "currency": "CZK",
  "clientStatus": "new",
  "productDescription": "text",
  "clientSentTotal": 5000,
  "clientDay": "1st day",
  "customMessage": "message"
}
```

---

## 🧪 Test Your Endpoint

### With cURL:
```bash
curl -X POST https://your-domain.vercel.app/api/generate-payment-image \
  -H "Content-Type: application/json" \
  -d '{"chatterName":"Test","paymentAmount":5000,"clientName":"Client#123"}' \
  --output test.png
```

### Success = You get a PNG file! 🎉

---

## 🤖 n8n Workflow

```
[Webhook/Database] → [HTTP Request] → [Telegram]
       ↓                    ↓               ↓
   Payment Data       Generate Image    Send to Group
```

### HTTP Request Node Settings:
- URL: `https://your-domain.vercel.app/api/generate-payment-image`
- Method: POST
- Response Format: **File** (Important!)
- Binary: ON
- Binary Property: `data`

### Telegram Node Settings:
- Operation: Send Photo
- Binary Data: ON
- Binary Property: `data`

---

## 📁 File Location

Your API file MUST be at:
```
/api/generate-payment-image.js  ✅ This is correct!
```

NOT at:
```
/netlify/functions/...  ❌ Wrong (that's for Netlify)
```

---

## 🎨 What You Get

Beautiful 1200x1400px images with:
- Your platform's purple & gold colors
- Profile pictures (if provided)
- All payment details
- Professional design
- Ready for Telegram

---

## 📞 Need More Details?

Read: `VERCEL_N8N_GUIDE.md` for complete documentation

---

## ✅ Quick Checklist

- [x] File created at `/api/generate-payment-image.js`
- [x] Canvas package in package.json
- [ ] Run `npm install`
- [ ] Deploy to Vercel
- [ ] Get your domain URL
- [ ] Test with cURL
- [ ] Set up n8n HTTP Request node
- [ ] Connect to Telegram node
- [ ] Test end-to-end
- [ ] Enjoy! 🎉

---

**Your endpoint is ready! Just install, deploy, and use in n8n! 🚀**

Endpoint: `https://YOUR-DOMAIN.vercel.app/api/generate-payment-image`

