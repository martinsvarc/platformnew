# 🔗 Payment Image Generator - Integration Example

This guide shows exactly how to integrate the payment image generator into your existing payment flow.

## 📋 Quick Integration into PaymentForm.jsx

Here's how to add a "Share to Telegram" button that appears after a successful payment:

### Step 1: Add imports at the top of PaymentForm.jsx

```javascript
import PaymentImageGenerator from './PaymentImageGenerator';
```

### Step 2: Add state for the image generator

Add this to your component's state declarations (around line 13-30):

```javascript
const [showImageGenerator, setShowImageGenerator] = useState(false);
const [lastPaymentData, setLastPaymentData] = useState(null);
```

### Step 3: Modify your handleSubmit function

Find your `handleSubmit` function and add the image generator trigger after successful payment:

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    // ... your existing payment creation code ...
    const result = await createPayment(paymentData);
    
    // NEW: Prepare data for image generator
    setLastPaymentData({
      chatterName: user.name || user.email,
      chatterProfilePicture: user.profile_picture_url || '',
      chatterMadeTotal: result.chatterTotal || 0, // Get from result or calculate
      paymentAmount: formData.amount,
      currency: 'CZK',
      clientName: formData.client || formData.newClient,
      clientStatus: formData.newClient ? 'new' : 'old',
      productDescription: formData.sold || 'Payment',
      clientSentTotal: result.clientTotal || formData.amount,
      clientDay: result.clientSession || '1st day',
      customMessage: formData.notes || ''
    });
    
    // Show success message
    toast.success(t('payment.success'));
    
    // NEW: Show image generator modal
    setShowImageGenerator(true);
    
    // ... rest of your success handling ...
  } catch (error) {
    // ... your error handling ...
  }
};
```

### Step 4: Add the component at the bottom of your render

Add this just before the closing div of your component:

```javascript
return (
  <div className="...">
    {/* ... your existing form JSX ... */}
    
    {/* NEW: Payment Image Generator Modal */}
    {lastPaymentData && (
      <PaymentImageGenerator
        paymentData={lastPaymentData}
        isOpen={showImageGenerator}
        onClose={() => setShowImageGenerator(false)}
      />
    )}
  </div>
);
```

---

## 🎯 Complete Integration Example

Here's a complete example showing the before and after:

### BEFORE (simplified):

```javascript
const PaymentForm = () => {
  const [formData, setFormData] = useState({...});
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createPayment(formData);
      toast.success('Payment created!');
      resetForm();
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
};
```

### AFTER (with image generator):

```javascript
import PaymentImageGenerator from './PaymentImageGenerator';

const PaymentForm = () => {
  const [formData, setFormData] = useState({...});
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [lastPaymentData, setLastPaymentData] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await createPayment(formData);
      
      // Prepare image data
      setLastPaymentData({
        chatterName: user.name,
        chatterProfilePicture: user.profile_picture_url,
        chatterMadeTotal: result.chatterTotal,
        paymentAmount: formData.amount,
        currency: 'CZK',
        clientName: formData.client,
        clientStatus: formData.newClient ? 'new' : 'old',
        productDescription: formData.sold,
        clientSentTotal: result.clientTotal,
        clientDay: result.clientSession,
        customMessage: ''
      });
      
      toast.success('Payment created!');
      setShowImageGenerator(true); // Show the modal
      resetForm();
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  return (
    <>
      <form onSubmit={handleSubmit}>
        {/* form fields */}
      </form>
      
      {lastPaymentData && (
        <PaymentImageGenerator
          paymentData={lastPaymentData}
          isOpen={showImageGenerator}
          onClose={() => setShowImageGenerator(false)}
        />
      )}
    </>
  );
};
```

---

## 🎨 Alternative: Add Button to Payment List

If you want to add a "Share to Telegram" button to each payment in your payment list:

### In Klientiaplatby.jsx (or your payment list component):

```javascript
import { useState } from 'react';
import PaymentImageGenerator from '../components/PaymentImageGenerator';

const PaymentList = () => {
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  
  const handleShareToTelegram = (payment) => {
    setSelectedPayment({
      chatterName: payment.user_name,
      chatterProfilePicture: payment.user_profile_url,
      chatterMadeTotal: payment.chatter_total,
      paymentAmount: payment.amount,
      currency: payment.currency || 'CZK',
      clientName: payment.client_name,
      clientStatus: payment.is_new_client ? 'new' : 'old',
      productDescription: payment.sold || payment.notes,
      clientSentTotal: payment.client_total,
      clientDay: payment.client_session,
      customMessage: ''
    });
    setShowImageGenerator(true);
  };
  
  return (
    <>
      <table>
        {payments.map(payment => (
          <tr key={payment.id}>
            {/* ... payment data ... */}
            <td>
              <button 
                onClick={() => handleShareToTelegram(payment)}
                className="btn-primary text-sm py-2 px-4"
              >
                📸 Share
              </button>
            </td>
          </tr>
        ))}
      </table>
      
      {selectedPayment && (
        <PaymentImageGenerator
          paymentData={selectedPayment}
          isOpen={showImageGenerator}
          onClose={() => setShowImageGenerator(false)}
        />
      )}
    </>
  );
};
```

---

## 🚀 Standalone Usage (Without Modal)

If you want to generate and download immediately without showing the modal:

```javascript
import { downloadPaymentImage } from '../api/paymentImage';

const handleQuickShare = async (payment) => {
  try {
    await downloadPaymentImage({
      chatterName: payment.chatterName,
      paymentAmount: payment.amount,
      clientName: payment.clientName,
      // ... other fields
    });
    toast.success('Image downloaded! Share it in Telegram.');
  } catch (error) {
    toast.error('Failed to generate image');
  }
};

// Usage in button
<button onClick={() => handleQuickShare(payment)}>
  Quick Download
</button>
```

---

## 📱 Telegram Bot Integration (Advanced)

If you want to automatically post to Telegram:

```javascript
import { generatePaymentImage } from '../api/paymentImage';

const postToTelegram = async (paymentData) => {
  try {
    // Generate image
    const imageBlob = await generatePaymentImage(paymentData);
    
    // Prepare form data for Telegram
    const formData = new FormData();
    formData.append('chat_id', 'YOUR_TELEGRAM_CHAT_ID');
    formData.append('photo', imageBlob, 'payment.png');
    formData.append('caption', `💰 New payment: ${paymentData.paymentAmount} ${paymentData.currency}`);
    
    // Send to Telegram
    const response = await fetch(
      `https://api.telegram.org/bot${YOUR_BOT_TOKEN}/sendPhoto`,
      {
        method: 'POST',
        body: formData
      }
    );
    
    if (!response.ok) throw new Error('Failed to post to Telegram');
    
    toast.success('Posted to Telegram!');
  } catch (error) {
    console.error('Telegram error:', error);
    toast.error('Failed to post to Telegram');
  }
};
```

---

## ✅ Integration Checklist

- [ ] Import `PaymentImageGenerator` component
- [ ] Add state for modal visibility and payment data
- [ ] Modify payment success handler to prepare image data
- [ ] Add `PaymentImageGenerator` component to JSX
- [ ] Test with real payment data
- [ ] (Optional) Add button to payment list
- [ ] (Optional) Set up Telegram bot integration

---

## 🎓 Tips

1. **User Experience**: Show the modal automatically after payment success so users can immediately share
2. **Data Mapping**: Make sure to map your payment object fields correctly to the required format
3. **Error Handling**: Wrap the image generation in try-catch blocks
4. **Profile Pictures**: Pre-load user profile pictures when they log in
5. **Customization**: Add a custom message input field in your payment form if desired

---

## 📚 Related Files

- `/src/components/PaymentImageGenerator.jsx` - The modal component
- `/src/api/paymentImage.js` - Helper functions
- `/netlify/functions/generate-payment-image.js` - API endpoint
- `/payment-image-test` - Test page for development
- `PAYMENT_IMAGE_GENERATOR.md` - Full documentation

---

**Happy integrating! 🎉**

