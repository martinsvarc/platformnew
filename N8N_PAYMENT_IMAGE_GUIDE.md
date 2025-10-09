# n8n Payment Image Generator Guide

## Overview
Your payment image API endpoint returns beautiful HTML that n8n can screenshot and share.

## API Endpoint
```
POST https://www.cink.club/api/generate-payment-image
```

## Setup in n8n

### Method 1: Using HTML/CSS to Image Service (Recommended)

**Step 1: HTTP Request to Your API**
```
Node: HTTP Request
Method: POST
URL: https://www.cink.club/api/generate-payment-image
Body Content Type: JSON
Body (JSON):
{
  "chatterName": "{{$json.chatterName}}",
  "chatterProfilePicture": "{{$json.profileUrl}}",
  "chatterMadeTotal": {{$json.totalMade}},
  "paymentAmount": {{$json.amount}},
  "currency": "CZK",
  "clientName": "{{$json.clientName}}",
  "clientStatus": "{{$json.isNew ? 'new' : 'old'}}",
  "productDescription": "{{$json.product}}",
  "clientSentTotal": {{$json.clientTotal}},
  "clientDay": "{{$json.session}}",
  "customMessage": "{{$json.message}}"
}
```

This returns HTML in the response body.

**Step 2: Convert HTML to PNG using htmlcsstoimage.com**

A. Sign up at https://htmlcsstoimage.com (free tier: 50 images/month)

B. Add HTTP Request node:
```
Node: HTTP Request
Method: POST
URL: https://hcti.io/v1/image
Authentication: Basic Auth
Username: Your HCTI User ID
Password: Your HCTI API Key
Body Content Type: JSON
Body:
{
  "html": "{{$json.body}}",
  "google_fonts": "Roboto:400,700,900"
}
```

The response will contain `url` with your PNG image!

**Step 3: Send to Telegram**
```
Node: Telegram
Operation: Send Photo
Chat ID: Your group chat ID
Photo: {{$json.url}}
Caption: 💰 New Payment from {{$json.chatterName}}!
```

### Method 2: Using Puppeteer in n8n (Self-Hosted)

If you're self-hosting n8n with Docker, you can use Puppeteer:

**Step 1: HTTP Request to Your API** (same as above)

**Step 2: Execute Command Node**
```
Node: Execute Command
Command: node
Parameters:
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1400 });
  await page.setContent(`{{$json.body}}`);
  await page.screenshot({ path: '/tmp/payment.png' });
  await browser.close();
  
  const image = fs.readFileSync('/tmp/payment.png', 'base64');
  console.log(image);
})();
```

**Step 3: Send to Telegram** (use the base64 image)

### Method 3: Using Screenshot API Service

Alternative services:
- **ApiFlash.com** - https://apiflash.com
- **ScreenshotAPI.net** - https://screenshotapi.net  
- **ScreenshotOne.com** - https://screenshotone.com

All work similarly - send them the HTML and get back a PNG.

## Example n8n Workflow

```
1. [Webhook] Payment received
   ↓
2. [HTTP Request] Call generate-payment-image API
   ↓
3. [HTTP Request] Convert HTML to PNG (htmlcsstoimage.com)
   ↓
4. [Telegram] Send photo to group
   ↓
5. [Set] Mark as complete
```

## Testing

### Test with curl:
```bash
curl -X POST https://www.cink.club/api/generate-payment-image \
  -H "Content-Type: application/json" \
  -d '{
    "chatterName": "Anna K.",
    "paymentAmount": 5000,
    "currency": "CZK",
    "clientName": "Client#123",
    "clientStatus": "new",
    "clientDay": "1st day",
    "clientSentTotal": 5000,
    "customMessage": "Great session! 🎉"
  }'
```

This returns HTML. Save it as `test.html` and open in browser to preview.

### Test HTML to Image:
```bash
curl -X POST https://hcti.io/v1/image \
  -u 'YOUR_USER_ID:YOUR_API_KEY' \
  -d html="<your html here>" \
  -d google_fonts="Roboto"
```

## Recommended: htmlcsstoimage.com

**Why?**
- ✅ Simple to use
- ✅ Free tier available
- ✅ Fast rendering
- ✅ Perfect for automation
- ✅ Returns direct image URL

**Pricing:**
- Free: 50 images/month
- Starter: $19/mo - 1,000 images
- Pro: $49/mo - 5,000 images

## Alternative: Build Your Own Screenshot Service

If you want full control, deploy a simple Puppeteer service on Railway/Render/Fly.io:

```javascript
// server.js
const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.use(express.json({ limit: '10mb' }));

app.post('/screenshot', async (req, res) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1400 });
  await page.setContent(req.body.html);
  const screenshot = await page.screenshot({ type: 'png' });
  await browser.close();
  
  res.set('Content-Type', 'image/png');
  res.send(screenshot);
});

app.listen(3000);
```

Then use this in your n8n workflow instead of htmlcsstoimage.com.

