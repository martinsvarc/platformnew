import { useState } from 'react';
import PaymentImageGenerator from '../components/PaymentImageGenerator';

/**
 * Test page for the Payment Image Generator
 * Use this to test and demo the payment image generation
 * 
 * Access at: /payment-image-test
 */
export default function PaymentImageTest() {
  const [showGenerator, setShowGenerator] = useState(false);
  const [formData, setFormData] = useState({
    chatterName: 'Anna K.',
    chatterProfilePicture: '',
    chatterMadeTotal: 125000,
    paymentAmount: 5000,
    currency: 'CZK',
    clientName: 'Client#12345',
    clientStatus: 'new',
    productDescription: 'Premium content package',
    clientSentTotal: 5000,
    clientDay: '1st day',
    customMessage: 'Great first session! Looking forward to more 🎉'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Total') || name.includes('Amount') 
        ? Number(value) || 0 
        : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowGenerator(true);
  };

  const loadExampleData = (example) => {
    const examples = {
      newClient: {
        chatterName: 'Sarah M.',
        chatterProfilePicture: '',
        chatterMadeTotal: 85000,
        paymentAmount: 3500,
        currency: 'CZK',
        clientName: 'Client#45678',
        clientStatus: 'new',
        productDescription: 'VIP content bundle',
        clientSentTotal: 3500,
        clientDay: '1st day',
        customMessage: 'Amazing start! This client is super engaged! 🚀'
      },
      returningClient: {
        chatterName: 'Emma L.',
        chatterProfilePicture: '',
        chatterMadeTotal: 250000,
        paymentAmount: 8500,
        currency: 'CZK',
        clientName: 'Client#11223',
        clientStatus: 'old',
        productDescription: 'Custom video request',
        clientSentTotal: 25000,
        clientDay: '5th session',
        customMessage: 'Long-term client coming back for more premium content! 💎'
      },
      bigPayment: {
        chatterName: 'Victoria P.',
        chatterProfilePicture: '',
        chatterMadeTotal: 500000,
        paymentAmount: 15000,
        currency: 'CZK',
        clientName: 'Client#99999',
        clientStatus: 'old',
        productDescription: 'Exclusive platinum package',
        clientSentTotal: 75000,
        clientDay: '12th session',
        customMessage: '🎉 HUGE milestone! Our biggest payment this month! Keep crushing it! 💪✨'
      }
    };

    setFormData(examples[example]);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gradient-primary mb-4">
            📸 Payment Image Generator
          </h1>
          <p className="text-pearl/70 text-lg">
            Test and preview payment images for Telegram sharing
          </p>
        </div>

        {/* Example Data Buttons */}
        <div className="glow-card p-6 mb-8">
          <h3 className="text-xl font-semibold text-neon-orchid mb-4">
            Quick Examples
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => loadExampleData('newClient')}
              className="bg-gradient-to-r from-neon-orchid to-sunset-gold px-6 py-3 rounded-lg text-obsidian font-medium transition-all duration-300 hover:scale-105"
            >
              🆕 New Client
            </button>
            <button
              onClick={() => loadExampleData('returningClient')}
              className="bg-gradient-to-r from-neon-orchid to-crimson px-6 py-3 rounded-lg text-pearl font-medium transition-all duration-300 hover:scale-105"
            >
              🔄 Returning Client
            </button>
            <button
              onClick={() => loadExampleData('bigPayment')}
              className="bg-gradient-to-r from-sunset-gold to-crimson px-6 py-3 rounded-lg text-obsidian font-medium transition-all duration-300 hover:scale-105"
            >
              💎 Big Payment
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glow-card p-8">
          <h2 className="text-2xl font-bold text-pearl mb-6">
            Payment Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chatter Name */}
            <div>
              <label className="block text-pearl font-medium mb-2">
                Chatter Name *
              </label>
              <input
                type="text"
                name="chatterName"
                value={formData.chatterName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-charcoal border border-neon-orchid/30 text-pearl focus:border-neon-orchid focus:outline-none transition-colors"
                placeholder="Anna K."
              />
            </div>

            {/* Chatter Profile Picture */}
            <div>
              <label className="block text-pearl font-medium mb-2">
                Profile Picture URL
              </label>
              <input
                type="url"
                name="chatterProfilePicture"
                value={formData.chatterProfilePicture}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-charcoal border border-neon-orchid/30 text-pearl focus:border-neon-orchid focus:outline-none transition-colors"
                placeholder="https://example.com/profile.jpg"
              />
              <p className="text-xs text-pearl/50 mt-1">
                Optional - leave blank for no image
              </p>
            </div>

            {/* Chatter Made Total */}
            <div>
              <label className="block text-pearl font-medium mb-2">
                Chatter Total Made
              </label>
              <input
                type="number"
                name="chatterMadeTotal"
                value={formData.chatterMadeTotal}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-charcoal border border-neon-orchid/30 text-pearl focus:border-neon-orchid focus:outline-none transition-colors"
                placeholder="125000"
              />
            </div>

            {/* Payment Amount */}
            <div>
              <label className="block text-pearl font-medium mb-2">
                Payment Amount *
              </label>
              <input
                type="number"
                name="paymentAmount"
                value={formData.paymentAmount}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-charcoal border border-sunset-gold/30 text-pearl focus:border-sunset-gold focus:outline-none transition-colors"
                placeholder="5000"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-pearl font-medium mb-2">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-charcoal border border-neon-orchid/30 text-pearl focus:border-neon-orchid focus:outline-none transition-colors"
              >
                <option value="CZK">CZK</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
            </div>

            {/* Client Name */}
            <div>
              <label className="block text-pearl font-medium mb-2">
                Client Name *
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-charcoal border border-neon-orchid/30 text-pearl focus:border-neon-orchid focus:outline-none transition-colors"
                placeholder="Client#12345"
              />
            </div>

            {/* Client Status */}
            <div>
              <label className="block text-pearl font-medium mb-2">
                Client Status
              </label>
              <select
                name="clientStatus"
                value={formData.clientStatus}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-charcoal border border-neon-orchid/30 text-pearl focus:border-neon-orchid focus:outline-none transition-colors"
              >
                <option value="new">🆕 New</option>
                <option value="old">🔄 Returning</option>
              </select>
            </div>

            {/* Product Description */}
            <div>
              <label className="block text-pearl font-medium mb-2">
                Product / Service (Co se prodalo)
              </label>
              <input
                type="text"
                name="productDescription"
                value={formData.productDescription}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-charcoal border border-neon-orchid/30 text-pearl focus:border-neon-orchid focus:outline-none transition-colors"
                placeholder="Premium content package"
              />
            </div>

            {/* Client Sent Total */}
            <div>
              <label className="block text-pearl font-medium mb-2">
                Client Sent Total
              </label>
              <input
                type="number"
                name="clientSentTotal"
                value={formData.clientSentTotal}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-charcoal border border-neon-orchid/30 text-pearl focus:border-neon-orchid focus:outline-none transition-colors"
                placeholder="5000"
              />
            </div>

            {/* Client Day */}
            <div>
              <label className="block text-pearl font-medium mb-2">
                Client Session
              </label>
              <input
                type="text"
                name="clientDay"
                value={formData.clientDay}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-charcoal border border-neon-orchid/30 text-pearl focus:border-neon-orchid focus:outline-none transition-colors"
                placeholder="1st day, 2nd session, etc."
              />
            </div>

            {/* Custom Message */}
            <div className="md:col-span-2">
              <label className="block text-pearl font-medium mb-2">
                Custom Message
              </label>
              <textarea
                name="customMessage"
                value={formData.customMessage}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 rounded-lg bg-charcoal border border-neon-orchid/30 text-pearl focus:border-neon-orchid focus:outline-none transition-colors resize-none"
                placeholder="Great first session! Looking forward to more 🎉"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8">
            <button
              type="submit"
              className="w-full btn-primary py-4 text-lg font-bold flex items-center justify-center gap-3"
            >
              <span className="text-2xl">✨</span>
              Generate Payment Image
              <span className="text-2xl">✨</span>
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-neon-orchid/10 border-2 border-neon-orchid/30 rounded-xl">
          <h3 className="text-lg font-semibold text-neon-orchid mb-3">
            ℹ️ About this Tool
          </h3>
          <ul className="text-pearl/70 space-y-2 text-sm">
            <li>• Fill in the payment information above</li>
            <li>• Click "Generate Payment Image" to create a beautiful image</li>
            <li>• Preview, download, or copy the image to share in Telegram</li>
            <li>• Fields marked with * are required</li>
            <li>• Try the example buttons for pre-filled scenarios</li>
          </ul>
        </div>
      </div>

      {/* Payment Image Generator Modal */}
      <PaymentImageGenerator
        paymentData={formData}
        isOpen={showGenerator}
        onClose={() => setShowGenerator(false)}
      />
    </div>
  );
}

