import { useState, useEffect } from 'react'
import { TEAM_ID } from '../api/config'
import { 
  listBookmarkTables, 
  createBookmarkTable, 
  updateBookmarkTable, 
  deleteBookmarkTable,
  listBookmarks,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  updateBookmarkPosition
} from '../api/bookmarks'
import { initBookmarkTables } from '../api/init-bookmarks'
import { useConfirm } from '../hooks/useConfirm'
import { useToast } from '../contexts/ToastContext'

// Compact bookmark table card component
function BookmarkTableCard({ table, onEdit, onDelete, onAddBookmark }) {
  const { confirm } = useConfirm()
  const { toast } = useToast()
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingBookmark, setEditingBookmark] = useState(null)
  const [bookmarkName, setBookmarkName] = useState('')
  const [bookmarkUrl, setBookmarkUrl] = useState('')
  const [bookmarkWidth, setBookmarkWidth] = useState(200)
  const [bookmarkHeight, setBookmarkHeight] = useState(150)

  useEffect(() => {
    loadBookmarks()
  }, [table.id])

  const loadBookmarks = async () => {
    try {
      const bookmarkList = await listBookmarks(TEAM_ID, table.id)
      setBookmarks(bookmarkList)
    } catch (error) {
      console.error('Error loading bookmarks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBookmark = async (bookmarkId) => {
    const confirmed = await confirm(
      'Opravdu chcete odstranit tuto záložku?',
      'Odstranit záložku'
    )
    if (!confirmed) return

    try {
      await deleteBookmark(bookmarkId)
      toast.success('Záložka byla úspěšně odstraněna')
      setBookmarks(bookmarks.filter(b => b.id !== bookmarkId))
    } catch (error) {
      console.error('Error deleting bookmark:', error)
    }
  }

  const startEditBookmark = (bookmark) => {
    setEditingBookmark(bookmark)
    setBookmarkName(bookmark.name)
    setBookmarkUrl(bookmark.url)
    setBookmarkWidth(bookmark.width)
    setBookmarkHeight(bookmark.height)
  }

  const handleUpdateBookmark = async (e) => {
    e.preventDefault()
    if (!bookmarkName.trim() || !bookmarkUrl.trim()) return

    try {
      const updatedBookmark = await updateBookmark(
        editingBookmark.id,
        bookmarkName.trim(),
        bookmarkUrl.trim(),
        bookmarkWidth,
        bookmarkHeight,
        editingBookmark.position_x || 0,
        editingBookmark.position_y || 0
      )
      setBookmarks(bookmarks.map(b => b.id === editingBookmark.id ? updatedBookmark : b))
      setBookmarkName('')
      setBookmarkUrl('')
      setBookmarkWidth(200)
      setBookmarkHeight(150)
      setEditingBookmark(null)
      toast.success('Záložka byla aktualizována')
    } catch (error) {
      console.error('Error updating bookmark:', error)
      toast.error('Chyba při aktualizaci záložky')
    }
  }

  return (
    <>
      <div className="unified-glass rounded-xl p-4 h-[400px] flex flex-col">
        {/* Table Header */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-velvet-gray/30">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 bg-gradient-to-r from-neon-orchid to-crimson rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📁</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-pearl text-sm truncate">{table.name}</h3>
              <p className="text-pearl/60 text-xs">
                {bookmarks.length} {bookmarks.length === 1 ? 'záložka' : bookmarks.length < 5 ? 'záložky' : 'záložek'}
              </p>
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => onAddBookmark(table)}
              className="p-1.5 text-pearl/70 hover:text-neon-orchid hover:bg-neon-orchid/20 rounded transition-all"
              title="Přidat záložku"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={() => onEdit(table)}
              className="p-1.5 text-pearl/70 hover:text-pearl hover:bg-neon-orchid/20 rounded transition-all"
              title="Upravit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(table.id)}
              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-all"
              title="Smazat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bookmarks List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse text-pearl/50">Načítání...</div>
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-pearl/50">
              <span className="text-2xl mb-2">🔖</span>
              <p className="text-xs text-center">Žádné záložky</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="bg-gradient-to-br from-obsidian/60 to-velvet-gray/40 rounded-xl border border-velvet-gray/30 hover:border-neon-orchid/30 hover:shadow-lg transition-all group relative"
                >
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 min-w-0 cursor-pointer"
                    title={bookmark.url}
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-neon-orchid to-crimson rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-base">🔖</span>
                    </div>
                    <h4 className="font-semibold text-pearl text-sm truncate flex-1">{bookmark.name}</h4>
                    <svg className="w-4 h-4 text-pearl/50 group-hover:text-neon-orchid transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 z-10">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        startEditBookmark(bookmark)
                      }}
                      className="p-1.5 text-pearl/70 hover:text-neon-orchid bg-obsidian/80 backdrop-blur-sm hover:bg-neon-orchid/20 rounded-lg transition-all shadow-lg"
                      title="Upravit"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDeleteBookmark(bookmark.id)
                      }}
                      className="p-1.5 text-pearl/70 hover:text-red-400 bg-obsidian/80 backdrop-blur-sm hover:bg-red-500/20 rounded-lg transition-all shadow-lg"
                      title="Smazat"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Bookmark Modal */}
      {editingBookmark && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-charcoal to-velvet-gray border border-neon-orchid/30 rounded-2xl p-8 w-[500px] shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-neon-orchid to-crimson rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🔖</span>
              </div>
              <h3 className="text-xl font-semibold text-gradient-primary">Upravit záložku</h3>
            </div>
            <form onSubmit={handleUpdateBookmark}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-pearl/70 mb-2">
                    Název záložky
                  </label>
                  <input
                    type="text"
                    value={bookmarkName}
                    onChange={(e) => setBookmarkName(e.target.value)}
                    placeholder="Zadejte název záložky"
                    className="w-full p-3 bg-obsidian border border-velvet-gray rounded-xl focus:ring-2 focus:ring-neon-orchid focus:border-transparent transition-all text-pearl placeholder-pearl/50 outline-none"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-pearl/70 mb-2">
                    URL
                  </label>
                  <input
                    type="url"
                    value={bookmarkUrl}
                    onChange={(e) => setBookmarkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full p-3 bg-obsidian border border-velvet-gray rounded-xl focus:ring-2 focus:ring-neon-orchid focus:border-transparent transition-all text-pearl placeholder-pearl/50 outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-pearl/70 mb-2">
                      Šířka (px)
                    </label>
                    <input
                      type="number"
                      value={bookmarkWidth}
                      onChange={(e) => setBookmarkWidth(parseInt(e.target.value) || 200)}
                      min="100"
                      max="800"
                      className="w-full p-3 bg-obsidian border border-velvet-gray rounded-xl focus:ring-2 focus:ring-neon-orchid focus:border-transparent transition-all text-pearl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pearl/70 mb-2">
                      Výška (px)
                    </label>
                    <input
                      type="number"
                      value={bookmarkHeight}
                      onChange={(e) => setBookmarkHeight(parseInt(e.target.value) || 150)}
                      min="100"
                      max="600"
                      className="w-full p-3 bg-obsidian border border-velvet-gray rounded-xl focus:ring-2 focus:ring-neon-orchid focus:border-transparent transition-all text-pearl outline-none"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-neon-orchid to-crimson text-white py-3 px-4 rounded-xl hover:shadow-glow-purple transition-all duration-200 font-medium smooth-hover"
                >
                  Uložit změny
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingBookmark(null)
                    setBookmarkName('')
                    setBookmarkUrl('')
                    setBookmarkWidth(200)
                    setBookmarkHeight(150)
                  }}
                  className="flex-1 bg-velvet-gray text-pearl py-3 px-4 rounded-xl hover:bg-velvet-gray/80 transition-colors font-medium"
                >
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function Zalozky() {
  const { confirm, ConfirmDialog } = useConfirm()
  const { toast } = useToast()
  const [bookmarkTables, setBookmarkTables] = useState([])
  const [currentTable, setCurrentTable] = useState(null)
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateTable, setShowCreateTable] = useState(false)
  const [showCreateBookmark, setShowCreateBookmark] = useState(false)
  const [editingTable, setEditingTable] = useState(null)
  const [editingBookmark, setEditingBookmark] = useState(null)

  // Form states
  const [tableName, setTableName] = useState('')
  const [bookmarkName, setBookmarkName] = useState('')
  const [bookmarkUrl, setBookmarkUrl] = useState('')
  const [bookmarkWidth, setBookmarkWidth] = useState(200)
  const [bookmarkHeight, setBookmarkHeight] = useState(150)

  useEffect(() => {
    loadBookmarkTables()
  }, [])

  useEffect(() => {
    if (currentTable) {
      loadBookmarks(currentTable.id)
    }
  }, [currentTable])

  const loadBookmarkTables = async () => {
    try {
      console.log('Loading bookmark tables for team:', TEAM_ID)
      
      // Try to initialize tables first
      await initBookmarkTables()
      
      const tables = await listBookmarkTables(TEAM_ID)
      console.log('Loaded tables:', tables)
      setBookmarkTables(tables)
      if (tables.length > 0 && !currentTable) {
        setCurrentTable(tables[0])
      }
    } catch (error) {
      console.error('Error loading bookmark tables:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadBookmarks = async (tableId) => {
    try {
      const bookmarkList = await listBookmarks(TEAM_ID, tableId)
      setBookmarks(bookmarkList)
    } catch (error) {
      console.error('Error loading bookmarks:', error)
    }
  }

  const handleCreateTable = async (e) => {
    e.preventDefault()
    if (!tableName.trim()) return

    try {
      const newTable = await createBookmarkTable(TEAM_ID, tableName.trim())
      setBookmarkTables([newTable, ...bookmarkTables])
      setCurrentTable(newTable)
      setTableName('')
      setShowCreateTable(false)
    } catch (error) {
      console.error('Error creating bookmark table:', error)
    }
  }

  const handleUpdateTable = async (e) => {
    e.preventDefault()
    if (!tableName.trim()) return

    try {
      const updatedTable = await updateBookmarkTable(editingTable.id, tableName.trim())
      setBookmarkTables(bookmarkTables.map(t => t.id === editingTable.id ? updatedTable : t))
      setCurrentTable(updatedTable)
      setTableName('')
      setEditingTable(null)
    } catch (error) {
      console.error('Error updating bookmark table:', error)
    }
  }

  const handleDeleteTable = async (tableId) => {
    const confirmed = await confirm(
      'Opravdu chcete odstranit tuto tabulku záložek?',
      'Odstranit tabulku'
    )
    if (!confirmed) return

    try {
      await deleteBookmarkTable(tableId)
      toast.success('Tabulka byla úspěšně odstraněna')
      setBookmarkTables(bookmarkTables.filter(t => t.id !== tableId))
      if (currentTable?.id === tableId) {
        const remainingTables = bookmarkTables.filter(t => t.id !== tableId)
        setCurrentTable(remainingTables.length > 0 ? remainingTables[0] : null)
      }
    } catch (error) {
      console.error('Error deleting bookmark table:', error)
    }
  }

  const handleCreateBookmark = async (e) => {
    e.preventDefault()
    if (!bookmarkName.trim() || !bookmarkUrl.trim()) return

    try {
      const newBookmark = await createBookmark(
        TEAM_ID, 
        currentTable.id, 
        bookmarkName.trim(), 
        bookmarkUrl.trim(),
        bookmarkWidth,
        bookmarkHeight,
        0, // position_x
        0  // position_y
      )
      setBookmarks([...bookmarks, newBookmark])
      setBookmarkName('')
      setBookmarkUrl('')
      setBookmarkWidth(200)
      setBookmarkHeight(150)
      setShowCreateBookmark(false)
    } catch (error) {
      console.error('Error creating bookmark:', error)
    }
  }

  const handleUpdateBookmark = async (e) => {
    e.preventDefault()
    if (!bookmarkName.trim() || !bookmarkUrl.trim()) return

    try {
      const updatedBookmark = await updateBookmark(
        editingBookmark.id,
        bookmarkName.trim(),
        bookmarkUrl.trim(),
        bookmarkWidth,
        bookmarkHeight,
        editingBookmark.position_x || 0,
        editingBookmark.position_y || 0
      )
      setBookmarks(bookmarks.map(b => b.id === editingBookmark.id ? updatedBookmark : b))
      setBookmarkName('')
      setBookmarkUrl('')
      setBookmarkWidth(200)
      setBookmarkHeight(150)
      setEditingBookmark(null)
    } catch (error) {
      console.error('Error updating bookmark:', error)
    }
  }

  const handleDeleteBookmark = async (bookmarkId) => {
    const confirmed = await confirm(
      'Opravdu chcete odstranit tuto záložku?',
      'Odstranit záložku'
    )
    if (!confirmed) return

    try {
      await deleteBookmark(bookmarkId)
      toast.success('Záložka byla úspěšně odstraněna')
      setBookmarks(bookmarks.filter(b => b.id !== bookmarkId))
    } catch (error) {
      console.error('Error deleting bookmark:', error)
    }
  }


  const startEditTable = (table) => {
    setEditingTable(table)
    setTableName(table.name)
  }

  const startEditBookmark = (bookmark) => {
    setEditingBookmark(bookmark)
    setBookmarkName(bookmark.name)
    setBookmarkUrl(bookmark.url)
    setBookmarkWidth(bookmark.width)
    setBookmarkHeight(bookmark.height)
  }

  if (loading) {
    return (
      <div className="min-h-screen p-3 sm:p-4 md:p-6 lg:ml-64">
        <div className="max-w-[1920px] mx-auto">
          {/* Header Skeleton */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <div className="text-center mb-6 animate-pulse">
              <div className="h-10 bg-gradient-to-r from-charcoal/20 via-velvet-gray/30 to-charcoal/20 rounded-lg w-48 mx-auto mb-2"></div>
              <div className="h-6 bg-gradient-to-r from-charcoal/20 via-velvet-gray/30 to-charcoal/20 rounded-lg w-64 mx-auto"></div>
            </div>
            <div className="flex justify-center mb-6">
              <div className="animate-pulse">
                <div className="h-12 bg-gradient-to-r from-charcoal/20 via-velvet-gray/30 to-charcoal/20 rounded-xl w-40"></div>
              </div>
            </div>
          </div>
          
          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="unified-glass rounded-xl p-4 h-[400px] flex flex-col animate-pulse">
                {/* Card Header Skeleton */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-velvet-gray/30">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-8 h-8 bg-gradient-to-r from-charcoal/20 via-velvet-gray/30 to-charcoal/20 rounded-lg flex-shrink-0"></div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-4 bg-gradient-to-r from-charcoal/20 via-velvet-gray/30 to-charcoal/20 rounded w-32"></div>
                      <div className="h-3 bg-gradient-to-r from-charcoal/20 via-velvet-gray/30 to-charcoal/20 rounded w-20"></div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <div className="w-6 h-6 bg-gradient-to-r from-charcoal/20 via-velvet-gray/30 to-charcoal/20 rounded"></div>
                    <div className="w-6 h-6 bg-gradient-to-r from-charcoal/20 via-velvet-gray/30 to-charcoal/20 rounded"></div>
                    <div className="w-6 h-6 bg-gradient-to-r from-charcoal/20 via-velvet-gray/30 to-charcoal/20 rounded"></div>
                  </div>
                </div>
                
                {/* Bookmarks Skeleton */}
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="bg-obsidian/40 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-charcoal/20 via-velvet-gray/30 to-charcoal/20 rounded-lg flex-shrink-0"></div>
                      <div className="h-4 bg-gradient-to-r from-charcoal/20 via-velvet-gray/30 to-charcoal/20 rounded flex-1"></div>
                      <div className="w-4 h-4 bg-gradient-to-r from-charcoal/20 via-velvet-gray/30 to-charcoal/20 rounded flex-shrink-0"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    )
  }

  // Debug info
  console.log('Zalozky render state:', {
    loading,
    bookmarkTables,
    currentTable,
    bookmarks
  })

  return (
    <>
      <ConfirmDialog />
      <div className="min-h-screen p-3 sm:p-4 md:p-6 lg:ml-64">
        <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gradient-primary mb-2">Záložky</h1>
            <p className="text-pearl/70 text-lg">Spravujte své záložky a odkazy</p>
          </div>
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setShowCreateTable(true)}
              className="bg-gradient-to-r from-neon-orchid to-crimson text-white px-6 py-3 rounded-xl hover:shadow-glow-purple transition-all duration-200 shadow-lg smooth-hover"
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">+</span>
                Nová tabulka
              </span>
            </button>
          </div>

          {/* Create/Edit Table Modal */}
          {(showCreateTable || editingTable) && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-gradient-to-br from-charcoal to-velvet-gray border border-neon-orchid/30 rounded-2xl p-8 w-96 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-neon-orchid to-crimson rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl">📁</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gradient-primary">
                    {editingTable ? 'Upravit tabulku' : 'Nová tabulka'}
                  </h3>
                </div>
                <form onSubmit={editingTable ? handleUpdateTable : handleCreateTable}>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-pearl/70 mb-2">
                      Název tabulky
                    </label>
                    <input
                      type="text"
                      value={tableName}
                      onChange={(e) => setTableName(e.target.value)}
                      placeholder="Zadejte název tabulky"
                      className="w-full p-3 bg-obsidian border border-velvet-gray rounded-xl focus:ring-2 focus:ring-neon-orchid focus:border-transparent transition-all text-pearl placeholder-pearl/50 outline-none"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-neon-orchid to-crimson text-white py-3 px-4 rounded-xl hover:shadow-glow-purple transition-all duration-200 font-medium smooth-hover"
                    >
                      {editingTable ? 'Uložit změny' : 'Vytvořit tabulku'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateTable(false)
                        setEditingTable(null)
                        setTableName('')
                      }}
                      className="flex-1 bg-velvet-gray text-pearl py-3 px-4 rounded-xl hover:bg-velvet-gray/80 transition-colors font-medium"
                    >
                      Zrušit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* No Tables Message */}
        {!loading && bookmarkTables.length === 0 && (
          <div className="unified-glass rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-neon-orchid to-crimson rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">📁</span>
            </div>
            <h2 className="text-3xl font-bold text-gradient-primary mb-4">Žádné záložkové tabulky</h2>
            <p className="text-pearl/70 text-lg mb-8 max-w-md mx-auto">
              Vytvořte svou první tabulku záložek a začněte organizovat své odkazy
            </p>
            <button
              onClick={() => setShowCreateTable(true)}
              className="bg-gradient-to-r from-neon-orchid to-crimson text-white px-8 py-4 rounded-xl hover:shadow-glow-purple transition-all duration-200 font-medium shadow-lg smooth-hover"
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">+</span>
                Vytvořit první tabulku
              </span>
            </button>
          </div>
        )}

        {/* Grid of All Tables */}
        {bookmarkTables.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {bookmarkTables.map((table) => (
              <BookmarkTableCard
                key={table.id}
                table={table}
                onEdit={startEditTable}
                onDelete={handleDeleteTable}
                onAddBookmark={(table) => {
                  setCurrentTable(table)
                  setShowCreateBookmark(true)
                }}
              />
            ))}
          </div>
        )}

        {/* Create/Edit Bookmark Modal */}
        {(showCreateBookmark || editingBookmark) && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-charcoal to-velvet-gray border border-neon-orchid/30 rounded-2xl p-8 w-[500px] shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-neon-orchid to-crimson rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">🔖</span>
                </div>
                <h3 className="text-xl font-semibold text-gradient-primary">
                  {editingBookmark ? 'Upravit záložku' : 'Nová záložka'}
                </h3>
              </div>
              <form onSubmit={editingBookmark ? handleUpdateBookmark : handleCreateBookmark}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-pearl/70 mb-2">
                      Název záložky
                    </label>
                    <input
                      type="text"
                      value={bookmarkName}
                      onChange={(e) => setBookmarkName(e.target.value)}
                      placeholder="Zadejte název záložky"
                      className="w-full p-3 bg-obsidian border border-velvet-gray rounded-xl focus:ring-2 focus:ring-neon-orchid focus:border-transparent transition-all text-pearl placeholder-pearl/50 outline-none"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-pearl/70 mb-2">
                      URL
                    </label>
                    <input
                      type="url"
                      value={bookmarkUrl}
                      onChange={(e) => setBookmarkUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full p-3 bg-obsidian border border-velvet-gray rounded-xl focus:ring-2 focus:ring-neon-orchid focus:border-transparent transition-all text-pearl placeholder-pearl/50 outline-none"
                    />
                  </div>
                  
                  {editingBookmark && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-pearl/70 mb-2">
                          Šířka (px)
                        </label>
                        <input
                          type="number"
                          value={bookmarkWidth}
                          onChange={(e) => setBookmarkWidth(parseInt(e.target.value) || 200)}
                          min="100"
                          max="800"
                          className="w-full p-3 bg-obsidian border border-velvet-gray rounded-xl focus:ring-2 focus:ring-neon-orchid focus:border-transparent transition-all text-pearl outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-pearl/70 mb-2">
                          Výška (px)
                        </label>
                        <input
                          type="number"
                          value={bookmarkHeight}
                          onChange={(e) => setBookmarkHeight(parseInt(e.target.value) || 150)}
                          min="100"
                          max="600"
                          className="w-full p-3 bg-obsidian border border-velvet-gray rounded-xl focus:ring-2 focus:ring-neon-orchid focus:border-transparent transition-all text-pearl outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 mt-8">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-neon-orchid to-crimson text-white py-3 px-4 rounded-xl hover:shadow-glow-purple transition-all duration-200 font-medium smooth-hover"
                  >
                    {editingBookmark ? 'Uložit změny' : 'Vytvořit záložku'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateBookmark(false)
                      setEditingBookmark(null)
                      setBookmarkName('')
                      setBookmarkUrl('')
                      setBookmarkWidth(200)
                      setBookmarkHeight(150)
                    }}
                    className="flex-1 bg-velvet-gray text-pearl py-3 px-4 rounded-xl hover:bg-velvet-gray/80 transition-colors font-medium"
                  >
                    Zrušit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  )
}

export default Zalozky
