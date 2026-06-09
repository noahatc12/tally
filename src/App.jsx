import { HabitsProvider } from './context/HabitsContext.jsx'
import RootView from './components/RootView.jsx'
import CelebrationLayer from './components/CelebrationLayer.jsx'

export default function App() {
  return (
    <HabitsProvider>
      <RootView />
      <CelebrationLayer />
    </HabitsProvider>
  )
}
