import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import NavMenu from './components/NavMenu'
import Skore from './pages/Skore'
import Nove from './pages/Nove'
import TvujVykon from './pages/TvujVykon'
import Klientiaplatby from './pages/Klientiaplatby'
import Admin from './pages/Admin'
import Analyze from './pages/Analyze'

function AppContent() {
  const location = useLocation()
  const hideNav = location.pathname === '/skore'

  return (
    <div className={`min-h-screen ${hideNav ? '' : 'bg-gradient-to-br from-obsidian to-charcoal'}`}>
      {!hideNav && <NavMenu />}
      <Routes>
        <Route path="/" element={<Navigate to="/skore" replace />} />
        <Route path="/skore" element={<Skore />} />
        <Route path="/nove" element={<Nove />} />
        <Route path="/tvuj-vykon" element={<TvujVykon />} />
        <Route path="/klientiaplatby" element={<Klientiaplatby />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/analyze" element={<Analyze />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
