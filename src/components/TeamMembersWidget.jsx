import { useState, useEffect } from 'react'
import { getTeamUsers, deleteUser } from '../api/queries'
import { TEAM_ID } from '../api/config'
import { useConfirm } from '../hooks/useConfirm'

function TeamMembersWidget() {
  const { confirm, ConfirmDialog } = useConfirm()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
        <h2 className="text-lg font-bold text-gradient-gold mb-3">Členové týmu</h2>
        <div className="text-pearl/70 text-center py-4">Načítání...</div>
      </div>
    )
  }

  return (
    <>
      <ConfirmDialog />
      <div className="unified-glass p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gradient-gold">Členové týmu</h2>
          <div className="text-sm text-pearl/60">
            Celkem: {members.length}
          </div>
        </div>

        {error && (
          <div className="mb-3 p-2 rounded-lg bg-crimson/20 border border-crimson/40 text-pearl text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {members.length === 0 ? (
            <div className="text-pearl/70 text-center py-4">
              Žádní členové týmu.
            </div>
          ) : (
            members.map((member) => (
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
                    <div className="text-pearl font-medium">
                      {member.display_name || member.username}
                    </div>
                    <div className="text-pearl/60 text-sm">
                      @{member.username}
                      {member.email && ` • ${member.email}`}
                    </div>
                  </div>
                  {getRoleBadge(member.role)}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteMember(member.id, member.display_name, member.username)}
                  className="ml-3 px-3 py-1 rounded-lg bg-crimson/20 hover:bg-crimson/40 text-pearl text-sm font-medium transition-all"
                  title="Odstranit člena"
                >
                  🗑️ Odstranit
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-3 text-pearl/60 text-xs">
          <p>💡 Odstranění člena nezmaže jejich data, pouze je deaktivuje</p>
        </div>
      </div>
    </>
  )
}

export default TeamMembersWidget

