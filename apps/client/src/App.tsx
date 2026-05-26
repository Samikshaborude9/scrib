import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useStore'
import { Landing, Lobby, Login, Room, Signup } from './pages'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"       element={<Landing />} />
        <Route path="/login"  element={<Login  />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/lobby"  element={<PrivateRoute><Lobby /></PrivateRoute>} />
        <Route path="/room/:roomId" element={<PrivateRoute><Room /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
