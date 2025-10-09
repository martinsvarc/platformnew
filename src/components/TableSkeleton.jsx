import { useTranslation } from 'react-i18next'

function TableSkeleton({ rows = 5, columns = 6, type = 'default' }) {
  const { t } = useTranslation()
  // Subtle shimmer effect classes
  const shimmerClasses = 'relative overflow-hidden rounded bg-gradient-to-r from-charcoal/15 via-velvet-gray/20 to-charcoal/15'
  
  // Shimmer animation overlay - subtle and smooth
  const ShimmerOverlay = () => (
    <div 
      className="absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]"
      style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(218, 112, 214, 0.06) 30%, rgba(255, 215, 0, 0.06) 50%, rgba(218, 112, 214, 0.06) 70%, transparent 100%)',
        backgroundSize: '200% 100%'
      }}
    />
  )
  
  if (type === 'clients') {
    return (
      <div className="overflow-x-auto unified-glass animate-fade-in">
        <table className="w-full text-left text-sm text-pearl">
          <thead className="text-pearl/80 sticky top-0 bg-charcoal z-10">
            <tr className="border-b border-velvet-gray">
              <th className="p-3 bg-charcoal">{t('clients.clientName')}</th>
              <th className="p-3 bg-charcoal">{t('clients.payout')}</th>
              <th className="p-3 bg-charcoal">{t('common.notes')}</th>
              <th className="p-3 bg-charcoal">Chatter</th>
              <th className="p-3 text-center bg-charcoal">Email</th>
              <th className="p-3 text-center bg-charcoal">Telefon</th>
              <th className="p-3 bg-charcoal">Kdy naposledy poslal?</th>
              <th className="p-3 bg-charcoal">Dnes</th>
              <th className="p-3 bg-charcoal">Past 30 Days</th>
              <th className="p-3 bg-charcoal">Total</th>
              <th className="p-3 bg-charcoal">Banks</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr 
                key={i} 
                className="border-b border-velvet-gray/60 animate-fade-in"
                style={{ animationDelay: `${i * 0.02}s`, animationFillMode: 'backwards' }}
              >
                <td className="p-3">
                  <div className={`${shimmerClasses} h-4 w-24`} style={{ animationDelay: `${i * 0.02}s` }}>
                    <ShimmerOverlay />
                  </div>
                </td>
                <td className="p-3">
                  <div className={`${shimmerClasses} h-8 w-16 rounded-md`} style={{ animationDelay: `${i * 0.02 + 0.02}s` }}>
                    <ShimmerOverlay />
                  </div>
                </td>
                <td className="p-3">
                  <div className={`${shimmerClasses} h-8 w-20 rounded-md`} style={{ animationDelay: `${i * 0.02 + 0.03}s` }}>
                    <ShimmerOverlay />
                  </div>
                </td>
                <td className="p-3">
                  <div className={`${shimmerClasses} h-4 w-20`} style={{ animationDelay: `${i * 0.02 + 0.04}s` }}>
                    <ShimmerOverlay />
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div className={`${shimmerClasses} h-9 w-9 rounded-full mx-auto shadow-[0_0_6px_rgba(218,112,214,0.06)]`} style={{ animationDelay: `${i * 0.02 + 0.05}s` }}>
                    <ShimmerOverlay />
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div className={`${shimmerClasses} h-9 w-9 rounded-full mx-auto shadow-[0_0_6px_rgba(218,112,214,0.06)]`} style={{ animationDelay: `${i * 0.02 + 0.06}s` }}>
                    <ShimmerOverlay />
                  </div>
                </td>
                <td className="p-3">
                  <div className={`${shimmerClasses} h-6 w-20 rounded-md`} style={{ animationDelay: `${i * 0.02 + 0.07}s` }}>
                    <ShimmerOverlay />
                  </div>
                </td>
                <td className="p-3">
                  <div className={`${shimmerClasses} h-6 w-24 rounded-md`} style={{ animationDelay: `${i * 0.02 + 0.08}s` }}>
                    <ShimmerOverlay />
                  </div>
                </td>
                <td className="p-3">
                  <div className={`${shimmerClasses} h-6 w-24 rounded-md`} style={{ animationDelay: `${i * 0.02 + 0.09}s` }}>
                    <ShimmerOverlay />
                  </div>
                </td>
                <td className="p-3">
                  <div className={`${shimmerClasses} h-6 w-24 rounded-md`} style={{ animationDelay: `${i * 0.02 + 0.1}s` }}>
                    <ShimmerOverlay />
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div className={`${shimmerClasses} h-9 w-9 rounded-full mx-auto shadow-[0_0_6px_rgba(218,112,214,0.06)]`} style={{ animationDelay: `${i * 0.02 + 0.11}s` }}>
                    <ShimmerOverlay />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  
  if (type === 'payments') {
    return (
      <div className="overflow-x-auto unified-glass animate-fade-in">
        <table className="w-full text-left text-sm text-pearl">
          <thead className="text-pearl/80">
            <tr className="border-b border-velvet-gray">
              <th className="p-3">Datum</th>
              <th className="p-3">Částka</th>
              <th className="p-3">Klient</th>
              <th className="p-3">Chatter</th>
              <th className="p-3">Co se prodalo</th>
              <th className="p-3">Platforma</th>
              <th className="p-3">Modelka</th>
              <th className="p-3">Banka</th>
              <th className="p-3">Přišlo</th>
              <th className="p-3">Doručeno</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr 
                key={i} 
                className="border-b border-velvet-gray/60 animate-fade-in"
                style={{ animationDelay: `${i * 0.02}s`, animationFillMode: 'backwards' }}
              >
                <td className="p-3">
                  <div className={`${shimmerClasses} h-4 w-20`} style={{ animationDelay: `${i * 0.05}s` }}>
                    <ShimmerOverlay />
                  </div>
                </td>
                <td className="p-3">
                  <div className={`${shimmerClasses} h-4 w-24`} style={{ animationDelay: `${i * 0.05 + 0.05}s` }}>
                    <ShimmerOverlay />
                  </div>
                </td>
                <td className="p-3">
                  <div className={`${shimmerClasses} h-4 w-20`} style={{ animationDelay: `${i * 0.02 + 0.02}s` }}>
                    <ShimmerOverlay />
                  </div>
                </td>
                <td className="p-3">
                  <div className={`${shimmerClasses} h-4 w-16`} style={{ animationDelay: `${i * 0.02 + 0.03}s` }}>
                    <ShimmerOverlay />
                  </div>
                </td>
                <td className="p-3">
                  <div className={`${shimmerClasses} h-4 w-24`} style={{ animationDelay: `${i * 0.02 + 0.04}s` }}>
                    <ShimmerOverlay />
                  </div>
                </td>
                <td className="p-3">
                  <div className={`${shimmerClasses} h-4 w-16`} style={{ animationDelay: `${i * 0.02 + 0.05}s` }}>
                    <ShimmerOverlay />
                  </div>
                </td>
                <td className="p-3">
                  <div className={`${shimmerClasses} h-4 w-16`} style={{ animationDelay: `${i * 0.02 + 0.06}s` }}>
                    <ShimmerOverlay />
                  </div>
                </td>
                <td className="p-3">
                  <div className={`${shimmerClasses} h-4 w-16`} style={{ animationDelay: `${i * 0.02 + 0.07}s` }}>
                    <ShimmerOverlay />
                  </div>
                </td>
                <td className="p-3">
                  <div className={`${shimmerClasses} h-4 w-4 rounded shadow-[0_0_4px_rgba(218,112,214,0.06)]`} style={{ animationDelay: `${i * 0.02 + 0.08}s` }}>
                    <ShimmerOverlay />
                  </div>
                </td>
                <td className="p-3">
                  <div className={`${shimmerClasses} h-4 w-4 rounded shadow-[0_0_4px_rgba(255,215,0,0.06)]`} style={{ animationDelay: `${i * 0.02 + 0.09}s` }}>
                    <ShimmerOverlay />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  
  // Default skeleton
  return (
    <div className="overflow-x-auto unified-glass animate-fade-in">
      <table className="w-full text-left text-sm text-pearl">
        <thead className="text-pearl/80">
          <tr className="border-b border-velvet-gray">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-3">
                <div className={`${shimmerClasses} h-4 w-20`} style={{ animationDelay: `${i * 0.05}s` }}>
                  <ShimmerOverlay />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr 
              key={i} 
              className="border-b border-velvet-gray/60 animate-fade-in"
              style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'backwards' }}
            >
              {Array.from({ length: columns }).map((_, j) => (
                <td key={j} className="p-3">
                  <div className={`${shimmerClasses} h-4 w-20`} style={{ animationDelay: `${(i * 0.05) + (j * 0.02)}s` }}>
                    <ShimmerOverlay />
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TableSkeleton
