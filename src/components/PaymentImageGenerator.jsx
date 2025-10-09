import { useState } from 'react';
import { generatePaymentImage, downloadPaymentImage, getPaymentImageDataURL } from '../api/paymentImage';

/**
 * PaymentImageGenerator Component
 * 
 * A beautiful modal/popup component to generate and share payment images
 * Can be integrated into your payment success flow
 */
export default function PaymentImageGenerator({ 
  paymentData, 
  onClose, 
  isOpen = false 
}) {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleGeneratePreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const dataUrl = await getPaymentImageDataURL(paymentData);
      setPreviewUrl(dataUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      await downloadPaymentImage(
        paymentData, 
        `payment-${paymentData.clientName}-${Date.now()}.png`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const blob = await generatePaymentImage(paymentData);
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      alert('Image copied to clipboard! You can now paste it in Telegram.');
    } catch (err) {
      setError('Failed to copy to clipboard. Try downloading instead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="frosted-glass max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gradient-primary">
              📸 Payment Image for Telegram
            </h2>
            <button
              onClick={onClose}
              className="text-pearl hover:text-neon-orchid transition-colors text-3xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Preview Area */}
          {previewUrl ? (
            <div className="mb-6 rounded-xl overflow-hidden border-2 border-neon-orchid/30">
              <img 
                src={previewUrl} 
                alt="Payment preview" 
                className="w-full h-auto"
              />
            </div>
          ) : (
            <div className="mb-6 p-12 border-2 border-dashed border-neon-orchid/30 rounded-xl text-center">
              <div className="text-6xl mb-4">🖼️</div>
              <p className="text-pearl/60 text-lg">
                Generate a preview to see your payment image
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-crimson/20 border border-crimson/50 rounded-lg">
              <p className="text-crimson font-medium">⚠️ {error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleGeneratePreview}
              disabled={loading}
              className="btn-primary flex items-center justify-center gap-2 py-4"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <span className="text-2xl">👁️</span>
                  Preview
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              disabled={loading}
              className="bg-gradient-to-r from-sunset-gold to-neon-orchid px-6 py-4 rounded-lg text-obsidian font-medium transition-all duration-300 hover:scale-105 hover:shadow-glow flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-obsidian/30 border-t-obsidian rounded-full animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <span className="text-2xl">⬇️</span>
                  Download
                </>
              )}
            </button>

            <button
              onClick={handleCopyToClipboard}
              disabled={loading}
              className="bg-gradient-to-r from-neon-orchid to-crimson px-6 py-4 rounded-lg text-pearl font-medium transition-all duration-300 hover:scale-105 hover:shadow-glow-purple flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-pearl/30 border-t-pearl rounded-full animate-spin" />
                  Copying...
                </>
              ) : (
                <>
                  <span className="text-2xl">📋</span>
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Payment Summary */}
          <div className="mt-6 p-4 bg-charcoal/50 rounded-lg border border-neon-orchid/20">
            <h3 className="text-lg font-semibold text-neon-orchid mb-3">Payment Summary</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-smoke">Chatter:</span>
                <span className="text-pearl ml-2 font-medium">{paymentData.chatterName}</span>
              </div>
              <div>
                <span className="text-smoke">Amount:</span>
                <span className="text-sunset-gold ml-2 font-medium">
                  {paymentData.paymentAmount} {paymentData.currency || 'CZK'}
                </span>
              </div>
              <div>
                <span className="text-smoke">Client:</span>
                <span className="text-pearl ml-2 font-medium">{paymentData.clientName}</span>
              </div>
              <div>
                <span className="text-smoke">Status:</span>
                <span className="text-pearl ml-2 font-medium">
                  {paymentData.clientStatus === 'new' ? '🆕 New' : '🔄 Returning'}
                </span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-neon-orchid/10 border border-neon-orchid/30 rounded-lg">
            <h4 className="text-sm font-semibold text-neon-orchid mb-2">📱 Telegram Tips</h4>
            <ul className="text-xs text-pearl/70 space-y-1">
              <li>• Click "Copy" to copy the image directly to your clipboard</li>
              <li>• Open Telegram and paste (Ctrl+V / Cmd+V) in your group chat</li>
              <li>• Or download the image and upload it manually to Telegram</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Example usage in your payment success flow:
 * 
 * import PaymentImageGenerator from './components/PaymentImageGenerator';
 * 
 * function YourPaymentComponent() {
 *   const [showImageGenerator, setShowImageGenerator] = useState(false);
 *   const [paymentData, setPaymentData] = useState(null);
 * 
 *   const handlePaymentSuccess = (payment) => {
 *     setPaymentData({
 *       chatterName: payment.chatterName,
 *       chatterProfilePicture: payment.chatterProfileUrl,
 *       chatterMadeTotal: payment.chatterTotal,
 *       paymentAmount: payment.amount,
 *       currency: payment.currency,
 *       clientName: payment.clientName,
 *       clientStatus: payment.isNewClient ? 'new' : 'old',
 *       productDescription: payment.productDescription,
 *       clientSentTotal: payment.clientTotal,
 *       clientDay: payment.clientSession,
 *       customMessage: payment.message
 *     });
 *     setShowImageGenerator(true);
 *   };
 * 
 *   return (
 *     <>
 *       <PaymentImageGenerator
 *         paymentData={paymentData}
 *         isOpen={showImageGenerator}
 *         onClose={() => setShowImageGenerator(false)}
 *       />
 *     </>
 *   );
 * }
 */

