# Local Development Setup

## The Problem
You were getting a **405 error** when trying to login because:
- The app was trying to call `/.netlify/functions/auth`
- But you're running with `npm run dev` (Vite only)
- Serverless functions weren't running

## The Solution
Your app now supports **Vercel** serverless functions in the `/api` directory.

## Running Locally

### Option 1: Use Vercel Dev (Recommended)
This runs both Vite and the serverless functions:

```bash
# Install Vercel CLI globally (if not installed)
npm install -g vercel

# Run with Vercel Dev
vercel dev
```

The app will be available at `http://localhost:3000`

### Option 2: Use npm run dev (Vite only)
If you're not using serverless functions features:

```bash
npm run dev
```

**Note:** Login and other features that require serverless functions won't work with this option.

## Environment Variables

Make sure you have a `.env` file with:

```env
VITE_DATABASE_URL=your-neon-database-url
ANTHROPIC_API_KEY=your-anthropic-key (optional, for AI assistant)
OPENAI_API_KEY=your-openai-key (optional, alternative to Anthropic)
```

## Deployment

### Vercel (Recommended)
```bash
vercel deploy --prod
```

### Netlify
If you prefer Netlify, the functions in `/netlify/functions` are still available:
```bash
netlify dev  # local development
netlify deploy --prod  # production
```

## What Changed

1. ✅ Created Vercel serverless functions:
   - `/api/auth.js` - Authentication
   - `/api/settings.js` - App settings
   - `/api/signup.js` - User registration

2. ✅ Updated API clients to use `/api` endpoints

3. ✅ Fixed JSON parsing errors in all API clients

4. ✅ Maintained backward compatibility with Netlify

## Troubleshooting

### Still getting 405 errors?
- Make sure you're using `vercel dev`, not `npm run dev`
- Check that `/api/*.js` files exist
- Verify your `.env` file has the correct database URL

### Database connection errors?
- Verify `VITE_DATABASE_URL` is set in `.env`
- Check that your Neon database is accessible

### Functions not found (404)?
- For Vercel: Functions should be in `/api/` directory
- For Netlify: Functions should be in `/netlify/functions/` directory

