import { createRoot } from 'react-dom/client'
import './index.css'
// import './App.css' // App.css importunu kaldırdık/yorum yaptık
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'

// StrictMode'u tamamen kaldırarak WebSocket bağlantı sorununu kesin olarak çözüyoruz.
createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <AppProvider>
      <App />
    </AppProvider>
  </AuthProvider>
)
