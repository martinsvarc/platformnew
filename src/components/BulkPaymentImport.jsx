import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { parseTSVData, bulkImportPayments, previewImport } from '../api/bulkImport'
import { TEAM_ID } from '../api/config'

function BulkPaymentImport() {
  const { t } = useTranslation()
  const [tsvInput, setTsvInput] = useState('')
  const [preview, setPreview] = useState(null)
  const [parseErrors, setParseErrors] = useState([])
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  const formatCurrency = (amount) => 
    new Intl.NumberFormat('cs-CZ', { 
      style: 'currency', 
      currency: 'CZK', 
      maximumFractionDigits: 0 
    }).format(amount)

  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('cs-CZ')
  }

  const handleParse = async () => {
    if (!tsvInput.trim()) {
      setParseErrors(['Zadejte data pro import'])
      return
    }

    try {
      const { parsed, errors } = parseTSVData(tsvInput)
      
      setParseErrors(errors)
      
      if (parsed.length > 0 && errors.length === 0) {
        // Generate preview
        const previewData = await previewImport(TEAM_ID, parsed)
        setPreview({ ...previewData, parsedData: parsed })
        setShowPreview(true)
      } else if (parsed.length === 0) {
        setPreview(null)
        setShowPreview(false)
      }
    } catch (err) {
      console.error('Parse error:', err)
      setParseErrors([err.message])
      setPreview(null)
      setShowPreview(false)
    }
  }

  const handleImport = async () => {
    if (!preview || !preview.parsedData) {
      return
    }

    setImporting(true)
    setImportResults(null)

    try {
      const results = await bulkImportPayments(TEAM_ID, preview.parsedData)
      setImportResults(results)
      
      if (results.successful > 0) {
        // Clear form on success
        setTimeout(() => {
          setTsvInput('')
          setPreview(null)
          setShowPreview(false)
          setParseErrors([])
          setImportResults(null)
        }, 5000)
      }
    } catch (err) {
      console.error('Import error:', err)
      setImportResults({
        successful: 0,
        failed: preview.parsedData.length,
        errors: [err.message],
        clientsCreated: 0,
        clientsFound: 0
      })
    } finally {
      setImporting(false)
    }
  }

  const handleReset = () => {
    setTsvInput('')
    setPreview(null)
    setShowPreview(false)
    setParseErrors([])
    setImportResults(null)
  }

  return (
    <div className="unified-glass p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gradient-gold mb-2">
        {t('admin.bulkImport')}
      </h2>
      <p className="text-pearl/70 text-xs sm:text-sm mb-4">
        Vložte data ve formátu: Datum (M/D/YYYY)  Jméno klienta  Částka  Je nový (yes/no)  Model
      </p>

      {/* Input Area */}
      <div className="mb-4">
        <label className="block text-pearl/80 text-sm mb-2">
          TSV Data (oddělené tabulátory)
        </label>
        <textarea
          value={tsvInput}
          onChange={(e) => setTsvInput(e.target.value)}
          placeholder="10/6/2025	Luděk Mora	300	no	NATÁLIE&#10;10/6/2025	Miroslav Čermák	400	no	NATÁLIE"
          className="w-full h-40 bg-obsidian border border-velvet-gray rounded-lg px-3 py-2 text-pearl text-sm font-mono focus:border-neon-orchid focus:shadow-glow-purple outline-none resize-y"
          disabled={importing}
        />
        <p className="text-pearl/50 text-xs mt-1">
          {tsvInput.split('\n').filter(l => l.trim()).length} řádků
        </p>
      </div>

      {/* Parse Errors */}
      {parseErrors.length > 0 && (
        <div className="mb-4 p-3 bg-crimson/10 border border-crimson/30 rounded-lg">
          <h3 className="text-crimson font-semibold text-sm mb-2">
            Chyby při parsování ({parseErrors.length})
          </h3>
          <ul className="text-pearl/80 text-xs space-y-1 max-h-32 overflow-y-auto">
            {parseErrors.map((err, idx) => (
              <li key={idx} className="font-mono">{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          type="button"
          onClick={handleParse}
          disabled={importing || !tsvInput.trim()}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Analyzovat data
        </button>

        {showPreview && preview && parseErrors.length === 0 && (
          <button
            type="button"
            onClick={handleImport}
            disabled={importing}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-electric-teal to-electric-cyan text-obsidian font-semibold shadow-glow-teal hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {importing ? 'Importuji...' : `Importovat ${preview.parsedData.length} plateb`}
          </button>
        )}

        {(showPreview || parseErrors.length > 0) && (
          <button
            type="button"
            onClick={handleReset}
            disabled={importing}
            className="px-4 py-2 rounded-lg bg-velvet-gray/50 text-pearl hover:bg-velvet-gray transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Reset
          </button>
        )}
      </div>

      {/* Preview */}
      {showPreview && preview && parseErrors.length === 0 && (
        <div className="space-y-4 mb-4">
          <div className="unified-card p-4 rounded-lg">
            <h3 className="text-pearl font-semibold mb-3">Náhled importu</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-pearl/60 text-xs">Plateb celkem</p>
                <p className="text-pearl font-bold text-lg">{preview.totalPayments}</p>
              </div>
              <div>
                <p className="text-pearl/60 text-xs">Celková částka</p>
                <p className="text-electric-cyan font-bold text-lg">{formatCurrency(preview.totalAmount)}</p>
              </div>
              <div>
                <p className="text-pearl/60 text-xs">Nových klientů</p>
                <p className="text-electric-teal font-bold text-lg">{preview.newClients}</p>
              </div>
              <div>
                <p className="text-pearl/60 text-xs">Existujících klientů</p>
                <p className="text-pearl/80 font-bold text-lg">{preview.existingClients}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-pearl/60 text-xs">Časové období</p>
              <p className="text-pearl text-sm">
                {formatDate(preview.dateRange.min)} – {formatDate(preview.dateRange.max)}
              </p>
            </div>

            {/* Model Breakdown */}
            <div>
              <p className="text-pearl/80 text-sm font-semibold mb-2">Rozpis podle modelu</p>
              <div className="space-y-2">
                {Object.entries(preview.modelBreakdown).map(([model, data]) => (
                  <div key={model} className="flex justify-between items-center text-sm">
                    <span className="text-pearl">{model}</span>
                    <div className="text-right">
                      <span className="text-pearl/80 mr-3">{data.count}×</span>
                      <span className="text-electric-cyan font-semibold">
                        {formatCurrency(data.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Client Breakdown */}
          <div className="unified-card p-4 rounded-lg">
            <h3 className="text-pearl font-semibold mb-3">Rozpis podle klienta</h3>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-xs text-pearl">
                <thead className="text-pearl/60 sticky top-0 bg-obsidian">
                  <tr className="border-b border-velvet-gray">
                    <th className="p-2 text-left">Klient</th>
                    <th className="p-2 text-center">Plateb</th>
                    <th className="p-2 text-right">Celkem</th>
                    <th className="p-2 text-center">Stav</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(preview.clientBreakdown)
                    .sort((a, b) => b[1].total - a[1].total) // Sort by total amount descending
                    .map(([key, data]) => (
                      <tr key={key} className="border-b border-velvet-gray/40 hover:bg-velvet-gray/20">
                        <td className="p-2">{data.name}</td>
                        <td className="p-2 text-center text-pearl/70">{data.count}×</td>
                        <td className="p-2 text-right font-semibold text-electric-cyan">
                          {formatCurrency(data.total)}
                        </td>
                        <td className="p-2 text-center">
                          {data.isNew ? (
                            <span className="text-electric-teal text-xs">Nový</span>
                          ) : (
                            <span className="text-pearl/40 text-xs">–</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <p className="text-pearl/50 text-xs mt-2">
              Celkem {Object.keys(preview.clientBreakdown).length} unikátních klientů
            </p>
          </div>

          {/* Sample preview of first 5 rows */}
          <div className="unified-card p-4 rounded-lg">
            <h3 className="text-pearl font-semibold mb-3">
              Ukázka prvních 5 záznamů
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-pearl">
                <thead className="text-pearl/60">
                  <tr className="border-b border-velvet-gray">
                    <th className="p-2 text-left">Datum</th>
                    <th className="p-2 text-left">Klient</th>
                    <th className="p-2 text-right">Částka</th>
                    <th className="p-2 text-center">Nový</th>
                    <th className="p-2 text-left">Model</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.parsedData.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="border-b border-velvet-gray/40">
                      <td className="p-2 whitespace-nowrap">{formatDate(row.date)}</td>
                      <td className="p-2">{row.clientName}</td>
                      <td className="p-2 text-right font-semibold">{formatCurrency(row.amount)}</td>
                      <td className="p-2 text-center">
                        {row.isNew ? (
                          <span className="text-electric-teal">✓</span>
                        ) : (
                          <span className="text-pearl/40">–</span>
                        )}
                      </td>
                      <td className="p-2">{row.modelName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.parsedData.length > 5 && (
              <p className="text-pearl/50 text-xs mt-2 text-center">
                ...a dalších {preview.parsedData.length - 5} záznamů
              </p>
            )}
          </div>
        </div>
      )}

      {/* Import Results */}
      {importResults && (
        <div className={`p-4 rounded-lg border ${
          importResults.successful > 0 && importResults.failed === 0
            ? 'bg-electric-teal/10 border-electric-teal/30'
            : importResults.failed > 0
            ? 'bg-crimson/10 border-crimson/30'
            : 'bg-velvet-gray/20 border-velvet-gray'
        }`}>
          <h3 className="text-pearl font-semibold text-sm mb-3">
            Výsledky importu
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-sm">
            <div>
              <p className="text-pearl/60 text-xs">Úspěšných</p>
              <p className="text-electric-teal font-bold text-lg">{importResults.successful}</p>
            </div>
            <div>
              <p className="text-pearl/60 text-xs">Chybných</p>
              <p className="text-crimson font-bold text-lg">{importResults.failed}</p>
            </div>
            <div>
              <p className="text-pearl/60 text-xs">Klientů vytvořeno</p>
              <p className="text-pearl font-bold text-lg">{importResults.clientsCreated}</p>
            </div>
            <div>
              <p className="text-pearl/60 text-xs">Klientů nalezeno</p>
              <p className="text-pearl/80 font-bold text-lg">{importResults.clientsFound}</p>
            </div>
          </div>

          {importResults.errors.length > 0 && (
            <div>
              <p className="text-crimson text-xs font-semibold mb-2">
                Chyby ({importResults.errors.length})
              </p>
              <ul className="text-pearl/80 text-xs space-y-1 max-h-32 overflow-y-auto">
                {importResults.errors.map((err, idx) => (
                  <li key={idx} className="font-mono">{err}</li>
                ))}
              </ul>
            </div>
          )}

          {importResults.successful > 0 && importResults.failed === 0 && (
            <p className="text-electric-teal text-sm mt-3">
              ✓ Import byl úspěšně dokončen! Formulář se za chvíli vymaže.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default BulkPaymentImport

