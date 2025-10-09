# 📸 Payment Image Generator - Vercel & n8n Guide

## 🚀 API Endpoint for Vercel

### Your API Endpoint
```
POST https://your-domain.vercel.app/api/generate-payment-image
```

Replace `your-domain` with your actual Vercel domain.

---

## 📋 For n8n Integration

### HTTP Request Node Configuration

**Method:** `POST`

**URL:** `https://your-domain.vercel.app/api/generate-payment-image`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body (JSON):**
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
  "customMessage": "Great first session! 🎉"
}
```

**Response Format:** `File` (Binary PNG image)

---

## 🎯 n8n Workflow Example

### Scenario: Generate Image When Payment Created

```
[Trigger] → [HTTP Request] → [Telegram]
   ↓              ↓              ↓
Payment       Generate      Send to
Webhook        Image        Group
```

### Step-by-Step n8n Setup

#### 1. **Trigger Node** (Webhook or Database)
- Receives payment data
- Outputs: `chatterName`, `paymentAmount`, `clientName`, etc.

#### 2. **HTTP Request Node** (Generate Image)

**Node Settings:**
- **Method:** POST
- **URL:** `https://your-domain.vercel.app/api/generate-payment-image`
- **Authentication:** None (unless you add it)
- **Response Format:** File

**Body:**
```json
{
  "chatterName": "{{ $json.chatterName }}",
  "chatterProfilePicture": "{{ $json.profileUrl }}",
  "chatterMadeTotal": {{ $json.chatterTotal }},
  "paymentAmount": {{ $json.amount }},
  "currency": "{{ $json.currency }}",
  "clientName": "{{ $json.clientName }}",
  "clientStatus": "{{ $json.isNewClient ? 'new' : 'old' }}",
  "productDescription": "{{ $json.description }}",
  "clientSentTotal": {{ $json.clientTotal }},
  "clientDay": "{{ $json.sessionInfo }}",
  "customMessage": "{{ $json.message }}"
}
```

**Options:**
- ✅ Binary Property: `data`
- ✅ Download Response: ON
- Response Format: File

#### 3. **Telegram Node** (Send Image)

**Node Settings:**
- **Resource:** Message
- **Operation:** Send Photo
- **Chat ID:** Your Telegram group chat ID
- **Binary Data:** ON
- **Binary Property Name:** `data`

**Optional Caption:**
```
💰 New Payment: {{ $json.paymentAmount }} {{ $json.currency }}
From: {{ $json.clientName }}
By: {{ $json.chatterName }}
```

---

## 📝 Required Fields (Minimum)

Only 3 fields are **required**:

```json
{
  "chatterName": "string",
  "paymentAmount": number,
  "clientName": "string"
}
```

All other fields are optional!

---

## 🔧 Complete Example for n8n

### Minimal Request
```json
{
  "chatterName": "Anna K.",
  "paymentAmount": 5000,
  "clientName": "Client#123"
}
```

### With All Fields
```json
{
  "chatterName": "Anna K.",
  "chatterProfilePicture": "https://res.cloudinary.com/demo/profile.jpg",
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

---

## 🧪 Testing Your Endpoint

### Test with cURL (Command Line)

```bash
curl -X POST https://your-domain.vercel.app/api/generate-payment-image \
  -H "Content-Type: application/json" \
  -d '{
    "chatterName": "Test User",
    "paymentAmount": 5000,
    "clientName": "Client#123"
  }' \
  --output test-payment.png
```

If successful, you'll get `test-payment.png` file!

### Test with n8n Webhook

1. Create a Webhook node in n8n
2. Send test data to it
3. Connect to HTTP Request node
4. Execute and check the binary data

### Test with Postman

1. **Method:** POST
2. **URL:** `https://your-domain.vercel.app/api/generate-payment-image`
3. **Headers:** `Content-Type: application/json`
4. **Body (raw JSON):**
   ```json
   {
     "chatterName": "Test",
     "paymentAmount": 5000,
     "clientName": "Client#123"
   }
   ```
5. **Send & Save Response** as PNG file

---

## 🚀 Deployment to Vercel

### Step 1: Ensure Correct File Location

The API function MUST be in:
```
/api/generate-payment-image.js
```

NOT in `/netlify/functions/`!

### Step 2: Update package.json

Make sure `canvas` is in dependencies:
```json
{
  "dependencies": {
    "canvas": "^2.11.2"
  }
}
```

### Step 3: Deploy

```bash
# Install dependencies
npm install

# Deploy to Vercel
vercel --prod
```

Or push to your Git repository if you have auto-deploy enabled.

### Step 4: Get Your URL

After deployment, Vercel will give you a URL like:
```
https://your-project.vercel.app
```

Your API endpoint will be:
```
https://your-project.vercel.app/api/generate-payment-image
```

---

## 📱 n8n → Telegram Complete Workflow

### Full n8n Workflow JSON

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "webhookId": "your-webhook-id",
      "parameters": {
        "path": "payment-received",
        "responseMode": "lastNode",
        "options": {}
      }
    },
    {
      "name": "Generate Payment Image",
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300],
      "parameters": {
        "method": "POST",
        "url": "https://your-domain.vercel.app/api/generate-payment-image",
        "options": {
          "response": {
            "response": {
              "responseFormat": "file"
            }
          }
        },
        "bodyParametersJson": "={{ {\n  \"chatterName\": $json.chatterName,\n  \"paymentAmount\": $json.amount,\n  \"clientName\": $json.clientName,\n  \"clientStatus\": $json.isNew ? \"new\" : \"old\",\n  \"currency\": \"CZK\"\n} }}"
      }
    },
    {
      "name": "Send to Telegram",
      "type": "n8n-nodes-base.telegram",
      "position": [650, 300],
      "credentials": {
        "telegramApi": {
          "id": "1",
          "name": "Telegram Bot"
        }
      },
      "parameters": {
        "resource": "message",
        "operation": "sendPhoto",
        "chatId": "YOUR_CHAT_ID",
        "binaryData": true,
        "binaryPropertyName": "data",
        "additionalFields": {
          "caption": "=💰 New Payment: {{ $json.paymentAmount }} CZK"
        }
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Generate Payment Image", "type": "main", "index": 0 }]]
    },
    "Generate Payment Image": {
      "main": [[{ "node": "Send to Telegram", "type": "main", "index": 0 }]]
    }
  }
}
```

---

## 🔐 Optional: Add Authentication

If you want to secure your endpoint, add authentication:

### In `/api/generate-payment-image.js`:

```javascript
export default async function handler(req, res) {
  // Check API key
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // ... rest of your code
}
```

### In Vercel Dashboard:
1. Go to Settings → Environment Variables
2. Add: `API_KEY` = `your-secret-key`

### In n8n HTTP Request Node:
Add header:
```json
{
  "X-API-Key": "your-secret-key"
}
```

---

## 📊 Response Details

### Success Response
- **Status:** 200
- **Content-Type:** image/png
- **Body:** Binary PNG image data

### Error Responses

**400 Bad Request:**
```json
{
  "error": "Missing required fields: chatterName, paymentAmount, clientName"
}
```

**405 Method Not Allowed:**
```json
{
  "error": "Method not allowed"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Error message here"
}
```

---

## 🎯 Field Mapping from Your Database

Map your database fields to the API fields:

| Your Field | API Field | Required |
|------------|-----------|----------|
| user_name | chatterName | ✅ Yes |
| profile_url | chatterProfilePicture | ❌ No |
| total_earnings | chatterMadeTotal | ❌ No |
| amount | paymentAmount | ✅ Yes |
| currency | currency | ❌ No (default: CZK) |
| client_name | clientName | ✅ Yes |
| is_new_client | clientStatus | ❌ No |
| product | productDescription | ❌ No |
| client_total | clientSentTotal | ❌ No |
| session_info | clientDay | ❌ No |
| notes | customMessage | ❌ No |

---

## 🐛 Troubleshooting

### Image Not Generating
- Check Vercel deployment logs
- Verify API endpoint URL is correct
- Test with minimal required fields first

### n8n Not Receiving Image
- Set Response Format to "File" in HTTP Request node
- Enable "Binary Data" option
- Check Binary Property Name is "data"

### CORS Errors
- The API includes CORS headers by default
- Should work from any domain

### Canvas Package Issues on Vercel
Vercel should handle canvas automatically. If issues:
1. Check build logs in Vercel dashboard
2. Ensure `canvas` is in `dependencies` not `devDependencies`

---

## 🎉 Quick Start Checklist

- [ ] Move function to `/api/generate-payment-image.js`
- [ ] Run `npm install` to get canvas package
- [ ] Deploy to Vercel (`vercel --prod`)
- [ ] Get your API endpoint URL
- [ ] Test with cURL or Postman
- [ ] Set up n8n HTTP Request node
- [ ] Configure Telegram node
- [ ] Test end-to-end workflow
- [ ] Celebrate! 🎊

---

## 📞 Your Exact API Endpoint

```
POST https://[YOUR-VERCEL-DOMAIN]/api/generate-payment-image
```

Example:
```
POST https://my-app.vercel.app/api/generate-payment-image
```

Use this in your n8n HTTP Request node!

---

**You're all set! Start sending beautiful payment images to Telegram automatically! 🚀📸**

