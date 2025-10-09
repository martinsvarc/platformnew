# 🤖 n8n Setup - Visual Guide

## 🎯 Complete n8n Workflow Setup

### Workflow Overview
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Payment    │────▶│   Generate   │────▶│   Telegram   │
│   Trigger    │     │    Image     │     │     Send     │
└──────────────┘     └──────────────┘     └──────────────┘
  (Webhook/DB)         (HTTP Request)        (Send Photo)
```

---

## 📋 Node 1: HTTP Request - Generate Image

### Basic Settings
```yaml
Node Name: Generate Payment Image
Node Type: HTTP Request

Method: POST
URL: https://your-domain.vercel.app/api/generate-payment-image

Authentication: None (or add if needed)
```

### Headers Tab
```json
{
  "Content-Type": "application/json"
}
```

### Body Tab
**Body Content Type:** JSON

**JSON Body:**
```json
{
  "chatterName": "{{ $json.chatterName }}",
  "paymentAmount": {{ $json.amount }},
  "clientName": "{{ $json.clientName }}"
}
```

### Options Tab (IMPORTANT!)
```yaml
Response ▼
  └─ Response Format: File  ← MUST BE FILE!
  └─ Binary Property: data
  └─ Output Binary Data: ON
```

---

## 📋 Node 2: Telegram - Send Photo

### Basic Settings
```yaml
Node Name: Send to Telegram
Node Type: Telegram

Resource: Message
Operation: Send Photo

Chat ID: -1001234567890  (Your group chat ID)
```

### Photo Settings
```yaml
Send Binary Data: ON
Binary Property Name: data  ← From HTTP Request node
```

### Optional Caption
```
💰 New Payment: {{ $json.paymentAmount }} CZK
Client: {{ $json.clientName }}
By: {{ $json.chatterName }}
```

---

## 🔧 Detailed HTTP Request Configuration

### Screenshot Equivalent Settings:

```
┌─────────────────────────────────────────────┐
│ HTTP Request Node                            │
├─────────────────────────────────────────────┤
│                                              │
│ Method: POST                                 │
│                                              │
│ URL: https://your-domain.vercel.app/api/... │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ Body Parameters                          │ │
│ │                                          │ │
│ │ {                                        │ │
│ │   "chatterName": "{{ $json.chatterName }}"│ │
│ │   "paymentAmount": {{ $json.amount }}    │ │
│ │   "clientName": "{{ $json.clientName }}" │ │
│ │ }                                        │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ Options ▼                                    │
│   Response ▼                                 │
│     [✓] Output Binary Data                  │
│     Response Format: [File ▼]               │
│     Binary Property: [data]                 │
│                                              │
└─────────────────────────────────────────────┘
```

---

## 🎨 Full Example with All Fields

```json
{
  "chatterName": "{{ $json.user_name }}",
  "chatterProfilePicture": "{{ $json.profile_url }}",
  "chatterMadeTotal": {{ $json.total_made }},
  "paymentAmount": {{ $json.amount }},
  "currency": "{{ $json.currency || 'CZK' }}",
  "clientName": "{{ $json.client_name }}",
  "clientStatus": "{{ $json.is_new ? 'new' : 'old' }}",
  "productDescription": "{{ $json.product }}",
  "clientSentTotal": {{ $json.client_total }},
  "clientDay": "{{ $json.session_day }}",
  "customMessage": "{{ $json.notes }}"
}
```

---

## 🔍 Testing Your Workflow

### Step 1: Test HTTP Request Node
1. Click on "HTTP Request" node
2. Click "Execute Node"
3. Check output:
   - Should see "Binary Data" tab
   - Should show image/png
   - Click to preview image

### Step 2: Test Full Workflow
1. Click "Execute Workflow" at top
2. Trigger your webhook/database trigger
3. Watch nodes execute one by one
4. Check Telegram for image

---

## 🎯 Common n8n Expressions

### From Previous Node
```javascript
{{ $json.fieldName }}         // Get field value
{{ $json["field-name"] }}     // Field with special chars
{{ $json.amount || 0 }}       // With default value
```

### Conditional
```javascript
{{ $json.isNew ? 'new' : 'old' }}
```

### String Concatenation
```javascript
{{ $json.firstName + ' ' + $json.lastName }}
```

### Number Formatting
```javascript
{{ Number($json.amount).toFixed(2) }}
```

---

## 📊 Input/Output Data Flow

### Input to HTTP Request Node
```json
{
  "user_name": "Anna K.",
  "amount": 5000,
  "client_name": "Client#123",
  "profile_url": "https://...",
  "is_new": true
}
```

### Maps to API Request
```json
{
  "chatterName": "Anna K.",
  "paymentAmount": 5000,
  "clientName": "Client#123",
  "chatterProfilePicture": "https://...",
  "clientStatus": "new"
}
```

### Output from HTTP Request Node
```
Binary Data:
  - data (image/png) - 245 KB
  - Preview available
```

### Passed to Telegram Node
```
Photo: data (from previous node)
Caption: "💰 New Payment: 5000 CZK"
```

---

## 🎭 Example Workflows

### Workflow 1: Simple (Minimum Fields)
```
[Webhook] → [HTTP Request] → [Telegram]

HTTP Request Body:
{
  "chatterName": "{{ $json.name }}",
  "paymentAmount": {{ $json.amount }},
  "clientName": "Client#{{ $json.clientId }}"
}
```

### Workflow 2: Complete (All Fields)
```
[Database] → [Format Data] → [HTTP Request] → [Telegram]

HTTP Request Body:
{
  "chatterName": "{{ $json.chatterName }}",
  "chatterProfilePicture": "{{ $json.profileUrl }}",
  "chatterMadeTotal": {{ $json.totalMade }},
  "paymentAmount": {{ $json.amount }},
  "currency": "CZK",
  "clientName": "{{ $json.clientName }}",
  "clientStatus": "{{ $json.isNewClient ? 'new' : 'old' }}",
  "productDescription": "{{ $json.product }}",
  "clientSentTotal": {{ $json.clientTotal }},
  "clientDay": "{{ $json.sessionInfo }}",
  "customMessage": "{{ $json.message || '' }}"
}
```

### Workflow 3: With Conditions
```
[Trigger] → [IF] → [HTTP Request] → [Telegram]
              ↓
            Skip if amount < 1000

IF Node: {{ $json.amount >= 1000 }}
```

---

## 🐛 Troubleshooting

### ❌ "Binary data expected"
**Fix:** Set Response Format to "File" in HTTP Request options

### ❌ Image not appearing in Telegram
**Fix:** Check Binary Property Name is "data" in both nodes

### ❌ "Missing required fields" error
**Fix:** Verify chatterName, paymentAmount, and clientName are provided

### ❌ Empty image or error
**Fix:** Check your Vercel endpoint is deployed and accessible

---

## ✅ Quick Checklist

HTTP Request Node:
- [ ] URL is correct (your Vercel domain)
- [ ] Method is POST
- [ ] Body is JSON format
- [ ] Response Format set to "File"
- [ ] Binary Property is "data"

Telegram Node:
- [ ] Send Binary Data is ON
- [ ] Binary Property Name is "data"
- [ ] Chat ID is correct
- [ ] Credentials are set up

---

## 🎉 Success Indicators

You'll know it's working when:
1. ✅ HTTP Request node shows "Binary Data" in output
2. ✅ You can preview the image in n8n
3. ✅ Telegram node executes successfully
4. ✅ Image appears in your Telegram group
5. ✅ Image shows all payment details correctly

---

## 📞 Need Help?

- Test endpoint with cURL first
- Check Vercel deployment logs
- Verify n8n expressions are correct
- Preview binary data in HTTP Request node
- Check Telegram bot permissions

---

**Your n8n workflow is ready! Beautiful payment images will be posted automatically! 🚀📸**

