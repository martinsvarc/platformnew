import { Link, useLocation } from 'react-router-dom'

function NavMenu() {
  const location = useLocation()

  const navItems = [
    { path: '/skore', label: 'Skóre', icon: '📊' },
    { path: '/nove', label: 'Nové', icon: '➕' },
    { path: '/tvuj-vykon', label: 'Tvůj Výkon', icon: '📈' },
    { path: '/klientiaplatby', label: 'Klienti a Platby', icon: '🗂️' },
    { path: '/admin', label: 'Admin', icon: '🛠️' }
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="fixed left-0 top-0 w-64 h-full bg-gradient-to-b from-charcoal to-velvet-gray border-r border-neon-orchid/20 z-50 flex flex-col">
      {/* User Profile */}
      <div className="p-6 border-b border-neon-orchid/20">
        <div className="flex flex-col items-center space-y-3">
          <img
            src="https://via.placeholder.com/50"
            alt="Profil"
            className="w-16 h-16 rounded-full object-cover border border-neon-orchid/40 shadow-glow"
          />
          <div className="text-center">
            <h3 className="text-pearl font-semibold text-lg">Jan Novák</h3>
            <p className="text-pearl/70 text-sm">Administrátor</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 ${
              isActive(item.path)
                ? 'bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple'
                : 'text-pearl hover:bg-velvet-gray hover:shadow-glow hover:text-neon-orchid'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-semibold">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-neon-orchid/20">
        <div className="text-center text-pearl/50 text-xs">
          <p>© 2024 Platform</p>
        </div>
      </div>
    </div>
  )
}

export default NavMenu
