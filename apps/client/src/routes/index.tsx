import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/useStore'
import { Landing, Lobby, Login, Room, Signup } from '../pages'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export const routes = [
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
  {
    path: '/lobby',
    element: <PrivateRoute><Lobby /></PrivateRoute>,
  },
  {
    path: '/room/:roomId',
    element: <PrivateRoute><Room /></PrivateRoute>,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]
