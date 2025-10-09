import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getTeamUsers, deleteUser, updateUser, confirmUser, declineUser, reset2FA } from '../api/queries'
import { TEAM_ID } from '../api/config'
import { useConfirm } from '../hooks/useConfirm'
import { useToast } from '../contexts/ToastContext'

function TeamMembersWidget() {
  const { t } = useTranslation()
  const { confirm, ConfirmDialog } = useConfirm()
  const { toast } = useToast()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingUserId, setEditingUserId] = useState(null)
  const [editedName, setEditedName] = useState('')

  const loadMembers = async () => {
    if (!TEAM_ID) return
    setLoading(true)
    try {
      const memberList = await getTeamUsers(TEAM_ID)
      setMembers(memberList)
    } catch (err) {
      console.error('Failed to load team members:', err)
      setError('Načtení členů týmu selhalo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [])

  const handleEditMember = (userId, currentName) => {
    setEditingUserId(userId)
    setEditedName(currentName || '')
  }

  const handleCancelEdit = () => {
    setEditingUserId(null)
    setEditedName('')
  }

  const handleSaveName = async (userId) => {
    try {
      setError('')
      const updatedUser = await updateUser(userId, TEAM_ID, { display_name: editedName })
      if (updatedUser) {
        setMembers(prev => prev.map(m => m.id === userId ? updatedUser : m))
      }
      setEditingUserId(null)
      setEditedName('')
    } catch (err) {
      console.error('Failed to update user name:', err)
      setError('Změna jména selhala')
    }
  }

  const handleDeleteMember = async (userId, displayName, username) => {
    const memberName = displayName || username
    const confirmed = await confirm(
      `Opravdu chcete odstranit člena týmu "${memberName}"?`,
      'Odstranit člena'
    )
    if (!confirmed) return
    
    try {
      setError('')
      await deleteUser(userId, TEAM_ID)
      setMembers(prev => prev.filter(m => m.id !== userId))
    } catch (err) {
      console.error('Failed to delete team member:', err)
      setError('Odstranění člena selhalo')
    }
  }

  const handleConfirmMember = async (userId, displayName, username) => {
    const memberName = displayName || username
    const confirmed = await confirm(
      `Schválit člena týmu "${memberName}"?`,
      'Schválit člena'
    )
    if (!confirmed) return
    
    try {
      setError('')
      const updatedUser = await confirmUser(userId, TEAM_ID)
      if (updatedUser) {
        setMembers(prev => prev.map(m => m.id === userId ? updatedUser : m))
      }
    } catch (err) {
      console.error('Failed to confirm team member:', err)
      setError('Schválení člena selhalo')
    }
  }

  const handleDeclineMember = async (userId, displayName, username) => {
    const memberName = displayName || username
    const confirmed = await confirm(
      `Zamítnout žádost člena "${memberName}"?`,
      'Zamítnout člena'
    )
    if (!confirmed) return
    
    try {
      setError('')
      await declineUser(userId, TEAM_ID)
      setMembers(prev => prev.filter(m => m.id !== userId))
    } catch (err) {
      console.error('Failed to decline team member:', err)
      setError('Zamítnutí člena selhalo')
    }
  }

  const handleReset2FA = async (userId, displayName, username) => {
    const memberName = displayName || username
    const confirmed = await confirm(
      `Resetovat 2FA (PIN/Touch ID) pro "${memberName}"? Uživatel bude muset nastavit 2FA znovu při příštím přihlášení.`,
      'Resetovat 2FA'
    )
    if (!confirmed) return
    
    try {
      setError('')
      const updatedUser = await reset2FA(userId, TEAM_ID)
      if (updatedUser) {
        setMembers(prev => prev.map(m => m.id === userId ? updatedUser : m))
        toast.success(`2FA pro uživatele "${memberName}" bylo resetováno`)
      }
    } catch (err) {
      console.error('Failed to reset 2FA:', err)
      setError('Resetování 2FA selhalo')
      toast.error('Resetování 2FA selhalo')
    }
  }

  const getRoleBadge = (role) => {
    const badges = {
      admin: { text: 'Admin', color: 'bg-crimson/30 text-crimson border-crimson/50' },
      manager: { text: 'Manager', color: 'bg-neon-orchid/30 text-neon-orchid border-neon-orchid/50' },
      member: { text: 'Člen', color: 'bg-velvet-gray/30 text-pearl/70 border-velvet-gray' }
    }
    const badge = badges[role] || badges.member
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${badge.color}`}>
        {badge.text}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="unified-glass p-4">
        <h2 className="text-lg font-bold text-gradient-gold mb-3">{t('admin.teamMembers')}</h2>
        <div className="text-pearl/70 text-center py-4">{t('common.loading')}</div>
      </div>
    )
  }

  // Separate pending and active members
  const pendingMembers = members.filter(m => m.status === 'pending')
  const activeMembers = members.filter(m => m.status !== 'pending')

  return (
    <>
      <ConfirmDialog />
      <div className="unified-glass p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gradient-gold">{t('admin.teamMembers')}</h2>
          <div className="text-sm text-pearl/60">
            Celkem: {members.length} {pendingMembers.length > 0 && `(${pendingMembers.length} čeká na schválení)`}
          </div>
        </div>

        {error && (
          <div className="mb-3 p-2 rounded-lg bg-crimson/20 border border-crimson/40 text-pearl text-sm">
            {error}
          </div>
        )}

        {/* Pending Members Section */}
        {pendingMembers.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
              <span>⏳</span>
              <span>Čekají na schválení ({pendingMembers.length})</span>
            </h3>
            <div className="space-y-2">
              {pendingMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex justify-between items-center p-3 rounded-lg bg-yellow-500/10 border-2 border-yellow-500/50 hover:border-yellow-500/70 transition-all"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {member.avatar_url ? (
                      <img 
                        src={member.avatar_url} 
                        alt={member.display_name || member.username}
                        className="w-10 h-10 rounded-full object-cover border-2 border-yellow-500/50"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold">
                        {(member.display_name || member.username).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-pearl font-medium">
                        {member.display_name || member.username}
                      </div>
                      <div className="text-pearl/60 text-sm">
                        @{member.username}
                        {member.email && ` • ${member.email}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(member.role)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <button
                      type="button"
                      onClick={() => handleConfirmMember(member.id, member.display_name, member.username)}
                      className="px-3 py-1 rounded-lg bg-green-500/20 hover:bg-green-500/40 text-green-400 text-sm font-medium transition-all border border-green-500/50"
                      title="Schválit člena"
                    >
                      ✓ Schválit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeclineMember(member.id, member.display_name, member.username)}
                      className="px-3 py-1 rounded-lg bg-crimson/20 hover:bg-crimson/40 text-pearl text-sm font-medium transition-all"
                      title="Zamítnout člena"
                    >
                      ✕ Zamítnout
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Members Section */}
        <div className="space-y-2">
          {activeMembers.length > 0 && pendingMembers.length > 0 && (
            <h3 className="text-sm font-semibold text-pearl/70 mb-2">
              Aktivní členové ({activeMembers.length})
            </h3>
          )}
          {members.length === 0 ? (
            <div className="text-pearl/70 text-center py-4">
              Žádní členové týmu.
            </div>
          ) : activeMembers.length === 0 && pendingMembers.length > 0 ? (
            <div className="text-pearl/70 text-center py-4">
              Žádní aktivní členové.
            </div>
          ) : (
            activeMembers.map((member) => (
              <div
                key={member.id}
                className="flex justify-between items-center p-3 rounded-lg bg-obsidian/40 border border-velvet-gray hover:border-neon-orchid/50 transition-all"
              >
                <div className="flex items-center gap-3 flex-1">
                  {member.avatar_url ? (
                    <img 
                      src={member.avatar_url} 
                      alt={member.display_name || member.username}
                      className="w-10 h-10 rounded-full object-cover border-2 border-neon-orchid/50"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-orchid to-crimson flex items-center justify-center text-white font-bold">
                      {(member.display_name || member.username).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    {editingUserId === member.id ? (
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveName(member.id)
                          } else if (e.key === 'Escape') {
                            handleCancelEdit()
                          }
                        }}
                        className="w-full bg-obsidian border border-neon-orchid rounded-lg px-3 py-1 text-pearl focus:border-neon-orchid focus:shadow-glow-purple outline-none"
                        placeholder="Jméno uživatele"
                        autoFocus
                      />
                    ) : (
                      <>
                        <div className="text-pearl font-medium">
                          {member.display_name || member.username}
                        </div>
                        <div className="text-pearl/60 text-sm">
                          @{member.username}
                          {member.email && ` • ${member.email}`}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(member.role)}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  {editingUserId === member.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSaveName(member.id)}
                        className="px-3 py-1 rounded-lg bg-gradient-to-r from-neon-orchid to-crimson text-white text-sm font-medium hover:shadow-glow-purple transition-all"
                        title="Uložit"
                      >
                        ✓ Uložit
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-3 py-1 rounded-lg bg-velvet-gray/40 hover:bg-velvet-gray/60 text-pearl text-sm font-medium transition-all"
                        title="Zrušit"
                      >
                        ✕ Zrušit
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleEditMember(member.id, member.display_name)}
                        className="px-3 py-1 rounded-lg bg-neon-orchid/20 hover:bg-neon-orchid/40 text-pearl text-sm font-medium transition-all"
                        title="Upravit jméno"
                      >
                        ✏️ Upravit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReset2FA(member.id, member.display_name, member.username)}
                        className="px-3 py-1 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 text-sm font-medium transition-all border border-yellow-500/50"
                        title="Resetovat 2FA (PIN/Touch ID)"
                      >
                        🔐 Reset 2FA
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(member.id, member.display_name, member.username)}
                        className="px-3 py-1 rounded-lg bg-crimson/20 hover:bg-crimson/40 text-pearl text-sm font-medium transition-all"
                        title="Odstranit člena"
                      >
                        🗑️ Odstranit
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-3 text-pearl/60 text-xs space-y-1">
          <p>💡 Noví členové musí být schváleni před přihlášením do platformy</p>
          <p>💡 Odstranění člena nezmaže jejich data, pouze je deaktivuje</p>
        </div>
      </div>
    </>
  )
}

export default TeamMembersWidget

