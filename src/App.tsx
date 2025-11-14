import './App.css'
import { useLocation } from 'react-router-dom'
import { AppLayout } from '@components/layout/AppLayout'
import { AppRoutes } from '@routes/AppRoutes'

function App() {
  const location = useLocation()
  const isAuthRoute = location.pathname.startsWith('/auth')
  const routes = <AppRoutes />

  if (isAuthRoute) {
    return routes
  }

  return <AppLayout>{routes}</AppLayout>
}

export default App
