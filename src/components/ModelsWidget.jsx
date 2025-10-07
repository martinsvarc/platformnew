import { useState, useEffect } from 'react'
import { listModels, createModel, deleteModel, initializeDefaultModels } from '../api/models'
import { TEAM_ID } from '../api/config'
import { useConfirm } from '../hooks/useConfirm'

function ModelsWidget() {
  const { confirm, ConfirmDialog } = useConfirm()
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [newModelName, setNewModelName] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState('')

  const loadModels = async () => {
    if (!TEAM_ID) return
    setLoading(true)
    try {
      // Try to load existing models, or initialize with defaults if none exist
      let modelList = await listModels(TEAM_ID)
      if (modelList.length === 0) {
        modelList = await initializeDefaultModels(TEAM_ID)
      }
      setModels(modelList)
    } catch (err) {
      console.error('Failed to load models:', err)
      setError('Načtení modelek selhalo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadModels()
  }, [])

  const handleAddModel = async (e) => {
    e.preventDefault()
    if (!newModelName.trim()) return
    
    try {
      setError('')
      const newModel = await createModel(TEAM_ID, newModelName.trim())
      setModels(prev => [...prev, newModel])
      setNewModelName('')
      setShowAddForm(false)
    } catch (err) {
      console.error('Failed to create model:', err)
      setError('Přidání modelky selhalo - možná už existuje')
    }
  }

  const handleDeleteModel = async (modelId, modelName) => {
    const confirmed = await confirm(
      `Opravdu chcete odstranit modelku "${modelName}"?`,
      'Odstranit modelku'
    )
    if (!confirmed) return
    
    try {
      setError('')
      await deleteModel(modelId, TEAM_ID)
      setModels(prev => prev.filter(m => m.id !== modelId))
    } catch (err) {
      console.error('Failed to delete model:', err)
      setError('Odstranění modelky selhalo')
    }
  }

  if (loading) {
    return (
      <div className="unified-glass p-4">
        <h2 className="text-lg font-bold text-gradient-gold mb-3">Správa modelek</h2>
        <div className="text-pearl/70 text-center py-4">Načítání...</div>
      </div>
    )
  }

  return (
    <>
      <ConfirmDialog />
      <div className="unified-glass p-4">
        <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-gradient-gold">Správa modelek</h2>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1 rounded-lg bg-gradient-to-r from-neon-orchid to-crimson text-white text-sm font-semibold shadow-glow-purple hover:shadow-glow transition-all"
        >
          {showAddForm ? '✕ Zrušit' : '+ Přidat modelku'}
        </button>
      </div>

      {error && (
        <div className="mb-3 p-2 rounded-lg bg-crimson/20 border border-crimson/40 text-pearl text-sm">
          {error}
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAddModel} className="mb-3 p-3 rounded-lg bg-obsidian/60 border border-neon-orchid/30">
          <label className="block text-pearl/80 text-sm mb-2">Jméno nové modelky</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              placeholder="např. Isabella"
              className="flex-1 bg-obsidian border border-velvet-gray rounded-lg px-3 py-2 text-pearl placeholder-pearl/50 focus:border-neon-orchid focus:shadow-glow-purple outline-none"
              autoFocus
            />
            <button
              type="submit"
              disabled={!newModelName.trim()}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-orchid to-crimson text-white font-semibold shadow-glow-purple disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Přidat
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {models.length === 0 ? (
          <div className="text-pearl/70 text-center py-4">
            Žádné modelky. Klikněte na "+ Přidat modelku" pro vytvoření nové.
          </div>
        ) : (
          models.map((model) => (
            <div
              key={model.id}
              className="flex justify-between items-center p-3 rounded-lg bg-obsidian/40 border border-velvet-gray hover:border-neon-orchid/50 transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">👤</span>
                <span className="text-pearl font-medium">{model.name}</span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteModel(model.id, model.name)}
                className="px-3 py-1 rounded-lg bg-crimson/20 hover:bg-crimson/40 text-pearl text-sm font-medium transition-all"
                title="Odstranit modelku"
              >
                🗑️ Odstranit
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 text-pearl/60 text-xs">
        <p>💡 Tyto modelky se zobrazí při odesílání platby</p>
      </div>
      </div>
    </>
  )
}

export default ModelsWidget

