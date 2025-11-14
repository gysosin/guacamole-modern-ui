import './App.css'
import { AppLayout } from '@components/layout/AppLayout'
import { AppRoutes } from '@routes/AppRoutes'

function App() {
  return (
    <AppLayout>
      <AppRoutes />
    </AppLayout>
  )
}

export default App
