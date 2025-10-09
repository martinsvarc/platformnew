# AI Assistant Setup Guide

## 🤖 Overview
Your AI Business Assistant is integrated into the **Analytics page** as a sleek bottom bar using serverless functions.

**Privacy:** All client names, contact information, and notes are excluded from AI. Only aggregate metrics are shared.

## 🔑 Setup Instructions

### Step 1: Choose Your AI Provider

**Option A: Claude 3.5 Sonnet (Recommended)**
- Best for complex data analysis
- ~$0.003 per question
- Get key: https://console.anthropic.com/

**Option B: GPT-4o**
- Good for general analytics
- ~$0.0025 per question
- Get key: https://platform.openai.com/api-keys

### Step 2: Add API Key

Create `.env` file in project root (NOT `.env.local` since this is for server-side):

```env
# Database (you should already have this)
VITE_DATABASE_URL=your_neon_database_url

# AI Provider (choose one)
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
# OR
OPENAI_API_KEY=sk-your-key-here
```

### Step 3: Deploy

The AI assistant uses Netlify Functions. To use it:

**For Development:**
```bash
npm install netlify-cli -g
netlify dev
```

**For Production:**
1. Deploy to Netlify
2. Add environment variables in Netlify dashboard:
   - Go to Site Settings → Environment Variables
   - Add `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`
   - Add `VITE_DATABASE_URL`

## 🚀 How to Use

1. Navigate to `/analytics` page
2. Look for the AI bar at the bottom center
3. Click "Ask AI About Your Data" to expand
4. Type your question and press Cmd/Ctrl + Enter
5. View response in the card above

## 💡 Example Questions

- "If retention improves by 25% and 25% more people reach 2nd payment, how much more revenue will I make?"
- "What's my current retention rate from 1st to 2nd payment?"
- "How does this month compare to last month?"
- "What's the average revenue per client?"
- "If I double my client base, what's the projected revenue?"

## 📝 Privacy & Security

- ✅ **No PII**: Client names, emails, phones, notes NEVER sent to AI
- ✅ **Aggregate Only**: Only business metrics shared
- ✅ **Anonymous**: Team members shown as "Performer #1", etc.
- ✅ **Secure**: API keys stored server-side, never exposed to browser
- ✅ **Read Only**: AI cannot modify data

## 🐛 Troubleshooting

**Can't see the AI bar?**
- Make sure you're on `/analytics` page
- Scroll to bottom of page

**Getting "AI service not configured" error?**
1. Check `.env` file exists in project root
2. Check API key format:
   - Claude: starts with `sk-ant-`
   - OpenAI: starts with `sk-`
3. Restart Netlify Dev server
4. In production: Check Netlify environment variables

**Getting CORS errors?**
- Make sure you're running with `netlify dev` not `npm run dev`
- The function needs to be proxied through Netlify

## 🎨 Features

- **Expandable Bottom Bar**: Clean, centered design
- **Keyboard Shortcuts**: Cmd/Ctrl + Enter to submit
- **Smart Responses**: Data-driven answers with calculations
- **What-If Analysis**: Complex scenario projections
- **Privacy First**: Zero personal information shared
