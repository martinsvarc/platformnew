import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { CelebrationProvider } from './contexts/CelebrationContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ToastProvider } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import PageTransition from './components/PageTransition'
import NavMenu from './components/NavMenu'
import PaymentPopover from './components/PaymentPopover'
import NotificationContainer from './components/NotificationContainer'
import ToastContainer from './components/ToastContainer'
import ProfilePicturePrompt from './components/ProfilePicturePrompt'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminStart from './pages/AdminStart'
import BiometricVerification from './pages/BiometricVerification'
import PINVerification from './pages/PINVerification'
import PINSetup from './components/PINSetup'
import TwoFASetupPrompt from './components/TwoFASetupPrompt'
import Skore from './pages/Skore'
import { useAuth } from './contexts/AuthContext'
import TvujVykon from './pages/TvujVykon'
import Klientiaplatby from './pages/Klientiaplatby'
import Admin from './pages/Admin'
import Analyze from './pages/Analyze'
import Analytics from './pages/Analytics'
import Zalozky from './pages/Zalozky'
import StarTeam from './pages/StarTeam'
import { getBackgroundUrl } from './api/settings'
import { TEAM_ID } from './api/config'

function AppContent() {
  const location = useLocation()
  const { needs2FASetup, setNeeds2FASetup } = useAuth()
  const hideNav = location.pathname === '/skore'
  const isAuthPage = location.pathname === '/login' || 
                     location.pathname === '/register' || 
                     location.pathname === '/adminstart' || 
                     location.pathname === '/biometric-verify' || 
                     location.pathname === '/pin-verify' ||
                     location.pathname === '/setup-pin'
  const isAdminPage = location.pathname === '/admin'
  const shouldShowBackground = !hideNav && !isAuthPage && !isAdminPage

  const handle2FASetupComplete = (method) => {
    console.log('2FA setup completed with method:', method)
    setNeeds2FASetup(false)
    // Store the method for future reference
    localStorage.setItem('two_fa_method', method)
  }
  
  // Default background URL
  const DEFAULT_BG = 'https://res.cloudinary.com/dmbzcxhjn/image/upload/v1759767010/0a80caad8e77bea777fb41bf5438086e_ubbh2h.jpg'
  const [backgroundUrl, setBackgroundUrl] = useState(DEFAULT_BG)
  const [backgroundLoaded, setBackgroundLoaded] = useState(false)

  // Load background URL from settings
  useEffect(() => {
    const loadBackground = async () => {
      if (!TEAM_ID) {
        setBackgroundLoaded(true)
        return
      }
      
      try {
        const url = await getBackgroundUrl(TEAM_ID)
        // Use custom background if available, otherwise use default
        setBackgroundUrl(url || DEFAULT_BG)
      } catch (err) {
        console.error('Failed to load background:', err)
        // On error, use default background
        setBackgroundUrl(DEFAULT_BG)
      } finally {
        setBackgroundLoaded(true)
      }
    }
    
    loadBackground()
  }, [])

  // Debug logging
  console.log('Current path:', location.pathname)
  console.log('Should show background:', shouldShowBackground)
  console.log('Background URL:', backgroundUrl)

  return (
    <div 
      className={`min-h-screen ${shouldShowBackground ? 'app-background' : ''}`}
      style={shouldShowBackground && backgroundLoaded ? {
        backgroundImage: `url("${backgroundUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      } : {}}
    >
      {!hideNav && !isAuthPage && <NavMenu />}
      {!isAuthPage && <PaymentPopover />}
      {!isAuthPage && <NotificationContainer />}
      {!isAuthPage && <ProfilePicturePrompt />}
      {!isAuthPage && <TwoFASetupPrompt isOpen={needs2FASetup} onSetupComplete={handle2FASetupComplete} />}
      <ToastContainer />
      <PageTransition>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/adminstart" element={<AdminStart />} />
          
          {/* 2FA routes */}
          <Route path="/biometric-verify" element={<BiometricVerification />} />
          <Route path="/pin-verify" element={<PINVerification />} />
          <Route path="/setup-pin" element={<PINSetup onComplete={() => handle2FASetupComplete('pin')} />} />
          
          {/* Protected routes */}
          <Route path="/" element={<Navigate to="/starteam" replace />} />
          <Route path="/skore" element={
            <ProtectedRoute>
              <Skore />
            </ProtectedRoute>
          } />
          <Route path="/tvuj-vykon" element={
            <ProtectedRoute>
              <TvujVykon />
            </ProtectedRoute>
          } />
          <Route path="/klientiaplatby" element={
            <ProtectedRoute>
              <Klientiaplatby />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          } />
          <Route path="/analytics" element={
            <AdminRoute>
              <Analytics />
            </AdminRoute>
          } />
          <Route path="/analyze" element={
            <ProtectedRoute>
              <Analyze />
            </ProtectedRoute>
          } />
          <Route path="/zalozky" element={
            <ProtectedRoute>
              <Zalozky />
            </ProtectedRoute>
          } />
          <Route path="/starteam" element={
            <ProtectedRoute>
              <StarTeam />
            </ProtectedRoute>
          } />
        </Routes>
      </PageTransition>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <NotificationProvider>
          <CelebrationProvider>
            <Router>
              <AppContent />
            </Router>
          </CelebrationProvider>
        </NotificationProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
