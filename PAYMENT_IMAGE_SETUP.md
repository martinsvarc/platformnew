# 🚀 Payment Image Generator - Setup Guide

Quick setup guide to get the payment image generator working.

## 📦 Installation

### Step 1: Install Dependencies

Run the following command to install the required `canvas` package:

```bash
npm install
```

This will install all dependencies including the newly added `canvas` package for server-side image generation.

### Step 2: Deploy to Netlify

The Netlify function will be automatically deployed when you push to your repository or deploy through the Netlify CLI:

```bash
netlify deploy --prod
```

### Step 3: Test the Endpoint

Once deployed, you can test the endpoint at:

```
https://your-site.netlify.app/.netlify/functions/generate-payment-image
```

Or locally with:

```bash
netlify dev
```

Then visit: `http://localhost:8888/payment-image-test`

## 🧪 Testing

### Option 1: Use the Test Page

1. Start your dev server: `npm run dev` or `netlify dev`
2. Navigate to `/payment-image-test` in your browser
3. Fill in the form or use the example buttons
4. Click "Generate Payment Image"
5. Preview, download, or copy the image

### Option 2: Test with cURL

```bash
curl -X POST http://localhost:8888/.netlify/functions/generate-payment-image \
  -H "Content-Type: application/json" \
  -d '{
    "chatterName": "Test User",
    "paymentAmount": 5000,
    "currency": "CZK",
    "clientName": "Client#123",
    "clientStatus": "new",
    "clientSentTotal": 5000,
    "clientDay": "1st day"
  }' \
  --output test-payment.png
```

### Option 3: Test with JavaScript Console

Open your browser console on any page and run:

```javascript
const testData = {
  chatterName: "Test User",
  paymentAmount: 5000,
  currency: "CZK",
  clientName: "Client#123",
  clientStatus: "new",
  clientSentTotal: 5000,
  clientDay: "1st day"
};

fetch('/.netlify/functions/generate-payment-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(res => res.blob())
.then(blob => {
  const url = URL.createObjectURL(blob);
  const img = document.createElement('img');
  img.src = url;
  img.style.maxWidth = '100%';
  document.body.appendChild(img);
});
```

## 🔧 Troubleshooting

### Canvas Package Won't Install

If you encounter issues installing the `canvas` package, you may need to install system dependencies:

**macOS:**
```bash
xcode-select --install
```

**Ubuntu/Debian:**
```bash
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

**Windows:**
```bash
npm install --global windows-build-tools
```

### Function Not Working Locally

Make sure you're using `netlify dev` instead of just `npm run dev` to test Netlify functions locally.

### Profile Picture Not Loading

- Ensure the URL is publicly accessible
- Check for CORS issues if the image is from an external domain
- The function will work without a profile picture if the URL is invalid

## 📝 Integration Checklist

- [x] `canvas` package added to `package.json`
- [x] Netlify function created: `/netlify/functions/generate-payment-image.js`
- [x] Helper API module created: `/src/api/paymentImage.js`
- [x] React component created: `/src/components/PaymentImageGenerator.jsx`
- [x] Test page created: `/src/pages/PaymentImageTest.jsx`
- [x] Route added to App.jsx
- [ ] Run `npm install` ✅ **Do this now!**
- [ ] Test locally with `netlify dev`
- [ ] Deploy to production
- [ ] Test production endpoint
- [ ] Integrate into payment flow (see PAYMENT_IMAGE_GENERATOR.md)

## 🎯 Next Steps

1. **Install dependencies**: Run `npm install`
2. **Test locally**: Visit `/payment-image-test` after starting the dev server
3. **Integrate into payment flow**: See examples in `PAYMENT_IMAGE_GENERATOR.md`
4. **Customize as needed**: Adjust colors, layout, or fields in the generator function

## 📚 Documentation

For detailed documentation on how to use the payment image generator, see:
- `PAYMENT_IMAGE_GENERATOR.md` - Complete usage guide
- `/payment-image-test` - Interactive test page
- JSDoc comments in `/src/api/paymentImage.js`

## 🆘 Need Help?

1. Check the browser console for errors
2. Check Netlify function logs in the Netlify dashboard
3. Verify all required fields are provided in the API call
4. Test with the example data provided in the test page

---

**Ready to create beautiful payment announcements! 🎉**

